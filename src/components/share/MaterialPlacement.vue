<template>
  <div class="material-placement">
    <div class="section-header">
      <span class="section-icon">🎨</span>
      <span class="section-title">素材摆放</span>
      <div class="placement-stats">
        <span class="stat-pill">
          <span class="pill-icon">📦</span>
          {{ materials.length }} 个素材
        </span>
        <span class="stat-pill perfect" v-if="perfectCount > 0">
          <span class="pill-icon">🎯</span>
          {{ perfectCount }} 完美
        </span>
      </div>
    </div>

    <div v-if="materials.length === 0" class="empty-state">
      <span class="empty-icon">🎨</span>
      <span class="empty-text">暂无素材摆放记录</span>
    </div>

    <div v-else class="materials-grid">
      <div 
        v-for="material in displayMaterials" 
        :key="material.id + '-' + material.placementOrder"
        class="material-card"
        :class="[
          material.rarity,
          { 'is-perfect': material.isPerfect, 'is-optional': material.isOptional }
        ]"
      >
        <div class="material-header">
          <div class="material-icon" :style="{ background: material.color }">
            {{ getEmoji(material.shape) }}
          </div>
          <div class="material-order">#{{ material.placementOrder }}</div>
        </div>
        
        <div class="material-info">
          <div class="material-name">{{ material.name }}</div>
          <div class="material-tags">
            <span 
              v-for="tag in material.tags?.slice(0, 2)" 
              :key="tag"
              class="material-tag"
            >#{{ tag }}</span>
          </div>
        </div>

        <div class="material-footer">
          <div class="material-type">
            <span v-if="material.isOptional" class="type-badge optional">可选</span>
            <span v-else class="type-badge required">必放</span>
            <span v-if="material.isPerfect" class="type-badge perfect">完美</span>
          </div>
          <div class="material-emotion">
            <span class="emotion-value">+{{ material.emotion }}</span>
            <span class="emotion-icon">💕</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="combos && combos.length > 0" class="combos-section">
      <div class="section-subheader">
        <span class="subheader-icon">🔮</span>
        <span class="subheader-title">触发的组合</span>
        <span class="combo-count">{{ combos.length }} 个</span>
      </div>
      
      <div class="combos-list">
        <div 
          v-for="combo in combos" 
          :key="combo.id"
          class="combo-item"
          :class="{ 'has-hidden': combo.hasHiddenDialogue }"
        >
          <div class="combo-icon">
            <span v-if="combo.hasHiddenDialogue">💎</span>
            <span v-else>✨</span>
          </div>
          <div class="combo-info">
            <div class="combo-name">{{ combo.name }}</div>
            <div class="combo-materials">
              {{ combo.materials?.map(m => getMaterialName(m)).join(' + ') }}
            </div>
            <div v-if="combo.description" class="combo-desc">
              {{ combo.description }}
            </div>
          </div>
          <div class="combo-bonus">
            +{{ combo.emotionBonus }}
            <span class="bonus-icon">💕</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="materials.length > maxDisplay" class="show-more">
      <button class="show-more-btn" @click="toggleExpand">
        {{ isExpanded ? '收起' : `展示全部 ${materials.length} 个素材` }}
        <span class="arrow" :class="{ expanded: isExpanded }">▼</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  materials: {
    type: Array,
    default: () => []
  },
  combos: {
    type: Array,
    default: () => []
  },
  maxDisplay: {
    type: Number,
    default: 8
  }
})

const isExpanded = ref(false)

const displayMaterials = computed(() => {
  if (isExpanded.value) return props.materials
  return props.materials.slice(0, props.maxDisplay)
})

const perfectCount = computed(() => {
  return props.materials.filter(m => m.isPerfect).length
})

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

const getMaterialName = (materialId) => {
  const material = props.materials.find(m => m.id === materialId)
  return material?.name || materialId
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.material-placement {
  background: linear-gradient(135deg, #faf5ff, #fdf2f8);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e9d5ff;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.section-icon {
  font-size: 1.3rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  flex: 1;
}

.placement-stats {
  display: flex;
  gap: 8px;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.7);
  color: #7c3aed;
}

.stat-pill.perfect {
  background: #dcfce7;
  color: #16a34a;
}

.pill-icon {
  font-size: 0.85rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.9rem;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.material-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.material-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.material-card.legendary {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb, rgba(255, 255, 255, 0.9));
}

.material-card.rare {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #faf5ff, rgba(255, 255, 255, 0.9));
}

.material-card.is-perfect {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.material-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 10px;
}

.material-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.material-order {
  font-size: 0.7rem;
  font-weight: 700;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 10px;
}

.material-info {
  margin-bottom: 10px;
}

.material-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.material-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.material-tag {
  font-size: 0.65rem;
  color: #8b5cf6;
  background: #f3e8ff;
  padding: 1px 6px;
  border-radius: 6px;
}

.material-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.material-type {
  display: flex;
  gap: 4px;
}

.type-badge {
  font-size: 0.62rem;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 600;
}

.type-badge.required {
  background: #dbeafe;
  color: #2563eb;
}

.type-badge.optional {
  background: #fef3c7;
  color: #d97706;
}

.type-badge.perfect {
  background: #dcfce7;
  color: #16a34a;
}

.material-emotion {
  display: flex;
  align-items: center;
  gap: 2px;
}

.emotion-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #be185d;
}

.emotion-icon {
  font-size: 0.75rem;
}

.combos-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #ddd6fe;
}

.section-subheader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.subheader-icon {
  font-size: 1.1rem;
}

.subheader-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.combo-count {
  font-size: 0.75rem;
  color: #7c3aed;
  background: #ede9fe;
  padding: 4px 10px;
  border-radius: 10px;
  font-weight: 600;
}

.combos-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.combo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  border: 1px solid #ede9fe;
  transition: all 0.2s ease;
}

.combo-item:hover {
  background: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.combo-item.has-hidden {
  border-color: #fde68a;
  background: linear-gradient(135deg, #fef3c7, rgba(255, 255, 255, 0.8));
}

.combo-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.combo-info {
  flex: 1;
  min-width: 0;
}

.combo-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.combo-materials {
  font-size: 0.72rem;
  color: #7c3aed;
  margin-bottom: 2px;
}

.combo-desc {
  font-size: 0.7rem;
  color: #6b7280;
  font-style: italic;
}

.combo-bonus {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #be185d;
}

.bonus-icon {
  font-size: 0.8rem;
}

.show-more {
  margin-top: 16px;
  text-align: center;
}

.show-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  color: #7c3aed;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-more-btn:hover {
  background: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

.arrow {
  font-size: 0.65rem;
  transition: transform 0.2s ease;
}

.arrow.expanded {
  transform: rotate(180deg);
}

@media (max-width: 640px) {
  .material-placement {
    padding: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .placement-stats {
    width: 100%;
  }
  
  .materials-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  
  .material-card {
    padding: 10px;
  }
  
  .material-icon {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  
  .combo-item {
    flex-wrap: wrap;
  }
  
  .combo-bonus {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
