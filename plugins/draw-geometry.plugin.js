export default {
  id: 'draw-geometry-plugin',
  name: 'Dibujar Polígonos',
  activate: (ctx) => {
    
    ctx.commands.register('draw-poly', () => {
      ctx.ui.setStatus("Herramienta activa: Dibujar Polígonos. Haz clics en el mapa.");
    });


    ctx.ui.addButton({
      id: 'draw-poly',
      label: 'Herramienta: Dibujar Polígonos',
      icon: 'draw',
      commandId: 'draw-poly'
    });


  },
  deactivate: () => {
    console.log("Dibujar Polígonos desactivado");
  }
};
