<template>
  <div class="decoration-gallery page-container paper-texture">
    <div class="gallery-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
          <span>返回</span>
        </button>
      </div>
      <div class="header-center">
        <h1 class="gallery-title text-gradient">🎨 手账装扮馆</h1>
        <p class="gallery-subtitle">收集精美装扮，打造专属手账</p>
      </div>
      <div class="header-right">
        <div class="collection-badge">
          <span class="badge-icon">📚</span>
          <span class="badge-text">{{ stats.unlocked }}/{{ stats.total }}</span>
        </div>
      </div>
    </div>

    <div class="stats-overview">
      <div class="stat-card" v-for="category in categoryList" :key="category.id">
        <div class="stat-card-icon">{{ category.icon }}</div>
        <div class="stat-card-content">
          <div class="stat-card-name">{{ category.name }}</div>
          <div class="stat-card-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getCategoryStats(category.id).percent + '%' }"
              ></div>
            </div>
            <span class="progress-text">
              {{ getCategoryStats(category.id).unlocked }}/{{ getCategoryStats(category.id).total }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="overall-progress">
      <div class="overall-progress-label">
        <span>收集进度</span>
        <span class="overall-percent">{{ Math.round(stats.percent) }}%</span>
      </div>
      <div class="overall-progress-bar">
        <div 
          class="overall-progress-fill" 
          :style="{ width: stats.percent + '%' }"
        ></div>
      </div>
    </div>

    <div class="current-decoration-preview">
      <div class="preview-title">
        <span class="preview-icon">👁️</span>
        <span>当前装扮效果</span>
      </div>
      <div class="preview-container" :style="previewBackgroundStyle">
        <div class="preview-frame" :style="previewFrameStyle">
          <div class="preview-content" :style="previewFontStyle">
            <div class="preview-header">
              <span class="preview-icon-large">{{ currentCover?.preview.icon || '🌸' }}</span>
              <h2 class="preview-title-text" :style="{ color: currentCover?.preview.titleColor || '#be185d' }">
                春日序章
              </h2>
            </div>
            <p class="preview-text">这是一段示例文字，展示当前装扮的效果。你可以在这里写下属于你的故事...</p>
            <div class="preview-materials">
              <span class="material-dot" style="background: #f472b6"></span>
              <span class="material-dot" style="background: #a78bfa"></span>
              <span class="material-dot" style="background: #fbbf24"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="preview-legend">
        <div class="legend-item">
          <span class="legend-dot" style="background: #8b5cf6"></span>
          <span>背景: {{ currentBackground?.name || '默认' }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #ec4899"></span>
          <span>边框: {{ currentFrame?.name || '默认' }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #f59e0b"></span>
          <span>字体: {{ currentFont?.name || '默认' }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #10b981"></span>
          <span>封面: {{ currentCover?.name || '默认' }}</span>
        </div>
      </div>
    </div>

    <div class="category-section" v-for="category in categoryList" :key="category.id">
      <div class="section-header">
        <div class="section-title">
          <span class="section-icon">{{ category.icon }}</span>
          <span>{{ category.name }}</span>
        </div>
        <div class="section-subtitle">{{ category.description }}</div>
      </div>
      
      <div class="section-grid">
        <div 
          v-for="decoration in getCategoryDecorations(category.id)" 
          :key="decoration.id"
          class="decoration-card-wrapper"
          :style="{ animationDelay: getAnimationDelay(decoration) + 's' }"
        >
          <DecorationBadge 
            :decoration="decoration"
            :show-action="true"
            :show-animation="isNewlyUnlocked(decoration.id)"
            @click="selectDecoration(decoration)"
            @apply="applyDecoration"
          />
        </div>
      </div>
    </div>

    <div class="rarity-collection">
      <div class="section-header">
        <div class="section-title">
          <span class="section-icon">💎</span>
          <span>稀有度收集</span>
        </div>
      </div>
      <div class="rarity-grid">
        <div 
          v-for="rarity in rarityList" 
          :key="rarity.id"
          class="rarity-card"
          :class="`rarity-${rarity.id}`"
        >
          <div class="rarity-icon" :style="{ background: rarity.bgColor, color: rarity.color }">
            {{ getRarityIcon(rarity.id) }}
          </div>
          <div class="rarity-info">
            <div class="rarity-name" :style="{ color: rarity.color }">{{ rarity.name }}</div>
            <div class="rarity-count">
              {{ stats.byRarity[rarity.id].unlocked }}/{{ stats.byRarity[rarity.id].total }}
            </div>
          </div>
          <div class="rarity-bar">
            <div 
              class="rarity-bar-fill" 
              :style="{ 
                width: (stats.byRarity[rarity.id].total > 0 
                  ? (stats.byRarity[rarity.id].unlocked / stats.byRarity[rarity.id].total * 100) 
                  : 0) + '%',
                background: rarity.color
              }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="tips-section">
      <div class="tips-card">
        <div class="tips-icon">💡</div>
        <div class="tips-content">
          <div class="tips-title">装扮解锁提示</div>
          <div class="tips-list">
            <div class="tip-item">• 完成章节可以解锁对应的季节装扮</div>
            <div class="tip-item">• 达成成就可以获得稀有装扮</div>
            <div class="tip-item">• 完美通关章节可以解锁金色边框</div>
            <div class="tip-item">• 发现所有结局可以获得传说级装扮</div>
            <div class="tip-item">• 多次周目可以解锁更多隐藏装扮</div>
          </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDecorationStore } from '../stores/decorationStore'
import DecorationBadge from '../components/DecorationBadge.vue'

const router = useRouter()
const decorationStore = useDecorationStore()

const selectedDecoration = ref(null)

const categoryList = computed(() => {
  return Object.values(decorationStore.DECORATION_CATEGORY_INFO)
})

const rarityList = computed(() => {
  return Object.values(decorationStore.DECORATION_RARITY)
})

const stats = computed(() => decorationStore.getStats())

const currentBackground = computed(() => 
  decorationStore.getAppliedDecoration(decorationStore.DECORATION_CATEGORIES.BACKGROUND)
)

const currentFrame = computed(() => 
  decorationStore.getAppliedDecoration(decorationStore.DECORATION_CATEGORIES.FRAME)
)

const currentFont = computed(() => 
  decorationStore.getAppliedDecoration(decorationStore.DECORATION_CATEGORIES.FONT)
)

const currentCover = computed(() => 
  decorationStore.getAppliedDecoration(decorationStore.DECORATION_CATEGORIES.COVER)
)

const previewBackgroundStyle = computed(() => {
  const bg = currentBackground.value
  if (!bg) return {}
  return {
    background: bg.preview.value
  }
})

const previewFrameStyle = computed(() => {
  const frame = currentFrame.value
  if (!frame) return {}
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
    border: `4px solid ${frame.preview.color}`,
    borderStyle: styleMap[frame.preview.style] || 'solid'
  }
})

const previewFontStyle = computed(() => {
  const font = currentFont.value
  if (!font) return {}
  const style = {
    fontFamily: font.preview.family,
    color: font.preview.color
  }
  if (font.preview.effect === 'gradient') {
    style.background = font.preview.color
    style.WebkitBackgroundClip = 'text'
    style.WebkitTextFillColor = 'transparent'
    style.backgroundClip = 'text'
  }
  return style
})

const getCategoryStats = (categoryId) => {
  return decorationStore.getCategoryStats(categoryId)
}

const getCategoryDecorations = (categoryId) => {
  return decorationStore.getCategoryDecorations(categoryId)
}

const getAnimationDelay = (decoration) => {
  const index = getCategoryDecorations(decoration.category).findIndex(d => d.id === decoration.id)
  return index * 0.05
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
  decorationStore.applyDecoration(decoration.category, decoration.id)
  selectedDecoration.value = null
}

const goBack = () => {
  decorationStore.clearNewlyUnlocked()
  router.push('/chapter-select')
}

const getRarityIcon = (rarityId) => {
  const icons = {
    common: '●',
    rare: '◆',
    epic: '★',
    legendary: '👑'
  }
  return icons[rarityId] || '●'
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

onMounted(() => {
  decorationStore.initialize()
})
</script>

<style scoped>
.decoration-gallery {
  min-height: 100vh;
  padding: 20px;
}

.gallery-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.header-left {
  display: flex;
  justify-content: flex-start;
}

.header-center {
  text-align: center;
}

.header-right {
  display: flex;
  justify-content: flex-end;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  border-color: #8b5cf6;
  color: #7c3aed;
  transform: translateX(-4px);
}

.back-icon {
  font-size: 1.2rem;
}

.gallery-title {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.gallery-subtitle {
  font-size: 1rem;
  color: #9ca3af;
}

.collection-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #f5f3ff, #fdf2f8);
  border: 2px solid #e9d5ff;
  border-radius: 12px;
}

.badge-icon {
  font-size: 1.2rem;
}

.badge-text {
  font-weight: 700;
  color: #7c3aed;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.stat-card-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.stat-card-content {
  flex: 1;
  min-width: 0;
}

.stat-card-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.stat-card-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  min-width: 50px;
  text-align: right;
}

.overall-progress {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
}

.overall-progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  color: #374151;
}

.overall-percent {
  color: #7c3aed;
  font-size: 1.2rem;
}

.overall-progress-bar {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.overall-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #ec4899, #f59e0b);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.current-decoration-preview {
  margin-bottom: 40px;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.preview-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto 20px;
  padding: 40px;
  border-radius: 20px;
  transition: all 0.5s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.preview-frame {
  padding: 30px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.5s ease;
}

.preview-content {
  transition: all 0.5s ease;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.preview-icon-large {
  font-size: 2.5rem;
}

.preview-title-text {
  font-size: 1.5rem;
  font-weight: 700;
  transition: all 0.3s ease;
}

.preview-text {
  font-size: 0.95rem;
  line-height: 1.8;
  color: #6b7280;
  margin-bottom: 16px;
}

.preview-materials {
  display: flex;
  gap: 8px;
}

.material-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.preview-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #6b7280;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.category-section {
  margin-bottom: 40px;
}

.section-header {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.section-icon {
  font-size: 1.6rem;
}

.section-subtitle {
  font-size: 0.9rem;
  color: #9ca3af;
  padding-left: 42px;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.decoration-card-wrapper {
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

.rarity-collection {
  margin-bottom: 40px;
}

.rarity-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.rarity-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.rarity-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.rarity-card.rarity-common { border-color: #6b7280; }
.rarity-card.rarity-rare { border-color: #8b5cf6; }
.rarity-card.rarity-epic { border-color: #ec4899; }
.rarity-card.rarity-legendary { 
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7, #fff7ed, #ffffff);
}

.rarity-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

.rarity-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rarity-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.rarity-count {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.rarity-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.rarity-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.tips-section {
  margin-bottom: 40px;
}

.tips-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #fef3c7, #fff7ed);
  border-radius: 16px;
  border: 2px solid #fde68a;
}

.tips-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.tips-content {
  flex: 1;
}

.tips-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 12px;
}

.tips-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 8px;
}

.tip-item {
  font-size: 0.9rem;
  color: #78350f;
  line-height: 1.5;
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
  .gallery-header {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .header-left, .header-right {
    justify-content: center;
  }
  
  .gallery-title {
    font-size: 1.8rem;
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .section-grid {
    grid-template-columns: 1fr;
  }
  
  .rarity-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .tips-list {
    grid-template-columns: 1fr;
  }
  
  .preview-container {
    padding: 20px;
  }
  
  .preview-frame {
    padding: 20px;
  }
  
  .preview-legend {
    flex-direction: column;
    align-items: center;
  }
}
</style>
