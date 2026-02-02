# Piloto PWA SaaS

## Firebase
La app se inicializa **exclusivamente** desde `config/firebase-config.js`. Este archivo importa el SDK modular de Firebase y expone la app en `window.firebaseApp` para el resto del código.

Para cambiar de proyecto Firebase, **solo** edita `config/firebase-config.js` con las credenciales del nuevo proyecto. No hay inicialización adicional en `index.html` ni en otros módulos.

> Nota: No mezcles proyectos Firebase por producto. Cada producto debe apuntar a un único proyecto Firebase para evitar datos cruzados, usuarios mezclados o configuraciones inconsistentes.

## Ejemplo
Usa `config/firebase-config.example.js` como plantilla para nuevos proyectos y reemplaza los valores `REPLACE_ME`.
