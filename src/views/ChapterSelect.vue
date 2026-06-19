<template>
  <div class="chapter-select page-container paper-texture">
    <div class="header">
      <h1 class="title text-gradient">文艺手账</h1>
      <p class="subtitle">翻开属于你的故事</p>
    </div>

    <div class="chapters-grid">
      <template v-for="(chapter, index) in chapters" :key="chapter.id">
        <div
          v-if="isChapterVisible(chapter.id)"
          class="chapter-card fade-in"
          :class="{
            'chapter-hidden': chapter.hidden && !isChapterUnlocked(chapter.id),
            'chapter-locked': !isChapterUnlocked(chapter.id) && !chapter.hidden
          }"
          :style="{ 
            background: chapter.background,
            animationDelay: (index * 0.1) + 's',
            opacity: isChapterUnlocked(chapter.id) ? 1 : 0.7
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
              <button
                v-if="isChapterCompleted(chapter.id) && hasChapterScoreData(chapter.id)"
                class="score-detail-btn"
                @click.stop="viewScoreDetail(chapter.id)"
              >
                📊 评分明细
              </button>
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

            <div v-if="isChapterCompleted(chapter.id)" class="chapter-completion">
              <div class="completion-header">
                <span class="completion-label">收集进度</span>
                <span class="completion-percent">{{ getChapterCompletion(chapter.id) }}%</span>
              </div>
              <div class="completion-bar">
                <div 
                  class="completion-fill" 
                  :style="{ width: getChapterCompletion(chapter.id) + '%' }"
                ></div>
              </div>
              <div class="completion-stats">
                <span class="stat-badge">
                  ✨ {{ getChapterTriggeredCombos(chapter.id) }}/{{ getChapterTotalCombos(chapter.id) }} 组合
                </span>
                <span class="stat-badge">
                  💬 {{ getChapterTriggeredHiddenDialogues(chapter.id) }}/{{ getChapterTotalHiddenDialogues(chapter.id) }} 隐藏对话
                </span>
              </div>
              <div v-if="getChapterCollectedHint(chapter.id)" class="uncollected-hint">
                <span class="hint-icon">🔍</span>
                <span class="hint-text">
                  还有 {{ getChapterCollectedHint(chapter.id) }} 个隐藏组合等你发现
                </span>
              </div>
              <div v-else class="completed-badge">
                🏆 完美通关
              </div>
            </div>

            <div v-else-if="!isChapterUnlocked(chapter.id)" class="chapter-locked-info">
              <div v-if="chapter.hidden" class="hidden-chapter-hint">
                <div class="hidden-icon">🔮</div>
                <p class="hidden-hint-text">{{ chapter.hiddenHint }}</p>
              </div>
              <div v-if="chapter.teaser && !chapter.hidden" class="chapter-teaser">
                <div class="teaser-icon">❓</div>
                <p class="teaser-text">{{ chapter.teaser }}</p>
              </div>
              <div class="unlock-conditions">
                <div class="conditions-header">
                  <span class="conditions-label">🔓 解锁条件</span>
                  <span class="conditions-progress">{{ getMetConditions(chapter.id).length }}/{{ chapter.unlockConditions?.length || 0 }}</span>
                </div>
                <div class="conditions-list">
                  <div
                    v-for="(condition, ci) in chapter.unlockConditions"
                    :key="ci"
                    class="condition-item"
                    :class="{ 'condition-met': isChapterConditionMet(chapter.id, condition), 'condition-unmet': !isChapterConditionMet(chapter.id, condition) }"
                  >
                    <span class="condition-icon">{{ isChapterConditionMet(chapter.id, condition) ? '✅' : '⬜' }}</span>
                    <span class="condition-text">{{ condition.description }}</span>
                    <div v-if="!isChapterConditionMet(chapter.id, condition) && getConditionProgress(chapter.id, condition) > 0" class="condition-progress-bar">
                      <div class="condition-progress-fill" :style="{ width: (getConditionProgress(chapter.id, condition) * 100) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="chapter.hidden"
          class="chapter-card chapter-mystery fade-in"
          :style="{ animationDelay: (index * 0.1) + 's' }"
        >
          <div class="chapter-content mystery-content">
            <div class="mystery-icon">❓</div>
            <p class="mystery-text">更多章节正在书写中……</p>
          </div>
        </div>
      </template>
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

const hasChapterScoreData = (chapterId) => {
  return !!gameStore.getChapterScoreDetail(chapterId)
}

const getChapterCompletion = (chapterId) => {
  return gameStore.getChapterCompletion(chapterId)
}

const getChapterTotalCombos = (chapterId) => {
  return gameStore.getChapterTotalCombos(chapterId)
}

const getChapterTriggeredCombos = (chapterId) => {
  return gameStore.getChapterTriggeredCombos(chapterId)
}

const getChapterTotalHiddenDialogues = (chapterId) => {
  return gameStore.getChapterTotalHiddenDialogues(chapterId)
}

const getChapterTriggeredHiddenDialogues = (chapterId) => {
  return gameStore.getChapterTriggeredHiddenDialogues(chapterId)
}

const getChapterCollectedHint = (chapterId) => {
  return gameStore.getChapterCollectedHint(chapterId)
}

const isChapterVisible = (chapterId) => {
  return gameStore.isChapterVisible(chapterId)
}

const isChapterConditionMet = (chapterId, condition) => {
  return gameStore.isChapterConditionMet(chapterId, condition)
}

const getMetConditions = (chapterId) => {
  return gameStore.getMetConditions(chapterId)
}

const getUnmetConditions = (chapterId) => {
  return gameStore.getUnmetConditions(chapterId)
}

const getConditionProgress = (chapterId, condition) => {
  return gameStore.getConditionProgress(chapterId, condition)
}

const viewScoreDetail = (chapterId) => {
  router.push(`/chapter-score/${chapterId}`)
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
  min-height: 420px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
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
  flex: 1;
  display: flex;
  flex-direction: column;
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.8);
  flex-wrap: wrap;
}

.score-detail-btn {
  font-size: 0.75rem;
  padding: 3px 10px;
  border: 1px solid var(--accent-purple);
  background: rgba(167, 139, 250, 0.1);
  color: var(--accent-purple);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-serif);
}

.score-detail-btn:hover {
  background: var(--accent-purple);
  color: white;
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

.chapter-completion {
  margin-top: 15px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  backdrop-filter: blur(5px);
}

.completion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.completion-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.completion-percent {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--accent-purple);
}

.completion-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.completion-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-pink), var(--accent-purple));
  border-radius: 4px;
  transition: width 0.5s ease;
}

.completion-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.stat-badge {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(167, 139, 250, 0.15);
  color: var(--accent-purple);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
}

.uncollected-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(245, 158, 11, 0.15);
  border-radius: 8px;
  animation: pulse-hint 2s ease-in-out infinite;
}

@keyframes pulse-hint {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.hint-icon {
  font-size: 0.9rem;
}

.hint-text {
  font-size: 0.75rem;
  color: #d97706;
  font-weight: 500;
}

.completed-badge {
  text-align: center;
  padding: 6px 10px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15));
  color: #059669;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: bold;
}

.chapter-teaser {
  margin-top: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  text-align: center;
  backdrop-filter: blur(5px);
  border: 1px dashed rgba(0, 0, 0, 0.1);
}

.chapter-locked-info {
  margin-top: 12px;
}

.hidden-chapter-hint {
  padding: 15px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(168, 85, 247, 0.12));
  border-radius: 10px;
  text-align: center;
  border: 1px solid rgba(139, 92, 246, 0.2);
  margin-bottom: 12px;
}

.hidden-icon {
  font-size: 2rem;
  margin-bottom: 8px;
  animation: mysteryPulse 3s ease-in-out infinite;
}

@keyframes mysteryPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.hidden-hint-text {
  font-size: 0.9rem;
  color: #7c3aed;
  font-style: italic;
  line-height: 1.5;
}

.unlock-conditions {
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.conditions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.conditions-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.conditions-progress {
  font-size: 0.8rem;
  color: var(--accent-purple);
  font-weight: 600;
  padding: 2px 8px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 10px;
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.82rem;
  transition: background 0.2s ease;
}

.condition-met {
  background: rgba(16, 185, 129, 0.1);
}

.condition-unmet {
  background: rgba(239, 68, 68, 0.06);
}

.condition-icon {
  flex-shrink: 0;
  font-size: 0.9rem;
}

.condition-text {
  flex: 1;
  color: var(--text-primary);
  line-height: 1.4;
}

.condition-met .condition-text {
  color: #059669;
  text-decoration: line-through;
  text-decoration-color: rgba(5, 150, 105, 0.3);
}

.condition-progress-bar {
  width: 60px;
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.condition-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-pink), var(--accent-purple));
  border-radius: 3px;
  transition: width 0.5s ease;
}

.chapter-mystery {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%) !important;
  cursor: default;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(0, 0, 0, 0.1);
}

.chapter-mystery:hover {
  transform: none;
  box-shadow: var(--shadow-md);
}

.mystery-content {
  text-align: center;
  padding: 20px;
}

.mystery-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 12px;
  animation: mysteryFloat 4s ease-in-out infinite;
}

@keyframes mysteryFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.mystery-text {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-style: italic;
  opacity: 0.5;
}

.chapter-card.chapter-hidden {
  border: 1px solid rgba(139, 92, 246, 0.25);
  box-shadow: var(--shadow-md), 0 0 20px rgba(139, 92, 246, 0.1);
}

.chapter-card.chapter-locked {
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.teaser-icon {
  font-size: 2rem;
  margin-bottom: 8px;
  opacity: 0.6;
}

.teaser-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
  line-height: 1.5;
  margin-bottom: 10px;
}

.teaser-unlock-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.7;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  display: inline-block;
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
