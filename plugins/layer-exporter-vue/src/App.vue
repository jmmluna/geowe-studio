<script setup lang="ts">
import { ref, computed } from 'vue';
import { COMMON_PROJECTIONS, exportLayer } from './ExporterService';

const props = defineProps<{
  context: any;
  layer: any;
  onClose: () => void;
}>();

const filename = ref(props.layer.get('name') || 'export');
const selectedFormat = ref<'geojson' | 'shp' | 'kml' | 'wkt' | 'gpkg'>('geojson');
const searchProjection = ref('');
const selectedProj = ref('EPSG:4326');
const isExporting = ref(false);

const filteredProjections = computed(() => {
  const search = searchProjection.value.toLowerCase();
  return COMMON_PROJECTIONS.filter(p => 
    p.code.toLowerCase().includes(search) || 
    p.name.toLowerCase().includes(search)
  );
});

async function handleExport() {
  try {
    isExporting.value = true;
    props.context.ui.setStatus(`Exportando ${filename.value}...`);
    
    const sourceProj = props.context.map.getView().getProjection().getCode();
    const features = props.layer.getSource().getFeatures();

    await exportLayer(features, sourceProj, {
      filename: filename.value,
      format: selectedFormat.value,
      projectionCode: selectedProj.value
    });

    props.context.ui.setStatus(`Capa '${filename.value}' exportada con éxito`);
    props.onClose();
  } catch (e: any) {
    props.context.ui.setStatus(`Error: ${e.message}`);
    console.error(e);
  } finally {
    isExporting.value = false;
  }
}
</script>

<template>
  <div class="exporter-panel">
    <!-- Formulario de Exportación -->
    <div class="geowe-ui-section">
      <div class="geowe-ui-section-header">
        <span class="material-icons">description</span>
        Nombre del Archivo
      </div>
      <input type="text" v-model="filename" class="geowe-ui-input" placeholder="Nombre del archivo">
    </div>

    <div class="geowe-ui-section">
      <div class="geowe-ui-section-header">
        <span class="material-icons">grid_view</span>
        Formato de Salida
      </div>
      <div class="geowe-ui-row" style="flex-wrap: wrap;">
        <label v-for="f in ['geojson', 'shp', 'kml', 'wkt', 'gpkg']" :key="f" class="format-option">
          <input type="radio" v-model="selectedFormat" :value="f">
          <span>{{ f.toUpperCase() }}</span>
        </label>
      </div>
    </div>

    <div class="geowe-ui-section">
      <div class="geowe-ui-section-header">
        <span class="material-icons">map</span>
        Proyección (EPSG)
      </div>
      <input type="text" v-model="searchProjection" class="geowe-ui-input" placeholder="Buscar EPSG..." style="margin-bottom: 8px;">
      
      <div class="projection-list">
        <div v-for="p in filteredProjections" 
             :key="p.code" 
             class="projection-item"
             :class="{ active: selectedProj === p.code }"
             @click="selectedProj = p.code">
          <strong>{{ p.code }}</strong> - {{ p.name }}
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="onClose" class="geowe-ui-btn geowe-ui-btn-secondary">Cancelar</button>
      <button @click="handleExport" :disabled="isExporting" class="geowe-ui-btn geowe-ui-btn-primary">
        <span class="material-icons" v-if="!isExporting">download</span>
        <span v-else>Procesando...</span>
        Exportar
      </button>
    </div>
  </div>
</template>

<style scoped>
.exporter-panel {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
}

.projection-list {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #ecf0f1;
  border-radius: 8px;
}

.projection-item {
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 1px solid #f8f9fa;
}

.projection-item:hover {
  background: #f1f9ff;
}

.projection-item.active {
  background: #3498db;
  color: white;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
</style>
