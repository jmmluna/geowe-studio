import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProjectionRegistry } from './core/projection-registry';
import { PluginManagerService } from './core/plugin-manager.service';

import { EventBusService, GeoEvent } from './core/event-bus.service';
import { SplashScreenComponent } from './core/components/splash-screen/splash-screen.component';
import { ProjectionSelectorComponent } from './core/components/projection-selector/projection-selector.component';
import { GisService } from './core/gis.service';

import LayerCatalogPlugin from './plugins/layer-catalog.plugin';
import LayerManagerPlugin from './plugins/layer-manager.plugin';
import HubManagerPlugin from './plugins/hub-manager.plugin';
import { PluginContainerDirective } from './core/directives/sidebar-container.directive';
import { FileDropDirective } from './core/directives/file-drop.directive';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SplashScreenComponent, PluginContainerDirective, FileDropDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  @ViewChild('mapElement', { static: true }) mapElement!: ElementRef;
  @ViewChild('panelContainer') panelContainer!: ElementRef;

  public uiButtons: any[] = [];
  public uiPanels: any[] = [];
  public sidebarSections: any[] = [];
  public sidebarPanels: any[] = [];
  public activeSidebarId = 'default';
  public statusMessage: string = '';
  private statusTimeout: any;
  public isSidebarVisible = true;

  // Propiedades de la Aplicación (.gapp)
  public appTitle = 'GeoWE Studio';
  public appSlogan = '';
  public appLogo = 'logo-geowe.png';
  public showPluginManagement = true;
  private currentAppManifest: any = null;

  public trackById(index: number, item: any): string {
    return item.id;
  }

  public map!: any;

  constructor(

    private pluginManager: PluginManagerService,
    private gisService: GisService,
    private eventBus: EventBusService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) { }

  async ngOnInit() {
    // Inicializar el registro de proyecciones (UTM, etc.)
    ProjectionRegistry.registerAll();

    this.initMap();
    this.pluginManager.initContext(this.map, { title: this.appTitle, logo: this.appLogo });

    // Registro de comandos Core de UI para plugins
    const ctx = this.pluginManager.pluginContext;
    ctx.commands.register('ui:openSidebar', () => {
      this.isSidebarVisible = true;
      this.cdr.detectChanges();
    });
    ctx.commands.register('ui:activePluginSidebar', (id: string) => this.activePluginSidebar(id));
    ctx.commands.register('ui:resetSidebar', () => {
      this.resetSidebar();
      // Desactivar botones de plugins que lanzan sidebars
      this.uiButtons.forEach(btn => btn.isActive = false);
      this.cdr.detectChanges();
    });

    this.eventBus.on('ui:statusChanged', (message: string) => {
      this.statusMessage = message;
      this.cdr.detectChanges();

      if (this.statusTimeout) {
        clearTimeout(this.statusTimeout);
      }

      // Auto-ocultar mensajes que no sean errores críticos después de 4 segundos
      if (message && !message.toLowerCase().includes('error')) {
        this.statusTimeout = setTimeout(() => {
          this.statusMessage = '';
          this.cdr.detectChanges();
        }, 4000);
      }
    });

    this.eventBus.on('ui:sidebarSectionsChanged', () => {
      this.sidebarSections = this.pluginManager.getSidebarSections();
      this.cdr.detectChanges();
    });

    this.eventBus.on('ui:sidebarPanelsChanged', () => {
      this.sidebarPanels = this.pluginManager.getSidebarPanels().map(p => ({
        ...p,
        safeContent: this.sanitizer.bypassSecurityTrustHtml(p.content)
      }));
      this.cdr.detectChanges();
    });

    // Escuchar cuando CUALQUIER contenedor de plugin está listo en el DOM (Mediante Directiva Universal)
    this.eventBus.on('ui:pluginContainerReady', (payload: { id: string, el: HTMLElement }) => {
      // 1. Buscar en sidebars
      const sidebar = this.sidebarPanels.find(p => p.id === payload.id);
      if (sidebar && sidebar.onRender) {
        sidebar.onRender(payload.el);
        return;
      }

      // 2. Buscar en paneles/modales
      const panel = this.uiPanels.find(p => p.id === payload.id);
      if (panel && panel.onRender) {
        panel.onRender(payload.el);
      }
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
    });
    this.eventBus.on('layer:addWMS', (payload: any) => {
      this.gisService.addWMSLayer(payload);
    });

    this.eventBus.on('layer:addVector', (payload: any) => {
      this.gisService.addVectorLayer(payload);
    });

    this.eventBus.on('layer:remove', (payload: any) => {
      this.gisService.removeLayerByName(payload.name);
    });

    this.eventBus.on('layer:setStyle', (payload: { name: string, style: any }) => {
      this.gisService.updateLayerStyle(payload);
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
    this.map = this.gisService.createMap(this.mapElement.nativeElement);
  }

  private loadInternalPlugin() {
    this.pluginManager.loadPluginFromModule({ default: LayerManagerPlugin });
    this.pluginManager.loadPluginFromModule({ default: LayerCatalogPlugin });
    this.pluginManager.loadPluginFromModule({ default: HubManagerPlugin });
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
    this.eventBus.emit({ type: 'ui:sidebarChanged', payload: { activeId: this.activeSidebarId, isVisible: this.isSidebarVisible } });
    // Forzar actualización del mapa tras el cambio de layout
    setTimeout(() => {
      if (this.map) this.map.updateSize();
    }, 100);
    this.cdr.detectChanges();
    this.pluginManager.updateAppInfo({ title: this.appTitle, logo: this.appLogo });
  }

  public toggleSidebarSection(id: string) {
    const section = this.sidebarSections.find(s => s.id === id);
    if (section) {
      section.isOpen = !section.isOpen;

      if (section.isOpen && section.onRender) {
        setTimeout(() => {
          const el = document.getElementById(`sidebar-body-${section.id}`);
          if (el) section.onRender(el);
        }, 50);
      }
    }
  }

  public activePluginSidebar(id: string) {
    // Comportamiento de Toggle: si ya está activo y visible, cerramos o volvemos a default
    if (this.activeSidebarId === id && this.isSidebarVisible) {
      this.resetSidebar();
      return;
    }

    this.activeSidebarId = id;
    this.isSidebarVisible = true;

    // Sincronizar estado visual de los botones de la barra de herramientas (Desacoplado)
    this.uiButtons.forEach(btn => {
      btn.isActive = (btn.activeOnSidebarId === id) || (btn.id === id);
    });

    const panel = this.sidebarPanels.find(p => p.id === id);
    this.eventBus.emit({ type: 'ui:sidebarChanged', payload: { activeId: id, isVisible: this.isSidebarVisible } });
    this.cdr.detectChanges();
  }

  public resetSidebar() {
    this.activeSidebarId = 'default';
    this.uiButtons.forEach(btn => btn.isActive = false);
    this.eventBus.emit({ type: 'ui:sidebarChanged', payload: { activeId: 'default', isVisible: this.isSidebarVisible } });
    this.cdr.detectChanges();
  }

  public async loadRemote(urlInput: string) {
    if (!urlInput) return;
    await this.pluginManager.loadRemotePlugin(urlInput);
  }

  private async processSpatialFile(file: File) {
    try {
      this.pluginManager.pluginContext.ui.setStatus(`Cargando archivo: ${file.name}...`);

      await this.gisService.loadFile(file, (filename, detection) => {
        return this.showProjectionSelector(filename, detection);
      });

      this.pluginManager.pluginContext.ui.setStatus(`Archivo cargado con éxito: ${file.name}`);
    } catch (err: any) {
      console.error('Error al procesar archivo GIS:', err);
      this.pluginManager.pluginContext.ui.setStatus(`Error al leer archivo: ${err.message}`);
    }
  }

  private showProjectionSelector(filename: string, detection: any): Promise<string> {
    return new Promise((resolve) => {
      const modalId = 'projection-selector-' + Date.now();

      this.pluginManager.pluginContext.ui.addModal({
        id: modalId,
        title: `PROYECCIÓN (EPSG)`,
        component: ProjectionSelectorComponent,
        inputs: {
          filename: filename,
          recommendedCode: detection.code,
          probableType: detection.probableType
        }
      });

      // Escuchamos la selección a través del EventBus (desacoplado)
      const sub = this.eventBus.on('ui:projectionSelected', (code: string) => {
        this.pluginManager.pluginContext.ui.removePanel(modalId);
        resolve(code);
      });
    });
  }

  public onFileDropped(files: FileList) {
    if (files && files.length > 0) {
      const STUDIO_EXTS = ['.gplugin', '.gext', '.gapp', '.zip', '.js'];
      const GIS_EXTS = ['.geojson', '.json', '.kml', '.gpx', '.wkt'];

      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (!file) continue;

        const fileName = file.name.toLowerCase();

        if (STUDIO_EXTS.some(ext => fileName.endsWith(ext))) {
          this.pluginManager.loadLocalPlugin(file);
        } else if (GIS_EXTS.some(ext => fileName.endsWith(ext))) {
          this.processSpatialFile(file);
        } else {
          let handled = false;
          this.eventBus.emit({
            type: 'app:unhandledDrop',
            payload: { file, markHandled: () => handled = true }
          });

          if (!handled) {
            this.statusMessage = `Error: El archivo "${file.name}" no es un formato válido para GeoWE Studio.`;
            this.pluginManager.pluginContext.ui.setStatus(this.statusMessage);
          }
        }
      }
    }
  }

  public onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.js') || fileName.endsWith('.zip') || fileName.endsWith('.gplugin') || fileName.endsWith('.gext') || fileName.endsWith('.gapp')) {
          this.pluginManager.loadLocalPlugin(file);
        }
      }
      this.statusMessage = `${files.length} archivos procesados`;
      this.cdr.detectChanges();
      event.target.value = '';
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

