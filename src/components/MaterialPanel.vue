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

    <div v-if="recommendedSections.length > 0" class="smart-recommendations">
      <div class="rec-header">
        <span class="rec-title">🎯 精准推荐</span>
        <span class="rec-subtitle">基于当前场景智能排序</span>
      </div>

      <div v-if="recommendations.required.length > 0" class="rec-section rec-required">
        <div class="rec-section-header">
          <span class="rec-icon">🔴</span>
          <span class="rec-section-title">主线必放</span>
          <span class="rec-badge required-badge-tag">推进剧情</span>
        </div>
        <div class="rec-items">
          <div
            v-for="mat in recommendations.required"
            :key="mat.id"
            class="rec-item"
            :class="{ used: isMaterialUsed(mat.id) }"
          >
            <span class="rec-item-emoji" :style="{ background: mat.color }">{{ getEmoji(mat.shape) }}</span>
            <span class="rec-item-name">{{ mat.name }}</span>
            <span v-if="isMaterialUsed(mat.id)" class="rec-item-check">✓</span>
            <span v-else class="rec-item-reason">{{ mat.reason }}</span>
          </div>
        </div>
      </div>

      <div v-if="recommendations.hiddenCombo.length > 0" class="rec-section rec-hidden">
        <div class="rec-section-header">
          <span class="rec-icon">🟣</span>
          <span class="rec-section-title">隐藏组合优先</span>
          <span class="rec-badge hidden-badge-tag">解锁隐藏对话</span>
        </div>
        <div class="rec-items">
          <div
            v-for="mat in recommendations.hiddenCombo"
            :key="mat.id"
            class="rec-item"
            :class="{ used: isMaterialUsed(mat.id) }"
          >
            <span class="rec-item-emoji" :style="{ background: mat.color }">{{ getEmoji(mat.shape) }}</span>
            <span class="rec-item-name">{{ mat.name }}</span>
            <span v-if="isMaterialUsed(mat.id)" class="rec-item-check">✓</span>
            <span v-else class="rec-item-reason">
              解锁「{{ mat.comboName }}」 +{{ mat.emotionBonus }}💕
            </span>
          </div>
        </div>
      </div>

      <div v-if="recommendations.normalCombo.length > 0" class="rec-section rec-normal">
        <div class="rec-section-header">
          <span class="rec-icon">🔵</span>
          <span class="rec-section-title">组合补充</span>
          <span class="rec-badge combo-badge-tag">收集加成</span>
        </div>
        <div class="rec-items">
          <div
            v-for="mat in recommendations.normalCombo"
            :key="mat.id"
            class="rec-item"
            :class="{ used: isMaterialUsed(mat.id) }"
          >
            <span class="rec-item-emoji" :style="{ background: mat.color }">{{ getEmoji(mat.shape) }}</span>
            <span class="rec-item-name">{{ mat.name }}</span>
            <span v-if="isMaterialUsed(mat.id)" class="rec-item-check">✓</span>
            <span v-else class="rec-item-reason">
              解锁「{{ mat.comboName }}」 +{{ mat.emotionBonus }}💕
            </span>
          </div>
        </div>
      </div>

      <div v-if="recommendations.optional.length > 0" class="rec-section rec-optional">
        <div class="rec-section-header">
          <span class="rec-icon">⚪</span>
          <span class="rec-section-title">可选加成</span>
          <span class="rec-badge optional-badge-tag">额外情绪值</span>
        </div>
        <div class="rec-items">
          <div
            v-for="mat in recommendations.optional"
            :key="mat.id"
            class="rec-item"
            :class="{ used: isMaterialUsed(mat.id) }"
          >
            <span class="rec-item-emoji" :style="{ background: mat.color }">{{ getEmoji(mat.shape) }}</span>
            <span class="rec-item-name">{{ mat.name }}</span>
            <span v-if="isMaterialUsed(mat.id)" class="rec-item-check">✓</span>
            <span v-else class="rec-item-reason">
              +{{ mat.emotionBonus }}💕 情绪加成
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="currentSceneCombos.length > 0" class="combo-hints">
      <div class="combo-title">🔮 本场景组合收集进度：</div>
      <div 
        v-for="combo in currentSceneCombos" 
        :key="combo.id" 
        class="combo-hint-item"
        :class="{ triggered: isComboTriggered(combo.id) }"
      >
        <div class="combo-status">
          <span v-if="isComboTriggered(combo.id)" class="combo-done">✓ 已解锁</span>
          <span v-else class="combo-locked">
            🔒 {{ combo.hiddenDialogue ? '隐藏' : '普通' }}
          </span>
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
          <span class="combo-bonus">+{{ combo.emotionBonus }} 💕 {{ combo.hiddenDialogue ? '含隐藏对话' : '奖励' }}</span>
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
          recommended: isHighPriority(material.id),
          'recommended-hidden': isHiddenPriority(material.id),
          [material.rarity || 'common']: true
        }"
        @click="selectMaterial(material)"
      >
        <div v-if="material.rarity === 'rare'" class="rarity-badge rare">稀有</div>
        <div v-else-if="material.rarity === 'legendary'" class="rarity-badge legendary">传说</div>
        
        <div v-if="getPriorityLabel(material.id)" class="priority-tag" :class="'priority-' + getPriorityClass(material.id)">
          {{ getPriorityLabel(material.id) }}
        </div>
        
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

        <div v-if="getPriorityReason(material.id) && !isMaterialUsed(material.id)" class="priority-reason">
          {{ getPriorityReason(material.id) }}
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
const materialCategories = computed(() => gameStore.materialCategories)
const activeMaterialFilter = computed(() => gameStore.activeMaterialFilter)
const recommendations = computed(() => gameStore.sceneRecommendedMaterials)

const recommendedSections = computed(() => {
  const rec = recommendations.value
  return [
    rec.required.length > 0 && 'required',
    rec.hiddenCombo.length > 0 && 'hiddenCombo',
    rec.normalCombo.length > 0 && 'normalCombo',
    rec.optional.length > 0 && 'optional'
  ].filter(Boolean)
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

const getPriorityInfo = (materialId) => {
  return gameStore.getMaterialPriorityInfo(materialId)
}

const getPriorityLabel = (materialId) => {
  const info = getPriorityInfo(materialId)
  if (!info) return ''
  const labelMap = { 1: '必放', 2: '隐藏', 3: '组合', 4: '可选' }
  return labelMap[info.priority] || ''
}

const getPriorityClass = (materialId) => {
  const info = getPriorityInfo(materialId)
  if (!info) return ''
  const classMap = { 1: 'required', 2: 'hidden', 3: 'combo', 4: 'optional' }
  return classMap[info.priority] || ''
}

const getPriorityReason = (materialId) => {
  const info = getPriorityInfo(materialId)
  return info?.reason || ''
}

const isHighPriority = (materialId) => {
  const info = getPriorityInfo(materialId)
  return info && info.priority === 1
}

const isHiddenPriority = (materialId) => {
  const info = getPriorityInfo(materialId)
  return info && info.priority === 2
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

.smart-recommendations {
  background: linear-gradient(135deg, #fefce8, #fef9c3);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
  border: 1px solid #fde047;
}

.rec-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.rec-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #854d0e;
}

.rec-subtitle {
  font-size: 0.75rem;
  color: #a16207;
  opacity: 0.8;
}

.rec-section {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 10px;
}

.rec-section:last-child {
  margin-bottom: 0;
}

.rec-section.rec-required {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1px solid #fecaca;
}

.rec-section.rec-hidden {
  background: linear-gradient(135deg, #faf5ff, #f3e8ff);
  border: 1px solid #ddd6fe;
}

.rec-section.rec-normal {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
}

.rec-section.rec-optional {
  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
  border: 1px solid #e5e7eb;
}

.rec-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.rec-icon {
  font-size: 0.85rem;
}

.rec-section-title {
  font-size: 0.85rem;
  font-weight: 600;
}

.rec-required .rec-section-title { color: #b91c1c; }
.rec-hidden .rec-section-title { color: #6b21a8; }
.rec-normal .rec-section-title { color: #1d4ed8; }
.rec-optional .rec-section-title { color: #374151; }

.rec-badge {
  margin-left: auto;
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.required-badge-tag {
  background: #fee2e2;
  color: #b91c1c;
}

.hidden-badge-tag {
  background: #ddd6fe;
  color: #6b21a8;
}

.combo-badge-tag {
  background: #bfdbfe;
  color: #1d4ed8;
}

.optional-badge-tag {
  background: #e5e7eb;
  color: #374151;
}

.rec-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.rec-item.used {
  opacity: 0.5;
}

.rec-item-emoji {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.rec-item-name {
  font-weight: 600;
  color: var(--text-primary);
}

.rec-item-check {
  margin-left: auto;
  color: #10b981;
  font-weight: bold;
}

.rec-item-reason {
  margin-left: auto;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.combo-hints {
  background: linear-gradient(135deg, #faf5ff, #fdf4ff);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
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
  overflow: visible;
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
  border-color: #ef4444;
  animation: recommendPulse 2s infinite;
}

.material-item.recommended-hidden:not(.used):not(.disabled) {
  border-color: #8b5cf6;
  animation: recommendHiddenPulse 2s infinite;
}

@keyframes recommendPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
  }
}

@keyframes recommendHiddenPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(139, 92, 246, 0);
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

.priority-tag {
  position: absolute;
  top: -8px;
  left: -8px;
  font-size: 0.6rem;
  padding: 2px 7px;
  border-radius: 10px;
  font-weight: 700;
  color: white;
  z-index: 5;
}

.priority-tag.priority-required {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.priority-tag.priority-hidden {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.priority-tag.priority-combo {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.priority-tag.priority-optional {
  background: linear-gradient(135deg, #6b7280, #4b5563);
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

.rarity-badge {
  position: absolute;
  top: 28px;
  left: 6px;
  font-size: 0.6rem;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 600;
}

.material-item:not(.recommended):not(.recommended-hidden) .rarity-badge {
  top: 6px;
}

.rarity-badge.rare {
  background: #8b5cf6;
  color: white;
}

.rarity-badge.legendary {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: white;
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

.priority-reason {
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.95);
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.materials-grid {
  margin-bottom: 10px;
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

  .smart-recommendations {
    padding: 12px;
  }

  .combo-hints {
    padding: 12px;
  }

  .combo-hint-item {
    flex-direction: column;
    gap: 4px;
  }

  .rec-item {
    flex-wrap: wrap;
  }

  .rec-item-reason {
    margin-left: 0;
    width: 100%;
    padding-left: 34px;
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

  .priority-reason {
    display: none;
  }
}
</style>
