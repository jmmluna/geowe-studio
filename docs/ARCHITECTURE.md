## ⚙️ Sistema de Carga de Plugins
GeoWE Studio utiliza un sistema de carga basado en **Módulos ESM (ECMAScript Modules)**.
- **Dynamic Import**: Los plugins se cargan bajo demanda mediante la función nativa `import()`.
- **Aislamiento**: Cada plugin se ejecuta en su propio contexto, interactuando con el núcleo únicamente a través de la API `PluginContext`.

## 📱 Aplicaciones (.gapp) y Branding Dinámico
GeoWE Studio permite empaquetar aplicaciones completas en formato **`.gapp`**.
- **Personalización**: Define títulos, slogans y logos propios (vía `app.json` + assets).
- **Control de Entorno**: Posibilidad de deshabilitar plugins internos para un entorno minimalista.
- **Dinamismo**: El estado de la UI se actualiza al vuelo sin necesidad de refrescar la página.

## 🌍 Carga Remota por URL
Para facilitar el empotrado en otras webs y la compartición de estados, GeoWE Studio soporta la carga de recursos mediante parámetros de URL:
- `?load=`, `?plugin=`, `?ext=`, `?app=`: Todas estas claves permiten inyectar una URL remota de un recurso (.js, .gplugin, .gext, .gapp) que se activará automáticamente al inicio.

## 🛡️ Estabilidad y Robustez de UI
Durante la fase de desarrollo del MVP, se han corregido varios puntos críticos de fallo:

### 1. Gestión de Paneles
El sistema de gestión de paneles es reactivo pero unidireccional, evitando el agotamiento del stack de llamadas del navegador (bucle de eventos circular `LayerManager` -> `ui:panelsChanged`).

### 2. Sanitización de Paneles Dinámicos
Dado que los plugins pueden inyectar HTML de forma dinámica (especialmente en plugins de carga de datos), se ha implementado un motor de **Sanitización de Contenido**. Esto previene ataques XSS y asegura que los formularios inyectados sean consistentes con el diseño de GeoWE.

### 3. Integración Geográfica Robusta
Para evitar problemas de contexto con el motor de OpenLayers dentro de bundles empaquetados, se ha optado por un sistema de **Reproyección Manual (Proj4)** para formatos de exportación complejos (KML, GeoPackage). Esto garantiza que la transformación de coordenadas sea agnóstica a la versión de OpenLayers cargada por el host.

## 🧩 Herramientas del Núcleo (Plugins Internos)
GeoWE Studio incluye por defecto un conjunto de plugins internos que proporcionan la funcionalidad base:

1.  **Gestor de Capas (Layer Manager)**: Control de visibilidad, orden, zoom y eliminación de capas cargadas en el mapa.
2.  **Catálogo de Capas (Layer Catalog)**: Acceso rápido a fuentes de datos estándar (PNOA, IGN, Catastro) mediante servicios WMS/WFS.
3.  **Información de Plugins (Plugin Info)**: Herramienta de diagnóstico que lista las extensiones activas y sus metadatos (versión, autor).

---

## 📈 Evolución y Mantenimiento
Este documento se mantendrá actualizado conforme se añadan nuevas capacidades al `CoreService` de la plataforma.
