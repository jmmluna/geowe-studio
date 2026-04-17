import { Injectable } from '@angular/core';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { GeoJSON, KML, GPX, WKT } from 'ol/format';
import { Style, Fill, Stroke } from 'ol/style';
import { ProjectionRegistry } from './projection-registry';
import { EventBusService } from './event-bus.service';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { ScaleLine } from 'ol/control';

/**
 * GisService: Autoridad central para operaciones GIS en GeoWE Studio.
 * Se encarga de la carga de archivos, creación de capas, gestión de metadatos
 * y utilidades comunes de mapa (zoom, fit, etc.), desacoplando el núcleo
 * de los detalles de implementación de OpenLayers.
 */
@Injectable({
  providedIn: 'root'
})
export class GisService {
  public map: any;

  constructor(private eventBus: EventBusService) {}

  /**
   * Inicializa el mapa y lo ancla al contenedor HTML proporcionado.
   */
  public createMap(target: HTMLElement): any {
    this.map = new Map({
      target: target,
      layers: [
        new TileLayer({
          source: new OSM(),
          properties: { name: "OSM" }
        })
      ],
      view: new View({
        center: fromLonLat([-3.703790, 40.416775]), // Madrid
        zoom: 6
      }),
      controls: [
        new ScaleLine()
      ]
    });
    return this.map;
  }

  /**
   * Carga un archivo espacial y añade la capa resultante al mapa.
   */
  public async loadFile(file: File, onProjectionNeeded: (filename: string, detection: any) => Promise<string>): Promise<void> {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async (e: any) => {
        try {
          const text = e.target.result;
          const fileName = file.name;
          const formatInfo = this.getFormatForFile(fileName);
          
          if (!formatInfo) {
            throw new Error('Formato de archivo no soportado');
          }

          // Detección de proyección
          const detection = ProjectionRegistry.detectProjection(text, fileName);
          let sourceProjection = detection.code;

          if (!detection.isConfident && onProjectionNeeded) {
            sourceProjection = await onProjectionNeeded(fileName, detection);
          }

          // Parseo de features
          const features = formatInfo.format.readFeatures(text, {
            dataProjection: sourceProjection,
            featureProjection: this.map.getView().getProjection()
          });

          if (features && features.length > 0) {
            const name = fileName.replace(/\.[^/.]+$/, "");
            
            const vectorLayer = this.createVectorLayer(name, features, {
                format: formatInfo.name,
                srs: sourceProjection,
                count: features.length,
                filename: fileName
            });

            this.map.addLayer(vectorLayer);
            this.eventBus.emit({ type: 'layer:changed' });
            
            // Zoom automático al añadir la capa
            this.zoomToLayer(vectorLayer);

            resolve();
          } else {
            throw new Error('No se encontraron datos espaciales válidos');
          }
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsText(file);
    });
  }

  /**
   * Crea una capa vectorial con estilo y metadatos consistentes.
   */
  public createVectorLayer(name: string, features: any[], metadata: any): VectorLayer<any> {
    const vectorSource = new VectorSource({
      features: features
    });

    return new VectorLayer({
      source: vectorSource,
      properties: {
        name: name,
        type: 'vector',
        color: '#3498db',
        metadata: metadata // Inyectamos metadatos PRO
      },
      style: new Style({
        fill: new Fill({ color: 'rgba(52, 152, 219, 0.2)' }),
        stroke: new Stroke({ color: '#3498db', width: 2 }),
      })
    });
  }

  /**
   * Centra el mapa en la extensión de una capa.
   */
  public zoomToLayer(layer: any) {
    if (!layer) return;
    const source = layer.getSource();
    if (source && source.getExtent) {
        this.zoomToExtent(source.getExtent());
    }
  }

  /**
   * Centra el mapa en una extensión específica.
   */
  public zoomToExtent(extent: any) {
    if (extent && this.map) {
      this.map.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 800
      });
    }
  }

  /**
   * Determina el formato adecuado según la extensión del archivo.
   */
  private getFormatForFile(fileName: string): { format: any, name: string } | null {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.kml')) return { format: new KML(), name: 'KML' };
    if (lower.endsWith('.gpx')) return { format: new GPX(), name: 'GPX' };
    if (lower.endsWith('.wkt')) return { format: new WKT(), name: 'WKT' };
    // Por defecto asumimos GeoJSON para otras extensiones .json / .geojson
    return { format: new GeoJSON(), name: 'GeoJSON' };
  }

  public addWMSLayer(payload: any) {
    const wmsLayer = new ImageLayer({
      source: new ImageWMS({
        url: payload.url,
        params: payload.params,
      }),
      properties: {
        name: payload.name,
        type: 'raster'
      }
    });
    this.map.addLayer(wmsLayer);
    this.eventBus.emit({ type: 'layer:changed' });
  }

  public addVectorLayer(payload: any) {
      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(payload.geojson, {
          featureProjection: this.map.getView().getProjection()
        })
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        properties: {
          name: payload.name,
          type: 'vector',
          color: '#3498db'
        },
        style: new Style({
          fill: new Fill({ color: 'rgba(52, 152, 219, 0.2)' }),
          stroke: new Stroke({ color: '#3498db', width: 2 }),
        })
      });

      this.map.addLayer(vectorLayer);
      this.eventBus.emit({ type: 'layer:changed' });
      this.zoomToLayer(vectorLayer);
  }

  public updateLayerStyle(payload: { name: string, style: any }) {
      const layers = this.map.getLayers().getArray();
      const layer = layers.find((l: any) => l.get('name') === payload.name);
      
      if (layer && typeof (layer as any).setStyle === 'function') {
        const s = payload.style;
        (layer as any).setStyle(new Style({
          fill: new Fill({ color: s.fill || 'rgba(52, 152, 219, 0.2)' }),
          stroke: new Stroke({ 
            color: s.stroke || '#3498db', 
            width: s.width || 2 
          }),
        }));
        this.eventBus.emit({ type: 'layer:changed' });
      }
  }

  public removeLayerByName(name: string) {
      const layers = this.map.getLayers().getArray();
      const layerToRemove = layers.find((l: any) => l.get('name') === name);
      if (layerToRemove) {
        this.map.removeLayer(layerToRemove);
        this.eventBus.emit({ type: 'layer:changed' });
      }
  }
}
