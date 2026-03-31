const esbuild = require('esbuild');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Ensure dist dir
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build the plugin
esbuild.buildSync({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  target: 'es2022',
  external: ['ol', 'ol/*'] // Importante: Previene colisiones con OpenLayers de GeoWE Studio
});

// Copy resources
fs.copyFileSync('manifest.json', 'dist/manifest.json');
fs.copyFileSync('src/feature-list.html', 'dist/feature-list.html');

console.log('Plugin compiled. Packing...');

// Auto-pack .gplugin format
const packagerPath = path.resolve(__dirname, '../../studio/tools/forge-packager.js');
execSync(`node "${packagerPath}" dist`, { stdio: 'inherit' });

console.log('Done!');
