<template>
  <div class="ending-card" :style="{ background: ending?.background || 'linear-gradient(135deg, #fce7f3, #fbcfe8)' }">
    <div class="card-decoration">
      <div class="washi-tape washi-tape-pink"></div>
      <div class="washi-tape washi-tape-purple"></div>
    </div>

    <div class="ending-header">
      <div class="ending-icon">{{ ending?.icon || '✨' }}</div>
      <div class="ending-badge">
        <span class="badge-type">{{ ending?.typeLabel || '结局' }}</span>
        <span class="badge-cycle" v-if="stats?.cycle > 1">第 {{ stats.cycle }} 周目</span>
      </div>
    </div>

    <h1 class="ending-title handwriting">{{ ending?.title || '未完的故事' }}</h1>
    
    <p class="ending-type">{{ getEndingTypeLabel() }}</p>
    
    <p class="ending-description">{{ ending?.description }}</p>

    <div class="ending-divider">✦ ✦ ✦</div>

    <div class="ending-score-section">
      <div class="score-circle">
        <svg class="score-svg" viewBox="0 0 120 120">
          <circle 
            cx="60" 
            cy="60" 
            r="50" 
            fill="none" 
            stroke="rgba(255,255,255,0.3)" 
            stroke-width="8"
          />
          <circle 
            cx="60" 
            cy="60" 
            r="50" 
            fill="none" 
            stroke="white" 
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 60 60)"
            class="score-progress"
          />
        </svg>
        <div class="score-content">
          <span class="score-value handwriting">{{ stats?.finalScore || 0 }}</span>
          <span class="score-label">综合评分</span>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-icon">💖</span>
        <span class="stat-value">{{ stats?.emotionValue || 0 }}</span>
        <span class="stat-label">情绪值</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">📖</span>
        <span class="stat-value">{{ stats?.completedChapters || 0 }}/{{ stats?.totalChapters || 4 }}</span>
        <span class="stat-label">章节</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🎨</span>
        <span class="stat-value">{{ stats?.placedMaterials || 0 }}</span>
        <span class="stat-label">素材</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🎯</span>
        <span class="stat-value">{{ stats?.perfectRate || 0 }}%</span>
        <span class="stat-label">精准率</span>
      </div>
    </div>

    <div class="key-lines-section" v-if="keyLines && keyLines.length > 0">
      <div class="section-subheader">
        <span class="subheader-icon">💬</span>
        <span class="subheader-title">经典语录</span>
      </div>
      <div class="key-lines-list">
        <div 
          v-for="(line, index) in displayKeyLines" 
          :key="index"
          class="key-line-item"
        >
          <span class="line-quote">「</span>
          <span class="line-text">{{ line.text }}</span>
          <span class="line-quote">」</span>
          <span class="line-speaker">—— {{ line.speaker }}</span>
        </div>
      </div>
      <div v-if="keyLines.length > maxKeyLines" class="show-more-lines">
        <button class="show-more-btn" @click="toggleKeyLines">
          {{ showAllKeyLines ? '收起' : `查看全部 ${keyLines.length} 条语录` }}
        </button>
      </div>
    </div>

    <div class="achievements-section" v-if="achievements && achievements.length > 0">
      <div class="section-subheader">
        <span class="subheader-icon">🏆</span>
        <span class="subheader-title">解锁成就</span>
        <span class="achievement-count">{{ achievements.length }}</span>
      </div>
      <div class="achievements-list">
        <div 
          v-for="achievement in displayAchievements" 
          :key="achievement.id"
          class="achievement-chip"
          :class="'rarity-' + achievement.rarity"
          :title="achievement.name"
        >
          <span class="achievement-icon">{{ achievement.icon }}</span>
          <span class="achievement-name">{{ achievement.name }}</span>
        </div>
        <div 
          v-if="achievements.length > maxAchievements" 
          class="achievement-chip more"
        >
          <span class="more-count">+{{ achievements.length - maxAchievements }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  ending: {
    type: Object,
    required: true
  },
  stats: {
    type: Object,
    default: () => ({})
  },
  keyLines: {
    type: Array,
    default: () => []
  },
  achievements: {
    type: Array,
    default: () => []
  },
  maxKeyLines: {
    type: Number,
    default: 3
  },
  maxAchievements: {
    type: Number,
    default: 6
  }
})

const showAllKeyLines = ref(false)

const displayKeyLines = computed(() => {
  if (showAllKeyLines.value) return props.keyLines
  return props.keyLines.slice(0, props.maxKeyLines)
})

const displayAchievements = computed(() => {
  return props.achievements.slice(0, props.maxAchievements)
})

const circumference = 2 * Math.PI * 50

const dashOffset = computed(() => {
  const score = props.stats?.finalScore || 0
  const progress = score / 100
  return circumference * (1 - progress)
})

const getEndingTypeLabel = () => {
  const type = props.ending?.type
  const labels = {
    eternal: '♾️ 永恒结局',
    ngp_perfect: '🌟 多周目完美结局',
    ngp_special: '🔄 多周目结局',
    true: '💎 真结局',
    perfect_path: '👑 完美结局',
    dialogue_master: '💬 心语结局',
    time_sequence: '⏰ 时序结局',
    special: '✨ 隐藏结局',
    good: '💕 好结局',
    normal: '📝 普通结局'
  }
  return labels[type] || '✨ 结局'
}

const toggleKeyLines = () => {
  showAllKeyLines.value = !showAllKeyLines.value
}
</script>

<style scoped>
.ending-card {
  position: relative;
  border-radius: 20px;
  padding: 50px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  text-align: center;
  overflow: hidden;
  color: #1f2937;
}

.card-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 30px;
}

.washi-tape {
  width: 80px;
  height: 25px;
  opacity: 0.8;
  transform: rotate(-3deg);
}

.washi-tape-pink {
  background: linear-gradient(90deg, #fbcfe8, #f9a8d4);
  transform: rotate(-4deg) translateY(-5px);
}

.washi-tape-purple {
  background: linear-gradient(90deg, #ddd6fe, #c4b5fd);
  transform: rotate(4deg) translateY(-5px);
}

.ending-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.ending-icon {
  font-size: 4rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.ending-badge {
  display: flex;
  gap: 8px;
}

.badge-type,
.badge-cycle {
  padding: 4px 14px;
  border-radius: 14px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);
}

.badge-cycle {
  background: rgba(251, 191, 36, 0.9);
  color: white;
}

.ending-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 8px;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
}

.ending-type {
  font-size: 1.1rem;
  color: #be185d;
  font-weight: 500;
  margin-bottom: 12px;
}

.ending-description {
  font-size: 1rem;
  color: #4b5563;
  font-style: italic;
  margin-bottom: 24px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.ending-divider {
  font-size: 1rem;
  color: #8b5cf6;
  margin: 24px 0;
  letter-spacing: 8px;
  opacity: 0.7;
}

.ending-score-section {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.score-circle {
  position: relative;
  width: 140px;
  height: 140px;
}

.score-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}

.score-progress {
  transition: stroke-dashoffset 1.5s ease-out;
}

.score-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  line-height: 1;
}

.score-label {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  margin-top: 2px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 12px;
}

.stat-icon {
  font-size: 1.3rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #be185d;
}

.stat-label {
  font-size: 0.7rem;
  color: #6b7280;
}

.section-subheader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  text-align: left;
}

.subheader-icon {
  font-size: 1.1rem;
}

.subheader-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.key-lines-section {
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  text-align: left;
}

.key-lines-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.key-line-item {
  font-size: 0.85rem;
  line-height: 1.6;
  color: #4b5563;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border-left: 3px solid #8b5cf6;
}

.line-quote {
  color: #8b5cf6;
  font-weight: 600;
}

.line-text {
  color: #374151;
}

.line-speaker {
  display: block;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 4px;
  text-align: right;
}

.show-more-lines {
  margin-top: 12px;
  text-align: center;
}

.show-more-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 14px;
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-more-btn:hover {
  background: rgba(139, 92, 246, 0.2);
}

.achievements-section {
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  text-align: left;
}

.achievement-count {
  font-size: 0.75rem;
  color: #7c3aed;
  background: rgba(139, 92, 246, 0.1);
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 600;
}

.achievements-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.achievement-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e5e7eb;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.achievement-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.achievement-chip.rarity-common {
  border-color: #9ca3af;
}

.achievement-chip.rarity-rare {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #faf5ff, #ffffff);
}

.achievement-chip.rarity-epic {
  border-color: #ec4899;
  background: linear-gradient(135deg, #fdf2f8, #ffffff);
}

.achievement-chip.rarity-legendary {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #ffffff);
  animation: legendaryPulse 2s ease-in-out infinite;
}

@keyframes legendaryPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.3); }
  50% { box-shadow: 0 0 12px 2px rgba(245, 158, 11, 0.4); }
}

.achievement-icon {
  font-size: 0.9rem;
}

.achievement-chip.more {
  border-style: dashed;
  cursor: default;
}

.more-count {
  color: #6b7280;
  font-weight: 600;
}

@media (max-width: 640px) {
  .ending-card {
    padding: 40px 24px;
  }
  
  .ending-title {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .score-circle {
    width: 120px;
    height: 120px;
  }
  
  .score-value {
    font-size: 2rem;
  }
}
</style>
