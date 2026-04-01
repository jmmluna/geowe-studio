import React, { useState } from 'react';
import { generatePDF } from './ReportGenerator.ts';

const App = ({ context }: { context: any }) => {
  const [title, setTitle] = useState('Informe de Mapa GeoWE');
  const [description, setDescription] = useState('Informe generado desde GeoWE Forge Platform.');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      context.ui.setStatus('Capturando mapa y generando PDF...');
      await generatePDF(context, { title, description });
      context.ui.setStatus('¡PDF Generado con éxito!');
    } catch (err) {
      console.error(err);
      context.ui.setStatus('Error al generar el PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '16px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      backgroundColor: '#f8f9fa',
      borderLeft: '1px solid #ddd'
    }}>
      <h3 style={{ margin: 0, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-icons">picture_as_pdf</span>
        Configurar Reporte
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Título del Informe</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Descripción</label>
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
        />
      </div>

      <div style={{ flex: 1 }}></div>

      <button 
        onClick={handleExport}
        disabled={loading}
        style={{
          padding: '12px',
          backgroundColor: loading ? '#bdc3c7' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 'bold',
          transition: 'background 0.3s'
        }}
      >
        <span className="material-icons">{loading ? 'sync' : 'download'}</span>
        {loading ? 'Generando...' : 'Descargar PDF'}
      </button>

      <div style={{ fontSize: '11px', color: '#7f8c8d', textAlign: 'center' }}>
        El reporte incluirá el mapa actual, la leyenda de capas y la barra de escala.
      </div>
    </div>
  );
};

export default App;
