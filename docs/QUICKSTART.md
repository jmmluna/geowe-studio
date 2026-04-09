# 🚀 Guía de Inicio Rápido - GeoWE Studio

Bienvenido a la guía paso a paso para crear tu primera extensión en GeoWE Studio. En menos de 5 minutos tendrás un plugin funcional en ejecución.

---

## Paso 1: Preparar el Entorno
Asegúrate de tener instalado **Node.js** (v18+ recomendado).

1.  **Clona el repositorio**:
    ```bash
    git clone https://github.com/jmmluna/geowe-studio.git
    cd geowe-studio
    ```
2.  **Instala y arranca**:
    ```bash
    npm install
    npm run dev
    ```
    Abre `http://localhost:4200` en tu navegador. ¡Ya tienes el Studio funcionando!

---

## Paso 2: Crear tu Primer Plugin
Crea una carpeta llamada `plugins/mi-herramienta` y añade dos archivos:

### 1. `manifest.json`
Define la identidad de tu plugin.
```json
{
  "id": "mi-hola-mundo",
  "name": "Mi Primer Plugin",
  "version": "1.0.0",
  "main": "index.js",
  "icon": "mood"
}
```

### 2. `index.js` (VanillaJS)
Añade la lógica básica para interactuar con GeoWE.
```javascript
export default {
  id: 'mi-hola-mundo',
  
  activate: (context) => {
    // Registramos la acción
    context.commands.register('say.hello', () => {
      context.ui.setStatus('¡GeoWE dice Hola Mundo!');
    });

    // Añadimos el botón a la barra de herramientas
    context.ui.addButton({
      id: 'btn-hello',
      label: 'Saludar',
      icon: 'mood',
      commandId: 'say.hello'
    });
  }
};
```

---

## Paso 3: Probar en Vivo (Drag & Drop)
¡No necesitas recompilar el núcleo!
1.  Abre el Studio en el navegador.
2.  Arrastra el archivo `index.js` directamente sobre el mapa.
3.  **¡Listo!** Verás aparecer un nuevo icono de una cara sonriente en la barra lateral. Púlsalo y observa el mensaje en la parte inferior.

---

## Paso 4: Empaquetar para Distribuir
Cuando tu herramienta esté lista, empaquétala para compartirla:

```bash
npm run forge:pack plugins/mi-herramienta
```
Esto generará un archivo `mi-hola-mundo_v1.0.0.gplugin`. Este archivo es el que se puede subir a un servidor o compartir con otros usuarios de GeoWE.

---

## 💡 Próximos Pasos
*   Consulta la **[Guía de Desarrollo Detallada](DEVELOPMENT.md)** para aprender a añadir paneles, modales y gestionar capas SIG.
*   Explora la **[Arquitectura](ARCHITECTURE.md)** para entender el sistema de sandboxing y carga ESM.

¡Feliz mapeo con GeoWE Studio! 🌍✨
