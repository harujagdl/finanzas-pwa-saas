# SaaS Design System

## Tokens SaaS
La capa SaaS importa tokens reales desde `styles/yayos/styles/` y expone aliases en `styles/saas/tokens.css`.

## Cards
Usar `.saas-card` para contenedores y `.saas-card-header` con:
- `.saas-card-eyebrow`
- `.saas-card-title`
- `.saas-card-subtitle`

## Badges
Usar `.saas-badge` + estado:
- `.success` (Sano / Liquidada)
- `.warning` (Atención)
- `.danger` (Riesgo)
- `.neutral` (Estable / Activa / Sin datos)

## MSI cards
Estructura recomendada:
- `.saas-msi-list`
- `.saas-msi-card`
- `.saas-msi-card-header`
- `.saas-msi-title`, `.saas-msi-meta`
- `.saas-msi-row`, `.saas-msi-progress`, `.saas-msi-progress-bar`

## KPI cards
Para resúmenes numéricos utilizar:
- `.saas-kpi-grid`
- `.saas-kpi-card`
- `.saas-kpi-label`
- `.saas-kpi-value`
- `.saas-kpi-meta`

## Estructura recomendada para nuevas vistas
1. Card principal con `.saas-card`.
2. Header estándar con eyebrow + title + subtitle.
3. Métricas con grid auto (`.saas-grid-auto` / `.saas-kpi-grid`).
4. Estados visuales con `.saas-badge` y labels humanas.
5. Espaciado vertical con utilidades (`.saas-stack-sm|md|lg`).
