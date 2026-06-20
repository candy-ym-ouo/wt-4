<template>
  <div 
    class="decoration-badge"
    :class="[
      `rarity-${decoration.rarity}`,
      `category-${decoration.category}`,
      { 
        unlocked: isUnlocked, 
        locked: !isUnlocked, 
        applied: isApplied,
        showAnimation: showAnimation 
      }
    ]"
    @click="$emit('click', decoration)"
  >
    <div class="badge-preview-wrapper">
      <div class="badge-preview" :style="getPreviewStyle()">
        <div v-if="decoration.category === 'background'" class="preview-bg" :style="getBackgroundPreview()"></div>
        <div v-else-if="decoration.category === 'frame'" class="preview-frame" :style="getFramePreview()"></div>
        <div v-else-if="decoration.category === 'font'" class="preview-font" :style="getFontPreview()">字</div>
        <div v-else-if="decoration.category === 'cover'" class="preview-cover" :style="getCoverPreview()">
          <span class="cover-icon">{{ decoration.preview.icon }}</span>
        </div>
      </div>
      <div v-if="isUnlocked" class="unlocked-mark">✓</div>
      <div v-else class="locked-overlay">
        <span class="lock-icon">🔒</span>
      </div>
      <div v-if="isApplied" class="applied-badge">
        <span>使用中</span>
      </div>
    </div>
    
    <div class="badge-content">
      <div class="badge-category">
        <span class="category-icon">{{ categoryIcon }}</span>
        <span class="category-name">{{ categoryName }}</span>
      </div>
      <div class="badge-name">{{ isUnlocked ? decoration.name : '???' }}</div>
      <div class="badge-description">
        {{ isUnlocked ? decoration.description : getUnlockHint() }}
      </div>
      <div class="badge-meta">
        <span class="rarity-tag" :style="getRarityStyle()">
          {{ getRarityLabel() }}
        </span>
        <span v-if="isUnlocked && unlockTime" class="unlock-time">
          {{ formatDate(unlockTime) }} 解锁
        </span>
      </div>
      <div v-if="showAction && isUnlocked && !isApplied" class="badge-action">
        <button class="apply-btn" @click.stop="$emit('apply', decoration)">
          应用装扮
        </button>
      </div>
      <div v-if="showAction && isApplied" class="badge-action">
        <span class="applied-text">✓ 已应用</span>
      </div>
    </div>

    <div v-if="showAnimation && isUnlocked" class="particle-container">
      <span v-for="i in 8" :key="i" class="particle" :style="getParticleStyle(i)"></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDecorationStore } from '../stores/decorationStore'

const props = defineProps({
  decoration: {
    type: Object,
    required: true
  },
  showAction: {
    type: Boolean,
    default: true
  },
  showAnimation: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click', 'apply'])

const decorationStore = useDecorationStore()

const isUnlocked = computed(() => 
  decorationStore.isDecorationUnlocked(props.decoration.id)
)

const isApplied = computed(() => 
  decorationStore.isDecorationApplied(props.decoration.category, props.decoration.id)
)

const unlockTime = computed(() => 
  decorationStore.decorationUnlockTimes[props.decoration.id]
)

const categoryIcon = computed(() => 
  decorationStore.DECORATION_CATEGORY_INFO[props.decoration.category]?.icon || '🎨'
)

const categoryName = computed(() => 
  decorationStore.DECORATION_CATEGORY_INFO[props.decoration.category]?.name || '装扮'
)

const getRarityInfo = () => {
  return decorationStore.DECORATION_RARITY[props.decoration.rarity.toUpperCase()]
}

const getPreviewStyle = () => {
  const rarity = getRarityInfo()
  if (!isUnlocked.value) {
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

const getBackgroundPreview = () => {
  const preview = props.decoration.preview
  if (!isUnlocked.value) return {}
  return {
    background: preview.value,
    width: '100%',
    height: '100%',
    borderRadius: '8px'
  }
}

const getFramePreview = () => {
  const preview = props.decoration.preview
  if (!isUnlocked.value) return {}
  return {
    border: `3px solid ${preview.color}`,
    borderStyle: getBorderStyle(preview.style),
    width: '100%',
    height: '100%',
    borderRadius: '8px',
    boxSizing: 'border-box'
  }
}

const getBorderStyle = (style) => {
  const styleMap = {
    hearts: 'dotted',
    lace: 'dashed',
    golden: 'double',
    stars: 'dotted',
    floral: 'dashed',
    butterfly: 'dotted',
    infinity: 'double'
  }
  return styleMap[style] || 'solid'
}

const getFontPreview = () => {
  const preview = props.decoration.preview
  if (!isUnlocked.value) return {}
  const style = {
    fontFamily: preview.family,
    color: preview.color,
    fontSize: '1.5rem',
    fontWeight: 'bold'
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
  const preview = props.decoration.preview
  if (!isUnlocked.value) return {}
  return {
    background: preview.background,
    width: '100%',
    height: '100%',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}

const getRarityStyle = () => {
  const rarity = getRarityInfo()
  return {
    background: rarity.bgColor,
    color: rarity.color,
    borderColor: rarity.color
  }
}

const getRarityLabel = () => {
  return getRarityInfo().name
}

const getUnlockHint = () => {
  const condition = props.decoration.unlockCondition
  if (!condition) return '初始装扮'
  return condition.description || '继续探索以解锁'
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
.decoration-badge {
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

.decoration-badge:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.decoration-badge.unlocked {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4, #ffffff);
}

.decoration-badge.applied {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f5f3ff, #ffffff);
}

.decoration-badge.locked {
  opacity: 0.7;
  background: #f9fafb;
}

.decoration-badge.rarity-common.unlocked { border-color: #6b7280; }
.decoration-badge.rarity-rare.unlocked { border-color: #8b5cf6; }
.decoration-badge.rarity-epic.unlocked { border-color: #ec4899; }
.decoration-badge.rarity-legendary.unlocked { 
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7, #fff7ed, #ffffff);
  animation: legendaryGlow 3s ease-in-out infinite;
}

@keyframes legendaryGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.3); }
  50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.5); }
}

.badge-preview-wrapper {
  position: relative;
  flex-shrink: 0;
}

.badge-preview {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  overflow: hidden;
}

.preview-bg {
  width: 100%;
  height: 100%;
}

.preview-frame {
  width: 100%;
  height: 100%;
}

.preview-font {
  font-size: 1.5rem;
  font-weight: bold;
}

.preview-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-icon {
  font-size: 1.8rem;
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
  border-radius: 12px;
}

.lock-icon {
  font-size: 1.2rem;
}

.applied-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
}

.badge-content {
  flex: 1;
  min-width: 0;
}

.badge-category {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.category-icon {
  font-size: 0.85rem;
}

.category-name {
  font-size: 0.7rem;
  color: #9ca3af;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.badge-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.decoration-badge.locked .badge-name {
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

.badge-action {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb;
}

.apply-btn {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.applied-text {
  color: #10b981;
  font-size: 0.85rem;
  font-weight: 600;
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
  .decoration-badge {
    padding: 12px;
    gap: 12px;
  }
  
  .badge-preview {
    width: 50px;
    height: 50px;
  }
  
  .badge-name {
    font-size: 0.9rem;
  }
  
  .badge-description {
    font-size: 0.75rem;
  }
}
</style>
