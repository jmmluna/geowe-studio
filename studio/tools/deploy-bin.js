const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../dist/studio/browser');
const destDir = path.resolve(__dirname, '../bin');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursiveSync(path.join(src, childItemName),
        path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log(`🚀 Iniciando despliegue de build a /bin...`);
console.log(`📂 Origen: ${srcDir}`);
console.log(`📂 Destino: ${destDir}`);

if (!fs.existsSync(srcDir)) {
  console.error('❌ Error: La carpeta dist/studio/browser no existe. ¿Has ejecutado ng build?');
  process.exit(1);
}

// Limpiar destino (opcional, pero recomendado para evitar basura de builds anteriores)
fs.rmSync(destDir, { recursive: true, force: true });

try {
  copyRecursiveSync(srcDir, destDir);
  console.log('✅ Despliegue completado con éxito en /bin');
} catch (err) {
  console.error('❌ Error durante la copia:', err);
  process.exit(1);
}
