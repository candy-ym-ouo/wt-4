<template>
  <div 
    class="ending-view page-container" :style="{ background: ending?.background }">
    <div class="ending-content fade-in">
      <div class="ending-card">
        <div class="washi-tape"></div>
        <div class="washi-tape washi-tape-purple"></div>
        
        <div class="ending-icon">{{ getEndingIcon() }}</div>
        
        <h1 class="title text-gradient handwriting">{{ ending?.title }}</h1>
        <p class="ending-type">{{ getEndingType() }}</p>
        <p class="ending-description">{{ ending?.description }}</p>
        
        <div class="ending-divider">✦ ✦ ✦</div>
        
        <div class="ending-text">
          <p v-for="(paragraph, index) in endingParagraphs" :key="index" class="paragraph">
            {{ paragraph }}
          </p>
        </div>

        <div class="ending-stats">
          <div class="stat-header">
            <span class="score-label">综合评分</span>
            <span class="score-value handwriting">{{ ending?.stats?.finalScore || 0 }}</span>
            <span class="score-max">/ 100</span>
          </div>
          
          <div class="score-bar">
            <div 
              class="score-bar-fill"
              :style="{ width: (ending?.stats?.finalScore || 0) + '%' }"
            ></div>
          </div>

          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-icon">💖</span>
              <span class="stat-label">情绪值</span>
              <span class="stat-value">{{ ending?.stats?.emotionValue || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📖</span>
              <span class="stat-label">完成章节</span>
              <span class="stat-value">{{ ending?.stats?.completedChapters || 0 }}/{{ totalChapters }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">🎨</span>
              <span class="stat-label">放置素材</span>
              <span class="stat-value">{{ ending?.stats?.placedMaterials || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">✨</span>
              <span class="stat-label">完美放置</span>
              <span class="stat-value">{{ ending?.stats?.perfectPlacements || 0 }}</span>
            </div>
            <div v-if="ending?.stats?.positiveBonus > 0" class="stat-item">
              <span class="stat-icon">🌟</span>
              <span class="stat-label">额外加成</span>
              <span class="stat-value">+{{ ending?.stats?.positiveBonus || 0 }}</span>
            </div>
          </div>
        </div>

        <div v-if="ending?.summary" class="section-block summary-section">
          <div class="section-header">
            <span class="section-icon">📋</span>
            <span class="section-title">通关摘要</span>
          </div>

          <div class="performance-badge" :class="'perf-' + ending.summary.performance">
            <span class="perf-grade">{{ ending.summary.performance }}</span>
            <span class="perf-label">{{ ending.summary.performanceLabel }}</span>
          </div>

          <div v-if="ending.summary.highlights.length > 0" class="highlights-row">
            <span 
              v-for="h in ending.summary.highlights" 
              :key="h" 
              class="highlight-tag"
            >🏆 {{ h }}</span>
          </div>

          <div class="summary-metrics">
            <div class="metric-item">
              <span class="metric-value">{{ ending.summary.triggeredCombos }}/{{ ending.summary.totalCombos }}</span>
              <span class="metric-label">组合触发</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ ending.summary.perfectRate }}%</span>
              <span class="metric-label">精准率</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ ending.summary.playTime }}</span>
              <span class="metric-label">对话数</span>
            </div>
          </div>

          <div v-if="ending.summary.chapterScoreSummary.length > 0" class="chapter-summary-list">
            <div 
              v-for="ch in ending.summary.chapterScoreSummary" 
              :key="ch.chapterId" 
              class="chapter-summary-item"
              :class="{ reached: ch.reached, unreached: !ch.reached }"
            >
              <div class="ch-summary-title">{{ ch.title }}</div>
              <div class="ch-summary-stats">
                <span class="ch-emotion">💕 {{ ch.totalEmotion }}/{{ ch.emotionTarget }}</span>
                <span class="ch-combos">🔮 {{ ch.triggeredCombos }}/{{ ch.totalCombos }}</span>
                <span v-if="ch.reached" class="ch-badge ch-reached">✓ 达标</span>
                <span v-else class="ch-badge ch-unreached">未达标</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="ending?.materialReview" class="section-block material-review-section">
          <div class="section-header">
            <span class="section-icon">🎨</span>
            <span class="section-title">关键素材复盘</span>
          </div>

          <div v-if="ending.materialReview.keyMaterials.length > 0" class="key-materials">
            <div class="sub-label">使用过的素材</div>
            <div class="material-chips">
              <div 
                v-for="mat in ending.materialReview.keyMaterials" 
                :key="mat.id" 
                class="material-chip"
                :class="mat.rarity"
              >
                <span class="chip-icon" :style="{ background: mat.color }">{{ getEmoji(mat.shape) }}</span>
                <span class="chip-name">{{ mat.name }}</span>
                <span class="chip-count">×{{ mat.usageCount }}</span>
                <span class="chip-emotion">+{{ mat.emotion }}💕</span>
              </div>
            </div>
          </div>

          <div v-if="ending.materialReview.legendaryFound.length > 0" class="rarity-row">
            <span class="rarity-label legendary-label">传说素材</span>
            <span 
              v-for="mat in ending.materialReview.legendaryFound" 
              :key="mat.id" 
              class="rarity-chip legendary-chip"
            >{{ mat.name }}</span>
          </div>
          <div v-if="ending.materialReview.rareFound.length > 0" class="rarity-row">
            <span class="rarity-label rare-label">稀有素材</span>
            <span 
              v-for="mat in ending.materialReview.rareFound" 
              :key="mat.id" 
              class="rarity-chip rare-chip"
            >{{ mat.name }}</span>
          </div>

          <div class="sub-label">组合复盘</div>
          <div class="combo-review-list">
            <div 
              v-for="combo in ending.materialReview.combos" 
              :key="combo.comboId" 
              class="combo-review-item"
              :class="{ triggered: combo.triggered, missed: !combo.triggered }"
            >
              <div class="combo-review-status">
                <span v-if="combo.triggered" class="status-done">✓</span>
                <span v-else class="status-missed">✗</span>
              </div>
              <div class="combo-review-info">
                <div class="combo-review-name">
                  {{ combo.comboName }}
                  <span v-if="combo.hasHiddenDialogue" class="hidden-mark">💎</span>
                </div>
                <div class="combo-review-mats">
                  {{ combo.materials.join(' + ') }}
                  <span class="combo-review-bonus">+{{ combo.emotionBonus }}💕</span>
                </div>
                <div v-if="combo.triggered && combo.hiddenDialoguePreview" class="combo-review-preview">
                  「{{ combo.hiddenDialoguePreview }}」
                </div>
                <div v-if="!combo.triggered" class="combo-review-hint">
                  {{ combo.description }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="ending?.branchStatus" class="section-block branch-section">
          <div class="section-header">
            <span class="section-icon">🔮</span>
            <span class="section-title">分支达成</span>
          </div>

          <div class="branch-overview">
            <div class="overview-item">
              <span class="overview-value">{{ ending.branchStatus.overallComboRate }}%</span>
              <span class="overview-label">组合完成率</span>
            </div>
            <div class="overview-item">
              <span class="overview-value">{{ ending.branchStatus.overallHiddenRate }}%</span>
              <span class="overview-label">隐藏对话率</span>
            </div>
          </div>

          <div class="branch-list">
            <div 
              v-for="branch in ending.branchStatus.branches" 
              :key="branch.chapterId" 
              class="branch-item"
            >
              <div class="branch-header">
                <span class="branch-title">{{ branch.title }}</span>
                <span class="branch-subtitle">{{ branch.subtitle }}</span>
                <span class="branch-percent" :class="{ complete: branch.completionPercent === 100 }">
                  {{ branch.completionPercent }}%
                </span>
              </div>

              <div class="branch-progress-bar">
                <div 
                  class="branch-progress-fill" 
                  :style="{ width: branch.completionPercent + '%' }"
                  :class="{ complete: branch.completionPercent === 100 }"
                ></div>
              </div>

              <div class="branch-detail">
                <span class="branch-detail-item">
                  🔮 {{ branch.triggeredCombos }}/{{ branch.totalCombos }} 组合
                </span>
                <span class="branch-detail-item">
                  💎 {{ branch.triggeredHidden }}/{{ branch.totalHidden }} 隐藏
                </span>
                <span 
                  v-if="branch.emotionReached !== undefined" 
                  class="branch-detail-item"
                  :class="{ reached: branch.emotionReached }"
                >
                  💕 {{ branch.emotionReached ? '达标' : '未达标' }}
                </span>
              </div>

              <div v-if="branch.missedCombos.length > 0" class="branch-missed">
                <div class="missed-label">未完成：</div>
                <div 
                  v-for="mc in branch.missedCombos" 
                  :key="mc.comboId" 
                  class="missed-item"
                >
                  <span class="missed-name">{{ mc.name }}</span>
                  <span v-if="mc.hasHiddenDialogue" class="missed-hidden">💎</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="ngpSummary.currentCycle > 1 || ngpSummary.totalPlaythroughs > 0 || newlyUnlockedAchievements.length > 0 || newlyUnlockedMaterials.length > 0" class="section-block ngp-section">
          <div class="section-header">
            <span class="section-icon">🔄</span>
            <span class="section-title">多周目成长</span>
          </div>

          <div class="ngp-cycle-info">
            <div class="cycle-badge">
              <span class="cycle-icon">🌟</span>
              <span class="cycle-text">第 {{ ngpSummary.currentCycle }} 周目完成</span>
            </div>
            <div class="cycle-stats">
              <div class="cycle-stat">
                <span class="stat-icon">🎮</span>
                <span class="stat-value">{{ ngpSummary.totalPlaythroughs }}</span>
                <span class="stat-label">总通关</span>
              </div>
              <div class="cycle-stat">
                <span class="stat-icon">👑</span>
                <span class="stat-value">{{ ngpSummary.perfectCycles }}</span>
                <span class="stat-label">完美周目</span>
              </div>
            </div>
          </div>

          <div v-if="ngpSummary.inheritedEmotion > 0 || ngpSummary.nextInheritedEmotion > 0" class="inheritance-card">
            <div class="inheritance-header">
              <span class="inheritance-icon">💕</span>
              <span class="inheritance-title">情绪继承</span>
            </div>
            <div class="inheritance-content">
              <div class="inheritance-detail">
                <span class="inheritance-label">下一周目继承比例</span>
                <span class="inheritance-value">{{ Math.round(ngpSummary.nextInheritanceRatio * 100) }}%</span>
              </div>
              <div class="inheritance-detail">
                <span class="inheritance-label">预计继承情绪值</span>
                <span class="inheritance-value highlight">+{{ ngpSummary.nextInheritedEmotion }}</span>
              </div>
              <div class="inheritance-bar">
                <div 
                  class="inheritance-bar-fill" 
                  :style="{ width: (ngpSummary.nextInheritanceRatio * 100) + '%' }"
                ></div>
              </div>
              <div class="inheritance-note">
                继承比例随周目数递增，最高可达 {{ Math.round(ngpSummary.maxInheritanceRatio * 100) }}%
              </div>
            </div>
          </div>

          <div v-if="newlyUnlockedAchievements.length > 0" class="new-unlocks achievement-unlock-section">
            <div class="unlocks-header">
              <span class="unlocks-icon">🏆</span>
              <span class="unlocks-title">新解锁成就</span>
              <span class="unlocks-count">{{ newlyUnlockedAchievements.length }}个</span>
            </div>
            <TransitionGroup name="achievement-list" tag="div" class="unlocks-list new-achievements-list">
              <div 
                v-for="(ach, index) in newlyUnlockedAchievements" 
                :key="ach.id" 
                class="new-achievement-wrapper"
                :style="{ animationDelay: (index * 0.3) + 's' }"
              >
                <AchievementBadge 
                  :achievement="ach"
                  :show-reward="true"
                  :show-animation="showNewAchievementsAnimation"
                />
              </div>
            </TransitionGroup>
          </div>

          <div class="section-block achievements-overview-section">
            <div class="section-header">
              <span class="section-icon">🏆</span>
              <span class="section-title">成就总览</span>
              <button class="view-all-btn" @click="showAchievementPanel = true">
                查看全部 →
              </button>
            </div>

            <div class="achievement-overview-stats">
              <div class="overview-stat">
                <span class="overview-stat-value">{{ achievementStats.unlocked }}/{{ achievementStats.total }}</span>
                <span class="overview-stat-label">已解锁成就</span>
              </div>
              <div class="overview-stat">
                <span class="overview-stat-value">{{ achievementStats.percent }}%</span>
                <span class="overview-stat-label">完成度</span>
              </div>
              <div class="overview-stat">
                <span class="overview-stat-value">{{ achievementStats.legendaryCount }}</span>
                <span class="overview-stat-label">传说成就</span>
              </div>
            </div>

            <div v-if="allUnlockedAchievements.length > 0" class="achievement-preview">
              <div class="preview-label">已解锁成就展示</div>
              <div class="preview-grid">
                <div 
                  v-for="ach in allUnlockedAchievements.slice(0, 4)" 
                  :key="ach.id"
                  class="mini-achievement"
                  :class="`rarity-${ach.rarity}`"
                  :title="ach.name"
                >
                  <span class="mini-icon">{{ ach.icon }}</span>
                </div>
                <div 
                  v-if="allUnlockedAchievements.length > 4" 
                  class="mini-achievement more"
                  @click="showAchievementPanel = true"
                >
                  <span class="more-count">+{{ allUnlockedAchievements.length - 4 }}</span>
                </div>
              </div>
            </div>

            <div v-else class="no-achievements-hint">
              <span class="hint-icon">🔍</span>
              <span class="hint-text">还没有解锁任何成就，继续探索吧！</span>
            </div>
          </div>

          <div v-if="newlyUnlockedMaterials.length > 0" class="new-unlocks">
            <div class="unlocks-header">
              <span class="unlocks-icon">🎁</span>
              <span class="unlocks-title">新解锁隐藏素材</span>
            </div>
            <div class="unlocks-list">
              <div 
                v-for="mat in newlyUnlockedMaterials" 
                :key="mat.id" 
                class="unlock-item material-unlock"
              >
                <span class="unlock-item-icon" :style="{ background: mat.color }">{{ getEmoji(mat.shape) }}</span>
                <div class="unlock-item-info">
                  <span class="unlock-item-name">{{ mat.name }}</span>
                  <span class="unlock-item-desc">{{ mat.description }}</span>
                </div>
                <div class="unlock-item-reward">
                  <span class="rarity-tag" :class="mat.rarity">{{ mat.rarity === 'legendary' ? '传说' : '稀有' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="isPerfectCycle" class="perfect-cycle-banner">
            <span class="perfect-icon">👑</span>
            <span class="perfect-text">完美周目达成！继承比例额外提升</span>
          </div>

          <div v-if="ngpNextGoals.length > 0" class="ngp-goals">
            <div class="goals-header">
              <span class="goals-icon">🎯</span>
              <span class="goals-title">下一周目目标</span>
            </div>
            <div class="ngp-goals-list">
              <div 
                v-for="(goal, idx) in ngpNextGoals" 
                :key="idx" 
                class="ngp-goal-item"
              >
                <span class="goal-check">{{ goal.completed ? '✓' : '○' }}</span>
                <span class="goal-text">{{ goal.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="ending?.nextGoals && ending.nextGoals.length > 0" class="section-block goals-section">
          <div class="section-header">
            <span class="section-icon">🎯</span>
            <span class="section-title">本周目改进目标</span>
          </div>

          <div class="goals-list">
            <div 
              v-for="(goal, idx) in ending.nextGoals" 
              :key="idx" 
              class="goal-item"
              :class="'goal-' + goal.type"
            >
              <div class="goal-icon">{{ goal.icon }}</div>
              <div class="goal-info">
                <div class="goal-title">{{ goal.title }}</div>
                <div class="goal-desc">{{ goal.description }}</div>
              </div>
              <button 
                v-if="goal.target" 
                class="goal-action-btn"
                @click="goToTarget(goal)"
              >前往</button>
            </div>
          </div>
        </div>

        <div class="ending-actions">
          <button class="btn btn-primary share-story-btn" @click="generateAndShareStory">
            📖 生成我的故事页
          </button>
          <button v-if="ngpSummary.totalPlaythroughs > 0" class="btn btn-primary ngp-btn" @click="startNewCycle">
            🔄 开启第 {{ ngpSummary.currentCycle + 1 }} 周目
          </button>
          <button class="btn btn-secondary" @click="playAgain">
            🔁 重新开始本周目
          </button>
          <button class="btn btn-ghost" @click="goToChapters">
            📖 章节选择
          </button>
        </div>
      </div>
    </div>

    <AchievementPanel 
      :show-achievement-panel="showAchievementPanel" 
      @close="showAchievementPanel = false" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import { useAudioStore } from '../stores/audioStore'
import AchievementBadge from '../components/AchievementBadge.vue'
import AchievementPanel from '../components/AchievementPanel.vue'
import { encodeShareData } from '../utils/shareCodec'

const router = useRouter()
const gameStore = useGameStore()
const audioStore = useAudioStore()

const ending = computed(() => gameStore.currentEnding)
const totalChapters = computed(() => gameStore.chapters.length)
const ngpSummary = computed(() => gameStore.getNgpSummary())
const showAchievementPanel = ref(false)
const showNewAchievementsAnimation = ref(false)

const endingParagraphs = computed(() => {
  if (ending.value?.content) {
    return ending.value.content.split('\n\n').filter(p => p.trim())
  }
  return []
})

const isPerfectCycle = computed(() => {
  const stats = ending.value?.stats
  if (!stats) return false
  return stats.finalScore >= 90 && 
         stats.emotionValue >= 80 && 
         stats.perfectPlacements >= stats.placedMaterials * 0.8
})

const newlyUnlockedAchievements = computed(() => {
  return gameStore.newlyUnlockedAchievements || []
})

const achievementStats = computed(() => {
  return gameStore.getAchievementStats()
})

const allUnlockedAchievements = computed(() => {
  return gameStore.crossCycleAchievements.filter(a => a.unlocked)
})

onMounted(() => {
  if (newlyUnlockedAchievements.value.length > 0) {
    setTimeout(() => {
      showNewAchievementsAnimation.value = true
    }, 1000)
  }
})

const newlyUnlockedMaterials = computed(() => {
  const unlockedIds = gameStore.newGamePlus.unlockedHiddenMaterialIds
  const unlockTimes = gameStore.newGamePlus.hiddenMaterialUnlockTimes || {}
  return gameStore.hiddenMaterialsRegistry.filter(
    mat => unlockedIds.includes(mat.id) && 
    unlockTimes[mat.id] && Date.now() - unlockTimes[mat.id] < 120000
  )
})

const ngpNextGoals = computed(() => {
  return gameStore.generateNgpNextGoals()
})

const getEndingIcon = () => {
  if (!ending.value) return '✨'
  const icons = {
    good: '💖',
    normal: '📖',
    special: '🌸',
    time_sequence: '⏰',
    perfect_path: '👑',
    dialogue_master: '💬',
    true: '💎',
    ngp_special: '🔄',
    ngp_perfect: '🌟',
    eternal: '♾️'
  }
  return icons[ending.value.type] || '✨'
}

const getEndingType = () => {
  if (!ending.value) return ''
  const types = {
    good: '💕 好结局',
    normal: '📝 普通结局',
    special: '✨ 隐藏结局',
    time_sequence: '⏰ 时序结局',
    perfect_path: '👑 完美结局',
    dialogue_master: '💬 心语结局',
    true: '💎 真结局',
    ngp_special: '🔄 多周目结局',
    ngp_perfect: '🌟 多周目完美结局',
    eternal: '♾️ 永恒结局'
  }
  return types[ending.value.type] || ''
}

const getEmoji = (shape) => {
  const emojiMap = {
    flower: '🌸',
    butterfly: '🦋',
    rectangle: '📄',
    circle: '☀️',
    cicada: '🦗',
    book: '📖',
    leaf: '🍂',
    cup: '☕',
    snowflake: '❄️',
    scarf: '🧣',
    heart: '💖',
    cloud: '☁️',
    star: '⭐',
    note: '🎵'
  }
  return emojiMap[shape] || '✨'
}

const playAgain = () => {
  if (confirm('确定要重新开始本周目吗？当前进度将被清空（保留多周目数据）。')) {
    gameStore.resetGame(false)
    router.push('/chapter-select')
  }
}

const startNewCycle = () => {
  if (confirm(`确定要开启第 ${ngpSummary.value.currentCycle + 1} 周目吗？\n\n下一周目将继承 ${Math.round(ngpSummary.value.nextInheritanceRatio * 100)}% 的情绪值（预计 +${ngpSummary.value.nextInheritedEmotion} 点）。`)) {
    gameStore.startNewCycle()
    router.push('/chapter-select')
  }
}

const goToChapters = () => {
  gameStore.goToChapterSelect()
  router.push('/chapter-select')
}

const goToTarget = (goal) => {
  if (goal.type === 'chapter' && goal.target) {
    gameStore.goToChapterSelect()
    router.push('/chapter-select')
  } else {
    gameStore.goToChapterSelect()
    router.push('/chapter-select')
  }
}

const generateAndShareStory = () => {
  if (ending.value) {
    const shareData = gameStore.generateShareStoryData(
      ending.value,
      ending.value.stats?.finalScore || 0,
      ending.value.stats?.completedChapters || 0,
      ending.value.summary?.perfectRate || 0
    )
    
    if (shareData && shareData.shareId) {
      localStorage.setItem(`share_story_${shareData.shareId}`, JSON.stringify(shareData))
    }
    
    const encoded = encodeShareData(shareData)
    if (encoded) {
      router.push({ path: '/share-story', query: { d: encoded } })
    } else {
      router.push('/share-story')
    }
  }
}

onMounted(() => {
  if (!ending.value) {
    router.push('/chapter-select')
    return
  }
  
  if (ending.value?.id) {
    audioStore.initAudio()
    audioStore.playEndingAudio(ending.value.id)
  }
})

onUnmounted(() => {
  if (audioStore.isInitialized) {
    audioStore.fadeOutMusic(1500)
    audioStore.fadeOutAmbient(1500)
  }
})
</script>

<style scoped>
.ending-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.ending-content {
  max-width: 620px;
  width: 100%;
}

.ending-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 50px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.ending-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

.ending-type {
  font-size: 1.1rem;
  color: var(--accent-pink);
  font-weight: 500;
  margin-bottom: 15px;
}

.ending-description {
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 30px;
}

.ending-divider {
  font-size: 1rem;
  color: var(--accent-purple);
  margin: 30px 0;
  letter-spacing: 8px;
  opacity: 0.6;
}

.ending-text {
  text-align: left;
  margin-bottom: 40px;
}

.paragraph {
  font-size: 1.05rem;
  line-height: 2;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-indent: 2em;
}

.ending-stats {
  margin-bottom: 40px;
  padding: 25px;
  background: var(--bg-primary);
  border-radius: 16px;
}

.stat-header {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
}

.score-label {
  font-size: 1rem;
  color: var(--text-secondary);
}

.score-value {
  font-size: 3rem;
  color: var(--accent-pink);
  line-height: 1;
}

.score-max {
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.score-bar {
  width: 100%;
  height: 10px;
  background: rgba(244, 114, 182, 0.15);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 20px;
}

.score-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f472b6, #a78bfa, #fbbf24);
  border-radius: 5px;
  transition: width 1s ease-out;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
}

.stat-icon {
  font-size: 1.4rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 1.3rem;
  color: var(--accent-pink);
  font-weight: 600;
}

.section-block {
  margin-bottom: 28px;
  padding: 22px;
  border-radius: 16px;
  text-align: left;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.section-icon {
  font-size: 1.3rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-section {
  background: linear-gradient(135deg, #fefce8, #fef9c3);
  border: 1px solid #fde047;
}

.performance-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  border-radius: 14px;
  margin-bottom: 14px;
}

.perf-S {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid #f59e0b;
}

.perf-A {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border: 2px solid #22c55e;
}

.perf-B {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  border: 2px solid #3b82f6;
}

.perf-C {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid #eab308;
}

.perf-D {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  border: 2px solid #ef4444;
}

.perf-grade {
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
}

.perf-S .perf-grade { color: #d97706; }
.perf-A .perf-grade { color: #16a34a; }
.perf-B .perf-grade { color: #2563eb; }
.perf-C .perf-grade { color: #ca8a04; }
.perf-D .perf-grade { color: #dc2626; }

.perf-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.highlights-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.highlight-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.7);
  color: #92400e;
  border: 1px solid #fcd34d;
}

.summary-metrics {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-item {
  flex: 1;
  text-align: center;
  padding: 10px 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
}

.metric-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-pink);
}

.metric-label {
  display: block;
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.chapter-summary-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chapter-summary-item {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-left: 4px solid #e5e7eb;
}

.chapter-summary-item.reached {
  border-left-color: #10b981;
}

.chapter-summary-item.unreached {
  border-left-color: #f59e0b;
}

.ch-summary-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.ch-summary-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.ch-badge {
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
}

.ch-reached {
  background: #dcfce7;
  color: #16a34a;
}

.ch-unreached {
  background: #fef3c7;
  color: #ca8a04;
}

.material-review-section {
  background: linear-gradient(135deg, #faf5ff, #f3e8ff);
  border: 1px solid #ddd6fe;
}

.sub-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #7c3aed;
  margin-bottom: 8px;
  margin-top: 4px;
}

.key-materials {
  margin-bottom: 14px;
}

.material-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.material-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid #e9d5ff;
  font-size: 0.78rem;
}

.material-chip.legendary {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #ffffff);
}

.material-chip.rare {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #faf5ff, #ffffff);
}

.chip-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.chip-name {
  font-weight: 600;
  color: var(--text-primary);
}

.chip-count {
  color: #7c3aed;
  font-weight: 600;
}

.chip-emotion {
  color: var(--accent-pink);
  font-size: 0.7rem;
}

.rarity-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.rarity-label {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 8px;
}

.legendary-label {
  background: #fef3c7;
  color: #d97706;
}

.rare-label {
  background: #ede9fe;
  color: #7c3aed;
}

.rarity-chip {
  font-size: 0.78rem;
  padding: 2px 10px;
  border-radius: 8px;
}

.legendary-chip {
  background: #fffbeb;
  border: 1px solid #f59e0b;
  color: #b45309;
}

.rare-chip {
  background: #faf5ff;
  border: 1px solid #8b5cf6;
  color: #6d28d9;
}

.combo-review-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.combo-review-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-left: 4px solid #e5e7eb;
}

.combo-review-item.triggered {
  border-left-color: #10b981;
}

.combo-review-item.missed {
  border-left-color: #f59e0b;
}

.combo-review-status {
  flex-shrink: 0;
  font-size: 1rem;
  padding-top: 2px;
}

.status-done {
  color: #10b981;
  font-weight: 700;
}

.status-missed {
  color: #f59e0b;
  font-weight: 700;
}

.combo-review-info {
  flex: 1;
  min-width: 0;
}

.combo-review-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.hidden-mark {
  font-size: 0.75rem;
}

.combo-review-mats {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.combo-review-bonus {
  color: var(--accent-pink);
  font-weight: 600;
  margin-left: 6px;
}

.combo-review-preview {
  font-size: 0.75rem;
  color: #7c3aed;
  font-style: italic;
  margin-top: 4px;
  background: rgba(139, 92, 246, 0.08);
  padding: 4px 8px;
  border-radius: 6px;
}

.combo-review-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 4px;
}

.branch-section {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border: 1px solid #bfdbfe;
}

.branch-overview {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.overview-item {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
}

.overview-value {
  display: block;
  font-size: 1.4rem;
  font-weight: 700;
  color: #2563eb;
}

.overview-label {
  display: block;
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.branch-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.branch-item {
  padding: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
}

.branch-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.branch-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
}

.branch-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.branch-percent {
  margin-left: auto;
  font-size: 0.88rem;
  font-weight: 700;
  color: #3b82f6;
}

.branch-percent.complete {
  color: #10b981;
}

.branch-progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.branch-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
  border-radius: 3px;
  transition: width 0.8s ease-out;
}

.branch-progress-fill.complete {
  background: linear-gradient(90deg, #34d399, #10b981);
}

.branch-detail {
  display: flex;
  gap: 12px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.branch-detail-item.reached {
  color: #10b981;
  font-weight: 600;
}

.branch-missed {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px dashed #e5e7eb;
}

.missed-label {
  font-size: 0.72rem;
  color: #9ca3af;
  font-weight: 600;
}

.missed-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 8px;
  background: #fef3c7;
  color: #92400e;
}

.missed-hidden {
  font-size: 0.65rem;
}

.goals-section {
  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
  border: 1px solid #fbcfe8;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-left: 4px solid var(--accent-pink);
}

.goal-item.goal-chapter {
  border-left-color: #3b82f6;
}

.goal-item.goal-score {
  border-left-color: #f59e0b;
}

.goal-item.goal-combo {
  border-left-color: #8b5cf6;
}

.goal-item.goal-hidden {
  border-left-color: #ec4899;
}

.goal-item.goal-completionist {
  border-left-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb, rgba(255, 255, 255, 0.6));
}

.goal-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.goal-info {
  flex: 1;
  min-width: 0;
}

.goal-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.goal-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.goal-action-btn {
  flex-shrink: 0;
  padding: 6px 16px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #f472b6, #ec4899);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.goal-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(244, 114, 182, 0.3);
}

.ending-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.share-story-btn {
  background: linear-gradient(135deg, #8b5cf6, #ec4899) !important;
  border: none !important;
  animation: rainbowPulse 3s ease-in-out infinite;
}

@keyframes rainbowPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
  50% { box-shadow: 0 0 20px 5px rgba(236, 72, 153, 0.3); }
}

.ngp-btn {
  background: linear-gradient(135deg, #fbbf24, #f472b6) !important;
  border: none !important;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
}

.ngp-section {
  background: linear-gradient(135deg, #fffbeb, #fdf2f8);
  border: 2px solid #fbbf24;
}

.ngp-cycle-info {
  text-align: center;
  margin-bottom: 20px;
}

.cycle-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #fbbf24, #f472b6);
  color: white;
  border-radius: 24px;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 15px;
  box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
}

.cycle-icon {
  font-size: 1.4rem;
}

.cycle-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.cycle-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.cycle-stat .stat-icon {
  font-size: 1.3rem;
}

.cycle-stat .stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #7c3aed;
}

.cycle-stat .stat-label {
  font-size: 0.85rem;
  color: #6b7280;
}

.inheritance-card {
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  border: 2px solid #fcd34d;
}

.inheritance-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.inheritance-icon {
  font-size: 1.5rem;
}

.inheritance-title {
  font-weight: bold;
  color: #b45309;
  font-size: 1.1rem;
}

.inheritance-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inheritance-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inheritance-label {
  color: #78350f;
  font-weight: 500;
}

.inheritance-value {
  font-weight: bold;
  color: #92400e;
  font-size: 1.3rem;
}

.inheritance-value.highlight {
  color: #be185d;
  font-size: 1.5rem;
}

.inheritance-bar {
  height: 10px;
  background: rgba(251, 191, 36, 0.2);
  border-radius: 5px;
  overflow: hidden;
}

.inheritance-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f472b6);
  border-radius: 5px;
  transition: width 1s ease-out;
}

.inheritance-note {
  font-size: 0.85rem;
  color: #92400e;
  text-align: center;
  font-style: italic;
}

.new-unlocks {
  margin-bottom: 20px;
}

.unlocks-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.unlocks-icon {
  font-size: 1.3rem;
}

.unlocks-title {
  font-weight: bold;
  color: #1f2937;
}

.unlocks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.unlock-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.unlock-item.achievement-unlock {
  border-left: 4px solid #10b981;
}

.unlock-item.material-unlock {
  border-left: 4px solid #f97316;
}

.unlock-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: #f3f4f6;
  flex-shrink: 0;
}

.unlock-item-info {
  flex: 1;
  min-width: 0;
}

.unlock-item-name {
  display: block;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.unlock-item-desc {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
}

.unlock-item-reward {
  flex-shrink: 0;
  font-weight: 600;
  color: #7c3aed;
}

.rarity-tag {
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.rarity-tag.rare {
  background: #ede9fe;
  color: #6d28d9;
}

.rarity-tag.legendary {
  background: linear-gradient(135deg, #fbbf24, #f472b6);
  color: white;
}

.perfect-cycle-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  border: 2px solid #fbbf24;
  border-radius: 12px;
  margin-bottom: 20px;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(251, 191, 36, 0.5); }
  50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.8); }
}

.perfect-icon {
  font-size: 1.5rem;
}

.perfect-text {
  font-weight: bold;
  color: #92400e;
  font-size: 1.05rem;
}

.ngp-goals {
  margin-top: 15px;
}

.goals-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.goals-icon {
  font-size: 1.3rem;
}

.goals-title {
  font-weight: bold;
  color: #1f2937;
}

.ngp-goals-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ngp-goal-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
}

.goal-check {
  font-size: 1.1rem;
  color: #10b981;
  font-weight: bold;
}

.goal-text {
  color: #374151;
  font-size: 0.95rem;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@media (max-width: 768px) {
  .ending-card {
    padding: 40px 25px;
  }

  .ending-icon {
    font-size: 3rem;
  }

  .ending-stats {
    gap: 20px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .paragraph {
    font-size: 1rem;
    line-height: 1.8;
  }

  .section-block {
    padding: 16px;
  }

  .summary-metrics {
    flex-direction: column;
    gap: 8px;
  }

  .branch-overview {
    flex-direction: column;
    gap: 8px;
  }

  .material-chips {
    gap: 4px;
  }

  .material-chip {
    font-size: 0.72rem;
    padding: 4px 8px;
  }

  .combo-review-item {
    padding: 8px 10px;
  }

  .branch-detail {
    flex-wrap: wrap;
    gap: 8px;
  }

  .goal-item {
    padding: 12px;
    gap: 8px;
  }

  .goal-desc {
    font-size: 0.72rem;
  }
}

.achievement-unlock-section {
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  border: 2px solid #fbbf24;
  animation: sectionGlow 2s ease-in-out infinite;
}

@keyframes sectionGlow {
  0%, 100% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.3); }
  50% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.5); }
}

.unlocks-count {
  margin-left: auto;
  padding: 4px 12px;
  background: #fbbf24;
  color: white;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.new-achievements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.new-achievement-wrapper {
  opacity: 0;
  transform: translateY(20px);
  animation: achievementSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: inherit;
}

@keyframes achievementSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.achievement-list-enter-active,
.achievement-list-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.achievement-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.achievement-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.achievements-overview-section {
  background: linear-gradient(135deg, #faf5ff, #fdf4ff);
  border: 1px solid #e9d5ff;
}

.view-all-btn {
  margin-left: auto;
  padding: 6px 14px;
  border: none;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-all-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.achievement-overview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.overview-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.overview-stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #7c3aed;
}

.overview-stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.achievement-preview {
  margin-top: 12px;
}

.preview-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 10px;
}

.preview-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.mini-achievement {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mini-achievement:hover {
  transform: scale(1.1);
}

.mini-achievement.rarity-common {
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  border-color: #6b7280;
}

.mini-achievement.rarity-rare {
  background: linear-gradient(135deg, #ede9fe, #c4b5fd);
  border-color: #8b5cf6;
}

.mini-achievement.rarity-epic {
  background: linear-gradient(135deg, #fce7f3, #f9a8d4);
  border-color: #ec4899;
}

.mini-achievement.rarity-legendary {
  background: linear-gradient(135deg, #fef3c7, #fbbf24);
  border-color: #f59e0b;
  animation: miniLegendaryPulse 2s ease-in-out infinite;
}

@keyframes miniLegendaryPulse {
  0%, 100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.6); }
}

.mini-icon {
  font-size: 1.5rem;
}

.mini-achievement.more {
  background: #f3f4f6;
  border-color: #d1d5db;
  border-style: dashed;
}

.more-count {
  font-size: 0.85rem;
  font-weight: 700;
  color: #6b7280;
}

.no-achievements-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  color: #9ca3af;
  font-size: 0.9rem;
}

.hint-icon {
  font-size: 1.2rem;
}

@media (max-width: 640px) {
  .achievement-overview-stats {
    grid-template-columns: 1fr;
  }
  
  .preview-grid {
    justify-content: center;
  }
}
</style>
