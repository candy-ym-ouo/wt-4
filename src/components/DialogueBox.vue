<template>
  <div v-if="dialogue" class="dialogue-box fade-in">
    <div class="dialogue-header">
      <span class="speaker" :class="speakerClass">{{ dialogue.speaker }}</span>
    </div>
    <div class="dialogue-content">
      <p class="dialogue-text">{{ displayedText }}</p>
      <span v-if="isTyping" class="typing-cursor">|</span>
    </div>
    <div v-if="!isTyping && !isWaitingForMaterial" class="dialogue-footer">
      <span class="hint">点击继续 ▸</span>
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
  }, 50)
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

.speaker-inner {
  background: linear-gradient(135deg, #ede9fe, #c4b5fd);
  color: #5b21b6;
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

.typing-cursor {
  color: var(--accent-pink);
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.dialogue-footer {
  text-align: right;
}

.hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  animation: pulse 1.5s infinite;
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
}
</style>
