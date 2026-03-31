// Importamos tipados de OpenLayers. 
// EsBuild ignorará el contenido gracias a "external" en build.js
import type Map from 'ol/Map';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';

export default {
  id: 'feature-list',
  name: 'Feature List',
  version: '1.0.0',
  
  activate: async (ctx: any) => {
    // 1. Registramos la acción en el menú de capas del Layer Manager
    ctx.ui.registerLayerAction({
      id: 'show-features',
      label: 'Ver Componentes', // Texto en el dropdown
      icon: 'table_rows',       // Icono Material
      callback: (layerName: string) => {
        const map = ctx.map as unknown as Map;
        const layers = map.getLayers().getArray();
        const layer = layers.find((l: any) => l.get('name') === layerName) as any;
        
        if (!layer) {
           ctx.ui.setStatus(`No se encuentra la capa: ${layerName}`);
           return;
        }

        // 2. Extraer geometrías (Features) usando Duck-typing sobre la abstracción original
        if (typeof layer.getSource !== 'function') {
           ctx.ui.setStatus('La capa no tiene elementos vectoriales (es raster).');
           return;
        }

        const source = layer.getSource() as any;
        if (!source || typeof source.getFeatures !== 'function') {
           ctx.ui.setStatus('Imposible obtener elementos de esta fuente.');
           return;
        }

        const features = source.getFeatures();
        
        if (!features || features.length === 0) {
           ctx.ui.setStatus('La capa no contiene elementos.');
           return;
        }

        // 3. Generar la tabla HTML dinámica
        let contentHtml = ctx.resources.getTemplate('feature-list.html') || `<div id="fl-content">{TABLE_PLACEHOLDER}</div>`;
        
        // Renderizador de Tabla
        const renderTable = (feats: any[]) => {
           if (!feats || feats.length === 0) return '<p>No hay elementos</p>';
           
           // Agrupar todas las propiedades (claves) disponibles
           const keys = new Set<string>();
           feats.forEach(f => {
              const props = f.getProperties();
              Object.keys(props).forEach(k => {
                 if (k !== 'geometry') keys.add(k); // Ocultar columna enorme de array de coordenadas
              });
           });
           
           const colNames = Array.from(keys); 
           
           let table = '<table class="fl-table"><thead><tr>';
           
           // Limitar temporalmente columnas en UI para evitar scrolling horizontal masivo, o mostrar todas
           const displayCols = colNames.slice(0, 10);
           
           displayCols.forEach(c => { table += `<th>${c}</th>` });
           table += '</tr></thead><tbody>';
           
           feats.forEach(f => {
              table += '<tr>';
              const props = f.getProperties();
              displayCols.forEach(c => {
                 const val = props[c] !== undefined && props[c] !== null ? props[c] : '';
                 table += `<td>${val}</td>`;
              });
              table += '</tr>';
           });
           
           table += '</tbody></table>';
           return table;
        };

        const tableHtml = renderTable(features);
        contentHtml = contentHtml.replace('{TABLE_PLACEHOLDER}', tableHtml);

        // 4. Mostrar el Modal
        ctx.ui.addModal({
          id: 'feature-list-modal',
          title: `Capa "${layerName}"  |  Volumen Mapeado: ${features.length} instancias`,
          content: contentHtml
        });
      }
    });

    console.log('[FeatureList] Plugin Inicializado. Extensión LayerManager completada con éxito.');
  },

  deactivate: () => { }
};
