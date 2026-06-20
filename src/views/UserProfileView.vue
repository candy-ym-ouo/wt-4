<template>
  <div class="user-profile page-container paper-texture">
    <div class="header">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
        <span class="back-text">返回</span>
      </button>
      <h1 class="title handwriting text-gradient">成长档案</h1>
      <p class="subtitle">记录每一段珍贵的旅程</p>
    </div>

    <div class="profile-header-card">
      <div class="avatar-section">
        <div class="avatar-circle">
          <span class="avatar-emoji">{{ profileStats.profile.avatar }}</span>
        </div>
        <div class="user-info">
          <h2 class="nickname">{{ profileStats.profile.nickname }}</h2>
          <p class="join-date">
            <span class="date-icon">📅</span>
            自 {{ formatDate(profileStats.profile.createdAt) }} 加入
          </p>
          <div class="play-time-badge">
            <span class="time-icon">⏱️</span>
            游戏时长：{{ profileStats.totalPlayTime }}
          </div>
        </div>
      </div>
      <div class="quick-stats">
        <div class="quick-stat-item">
          <div class="stat-number">{{ profileStats.totalClearCount }}</div>
          <div class="stat-label">通关次数</div>
        </div>
        <div class="quick-stat-item">
          <div class="stat-number highlight-perfect">{{ profileStats.perfectClearCount }}</div>
          <div class="stat-label">完美通关</div>
        </div>
        <div class="quick-stat-item">
          <div class="stat-number">{{ profileStats.playSessions }}</div>
          <div class="stat-label">游戏场次</div>
        </div>
        <div class="quick-stat-item">
          <div class="stat-number">{{ profileStats.totalFavorites }}</div>
          <div class="stat-label">收藏总数</div>
        </div>
      </div>
    </div>

    <div class="section-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.name }}</span>
      </button>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'records'" class="records-section">
        <div class="section-header">
          <h3 class="section-title">📜 通关记录</h3>
          <div class="section-subtitle">每一次通关都是成长的印记</div>
        </div>

        <div v-if="clearRecords.length === 0" class="empty-state">
          <div class="empty-icon">📖</div>
          <p class="empty-text">还没有通关记录</p>
          <p class="empty-hint">开始游戏，创造属于你的回忆吧</p>
        </div>

        <div v-else class="records-timeline">
          <div
            v-for="(record, index) in sortedRecords"
            :key="record.id"
            class="record-item"
          >
            <div class="timeline-dot" :class="{ perfect: record.isPerfect }">
              {{ record.isPerfect ? '⭐' : '✓' }}
            </div>
            <div class="record-card" :class="{ perfect: record.isPerfect }">
              <div class="record-header">
                <div class="record-chapter">
                  <span class="chapter-name">{{ getChapterTitle(record.chapterId) }}</span>
                  <span v-if="record.isPerfect" class="perfect-badge">完美通关</span>
                </div>
                <div class="record-score">
                  <span class="score-label">得分</span>
                  <span class="score-value">{{ record.score }}</span>
                </div>
              </div>
              <div class="record-meta">
                <span class="meta-item">
                  <span class="meta-icon">💕</span>
                  最终情绪：{{ record.finalEmotion }}
                </span>
                <span class="meta-item">
                  <span class="meta-icon">🎨</span>
                  使用素材：{{ record.materialsUsed?.length || 0 }} 个
                </span>
                <span class="meta-item">
                  <span class="meta-icon">🎯</span>
                  触发组合：{{ record.combosTriggered?.length || 0 }} 个
                </span>
              </div>
              <div class="record-footer">
                <span class="record-time">{{ formatDateTime(record.completedAt) }}</span>
                <button class="detail-btn" @click="showRecordDetail(record)">
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'preferences'" class="preferences-section">
        <div class="section-header">
          <h3 class="section-title">🎯 偏好分析</h3>
          <div class="section-subtitle">发现你的独特品味</div>
        </div>

        <div class="preferences-grid">
          <div class="preference-card">
            <div class="card-header">
              <span class="card-icon">🎨</span>
              <h4 class="card-title">最常使用的素材</h4>
            </div>
            <div v-if="topMaterials.length === 0" class="card-empty">
              暂无数据
            </div>
            <div v-else class="top-list">
              <div
                v-for="(mat, index) in topMaterials"
                :key="mat.id"
                class="top-item"
              >
                <div class="item-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
                <div class="item-icon" :style="{ background: mat.color + '20' }">
                  {{ getMaterialEmoji(mat.shape) }}
                </div>
                <div class="item-info">
                  <div class="item-name">{{ mat.name }}</div>
                  <div class="item-count">使用 {{ mat.usageCount }} 次</div>
                </div>
                <div class="item-progress">
                  <div 
                    class="progress-bar" 
                    :style="{ width: mat.percentage + '%', background: mat.color }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div class="preference-card">
            <div class="card-header">
              <span class="card-icon">📖</span>
              <h4 class="card-title">最常游玩的章节</h4>
            </div>
            <div v-if="!profileStats.mostPlayedChapter" class="card-empty">
              暂无数据
            </div>
            <div v-else class="favorite-chapter">
              <div class="chapter-cover" :style="{ background: profileStats.mostPlayedChapter.background }">
                <span class="chapter-emoji">🌸</span>
              </div>
              <div class="chapter-info">
                <h5 class="chapter-title">{{ profileStats.mostPlayedChapter.title }}</h5>
                <p class="chapter-play-count">已游玩 {{ profileStats.mostPlayedChapter.playCount }} 次</p>
                <p class="chapter-desc">{{ profileStats.mostPlayedChapter.description }}</p>
              </div>
            </div>
          </div>

          <div class="preference-card">
            <div class="card-header">
              <span class="card-icon">💕</span>
              <h4 class="card-title">情绪偏好</h4>
            </div>
            <div class="emotion-preference">
              <div class="emotion-avg">
                <div class="avg-value">{{ profileStats.averageEmotion }}</div>
                <div class="avg-label">平均情绪值</div>
              </div>
              <div class="emotion-trend">
                <div class="trend-icon">{{ getTrendIcon(profileStats.emotionTrend) }}</div>
                <div class="trend-text">{{ getTrendText(profileStats.emotionTrend) }}</div>
              </div>
            </div>
          </div>

          <div class="preference-card">
            <div class="card-header">
              <span class="card-icon">⭐</span>
              <h4 class="card-title">最爱的素材类型</h4>
            </div>
            <div v-if="categoryStats.length === 0" class="card-empty">
              暂无数据
            </div>
            <div v-else class="category-list">
              <div
                v-for="cat in categoryStats"
                :key="cat.id"
                class="category-item"
              >
                <span class="cat-icon">{{ cat.icon }}</span>
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-count">{{ cat.count }} 次</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'emotion'" class="emotion-section">
        <div class="section-header">
          <h3 class="section-title">📈 情绪变化趋势</h3>
          <div class="section-subtitle">记录心情的起伏变化</div>
        </div>

        <div class="emotion-summary-cards">
          <div class="summary-card average-card">
            <div class="summary-icon">📊</div>
            <div class="summary-info">
              <div class="summary-value">{{ emotionTrendData.average }}</div>
              <div class="summary-label">平均情绪值</div>
            </div>
          </div>
          <div class="summary-card max-card">
            <div class="summary-icon">📈</div>
            <div class="summary-info">
              <div class="summary-value">{{ emotionTrendData.max }}</div>
              <div class="summary-label">最高情绪值</div>
            </div>
          </div>
          <div class="summary-card min-card">
            <div class="summary-icon">📉</div>
            <div class="summary-info">
              <div class="summary-value">{{ emotionTrendData.min }}</div>
              <div class="summary-label">最低情绪值</div>
            </div>
          </div>
          <div class="summary-card trend-card">
            <div class="summary-icon">{{ getTrendIcon(emotionTrendData.trend) }}</div>
            <div class="summary-info">
              <div class="summary-value">{{ getTrendText(emotionTrendData.trend) }}</div>
              <div class="summary-label">情绪趋势</div>
            </div>
          </div>
        </div>

        <div class="period-selector">
          <button
            v-for="period in periods"
            :key="period.id"
            class="period-btn"
            :class="{ active: selectedPeriod === period.id }"
            @click="selectedPeriod = period.id"
          >
            {{ period.name }}
          </button>
        </div>

        <div class="emotion-chart-container">
          <div class="chart-placeholder">
            <div class="chart-y-axis">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>
            <div class="chart-area">
              <div class="chart-grid">
                <div v-for="i in 5" :key="i" class="grid-line"></div>
              </div>
              <svg class="emotion-line-chart" viewBox="0 0 800 300" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="emotionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#ec4899;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#ec4899;stop-opacity:0" />
                  </linearGradient>
                </defs>
                <path
                  :d="areaPath"
                  fill="url(#emotionGradient)"
                />
                <path
                  :d="linePath"
                  fill="none"
                  stroke="url(#lineGradient)"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#8b5cf6" />
                    <stop offset="50%" style="stop-color:#ec4899" />
                    <stop offset="100%" style="stop-color:#f59e0b" />
                  </linearGradient>
                </defs>
                <circle
                  v-for="(point, index) in chartPoints"
                  :key="index"
                  :cx="point.x"
                  :cy="point.y"
                  r="5"
                  fill="white"
                  stroke="#ec4899"
                  stroke-width="3"
                />
              </svg>
            </div>
          </div>
          <div class="chart-x-labels">
            <span v-for="(label, index) in xAxisLabels" :key="index">{{ label }}</span>
          </div>
        </div>

        <div v-if="emotionHistory.length === 0" class="empty-state">
          <div class="empty-icon">💭</div>
          <p class="empty-text">暂无情绪记录</p>
          <p class="empty-hint">开始游戏后，情绪变化会自动记录在这里</p>
        </div>
      </div>

      <div v-if="activeTab === 'favorites'" class="favorites-section">
        <div class="section-header">
          <h3 class="section-title">💝 我的收藏</h3>
          <div class="section-subtitle">珍藏最打动你的瞬间</div>
        </div>

        <div class="favorite-tabs">
          <button
            v-for="cat in favoriteCategories"
            :key="cat.id"
            class="fav-tab-btn"
            :class="{ active: activeFavoriteTab === cat.id }"
            @click="activeFavoriteTab = cat.id"
          >
            <span class="fav-tab-icon">{{ cat.icon }}</span>
            <span class="fav-tab-label">{{ cat.name }}</span>
            <span class="fav-tab-count">{{ getFavoritesCount(cat.id) }}</span>
          </button>
        </div>

        <div class="favorites-content">
          <div v-if="getCurrentFavorites().length === 0" class="empty-state">
            <div class="empty-icon">💝</div>
            <p class="empty-text">还没有收藏内容</p>
            <p class="empty-hint">在游戏中遇到喜欢的内容，点击收藏按钮即可保存</p>
          </div>

          <div v-else class="favorites-grid">
            <div
              v-for="item in getCurrentFavorites()"
              :key="item.id"
              class="favorite-card"
            >
              <div class="fav-card-header">
                <span class="fav-type-tag">{{ getFavoriteTypeLabel(activeFavoriteTab) }}</span>
                <button class="fav-remove-btn" @click="removeFromFavorites(item)">
                  ✕
                </button>
              </div>
              <div class="fav-card-body">
                <template v-if="activeFavoriteTab === 'dialogues'">
                  <div class="fav-speaker">{{ item.speaker }}</div>
                  <p class="fav-text">"{{ item.text }}"</p>
                </template>
                <template v-else-if="activeFavoriteTab === 'scenes'">
                  <div class="fav-scene-bg" :style="{ background: item.background }">
                    <span class="scene-emoji">🎬</span>
                  </div>
                  <h5 class="fav-title">{{ item.title || item.id }}</h5>
                </template>
                <template v-else-if="activeFavoriteTab === 'materials'">
                  <div class="fav-material-icon" :style="{ background: item.color + '20' }">
                    {{ getMaterialEmoji(item.shape) }}
                  </div>
                  <h5 class="fav-title">{{ item.name }}</h5>
                  <p class="fav-desc">{{ item.description }}</p>
                </template>
                <template v-else-if="activeFavoriteTab === 'endings'">
                  <div class="fav-ending-bg" :style="{ background: item.background }">
                    <span class="ending-emoji">🃏</span>
                  </div>
                  <h5 class="fav-title">{{ item.title }}</h5>
                  <p class="fav-desc">{{ item.description }}</p>
                </template>
                <template v-else-if="activeFavoriteTab === 'combos'">
                  <div class="fav-combo-icon">🎯</div>
                  <h5 class="fav-title">{{ item.name }}</h5>
                  <p class="fav-desc">{{ item.description }}</p>
                </template>
              </div>
              <div class="fav-card-footer">
                <span class="fav-date">收藏于 {{ formatDate(item.favoritedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRecordModal" class="modal-overlay" @click.self="closeRecordDetail">
      <div class="modal-content slide-up">
        <button class="modal-close" @click="closeRecordDetail">✕</button>
        <div class="modal-header">
          <h3 class="modal-title">通关详情</h3>
        </div>
        <div class="modal-body">
          <div v-if="selectedRecord" class="record-detail">
            <div class="detail-row">
              <span class="detail-label">章节</span>
              <span class="detail-value">{{ getChapterTitle(selectedRecord.chapterId) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">得分</span>
              <span class="detail-value highlight">{{ selectedRecord.score }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">评价</span>
              <span class="detail-value">
                <span v-if="selectedRecord.isPerfect" class="perfect-tag">⭐ 完美通关</span>
                <span v-else class="normal-tag">✓ 通关</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">最终情绪值</span>
              <span class="detail-value">{{ selectedRecord.finalEmotion }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">使用素材</span>
              <span class="detail-value">{{ selectedRecord.materialsUsed?.length || 0 }} 个</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">触发组合</span>
              <span class="detail-value">{{ selectedRecord.combosTriggered?.length || 0 }} 个</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">通关时间</span>
              <span class="detail-value">{{ formatDateTime(selectedRecord.completedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profileStore'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const profileStore = useProfileStore()
const gameStore = useGameStore()

const activeTab = ref('records')
const activeFavoriteTab = ref('dialogues')
const selectedPeriod = ref('recent')
const showRecordModal = ref(false)
const selectedRecord = ref(null)

const tabs = [
  { id: 'records', name: '通关记录', icon: '📜' },
  { id: 'preferences', name: '偏好分析', icon: '🎯' },
  { id: 'emotion', name: '情绪趋势', icon: '📈' },
  { id: 'favorites', name: '我的收藏', icon: '💝' }
]

const periods = [
  { id: 'today', name: '今天' },
  { id: 'week', name: '本周' },
  { id: 'recent', name: '最近' }
]

const favoriteCategories = [
  { id: 'dialogues', name: '对白', icon: '💬' },
  { id: 'scenes', name: '场景', icon: '🎬' },
  { id: 'materials', name: '素材', icon: '🎨' },
  { id: 'endings', name: '结局', icon: '🃏' },
  { id: 'combos', name: '组合', icon: '🎯' }
]

const profileStats = computed(() => profileStore.getProfileStats())

const clearRecords = computed(() => profileStore.clearRecords)

const sortedRecords = computed(() => {
  return [...clearRecords.value].sort((a, b) => b.completedAt - a.completedAt)
})

const emotionHistory = computed(() => profileStore.emotionHistory)

const emotionTrendData = computed(() => {
  return profileStore.getEmotionTrendData(selectedPeriod.value)
})

const topMaterials = computed(() => {
  const usage = profileStore.preferences.materialUsageCount
  const entries = Object.entries(usage)
    .map(([id, count]) => {
      const mat = gameStore.getMaterialById(id)
      if (!mat) return null
      return { ...mat, usageCount: count }
    })
    .filter(Boolean)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5)
  
  if (entries.length === 0) return []
  
  const maxCount = entries[0].usageCount
  return entries.map(e => ({
    ...e,
    percentage: Math.round((e.usageCount / maxCount) * 100)
  }))
})

const categoryStats = computed(() => {
  const usage = profileStore.preferences.materialUsageCount
  const categories = {}
  
  Object.entries(usage).forEach(([matId, count]) => {
    const mat = gameStore.getMaterialById(matId)
    if (mat) {
      if (!categories[mat.category]) {
        categories[mat.category] = 0
      }
      categories[mat.category] += count
    }
  })
  
  return Object.entries(categories)
    .map(([id, count]) => ({
      id,
      name: id === 'nature' ? '自然' : '文具',
      icon: id === 'nature' ? '🌿' : '📝',
      count
    }))
    .sort((a, b) => b.count - a.count)
})

const chartPoints = computed(() => {
  const data = emotionTrendData.value.data
  if (data.length === 0) return []
  
  const width = 800
  const height = 300
  const padding = 20
  
  return data.map((point, index) => {
    const x = data.length > 1 ? padding + (index / (data.length - 1)) * (width - padding * 2) : width / 2
    const y = height - padding - (point.value / 100) * (height - padding * 2)
    return { x, y, value: point.value }
  })
})

const linePath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  return chartPoints.value
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ')
})

const areaPath = computed(() => {
  if (chartPoints.value.length === 0) return ''
  const points = chartPoints.value
  const first = points[0]
  const last = points[points.length - 1]
  const bottomY = 300 - 20
  return `M ${first.x} ${bottomY} L ${first.x} ${first.y} ${linePath.value} L ${last.x} ${bottomY} Z`
})

const xAxisLabels = computed(() => {
  const data = emotionTrendData.value.data
  if (data.length === 0) return []
  
  const labelCount = Math.min(5, data.length)
  const step = Math.max(1, Math.floor(data.length / labelCount))
  
  const labels = []
  for (let i = 0; i < data.length; i += step) {
    const date = new Date(data[i].timestamp)
    if (selectedPeriod.value === 'today') {
      labels.push(date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
    } else {
      labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }))
    }
  }
  return labels
})

const getFavoritesCount = (type) => {
  return profileStore.getFavoritesByType(type).length
}

const getCurrentFavorites = () => {
  return profileStore.getFavoritesByType(activeFavoriteTab.value)
}

const getFavoriteTypeLabel = (type) => {
  const map = {
    dialogues: '对白',
    scenes: '场景',
    materials: '素材',
    endings: '结局',
    combos: '组合'
  }
  return map[type] || type
}

const getChapterTitle = (chapterId) => {
  const chapter = gameStore.getChapterById(chapterId)
  return chapter ? chapter.title : chapterId
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

const getTrendIcon = (trend) => {
  const map = {
    rising: '📈',
    slightly_rising: '↗️',
    stable: '➡️',
    slightly_falling: '↘️',
    falling: '📉'
  }
  return map[trend] || '➡️'
}

const getTrendText = (trend) => {
  const map = {
    rising: '持续上升',
    slightly_rising: '小幅上升',
    stable: '保持平稳',
    slightly_falling: '小幅下降',
    falling: '持续下降'
  }
  return map[trend] || '保持平稳'
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (timestamp) => {
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

const showRecordDetail = (record) => {
  selectedRecord.value = record
  showRecordModal.value = true
}

const closeRecordDetail = () => {
  showRecordModal.value = false
  selectedRecord.value = null
}

const removeFromFavorites = (item) => {
  profileStore.removeFavorite(activeFavoriteTab.value, item.id)
}

const goBack = () => {
  router.push('/chapter-select')
}

onMounted(() => {
  profileStore.initialize()
})
</script>

<style scoped>
.user-profile {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 40px;
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

.profile-header-card {
  background: linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%);
  border-radius: 24px;
  padding: 30px;
  margin-bottom: 30px;
  border: 2px solid #f3e8ff;
  box-shadow: var(--shadow-md);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
  border: 3px solid #e9d5ff;
}

.avatar-emoji {
  font-size: 2.5rem;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.join-date {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.date-icon {
  margin-right: 4px;
}

.play-time-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  border: 1px solid #e5e7eb;
}

.time-icon {
  font-size: 1rem;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.quick-stat-item {
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-number.highlight-perfect {
  color: #f59e0b;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.section-tabs {
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
  padding: 14px 20px;
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

.tab-content {
  min-height: 400px;
}

.section-header {
  text-align: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.section-subtitle {
  color: var(--text-secondary);
  font-size: 0.95rem;
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

.records-timeline {
  position: relative;
  padding-left: 40px;
}

.records-timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #c4b5fd, #f9a8d4, #fcd34d);
}

.record-item {
  position: relative;
  margin-bottom: 20px;
}

.timeline-dot {
  position: absolute;
  left: -33px;
  top: 20px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: white;
  border: 3px solid #8b5cf6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  z-index: 1;
}

.timeline-dot.perfect {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}

.record-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 2px solid #f3f4f6;
  transition: all 0.3s ease;
}

.record-card:hover {
  transform: translateX(5px);
  box-shadow: var(--shadow-md);
}

.record-card.perfect {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.record-chapter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chapter-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.perfect-badge {
  padding: 3px 10px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.record-score {
  text-align: right;
}

.score-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: block;
}

.score-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #8b5cf6;
}

.record-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.meta-icon {
  font-size: 0.9rem;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.record-time {
  font-size: 0.85rem;
  color: #9ca3af;
}

.detail-btn {
  padding: 6px 16px;
  background: linear-gradient(135deg, #f3e8ff, #fce7f3);
  color: #7c3aed;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.detail-btn:hover {
  background: linear-gradient(135deg, #e9d5ff, #fbcfe8);
  transform: scale(1.05);
}

.preferences-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.preference-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: 2px solid #f3f4f6;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.card-icon {
  font-size: 1.5rem;
}

.card-title {
  font-size: 1.1rem;
  color: var(--text-primary);
  font-weight: 600;
}

.card-empty {
  text-align: center;
  padding: 30px;
  color: #9ca3af;
}

.top-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f3f4f6;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-rank.rank-1 {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
}

.item-rank.rank-2 {
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  color: #6b7280;
}

.item-rank.rank-3 {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
  color: #c2410c;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.item-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.item-progress {
  width: 80px;
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.favorite-chapter {
  display: flex;
  gap: 16px;
}

.chapter-cover {
  width: 80px;
  height: 100px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chapter-emoji {
  font-size: 2rem;
}

.chapter-info {
  flex: 1;
}

.chapter-title {
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.chapter-play-count {
  font-size: 0.8rem;
  color: #8b5cf6;
  margin-bottom: 6px;
  font-weight: 500;
}

.chapter-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.emotion-preference {
  display: flex;
  align-items: center;
  gap: 20px;
}

.emotion-avg {
  text-align: center;
  flex: 1;
}

.avg-value {
  font-size: 3rem;
  font-weight: bold;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.avg-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.emotion-trend {
  text-align: center;
  flex: 1;
  padding: 16px;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border-radius: 12px;
}

.trend-icon {
  font-size: 2rem;
  margin-bottom: 4px;
}

.trend-text {
  font-size: 0.9rem;
  color: #16a34a;
  font-weight: 500;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #f9fafb;
  border-radius: 10px;
}

.cat-icon {
  font-size: 1.2rem;
}

.cat-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.cat-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.emotion-summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  border: 2px solid #f3f4f6;
}

.summary-icon {
  font-size: 2rem;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-primary);
}

.summary-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.period-selector {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.period-btn {
  padding: 8px 20px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  font-family: var(--font-serif);
}

.period-btn:hover {
  border-color: #c4b5fd;
  background: #faf5ff;
}

.period-btn.active {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  border-color: transparent;
}

.emotion-chart-container {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: 2px solid #f3f4f6;
}

.chart-placeholder {
  display: flex;
  height: 300px;
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 10px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  width: 30px;
}

.chart-area {
  flex: 1;
  position: relative;
}

.chart-grid {
  position: absolute;
  inset: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.grid-line {
  height: 1px;
  background: #f3f4f6;
}

.emotion-line-chart {
  width: 100%;
  height: 100%;
}

.chart-x-labels {
  display: flex;
  justify-content: space-between;
  padding: 10px 40px 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.favorite-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.fav-tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  font-family: var(--font-serif);
}

.fav-tab-btn:hover {
  border-color: #c4b5fd;
  background: #faf5ff;
}

.fav-tab-btn.active {
  background: linear-gradient(135deg, #ec4899, #f472b6);
  color: white;
  border-color: transparent;
}

.fav-tab-icon {
  font-size: 1rem;
}

.fav-tab-count {
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.fav-tab-btn:not(.active) .fav-tab-count {
  background: #f3f4f6;
  color: var(--text-secondary);
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.favorite-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 2px solid #f3f4f6;
  transition: all 0.3s ease;
}

.favorite-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.fav-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fdf2f8, #faf5ff);
  border-bottom: 1px solid #fce7f3;
}

.fav-type-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: #be185d;
  background: rgba(236, 72, 153, 0.1);
  padding: 3px 10px;
  border-radius: 10px;
}

.fav-remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.fav-remove-btn:hover {
  background: #fecaca;
  color: #dc2626;
  transform: scale(1.1);
}

.fav-card-body {
  padding: 16px;
  min-height: 100px;
}

.fav-speaker {
  font-weight: 600;
  color: #8b5cf6;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.fav-text {
  font-style: italic;
  color: var(--text-primary);
  line-height: 1.6;
  font-size: 0.9rem;
}

.fav-scene-bg,
.fav-ending-bg {
  width: 100%;
  height: 80px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.scene-emoji,
.ending-emoji {
  font-size: 2rem;
}

.fav-title {
  font-size: 1rem;
  color: var(--text-primary);
  margin-bottom: 6px;
  font-weight: 600;
}

.fav-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.fav-material-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 12px;
}

.fav-combo-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

.fav-card-footer {
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
}

.fav-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}

.modal-header {
  padding: 24px 30px;
  border-bottom: 2px solid #f3f4f6;
  background: linear-gradient(135deg, #faf5ff, #fdf2f8);
  border-radius: 20px 20px 0 0;
}

.modal-title {
  font-size: 1.3rem;
  color: var(--text-primary);
}

.modal-body {
  padding: 24px 30px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.detail-value {
  font-weight: 500;
  color: var(--text-primary);
}

.detail-value.highlight {
  font-size: 1.5rem;
  color: #8b5cf6;
  font-weight: bold;
}

.perfect-tag {
  padding: 4px 12px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85rem;
}

.normal-tag {
  padding: 4px 12px;
  background: #f3f4f6;
  color: var(--text-secondary);
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.85rem;
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

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .preferences-grid {
    grid-template-columns: 1fr;
  }

  .emotion-summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .tab-label {
    display: none;
  }

  .tab-btn {
    min-width: auto;
    padding: 10px;
  }

  .favorites-grid {
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
