# Piloto SaaS PWA (finanzas-pwa-saas)

## Objetivo
Este piloto es una PWA vanilla (sin build/bundlers) con Firebase (Firestore + Auth) y deploy en Vercel. Está pensado para 5–10 personas.

---

## 1) Configurar Firebase (Firestore + Auth)

1. Entra a **Firebase Console** y crea el proyecto:
   - **ProjectId**: `finanzas-pwa-saas-pilot`
2. Habilita **Firestore** (modo producción recomendado).
3. Habilita **Authentication → Email/Password**.
4. En **Project settings → General → Your apps → Web app**:
   - Registra una app web.
   - Copia la **configuración web** (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).

---

## 2) Configuración web pública (pilot-friendly)

1. Copia el archivo de ejemplo:
   - `config/firebase-config.example.js` → `config/firebase-config.js`
2. Pega los valores reales del proyecto en:
   - `config/firebase-config.js`

> ⚠️ Este archivo se versiona **solo para el piloto**. No incluir secretos (serviceAccount, llaves privadas, JSON admin, etc.).

---

## 3) Reglas de Firestore (OBLIGATORIO)

1. Abre **Firestore → Rules** en Firebase Console.
2. Pega el contenido de `firestore.rules`.
3. Publica las reglas.

> ✅ **Recordatorio:** no dejes reglas abiertas (`allow read, write: if true`).

---

## 4) Deploy en Vercel (sin terminal)

1. En Vercel → **Add New Project**.
2. Importa el repo **harujagdl/finanzas-pwa-saas**.
3. Elige la rama **pilot-saas**.
4. Deploy.

> La app debe quedar en `https://*.vercel.app`.

---

## 5) Actualización PWA (cache)

Cada deploy requiere incrementar `CACHE_VERSION` en `sw.js`:

```js
const CACHE_VERSION = "pilot-2";
```

Así te aseguras de que la PWA no se quede "atorada" en una versión vieja.

---

## Checklist de pruebas manuales

- [ ] Crear cuenta y entrar
- [ ] Logout/login
- [ ] Crear 1 gasto y verlo en lista
- [ ] Ver que otro usuario no ve mis datos
- [ ] Llegar a 30 gastos y validar bloqueo del 31
- [ ] Crear 1 meta y bloquear la segunda en free
- [ ] Activar trial (admin) y validar que ya no limita
- [ ] Instalar PWA en Android/iOS y validar actualización con CACHE_VERSION

---

## Flujo trial (piloto)

- Activa el **modo admin** tocando 5 veces el texto “¿Eres admin?” en el banner del plan.
- Con modo admin activo aparece el botón **“Activar trial 90 días”**.

---

## Estructura Firebase (referencia)

- `users/{uid}`
  - createdAt
  - email
  - status
  - plan
  - role
  - tenantId
  - paidUntil
- `tenants/{tenantId}`
- `tenants/{tenantId}/expenses/{expenseId}`
- `tenants/{tenantId}/goals/{goalId}`

