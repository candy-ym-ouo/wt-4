<template>
  <div class="emotion-meter" :class="'tier-' + currentTier.id">
    <div class="emotion-header">
      <div class="emotion-title-row">
        <span class="emotion-icon tier-icon">{{ currentTier.icon }}</span>
        <span class="emotion-label">情绪值</span>
      </div>
      <div class="emotion-value-wrap">
        <span class="emotion-value handwriting">{{ emotionValue }}</span>
        <span class="tier-badge">
          <span class="tier-name">{{ currentTier.name }}</span>
        </span>
      </div>
    </div>

    <div class="emotion-bar-container">
      <div class="emotion-bar-track">
        <div 
          class="emotion-bar-fill"
          :style="{ 
            width: emotionPercentage + '%',
            background: currentTier.gradient
          }"
        >
          <div class="emotion-bar-glow"></div>
        </div>
        <div class="emotion-bar-segments">
          <div 
            v-for="tier in displayTiers" 
            :key="tier.id"
            class="segment"
            :class="{ active: emotionValue >= tier.min }"
            :style="{ left: tier.min + '%' }"
          >
            <span class="segment-dot" :style="{ background: tier.color }"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="emotion-status">
      <span class="status-icon">{{ currentTier.icon }}</span>
      <span class="status-text">{{ currentTier.description }}</span>
    </div>

    <div class="tier-progress-info">
      <div class="tier-progress-label">
        <span v-if="nextTier">距离「{{ nextTier.name }}」还需 {{ nextTier.min - emotionValue }} 💕</span>
        <span v-else>情绪已满溢！</span>
      </div>
      <div class="tier-progress-bar">
        <div 
          class="tier-progress-fill"
          :style="{ 
            width: tierProgress + '%',
            background: nextTier ? nextTier.gradient : currentTier.gradient
          }"
        ></div>
      </div>
    </div>

    <div v-if="chapterProgress.target > 0" class="chapter-target">
      <div class="target-header">
        <span class="target-icon">🎯</span>
        <span class="target-label">本章目标</span>
        <span class="target-value">{{ chapterProgress.current }} / {{ chapterProgress.target }}</span>
      </div>
      <div class="target-bar">
        <div 
          class="target-fill"
          :class="{ reached: chapterProgress.reached }"
          :style="{ width: chapterProgress.percent + '%' }"
        ></div>
        <div class="target-marker" :style="{ left: '100%' }">
          <span class="marker-line"></span>
          <span class="marker-label">目标</span>
        </div>
      </div>
      <div class="target-hint" :class="{ reached: chapterProgress.reached }">
        <span v-if="chapterProgress.reached">✨ 已达成目标情绪值！</span>
        <span v-else>{{ currentTier.chapterHint }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()

const emotionValue = computed(() => gameStore.emotionValue)
const emotionPercentage = computed(() => Math.min(100, Math.max(0, emotionValue.value)))
const currentTier = computed(() => gameStore.currentEmotionTier)
const tierProgress = computed(() => gameStore.emotionTierProgress)
const chapterProgress = computed(() => gameStore.chapterEmotionProgress)

const displayTiers = computed(() => {
  return gameStore.emotionTiers.filter(t => t.min <= 100)
})

const nextTier = computed(() => {
  const current = currentTier.value
  const tiers = gameStore.emotionTiers
  const currentIndex = tiers.findIndex(t => t.id === current.id)
  if (currentIndex < tiers.length - 1 && tiers[currentIndex + 1].min <= 100) {
    return tiers[currentIndex + 1]
  }
  return null
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
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.emotion-meter::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--accent-pink);
  transition: background 0.4s ease;
}

.tier-calm::before { background: linear-gradient(90deg, #9ca3af, #6b7280); }
.tier-warm::before { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
.tier-tender::before { background: linear-gradient(90deg, #f472b6, #ec4899); }
.tier-heartbeat::before { background: linear-gradient(90deg, #fb7185, #f43f5e); }
.tier-touching::before { background: linear-gradient(90deg, #c084fc, #a855f7); }
.tier-overflow::before { 
  background: linear-gradient(90deg, #fbbf24, #ec4899, #a855f7, #fbbf24);
  background-size: 300% 100%;
  animation: headerGlow 2s ease infinite;
}

@keyframes headerGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.emotion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.emotion-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tier-icon {
  font-size: 1.4rem;
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.emotion-label {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.emotion-value-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.emotion-value {
  font-size: 2.2rem;
  font-weight: bold;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s ease;
}

.tier-calm .emotion-value { background: linear-gradient(135deg, #9ca3af, #6b7280); -webkit-background-clip: text; background-clip: text; }
.tier-warm .emotion-value { background: linear-gradient(135deg, #fbbf24, #f59e0b); -webkit-background-clip: text; background-clip: text; }
.tier-tender .emotion-value { background: linear-gradient(135deg, #f472b6, #ec4899); -webkit-background-clip: text; background-clip: text; }
.tier-heartbeat .emotion-value { background: linear-gradient(135deg, #fb7185, #f43f5e); -webkit-background-clip: text; background-clip: text; }
.tier-touching .emotion-value { background: linear-gradient(135deg, #c084fc, #a855f7); -webkit-background-clip: text; background-clip: text; }
.tier-overflow .emotion-value { 
  background: linear-gradient(135deg, #fbbf24, #ec4899, #a855f7);
  -webkit-background-clip: text;
  background-clip: text;
  animation: valueRainbow 3s ease infinite;
  background-size: 200% 200%;
}

@keyframes valueRainbow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.tier-badge {
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(236, 72, 153, 0.1);
  border: 1px solid rgba(236, 72, 153, 0.3);
  transition: all 0.3s ease;
}

.tier-calm .tier-badge { background: rgba(107, 114, 128, 0.1); border-color: rgba(107, 114, 128, 0.3); }
.tier-warm .tier-badge { background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); }
.tier-tender .tier-badge { background: rgba(236, 72, 153, 0.1); border-color: rgba(236, 72, 153, 0.3); }
.tier-heartbeat .tier-badge { background: rgba(244, 63, 94, 0.1); border-color: rgba(244, 63, 94, 0.3); }
.tier-touching .tier-badge { background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.3); }
.tier-overflow .tier-badge { 
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(236, 72, 153, 0.2));
  border-color: #fbbf24;
  animation: badgeGlow 2s ease-in-out infinite;
}

@keyframes badgeGlow {
  0%, 100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.3); }
  50% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.6); }
}

.tier-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-pink);
}

.tier-calm .tier-name { color: #6b7280; }
.tier-warm .tier-name { color: #f59e0b; }
.tier-tender .tier-name { color: #ec4899; }
.tier-heartbeat .tier-name { color: #f43f5e; }
.tier-touching .tier-name { color: #a855f7; }
.tier-overflow .tier-name { color: #f59e0b; }

.emotion-bar-container {
  position: relative;
  margin-bottom: 15px;
}

.emotion-bar-track {
  position: relative;
  height: 14px;
  background: #f3f4f6;
  border-radius: 7px;
  overflow: hidden;
}

.emotion-bar-fill {
  height: 100%;
  border-radius: 7px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.emotion-bar-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: barShine 2s ease-in-out infinite;
}

@keyframes barShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.emotion-bar-segments {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.segment {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

.segment-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  opacity: 0.6;
}

.segment.active .segment-dot {
  opacity: 1;
  transform: scale(1.2);
}

.emotion-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
  padding: 10px 16px;
  background: rgba(244, 114, 182, 0.08);
  border-radius: 12px;
  transition: background 0.3s ease;
}

.tier-calm .emotion-status { background: rgba(107, 114, 128, 0.08); }
.tier-warm .emotion-status { background: rgba(245, 158, 11, 0.08); }
.tier-tender .emotion-status { background: rgba(236, 72, 153, 0.08); }
.tier-heartbeat .emotion-status { background: rgba(244, 63, 94, 0.08); }
.tier-touching .emotion-status { background: rgba(168, 85, 247, 0.08); }
.tier-overflow .emotion-status { 
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(236, 72, 153, 0.1));
  animation: statusGlow 2s ease-in-out infinite;
}

@keyframes statusGlow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.status-icon {
  font-size: 1rem;
}

.status-text {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-style: italic;
  font-weight: 500;
}

.tier-progress-info {
  margin-bottom: 15px;
}

.tier-progress-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
  text-align: center;
}

.tier-progress-bar {
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
}

.tier-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.chapter-target {
  padding: 14px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%);
  border-radius: 12px;
  border: 1px solid #fcd34d;
  transition: all 0.3s ease;
}

.target-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.target-icon {
  font-size: 0.9rem;
}

.target-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #92400e;
  flex: 1;
}

.target-value {
  font-size: 0.82rem;
  font-weight: 700;
  color: #be185d;
}

.target-bar {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  margin-bottom: 8px;
}

.target-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #ec4899);
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.target-fill.reached {
  background: linear-gradient(90deg, #22c55e, #10b981);
}

.target-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}

.marker-line {
  position: absolute;
  width: 2px;
  height: 14px;
  background: #92400e;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 1px;
}

.marker-label {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.65rem;
  color: #92400e;
  font-weight: 600;
  white-space: nowrap;
}

.target-hint {
  font-size: 0.78rem;
  color: #92400e;
  text-align: center;
  font-style: italic;
}

.target-hint.reached {
  color: #047857;
  font-weight: 600;
  font-style: normal;
}

@media (max-width: 768px) {
  .emotion-meter {
    padding: 15px;
  }

  .emotion-value {
    font-size: 1.6rem;
  }

  .tier-badge {
    padding: 3px 10px;
  }

  .tier-name {
    font-size: 0.72rem;
  }

  .status-text {
    font-size: 0.82rem;
  }

  .emotion-bar-track {
    height: 12px;
  }

  .chapter-target {
    padding: 12px;
  }
}
</style>
