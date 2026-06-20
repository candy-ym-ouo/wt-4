<template>
  <div class="story-calendar page-container paper-texture">
    <div class="calendar-header">
      <button class="btn btn-ghost back-btn" @click="goBack">
        ← 返回
      </button>
      <div class="header-titles">
        <h1 class="handwriting title text-gradient">故事时光轴</h1>
        <p class="subtitle">翻开四季的篇章，记录每一段心动</p>
      </div>
      <div class="header-stats">
        <div class="stat-chip">
          <span class="stat-icon">📖</span>
          <span class="stat-text">{{ completedChaptersCount }}/{{ totalMainChapters }} 章节</span>
        </div>
        <div class="stat-chip">
          <span class="stat-icon">🎬</span>
          <span class="stat-text">{{ discoveredEndingsCount }}/{{ totalEndings }} 结局</span>
        </div>
      </div>
    </div>

    <div class="season-tabs">
      <button
        v-for="season in seasons"
        :key="season.id"
        class="season-tab"
        :class="{ active: activeSeason === season.id }"
        @click="activeSeason = season.id"
      >
        <span class="season-emoji">{{ season.emoji }}</span>
        <span class="season-name">{{ season.name }}</span>
        <span v-if="getSeasonProgress(season.id).total > 0" class="season-dot" :class="getSeasonProgress(season.id).completed === getSeasonProgress(season.id).total ? 'done' : 'partial'"></span>
      </button>
    </div>

    <div class="calendar-content">
      <div class="timeline-wrapper">
        <div class="season-header-banner" :style="{ background: currentSeasonData.gradient }">
          <div class="season-banner-content">
            <div class="banner-season-emoji">{{ currentSeasonData.emoji }}</div>
            <div>
              <h2 class="banner-title handwriting">{{ currentSeasonData.name }}</h2>
              <p class="banner-desc">{{ currentSeasonData.description }}</p>
            </div>
          </div>
          <div class="season-progress-info">
            <div class="progress-ring">
              <svg viewBox="0 0 36 36" class="circular-chart">
                <path
                  class="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  :fill="currentSeasonData.ringBg"
                  :stroke="currentSeasonData.ringStroke"
                  stroke-width="3"
                />
                <path
                  class="circle"
                  :stroke-dasharray="`${seasonProgressPercent}, 100`"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  :stroke="currentSeasonData.color"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <text x="18" y="20.35" class="percentage" :fill="currentSeasonData.color">
                  {{ seasonProgressPercent }}%
                </text>
              </svg>
            </div>
          </div>
        </div>

        <div class="timeline">
          <div class="timeline-line" :style="{ background: currentSeasonData.timelineBg }"></div>

          <div
            v-for="(event, idx) in currentSeasonEvents"
            :key="event.id"
            class="timeline-event"
            :class="{
              completed: event.status === 'completed',
              active: event.status === 'active',
              locked: event.status === 'locked',
              hidden: event.hidden && event.status !== 'completed'
            }"
            :style="{ animationDelay: (idx * 0.08) + 's' }"
          >
            <div class="event-node" :style="{ background: getNodeColor(event) }">
              <span class="node-icon">{{ getEventIcon(event) }}</span>
            </div>

            <div class="event-card" :style="{ '--accent-color': getEventAccent(event) }">
              <div v-if="event.type === 'chapter'" class="event-header">
                <span class="event-type-badge chapter-badge">章节</span>
                <span class="event-index">第 {{ event.order }} 章</span>
              </div>
              <div v-else-if="event.type === 'scene'" class="event-header">
                <span class="event-type-badge scene-badge">场景</span>
                <span class="event-index">{{ event.timeLabel }}</span>
              </div>
              <div v-else-if="event.type === 'material'" class="event-header">
                <span class="event-type-badge material-badge">限定素材</span>
                <span class="event-index">{{ event.seasonName }}限定</span>
              </div>
              <div v-else-if="event.type === 'ending'" class="event-header">
                <span class="event-type-badge ending-badge">结局</span>
                <span class="event-index">{{ event.endingType }}</span>
              </div>

              <h3 class="event-title handwriting">{{ event.title }}</h3>
              <p v-if="event.description" class="event-desc">{{ event.description }}</p>

              <div v-if="event.type === 'chapter'" class="event-details">
                <div class="detail-row">
                  <span class="detail-label">情绪目标</span>
                  <span class="detail-value">💕 {{ event.emotionTarget }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">收集进度</span>
                  <span class="detail-value">
                    ✨ {{ getChapterTriggeredCombos(event.id) }}/{{ getChapterTotalCombos(event.id) }} 组合
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">隐藏对话</span>
                  <span class="detail-value">
                    💬 {{ getChapterTriggeredHiddenDialogues(event.id) }}/{{ getChapterTotalHiddenDialogues(event.id) }}
                  </span>
                </div>
              </div>

              <div v-if="event.type === 'scene'" class="event-details">
                <div class="detail-row">
                  <span class="detail-label">时间</span>
                  <span class="detail-value">{{ event.timeOfDay }} · {{ event.weather }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">必需素材</span>
                  <div class="material-chips">
                    <span
                      v-for="mat in event.materials"
                      :key="mat.id"
                      class="material-chip"
                      :style="{ background: mat.color }"
                      :title="mat.name"
                    >{{ mat.emoji }}</span>
                  </div>
                </div>
              </div>

              <div v-if="event.type === 'material'" class="event-details">
                <div class="detail-row">
                  <span class="detail-label">稀有度</span>
                  <span class="detail-value rarity" :class="event.rarity">
                    {{ getRarityLabel(event.rarity) }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">情绪加成</span>
                  <span class="detail-value">+{{ event.emotion }} 💕</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">标签</span>
                  <div class="tag-chips">
                    <span v-for="tag in event.tags" :key="tag" class="tag-chip">#{{ tag }}</span>
                  </div>
                </div>
              </div>

              <div v-if="event.type === 'ending'" class="event-details">
                <div class="detail-row">
                  <span class="detail-label">最低情绪</span>
                  <span class="detail-value">💕 {{ event.minEmotion }}</span>
                </div>
                <div class="unlock-conditions">
                  <span class="conditions-label">解锁条件：</span>
                  <ul class="conditions-list">
                    <li v-for="(cond, ci) in event.conditions" :key="ci" :class="{ met: cond.met }">
                      <span class="cond-icon">{{ cond.met ? '✅' : '⬜' }}</span>
                      <span class="cond-text">{{ cond.text }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div v-if="event.status === 'active' && event.type === 'chapter'" class="event-action">
                <button class="btn btn-primary btn-sm" @click="jumpToChapter(event.id)">
                  继续冒险 ▸
                </button>
              </div>
              <div v-else-if="event.status === 'completed' && event.type === 'chapter'" class="event-action">
                <button class="btn btn-ghost btn-sm" @click="viewChapterScore(event.id)">
                  📊 评分明细
                </button>
              </div>
              <div v-else-if="event.status === 'locked'" class="event-action">
                <span class="locked-hint">🔒 继续探索以解锁</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="side-panel">
        <div class="panel-card">
          <h3 class="panel-title handwriting">🌤️ 季节环境</h3>
          <div class="env-list">
            <div
              v-for="env in currentSeasonData.environments"
              :key="env.id"
              class="env-item"
              :style="{ background: env.bg }"
            >
              <span class="env-emoji">{{ env.emoji }}</span>
              <span class="env-name">{{ env.name }}</span>
            </div>
          </div>
        </div>

        <div class="panel-card">
          <h3 class="panel-title handwriting">🎯 当前目标</h3>
          <div v-if="currentGoal" class="goal-card">
            <div class="goal-icon">{{ currentGoal.icon }}</div>
            <div class="goal-info">
              <div class="goal-title">{{ currentGoal.title }}</div>
              <div class="goal-progress">
                <div class="goal-progress-bar">
                  <div class="goal-progress-fill" :style="{ width: currentGoal.percent + '%' }"></div>
                </div>
                <span class="goal-percent">{{ currentGoal.percent }}%</span>
              </div>
              <div class="goal-hint">{{ currentGoal.hint }}</div>
            </div>
          </div>
          <div v-else class="no-goal">
            <span class="no-goal-icon">🎉</span>
            <p>当前季节已全部完成！</p>
          </div>
        </div>

        <div class="panel-card">
          <h3 class="panel-title handwriting">💎 收集统计</h3>
          <div class="collect-stats">
            <div class="collect-row">
              <span class="collect-label">章节完成</span>
              <div class="collect-bar-wrapper">
                <div class="collect-bar">
                  <div class="collect-fill chapter" :style="{ width: chapterCollectPercent + '%' }"></div>
                </div>
                <span class="collect-percent">{{ completedChaptersCount }}/{{ totalMainChapters }}</span>
              </div>
            </div>
            <div class="collect-row">
              <span class="collect-label">素材组合</span>
              <div class="collect-bar-wrapper">
                <div class="collect-bar">
                  <div class="collect-fill combo" :style="{ width: comboCollectPercent + '%' }"></div>
                </div>
                <span class="collect-percent">{{ totalTriggeredCombos }}/{{ totalCombos }}</span>
              </div>
            </div>
            <div class="collect-row">
              <span class="collect-label">隐藏对话</span>
              <div class="collect-bar-wrapper">
                <div class="collect-bar">
                  <div class="collect-fill dialogue" :style="{ width: dialogueCollectPercent + '%' }"></div>
                </div>
                <span class="collect-percent">{{ totalTriggeredDialogues }}/{{ totalHiddenDialogues }}</span>
              </div>
            </div>
            <div class="collect-row">
              <span class="collect-label">结局发现</span>
              <div class="collect-bar-wrapper">
                <div class="collect-bar">
                  <div class="collect-fill ending" :style="{ width: endingCollectPercent + '%' }"></div>
                </div>
                <span class="collect-percent">{{ discoveredEndingsCount }}/{{ totalEndings }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const activeSeason = ref('spring')

const seasons = [
  {
    id: 'spring',
    name: '春日序章',
    emoji: '🌸',
    description: '樱花飞舞的季节，一切故事的开始',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #fef3c7 100%)',
    ringBg: '#fdf2f8',
    ringStroke: '#fbcfe8',
    timelineBg: 'linear-gradient(180deg, #fce7f3, #fef3c7)',
    environments: [
      { id: 'day_clear', name: '春日晴朗', emoji: '☀️', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)' },
      { id: 'dusk_clear', name: '黄昏浪漫', emoji: '🌅', bg: 'linear-gradient(135deg, #fed7aa, #fdba74)' },
      { id: 'night_star', name: '星空如梦', emoji: '🌌', bg: 'linear-gradient(135deg, #1e1b4b, #312e81)' }
    ]
  },
  {
    id: 'summer',
    name: '盛夏光年',
    emoji: '☀️',
    description: '蝉鸣声声的青春，最炽热的心动',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #bbf7d0 100%)',
    ringBg: '#ecfdf5',
    ringStroke: '#a7f3d0',
    timelineBg: 'linear-gradient(180deg, #d1fae5, #bbf7d0)',
    environments: [
      { id: 'day_clear', name: '夏日明媚', emoji: '🌞', bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' },
      { id: 'day_rain', name: '清新雨后', emoji: '🌧️', bg: 'linear-gradient(135deg, #94a3b8, #cbd5e1)' },
      { id: 'dusk_clear', name: '慵懒黄昏', emoji: '🌇', bg: 'linear-gradient(135deg, #fed7aa, #a7f3d0)' }
    ]
  },
  {
    id: 'autumn',
    name: '秋日私语',
    emoji: '🍂',
    description: '金色落叶铺满小径，藏着谁的秘密',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)',
    ringBg: '#fff7ed',
    ringStroke: '#fed7aa',
    timelineBg: 'linear-gradient(180deg, #fed7aa, #fb923c)',
    environments: [
      { id: 'day_clear', name: '秋意浓浓', emoji: '🍁', bg: 'linear-gradient(135deg, #fed7aa, #fdba74)' },
      { id: 'dusk_clear', name: '诗意黄昏', emoji: '🌆', bg: 'linear-gradient(135deg, #fb923c, #f97316)' },
      { id: 'night_clear', name: '静谧夜晚', emoji: '🌙', bg: 'linear-gradient(135deg, #7c2d12, #9a3412)' }
    ]
  },
  {
    id: 'winter',
    name: '冬日暖阳',
    emoji: '❄️',
    description: '初雪飘落的那天，所有答案都会揭晓',
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
    ringBg: '#eff6ff',
    ringStroke: '#bfdbfe',
    timelineBg: 'linear-gradient(180deg, #dbeafe, #93c5fd)',
    environments: [
      { id: 'day_snow', name: '初雪纷飞', emoji: '❄️', bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' },
      { id: 'dusk_snow', name: '雪色黄昏', emoji: '🌇', bg: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)' },
      { id: 'night_star', name: '雪夜星芒', emoji: '✨', bg: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }
    ]
  }
]

const seasonChapterMap = {
  spring: ['chapter1'],
  summer: ['chapter2'],
  autumn: ['chapter3'],
  winter: ['chapter4']
}

const currentSeasonData = computed(() => {
  return seasons.find(s => s.id === activeSeason.value) || seasons[0]
})

const mainChapters = computed(() => {
  return gameStore.chapters.filter(c => !c.hidden)
})

const totalMainChapters = computed(() => mainChapters.value.length)

const completedChaptersCount = computed(() => {
  return mainChapters.value.filter(c => gameStore.completedChapters.includes(c.id)).length
})

const totalEndings = computed(() => gameStore.endings.length)

const discoveredEndingsCount = computed(() => {
  return gameStore.newGamePlus.discoveredEndingIds?.length || 0
})

const totalCombos = computed(() => {
  let count = 0
  Object.values(gameStore.scenes).forEach(scene => {
    if (scene.materialCombos) count += scene.materialCombos.length
  })
  return count
})

const totalTriggeredCombos = computed(() => gameStore.triggeredCombos.length)

const totalHiddenDialogues = computed(() => {
  let count = 0
  Object.values(gameStore.scenes).forEach(scene => {
    if (scene.materialCombos) {
      scene.materialCombos.forEach(combo => {
        if (combo.hiddenDialogue) count++
      })
    }
  })
  return count
})

const totalTriggeredDialogues = computed(() => {
  let count = 0
  gameStore.triggeredCombos.forEach(comboId => {
    Object.values(gameStore.scenes).forEach(scene => {
      if (scene.materialCombos) {
        const combo = scene.materialCombos.find(c => c.id === comboId)
        if (combo && combo.hiddenDialogue) count++
      }
    })
  })
  return count
})

const chapterCollectPercent = computed(() => Math.round((completedChaptersCount.value / Math.max(1, totalMainChapters.value)) * 100))
const comboCollectPercent = computed(() => Math.round((totalTriggeredCombos.value / Math.max(1, totalCombos.value)) * 100))
const dialogueCollectPercent = computed(() => Math.round((totalTriggeredDialogues.value / Math.max(1, totalHiddenDialogues.value)) * 100))
const endingCollectPercent = computed(() => Math.round((discoveredEndingsCount.value / Math.max(1, totalEndings.value)) * 100))

const getSeasonProgress = (seasonId) => {
  const chapterIds = seasonChapterMap[seasonId] || []
  const completed = chapterIds.filter(id => gameStore.completedChapters.includes(id)).length
  return { total: chapterIds.length, completed }
}

const seasonProgressPercent = computed(() => {
  const progress = getSeasonProgress(activeSeason.value)
  if (progress.total === 0) return 0
  return Math.round((progress.completed / progress.total) * 100)
})

const getChapterTotalCombos = (chapterId) => gameStore.getChapterTotalCombos(chapterId)
const getChapterTriggeredCombos = (chapterId) => gameStore.getChapterTriggeredCombos(chapterId)
const getChapterTotalHiddenDialogues = (chapterId) => gameStore.getChapterTotalHiddenDialogues(chapterId)
const getChapterTriggeredHiddenDialogues = (chapterId) => gameStore.getChapterTriggeredHiddenDialogues(chapterId)

const getRarityLabel = (rarity) => {
  const map = {
    common: '普通',
    rare: '稀有',
    legendary: '传说'
  }
  return map[rarity] || rarity
}

const currentSeasonEvents = computed(() => {
  const seasonId = activeSeason.value
  const events = []
  const chapterIds = seasonChapterMap[seasonId] || []

  chapterIds.forEach((chapterId, chapterIdx) => {
    const chapter = gameStore.getChapterById(chapterId)
    if (!chapter) return

    const chapterStatus = gameStore.completedChapters.includes(chapterId)
      ? 'completed'
      : (gameStore.unlockedChapters.includes(chapterId) ? 'active' : 'locked')

    events.push({
      id: chapterId,
      type: 'chapter',
      title: chapter.title,
      description: chapter.description,
      order: chapterIdx + 1,
      status: chapterStatus,
      emotionTarget: chapter.emotionTarget,
      hidden: chapter.hidden || false
    })

    if (chapterStatus !== 'locked' && chapter.scenes) {
      chapter.scenes.forEach((sceneId, sceneIdx) => {
        const scene = gameStore.scenes[sceneId]
        if (!scene) return

        const materials = []
        if (scene.requiredMaterial) {
          const mat = gameStore.getMaterialById(scene.requiredMaterial)
          if (mat) materials.push({ ...mat, emoji: getMaterialEmoji(mat) })
        }

        events.push({
          id: sceneId,
          type: 'scene',
          title: `场景 ${sceneIdx + 1}`,
          description: scene.dialogues?.[0]?.text || '',
          timeLabel: getTimeOfDayLabel(scene.timeOfDay) + ' · ' + getWeatherLabel(scene.weather),
          timeOfDay: getTimeOfDayLabel(scene.timeOfDay),
          weather: getWeatherLabel(scene.weather),
          materials,
          status: chapterStatus === 'completed' ? 'completed' : chapterStatus,
          seasonName: currentSeasonData.value.name
        })
      })
    }

    if (chapterStatus !== 'locked' && chapter.requiredMaterials) {
      chapter.requiredMaterials.forEach(matId => {
        const mat = gameStore.getMaterialById(matId)
        if (!mat) return
        const seasonTag = mat.tags.find(t => ['spring', 'summer', 'autumn', 'winter'].includes(t))
        if (seasonTag === seasonId.slice(0, -2) || (seasonId === 'spring' && seasonTag === 'spring') || (seasonId === 'summer' && seasonTag === 'summer') || (seasonId === 'autumn' && seasonTag === 'autumn') || (seasonId === 'winter' && seasonTag === 'winter')) {
          events.push({
            id: 'mat_' + matId,
            type: 'material',
            title: mat.name,
            description: mat.description,
            rarity: mat.rarity,
            emotion: mat.emotion,
            tags: mat.tags,
            status: chapterStatus === 'completed' ? 'completed' : 'active',
            seasonName: currentSeasonData.value.name
          })
        }
      })
    }
  })

  if (seasonId === 'winter') {
    gameStore.endings.forEach((ending, idx) => {
      const discovered = gameStore.newGamePlus.discoveredEndingIds?.includes(ending.id)
      events.push({
        id: ending.id,
        type: 'ending',
        title: discovered ? ending.title : '???',
        description: discovered ? ending.description : '完成所有章节以解锁',
        endingType: getEndingTypeName(ending.type),
        minEmotion: ending.minEmotion,
        conditions: getEndingConditions(ending),
        status: discovered ? 'completed' : (completedChaptersCount.value >= 3 ? 'active' : 'locked'),
        hidden: ending.type === 'true' || ending.type === 'eternal'
      })
    })
  }

  return events
})

const getMaterialEmoji = (mat) => {
  const map = {
    flower: '🌸',
    butterfly: '🦋',
    letter: '💌',
    sun: '☀️',
    cicada: '🦗',
    book: '📖',
    leaf: '🍂',
    coffee: '☕',
    watch: '⌚',
    snowflake: '❄️',
    scarf: '🧣',
    heart: '❤️',
    cloud: '☁️',
    star: '⭐',
    music: '🎵'
  }
  return map[mat.shape] || map[mat.id] || '✨'
}

const getTimeOfDayLabel = (time) => {
  const map = { day: '白天', dusk: '黄昏', night: '夜晚' }
  return map[time] || time
}

const getWeatherLabel = (weather) => {
  const map = { clear: '晴朗', cloudy: '多云', rain: '雨天', snow: '下雪', star: '星空' }
  return map[weather] || weather
}

const getEndingTypeName = (type) => {
  const map = {
    true: '真结局',
    good: '好结局',
    normal: '普通结局',
    special: '特殊结局',
    perfect_path: '完美结局',
    dialogue_master: '对话大师',
    time_sequence: '时序之约',
    ngp_perfect: 'NGP完美',
    ngp_special: 'NGP特殊',
    eternal: '永恒之约'
  }
  return map[type] || type
}

const getEndingConditions = (ending) => {
  const conds = []
  const tc = ending.triggerConditions || {}
  if (tc.emotionValue) conds.push({ text: `情绪值达到 ${tc.emotionValue}`, met: gameStore.emotionValue >= tc.emotionValue })
  if (tc.allChaptersCompleted) conds.push({ text: '完成所有章节', met: completedChaptersCount.value >= totalMainChapters.value })
  if (tc.minFinalScore) conds.push({ text: `最终评分达到 ${tc.minFinalScore}`, met: false })
  if (tc.minCompletedChapterCount) conds.push({ text: `完成至少 ${tc.minCompletedChapterCount} 个章节`, met: completedChaptersCount.value >= tc.minCompletedChapterCount })
  if (tc.currentCycle) conds.push({ text: `第 ${tc.currentCycle} 周目以上`, met: gameStore.newGamePlus.currentCycle >= tc.currentCycle })
  if (tc.allCombosTriggered) conds.push({ text: '触发所有素材组合', met: totalTriggeredCombos.value >= totalCombos.value })
  if (tc.allHiddenDialogues) conds.push({ text: '发现所有隐藏对话', met: totalTriggeredDialogues.value >= totalHiddenDialogues.value })
  if (conds.length === 0) conds.push({ text: '完成游戏体验', met: discoveredEndingsCount.value > 0 })
  return conds
}

const getEventIcon = (event) => {
  if (event.type === 'chapter') {
    if (event.status === 'completed') return '✓'
    if (event.status === 'active') return '📖'
    return '🔒'
  }
  if (event.type === 'scene') return '🎬'
  if (event.type === 'material') return '✨'
  if (event.type === 'ending') {
    if (event.status === 'completed') return '🏆'
    return '🎯'
  }
  return '•'
}

const getNodeColor = (event) => {
  if (event.status === 'completed') return currentSeasonData.value.color
  if (event.status === 'active') return 'white'
  return '#d1d5db'
}

const getEventAccent = (event) => {
  if (event.type === 'chapter') return currentSeasonData.value.color
  if (event.type === 'scene') return '#8b5cf6'
  if (event.type === 'material') return '#f59e0b'
  if (event.type === 'ending') return '#ec4899'
  return '#6b7280'
}

const currentGoal = computed(() => {
  const events = currentSeasonEvents.value
  const active = events.find(e => e.status === 'active' && e.type === 'chapter')
  if (active) {
    const progress = gameStore.getChapterCompletion(active.id)
    return {
      icon: '📖',
      title: active.title,
      percent: progress,
      hint: '完成本章以解锁下一季'
    }
  }
  const locked = events.find(e => e.status === 'locked' && e.type === 'chapter')
  if (locked) {
    return {
      icon: '🔒',
      title: locked.title,
      percent: 0,
      hint: '完成前置章节以解锁'
    }
  }
  return null
})

const goBack = () => {
  router.push('/chapter-select')
}

const jumpToChapter = (chapterId) => {
  gameStore.startChapterWithTracking(chapterId)
  router.push(`/game/${chapterId}`)
}

const viewChapterScore = (chapterId) => {
  router.push(`/chapter-score/${chapterId}`)
}
</script>

<style scoped>
.story-calendar {
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.calendar-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 30px 0;
  margin-bottom: 20px;
  position: relative;
}

.back-btn {
  flex-shrink: 0;
}

.header-titles {
  flex: 1;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  font-size: 0.9rem;
  font-weight: 600;
}

.stat-icon {
  font-size: 1.1rem;
}

.season-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.season-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 30px;
  background: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
  font-family: var(--font-serif);
  position: relative;
}

.season-tab:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.season-tab.active {
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  color: #7c3aed;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.season-emoji {
  font-size: 1.3rem;
}

.season-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
}

.season-dot.partial {
  background: #f59e0b;
  animation: pulse 2s ease-in-out infinite;
}

.season-dot.done {
  background: #10b981;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

.calendar-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 30px;
}

.timeline-wrapper {
  min-width: 0;
}

.season-header-banner {
  padding: 25px 30px;
  border-radius: 20px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-md);
}

.season-banner-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.banner-season-emoji {
  font-size: 4rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.banner-title {
  font-size: 2rem;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.banner-desc {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin: 0;
  font-style: italic;
}

.progress-ring {
  width: 80px;
  height: 80px;
}

.circular-chart {
  width: 100%;
  height: 100%;
}

.percentage {
  font-size: 0.5em;
  text-anchor: middle;
  font-weight: 700;
}

.timeline {
  position: relative;
  padding-left: 50px;
}

.timeline-line {
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 2px;
}

.timeline-event {
  position: relative;
  margin-bottom: 25px;
  opacity: 0;
  animation: slideInRight 0.5s ease forwards;
}

.timeline-event.hidden {
  opacity: 0.6;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.event-node {
  position: absolute;
  left: -50px;
  top: 15px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 3px solid white;
  font-size: 0.9rem;
  font-weight: bold;
  color: white;
  z-index: 1;
  transition: all 0.3s ease;
}

.timeline-event.completed .event-node {
  background: var(--accent-color, #10b981);
}

.timeline-event.active .event-node {
  background: white;
  color: var(--accent-color, #7c3aed);
  border-color: var(--accent-color, #7c3aed);
  animation: nodePulse 2s ease-in-out infinite;
}

@keyframes nodePulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); }
  50% { box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.2); }
}

.timeline-event.locked .event-node {
  background: #d1d5db;
  color: #9ca3af;
}

.event-card {
  --accent-color: #7c3aed;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-md);
  border-left: 4px solid var(--accent-color);
  transition: all 0.3s ease;
}

.event-card:hover {
  transform: translateX(5px);
  box-shadow: var(--shadow-lg);
}

.timeline-event.locked .event-card {
  opacity: 0.6;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.event-type-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.chapter-badge {
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
}

.scene-badge {
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
}

.material-badge {
  background: linear-gradient(135deg, #f59e0b, #f97316);
}

.ending-badge {
  background: linear-gradient(135deg, #ec4899, #db2777);
}

.event-index {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.event-title {
  font-size: 1.3rem;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.event-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 15px 0;
}

.event-details {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 12px 15px;
  margin-bottom: 15px;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  gap: 10px;
}

.detail-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.detail-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.detail-value.rarity.common {
  color: #6b7280;
}

.detail-value.rarity.rare {
  color: #7c3aed;
}

.detail-value.rarity.legendary {
  background: linear-gradient(135deg, #f59e0b, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.material-chips,
.tag-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.material-chip {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tag-chip {
  padding: 2px 8px;
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.unlock-conditions {
  margin-top: 8px;
}

.conditions-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 6px;
}

.conditions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conditions-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.conditions-list li.met {
  color: #10b981;
  text-decoration: line-through;
  text-decoration-color: rgba(16, 185, 129, 0.3);
}

.cond-icon {
  flex-shrink: 0;
}

.event-action {
  margin-top: 5px;
}

.btn-sm {
  padding: 8px 20px;
  font-size: 0.9rem;
}

.locked-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-style: italic;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-md);
}

.panel-title {
  font-size: 1.2rem;
  color: var(--text-primary);
  margin: 0 0 15px 0;
}

.env-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.env-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.env-item:hover {
  transform: translateX(5px);
}

.env-emoji {
  font-size: 1.5rem;
}

.env-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.goal-card {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.goal-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.goal-info {
  flex: 1;
  min-width: 0;
}

.goal-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.goal-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.goal-progress-bar {
  flex: 1;
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.goal-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ec4899, #8b5cf6);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.goal-percent {
  font-size: 0.85rem;
  font-weight: 600;
  color: #7c3aed;
  flex-shrink: 0;
}

.goal-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-style: italic;
}

.no-goal {
  text-align: center;
  padding: 20px 0;
}

.no-goal-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 10px;
}

.no-goal p {
  font-size: 0.95rem;
  color: #10b981;
  font-weight: 600;
  margin: 0;
}

.collect-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.collect-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.collect-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.collect-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collect-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
}

.collect-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.collect-fill.chapter {
  background: linear-gradient(90deg, #ec4899, #8b5cf6);
}

.collect-fill.combo {
  background: linear-gradient(90deg, #10b981, #059669);
}

.collect-fill.dialogue {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.collect-fill.ending {
  background: linear-gradient(90deg, #3b82f6, #6366f1);
}

.collect-percent {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}

@media (max-width: 1024px) {
  .calendar-content {
    grid-template-columns: 1fr;
  }

  .side-panel {
    order: -1;
  }
}

@media (max-width: 768px) {
  .calendar-header {
    flex-direction: column;
    padding: 20px 0;
    gap: 15px;
  }

  .header-stats {
    order: -1;
    width: 100%;
    justify-content: center;
  }

  .title {
    font-size: 1.8rem;
  }

  .season-tabs {
    gap: 8px;
  }

  .season-tab {
    padding: 10px 16px;
    font-size: 0.9rem;
  }

  .season-name {
    display: none;
  }

  .season-header-banner {
    flex-direction: column;
    gap: 15px;
    text-align: center;
    padding: 20px;
  }

  .season-banner-content {
    flex-direction: column;
    gap: 10px;
  }

  .banner-season-emoji {
    font-size: 3rem;
  }

  .banner-title {
    font-size: 1.5rem;
  }

  .timeline {
    padding-left: 40px;
  }

  .event-node {
    left: -40px;
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .event-card {
    padding: 15px;
  }

  .event-title {
    font-size: 1.1rem;
  }
}
</style>
