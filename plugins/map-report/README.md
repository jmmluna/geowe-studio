# GeoWE React Plugin: Map PDF Reporter

Este plugin proporcional una herramienta profesional para la generación de informes en PDF que capturan el estado actual del mapa, incluyendo metadatos, leyenda dinámica y escala.

Sirve como **estándar de arquitectura para plugins basados en React** dentro del ecosistema GeoWE Forge.

---

## 🚀 Funcionalidades para el Usuario

- **Captura WYSIWYG**: El PDF refleja exactamente la vista actual del mapa en el navegador.
- **Leyenda Automática**: El informe incluye una sección de simbología basada únicamente en las capas que el usuario tiene visibles en ese momento.
- **Barra de Escala**: Incorpora la escala numérica/gráfica actual del mapa para precisión cartográfica.
- **Personalización**: Permite al usuario definir el título y una descripción detallada que aparecerán en el encabezado del informe.

---

## 🛠️ Arquitectura Técnica (React Integration)

A diferencia de los plugins estándar en Vanilla JS, este plugin utiliza un stack moderno para gestionar interfaces complejas:

### 1. Sistema de Montaje (Mounting)
GeoWE Forge es agnóstico al framework. Para integrar React, el plugin utiliza el callback `onRender` del núcleo:
1. El plugin registra un panel lateral con un contenedor vacío: `<div id="map-report-root"></div>`.
2. En `onRender`, se invoca a `ReactDOM.createRoot` para inyectar la aplicación React dentro de ese nodo DOM específico.

### 2. Bundling y Dependencias
Debido a que GeoWE Studio no provee React globalmente, este plugin **empaqueta sus propias dependencias** (`react`, `react-dom`, `jspdf`) dentro del bundle final (`index.js`). 
- **Herramienta**: esbuild.
- **Resultado**: Un único archivo autonomo e independiente.

---

## 💻 Desarrollo para el Programador

### Prerrequisitos
- Node.js 18+
- npm

### Flujo de Trabajo
1. **Instalar dependencias**:
   ```bash
   npm install
   ```
2. **Construir el Plugin**:
   ```bash
   npm run build
   ```
   Esto compilará el código `.tsx`, generará la carpeta `dist/` y empaquetará el archivo final: `map-report_v1.0.0.gplugin`.

### Estructura de Ficheros Recomendada
- `src/index.tsx`: Puente entre el SDK de GeoWE y React.
- `src/App.tsx`: Contenedor principal de la UI del plugin.
- `src/ReportGenerator.ts`: Lógica pura de generación de PDF separada del ciclo de vida de React.

---

## 📏 Convenciones GeoWE React

1. **Aislamiento**: Todo el CSS debe estar scopeado o inyectado vía `ctx.ui.addStyles` para evitar colisiones con el núcleo de Angular de GeoWE Studio.
2. **Contexto**: Pasa siempre el objeto `context` (SDK) a tus componentes React mediante props o un Context Provider de React para tener acceso al mapa, capas y servicios de UI.
3. **Limpieza**: Si tu componente React utiliza listeners globales, asegúrate de limpiarlos en la fase de desactivación del plugin.

---

*Desarrollado para la plataforma GeoWE Forge - Extensible GIS Platform.*
