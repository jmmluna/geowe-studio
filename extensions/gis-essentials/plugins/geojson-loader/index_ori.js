export default {
  id: 'geojson-loader',
  name: 'Cargador de Ficheros GeoJSON',
  activate: (ctx) => {
    ctx.ui.addButton({
      id: 'load-geojson',
      label: 'Cargar GeoJSON',
      icon: 'file_upload',
      commandId: 'geojson:open-loader'
    });

    ctx.commands.register('geojson:open-loader', () => {
      ctx.ui.addModal({
        id: 'geojson-modal',
        title: 'Cargar GeoJSON',
        content: `
          <div style="padding:10px">
            <p style="font-size:13px; color:#666">Selecciona un archivo .geojson o .json de tu equipo.</p>
            <input type="file" id="geojson-file-input" accept=".geojson,.json" style="width:100%; margin-bottom:15px">
            <div style="display:flex; justify-content:flex-end; gap:10px">
              <button id="close-loader" class="geowe-ui-btn geowe-ui-btn-secondary">Cancelar</button>
              <button id="process-loader" class="geowe-ui-btn geowe-ui-btn-primary">Cargar Capa</button>
            </div>
          </div>
        `,
        onRender: (el) => {
          el.querySelector('#process-loader').onclick = () => {
            const file = el.querySelector('#geojson-file-input').files[0];
            if (file) {
               ctx.ui.setStatus(`Cargando ${file.name}...`);
               // Simulación de carga (en un plugin real leeríamos con FileReader)
               setTimeout(() => {
                 ctx.ui.setStatus(`Capa ${file.name} añadida con éxito`);
                 ctx.ui.removePanel('geojson-modal');
               }, 1000);
            }
          };
          el.querySelector('#close-loader').onclick = () => ctx.ui.removePanel('geojson-modal');
        }
      });
    });
  },
  deactivate: () => {}
};
