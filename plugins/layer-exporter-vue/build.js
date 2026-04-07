const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('📦 Compilando Plugin Vue: Layer Exporter...');

// Asegurar que dist existe
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

try {
  // Ejecutar build de vite
  execSync('npm.cmd run build-lib', { stdio: 'inherit' });
  
  // Copiar manifest.json a dist
  fs.copyFileSync('manifest.json', 'dist/manifest.json');
  
  console.log('✅ Compilación finalizada. Empaquetando .gplugin...');

  // Auto-pack usando la herramienta del core
  const packagerPath = path.resolve(__dirname, '../../studio/tools/forge-packager.js');
  execSync(`node "${packagerPath}" dist`, { stdio: 'inherit' });
  
  console.log('🎉 ¡Proceso completado con éxito!');
} catch (err) {
  console.error('❌ Error durante el proceso:', err);
  process.exit(1);
}
