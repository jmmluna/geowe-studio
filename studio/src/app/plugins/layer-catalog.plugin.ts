import { PluginContext } from '../core/plugin-context';

export default {
  id: 'layer-catalog-plugin',
  name: 'Catálogo de Capas',
  activate: (ctx: PluginContext) => {
    const PANEL_ID = 'layer-catalog-panel';

    ctx.ui.addStyles(`
      .plugin-catalog-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 5px;
      }
      .catalog-intro {
        font-size: 14px;
        color: #7f8c8d;
        margin-bottom: 5px;
      }
      .catalog-section h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 12px 0;
        font-size: 15px;
        color: #2c3e50;
        border-bottom: 1px solid #dcdde1;
        padding-bottom: 8px;
      }
      .catalog-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .catalog-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid transparent;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .catalog-item:hover {
        background: #ffffff;
        border-color: #3498db;
        box-shadow: 0 4px 8px rgba(0,0,0,0.05);
      }
      .catalog-footer {
        margin-top: 10px;
        display: flex;
        justify-content: flex-end;
      }
    `);


    const catalogLayers = {
      raster: [
        { id: 'pnoa', name: 'PNOA Máxima Actualidad', url: 'https://www.ign.es/wms-inspire/pnoa-ma', layers: 'OI.OrthoimageCoverage' },
        { id: 'catastro', name: 'Catastro (Sede Electrónica)', url: 'http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx', layers: 'Catastro' },
        { id: 'mtn', name: 'Mapa Topográfico Nacional', url: 'https://www.ign.es/wms-inspire/mapa-raster', layers: 'mtn_raster_nacional' }
      ],
      vector: [
        { id: 'comunidades', name: 'Comunidades Autónomas (IGN)', url: 'https://www.ign.es/wms-inspire/unidades-administrativas', layers: 'AU.AdministrativeUnit' }
      ]
    };

    const openCatalog = () => {
      // console.log('Abriendo catálogo...'); // Limpieza

      const rasterContent = catalogLayers.raster.map(l => 
        ctx.ui.components.checkbox(l.name, false, `chk-${l.id}`, { type: 'raster', id: l.id })
      ).join('');

      const vectorContent = catalogLayers.vector.map(l => 
        ctx.ui.components.checkbox(l.name, false, `chk-${l.id}`, { type: 'vector', id: l.id })
      ).join('');

      const content = `
        <div class="plugin-catalog-container">
          <p class="catalog-intro">Seleccione las capas que desea añadir al mapa:</p>
          ${ctx.ui.components.section('Capas Raster (WMS)', 'wallpaper', rasterContent)}
          ${ctx.ui.components.section('Capas Vectoriales (WMS)', 'polyline', vectorContent)}
          <div class="catalog-footer">
            ${ctx.ui.components.button('Añadir al Mapa', 'add', 'primary', 'btn-add-layers')}
          </div>
        </div>
      `;


      ctx.ui.addPanel({
        id: PANEL_ID,
        title: 'Catálogo de Capas',
        content,
        onRender: (el) => {
          const btn = el.querySelector('#btn-add-layers');
          btn?.addEventListener('click', () => {
            const checked = el.querySelectorAll('input[type="checkbox"]:checked');
            checked.forEach((cb: any) => {
              const type = cb.getAttribute('data-type');
              const id = cb.getAttribute('data-id');
              const layer = (catalogLayers as any)[type].find((l: any) => l.id === id);
              
              if (layer) {
                ctx.layers.addWMSLayer(layer.name, layer.url, {
                  'LAYERS': layer.layers,
                  'TILED': true
                });
              }
            });
            ctx.ui.removePanel(PANEL_ID);
          });
        }
      });
    };



    // Registrar comando
    ctx.commands.register('layer-catalog:toggle', openCatalog);

    // UI Button
    ctx.ui.addButton({
      id: 'open-catalog',
      label: 'Abrir Catálogo de Capas',
      icon: 'grid_view',
      commandId: 'layer-catalog:toggle'
    });

  },
  deactivate: () => { }
};

