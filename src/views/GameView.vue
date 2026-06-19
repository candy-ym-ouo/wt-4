<template>
  <div 
    class="game-view page-container"
    :class="['emotion-tier-' + currentEmotionTier.id, 'time-' + currentEnvironment.timeOfDay, 'weather-' + currentEnvironment.weather]"
    :style="{ background: currentSceneBackground }"
  >
    <div class="emotion-tint-overlay" :style="{ background: emotionSceneTint }"></div>
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
          class="btn btn-ghost action-btn help-action-btn" 
          @click="openTutorial" 
          title="新手引导"
        >
          ❓
        </button>
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

      <div v-if="currentSceneCombos.length > 0" class="combo-progress-bar">
        <div class="combo-progress-header">
          <span class="combo-progress-title">🎯 本场景组合收集进度</span>
          <span class="combo-progress-count">{{ currentSceneTriggeredCombos.length }} / {{ currentSceneCombos.length }}</span>
        </div>
        <div class="combo-progress-track">
          <div 
            class="combo-progress-fill" 
            :style="{ width: (currentSceneTriggeredCombos.length / currentSceneCombos.length * 100) + '%' }"
          ></div>
        </div>
      </div>

      <div class="canvas-wrapper" :class="[
        { 'scene-shift': sceneBackgroundOverride },
        'time-' + currentEnvironment.timeOfDay,
        'weather-' + currentEnvironment.weather
      ]">
        <Canvas 
          ref="canvasRef"
          :background="currentScene?.background"
          :environment="currentEnvironment"
          @materialPlaced="handleMaterialPlaced"
        />
      </div>

      <DialogueBox 
        :dialogue="currentDialogue"
        :environment="currentEnvironment"
        @next="handleNext"
      />

      <MaterialPanel 
        @select="handleMaterialSelect"
      />

      <div v-if="comboBonusTotal > 0" class="combo-stats-chip">
        <span class="chip-icon">🎁</span>
        <span class="chip-text">组合加成 +{{ comboBonusTotal }} 💕</span>
      </div>
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

    <Transition name="combo-achievement">
      <div v-if="showComboAchievement" class="combo-achievement-overlay">
        <div class="combo-achievement-card">
          <div class="achievement-confetti">
            <span v-for="i in 12" :key="i" class="confetti-piece" :style="getConfettiStyle(i)">🎉</span>
          </div>
          <div class="achievement-badge">
            <span class="achievement-icon">🏆</span>
          </div>
          <div class="achievement-label">组合解锁</div>
          <div class="achievement-name">{{ latestCombo?.name }}</div>
          <div class="achievement-desc">{{ latestCombo?.description }}</div>
          <div class="achievement-rewards">
            <div class="reward-item">
              <span class="reward-icon">💕</span>
              <span class="reward-value">+{{ latestCombo?.emotionBonus }} 情绪加成</span>
            </div>
            <div v-if="latestCombo?.hiddenDialogue" class="reward-item">
              <span class="reward-icon">🔮</span>
              <span class="reward-value">隐藏对白解锁</span>
            </div>
          </div>
          <button class="btn btn-primary achievement-close" @click="closeComboAchievement">
            继续回忆 ✨
          </button>
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
        <p class="complete-text">{{ chapterCompleteMessage }}</p>
        <div class="complete-actions">
          <button v-if="hasNextUnlockedChapter" class="btn btn-primary" @click="goToNextChapter">
            继续冒险 ▸
          </button>
          <button class="btn btn-secondary" @click="viewChapterScore">
            📊 评分明细
          </button>
          <button class="btn btn-ghost" @click="goBack">
            返回章节选择
          </button>
        </div>
      </div>
    </div>

    <TutorialOverlay page="game" @close="handleTutorialClose" />
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
import TutorialOverlay from '../components/TutorialOverlay.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const canvasRef = ref(null)
const showSaveModal = ref(false)
const showLoadModal = ref(false)
const showChapterComplete = ref(false)
const showRollbackConfirm = ref(false)
const showComboAchievement = ref(false)
const latestCombo = ref(null)
const comboQueue = ref([])

const currentChapter = computed(() => gameStore.currentChapter)
const currentScene = computed(() => gameStore.currentScene)
const currentDialogue = computed(() => gameStore.currentDialogue)
const gameCompleted = computed(() => gameStore.gameCompleted)
const notification = computed(() => gameStore.notification)
const showRecoveryModal = computed(() => gameStore.showRecoveryModal)
const recoveryData = computed(() => gameStore.recoveryData)
const lastAutoSaveTime = computed(() => gameStore.lastAutoSaveTime)
const hasChapterSnapshot = computed(() => gameStore.hasChapterSnapshot())
const triggeredCombos = computed(() => gameStore.triggeredCombos)
const currentSceneTriggeredCombos = computed(() => gameStore.currentSceneTriggeredCombos)
const currentSceneCombos = computed(() => gameStore.currentSceneCombos)
const comboBonusTotal = computed(() => gameStore.comboBonusTotal)
const sceneBackgroundOverride = computed(() => gameStore.sceneBackgroundOverride)
const comboJustTriggered = computed(() => gameStore.comboJustTriggered)
const currentEmotionTier = computed(() => gameStore.currentEmotionTier)
const emotionSceneTint = computed(() => gameStore.emotionSceneTint)
const chapterEmotionProgress = computed(() => gameStore.chapterEmotionProgress)
const currentEnvironment = computed(() => gameStore.currentEnvironmentInfo)

const chapterCompleteMessage = computed(() => {
  const newlyUnlocked = gameStore.chapters.filter(c =>
    gameStore.unlockedChapters.includes(c.id) &&
    !gameStore.completedChapters.includes(c.id) &&
    c.id !== currentChapter.value?.id
  )
  if (newlyUnlocked.length > 0) {
    const names = newlyUnlocked.map(c => `「${c.title}」`).join('、')
    return `「${currentChapter.value?.title}」完成！已解锁 ${names}`
  }
  return `「${currentChapter.value?.title}」完成！`
})

const hasNextUnlockedChapter = computed(() => {
  return gameStore.chapters.some(c =>
    gameStore.unlockedChapters.includes(c.id) &&
    !gameStore.completedChapters.includes(c.id)
  )
})

const currentSceneBackground = computed(() => {
  return gameStore.effectiveSceneBackground
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

const handleMaterialPlaced = (data) => {
  console.log('Material placed:', data)
  if (data?.result?.combosTriggered && data.result.combosTriggered.length > 0) {
    data.result.combosTriggered.forEach((combo, idx) => {
      const fullCombo = currentSceneCombos.value.find(c => c.name === combo.name)
      if (fullCombo) {
        setTimeout(() => {
          comboQueue.value.push(fullCombo)
          if (!showComboAchievement.value) {
            showNextComboAchievement()
          }
        }, idx * 500)
      }
    })
  }
}

const showNextComboAchievement = () => {
  if (comboQueue.value.length === 0) return
  latestCombo.value = comboQueue.value.shift()
  showComboAchievement.value = true
}

const closeComboAchievement = () => {
  showComboAchievement.value = false
  setTimeout(() => {
    if (comboQueue.value.length > 0) {
      showNextComboAchievement()
    }
  }, 300)
}

const getConfettiStyle = (i) => {
  const colors = ['#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']
  const left = (i * 8.3) + Math.random() * 5
  const delay = Math.random() * 0.5
  const duration = 1.5 + Math.random() * 1.5
  const color = colors[i % colors.length]
  const size = 16 + Math.random() * 12
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    fontSize: `${size}px`,
    color: color
  }
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

const openTutorial = () => {
  gameStore.showTutorial('game')
}

const handleTutorialClose = () => {
}

const goBack = () => {
  gameStore.autoSave()
  gameStore.goToChapterSelect()
  router.push('/chapter-select')
}

const goToNextChapter = () => {
  showChapterComplete.value = false
  const nextUnlocked = gameStore.chapters.find(c =>
    gameStore.unlockedChapters.includes(c.id) &&
    !gameStore.completedChapters.includes(c.id)
  )
  if (nextUnlocked) {
    gameStore.startChapterWithTracking(nextUnlocked.id)
    router.push(`/game/${nextUnlocked.id}`)
  } else {
    goBack()
  }
}

const viewChapterScore = () => {
  showChapterComplete.value = false
  const chapterId = currentChapter.value?.id
  if (chapterId) {
    gameStore.autoSave()
    router.push(`/chapter-score/${chapterId}`)
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
  position: relative;
}

.emotion-tint-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  transition: background 0.8s ease;
  mix-blend-mode: overlay;
}

.game-header,
.game-content,
.chapter-complete-overlay,
.recovery-overlay,
.rollback-overlay,
.combo-achievement-overlay,
.notification-wrapper {
  position: relative;
  z-index: 2;
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

.help-action-btn {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  color: #7c3aed;
}

.help-action-btn:hover {
  background: linear-gradient(135deg, #e9d5ff, #ddd6fe);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.game-content {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.combo-progress-bar {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: var(--shadow-md);
  border: 1px solid #e9d5ff;
}

.combo-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.combo-progress-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #7c3aed;
}

.combo-progress-count {
  font-size: 0.85rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.combo-progress-track {
  height: 8px;
  background: #f3e8ff;
  border-radius: 4px;
  overflow: hidden;
}

.combo-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ec4899, #8b5cf6, #f59e0b);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: progressGlow 2s ease infinite;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes progressGlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.canvas-wrapper {
  position: relative;
  transition: transform 0.6s ease, filter 0.6s ease;
}

.canvas-wrapper.scene-shift {
  animation: sceneShift 1s ease;
}

@keyframes sceneShift {
  0% { transform: scale(0.98); filter: brightness(0.9); }
  50% { transform: scale(1.02); filter: brightness(1.1); }
  100% { transform: scale(1); filter: brightness(1); }
}

.combo-stats-chip {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: white;
  padding: 10px 18px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.35);
  z-index: 100;
  animation: chipFloat 3s ease-in-out infinite;
}

@keyframes chipFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.chip-icon {
  font-size: 1.1rem;
}

.chip-text {
  font-size: 0.85rem;
  font-weight: 600;
}

.combo-achievement-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(8px);
}

.combo-achievement-card {
  position: relative;
  background: white;
  border-radius: 24px;
  padding: 40px 35px;
  text-align: center;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  border: 3px solid transparent;
  background-image: linear-gradient(white, white), linear-gradient(135deg, #ec4899, #8b5cf6, #f59e0b);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

.achievement-confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -20px;
  animation: confettiFall linear infinite;
}

@keyframes confettiFall {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 0;
  }
  10% { opacity: 1; }
  100% {
    transform: translateY(500px) rotate(720deg);
    opacity: 0;
  }
}

.achievement-badge {
  width: 80px;
  height: 80px;
  margin: 0 auto 15px;
  background: linear-gradient(135deg, #fef3c7, #fce7f3, #ede9fe);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.25);
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); box-shadow: 0 8px 25px rgba(236, 72, 153, 0.25); }
  50% { transform: scale(1.08); box-shadow: 0 12px 35px rgba(139, 92, 246, 0.4); }
}

.achievement-icon {
  font-size: 2.5rem;
  animation: iconBounce 1.5s ease-in-out infinite;
}

@keyframes iconBounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-5px) rotate(10deg); }
}

.achievement-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #8b5cf6;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.achievement-name {
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.achievement-desc {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 20px;
}

.achievement-rewards {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  padding: 8px 16px;
  border-radius: 20px;
}

.reward-icon {
  font-size: 1.1rem;
}

.reward-value {
  font-size: 0.85rem;
  font-weight: 600;
  color: #9d174d;
}

.achievement-close {
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  border: none;
  padding: 12px 32px;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.achievement-close:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
}

.combo-achievement-enter-active {
  animation: achievementIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.combo-achievement-leave-active {
  animation: achievementOut 0.3s ease;
}

@keyframes achievementIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes achievementOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.combo-achievement-enter-active .combo-achievement-card {
  animation: cardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.combo-achievement-leave-active .combo-achievement-card {
  animation: cardOut 0.3s ease forwards;
}

@keyframes cardIn {
  0% {
    transform: scale(0.5) translateY(50px) rotate(-5deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.05) translateY(-10px) rotate(2deg);
  }
  100% {
    transform: scale(1) translateY(0) rotate(0);
    opacity: 1;
  }
}

@keyframes cardOut {
  0% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  100% {
    transform: scale(0.9) translateY(-30px);
    opacity: 0;
  }
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
  white-space: pre-line;
  line-height: 1.6;
  max-width: 90vw;
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

  .combo-stats-chip {
    bottom: 12px;
    right: 12px;
    padding: 8px 14px;
  }

  .chip-text {
    font-size: 0.75rem;
  }

  .combo-achievement-card {
    padding: 30px 22px;
  }

  .achievement-badge {
    width: 64px;
    height: 64px;
  }

  .achievement-icon {
    font-size: 2rem;
  }

  .achievement-name {
    font-size: 1.4rem;
  }

  .achievement-desc {
    font-size: 0.8rem;
  }

  .achievement-rewards {
    gap: 10px;
  }

  .reward-item {
    padding: 6px 12px;
  }

  .reward-value {
    font-size: 0.75rem;
  }
}
</style>
