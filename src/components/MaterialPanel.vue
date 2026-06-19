<template>
  <div class="material-panel">
    <div class="panel-header">
      <h3 class="handwriting" style="font-size: 1.2rem; margin: 0;">素材库</h3>
      <div class="panel-status">
        <span v-if="isWaitingForMaterial" class="panel-hint pulse">请选择「{{ requiredMaterialName }}」</span>
        <span v-else-if="canPlaceOptionalMaterial" class="panel-hint optional-hint pulse">✨ 还可放置额外素材解锁组合</span>
        <span v-else class="panel-hint done">本场景素材已放置完毕</span>
      </div>
    </div>

    <div v-if="chapterRecommendation && chapterRecommendation.length > 0" class="chapter-recommendation">
      <div class="recommendation-title">💡 本章节推荐：</div>
      <div class="recommendation-tags">
        <span 
          v-for="mat in chapterRecommendation" 
          :key="mat.id"
          class="recommendation-tag"
          :class="{ used: isMaterialUsed(mat.id) }"
        >
          <span class="rec-emoji">{{ getEmoji(mat.shape) }}</span>
          <span class="rec-name">{{ mat.name }}</span>
          <span v-if="isMaterialUsed(mat.id)" class="rec-check">✓</span>
        </span>
      </div>
    </div>

    <div v-if="currentSceneCombos.length > 0" class="combo-hints">
      <div class="combo-title">🔮 本场景组合提示：</div>
      <div 
        v-for="combo in currentSceneCombos" 
        :key="combo.id" 
        class="combo-hint-item"
        :class="{ triggered: isComboTriggered(combo.id) }"
      >
        <div class="combo-status">
          <span v-if="isComboTriggered(combo.id)" class="combo-done">✓ 已解锁</span>
          <span v-else class="combo-locked">🔒 未解锁</span>
        </div>
        <div class="combo-info">
          <span class="combo-name">{{ combo.name }}</span>
          <div class="combo-materials">
            需要：
            <span 
              v-for="(matId, idx) in combo.materials" 
              :key="matId"
              class="combo-material"
              :class="{ available: isMaterialAvailable(matId), used: isMaterialUsed(matId) }"
            >{{ getMaterialName(matId) }}{{ idx < combo.materials.length - 1 ? ' + ' : '' }}</span>
          </div>
          <span class="combo-bonus">+{{ combo.emotionBonus }} 💕 隐藏奖励</span>
        </div>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-label">分类筛选：</div>
      <div class="filter-buttons">
        <button
          v-for="cat in materialCategories"
          :key="cat.id"
          class="filter-btn"
          :class="{ active: activeMaterialFilter === cat.id }"
          @click="setMaterialFilter(cat.id)"
        >
          {{ cat.name }}
        </button>
      </div>
      <div class="filter-stats">
        显示 {{ filteredAvailableMaterials.length }} / {{ availableMaterials.length }} 个素材
      </div>
    </div>

    <div class="materials-grid">
      <div
        v-for="material in filteredAvailableMaterials"
        :key="material.id"
        class="material-item"
        :class="{ 
          active: isMaterialSelectable(material),
          disabled: !isMaterialSelectable(material) && !isMaterialUsed(material.id),
          used: isMaterialUsed(material.id),
          optional: isOptionalMaterial(material.id),
          required: material.id === requiredMaterialId,
          recommended: isRecommendedMaterial(material.id),
          [material.rarity || 'common']: true
        }"
        @click="selectMaterial(material)"
      >
        <div v-if="material.rarity === 'rare'" class="rarity-badge rare">稀有</div>
        <div v-else-if="material.rarity === 'legendary'" class="rarity-badge legendary">传说</div>
        
        <div v-if="isRecommendedMaterial(material.id) && !isMaterialUsed(material.id)" class="recommend-badge">推荐</div>
        
        <div class="material-icon" :style="{ background: material.color }">
          <span class="material-emoji">{{ getEmoji(material.shape) }}</span>
        </div>
        <div class="material-info">
          <span class="material-name">{{ material.name }}</span>
          <span class="material-emotion">+{{ material.emotion }} 💕</span>
        </div>
        
        <div v-if="isMaterialUsed(material.id)" class="used-badge">
          <span class="used-icon">✓</span>
          <span class="used-text">已放置</span>
        </div>
        <div v-else-if="isOptionalMaterial(material.id) && requiredMaterialPlaced" class="optional-badge">可选</div>
        <div v-else-if="material.id === requiredMaterialId && isWaitingForMaterial" class="required-badge">必需</div>
        
        <div v-if="getUsageCount(material.id) > 0" class="usage-counter">
          使用: {{ getUsageCount(material.id) }}次
        </div>
      </div>
    </div>

    <div v-if="filteredAvailableMaterials.length === 0 && availableMaterials.length > 0" class="empty-filter-hint">
      该分类下没有可用素材，<button class="link-btn" @click="resetMaterialFilter">查看全部</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const emit = defineEmits(['select'])

const gameStore = useGameStore()

const availableMaterials = computed(() => gameStore.availableMaterials)
const filteredAvailableMaterials = computed(() => gameStore.filteredAvailableMaterials)
const isWaitingForMaterial = computed(() => gameStore.isWaitingForMaterial)
const requiredMaterialId = computed(() => gameStore.requiredMaterialId)
const optionalMaterialsPlaced = computed(() => gameStore.optionalMaterialsPlaced)
const requiredMaterialPlaced = computed(() => gameStore.requiredMaterialPlaced)
const canPlaceOptionalMaterial = computed(() => gameStore.canPlaceOptionalMaterial)
const currentSceneCombos = computed(() => gameStore.currentSceneCombos)
const currentSceneTriggeredCombos = computed(() => gameStore.currentSceneTriggeredCombos)
const currentSceneOptionalMaterials = computed(() => gameStore.currentSceneOptionalMaterials)
const currentScene = computed(() => gameStore.currentScene)
const materialCategories = computed(() => gameStore.materialCategories)
const activeMaterialFilter = computed(() => gameStore.activeMaterialFilter)
const currentChapterRecommendedMaterials = computed(() => gameStore.currentChapterRecommendedMaterials)

const chapterRecommendation = computed(() => {
  return currentChapterRecommendedMaterials.value
})

const requiredMaterialName = computed(() => {
  if (!requiredMaterialId.value) return ''
  const material = gameStore.getMaterialById(requiredMaterialId.value)
  return material ? material.name : ''
})

const isMaterialUsed = (materialId) => {
  if (materialId === requiredMaterialId.value) {
    return requiredMaterialPlaced.value
  }
  return optionalMaterialsPlaced.value.some(p => p.id === materialId)
}

const isOptionalMaterial = (materialId) => {
  return currentSceneOptionalMaterials.value.some(m => m.id === materialId)
}

const isMaterialSelectable = (material) => {
  if (isMaterialUsed(material.id)) return false
  if (isWaitingForMaterial.value) {
    return material.id === requiredMaterialId.value
  }
  return canPlaceOptionalMaterial.value && isOptionalMaterial(material.id)
}

const isMaterialAvailable = (materialId) => {
  const material = availableMaterials.value.find(m => m.id === materialId)
  return !!material && !isMaterialUsed(materialId)
}

const isComboTriggered = (comboId) => {
  return currentSceneTriggeredCombos.value.some(c => c.id === comboId)
}

const isRecommendedMaterial = (materialId) => {
  return currentChapterRecommendedMaterials.value.some(m => m.id === materialId)
}

const getMaterialName = (materialId) => {
  const material = gameStore.getMaterialById(materialId)
  return material ? material.name : materialId
}

const getUsageCount = (materialId) => {
  return gameStore.getMaterialUsageCount(materialId)
}

const setMaterialFilter = (filter) => {
  gameStore.setMaterialFilter(filter)
}

const resetMaterialFilter = () => {
  gameStore.resetMaterialFilter()
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
  if (!isMaterialSelectable(material)) return
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
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px dashed #e5e7eb;
  gap: 12px;
}

.panel-status {
  text-align: right;
}

.panel-hint {
  font-size: 0.85rem;
  font-weight: 500;
}

.panel-hint.pulse {
  color: var(--accent-pink);
}

.optional-hint {
  color: #8b5cf6 !important;
}

.panel-hint.done {
  color: #10b981;
  font-size: 0.8rem;
}

.chapter-recommendation {
  background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
  border: 1px solid #a7f3d0;
}

.recommendation-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #059669;
  margin-bottom: 8px;
}

.recommendation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recommendation-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  border: 1px solid #6ee7b7;
  transition: all 0.2s ease;
}

.recommendation-tag.used {
  background: #d1fae5;
  border-color: #10b981;
  opacity: 0.7;
}

.rec-emoji {
  font-size: 0.9rem;
}

.rec-name {
  color: #065f46;
  font-weight: 500;
}

.rec-check {
  color: #10b981;
  font-weight: bold;
}

.combo-hints {
  background: linear-gradient(135deg, #faf5ff, #fdf4ff);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 18px;
  border: 1px solid #e9d5ff;
}

.combo-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #7c3aed;
  margin-bottom: 10px;
}

.combo-hint-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed #e9d5ff;
  align-items: flex-start;
}

.combo-hint-item:last-child {
  border-bottom: none;
}

.combo-hint-item.triggered {
  opacity: 0.7;
}

.combo-status {
  flex-shrink: 0;
  font-size: 0.75rem;
  margin-top: 2px;
}

.combo-done {
  color: #10b981;
  font-weight: 600;
}

.combo-locked {
  color: #9ca3af;
}

.combo-info {
  flex: 1;
  min-width: 0;
}

.combo-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b21a8;
  display: block;
  margin-bottom: 3px;
}

.combo-materials {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 3px;
  line-height: 1.5;
}

.combo-material.available {
  color: #059669;
  font-weight: 500;
}

.combo-material.used {
  color: #10b981;
  text-decoration: line-through;
}

.combo-bonus {
  font-size: 0.75rem;
  color: #ec4899;
  font-weight: 500;
}

.filter-section {
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4b5563;
}

.filter-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.filter-btn:hover {
  border-color: var(--accent-pink);
  color: var(--accent-pink);
}

.filter-btn.active {
  background: linear-gradient(135deg, #f472b6, #ec4899);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(244, 114, 182, 0.3);
}

.filter-stats {
  margin-left: auto;
  font-size: 0.75rem;
  color: #9ca3af;
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
  overflow: hidden;
}

.material-item.rare {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #faf5ff, #ffffff);
}

.material-item.legendary {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #ffffff);
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2);
}

.material-item.recommended:not(.used):not(.disabled) {
  border-color: #10b981;
  animation: recommendPulse 2s infinite;
}

@keyframes recommendPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
}

.material-item:hover:not(.disabled):not(.used) {
  transform: translateY(-4px);
  border-color: var(--accent-pink);
  box-shadow: 0 4px 12px rgba(244, 114, 182, 0.2);
}

.material-item.rare:hover:not(.disabled):not(.used) {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
}

.material-item.legendary:hover:not(.disabled):not(.used) {
  border-color: #f59e0b;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
}

.material-item.active {
  border-color: var(--accent-pink);
  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
  animation: pulse 1.5s infinite;
}

.material-item.optional.active {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #faf5ff, #f5f3ff);
  animation: pulsePurple 1.5s infinite;
}

.material-item.required.active {
  border-color: var(--accent-pink);
}

.material-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.material-item.used {
  opacity: 0.7;
  cursor: not-allowed;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border-color: #d1d5db;
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
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 0.65rem;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
}

.used-icon {
  font-size: 0.8rem;
}

.optional-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #8b5cf6;
  color: white;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.required-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--accent-pink);
  color: white;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.recommend-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 600;
}

.rarity-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 0.6rem;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 600;
}

.rarity-badge.rare {
  background: #8b5cf6;
  color: white;
}

.rarity-badge.legendary {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: white;
}

.material-item.recommended .rarity-badge {
  top: 28px;
}

.usage-counter {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 0.6rem;
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.8);
  padding: 1px 4px;
  border-radius: 4px;
}

.empty-filter-hint {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 0.9rem;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent-pink);
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
}

.link-btn:hover {
  color: #ec4899;
}

@keyframes pulsePurple {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(139, 92, 246, 0);
  }
}

@media (max-width: 768px) {
  .material-panel {
    padding: 15px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .panel-status {
    text-align: left;
  }

  .filter-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .filter-stats {
    margin-left: 0;
  }

  .chapter-recommendation {
    padding: 10px 12px;
  }

  .combo-hints {
    padding: 12px;
  }

  .combo-hint-item {
    flex-direction: column;
    gap: 4px;
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
