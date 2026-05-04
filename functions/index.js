"use strict";

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

const db = admin.firestore();
const VALID_PROMO_PLANS = ["pro", "couple"];

// Lee config: sendgrid.key, sendgrid.from, notify.to
function getConfig() {
  const cfg = functions.config() || {};
  const sendgridKey = cfg.sendgrid && cfg.sendgrid.key;
  const sendgridFrom = cfg.sendgrid && cfg.sendgrid.from;
  const notifyTo = cfg.notify && cfg.notify.to;

  return { sendgridKey, sendgridFrom, notifyTo };
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isExpired(value) {
  const date = toDate(value);
  return Boolean(date && date.getTime() < Date.now());
}

function serializeTimestamp(timestamp) {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === "function") return timestamp.toDate().toISOString();
  if (timestamp instanceof Date) return timestamp.toISOString();
  return timestamp;
}

exports.notifyNewUser = functions.auth.user().onCreate(async (user) => {
  const { sendgridKey, sendgridFrom, notifyTo } = getConfig();

  // Si falta config, no rompas el deploy: solo log
  if (!sendgridKey || !sendgridFrom || !notifyTo) {
    console.warn("Missing functions config. Need: sendgrid.key, sendgrid.from, notify.to");
    return null;
  }

  sgMail.setApiKey(sendgridKey);

  const email = user.email || "(sin email)";
  const uid = user.uid;

  const msg = {
    to: notifyTo,
    from: sendgridFrom,
    subject: "Nuevo registro en Finanzas PWA",
    text: `Nuevo usuario registrado:\n\nEmail: ${email}\nUID: ${uid}\n`,
  };

  try {
    await sgMail.send(msg);
    console.log("Signup notification sent:", { uid, email });
  } catch (err) {
    console.error("SendGrid error sending signup notification:", err?.response?.body || err);
  }

  return null;
});

exports.redeemPromoCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Inicia sesión para redimir tu código.");
  }

  const uid = context.auth.uid;
  const email = context.auth.token.email || "";
  const code = String(data && data.code ? data.code : "").trim().toUpperCase().replace(/\s+/g, "-");

  if (!code) {
    throw new functions.https.HttpsError("invalid-argument", "Escribe un código promo.");
  }

  const promoRef = db.collection("promoCodes").doc(code);
  const userRef = db.collection("users").doc(uid);
  const redemptionRef = promoRef.collection("redemptions").doc(uid);
  const adminLogRef = db.collection("adminLogs").doc();

  return db.runTransaction(async (transaction) => {
    const [promoSnap, userSnap, redemptionSnap] = await Promise.all([
      transaction.get(promoRef),
      transaction.get(userRef),
      transaction.get(redemptionRef),
    ]);

    if (!promoSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Código promo no encontrado.");
    }

    if (redemptionSnap.exists) {
      throw new functions.https.HttpsError("already-exists", "Este usuario ya redimió el código.");
    }

    const promo = promoSnap.data() || {};
    const promoPlan = String(promo.plan || "").toLowerCase();
    const redeemedCount = Number(promo.redeemedCount || 0);
    const maxRedemptions = Number(promo.maxRedemptions || 1);

    if (promo.status !== "active") {
      throw new functions.https.HttpsError("failed-precondition", "El código no está activo.");
    }

    if (!VALID_PROMO_PLANS.includes(promoPlan)) {
      throw new functions.https.HttpsError("failed-precondition", "El código no tiene un plan válido.");
    }

    if (isExpired(promo.expiresAt)) {
      throw new functions.https.HttpsError("failed-precondition", "El código ya expiró.");
    }

    if (redeemedCount >= maxRedemptions) {
      throw new functions.https.HttpsError("resource-exhausted", "El código ya alcanzó su límite de usos.");
    }

    const userData = userSnap.exists ? userSnap.data() : {};
    let workspaceId = userData.activeWorkspaceId;
    let workspaceRef;
    let newWorkspacePayload = null;

    if (!workspaceId) {
      workspaceRef = db.collection("workspaces").doc();
      workspaceId = workspaceRef.id;
      const workspaceName = (context.auth.token.name || userData.displayName || email || "Mi PocketFlow");
      newWorkspacePayload = {
        name: workspaceName,
        ownerUid: uid,
        memberUids: [uid],
        plan: "free",
        status: "active",
        planExpiresAt: null,
        maxMembers: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      const workspaceIds = Array.isArray(userData.workspaceIds)
        ? Array.from(new Set([...userData.workspaceIds, workspaceId]))
        : [workspaceId];
      transaction.set(userRef, {
        activeWorkspaceId: workspaceId,
        workspaceIds,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } else {
      workspaceRef = db.collection("workspaces").doc(workspaceId);
      const workspaceSnap = await transaction.get(workspaceRef);
      if (!workspaceSnap.exists) {
        throw new functions.https.HttpsError("failed-precondition", "El workspace activo no existe.");
      }

      const workspace = workspaceSnap.data() || {};
      if (!Array.isArray(workspace.memberUids) || !workspace.memberUids.includes(uid)) {
        throw new functions.https.HttpsError("permission-denied", "No perteneces al workspace activo.");
      }
    }

    let planExpiresAt = null;
    if (promo.planDays) {
      const expires = new Date();
      expires.setDate(expires.getDate() + Number(promo.planDays));
      planExpiresAt = admin.firestore.Timestamp.fromDate(expires);
    } else if (promo.expiresAt) {
      planExpiresAt = promo.expiresAt;
    }

    const workspacePatch = {
      plan: promoPlan,
      status: "active",
      planExpiresAt,
      maxMembers: promoPlan === "couple" ? 2 : 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedByPromoCode: code,
    };

    if (newWorkspacePayload) {
      transaction.set(workspaceRef, { ...newWorkspacePayload, ...workspacePatch });
    } else {
      transaction.update(workspaceRef, workspacePatch);
    }
    transaction.update(promoRef, {
      redeemedCount: admin.firestore.FieldValue.increment(1),
      lastRedeemedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    transaction.set(redemptionRef, {
      uid,
      email,
      workspaceId,
      redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
      plan: promoPlan,
      planExpiresAt,
    });
    transaction.set(adminLogRef, {
      action: "promo_code_redeemed",
      targetType: "promoCode",
      targetId: code,
      uid,
      email,
      workspaceId,
      plan: promoPlan,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ok: true,
      plan: promoPlan,
      planExpiresAt: serializeTimestamp(planExpiresAt),
    };
  });
});
