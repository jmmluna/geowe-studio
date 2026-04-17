import { GeoJSON } from 'ol/format';
import { GeoPackage, GeoPackageAPI, setSqljsWasmLocateFile } from '@ngageoint/geopackage';
import { Exporter, ExportOptions, reprojectGeoJSON, downloadFile } from './base.exporter';
import { SRS_METADATA } from '../srs-registry';

// Configuración de motor SQLite WASM para GeoPackage en navegador
setSqljsWasmLocateFile((file: string) => `https://unpkg.com/rtree-sql.js@1.7.0/dist/sql-wasm.wasm`);

export class GPKGExporter implements Exporter {
  async export(features: any[], sourceProj: string, options: ExportOptions) {
    const format = new GeoJSON();
    const gpkgName = `${options.filename}.gpkg`;

    const targetSrs = SRS_METADATA[options.projectionCode];
    if (targetSrs) {
      // @ts-ignore
      GeoPackage.addProjection(options.projectionCode, targetSrs.proj4);
    }

    // Para GeoPackage, generamos un GeoJSON en WGS84 temporalmente 
    // ya que el motor GPKG suele preferir la entrada en 4326 para re-proyectar internamente
    const gpkgGeoJSON = format.writeFeaturesObject(features);
    if (sourceProj !== 'EPSG:4326') {
      reprojectGeoJSON(gpkgGeoJSON, sourceProj, 'EPSG:4326');
    }

    try {
      const gpkg: any = await GeoPackageAPI.create();
      const srsId = parseInt(options.projectionCode.split(':')[1]);

      // Registrar el SRS en la base de datos si no es estándar
      if (targetSrs && srsId !== 4326 && srsId !== 3857) {
        gpkg.spatialReferenceSystemDao.create({
          srs_name: targetSrs.name,
          srs_id: targetSrs.id,
          organization: 'EPSG',
          organization_coordsys_id: targetSrs.id,
          definition: targetSrs.wkt,
          description: targetSrs.name
        });
      }

      const featuresToAdd: any[] = gpkgGeoJSON.type === 'FeatureCollection' ? (gpkgGeoJSON as any).features : [gpkgGeoJSON];

      // Detección automática de columnas
      const columns: any[] = this.detectColumns(featuresToAdd);

      gpkg.createFeatureTable(options.filename, undefined, columns, undefined, srsId);

      // El motor GPKG realiza la re-proyección interna desde 4326 al srsId designado en la tabla
      await gpkg.addGeoJSONFeaturesToGeoPackage(featuresToAdd, options.filename);
      const content = await gpkg.export();

      downloadFile(content, gpkgName, 'application/x-sqlite3');
    } catch (err) {
      console.error('Error generando GeoPackage:', err);
      throw err;
    }
  }

  private detectColumns(features: any[]): any[] {
    const columns: any[] = [];
    if (features.length > 0 && features[0].properties) {
      const props = features[0].properties;
      for (const key in props) {
        const val = props[key];
        let dataType = 'TEXT';

        if (typeof val === 'number') {
          dataType = Number.isInteger(val) ? 'INTEGER' : 'DOUBLE';
        } else if (typeof val === 'boolean') {
          dataType = 'BOOLEAN';
        }

        columns.push({
          name: key,
          dataType: dataType
        });
      }
    }
    return columns;
  }
}
