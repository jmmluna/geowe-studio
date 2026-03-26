import { PluginContext } from '../core/plugin-context';

export default {
  id: 'plugin-info-plugin',
  name: 'Gestión de Plugins',
  activate: (ctx: PluginContext) => {
    const PANEL_ID = 'plugin-info-panel';

    const renderPluginList = () => {
      const active = ctx.plugins.getActive();
      if (active.length === 0) return '<p>No hay plugins activos.</p>';

      return `
        <div class="plugin-list-container" style="display: flex; flex-direction: column; gap: 10px;">
          ${active.map(p => `
            <div class="plugin-info-card" style="padding: 10px; background: #f8f9fa; border-left: 4px solid #2ecc71; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 600; font-size: 14px; color: #2c3e50;">${p.name}</div>
                <div style="font-size: 12px; color: #7f8c8d;">${p.id} ${p.version ? `(v${p.version})` : ''}</div>
              </div>
              <span class="material-icons" style="color: #2ecc71; font-size: 20px;">check_circle</span>
            </div>
          `).join('')}
          <div style="margin-top: 15px; padding: 10px; border: 1px dashed #ddd; border-radius: 4px; font-size: 12px; color: #7f8c8d; background: #fff;">
            <p>Total: <strong>${active.length}</strong> plugins cargados.</p>
          </div>
        </div>
      `;
    };

    const togglePanel = () => {
      ctx.ui.addPanel({
        id: PANEL_ID,
        title: 'Estado del Sistema - Plugins',
        content: renderPluginList(),
        onRender: (el) => {
          // Si quisiéramos añadir botones de refresco aquí
        }
      });
    };

    // Botón en la sidebar o toolbar
    ctx.ui.addButton({
      id: 'btn-plugin-info',
      label: 'Estado de Plugins',
      icon: 'settings_input_component',
      commandId: 'plugin-info:toggle'
    });

    ctx.commands.register('plugin-info:toggle', togglePanel);

    // Escuchar cambios de plugin para refrescar el panel si está abierto
    ctx.events.on('plugin:loaded', () => {
      ctx.ui.updatePanel(PANEL_ID);
    });
  },
  deactivate: () => {}
};
