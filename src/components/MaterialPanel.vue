<template>
  <div class="material-panel">
    <div class="panel-header">
      <h3 class="handwriting" style="font-size: 1.2rem; margin: 0;">素材库</h3>
      <span v-if="isWaitingForMaterial" class="panel-hint pulse">请选择「{{ requiredMaterialName }}」</span>
    </div>
    <div class="materials-grid">
      <div
        v-for="material in availableMaterials"
        :key="material.id"
        class="material-item"
        :class="{ 
          active: isWaitingForMaterial && material.id === requiredMaterialId,
          disabled: isWaitingForMaterial && material.id !== requiredMaterialId,
          used: isMaterialUsed(material.id)
        }"
        @click="selectMaterial(material)"
      >
        <div class="material-icon" :style="{ background: material.color }">
          <span class="material-emoji">{{ getEmoji(material.shape) }}</span>
        </div>
        <div class="material-info">
          <span class="material-name">{{ material.name }}</span>
          <span class="material-emotion">+{{ material.emotion }} 💕</span>
        </div>
        <div v-if="isMaterialUsed(material.id)" class="used-badge">已放置</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const emit = defineEmits(['select'])

const gameStore = useGameStore()

const availableMaterials = computed(() => gameStore.availableMaterials)
const isWaitingForMaterial = computed(() => gameStore.isWaitingForMaterial)
const requiredMaterialId = computed(() => gameStore.requiredMaterialId)
const placedMaterials = computed(() => gameStore.placedMaterials)

const requiredMaterialName = computed(() => {
  if (!requiredMaterialId.value) return ''
  const material = gameStore.getMaterialById(requiredMaterialId.value)
  return material ? material.name : ''
})

const isMaterialUsed = (materialId) => {
  return placedMaterials.value.some(p => p.id === materialId)
}

const getEmoji = (shape) => {
  const emojiMap = {
    flower: '🌸',
    butterfly: '🦋',
    rectangle: '📄',
    circle: '☀️',
    cicada: '🦗',
    book: '📖',
    leaf: '🍂',
    cup: '☕',
    snowflake: '❄️',
    scarf: '🧣',
    heart: '💖',
    cloud: '☁️',
    star: '⭐',
    note: '🎵'
  }
  return emojiMap[shape] || '✨'
}

const selectMaterial = (material) => {
  if (isWaitingForMaterial.value && material.id !== requiredMaterialId.value) return
  if (isMaterialUsed(material.id)) return
  emit('select', material)
}
</script>

<style scoped>
.material-panel {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: var(--shadow-md);
  max-width: 600px;
  margin: 0 auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px dashed #e5e7eb;
}

.panel-hint {
  font-size: 0.9rem;
  color: var(--accent-pink);
  font-weight: 500;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.material-item {
  position: relative;
  background: var(--bg-primary);
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 15px 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.material-item:hover:not(.disabled):not(.used) {
  transform: translateY(-4px);
  border-color: var(--accent-pink);
  box-shadow: 0 4px 12px rgba(244, 114, 182, 0.2);
}

.material-item.active {
  border-color: var(--accent-pink);
  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
  animation: pulse 1.5s infinite;
}

.material-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.material-item.used {
  opacity: 0.6;
  cursor: not-allowed;
}

.material-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.material-item:hover:not(.disabled):not(.used) .material-icon {
  transform: scale(1.1);
}

.material-emoji {
  font-size: 1.5rem;
}

.material-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.material-name {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 500;
}

.material-emotion {
  font-size: 0.75rem;
  color: var(--accent-pink);
}

.used-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #10b981;
  color: white;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .material-panel {
    padding: 15px;
  }

  .materials-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }

  .material-item {
    padding: 12px 8px;
  }

  .material-icon {
    width: 40px;
    height: 40px;
  }

  .material-emoji {
    font-size: 1.2rem;
  }
}
</style>
