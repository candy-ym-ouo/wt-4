<template>
  <div class="memory-gallery page-container paper-texture">
    <div class="header">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
        <span class="back-text">返回</span>
      </button>
      <h1 class="title handwriting text-gradient">回忆图鉴</h1>
      <p class="subtitle">收集属于你的珍贵记忆</p>
    </div>

    <div class="stats-overview">
      <div class="stat-card" v-for="cat in categoryStats" :key="cat.id">
        <div class="stat-icon">{{ cat.icon }}</div>
        <div class="stat-info">
          <div class="stat-value">{{ cat.unlocked }}/{{ cat.total }}</div>
          <div class="stat-label">{{ cat.name }}</div>
        </div>
        <div class="stat-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: cat.percentage + '%', background: cat.color }"></div>
          </div>
          <span class="progress-text">{{ cat.percentage }}%</span>
        </div>
      </div>
    </div>

    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="tab-btn"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id"
      >
        <span class="tab-icon">{{ cat.icon }}</span>
        <span class="tab-label">{{ cat.name }}</span>
      </button>
    </div>

    <div class="filter-section">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchQuery"
          :placeholder="getSearchPlaceholder()"
          class="search-input"
        />
      </div>

      <div class="filter-chips" v-if="currentFilters.length > 0">
        <button
          v-for="filter in currentFilters"
          :key="filter.id"
          class="filter-chip"
          :class="{ active: activeFilter === filter.id }"
          @click="toggleFilter(filter.id)"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <div class="gallery-content">
      <div v-if="activeCategory === 'dialogues'" class="dialogues-grid">
        <div
          v-for="dialogue in filteredDialogues"
          :key="dialogue.id"
          class="dialogue-card"
          :class="{ unlocked: dialogue.unlocked, locked: !dialogue.unlocked }"
          @click="showDialogueDetail(dialogue)"
        >
          <div class="card-type-badge" :class="dialogue.type">
            {{ dialogue.type === 'key' ? '⭐ 关键对白' : '🔮 隐藏对白' }}
          </div>
          <div class="dialogue-speaker">{{ dialogue.unlocked ? dialogue.speaker : '???' }}</div>
          <p class="dialogue-text">
            {{ dialogue.unlocked ? dialogue.text : '尚未解锁，继续探索吧...' }}
          </p>
          <div class="card-footer">
            <span class="chapter-tag">{{ dialogue.chapterTitle }}</span>
            <span v-if="dialogue.comboName" class="combo-tag">{{ dialogue.comboName }}</span>
          </div>
        </div>
      </div>

      <div v-else-if="activeCategory === 'scenes'" class="scenes-grid">
        <div
          v-for="scene in filteredScenes"
          :key="scene.id"
          class="scene-card"
          :class="{ unlocked: scene.unlocked, locked: !scene.unlocked }"
          :style="scene.unlocked ? { background: scene.background } : {}"
          @click="showSceneDetail(scene)"
        >
          <div class="scene-overlay">
            <div class="scene-number">{{ scene.index }}</div>
            <div class="scene-info">
              <h3 class="scene-title">{{ scene.unlocked ? scene.title : '???' }}</h3>
              <p class="scene-chapter">{{ scene.chapterTitle }}</p>
              <div class="scene-meta">
                <span class="meta-item">💬 {{ scene.dialogueCount }} 段对白</span>
              </div>
            </div>
            <div class="scene-status">
              {{ scene.unlocked ? '✓ 已解锁' : '🔒 未解锁' }}
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeCategory === 'materials'" class="materials-grid">
        <div
          v-for="material in filteredMaterials"
          :key="material.id"
          class="material-card"
          :class="{ 
            unlocked: material.unlocked, 
            locked: !material.unlocked,
            hidden: material.isHidden
          }"
          @click="showMaterialDetail(material)"
        >
          <div class="material-icon-wrapper" :style="{ background: material.color + '20' }">
            <span class="material-emoji">{{ getMaterialEmoji(material.shape) }}</span>
          </div>
          <div class="material-info">
            <h3 class="material-name">{{ material.name }}</h3>
            <p class="material-desc">{{ material.description }}</p>
            <div class="material-tags">
              <span class="tag category-tag">{{ material.categoryLabel }}</span>
              <span class="tag rarity-tag" :class="material.rarity">{{ material.rarityLabel }}</span>
              <span v-if="material.isHidden" class="tag hidden-tag">🎁 隐藏</span>
            </div>
          </div>
          <div class="material-stats">
            <div class="stat-item">
              <span class="stat-icon">💕</span>
              <span class="stat-value">+{{ material.emotion }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📦</span>
              <span class="stat-value">{{ material.usedCount }} 次</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeCategory === 'endings'" class="endings-grid">
        <div
          v-for="ending in filteredEndings"
          :key="ending.id"
          class="ending-card"
          :class="{ discovered: ending.discovered, not_discovered: !ending.discovered }"
          :style="ending.discovered ? { background: ending.background } : {}"
          @click="showEndingDetail(ending)"
        >
          <div class="ending-overlay">
            <div class="ending-type-icon">{{ ending.discovered ? ending.typeIcon : '❓' }}</div>
            <div class="ending-info">
              <h3 class="ending-title">{{ ending.discovered ? ending.title : '???' }}</h3>
              <p class="ending-type">{{ ending.typeLabel }}</p>
              <p class="ending-desc">
                {{ ending.discovered ? ending.description : '继续探索，发现更多结局...' }}
              </p>
            </div>
            <div class="ending-status">
              <span v-if="ending.discovered" class="status-discovered">✓ 已达成</span>
              <span v-else class="status-locked">🔒 未达成</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredItems.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-text">没有找到匹配的内容</p>
        <p class="empty-hint">试试其他筛选条件吧</p>
      </div>
    </div>

    <div v-if="showDetail" class="detail-modal-overlay" @click.self="closeDetail">
      <div class="detail-modal slide-up">
        <button class="close-btn" @click="closeDetail">✕</button>
        
        <template v-if="activeCategory === 'dialogues' && selectedItem">
          <div class="detail-header dialogue-detail-header">
            <span class="detail-type-badge" :class="selectedItem.type">
              {{ selectedItem.type === 'key' ? '⭐ 关键对白' : '🔮 隐藏对白' }}
            </span>
            <span class="detail-chapter">{{ selectedItem.chapterTitle }}</span>
          </div>
          <div class="detail-body">
            <div class="dialogue-detail-content" v-if="selectedItem.unlocked">
              <div class="speaker-label">{{ selectedItem.speaker }}</div>
              <blockquote class="dialogue-quote">"{{ selectedItem.text }}"</blockquote>
              <div v-if="selectedItem.comboName" class="combo-info">
                <span class="combo-label">🎯 触发组合：</span>
                <span class="combo-name">{{ selectedItem.comboName }}</span>
              </div>
            </div>
            <div class="locked-content" v-else>
              <div class="locked-icon">🔒</div>
              <p>这段对白尚未解锁</p>
              <p class="locked-hint">继续探索故事，发现更多隐藏内容</p>
            </div>
          </div>
        </template>

        <template v-else-if="activeCategory === 'scenes' && selectedItem">
          <div class="detail-header scene-detail-header" :style="selectedItem.unlocked ? { background: selectedItem.background } : {}">
            <span class="scene-badge">场景 {{ selectedItem.index }}</span>
            <h2 class="detail-title">{{ selectedItem.unlocked ? selectedItem.title : '???' }}</h2>
            <p class="detail-subtitle">{{ selectedItem.chapterTitle }}</p>
          </div>
          <div class="detail-body">
            <div class="scene-detail-content" v-if="selectedItem.unlocked">
              <div class="scene-detail-stats">
                <div class="stat-block">
                  <span class="stat-number">{{ selectedItem.dialogueCount }}</span>
                  <span class="stat-label">对白数量</span>
                </div>
                <div class="stat-block">
                  <span class="stat-icon">{{ getTimeIcon(selectedItem.timeOfDay) }}</span>
                  <span class="stat-label">{{ getTimeLabel(selectedItem.timeOfDay) }}</span>
                </div>
                <div class="stat-block">
                  <span class="stat-icon">{{ getWeatherIcon(selectedItem.weather) }}</span>
                  <span class="stat-label">{{ getWeatherLabel(selectedItem.weather) }}</span>
                </div>
              </div>
            </div>
            <div class="locked-content" v-else>
              <div class="locked-icon">🔒</div>
              <p>这个场景尚未解锁</p>
              <p class="locked-hint">完成章节后即可查看</p>
            </div>
          </div>
        </template>

        <template v-else-if="activeCategory === 'materials' && selectedItem">
          <div class="detail-header material-detail-header">
            <div class="material-detail-icon" :style="{ background: selectedItem.color + '20' }">
              <span class="material-emoji-large">{{ getMaterialEmoji(selectedItem.shape) }}</span>
            </div>
            <h2 class="detail-title">{{ selectedItem.name }}</h2>
            <div class="material-detail-tags">
              <span class="tag category-tag">{{ selectedItem.categoryLabel }}</span>
              <span class="tag rarity-tag" :class="selectedItem.rarity">{{ selectedItem.rarityLabel }}</span>
              <span v-if="selectedItem.isHidden" class="tag hidden-tag">🎁 隐藏素材</span>
            </div>
          </div>
          <div class="detail-body">
            <p class="material-detail-desc">{{ selectedItem.description }}</p>
            
            <div class="material-detail-stats">
              <div class="stat-row">
                <span class="stat-label">情绪加成</span>
                <span class="stat-value">+{{ selectedItem.emotion }} 💕</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">使用次数</span>
                <span class="stat-value">{{ selectedItem.usedCount }} 次</span>
              </div>
            </div>

            <div class="material-combos" v-if="selectedItem.usedInCombos?.length > 0">
              <h4 class="section-title">🔗 相关组合</h4>
              <div class="combo-list">
                <div 
                  v-for="combo in selectedItem.usedInCombos" 
                  :key="combo.id"
                  class="combo-item"
                  :class="{ triggered: combo.triggered }"
                >
                  <span class="combo-status">{{ combo.triggered ? '✓' : '○' }}</span>
                  <span class="combo-name">{{ combo.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="activeCategory === 'endings' && selectedItem">
          <div class="detail-header ending-detail-header" :style="selectedItem.discovered ? { background: selectedItem.background } : {}">
            <div class="ending-detail-icon">{{ selectedItem.discovered ? selectedItem.typeIcon : '❓' }}</div>
            <h2 class="detail-title">{{ selectedItem.discovered ? selectedItem.title : '???' }}</h2>
            <p class="detail-subtitle">{{ selectedItem.typeLabel }}</p>
          </div>
          <div class="detail-body">
            <div class="ending-detail-content" v-if="selectedItem.discovered">
              <p class="ending-description">{{ selectedItem.description }}</p>
              
              <div class="ending-content-box">
                <h4 class="section-title">📖 结局内容</h4>
                <div class="ending-text">{{ selectedItem.content }}</div>
              </div>

              <div class="ending-meta" v-if="selectedItem.discoverTime">
                <span class="meta-label">达成时间：</span>
                <span class="meta-value">{{ formatDate(selectedItem.discoverTime) }}</span>
              </div>
            </div>
            <div class="locked-content" v-else>
              <div class="locked-icon">🔒</div>
              <p>这个结局尚未达成</p>
              <p class="locked-hint">尝试不同的选择，探索更多可能</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const activeCategory = ref('dialogues')
const searchQuery = ref('')
const activeFilter = ref('all')
const showDetail = ref(false)
const selectedItem = ref(null)

const categories = [
  { id: 'dialogues', name: '对白收藏', icon: '💬' },
  { id: 'scenes', name: '场景片段', icon: '🎬' },
  { id: 'materials', name: '关键素材', icon: '🎨' },
  { id: 'endings', name: '结局卡片', icon: '🃏' }
]

const categoryStats = computed(() => {
  const stats = gameStore.getGalleryStats()
  return [
    { 
      id: 'dialogues', 
      name: '对白', 
      icon: '💬',
      total: stats.total.dialogues,
      unlocked: stats.unlocked.keyDialogues + stats.unlocked.hiddenDialogues,
      percentage: Math.round(((stats.unlocked.keyDialogues + stats.unlocked.hiddenDialogues) / stats.total.dialogues) * 100) || 0,
      color: 'linear-gradient(90deg, #8b5cf6, #ec4899)'
    },
    { 
      id: 'scenes', 
      name: '场景', 
      icon: '🎬',
      total: stats.total.scenes,
      unlocked: stats.unlocked.scenes,
      percentage: stats.percentages.scenes,
      color: 'linear-gradient(90deg, #f97316, #fbbf24)'
    },
    { 
      id: 'materials', 
      name: '素材', 
      icon: '🎨',
      total: stats.total.materials,
      unlocked: stats.unlocked.materials,
      percentage: stats.percentages.materials,
      color: 'linear-gradient(90deg, #10b981, #06b6d4)'
    },
    { 
      id: 'endings', 
      name: '结局', 
      icon: '🃏',
      total: stats.total.endings,
      unlocked: stats.unlocked.endings,
      percentage: stats.percentages.endings,
      color: 'linear-gradient(90deg, #ec4899, #8b5cf6)'
    }
  ]
})

const currentFilters = computed(() => {
  switch (activeCategory.value) {
    case 'dialogues':
      return [
        { id: 'all', label: '全部' },
        { id: 'key', label: '⭐ 关键对白' },
        { id: 'hidden', label: '🔮 隐藏对白' },
        { id: 'unlocked', label: '✓ 已解锁' },
        { id: 'locked', label: '🔒 未解锁' }
      ]
    case 'scenes':
      return [
        { id: 'all', label: '全部' },
        { id: 'unlocked', label: '✓ 已解锁' },
        { id: 'locked', label: '🔒 未解锁' }
      ]
    case 'materials':
      return [
        { id: 'all', label: '全部' },
        { id: 'nature', label: '🌿 自然' },
        { id: 'stationery', label: '📝 文具' },
        { id: 'rare', label: '💎 稀有' },
        { id: 'legendary', label: '👑 传说' },
        { id: 'hidden', label: '🎁 隐藏' }
      ]
    case 'endings':
      return [
        { id: 'all', label: '全部' },
        { id: 'discovered', label: '✓ 已达成' },
        { id: 'not_discovered', label: '🔒 未达成' }
      ]
    default:
      return []
  }
})

const filteredDialogues = computed(() => {
  let dialogues = gameStore.getGalleryDialogues()
  
  if (activeFilter.value !== 'all') {
    switch (activeFilter.value) {
      case 'key':
        dialogues = dialogues.filter(d => d.type === 'key')
        break
      case 'hidden':
        dialogues = dialogues.filter(d => d.type === 'hidden')
        break
      case 'unlocked':
        dialogues = dialogues.filter(d => d.unlocked)
        break
      case 'locked':
        dialogues = dialogues.filter(d => !d.unlocked)
        break
    }
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    dialogues = dialogues.filter(d => 
      d.text.toLowerCase().includes(query) ||
      d.speaker.toLowerCase().includes(query) ||
      d.chapterTitle.toLowerCase().includes(query) ||
      (d.comboName && d.comboName.toLowerCase().includes(query))
    )
  }
  
  return dialogues
})

const filteredScenes = computed(() => {
  let scenes = gameStore.getGalleryScenes()
  
  if (activeFilter.value !== 'all') {
    switch (activeFilter.value) {
      case 'unlocked':
        scenes = scenes.filter(s => s.unlocked)
        break
      case 'locked':
        scenes = scenes.filter(s => !s.unlocked)
        break
    }
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    scenes = scenes.filter(s => 
      s.chapterTitle.toLowerCase().includes(query) ||
      (s.title && s.title.toLowerCase().includes(query))
    )
  }
  
  return scenes
})

const filteredMaterials = computed(() => {
  let materials = gameStore.getGalleryMaterials()
  
  if (activeFilter.value !== 'all') {
    switch (activeFilter.value) {
      case 'nature':
      case 'stationery':
        materials = materials.filter(m => m.category === activeFilter.value)
        break
      case 'rare':
      case 'legendary':
        materials = materials.filter(m => m.rarity === activeFilter.value)
        break
      case 'hidden':
        materials = materials.filter(m => m.isHidden)
        break
    }
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    materials = materials.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.description.toLowerCase().includes(query) ||
      m.tags.some(t => t.toLowerCase().includes(query))
    )
  }
  
  return materials
})

const filteredEndings = computed(() => {
  let endings = gameStore.getGalleryEndings()
  
  if (activeFilter.value !== 'all') {
    switch (activeFilter.value) {
      case 'discovered':
        endings = endings.filter(e => e.discovered)
        break
      case 'not_discovered':
        endings = endings.filter(e => !e.discovered)
        break
    }
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    endings = endings.filter(e => 
      e.title.toLowerCase().includes(query) ||
      e.description.toLowerCase().includes(query) ||
      e.typeLabel.toLowerCase().includes(query)
    )
  }
  
  return endings
})

const filteredItems = computed(() => {
  switch (activeCategory.value) {
    case 'dialogues': return filteredDialogues.value
    case 'scenes': return filteredScenes.value
    case 'materials': return filteredMaterials.value
    case 'endings': return filteredEndings.value
    default: return []
  }
})

const getSearchPlaceholder = () => {
  switch (activeCategory.value) {
    case 'dialogues': return '搜索对白内容、说话者...'
    case 'scenes': return '搜索场景、章节...'
    case 'materials': return '搜索素材名称、描述、标签...'
    case 'endings': return '搜索结局名称、类型...'
    default: return '搜索...'
  }
}

const getMaterialEmoji = (shape) => {
  const map = {
    heart: '❤️',
    star: '⭐',
    circle: '🔵',
    square: '🔲',
    diamond: '💎',
    triangle: '🔺',
    flower: '🌸',
    leaf: '🍃',
    cloud: '☁️',
    music: '🎵',
    note: '🎵',
    butterfly: '🦋',
    book: '📖',
    cup: '☕',
    scarf: '🧣',
    snowflake: '❄️',
    cicada: '🦗'
  }
  return map[shape] || '🔮'
}

const getTimeIcon = (time) => {
  const map = { day: '☀️', dusk: '🌅', night: '🌙' }
  return map[time] || '☀️'
}

const getTimeLabel = (time) => {
  const map = { day: '白天', dusk: '黄昏', night: '夜晚' }
  return map[time] || time
}

const getWeatherIcon = (weather) => {
  const map = { clear: '☀️', cloudy: '☁️', rain: '🌧️', snow: '❄️', star: '✨' }
  return map[weather] || '☀️'
}

const getWeatherLabel = (weather) => {
  const map = { clear: '晴朗', cloudy: '多云', rain: '雨天', snow: '下雪', star: '星空' }
  return map[weather] || weather
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleFilter = (filterId) => {
  activeFilter.value = activeFilter.value === filterId ? 'all' : filterId
}

const showDialogueDetail = (dialogue) => {
  selectedItem.value = dialogue
  showDetail.value = true
}

const showSceneDetail = (scene) => {
  selectedItem.value = scene
  showDetail.value = true
}

const showMaterialDetail = (material) => {
  selectedItem.value = material
  showDetail.value = true
}

const showEndingDetail = (ending) => {
  selectedItem.value = ending
  showDetail.value = true
}

const closeDetail = () => {
  showDetail.value = false
  selectedItem.value = null
}

const goBack = () => {
  router.push('/chapter-select')
}

onMounted(() => {
  activeFilter.value = 'all'
})
</script>

<style scoped>
.memory-gallery {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding: 30px 0;
  position: relative;
}

.back-btn {
  position: absolute;
  top: 30px;
  left: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 2px solid #e9d5ff;
  background: linear-gradient(135deg, #faf5ff, #fdf4ff);
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #7c3aed;
  transition: all 0.3s ease;
  font-family: var(--font-serif);
}

.back-btn:hover {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  transform: translateX(-3px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.title {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 2px solid #f3f4f6;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.stat-info {
  margin-bottom: 12px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stat-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 35px;
  text-align: right;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: white;
  padding: 6px;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  font-family: var(--font-serif);
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 120px;
}

.tab-btn:hover {
  background: #f9fafb;
  color: var(--text-primary);
}

.tab-btn.active {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.tab-icon {
  font-size: 1.2rem;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  border: 2px solid #f3f4f6;
  transition: all 0.3s ease;
}

.search-box:focus-within {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.search-icon {
  font-size: 1rem;
  color: var(--text-secondary);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
  font-family: var(--font-serif);
  background: transparent;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: #9ca3af;
}

.filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 6px 14px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: var(--font-serif);
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.filter-chip:hover {
  border-color: #c4b5fd;
  background: #faf5ff;
}

.filter-chip.active {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border-color: transparent;
  color: white;
}

.gallery-content {
  min-height: 400px;
}

.dialogues-grid,
.scenes-grid,
.materials-grid,
.endings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.dialogue-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #f3f4f6;
  position: relative;
  overflow: hidden;
}

.dialogue-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.dialogue-card.locked {
  opacity: 0.6;
  background: #f9fafb;
}

.card-type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.card-type-badge.key {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
}

.card-type-badge.hidden {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  color: #7c3aed;
}

.dialogue-speaker {
  font-weight: 600;
  color: var(--accent-purple);
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.dialogue-text {
  color: var(--text-primary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chapter-tag,
.combo-tag {
  font-size: 0.75rem;
  padding: 3px 8px;
  border-radius: 8px;
  background: #f3f4f6;
  color: var(--text-secondary);
}

.combo-tag {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  color: #be185d;
}

.scene-card {
  border-radius: 16px;
  min-height: 200px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  border: 2px solid #f3f4f6;
}

.scene-card.locked {
  background: #f3f4f6 !important;
}

.scene-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-lg);
}

.scene-overlay {
  width: 100%;
  height: 100%;
  min-height: 200px;
  padding: 20px;
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
}

.scene-card.locked .scene-overlay {
  background: linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.2) 100%);
}

.scene-number {
  font-size: 2rem;
  font-weight: bold;
  opacity: 0.8;
}

.scene-title {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.scene-chapter {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 8px;
}

.scene-meta {
  display: flex;
  gap: 10px;
}

.meta-item {
  font-size: 0.75rem;
  opacity: 0.9;
}

.scene-status {
  font-size: 0.85rem;
  font-weight: 500;
}

.material-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.material-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.material-card.hidden {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.material-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.material-emoji {
  font-size: 2rem;
}

.material-name {
  font-size: 1.1rem;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.material-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.material-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 8px;
  font-weight: 500;
}

.category-tag {
  background: #f3f4f6;
  color: var(--text-secondary);
}

.rarity-tag.rare {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  color: #1d4ed8;
}

.rarity-tag.legendary {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
}

.hidden-tag {
  background: linear-gradient(135deg, #fef3c7, #fed7aa);
  color: #c2410c;
}

.material-stats {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.stat-item .stat-icon {
  font-size: 0.9rem;
}

.stat-item .stat-value {
  font-weight: 600;
  color: var(--text-primary);
}

.ending-card {
  border-radius: 16px;
  min-height: 220px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
  border: 2px solid #f3f4f6;
}

.ending-card.not_discovered {
  background: #f3f4f6 !important;
}

.ending-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--shadow-lg);
}

.ending-overlay {
  width: 100%;
  height: 100%;
  min-height: 220px;
  padding: 20px;
  background: linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.4) 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
}

.ending-card.not_discovered .ending-overlay {
  background: linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.15) 100%);
  color: var(--text-secondary);
}

.ending-type-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.ending-title {
  font-size: 1.3rem;
  margin-bottom: 4px;
}

.ending-type {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 8px;
}

.ending-desc {
  font-size: 0.85rem;
  line-height: 1.5;
  opacity: 0.9;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ending-status {
  font-size: 0.85rem;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 0.9rem;
  color: #9ca3af;
}

.detail-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(6px);
}

.detail-modal {
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255,255,255,0.9);
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: white;
  transform: scale(1.1);
}

.detail-header {
  padding: 30px;
  border-bottom: 2px solid #f3f4f6;
  position: relative;
}

.dialogue-detail-header {
  background: linear-gradient(135deg, #faf5ff, #fdf2f8);
}

.scene-detail-header {
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.material-detail-header {
  text-align: center;
  background: linear-gradient(135deg, #faf5ff, #fdf2f8);
}

.ending-detail-header {
  color: white;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.detail-type-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.detail-type-badge.key {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
}

.detail-type-badge.hidden {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  color: #7c3aed;
}

.detail-chapter {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 8px;
}

.scene-badge {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(255,255,255,0.3);
  border-radius: 12px;
  font-size: 0.8rem;
  margin-bottom: 12px;
  backdrop-filter: blur(5px);
}

.detail-title {
  font-size: 1.8rem;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.scene-detail-header .detail-title,
.ending-detail-header .detail-title {
  color: white;
}

.detail-subtitle {
  font-size: 0.95rem;
  opacity: 0.9;
}

.material-detail-tags {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.material-detail-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.material-emoji-large {
  font-size: 2.5rem;
}

.ending-detail-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.detail-body {
  padding: 30px;
}

.dialogue-detail-content {
  text-align: center;
  padding: 20px 0;
}

.speaker-label {
  font-weight: 600;
  color: var(--accent-purple);
  margin-bottom: 16px;
  font-size: 1rem;
}

.dialogue-quote {
  font-size: 1.2rem;
  line-height: 1.8;
  color: var(--text-primary);
  font-style: italic;
  margin: 0 0 20px;
  padding: 20px;
  background: linear-gradient(135deg, #faf5ff, #fdf2f8);
  border-radius: 12px;
  border-left: 4px solid var(--accent-purple);
}

.combo-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  border-radius: 20px;
  font-size: 0.85rem;
}

.combo-label {
  color: var(--text-secondary);
}

.combo-name {
  font-weight: 600;
  color: #be185d;
}

.scene-detail-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-block {
  text-align: center;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--accent-purple);
  display: block;
  margin-bottom: 4px;
}

.stat-block .stat-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 4px;
}

.stat-block .stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.material-detail-desc {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.material-detail-stats {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.stat-row:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 1.1rem;
  color: var(--text-primary);
  margin-bottom: 12px;
  font-weight: 600;
}

.material-combos {
  margin-top: 20px;
}

.combo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.combo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.combo-item.triggered {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
}

.combo-status {
  font-size: 1rem;
  color: var(--text-secondary);
}

.combo-item.triggered .combo-status {
  color: #10b981;
}

.combo-item .combo-name {
  font-weight: 500;
  color: var(--text-primary);
}

.ending-description {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.ending-content-box {
  background: linear-gradient(135deg, #faf5ff, #fdf2f8);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.ending-text {
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--text-primary);
  white-space: pre-wrap;
}

.ending-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  padding-top: 16px;
  border-top: 2px solid #f3f4f6;
}

.meta-value {
  font-weight: 500;
  color: var(--text-primary);
}

.locked-content {
  text-align: center;
  padding: 40px 20px;
}

.locked-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.locked-content p {
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.locked-hint {
  font-size: 0.85rem;
  color: #9ca3af;
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .back-btn {
    top: 10px;
    padding: 6px 12px;
    font-size: 0.75rem;
  }

  .back-text {
    display: none;
  }

  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .dialogues-grid,
  .scenes-grid,
  .materials-grid,
  .endings-grid {
    grid-template-columns: 1fr;
  }

  .tab-label {
    display: none;
  }

  .tab-btn {
    min-width: auto;
    padding: 10px;
  }

  .scene-detail-stats {
    grid-template-columns: 1fr;
  }
}

.slide-up {
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
