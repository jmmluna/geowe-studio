import { PluginContext } from '../core/plugin-context';

export default {
  id: 'layer-manager-plugin',
  name: 'Gestor de Capas',
  activate: (ctx: PluginContext) => {
    const PANEL_ID = 'layer-manager-panel';

    ctx.ui.addStyles(`
      .layer-item-container {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 6px 0;
        border-bottom: 1px solid rgba(0,0,0,0.05);
      }
      .geowe-ui-dropdown {
        position: relative;
        display: inline-block;
      }
      .geowe-ui-dropdown-content {
        display: none;
        position: absolute;
        right: 0;
        top: 100%;
        background-color: white;
        min-width: 140px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.1);
        z-index: 2000;
        border-radius: 8px;
        border: 1px solid #dcdde1;
        padding: 4px 0;
      }
      .geowe-ui-dropdown.active .geowe-ui-dropdown-content {
        display: block;
      }
      .geowe-ui-dropdown-item {
        width: 100%;
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: 13px;
        color: #2c3e50;
        transition: background 0.2s;
      }
      .geowe-ui-dropdown-item:hover {
        background-color: #f8f9fa;
        color: #3498db;
      }
    `);


    const getPanelContent = () => {
      const layers = ctx.layers.getAll();
      
      if (layers.length === 0) {
        return `
          <div class="layer-manager-empty">
            <p>No hay capas cargadas en el mapa.</p>
            <p class="small">Use el catálogo para añadir capas.</p>
          </div>
        `;
      }

      const layerItems = layers.map(layer => {
        const legend = layer.type === 'vector' 
          ? `<div style="width: 12px; height: 12px; border-radius: 3px; background-color: ${layer.color || '#3498db'}; margin-right: 8px; flex-shrink: 0;"></div>`
          : '';
        
        const dynamicActions = ctx.ui.getLayerActions().map(action => `
          <button class="geowe-ui-dropdown-item dynamic-layer-action" data-name="${layer.name}" data-action-id="${action.id}" style="width: 100%; text-align: left; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px;">
            <span class="material-icons" style="font-size: 18px;">${action.icon || 'extension'}</span>
            ${action.label}
          </button>
        `).join('');

        const dropdown = `
          <div class="geowe-ui-dropdown" style="position: relative;">
            <button class="dropdown-trigger geowe-ui-btn-icon" style="padding: 4px;">
              <span class="material-icons">more_vert</span>
            </button>
            <div class="geowe-ui-dropdown-content" style="position: absolute; right: 0; top: 100%; background: white; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; border-radius: 4px; padding: 4px 0; min-width: 140px; display: none;">
              ${layer.type === 'vector' ? `
                <button class="geowe-ui-dropdown-item layer-zoom-btn" data-name="${layer.name}" style="width: 100%; text-align: left; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                  <span class="material-icons" style="font-size: 18px;">zoom_in</span>
                  Zoom a la capa
                </button>
                ${dynamicActions}
              ` : ''}
              <button class="geowe-ui-dropdown-item layer-remove-btn" data-name="${layer.name}" style="width: 100%; text-align: left; padding: 8px 12px; border: none; background: none; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; color: #e74c3c;">
                <span class="material-icons" style="font-size: 18px;">delete_outline</span>
                Eliminar capa
              </button>
            </div>
          </div>
        `;


        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 4px; border-bottom: 1px solid #f0f0f0; width: 100%; height: 40px; box-sizing: border-box; overflow: visible;">
            <div style="display: flex; align-items: center; flex: 1; min-width: 0; overflow: hidden;">
              <input type="checkbox" ${layer.visible ? 'checked' : ''} data-name="${layer.name}" style="margin-right: 10px; cursor: pointer; flex-shrink: 0; width: 16px; height: 16px;">
              <span style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #2c3e50;">${layer.name}</span>
            </div>
            <div style="display: flex; align-items: center; flex-shrink: 0;">
              ${legend}
              ${dropdown}
            </div>
          </div>
        `;
      }).join('');



      return `
        <div class="layer-manager-scroll-container" style="max-height: 280px; overflow-y: auto; overflow-x: visible; padding-bottom: 60px;">
          <div class="layer-manager-list">${layerItems}</div>
        </div>
      `;
    };




    const updateUI = (el: HTMLElement) => {
      el.innerHTML = getPanelContent();
      
      // Listeners de Visibilidad (Checkbox)
      el.querySelectorAll('input[type="checkbox"]').forEach((chk: any) => {
        chk.addEventListener('change', (e: any) => {
          ctx.layers.setVisible(chk.getAttribute('data-name'), e.target.checked);
        });
      });

      // Lógica de apertura de Dropdown
      el.querySelectorAll('.dropdown-trigger').forEach((btn: any) => {
        btn.addEventListener('click', (e: any) => {
          e.stopPropagation();
          const dropdown = (btn as HTMLElement).parentElement;
          const content = dropdown?.querySelector('.geowe-ui-dropdown-content') as HTMLElement;
          
          // Cerrar otros
          el.querySelectorAll('.geowe-ui-dropdown-content').forEach((d: any) => {
            if (d !== content) d.style.display = 'none';
          });

          // Toggle actual
          if (content) {
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
          }
        });
      });

      // Cerrar menús al hacer clic fuera (en el panel)
      el.addEventListener('click', () => {
        el.querySelectorAll('.geowe-ui-dropdown-content').forEach((d: any) => {
          (d as HTMLElement).style.display = 'none';
        });
      });

      // Acciones de Zoom
      el.querySelectorAll('.layer-zoom-btn').forEach((btn: any) => {
        btn.addEventListener('click', (e: any) => {
          e.stopPropagation();
          ctx.layers.zoomToLayer(btn.getAttribute('data-name'));
          // Cerrar menú
          (btn.parentElement as HTMLElement).style.display = 'none';
        });
      });

      // Acciones dinámicas de otros plugins
      el.querySelectorAll('.dynamic-layer-action').forEach((btn: any) => {
        btn.addEventListener('click', (e: any) => {
          e.stopPropagation();
          const actionId = btn.getAttribute('data-action-id');
          const layerName = btn.getAttribute('data-name');
          const action = ctx.ui.getLayerActions().find(a => a.id === actionId);
          if (action) action.callback(layerName);
          // Cerrar menú
          (btn.parentElement as HTMLElement).style.display = 'none';
        });
      });


      // Acciones de Borrar
      el.querySelectorAll('.layer-remove-btn').forEach((btn: any) => {
        btn.addEventListener('click', (e: any) => {
          e.stopPropagation();
          const name = btn.getAttribute('data-name');
          if (confirm(`¿Eliminar la capa "${name}"?`)) {
            ctx.layers.removeLayer(name);
            refresh();
          }
        });
      });
    };




    let isOpen = false;
    const BUTTON_ID = 'open-layer-manager';

    const toggleManager = () => {
      if (isOpen) {
        ctx.ui.removePanel(PANEL_ID);
        ctx.ui.setButtonActive(BUTTON_ID, false);
        isOpen = false;
      } else {
        ctx.ui.addPanel({
          id: PANEL_ID,
          title: 'Gestión de Capas',
          content: getPanelContent(),
          onRender: (el) => updateUI(el)
        });
        ctx.ui.setButtonActive(BUTTON_ID, true);
        isOpen = true;
      }
    };



    const refresh = () => {
      if (isOpen) ctx.ui.updatePanel(PANEL_ID);
    };

    // Listen for manual panel closure (the "X")
    ctx.events.on('ui:panelClosed', (id: string) => {
      if (id === PANEL_ID) {
        isOpen = false;
        ctx.ui.setButtonActive(BUTTON_ID, false);
      }
    });

    // Listen for layer changes to refresh panel if open
    ctx.events.on('layer:changed', () => refresh());
    ctx.events.on('layer:addWMS', () => setTimeout(() => refresh(), 500));
    ctx.events.on('layer:addVector', () => setTimeout(() => refresh(), 500));
    

    // Registrar comando como toggle
    ctx.commands.register('layer-manager:toggle', toggleManager);


    // UI Button
    ctx.ui.addButton({
      id: 'open-layer-manager',
      label: 'Gestionar Capas',
      icon: 'layers',
      commandId: 'layer-manager:toggle'
    });

  },
  deactivate: () => {}
};
