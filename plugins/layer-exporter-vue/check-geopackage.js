const { GeoPackageAPI } = require('./node_modules/@ngageoint/geopackage');
console.log('Keys in GeoPackageAPI:', Object.keys(GeoPackageAPI).filter(k => k.includes('GeoJSON')));
