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
          <div class="stat-item">
            <span class="stat-label">最终情绪值</span>
            <span class="stat-value handwriting">{{ emotionValue }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">完成章节</span>
            <span class="stat-value handwriting">{{ completedChapters }} / {{ totalChapters }}</span>
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
const emotionValue = computed(() => gameStore.emotionValue)
const completedChapters = computed(() => gameStore.completedChapters.length)
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
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 40px;
  padding: 20px;
  background: var(--bg-primary);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  color: var(--accent-pink);
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
