import { GeoJSON, KML } from 'ol/format';
import { Exporter, ExportOptions, reprojectGeoJSON, downloadFile } from './base.exporter';

export class KMLExporter implements Exporter {
  export(features: any[], sourceProj: string, options: ExportOptions) {
    const geoJSONFormat = new GeoJSON();
    const geojson = geoJSONFormat.writeFeaturesObject(features);

    // KML ESTÁNDAR: Siempre debe ser EPSG:4326 para máxima compatibilidad
    if (sourceProj !== 'EPSG:4326') {
      reprojectGeoJSON(geojson, sourceProj, 'EPSG:4326');
    }

    const kmlFormat = new KML();
    // Leemos de nuevo los features desde el GeoJSON ya re-proyectado
    const reprojectedFeatures = geoJSONFormat.readFeatures(geojson);
    const kml = kmlFormat.writeFeatures(reprojectedFeatures);

    downloadFile(kml, `${options.filename}.kml`, 'application/vnd.google-earth.kml+xml');
  }
}
