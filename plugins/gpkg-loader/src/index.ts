import { GeoPackageAPI, setSqljsWasmLocateFile } from '@ngageoint/geopackage';

// Configuración de motor SQLite WASM para GeoPackage en navegador
setSqljsWasmLocateFile((file: string) => `https://unpkg.com/rtree-sql.js@1.7.0/dist/sql-wasm.wasm`);

/**
 * Plugin para cargar archivos GeoPackage mediante Drag & Drop.
 */
const GPKGLoaderPlugin: any = {
  id: 'gpkg-loader',
  name: 'GeoPackage Loader',
  version: '1.0.0',
  
  _dropHandler: null,

  activate(ctx: any) {
    this._dropHandler = async (payload: { file: File, markHandled: () => void }) => {
      const file = payload.file;
      
      if (file && file.name.toLowerCase().endsWith('.gpkg')) {
        payload.markHandled();
        ctx.ui.setStatus(`Procesando GeoPackage: ${file.name}...`);

        try {
          const arrayBuffer = await file.arrayBuffer();
          const gpkg = await GeoPackageAPI.open(new Uint8Array(arrayBuffer));
          
          const tables = gpkg.getFeatureTables();

          if (tables.length === 0) {
            ctx.ui.setStatus('El GeoPackage no contiene tablas de entidades.');
            return;
          }

          for (const tableName of tables) {
            ctx.ui.setStatus(`Cargando tabla: ${tableName}...`);
            
            const features: any[] = [];
            const iterator = gpkg.iterateGeoJSONFeatures(tableName);
            
            for (const feature of iterator) {
              features.push(feature);
            }

            if (features.length > 0) {
                const featureCollection = {
                    type: 'FeatureCollection',
                    features: features
                };
                
                // Añadimos metadatos PRO para que el Inspector de Capas pueda mostrarlos
                const metadata = {
                    format: 'GeoPackage',
                    count: features.length,
                    filename: file.name,
                    tableName: tableName,
                    srs: 'EPSG:4326' // GeoPackage suele usar 4326 para GeoJSON nativo
                };

                ctx.layers.addVectorLayer(tableName, featureCollection, metadata);
            }
          }

          ctx.ui.setStatus(`GeoPackage "${file.name}" cargado (${tables.length} tablas).`);
        } catch (error: any) {
          console.error('Error cargando GeoPackage:', error);
          ctx.ui.setStatus(`Error al cargar GeoPackage: ${error.message}`);
        }
      }
    };

    ctx.events.on('app:unhandledDrop', this._dropHandler);
    console.log('Plugin GeoPackage Loader activado.');
  },

  deactivate(ctx: any) {
    if (this._dropHandler && ctx.events.off) {
      ctx.events.off('app:unhandledDrop', this._dropHandler);
      this._dropHandler = null;
    }
    console.log('Plugin GeoPackage Loader desactivado.');
  }
};

export default GPKGLoaderPlugin;
