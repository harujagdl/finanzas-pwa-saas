"use strict";

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

admin.initializeApp();

// Lee config: sendgrid.key, sendgrid.from, notify.to
function getConfig() {
  const cfg = functions.config() || {};
  const sendgridKey = cfg.sendgrid && cfg.sendgrid.key;
  const sendgridFrom = cfg.sendgrid && cfg.sendgrid.from;
  const notifyTo = cfg.notify && cfg.notify.to;

  return { sendgridKey, sendgridFrom, notifyTo };
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
