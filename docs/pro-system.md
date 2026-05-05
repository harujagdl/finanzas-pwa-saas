# Sistema Pro de PocketFlow

Este documento describe la primera versión del sistema de membresías **Free / Pro / Couple**. No incluye pagos: los planes se administran manualmente desde Admin Center o con códigos promo redimidos desde frontend (v1) con reglas de Firestore.

## Modelo de datos

### `workspaces/{workspaceId}`

El workspace es la fuente principal para resolver el plan activo:

```js
{
  name: "Mi PocketFlow",
  ownerUid: "uid",
  memberUids: ["uid"],
  plan: "free" | "pro" | "couple",
  status: "active" | "expired" | "canceled",
  planExpiresAt: Timestamp | null,
  maxMembers: 1 | 2,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### `users/{uid}`

Se conserva la estructura actual de datos en `users/{uid}/...`. Para planes solo se agregan campos de workspace:

```js
{
  email,
  displayName,
  activeWorkspaceId,
  workspaceIds: []
}
```

Los movimientos, categorías, cuentas y ajustes siguen viviendo en `users/{uid}/...`; esta fase no migra la lógica financiera a workspaces.

## Resolución de plan

El frontend resuelve el plan en este orden:

1. `workspaces/{activeWorkspaceId}` si existe.
2. Fallback legacy `users/{uid}.plan`.
3. `free`.

Si un plan tiene `planExpiresAt` vencido, el cliente lo normaliza a `free` y marca el workspace como `expired` cuando las reglas lo permiten.

## Features por plan

| Feature | Free | Pro | Couple |
| --- | --- | --- | --- |
| Exportación CSV | No | Sí | Sí |
| Reportes avanzados | No | Sí | Sí |
| Alertas inteligentes | No | Sí | Sí |
| Metas ilimitadas | No | Sí | Sí |
| Acceso pareja | No | No | Sí |
| Máximo de miembros | 1 | 1 | 2 |

## Redención de códigos promo

La redención automática usa `redeemPromoCode(code)` en el frontend.

Flujo resumido:

1. Requiere usuario autenticado y `activeWorkspaceId`.
2. Normaliza el código a uppercase.
3. Valida `promoCodes/{code}`: existe, `status === "active"`, no expiró y no rebasó `maxRedemptions`.
4. Evita doble redención revisando `promoCodes/{code}/redemptions/{uid}`.
5. Calcula `planExpiresAt` con `planDays` o `expiresAt`.
6. Actualiza el workspace activo con `plan`, `status`, `planExpiresAt`, `maxMembers`, `updatedByPromoCode`.
7. Incrementa `redeemedCount` y guarda `lastRedeemedAt`.
8. Crea `promoCodes/{code}/redemptions/{uid}` y registro en `adminLogs` con `promo_code_redeemed`.
9. Recarga plan/UI con `loadActiveWorkspaceAndPlan()`.
10. Si Firestore Rules bloquea la actualización, se muestra: “No pudimos aplicar el código automáticamente. Envíanos tu código para activarlo manualmente.”

## Admin Center

Admin Center permite:

- Buscar usuarios por email.
- Cargar workspaces por ID o por usuario.
- Ver plan, estado, expiración y máximo de miembros.
- Activar Pro 30 días.
- Activar Couple 30 días.
- Quitar Pro / volver a Free.
- Crear códigos promo con plan, duración, usos máximos y expiración.
- Consultar códigos recientes y redenciones usadas.

## Seguridad Firestore

- Los miembros pueden leer su workspace.
- Los usuarios pueden crear su workspace Free por defecto.
- Los miembros pueden actualizar solo campos controlados del plan durante redención (`plan`, `status`, `planExpiresAt`, `maxMembers`, `updatedAt`, `updatedByPromoCode`).
- Los administradores conservan permisos para administrar planes y promos manualmente.
