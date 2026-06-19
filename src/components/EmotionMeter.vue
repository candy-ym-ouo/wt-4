<template>
  <div class="emotion-meter">
    <div class="emotion-header">
      <span class="emotion-label">💕 情绪值</span>
      <span class="emotion-value handwriting">{{ emotionValue }}</span>
    </div>
    <div class="emotion-bar-container">
      <div 
        class="emotion-bar"
        :style="{ width: emotionPercentage + '%' }"
      >
        <div class="emotion-bar-inner"></div>
      </div>
      <div class="emotion-milestones">
        <span 
          v-for="milestone in milestones" 
          :key="milestone.value"
          class="milestone"
          :class="{ reached: emotionValue >= milestone.value }"
          :style="{ left: milestone.value + '%' }"
          :title="milestone.label"
        >
          <span class="milestone-dot"></span>
          <span class="milestone-label">{{ milestone.label }}</span>
        </span>
      </div>
    </div>
    <div class="emotion-status">
      <span class="status-text">{{ currentMood }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()

const emotionValue = computed(() => gameStore.emotionValue)
const emotionPercentage = computed(() => Math.min(100, Math.max(0, emotionValue.value)))

const milestones = [
  { value: 25, label: '平静' },
  { value: 50, label: '温暖' },
  { value: 75, label: '心动' },
  { value: 100, label: '感动' }
]

const currentMood = computed(() => {
  const value = emotionValue.value
  if (value >= 100) return '✨ 心弦颤动，所有的记忆都在发光'
  if (value >= 90) return '💖 心中满是温暖的回忆'
  if (value >= 75) return '💕 心跳加速，仿佛回到了那个夏天'
  if (value >= 50) return '🌸 淡淡的温暖涌上心头'
  if (value >= 25) return '📖 记忆正在慢慢苏醒'
  return '🌙 平静如水，故事刚刚开始'
})
</script>

<style scoped>
.emotion-meter {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: var(--shadow-md);
  max-width: 600px;
  margin: 0 auto;
}

.emotion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.emotion-label {
  font-size: 1rem;
  color: var(--text-secondary);
}

.emotion-value {
  font-size: 2rem;
  color: var(--accent-pink);
  font-weight: bold;
}

.emotion-bar-container {
  position: relative;
  margin-bottom: 25px;
}

.emotion-bar {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  transition: width 0.5s ease;
}

.emotion-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #f472b6, #ec4899, #a78bfa);
  border-radius: 6px;
  box-shadow: 0 0 10px rgba(244, 114, 182, 0.5);
}

.emotion-milestones {
  position: relative;
  height: 40px;
  margin-top: 5px;
}

.milestone {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.milestone-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d1d5db;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.milestone.reached .milestone-dot {
  background: linear-gradient(135deg, #f472b6, #ec4899);
  box-shadow: 0 0 8px rgba(244, 114, 182, 0.6);
}

.milestone-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
  transition: color 0.3s ease;
}

.milestone.reached .milestone-label {
  color: var(--accent-pink);
  font-weight: 500;
}

.emotion-status {
  text-align: center;
}

.status-text {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-style: italic;
}

@media (max-width: 768px) {
  .emotion-meter {
    padding: 15px;
  }

  .emotion-value {
    font-size: 1.5rem;
  }

  .milestone-label {
    font-size: 0.7rem;
  }

  .status-text {
    font-size: 0.85rem;
  }
}
</style>
