# 🛰️ Vector Layer Exporter (Vue 3 Edition)

Plugin profesional para **GeoWE Studio** que permite exportar capas vectoriales a múltiples formatos estándar con soporte para reproyección dinámica de coordenadas.

---

## 📖 Guía del Usuario

### Funcionalidad
Este plugin añade una nueva acción al menú de cada capa vectorial en el **Gestor de Capas**. Permite descargar los datos geográficos de la capa seleccionada.

### Pasos para Exportar:
1. Asegúrate de tener una capa vectorial cargada (GeoJSON, WFS, etc.).
2. Abre el **Gestor de Capas** desde la barra de herramientas.
3. Haz clic en el icono de los tres puntos (`...`) de la capa que desees exportar.
4. Selecciona la opción **"Exportar Capa (Vue)"**.
5. En el modal que aparece:
   - **Nombre del Archivo**: Escribe el nombre que desees para el archivo resultante.
   - **Formato**: Selecciona entre GeoJSON, Shapefile (Genera un .zip comprimido), KML (Google Earth) o WKT.
   - **Proyección (EPSG)**: Busca y selecciona el sistema de referencia de coordenadas de salida. El plugin transformará las coordenadas automáticamente.
6. Pulsa **Exportar**.

---

## 🛠️ Guía del Desarrollador (Convention & Standard)

Este plugin sirve como **referencia técnica** para el desarrollo de complementos en GeoWE Studio utilizando el framework **Vue 3**.

### Arquitectura de Integración
GeoWE Studio es un Host agnóstico al framework. Para integrar Vue, seguimos este patrón de inyección en tiempo de renderizado:

1. **Registro**: Se utiliza `ctx.ui.registerLayerAction` para añadir el punto de entrada.
2. **Modal**: Se abre un modal estándar mediante `ctx.ui.addModal`.
3. **onRender**: Se aprovecha el hook `onRender` del modal para instanciar la aplicación Vue sobre un contenedor estático (`<div id="root"></div>`).
4. **Contexto**: Se pasa el SDK de GeoWE (`ctx`) como propiedad (prop) a la raíz de Vue para que los componentes tengan acceso al mapa y APIs de UI.

### Stack Tecnológico
- **Framework**: Vue 3 (Composition API).
- **Bundler**: Vite con `@vitejs/plugin-vue`.
- **Target**: Compilación en modo **Library (IIFE)** para generar un único archivo `index.js` independiente.
- **GIS Engine**: `ol` (OpenLayers) para reproyección y formatos.

### Instrucciones de Compilación
Si deseas modificar este plugin, sigue estos pasos:

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar bundle (Fijar dist/index.js)
npm run build

# 3. Empaquetar para GeoWE Forge
# (Consiste en comprimir manifest.json + dist/index.js en un .gplugin)
```

### Formatos Soportados por el Plugin
- **GeoJSON**: Serialización nativa (`ol/format/GeoJSON`).
- **KML**: Serialización nativa (`ol/format/KML`).
- **WKT**: Serialización nativa (`ol/format/WKT`).
- **Shapefile**: Implementado mediante la librería `shp-write`, que genera internamente los archivos `.shp`, `.shx` y `.dbf`.

---

## 🚀 Próximos Pasos (Hoja de Ruta)
- [ ] Soporte para exportación a **GeoPackage (.gpkg)** mediante `@ngageoint/geopackage`.
- [ ] Exportación de atributos extendidos y estilos en KML.
- [ ] Previsualización de la extensión de la capa antes de descargar.

---
*Desarrollado para la comunidad de GeoWE Forge con ❤️*
