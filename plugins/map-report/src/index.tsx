import { createRoot } from 'react-dom/client';
import App from './App.tsx';

export default {
  id: 'map-report',
  name: 'Map Report (React)',
  version: '1.0.0',

  activate: (ctx: any) => {
    const SIDEBAR_ID = 'map-report-sidebar';
    const ROOT_ID = 'map-report-root';
    let isSidebarActive = false;

    // Registramos el Sidebar Dedicado (SDK v2.1)
    ctx.ui.registerSidebar({
      id: SIDEBAR_ID,
      title: 'Reporte de Mapa',
      icon: 'picture_as_pdf',
      content: `<div id="${ROOT_ID}" style="height: 100%"></div>`,
      onRender: (el: HTMLElement) => {
        const rootContainer = el.querySelector(`#${ROOT_ID}`);
        if (rootContainer) {
          const root = createRoot(rootContainer);
          root.render(<App context={ctx} />);
        }
      }
    });

    // Acción de la toolbar para conmutar el sidebar dedicado
    const toggleReportSidebar = () => {
      isSidebarActive = !isSidebarActive;
      
      if (isSidebarActive) {
        // Asegurar que el sidebar global está visible
        ctx.commands.execute('ui:openSidebar'); 
        // Activar nuestro sidebar dedicado
        ctx.commands.execute('ui:activePluginSidebar', SIDEBAR_ID);
        ctx.ui.setButtonActive('btn-map-report', true);
      } else {
        // Volver al sidebar por defecto (Gestión de Plugins)
        ctx.commands.execute('ui:resetSidebar');
        ctx.ui.setButtonActive('btn-map-report', false);
      }
    };

    ctx.ui.addButton({
      id: 'btn-map-report',
      label: 'Generar Informe',
      icon: 'picture_as_pdf',
      commandId: 'map-report:toggleSidebar'
    });

    ctx.commands.register('map-report:toggleSidebar', toggleReportSidebar);

    console.log('[MapReport] Plugin Activado (Dedicated Sidebar Mode)');
  },

  deactivate: () => {
    console.log('[MapReport] Plugin Desactivado');
  }
};
