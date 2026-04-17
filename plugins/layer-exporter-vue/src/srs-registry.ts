import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';

// Definiciones de proyecciones comunes para GeoWE
export const SRS_DEFINITIONS = [
  ["EPSG:25829", "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
  ["EPSG:25830", "+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
  ["EPSG:25831", "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
  ["EPSG:4258", "+proj=longlat +ellps=GRS80 +no_defs"]
];

/**
 * Inicializa el registro de proyecciones en Proj4 y OpenLayers.
 */
export function initializeSrsRegistry() {
  proj4.defs(SRS_DEFINITIONS as any);
  register(proj4);
}

export interface SrsMetadata {
    name: string;
    id: number;
    wkt: string;
    proj4: string;
}

/**
 * Metadatos extendidos (WKT) necesarios para formatos como GeoPackage.
 */
export const SRS_METADATA: Record<string, SrsMetadata> = {
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
  },
  'EPSG:4258': {
    name: 'ETRS89 (Geográficas)',
    id: 4258,
    wkt: `GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433],AUTHORITY["EPSG","4258"]]`,
    proj4: '+proj=longlat +ellps=GRS80 +no_defs'
  }
};
