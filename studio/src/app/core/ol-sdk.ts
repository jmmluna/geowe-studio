import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';

// Layers
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';

// Sources
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import ImageWMS from 'ol/source/ImageWMS';
import XYZ from 'ol/source/XYZ';

// Geometries
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import CircleGeom from 'ol/geom/Circle';

// Styles
import { Style, Fill, Stroke, Circle as CircleStyle, Icon, Text } from 'ol/style';

/**
 * SDK de OpenLayers seleccionado para ser inyectado en plugins.
 * Esto evita el uso de variables globales y centraliza las dependencias.
 */
export const MapSDK = {
  Map,
  View,
  Feature,
  format: {
    GeoJSON
  },
  proj: {
    fromLonLat
  },
  layer: {
    Tile: TileLayer,
    Vector: VectorLayer,
    Image: ImageLayer
  },
  source: {
    Vector: VectorSource,
    OSM: OSM,
    ImageWMS: ImageWMS,
    XYZ: XYZ
  },
  geom: {
    Point,
    LineString,
    Polygon,
    Circle: CircleGeom
  },
  style: {
    Style,
    Fill,
    Stroke,
    Circle: CircleStyle,
    Icon,
    Text
  }
};
