<template>
  <div class="chapter-select page-container paper-texture">
    <div class="header">
      <h1 class="title text-gradient">文艺手账</h1>
      <p class="subtitle">翻开属于你的故事</p>
      <button class="help-btn" @click="openTutorial" title="新手引导">
        <span class="help-icon">❓</span>
        <span class="help-text">新手引导</span>
      </button>
      <button class="help-btn achievement-btn" @click="showAchievementPanel = true" title="成就徽章">
        <span class="help-icon">🏆</span>
        <span class="help-text">成就</span>
      </button>

      <div v-if="ngpSummary.currentCycle > 1 || ngpSummary.totalPlaythroughs > 0" class="ngp-header-info slide-down">
        <div class="ngp-cycle-badge">
          <span class="cycle-icon">🔄</span>
          <span class="cycle-text">第 {{ ngpSummary.currentCycle }} 周目</span>
        </div>
        <div class="ngp-stats-row">
          <div class="ngp-stat">
            <span class="ngp-stat-icon">💕</span>
            <span class="ngp-stat-value">+{{ ngpSummary.inheritedEmotion }}</span>
            <span class="ngp-stat-label">继承情绪</span>
          </div>
          <div class="ngp-stat">
            <span class="ngp-stat-icon">🎁</span>
            <span class="ngp-stat-value">{{ ngpSummary.unlockedHiddenMaterials }}/{{ ngpSummary.totalHiddenMaterials }}</span>
            <span class="ngp-stat-label">隐藏素材</span>
          </div>
          <div class="ngp-stat">
            <span class="ngp-stat-icon">🏆</span>
            <span class="ngp-stat-value">{{ ngpSummary.unlockedAchievements }}/{{ ngpSummary.totalAchievements }}</span>
            <span class="ngp-stat-label">成就</span>
          </div>
          <div class="ngp-stat">
            <span class="ngp-stat-icon">🎬</span>
            <span class="ngp-stat-value">{{ ngpSummary.discoveredEndings }}/{{ ngpSummary.totalEndings }}</span>
            <span class="ngp-stat-label">结局</span>
          </div>
        </div>
        <div v-if="ngpSummary.inheritanceRatio > 0" class="ngp-inheritance-info">
          <span class="inheritance-icon">✨</span>
          <span class="inheritance-text">
            本周目情绪继承比例：{{ Math.round(ngpSummary.inheritanceRatio * 100) }}%
            <span v-if="ngpSummary.inheritedEmotion > 0">（已继承 +{{ ngpSummary.inheritedEmotion }} 点）</span>
          </span>
        </div>
      </div>
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
      <button v-if="hasNgpData" class="btn btn-ghost ngp-btn" @click="showNgpStats = !showNgpStats">
        📊 多周目进度
      </button>
      <button class="btn btn-ghost" @click="goToMemoryGallery">
        📚 回忆图鉴
      </button>
      <button class="btn btn-ghost" @click="goToCharacterRelation">
        💕 角色关系
      </button>
      <button class="btn btn-ghost" @click="goToUserProfile">
        📊 成长档案
      </button>
      <button class="btn btn-ghost calendar-btn" @click="goToStoryCalendar">
        📅 剧情日历
      </button>
      <button class="btn btn-ghost decoration-btn" @click="goToDecorationGallery">
        🎨 手账装扮
      </button>
      <button class="btn btn-primary challenge-entry-btn" @click="goToChallengeSelect">
        ⚡ 限时挑战
      </button>
      <button class="btn btn-ghost" @click="goToEditor">
        📝 剧情编辑器
      </button>
      <button class="btn btn-ghost" @click="resetGame">
        🔄 重新开始
      </button>
    </div>

    <div v-if="showNgpStats" class="ngp-stats-modal-overlay" @click.self="showNgpStats = false">
      <div class="ngp-stats-modal slide-up">
        <div class="modal-header">
          <h3 class="handwriting modal-title">🌟 多周目成长</h3>
          <button class="icon-btn" @click="showNgpStats = false">✕</button>
        </div>

        <div class="ngp-overview">
          <div class="overview-grid">
            <div class="overview-card">
              <div class="overview-card-icon">🔄</div>
              <div class="overview-card-value">{{ ngpSummary.currentCycle }}</div>
              <div class="overview-card-label">当前周目</div>
            </div>
            <div class="overview-card">
              <div class="overview-card-icon">🎮</div>
              <div class="overview-card-value">{{ ngpSummary.totalPlaythroughs }}</div>
              <div class="overview-card-label">总通关次数</div>
            </div>
            <div class="overview-card">
              <div class="overview-card-icon">👑</div>
              <div class="overview-card-value">{{ ngpSummary.perfectCycles }}</div>
              <div class="overview-card-label">完美周目</div>
            </div>
            <div class="overview-card">
              <div class="overview-card-icon">✨</div>
              <div class="overview-card-value">{{ Math.round(ngpSummary.inheritanceRatio * 100) }}%</div>
              <div class="overview-card-label">继承比例</div>
            </div>
          </div>
        </div>

        <div class="ngp-section">
          <h4 class="section-subtitle">🏆 跨周目成就</h4>
          <div class="achievements-list">
            <div 
              v-for="ach in gameStore.crossCycleAchievements" 
              :key="ach.id" 
              class="achievement-item"
              :class="{ unlocked: ach.unlocked, locked: !ach.unlocked }"
            >
              <div class="achievement-icon">{{ ach.icon }}</div>
              <div class="achievement-info">
                <div class="achievement-name">{{ ach.name }}</div>
                <div class="achievement-desc">{{ ach.description }}</div>
                <div v-if="ach.unlocked" class="achievement-unlocked-at">
                  解锁于 {{ formatDate(ach.unlockedAt) }}
                </div>
              </div>
              <div v-if="ach.unlocked" class="achievement-status">✓</div>
              <div v-else class="achievement-status locked">🔒</div>
            </div>
          </div>
        </div>

        <div class="ngp-section">
          <h4 class="section-subtitle">🎁 隐藏素材收集</h4>
          <div class="hidden-materials-grid">
            <div 
              v-for="mat in gameStore.hiddenMaterialsRegistry" 
              :key="mat.id" 
              class="hidden-material-item"
              :class="{ unlocked: gameStore.isMaterialUnlocked(mat.id), locked: !gameStore.isMaterialUnlocked(mat.id) }"
            >
              <div class="material-icon" :style="{ background: mat.color }">
                {{ getEmoji(mat.shape) }}
              </div>
              <div class="material-info">
                <div class="material-name">{{ mat.name }}</div>
                <div class="material-desc">{{ mat.description }}</div>
                <div class="material-meta">
                  <span class="rarity-badge" :class="mat.rarity">{{ mat.rarity === 'legendary' ? '传说' : '稀有' }}</span>
                  <span class="emotion-bonus">+{{ mat.emotion }}💕</span>
                </div>
              </div>
              <div v-if="gameStore.isMaterialUnlocked(mat.id)" class="material-status">✓</div>
              <div v-else class="material-status locked">
                <span class="unlock-hint">周目 {{ mat.unlockCycle }}+</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ngp-section">
          <h4 class="section-subtitle">🎬 结局收集</h4>
          <div class="endings-grid">
            <div 
              v-for="ending in gameStore.endings" 
              :key="ending.id" 
              class="ending-collection-item"
              :class="{ discovered: ngpSummary.discoveredEndings > 0 && gameStore.newGamePlus.discoveredEndingIds.includes(ending.id), not_discovered: !gameStore.newGamePlus.discoveredEndingIds.includes(ending.id) }"
            >
              <div class="ending-type-icon">{{ getEndingTypeIcon(ending.type) }}</div>
              <div class="ending-collection-info">
                <div class="ending-collection-title">
                  {{ gameStore.newGamePlus.discoveredEndingIds.includes(ending.id) ? ending.title : '???' }}
                </div>
                <div class="ending-collection-type">{{ getEndingTypeName(ending.type) }}</div>
              </div>
              <div v-if="gameStore.newGamePlus.discoveredEndingIds.includes(ending.id)" class="ending-status">✓</div>
              <div v-else class="ending-status locked">🔒</div>
            </div>
          </div>
        </div>

        <div class="ngp-actions">
          <button 
            v-if="ngpSummary.totalPlaythroughs > 0" 
            class="btn btn-primary btn-block"
            @click="startNewCycle"
          >
            🔄 开启第 {{ ngpSummary.currentCycle + 1 }} 周目
          </button>
          <button 
            v-if="hasNgpData" 
            class="btn btn-ghost btn-block"
            @click="resetAllProgress"
          >
            🗑️ 重置所有多周目数据
          </button>
        </div>
      </div>
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

    <TutorialOverlay page="chapter-select" @close="handleTutorialClose" />

    <AchievementPanel 
      :show-achievement-panel="showAchievementPanel" 
      @close="showAchievementPanel = false" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { useDecorationStore } from '../stores/decorationStore'
import { useProfileStore } from '../stores/profileStore'
import TutorialOverlay from '../components/TutorialOverlay.vue'
import AchievementPanel from '../components/AchievementPanel.vue'

const router = useRouter()
const gameStore = useGameStore()
const decorationStore = useDecorationStore()
const profileStore = useProfileStore()

const showNgpStats = ref(false)
const showAchievementPanel = ref(false)

const chapters = computed(() => gameStore.chapters)
const saveSlots = computed(() => gameStore.saveSlots)
const showLoadModal = computed(() => gameStore.showLoadModal)
const autoSaveData = computed(() => gameStore.autoSaveData)
const notification = computed(() => gameStore.notification)
const showRecoveryModal = computed(() => gameStore.showRecoveryModal)
const recoveryData = computed(() => gameStore.recoveryData)

const ngpSummary = computed(() => gameStore.getNgpSummary())
const hasNgpData = computed(() => 
  ngpSummary.value.currentCycle > 1 || ngpSummary.value.totalPlaythroughs > 0
)

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
  if (!isChapterUnlocked(chapter.id)) {
    const unmet = getUnmetConditions(chapter.id)
    if (unmet.length > 0) {
      const messages = unmet.map((c, i) => `${i + 1}. ${c.description}`).join('\n')
      gameStore.showNotification(
        `章节「${chapter.title}」暂未解锁，还差以下条件：\n${messages}`,
        'warning',
        5000
      )
    } else if (chapter.hidden) {
      gameStore.showNotification(
        chapter.hiddenHint || '这是一个神秘章节，请继续探索...',
        'warning',
        4000
      )
    }
    return
  }
  
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
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN')
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
  if (confirm('确定要重新开始吗？当前进度将被清空（保留多周目数据）。')) {
    gameStore.resetGame(false)
  }
}

const getEmoji = (shape) => {
  const map = {
    heart: '❤️',
    star: '⭐',
    circle: '🔵',
    square: '🔲',
    diamond: '💎',
    triangle: '🔺',
    flower: '🌸',
    leaf: '🍃',
    cloud: '☁️',
    music: '🎵'
  }
  return map[shape] || '🔮'
}

const getEndingTypeIcon = (type) => {
  const map = {
    happy: '😊',
    normal: '😐',
    sad: '😢',
    true: '👑',
    hidden: '🔮',
    bad: '💀'
  }
  return map[type] || '📖'
}

const getEndingTypeName = (type) => {
  const map = {
    happy: '快乐结局',
    normal: '普通结局',
    sad: '悲伤结局',
    true: '真结局',
    hidden: '隐藏结局',
    bad: '坏结局'
  }
  return map[type] || type
}

const startNewCycle = () => {
  if (confirm(`确定要开启第 ${ngpSummary.value.currentCycle + 1} 周目吗？\n\n当前周目数据将被保存为历史，下一周目将继承 ${Math.round(ngpSummary.value.inheritanceRatio * 100)}% 的情绪值。`)) {
    gameStore.startNewCycle()
    showNgpStats.value = false
  }
}

const resetAllProgress = () => {
  if (confirm('确定要重置所有多周目数据吗？\n\n这将清空：\n• 周目计数\n• 成就进度\n• 隐藏素材解锁\n• 结局收集记录\n• 情绪继承配置\n\n此操作不可恢复！')) {
    if (confirm('此操作将永久删除所有多周目进度，确定继续吗？')) {
      localStorage.removeItem('journal_game_ngp')
      localStorage.removeItem('journal_game_hidden_materials')
      localStorage.removeItem('journal_game_cycle_achievements')
      gameStore.resetGame(true)
      showNgpStats.value = false
    }
  }
}

const openTutorial = () => {
  gameStore.showTutorial('chapter-select')
}

const goToEditor = () => {
  router.push('/story-editor')
}

const goToMemoryGallery = () => {
  router.push('/memory-gallery')
}

const goToCharacterRelation = () => {
  router.push('/character-relation')
}

const goToUserProfile = () => {
  router.push('/user-profile')
}

const goToStoryCalendar = () => {
  router.push('/story-calendar')
}

const goToDecorationGallery = () => {
  router.push('/decoration-gallery')
}

const goToChallengeSelect = () => {
  router.push('/challenge-select')
}

onMounted(() => {
  gameStore.checkForCrashRecovery()
  gameStore.isInitialized = true
  decorationStore.initialize()
  decorationStore.checkDecorationUnlockConditions()
  profileStore.initialize()
  
  if (gameStore.shouldShowFirstTimeTutorial()) {
    setTimeout(() => {
      gameStore.showTutorial('chapter-select')
    }, 500)
  }
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
  position: relative;
}

.help-btn {
  position: absolute;
  top: 20px;
  right: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 2px solid #e9d5ff;
  background: linear-gradient(135deg, #faf5ff, #fdf4ff);
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: #7c3aed;
  transition: all 0.3s ease;
  font-family: var(--font-serif);
}

.help-btn:hover {
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.achievement-btn {
  right: 120px;
  border-color: #fcd34d;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  color: #b45309;
}

.achievement-btn:hover {
  background: linear-gradient(135deg, #fef3c7, #fcd34d);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.help-icon {
  font-size: 1rem;
}

.ngp-header-info {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(236, 72, 153, 0.1));
  border-radius: 16px;
  border: 2px solid rgba(251, 191, 36, 0.3);
  animation: slideDown 0.5s ease;
}

.ngp-cycle-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #fbbf24, #f472b6);
  color: white;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 15px;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.cycle-icon {
  font-size: 1.2rem;
}

.ngp-stats-row {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.ngp-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ngp-stat-icon {
  font-size: 1.5rem;
}

.ngp-stat-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #7c3aed;
}

.ngp-stat-label {
  font-size: 0.85rem;
  color: #6b7280;
}

.ngp-inheritance-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  color: #7c3aed;
  font-weight: 500;
}

.ngp-btn {
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  border: 2px solid #fbbf24;
  color: #b45309;
}

.ngp-btn:hover {
  background: linear-gradient(135deg, #fde68a, #fbcfe8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.calendar-btn {
  background: linear-gradient(135deg, #dbeafe, #e0e7ff);
  border: 2px solid #818cf8;
  color: #4338ca;
}

.calendar-btn:hover {
  background: linear-gradient(135deg, #bfdbfe, #c7d2fe);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.ngp-stats-modal-overlay {
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
  padding: 20px;
}

.ngp-stats-modal {
  background: white;
  border-radius: 20px;
  max-width: 700px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 30px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f3f4f6;
}

.modal-title {
  font-size: 1.8rem;
  color: #7c3aed;
  margin: 0;
}

.ngp-overview {
  margin-bottom: 30px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 15px;
}

.overview-card {
  text-align: center;
  padding: 20px 15px;
  background: linear-gradient(135deg, #faf5ff, #fdf4ff);
  border-radius: 16px;
  border: 2px solid #e9d5ff;
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.2);
}

.overview-card-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.overview-card-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #7c3aed;
}

.overview-card-label {
  font-size: 0.85rem;
  color: #6b7280;
}

.ngp-section {
  margin-bottom: 30px;
}

.section-subtitle {
  font-size: 1.2rem;
  color: #1f2937;
  margin-bottom: 15px;
  font-weight: 600;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.achievement-item.unlocked {
  background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
  border-color: #10b981;
}

.achievement-item.locked {
  background: #f9fafb;
  opacity: 0.7;
}

.achievement-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 50%;
  flex-shrink: 0;
}

.achievement-item.unlocked .achievement-icon {
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.achievement-desc {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.achievement-unlocked-at {
  font-size: 0.8rem;
  color: #10b981;
}

.achievement-status {
  font-size: 1.5rem;
  color: #10b981;
  font-weight: bold;
}

.achievement-status.locked {
  color: #d1d5db;
}

.hidden-materials-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hidden-material-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.hidden-material-item.unlocked {
  background: linear-gradient(135deg, #fff7ed, #fff1f2);
  border-color: #f97316;
}

.hidden-material-item.locked {
  background: #f9fafb;
  opacity: 0.7;
}

.material-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.material-info {
  flex: 1;
}

.material-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.material-desc {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 8px;
}

.material-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

.rarity-badge {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
}

.rarity-badge.rare {
  background: #fef3c7;
  color: #b45309;
}

.rarity-badge.legendary {
  background: linear-gradient(135deg, #fbbf24, #f472b6);
  color: white;
}

.emotion-bonus {
  padding: 2px 8px;
  border-radius: 8px;
  background: #fce7f3;
  color: #be185d;
  font-size: 0.75rem;
  font-weight: 600;
}

.material-status {
  font-size: 1.5rem;
  color: #f97316;
  font-weight: bold;
}

.material-status.locked {
  color: #d1d5db;
  font-size: 0.8rem;
}

.unlock-hint {
  font-size: 0.75rem;
  color: #9ca3af;
}

.endings-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ending-collection-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.ending-collection-item.discovered {
  background: linear-gradient(135deg, #f0f9ff, #f0fdfa);
  border-color: #0ea5e9;
}

.ending-collection-item.not_discovered {
  background: #f9fafb;
  opacity: 0.7;
}

.ending-type-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 50%;
  flex-shrink: 0;
}

.ending-collection-item.discovered .ending-type-icon {
  background: linear-gradient(135deg, #dbeafe, #ccfbf1);
}

.ending-collection-info {
  flex: 1;
}

.ending-collection-title {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.ending-collection-type {
  font-size: 0.85rem;
  color: #0ea5e9;
}

.ending-status {
  font-size: 1.5rem;
  color: #0ea5e9;
  font-weight: bold;
}

.ending-status.locked {
  color: #d1d5db;
}

.ngp-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #f3f4f6;
}

.btn-block {
  width: 100%;
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

.challenge-entry-btn {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.challenge-entry-btn:hover {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(251, 191, 36, 0.5);
}

@media (max-width: 768px) {
  .chapters-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .header {
    padding: 20px 0;
  }

  .help-btn {
    top: 10px;
    right: 0;
    padding: 6px 12px;
    font-size: 0.75rem;
  }

  .help-text {
    display: none;
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
