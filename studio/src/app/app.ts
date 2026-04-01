import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import ImageWMS from 'ol/source/ImageWMS';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke } from 'ol/style';
import { PluginManagerService } from './core/plugin-manager.service';

import { EventBusService, GeoEvent } from './core/event-bus.service';
import { SplashScreenComponent } from './core/components/splash-screen/splash-screen.component';

import LayerCatalogPlugin from './plugins/layer-catalog.plugin';
import LayerManagerPlugin from './plugins/layer-manager.plugin';
import PluginInfoPlugin from './plugins/plugin-info.plugin';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SplashScreenComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  @ViewChild('mapElement', { static: true }) mapElement!: ElementRef;
  @ViewChild('panelContainer') panelContainer!: ElementRef;

  public uiButtons: any[] = [];
  public uiPanels: any[] = [];
  public statusMessage: string = '';
  public isSidebarVisible = true;

  // Propiedades de la Aplicación (.gapp)
  public appTitle = 'Cargando...';
  public appSlogan = '';
  public appLogo = 'logo-geowe.png';
  public showPluginManagement = true;
  private currentAppManifest: any = null;

  public map!: Map;

  constructor(

    private pluginManager: PluginManagerService,
    private eventBus: EventBusService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) { }

  async ngOnInit() {
    this.initMap();
    (window as any).ol = {
      style: { Style, Fill, Stroke }
    };
    this.pluginManager.initContext(this.map);

    this.eventBus.on('ui:statusChanged', (message: string) => {
      this.statusMessage = message;
      this.cdr.detectChanges();
    });

    // Escuchar configuraciones de Aplicación (.gapp)
    this.eventBus.on('app:configApplied', (manifest: any) => {
      this.applyAppConfig(manifest);
    });

    // Escuchar recarga de plugins internos (necesario al limpiar la app)
    this.eventBus.on('app:reloadInternalPlugins', () => {
      this.loadInternalPlugin();
    });


    this.eventBus.on('ui:changed', () => {
      this.uiButtons = [...this.pluginManager.getUIButtons()];
      this.cdr.detectChanges();
    });

    this.eventBus.on('ui:panelsChanged', () => {
      this.uiPanels = this.pluginManager.getUIPanels().map(p => ({
        ...p,
        safeContent: this.sanitizer.bypassSecurityTrustHtml(p.content)
      }));
      this.cdr.detectChanges();

      // Execute onRender for panels
      setTimeout(() => {
        this.uiPanels.forEach(p => {
          const el = document.getElementById(`panel-body-${p.id}`);
          if (el && p.onRender) p.onRender(el);
        });
      }, 0);
    });

    this.eventBus.on('layer:addWMS', (payload: any) => {
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
    });

    this.eventBus.on('layer:addVector', (payload: any) => {
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

      // Auto zoom to layer extent
      const extent = vectorSource.getExtent();
      if (extent) {
        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 1000
        });
      }
    });

    this.eventBus.on('layer:remove', (payload: any) => {
      const layers = this.map.getLayers().getArray();
      const layerToRemove = layers.find((l: any) => l.get('name') === payload.name);
      if (layerToRemove) {
        this.map.removeLayer(layerToRemove);
        this.eventBus.emit({ type: 'layer:changed' });
      }
    });

    this.pluginManager.pluginContext.ui.setStatus('Inicializando plataforma GeoWE...');

    // 1. Cargar configuración base
    try {
      const response = await fetch('config/default-app.json');
      if (response.ok) {
        const defaultManifest = await response.json();
        this.applyAppConfig(defaultManifest);
      }
    } catch (e) {
      console.error('No se pudo cargar la configuración por defecto', e);
    }

    // 2. Cargar plugin interno por defecto (Layer Catalog PNOA/IGN/Catastro)
    this.loadInternalPlugin();

    // 3. Auto-carga desde parámetros URL (Fase 17)
    // Soportamos ?load=, ?plugin=, ?app= o ?ext=
    const params = new URLSearchParams(window.location.search);
    const remoteUrl = params.get('load') || params.get('plugin') || params.get('app') || params.get('ext');
    if (remoteUrl) {
      this.pluginManager.pluginContext.ui.setStatus('Auto-cargando extensión remota...');
      // setTimeout ayuda a asegurar que los componentes de la vista están listos
      setTimeout(async () => {
        await this.pluginManager.loadRemotePlugin(remoteUrl);
        this.eventBus.emit({ type: 'app:loadingEnd' });
      }, 500);
    } else {
      // Si no hay carga remota, forzamos el fin de la carga para que el splash desaparezca tras iniciar el core
      setTimeout(() => this.eventBus.emit({ type: 'app:loadingEnd' }), 500);
    }
  }



  private initMap() {
    this.map = new Map({
      target: this.mapElement.nativeElement,
      layers: [
        new TileLayer({
          source: new OSM(),
          properties: { name: "OSM" }
        })
      ],
      view: new View({
        center: fromLonLat([-3.703790, 40.416775]), // Madrid
        zoom: 6
      })
    });
  }

  private loadInternalPlugin() {
    this.pluginManager.loadPluginFromModule({ default: LayerManagerPlugin });
    this.pluginManager.loadPluginFromModule({ default: LayerCatalogPlugin });
    this.pluginManager.loadPluginFromModule({ default: PluginInfoPlugin });
  }



  public executeCommand(id: string) {
    const btn = this.uiButtons.find(b => b.id === id);
    const commandId = btn ? btn.commandId : id;

    // Auto-abrir sidebar si el comando es del catálogo y está oculta
    if (id === 'open-layer-catalog' && !this.isSidebarVisible) {
      this.isSidebarVisible = true;
    }

    (this.pluginManager as any).pluginContext.commands.execute(commandId);
  }

  public toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    // Forzar actualización del mapa tras el cambio de layout
    setTimeout(() => {
      if (this.map) this.map.updateSize();
    }, 100);
  }



  public async loadRemote(urlInput: string) {
    if (!urlInput) return;
    await this.pluginManager.loadRemotePlugin(urlInput);
  }

  public onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.js') || fileName.endsWith('.zip') || fileName.endsWith('.gplugin') || fileName.endsWith('.gext') || fileName.endsWith('.gapp')) {
        this.pluginManager.loadLocalPlugin(file);
      } else {
        alert('Por favor, selecciona un archivo .js, .zip, .gplugin, .gext o .gapp');
      }
    }
  }



  public togglePanelExpansion(id: string) {
    const panel = this.uiPanels.find(p => p.id === id);
    if (panel) {
      panel.isExpanded = !panel.isExpanded;
    }
  }

  public hasActiveModal(): boolean {
    return this.uiPanels.some(p => p.isModal);
  }

  public closePanel(id: string) {
    (this.pluginManager as any).pluginContext.ui.removePanel(id);
    this.eventBus.emit({ type: 'ui:panelClosed', payload: id });
  }

  public applyAppConfig(manifest: any) {
    this.currentAppManifest = manifest;
    this.appTitle = manifest.name || this.appTitle;
    this.appSlogan = manifest.slogan || this.appSlogan;
    this.showPluginManagement = manifest.config?.showPluginManagement !== false;

    if (manifest.logoRaw) {
      this.appLogo = manifest.logoRaw;
    }

    this.pluginManager.pluginContext.ui.setStatus(`Aplicación '${this.appTitle}' cargada`);
    this.cdr.detectChanges();
  }


  public showAppInfo() {
    if (!this.currentAppManifest) return; // Por seguridad si se pulsa antes de cargar


    this.pluginManager.pluginContext.ui.addModal({
      id: 'app-info-modal',
      title: `Información de la App: ${this.appTitle}`,
      content: `
        <div style="padding:15px; text-align:center">
          <img src="${this.appLogo}" style="height:160px; margin-bottom:15px">
          <h3>${this.appTitle}</h3>
          <p style="color:#666; font-style:italic">${this.appSlogan}</p>
          <hr style="margin:15px 0; border:0; border-top:1px solid #eee">
          <p style="text-align:left; font-size:14px">${this.currentAppManifest.description || 'Sin descripción disponible.'}</p>
          <p style="text-align:left; font-size:12px; color:#999; margin-top:10px">ID: ${this.currentAppManifest.id} | Versión: ${this.currentAppManifest.version || '1.0.0'}</p>
          <div style="margin-top:20px; display:flex; justify-content:center">
             <button id="close-app-info" class="geowe-ui-btn geowe-ui-btn-primary">Cerrar</button>
          </div>
        </div>
      `,
      onRender: (el) => {
        el.querySelector('#close-app-info')?.addEventListener('click', () => {
          this.pluginManager.pluginContext.ui.removePanel('app-info-modal');
        });
      }
    });
  }

}

