import { initializeSrsRegistry } from './srs-registry';
import { ExportOptions, Exporter } from './exporters/base.exporter';
import { GeoJSONExporter } from './exporters/geojson.exporter';
import { KMLExporter } from './exporters/kml.exporter';
import { WKTExporter } from './exporters/wkt.exporter';
import { SHPExporter } from './exporters/shp.exporter';
import { GPKGExporter } from './exporters/gpkg.exporter';

// Inicialización central de proyecciones para todo el sistema de exportación
initializeSrsRegistry();

export const COMMON_PROJECTIONS = [
  { code: 'EPSG:4326', name: 'WGS 84 (Geográficas)' },
  { code: 'EPSG:3857', name: 'Web Mercator' },
  { code: 'EPSG:25830', name: 'ETRS89 / UTM zone 30N (España Peninsular)' },
  { code: 'EPSG:25829', name: 'ETRS89 / UTM zone 29N (Galicia/Portugal)' },
  { code: 'EPSG:25831', name: 'ETRS89 / UTM zone 31N (Baleares/Cataluña)' },
  { code: 'EPSG:4258', name: 'ETRS89 (Geográficas)' }
];

/**
 * Servicio Orquestador de Exportaciones.
 * Implementa el patrón Strategy para delegar la generación de cada formato
 * a su exportador especializado, asegurando la inclusión de metadatos 
 * de proyección y la reproyección correcta de los datos.
 */
export async function exportLayer(features: any[], sourceProj: string, options: ExportOptions) {
  const exporter = getExporter(options.format);
  
  if (!exporter) {
    throw new Error(`Formato ${options.format} no soportado o no implementado.`);
  }

  return await exporter.export(features, sourceProj, options);
}

/**
 * Factoría de exportadores según el formato solicitado.
 */
function getExporter(format: string): Exporter | null {
  switch (format) {
    case 'geojson': return new GeoJSONExporter();
    case 'kml':     return new KMLExporter();
    case 'wkt':     return new WKTExporter();
    case 'shp':     return new SHPExporter();
    case 'gpkg':    return new GPKGExporter();
    default:        return null;
  }
}

// Re-exportamos tipos para uso en componentes UI
export type { ExportOptions };
