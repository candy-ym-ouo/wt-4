<template>
  <div class="decoration-panel-overlay" v-if="showDecorationPanel" @click.self="closeDecorationPanel">
    <div class="decoration-panel">
      <div class="decoration-panel-header">
        <div class="decoration-panel-title-row">
          <span class="decoration-panel-icon">🎨</span>
          <h2 class="decoration-panel-title">手账装扮</h2>
        </div>
        <button class="decoration-panel-close" @click="closeDecorationPanel">
          <span>✕</span>
        </button>
      </div>

      <div class="decoration-stats">
        <div class="decoration-stat-item">
          <span class="stat-icon">✅</span>
          <span class="stat-value">{{ stats.unlocked }}/{{ stats.total }}</span>
          <span class="stat-label">已解锁</span>
        </div>
        <div class="decoration-stat-item">
          <span class="stat-icon">🎨</span>
          <span class="stat-value">{{ stats.background.unlocked }}/{{ stats.background.total }}</span>
          <span class="stat-label">背景</span>
        </div>
        <div class="decoration-stat-item">
          <span class="stat-icon">🖼️</span>
          <span class="stat-value">{{ stats.frame.unlocked }}/{{ stats.frame.total }}</span>
          <span class="stat-label">边框</span>
        </div>
        <div class="decoration-stat-item">
          <span class="stat-icon">✍️</span>
          <span class="stat-value">{{ stats.font.unlocked }}/{{ stats.font.total }}</span>
          <span class="stat-label">字体</span>
        </div>
        <div class="decoration-stat-item">
          <span class="stat-icon">📖</span>
          <span class="stat-value">{{ stats.cover.unlocked }}/{{ stats.cover.total }}</span>
          <span class="stat-label">封面</span>
        </div>
      </div>

      <div class="decoration-progress-bar">
        <div 
          class="decoration-progress-fill" 
          :style="{ width: stats.percent + '%' }"
        ></div>
        <span class="decoration-progress-text">{{ Math.round(stats.percent) }}% 收集度</span>
      </div>

      <div class="decoration-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="decoration-tab" 
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.name }}</span>
          <span class="tab-badge" v-if="getTabCount(tab.id) > 0">{{ getTabCount(tab.id) }}</span>
        </button>
      </div>

      <div class="decoration-filter">
        <button 
          v-for="filter in filters" 
          :key="filter.id"
          class="filter-btn"
          :class="{ active: activeFilter === filter.id }"
          @click="activeFilter = filter.id"
        >
          {{ filter.name }}
        </button>
      </div>

      <div class="decoration-list-container">
        <div class="decoration-list">
          <div 
            v-for="(decoration, index) in filteredDecorations" 
            :key="decoration.id"
            class="decoration-item-wrapper"
            :style="{ animationDelay: index * 0.05 + 's' }"
          >
            <DecorationBadge 
              :decoration="decoration"
              :show-action="true"
              :show-animation="isNewlyUnlocked(decoration.id)"
              @click="selectDecoration(decoration)"
              @apply="applyDecoration"
            />
          </div>

          <div class="empty-state" v-if="filteredDecorations.length === 0">
            <span class="empty-icon">{{ getEmptyIcon() }}</span>
            <p class="empty-text">暂无{{ getCurrentTabName() }}装扮</p>
            <p class="empty-hint">{{ getEmptyHint() }}</p>
          </div>
        </div>
      </div>

      <div class="decoration-panel-footer">
        <div class="rarity-legend">
          <span class="legend-label">稀有度:</span>
          <span v-for="rarity in rarityList" :key="rarity.id" class="legend-item">
            <span class="legend-dot" :style="{ background: rarity.color }"></span>
            <span>{{ rarity.name }}</span>
          </span>
        </div>
      </div>
    </div>

    <Transition name="modal-fade">
      <div class="decoration-detail-modal" v-if="selectedDecoration" @click.self="selectedDecoration = null">
        <div class="decoration-detail-content">
          <div class="detail-preview" :class="`rarity-${selectedDecoration.rarity}`">
            <div class="preview-inner" :style="getDetailPreviewStyle()">
              <div v-if="selectedDecoration.category === 'background'" class="detail-bg-preview" :style="getBackgroundPreview()"></div>
              <div v-else-if="selectedDecoration.category === 'frame'" class="detail-frame-preview" :style="getFramePreview()"></div>
              <div v-else-if="selectedDecoration.category === 'font'" class="detail-font-preview" :style="getFontPreview()">
                手账文字
              </div>
              <div v-else-if="selectedDecoration.category === 'cover'" class="detail-cover-preview" :style="getCoverPreview()">
                <span class="cover-icon">{{ selectedDecoration.preview.icon }}</span>
                <span class="cover-title" :style="{ color: selectedDecoration.preview.titleColor }">章节标题</span>
              </div>
            </div>
          </div>
          
          <div class="detail-category">
            <span class="category-icon">{{ getCategoryIcon(selectedDecoration.category) }}</span>
            <span>{{ getCategoryLabel(selectedDecoration.category) }}</span>
          </div>
          
          <h3 class="detail-name">{{ isUnlocked(selectedDecoration.id) ? selectedDecoration.name : '???' }}</h3>
          
          <div class="detail-rarity" :style="getRarityStyle(selectedDecoration.rarity)">
            {{ getRarityLabel(selectedDecoration.rarity) }}
          </div>
          
          <p class="detail-description">
            {{ isUnlocked(selectedDecoration.id) ? selectedDecoration.description : getUnlockHint(selectedDecoration) }}
          </p>

          <div v-if="selectedDecoration.tags && selectedDecoration.tags.length > 0" class="detail-tags">
            <span v-for="tag in selectedDecoration.tags" :key="tag" class="detail-tag">
              #{{ tag }}
            </span>
          </div>

          <div v-if="isUnlocked(selectedDecoration.id) && getUnlockTime(selectedDecoration.id)" class="detail-time">
            解锁时间: {{ formatDate(getUnlockTime(selectedDecoration.id)) }}
          </div>

          <div class="detail-actions">
            <button 
              v-if="isUnlocked(selectedDecoration.id) && !isApplied(selectedDecoration.category, selectedDecoration.id)"
              class="apply-detail-btn"
              @click="applyDecoration(selectedDecoration)"
            >
              应用此装扮
            </button>
            <button 
              v-else-if="isApplied(selectedDecoration.category, selectedDecoration.id)"
              class="applied-detail-btn"
              disabled
            >
              ✓ 已应用
            </button>
            <button v-else class="locked-detail-btn" disabled>
              🔒 未解锁
            </button>
            <button class="detail-close-btn" @click="selectedDecoration = null">关闭</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDecorationStore } from '../stores/decorationStore'
import DecorationBadge from './DecorationBadge.vue'

const props = defineProps({
  showDecorationPanel: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const decorationStore = useDecorationStore()
const activeTab = ref('all')
const activeFilter = ref('all')
const selectedDecoration = ref(null)

const tabs = [
  { id: 'all', name: '全部', icon: '🎨' },
  { id: 'background', name: '背景', icon: '🎨' },
  { id: 'frame', name: '边框', icon: '🖼️' },
  { id: 'font', name: '字体', icon: '✍️' },
  { id: 'cover', name: '封面', icon: '📖' }
]

const filters = [
  { id: 'all', name: '全部' },
  { id: 'unlocked', name: '已解锁' },
  { id: 'locked', name: '未解锁' }
]

const rarityList = computed(() => {
  return Object.values(decorationStore.DECORATION_RARITY)
})

const stats = computed(() => decorationStore.getStats())

const allDecorations = computed(() => decorationStore.decorations)

const filteredDecorations = computed(() => {
  let list = allDecorations.value
  
  if (activeTab.value !== 'all') {
    list = list.filter(d => d.category === activeTab.value)
  }
  
  if (activeFilter.value === 'unlocked') {
    list = list.filter(d => isUnlocked(d.id))
  } else if (activeFilter.value === 'locked') {
    list = list.filter(d => !isUnlocked(d.id))
  }
  
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 }
  return list.sort((a, b) => {
    const aUnlocked = isUnlocked(a.id) ? 0 : 1
    const bUnlocked = isUnlocked(b.id) ? 0 : 1
    if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked
    return rarityOrder[a.rarity] - rarityOrder[b.rarity]
  })
})

const getTabCount = (tabId) => {
  if (tabId === 'all') {
    return decorationStore.newlyUnlockedDecorations.length
  }
  return decorationStore.newlyUnlockedDecorations.filter(d => d.category === tabId).length
}

const isUnlocked = (id) => decorationStore.isDecorationUnlocked(id)

const isApplied = (category, id) => decorationStore.isDecorationApplied(category, id)

const getUnlockTime = (id) => decorationStore.decorationUnlockTimes[id]

const isNewlyUnlocked = (id) => {
  return decorationStore.newlyUnlockedDecorations.some(d => d.id === id)
}

const selectDecoration = (decoration) => {
  selectedDecoration.value = decoration
  decorationStore.clearNewlyUnlocked()
}

const applyDecoration = (decoration) => {
  const success = decorationStore.applyDecoration(decoration.category, decoration.id)
  if (success) {
    selectedDecoration.value = null
  }
}

const closeDecorationPanel = () => {
  decorationStore.clearNewlyUnlocked()
  emit('close')
}

const getCategoryIcon = (category) => {
  return decorationStore.DECORATION_CATEGORY_INFO[category]?.icon || '🎨'
}

const getCategoryLabel = (category) => {
  return decorationStore.DECORATION_CATEGORY_INFO[category]?.name || '装扮'
}

const getRarityLabel = (rarity) => {
  return decorationStore.DECORATION_RARITY[rarity.toUpperCase()]?.name || '普通'
}

const getRarityStyle = (rarity) => {
  const info = decorationStore.DECORATION_RARITY[rarity.toUpperCase()]
  return {
    background: info.bgColor,
    color: info.color,
    borderColor: info.color
  }
}

const getUnlockHint = (decoration) => {
  const condition = decoration.unlockCondition
  if (!condition) return '初始装扮'
  return condition.description || '继续探索以解锁此装扮'
}

const getCurrentTabName = () => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab ? tab.name : '全部'
}

const getEmptyIcon = () => {
  const icons = {
    all: '🎨',
    background: '🎨',
    frame: '🖼️',
    font: '✍️',
    cover: '📖'
  }
  return icons[activeTab.value] || '🎨'
}

const getEmptyHint = () => {
  if (activeFilter.value === 'unlocked') {
    return '还没有解锁任何装扮，继续探索吧！'
  } else if (activeFilter.value === 'locked') {
    return '所有装扮都已解锁，太棒了！'
  }
  return '暂无装扮'
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDetailPreviewStyle = () => {
  if (!isUnlocked(selectedDecoration.value?.id)) {
    return {
      background: '#f3f4f6',
      filter: 'grayscale(100%)'
    }
  }
  return {}
}

const getBackgroundPreview = () => {
  if (!selectedDecoration.value) return {}
  const preview = selectedDecoration.value.preview
  return {
    background: preview.value,
    width: '100%',
    height: '100%',
    borderRadius: '12px'
  }
}

const getFramePreview = () => {
  if (!selectedDecoration.value) return {}
  const preview = selectedDecoration.value.preview
  const styleMap = {
    hearts: 'dotted',
    lace: 'dashed',
    golden: 'double',
    stars: 'dotted',
    floral: 'dashed',
    butterfly: 'dotted',
    infinity: 'double'
  }
  return {
    border: `4px solid ${preview.color}`,
    borderStyle: styleMap[preview.style] || 'solid',
    width: '100%',
    height: '100%',
    borderRadius: '12px',
    boxSizing: 'border-box'
  }
}

const getFontPreview = () => {
  if (!selectedDecoration.value) return {}
  const preview = selectedDecoration.value.preview
  const style = {
    fontFamily: preview.family,
    color: preview.color,
    fontSize: '2rem',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '20px'
  }
  if (preview.effect === 'gradient') {
    style.background = preview.color
    style.WebkitBackgroundClip = 'text'
    style.WebkitTextFillColor = 'transparent'
    style.backgroundClip = 'text'
  }
  return style
}

const getCoverPreview = () => {
  if (!selectedDecoration.value) return {}
  const preview = selectedDecoration.value.preview
  return {
    background: preview.background,
    width: '100%',
    height: '100%',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  }
}
</script>

<style scoped>
.decoration-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.decoration-panel {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 30px;
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease-out;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.decoration-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.decoration-panel-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.decoration-panel-icon {
  font-size: 2rem;
}

.decoration-panel-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.decoration-panel-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: #6b7280;
  transition: all 0.2s ease;
}

.decoration-panel-close:hover {
  background: #e5e7eb;
  color: #374151;
  transform: rotate(90deg);
}

.decoration-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.decoration-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.decoration-stat-item:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-top: 2px;
}

.decoration-progress-bar {
  position: relative;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
}

.decoration-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #ec4899, #f59e0b);
  border-radius: 12px;
  transition: width 0.5s ease;
}

.decoration-progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.decoration-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.decoration-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.decoration-tab:hover {
  background: #e5e7eb;
}

.decoration-tab.active {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.tab-icon {
  font-size: 1rem;
}

.tab-badge {
  background: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 18px;
  text-align: center;
}

.decoration-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-btn {
  padding: 6px 14px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: #d1d5db;
}

.filter-btn.active {
  background: #f5f3ff;
  border-color: #8b5cf6;
  color: #7c3aed;
}

.decoration-list-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
}

.decoration-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.decoration-item-wrapper {
  animation: fadeInUp 0.4s ease-out backwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.decoration-panel-footer {
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.rarity-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-label {
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 500;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6b7280;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.decoration-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(6px);
}

.decoration-detail-content {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 450px;
  width: 90%;
  text-align: center;
  animation: modalPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalPopIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.detail-preview {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.detail-preview.rarity-common {
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  box-shadow: 0 8px 24px rgba(107, 114, 128, 0.2);
}

.detail-preview.rarity-rare {
  background: linear-gradient(135deg, #ede9fe, #ddd6fe);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}

.detail-preview.rarity-epic {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.3);
}

.detail-preview.rarity-legendary {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
  animation: legendaryPulse 2s ease-in-out infinite;
}

@keyframes legendaryPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.preview-inner {
  width: 100px;
  height: 100px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: white;
}

.detail-bg-preview {
  width: 100%;
  height: 100%;
}

.detail-frame-preview {
  width: 100%;
  height: 100%;
}

.detail-font-preview {
  font-size: 1.8rem;
  font-weight: bold;
  text-align: center;
  padding: 20px;
}

.detail-cover-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cover-icon {
  font-size: 2.5rem;
}

.cover-title {
  font-size: 0.85rem;
  font-weight: 600;
}

.detail-category {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.category-icon {
  font-size: 1rem;
}

.detail-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.detail-rarity {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
  margin-bottom: 16px;
}

.detail-description {
  font-size: 0.95rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 16px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 16px;
}

.detail-tag {
  background: #f3f4f6;
  color: #6b7280;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.detail-time {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 20px;
}

.detail-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.apply-detail-btn {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.apply-detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.applied-detail-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  flex: 1;
  cursor: default;
}

.locked-detail-btn {
  background: #e5e7eb;
  color: #9ca3af;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  flex: 1;
  cursor: not-allowed;
}

.detail-close-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.detail-close-btn:hover {
  background: #e5e7eb;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .decoration-panel {
    padding: 20px;
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .decoration-stats {
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
  
  .decoration-stat-item {
    padding: 8px 4px;
  }
  
  .stat-value {
    font-size: 0.85rem;
  }
  
  .stat-label {
    font-size: 0.6rem;
  }
  
  .decoration-list {
    grid-template-columns: 1fr;
  }
  
  .decoration-tabs {
    gap: 4px;
  }
  
  .decoration-tab {
    padding: 6px 12px;
    font-size: 0.75rem;
  }
}
</style>
