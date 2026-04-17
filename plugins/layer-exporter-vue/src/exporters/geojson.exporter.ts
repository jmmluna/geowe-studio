import { GeoJSON } from 'ol/format';
import { Exporter, ExportOptions, reprojectGeoJSON, downloadFile } from './base.exporter';

export class GeoJSONExporter implements Exporter {
  export(features: any[], sourceProj: string, options: ExportOptions) {
    const format = new GeoJSON();
    const geojson = format.writeFeaturesObject(features);

    // Reproyección manual si es necesario
    if (sourceProj !== options.projectionCode) {
      reprojectGeoJSON(geojson, sourceProj, options.projectionCode);
    }

    // MEJORA: Agregar metadatos de proyección (CRS) para compatibilidad con GeoWE Studio Core
    // Aunque el estándar GeoJSON (RFC 7946) asume WGS84, los sistemas GIS 
    // siguen usando el objeto 'crs' para interoperabilidad.
    (geojson as any).crs = {
      type: "name",
      properties: {
        name: `urn:ogc:def:crs:EPSG::${options.projectionCode.split(':')[1]}`
      }
    };

    downloadFile(
      JSON.stringify(geojson, null, 2), 
      `${options.filename}.geojson`, 
      'application/json'
    );
  }
}
