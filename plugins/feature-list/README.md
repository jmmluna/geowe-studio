# GeoWE Plugin: Feature List Data Table

Este plugin es una extensión oficial de **GeoWE Forge** diseñada para proporcionar una vista tabular de los atributos y datos alfanuméricos de las capas vectoriales cargadas en el mapa. 

Sirve como **modelo de referencia y convención** para el desarrollo de plugins independientes en TypeScript dentro del ecosistema GeoWE.

---

## 🚀 Características

- **Inspección de Atributos**: Acceso directo a la tabla de datos de cualquier capa vectorial (GeoJSON, WFS, etc.).
- **Integración Nativa**: Se registra automáticamente como una "Layer Action" en el menú contextual del *Layer Manager*.
- **Interfaz Reactiva**: Utiliza el sistema de modales y componentes UI de GeoWE para una experiencia de usuario fluida.
- **Desarrollo Tipado**: Programado íntegramente en TypeScript con soporte para la API de OpenLayers.

---

## 🛠️ Requisitos Previos

Para desarrollar o compilar este plugin, necesitarás:

- **Node.js**: Versión 18 o superior.
- **npm**: Gestor de paquetes estándar.
- **GeoWE Studio**: Una instancia de GeoWE Studio donde cargar el archivo `.gplugin` resultante.

---

## 💻 Flujo de Desarrollo

Sigue estos pasos para trabajar con el código del plugin:

### 1. Instalación de Dependencias
```bash
npm install
```

### 2. Compilación y Empaquetado
El proyecto incluye un orquestador (`build.js`) que automatiza todo el proceso:
```bash
npm run build
```
Este comando realizará las siguientes tareas:
1. Compilar el código fuente TypeScript (`src/index.ts`) usando **esbuild**.
2. Generar un bundle ESM (ES Module) optimizado en la carpeta `dist/`.
3. Copiar los recursos estáticos (`manifest.json` y plantillas HTML).
4. Invocar a la herramienta `forge-packager` para generar el archivo instalable: `feature-list_v1.0.0.gplugin`.

---

## 🏗️ Arquitectura del Plugin

Este plugin sigue la convención de estructura recomendada por GeoWE:

- **`manifest.json`**: Define el ID único, nombre, versión y los recursos (scripts y plantillas) que el núcleo debe cargar.
- **`src/index.ts`**: Punto de entrada. Implementa la interfaz `GeoWEPlugin`.
- **`src/feature-list.html`**: Fragmento HTML desacoplado que define la estructura visual de la tabla de datos.
- **`build.js`**: Script de construcción que marca las dependencias pesadas (como `ol`) como externas para mantener el plugin ligero.

### Interacción con el SDK
El plugin interactúa con GeoWE Studio exclusivamente a través del objeto `PluginContext`:
- **`ctx.ui.registerLayerAction`**: Para añadir botones a los menús de capas existentes.
- **`ctx.ui.addModal`**: Para mostrar ventanas flotantes con contenido enriquecido.
- **`ctx.resources.getTemplate`**: Para cargar plantillas HTML externas definidas en el manifiesto.

---

## 📦 Usabilidad y Despliegue

Para instalar y utilizar el plugin en GeoWE Studio:

1. **Carga Manual**: Arrastra el archivo `feature-list_v1.0.0.gplugin` sobre la interfaz de GeoWE Studio.
2. **Uso**: 
   - Selecciona una capa vectorial en el mapa.
   - Abre el **Gestor de Capas**.
   - Haz clic en el icono de menú (tres puntos) de la capa deseada.
   - Selecciona la opción **"Ver Componentes"**.

---

## 📏 Convenciones y Buenas Prácticas

1. **Identificadores**: Usa IDs descriptivos y únicos (ej: `feature-list`) para evitar colisiones con otros plugins.
2. **Dependencias Externas**: Si usas OpenLayers (`ol`), asegúrate de que esté configurado como `external` en el build para no inflar el tamaño del `.gplugin`.
3. **Limpieza**: Implementa el método `deactivate()` si tu plugin añade elementos persistentes al DOM o al bus de eventos que deban ser eliminados al desinstalar.
4. **Feedback**: Utiliza `ctx.ui.setStatus()` para informar al usuario sobre el progreso de las operaciones asíncronas.

---

*Desarrollado para la plataforma GeoWE Forge - Extensible GIS Platform.*
