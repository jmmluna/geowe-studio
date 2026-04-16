/**
 * Plugin de Ejemplo: Dibujo de un punto nativo
 * 
 * Este plugin demuestra cómo usar el SDK de OpenLayers inyectado 
 * a través del contexto (ctx.ol) para crear capas, fuentes y estilos
 * de forma segura y sin usar variables globales.
 */
export default {
  id: 'example-point-plugin',
  name: 'Ejemplo de Punto Nativo',
  
  activate: (ctx) => {
    // 1. Extraer las clases necesarias del SDK inyectado
    const { ol } = ctx;
    
    // 2. Crear la fuente y la característica (Feature)
    const source = new ol.source.Vector();
    
    const pointFeature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([-3.703790, 40.416775])), // Madrid
      name: 'Madrid Centro'
    });
    
    source.addFeature(pointFeature);
    
    // 3. Definir un estilo visual nativo
    const style = new ol.style.Style({
      image: new ol.style.Circle({
        radius: 10,
        fill: new ol.style.Fill({ color: '#e74c3c' }), // Rojo GeoWE
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 })
      }),
      text: new ol.style.Text({
        text: 'Madrid',
        offsetY: -20,
        font: 'bold 12px Arial',
        fill: new ol.style.Fill({ color: '#2c3e50' }),
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 })
      })
    });
    
    // 4. Crear la capa vectorial nativa
    const vectorLayer = new ol.layer.Vector({
      source: source,
      style: style,
      properties: {
        name: 'Capa de Ejemplo JS',
        type: 'vector'
      }
    });
    
    // 5. Añadir la capa al mapa
    ctx.map.addLayer(vectorLayer);
    
    // Guardamos referencia para poder borrarla al desactivar
    ctx._example_layer = vectorLayer;
    
    ctx.ui.setStatus('Plugin de ejemplo JS activado: Punto en Madrid añadido.');
  },
  
  deactivate: (ctx) => {
    if (ctx._example_layer) {
      ctx.map.removeLayer(ctx._example_layer);
      delete ctx._example_layer;
    }
  }
};
