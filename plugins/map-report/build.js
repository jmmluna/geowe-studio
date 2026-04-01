const esbuild = require('esbuild');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Asegurar carpeta dist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

console.log('📦 Compilando Plugin React: Map Report...');

// Compilación con esbuild (Bundle total de React para independencia)
esbuild.buildSync({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  target: 'es2020',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
  minify: true,
  // NO hacemos externa a React porque GeoWE Studio no lo provee.
  // Pero sí hacemos externo a 'ol' si el plugin lo necesitara importar directamente
  // (En este caso no lo usa directamente via import pero es buena praxis)
  external: ['ol', 'ol/*'] 
});

// Copiar Manifiesto
fs.copyFileSync('manifest.json', 'dist/manifest.json');

console.log('✅ Compilación finalizada. Empaquetando .gplugin...');

// Auto-pack .gplugin format usando la herramienta de GeoWE Studio
const packagerPath = path.resolve(__dirname, '../../studio/tools/forge-packager.js');
try {
    execSync(`node "${packagerPath}" dist`, { stdio: 'inherit' });
    console.log('🎉 ¡Proceso completado con éxito!');
} catch (err) {
    console.error('❌ Error durante el empaquetado:', err);
    process.exit(1);
}
