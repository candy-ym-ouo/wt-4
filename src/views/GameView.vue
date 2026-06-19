<template>
  <div 
    class="game-view page-container"
    :style="{ background: currentSceneBackground }"
  >
    <div class="game-header">
      <div class="chapter-info">
        <h2 class="handwriting chapter-title">{{ currentChapter?.title }}</h2>
        <span class="chapter-subtitle">{{ currentChapter?.subtitle }}</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-ghost action-btn" @click="openSaveModal" title="保存">
          💾
        </button>
        <button class="btn btn-ghost action-btn" @click="openLoadModal" title="读取">
          📂
        </button>
        <button class="btn btn-ghost action-btn" @click="goBack" title="返回章节">
          🏠
        </button>
      </div>
    </div>

    <div class="game-content">
      <EmotionMeter />

      <div class="canvas-wrapper">
        <Canvas 
          ref="canvasRef"
          :background="currentScene?.background"
          @materialPlaced="handleMaterialPlaced"
        />
      </div>

      <DialogueBox 
        :dialogue="currentDialogue"
        @next="handleNext"
      />

      <MaterialPanel 
        @select="handleMaterialSelect"
      />
    </div>

    <SaveLoadModal
      :visible="showSaveModal"
      mode="save"
      @close="showSaveModal = false"
      @saved="handleSaved"
    />

    <SaveLoadModal
      :visible="showLoadModal"
      mode="load"
      @close="showLoadModal = false"
      @loaded="handleLoaded"
    />

    <div v-if="showChapterComplete" class="chapter-complete-overlay">
      <div class="chapter-complete-card slide-up">
        <div class="complete-icon float">🎉</div>
        <h2 class="handwriting complete-title">章节完成！</h2>
        <p class="complete-text">{{ currentChapter?.title }} 已解锁新章节</p>
        <div class="complete-actions">
          <button class="btn btn-primary" @click="goToNextChapter">
            继续冒险 ▸
          </button>
          <button class="btn btn-secondary" @click="goBack">
            返回章节选择
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import Canvas from '../components/Canvas.vue'
import DialogueBox from '../components/DialogueBox.vue'
import EmotionMeter from '../components/EmotionMeter.vue'
import MaterialPanel from '../components/MaterialPanel.vue'
import SaveLoadModal from '../components/SaveLoadModal.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const canvasRef = ref(null)
const showSaveModal = ref(false)
const showLoadModal = ref(false)
const showChapterComplete = ref(false)

const currentChapter = computed(() => gameStore.currentChapter)
const currentScene = computed(() => gameStore.currentScene)
const currentDialogue = computed(() => gameStore.currentDialogue)
const gameCompleted = computed(() => gameStore.gameCompleted)

const currentSceneBackground = computed(() => {
  if (currentScene.value?.background) {
    return currentScene.value.background
  }
  return currentChapter.value?.background || 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
})

const handleNext = () => {
  if (gameStore.isWaitingForMaterial) return
  gameStore.nextDialogue()
}

const handleMaterialSelect = (material) => {
  if (canvasRef.value) {
    canvasRef.value.selectMaterial(material)
  }
}

const handleMaterialPlaced = (material) => {
  console.log('Material placed:', material)
}

const openSaveModal = () => {
  showSaveModal.value = true
}

const openLoadModal = () => {
  showLoadModal.value = true
}

const handleSaved = () => {
  console.log('Game saved')
}

const handleLoaded = () => {
  console.log('Game loaded')
  if (gameStore.currentChapterId !== route.params.chapterId) {
    router.push(`/game/${gameStore.currentChapterId}`)
  }
}

const goBack = () => {
  gameStore.goToChapterSelect()
  router.push('/chapter-select')
}

const goToNextChapter = () => {
  showChapterComplete.value = false
  const currentIndex = gameStore.chapters.findIndex(c => c.id === currentChapter.value.id)
  if (currentIndex < gameStore.chapters.length - 1) {
    const nextChapter = gameStore.chapters[currentIndex + 1]
    gameStore.startChapter(nextChapter.id)
    router.push(`/game/${nextChapter.id}`)
  } else {
    goBack()
  }
}

watch(gameCompleted, (completed) => {
  if (completed && gameStore.currentEnding) {
    router.push('/ending')
  }
})

watch(() => gameStore.completedChapters, (completed) => {
  if (completed.includes(currentChapter.value?.id) && !gameCompleted.value) {
    showChapterComplete.value = true
  }
}, { deep: true })

onMounted(() => {
  const chapterId = route.params.chapterId
  if (!gameStore.currentChapterId || gameStore.currentChapterId !== chapterId) {
    if (gameStore.unlockedChapters.includes(chapterId)) {
      gameStore.startChapter(chapterId)
    } else {
      router.push('/chapter-select')
    }
  }
})
</script>

<style scoped>
.game-view {
  min-height: 100vh;
  padding: 20px;
  transition: background 0.5s ease;
}

.game-header {
  max-width: 600px;
  margin: 0 auto 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
}

.chapter-info {
  flex: 1;
}

.chapter-title {
  font-size: 1.8rem;
  color: var(--text-primary);
  margin: 0 0 5px 0;
}

.chapter-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-style: italic;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
}

.action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.game-content {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.canvas-wrapper {
  position: relative;
}

.chapter-complete-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.chapter-complete-card {
  background: white;
  border-radius: 20px;
  padding: 50px 40px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-lg);
}

.complete-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.complete-title {
  font-size: 2rem;
  color: var(--accent-pink);
  margin-bottom: 10px;
}

.complete-text {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 30px;
}

.complete-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .chapter-info {
    order: -1;
  }

  .chapter-title {
    font-size: 1.5rem;
  }

  .game-content {
    gap: 15px;
  }

  .chapter-complete-card {
    padding: 40px 25px;
  }

  .complete-icon {
    font-size: 3rem;
  }

  .complete-title {
    font-size: 1.5rem;
  }
}
</style>
