import { GeoJSON, KML, WKT } from 'ol/format';
import { get as getProjection } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import { GeoPackage, GeoPackageAPI, setSqljsWasmLocateFile } from '@ngageoint/geopackage';
// @ts-ignore
import { zip as zipShp } from '@mapbox/shp-write';

// Inicialización de Proj4
register(proj4);

// Configuración de motor SQLite WASM para GeoPackage en navegador
setSqljsWasmLocateFile((file: string) => `https://unpkg.com/rtree-sql.js@1.7.0/dist/sql-wasm.wasm`);

proj4.defs([
  ["EPSG:25829", "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
  ["EPSG:25830", "+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
  ["EPSG:25831", "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
  ["EPSG:4258", "+proj=longlat +ellps=GRS80 +no_defs"]
]);

// Obligar a OpenLayers a reconocer las nuevas definiciones inmediatamente
["EPSG:25829", "EPSG:25830", "EPSG:25831", "EPSG:4258"].forEach(code => {
  register(proj4); // Re-registrar para asegurar vínculo
});

export interface ExportOptions {
  filename: string;
  format: 'geojson' | 'shp' | 'kml' | 'wkt' | 'gpkg';
  projectionCode: string;
}

export const COMMON_PROJECTIONS = [
  { code: 'EPSG:4326', name: 'WGS 84 (Geográficas)' },
  { code: 'EPSG:3857', name: 'Web Mercator' },
  { code: 'EPSG:25830', name: 'ETRS89 / UTM zone 30N (España Peninsular)' },
  { code: 'EPSG:25829', name: 'ETRS89 / UTM zone 29N (Galicia/Portugal)' },
  { code: 'EPSG:25831', name: 'ETRS89 / UTM zone 31N (Baleares/Cataluña)' },
  { code: 'EPSG:4258', name: 'ETRS89 (Geográficas)' }
];

export async function exportLayer(features: any[], sourceProj: string, options: ExportOptions) {
  const targetProj = getProjection(options.projectionCode);
  if (!targetProj) throw new Error(`Proyección ${options.projectionCode} no soportada`);

  // Clonar y convertir features a un objeto GeoJSON (en su proyección original del mapa)
  const format = new GeoJSON();
  const geojson = format.writeFeaturesObject(features);

  // Reprovección manual usando Proj4 directamente para evitar errores de vinculación en OpenLayers
  if (sourceProj !== options.projectionCode) {
    reprojectGeoJSON(geojson, sourceProj, options.projectionCode);
  }

  switch (options.format) {
    case 'geojson':
      downloadFile(JSON.stringify(geojson, null, 2), `${options.filename}.geojson`, 'application/json');
      break;
    
    case 'kml':
      const kmlFormat = new KML();
      // Leemos de nuevo los features desde el GeoJSON ya re-proyectado manualmente
      const reprojectedFeatures = format.readFeatures(geojson);
      const kml = kmlFormat.writeFeatures(reprojectedFeatures);
      downloadFile(kml, `${options.filename}.kml`, 'application/vnd.google-earth.kml+xml');
      break;

    case 'wkt':
      const wktFormat = new WKT();
      const wkt = wktFormat.writeFeatures(features, {
        featureProjection: sourceProj,
        dataProjection: options.projectionCode
      });
      downloadFile(wkt, `${options.filename}.wkt`, 'text/plain');
      break;

    case 'shp':
      zipShp(geojson, {
        folder: options.filename,
        filename: options.filename,
        outputType: 'blob',
        compression: 'STORE'
      }).then((content: any) => {
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${options.filename}.zip`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      });
      break;

    case 'gpkg':
      const gpkgName = `${options.filename}.gpkg`;
      
      // 1. Registro dinámico en el motor de GeoPackage clases (para reproyección Proj4)
      const SRS_METADATA: Record<string, any> = {
        'EPSG:25829': {
          name: 'ETRS89 / UTM zone 29N',
          id: 25829,
          wkt: `PROJCS["ETRS89 / UTM zone 29N",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-9],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1],AUTHORITY["EPSG","25829"]]`,
          proj4: '+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
        },
        'EPSG:25830': {
          name: 'ETRS89 / UTM zone 30N',
          id: 25830,
          wkt: `PROJCS["ETRS89 / UTM zone 30N",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-3],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1],AUTHORITY["EPSG","25830"]]`,
          proj4: '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
        },
        'EPSG:25831': {
          name: 'ETRS89 / UTM zone 31N',
          id: 25831,
          wkt: `PROJCS["ETRS89 / UTM zone 31N",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",3],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1],AUTHORITY["EPSG","25831"]]`,
          proj4: '+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
        }
      };
      
      const targetSrs = SRS_METADATA[options.projectionCode];
      if (targetSrs) {
        // @ts-ignore
        GeoPackage.addProjection(options.projectionCode, targetSrs.proj4);
      }

      // 2. Para GeoPackage, generamos un GeoJSON en WGS84 temporalmente.
      const gpkgGeoJSON = format.writeFeaturesObject(features);
      if (sourceProj !== 'EPSG:4326') {
        reprojectGeoJSON(gpkgGeoJSON, sourceProj, 'EPSG:4326');
      }

      GeoPackageAPI.create().then(async (gpkg: any) => {
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
        
        // Detección automática de columnas a partir de las propiedades del primer objeto
        const columns: any[] = [];
        if (featuresToAdd.length > 0 && featuresToAdd[0].properties) {
          const props = featuresToAdd[0].properties;
          for (const key in props) {
            const val = props[key];
            let dataType = 'TEXT'; // Por defecto
            
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

        gpkg.createFeatureTable(options.filename, undefined, columns, undefined, srsId);
        
        // El motor GPKG realiza la re-proyección interna desde 4326 al srsId
        await gpkg.addGeoJSONFeaturesToGeoPackage(featuresToAdd, options.filename);
        const content = await gpkg.export();
        
        const blob = new Blob([content], { type: 'application/x-sqlite3' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = gpkgName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }).catch(err => {
        console.error('Error generando GeoPackage:', err);
      });
      break;

    default:
      throw new Error(`Formato ${options.format} no implementado aún.`);
  }
}

function reprojectGeoJSON(geojson: any, sourceProj: string, targetProj: string) {
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

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
