# Guía de Desarrollo de Plugins - GeoWE Studio

GeoWE Studio soporta todo el **Ecosistema Moderno de JavaScript**. Puedes desarrollar extensiones utilizando **VanillaJS, TypeScript, Vue, React, Angular, Svelte o Nuxt**.

---

## 🏗️ La API PluginContext
Cada plugin recibe un objeto `context` que proporciona acceso seguro a las funciones del núcleo. Estas son las APIs disponibles:

### 1. `ui` (Interfaz de Usuario)
- `ui.addButton({ id, label, icon, commandId })`: Añade un botón a la barra de herramientas.
- `ui.setButtonActive(id, active)`: Cambia el estado visual del botón.
- `ui.addPanel({ id, title, content, onRender })`: Registra y muestra un panel lateral.
- `ui.addModal({ id, title, content, onRender })`: Diálogo modal centralizado.
- `ui.removePanel(id)`: Cierra un panel o modal.
- `ui.setStatus(message)`: Actualiza la barra de estado inferior.
- `ui.addStyles(css)`: Inyecta estilos CSS dinámicos de forma segura.
- **Sidebar (Barra Lateral)**: 
    - `ui.addSidebarSection({ id, title, icon, content, onRender })`: Añade una sección a la barra lateral por defecto.
    - `ui.registerSidebar({ id, title, icon, content, onRender })`: Registra una barra lateral dedicada para el plugin.
- **Acciones de Capa**: 
    - `ui.registerLayerAction({ id, label, icon, callback })`: Añade una acción al menú contextual de cada capa.

### 2. `commands` (Lógica de Negocio)
- `commands.register(id, action)`: Registra funciones invocables.
- `commands.execute(id, payload)`: Ejecuta comandos registrados.

### 3. `map` & `layers`
- `map`: Acceso directo a la instancia de **OpenLayers**.
- `layers`: Gestión de capas (`addWMSLayer`, `addVectorLayer`, `removeLayer`, `zoomToLayer`, etc.).

---

## 🚀 Ejemplos Mínimos (Hello World)

A continuación se muestran ejemplos funcionales de interacción con la API de GeoWE Studio.

### 1. Estructura Básica de un Plugin (VanillaJS)
Un plugin debe exportar por defecto un objeto que cumpla con la interfaz `GeoWEPlugin`.

```js
export default {
  id: 'mi-herramienta-unica',
  name: 'Mi Primera Herramienta',
  version: '1.0.0',

  activate: (context) => {
    console.log('¡Herramienta GeoWE activada!');
    context.ui.setStatus('Plugin cargado correctamente');
    
    // Aquí registras tus comandos, botones y paneles
  },

  deactivate: () => {
    console.log('Limpiando recursos...');
  }
};
```

### 2. Estructura Básica de un Plugin (TypeScript)
Todo plugin debe exportar por defecto un objeto que cumpla con la interfaz `GeoWEPlugin`.

```typescript
import { GeoWEPlugin, PluginContext } from './plugin-context';

export default {
  id: 'mi-herramienta-unica',
  name: 'Mi Primera Herramienta',
  version: '1.0.0',

  activate: (context: PluginContext) => {
    console.log('¡Herramienta GeoWE activada!');
    context.ui.setStatus('Plugin cargado correctamente');
    
    // Aquí registras tus comandos, botones y paneles
  },

  deactivate: () => {
    console.log('Limpiando recursos...');
  }
} as GeoWEPlugin;
```

### 3. Botón y Mensaje de Estado
Aprende a registrar un comando y mostrar un saludo en la barra de estado inferior.

```typescript
context.commands.register('hello.sayHi', () => {
  context.ui.setStatus('¡Hola desde GeoWE Studio!');
});

context.ui.addButton({
  id: 'btn-hi',
  label: 'Saludar',
  icon: 'chat',
  commandId: 'hello.sayHi'
});
```

### 4. Diálogo Modal
Muestra una ventana emergente nativa con contenido HTML personalizado.

```typescript
context.ui.addModal({
  id: 'my-modal',
  title: 'GeoWE Modal',
  content: '<div style="padding:10px">¡Este es un diálogo modal!</div>',
  onRender: (el) => console.log('Modal listo')
});
```

### 5. Panel Lateral
Integra herramientas complejas o formularios directamente en la interfaz lateral.

```typescript
context.ui.addPanel({
  id: 'my-tool-panel',
  title: 'Mi Herramienta',
  content: '<div id="panel-root">Contenido del panel</div>',
  onRender: (el) => {
    el.innerHTML = '<h3>Configuración</h3><button class="geowe-ui-btn">Aplicar</button>';
  }
});
```

---

## 🛠️ GeoWE Forge (SDK)
GeoWE Forge es el motor de empaquetado oficial que genera los archivos necesarios para distribuir tus desarrollos:

- **Plugin (`.gplugin`)**: Archivo `.js` o proyecto (Vue, React, etc.) con la lógica de la herramienta individual.
- **Extensión (`.gext`)**: Un conjunto de plugins que se cargan y activan de forma conjunta.
- **Aplicación (`.gapp`)**: Conjunto de extensiones y plugins que definen un entorno completo con **branding propio** (logo, título, slogan).

### Ejemplo de Empaquetado
Para empaquetar cualquier elemento, utiliza el script `forge:pack` indicando la carpeta de origen:

```bash
# Empaquetar un plugin, extensión o aplicación automáticamente
npm run forge:pack plugins/mi-herramienta
```
GeoWE Forge detectará automáticamente si se trata de un plugin (manifest.json), una extensión (extension.json) o una aplicación (app.json) y generará el archivo con la extensión correcta.

### Plugins Ligeros (.js)
GeoWE Studio soporta la carga directa de archivos **`.js`** estándar mediante módulos ESM. Para herramientas simples, **no se requiere empaquetado**; el sistema las importa y activa directamente desde el archivo fuente.

---

## 🌍 Generación de Apps (.gapp) y Ejecución vía URL
Las aplicaciones `.gapp` permiten personalizar totalmente el branding de GeoWE Studio y su conjunto de herramientas.

### Carga Dinámica por URL
Puedes compartir aplicaciones o plugins enviando una URL con parámetros, facilitando el empotrado en otras plataformas:

- **?app=URL**: Carga una aplicación completa (.gapp) con su branding.
- **?plugin=URL**: Carga un plugin individual (.gplugin o .js).
- **?ext=URL**: Carga una extensión (.gext).
- **?load=URL**: Carga genérica de recursos.

*Ejemplo: `https://studio.geowe.org/?app=https://mi-servidor.com/mi-visor.gapp`*

---

## 🎨 Iconografía
GeoWE Studio utiliza la librería **[Material Icons](https://fonts.google.com/icons)** como estándar visual. Los plugins pueden integrar iconos mediante simples cadenas de texto (nombres de iconos).

- **Cómo usarlos**: En cualquier campo `icon` de la API (botones, secciones, manifiestos), indica el nombre del icono en minúsculas y separado por guiones bajos (ej: `settings`, `file_download`, `public`).
- **Iconos Comunes en GeoWE**:
    - `layers`: Gestión de capas.
    - `chat`: Mensajes y notificaciones.
    - `public`: Servicios remotos (PNOA/IGN).
    - `settings`: Configuración y herramientas.

---

## 📦 Especificación de Formatos

### 1. Plugin (.gplugin)
Es el componente atómico de GeoWE. Contiene la lógica y la interfaz de una herramienta específica.
- **Archivo de Manifiesto**: `manifest.json`
```json
{
  "id": "mi-plugin",
  "name": "Mi Plugin",
  "version": "1.0.0",
  "main": "index.mjs",           // Punto de entrada ESM
  "styles": ["style.css"],      // CSS opcional (se carga automáticamente)
  "templates": ["styler.html"], // Plantillas HTML opcionales
  "icon": "settings",           // Icono en el catálogo
  "description": "Breve descripción de la funcionalidad"
}
```

---

## 🎨 Separación de Estilos y Plantillas

Para mantener un código limpio y profesional, GeoWE Studio permite separar la lógica (JS) de la presentación (CSS/HTML).

### 1. Carga de Estilos
Si incluyes archivos en el campo `"styles"` de tu `manifest.json`, GeoWE Studio los inyectará automáticamente en el DOM al activar el plugin y los eliminará al desactivarlo.

### 2. Uso de Plantillas HTML
Si incluyes archivos en `"templates"`, puedes recuperarlos desde tu código utilizando el servicio de recursos:

```javascript
export default {
  id: 'mi-styler',
  activate: async (context) => {
    // 1. Recuperar el contenido de la plantilla
    const html = context.resources.getTemplate('styler.html');

    // 2. Usarlo en un panel o modal
    context.ui.addPanel({
      id: 'styler-panel',
      title: 'Configuración de Estilos',
      content: html,
      onRender: (el) => {
        // Manipulación del DOM de la plantilla
        el.querySelector('#apply-btn').onclick = () => {
          console.log('Aplicando cambios...');
        };
      }
    });
  }
};
```

Esta arquitectura permite que tu archivo `index.js` permanezca enfocado en la lógica, mientras que el diseño se gestiona en archivos `.css` y `.html` independientes con soporte completo de los editores de código (resaltado de sintaxis, etc.).

### 2. Extensión (.gext)
Agrupación lógica de plugins que se instalan y activan como un pack.
- **Archivo de Manifiesto**: `extension.json`
- **Estructura**: El ZIP debe contener una carpeta `plugins/` con los plugins referenciados.
```json
{
  "id": "gis-pack",
  "name": "GIS Essentials Pack",
  "version": "1.0.0",
  "plugins": ["geojson-loader", "vector-styler"]
}
```

### 3. Aplicación (.gapp)
Entorno completo preconfigurado con branding corporativo y control de herramientas disponibles.
- **Archivo de Manifiesto**: `app.json`
- **Branding**: Permite adjuntar un logo y definir un slogan propio.
```json
{
  "id": "geowe-custom",
  "name": "Mi Visor SIG",
  "slogan": "Gestión Territorial Avanzada",
  "logo": "logo-visor.png",
  "config": {
    "showPluginManagement": false,     // Oculta el cargador de plugins
    "disableInternalPlugins": [        // Desactiva herramientas nativas
      "hub-manager-plugin"
    ]
  },
  "extensions": ["gis-pack"],           // Lista de extensiones (.gext)
  "plugins": ["mi-plugin"]             // Plugins adicionales (.gplugin)
}
```

---

## 🎨 Estilos y Clases CSS del Núcleo
GeoWE Studio proporciona un sistema de diseño propio (**GeoWE UI**) para que los plugins mantengan una estética coherente y profesional.

### Design Tokens (Variables CSS)
- `--geowe-primary`: Color principal de textos y fondos oscuros (`#34495e`).
- `--geowe-accent`: Azul corporativo para acciones principales (`#3498db`).
- `--geowe-success`: Verde para confirmaciones (`#27ae60`).
- `--geowe-danger`: Rojo para errores o acciones críticas (`#e74c3c`).
- `--geowe-radius`: Radio de borde estándar (`10px`).

### Componentes GeoWE UI
- `.geowe-ui-section`: Contenedor con margen inferior.
- `.geowe-ui-section-header`: Cabecera de sección con icono.
- `.geowe-ui-row`: Fila flexible alineada.
- `.geowe-ui-btn`: Clase base para botones.
- `.geowe-ui-btn-primary`: Botón azul destacado.
- `.geowe-ui-btn-secondary`: Botón blanco con borde.
- `.geowe-ui-input`: Caja de texto estándar.
- `.geowe-ui-checkbox-row`: Fila interactiva para checkboxes modernos.
- `.geowe-ui-file-label`: Área de carga de archivos.

---

## 📡 Catálogo de Eventos del Sistema
Los plugins pueden suscribirse a eventos globales mediante `context.events.on(nombre, callback)`:

### Interfaz (UI)
- `ui:changed`: Notifica cambios generales en la interfaz.
- `ui:statusChanged`: Actualización del mensaje de la barra de estado.
- `ui:panelsChanged`: Adición o eliminación de un panel/modal.
- `ui:sidebarChanged`: Cambio de sección activa en la barra lateral.

### Capas (Layers)
- `layer:changed`: Emite al añadir, eliminar o cambiar visibilidad de capas.
- `layer:addWMS` / `layer:addVector`: Solicita la carga de nuevos datos.
- `layer:remove`: Solicita la eliminación de una capa.

### Aplicación (App)
- `app:loadingStart` / `app:loadingEnd`: Control del Splash Screen.
- `app:configApplied`: Notifica carga de una nueva Aplicación (.gapp).
- `app:reloadInternalPlugins`: Reinicio de herramientas base.
