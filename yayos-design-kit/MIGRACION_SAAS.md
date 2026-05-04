# Migración visual Yayos → SaaS Finanzas

## Archivos base detectados en Yayos

- `styles/ios-theme.css`: tema claro/oscuro, tokens principales y aliases legacy.
- `styles/ios-tokens.css`: tokens base originales.
- `styles/ios-components.css`: componentes reutilizables: cards, inputs, botones, topbar, bottom nav, listas, sheets.
- `index.html`: contiene estilos adicionales importantes para KPIs, skeletons, dashboard, MSI, semáforos y layout responsive.

## Orden recomendado de importación

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap" rel="stylesheet" />
<link href="./styles/yayos-theme.css" rel="stylesheet" />
<link href="./styles/yayos-tokens.css" rel="stylesheet" />
<link href="./styles/yayos-components.css" rel="stylesheet" />
<link href="./styles/yayos-saas-bridge.css" rel="stylesheet" />
```

## Clases clave a reutilizar

- Layout: `app-shell`, `app-main`, `topbar`, `bottomNav`, `nav-bottom`, `navItem`, `nav-btn`.
- Cards: `card`, `card-box`, `dash-card`, `summary-kpi`, `summary-card-item`.
- KPIs: `kpi-label`, `kpi-value`, `summary-kpi-label`, `summary-kpi-value`.
- Estados: `badge-status`, `bg-success-light`, `bg-warning-light`, `bg-danger-light`, `net-badge`, `sync-pill`, `msi-status-pill`.
- Formularios: `form-control`, `form-select`, `field`, `btnPrimary`, `btnGhost`.
- Loading: `skeleton`, `skeleton-line`, `skeleton-card`, `chart-skeleton`.

## Semáforo recomendado para MSI / salud financiera

- Verde: sano / pagable / bajo riesgo.
- Amarillo: cuidado / presión próxima.
- Rojo: crítico / sobregiro / pago próximo pesado.

Usar estas clases:

```html
<span class="msi-status-pill status-ok">Sano</span>
<span class="msi-status-pill status-warn">Cuidado</span>
<span class="msi-status-pill status-danger">Crítico</span>
```

## Primer bloque a migrar

1. Copiar `/styles` del kit al SaaS.
2. Importar los CSS en el `index.html` del SaaS.
3. Envolver la app con `.app-shell` y `.app-main`.
4. Convertir cada bloque visual grande a `.card-box card`.
5. Convertir métricas a `.kpi-label` + `.kpi-value`.
6. Aplicar `msi-status-pill` a MSI y estados financieros.
