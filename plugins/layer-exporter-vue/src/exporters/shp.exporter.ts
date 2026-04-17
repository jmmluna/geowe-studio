import { GeoJSON } from 'ol/format';
// @ts-ignore
import { zip as zipShp } from '@mapbox/shp-write';
import { Exporter, ExportOptions, reprojectGeoJSON, downloadFile } from './base.exporter';
import { SRS_METADATA } from '../srs-registry';

export class SHPExporter implements Exporter {
  async export(features: any[], sourceProj: string, options: ExportOptions) {
    const format = new GeoJSON();
    const geojson = format.writeFeaturesObject(features);

    // Reproyección al sistema de destino
    if (sourceProj !== options.projectionCode) {
      reprojectGeoJSON(geojson, sourceProj, options.projectionCode);
    }

    // MEJORA: Obtener el WKT de la proyección para generar el archivo .prj correctamente
    const srsMeta = SRS_METADATA[options.projectionCode];
    const prjContent = srsMeta ? srsMeta.wkt : null;

    const options_shp: any = {
        folder: options.filename,
        filename: options.filename,
        outputType: 'blob',
        compression: 'STORE'
    };

    // Si tenemos el WKT de la proyección, lo incluimos para que shp-write genere el .prj
    if (prjContent) {
        options_shp.prj = prjContent;
    }

    try {
        const content = await zipShp(geojson, options_shp);
        downloadFile(content, `${options.filename}.zip`, 'application/zip');
    } catch (err) {
        console.error('Error generando Shapefile:', err);
        throw err;
    }
  }
}
