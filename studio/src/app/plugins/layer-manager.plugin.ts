import { PluginContext } from '../core/plugin-context';

export default {
  id: 'layer-manager-plugin',
  name: 'Gestor de Capas',
  activate: (ctx: PluginContext) => {
    const SIDEBAR_ID = 'layers';
    const BUTTON_ID = 'open-layer-manager';

    ctx.ui.addStyles(`
      .layer-manager-container-outer { overflow: hidden; width: 100%; height: 100%; position: relative; display: flex; flex-direction: column; }
      .layer-manager-wrapper { display: flex; width: 200%; height: 100%; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      .layer-manager-wrapper.inspecting { transform: translateX(-50%); }
      
      .view-list { width: 50%; display: flex; flex-direction: column; background: #fff; height: 100%; font-family: 'Inter', sans-serif; overflow: hidden; }
      .view-inspector { width: 50%; display: flex; flex-direction: column; background: #fdfdfe; height: 100%; font-family: 'Inter', sans-serif; overflow: hidden; }
      
      /* Header general */
      .layer-manager-header { height: 72px; padding: 16px; border-bottom: 1px solid #edf2f7; background: #fafbfc; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; }
      .layer-manager-title { font-size: 16px; font-weight: 700; color: #2d3748; margin-bottom: 4px; }
      .layer-manager-subtitle { font-size: 12px; color: #718096; }
      
      /* Botón volver en inspector */
      .back-btn { display: flex; align-items: center; gap: 4px; color: #3182ce; font-size: 13px; font-weight: 600; cursor: pointer; padding: 6px 10px; border-radius: 6px; transition: background 0.2s; border: none; background: transparent; margin-left: -8px; }
      .back-btn:hover { background: #ebf8ff; }
      .back-btn .material-icons { font-size: 18px; }
      
      .layer-list { flex: 1; overflow-y: auto; padding: 8px; }
      .layer-item { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px; transition: all 0.2s; overflow: hidden; }
      .layer-item:hover { border-color: #cbd5e0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
      .layer-item.active { border-color: #3182ce; box-shadow: 0 4px 12px rgba(49, 130, 206, 0.1); }
      
      .layer-item-main { display: flex; align-items: center; padding: 12px; gap: 10px; cursor: pointer; }
      .layer-item-visibility { width: 18px; height: 18px; cursor: pointer; accent-color: #3182ce; }
      .layer-item-info { flex: 1; min-width: 0; }
      .layer-item-name { font-size: 13px; font-weight: 600; color: #2d3748; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .layer-item-type { font-size: 11px; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.5px; }
      
      .layer-item-legend { width: 8px; height: 24px; border-radius: 4px; flex-shrink: 0; }
      
      .layer-item-actions-toggle { color: #718096; transition: transform 0.2s; }
      .layer-item.expanded .layer-item-actions-toggle { transform: rotate(180deg); color: #3182ce; }
      
      .layer-actions-panel { background: #f8fafc; border-top: 1px solid #edf2f7; display: none; padding: 8px; grid-template-columns: repeat(2, 1fr); gap: 6px; }
      .layer-item.expanded .layer-actions-panel { display: grid; }
      
      .layer-action-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 11px; font-weight: 600; color: #4a5568; cursor: pointer; transition: all 0.2s; }
      .layer-action-btn:hover { background: #edf2f7; color: #3182ce; border-color: #bee3f8; }
      .layer-action-btn .material-icons { font-size: 16px; }
      .layer-action-btn.danger:hover { color: #e53e3e; border-color: #fed7d7; background: #fff5f5; }
      
      /* Inspector PRO */
      .inspector-content { padding: 24px 16px; flex: 1; overflow-y: auto; background: #fdfdfe; }
      .inspector-icon-wrap { width: 64px; height: 64px; background: #ebf8ff; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; color: #3182ce; }
      .inspector-icon-wrap .material-icons { font-size: 32px; }
      .inspector-layer-name { font-size: 20px; font-weight: 800; color: #1a202c; word-break: break-all; line-height: 1.2; margin-bottom: 4px; }
      .inspector-layer-type { font-size: 12px; font-weight: 600; color: #3182ce; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 24px; }
      
      .info-grid { display: flex; flex-direction: column; gap: 16px; background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #edf2f7; box-shadow: 0 1px 3px rgba(0,0,0,0.01); }
      .info-item { display: flex; align-items: flex-start; gap: 12px; }
      .info-item .material-icons { font-size: 20px; color: #a0aec0; margin-top: 2px; }
      .info-item-content { flex: 1; min-width: 0; }
      .info-item-label { font-size: 11px; font-weight: 600; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
      .info-item-value { font-size: 13px; font-weight: 500; color: #2d3748; word-break: break-word; }

      .layer-manager-empty { text-align: center; padding: 40px 20px; color: #a0aec0; }
      .layer-manager-empty .material-icons { font-size: 48px; display: block; margin-bottom: 12px; opacity: 0.3; }
    `);

    let expandedLayerName: string | null = null;
    let inspectedLayerName: string | null = null;

    const getSidebarContent = () => {
      const layers = ctx.layers.getAll();
      
      let inspectorHtml = '<div class="view-inspector"></div>';
      const inspectedLayer = inspectedLayerName ? layers.find(l => l.name === inspectedLayerName) : null;
      
      if (inspectedLayer && inspectedLayer.metadata) {
          inspectorHtml = `
            <div class="view-inspector">
                <div class="layer-manager-header">
                    <button class="back-btn"><span class="material-icons">arrow_back_ios_new</span> Volver</button>
                    <div class="layer-manager-title" style="flex:1; text-align:right;">Inspector</div>
                </div>
                <div class="inspector-content">
                    <div class="inspector-icon-wrap">
                        <span class="material-icons">${inspectedLayer.type === 'vector' ? 'share_location' : 'image'}</span>
                    </div>
                    <div class="inspector-layer-name">${inspectedLayer.name}</div>
                    <div class="inspector-layer-type">${inspectedLayer.type} layer</div>
                    
                    <div class="info-grid">
                        ${inspectedLayer.metadata.srs ? `
                        <div class="info-item">
                            <span class="material-icons">architecture</span>
                            <div class="info-item-content">
                                <div class="info-item-label">Proyección (SRC)</div>
                                <div class="info-item-value">${inspectedLayer.metadata.srs}</div>
                            </div>
                        </div>` : ''}
                        ${inspectedLayer.metadata.format ? `
                        <div class="info-item">
                            <span class="material-icons">data_object</span>
                            <div class="info-item-content">
                                <div class="info-item-label">Formato Original</div>
                                <div class="info-item-value">${inspectedLayer.metadata.format}</div>
                            </div>
                        </div>` : ''}
                        ${inspectedLayer.metadata.count !== undefined ? `
                        <div class="info-item">
                            <span class="material-icons">functions</span>
                            <div class="info-item-content">
                                <div class="info-item-label">Entidades Geométricas</div>
                                <div class="info-item-value">${inspectedLayer.metadata.count} features</div>
                            </div>
                        </div>` : ''}
                        ${inspectedLayer.metadata.filename ? `
                        <div class="info-item">
                            <span class="material-icons">folder_open</span>
                            <div class="info-item-content">
                                <div class="info-item-label">Archivo Fuente</div>
                                <div class="info-item-value">${inspectedLayer.metadata.filename}</div>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            </div>
          `;
      }

      if (layers.length === 0) {
        return `
          <div class="layer-manager-container-outer">
             <div class="layer-manager-wrapper">
                <div class="view-list">
                    <div class="layer-manager-header">
                        <div>
                            <div class="layer-manager-title">Capas</div>
                            <div class="layer-manager-subtitle">No hay capas cargadas</div>
                        </div>
                    </div>
                    <div class="layer-manager-empty">
                        <span class="material-icons">layers_clear</span>
                        <p>El mapa está vacío.</p>
                        <p style="font-size:12px">Añada capas desde el catálogo o el hub.</p>
                    </div>
                </div>
                ${inspectorHtml}
             </div>
          </div>
        `;
      }

      const layerItems = layers.map(layer => {
        const isExpanded = expandedLayerName === layer.name;
        const legendColor = layer.color || (layer.type === 'vector' ? '#3182ce' : '#48bb78');
        
        const dynamicActions = ctx.ui.getLayerActions().filter(action => {
            const supported = action.supportedLayerTypes || ['vector'];
            return supported.includes(layer.type);
        }).map(action => `
            <button class="layer-action-btn dynamic-layer-action" data-name="${layer.name}" data-action-id="${action.id}">
                <span class="material-icons">${action.icon || 'extension'}</span>
                <span>${action.label}</span>
            </button>
        `).join('');

        const zoomButton = layer.type === 'vector' ? `
            <button class="layer-action-btn layer-zoom-btn" data-name="${layer.name}">
                <span class="material-icons">my_location</span>
                <span>Zoom</span>
            </button>
        ` : '';

        const infoButton = layer.metadata ? `
            <button class="layer-action-btn layer-info-btn" data-name="${layer.name}">
                <span class="material-icons">info</span>
                <span>Inspector</span>
            </button>
        ` : '';

        return `
            <div class="layer-item ${isExpanded ? 'expanded active' : ''}" data-name="${layer.name}">
                <div class="layer-item-main">
                    <input type="checkbox" class="layer-item-visibility" ${layer.visible ? 'checked' : ''} data-name="${layer.name}">
                    <div class="layer-item-legend" style="background: ${legendColor}"></div>
                    <div class="layer-item-info">
                        <div class="layer-item-name">${layer.name}</div>
                        <div class="layer-item-type">${layer.type} layer</div>
                    </div>
                    <span class="material-icons layer-item-actions-toggle">expand_more</span>
                </div>
                <div class="layer-actions-panel">
                    ${infoButton}
                    ${zoomButton}
                    ${dynamicActions}
                    <button class="layer-action-btn danger layer-remove-btn" data-name="${layer.name}">
                        <span class="material-icons">delete_outline</span>
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>
        `;
      }).join('');

      return `
        <div class="layer-manager-container-outer">
            <div class="layer-manager-wrapper ${inspectedLayerName ? 'inspecting' : ''}">
                <div class="view-list">
                    <div class="layer-manager-header">
                        <div>
                            <div class="layer-manager-title">Capas</div>
                            <div class="layer-manager-subtitle">${layers.length} capas registradas</div>
                        </div>
                    </div>
                    <div class="layer-list">${layerItems}</div>
                </div>
                ${inspectorHtml}
            </div>
        </div>
      `;
    };

    const setupEvents = (container: HTMLElement) => {
      container.onclick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // 1. Toggle visibilidad (checkbox)
        if (target.classList.contains('layer-item-visibility')) {
           const chk = target as HTMLInputElement;
           ctx.layers.setVisible(chk.getAttribute('data-name')!, chk.checked);
           refresh();
           return;
        }

        // 2. Expandir/contraer
        const main = target.closest('.layer-item-main') as HTMLElement;
        if (main && !target.classList.contains('layer-item-visibility')) {
            const name = main.parentElement?.getAttribute('data-name') || null;
            expandedLayerName = expandedLayerName === name ? null : name;
            refresh();
            return;
        }

        // 3. Info button click (Abrir Inspector)
        const infoBtn = target.closest('.layer-info-btn') as HTMLElement;
        if (infoBtn) {
            e.stopPropagation();
            inspectedLayerName = infoBtn.getAttribute('data-name');
            refresh();
            return;
        }

        // 4. Back button click (Cerrar Inspector)
        const backBtn = target.closest('.back-btn') as HTMLElement;
        if (backBtn) {
            e.stopPropagation();
            inspectedLayerName = null;
            refresh();
            return;
        }

        // 5. Acciones dinámicas
        const dynamicBtn = target.closest('.dynamic-layer-action') as HTMLElement;
        if (dynamicBtn) {
            e.stopPropagation();
            const actionId = dynamicBtn.getAttribute('data-action-id');
            const layerName = dynamicBtn.getAttribute('data-name');
            
            const action = ctx.ui.getLayerActions().find(a => 
              a.id?.toLowerCase() === actionId?.toLowerCase() ||
              a.label?.toLowerCase().replace(/\s+/g, '-') === actionId?.toLowerCase()
            );
            
            if (action) {
                action.callback(layerName!);
            }
            return;
        }

        // 4. Zoom
        const zoomBtn = target.closest('.layer-zoom-btn') as HTMLElement;
        if (zoomBtn) {
            e.stopPropagation();
            ctx.layers.zoomToLayer(zoomBtn.getAttribute('data-name')!);
            return;
        }

        // 5. Eliminar
        const removeBtn = target.closest('.layer-remove-btn') as HTMLElement;
        if (removeBtn) {
            e.stopPropagation();
            const name = removeBtn.getAttribute('data-name');
            if (confirm(`¿Eliminar la capa "${name}"?`)) {
              ctx.layers.removeLayer(name!);
              refresh();
            }
            return;
        }
      };
    };

    const refresh = () => {
      ctx.ui.registerSidebar({
        id: SIDEBAR_ID,
        title: 'Gestor de Capas',
        icon: 'layers',
        content: getSidebarContent(),
        onRender: setupEvents
      });
    };

    const toggleManager = () => {
      refresh();
      setTimeout(() => {
        ctx.commands.execute('ui:activePluginSidebar', SIDEBAR_ID);
        ctx.commands.execute('ui:openSidebar');
      }, 50);
    };

    ctx.events.on('layer:changed', () => refresh());
    ctx.events.on('layer:addWMS', () => setTimeout(() => refresh(), 100));
    ctx.events.on('layer:addVector', () => setTimeout(() => refresh(), 100));
    ctx.events.on('ui:layerActionsChanged', () => refresh());

    ctx.commands.register('layer-manager:toggle', toggleManager);

    ctx.ui.addButton({
      id: BUTTON_ID,
      label: 'Gestionar Capas',
      icon: 'layers',
      commandId: 'layer-manager:toggle',
      activeOnSidebarId: SIDEBAR_ID
    });

    refresh();
  },
  deactivate: (ctx: PluginContext) => {
    ctx.ui.removeSidebar('layers');
    ctx.ui.removeButton('open-layer-manager');
  }
};
