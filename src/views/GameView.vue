<template>
  <div 
    class="game-view page-container"
    :style="{ background: currentSceneBackground }"
  >
    <div class="game-header">
      <div class="chapter-info">
        <h2 class="handwriting chapter-title">{{ currentChapter?.title }}</h2>
        <span class="chapter-subtitle">{{ currentChapter?.subtitle }}</span>
        <div v-if="lastAutoSaveTime" class="autosave-indicator">
          💾 上次自动保存: {{ formatLastAutoSave }}
        </div>
      </div>
      <div class="header-actions">
        <button 
          class="btn btn-ghost action-btn" 
          @click="handleRollback" 
          title="回滚到章节开头"
          :disabled="!hasChapterSnapshot"
          :class="{ disabled: !hasChapterSnapshot }"
        >
          ⏪
        </button>
        <button class="btn btn-ghost action-btn" @click="handleAutoSave" title="立即自动存档">
          ⚡
        </button>
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

    <Transition name="notification">
      <div v-if="notification" class="notification-wrapper">
        <div class="notification slide-down" :class="'notification-' + notification.type">
          {{ notification.message }}
        </div>
      </div>
    </Transition>

    <div v-if="showRecoveryModal" class="recovery-overlay">
      <div class="recovery-card slide-up">
        <div class="recovery-icon">⚠️</div>
        <h3 class="handwriting recovery-title">检测到未正常退出</h3>
        <p class="recovery-text" v-if="recoveryData?.autoSave">
          是否恢复到 <strong>{{ getRecoveryChapterName }}</strong> 的进度？<br />
          <span class="recovery-time">{{ formatRecoveryTime }}</span>
        </p>
        <div class="recovery-stats" v-if="recoveryData?.autoSave">
          <div class="stat-item">
            <span class="stat-label">情绪值</span>
            <span class="stat-value">💕 {{ recoveryData.autoSave.emotionValue }}</span>
          </div>
        </div>
        <div class="recovery-actions">
          <button class="btn btn-secondary" @click="handleDismissRecovery">
            放弃恢复
          </button>
          <button class="btn btn-primary" @click="handleConfirmRecovery">
            恢复进度
          </button>
        </div>
      </div>
    </div>

    <div v-if="showRollbackConfirm" class="rollback-overlay">
      <div class="rollback-card slide-up">
        <div class="rollback-icon">⏪</div>
        <h3 class="handwriting rollback-title">回滚章节</h3>
        <p class="rollback-text">
          确定要回滚到 <strong>「{{ currentChapter?.title }}」</strong> 的开头吗？<br />
          当前章节内的进度将会丢失。
        </p>
        <div class="rollback-actions">
          <button class="btn btn-ghost" @click="showRollbackConfirm = false">
            取消
          </button>
          <button class="btn btn-primary rollback-btn" @click="confirmRollback">
            确认回滚
          </button>
        </div>
      </div>
    </div>

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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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
const showRollbackConfirm = ref(false)

const currentChapter = computed(() => gameStore.currentChapter)
const currentScene = computed(() => gameStore.currentScene)
const currentDialogue = computed(() => gameStore.currentDialogue)
const gameCompleted = computed(() => gameStore.gameCompleted)
const notification = computed(() => gameStore.notification)
const showRecoveryModal = computed(() => gameStore.showRecoveryModal)
const recoveryData = computed(() => gameStore.recoveryData)
const lastAutoSaveTime = computed(() => gameStore.lastAutoSaveTime)
const hasChapterSnapshot = computed(() => gameStore.hasChapterSnapshot())

const currentSceneBackground = computed(() => {
  if (currentScene.value?.background) {
    return currentScene.value.background
  }
  return currentChapter.value?.background || 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
})

const formatLastAutoSave = computed(() => {
  if (!lastAutoSaveTime.value) return ''
  const date = new Date(lastAutoSaveTime.value)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

const getRecoveryChapterName = computed(() => {
  if (!recoveryData.value?.autoSave?.currentChapterId) return '未知章节'
  const chapter = gameStore.getChapterById(recoveryData.value.autoSave.currentChapterId)
  return chapter ? `「${chapter.title}」` : '未知章节'
})

const formatRecoveryTime = computed(() => {
  if (!recoveryData.value?.autoSave?.timestamp) return ''
  const date = new Date(recoveryData.value.autoSave.timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  gameStore.showNotification('存档已保存', 'success')
}

const handleLoaded = () => {
  gameStore.showNotification('存档已读取', 'success')
  if (gameStore.currentChapterId !== route.params.chapterId) {
    router.push(`/game/${gameStore.currentChapterId}`)
  }
}

const handleAutoSave = () => {
  if (gameStore.autoSave()) {
    gameStore.showNotification('已手动触发自动存档', 'success', 2000)
  }
}

const handleRollback = () => {
  if (!hasChapterSnapshot.value) {
    gameStore.showNotification('当前章节没有存档点可回滚', 'warning')
    return
  }
  showRollbackConfirm.value = true
}

const confirmRollback = () => {
  showRollbackConfirm.value = false
  if (gameStore.rollbackToChapterStart()) {
    if (canvasRef.value) {
      canvasRef.value.resetCanvas()
    }
  }
}

const handleConfirmRecovery = () => {
  const restoreTarget = recoveryData.value?.autoSave
  gameStore.confirmRecovery(true)
  if (restoreTarget?.currentChapterId) {
    setTimeout(() => {
      if (gameStore.currentChapterId !== route.params.chapterId) {
        router.push(`/game/${gameStore.currentChapterId}`)
      }
    }, 100)
  }
}

const handleDismissRecovery = () => {
  gameStore.dismissRecovery()
}

const goBack = () => {
  gameStore.autoSave()
  gameStore.goToChapterSelect()
  router.push('/chapter-select')
}

const goToNextChapter = () => {
  showChapterComplete.value = false
  const currentIndex = gameStore.chapters.findIndex(c => c.id === currentChapter.value.id)
  if (currentIndex < gameStore.chapters.length - 1) {
    const nextChapter = gameStore.chapters[currentIndex + 1]
    gameStore.startChapterWithTracking(nextChapter.id)
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
      const shouldResume = checkShouldResume(chapterId)
      if (shouldResume) {
        gameStore.restoreFromAutoSave()
        if (gameStore.currentChapterId !== chapterId) {
          gameStore.startChapterWithTracking(chapterId)
        } else {
          gameStore.startGameSession()
        }
      } else {
        gameStore.startChapterWithTracking(chapterId)
      }
    } else {
      router.push('/chapter-select')
    }
  } else {
    gameStore.startGameSession()
  }
  gameStore.isInitialized = true
})

const checkShouldResume = (chapterId) => {
  if (!gameStore.autoSaveData) return false
  if (gameStore.autoSaveData.currentChapterId !== chapterId) return false
  const savedSession = localStorage.getItem('journal_game_session')
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession)
      if (session.active && session.currentChapterId === chapterId) {
        const timeSince = Date.now() - (session.lastHeartbeat || 0)
        return timeSince < 3600000
      }
    } catch (e) {
      return false
    }
  }
  return false
}

onUnmounted(() => {
  gameStore.isInitialized = false
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

.autosave-indicator {
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.7;
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

.action-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
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

.notification-wrapper {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  pointer-events: none;
}

.notification {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
}

.notification-info {
  background: rgba(59, 130, 246, 0.95);
  color: white;
}

.notification-success {
  background: rgba(16, 185, 129, 0.95);
  color: white;
}

.notification-warning {
  background: rgba(245, 158, 11, 0.95);
  color: white;
}

.notification-error {
  background: rgba(239, 68, 68, 0.95);
  color: white;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.recovery-overlay,
.rollback-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  backdrop-filter: blur(6px);
}

.recovery-card,
.rollback-card {
  background: white;
  border-radius: 20px;
  padding: 40px 35px;
  text-align: center;
  max-width: 420px;
  width: 90%;
  box-shadow: var(--shadow-lg);
}

.recovery-icon,
.rollback-icon {
  font-size: 3.5rem;
  margin-bottom: 15px;
}

.recovery-title,
.rollback-title {
  font-size: 1.6rem;
  color: var(--text-primary);
  margin-bottom: 15px;
}

.recovery-text,
.rollback-text {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
}

.recovery-time {
  font-size: 0.85rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.recovery-stats {
  margin-bottom: 25px;
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-pink);
}

.recovery-actions,
.rollback-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.rollback-btn {
  background: var(--accent-pink);
}

.rollback-btn:hover {
  background: #ec4899;
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

  .chapter-complete-card,
  .recovery-card,
  .rollback-card {
    padding: 35px 25px;
  }

  .complete-icon,
  .recovery-icon,
  .rollback-icon {
    font-size: 3rem;
  }

  .complete-title,
  .recovery-title,
  .rollback-title {
    font-size: 1.4rem;
  }

  .recovery-actions,
  .rollback-actions {
    flex-direction: column;
  }
}
</style>
