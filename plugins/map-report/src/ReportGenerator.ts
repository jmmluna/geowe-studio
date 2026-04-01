import { jsPDF } from 'jspdf';

export async function generatePDF(context: any, options: { title: string, description: string }) {
  const { map, layers } = context;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // 1. Título y Encabezado con Logo (Busca el logo cargado en el visor)
  const appLogoImg = document.querySelector('.app-logo') as HTMLImageElement;
  const logoUrl = appLogoImg ? appLogoImg.src : context.app.logo;
  
  try {
    // Intentamos detectar el formato a partir de la URL/DataURL
    const format = (logoUrl.includes('png') || logoUrl.startsWith('data:image/png')) ? 'PNG' : 'JPEG';
    doc.addImage(logoUrl, format, margin, 10, 18, 18);
  } catch (e) {
    console.warn('No se pudo cargar el logo para el PDF', e);
  }

  doc.setFontSize(22);
  doc.setTextColor(44, 62, 80);
  doc.text(options.title, margin + 22, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(127, 140, 141);
  doc.text(context.app.title, margin + 22, 26);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, margin + 22, 31);
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(52, 152, 219);
  doc.line(margin, 38, pageWidth - margin, 38);

  // 2. Descripción
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const splitDescription = doc.splitTextToSize(options.description, pageWidth - (margin * 2));
  doc.text(splitDescription, margin, 48);

  // 3. Captura del Mapa (OpenLayers Canvas)
  try {
    const mapCanvas = document.createElement('canvas');
    const size = map.getSize();
    mapCanvas.width = size[0];
    mapCanvas.height = size[1];
    const mapContext = mapCanvas.getContext('2d');
    
    // Unir todas las capas del viewport (OL rinde cada capa en un canvas separado a veces)
    const canvases = map.getViewport().querySelectorAll('.ol-layer canvas, canvas');
    canvases.forEach((canvas: HTMLCanvasElement) => {
      if (canvas.width > 0) {
        const opacity = (canvas.parentElement as HTMLElement).style.opacity || '1';
        mapContext!.globalAlpha = parseFloat(opacity);
        const matrix = (canvas as any).style.transform 
          ? new DOMMatrix((canvas as any).style.transform) 
          : new DOMMatrix();
        mapContext!.setTransform(matrix);
        mapContext!.drawImage(canvas, 0, 0);
      }
    });

    const mapImgData = mapCanvas.toDataURL('image/jpeg', 0.8);
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (imgWidth * size[1]) / size[0];
    
    doc.addImage(mapImgData, 'JPEG', margin, 60, imgWidth, imgHeight);

    // 4. Barra de Escala (Captura robusta desde el visor)
    const scaleElement = document.querySelector('.ol-scale-line-inner') || 
                         document.querySelector('.ol-scale-line') ||
                         document.querySelector('.ol-scale-text');
                         
    if (scaleElement) {
        const scaleText = (scaleElement as HTMLElement).innerText || (scaleElement as HTMLElement).textContent;
        if (scaleText) {
          doc.setFontSize(10);
          doc.setTextColor(52, 73, 94);
          doc.text(`Escala: ${scaleText.trim()}`, margin, 60 + imgHeight + 8);
        }
    }

    // 5. Leyenda de Capas Visibles
    let currentY = 60 + imgHeight + 20;
    doc.setFontSize(14);
    doc.text('Leyenda de Capas', margin, currentY);
    currentY += 10;

    const allLayers = layers.getAll().filter((l: any) => l.visible);
    allLayers.forEach((layer: any) => {
      if (currentY > 270) {
          doc.addPage();
          currentY = 20;
      }

      // Dibujar caja de color para vectores
      if (layer.type === 'vector' && layer.color) {
          doc.setFillColor(layer.color);
          doc.rect(margin, currentY - 4, 4, 4, 'F');
      } else {
          doc.setDrawColor(200, 200, 200);
          doc.rect(margin, currentY - 4, 4, 4, 'S');
      }

      doc.setFontSize(10);
      doc.text(layer.name, margin + 8, currentY);
      currentY += 7;
    });

  } catch (error) {
    console.error('Error capturando el mapa:', error);
    doc.text('Error al capturar la imagen del mapa.', margin, 70);
  }

  // 6. Pie de página
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Generado por GeoWE Forge Platform - Plataforma GIS Extensible', pageWidth / 2, 285, { align: 'center' });

  // Descargar
  doc.save(`reporte-geowe-${Date.now()}.pdf`);
}
