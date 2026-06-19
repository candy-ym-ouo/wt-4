<template>
  <div class="dialogue-wrapper">
    <div v-if="dialogue" class="dialogue-box fade-in" :class="[
      { 'hidden-dialogue': isHidden, 'combo-dialogue': isHidden },
      'emotion-tier-' + emotionTier.id,
      'time-' + environment.timeOfDay,
      'weather-' + environment.weather,
      'ambience-' + environment.ambience
    ]">
      <div v-if="isHidden" class="hidden-badge">
        <span class="hidden-icon">🔮</span>
        <span class="hidden-label">隐藏对白</span>
      </div>
      
      <div class="emotion-tone-badge">
        <span class="tone-icon">{{ emotionTier.icon }}</span>
        <span class="tone-text">{{ environment.dialogueTone || emotionTier.dialogueTone }}语气</span>
      </div>

      <div v-if="environment.ambience !== 'neutral'" class="ambience-badge">
        <span class="ambience-icon">{{ ambienceIcon }}</span>
        <span class="ambience-text">{{ ambienceLabel }}</span>
      </div>
      
      <div class="dialogue-header">
        <span class="speaker" :class="speakerClass">{{ dialogue.speaker }}</span>
        <div class="header-actions">
          <button class="icon-btn" @click.stop="toggleSpeedPanel" title="打字速度">
            <span class="btn-icon">⚡</span>
          </button>
          <button class="icon-btn" @click.stop="toggleHistory" title="历史对白" :class="{ active: showHistory }">
            <span class="btn-icon">📜</span>
            <span v-if="dialogueHistory.length > 0" class="history-badge">{{ dialogueHistory.length }}</span>
          </button>
        </div>
      </div>

      <div v-if="showSpeedPanel" class="speed-panel slide-down" @click.stop>
        <div class="speed-panel-header">
          <span class="speed-label">打字速度</span>
          <span class="speed-value">{{ currentSpeedLabel }}</span>
        </div>
        <div class="speed-presets">
          <button 
            v-for="preset in speedPresets" 
            :key="preset.value"
            class="speed-preset-btn"
            :class="{ active: typingSpeed === preset.value }"
            @click="changeSpeed(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
        <input 
          type="range" 
          :min="10" 
          :max="200" 
          :value="typingSpeed" 
          @input="onSpeedInput"
          class="speed-slider"
        />
        <div class="speed-range-labels">
          <span>慢</span>
          <span>快</span>
        </div>
      </div>

      <div class="dialogue-content">
        <p class="dialogue-text" :class="{ 'hidden-text': isHidden, 'key-line': isKeyLine }">
          <template v-if="isKeyLine">
            <span class="key-line-marker">✨</span>
          </template>
          {{ displayedText }}
          <template v-if="isKeyLine">
            <span class="key-line-marker">✨</span>
          </template>
        </p>
        <span v-if="isTyping" class="typing-cursor" :class="{ 'hidden-cursor': isHidden }">|</span>
      </div>
      <div v-if="isHidden && dialogue.emotionChange" class="hidden-emotion-reward">
        <span class="emotion-sparkle">✨</span>
        <span class="emotion-text">隐藏回忆 +{{ dialogue.emotionChange }} 💕</span>
        <span class="emotion-sparkle">✨</span>
      </div>
      <div v-if="!isTyping && !isWaitingForMaterial" class="dialogue-footer">
        <span class="hint" :class="{ 'hidden-hint': isHidden }">{{ isHidden ? '继续回忆 ▸' : '点击继续 ▸' }}</span>
      </div>
      <div v-if="isWaitingForMaterial" class="dialogue-footer">
        <span class="hint-material">请从下方选择素材放置到画布上</span>
      </div>
    </div>

    <Transition name="history">
      <div v-if="showHistory" class="history-overlay" @click.self="toggleHistory">
        <div class="history-panel slide-up" @click.stop>
          <div class="history-header">
            <h3 class="history-title">📜 历史对白</h3>
            <button class="icon-btn close-btn" @click.stop="toggleHistory" title="关闭">
              <span class="btn-icon">✕</span>
            </button>
          </div>
          <div class="history-list" ref="historyListRef">
            <div v-if="dialogueHistory.length === 0" class="history-empty">
              <span class="empty-icon">📖</span>
              <p>暂无历史对白</p>
              <p class="empty-hint">继续阅读，之前的对话会显示在这里</p>
            </div>
            <div 
              v-for="(item, index) in dialogueHistory" 
              :key="index"
              class="history-item"
              :class="{ 'history-hidden': item.isHidden, 'history-key-line': item.isKeyLine }"
            >
              <div class="history-item-header">
                <span class="history-speaker" :class="getSpeakerClass(item.speaker)">{{ item.speaker }}</span>
                <span v-if="item.isHidden" class="history-tag hidden-tag">🔮 隐藏</span>
                <span v-if="item.isKeyLine" class="history-tag key-tag">✨ 关键</span>
              </div>
              <p class="history-text">{{ item.text }}</p>
            </div>
            <div v-if="dialogue" class="history-item history-current">
              <div class="history-item-header">
                <span class="history-speaker" :class="speakerClass">{{ dialogue.speaker }}</span>
                <span class="history-tag current-tag">当前</span>
                <span v-if="isHidden" class="history-tag hidden-tag">🔮 隐藏</span>
                <span v-if="isKeyLine" class="history-tag key-tag">✨ 关键</span>
              </div>
              <p class="history-text">{{ dialogue.text }}</p>
            </div>
          </div>
          <div class="history-footer">
            <span class="history-count">共 {{ dialogueHistory.length + (dialogue ? 1 : 0) }} 条对白</span>
            <button class="btn btn-ghost scroll-btn" @click="scrollToBottom" v-if="dialogueHistory.length > 5">
              回到底部 ↓
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useGameStore } from '../stores/gameStore'

const props = defineProps({
  dialogue: {
    type: Object,
    default: null
  },
  environment: {
    type: Object,
    default: () => ({
      timeOfDay: 'day',
      weather: 'clear',
      ambience: 'neutral',
      dialogueTone: '平静'
    })
  }
})

const emit = defineEmits(['next'])

const gameStore = useGameStore()
const displayedText = ref('')
const isTyping = ref(false)
const typeInterval = ref(null)
const showHistory = ref(false)
const showSpeedPanel = ref(false)
const historyListRef = ref(null)

const dialogueHistory = computed(() => gameStore.dialogueHistory)
const typingSpeed = computed(() => gameStore.typingSpeed)
const emotionTier = computed(() => gameStore.currentEmotionTier)

const ambienceIcon = computed(() => {
  const iconMap = {
    warm: '☀️',
    romantic: '🌅',
    dreamy: '🌙',
    melancholy: '🌧️',
    serene: '🍃',
    nostalgic: '📖',
    cozy: '🔥'
  }
  return iconMap[props.environment?.ambience] || '✨'
})

const ambienceLabel = computed(() => {
  const labelMap = {
    warm: '温暖',
    romantic: '浪漫',
    dreamy: '梦幻',
    melancholy: '忧伤',
    serene: '宁静',
    nostalgic: '怀旧',
    cozy: '温馨'
  }
  return labelMap[props.environment?.ambience] || ''
})

const speedPresets = [
  { label: '很慢', value: 120 },
  { label: '慢', value: 80 },
  { label: '正常', value: 50 },
  { label: '快', value: 25 },
  { label: '很快', value: 10 }
]

const currentSpeedLabel = computed(() => {
  const preset = speedPresets.find(p => p.value === typingSpeed.value)
  if (preset) return preset.label
  if (typingSpeed.value >= 100) return '很慢'
  if (typingSpeed.value >= 60) return '慢'
  if (typingSpeed.value >= 35) return '正常'
  if (typingSpeed.value >= 15) return '快'
  return '很快'
})

const isWaitingForMaterial = computed(() => gameStore.isWaitingForMaterial)
const isHidden = computed(() => props.dialogue?.isHidden || gameStore.isShowingHiddenDialogue)
const isKeyLine = computed(() => props.dialogue?.isKeyLine || (props.dialogue?.emotionChange && props.dialogue.emotionChange >= 5))

const speakerClass = computed(() => {
  if (!props.dialogue) return ''
  return getSpeakerClass(props.dialogue.speaker)
})

const getSpeakerClass = (speaker) => {
  const classMap = {
    '旁白': 'speaker-narrator',
    '你': 'speaker-you',
    '回忆': 'speaker-memory',
    '内心': 'speaker-inner'
  }
  return classMap[speaker] || ''
}

const typeText = (text) => {
  displayedText.value = ''
  isTyping.value = true
  let index = 0

  if (typeInterval.value) {
    clearInterval(typeInterval.value)
  }

  const speed = isHidden.value ? Math.min(typingSpeed.value + 15, 100) : typingSpeed.value

  typeInterval.value = setInterval(() => {
    if (index < text.length) {
      displayedText.value += text[index]
      index++
    } else {
      clearInterval(typeInterval.value)
      isTyping.value = false
    }
  }, speed)
}

const skipTyping = () => {
  if (typeInterval.value) {
    clearInterval(typeInterval.value)
  }
  displayedText.value = props.dialogue?.text || ''
  isTyping.value = false
}

const handleClick = () => {
  if (showSpeedPanel.value) {
    showSpeedPanel.value = false
    return
  }
  if (isTyping.value) {
    skipTyping()
  } else if (!isWaitingForMaterial.value) {
    emit('next')
  }
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
  if (showHistory.value) {
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const toggleSpeedPanel = () => {
  showSpeedPanel.value = !showSpeedPanel.value
}

const changeSpeed = (speed) => {
  gameStore.setTypingSpeed(speed)
  if (isTyping.value && props.dialogue) {
    const remainingText = props.dialogue.text.substring(displayedText.value.length)
    if (typeInterval.value) {
      clearInterval(typeInterval.value)
    }
    let index = 0
    const actualSpeed = isHidden.value ? Math.min(speed + 15, 100) : speed
    typeInterval.value = setInterval(() => {
      if (index < remainingText.length) {
        displayedText.value += remainingText[index]
        index++
      } else {
        clearInterval(typeInterval.value)
        isTyping.value = false
      }
    }, actualSpeed)
  }
}

const onSpeedInput = (e) => {
  const speed = parseInt(e.target.value)
  gameStore.setTypingSpeed(speed)
}

const scrollToBottom = () => {
  if (historyListRef.value) {
    historyListRef.value.scrollTop = historyListRef.value.scrollHeight
  }
}

watch(() => props.dialogue, (newDialogue) => {
  if (newDialogue && newDialogue.text) {
    typeText(newDialogue.text)
  }
}, { immediate: true })

onMounted(() => {
  window.addEventListener('click', handleClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClick)
  if (typeInterval.value) {
    clearInterval(typeInterval.value)
  }
})
</script>

<style scoped>
.dialogue-wrapper {
  position: relative;
}

.dialogue-box {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 25px;
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  cursor: pointer;
  transition: all 0.4s ease;
}

.dialogue-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--accent-pink), var(--accent-purple));
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  transition: all 0.4s ease;
}

.dialogue-box.hidden-dialogue {
  background: linear-gradient(135deg, #faf5ff 0%, #fdf4ff 50%, #fff7ed 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  animation: hiddenGlow 3s ease-in-out infinite;
  overflow: hidden;
}

.dialogue-box.hidden-dialogue::before {
  background: linear-gradient(90deg, #ec4899, #8b5cf6, #f59e0b, #ec4899);
  background-size: 300% 100%;
  animation: gradientShift 3s ease infinite;
  height: 5px;
}

.dialogue-box.hidden-dialogue::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--border-radius);
  padding: 2px;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.5), rgba(139, 92, 246, 0.5), rgba(245, 158, 11, 0.5));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.7;
  animation: borderGlow 2.5s ease-in-out infinite;
}

@keyframes hiddenGlow {
  0%, 100% {
    box-shadow: 0 10px 40px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(236, 72, 153, 0.1);
  }
  50% {
    box-shadow: 0 10px 50px rgba(236, 72, 153, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.2);
  }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes borderGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.hidden-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: white;
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
  z-index: 10;
  animation: badgeFloat 2s ease-in-out infinite;
}

@keyframes badgeFloat {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-3px); }
}

.emotion-tone-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  font-size: 0.72rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  z-index: 5;
  transition: all 0.3s ease;
}

.emotion-tier-calm .emotion-tone-badge {
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border-color: #9ca3af;
  color: #4b5563;
}

.emotion-tier-warm .emotion-tone-badge {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #fbbf24;
  color: #92400e;
}

.emotion-tier-tender .emotion-tone-badge {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  border-color: #f472b6;
  color: #9d174d;
}

.emotion-tier-heartbeat .emotion-tone-badge {
  background: linear-gradient(135deg, #fecdd3, #fda4af);
  border-color: #fb7185;
  color: #9f1239;
}

.emotion-tier-touching .emotion-tone-badge {
  background: linear-gradient(135deg, #f3e8ff, #c4b5fd);
  border-color: #c084fc;
  color: #6b21a8;
}

.emotion-tier-overflow .emotion-tone-badge {
  background: linear-gradient(135deg, #fef3c7, #fce7f3, #f3e8ff);
  border-color: #fbbf24;
  color: #92400e;
  animation: toneBadgeGlow 2s ease-in-out infinite;
}

@keyframes toneBadgeGlow {
  0%, 100% { box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3); }
  50% { box-shadow: 0 4px 16px rgba(251, 191, 36, 0.6); }
}

.tone-icon {
  font-size: 0.85rem;
}

.tone-text {
  letter-spacing: 0.3px;
}

.ambience-badge {
  position: absolute;
  top: -12px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  font-size: 0.72rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  z-index: 5;
  transition: all 0.3s ease;
}

.ambience-warm .ambience-badge {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #fbbf24;
  color: #92400e;
}

.ambience-romantic .ambience-badge {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
  border-color: #f97316;
  color: #9a3412;
}

.ambience-dreamy .ambience-badge {
  background: linear-gradient(135deg, #c7d2fe, #a5b4fc);
  border-color: #6366f1;
  color: #3730a3;
}

.ambience-melancholy .ambience-badge {
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
  border-color: #6366f1;
  color: #3730a3;
}

.ambience-serene .ambience-badge {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border-color: #22c55e;
  color: #166534;
}

.ambience-nostalgic .ambience-badge {
  background: linear-gradient(135deg, #fef3c7, #fed7aa);
  border-color: #d97706;
  color: #78350f;
}

.ambience-cozy .ambience-badge {
  background: linear-gradient(135deg, #ffedd5, #fed7aa);
  border-color: #ea580c;
  color: #9a3412;
}

.ambience-icon {
  font-size: 0.85rem;
}

.ambience-text {
  letter-spacing: 0.3px;
}

.dialogue-box.time-dusk {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%);
}

.dialogue-box.time-night {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: #e2e8f0;
}

.dialogue-box.time-night .speaker {
  background: rgba(255, 255, 255, 0.1);
}

.dialogue-box.time-night .speaker-narrator {
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
}

.dialogue-box.time-night .speaker-you {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(96, 165, 250, 0.3));
  color: #bfdbfe;
}

.dialogue-box.time-night .speaker-memory {
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.3), rgba(236, 72, 153, 0.3));
  color: #fbcfe8;
}

.dialogue-box.time-night .speaker-inner {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(139, 92, 246, 0.3));
  color: #ddd6fe;
}

.dialogue-box.time-night .dialogue-text {
  color: #e2e8f0;
}

.dialogue-box.time-night .emotion-tier-calm .dialogue-text {
  color: #cbd5e1;
}

.dialogue-box.time-night .emotion-tier-warm .dialogue-text {
  color: #fde68a;
}

.dialogue-box.time-night .emotion-tier-tender .dialogue-text {
  color: #fbcfe8;
}

.dialogue-box.time-night .emotion-tier-heartbeat .dialogue-text {
  color: #fecdd3;
}

.dialogue-box.time-night .emotion-tier-touching .dialogue-text {
  color: #ddd6fe;
}

.dialogue-box.time-night .emotion-tier-overflow .dialogue-text {
  background: linear-gradient(135deg, #fde68a, #fbcfe8, #ddd6fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dialogue-box.time-night .hint {
  color: #94a3b8;
}

.dialogue-box.time-night .typing-cursor {
  color: #f9a8d4;
}

.dialogue-box.weather-rain {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%);
}

.dialogue-box.weather-snow {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
}

.dialogue-box.weather-star {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
  color: #e0e7ff;
}

.dialogue-box.weather-star .dialogue-text {
  color: #e0e7ff;
  text-shadow: 0 0 8px rgba(165, 180, 252, 0.3);
}

.dialogue-box.weather-star .speaker {
  background: rgba(255, 255, 255, 0.08);
}

.dialogue-box.weather-star .speaker-narrator {
  background: rgba(148, 163, 184, 0.15);
  color: #c7d2fe;
}

.dialogue-box.weather-star .speaker-you {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(96, 165, 250, 0.25));
  color: #bfdbfe;
}

.dialogue-box.weather-star .speaker-memory {
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.25), rgba(236, 72, 153, 0.25));
  color: #fbcfe8;
}

.dialogue-box.weather-star .speaker-inner {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(139, 92, 246, 0.25));
  color: #ddd6fe;
}

.dialogue-box.weather-star .hint {
  color: #a5b4fc;
}

.dialogue-box.weather-star .typing-cursor {
  color: #c4b5fd;
}

.dialogue-box.ambience-dreamy .dialogue-text {
  font-style: italic;
  letter-spacing: 0.5px;
}

.dialogue-box.ambience-romantic .dialogue-text {
  letter-spacing: 0.3px;
}

.dialogue-box.ambience-melancholy .dialogue-text {
  font-style: italic;
  opacity: 0.9;
}

.dialogue-box.emotion-tier-calm::before {
  background: linear-gradient(90deg, #9ca3af, #6b7280);
}

.dialogue-box.emotion-tier-warm::before {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.dialogue-box.emotion-tier-tender::before {
  background: linear-gradient(90deg, #f472b6, #ec4899);
}

.dialogue-box.emotion-tier-heartbeat::before {
  background: linear-gradient(90deg, #fb7185, #f43f5e);
}

.dialogue-box.emotion-tier-touching::before {
  background: linear-gradient(90deg, #c084fc, #a855f7);
}

.dialogue-box.emotion-tier-overflow::before {
  background: linear-gradient(90deg, #fbbf24, #ec4899, #a855f7, #fbbf24);
  background-size: 300% 100%;
  animation: gradientShift 2s ease infinite;
  height: 5px;
}

.emotion-tier-calm .dialogue-text {
  color: #4b5563;
}

.emotion-tier-warm .dialogue-text {
  color: #92400e;
}

.emotion-tier-tender .dialogue-text {
  color: #9d174d;
}

.emotion-tier-heartbeat .dialogue-text {
  color: #9f1239;
}

.emotion-tier-touching .dialogue-text {
  color: #6b21a8;
}

.emotion-tier-overflow .dialogue-text {
  background: linear-gradient(135deg, #92400e, #9d174d, #6b21a8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 500;
}

.hidden-icon {
  animation: sparkleRotate 2s linear infinite;
}

@keyframes sparkleRotate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.2) rotate(10deg); }
}

.dialogue-header {
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.speaker {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.speaker-narrator {
  background: #f3f4f6;
  color: var(--text-secondary);
}

.speaker-you {
  background: linear-gradient(135deg, #dbeafe, #93c5fd);
  color: #1e40af;
}

.speaker-memory {
  background: linear-gradient(135deg, #fce7f3, #f9a8d4);
  color: #9d174d;
}

.hidden-dialogue .speaker-memory {
  background: linear-gradient(135deg, #faf5ff, #c4b5fd);
  color: #5b21b6;
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.2);
}

.speaker-inner {
  background: linear-gradient(135deg, #ede9fe, #c4b5fd);
  color: #5b21b6;
}

.hidden-dialogue .speaker-inner {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  color: #9d174d;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.icon-btn:hover {
  background: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.icon-btn.active {
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
}

.icon-btn.active .btn-icon {
  color: white;
}

.btn-icon {
  font-size: 1rem;
}

.history-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--accent-pink);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.speed-panel {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 15px;
  box-shadow: var(--shadow-md);
  border: 1px solid #e9d5ff;
}

.speed-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.speed-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.speed-value {
  font-size: 0.85rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.speed-presets {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.speed-preset-btn {
  flex: 1;
  min-width: 50px;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.speed-preset-btn:hover {
  border-color: var(--accent-pink);
  color: var(--accent-pink);
}

.speed-preset-btn.active {
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  color: white;
  border-color: transparent;
}

.speed-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #f3e8ff;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(236, 72, 153, 0.4);
  transition: transform 0.2s ease;
}

.speed-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.speed-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(236, 72, 153, 0.4);
}

.speed-range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 6px;
}

.dialogue-content {
  min-height: 60px;
  margin-bottom: 15px;
}

.dialogue-text {
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--text-primary);
  margin: 0;
}

.dialogue-text.hidden-text {
  font-style: italic;
  color: #581c87;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.dialogue-text.key-line {
  background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #ede9fe 100%);
  padding: 12px 16px;
  border-radius: 12px;
  border-left: 4px solid var(--accent-pink);
  font-weight: 500;
  margin: 0 -8px;
  position: relative;
}

.key-line-marker {
  display: inline-block;
  animation: keySparkle 1.5s ease-in-out infinite;
  margin: 0 4px;
}

.key-line-marker:first-child {
  animation-delay: 0s;
}

.key-line-marker:last-child {
  animation-delay: 0.75s;
}

@keyframes keySparkle {
  0%, 100% { opacity: 0.6; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.2); }
}

.typing-cursor {
  color: var(--accent-pink);
  animation: blink 0.8s infinite;
}

.typing-cursor.hidden-cursor {
  color: #a855f7;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.hidden-emotion-reward {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #fef3c7, #fce7f3, #ede9fe);
  border-radius: 30px;
  padding: 10px 20px;
  margin: 0 auto 15px;
  width: fit-content;
  animation: rewardPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes rewardPop {
  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
  60% { transform: scale(1.15) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.emotion-sparkle {
  animation: sparkleTwinkle 1.5s ease-in-out infinite;
}

.emotion-sparkle:first-child { animation-delay: 0s; }
.emotion-sparkle:last-child { animation-delay: 0.75s; }

@keyframes sparkleTwinkle {
  0%, 100% { opacity: 0.5; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.3); }
}

.emotion-text {
  font-weight: 600;
  background: linear-gradient(135deg, #b45309, #be185d, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 0.95rem;
}

.dialogue-footer {
  text-align: right;
}

.hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  animation: pulse 1.5s infinite;
}

.hint.hidden-hint {
  color: #7c3aed;
  font-weight: 500;
}

.hint-material {
  font-size: 0.9rem;
  color: var(--accent-pink);
  font-weight: 500;
}

.history-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(6px);
  padding: 20px;
}

.history-panel {
  background: white;
  border-radius: 20px;
  max-width: 560px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.history-header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3e8ff;
  background: linear-gradient(135deg, #faf5ff 0%, #fdf4ff 100%);
}

.history-title {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-primary);
  font-weight: 700;
}

.close-btn:hover {
  background: #fee2e2;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: #f9fafb;
}

.history-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.history-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

.history-empty p {
  margin: 4px 0;
  font-size: 0.95rem;
}

.empty-hint {
  font-size: 0.8rem !important;
  opacity: 0.7;
}

.history-item {
  background: #fafafa;
  border-radius: 12px;
  padding: 12px 16px;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.history-item:hover {
  background: #f5f5f5;
}

.history-item.history-hidden {
  background: linear-gradient(135deg, #faf5ff 0%, #fdf4ff 100%);
  border-left-color: #a855f7;
}

.history-item.history-key-line {
  background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #ede9fe 100%);
  border-left-color: var(--accent-pink);
}

.history-item.history-current {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-left-color: #3b82f6;
}

.history-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.history-speaker {
  display: inline-block;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.history-tag {
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.hidden-tag {
  background: #f3e8ff;
  color: #7c3aed;
}

.key-tag {
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  color: #be185d;
}

.current-tag {
  background: #dbeafe;
  color: #1e40af;
}

.history-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--text-primary);
}

.history-footer {
  padding: 14px 24px;
  border-top: 1px solid #f3e8ff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.history-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.scroll-btn {
  padding: 6px 14px;
  font-size: 0.8rem;
  border-radius: 20px;
}

.history-enter-active,
.history-leave-active {
  transition: opacity 0.3s ease;
}

.history-enter-from,
.history-leave-to {
  opacity: 0;
}

.history-enter-active .history-panel,
.history-leave-active .history-panel {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.history-enter-from .history-panel,
.history-leave-to .history-panel {
  transform: translateY(30px) scale(0.95);
  opacity: 0;
}

.slide-down {
  animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
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

.fade-in {
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@media (max-width: 768px) {
  .dialogue-box {
    padding: 20px;
  }

  .dialogue-text {
    font-size: 1rem;
    line-height: 1.6;
  }

  .hidden-badge {
    padding: 5px 14px;
    font-size: 0.7rem;
  }

  .hidden-emotion-reward {
    padding: 8px 16px;
  }

  .emotion-text {
    font-size: 0.85rem;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
  }

  .btn-icon {
    font-size: 0.9rem;
  }

  .speed-preset-btn {
    font-size: 0.7rem;
    padding: 5px 8px;
    min-width: 44px;
  }

  .history-panel {
    border-radius: 16px;
    max-height: 85vh;
  }

  .history-header {
    padding: 16px 18px;
  }

  .history-list {
    padding: 12px 18px;
  }

  .history-footer {
    padding: 12px 18px;
  }
}
</style>
