import { createApp } from 'vue';
import App from './App.vue';

/**
 * GeoWE Plugin: Layer Exporter (Vue 3 Edition)
 */
export default {
  id: 'layer-exporter-vue',
  name: 'Exportador de Capas (Vue)',
  version: '1.0.0',

  activate: (ctx: any) => {
    // Registramos la acción de capa
    ctx.ui.registerLayerAction({
      id: 'export-layer-vue',
      label: 'Exportar Capa (Vue)',
      icon: 'file_download',
      callback: (layerName: string) => {
        // Buscamos la capa por nombre en el mapa
        const layers = ctx.map.getLayers().getArray();
        const layer = layers.find((l: any) => l.get('name') === layerName);

        if (!layer) {
          ctx.ui.setStatus(`Error: No se encontró la capa '${layerName}'`);
          return;
        }

        // Abrimos el modal de exportación
        ctx.ui.addModal({
          id: 'export-modal-vue',
          title: `Exportar Capa: ${layerName}`,
          content: '<div id="vue-exporter-root"></div>',
          onRender: (el: HTMLElement) => {
            const rootContainer = el.querySelector('#vue-exporter-root');
            if (rootContainer) {
              // Instanciamos Vue 3 pasando el contexto de GeoWE
              const app = createApp(App, { 
                context: ctx, 
                layer: layer,
                onClose: () => ctx.ui.removePanel('export-modal-vue')
              });
              app.mount(rootContainer);
            }
          }
        });
      }
    });

    console.log('[LayerExporterVue] Activado (Vue 3 Engine Loaded)');
  },

  deactivate: () => {
    console.log('[LayerExporterVue] Desactivado');
  }
};
