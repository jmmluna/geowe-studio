# 🚀 Guía de Inicio Rápido - GeoWE Studio

Bienvenido a la guía paso a paso para crear tu primera extensión en GeoWE Studio. En menos de 5 minutos tendrás un plugin funcional en ejecución.

---

## Paso 1: Inicialización ultra-rápida
Puedes inicializar un entorno de desarrollo completo con un solo comando:

1.  **Crea y entra en tu carpeta**:
    ```bash
    mkdir mi-plugin-geowe && cd mi-plugin-geowe
    ```
2.  **Lanza el Bootstrap**:
    Este comando descarga la herramienta **GeoWE Forge** e inicializa los archivos necesarios (incluyendo los tipos para auto-completado):
    ```bash
    curl -s https://raw.githubusercontent.com/jmmluna/geowe-studio/main/packages/geowe-forge/index.js | node -- - init .
    ```

> [!TIP]
> **IntelliSense Inmediato:** Al ejecutar el comando anterior, se creará un archivo `geowe-studio.d.ts`. Tu editor (VSCode) lo detectará automáticamente y tendrás ayuda contextual mientras programas.

---
    
## Paso 2: Tu Código (index.js)
Al ejecutar el comando anterior, **GeoWE Forge** ha creado automáticamente los archivos necesarios por ti. No necesitas crear nada manualmente.

Abre el archivo `index.js` en tu editor favorito. Verás algo parecido a esto:

```javascript
export default {
  id: 'mi-hola-mundo',
  
  activate: (context) => {
    // Registramos una acción (comando)
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
Este código utiliza la API **`PluginContext`**. Gracias al archivo `geowe-studio.d.ts` que se generó en el Paso 1, verás que al escribir `context.` tu editor te sugerirá todos los métodos disponibles.

---

## Paso 3: Probar en Vivo (Drag & Drop)
¡No necesitas recompilar el núcleo!
1.  Abre el Studio en el navegador.
2.  Arrastra el archivo `index.js` directamente sobre el mapa.
3.  **¡Listo!** Verás aparecer un nuevo icono de una cara sonriente en la barra lateral. Púlsalo y observa el mensaje en la parte inferior.

---

## Paso 4: Empaquetar para Distribuir
Cuando tu herramienta esté lista, empaquétala para compartirla usando nuestra herramienta de empaquetado autónoma (generada en el Paso 1):

```bash
node forge.js .
```
Esto analizará tu carpeta actual, detectará el `manifest.json` y generará un archivo `mi-hola-mundo_v1.0.0.gplugin`. ¡Este archivo es todo lo que necesitas para distribuir tu plugin!

---

## 💡 Próximos Pasos
*   Consulta la **[Guía de Desarrollo Detallada](DEVELOPMENT.md)** para aprender a añadir paneles, modales y gestionar capas SIG.
*   Explora la **[Arquitectura](ARCHITECTURE.md)** para entender el sistema de sandboxing y carga ESM.

¡Feliz mapeo con GeoWE Studio! 🌍✨
