"use strict";

const admin = require("firebase-admin");
const functions = require("firebase-functions"); // v1 API (compatible)
const sgMail = require("@sendgrid/mail");

admin.initializeApp();
const db = admin.firestore();

// Lee config desde env (GitHub Actions secrets) o desde functions:config
const SENDGRID_API_KEY =
  process.env.SENDGRID_API_KEY || (functions.config().sendgrid && functions.config().sendgrid.key);
const SENDGRID_FROM =
  process.env.SENDGRID_FROM || (functions.config().sendgrid && functions.config().sendgrid.from);
const NOTIFY_TO_EMAIL =
  process.env.NOTIFY_TO_EMAIL || (functions.config().notify && functions.config().notify.to);

// (Opcional) enfriamiento simple para no spamear si hay registros en ráfaga
const COOLDOWN_MS = 60 * 1000;

function assertConfig() {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM || !NOTIFY_TO_EMAIL) {
    throw new Error(
      "Faltan variables de SendGrid. Revisa SENDGRID_API_KEY, SENDGRID_FROM, NOTIFY_TO_EMAIL (env o functions:config)."
    );
  }
}

async function canSendNow() {
  const ref = db.doc("meta/notifyThrottle");
  const snap = await ref.get();
  const data = snap.exists ? snap.data() : {};
  const lastSentAt = data?.lastSentAt?.toMillis ? data.lastSentAt.toMillis() : 0;
  const now = Date.now();

  if (now - lastSentAt < COOLDOWN_MS) return { ok: false, ref, now };
  return { ok: true, ref, now };
}

async function markSent(ref) {
  await ref.set({ lastSentAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
}

function buildEmail({ uid, email }) {
  const subject = "Nuevo registro (Finanzas PWA SaaS)";
  const text = `Nuevo registro (Finanzas PWA SaaS)\nUID: ${uid}\nEmail: ${email || "N/A"}`;
  const html = `
    <h2>Nuevo registro (Finanzas PWA SaaS)</h2>
    <ul>
      <li><strong>UID:</strong> ${uid}</li>
      <li><strong>Email:</strong> ${email || "N/A"}</li>
    </ul>
  `;
  return { subject, text, html };
}

// ✅ Trigger v1: Auth user create
exports.onAuthUserCreate = functions.auth.user().onCreate(async (user) => {
  const uid = user?.uid;
  const email = user?.email || null;

  if (!uid) return;

  const leadRef = db.doc(`leads/${uid}`);

  // Evitar duplicado si ya existe
  const leadSnap = await leadRef.get();
  if (leadSnap.exists) {
    return;
  }

  // Guardar lead primero (para tener rastro aunque falle el email)
  await leadRef.set(
    {
      uid,
      email,
      source: "auth_onCreate",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      notifyStatus: "pending",
    },
    { merge: true }
  );

  try {
    assertConfig();
    sgMail.setApiKey(SENDGRID_API_KEY);

    const { ok, ref } = await canSendNow();
    if (!ok) {
      await leadRef.set({ notifyStatus: "skipped_rate_limit" }, { merge: true });
      return;
    }

    const { subject, text, html } = buildEmail({ uid, email });

    await sgMail.send({
      to: NOTIFY_TO_EMAIL,
      from: SENDGRID_FROM,
      subject,
      text,
      html,
    });

    await markSent(ref);

    await leadRef.set(
      {
        notifyStatus: "sent",
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    const msg = (err && err.message) ? err.message.slice(0, 200) : "Error desconocido";
    console.error("Notify signup failed:", err);

    await leadRef.set(
      {
        notifyStatus: "failed",
        errorMessage: msg,
      },
      { merge: true }
    );
  }
});
