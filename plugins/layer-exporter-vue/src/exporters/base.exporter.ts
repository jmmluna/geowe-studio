import proj4 from 'proj4';

export interface ExportOptions {
  filename: string;
  format: 'geojson' | 'shp' | 'kml' | 'wkt' | 'gpkg';
  projectionCode: string;
}

export interface Exporter {
  export(features: any[], sourceProj: string, options: ExportOptions): Promise<void> | void;
}

/**
 * Utilidad común para re-proyectar un objeto GeoJSON arbitrario.
 */
export function reprojectGeoJSON(geojson: any, sourceProj: string, targetProj: string) {
  const transform = proj4(sourceProj, targetProj).forward;

  const transformCoords = (coords: any): any => {
    if (typeof coords[0] === 'number') {
      return transform(coords);
    }
    return coords.map(transformCoords);
  };

  const processGeometry = (geometry: any) => {
    if (!geometry || !geometry.coordinates) return;
    geometry.coordinates = transformCoords(geometry.coordinates);
  };

  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach((f: any) => processGeometry(f.geometry));
  } else if (geojson.type === 'Feature') {
    processGeometry(geojson.geometry);
  } else {
    processGeometry(geojson);
  }
}

/**
 * Utilidad común para disparar la descarga de un archivo en el navegador.
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
