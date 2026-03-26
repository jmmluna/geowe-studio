export default {
  id: 'vector-styler-plugin',
  name: 'Estilizador Vectorial',
  activate: (ctx) => {
    const PANEL_ID = 'vector-styler-panel';

    const openStyler = (layerName) => {
      // Obtener color actual si es posible
      const layer = ctx.layers.getAll().find(l => l.name === layerName);
      const currentColor = layer ? (layer.color || '#3498db') : '#3498db';

      // Recuperar plantilla externa
      let template = ctx.resources.getTemplate('styler.html');
      
      if (!template) {
        console.error('Plantilla styler.html no encontrada');
        ctx.ui.setStatus('Error: No se encontró la interfaz del plugin');
        return;
      }

      // Reemplazo simple de variables (mini-engine de plantillas)
      template = template.replace('{{currentColor}}', currentColor);

      ctx.ui.addModal({
        id: PANEL_ID,
        title: `Estilo: ${layerName}`,
        content: template,
        onRender: (el) => {
          const applyBtn = el.querySelector('#apply-styler');
          const cancelBtn = el.querySelector('#cancel-styler');

          applyBtn?.addEventListener('click', () => {
            const fill = el.querySelector('#fill-color').value;
            const stroke = el.querySelector('#stroke-color').value;
            const width = parseInt(el.querySelector('#stroke-width').value);

            ctx.layers.setStyle(layerName, {
              fill: fill,
              stroke: stroke,
              width: width
            });

            ctx.ui.removePanel(PANEL_ID);
            ctx.ui.setStatus(`Estilo aplicado a ${layerName}`);
          });

          cancelBtn?.addEventListener('click', () => {
            ctx.ui.removePanel(PANEL_ID);
          });
        }
      });
    };

    // Registrar la acción en el punto de extensión del Gestor de Capas
    ctx.ui.registerLayerAction({
      id: 'change-style',
      label: 'Cambiar Estilo',
      icon: 'palette',
      callback: (layerName) => openStyler(layerName)
    });

    console.log('Vector Styler Plugin (JS) with external template activated.');
  },
  deactivate: () => { }
};
