<template>
  <Transition name="tutorial">
    <div v-if="showTutorial" class="tutorial-overlay" @click.self="handleOverlayClick">
      <div v-if="highlightElement" class="tutorial-highlight" :style="highlightStyle"></div>
      
      <div class="tutorial-card slide-up" :style="cardStyle">
        <div class="tutorial-icon">{{ currentStep?.icon || '💡' }}</div>
        
        <h3 class="tutorial-title handwriting">{{ currentStep?.title || '新手引导' }}</h3>
        
        <p class="tutorial-content">{{ currentStep?.content }}</p>
        
        <div class="tutorial-progress">
          <span 
            v-for="(_, index) in totalSteps" 
            :key="index"
            class="progress-dot"
            :class="{ active: index === currentStepIndex, completed: index < currentStepIndex }"
            @click="goToStep(index)"
          ></span>
        </div>
        
        <div class="tutorial-actions">
          <button v-if="currentStepIndex > 0" class="btn btn-ghost" @click="prevStep">
            上一步
          </button>
          <button v-else class="btn btn-ghost" @click="skipTutorial">
            跳过引导
          </button>
          
          <button class="btn btn-primary" @click="nextStep">
            {{ isLastStep ? '开始探索 ✨' : '下一步 ▸' }}
          </button>
        </div>
        
        <button v-if="!isLastStep" class="tutorial-close" @click="skipTutorial" title="跳过引导">
          ✕
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../stores/gameStore'

const props = defineProps({
  page: {
    type: String,
    default: 'chapter-select'
  }
})

const emit = defineEmits(['close', 'stepChange'])

const gameStore = useGameStore()

const highlightElement = ref(null)
const highlightStyle = ref({})
const cardStyle = ref({})

const showTutorial = computed(() => gameStore.tutorialState.showTutorial)
const currentStepIndex = computed(() => gameStore.tutorialState.currentStep)
const steps = computed(() => gameStore.getTutorialSteps(props.page))
const totalSteps = computed(() => steps.value.length)
const currentStep = computed(() => gameStore.getCurrentTutorialStep)

const isLastStep = computed(() => currentStepIndex.value >= totalSteps.value - 1)

const updateHighlight = () => {
  if (!currentStep.value?.highlight) {
    highlightElement.value = null
    highlightStyle.value = {}
    cardStyle.value = {}
    return
  }

  nextTick(() => {
    const el = document.querySelector(currentStep.value.highlight)
    if (el) {
      const rect = el.getBoundingClientRect()
      highlightElement.value = el
      highlightStyle.value = {
        top: `${rect.top - 8}px`,
        left: `${rect.left - 8}px`,
        width: `${rect.width + 16}px`,
        height: `${rect.height + 16}px`
      }

      const cardHeight = 320
      const cardWidth = 360
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth

      let top = rect.bottom + 20
      let left = rect.left + rect.width / 2 - cardWidth / 2

      if (top + cardHeight > viewportHeight - 20) {
        top = rect.top - cardHeight - 20
      }

      if (left < 20) left = 20
      if (left + cardWidth > viewportWidth - 20) {
        left = viewportWidth - cardWidth - 20
      }

      if (top < 20) top = 20

      cardStyle.value = {
        top: `${top}px`,
        left: `${left}px`
      }
    } else {
      highlightElement.value = null
      highlightStyle.value = {}
      cardStyle.value = {}
    }
  })
}

const nextStep = () => {
  if (currentStep.value?.id) {
    gameStore.markTutorialStepCompleted(currentStep.value.id)
  }
  gameStore.nextTutorialStep()
  emit('stepChange', currentStepIndex.value)
}

const prevStep = () => {
  gameStore.prevTutorialStep()
  emit('stepChange', currentStepIndex.value)
}

const goToStep = (index) => {
  gameStore.setTutorialStep(index)
  emit('stepChange', index)
}

const skipTutorial = () => {
  gameStore.hideTutorial()
  emit('close')
}

const handleOverlayClick = () => {
}

const handleResize = () => {
  updateHighlight()
}

watch(currentStepIndex, () => {
  updateHighlight()
})

watch(showTutorial, (val) => {
  if (val) {
    nextTick(() => {
      updateHighlight()
    })
  }
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.tutorial-highlight {
  position: fixed;
  border: 3px solid #ec4899;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 30px rgba(236, 72, 153, 0.5);
  pointer-events: none;
  animation: highlightPulse 2s ease-in-out infinite;
  z-index: 10000;
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(236, 72, 153, 0.4);
  }
  50% {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 40px rgba(236, 72, 153, 0.7);
  }
}

.tutorial-card {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 35px 30px 25px;
  text-align: center;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  z-index: 10001;
  border: 2px solid transparent;
  background-image: linear-gradient(white, white), linear-gradient(135deg, #ec4899, #8b5cf6, #f59e0b);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

.tutorial-icon {
  font-size: 3.5rem;
  margin-bottom: 15px;
  animation: iconBounce 2s ease-in-out infinite;
}

@keyframes iconBounce {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

.tutorial-title {
  font-size: 1.6rem;
  color: var(--text-primary);
  margin-bottom: 15px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tutorial-content {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 20px;
  text-align: left;
}

.tutorial-progress {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.progress-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
}

.progress-dot:hover {
  transform: scale(1.2);
}

.progress-dot.active {
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  transform: scale(1.3);
  box-shadow: 0 0 10px rgba(236, 72, 153, 0.5);
}

.progress-dot.completed {
  background: #a855f7;
}

.tutorial-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.tutorial-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.tutorial-close:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: rotate(90deg);
}

.tutorial-enter-active,
.tutorial-leave-active {
  transition: opacity 0.3s ease;
}

.tutorial-enter-from,
.tutorial-leave-to {
  opacity: 0;
}

.tutorial-enter-active .tutorial-card,
.tutorial-leave-active .tutorial-card {
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.tutorial-enter-from .tutorial-card,
.tutorial-leave-to .tutorial-card {
  transform: translateY(30px) scale(0.95);
  opacity: 0;
}

.slide-up {
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
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

@media (max-width: 768px) {
  .tutorial-card {
    padding: 25px 20px 20px;
    max-width: 320px;
  }

  .tutorial-icon {
    font-size: 2.8rem;
  }

  .tutorial-title {
    font-size: 1.3rem;
  }

  .tutorial-content {
    font-size: 0.85rem;
  }

  .tutorial-actions {
    flex-direction: column-reverse;
  }

  .tutorial-actions .btn {
    width: 100%;
  }
}
</style>
