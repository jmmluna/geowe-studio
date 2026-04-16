import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';

export interface DetectionResult {
  code: string;
  isConfident: boolean;
  probableType: 'geographic' | 'projected';
}

/**
 * Registro central de proyecciones para GeoWE Studio.
 */
export class ProjectionRegistry {
  
  public static registerAll() {
    // UTM ETRS89
    proj4.defs("EPSG:25829", "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    proj4.defs("EPSG:25830", "+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    proj4.defs("EPSG:25831", "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

    // UTM ED50
    proj4.defs("EPSG:23029", "+proj=utm +zone=29 +ellps=intl +towgs84=-131,-13,163,0,0,0,0 +units=m +no_defs");
    proj4.defs("EPSG:23030", "+proj=utm +zone=30 +ellps=intl +towgs84=-131,-13,163,0,0,0,0 +units=m +no_defs");
    proj4.defs("EPSG:23031", "+proj=utm +zone=31 +ellps=intl +towgs84=-131,-13,163,0,0,0,0 +units=m +no_defs");

    // ETRS89 Geográficas (Oficial España)
    proj4.defs("EPSG:4258", "+proj=longlat +ellps=GRS80 +no_defs");

    // WGS84 Geográficas
    proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

    register(proj4);
    console.log('GeoWE Projection Registry: Sistemas 25830, 4258 y otros registrados.');
  }

  public static detectProjection(content: string, filename: string): DetectionResult {
    const fileNameLower = filename.toLowerCase();

    // 1. Detección en GeoJSON
    if (fileNameLower.endsWith('.json') || fileNameLower.endsWith('.geojson')) {
      try {
        const json = JSON.parse(content);
        
        if (json.crs && json.crs.properties && json.crs.properties.name) {
          const crsName = json.crs.properties.name;
          const match = crsName.match(/EPSG:?(\d+)/i) || crsName.match(/EPSG::(\d+)/i);
          if (match) return { code: `EPSG:${match[1]}`, isConfident: true, probableType: 'projected' };
        }
        
        // HEURÍSTICA: Analizar coordenadas si no hay CRS
        const firstFeature = json.features?.[0];
        if (firstFeature?.geometry?.coordinates) {
          let coords = firstFeature.geometry.coordinates;
          while (Array.isArray(coords[0])) coords = coords[0]; // Aplanar nivel 1 (polígonos/líneas)
          
          const x = coords[0];
          const y = coords[1];
          
          if (Math.abs(x) > 180 || Math.abs(y) > 90) {
            return { code: 'EPSG:25830', isConfident: false, probableType: 'projected' };
          }
        }
        
        return { code: 'EPSG:4326', isConfident: false, probableType: 'geographic' };
      } catch (e) {
        return { code: 'EPSG:4326', isConfident: false, probableType: 'geographic' };
      }
    }

    // 2. Detección en WKT
    if (fileNameLower.endsWith('.wkt')) {
      const match = content.match(/AUTHORITY\["EPSG","(\d+)"\]/i);
      if (match) return { code: `EPSG:${match[1]}`, isConfident: true, probableType: 'projected' };
    }

    return { code: 'EPSG:4326', isConfident: false, probableType: 'geographic' };
  }
}
