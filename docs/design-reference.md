# Design Reference — Yayos

Este proyecto utiliza como base visual el sistema de Finanzas Yayos.

Ubicación:
- /styles/yayos/styles/

Archivos clave:
- yayos-tokens.css → variables globales (colores, sombras, radios)
- yayos-theme.css → layout base
- yayos-components.css → componentes UI

Reglas:
- No reinventar estilos si ya existen en Yayos
- Mantener estilo premium tipo iOS
- Usar cards suaves con sombras ligeras
- Mantener consistencia en badges y semáforos
- Mantener jerarquía visual clara

Este design kit es la fuente de verdad del diseño.


## Regla de mantenimiento

La carpeta `/styles/yayos/` es **read-only**. No debe modificarse, renombrarse ni sobrescribirse durante la migración SaaS.

Fuente visual real en `/styles/yayos/styles/`:
- `yayos-tokens.css`
- `yayos-theme.css`
- `yayos-components.css`
- `yayos-saas-bridge.css`
