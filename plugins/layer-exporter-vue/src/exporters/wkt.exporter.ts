import { WKT } from 'ol/format';
import { Exporter, ExportOptions, downloadFile } from './base.exporter';

export class WKTExporter implements Exporter {
  export(features: any[], sourceProj: string, options: ExportOptions) {
    const wktFormat = new WKT();
    const wkt = wktFormat.writeFeatures(features, {
      featureProjection: sourceProj,
      dataProjection: options.projectionCode
    });

    // MEJORA: Añadir cabecera con EPSG para que el motor de carga universal 
    // lo identifique automáticamente.
    const wktWithMetadata = `# EPSG:${options.projectionCode.split(':')[1]}\n${wkt}`;

    downloadFile(wktWithMetadata, `${options.filename}.wkt`, 'text/plain');
  }
}
