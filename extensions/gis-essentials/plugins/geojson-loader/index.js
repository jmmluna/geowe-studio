export default {
  id: 'geojson-loader-dynamic',
  name: 'Cargador GeoJSON Dinámico',
  activate: (ctx) => {
    
    ctx.commands.register('open-geojson-dynamic-panel', () => {
      const urlSection = ctx.ui.components.row([
        ctx.ui.components.input('https://.../file.json', '', 'text', 'geojson-url'),
        ctx.ui.components.button('Cargar', 'download', 'primary', 'btn-load-url')
      ]);

      const fileSection = ctx.ui.components.input('Seleccionar archivo GeoJSON', '', 'file', 'geojson-file');


      const content = `
        <div style="display:flex; flex-direction:column; gap:15px;">
          ${ctx.ui.components.section('Desde URL', 'link', urlSection)}
          ${ctx.ui.components.section('O subir archivo', 'upload_file', fileSection)}
        </div>
      `;
      ctx.ui.addPanel({
        id: 'geojson-loader',
        title: 'Cargar GeoJSON',
        content,
        onRender: (el) => {

          // Lógica de carga desde URL
          const btnUrl = el.querySelector('#btn-load-url');
          const inputUrl = el.querySelector('#geojson-url');
          btnUrl.onclick = async () => {
            const url = inputUrl.value;
            if (!url) return;
            try {
              const response = await fetch(url);
              const data = await response.json();
              ctx.layers.addVectorLayer('Capa desde URL', data);
              alert('GeoJSON cargado con éxito');
            } catch (e) {
              alert('Error al cargar GeoJSON: ' + e.message);
            }
          };

          // Lógica de carga desde Archivo
          const inputFile = el.querySelector('#geojson-file');
          const fileLabel = el.querySelector('.geowe-ui-file-label span:last-child');

          inputFile.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Actualizar label visual
            if (fileLabel) fileLabel.innerText = file.name;

            const reader = new FileReader();
            reader.onload = (event) => {

              try {
                const data = JSON.parse(event.target.result);
                ctx.layers.addVectorLayer(file.name, data);
                alert('Archivo GeoJSON visualizado');
              } catch (err) {
                alert('Error al leer el archivo JSON');
              }
            };
            reader.readAsText(file);
          };
        }
      });
    });

    ctx.ui.addButton({
      id: 'open-geojson-dynamic-panel',
      label: 'Plugin: Cargar GeoJSON (Dinámico)',
      icon: 'file_upload',
      commandId: 'open-geojson-dynamic-panel'
    });


  },
  deactivate: () => {
    console.log("Cargador Dinámico desactivado");
  }
};
