# PocketFlow Pro paywall

## Objetivo

La experiencia Pro valida ventas manuales antes de implementar Stripe. No procesa pagos dentro de la app y mantiene separada la administración de planes/códigos del paywall comercial.

## Modal Premium

`showProComingSoon(featureKey)` abre el modal `modalPro`, una pantalla comercial con:

- Título: **PocketFlow Pro**.
- Subtítulo: **Más control, más claridad y menos sorpresas.**
- Badge: **Próximamente / Acceso anticipado**.
- Precio visible: **$49 MXN / mes** o **$399 MXN / año**.
- Beneficios: CSV, reportes avanzados, alertas inteligentes, metas ilimitadas, más cuentas y modo pareja.

## Activación manual

El CTA principal **Quiero activar Pro** muestra el mensaje:

> Para activar PocketFlow Pro, envíanos mensaje y te compartimos tu código de activación.

También abre WhatsApp con el enlace placeholder:

```text
https://wa.me/52TU_NUMERO?text=Hola%2C%20quiero%20activar%20PocketFlow%20Pro
```

`TU_NUMERO` queda como placeholder hasta definir el número comercial.

## Redención de código

El CTA secundario **Tengo un código** abre `modalRedeemCode`, que incluye input de código, botón **Aplicar código** y botón **Cancelar**.

Por ahora, si no existe una función global `redeemPromoCode`, el modal muestra:

> Redención automática próximamente. Envíanos tu código para activarlo manualmente.

Si en el futuro se expone `window.redeemPromoCode(code)`, el botón **Aplicar código** la llamará automáticamente.

## Ubicaciones visibles

- Landing: botón **Obtener Pro** en el hero y en la tarjeta de plan Pro.
- Ajustes: botón **Obtener Pro** en el encabezado y banner comercial.
- Historial: cuando CSV está bloqueado aparece **Descargar CSV (Pro) 🔒**, **Disponible en PocketFlow Pro** y **Activa Pro para desbloquear reportes, CSV y alertas.**

## Alcance admin

El Admin Center no mezcla paywall comercial. Solo mantiene la gestión operativa de planes, códigos promocionales, workspaces y logs.
