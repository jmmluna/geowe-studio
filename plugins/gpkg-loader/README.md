# GeoPackage Loader Plugin for GeoWE Studio

Este plugin dota a GeoWE Studio de la capacidad de cargar archivos **GeoPackage (.gpkg)** mediante la funcionalidad de arrastrar y soltar (Drag & Drop).

## 📖 Información para Usuarios

### Características
- Carga de tablas vectoriales desde archivos `.gpkg`.
- Soporte para múltiples tablas dentro de un mismo archivo.
- Integración transparente con el visor de mapas.

### Cómo instalar
1. Descarga o compila el archivo `gpkg-loader_v1.0.0.gplugin`.
2. En GeoWE Studio, abre el gestor de extensiones.
3. Selecciona "Instalar Extensión Local" y sube el archivo.
4. Una vez activado, simplemente arrastra cualquier archivo `.gpkg` sobre el visor de mapas.

---

## 🛠️ Información para Desarrolladores

Este plugin está desarrollado en **TypeScript** y utiliza **Vite** como empaquetador.

### Dependencias Principales
- `@ngageoint/geopackage`: Motor para el manejo de archivos GeoPackage.
- `ol`: Dependencia externa para interoperabilidad con OpenLayers.

### Scripts Disponibles
- `npm run dev`: Inicia el entorno de desarrollo de Vite.
- `npm run build`: Compila el código TypeScript a ESM y empaqueta el plugin en formato `.gplugin`.

### Estructura de Archivos
- `src/index.ts`: Punto de entrada del plugin y lógica de intercepción de eventos.
- `manifest.json`: Definición técnica del plugin.
- `build.cjs`: Script de empaquetado personalizado para GeoWE Studio.

### Cómo contribuir
1. Clona el repositorio.
2. Ejecuta `npm install` para instalar las dependencias.
3. Realiza tus cambios en `src/`.
4. Ejecuta `npm run build` para verificar la compilación y generar el paquete.
