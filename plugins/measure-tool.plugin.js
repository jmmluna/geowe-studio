export default {
  id: 'measure-tool-plugin',
  name: 'Herramienta de Medición',
  activate: (ctx) => {
    
    ctx.commands.register('measure-dist', () => {
      ctx.ui.setStatus("Herramienta activa: Medir Distancia. Haz clic en el mapa para empezar.");
    });


    ctx.ui.addButton({
      id: 'measure-dist',
      label: 'Herramienta: Medir Distancia',
      icon: 'straighten',
      commandId: 'measure-dist'
    });
  },

  deactivate: () => {
    console.log("Herramienta de Medición desactivada");
  }
};
