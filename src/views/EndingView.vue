<template>
  <div 
    class="ending-view page-container" :style="{ background: ending?.background }">
    <div class="ending-content fade-in">
      <div class="ending-card">
        <div class="washi-tape"></div>
        <div class="washi-tape washi-tape-purple"></div>
        
        <div class="ending-icon">{{ getEndingIcon() }}</div>
        
        <h1 class="title text-gradient handwriting">{{ ending?.title }}</h1>
        <p class="ending-type">{{ getEndingType() }}</p>
        <p class="ending-description">{{ ending?.description }}</p>
        
        <div class="ending-divider">✦ ✦ ✦</div>
        
        <div class="ending-text">
          <p v-for="(paragraph, index) in endingParagraphs" :key="index" class="paragraph">
            {{ paragraph }}
          </p>
        </div>

        <div class="ending-stats">
          <div class="stat-header">
            <span class="score-label">综合评分</span>
            <span class="score-value handwriting">{{ ending?.stats?.finalScore || 0 }}</span>
            <span class="score-max">/ 100</span>
          </div>
          
          <div class="score-bar">
            <div 
              class="score-bar-fill"
              :style="{ width: (ending?.stats?.finalScore || 0) + '%' }"
            ></div>
          </div>

          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-icon">💖</span>
              <span class="stat-label">情绪值</span>
              <span class="stat-value">{{ ending?.stats?.emotionValue || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📖</span>
              <span class="stat-label">完成章节</span>
              <span class="stat-value">{{ ending?.stats?.completedChapters || 0 }}/{{ totalChapters }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">🎨</span>
              <span class="stat-label">放置素材</span>
              <span class="stat-value">{{ ending?.stats?.placedMaterials || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">✨</span>
              <span class="stat-label">完美放置</span>
              <span class="stat-value">{{ ending?.stats?.perfectPlacements || 0 }}</span>
            </div>
            <div v-if="ending?.stats?.positiveBonus > 0" class="stat-item">
              <span class="stat-icon">🌟</span>
              <span class="stat-label">额外加成</span>
              <span class="stat-value">+{{ ending?.stats?.positiveBonus || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="ending-actions">
          <button class="btn btn-primary" @click="playAgain">
            🔄 重新开始
          </button>
          <button class="btn btn-secondary" @click="goToChapters">
            📖 章节选择
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const ending = computed(() => gameStore.currentEnding)
const totalChapters = computed(() => gameStore.chapters.length)

const endingParagraphs = computed(() => {
  if (ending.value?.content) {
    return ending.value.content.split('\n\n').filter(p => p.trim())
  }
  return []
})

const getEndingIcon = () => {
  if (!ending.value) return '✨'
  const icons = {
    good: '💖',
    normal: '📖',
    special: '🌸'
  }
  return icons[ending.value.type] || '✨'
}

const getEndingType = () => {
  if (!ending.value) return ''
  const types = {
    good: '💕 好结局',
    normal: '📝 普通结局',
    special: '✨ 隐藏结局'
  }
  return types[ending.value.type] || ''
}

const playAgain = () => {
  gameStore.resetGame()
  router.push('/chapter-select')
}

const goToChapters = () => {
  gameStore.goToChapterSelect()
  router.push('/chapter-select')
}

onMounted(() => {
  if (!ending.value) {
    router.push('/chapter-select')
  }
})
</script>

<style scoped>
.ending-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.ending-content {
  max-width: 600px;
  width: 100%;
}

.ending-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 50px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.ending-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

.ending-type {
  font-size: 1.1rem;
  color: var(--accent-pink);
  font-weight: 500;
  margin-bottom: 15px;
}

.ending-description {
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 30px;
}

.ending-divider {
  font-size: 1rem;
  color: var(--accent-purple);
  margin: 30px 0;
  letter-spacing: 8px;
  opacity: 0.6;
}

.ending-text {
  text-align: left;
  margin-bottom: 40px;
}

.paragraph {
  font-size: 1.05rem;
  line-height: 2;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-indent: 2em;
}

.ending-stats {
  margin-bottom: 40px;
  padding: 25px;
  background: var(--bg-primary);
  border-radius: 16px;
}

.stat-header {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
}

.score-label {
  font-size: 1rem;
  color: var(--text-secondary);
}

.score-value {
  font-size: 3rem;
  color: var(--accent-pink);
  line-height: 1;
}

.score-max {
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.score-bar {
  width: 100%;
  height: 10px;
  background: rgba(244, 114, 182, 0.15);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 20px;
}

.score-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f472b6, #a78bfa, #fbbf24);
  border-radius: 5px;
  transition: width 1s ease-out;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
}

.stat-icon {
  font-size: 1.4rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.3rem;
  color: var(--accent-pink);
  font-weight: 600;
}

.ending-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@media (max-width: 768px) {
  .ending-card {
    padding: 40px 25px;
  }

  .ending-icon {
    font-size: 3rem;
  }

  .ending-stats {
    gap: 20px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .paragraph {
    font-size: 1rem;
    line-height: 1.8;
  }
}
</style>
