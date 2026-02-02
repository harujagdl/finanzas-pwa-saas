# Piloto PWA SaaS

Esta fase deja la app lista para **Auth + Wizard** en la siguiente iteración.

## Firebase
La app se inicializa **exclusivamente** desde `config/firebase-config.js`. Este archivo importa el SDK modular de Firebase y expone la app en `window.firebaseApp` para el resto del código.

Para cambiar de proyecto Firebase, **solo** edita `config/firebase-config.js` con las credenciales del nuevo proyecto. No hay inicialización adicional en `index.html` ni en otros módulos.

> Nota: No mezcles proyectos Firebase por producto. Cada producto debe apuntar a un único proyecto Firebase para evitar datos cruzados, usuarios mezclados o configuraciones inconsistentes.

### Google Sign-In (dominios autorizados)
Para usar "Continuar con Google" debes registrar los dominios autorizados en Firebase Authentication:
- `localhost`
- `*.vercel.app`
- tu dominio final en producción

## Cómo habilitar features más adelante
La PWA usa flags en `index.html` para activar módulos legacy cuando estén listos:
- `FEATURES` controla módulos como tarjetas, metas, alertas, resúmenes, gráficas, etc.
- `DEV_FEATURES.demoSeed` permite cargar datos demo manualmente (no auto-seeding).

Activa el módulo que necesites cambiando los flags a `true` y vuelve a recargar la app.

## Ejemplo
Usa `config/firebase-config.example.js` como plantilla para nuevos proyectos y reemplaza los valores `REPLACE_ME`.
