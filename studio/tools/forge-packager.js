const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

/**
 * GeoWE Forge Packager
 * Uso: node forge-packager.js <ruta_al_plugin>
 */

const pluginPath = process.argv[2];

if (!pluginPath) {
    console.error('Error: Debes especificar la ruta a la carpeta del plugin.');
    console.log('Uso: node forge-packager.js plugins/mi-plugin');
    process.exit(1);
}

const absolutePath = path.resolve(pluginPath);
const manifestPath = path.join(absolutePath, 'manifest.json');
const extensionPath = path.join(absolutePath, 'extension.json');
const appPath = path.join(absolutePath, 'app.json');

let manifest;
let type = 'plugin';

if (fs.existsSync(appPath)) {
    manifest = JSON.parse(fs.readFileSync(appPath, 'utf8'));
    type = 'app';
} else if (fs.existsSync(extensionPath)) {
    manifest = JSON.parse(fs.readFileSync(extensionPath, 'utf8'));
    type = 'extension';
} else if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} else {
    console.error(`Error: No se encontró app.json, extension.json ni manifest.json en ${absolutePath}`);
    process.exit(1);
}


const zip = new JSZip();


function addFilesToZip(dir, zipInstance) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            const folder = zipInstance.folder(item);
            addFilesToZip(fullPath, folder);
        } else {
            const content = fs.readFileSync(fullPath);
            zipInstance.file(item, content);
        }
    });
}

console.log(`📦 Empaquetando ${type}: ${manifest.name} (${manifest.id})...`);

addFilesToZip(absolutePath, zip);

const typeToExt = {
    'app': 'gapp',
    'extension': 'gext',
    'plugin': 'gplugin'
};
const ext = typeToExt[type];
const outputFileName = `${manifest.id}_v${manifest.version || '1.0.0'}.${ext}`;

const outputPath = path.join(process.cwd(), outputFileName);


zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    .then(buffer => {
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ ¡Éxito! Plugin empaquetado en: ${outputPath}`);
    })
    .catch(err => {
        console.error('❌ Error al generar el ZIP:', err);
    });
