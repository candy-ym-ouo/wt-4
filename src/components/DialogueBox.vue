<template>
  <div v-if="dialogue" class="dialogue-box fade-in" :class="{ 'hidden-dialogue': isHidden, 'combo-dialogue': isHidden }">
    <div v-if="isHidden" class="hidden-badge">
      <span class="hidden-icon">🔮</span>
      <span class="hidden-label">隐藏对白</span>
    </div>
    <div class="dialogue-header">
      <span class="speaker" :class="speakerClass">{{ dialogue.speaker }}</span>
    </div>
    <div class="dialogue-content">
      <p class="dialogue-text" :class="{ 'hidden-text': isHidden }">{{ displayedText }}</p>
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
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'

const props = defineProps({
  dialogue: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['next'])

const gameStore = useGameStore()
const displayedText = ref('')
const isTyping = ref(false)
const typeInterval = ref(null)

const isWaitingForMaterial = computed(() => gameStore.isWaitingForMaterial)
const isHidden = computed(() => props.dialogue?.isHidden || gameStore.isShowingHiddenDialogue)

const speakerClass = computed(() => {
  if (!props.dialogue) return ''
  const speaker = props.dialogue.speaker
  const classMap = {
    '旁白': 'speaker-narrator',
    '你': 'speaker-you',
    '回忆': 'speaker-memory',
    '内心': 'speaker-inner'
  }
  return classMap[speaker] || ''
})

const typeText = (text) => {
  displayedText.value = ''
  isTyping.value = true
  let index = 0

  if (typeInterval.value) {
    clearInterval(typeInterval.value)
  }

  typeInterval.value = setInterval(() => {
    if (index < text.length) {
      displayedText.value += text[index]
      index++
    } else {
      clearInterval(typeInterval.value)
      isTyping.value = false
    }
  }, isHidden.value ? 65 : 50)
}

const skipTyping = () => {
  if (typeInterval.value) {
    clearInterval(typeInterval.value)
  }
  displayedText.value = props.dialogue?.text || ''
  isTyping.value = false
}

const handleClick = () => {
  if (isTyping.value) {
    skipTyping()
  } else if (!isWaitingForMaterial.value) {
    emit('next')
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

.hidden-icon {
  animation: sparkleRotate 2s linear infinite;
}

@keyframes sparkleRotate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.2) rotate(10deg); }
}

.dialogue-header {
  margin-bottom: 15px;
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

.dialogue-content {
  min-height: 60px;
  margin-bottom: 15px;
}

.dialogue-text {
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--text-primary);
}

.dialogue-text.hidden-text {
  font-style: italic;
  color: #581c87;
  font-weight: 500;
  letter-spacing: 0.3px;
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
}
</style>
