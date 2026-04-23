const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('📦 Empaquetando Plugin GeoPackage Loader...');

// Asegurar que dist existe (vite lo crea pero por si acaso)
if (!fs.existsSync('dist')) {
  console.error('❌ Error: El directorio dist no existe. Ejecuta vite build primero.');
  process.exit(1);
}

try {
  // Copiar manifest.json a dist
  fs.copyFileSync('manifest.json', 'dist/manifest.json');
  
  console.log('✅ Manifest copiado. Empaquetando .gplugin...');

  // Auto-pack usando la herramienta del core
  const packagerPath = path.resolve(__dirname, '../../studio/tools/forge-packager.js');
  
  // En Windows necesitamos asegurar que llamamos a node correctamente
  execSync(`node "${packagerPath}" dist`, { stdio: 'inherit' });
  
  console.log('🎉 ¡GeoPackage Loader empaquetado con éxito!');
} catch (err) {
  console.error('❌ Error durante el empaquetado:', err);
  process.exit(1);
}
