/**
 * GeoWE Studio SDK - Type Definitions
 * This package provides the interfaces necessary to develop plugins for GeoWE Studio.
 */

export interface PluginContext {
  map: any;
  layers: LayerAPI;
  ui: UIAPI;
  commands: CommandBus;
  events: EventBusAPI;
  plugins: {
    getActive: () => { id: string, name: string, version?: string }[];
  };
  resources: {
    getTemplate: (name: string) => string | undefined;
  };
  app: {
    title: string;
    logo: string;
  };
}

export interface LayerInfo {
  name: string;
  type: 'raster' | 'vector';
  visible: boolean;
  color?: string;
}

export interface LayerAPI {
  addWMSLayer: (name: string, url: string, params: any) => void;
  addVectorLayer: (name: string, geojson: any) => void;
  removeLayer: (name: string) => void;
  getAll: () => any[];
  setVisible: (name: string, visible: boolean) => void;
  setStyle: (name: string, style: { fill?: string, stroke?: string, width?: number }) => void;
  zoomToLayer: (name: string) => void;
}

export interface UIComponents {
  button: (label: string, icon?: string, type?: 'primary' | 'secondary', id?: string) => string;
  checkbox: (label: string, checked: boolean, id?: string, dataAttrs?: Record<string, string>) => string;
  input: (placeholder: string, value?: string, type?: string, id?: string) => string;
  section: (title: string, icon: string, content: string) => string;
  row: (content: string[]) => string;
}

export interface UIAPI {
  addButton: (options: { id: string, label: string, icon?: string, commandId: string }) => void;
  addPanel: (options: { id: string, title: string, content: string, onRender?: (el: HTMLElement) => void }) => void;
  addModal: (options: { id: string, title: string, content: string, onRender?: (el: HTMLElement) => void }) => void;
  removePanel: (id: string) => void;
  updatePanel: (id: string) => void;
  registerLayerAction: (descriptor: { id: string, label: string, icon?: string, callback: (layerName: string) => void }) => void;
  getLayerActions: () => any[];
  setStatus: (message: string) => void;
  setButtonActive: (id: string, active: boolean) => void;
  addStyles: (css: string) => void;
  addSidebarSection: (options: { id: string, title: string, icon: string, content: string, onRender?: (el: HTMLElement) => void }) => void;
  registerSidebar: (options: { id: string, title: string, icon: string, content: string, onRender?: (el: HTMLElement) => void }) => void;
  components: UIComponents;
}

export interface CommandBus {
  register: (id: string, action: (payload?: any) => void) => void;
  execute: (id: string, payload?: any) => void;
}

export interface EventBusAPI {
  on: (type: string, handler: (payload: any) => void) => void;
  emit: (type: string, payload?: any) => void;
}

export interface GeoWEPlugin {
  id: string;
  name: string;
  version?: string;
  activate: (ctx: PluginContext) => Promise<void> | void;
  deactivate: () => Promise<void> | void;
}
