<template>
  <div class="chapter-select page-container paper-texture">
    <div class="header">
      <h1 class="title text-gradient">文艺手账</h1>
      <p class="subtitle">翻开属于你的故事</p>
    </div>

    <div class="chapters-grid">
      <div
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        class="chapter-card fade-in"
        :style="{ 
          background: chapter.background,
          animationDelay: (index * 0.1) + 's',
          opacity: isChapterUnlocked(chapter.id) ? 1 : 0.5
        }"
        @click="selectChapter(chapter)"
      >
        <div class="washi-tape" :class="getTapeClass(index)"></div>
        <div class="chapter-content">
          <div class="chapter-number handwriting">{{ index + 1 }}</div>
          <h2 class="chapter-title handwriting">{{ chapter.title }}</h2>
          <p class="chapter-subtitle">{{ chapter.subtitle }}</p>
          <p class="chapter-description">{{ chapter.description }}</p>
          
          <div class="chapter-status">
            <span v-if="isChapterCompleted(chapter.id)" class="status-completed">
              ✓ 已完成
            </span>
            <span v-else-if="isChapterUnlocked(chapter.id)" class="status-unlocked">
              点击开始
            </span>
            <span v-else class="status-locked">
              🔒 未解锁
            </span>
          </div>

          <div class="chapter-materials">
            <span class="materials-label">所需素材：</span>
            <span 
              v-for="matId in chapter.requiredMaterials" 
              :key="matId"
              class="material-dot"
              :style="{ background: getMaterialColor(matId) }"
              :title="getMaterialName(matId)"
            ></span>
          </div>

          <div v-if="hasChapterSnapshot(chapter.id)" class="chapter-progress">
            <span class="progress-indicator">📌 有存档点</span>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button v-if="autoSaveData" class="btn btn-primary" @click="handleResumeFromAutoSave">
        ⚡ 继续上次进度
      </button>
      <button class="btn btn-secondary" @click="openLoadModal">
        📂 读取存档
      </button>
      <button class="btn btn-ghost" @click="resetGame">
        🔄 重新开始
      </button>
    </div>

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
        <h3 class="handwriting recovery-title">检测到游戏异常退出</h3>
        <p class="recovery-text" v-if="recoveryData?.autoSave">
          上次游戏可能未正常关闭，是否恢复到 <strong>{{ getRecoveryChapterName }}</strong> 的进度？<br />
          <span class="recovery-time">{{ formatRecoveryTime }}</span>
        </p>
        <div class="recovery-stats" v-if="recoveryData?.autoSave">
          <div class="stat-item">
            <span class="stat-label">情绪值</span>
            <span class="stat-value">💕 {{ recoveryData.autoSave.emotionValue }}</span>
          </div>
        </div>
        <div class="recovery-actions">
          <button class="btn btn-ghost" @click="handleDismissRecovery">
            放弃
          </button>
          <button class="btn btn-primary" @click="handleConfirmRecovery">
            恢复进度
          </button>
        </div>
      </div>
    </div>

    <div v-if="showLoadModal" class="modal-overlay" @click.self="closeLoadModal">
      <div class="modal-content">
        <h3 class="handwriting" style="margin-bottom: 20px; font-size: 1.5rem;">选择存档</h3>
        <div class="save-slots">
          <div 
            v-for="(slot, index) in saveSlots" 
            :key="index"
            class="save-slot"
            :class="{ 'has-save': slot }"
            @click="loadSave(index)"
          >
            <div v-if="slot" class="save-info">
              <div class="save-chapter">{{ getChapterName(slot.currentChapterId) }}</div>
              <div class="save-emotion">情绪值: {{ slot.emotionValue }}</div>
              <div class="save-time">{{ formatDate(slot.timestamp) }}</div>
            </div>
            <div v-else class="save-empty">
              空存档
            </div>
          </div>
        </div>

        <div v-if="autoSaveData" class="autosave-section">
          <div class="autosave-divider"><span>自动存档</span></div>
          <div 
            class="save-slot has-save autosave-slot"
            @click="loadFromAutoSave"
          >
            <div class="save-info">
              <div class="save-chapter">⚡ {{ getChapterName(autoSaveData.currentChapterId) }}</div>
              <div class="save-emotion">情绪值: {{ autoSaveData.emotionValue }}</div>
              <div class="save-time">{{ formatDate(autoSaveData.timestamp) }}</div>
            </div>
          </div>
        </div>

        <button class="btn btn-ghost" style="margin-top: 20px;" @click="closeLoadModal">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const chapters = computed(() => gameStore.chapters)
const saveSlots = computed(() => gameStore.saveSlots)
const showLoadModal = computed(() => gameStore.showLoadModal)
const autoSaveData = computed(() => gameStore.autoSaveData)
const notification = computed(() => gameStore.notification)
const showRecoveryModal = computed(() => gameStore.showRecoveryModal)
const recoveryData = computed(() => gameStore.recoveryData)

const isChapterUnlocked = (chapterId) => {
  return gameStore.unlockedChapters.includes(chapterId)
}

const isChapterCompleted = (chapterId) => {
  return gameStore.completedChapters.includes(chapterId)
}

const hasChapterSnapshot = (chapterId) => {
  return gameStore.hasChapterSnapshot(chapterId)
}

const getMaterialColor = (materialId) => {
  const material = gameStore.getMaterialById(materialId)
  return material ? material.color : '#ccc'
}

const getMaterialName = (materialId) => {
  const material = gameStore.getMaterialById(materialId)
  return material ? material.name : ''
}

const getTapeClass = (index) => {
  const classes = ['', 'washi-tape-purple', 'washi-tape-yellow', 'washi-tape-purple']
  return classes[index % 4]
}

const selectChapter = (chapter) => {
  if (!isChapterUnlocked(chapter.id)) return
  
  gameStore.startChapterWithTracking(chapter.id)
  router.push(`/game/${chapter.id}`)
}

const openLoadModal = () => {
  gameStore.showLoadModal = true
}

const closeLoadModal = () => {
  gameStore.showLoadModal = false
}

const loadSave = (index) => {
  if (gameStore.loadGame(index)) {
    closeLoadModal()
    if (gameStore.currentChapterId) {
      router.push(`/game/${gameStore.currentChapterId}`)
    }
  }
}

const loadFromAutoSave = () => {
  if (gameStore.restoreFromAutoSave()) {
    closeLoadModal()
    if (gameStore.currentChapterId) {
      router.push(`/game/${gameStore.currentChapterId}`)
    }
  }
}

const handleResumeFromAutoSave = () => {
  loadFromAutoSave()
}

const getChapterName = (chapterId) => {
  const chapter = gameStore.getChapterById(chapterId)
  return chapter ? chapter.title : '未知章节'
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

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

const handleConfirmRecovery = () => {
  const restoreTarget = recoveryData.value?.autoSave
  gameStore.confirmRecovery(true)
  if (restoreTarget?.currentChapterId) {
    setTimeout(() => {
      router.push(`/game/${gameStore.currentChapterId}`)
    }, 100)
  }
}

const handleDismissRecovery = () => {
  gameStore.dismissRecovery()
}

const resetGame = () => {
  if (confirm('确定要重新开始吗？所有进度将会重置。')) {
    gameStore.resetGame()
    window.location.reload()
  }
}

onMounted(() => {
  gameStore.checkForCrashRecovery()
  gameStore.isInitialized = true
})
</script>

<style scoped>
.chapter-select {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 0;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.chapter-card {
  position: relative;
  border-radius: 12px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 320px;
  box-shadow: var(--shadow-md);
}

.chapter-card:hover {
  transform: translateY(-8px) rotate(1deg);
  box-shadow: var(--shadow-lg);
}

.chapter-card:nth-child(even):hover {
  transform: translateY(-8px) rotate(-1deg);
}

.chapter-content {
  position: relative;
  z-index: 1;
}

.chapter-number {
  font-size: 3rem;
  color: rgba(0, 0, 0, 0.1);
  position: absolute;
  top: -10px;
  right: 10px;
  font-weight: bold;
}

.chapter-title {
  font-size: 1.8rem;
  color: var(--text-primary);
  margin-bottom: 5px;
}

.chapter-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 15px;
  font-style: italic;
}

.chapter-description {
  font-size: 0.95rem;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 20px;
}

.chapter-status {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.8);
}

.status-completed {
  color: #059669;
}

.status-unlocked {
  color: var(--accent-pink);
}

.status-locked {
  color: var(--text-secondary);
}

.chapter-materials {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.materials-label {
  flex-shrink: 0;
}

.material-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chapter-progress {
  margin-top: 12px;
}

.progress-indicator {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(99, 102, 241, 0.15);
  color: #6366f1;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
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
  transform: translate(-50%, -20px);
}

.recovery-overlay {
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

.recovery-card {
  background: white;
  border-radius: 20px;
  padding: 40px 35px;
  text-align: center;
  max-width: 420px;
  width: 90%;
  box-shadow: var(--shadow-lg);
}

.recovery-icon {
  font-size: 3.5rem;
  margin-bottom: 15px;
}

.recovery-title {
  font-size: 1.6rem;
  color: var(--text-primary);
  margin-bottom: 15px;
}

.recovery-text {
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

.recovery-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.save-slots {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.autosave-section {
  margin-top: 20px;
}

.autosave-divider {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.autosave-divider::before,
.autosave-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.autosave-slot {
  border-color: var(--accent-pink) !important;
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.08), rgba(251, 207, 232, 0.08)) !important;
}

.autosave-slot:hover {
  background: linear-gradient(135deg, rgba(244, 114, 182, 0.15), rgba(251, 207, 232, 0.15)) !important;
}

.save-slot {
  padding: 20px;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.save-slot:hover {
  border-color: var(--accent-pink);
  background: rgba(244, 114, 182, 0.05);
}

.save-slot.has-save {
  border-style: solid;
  background: var(--bg-primary);
}

.save-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.save-chapter {
  font-weight: 600;
  color: var(--text-primary);
}

.save-emotion {
  color: var(--accent-pink);
  font-size: 0.9rem;
}

.save-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.save-empty {
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .chapters-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .header {
    padding: 20px 0;
  }

  .chapter-card {
    min-height: 280px;
  }

  .recovery-card {
    padding: 35px 25px;
  }

  .recovery-icon {
    font-size: 3rem;
  }

  .recovery-title {
    font-size: 1.4rem;
  }

  .recovery-actions {
    flex-direction: column;
  }
}
</style>
