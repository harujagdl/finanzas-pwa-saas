const { onUserCreated } = require("firebase-functions/v2/identity");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

// Inicializar Firebase Admin
admin.initializeApp();

// Configuración SendGrid desde Firebase config
const SENDGRID_KEY = process.env.SENDGRID_API_KEY || "";
const SENDGRID_FROM = process.env.SENDGRID_FROM || "";
const NOTIFY_TO = process.env.NOTIFY_TO_EMAIL || "";

if (SENDGRID_KEY) {
  sgMail.setApiKey(SENDGRID_KEY);
}

/**
 * 🔔 Notificación cuando un usuario se registra
 * Solo envía email + UID (como pediste)
 */
exports.notifyUserSignup = onUserCreated(async (event) => {
  const user = event.data;

  if (!user || !SENDGRID_KEY || !SENDGRID_FROM || !NOTIFY_TO) {
    console.log("Configuración incompleta, no se envía correo");
    return;
  }

  const msg = {
    to: NOTIFY_TO,
    from: SENDGRID_FROM,
    subject: "Nuevo registro en Finanzas PWA",
    text: `Nuevo usuario registrado:

UID: ${user.uid}
Email: ${user.email || "No proporcionado"}
`,
  };

  try {
    await sgMail.send(msg);
    console.log("Correo de notificación enviado");
  } catch (error) {
    console.error("Error enviando correo:", error);
  }
});
