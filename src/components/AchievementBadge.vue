<template>
  <div 
    class="achievement-badge"
    :class="[
      `rarity-${achievement.rarity}`,
      { unlocked: achievement.unlocked, locked: !achievement.unlocked, showAnimation: showAnimation }
    ]"
    @click="$emit('click', achievement)"
  >
    <div class="badge-icon-wrapper">
      <div class="badge-icon" :style="getIconStyle()">
        <span class="icon">{{ achievement.icon }}</span>
      </div>
      <div v-if="achievement.unlocked" class="unlocked-mark">✓</div>
      <div v-else class="locked-overlay">
        <span class="lock-icon">🔒</span>
      </div>
    </div>
    
    <div class="badge-content">
      <div class="badge-name">{{ achievement.unlocked ? achievement.name : '???' }}</div>
      <div class="badge-description">
        {{ achievement.unlocked ? achievement.description : '继续探索以解锁' }}
      </div>
      <div class="badge-meta">
        <span class="rarity-tag" :style="getRarityStyle()">
          {{ getRarityLabel() }}
        </span>
        <span v-if="achievement.unlocked && achievement.unlockedAt" class="unlock-time">
          {{ formatDate(achievement.unlockedAt) }}
        </span>
      </div>
      <div v-if="showReward && achievement.reward" class="badge-reward">
        <span class="reward-icon">🎁</span>
        <span class="reward-text">{{ getRewardText() }}</span>
      </div>
    </div>

    <div v-if="showAnimation && achievement.unlocked" class="particle-container">
      <span v-for="i in 8" :key="i" class="particle" :style="getParticleStyle(i)"></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const props = defineProps({
  achievement: {
    type: Object,
    required: true
  },
  showReward: {
    type: Boolean,
    default: true
  },
  showAnimation: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const gameStore = useGameStore()

const getRarityInfo = computed(() => {
  return gameStore.getAchievementRarityInfo(props.achievement.rarity)
})

const getIconStyle = () => {
  const rarity = getRarityInfo.value
  if (!props.achievement.unlocked) {
    return {
      background: '#f3f4f6',
      filter: 'grayscale(100%)'
    }
  }
  return {
    background: `linear-gradient(135deg, ${rarity.bgColor}, white)`,
    boxShadow: `0 0 15px ${rarity.color}40`
  }
}

const getRarityStyle = () => {
  const rarity = getRarityInfo.value
  return {
    background: rarity.bgColor,
    color: rarity.color,
    borderColor: rarity.color
  }
}

const getRarityLabel = () => {
  return getRarityInfo.value.name
}

const getRewardText = () => {
  const reward = props.achievement.reward
  if (!reward) return ''
  
  switch (reward.type) {
    case 'emotion_bonus':
      return `情绪值 +${reward.value}`
    case 'inheritance_ratio':
      return `继承比例 +${Math.round(reward.value * 100)}%`
    case 'max_inheritance':
      return `最大继承 +${reward.value}`
    case 'unlock_material':
      return `解锁隐藏素材`
    default:
      return '神秘奖励'
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  })
}

const getParticleStyle = (index) => {
  const angle = (index / 8) * 360
  const delay = index * 0.1
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`
  }
}
</script>

<style scoped>
.achievement-badge {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.achievement-badge:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.achievement-badge.unlocked {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4, #ffffff);
}

.achievement-badge.locked {
  opacity: 0.7;
  background: #f9fafb;
}

.achievement-badge.rarity-common.unlocked { border-color: #6b7280; }
.achievement-badge.rarity-rare.unlocked { border-color: #8b5cf6; }
.achievement-badge.rarity-epic.unlocked { border-color: #ec4899; }
.achievement-badge.rarity-legendary.unlocked { 
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7, #fff7ed, #ffffff);
  animation: legendaryGlow 3s ease-in-out infinite;
}

@keyframes legendaryGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.3); }
  50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.5); }
}

.badge-icon-wrapper {
  position: relative;
  flex-shrink: 0;
}

.badge-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.icon {
  font-size: 2rem;
}

.unlocked-mark {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  border: 2px solid white;
}

.locked-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
}

.lock-icon {
  font-size: 1.2rem;
}

.badge-content {
  flex: 1;
  min-width: 0;
}

.badge-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.achievement-badge.locked .badge-name {
  color: #9ca3af;
}

.badge-description {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 8px;
  line-height: 1.4;
}

.badge-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.rarity-tag {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid;
}

.unlock-time {
  font-size: 0.75rem;
  color: #9ca3af;
}

.badge-reward {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
  font-size: 0.8rem;
  color: #7c3aed;
}

.reward-icon {
  font-size: 0.9rem;
}

.reward-text {
  font-weight: 500;
}

.particle-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #fbbf24;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  animation: particleBurst 1s ease-out forwards;
  animation-delay: var(--delay);
}

@keyframes particleBurst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(80px);
    opacity: 0;
  }
}

.showAnimation {
  animation: badgePopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badgePopIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .achievement-badge {
    padding: 12px;
    gap: 12px;
  }
  
  .badge-icon {
    width: 50px;
    height: 50px;
  }
  
  .icon {
    font-size: 1.5rem;
  }
  
  .badge-name {
    font-size: 0.9rem;
  }
  
  .badge-description {
    font-size: 0.75rem;
  }
}
</style>
