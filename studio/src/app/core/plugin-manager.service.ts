import { Injectable } from '@angular/core';
import { GeoWEPlugin, PluginContext } from './plugin-context';
import { EventBusService } from './event-bus.service';
import { GisService } from './gis.service';
import JSZip from 'jszip';
import { MapSDK } from './ol-sdk';



@Injectable({
  providedIn: 'root'
})
export class PluginManagerService {
  private activePlugins = new Map<string, GeoWEPlugin>();
  private uiButtons: any[] = [];
  private uiPanels: any[] = [];
  private sidebarSections: any[] = [];
  private sidebarPanels: any[] = [];
  private layerActions: any[] = [];
  private pluginResources = new Map<string, Map<string, string>>();
  public pluginContext!: PluginContext;
  private olMap: any;
  private disabledPluginIds = new Set<string>();
  private currentPluginContextId: string | null = null;

  private activeLoads: number = 0;

  private _incrementLoad() {
    this.activeLoads++;
    if (this.activeLoads === 1) {
      this.eventBus.emit({ type: 'app:loadingStart' });
    }
  }

  private _decrementLoad() {
    this.activeLoads--;
    if (this.activeLoads <= 0) {
      this.activeLoads = 0;
      this.eventBus.emit({ type: 'app:loadingEnd' });
    }
  }


  constructor(private eventBus: EventBusService, private gisService: GisService) { }

  public initContext(mapInstance: any, appInfo: { title: string, logo: string } = { title: 'GeoWE Studio', logo: 'logo-geowe.png' }) {
    this.olMap = mapInstance;

    // Commands and UI state for this MVP
    const commands = new Map<string, (payload?: any) => void>();

    this.pluginContext = {
      map: this.olMap,
      ol: MapSDK,
      layers: {
        addWMSLayer: (name: string, url: string, params: any) => {
          this.eventBus.emit({ type: 'layer:addWMS', payload: { name, url, params } });
        },
        addVectorLayer: (name: string, geojson: any) => {
          this.eventBus.emit({ type: 'layer:addVector', payload: { name, geojson } });
        },
        removeLayer: (name: string) => {
          this.eventBus.emit({ type: 'layer:remove', payload: { name } });
        },
        getAll: () => {
          return this.olMap.getLayers().getArray().map((layer: any) => {
            const name = layer.get('name') || 'Capa sin nombre';
            // Determinar tipo usando metadatos inyectados para evitar problemas de minificación
            const type = layer.get('type') || (layer.constructor.name.includes('Vector') ? 'vector' : 'raster');

            // Intentar obtener un color representativo para vectores
            let color = undefined;
            if (type === 'vector') {
              const style = layer.getStyle();
              if (typeof style === 'function') {
                // Si es función, es difícil sacar uno fijo sin ejecutarla
                color = '#3498db';
              } else if (style) {
                const fill = style.getFill();
                color = fill ? fill.getColor() : '#3498db';
              }
            }

            return {
              name,
              type,
              visible: layer.getVisible(),
              color,
              metadata: layer.get('metadata') // Extraemos los metadatos PRO 
            };
          });
        },
        setVisible: (name: string, visible: boolean) => {
          const layer = this.olMap.getLayers().getArray().find((l: any) => l.get('name') === name);
          if (layer) layer.setVisible(visible);
        },
        setStyle: (name: string, style: { fill?: string, stroke?: string, width?: number }) => {
          this.eventBus.emit({ type: 'layer:setStyle', payload: { name, style } });
        },
        zoomToLayer: (name: string) => {
          const layer = this.olMap.getLayers().getArray().find((l: any) => l.get('name') === name);
          if (layer) {
            this.gisService.zoomToLayer(layer);
          }
        }
      },
      ui: {
        addButton: (options: { id: string, label: string, icon?: string, commandId: string, activeOnSidebarId?: string }) => {
          this.uiButtons.push({ ...options, ownerId: this.currentPluginContextId });
          this.eventBus.emit({ type: 'ui:changed' });
        },

        removeButton: (id: string) => {
          this.uiButtons = this.uiButtons.filter(b => b.id !== id);
          this.eventBus.emit({ type: 'ui:changed' });
        },

        addPanel: (options: { id: string, title: string, content?: string, component?: any, inputs?: any, isModal?: boolean, onRender?: (el: HTMLElement) => void }) => {
          // Si ya existe un panel con ese ID, lo reemplazamos para actualizar contenido
          const index = this.uiPanels.findIndex(p => p.id === options.id);
          if (index !== -1) {
            this.uiPanels[index] = { ...options, ownerId: this.currentPluginContextId, isExpanded: this.uiPanels[index].isExpanded !== undefined ? this.uiPanels[index].isExpanded : true };
          } else {
            this.uiPanels.push({ ...options, ownerId: this.currentPluginContextId, isExpanded: true });
          }
          this.eventBus.emit({ type: 'ui:panelsChanged' });
        },

        addModal: (options: { id: string, title: string, content?: string, component?: any, inputs?: any, onRender?: (el: HTMLElement) => void }) => {
          this.pluginContext.ui.addPanel({ ...options, isModal: true });
        },

        removePanel: (id: string) => {
          this.uiPanels = this.uiPanels.filter(p => p.id !== id);
          this.sidebarPanels = this.sidebarPanels.filter(p => p.id !== id);
          this.eventBus.emit({ type: 'ui:panelsChanged' });
          this.eventBus.emit({ type: 'ui:sidebarPanelsChanged' });
        },

        updatePanel: (id: string) => {
          this.eventBus.emit({ type: 'ui:panelsChanged' });
        },

        getUIPanels: () => {
          return this.uiPanels;
        },

        registerLayerAction: (descriptor: { id?: string, label: string, icon?: string, supportedLayerTypes?: ('vector' | 'raster')[], callback: (layerName: string) => void }) => {
          // Asegurar un ID técnico predecible si no se proporciona uno
          const actionId = descriptor.id || descriptor.label.toLowerCase().trim().replace(/\s+/g, '-');
          
          this.layerActions.push({ 
            ...descriptor, 
            id: actionId, 
            ownerId: this.currentPluginContextId,
            // Por defecto, asumimos capas vectoriales si no se especifica
            supportedLayerTypes: descriptor.supportedLayerTypes || ['vector']
          });
          
          this.eventBus.emit({ type: 'ui:layerActionsChanged' });
        },

        getLayerActions: () => {
          return this.layerActions;
        },

        setStatus: (message: string) => {
          this.eventBus.emit({ type: 'ui:statusChanged', payload: message });
        },

        setButtonActive: (id: string, active: boolean) => {
          const btn = this.uiButtons.find(b => b.id === id);
          if (btn) btn.isActive = active;
          this.eventBus.emit({ type: 'ui:changed' });
        },

        addStyles: (css: string) => {
          const style = document.createElement('style');
          style.innerHTML = css;
          document.head.appendChild(style);
        },

        addSidebarSection: (options) => {
          this.sidebarSections.push({ ...options, ownerId: this.currentPluginContextId });
          this.eventBus.emit({ type: 'ui:sidebarChanged' });
        },

        registerSidebar: (options: { id: string, title: string, icon: string, content: string, onRender?: (el: HTMLElement) => void }) => {
          const index = this.sidebarPanels.findIndex(p => p.id === options.id);
          if (index !== -1) {
            this.sidebarPanels[index] = { ...this.sidebarPanels[index], ...options };
          } else {
            this.sidebarPanels.push(options);
          }
          this.eventBus.emit({ type: 'ui:sidebarPanelsChanged' });
        },

        removeSidebar: (id: string) => {
          this.sidebarPanels = this.sidebarPanels.filter(p => p.id !== id);
          this.eventBus.emit({ type: 'ui:sidebarPanelsChanged' });
        },

        components: {
          button: (label, icon, type, id) => `<button class="geowe-ui-btn geowe-ui-btn-${type || 'primary'}" ${id ? `id="${id}"` : ''}>${icon ? `<span class="material-icons">${icon}</span>` : ''}${label}</button>`,

          checkbox: (label, checked, id, dataAttrs) => {
            const attrs = dataAttrs ? Object.entries(dataAttrs).map(([k, v]) => `data-${k}="${v}"`).join(' ') : '';
            return `
            <label class="geowe-ui-checkbox" ${id ? `id="label-${id}"` : ''} ${attrs}>
              <input type="checkbox" ${checked ? 'checked' : ''} ${id ? `id="${id}"` : ''}>
              <span class="geowe-ui-checkbox-box"></span>
              ${label}
            </label>
          `},

          input: (placeholder, value, type, id) => {
            if (type === 'file') {
              const fileId = id || `file-${Math.random().toString(36).substr(2, 9)}`;
              return `
                <div class="geowe-ui-file-container" style="margin-top: 10px;">
                  <input type="file" id="${fileId}" class="geowe-ui-file-input" style="display:none">
                  <label for="${fileId}" class="geowe-ui-file-label" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; border: 2px dashed #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; background: #f8fafc; color: #64748b;">
                    <span class="material-icons" style="font-size: 32px; margin-bottom: 8px; color: #3182ce;">cloud_upload</span>
                    <span style="font-size: 14px; font-weight: 600;">${placeholder || 'Seleccionar archivo'}</span>
                    <span style="font-size: 12px; margin-top: 4px; opacity: 0.7;">Formato .geojson o .json</span>
                  </label>
                </div>
              `;
            }
            return `<input class="geowe-ui-input" type="${type || 'text'}" placeholder="${placeholder}" value="${value || ''}" ${id ? `id="${id}"` : ''}>`;
          },

          section: (title, icon, content) => `
            <div class="geowe-ui-section">
              <div class="geowe-ui-section-header">
                <span class="material-icons">${icon}</span>
                <span>${title}</span>
              </div>
              <div class="geowe-ui-section-content">${content}</div>
            </div>
          `,

          row: (content: string[]) => `<div class="geowe-ui-row">${content.join('')}</div>`
        }
      },
      commands: {
        register: (id: string, action: (payload?: any) => void) => {
          commands.set(id, action);
        },
        execute: (id: string, payload?: any) => {
          const action = commands.get(id);
          if (action) {
            action(payload);
          } else {
            // Si el comando no está registrado en el contexto actual, intentamos en el bus global
            this.eventBus.emit({ type: 'command:execute', payload: { id, payload } });
          }
        }
      },
      events: {
        on: (type: string, handler: (payload: any) => void) => {
          this.eventBus.on(type, handler);
        },
        emit: (type: string, payload?: any) => {
          this.eventBus.emit({ type, payload });
        }
      },
      plugins: {
        getActive: () => {
          return Array.from(this.activePlugins.values()).map(p => ({
            id: p.id,
            name: p.name,
            version: (p as any).version
          }));
        },
        loadRemote: (url: string) => this.loadRemotePlugin(url),
        unload: (id: string) => this.unloadPlugin(id)
      },
      resources: {
        getTemplate: (name: string) => {
          // Primero buscamos el recurso de forma global por nombre
          for (const pluginStore of this.pluginResources.values()) {
            if (pluginStore.has(name)) return pluginStore.get(name);
          }
          return undefined;
        }
      },
      app: appInfo
    };
  }

  public async unloadPlugin(id: string) {
    const plugin = this.activePlugins.get(id);
    if (!plugin) return;

    console.log(`Unloading plugin: ${id}`);

    try {
      if (typeof plugin.deactivate === 'function') {
        await plugin.deactivate(this.pluginContext);
      }
      
      // Limpieza automática de UI añadida por el plugin
      this.uiButtons = this.uiButtons.filter(b => (b as any).ownerId !== id);
      this.uiPanels = this.uiPanels.filter(p => (p as any).ownerId !== id);
      this.sidebarSections = this.sidebarSections.filter(s => (s as any).ownerId !== id);
      this.sidebarPanels = this.sidebarPanels.filter(p => (p as any).ownerId !== id);
      this.layerActions = this.layerActions.filter(a => (a as any).ownerId !== id);

      this.activePlugins.delete(id);
      this.eventBus.emit({ type: 'plugin:unloaded', payload: id });
      this.eventBus.emit({ type: 'ui:changed' });
      this.eventBus.emit({ type: 'ui:panelsChanged' });
      this.eventBus.emit({ type: 'ui:sidebarChanged' });
      this.eventBus.emit({ type: 'ui:sidebarPanelsChanged' });
      this.eventBus.emit({ type: 'ui:layerActionsChanged' });
      
      this.pluginContext.ui.setStatus(`Plugin '${plugin.name || id}' desinstalado`);
    } catch (error) {
      console.error(`Error deactivating plugin ${id}:`, error);
    }
  }


  public resetEnvironment() {
    this.activePlugins.clear();
    this.uiButtons = [];
    this.uiPanels = [];
    this.layerActions = [];
    // Mantener disabledPluginIds intacto temporalmente si se reinicia a mitad,
    // Pero en una nueva app se repoblará. Es mejor limpiarlo y dejar que la app lo llene.
    this.disabledPluginIds.clear();

    this.eventBus.emit({ type: 'ui:changed' });
    this.eventBus.emit({ type: 'ui:panelsChanged' });
    console.log("[PluginManager] Entorno reiniciado");
  }

  public getSidebarSections() {
    return this.sidebarSections;
  }

  public getSidebarPanels() {
    return this.sidebarPanels;
  }

  public updateAppInfo(appInfo: { title: string, logo: string }) {
    if (this.pluginContext) {
      this.pluginContext.app = appInfo;
    }
  }

  public getUIButtons() {
    return this.uiButtons;
  }


  public getUIPanels() {
    return this.uiPanels;
  }

  public getLayerActions() {
    return this.layerActions;
  }

  public async loadPluginFromModule(module: any): Promise<void> {
    const plugin: GeoWEPlugin = module.default;
    if (!plugin || !plugin.id) {
      throw new Error("Invalid plugin format. Must export default { id, activate, deactivate }");
    }

    if (this.disabledPluginIds.has(plugin.id)) {
      console.log(`[PluginManager] Plugin '${plugin.id}' deshabilitado por configuración de App.`);
      return;
    }


    if (this.activePlugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already loaded.`);
      return;
    }

    try {
      if (typeof plugin.activate === 'function') {
        this.currentPluginContextId = plugin.id;
        await plugin.activate(this.pluginContext);
        this.currentPluginContextId = null;
        
        this.activePlugins.set(plugin.id, plugin);
        console.log(`Plugin ${plugin.name || plugin.id} activated successfully.`);
        this.eventBus.emit({ type: 'plugin:loaded', payload: plugin.id });
        
        // Dar feedback al usuario (muy útil para .js individuales o .gplugin)
        this.pluginContext.ui.setStatus(`Plugin '${plugin.name || plugin.id}' activado`);
      }
    } catch (error) {
      console.error(`Failed to activate plugin ${plugin.id}:`, error);
    }
  }

  public async loadRemotePlugin(urlInput: string): Promise<void> {
    this._incrementLoad();
    try {
      let url = urlInput;
      // Autocorrección de URLs web de GitHub a raw.githubusercontent.com para saltar bloqueos CORS
      if (url.includes('github.com') && (url.includes('/raw/') || url.includes('/blob/'))) {
        url = url.replace('github.com', 'raw.githubusercontent.com')
                 .replace('/raw/', '/')
                 .replace('/blob/', '/');
        console.log(`[PluginManager] GitHub URL reescrita a RAW: ${url}`);
      }

      const isBlob = url.startsWith('blob:');
      const isJs = url.split('?')[0].split('#')[0].endsWith('.js');

      const urlLower = url.toLowerCase();
      const isZipBased = urlLower.endsWith('.gplugin') || urlLower.endsWith('.gext') || urlLower.endsWith('.gapp') || urlLower.endsWith('.zip');

      if (isZipBased) {
        try {
          console.log(`[PluginManager] Attempting to download remote package from: ${url}`);
          this.pluginContext.ui.setStatus(`Descargando paquete desde: ${url}`);
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
          const blob = await response.blob();
          
          // Convertir el blob a objeto File para compatibilidad con loadLocalPlugin
          const fileName = url.split('/').pop() || 'remote-package.zip';
          const file = new File([blob], fileName, { type: response.headers.get('content-type') || 'application/zip' });
          
          await this.loadLocalPlugin(file);
          return;
        } catch (e: any) {
          console.error(`[PluginManager] Failed to download package from ${url}:`, e);
          let errorMsg = e.message;
          if (errorMsg === 'Failed to fetch') {
             errorMsg = 'Error de Red / CORS. Asegúrate de que el archivo existe (los 404 cross-origin se reportan como CORS) y que el servidor permite CORS.';
          }
          this.eventBus.emit({ type: 'ui:statusChanged', payload: `Error de descarga: ${errorMsg}` });
          return;
        }
      }

      if (!isBlob && !isJs && (url.endsWith('manifest.json') || !url.includes('.'))) {
        // Intentar como paquete/manifiesto
        const baseUrl = url.endsWith('manifest.json') ? url.replace('manifest.json', '') : (url.endsWith('/') ? url : url + '/');
        await this.loadPackage(baseUrl);
        return;
      }

      console.log(`[PluginManager] Attempting to load dynamic plugin from: ${url}`);

      try {
        let moduleUrl = url;
        if (isJs && !isBlob) {
          // Fix for raw.githubusercontent.com and other hosts returning text/plain instead of JS
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`HTTP Error: ${resp.status}`);
          const text = await resp.text();
          const blob = new Blob([text], { type: 'application/javascript' });
          moduleUrl = URL.createObjectURL(blob);
        }

        const module = await import(moduleUrl);
        await this.loadPluginFromModule(module);

        if (moduleUrl !== url) {
          URL.revokeObjectURL(moduleUrl);
        }
      } catch (e: any) {
        console.error(`[PluginManager] Critical failure loading plugin from ${url}. Error: ${e.message}`, e);
        this.eventBus.emit({ type: 'ui:statusChanged', payload: `Error cargando plugin: ${e.message}` });
      }
    } finally {
      this._decrementLoad();
    }
  }

  public async loadPackage(baseUrl: string): Promise<void> {
    console.log(`[PluginManager] Loading package from: ${baseUrl}`);
    try {
      const resp = await fetch(`${baseUrl}manifest.json`);
      if (!resp.ok) throw new Error(`Could not fetch manifest.json from ${baseUrl}`);

      const manifest = await resp.json();
      console.log(`[PluginManager] Processing manifest for: ${manifest.name || manifest.id}`);

      // Cargar estilos
      if (manifest.styles && Array.isArray(manifest.styles)) {
        for (const cssFile of manifest.styles) {
          const cssResp = await fetch(`${baseUrl}${cssFile}`);
          if (cssResp.ok) {
            const cssText = await cssResp.text();
            this.pluginContext.ui.addStyles(cssText);
          }
        }
      }

      // Cargar plantillas
      const resourceMap = new Map<string, string>();
      if (manifest.templates && Array.isArray(manifest.templates)) {
        for (const tplFile of manifest.templates) {
          const tplResp = await fetch(`${baseUrl}${tplFile}`);
          if (tplResp.ok) {
            const tplText = await tplResp.text();
            resourceMap.set(tplFile, tplText);
          }
        }
      }
      this.pluginResources.set(manifest.id, resourceMap);


      // Cargar script principal
      const mainScriptUrl = `${baseUrl}${manifest.main || 'index.js'}`;
      const module = await import(mainScriptUrl);

      // Enriquecer el plugin con metadata del manifiesto si falta
      const plugin = module.default;
      if (plugin) {
        plugin.id = plugin.id || manifest.id;
        plugin.name = plugin.name || manifest.name;
        (plugin as any).version = (plugin as any).version || manifest.version;
      }

      await this.loadPluginFromModule(module);

    } catch (e: any) {
      console.error(`[PluginManager] Failed to load package from ${baseUrl}:`, e);
      this.eventBus.emit({ type: 'ui:statusChanged', payload: `Error en paquete: ${e.message}` });
    }
  }



  public async loadLocalPlugin(file: File): Promise<void> {
    this._incrementLoad();
    try {
      if (file.name.endsWith('.zip') || file.name.endsWith('.gplugin')) {
        await this.loadZip(file);
        return;
      }

      if (file.name.endsWith('.gext')) {
        await this.loadExtension(file);
        return;
      }

      if (file.name.endsWith('.gapp')) {
        await this.loadApp(file);
        return;
      }

      const objectUrl = URL.createObjectURL(file);

      try {
        await this.loadRemotePlugin(objectUrl);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } finally {
      this._decrementLoad();
    }
  }

  public async loadZip(file: File): Promise<void> {
    console.log(`[PluginManager] Unzipping package: ${file.name}`);
    const jszip = new JSZip();
    try {
      const zip = await jszip.loadAsync(file);
      await this.processZip(zip, file.name);
    } catch (e: any) {
      console.error("[PluginManager] Fallo al procesar ZIP", e);
      this.eventBus.emit({ type: 'ui:statusChanged', payload: `Error en ZIP: ${e.message}` });
    }
  }

  public async loadExtension(file: File): Promise<void> {
    console.log(`[PluginManager] Opening extension: ${file.name}`);
    const jszip = new JSZip();
    try {
      const zip = await jszip.loadAsync(file);
      const extFile = zip.file("extension.json");
      if (!extFile) throw new Error("extension.json no encontrado en la extensión");

      const extManifest = JSON.parse(await extFile.async("string"));
      this.eventBus.emit({ type: 'ui:statusChanged', payload: `Instalando extensión: ${extManifest.name}...` });

      // Buscamos cada plugin en la carpeta plugins/
      for (const pluginId of extManifest.plugins) {
        console.log(`[PluginManager] Extracting plugin '${pluginId}' from extension...`);

        // Creamos un nuevo JSZip con el subdirectorio del plugin
        const pluginZip = new JSZip();
        const folder = zip.folder(`plugins/${pluginId}`);

        if (folder) {
          let found = false;
          folder.forEach((relativePath, file) => {
            if (!file.dir) {
              pluginZip.file(relativePath, (file as any).async("uint8array"));
              found = true;
            }
          });

          if (found) {
            await this.processZip(pluginZip, pluginId);
          }
        } else {
          console.warn(`[PluginManager] Plugin '${pluginId}' not found in extension package`);
        }
      }


      this.eventBus.emit({ type: 'ui:statusChanged', payload: `Extensión '${extManifest.name}' instalada con éxito` });

    } catch (e: any) {
      console.error("[PluginManager] Fallo al procesar extensión", e);
      this.eventBus.emit({ type: 'ui:statusChanged', payload: `Error en extensión: ${e.message}` });
    }
  }

  private async processZip(zip: JSZip, contextName: string): Promise<void> {
    const manifestFile = zip.file("manifest.json");
    if (!manifestFile) throw new Error(`manifest.json no encontrado en ${contextName}`);

    const manifestText = await manifestFile.async("string");
    const manifest = JSON.parse(manifestText);

    // Cargar estilos
    if (manifest.styles && Array.isArray(manifest.styles)) {
      for (const cssFile of manifest.styles) {
        const fileData = zip.file(cssFile);
        if (fileData) {
          const cssContent = await fileData.async("string");
          this.pluginContext.ui.addStyles(cssContent);
        }
      }
    }

    // Cargar plantillas
    const resourceMap = new Map<string, string>();
    if (manifest.templates && Array.isArray(manifest.templates)) {
      for (const tplFile of manifest.templates) {
        const fileData = zip.file(tplFile);
        if (fileData) {
          const tplContent = await fileData.async("string");
          resourceMap.set(tplFile, tplContent);
        }
      }
    }
    this.pluginResources.set(manifest.id, resourceMap);

    // Cargar script principal
    const mainScriptPath = manifest.main || "index.js";
    const mainFile = zip.file(mainScriptPath);
    if (!mainFile) throw new Error(`Script principal '${mainScriptPath}' no encontrado`);

    const jsContent = await mainFile.async("string");
    const blob = new Blob([jsContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    try {
      const module = await import(url);
      const plugin = module.default;
      if (plugin) {
        plugin.id = plugin.id || manifest.id;
        plugin.name = plugin.name || manifest.name;
        (plugin as any).version = (plugin as any).version || manifest.version;
      }
      await this.loadPluginFromModule(module);
    } finally {
      // URL.revokeObjectURL(url);
    }
  }


  public async loadApp(file: File): Promise<void> {
    console.log(`[PluginManager] Loading application: ${file.name}`);
    this.resetEnvironment();

    const jszip = new JSZip();
    try {
      const zip = await jszip.loadAsync(file);
      const appFile = zip.file("app.json");
      if (!appFile) throw new Error("app.json no encontrado en la aplicación");

      const appManifest = JSON.parse(await appFile.async("string"));

      // Manejar Logo si existe
      if (appManifest.logo && zip.file(appManifest.logo)) {
        const logoFile = zip.file(appManifest.logo);
        const base64 = await logoFile?.async("base64");
        const ext = appManifest.logo.split('.').pop();
        appManifest.logoRaw = `data:image/${ext};base64,${base64}`;
      }

      // Deshabilitar plugins internos si se solicita
      if (appManifest.config?.disableInternalPlugins) {
        appManifest.config.disableInternalPlugins.forEach((id: string) => this.disabledPluginIds.add(id));
      }

      // Ahora que tenemos los IDs bloqueados, recargamos los plugins internos base
      this.eventBus.emit({ type: 'app:reloadInternalPlugins' });

      // Notificar a la UI para el cambio de marca
      this.eventBus.emit({ type: 'app:configApplied', payload: appManifest });


      // Cargar Extensiones
      if (appManifest.extensions) {
        for (const extId of appManifest.extensions) {
          const extZip = new JSZip();
          const folder = zip.folder(`extensions/${extId}`);
          if (folder) {
            folder.forEach((path, f) => { if (!f.dir) extZip.file(path, f.async("uint8array")); });
            await this.processExtensionZip(extZip, extId);
          }
        }
      }

      // Cargar Plugins Individuales
      if (appManifest.plugins) {
        for (const pluginId of appManifest.plugins) {
          const pluginFolder = zip.folder(`plugins/${pluginId}`);
          if (pluginFolder) {
            const pluginZip = new JSZip();
            pluginFolder.forEach((path, f) => { if (!f.dir) pluginZip.file(path, f.async("uint8array")); });
            await this.processZip(pluginZip, pluginId);
          }
        }
      }

    } catch (e: any) {
      console.error("[PluginManager] Fallo al cargar aplicación", e);
      this.eventBus.emit({ type: 'ui:statusChanged', payload: `Error en App: ${e.message}` });
    }
  }

  private async processExtensionZip(zip: JSZip, name: string): Promise<void> {
    const extFile = zip.file("extension.json");
    if (!extFile) return;

    const extManifest = JSON.parse(await extFile.async("string"));
    for (const pluginId of extManifest.plugins) {
      const pluginZip = new JSZip();
      const folder = zip.folder(`plugins/${pluginId}`);
      if (folder) {
        folder.forEach((path, f) => { if (!f.dir) pluginZip.file(path, f.async("uint8array")); });
        await this.processZip(pluginZip, pluginId);
      }
    }
  }


}

