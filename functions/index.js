"use strict";

const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { logger } = functions;
const { onUserCreated } = require("firebase-functions/v2/auth");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();
const db = admin.firestore();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || functions.config()?.sendgrid?.key;
const SENDGRID_FROM = process.env.SENDGRID_FROM || functions.config()?.sendgrid?.from;
const NOTIFY_TO_EMAIL = process.env.NOTIFY_TO_EMAIL || functions.config()?.notify?.to;

const COOLDOWN_MS = 60 * 1000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_WINDOW_COUNT = 25;
const CONSOLE_URL = "https://console.firebase.google.com/project/finanzas-pwa-saas-pilot/authentication/users";

function getProviderIds(providerData = []) {
  return providerData.map((provider) => provider?.providerId).filter(Boolean);
}

function buildLeadPayload({ user, providerIds, createdAt, notifyStatus, notifiedAt, errorMessage }) {
  const payload = {
    uid: user.uid,
    email: user.email || null,
    providerIds,
    createdAt: createdAt || admin.firestore.FieldValue.serverTimestamp(),
    source: "auth_onCreate",
    notifiedAt: notifiedAt || null,
    notifyStatus
  };

  if (errorMessage) {
    payload.errorMessage = errorMessage;
  }

  return payload;
}

function buildEmailBody({ user }) {
  const lines = [
    "Nuevo registro (Finanzas PWA SaaS)",
    `UID: ${user.uid}`,
    `Email: ${user.email || "N/A"}`
  ];

  const html = `
    <h2>Nuevo registro (Finanzas PWA SaaS)</h2>
    <ul>
      <li><strong>UID:</strong> ${user.uid}</li>
      <li><strong>Email:</strong> ${user.email || "N/A"}</li>
    </ul>
  `;

  return { text: lines.join("\n"), html };
}

function getSendgridConfig() {
  return {
    apiKey: SENDGRID_API_KEY,
    from: SENDGRID_FROM,
    to: NOTIFY_TO_EMAIL
  };
}

function assertSendgridConfig({ apiKey, from, to }) {
  if (!apiKey || !from || !to) {
    throw new Error("SendGrid config missing");
  }
}

async function sendNotificationEmail({ user, providerIds }) {
  const config = getSendgridConfig();
  assertSendgridConfig(config);
  sgMail.setApiKey(config.apiKey);

  const { text, html } = buildEmailBody({ user });

  await sgMail.send({
    to: config.to,
    from: config.from,
    subject: "Nuevo registro (Finanzas PWA SaaS)",
    text,
    html
  });
}

function toShortError(err) {
  const message = err?.message || "Error desconocido";
  return message.length > 180 ? `${message.slice(0, 177)}...` : message;
}

exports.onAuthUserCreate = onUserCreated(async (event) => {
  const user = event.data;
  if (!user?.uid) {
    logger.warn("onAuthUserCreate: missing user data.");
    return;
  }

  const leadRef = db.doc(`leads/${user.uid}`);
  const throttleRef = db.doc("meta/notifyThrottle");
  const providerIds = getProviderIds(user.providerData || []);
  const now = admin.firestore.Timestamp.now();

  try {
    const leadSnap = await leadRef.get();
    if (leadSnap.exists) {
      const existing = leadSnap.data() || {};
      await leadRef.set(
        buildLeadPayload({
          user,
          providerIds,
          createdAt: existing.createdAt,
          notifyStatus: existing.notifyStatus || "skipped_duplicate",
          notifiedAt: existing.notifiedAt || null,
          errorMessage: existing.errorMessage
        }),
        { merge: true }
      );
      return;
    }

    const throttleSnap = await throttleRef.get();
    const throttleData = throttleSnap.exists ? throttleSnap.data() : {};
    let windowStartAt = throttleData?.windowStartAt || now;
    let windowCount = Number.isFinite(throttleData?.windowCount) ? throttleData.windowCount : 0;
    const lastSentAt = throttleData?.lastSentAt || null;

    if (now.toMillis() - windowStartAt.toMillis() > WINDOW_MS) {
      windowStartAt = now;
      windowCount = 0;
    }

    const withinCooldown = lastSentAt && now.toMillis() - lastSentAt.toMillis() < COOLDOWN_MS;
    const overWindowLimit = windowCount >= MAX_WINDOW_COUNT;
    const shouldSend = !withinCooldown && !overWindowLimit;

    let notifyStatus = shouldSend ? "sent" : "skipped_rate_limit";
    let notifiedAt = null;
    let errorMessage = null;

    if (shouldSend) {
      try {
        await sendNotificationEmail({ user, providerIds });
        notifiedAt = now;
        windowCount += 1;
      } catch (err) {
        notifyStatus = "failed";
        errorMessage = toShortError(err);
      }
    }

    await leadRef.set(
      buildLeadPayload({
        user,
        providerIds,
        notifyStatus,
        notifiedAt,
        errorMessage
      }),
      { merge: true }
    );

    const throttleUpdate = {
      windowStartAt,
      windowCount
    };
    if (lastSentAt) {
      throttleUpdate.lastSentAt = lastSentAt;
    }
    if (notifyStatus === "sent" && notifiedAt) {
      throttleUpdate.lastSentAt = notifiedAt;
    }

    await throttleRef.set(throttleUpdate, { merge: true });
  } catch (err) {
    logger.error("onAuthUserCreate failed", err);
    try {
      await leadRef.set(
        buildLeadPayload({
          user,
          providerIds,
          notifyStatus: "failed",
          notifiedAt: null,
          errorMessage: toShortError(err)
        }),
        { merge: true }
      );
    } catch (writeErr) {
      logger.error("onAuthUserCreate lead write failed", writeErr);
    }
  }
});
