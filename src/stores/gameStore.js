import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import chaptersData from '../data/chapters.json'
import materialsData from '../data/materials.json'
import scenesData from '../data/scenes.json'
import endingsData from '../data/endings.json'
import questsData from '../data/quests.json'
import { validateStoryData } from './warningStore.js'

const AUTO_SAVE_KEY = 'journal_game_autosave'
const AUTO_SAVE_BACKUP_KEY = 'journal_game_autosave_backup'
const CHAPTER_SNAPSHOTS_KEY = 'journal_game_chapter_snapshots'
const SESSION_KEY = 'journal_game_session'
const BACKUP_KEY = 'journal_game_saves_backup'
const CHAPTER_SCORE_KEY = 'journal_game_chapter_scores'
const BRANCH_STATS_KEY = 'journal_game_branch_stats'
const TUTORIAL_KEY = 'journal_game_tutorial'
const NEW_GAME_PLUS_KEY = 'journal_game_ngp'
const HIDDEN_MATERIALS_KEY = 'journal_game_hidden_materials'
const CYCLE_ACHIEVEMENTS_KEY = 'journal_game_cycle_achievements'
const CHARACTER_RELATION_KEY = 'journal_game_character_relation'
const QUEST_PROGRESS_KEY = 'journal_game_quest_progress'
const AUTO_SAVE_DIALOGUE_INTERVAL = 5
const HEARTBEAT_INTERVAL = 20000
const CRASH_RECOVERY_THRESHOLD = 180000

export const useGameStore = defineStore('game', () => {
  const chapters = ref(chaptersData)
  const baseMaterials = ref(materialsData)
  const scenes = ref(scenesData)
  const endings = ref(endingsData)

  const currentChapterId = ref(null)
  const currentSceneId = ref(null)
  const currentDialogueIndex = ref(0)
  const emotionValue = ref(0)
  const perfectPlacementCount = ref(0)
  const totalDialogueCount = ref(0)
  const positiveBonus = ref(0)
  const placedMaterials = ref([])
  const unlockedChapters = ref(['chapter1'])
  const completedChapters = ref([])
  const isWaitingForMaterial = ref(false)
  const requiredMaterialId = ref(null)
  const showSaveModal = ref(false)
  const showLoadModal = ref(false)
  const saveSlots = ref([null, null, null])
  const gameCompleted = ref(false)
  const currentEnding = ref(null)
  const currentTimeOfDay = ref('day')
  const currentWeather = ref('clear')

  const triggeredCombos = ref([])
  const pendingHiddenDialogues = ref([])
  const isShowingHiddenDialogue = ref(false)
  const sceneBackgroundOverride = ref(null)
  const activeSceneFeedback = ref(null)
  const comboBonusTotal = ref(0)
  const optionalMaterialsPlaced = ref([])
  const requiredMaterialPlaced = ref(false)
  const comboJustTriggered = ref(null)

  const currentChapterLog = ref([])
  const chapterScoreData = ref({})
  const dialogueHistory = ref([])
  const typingSpeed = ref(50)

  const autoSaveEnabled = ref(true)
  const lastAutoSaveTime = ref(null)
  const autoSaveData = ref(null)
  const chapterSnapshots = ref({})
  const notification = ref(null)
  const showRecoveryModal = ref(false)
  const recoveryData = ref(null)
  const dialogueCountSinceLastAutoSave = ref(0)
  const isInitialized = ref(false)
  let heartbeatTimer = null
  let sessionId = null

  const activeMaterialFilter = ref('all')
  const materialUsageHistory = ref({})
  const materialPlacementSequence = ref([])
  const chapterCompletionDetails = ref({})
  const keyDialogueLines = ref([])
  const hiddenDialogueSequence = ref([])

  const branchStats = ref({
    pathHistory: [],
    sceneDecisionPoints: {},
    choiceFrequency: {},
    pathHeatmap: {},
    chapterPathSummary: {},
    totalPlaythroughs: 0
  })
  const currentPathSequence = ref([])

  const tutorialState = ref({
    completed: false,
    currentStep: 0,
    showTutorial: false,
    page: 'chapter-select',
    stepsCompleted: {
      homeIntro: false,
      dialogueAdvance: false,
      materialSelect: false,
      canvasPlace: false,
      comboSystem: false,
      endingRules: false
    }
  })

  const newGamePlus = ref({
    currentCycle: 1,
    maxCycleUnlocked: 1,
    totalPlaythroughs: 0,
    inheritedEmotion: 0,
    emotionInheritanceConfig: {
      enabled: true,
      baseRatio: 0.12,
      bonusRatioPerCycle: 0.02,
      maxRatio: 0.35,
      maxInheritedEmotion: 80,
      minFinalEmotionForInheritance: 30
    },
    unlockedHiddenMaterialIds: [],
    hiddenMaterialUnlockTimes: {},
    discoveredEndingIds: [],
    endingDiscoverTimes: {},
    perfectCycleHistory: [],
    cycleRewards: {}
  })

  const hiddenMaterialsRegistry = ref([
    {
      id: 'memory_locket',
      name: '记忆吊坠',
      description: '承载着珍贵回忆的吊坠，只有在经历过完整的四季后才会显现。',
      shape: 'heart',
      color: '#f472b6',
      category: 'nature',
      emotion: 25,
      rarity: 'legendary',
      unlockCycle: 2,
      unlockCondition: 'complete_cycle_1',
      tags: ['memory', 'precious', 'legendary'],
      isHidden: true
    },
    {
      id: 'time_compass',
      name: '时光罗盘',
      description: '指向命运交汇点的神秘罗盘，能够感知时间的流动。',
      shape: 'circle',
      color: '#8b5cf6',
      category: 'stationery',
      emotion: 20,
      rarity: 'legendary',
      unlockCycle: 2,
      unlockCondition: 'all_endings_discovered',
      tags: ['time', 'mystery', 'legendary'],
      isHidden: true
    },
    {
      id: 'starlight_quill',
      name: '星光羽毛笔',
      description: '用星光编织而成的羽毛笔，写下的文字会化作真实。',
      shape: 'note',
      color: '#fbbf24',
      category: 'stationery',
      emotion: 22,
      rarity: 'rare',
      unlockCycle: 3,
      unlockCondition: 'perfect_cycle',
      tags: ['star', 'write', 'rare'],
      isHidden: true
    },
    {
      id: 'eternal_bloom',
      name: '永恒之花',
      description: '永不凋零的花朵，象征着跨越时间的羁绊。',
      shape: 'flower',
      color: '#ec4899',
      category: 'nature',
      emotion: 30,
      rarity: 'legendary',
      unlockCycle: 3,
      unlockCondition: 'true_ending',
      tags: ['eternal', 'flower', 'legendary'],
      isHidden: true
    },
    {
      id: 'frozen_teardrop',
      name: '冰封泪滴',
      description: '凝结了冬日离别的泪水，却蕴含着最温暖的心意。',
      shape: 'snowflake',
      color: '#60a5fa',
      category: 'nature',
      emotion: 18,
      rarity: 'rare',
      unlockCycle: 2,
      unlockCondition: 'chapter4_perfect',
      tags: ['winter', 'tear', 'rare'],
      isHidden: true
    },
    {
      id: 'echo_shell',
      name: '回声贝壳',
      description: '贴近耳边，能听到过去与未来的对话交织回响。',
      shape: 'circle',
      color: '#06b6d4',
      category: 'nature',
      emotion: 15,
      rarity: 'rare',
      unlockCycle: 2,
      unlockCondition: 'all_hidden_dialogues',
      tags: ['echo', 'sound', 'rare'],
      isHidden: true
    }
  ])

  const materials = computed(() => {
    const unlockedHidden = hiddenMaterialsRegistry.value.filter(m => 
      newGamePlus.value.unlockedHiddenMaterialIds.includes(m.id)
    )
    return [...baseMaterials.value, ...unlockedHidden]
  })

  const ACHIEVEMENT_CATEGORIES = {
    CHAPTER_COMPLETION: 'chapter_completion',
    MATERIAL_COMBO: 'material_combo',
    HIDDEN_BRANCH: 'hidden_branch',
    HIGH_EMOTION: 'high_emotion',
    CROSS_CYCLE: 'cross_cycle'
  }

  const ACHIEVEMENT_RARITY = {
    COMMON: { id: 'common', name: '普通', color: '#6b7280', bgColor: '#f3f4f6' },
    RARE: { id: 'rare', name: '稀有', color: '#8b5cf6', bgColor: '#ede9fe' },
    EPIC: { id: 'epic', name: '史诗', color: '#ec4899', bgColor: '#fce7f3' },
    LEGENDARY: { id: 'legendary', name: '传说', color: '#f59e0b', bgColor: '#fef3c7' }
  }

  const crossCycleAchievements = ref([
    {
      id: 'first_cycle_complete',
      name: '初次邂逅',
      description: '完成第一周目游戏',
      icon: '🌸',
      category: ACHIEVEMENT_CATEGORIES.CROSS_CYCLE,
      rarity: ACHIEVEMENT_RARITY.COMMON.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 5 },
      checkCondition: (state) => state.newGamePlus.totalPlaythroughs >= 1
    },
    {
      id: 'seasoned_traveler',
      name: '四季旅人',
      description: '完成3次完整周目',
      icon: '🌍',
      category: ACHIEVEMENT_CATEGORIES.CROSS_CYCLE,
      rarity: ACHIEVEMENT_RARITY.RARE.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'inheritance_ratio', value: 0.05 },
      checkCondition: (state) => state.newGamePlus.totalPlaythroughs >= 3
    },
    {
      id: 'perfectionist',
      name: '完美主义者',
      description: '在任意周目中达成所有章节完美通关',
      icon: '👑',
      category: ACHIEVEMENT_CATEGORIES.CROSS_CYCLE,
      rarity: ACHIEVEMENT_RARITY.EPIC.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'unlock_material', value: 'starlight_quill' },
      checkCondition: (state) => {
        return state.chapters.every(ch => {
          const detail = state.chapterCompletionDetails[ch.id]
          return detail?.isPerfect
        })
      }
    },
    {
      id: 'ending_collector',
      name: '结局收藏家',
      description: '发现所有不同类型的结局',
      icon: '📚',
      category: ACHIEVEMENT_CATEGORIES.CROSS_CYCLE,
      rarity: ACHIEVEMENT_RARITY.EPIC.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'unlock_material', value: 'time_compass' },
      checkCondition: (state) => state.newGamePlus.discoveredEndingIds.length >= 6
    },
    {
      id: 'true_destiny',
      name: '真命天女',
      description: '达成真结局',
      icon: '💎',
      category: ACHIEVEMENT_CATEGORIES.CROSS_CYCLE,
      rarity: ACHIEVEMENT_RARITY.LEGENDARY.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'unlock_material', value: 'eternal_bloom' },
      checkCondition: (state) => state.newGamePlus.discoveredEndingIds.includes('ending_true')
    },
    {
      id: 'memory_hunter',
      name: '记忆猎人',
      description: '发现所有隐藏对话',
      icon: '🔍',
      category: ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH,
      rarity: ACHIEVEMENT_RARITY.EPIC.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'unlock_material', value: 'echo_shell' },
      checkCondition: (state) => {
        const totalHidden = state.chapters.reduce((sum, ch) =>
          sum + getChapterTotalHiddenDialogues(ch.id), 0)
        const foundHidden = state.chapters.reduce((sum, ch) =>
          sum + getChapterTriggeredHiddenDialogues(ch.id), 0)
        return totalHidden > 0 && foundHidden >= totalHidden
      }
    },
    {
      id: 'cycle_master',
      name: '轮回宗师',
      description: '完成5次完整周目',
      icon: '🔄',
      category: ACHIEVEMENT_CATEGORIES.CROSS_CYCLE,
      rarity: ACHIEVEMENT_RARITY.LEGENDARY.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'max_inheritance', value: 10 },
      checkCondition: (state) => state.newGamePlus.totalPlaythroughs >= 5
    },
    {
      id: 'winter_wonder',
      name: '冬日奇迹',
      description: '在冬日暖阳章节达成完美通关',
      icon: '❄️',
      category: ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION,
      rarity: ACHIEVEMENT_RARITY.RARE.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'unlock_material', value: 'frozen_teardrop' },
      checkCondition: (state) => {
        const ch4Detail = state.chapterCompletionDetails['chapter4']
        return ch4Detail?.isPerfect || false
      }
    },
    {
      id: 'spring_blossom',
      name: '春日绽放',
      description: '完成春日序章',
      icon: '🌸',
      category: ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION,
      rarity: ACHIEVEMENT_RARITY.COMMON.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 3 },
      checkCondition: (state) => state.completedChapters.includes('chapter1')
    },
    {
      id: 'summer_heat',
      name: '盛夏激情',
      description: '完成盛夏光年',
      icon: '☀️',
      category: ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION,
      rarity: ACHIEVEMENT_RARITY.COMMON.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 3 },
      checkCondition: (state) => state.completedChapters.includes('chapter2')
    },
    {
      id: 'autumn_whisper',
      name: '秋日私语',
      description: '完成秋日私语',
      icon: '🍂',
      category: ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION,
      rarity: ACHIEVEMENT_RARITY.COMMON.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 3 },
      checkCondition: (state) => state.completedChapters.includes('chapter3')
    },
    {
      id: 'perfect_spring',
      name: '完美春日',
      description: '在春日序章达成完美通关',
      icon: '🌷',
      category: ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION,
      rarity: ACHIEVEMENT_RARITY.RARE.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 5 },
      checkCondition: (state) => {
        const detail = state.chapterCompletionDetails['chapter1']
        return detail?.isPerfect || false
      }
    },
    {
      id: 'perfect_summer',
      name: '完美盛夏',
      description: '在盛夏光年达成完美通关',
      icon: '🌻',
      category: ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION,
      rarity: ACHIEVEMENT_RARITY.RARE.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 5 },
      checkCondition: (state) => {
        const detail = state.chapterCompletionDetails['chapter2']
        return detail?.isPerfect || false
      }
    },
    {
      id: 'perfect_autumn',
      name: '完美秋日',
      description: '在秋日私语达成完美通关',
      icon: '🍁',
      category: ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION,
      rarity: ACHIEVEMENT_RARITY.RARE.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 5 },
      checkCondition: (state) => {
        const detail = state.chapterCompletionDetails['chapter3']
        return detail?.isPerfect || false
      }
    },
    {
      id: 'combo_master',
      name: '组合大师',
      description: '在单个周目中触发10个以上素材组合',
      icon: '🔮',
      category: ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO,
      rarity: ACHIEVEMENT_RARITY.RARE.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 8 },
      checkCondition: (state) => {
        const globalComboSet = buildGlobalTriggeredComboSet()
        return globalComboSet.size >= 10
      }
    },
    {
      id: 'combo_collector',
      name: '组合收藏家',
      description: '发现所有素材组合',
      icon: '🎨',
      category: ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO,
      rarity: ACHIEVEMENT_RARITY.EPIC.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'inheritance_ratio', value: 0.03 },
      checkCondition: (state) => {
        const totalCombos = getAllCombosCount()
        const globalComboSet = buildGlobalTriggeredComboSet()
        return totalCombos > 0 && globalComboSet.size >= totalCombos
      }
    },
    {
      id: 'season_combo',
      name: '四季流转',
      description: '触发四季流转特殊组合',
      icon: '🌍',
      category: ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO,
      rarity: ACHIEVEMENT_RARITY.EPIC.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 10 },
      checkCondition: (state) => {
        const globalComboSet = buildGlobalTriggeredComboSet()
        return globalComboSet.has('combo4_full_four_seasons')
      }
    },
    {
      id: 'first_combo',
      name: '初次组合',
      description: '触发第一个素材组合',
      icon: '✨',
      category: ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO,
      rarity: ACHIEVEMENT_RARITY.COMMON.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 2 },
      checkCondition: (state) => {
        const globalComboSet = buildGlobalTriggeredComboSet()
        return globalComboSet.size >= 1
      }
    },
    {
      id: 'hidden_seeker',
      name: '隐藏探索者',
      description: '发现第一段隐藏对话',
      icon: '🔍',
      category: ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH,
      rarity: ACHIEVEMENT_RARITY.COMMON.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 3 },
      checkCondition: (state) => {
        const foundHidden = state.chapters.reduce((sum, ch) =>
          sum + getChapterTriggeredHiddenDialogues(ch.id), 0)
        return foundHidden >= 1
      }
    },
    {
      id: 'she_secret_garden',
      name: '她的秘密花园',
      description: '解锁隐藏章节「她的秘密花园」',
      icon: '🌺',
      category: ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH,
      rarity: ACHIEVEMENT_RARITY.RARE.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 8 },
      checkCondition: (state) => state.unlockedChapters.includes('chapter_she')
    },
    {
      id: 'time_corridor',
      name: '时光回廊',
      description: '解锁隐藏章节「时光回廊」',
      icon: '⏳',
      category: ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH,
      rarity: ACHIEVEMENT_RARITY.RARE.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 8 },
      checkCondition: (state) => state.unlockedChapters.includes('chapter_time')
    },
    {
      id: 'mirror_self',
      name: '镜中之我',
      description: '解锁隐藏章节「镜中之我」',
      icon: '🪞',
      category: ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH,
      rarity: ACHIEVEMENT_RARITY.RARE.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 8 },
      checkCondition: (state) => state.unlockedChapters.includes('chapter_self')
    },
    {
      id: 'all_hidden_chapters',
      name: '秘密发掘者',
      description: '解锁所有隐藏章节',
      icon: '🗝️',
      category: ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH,
      rarity: ACHIEVEMENT_RARITY.LEGENDARY.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'inheritance_ratio', value: 0.05 },
      checkCondition: (state) => {
        return state.unlockedChapters.includes('chapter_she') &&
               state.unlockedChapters.includes('chapter_time') &&
               state.unlockedChapters.includes('chapter_self')
      }
    },
    {
      id: 'emotion_rookie',
      name: '情感新手',
      description: '单章节情绪值达到50',
      icon: '💓',
      category: ACHIEVEMENT_CATEGORIES.HIGH_EMOTION,
      rarity: ACHIEVEMENT_RARITY.COMMON.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 2 },
      checkCondition: (state) => {
        return Object.values(state.chapterCompletionDetails).some(d => d.totalEmotion >= 50)
      }
    },
    {
      id: 'emotion_expert',
      name: '情感达人',
      description: '单章节情绪值达到100',
      icon: '💗',
      category: ACHIEVEMENT_CATEGORIES.HIGH_EMOTION,
      rarity: ACHIEVEMENT_RARITY.RARE.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 5 },
      checkCondition: (state) => {
        return Object.values(state.chapterCompletionDetails).some(d => d.totalEmotion >= 100)
      }
    },
    {
      id: 'emotion_master',
      name: '情感大师',
      description: '最终情绪值达到150',
      icon: '💖',
      category: ACHIEVEMENT_CATEGORIES.HIGH_EMOTION,
      rarity: ACHIEVEMENT_RARITY.EPIC.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 10 },
      checkCondition: (state) => state.emotionValue >= 150
    },
    {
      id: 'emotion_legend',
      name: '情感传说',
      description: '最终情绪值达到200',
      icon: '🌟',
      category: ACHIEVEMENT_CATEGORIES.HIGH_EMOTION,
      rarity: ACHIEVEMENT_RARITY.LEGENDARY.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'max_inheritance', value: 15 },
      checkCondition: (state) => state.emotionValue >= 200
    },
    {
      id: 'all_chapters_high_emotion',
      name: '四季情深',
      description: '所有章节情绪值都达到目标值',
      icon: '💕',
      category: ACHIEVEMENT_CATEGORIES.HIGH_EMOTION,
      rarity: ACHIEVEMENT_RARITY.EPIC.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'inheritance_ratio', value: 0.04 },
      checkCondition: (state) => {
        return state.chapters.every(ch => {
          const detail = state.chapterCompletionDetails[ch.id]
          return detail?.emotionReached
        })
      }
    },
    {
      id: 'perfect_placement',
      name: '精准大师',
      description: '单周目完美放置率达到80%',
      icon: '🎯',
      category: ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO,
      rarity: ACHIEVEMENT_RARITY.RARE.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 6 },
      checkCondition: (state) => {
        const totalMaterialCount = Object.values(state.scenes).filter(s => s.requiredMaterial).length
        const perfectRate = totalMaterialCount > 0 ? state.perfectPlacementCount / totalMaterialCount : 0
        return perfectRate >= 0.8
      }
    },
    {
      id: 'material_enthusiast',
      name: '素材爱好者',
      description: '使用过20次以上素材',
      icon: '🎨',
      category: ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO,
      rarity: ACHIEVEMENT_RARITY.COMMON.id,
      unlocked: false,
      unlockedAt: null,
      reward: { type: 'emotion_bonus', value: 3 },
      checkCondition: (state) => {
        const totalUsage = Object.values(state.materialUsageHistory).reduce((sum, count) => sum + count, 0)
        return totalUsage >= 20
      }
    }
  ])

  const achievementNotification = ref(null)
  const newlyUnlockedAchievements = ref([])

  const quests = ref(questsData)

  const questProgress = ref({})

  const activeQuests = ref([])

  const completedQuests = ref([])

  const questNotifications = ref([])

  const showQuestPanel = ref(false)

  const selectedQuestId = ref(null)

  const totalEmotionAccumulated = ref(0)

  const totalCombosTriggered = ref(0)

  const scenesCompleted = ref([])

  const chaptersStarted = ref([])

  const ngpNotification = ref(null)

  const characterRegistry = ref([
    {
      id: 'she',
      name: '她',
      title: '回忆中的少女',
      icon: '🌸',
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
      description: '那个在樱花树下微笑的女孩，温暖了你的整个青春。',
      personality: '温柔、活泼、善于发现美好',
      preferredTags: ['romantic', 'warm', 'pink', 'nature'],
      preferredMaterials: ['flower', 'heart', 'letter', 'scarf'],
      affinityTiers: [
        { id: 'stranger', name: '初遇', min: 0, max: 20, icon: '👋', color: '#9ca3af' },
        { id: 'acquaintance', name: '相识', min: 20, max: 40, icon: '😊', color: '#f59e0b' },
        { id: 'friend', name: '知己', min: 40, max: 60, icon: '💫', color: '#8b5cf6' },
        { id: 'close', name: '亲密', min: 60, max: 80, icon: '💖', color: '#ec4899' },
        { id: 'beloved', name: '挚爱', min: 80, max: 100, icon: '💕', color: '#f43f5e' }
      ],
      exclusiveDialogueTiers: [30, 50, 70, 90],
      chapterUnlock: { chapterId: 'chapter_she', minAffinity: 60 }
    },
    {
      id: 'time',
      name: '时光',
      title: '流淌的岁月',
      icon: '⏳',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
      description: '无声流逝的时光，记录着每一个值得铭记的瞬间。',
      personality: '沉稳、深邃、见证一切',
      preferredTags: ['precious', 'nostalgic', 'stationery'],
      preferredMaterials: ['watch', 'book', 'star', 'coffee'],
      affinityTiers: [
        { id: 'stranger', name: '陌生', min: 0, max: 20, icon: '🌫️', color: '#9ca3af' },
        { id: 'aware', name: '感知', min: 20, max: 40, icon: '🌅', color: '#f59e0b' },
        { id: 'understanding', name: '理解', min: 40, max: 60, icon: '🕐', color: '#8b5cf6' },
        { id: 'harmony', name: '共鸣', min: 60, max: 80, icon: '✨', color: '#6366f1' },
        { id: 'eternal', name: '永恒', min: 80, max: 100, icon: '🌟', color: '#4f46e5' }
      ],
      exclusiveDialogueTiers: [30, 50, 70, 90],
      chapterUnlock: { chapterId: 'chapter_time', minAffinity: 60 }
    },
    {
      id: 'self',
      name: '自己',
      title: '内心深处的声音',
      icon: '🪞',
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #cffafe, #a5f3fc)',
      description: '那个一直被忽略的声音，它知道你真正想要什么。',
      personality: '内省、敏感、追求真实',
      preferredTags: ['dreamy', 'all', 'nature'],
      preferredMaterials: ['music', 'cloud', 'snowflake', 'butterfly'],
      affinityTiers: [
        { id: 'stranger', name: '忽视', min: 0, max: 20, icon: '😶', color: '#9ca3af' },
        { id: 'aware', name: '觉察', min: 20, max: 40, icon: '🤔', color: '#f59e0b' },
        { id: 'dialogue', name: '对话', min: 40, max: 60, icon: '💬', color: '#06b6d4' },
        { id: 'acceptance', name: '接纳', min: 60, max: 80, icon: '🫂', color: '#0891b2' },
        { id: 'awakening', name: '觉醒', min: 80, max: 100, icon: '🌟', color: '#0e7490' }
      ],
      exclusiveDialogueTiers: [30, 50, 70, 90],
      chapterUnlock: { chapterId: 'chapter_self', minAffinity: 60 }
    }
  ])

  const characterAffinities = ref({
    she: 0,
    time: 0,
    self: 0
  })

  const affinityLog = ref([])

  const exclusiveDialogueUnlocked = ref({})

  const affinityNotifications = ref([])

  const characterExclusiveDialogues = ref({
    she: {
      30: [
        {
          id: 'she_exc_30_1',
          speaker: '回忆',
          text: '你有没有注意到，每次看樱花的时候，风都会刚好把花瓣吹到你面前？我总觉得，是樱花在帮你呢。',
          emotionChange: 5,
          trigger: null,
          isExclusive: true,
          affinityRequired: 30,
          characterId: 'she'
        }
      ],
      50: [
        {
          id: 'she_exc_50_1',
          speaker: '回忆',
          text: '其实...每次你说"好巧"的时候，我都偷偷笑了。哪有那么多巧合，不过是我在等你而已。',
          emotionChange: 6,
          trigger: null,
          isExclusive: true,
          affinityRequired: 50,
          characterId: 'she'
        }
      ],
      70: [
        {
          id: 'she_exc_70_1',
          speaker: '回忆',
          text: '你知道吗，围巾我织了三次才满意的。前两次都因为想你走神织错了...不过第三次的每一针，都织进了我想说的话。',
          emotionChange: 8,
          trigger: null,
          isExclusive: true,
          affinityRequired: 70,
          characterId: 'she'
        }
      ],
      90: [
        {
          id: 'she_exc_90_1',
          speaker: '回忆',
          text: '如果四季会轮回，如果记忆会消失，我唯一想留住的，就是你看着我的那个瞬间。因为在那个瞬间里，我看到了全世界。',
          emotionChange: 12,
          trigger: null,
          isExclusive: true,
          affinityRequired: 90,
          characterId: 'she'
        }
      ]
    },
    time: {
      30: [
        {
          id: 'time_exc_30_1',
          speaker: '旁白',
          text: '怀表的滴答声似乎慢了下来，你隐约感觉到，时间在为你停留片刻。',
          emotionChange: 4,
          trigger: null,
          isExclusive: true,
          affinityRequired: 30,
          characterId: 'time'
        }
      ],
      50: [
        {
          id: 'time_exc_50_1',
          speaker: '旁白',
          text: '你忽然意识到，这些被写进手账的瞬间，其实都是时间赠予的礼物——那些你以为平凡的日子，才是最珍贵的。',
          emotionChange: 6,
          trigger: null,
          isExclusive: true,
          affinityRequired: 50,
          characterId: 'time'
        }
      ],
      70: [
        {
          id: 'time_exc_70_1',
          speaker: '旁白',
          text: '时光的河流中，有些记忆像鹅卵石一样被冲刷得圆润，有些却像星辰一样永远不会褪色。而你现在记录的，正是后者。',
          emotionChange: 8,
          trigger: null,
          isExclusive: true,
          affinityRequired: 70,
          characterId: 'time'
        }
      ],
      90: [
        {
          id: 'time_exc_90_1',
          speaker: '旁白',
          text: '时间在这一刻凝固了——过去、现在和未来交汇于此。你终于明白，所谓的永恒，不是时间无穷，而是此刻无悔。',
          emotionChange: 12,
          trigger: null,
          isExclusive: true,
          affinityRequired: 90,
          characterId: 'time'
        }
      ]
    },
    self: {
      30: [
        {
          id: 'self_exc_30_1',
          speaker: '内心',
          text: '你有没有想过，为什么每次翻开这本手账，心跳都会快一拍？也许...你比自己以为的，更在意这些回忆。',
          emotionChange: 4,
          trigger: null,
          isExclusive: true,
          affinityRequired: 30,
          characterId: 'self'
        }
      ],
      50: [
        {
          id: 'self_exc_50_1',
          speaker: '内心',
          text: '你一直在回忆别人，但你有没有好好看过自己？那些勇敢说出的话、认真放下的素材，都是你变好的证明。',
          emotionChange: 6,
          trigger: null,
          isExclusive: true,
          affinityRequired: 50,
          characterId: 'self'
        }
      ],
      70: [
        {
          id: 'self_exc_70_1',
          speaker: '内心',
          text: '承认吧，你一直在害怕——害怕忘记，害怕被忘记。但正因为这份害怕，你才如此珍惜每一段故事。脆弱不是弱点，是你温柔的来源。',
          emotionChange: 8,
          trigger: null,
          isExclusive: true,
          affinityRequired: 70,
          characterId: 'self'
        }
      ],
      90: [
        {
          id: 'self_exc_90_1',
          speaker: '内心',
          text: '你终于听到了自己的声音——它说，无论结局如何，你都不会后悔。因为这段旅程中，你不仅找到了她，也找到了你自己。',
          emotionChange: 12,
          trigger: null,
          isExclusive: true,
          affinityRequired: 90,
          characterId: 'self'
        }
      ]
    }
  })

  const affinityHiddenChapters = ref([
    {
      id: 'chapter_she',
      title: '她的秘密花园',
      subtitle: '只有最亲密的人才能看到',
      description: '在她的心里，有一座只有你才能进入的花园...',
      teaser: '🌺 她的秘密，只对你一个人敞开',
      background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
      hidden: true,
      hiddenHint: '当她对你敞开心扉时，这里才会出现...',
      unlockConditions: [
        { type: 'affinity_reached', characterId: 'she', value: 60, description: '与「她」的好感度达到 60' }
      ],
      requiredMaterials: ['flower', 'heart', 'music'],
      emotionTarget: 60,
      scenes: ['scene_she_1']
    },
    {
      id: 'chapter_time',
      title: '时间之外',
      subtitle: '永恒的一刻',
      description: '当时间为你停留，你会看到什么？',
      teaser: '⏳ 在时间缝隙中，藏着被遗忘的真相',
      background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
      hidden: true,
      hiddenHint: '传说理解了时间真谛的人，能进入永恒的瞬间...',
      unlockConditions: [
        { type: 'affinity_reached', characterId: 'time', value: 60, description: '与「时光」的好感度达到 60' }
      ],
      requiredMaterials: ['watch', 'star', 'book'],
      emotionTarget: 70,
      scenes: ['scene_time_1']
    },
    {
      id: 'chapter_self',
      title: '镜中之境',
      subtitle: '与自己的对话',
      description: '面对内心深处的自己，你准备好了吗？',
      teaser: '🪞 最了解你的人，或许就是你自己',
      background: 'linear-gradient(135deg, #cffafe, #a5f3fc)',
      hidden: true,
      hiddenHint: '只有真正接纳自己的人，才能走进内心深处...',
      unlockConditions: [
        { type: 'affinity_reached', characterId: 'self', value: 60, description: '与「自己」的好感度达到 60' }
      ],
      requiredMaterials: ['music', 'cloud', 'butterfly'],
      emotionTarget: 65,
      scenes: ['scene_self_1']
    }
  ])

  const affinitySceneData = ref({
    scene_she_1: {
      id: 'scene_she_1',
      chapter: 'chapter_she',
      background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #fecdd3 100%)',
      timeOfDay: 'dusk',
      weather: 'clear',
      variants: {
        dusk_clear: {
          background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #fecdd3 100%)',
          ambience: 'intimate',
          dialogueTone: '亲昵'
        }
      },
      dialogues: [
        {
          id: 'd_she_1_1',
          speaker: '旁白',
          text: '你走进了一座从未见过的花园，满眼都是盛开的花，每一朵都带着她的气息。',
          emotionChange: 3,
          trigger: null
        },
        {
          id: 'd_she_1_2',
          speaker: '回忆',
          text: '你终于来了。这里是只属于我们两个人的地方...我种了很久呢。',
          emotionChange: 5,
          trigger: null
        },
        {
          id: 'd_she_1_3',
          speaker: '你',
          text: '这些都是...为我种的？',
          emotionChange: 4,
          trigger: 'material_required'
        },
        {
          id: 'd_she_1_4',
          speaker: '回忆',
          text: '每一朵花里，都藏着我想对你说的话。你听...',
          emotionChange: 5,
          trigger: null
        },
        {
          id: 'd_she_1_5',
          speaker: '回忆',
          text: '「谢谢你来找我。从今以后，我的花园永远为你敞开。」',
          emotionChange: 8,
          isKeyLine: true,
          trigger: 'chapter_complete'
        }
      ],
      requiredMaterial: 'flower',
      optionalMaterials: ['heart', 'music', 'star'],
      materialCombos: [
        {
          id: 'combo_she_garden',
          name: '心之花园',
          materials: ['flower', 'heart'],
          hiddenDialogue: {
            id: 'hd_she_1_1',
            speaker: '回忆',
            text: '她在花丛中转过身，夕阳洒在她的发梢，那一刻比任何画面都要美。',
            emotionChange: 8,
            isHidden: true
          },
          emotionBonus: 10,
          sceneFeedback: {
            type: 'particle',
            effect: 'petals',
            backgroundShift: 'linear-gradient(135deg, #fce7f3 0%, #fecdd3 50%, #fda4af 100%)'
          },
          description: '樱花+心：花园中最美的告白'
        },
        {
          id: 'combo_she_melody',
          name: '花间曲',
          materials: ['flower', 'music'],
          hiddenDialogue: {
            id: 'hd_she_1_2',
            speaker: '内心',
            text: '风吹过花园，花瓣随着旋律翩翩起舞。原来，幸福就是这样简单。',
            emotionChange: 6,
            isHidden: true
          },
          emotionBonus: 8,
          sceneFeedback: {
            type: 'particle',
            effect: 'notes',
            backgroundShift: null
          },
          description: '樱花+音符：花间飘荡的旋律'
        }
      ],
      nextScene: null
    },
    scene_time_1: {
      id: 'scene_time_1',
      chapter: 'chapter_time',
      background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)',
      timeOfDay: 'night',
      weather: 'star',
      variants: {
        night_star: {
          background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%)',
          ambience: 'timeless',
          dialogueTone: '超脱'
        }
      },
      dialogues: [
        {
          id: 'd_time_1_1',
          speaker: '旁白',
          text: '时间在这一刻仿佛停止了流动，你看见星光凝结成了沙漏的形状。',
          emotionChange: 3,
          trigger: null
        },
        {
          id: 'd_time_1_2',
          speaker: '旁白',
          text: '沙漏翻转的瞬间，你看到了过去与未来的交汇——那是你曾经错过的，和即将遇见的。',
          emotionChange: 4,
          trigger: null
        },
        {
          id: 'd_time_1_3',
          speaker: '你',
          text: '时间...原来你一直都在。',
          emotionChange: 4,
          trigger: 'material_required'
        },
        {
          id: 'd_time_1_4',
          speaker: '旁白',
          text: '怀表的指针开始逆时针旋转，星空中的每一颗星都是一个被封存的瞬间。',
          emotionChange: 5,
          trigger: null
        },
        {
          id: 'd_time_1_5',
          speaker: '内心',
          text: '「时间不会为任何人停留，但它会记住每一个用心度过的瞬间。」',
          emotionChange: 8,
          isKeyLine: true,
          trigger: 'chapter_complete'
        }
      ],
      requiredMaterial: 'watch',
      optionalMaterials: ['star', 'book', 'cloud'],
      materialCombos: [
        {
          id: 'combo_time_star',
          name: '星辰时刻',
          materials: ['watch', 'star'],
          hiddenDialogue: {
            id: 'hd_time_1_1',
            speaker: '旁白',
            text: '当怀表的滴答与星辰的闪烁同频共振，你听见了宇宙的心跳。',
            emotionChange: 7,
            isHidden: true
          },
          emotionBonus: 9,
          sceneFeedback: {
            type: 'particle',
            effect: 'stars',
            backgroundShift: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)'
          },
          description: '怀表+星星：时间的终极答案'
        },
        {
          id: 'combo_time_book',
          name: '永恒书页',
          materials: ['watch', 'book'],
          hiddenDialogue: {
            id: 'hd_time_1_2',
            speaker: '内心',
            text: '书页间的文字，是时间写给世人的情书。而你，是唯一读懂它的人。',
            emotionChange: 6,
            isHidden: true
          },
          emotionBonus: 7,
          sceneFeedback: {
            type: 'glow',
            effect: 'warm',
            backgroundShift: null
          },
          description: '怀表+书本：时间的情书'
        }
      ],
      nextScene: null
    },
    scene_self_1: {
      id: 'scene_self_1',
      chapter: 'chapter_self',
      background: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 50%, #67e8f9 100%)',
      timeOfDay: 'day',
      weather: 'clear',
      variants: {
        day_clear: {
          background: 'linear-gradient(135deg, #cffafe 0%, #a5f3fc 50%, #67e8f9 100%)',
          ambience: 'clarity',
          dialogueTone: '通透'
        }
      },
      dialogues: [
        {
          id: 'd_self_1_1',
          speaker: '内心',
          text: '你终于愿意停下脚步，好好听听自己的声音了。',
          emotionChange: 3,
          trigger: null
        },
        {
          id: 'd_self_1_2',
          speaker: '你',
          text: '我一直都在逃避吗？',
          emotionChange: 3,
          trigger: null
        },
        {
          id: 'd_self_1_3',
          speaker: '内心',
          text: '不是逃避，是还没准备好面对。但现在，你准备好了。',
          emotionChange: 4,
          trigger: 'material_required'
        },
        {
          id: 'd_self_1_4',
          speaker: '内心',
          text: '你比自己想象的更勇敢，也比自己以为的更温柔。承认这一点，没什么好害羞的。',
          emotionChange: 5,
          trigger: null
        },
        {
          id: 'd_self_1_5',
          speaker: '你',
          text: '「谢谢你，一直陪着我。从今以后，我会好好听自己的声音。」',
          emotionChange: 10,
          isKeyLine: true,
          trigger: 'chapter_complete'
        }
      ],
      requiredMaterial: 'music',
      optionalMaterials: ['cloud', 'butterfly', 'star'],
      materialCombos: [
        {
          id: 'combo_self_sky',
          name: '心之天空',
          materials: ['music', 'cloud'],
          hiddenDialogue: {
            id: 'hd_self_1_1',
            speaker: '内心',
            text: '云会散，天会晴。你的心也一样，再大的乌云，也遮不住本来的澄澈。',
            emotionChange: 6,
            isHidden: true
          },
          emotionBonus: 8,
          sceneFeedback: {
            type: 'particle',
            effect: 'clouds',
            backgroundShift: null
          },
          description: '音符+云朵：内心的天空'
        },
        {
          id: 'combo_self_freedom',
          name: '破茧成蝶',
          materials: ['music', 'butterfly'],
          hiddenDialogue: {
            id: 'hd_self_1_2',
            speaker: '内心',
            text: '每一个不自信的瞬间，都是蝴蝶破茧前的等待。你已经在路上了。',
            emotionChange: 7,
            isHidden: true
          },
          emotionBonus: 9,
          sceneFeedback: {
            type: 'animation',
            effect: 'flutter',
            backgroundShift: 'linear-gradient(135deg, #cffafe 0%, #fce7f3 50%, #a5f3fc 100%)'
          },
          description: '音符+蝴蝶：破茧的勇气'
        }
      ],
      nextScene: null
    }
  })

  const currentChapter = computed(() => {
    return chapters.value.find(c => c.id === currentChapterId.value)
  })

  const currentScene = computed(() => {
    return scenes.value[currentSceneId.value] || null
  })

  const currentEnvironmentVariant = computed(() => {
    if (!currentScene.value?.variants) return null
    const variantKey = `${currentTimeOfDay.value}_${currentWeather.value}`
    return currentScene.value.variants[variantKey] || null
  })

  const effectiveSceneBackground = computed(() => {
    if (sceneBackgroundOverride.value) return sceneBackgroundOverride.value
    if (currentEnvironmentVariant.value?.background) return currentEnvironmentVariant.value.background
    return currentScene.value?.background || 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
  })

  const currentEnvironmentInfo = computed(() => {
    return {
      timeOfDay: currentTimeOfDay.value,
      weather: currentWeather.value,
      ambience: currentEnvironmentVariant.value?.ambience || 'neutral',
      dialogueTone: currentEnvironmentVariant.value?.dialogueTone || null,
      variant: currentEnvironmentVariant.value
    }
  })

  const activeHiddenDialogue = ref(null)

  const currentDialogue = computed(() => {
    if (activeHiddenDialogue.value) {
      return activeHiddenDialogue.value
    }
    if (!currentScene.value) return null
    return currentScene.value.dialogues[currentDialogueIndex.value] || null
  })

  const availableMaterials = computed(() => {
    if (!currentScene.value) return []
    const requiredMat = currentScene.value.requiredMaterial
    const sceneOptionals = currentScene.value.optionalMaterials || []
    const allIds = [...new Set([requiredMat, ...sceneOptionals])]
    return materials.value.filter(m => allIds.includes(m.id))
  })

  const currentSceneCombos = computed(() => {
    if (!currentScene.value?.materialCombos) return []
    return currentScene.value.materialCombos
  })

  const currentSceneTriggeredCombos = computed(() => {
    if (!currentSceneCombos.value.length) return []
    return currentSceneCombos.value.filter(combo => 
      triggeredCombos.value.includes(combo.id)
    )
  })

  const currentSceneOptionalMaterials = computed(() => {
    if (!currentScene.value?.optionalMaterials) {
      const unlockedHidden = hiddenMaterialsRegistry.value.filter(m =>
        newGamePlus.value.unlockedHiddenMaterialIds.includes(m.id)
      )
      return unlockedHidden
    }
    const baseOptionals = materials.value.filter(m =>
      currentScene.value.optionalMaterials.includes(m.id)
    )
    const unlockedHidden = hiddenMaterialsRegistry.value.filter(m =>
      newGamePlus.value.unlockedHiddenMaterialIds.includes(m.id) &&
      !currentScene.value.optionalMaterials.includes(m.id)
    )
    return [...baseOptionals, ...unlockedHidden]
  })

  const availableOptionalMaterials = computed(() => {
    if (!requiredMaterialPlaced.value) return []
    return currentSceneOptionalMaterials.value.filter(m => 
      !optionalMaterialsPlaced.value.some(p => p.id === m.id)
    )
  })

  const materialCategories = computed(() => {
    const categories = new Set(materials.value.map(m => m.category))
    return [{ id: 'all', name: '全部' }, ...Array.from(categories).map(c => ({
      id: c,
      name: c === 'nature' ? '🌿 自然' : '📝 文具'
    }))]
  })

  const materialTags = computed(() => {
    const tags = new Set()
    materials.value.forEach(m => m.tags.forEach(t => tags.add(t)))
    return Array.from(tags)
  })

  const filteredAvailableMaterials = computed(() => {
    let materials = availableMaterials.value
    if (activeMaterialFilter.value !== 'all') {
      materials = materials.filter(m => m.category === activeMaterialFilter.value)
    }
    return materials
  })

  const scenePlacedMaterialIds = computed(() => {
    const ids = []
    if (requiredMaterialPlaced.value && currentScene.value?.requiredMaterial) {
      ids.push(currentScene.value.requiredMaterial)
    }
    optionalMaterialsPlaced.value.forEach(p => ids.push(p.id))
    return ids
  })

  const sceneRecommendedMaterials = computed(() => {
    if (!currentScene.value) return { required: [], hiddenCombo: [], normalCombo: [], optional: [] }

    const result = {
      required: [],
      hiddenCombo: [],
      normalCombo: [],
      optional: []
    }

    const placedIds = scenePlacedMaterialIds.value
    const allSceneMaterialIds = new Set([
      currentScene.value.requiredMaterial,
      ...(currentScene.value.optionalMaterials || [])
    ])

    if (!requiredMaterialPlaced.value && currentScene.value.requiredMaterial) {
      const mat = getMaterialById(currentScene.value.requiredMaterial)
      if (mat) {
        result.required.push({
          ...mat,
          priority: 1,
          priorityLabel: '主线必放',
          reason: '推进剧情必需素材'
        })
      }
    }

    const untriggeredCombos = (currentScene.value.materialCombos || []).filter(
      combo => !triggeredCombos.value.includes(combo.id)
    )

    const addedHiddenIds = new Set()
    const addedNormalIds = new Set()

    for (const combo of untriggeredCombos) {
      const missingMaterials = combo.materials.filter(
        matId => !placedIds.includes(matId) && allSceneMaterialIds.has(matId)
      )

      if (missingMaterials.length === 0) continue

      for (const matId of missingMaterials) {
        const mat = getMaterialById(matId)
        if (!mat) continue
        if (placedIds.includes(matId)) continue

        if (combo.hiddenDialogue) {
          if (!addedHiddenIds.has(matId)) {
            result.hiddenCombo.push({
              ...mat,
              priority: 2,
              priorityLabel: '隐藏组合',
              reason: `可解锁「${combo.name}」隐藏对话`,
              comboName: combo.name,
              emotionBonus: combo.emotionBonus
            })
            addedHiddenIds.add(matId)
          }
        } else {
          if (!addedNormalIds.has(matId) && !addedHiddenIds.has(matId)) {
            result.normalCombo.push({
              ...mat,
              priority: 3,
              priorityLabel: '普通组合',
              reason: `可解锁「${combo.name}」`,
              comboName: combo.name,
              emotionBonus: combo.emotionBonus
            })
            addedNormalIds.add(matId)
          }
        }
      }
    }

    if (requiredMaterialPlaced.value && currentScene.value.optionalMaterials) {
      for (const matId of currentScene.value.optionalMaterials) {
        if (placedIds.includes(matId)) continue
        if (addedHiddenIds.has(matId) || addedNormalIds.has(matId)) continue

        const mat = getMaterialById(matId)
        if (mat) {
          result.optional.push({
            ...mat,
            priority: 4,
            priorityLabel: '可选素材',
            reason: '额外情绪加成素材',
            emotionBonus: mat.emotion
          })
        }
      }
    }

    result.hiddenCombo.sort((a, b) => (b.emotionBonus || 0) - (a.emotionBonus || 0))
    result.normalCombo.sort((a, b) => (b.emotionBonus || 0) - (a.emotionBonus || 0))
    result.optional.sort((a, b) => (b.emotion || 0) - (a.emotion || 0))

    return result
  })

  const allRecommendedMaterialIds = computed(() => {
    const rec = sceneRecommendedMaterials.value
    const ids = new Set()
    rec.required.forEach(m => ids.add(m.id))
    rec.hiddenCombo.forEach(m => ids.add(m.id))
    rec.normalCombo.forEach(m => ids.add(m.id))
    rec.optional.forEach(m => ids.add(m.id))
    return ids
  })

  const getMaterialPriorityInfo = (materialId) => {
    const rec = sceneRecommendedMaterials.value
    const all = [...rec.required, ...rec.hiddenCombo, ...rec.normalCombo, ...rec.optional]
    return all.find(m => m.id === materialId) || null
  }

  const hasPendingRecommendations = computed(() => {
    const rec = sceneRecommendedMaterials.value
    return rec.required.length > 0 || rec.hiddenCombo.length > 0 || rec.normalCombo.length > 0
  })

  const getMaterialUsageCount = (materialId) => {
    return materialUsageHistory.value[materialId] || 0
  }

  const setMaterialFilter = (filter) => {
    activeMaterialFilter.value = filter
  }

  const resetMaterialFilter = () => {
    activeMaterialFilter.value = 'all'
  }

  const canPlaceOptionalMaterial = computed(() => {
    return requiredMaterialPlaced.value && isWaitingForMaterial.value === false && availableOptionalMaterials.value.length > 0
  })

  const canProceed = computed(() => {
    if (!currentScene.value) return false
    if (isWaitingForMaterial.value) return false
    return currentDialogueIndex.value < currentScene.value.dialogues.length - 1
  })

  const emotionPercentage = computed(() => {
    return Math.min(100, Math.max(0, emotionValue.value))
  })

  const emotionTiers = [
    {
      id: 'calm',
      name: '平静',
      icon: '🌙',
      min: 0,
      max: 20,
      color: '#6b7280',
      gradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      bgTint: 'rgba(107, 114, 128, 0.08)',
      dialogueTone: '平淡',
      description: '平静如水，故事刚刚开始',
      chapterHint: '继续探索，收集更多回忆碎片'
    },
    {
      id: 'warm',
      name: '温暖',
      icon: '☀️',
      min: 20,
      max: 45,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      bgTint: 'rgba(245, 158, 11, 0.1)',
      dialogueTone: '温和',
      description: '淡淡的温暖涌上心头',
      chapterHint: '心情逐渐明朗，继续加油'
    },
    {
      id: 'tender',
      name: '温柔',
      icon: '🌸',
      min: 45,
      max: 65,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
      bgTint: 'rgba(236, 72, 153, 0.12)',
      dialogueTone: '柔和',
      description: '温柔的情愫在心中萌芽',
      chapterHint: '氛围渐入佳境，发现更多美好'
    },
    {
      id: 'heartbeat',
      name: '心动',
      icon: '💖',
      min: 65,
      max: 85,
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #fecdd3 0%, #fda4af 100%)',
      bgTint: 'rgba(244, 63, 94, 0.12)',
      dialogueTone: '激动',
      description: '心跳加速，仿佛回到了那个夏天',
      chapterHint: '离目标越来越近了，继续探索'
    },
    {
      id: 'touching',
      name: '感动',
      icon: '✨',
      min: 85,
      max: 100,
      color: '#a855f7',
      gradient: 'linear-gradient(135deg, #f3e8ff 0%, #c4b5fd 100%)',
      bgTint: 'rgba(168, 85, 247, 0.15)',
      dialogueTone: '深情',
      description: '心中满是温暖的回忆',
      chapterHint: '情绪高涨，即将达成目标！'
    },
    {
      id: 'overflow',
      name: '满溢',
      icon: '🌟',
      min: 100,
      max: 999,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde047 50%, #f0abfc 100%)',
      bgTint: 'rgba(245, 158, 11, 0.2)',
      dialogueTone: '炽热',
      description: '心弦颤动，所有的记忆都在发光',
      chapterHint: '情绪已满溢！你是最棒的！'
    }
  ]

  const currentEmotionTier = computed(() => {
    const value = emotionValue.value
    for (let i = emotionTiers.length - 1; i >= 0; i--) {
      if (value >= emotionTiers[i].min) {
        return emotionTiers[i]
      }
    }
    return emotionTiers[0]
  })

  const emotionTierProgress = computed(() => {
    const tier = currentEmotionTier.value
    const nextTierIndex = emotionTiers.findIndex(t => t.id === tier.id) + 1
    const nextTier = emotionTiers[nextTierIndex]
    
    if (!nextTier) {
      return 100
    }
    
    const range = nextTier.min - tier.min
    const progress = emotionValue.value - tier.min
    return Math.min(100, Math.max(0, (progress / range) * 100))
  })

  const emotionSceneTint = computed(() => {
    return currentEmotionTier.value.bgTint
  })

  const emotionDialogueStyle = computed(() => {
    const tier = currentEmotionTier.value
    return {
      tone: tier.dialogueTone,
      color: tier.color,
      tierId: tier.id
    }
  })

  const chapterEmotionProgress = computed(() => {
    const target = currentChapter.value?.emotionTarget || 100
    const current = emotionValue.value
    const percent = Math.min(100, (current / target) * 100)
    return {
      current,
      target,
      percent,
      remaining: Math.max(0, target - current),
      reached: current >= target
    }
  })

  const getMaterialById = (id) => {
    return materials.value.find(m => m.id === id)
  }

  const getChapterById = (id) => {
    return chapters.value.find(c => c.id === id)
  }

  const setEnvironment = (timeOfDay, weather) => {
    if (timeOfDay) currentTimeOfDay.value = timeOfDay
    if (weather) currentWeather.value = weather

    addEmotionLog('environment_change', 0, {
      timeOfDay: currentTimeOfDay.value,
      weather: currentWeather.value,
      sceneId: currentSceneId.value
    })

    showNotification(`环境变化：${getTimeOfDayLabel(currentTimeOfDay.value)} · ${getWeatherLabel(currentWeather.value)}`, 'info', 2000)
  }

  const getTimeOfDayLabel = (timeOfDay) => {
    const labels = {
      day: '白天',
      dusk: '黄昏',
      night: '夜晚'
    }
    return labels[timeOfDay] || timeOfDay
  }

  const getWeatherLabel = (weather) => {
    const labels = {
      clear: '晴朗',
      cloudy: '多云',
      rain: '雨天',
      snow: '下雪',
      star: '星空'
    }
    return labels[weather] || weather
  }

  const addEmotionLog = (type, amount, detail = {}) => {
    currentChapterLog.value.push({
      type,
      amount,
      sceneId: currentSceneId.value,
      timestamp: Date.now(),
      ...detail
    })
  }

  const recordBranchChoice = (choiceType, choiceData) => {
    if (!currentSceneId.value || !currentChapterId.value) return

    const entry = {
      chapterId: currentChapterId.value,
      sceneId: currentSceneId.value,
      choiceType,
      timestamp: Date.now(),
      emotionAtChoice: emotionValue.value,
      ...choiceData
    }

    currentPathSequence.value.push(entry)

    const sceneKey = currentSceneId.value
    if (!branchStats.value.sceneDecisionPoints[sceneKey]) {
      branchStats.value.sceneDecisionPoints[sceneKey] = {
        chapterId: currentChapterId.value,
        sceneId: currentSceneId.value,
        totalVisits: 0,
        choices: {}
      }
    }

    const decisionPoint = branchStats.value.sceneDecisionPoints[sceneKey]
    decisionPoint.totalVisits++

    const choiceKey = `${choiceType}:${choiceData.choiceId || choiceData.materialId || 'unknown'}`
    if (!decisionPoint.choices[choiceKey]) {
      decisionPoint.choices[choiceKey] = {
        choiceType,
        count: 0,
        emotionSum: 0,
        firstChosenAt: Date.now()
      }
    }
    const choiceStat = decisionPoint.choices[choiceKey]
    choiceStat.count++
    choiceStat.emotionSum += choiceData.emotionGain || 0

    const freqKey = `${currentChapterId.value}:${choiceType}:${choiceData.choiceId || choiceData.materialId || 'unknown'}`
    branchStats.value.choiceFrequency[freqKey] = (branchStats.value.choiceFrequency[freqKey] || 0) + 1

    saveBranchStats()
  }

  const recordSceneTransition = (fromSceneId, toSceneId) => {
    if (!fromSceneId || !toSceneId || fromSceneId === toSceneId) return

    const pathKey = `${fromSceneId}->${toSceneId}`
    branchStats.value.pathHeatmap[pathKey] = (branchStats.value.pathHeatmap[pathKey] || 0) + 1

    const chapterId = currentChapterId.value
    if (chapterId) {
      const chapterKey = `${fromSceneId}->${toSceneId}`
      if (!branchStats.value.chapterPathSummary[chapterId]) {
        branchStats.value.chapterPathSummary[chapterId] = {
          pathSequences: {},
          completionCount: 0,
          uniquePaths: 0,
          mostCommonPath: null
        }
      }
      const chSummary = branchStats.value.chapterPathSummary[chapterId]
      chSummary.pathSequences[chapterKey] = (chSummary.pathSequences[chapterKey] || 0) + 1
    }
  }

  const finalizeChapterPathStats = (chapterId) => {
    if (!chapterId) return

    const chapter = getChapterById(chapterId)
    if (!chapter) return

    const pathStr = currentPathSequence.value
      .filter(e => e.chapterId === chapterId)
      .map(e => `${e.sceneId}:${e.choiceType}:${e.choiceId || e.materialId || ''}`)
      .join('|')

    if (!pathStr) return

    if (!branchStats.value.chapterPathSummary[chapterId]) {
      branchStats.value.chapterPathSummary[chapterId] = {
        pathSequences: {},
        completionCount: 0,
        uniquePaths: 0,
        mostCommonPath: null
      }
    }

    const chSummary = branchStats.value.chapterPathSummary[chapterId]
    chSummary.completionCount++

    branchStats.value.pathHistory.push({
      chapterId,
      path: pathStr,
      pathLength: currentPathSequence.value.filter(e => e.chapterId === chapterId).length,
      finalEmotion: emotionValue.value,
      timestamp: Date.now()
    })

    chSummary.uniquePaths = new Set(
      branchStats.value.pathHistory
        .filter(p => p.chapterId === chapterId)
        .map(p => p.path)
    ).size

    const pathCounts = {}
    branchStats.value.pathHistory
      .filter(p => p.chapterId === chapterId)
      .forEach(p => {
        pathCounts[p.path] = (pathCounts[p.path] || 0) + 1
      })
    
    let maxCount = 0
    let mostCommon = null
    Object.entries(pathCounts).forEach(([path, count]) => {
      if (count > maxCount) {
        maxCount = count
        mostCommon = path
      }
    })
    chSummary.mostCommonPath = mostCommon ? { path: mostCommon, count: maxCount } : null

    saveBranchStats()
  }

  const getTopChoicePaths = (chapterId, limit = 5) => {
    const paths = branchStats.value.pathHistory.filter(p => p.chapterId === chapterId)
    const pathCounts = {}
    paths.forEach(p => {
      pathCounts[p.path] = (pathCounts[p.path] || 0) + 1
    })

    return Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([path, count]) => ({
        path,
        count,
        percentage: paths.length > 0 ? Math.round((count / paths.length) * 100) : 0
      }))
  }

  const getHotTransitions = (limit = 10) => {
    return Object.entries(branchStats.value.pathHeatmap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([pathKey, count]) => {
        const [from, to] = pathKey.split('->')
        return { from, to, count }
      })
  }

  const getSceneDecisionSummary = (sceneId) => {
    const dp = branchStats.value.sceneDecisionPoints[sceneId]
    if (!dp) return null

    const totalChoices = Object.values(dp.choices).reduce((sum, c) => sum + c.count, 0)
    const sortedChoices = Object.entries(dp.choices)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([key, stat]) => ({
        key,
        ...stat,
        percentage: totalChoices > 0 ? Math.round((stat.count / totalChoices) * 100) : 0,
        avgEmotion: stat.count > 0 ? Math.round(stat.emotionSum / stat.count) : 0
      }))

    return {
      sceneId,
      chapterId: dp.chapterId,
      totalVisits: dp.totalVisits,
      totalChoices,
      choices: sortedChoices
    }
  }

  const getChapterBranchOverview = (chapterId) => {
    const summary = branchStats.value.chapterPathSummary[chapterId]
    if (!summary) return null

    const chapter = getChapterById(chapterId)
    const sceneSummaries = (chapter?.scenes || []).map(sceneId => {
      const dp = branchStats.value.sceneDecisionPoints[sceneId]
      if (!dp) return null
      return {
        sceneId,
        totalVisits: dp.totalVisits,
        choiceCount: Object.keys(dp.choices).length,
        topChoice: Object.entries(dp.choices)
          .sort((a, b) => b[1].count - a[1].count)[0]
          ? {
              key: Object.entries(dp.choices).sort((a, b) => b[1].count - a[1].count)[0][0],
              ...Object.entries(dp.choices).sort((a, b) => b[1].count - a[1].count)[0][1]
            }
          : null
      }
    }).filter(Boolean)

    return {
      chapterId,
      completionCount: summary.completionCount,
      uniquePaths: summary.uniquePaths,
      mostCommonPath: summary.mostCommonPath,
      sceneSummaries,
      topPaths: getTopChoicePaths(chapterId)
    }
  }

  const saveBranchStats = () => {
    try {
      localStorage.setItem(BRANCH_STATS_KEY, JSON.stringify(branchStats.value))
    } catch (e) {
      console.error('Failed to save branch stats:', e)
    }
  }

  const loadBranchStats = () => {
    try {
      const saved = localStorage.getItem(BRANCH_STATS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        branchStats.value = {
          pathHistory: parsed.pathHistory || [],
          sceneDecisionPoints: parsed.sceneDecisionPoints || {},
          choiceFrequency: parsed.choiceFrequency || {},
          pathHeatmap: parsed.pathHeatmap || {},
          chapterPathSummary: parsed.chapterPathSummary || {},
          totalPlaythroughs: parsed.totalPlaythroughs || 0
        }
      }
    } catch (e) {
      console.error('Failed to load branch stats:', e)
    }
  }

  const resetBranchStats = () => {
    branchStats.value = {
      pathHistory: [],
      sceneDecisionPoints: {},
      choiceFrequency: {},
      pathHeatmap: {},
      chapterPathSummary: {},
      totalPlaythroughs: 0
    }
    currentPathSequence.value = []
    localStorage.removeItem(BRANCH_STATS_KEY)
  }

  const tutorialSteps = {
    'chapter-select': [
      {
        id: 'homeIntro',
        title: '欢迎来到文艺手账',
        content: '这是一本充满回忆的手账，通过选择素材、放置画布，你将一步步解锁属于自己的故事。',
        icon: '📖',
        highlight: null
      },
      {
        id: 'chapterCards',
        title: '章节选择',
        content: '点击章节卡片开始游戏。完成前一章才能解锁下一章，每一章都有独特的故事和素材。',
        icon: '📚',
        highlight: '.chapters-grid'
      },
      {
        id: 'gameActions',
        title: '存档与设置',
        content: '在这里你可以读取存档、继续上次进度，或者重新开始游戏。',
        icon: '💾',
        highlight: '.actions'
      }
    ],
    'game': [
      {
        id: 'dialogueAdvance',
        title: '对白推进',
        content: '点击对话框可以推进剧情。对白会以打字机效果显示，再次点击可以跳过动画。故事就在这些对话中慢慢展开...',
        icon: '💬',
        highlight: '.dialogue-wrapper'
      },
      {
        id: 'emotionMeter',
        title: '情绪值系统',
        content: '情绪值会随着剧情推进和素材放置而增长。情绪值越高，结局越美好。注意观察情绪条的变化！',
        icon: '💕',
        highlight: '.emotion-meter'
      },
      {
        id: 'materialSelect',
        title: '素材选择',
        content: '当剧情需要时，你需要从素材库中选择合适的素材。素材分为「必放」和「可选」，必放素材推进剧情，可选素材解锁组合。',
        icon: '🎨',
        highlight: '.material-panel'
      },
      {
        id: 'canvasPlace',
        title: '画布放置',
        content: '选中素材后，点击画布放置。放在画布中心区域可以获得「完美放置」加成，额外增加情绪值。',
        icon: '🖼️',
        highlight: '.canvas-wrapper'
      },
      {
        id: 'comboSystem',
        title: '素材组合',
        content: '特定的素材组合可以触发隐藏效果和额外对话。注意查看素材库中的「组合收集进度」，解锁所有组合吧！',
        icon: '🔮',
        highlight: '.combo-hints'
      },
      {
        id: 'endingRules',
        title: '结局形成规则',
        content: '游戏有多种结局：普通结局、好结局、特殊结局、完美结局等。结局由情绪值、完成章节数、收集的组合、隐藏对话等因素共同决定。探索不同的选择，发现所有结局吧！',
        icon: '🌟',
        highlight: null
      }
    ]
  }

  const getTutorialSteps = (page) => {
    return tutorialSteps[page] || []
  }

  const showTutorial = (page = 'chapter-select') => {
    tutorialState.value.showTutorial = true
    tutorialState.value.page = page
    tutorialState.value.currentStep = 0
  }

  const hideTutorial = () => {
    tutorialState.value.showTutorial = false
  }

  const nextTutorialStep = () => {
    const steps = getTutorialSteps(tutorialState.value.page)
    if (tutorialState.value.currentStep < steps.length - 1) {
      tutorialState.value.currentStep++
    } else {
      completeTutorial()
    }
  }

  const prevTutorialStep = () => {
    if (tutorialState.value.currentStep > 0) {
      tutorialState.value.currentStep--
    }
  }

  const setTutorialStep = (stepIndex) => {
    tutorialState.value.currentStep = stepIndex
  }

  const markTutorialStepCompleted = (stepId) => {
    if (tutorialState.value.stepsCompleted[stepId] !== undefined) {
      tutorialState.value.stepsCompleted[stepId] = true
      saveTutorialState()
    }
  }

  const completeTutorial = () => {
    tutorialState.value.completed = true
    tutorialState.value.showTutorial = false
    Object.keys(tutorialState.value.stepsCompleted).forEach(key => {
      tutorialState.value.stepsCompleted[key] = true
    })
    saveTutorialState()
  }

  const saveTutorialState = () => {
    try {
      localStorage.setItem(TUTORIAL_KEY, JSON.stringify(tutorialState.value))
    } catch (e) {
      console.error('Failed to save tutorial state:', e)
    }
  }

  const loadTutorialState = () => {
    try {
      const saved = localStorage.getItem(TUTORIAL_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        tutorialState.value = { ...tutorialState.value, ...parsed, showTutorial: false }
      }
    } catch (e) {
      console.error('Failed to load tutorial state:', e)
    }
  }

  const resetTutorial = () => {
    tutorialState.value = {
      completed: false,
      currentStep: 0,
      showTutorial: false,
      page: 'chapter-select',
      stepsCompleted: {
        homeIntro: false,
        dialogueAdvance: false,
        materialSelect: false,
        canvasPlace: false,
        comboSystem: false,
        endingRules: false
      }
    }
    localStorage.removeItem(TUTORIAL_KEY)
  }

  const shouldShowFirstTimeTutorial = () => {
    return !tutorialState.value.completed
  }

  const getCurrentTutorialStep = computed(() => {
    const steps = getTutorialSteps(tutorialState.value.page)
    return steps[tutorialState.value.currentStep] || null
  })

  const generateBranchStatsReport = () => {
    const allChapterOverviews = chapters.value
      .filter(ch => branchStats.value.chapterPathSummary[ch.id])
      .map(ch => getChapterBranchOverview(ch.id))
      .filter(Boolean)

    const hotTransitions = getHotTransitions()

    const popularChoices = Object.entries(branchStats.value.choiceFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key, count]) => {
        const [chapterId, choiceType, choiceId] = key.split(':')
        return { chapterId, choiceType, choiceId, count }
      })

    const sceneDecisionList = Object.keys(branchStats.value.sceneDecisionPoints)
      .map(sceneId => getSceneDecisionSummary(sceneId))
      .filter(Boolean)
      .sort((a, b) => b.totalVisits - a.totalVisits)

    return {
      totalPlaythroughs: branchStats.value.totalPlaythroughs,
      totalPathsRecorded: branchStats.value.pathHistory.length,
      allChapterOverviews,
      hotTransitions,
      popularChoices,
      sceneDecisionList,
      generatedAt: Date.now()
    }
  }

  const runtimeWarnings = ref([])
  const showRuntimeWarningModal = ref(false)

  const validateRuntimeData = () => {
    const fullResult = validateStoryData(
      chapters.value,
      scenes.value,
      endings.value,
      materials.value
    )
    runtimeWarnings.value = fullResult.map(w => ({
      severity: w.severity,
      message: w.message,
      code: w.code,
      category: w.category,
      targetId: w.targetId
    }))
    const errors = runtimeWarnings.value.filter(w => w.severity === 'error')
    const warnings = runtimeWarnings.value.filter(w => w.severity !== 'error')
    showRuntimeWarningModal.value = errors.length > 0
    return { errors, warnings, hasErrors: errors.length > 0 }
  }

  const dismissRuntimeWarning = () => {
    showRuntimeWarningModal.value = false
  }

  const startChapter = (chapterId) => {
    const chapter = getChapterById(chapterId)
    if (!chapter || !unlockedChapters.value.includes(chapterId)) return

    if (!chaptersStarted.value.includes(chapterId)) {
      chaptersStarted.value.push(chapterId)
    }

    currentChapterId.value = chapterId
    currentSceneId.value = chapter.scenes[0]
    currentDialogueIndex.value = 0
    placedMaterials.value = []
    isWaitingForMaterial.value = false
    requiredMaterialId.value = null
    gameCompleted.value = false
    currentEnding.value = null
    triggeredCombos.value = []
    pendingHiddenDialogues.value = []
    isShowingHiddenDialogue.value = false
    sceneBackgroundOverride.value = null
    activeSceneFeedback.value = null
    comboBonusTotal.value = 0
    optionalMaterialsPlaced.value = []
    requiredMaterialPlaced.value = false
    comboJustTriggered.value = null
    activeHiddenDialogue.value = null
    currentChapterLog.value = []
    dialogueHistory.value = []
    activeMaterialFilter.value = 'all'
    currentPathSequence.value = []
    materialPlacementSequence.value = []
    keyDialogueLines.value = []
    hiddenDialogueSequence.value = []

    emotionValue.value = newGamePlus.value.inheritedEmotion

    trackQuestEvent('start_chapter', { chapterId })

    const firstScene = scenes.value[chapter.scenes[0]]
    if (firstScene) {
      currentTimeOfDay.value = firstScene.timeOfDay || 'day'
      currentWeather.value = firstScene.weather || 'clear'
    } else {
      currentTimeOfDay.value = 'day'
      currentWeather.value = 'clear'
    }
  }

  const addToDialogueHistory = (dialogue) => {
    if (!dialogue) return
    dialogueHistory.value.push({
      ...dialogue,
      timestamp: Date.now()
    })
  }

  const setTypingSpeed = (speed) => {
    typingSpeed.value = Math.max(10, Math.min(200, speed))
  }

  const resetStats = () => {
    perfectPlacementCount.value = 0
    totalDialogueCount.value = 0
    positiveBonus.value = 0
  }

  const nextDialogue = () => {
    if (!currentScene.value) return

    if (activeHiddenDialogue.value) {
      addToDialogueHistory(activeHiddenDialogue.value)
      activeHiddenDialogue.value = null
      isShowingHiddenDialogue.value = false
      if (pendingHiddenDialogues.value.length > 0) {
        const nextHidden = pendingHiddenDialogues.value.shift()
        showHiddenDialogue(nextHidden)
      }
      return
    }

    if (pendingHiddenDialogues.value.length > 0) {
      const hiddenDialogue = pendingHiddenDialogues.value.shift()
      showHiddenDialogue(hiddenDialogue)
      return
    }

    const dialogue = currentDialogue.value
    if (!dialogue) return

    addToDialogueHistory(dialogue)

    if (dialogue.isKeyLine) {
      keyDialogueLines.value.push({
        dialogueId: dialogue.id,
        text: dialogue.text,
        speaker: dialogue.speaker,
        sceneId: currentSceneId.value,
        chapterId: currentChapterId.value,
        timestamp: Date.now()
      })
    }

    const baseEmotion = dialogue.emotionChange || 0
    const randomFluctuation = Math.floor(Math.random() * 3) - 1
    const finalEmotion = Math.max(0, baseEmotion + randomFluctuation)
    emotionValue.value += finalEmotion
    totalDialogueCount.value++
    if (randomFluctuation > 0) {
      positiveBonus.value += randomFluctuation
    }

    trackQuestEvent('emotion_change', {})
    updateTotalEmotionAccumulated()

    processDialogueAffinity(dialogue)
    addEmotionLog('dialogue', finalEmotion, {
      dialogueId: dialogue.id,
      speaker: dialogue.speaker,
      text: dialogue.text,
      baseEmotion,
      fluctuation: randomFluctuation
    })

    if (dialogue.trigger === 'material_required') {
      isWaitingForMaterial.value = true
      requiredMaterialId.value = currentScene.value.requiredMaterial
      requiredMaterialPlaced.value = false
      return
    } else if (dialogue.trigger === 'chapter_complete') {
      completeChapter()
      return
    } else if (dialogue.trigger === 'game_complete') {
      completeGame()
      return
    } else if (dialogue.trigger === 'set_environment' && dialogue.environment) {
      setEnvironment(dialogue.environment.timeOfDay, dialogue.environment.weather)
    }

    if (currentDialogueIndex.value < currentScene.value.dialogues.length - 1) {
      currentDialogueIndex.value++
    } else if (currentScene.value.nextScene) {
      const prevSceneId = currentSceneId.value
      if (!scenesCompleted.value.includes(prevSceneId)) {
        scenesCompleted.value.push(prevSceneId)
      }
      trackQuestEvent('complete_scene', { sceneId: prevSceneId })
      currentSceneId.value = currentScene.value.nextScene
      currentDialogueIndex.value = 0
      sceneBackgroundOverride.value = null
      activeSceneFeedback.value = null
      optionalMaterialsPlaced.value = []
      requiredMaterialPlaced.value = false
      comboJustTriggered.value = null

      const nextScene = scenes.value[currentScene.value.nextScene]
      if (nextScene) {
        currentTimeOfDay.value = nextScene.timeOfDay || 'day'
        currentWeather.value = nextScene.weather || 'clear'
      }

      recordSceneTransition(prevSceneId, currentScene.value.nextScene)
    } else {
      const prevSceneId = currentSceneId.value
      if (!scenesCompleted.value.includes(prevSceneId)) {
        scenesCompleted.value.push(prevSceneId)
      }
      trackQuestEvent('complete_scene', { sceneId: prevSceneId })
    }
  }

  const showHiddenDialogue = (hiddenDialogue) => {
    activeHiddenDialogue.value = { ...hiddenDialogue }
    isShowingHiddenDialogue.value = true

    trackQuestEvent('find_hidden', { hiddenDialogueId: hiddenDialogue.id, hiddenDialogueName: hiddenDialogue.title })

    hiddenDialogueSequence.value.push({
      dialogueId: hiddenDialogue.id,
      text: hiddenDialogue.text,
      speaker: hiddenDialogue.speaker,
      sceneId: currentSceneId.value,
      chapterId: currentChapterId.value,
      timestamp: Date.now()
    })

    const baseEmotion = hiddenDialogue.emotionChange || 0
    const randomFluctuation = Math.floor(Math.random() * 3)
    const finalEmotion = Math.max(0, baseEmotion + randomFluctuation)
    emotionValue.value += finalEmotion
    totalDialogueCount.value++
    if (randomFluctuation > 0) {
      positiveBonus.value += randomFluctuation
    }
    addEmotionLog('hidden_dialogue', finalEmotion, {
      speaker: hiddenDialogue.speaker,
      text: hiddenDialogue.text,
      isHidden: true
    })

    checkAchievementsByCategory(ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH)
  }

  const checkMaterialCombos = () => {
    if (!currentScene.value?.materialCombos) return []

    const scenePlacedIds = []
    if (requiredMaterialPlaced.value && currentScene.value.requiredMaterial) {
      scenePlacedIds.push(currentScene.value.requiredMaterial)
    }
    optionalMaterialsPlaced.value.forEach(p => {
      scenePlacedIds.push(p.id)
    })

    const triggered = []

    for (const combo of currentScene.value.materialCombos) {
      if (triggeredCombos.value.includes(combo.id)) continue

      const allMaterialsPresent = combo.materials.every(matId => scenePlacedIds.includes(matId))
      if (allMaterialsPresent) {
        triggered.push(combo)
      }
    }

    return triggered
  }

  const triggerCombo = (combo) => {
    if (triggeredCombos.value.includes(combo.id)) return null

    triggeredCombos.value.push(combo.id)
    comboBonusTotal.value += combo.emotionBonus || 0
    emotionValue.value += combo.emotionBonus || 0

    addEmotionLog('combo', combo.emotionBonus || 0, {
      comboId: combo.id,
      comboName: combo.name,
      comboDescription: combo.description,
      materials: combo.materials,
      hasHiddenDialogue: !!combo.hiddenDialogue
    })

    if (combo.hiddenDialogue) {
      pendingHiddenDialogues.value.push({ ...combo.hiddenDialogue })
    }

    if (combo.sceneFeedback) {
      activeSceneFeedback.value = combo.sceneFeedback
      if (combo.sceneFeedback.backgroundShift) {
        sceneBackgroundOverride.value = combo.sceneFeedback.backgroundShift
      }
    }

    if (combo.environmentChange) {
      setEnvironment(combo.environmentChange.timeOfDay, combo.environmentChange.weather)
    }

    recordBranchChoice('combo', {
      choiceId: combo.id,
      comboName: combo.name,
      emotionGain: combo.emotionBonus || 0,
      hasHiddenDialogue: !!combo.hiddenDialogue
    })

    comboJustTriggered.value = combo

    trackQuestEvent('trigger_combo', { comboId: combo.id, comboName: combo.name })
    updateTotalCombosTriggered()
    trackQuestEvent('emotion_change', {})
    updateTotalEmotionAccumulated()

    setTimeout(() => {
      if (comboJustTriggered.value?.id === combo.id) {
        comboJustTriggered.value = null
      }
    }, 4000)

    checkAchievementsByCategory(ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO)
    if (combo.hiddenDialogue) {
      checkAchievementsByCategory(ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH)
    }

    return {
      name: combo.name,
      bonus: combo.emotionBonus,
      description: combo.description
    }
  }

  const placeOptionalMaterial = (materialId, position, stageWidth = 800, stageHeight = 500) => {
    if (!canPlaceOptionalMaterial.value) return false
    if (optionalMaterialsPlaced.value.some(p => p.id === materialId)) return false

    const material = getMaterialById(materialId)
    if (!material) return false

    materialUsageHistory.value[materialId] = (materialUsageHistory.value[materialId] || 0) + 1

    const centerX = stageWidth / 2
    const centerY = stageHeight / 2
    const distance = Math.sqrt(
      Math.pow(position.x - centerX, 2) +
      Math.pow(position.y - centerY, 2)
    )
    const maxDistance = Math.sqrt(
      Math.pow(centerX, 2) + Math.pow(centerY, 2)
    )
    const distanceRatio = distance / maxDistance
    const isPerfect = distanceRatio < 0.4
    const placementBonus = isPerfect ? Math.ceil(material.emotion * 0.3) : 0

    materialPlacementSequence.value.push({
      materialId,
      isOptional: true,
      isPerfect,
      sceneId: currentSceneId.value,
      chapterId: currentChapterId.value,
      timestamp: Date.now()
    })

    optionalMaterialsPlaced.value.push({
      id: materialId,
      x: position.x,
      y: position.y,
      rotation: Math.random() * 20 - 10,
      isPerfect: isPerfect,
      isOptional: true
    })

    emotionValue.value += material.emotion + placementBonus
    if (isPerfect) {
      perfectPlacementCount.value++
    }

    processMaterialAffinity(materialId, isPerfect)

    addEmotionLog('material', material.emotion, {
      materialId,
      materialName: material.name,
      isOptional: true,
      isPerfect
    })
    if (placementBonus > 0) {
      addEmotionLog('perfect_bonus', placementBonus, {
        materialId,
        materialName: material.name
      })
    }

    const newlyTriggered = checkMaterialCombos()
    const comboResults = newlyTriggered.map(combo => triggerCombo(combo)).filter(Boolean)

    recordBranchChoice('optional_material', {
      materialId,
      materialName: material.name,
      choiceId: materialId,
      isPerfect,
      emotionGain: material.emotion + placementBonus
    })

    trackQuestEvent('place_material', { materialId, isOptional: true, isPerfect })
    trackQuestEvent('emotion_change', {})
    updateTotalEmotionAccumulated()

    return {
      success: true,
      isOptional: true,
      isPerfect: isPerfect,
      bonus: placementBonus,
      combosTriggered: comboResults
    }
  }

  const placeMaterial = (materialId, position, stageWidth = 800, stageHeight = 500) => {
    if (!isWaitingForMaterial.value) {
      return placeOptionalMaterial(materialId, position, stageWidth, stageHeight)
    }

    if (requiredMaterialId.value !== materialId) return false

    const material = getMaterialById(materialId)
    if (!material) return false

    materialUsageHistory.value[materialId] = (materialUsageHistory.value[materialId] || 0) + 1

    const centerX = stageWidth / 2
    const centerY = stageHeight / 2
    const distance = Math.sqrt(
      Math.pow(position.x - centerX, 2) +
      Math.pow(position.y - centerY, 2)
    )
    const maxDistance = Math.sqrt(
      Math.pow(centerX, 2) + Math.pow(centerY, 2)
    )
    const distanceRatio = distance / maxDistance
    const isPerfect = distanceRatio < 0.4
    const placementBonus = isPerfect ? Math.ceil(material.emotion * 0.5) : 0

    materialPlacementSequence.value.push({
      materialId,
      isOptional: false,
      isPerfect,
      sceneId: currentSceneId.value,
      chapterId: currentChapterId.value,
      timestamp: Date.now()
    })

    placedMaterials.value.push({
      id: materialId,
      x: position.x,
      y: position.y,
      rotation: Math.random() * 20 - 10,
      isPerfect: isPerfect
    })

    emotionValue.value += material.emotion + placementBonus
    if (isPerfect) {
      perfectPlacementCount.value++
    }

    addEmotionLog('material', material.emotion, {
      materialId,
      materialName: material.name,
      isOptional: false,
      isPerfect
    })
    if (placementBonus > 0) {
      addEmotionLog('perfect_bonus', placementBonus, {
        materialId,
        materialName: material.name
      })
    }

    requiredMaterialPlaced.value = true
    isWaitingForMaterial.value = false
    requiredMaterialId.value = null

    processMaterialAffinity(materialId, isPerfect)

    const newlyTriggered = checkMaterialCombos()
    const comboResults = newlyTriggered.map(combo => triggerCombo(combo)).filter(Boolean)

    recordBranchChoice('required_material', {
      materialId,
      materialName: material.name,
      choiceId: materialId,
      isPerfect,
      emotionGain: material.emotion + placementBonus
    })

    trackQuestEvent('place_material', { materialId, isOptional: false, isPerfect })
    trackQuestEvent('emotion_change', {})
    updateTotalEmotionAccumulated()

    if (currentDialogueIndex.value < currentScene.value.dialogues.length - 1) {
      currentDialogueIndex.value++
    } else if (currentScene.value.nextScene) {
      const prevSceneId = currentSceneId.value
      if (!scenesCompleted.value.includes(prevSceneId)) {
        scenesCompleted.value.push(prevSceneId)
      }
      trackQuestEvent('complete_scene', { sceneId: prevSceneId })
      currentSceneId.value = currentScene.value.nextScene
      currentDialogueIndex.value = 0
      sceneBackgroundOverride.value = null
      activeSceneFeedback.value = null
      optionalMaterialsPlaced.value = []
      requiredMaterialPlaced.value = false
      comboJustTriggered.value = null

      const nextScene = scenes.value[currentScene.value.nextScene]
      if (nextScene) {
        currentTimeOfDay.value = nextScene.timeOfDay || 'day'
        currentWeather.value = nextScene.weather || 'clear'
      }

      recordSceneTransition(prevSceneId, currentScene.value.nextScene)
    } else {
      const prevSceneId = currentSceneId.value
      if (!scenesCompleted.value.includes(prevSceneId)) {
        scenesCompleted.value.push(prevSceneId)
      }
      trackQuestEvent('complete_scene', { sceneId: prevSceneId })
    }

    return {
      success: true,
      isPerfect: isPerfect,
      bonus: placementBonus,
      combosTriggered: comboResults
    }
  }

  const dismissComboNotification = () => {
    comboJustTriggered.value = null
  }

  const completeChapter = () => {
    const chapter = currentChapter.value
    if (!chapter) return

    if (!completedChapters.value.includes(chapter.id)) {
      completedChapters.value.push(chapter.id)
    }

    const emotionBreakdown = { dialogue: 0, hidden_dialogue: 0, material: 0, perfect_bonus: 0, combo: 0 }
    currentChapterLog.value.forEach(entry => {
      if (emotionBreakdown[entry.type] !== undefined) {
        emotionBreakdown[entry.type] += entry.amount
      }
    })

    const chapterScenes = chapter.scenes || []
    const allCombos = []
    chapterScenes.forEach(sceneId => {
      const scene = scenes.value[sceneId]
      if (scene?.materialCombos) {
        scene.materialCombos.forEach(combo => {
          allCombos.push({
            id: combo.id,
            name: combo.name,
            description: combo.description,
            materials: combo.materials,
            emotionBonus: combo.emotionBonus || 0,
            hasHiddenDialogue: !!combo.hiddenDialogue,
            sceneId,
            triggered: triggeredCombos.value.includes(combo.id)
          })
        })
      }
    })

    const materialChoices = currentChapterLog.value
      .filter(e => e.type === 'material')
      .map(e => ({
        sceneId: e.sceneId,
        materialId: e.materialId,
        materialName: e.materialName,
        isOptional: e.isOptional,
        isPerfect: e.isPerfect
      }))

    const totalEmotion = Object.values(emotionBreakdown).reduce((a, b) => a + b, 0)
    const triggeredComboCount = allCombos.filter(c => c.triggered).length
    const totalComboCount = allCombos.length
    const isPerfect = totalEmotion >= (chapter.emotionTarget || 0) && triggeredComboCount === totalComboCount

    chapterCompletionDetails.value[chapter.id] = {
      chapterId: chapter.id,
      completedAt: Date.now(),
      totalEmotion,
      emotionTarget: chapter.emotionTarget || 0,
      emotionReached: totalEmotion >= (chapter.emotionTarget || 0),
      triggeredComboCount,
      totalComboCount,
      allCombosTriggered: triggeredComboCount === totalComboCount,
      isPerfect,
      perfectPlacementCount: perfectPlacementCount.value,
      materialPlacementSequence: [...materialPlacementSequence.value],
      keyDialogueLines: [...keyDialogueLines.value],
      hiddenDialogueCount: hiddenDialogueSequence.value.length
    }

    chapterScoreData.value[chapter.id] = {
      chapterId: chapter.id,
      completedAt: Date.now(),
      emotionBreakdown,
      totalEmotion,
      materialChoices,
      allCombos,
      triggeredComboCount,
      totalComboCount,
      emotionTarget: chapter.emotionTarget || 0,
      log: [...currentChapterLog.value],
      isPerfect
    }

    saveChapterScoreData()

    finalizeChapterPathStats(chapter.id)

    processChapterCompletionAffinity(chapter.id)

    trackQuestEvent('complete_chapter', { chapterId: chapter.id, isPerfect })
    trackQuestEvent('emotion_change', {})
    updateTotalEmotionAccumulated()

    checkAndUnlockChapters()

    checkAchievementsByCategory(ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION)
    checkAchievementsByCategory(ACHIEVEMENT_CATEGORIES.HIGH_EMOTION)
    checkAchievementsByCategory(ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO)
  }

  const evaluateEndingConditions = (finalScore, completedChapterCount, perfectRate) => {
    const conditions = {
      emotionValue: emotionValue.value,
      finalScore,
      completedChapterCount,
      perfectRate,
      allChaptersCompleted: completedChapterCount === 4,
      allChaptersPerfect: false,
      allCombosTriggered: false,
      allHiddenDialogues: false,
      allHiddenDialoguesFound: false,
      keyLinesFound: false,
      materialOrderMatch: false,
      seasonComboTriggered: false,
      totalHiddenDialogues: 0,
      foundHiddenDialogues: 0,
      totalCombos: 0,
      triggeredCombos: 0,
      triggeredComboIds: [],
      placedMaterialIds: [],
      currentCycle: newGamePlus.value.currentCycle,
      totalPlaythroughs: newGamePlus.value.totalPlaythroughs,
      hasInheritedEmotion: newGamePlus.value.inheritedEmotion > 0,
      inheritedEmotionAmount: newGamePlus.value.inheritedEmotion,
      hiddenMaterialsUnlocked: newGamePlus.value.unlockedHiddenMaterialIds.length,
      totalHiddenMaterials: hiddenMaterialsRegistry.value.length,
      allHiddenMaterialsUnlocked: newGamePlus.value.unlockedHiddenMaterialIds.length === hiddenMaterialsRegistry.value.length,
      discoveredEndingsCount: newGamePlus.value.discoveredEndingIds.length,
      allEndingsDiscovered: newGamePlus.value.discoveredEndingIds.length === endings.value.length,
      isNgpCycle: newGamePlus.value.currentCycle > 1,
      perfectCyclesCount: newGamePlus.value.perfectCycleHistory.length,
      hasPerfectCycle: newGamePlus.value.perfectCycleHistory.length > 0,
      unlockedAchievementsCount: crossCycleAchievements.value.filter(a => a.unlocked).length,
      totalAchievements: crossCycleAchievements.value.length,
      allAchievementsUnlocked: crossCycleAchievements.value.filter(a => a.unlocked).length === crossCycleAchievements.value.length
    }

    let totalHidden = 0
    let foundHidden = 0
    let totalCombos = 0
    let triggeredCombosCount = 0
    let allPerfect = true

    chapters.value.forEach(chapter => {
      const chapterHidden = getChapterTotalHiddenDialogues(chapter.id)
      const chapterTriggeredHidden = getChapterTriggeredHiddenDialogues(chapter.id)
      totalHidden += chapterHidden
      foundHidden += chapterTriggeredHidden

      const chapterTotalCombos = getChapterTotalCombos(chapter.id)
      const chapterTriggeredCombos = getChapterTriggeredCombos(chapter.id)
      totalCombos += chapterTotalCombos
      triggeredCombosCount += chapterTriggeredCombos

      const detail = chapterCompletionDetails.value[chapter.id]
      if (!detail || !detail.isPerfect) {
        allPerfect = false
      }
    })

    conditions.totalHiddenDialogues = totalHidden
    conditions.foundHiddenDialogues = foundHidden
    conditions.totalCombos = totalCombos
    conditions.triggeredCombos = triggeredCombosCount
    conditions.allCombosTriggered = totalCombos > 0 && triggeredCombosCount === totalCombos
    conditions.allHiddenDialogues = totalHidden > 0 && foundHidden === totalHidden
    conditions.allHiddenDialoguesFound = conditions.allHiddenDialogues
    conditions.allChaptersPerfect = allPerfect && completedChapterCount === 4
    conditions.keyLinesFound = keyDialogueLines.value.length >= 4

    const globalComboSet = buildGlobalTriggeredComboSet()
    conditions.triggeredComboIds = Array.from(globalComboSet)
    conditions.seasonComboTriggered = globalComboSet.has('combo4_full_four_seasons')

    conditions.placedMaterialIds = materialPlacementSequence.value.map(m => m.materialId)

    conditions.checkMaterialOrder = (orderList, strict = true) => {
      if (!orderList || !orderList.length) return false
      const uniqueMaterialIds = [...new Set(conditions.placedMaterialIds)]
      const hasAll = orderList.every(m => uniqueMaterialIds.includes(m))
      if (!hasAll) return false

      if (strict) {
        const filteredOrder = materialPlacementSequence.value
          .filter(m => orderList.includes(m.materialId))
          .map(m => m.materialId)

        let orderIndex = 0
        for (const matId of filteredOrder) {
          if (matId === orderList[orderIndex]) {
            orderIndex++
            if (orderIndex >= orderList.length) break
          }
        }
        return orderIndex === orderList.length
      } else {
        const placedIndices = orderList.map(id => conditions.placedMaterialIds.indexOf(id))
        for (let i = 1; i < placedIndices.length; i++) {
          if (placedIndices[i] === -1 || placedIndices[i] < placedIndices[i - 1]) return false
        }
        return true
      }
    }

    const seasonMaterials = ['flower', 'sun', 'leaf', 'snowflake']
    conditions.materialOrderMatch = conditions.checkMaterialOrder(seasonMaterials, true)

    return conditions
  }

  const checkSingleCondition = (conditions, key, expectedValue) => {
    const actualValue = conditions[key]

    if (typeof expectedValue === 'boolean') {
      return !!actualValue === expectedValue
    }

    if (typeof expectedValue === 'number') {
      if (key === 'emotionValue' || key.startsWith('min')) {
        const fieldName = key.startsWith('min') ? key.slice(3).charAt(0).toLowerCase() + key.slice(4) : key
        const val = key.startsWith('min') ? conditions[fieldName] : actualValue
        return typeof val === 'number' && val >= expectedValue
      }
      return actualValue >= expectedValue
    }

    if (Array.isArray(expectedValue)) {
      if (key === 'materialOrder') {
        return conditions.checkMaterialOrder ? conditions.checkMaterialOrder(expectedValue, conditions.orderStrict ?? true) : false
      }
      if (Array.isArray(actualValue)) {
        return expectedValue.every(v => actualValue.includes(v))
      }
    }

    return actualValue === expectedValue
  }

  const checkEndingTriggerConditions = (ending, conditions) => {
    if (!ending.triggerConditions) return true

    const triggerConditions = ending.triggerConditions

    if (triggerConditions.allOfTheAbove) {
      const otherEndings = endings.value.filter(e => e.triggerConditions && e.id !== ending.id)
      for (const other of otherEndings) {
        if (!checkEndingTriggerConditions(other, conditions)) return false
      }
    }

    for (const [key, expectedValue] of Object.entries(triggerConditions)) {
      if (key === 'allOfTheAbove') continue

      if (key === 'materialOrder') {
        const strict = triggerConditions.orderStrict ?? true
        if (!conditions.checkMaterialOrder || !conditions.checkMaterialOrder(expectedValue, strict)) {
          return false
        }
        continue
      }

      if (key === 'orderStrict') continue

      if (!checkSingleCondition(conditions, key, expectedValue)) {
        return false
      }
    }

    if (typeof ending.minEmotion === 'number' && conditions.emotionValue < ending.minEmotion) {
      return false
    }

    return true
  }

  const selectEnding = (conditions) => {
    const orderedEndingTypes = ['eternal', 'ngp_perfect', 'true', 'ngp_special', 'perfect_path', 'dialogue_master', 'time_sequence', 'special', 'good', 'normal']

    for (const type of orderedEndingTypes) {
      const ending = endings.value.find(e => e.type === type)
      if (!ending) continue

      if (checkEndingTriggerConditions(ending, conditions)) {
        return ending
      }
    }

    return endings.value.find(e => e.type === 'normal')
  }

  const completeGame = () => {
    if (gameCompleted.value) return
    gameCompleted.value = true

    if (currentChapterId.value && !completedChapters.value.includes(currentChapterId.value)) {
      completeChapter()
    }

    branchStats.value.totalPlaythroughs++
    saveBranchStats()

    newGamePlus.value.totalPlaythroughs++

    const endingId = currentEnding.value?.id
    if (endingId && !newGamePlus.value.discoveredEndingIds.includes(endingId)) {
      newGamePlus.value.discoveredEndingIds.push(endingId)
      newGamePlus.value.endingDiscoverTimes[endingId] = Date.now()
    }

    const allPerfect = chapters.value.every(ch => {
      const detail = chapterCompletionDetails.value[ch.id]
      return detail?.isPerfect
    })
    if (allPerfect && completedChapters.value.length === chapters.value.length) {
      const cycleRecord = {
        cycle: newGamePlus.value.currentCycle,
        finalEmotion: emotionValue.value,
        completedAt: Date.now(),
        endingId
      }
      newGamePlus.value.perfectCycleHistory.push(cycleRecord)
    }

    saveNewGamePlusData()

    const completedChapterCount = completedChapters.value.length
    const totalMaterialCount = Object.values(scenes.value).filter(s => s.requiredMaterial).length
    const placedCount = placedMaterials.value.length
    const perfectRate = totalMaterialCount > 0 ? perfectPlacementCount.value / totalMaterialCount : 0

    const maxPossibleEmotion = 310
    const baseScore = (emotionValue.value / maxPossibleEmotion) * 100
    const chapterBonus = (completedChapterCount / 4) * 20
    const perfectBonus = perfectRate * 15
    const materialBonus = (placedCount / Math.max(1, totalMaterialCount)) * 10
    const finalScore = Math.min(100, baseScore + chapterBonus + perfectBonus + materialBonus)

    const endingConditions = evaluateEndingConditions(finalScore, completedChapterCount, perfectRate)
    let ending = selectEnding(endingConditions)

    const summary = generatePlaySummary(finalScore, completedChapterCount, perfectRate)
    const materialReview = generateMaterialReview()
    const branchStatus = generateBranchStatus()
    const branchStatsReport = generateBranchStatsReport()
    const nextGoals = generateNextGoals(finalScore, completedChapterCount, branchStatus)

    clearNewlyUnlockedAchievements()
    checkCrossCycleAchievements(ending)
    checkAchievements()
    checkHiddenMaterialUnlockConditions()

    const ngpNextGoals = generateNgpNextGoals(ending, endingConditions)
    const ngpSummary = getNgpSummary()

    if (ending) {
      ending = {
        ...ending,
        stats: {
          finalScore: Math.round(finalScore),
          emotionValue: emotionValue.value,
          completedChapters: completedChapterCount,
          placedMaterials: placedCount,
          perfectPlacements: perfectPlacementCount.value,
          positiveBonus: positiveBonus.value
        },
        endingConditions,
        summary,
        materialReview,
        branchStatus,
        branchStatsReport,
        nextGoals,
        ngpSummary,
        ngpNextGoals,
        isNgpAvailable: true,
        estimatedInheritance: calculateInheritedEmotion(emotionValue.value, newGamePlus.value.currentCycle)
      }
    }

    currentEnding.value = ending
    autoSave()
  }

  const buildGlobalTriggeredComboSet = () => {
    const globalSet = new Set()
    Object.values(chapterScoreData.value).forEach(scoreData => {
      if (scoreData?.allCombos) {
        scoreData.allCombos.forEach(combo => {
          if (combo.triggered) globalSet.add(combo.id)
        })
      }
    })
    triggeredCombos.value.forEach(comboId => {
      globalSet.add(comboId)
    })
    return globalSet
  }

  const calculateInheritedEmotion = (finalEmotion, cycle) => {
    const config = newGamePlus.value.emotionInheritanceConfig
    if (!config.enabled) return 0
    if (finalEmotion < config.minFinalEmotionForInheritance) return 0

    const ratio = Math.min(
      config.maxRatio,
      config.baseRatio + (cycle - 1) * config.bonusRatioPerCycle
    )

    const achievementBonus = crossCycleAchievements.value
      .filter(a => a.unlocked && a.reward.type === 'inheritance_ratio')
      .reduce((sum, a) => sum + a.reward.value, 0)

    const finalRatio = Math.min(config.maxRatio + achievementBonus, ratio + achievementBonus)
    const maxBonus = crossCycleAchievements.value
      .filter(a => a.unlocked && a.reward.type === 'max_inheritance')
      .reduce((sum, a) => sum + a.reward.value, 0)

    const baseInherited = Math.floor(finalEmotion * finalRatio)
    const emotionBonus = crossCycleAchievements.value
      .filter(a => a.unlocked && a.reward.type === 'emotion_bonus')
      .reduce((sum, a) => sum + a.reward.value, 0)

    return Math.min(
      config.maxInheritedEmotion + maxBonus,
      baseInherited + emotionBonus
    )
  }

  const getEffectiveInheritanceRatio = () => {
    const config = newGamePlus.value.emotionInheritanceConfig
    const cycle = newGamePlus.value.currentCycle
    const baseRatio = Math.min(
      config.maxRatio,
      config.baseRatio + (cycle - 1) * config.bonusRatioPerCycle
    )
    const achievementBonus = crossCycleAchievements.value
      .filter(a => a.unlocked && a.reward.type === 'inheritance_ratio')
      .reduce((sum, a) => sum + a.reward.value, 0)
    return Math.min(config.maxRatio + achievementBonus, baseRatio + achievementBonus)
  }

  const getUnlockedHiddenMaterials = () => {
    return hiddenMaterialsRegistry.value.filter(mat =>
      newGamePlus.value.unlockedHiddenMaterialIds.includes(mat.id)
    )
  }

  const isMaterialUnlocked = (materialId) => {
    const mat = hiddenMaterialsRegistry.value.find(m => m.id === materialId)
    if (!mat) return true
    return newGamePlus.value.unlockedHiddenMaterialIds.includes(materialId)
  }

  const checkHiddenMaterialUnlockConditions = () => {
    const newlyUnlocked = []

    hiddenMaterialsRegistry.value.forEach(mat => {
      if (newGamePlus.value.unlockedHiddenMaterialIds.includes(mat.id)) return

      let unlocked = false
      const ngp = newGamePlus.value

      switch (mat.unlockCondition) {
        case 'complete_cycle_1':
          unlocked = ngp.totalPlaythroughs >= 1
          break
        case 'all_endings_discovered':
          unlocked = ngp.discoveredEndingIds.length >= 5
          break
        case 'perfect_cycle':
          unlocked = ngp.perfectCycleHistory.length >= 1
          break
        case 'true_ending':
          unlocked = ngp.discoveredEndingIds.includes('ending_true')
          break
        case 'chapter4_perfect':
          const ch4Detail = chapterCompletionDetails.value['chapter4']
          unlocked = ch4Detail?.isPerfect || false
          break
        case 'all_hidden_dialogues':
          const totalHidden = chapters.value.reduce((sum, ch) =>
            sum + getChapterTotalHiddenDialogues(ch.id), 0)
          const foundHidden = chapters.value.reduce((sum, ch) =>
            sum + getChapterTriggeredHiddenDialogues(ch.id), 0)
          unlocked = totalHidden > 0 && foundHidden >= totalHidden
          break
        default:
          unlocked = ngp.currentCycle >= mat.unlockCycle
      }

      if (unlocked) {
        ngp.unlockedHiddenMaterialIds.push(mat.id)
        ngp.hiddenMaterialUnlockTimes[mat.id] = Date.now()
        newlyUnlocked.push(mat)
      }
    })

    if (newlyUnlocked.length > 0) {
      const names = newlyUnlocked.map(m => `「${m.name}」`).join('、')
      showNgpNotification(`🎁 解锁隐藏素材：${names}`, 'success', 4000)
      saveNewGamePlusData()
    }

    return newlyUnlocked
  }

  const getAchievementState = () => ({
    chapters: chapters.value,
    completedChapters: completedChapters.value,
    chapterCompletionDetails: chapterCompletionDetails.value,
    newGamePlus: newGamePlus.value,
    emotionValue: emotionValue.value,
    scenes: scenes.value,
    perfectPlacementCount: perfectPlacementCount.value,
    materialUsageHistory: materialUsageHistory.value,
    unlockedChapters: unlockedChapters.value
  })

  const checkAchievements = (checkOnlyCategory = null) => {
    const newlyUnlocked = []
    const state = getAchievementState()

    crossCycleAchievements.value.forEach(achievement => {
      if (achievement.unlocked) return
      if (checkOnlyCategory && achievement.category !== checkOnlyCategory) return
      if (!achievement.checkCondition) return

      try {
        if (achievement.checkCondition(state)) {
          unlockAchievement(achievement, newlyUnlocked)
        }
      } catch (e) {
        console.error('Error checking achievement:', achievement.id, e)
      }
    })

    return newlyUnlocked
  }

  const unlockAchievement = (achievement, newlyUnlockedList = null) => {
    if (achievement.unlocked) return null

    achievement.unlocked = true
    achievement.unlockedAt = Date.now()

    const ngp = newGamePlus.value
    if (achievement.reward.type === 'unlock_material') {
      const matId = achievement.reward.value
      if (!ngp.unlockedHiddenMaterialIds.includes(matId)) {
        ngp.unlockedHiddenMaterialIds.push(matId)
        ngp.hiddenMaterialUnlockTimes[matId] = Date.now()
      }
    }

    showAchievementNotification(achievement)
    saveCrossCycleAchievements()
    saveNewGamePlusData()

    if (newlyUnlockedList) {
      newlyUnlockedList.push(achievement)
    }

    newlyUnlockedAchievements.value.push({
      ...achievement,
      unlockedAt: achievement.unlockedAt
    })

    return achievement
  }

  const showAchievementNotification = (achievement) => {
    const rarityInfo = ACHIEVEMENT_RARITY[achievement.rarity.toUpperCase()] || ACHIEVEMENT_RARITY.COMMON
    achievementNotification.value = {
      id: Date.now(),
      visible: true,
      icon: achievement.icon,
      name: achievement.name,
      description: achievement.description,
      rarity: achievement.rarity,
      rarityInfo,
      reward: achievement.reward
    }

    showNgpNotification(
      `🏆 成就解锁：${achievement.name}`,
      'success',
      4000
    )

    setTimeout(() => {
      if (achievementNotification.value) {
        achievementNotification.value.visible = false
      }
    }, 5000)
  }

  const checkAchievementsByCategory = (category) => {
    return checkAchievements(category)
  }

  const getAchievementsByCategory = (category) => {
    return crossCycleAchievements.value.filter(a => a.category === category)
  }

  const getAchievementRarityInfo = (rarityId) => {
    return ACHIEVEMENT_RARITY[rarityId.toUpperCase()] || ACHIEVEMENT_RARITY.COMMON
  }

  const getAchievementCategoryInfo = (categoryId = null) => {
    const allCategories = {
      [ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION]: {
        id: ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION,
        name: '章节完成',
        icon: '📚',
        description: '完成各章节解锁的成就'
      },
      [ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO]: {
        id: ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO,
        name: '素材组合',
        icon: '🎨',
        description: '触发素材组合解锁的成就'
      },
      [ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH]: {
        id: ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH,
        name: '隐藏分支',
        icon: '🔮',
        description: '发现隐藏内容解锁的成就'
      },
      [ACHIEVEMENT_CATEGORIES.HIGH_EMOTION]: {
        id: ACHIEVEMENT_CATEGORIES.HIGH_EMOTION,
        name: '高情绪通关',
        icon: '💕',
        description: '高情绪值通关解锁的成就'
      },
      [ACHIEVEMENT_CATEGORIES.CROSS_CYCLE]: {
        id: ACHIEVEMENT_CATEGORIES.CROSS_CYCLE,
        name: '跨周目',
        icon: '🔄',
        description: '多周目游玩解锁的成就'
      }
    }
    if (categoryId) {
      return allCategories[categoryId] || allCategories[ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION]
    }
    return allCategories
  }

  const getAchievementStats = () => {
    const total = crossCycleAchievements.value.length
    const unlocked = crossCycleAchievements.value.filter(a => a.unlocked).length
    const byCategory = {}

    Object.values(ACHIEVEMENT_CATEGORIES).forEach(cat => {
      const catAchievements = crossCycleAchievements.value.filter(a => a.category === cat)
      byCategory[cat] = {
        total: catAchievements.length,
        unlocked: catAchievements.filter(a => a.unlocked).length
      }
    })

    const chapterStats = byCategory[ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION] || { total: 0, unlocked: 0 }
    const comboStats = byCategory[ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO] || { total: 0, unlocked: 0 }
    const hiddenStats = byCategory[ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH] || { total: 0, unlocked: 0 }
    const emotionStats = byCategory[ACHIEVEMENT_CATEGORIES.HIGH_EMOTION] || { total: 0, unlocked: 0 }

    const rarityCounts = {}
    Object.keys(ACHIEVEMENT_RARITY).forEach(rarity => {
      rarityCounts[rarity.toLowerCase()] = crossCycleAchievements.value.filter(
        a => a.unlocked && a.rarity === rarity.toLowerCase()
      ).length
    })

    return {
      total,
      unlocked,
      percent: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      chapterTotal: chapterStats.total,
      chapterCompleted: chapterStats.unlocked,
      comboTotal: comboStats.total,
      comboCompleted: comboStats.unlocked,
      hiddenTotal: hiddenStats.total,
      hiddenCompleted: hiddenStats.unlocked,
      emotionTotal: emotionStats.total,
      emotionCompleted: emotionStats.unlocked,
      commonCount: rarityCounts.common || 0,
      rareCount: rarityCounts.rare || 0,
      epicCount: rarityCounts.epic || 0,
      legendaryCount: rarityCounts.legendary || 0,
      byCategory
    }
  }

  const getRecentlyUnlockedAchievements = (limit = 5) => {
    return crossCycleAchievements.value
      .filter(a => a.unlocked && a.unlockedAt)
      .sort((a, b) => b.unlockedAt - a.unlockedAt)
      .slice(0, limit)
  }

  const clearNewlyUnlockedAchievements = () => {
    newlyUnlockedAchievements.value = []
  }

  const checkCrossCycleAchievements = (endingData) => {
    const newlyUnlocked = checkAchievements()

    if (newlyUnlocked.length > 0) {
      saveCrossCycleAchievements()
      saveNewGamePlusData()
    }

    return newlyUnlocked
  }

  const saveNewGamePlusData = () => {
    try {
      localStorage.setItem(NEW_GAME_PLUS_KEY, JSON.stringify(newGamePlus.value))
      localStorage.setItem(HIDDEN_MATERIALS_KEY, JSON.stringify(
        newGamePlus.value.unlockedHiddenMaterialIds
      ))
    } catch (e) {
      console.error('Failed to save New Game+ data:', e)
    }
  }

  const loadNewGamePlusData = () => {
    try {
      const saved = localStorage.getItem(NEW_GAME_PLUS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        newGamePlus.value = {
          ...newGamePlus.value,
          ...parsed
        }
      }

      const savedMaterials = localStorage.getItem(HIDDEN_MATERIALS_KEY)
      if (savedMaterials) {
        newGamePlus.value.unlockedHiddenMaterialIds = JSON.parse(savedMaterials)
      }
    } catch (e) {
      console.error('Failed to load New Game+ data:', e)
    }
  }

  const saveCrossCycleAchievements = () => {
    try {
      localStorage.setItem(CYCLE_ACHIEVEMENTS_KEY, JSON.stringify(
        crossCycleAchievements.value.map(a => ({
          id: a.id,
          unlocked: a.unlocked,
          unlockedAt: a.unlockedAt
        }))
      ))
    } catch (e) {
      console.error('Failed to save cross-cycle achievements:', e)
    }
  }

  const loadCrossCycleAchievements = () => {
    try {
      const saved = localStorage.getItem(CYCLE_ACHIEVEMENTS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        parsed.forEach(saved => {
          const achievement = crossCycleAchievements.value.find(a => a.id === saved.id)
          if (achievement) {
            achievement.unlocked = saved.unlocked
            achievement.unlockedAt = saved.unlockedAt
          }
        })
      }
    } catch (e) {
      console.error('Failed to load cross-cycle achievements:', e)
    }
  }

  const startNewCycle = (keepProgress = true) => {
    const finalEmotion = emotionValue.value
    const currentCycle = newGamePlus.value.currentCycle
    const inheritedEmotion = calculateInheritedEmotion(finalEmotion, currentCycle)

    newGamePlus.value.currentCycle++
    newGamePlus.value.maxCycleUnlocked = Math.max(
      newGamePlus.value.maxCycleUnlocked,
      newGamePlus.value.currentCycle
    )
    newGamePlus.value.inheritedEmotion = inheritedEmotion

    clearNewlyUnlockedAchievements()
    checkHiddenMaterialUnlockConditions()

    saveNewGamePlusData()

    resetGame()

    if (keepProgress) {
      unlockedChapters.value = ['chapter1', 'chapter2', 'chapter3', 'chapter4']
      saveNewGamePlusData()
    }

    if (inheritedEmotion > 0) {
      setTimeout(() => {
        showNgpNotification(
          `🌟 新周目开始！继承情绪值 +${inheritedEmotion}`,
          'success',
          4000
        )
      }, 500)
    }

    return {
      newCycle: newGamePlus.value.currentCycle,
      inheritedEmotion,
      unlockedMaterials: newGamePlus.value.unlockedHiddenMaterialIds.length
    }
  }

  const getAllMaterialsWithHidden = () => {
    const baseMaterials = materials.value
    const unlockedHidden = getUnlockedHiddenMaterials()
    return [...baseMaterials, ...unlockedHidden]
  }

  const isNgpConditionMet = (condition) => {
    const { type, value, cycle } = condition

    switch (type) {
      case 'cycle_reached':
        return newGamePlus.value.currentCycle >= (cycle || 1)
      case 'total_playthroughs':
        return newGamePlus.value.totalPlaythroughs >= (value || 1)
      case 'has_inherited_emotion':
        return newGamePlus.value.inheritedEmotion > 0
      case 'hidden_material_unlocked':
        return condition.materialId
          ? isMaterialUnlocked(condition.materialId)
          : newGamePlus.value.unlockedHiddenMaterialIds.length > 0
      case 'achievement_unlocked':
        return condition.achievementId
          ? crossCycleAchievements.value.find(a => a.id === condition.achievementId)?.unlocked || false
          : false
      case 'ending_discovered':
        return condition.endingId
          ? newGamePlus.value.discoveredEndingIds.includes(condition.endingId)
          : newGamePlus.value.discoveredEndingIds.length > 0
      default:
        return false
    }
  }

  const showNgpNotification = (message, type = 'info', duration = 3000) => {
    ngpNotification.value = { message, type, id: Date.now() }
    showNotification(message, type, duration)
  }

  const getNgpSummary = () => {
    const ngp = newGamePlus.value
    return {
      currentCycle: ngp.currentCycle,
      maxCycleUnlocked: ngp.maxCycleUnlocked,
      totalPlaythroughs: ngp.totalPlaythroughs,
      inheritedEmotion: ngp.inheritedEmotion,
      inheritanceRatio: getEffectiveInheritanceRatio(),
      unlockedHiddenMaterials: ngp.unlockedHiddenMaterialIds.length,
      totalHiddenMaterials: hiddenMaterialsRegistry.value.length,
      discoveredEndings: ngp.discoveredEndingIds.length,
      totalEndings: endings.value.length,
      unlockedAchievements: crossCycleAchievements.value.filter(a => a.unlocked).length,
      totalAchievements: crossCycleAchievements.value.length,
      perfectCycles: ngp.perfectCycleHistory.length
    }
  }

  const generateNgpNextGoals = (ending, endingConditions) => {
    const goals = []
    const ngp = newGamePlus.value
    const summary = getNgpSummary()

    if (summary.unlockedHiddenMaterials < summary.totalHiddenMaterials) {
      const locked = hiddenMaterialsRegistry.value.filter(
        m => !ngp.unlockedHiddenMaterialIds.includes(m.id)
      )
      if (locked.length > 0) {
        const next = locked[0]
        goals.push({
          type: 'hidden_material',
          icon: '🎁',
          title: `解锁隐藏素材：${next.name}`,
          description: next.description,
          priority: 2
        })
      }
    }

    if (summary.discoveredEndings < summary.totalEndings) {
      goals.push({
        type: 'ending',
        icon: '🎬',
        title: '发现更多结局',
        description: `已发现 ${summary.discoveredEndings}/${summary.totalEndings} 个结局`,
        priority: 3
      })
    }

    if (summary.unlockedAchievements < summary.totalAchievements) {
      const locked = crossCycleAchievements.value.filter(a => !a.unlocked)
      if (locked.length > 0) {
        const next = locked[0]
        goals.push({
          type: 'achievement',
          icon: '🏆',
          title: `成就：${next.name}`,
          description: next.description,
          priority: 4
        })
      }
    }

    goals.push({
      type: 'ngp_cycle',
      icon: '🔄',
      title: `开启第 ${ngp.currentCycle + 1} 周目`,
      description: `预计继承情绪值：约 ${calculateInheritedEmotion(emotionValue.value, ngp.currentCycle)} 点`,
      priority: 1
    })

    return goals.sort((a, b) => a.priority - b.priority)
  }

  const generatePlaySummary = (finalScore, completedChapterCount, perfectRate) => {
    const totalCombos = getAllCombosCount()
    const globalTriggeredSet = buildGlobalTriggeredComboSet()
    const triggeredCount = globalTriggeredSet.size

    let performance
    if (finalScore >= 90) performance = 'S'
    else if (finalScore >= 75) performance = 'A'
    else if (finalScore >= 60) performance = 'B'
    else if (finalScore >= 40) performance = 'C'
    else performance = 'D'

    const performanceLabels = {
      S: '完美通关',
      A: '出色表现',
      B: '中规中矩',
      C: '尚有不足',
      D: '需要努力'
    }

    const highlights = []
    if (perfectRate >= 0.6) highlights.push('精准放置大师')
    if (completedChapterCount === 4) highlights.push('全章节通关')
    if (triggeredCount >= totalCombos * 0.8 && totalCombos > 0) highlights.push('组合探索达人')
    if (emotionValue.value >= 200) highlights.push('情感收集家')
    if (positiveBonus.value >= 10) highlights.push('幸运之星')

    const completedIds = completedChapters.value
    const chapterScoreSummary = completedIds.map(chId => {
      const ch = getChapterById(chId)
      if (!ch) return null
      const scoreData = chapterScoreData.value[chId]
      return {
        chapterId: chId,
        title: ch.title,
        totalEmotion: scoreData?.totalEmotion || 0,
        triggeredCombos: scoreData?.triggeredComboCount || 0,
        totalCombos: scoreData?.totalComboCount || 0,
        emotionTarget: ch.emotionTarget || 0,
        reached: scoreData ? scoreData.totalEmotion >= (ch.emotionTarget || 0) : false
      }
    }).filter(Boolean)

    return {
      performance,
      performanceLabel: performanceLabels[performance],
      highlights,
      chapterScoreSummary,
      totalCombos,
      triggeredCombos: triggeredCount,
      perfectRate: Math.round(perfectRate * 100),
      playTime: totalDialogueCount.value
    }
  }

  const getAllCombosCount = () => {
    let count = 0
    Object.values(scenes.value).forEach(scene => {
      if (scene.materialCombos) {
        count += scene.materialCombos.length
      }
    })
    return count
  }

  const getGalleryDialogues = () => {
    const dialogues = []
    const globalTriggeredSet = buildGlobalTriggeredComboSet()

    chapters.value.forEach(chapter => {
      chapter.scenes.forEach(sceneId => {
        const scene = scenes.value[sceneId]
        if (!scene) return

        scene.dialogues.forEach(dialogue => {
          if (dialogue.isKeyLine) {
            dialogues.push({
              id: dialogue.id,
              text: dialogue.text,
              speaker: dialogue.speaker,
              sceneId: sceneId,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              type: 'key',
              unlocked: completedChapters.value.includes(chapter.id)
            })
          }
        })

        if (scene.materialCombos) {
          scene.materialCombos.forEach(combo => {
            if (combo.hiddenDialogue) {
              const isTriggered = globalTriggeredSet.has(combo.id)
              dialogues.push({
                id: combo.hiddenDialogue.id,
                text: isTriggered ? combo.hiddenDialogue.text : '???',
                speaker: combo.hiddenDialogue.speaker,
                sceneId: sceneId,
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                comboName: combo.name,
                type: 'hidden',
                unlocked: isTriggered
              })
            }
          })
        }
      })
    })

    return dialogues
  }

  const getGalleryScenes = () => {
    const sceneList = []

    chapters.value.forEach(chapter => {
      chapter.scenes.forEach((sceneId, index) => {
        const scene = scenes.value[sceneId]
        if (!scene) return

        const isUnlocked = completedChapters.value.includes(chapter.id) || 
          (unlockedChapters.value.includes(chapter.id) && index === 0)

        sceneList.push({
          id: sceneId,
          title: scene.name || `场景 ${index + 1}`,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          background: scene.background,
          timeOfDay: scene.timeOfDay,
          weather: scene.weather,
          dialogueCount: scene.dialogues?.length || 0,
          unlocked: isUnlocked,
          index: index + 1
        })
      })
    })

    return sceneList
  }

  const getGalleryMaterials = () => {
    const materialList = []
    const globalTriggeredSet = buildGlobalTriggeredComboSet()

    materials.value.forEach(material => {
      const isUsed = materialUsageHistory.value[material.id] > 0 || 
        baseMaterials.value.some(m => m.id === material.id)

      const usedInCombos = []
      Object.values(scenes.value).forEach(scene => {
        if (scene.materialCombos) {
          scene.materialCombos.forEach(combo => {
            if (combo.materials.includes(material.id)) {
              usedInCombos.push({
                id: combo.id,
                name: combo.name,
                triggered: globalTriggeredSet.has(combo.id)
              })
            }
          })
        }
      })

      materialList.push({
        ...material,
        unlocked: true,
        usedCount: materialUsageHistory.value[material.id] || 0,
        usedInCombos,
        isHidden: material.isHidden || false,
        categoryLabel: material.category === 'nature' ? '🌿 自然' : '📝 文具',
        rarityLabel: material.rarity === 'legendary' ? '传说' : 
                     material.rarity === 'rare' ? '稀有' : '普通'
      })
    })

    return materialList
  }

  const getGalleryEndings = () => {
    return endings.value.map(ending => ({
      ...ending,
      discovered: newGamePlus.value.discoveredEndingIds.includes(ending.id),
      discoverTime: newGamePlus.value.endingDiscoverTimes[ending.id] || null,
      typeLabel: getEndingTypeLabel(ending.type),
      typeIcon: getEndingTypeIcon(ending.type)
    }))
  }

  const getEndingTypeLabel = (type) => {
    const labels = {
      eternal: '永恒结局',
      ngp_perfect: '完美轮回',
      ngp_special: '特殊轮回',
      true: '真结局',
      perfect_path: '完美旅程',
      dialogue_master: '心语心愿',
      time_sequence: '时序之约',
      special: '特殊结局',
      good: '好结局',
      normal: '普通结局',
      happy: '快乐结局',
      sad: '悲伤结局',
      bad: '坏结局',
      hidden: '隐藏结局'
    }
    return labels[type] || type
  }

  const getEndingTypeIcon = (type) => {
    const icons = {
      eternal: '💫',
      ngp_perfect: '🌟',
      ngp_special: '✨',
      true: '👑',
      perfect_path: '🏆',
      dialogue_master: '💝',
      time_sequence: '⏰',
      special: '🎁',
      good: '😊',
      normal: '📖',
      happy: '😄',
      sad: '😢',
      bad: '💀',
      hidden: '🔮'
    }
    return icons[type] || '📖'
  }

  const getGalleryStats = () => {
    const dialogues = getGalleryDialogues()
    const scenes = getGalleryScenes()
    const materials = getGalleryMaterials()
    const endings = getGalleryEndings()

    const keyDialogues = dialogues.filter(d => d.type === 'key')
    const hiddenDialogues = dialogues.filter(d => d.type === 'hidden')

    return {
      total: {
        dialogues: dialogues.length,
        scenes: scenes.length,
        materials: materials.length,
        endings: endings.length
      },
      unlocked: {
        keyDialogues: keyDialogues.filter(d => d.unlocked).length,
        hiddenDialogues: hiddenDialogues.filter(d => d.unlocked).length,
        scenes: scenes.filter(s => s.unlocked).length,
        materials: materials.filter(m => m.unlocked).length,
        endings: endings.filter(e => e.discovered).length
      },
      percentages: {
        keyDialogues: keyDialogues.length > 0 
          ? Math.round((keyDialogues.filter(d => d.unlocked).length / keyDialogues.length) * 100) 
          : 0,
        hiddenDialogues: hiddenDialogues.length > 0 
          ? Math.round((hiddenDialogues.filter(d => d.unlocked).length / hiddenDialogues.length) * 100) 
          : 0,
        scenes: scenes.length > 0 
          ? Math.round((scenes.filter(s => s.unlocked).length / scenes.length) * 100) 
          : 0,
        materials: materials.length > 0 
          ? Math.round((materials.filter(m => m.unlocked).length / materials.length) * 100) 
          : 0,
        endings: endings.length > 0 
          ? Math.round((endings.filter(e => e.discovered).length / endings.length) * 100) 
          : 0,
        overall: 0
      }
    }
  }

  const generateMaterialReview = () => {
    const reviewItems = []
    const globalTriggeredSet = buildGlobalTriggeredComboSet()

    Object.values(scenes.value).forEach(scene => {
      if (!scene.materialCombos) return
      scene.materialCombos.forEach(combo => {
        const isTriggered = globalTriggeredSet.has(combo.id)
        const matNames = combo.materials.map(mId => {
          const mat = getMaterialById(mId)
          return mat ? mat.name : mId
        })

        reviewItems.push({
          comboId: combo.id,
          comboName: combo.name,
          description: combo.description,
          materials: matNames,
          materialIds: combo.materials,
          emotionBonus: combo.emotionBonus || 0,
          hasHiddenDialogue: !!combo.hiddenDialogue,
          hiddenDialoguePreview: isTriggered && combo.hiddenDialogue ? combo.hiddenDialogue.text.slice(0, 30) + '...' : null,
          triggered: isTriggered,
          sceneId: scene.id,
          chapterId: scene.chapter
        })
      })
    })

    const keyMaterials = []
    const usedIds = new Set()
    Object.values(materialUsageHistory.value).forEach((count, idx) => {
      const matId = Object.keys(materialUsageHistory.value)[idx]
      if (count > 0 && !usedIds.has(matId)) {
        const mat = getMaterialById(matId)
        if (mat) {
          keyMaterials.push({
            id: mat.id,
            name: mat.name,
            shape: mat.shape,
            color: mat.color,
            rarity: mat.rarity,
            usageCount: count,
            emotion: mat.emotion
          })
          usedIds.add(matId)
        }
      }
    })
    keyMaterials.sort((a, b) => b.usageCount - a.usageCount || b.emotion - a.emotion)

    const legendaryFound = keyMaterials.filter(m => m.rarity === 'legendary')
    const rareFound = keyMaterials.filter(m => m.rarity === 'rare')

    return {
      combos: reviewItems,
      keyMaterials,
      totalPlaced: keyMaterials.reduce((sum, m) => sum + m.usageCount, 0),
      legendaryFound,
      rareFound
    }
  }

  const generateBranchStatus = () => {
    const branches = []
    const globalTriggeredSet = buildGlobalTriggeredComboSet()

    chapters.value.forEach(chapter => {
      let scoreData = chapterScoreData.value[chapter.id]
      const isCompleted = completedChapters.value.includes(chapter.id)

      if (!scoreData && isCompleted) {
        const chapterScenes = chapter.scenes || []
        const allCombos = []
        chapterScenes.forEach(sceneId => {
          const scene = scenes.value[sceneId]
          if (scene?.materialCombos) {
            scene.materialCombos.forEach(combo => {
              allCombos.push({
                id: combo.id,
                name: combo.name,
                description: combo.description,
                hasHiddenDialogue: !!combo.hiddenDialogue,
                triggered: globalTriggeredSet.has(combo.id)
              })
            })
          }
        })
        scoreData = {
          allCombos,
          triggeredComboCount: allCombos.filter(c => c.triggered).length,
          totalComboCount: allCombos.length
        }
      }

      const totalCombos = getChapterTotalCombos(chapter.id)
      const triggeredInChapter = scoreData?.allCombos?.filter(c => c.triggered).length || 0
      const totalHidden = getChapterTotalHiddenDialogues(chapter.id)
      const triggeredHidden = scoreData?.allCombos?.filter(c => c.triggered && c.hasHiddenDialogue).length || 0

      const missedCombos = scoreData?.allCombos?.filter(c => !c.triggered).map(c => ({
        comboId: c.id,
        name: c.name,
        hasHiddenDialogue: c.hasHiddenDialogue,
        hint: c.hasHiddenDialogue ? '含隐藏对话' : '普通组合'
      })) || []

      if (!isCompleted) {
        chapter.scenes.forEach(sceneId => {
          const scene = scenes.value[sceneId]
          if (scene?.materialCombos) {
            scene.materialCombos.forEach(combo => {
              if (!globalTriggeredSet.has(combo.id)) {
                missedCombos.push({
                  comboId: combo.id,
                  name: combo.name,
                  hasHiddenDialogue: !!combo.hiddenDialogue,
                  hint: combo.hiddenDialogue ? '含隐藏对话' : '普通组合'
                })
              }
            })
          }
        })
      }

      branches.push({
        chapterId: chapter.id,
        title: chapter.title,
        subtitle: chapter.subtitle,
        completed: isCompleted,
        emotionReached: scoreData && scoreData.totalEmotion !== undefined ? scoreData.totalEmotion >= (chapter.emotionTarget || 0) : false,
        emotionTarget: chapter.emotionTarget || 0,
        totalCombos,
        triggeredCombos: triggeredInChapter,
        totalHidden,
        triggeredHidden,
        missedCombos,
        completionPercent: totalCombos > 0 ? Math.round((triggeredInChapter / totalCombos) * 100) : 0
      })
    })

    const totalCombosAll = branches.reduce((s, b) => s + b.totalCombos, 0)
    const totalTriggered = branches.reduce((s, b) => s + b.triggeredCombos, 0)
    const totalHiddenAll = branches.reduce((s, b) => s + b.totalHidden, 0)
    const totalHiddenTriggered = branches.reduce((s, b) => s + b.triggeredHidden, 0)

    return {
      branches,
      overallComboRate: totalCombosAll > 0 ? Math.round((totalTriggered / totalCombosAll) * 100) : 0,
      overallHiddenRate: totalHiddenAll > 0 ? Math.round((totalHiddenTriggered / totalHiddenAll) * 100) : 0,
      allBranchesCompleted: branches.every(b => b.completionPercent === 100)
    }
  }

  const generateNextGoals = (finalScore, completedChapterCount, branchStatus) => {
    const goals = []

    if (completedChapterCount < 4) {
      const nextChapter = chapters.value[completedChapterCount]
      if (nextChapter) {
        goals.push({
          type: 'chapter',
          icon: '📖',
          title: `挑战下一章：${nextChapter.title}`,
          description: nextChapter.teaser || nextChapter.description,
          target: nextChapter.id,
          priority: 1
        })
      }
    }

    if (finalScore < 65) {
      goals.push({
        type: 'score',
        icon: '⬆️',
        title: '提升综合评分至65分以上',
        description: '尝试更多组合搭配和精准放置来获取更高分数',
        priority: 2
      })
    } else if (finalScore < 90) {
      goals.push({
        type: 'score',
        icon: '🌟',
        title: '冲击完美评分90分以上',
        description: '提升情绪值收集与放置精准度，解锁隐藏结局',
        priority: 2
      })
    }

    const incompleteBranches = branchStatus.branches.filter(b => b.completionPercent < 100)
    if (incompleteBranches.length > 0) {
      const target = incompleteBranches.sort((a, b) => a.completionPercent - b.completionPercent)[0]
      goals.push({
        type: 'combo',
        icon: '🔮',
        title: `补全「${target.title}」的素材组合`,
        description: `当前完成 ${target.completionPercent}%，还差 ${target.totalCombos - target.triggeredCombos} 个组合`,
        target: target.chapterId,
        priority: 3
      })
    }

    const missedHidden = branchStatus.branches.filter(b => b.triggeredHidden < b.totalHidden)
    if (missedHidden.length > 0) {
      goals.push({
        type: 'hidden',
        icon: '💎',
        title: '收集未发现的隐藏对话',
        description: `还有 ${missedHidden.reduce((s, b) => s + (b.totalHidden - b.triggeredHidden), 0)} 段隐藏对话等你解锁`,
        priority: 4
      })
    }

    if (finalScore >= 90 && completedChapterCount === 4 && branchStatus.allBranchesCompleted) {
      goals.push({
        type: 'completionist',
        icon: '👑',
        title: '已达成全部目标！',
        description: '你已完美通关，可以尝试不同的选择路径发现更多故事',
        priority: 0
      })
    }

    return goals.sort((a, b) => a.priority - b.priority)
  }

  const saveGame = (slotIndex) => {
    const saveData = serializeGameState()

    saveSlots.value[slotIndex] = saveData

    localStorage.setItem('journal_game_saves', JSON.stringify(saveSlots.value))
    backupSaveSlots()
    return true
  }

  const loadGame = (slotIndex) => {
    let saveData = saveSlots.value[slotIndex]
    if (!saveData) {
      if (!restoreFromBackup() || !saveSlots.value[slotIndex]) {
        return false
      }
      saveData = saveSlots.value[slotIndex]
    }

    return applySaveData(saveData)
  }

  const loadSavesFromStorage = () => {
    const saved = localStorage.getItem('journal_game_saves')
    if (saved) {
      try {
        const loaded = JSON.parse(saved)
        if (Array.isArray(loaded)) {
          saveSlots.value = loaded.map(slot => {
            if (slot && !validateSaveData(slot)) {
              console.warn('Found corrupted save slot, attempting backup recovery')
              return null
            }
            return slot
          })
          if (saveSlots.value.some(s => s === null && loaded[saveSlots.value.indexOf(null)] !== null)) {
            restoreFromBackup()
          }
        }
      } catch (e) {
        console.error('Failed to load saves, attempting backup recovery:', e)
        restoreFromBackup()
      }
    } else {
      restoreFromBackup()
    }
  }

  const resetGame = (resetNgp = false) => {
    currentChapterId.value = null
    currentSceneId.value = null
    currentDialogueIndex.value = 0
    emotionValue.value = 0
    placedMaterials.value = []
    unlockedChapters.value = ['chapter1']
    completedChapters.value = []
    isWaitingForMaterial.value = false
    requiredMaterialId.value = null
    gameCompleted.value = false
    currentEnding.value = null
    autoSaveData.value = null
    lastAutoSaveTime.value = null
    chapterSnapshots.value = {}
    chapterScoreData.value = {}
    dialogueCountSinceLastAutoSave.value = 0
    currentChapterLog.value = []
    activeMaterialFilter.value = 'all'
    materialUsageHistory.value = {}
    materialPlacementSequence.value = []
    chapterCompletionDetails.value = {}
    keyDialogueLines.value = []
    hiddenDialogueSequence.value = []
    currentPathSequence.value = []
    currentTimeOfDay.value = 'day'
    currentWeather.value = 'clear'
    resetStats()
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('journal_game_saves')
      localStorage.removeItem(AUTO_SAVE_KEY)
      localStorage.removeItem(AUTO_SAVE_BACKUP_KEY)
      localStorage.removeItem(CHAPTER_SNAPSHOTS_KEY)
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(BACKUP_KEY)
      localStorage.removeItem(CHAPTER_SCORE_KEY)
      localStorage.removeItem(BRANCH_STATS_KEY)
    }

    if (resetNgp) {
      newGamePlus.value = {
        currentCycle: 1,
        maxCycleUnlocked: 1,
        totalPlaythroughs: 0,
        inheritedEmotion: 0,
        emotionInheritanceConfig: newGamePlus.value.emotionInheritanceConfig,
        unlockedHiddenMaterialIds: [],
        hiddenMaterialUnlockTimes: {},
        discoveredEndingIds: [],
        endingDiscoverTimes: {},
        perfectCycleHistory: [],
        cycleRewards: {}
      }
      crossCycleAchievements.value.forEach(a => {
        a.unlocked = false
        a.unlockedAt = null
      })
      localStorage.removeItem(NEW_GAME_PLUS_KEY)
      localStorage.removeItem(HIDDEN_MATERIALS_KEY)
      localStorage.removeItem(CYCLE_ACHIEVEMENTS_KEY)
      localStorage.removeItem(TUTORIAL_KEY)
    }

    resetQuestProgress()
  }

  const goToChapterSelect = () => {
    endGameSession()
    currentChapterId.value = null
    currentSceneId.value = null
    currentDialogueIndex.value = 0
    placedMaterials.value = []
    isWaitingForMaterial.value = false
    requiredMaterialId.value = null
    gameCompleted.value = false
    currentEnding.value = null
  }

  const createChecksum = (data) => {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  const validateSaveData = (data) => {
    if (!data || typeof data !== 'object') return false
    if (!data.currentChapterId && data.currentChapterId !== null) return false
    if (!data.timestamp) return false
    if (data.checksum) {
      const savedChecksum = data.checksum
      const { checksum, ...rest } = data
      const calculatedChecksum = createChecksum(rest)
      if (savedChecksum !== calculatedChecksum) {
        console.warn('Save data checksum mismatch, data may be corrupted')
        return false
      }
    }
    return true
  }

  const showNotification = (message, type = 'info', duration = 2500) => {
    notification.value = { message, type, id: Date.now() }
    if (duration > 0) {
      setTimeout(() => {
        if (notification.value && notification.value.id === notification.value.id) {
          notification.value = null
        }
      }, duration)
    }
  }

  const clearNotification = () => {
    notification.value = null
  }

  const generateSaveThumbnail = () => {
    const chapter = currentChapter.value
    const scene = currentScene.value
    const dialogue = currentDialogue.value
    const chapterScenes = chapter?.scenes || []
    const totalSceneDialogues = scene?.dialogues?.length || 0
    const currentSceneIndex = chapterScenes.indexOf(currentSceneId.value)

    let chapterProgress = 0
    if (chapterScenes.length > 0) {
      const sceneProgress = currentSceneIndex >= 0 ? currentSceneIndex : 0
      const dialogueProgress = totalSceneDialogues > 0
        ? (currentDialogueIndex.value / totalSceneDialogues)
        : 0
      chapterProgress = Math.round(
        ((sceneProgress + dialogueProgress) / chapterScenes.length) * 100
      )
      chapterProgress = Math.min(100, Math.max(0, chapterProgress))
    }

    return {
      chapterTitle: chapter?.title || '未知章节',
      chapterSubtitle: chapter?.subtitle || '',
      sceneName: scene?.name || scene?.id || '未知场景',
      dialoguePreview: dialogue?.text
        ? dialogue.text.slice(0, 40) + (dialogue.text.length > 40 ? '...' : '')
        : '剧情进行中...',
      emotionValue: emotionValue.value,
      emotionTier: currentEmotionTier.value?.name || '平静',
      emotionIcon: currentEmotionTier.value?.icon || '🌙',
      chapterProgress,
      completedChaptersCount: completedChapters.value.length,
      totalChaptersCount: chapters.value.length,
      triggeredCombosCount: triggeredCombos.value.length,
      playTimeDialogues: totalDialogueCount.value
    }
  }

  const serializeGameState = () => {
    const thumbnail = generateSaveThumbnail()
    const baseData = {
      currentChapterId: currentChapterId.value,
      currentSceneId: currentSceneId.value,
      currentDialogueIndex: currentDialogueIndex.value,
      emotionValue: emotionValue.value,
      placedMaterials: placedMaterials.value,
      unlockedChapters: unlockedChapters.value,
      completedChapters: completedChapters.value,
      isWaitingForMaterial: isWaitingForMaterial.value,
      requiredMaterialId: requiredMaterialId.value,
      perfectPlacementCount: perfectPlacementCount.value,
      totalDialogueCount: totalDialogueCount.value,
      positiveBonus: positiveBonus.value,
      triggeredCombos: triggeredCombos.value,
      pendingHiddenDialogues: pendingHiddenDialogues.value,
      isShowingHiddenDialogue: isShowingHiddenDialogue.value,
      sceneBackgroundOverride: sceneBackgroundOverride.value,
      activeSceneFeedback: activeSceneFeedback.value,
      comboBonusTotal: comboBonusTotal.value,
      optionalMaterialsPlaced: optionalMaterialsPlaced.value,
      requiredMaterialPlaced: requiredMaterialPlaced.value,
      activeHiddenDialogue: activeHiddenDialogue.value,
      dialogueHistory: dialogueHistory.value,
      typingSpeed: typingSpeed.value,
      activeMaterialFilter: activeMaterialFilter.value,
      materialUsageHistory: materialUsageHistory.value,
      materialPlacementSequence: materialPlacementSequence.value,
      chapterCompletionDetails: chapterCompletionDetails.value,
      keyDialogueLines: keyDialogueLines.value,
      hiddenDialogueSequence: hiddenDialogueSequence.value,
      currentPathSequence: currentPathSequence.value,
      currentTimeOfDay: currentTimeOfDay.value,
      currentWeather: currentWeather.value,
      characterAffinities: characterAffinities.value,
      exclusiveDialogueUnlocked: exclusiveDialogueUnlocked.value,
      thumbnail,
      timestamp: Date.now()
    }
    return {
      ...baseData,
      checksum: createChecksum(baseData)
    }
  }

  const latestSaveSlotIndex = computed(() => {
    let latestIndex = -1
    let latestTime = 0
    saveSlots.value.forEach((slot, index) => {
      if (slot && slot.timestamp > latestTime) {
        latestTime = slot.timestamp
        latestIndex = index
      }
    })
    return latestIndex
  })

  const getSaveThumbnail = (slotIndex) => {
    const slot = saveSlots.value[slotIndex]
    if (!slot) return null
    return slot.thumbnail || null
  }

  const autoSave = () => {
    if (!autoSaveEnabled.value || !currentChapterId.value) return false

    try {
      const saveData = serializeGameState()
      
      const currentAutoSave = localStorage.getItem(AUTO_SAVE_KEY)
      if (currentAutoSave) {
        try {
          const parsed = JSON.parse(currentAutoSave)
          if (validateSaveData(parsed)) {
            localStorage.setItem(AUTO_SAVE_BACKUP_KEY, currentAutoSave)
          }
        } catch (e) {
          console.warn('Current auto-save invalid, skipping backup:', e)
        }
      }

      autoSaveData.value = saveData
      lastAutoSaveTime.value = saveData.timestamp
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(saveData))
      dialogueCountSinceLastAutoSave.value = 0
      return true
    } catch (e) {
      console.error('Auto-save failed:', e)
      return false
    }
  }

  const loadAutoSave = () => {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY)
      if (saved) {
        const saveData = JSON.parse(saved)
        if (validateSaveData(saveData)) {
          autoSaveData.value = saveData
          lastAutoSaveTime.value = saveData.timestamp
          return true
        }
        console.warn('Primary auto-save invalid, trying backup...')
      }

      const backupSaved = localStorage.getItem(AUTO_SAVE_BACKUP_KEY)
      if (backupSaved) {
        const backupData = JSON.parse(backupSaved)
        if (validateSaveData(backupData)) {
          autoSaveData.value = backupData
          lastAutoSaveTime.value = backupData.timestamp
          localStorage.setItem(AUTO_SAVE_KEY, backupSaved)
          console.warn('Restored auto-save from backup')
          return true
        }
      }

      return false
    } catch (e) {
      console.error('Failed to load auto-save:', e)
      return false
    }
  }

  const restoreFromAutoSave = () => {
    if (!autoSaveData.value) {
      if (!loadAutoSave()) return false
    }
    const result = applySaveData(autoSaveData.value)
    if (result) {
      showNotification('已从自动存档恢复', 'success')
    }
    return result
  }

  const applySaveData = (saveData) => {
    if (!validateSaveData(saveData)) {
      showNotification('存档数据损坏，无法恢复', 'error')
      return false
    }
    currentChapterId.value = saveData.currentChapterId
    currentSceneId.value = saveData.currentSceneId
    currentDialogueIndex.value = saveData.currentDialogueIndex
    emotionValue.value = saveData.emotionValue
    placedMaterials.value = saveData.placedMaterials || []
    unlockedChapters.value = saveData.unlockedChapters || ['chapter1']
    completedChapters.value = saveData.completedChapters || []
    isWaitingForMaterial.value = saveData.isWaitingForMaterial || false
    requiredMaterialId.value = saveData.requiredMaterialId || null
    perfectPlacementCount.value = saveData.perfectPlacementCount || 0
    totalDialogueCount.value = saveData.totalDialogueCount || 0
    positiveBonus.value = saveData.positiveBonus || 0
    triggeredCombos.value = saveData.triggeredCombos || []
    pendingHiddenDialogues.value = saveData.pendingHiddenDialogues || []
    isShowingHiddenDialogue.value = saveData.isShowingHiddenDialogue || false
    sceneBackgroundOverride.value = saveData.sceneBackgroundOverride || null
    activeSceneFeedback.value = saveData.activeSceneFeedback || null
    comboBonusTotal.value = saveData.comboBonusTotal || 0
    optionalMaterialsPlaced.value = saveData.optionalMaterialsPlaced || []
    requiredMaterialPlaced.value = saveData.requiredMaterialPlaced || false
    activeHiddenDialogue.value = saveData.activeHiddenDialogue || null
    dialogueHistory.value = saveData.dialogueHistory || []
    typingSpeed.value = saveData.typingSpeed || 50
    activeMaterialFilter.value = saveData.activeMaterialFilter || 'all'
    materialUsageHistory.value = saveData.materialUsageHistory || {}
    materialPlacementSequence.value = saveData.materialPlacementSequence || []
    chapterCompletionDetails.value = saveData.chapterCompletionDetails || {}
    keyDialogueLines.value = saveData.keyDialogueLines || []
    hiddenDialogueSequence.value = saveData.hiddenDialogueSequence || []
    currentPathSequence.value = saveData.currentPathSequence || []
    currentTimeOfDay.value = saveData.currentTimeOfDay || 'day'
    currentWeather.value = saveData.currentWeather || 'clear'
    if (saveData.characterAffinities) {
      characterAffinities.value = { ...characterAffinities.value, ...saveData.characterAffinities }
    }
    if (saveData.exclusiveDialogueUnlocked) {
      exclusiveDialogueUnlocked.value = saveData.exclusiveDialogueUnlocked
    }
    comboJustTriggered.value = null
    gameCompleted.value = false
    currentEnding.value = null
    checkAndUnlockChapters()
    return true
  }

  const saveChapterSnapshot = (chapterId = currentChapterId.value) => {
    if (!chapterId) return false

    try {
      const snapshot = serializeGameState()
      snapshot.snapshotType = 'chapter_start'
      snapshot.snapshotChapterId = chapterId

      chapterSnapshots.value[chapterId] = snapshot
      localStorage.setItem(CHAPTER_SNAPSHOTS_KEY, JSON.stringify(chapterSnapshots.value))
      return true
    } catch (e) {
      console.error('Failed to save chapter snapshot:', e)
      return false
    }
  }

  const loadChapterSnapshots = () => {
    try {
      const saved = localStorage.getItem(CHAPTER_SNAPSHOTS_KEY)
      if (saved) {
        chapterSnapshots.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load chapter snapshots:', e)
      chapterSnapshots.value = {}
    }
  }

  const hasChapterSnapshot = (chapterId = currentChapterId.value) => {
    return !!(chapterSnapshots.value[chapterId] && validateSaveData(chapterSnapshots.value[chapterId]))
  }

  const rollbackToChapterStart = (chapterId = currentChapterId.value) => {
    const snapshot = chapterSnapshots.value[chapterId]
    if (!snapshot) {
      showNotification('没有找到该章节的存档点', 'warning')
      return false
    }
    if (!validateSaveData(snapshot)) {
      showNotification('章节存档点数据已损坏', 'error')
      return false
    }

    const chapter = getChapterById(chapterId)
    if (!chapter) return false

    const snapshotEmotion = snapshot.emotionValue || 0
    const result = applySaveData(snapshot)
    if (result) {
      showNotification(`已回滚到「${chapter.title}」开头，情绪值 ${snapshotEmotion}`, 'success')
    }
    return result
  }

  const deleteChapterSnapshot = (chapterId) => {
    delete chapterSnapshots.value[chapterId]
    localStorage.setItem(CHAPTER_SNAPSHOTS_KEY, JSON.stringify(chapterSnapshots.value))
  }

  const saveChapterScoreData = () => {
    try {
      localStorage.setItem(CHAPTER_SCORE_KEY, JSON.stringify(chapterScoreData.value))
    } catch (e) {
      console.error('Failed to save chapter score data:', e)
    }
  }

  const loadChapterScoreData = () => {
    try {
      const saved = localStorage.getItem(CHAPTER_SCORE_KEY)
      if (saved) {
        chapterScoreData.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load chapter score data:', e)
      chapterScoreData.value = {}
    }
  }

  const getChapterScoreDetail = (chapterId) => {
    return chapterScoreData.value[chapterId] || null
  }

  const getChapterTotalCombos = (chapterId) => {
    const chapter = getChapterById(chapterId)
    if (!chapter) return 0
    let count = 0
    chapter.scenes.forEach(sceneId => {
      const scene = scenes.value[sceneId]
      if (scene?.materialCombos) {
        count += scene.materialCombos.length
      }
    })
    return count
  }

  const getChapterTriggeredCombos = (chapterId) => {
    const scoreData = chapterScoreData.value[chapterId]
    if (!scoreData?.allCombos) return 0
    return scoreData.allCombos.filter(c => c.triggered).length
  }

  const getChapterTotalHiddenDialogues = (chapterId) => {
    const chapter = getChapterById(chapterId)
    if (!chapter) return 0
    let count = 0
    chapter.scenes.forEach(sceneId => {
      const scene = scenes.value[sceneId]
      if (scene?.materialCombos) {
        scene.materialCombos.forEach(combo => {
          if (combo.hiddenDialogue) count++
        })
      }
    })
    return count
  }

  const getChapterTriggeredHiddenDialogues = (chapterId) => {
    const scoreData = chapterScoreData.value[chapterId]
    if (!scoreData?.allCombos) return 0
    return scoreData.allCombos.filter(c => c.triggered && c.hasHiddenDialogue).length
  }

  const getChapterCompletion = (chapterId) => {
    const totalCombos = getChapterTotalCombos(chapterId)
    if (totalCombos === 0) return 0
    const triggeredCombos = getChapterTriggeredCombos(chapterId)
    return Math.round((triggeredCombos / totalCombos) * 100)
  }

  const getChapterUncollectedCombos = (chapterId) => {
    const scoreData = chapterScoreData.value[chapterId]
    if (!scoreData?.allCombos) {
      const chapter = getChapterById(chapterId)
      if (!chapter) return []
      const allCombos = []
      chapter.scenes.forEach(sceneId => {
        const scene = scenes.value[sceneId]
        if (scene?.materialCombos) {
          scene.materialCombos.forEach(combo => {
            allCombos.push({
              id: combo.id,
              name: combo.name,
              description: combo.description,
              hasHiddenDialogue: !!combo.hiddenDialogue,
              sceneId
            })
          })
        }
      })
      return allCombos
    }
    return scoreData.allCombos.filter(c => !c.triggered).map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      hasHiddenDialogue: c.hasHiddenDialogue,
      sceneId: c.sceneId
    }))
  }

  const getChapterCollectedHint = (chapterId) => {
    const total = getChapterTotalCombos(chapterId)
    const triggered = getChapterTriggeredCombos(chapterId)
    const uncollected = total - triggered
    if (uncollected === 0) return null
    return uncollected
  }

  const isChapterConditionMet = (chapterId, condition) => {
    if (!condition) return true
    const { type, target, value, minCount, cycle, materialId, achievementId, endingId } = condition

    switch (type) {
      case 'chapter_completed':
        return completedChapters.value.includes(target)

      case 'emotion_reached': {
        const scoreData = chapterScoreData.value[target]
        if (!scoreData) return false
        return scoreData.totalEmotion >= (value || 0)
      }

      case 'combo_triggered': {
        const scoreData = chapterScoreData.value[target]
        if (!scoreData?.allCombos) return false
        const triggeredCount = scoreData.allCombos.filter(c => c.triggered).length
        return triggeredCount >= (minCount || 1)
      }

      case 'hidden_dialogue_found': {
        const scoreData = chapterScoreData.value[target]
        if (!scoreData?.allCombos) return false
        const hiddenCount = scoreData.allCombos.filter(c => c.triggered && c.hasHiddenDialogue).length
        return hiddenCount >= (minCount || 1)
      }

      case 'cycle_reached':
        return newGamePlus.value.currentCycle >= (cycle || 1)

      case 'total_playthroughs':
        return newGamePlus.value.totalPlaythroughs >= (value || 1)

      case 'has_inherited_emotion':
        return newGamePlus.value.inheritedEmotion > 0

      case 'hidden_material_unlocked':
        return materialId
          ? isMaterialUnlocked(materialId)
          : newGamePlus.value.unlockedHiddenMaterialIds.length > 0

      case 'achievement_unlocked':
        return achievementId
          ? crossCycleAchievements.value.find(a => a.id === achievementId)?.unlocked || false
          : false

      case 'ending_discovered':
        return endingId
          ? newGamePlus.value.discoveredEndingIds.includes(endingId)
          : newGamePlus.value.discoveredEndingIds.length > 0

      case 'affinity_reached':
        return getCharacterAffinity(condition.characterId) >= (condition.value || 0)

      default:
        return isNgpConditionMet(condition)
    }
  }

  const getUnmetConditions = (chapterId) => {
    const chapter = getChapterById(chapterId)
    if (!chapter?.unlockConditions) return []

    return chapter.unlockConditions
      .filter(condition => !isChapterConditionMet(chapterId, condition))
      .map(condition => ({
        ...condition,
        met: false,
        progress: getConditionProgress(chapterId, condition)
      }))
  }

  const getMetConditions = (chapterId) => {
    const chapter = getChapterById(chapterId)
    if (!chapter?.unlockConditions) return []

    return chapter.unlockConditions
      .filter(condition => isChapterConditionMet(chapterId, condition))
      .map(condition => ({
        ...condition,
        met: true
      }))
  }

  const getConditionProgress = (chapterId, condition) => {
    const { type, target, value, minCount, cycle, materialId, achievementId, endingId } = condition

    switch (type) {
      case 'chapter_completed':
        return completedChapters.value.includes(target) ? 1 : 0

      case 'emotion_reached': {
        const scoreData = chapterScoreData.value[target]
        if (!scoreData) return 0
        return Math.min(1, scoreData.totalEmotion / (value || 1))
      }

      case 'combo_triggered': {
        const scoreData = chapterScoreData.value[target]
        if (!scoreData?.allCombos) return 0
        const triggeredCount = scoreData.allCombos.filter(c => c.triggered).length
        return Math.min(1, triggeredCount / (minCount || 1))
      }

      case 'hidden_dialogue_found': {
        const scoreData = chapterScoreData.value[target]
        if (!scoreData?.allCombos) return 0
        const hiddenCount = scoreData.allCombos.filter(c => c.triggered && c.hasHiddenDialogue).length
        return Math.min(1, hiddenCount / (minCount || 1))
      }

      case 'cycle_reached':
        return Math.min(1, newGamePlus.value.currentCycle / Math.max(1, cycle || 1))

      case 'total_playthroughs':
        return Math.min(1, newGamePlus.value.totalPlaythroughs / Math.max(1, value || 1))

      case 'has_inherited_emotion':
        return newGamePlus.value.inheritedEmotion > 0 ? 1 : 0

      case 'hidden_material_unlocked': {
        if (materialId) {
          return isMaterialUnlocked(materialId) ? 1 : 0
        }
        return Math.min(1, newGamePlus.value.unlockedHiddenMaterialIds.length / Math.max(1, hiddenMaterialsRegistry.value.length))
      }

      case 'achievement_unlocked': {
        if (achievementId) {
          const ach = crossCycleAchievements.value.find(a => a.id === achievementId)
          return ach?.unlocked ? 1 : 0
        }
        const unlocked = crossCycleAchievements.value.filter(a => a.unlocked).length
        return Math.min(1, unlocked / Math.max(1, crossCycleAchievements.value.length))
      }

      case 'ending_discovered': {
        if (endingId) {
          return newGamePlus.value.discoveredEndingIds.includes(endingId) ? 1 : 0
        }
        return Math.min(1, newGamePlus.value.discoveredEndingIds.length / Math.max(1, endings.value.length))
      }

      case 'affinity_reached': {
        const current = getCharacterAffinity(condition.characterId)
        return Math.min(1, current / Math.max(1, condition.value || 1))
      }

      default:
        return 1
    }
  }

  const isChapterVisible = (chapterId) => {
    const chapter = getChapterById(chapterId)
    if (!chapter) return false
    if (!chapter.hidden) return true
    if (unlockedChapters.value.includes(chapterId)) return true
    if (completedChapters.value.includes(chapterId)) return true

    if (chapter.unlockConditions && chapter.unlockConditions.length > 0) {
      const anyMet = chapter.unlockConditions.some(condition =>
        isChapterConditionMet(chapterId, condition)
      )
      if (anyMet) return true

      const previousChapterIndex = chapters.value.findIndex(c => c.id === chapterId) - 1
      if (previousChapterIndex >= 0) {
        const prevChapter = chapters.value[previousChapterIndex]
        if (completedChapters.value.includes(prevChapter.id)) return true
      }
    }

    return false
  }

  const areAllConditionsMet = (chapterId) => {
    const chapter = getChapterById(chapterId)
    if (!chapter?.unlockConditions || chapter.unlockConditions.length === 0) return true
    return chapter.unlockConditions.every(condition =>
      isChapterConditionMet(chapterId, condition)
    )
  }

  const checkAndUnlockChapters = () => {
    let newlyUnlocked = []

    chapters.value.forEach(chapter => {
      if (unlockedChapters.value.includes(chapter.id)) return
      if (!areAllConditionsMet(chapter.id)) return

      unlockedChapters.value.push(chapter.id)
      newlyUnlocked.push(chapter)
    })

    if (newlyUnlocked.length > 0) {
      const names = newlyUnlocked.map(c => `「${c.title}」`).join('、')
      showNotification(`新章节解锁：${names}`, 'success', 3000)
    }

    return newlyUnlocked
  }

  const backupSaveSlots = () => {
    try {
      const backup = {
        data: saveSlots.value,
        timestamp: Date.now()
      }
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup))
      return true
    } catch (e) {
      console.error('Failed to backup saves:', e)
      return false
    }
  }

  const restoreFromBackup = () => {
    try {
      const saved = localStorage.getItem(BACKUP_KEY)
      if (!saved) return false
      const backup = JSON.parse(saved)
      if (!backup.data) return false
      saveSlots.value = backup.data
      localStorage.setItem('journal_game_saves', JSON.stringify(saveSlots.value))
      return true
    } catch (e) {
      console.error('Failed to restore backup:', e)
      return false
    }
  }

  const markSessionActive = () => {
    try {
      const session = {
        active: true,
        sessionId: sessionId,
        lastHeartbeat: Date.now(),
        currentChapterId: currentChapterId.value,
        currentSceneId: currentSceneId.value,
        emotionValue: emotionValue.value
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch (e) {
      console.error('Failed to mark session active:', e)
    }
  }

  const markSessionEnded = () => {
    try {
      const session = {
        active: false,
        sessionId: sessionId,
        endedAt: Date.now(),
        endReason: 'normal',
        currentChapterId: currentChapterId.value
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch (e) {
      console.error('Failed to mark session ended:', e)
    }
  }

  const startHeartbeat = () => {
    stopHeartbeat()
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    markSessionActive()
    heartbeatTimer = setInterval(() => {
      if (currentChapterId.value && document.visibilityState === 'visible') {
        markSessionActive()
      }
    }, HEARTBEAT_INTERVAL)
  }

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  const startGameSession = () => {
    startHeartbeat()
    autoSave()
  }

  const endGameSession = () => {
    if (currentChapterId.value) {
      autoSave()
    }
    markSessionEnded()
    stopHeartbeat()
    sessionId = null
  }

  const checkForCrashRecovery = () => {
    try {
      const saved = localStorage.getItem(SESSION_KEY)
      if (!saved) {
        return null
      }

      const session = JSON.parse(saved)
      
      if (!session.active) {
        return null
      }

      if (!session.lastHeartbeat) {
        return null
      }

      const timeSinceHeartbeat = Date.now() - session.lastHeartbeat

      if (timeSinceHeartbeat < CRASH_RECOVERY_THRESHOLD) {
        return null
      }

      const autoSaveExists = loadAutoSave()
      if (!autoSaveExists || !autoSaveData.value) {
        return null
      }

      if (!validateSaveData(autoSaveData.value)) {
        console.warn('Auto-save data invalid during crash recovery check')
        return null
      }

      recoveryData.value = {
        type: 'crash',
        session: session,
        autoSave: autoSaveData.value,
        timeSinceHeartbeat: timeSinceHeartbeat
      }
      showRecoveryModal.value = true
      return recoveryData.value
    } catch (e) {
      console.error('Error checking for crash recovery:', e)
      return null
    }
  }

  const confirmRecovery = (doRestore) => {
    if (doRestore && recoveryData.value) {
      const { autoSave } = recoveryData.value
      if (autoSave) {
        applySaveData(autoSave)
        startGameSession()
        showNotification('已恢复到上次关闭前的进度', 'success')
      }
    } else {
      markSessionEnded()
    }
    showRecoveryModal.value = false
    recoveryData.value = null
  }

  const dismissRecovery = () => {
    confirmRecovery(false)
  }

  const handleBeforeUnload = () => {
    try {
      if (currentChapterId.value) {
        autoSave()
        markSessionActive()
      }
    } catch (e) {
      console.error('Before unload error:', e)
    }
  }

  const handlePageHide = () => {
    try {
      if (currentChapterId.value) {
        autoSave()
        if (document.visibilityState === 'hidden') {
          markSessionActive()
        }
      }
    } catch (e) {
      console.error('Page hide error:', e)
    }
  }

  const handleVisibilityChange = () => {
    if (currentChapterId.value) {
      if (document.visibilityState === 'hidden') {
        autoSave()
        markSessionActive()
      } else {
        markSessionActive()
      }
    }
  }

  const setupEventListeners = () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('pagehide', handlePageHide)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  const cleanupEventListeners = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  const getCharacterAffinity = (characterId) => {
    return characterAffinities.value[characterId] || 0
  }

  const getCharacterAffinityTier = (characterId) => {
    const affinity = getCharacterAffinity(characterId)
    const char = characterRegistry.value.find(c => c.id === characterId)
    if (!char) return null
    for (let i = char.affinityTiers.length - 1; i >= 0; i--) {
      if (affinity >= char.affinityTiers[i].min) {
        return { ...char.affinityTiers[i], characterId }
      }
    }
    return { ...char.affinityTiers[0], characterId }
  }

  const getCharacterAffinityProgress = (characterId) => {
    const affinity = getCharacterAffinity(characterId)
    const char = characterRegistry.value.find(c => c.id === characterId)
    if (!char) return 0
    const currentTier = getCharacterAffinityTier(characterId)
    if (!currentTier) return 0
    const range = currentTier.max - currentTier.min
    const progress = affinity - currentTier.min
    return range > 0 ? Math.min(100, (progress / range) * 100) : 100
  }

  const changeAffinity = (characterId, amount, reason = '') => {
    if (!characterAffinities.value.hasOwnProperty(characterId)) return null
    const oldAffinity = characterAffinities.value[characterId]
    const newAffinity = Math.min(100, Math.max(0, oldAffinity + amount))
    characterAffinities.value[characterId] = newAffinity

    affinityLog.value.push({
      characterId,
      oldAffinity,
      newAffinity,
      change: amount,
      reason,
      chapterId: currentChapterId.value,
      sceneId: currentSceneId.value,
      timestamp: Date.now()
    })

    const oldTier = getCharacterAffinityTierById(characterId, oldAffinity)
    const newTier = getCharacterAffinityTierById(characterId, newAffinity)

    if (newTier && oldTier && newTier.id !== oldTier.id) {
      const char = characterRegistry.value.find(c => c.id === characterId)
      if (amount > 0) {
        affinityNotifications.value.push({
          id: Date.now() + '_' + characterId,
          type: 'tier_up',
          characterId,
          characterName: char.name,
          characterIcon: char.icon,
          oldTier: oldTier.name,
          newTier: newTier.name,
          newTierIcon: newTier.icon,
          affinity: newAffinity,
          timestamp: Date.now()
        })
      }
    }

    checkExclusiveDialogueUnlocks(characterId, newAffinity)
    checkAffinityChapterUnlocks()
    saveCharacterRelationData()
    return { oldAffinity, newAffinity, tierChanged: oldTier?.id !== newTier?.id }
  }

  const getCharacterAffinityTierById = (characterId, affinity) => {
    const char = characterRegistry.value.find(c => c.id === characterId)
    if (!char) return null
    for (let i = char.affinityTiers.length - 1; i >= 0; i--) {
      if (affinity >= char.affinityTiers[i].min) {
        return char.affinityTiers[i]
      }
    }
    return char.affinityTiers[0]
  }

  const processDialogueAffinity = (dialogue) => {
    if (!dialogue) return
    const speaker = dialogue.speaker
    const emotion = dialogue.emotionChange || 0
    let charId = null
    let baseGain = 0

    if (speaker === '回忆') {
      charId = 'she'
      baseGain = Math.max(1, Math.ceil(emotion * 0.6))
    } else if (speaker === '内心') {
      charId = 'self'
      baseGain = Math.max(1, Math.ceil(emotion * 0.5))
    } else if (speaker === '旁白') {
      charId = 'time'
      baseGain = Math.max(1, Math.ceil(emotion * 0.4))
    }

    if (charId && baseGain > 0) {
      changeAffinity(charId, baseGain, `对话: ${dialogue.text?.slice(0, 20)}...`)
    }
  }

  const processMaterialAffinity = (materialId, isPerfect) => {
    const material = getMaterialById(materialId)
    if (!material) return

    characterRegistry.value.forEach(char => {
      let gain = 0
      const isPreferred = char.preferredMaterials.includes(materialId)
      const tagMatch = material.tags.some(t => char.preferredTags.includes(t))

      if (isPreferred) {
        gain = 3
      } else if (tagMatch) {
        gain = 2
      } else {
        gain = 1
      }

      if (isPerfect) {
        gain += 1
      }

      if (gain > 0) {
        changeAffinity(char.id, gain, `放置素材: ${material.name}${isPerfect ? '(完美)' : ''}`)
      }
    })
  }

  const processChapterCompletionAffinity = (chapterId) => {
    const detail = chapterCompletionDetails.value[chapterId]
    if (!detail) return

    let bonusBase = 5
    if (detail.isPerfect) bonusBase += 5
    if (detail.emotionReached) bonusBase += 3
    if (detail.allCombosTriggered) bonusBase += 2

    const chapter = getChapterById(chapterId)
    if (!chapter) return

    const chapterIndex = chapters.value.findIndex(c => c.id === chapterId)
    if (chapterIndex === 0) {
      changeAffinity('she', bonusBase + 3, '完成春日序章(她+额外)')
      changeAffinity('time', bonusBase, '完成春日序章')
      changeAffinity('self', bonusBase - 1, '完成春日序章')
    } else if (chapterIndex === 1) {
      changeAffinity('she', bonusBase + 2, '完成盛夏光年')
      changeAffinity('time', bonusBase, '完成盛夏光年')
      changeAffinity('self', bonusBase + 1, '完成盛夏光年(自我+额外)')
    } else if (chapterIndex === 2) {
      changeAffinity('she', bonusBase, '完成秋日私语')
      changeAffinity('time', bonusBase + 3, '完成秋日私语(时光+额外)')
      changeAffinity('self', bonusBase + 2, '完成秋日私语')
    } else if (chapterIndex === 3) {
      changeAffinity('she', bonusBase + 5, '完成冬日暖阳(她+额外)')
      changeAffinity('time', bonusBase + 2, '完成冬日暖阳')
      changeAffinity('self', bonusBase + 3, '完成冬日暖阳(自我+额外)')
    } else {
      changeAffinity('she', bonusBase, `完成${chapter.title}`)
      changeAffinity('time', bonusBase, `完成${chapter.title}`)
      changeAffinity('self', bonusBase, `完成${chapter.title}`)
    }
  }

  const checkExclusiveDialogueUnlocks = (characterId, newAffinity) => {
    const char = characterRegistry.value.find(c => c.id === characterId)
    if (!char) return []

    const newlyUnlocked = []
    char.exclusiveDialogueTiers.forEach(tier => {
      if (newAffinity >= tier) {
        const key = `${characterId}_${tier}`
        if (!exclusiveDialogueUnlocked.value[key]) {
          exclusiveDialogueUnlocked.value[key] = true
          newlyUnlocked.push({
            characterId,
            tier,
            characterName: char.name,
            characterIcon: char.icon
          })

          const dialogues = characterExclusiveDialogues.value[characterId]?.[tier] || []
          if (dialogues.length > 0) {
            dialogues.forEach(d => {
              pendingHiddenDialogues.value.push({ ...d, isExclusive: true })
            })
            showNotification(
              `${char.icon} ${char.name}的好感度突破 ${tier}！解锁专属对话`,
              'success',
              4000
            )
          }
        }
      }
    })

    return newlyUnlocked
  }

  const checkAffinityChapterUnlocks = () => {
    const newlyUnlocked = []

    affinityHiddenChapters.value.forEach(affChapter => {
      if (unlockedChapters.value.includes(affChapter.id)) return

      const conditions = affChapter.unlockConditions || []
      const allMet = conditions.every(cond => {
        if (cond.type === 'affinity_reached') {
          return getCharacterAffinity(cond.characterId) >= (cond.value || 0)
        }
        return isChapterConditionMet(affChapter.id, cond)
      })

      if (allMet) {
        const existingChapter = chapters.value.find(c => c.id === affChapter.id)
        if (!existingChapter) {
          chapters.value.push({ ...affChapter })
        }
        unlockedChapters.value.push(affChapter.id)

        Object.entries(affinitySceneData.value).forEach(([sceneId, sceneData]) => {
          if (sceneData.chapter === affChapter.id && !scenes.value[sceneId]) {
            scenes.value[sceneId] = sceneData
          }
        })

        newlyUnlocked.push(affChapter)
      }
    })

    if (newlyUnlocked.length > 0) {
      const names = newlyUnlocked.map(c => `「${c.title}」`).join('、')
      showNotification(`✨ 角色好感解锁隐藏章节：${names}`, 'success', 5000)
    }

    return newlyUnlocked
  }

  const getAffinitySummary = () => {
    return characterRegistry.value.map(char => {
      const affinity = getCharacterAffinity(char.id)
      const tier = getCharacterAffinityTier(char.id)
      const progress = getCharacterAffinityProgress(char.id)
      const unlockedTiers = char.exclusiveDialogueTiers.filter(t => affinity >= t).length
      const totalTiers = char.exclusiveDialogueTiers.length
      const isChapterUnlocked = unlockedChapters.value.includes(char.chapterUnlock?.chapterId)

      return {
        id: char.id,
        name: char.name,
        icon: char.icon,
        color: char.color,
        gradient: char.gradient,
        title: char.title,
        description: char.description,
        personality: char.personality,
        affinity,
        tier: tier?.name || '未知',
        tierIcon: tier?.icon || '❓',
        tierColor: tier?.color || '#9ca3af',
        progress,
        unlockedDialogueTiers: unlockedTiers,
        totalDialogueTiers: totalTiers,
        isChapterUnlocked,
        chapterName: char.chapterUnlock?.chapterId ? 
          (affinityHiddenChapters.value.find(c => c.id === char.chapterUnlock.chapterId)?.title || '') : ''
      }
    })
  }

  const saveCharacterRelationData = () => {
    try {
      const data = {
        affinities: characterAffinities.value,
        exclusiveUnlocked: exclusiveDialogueUnlocked.value,
        log: affinityLog.value.slice(-200)
      }
      localStorage.setItem(CHARACTER_RELATION_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save character relation data:', e)
    }
  }

  const loadCharacterRelationData = () => {
    try {
      const saved = localStorage.getItem(CHARACTER_RELATION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.affinities) {
          characterAffinities.value = { ...characterAffinities.value, ...parsed.affinities }
        }
        if (parsed.exclusiveUnlocked) {
          exclusiveDialogueUnlocked.value = parsed.exclusiveUnlocked
        }
        if (parsed.log) {
          affinityLog.value = parsed.log
        }
      }
    } catch (e) {
      console.error('Failed to load character relation data:', e)
    }
  }

  const dismissAffinityNotification = (notifId) => {
    affinityNotifications.value = affinityNotifications.value.filter(n => n.id !== notifId)
  }

  const clearAffinityNotifications = () => {
    affinityNotifications.value = []
  }

  loadSavesFromStorage()
  loadChapterSnapshots()
  loadAutoSave()
  loadChapterScoreData()
  loadBranchStats()
  loadTutorialState()
  loadNewGamePlusData()
  loadCrossCycleAchievements()
  loadCharacterRelationData()
  loadQuestProgress()
  checkAndUnlockChapters()
  checkHiddenMaterialUnlockConditions()
  checkAffinityChapterUnlocks()
  initializeQuestSystem()

  const questTypeLabels = {
    main: { name: '主线', color: '#ec4899', icon: '📖' },
    side: { name: '支线', color: '#8b5cf6', icon: '✨' },
    collect: { name: '收集', color: '#f59e0b', icon: '🎯' },
    milestone: { name: '里程碑', color: '#06b6d4', icon: '🏆' },
    achievement: { name: '成就', color: '#10b981', icon: '👑' }
  }

  const getQuestById = (questId) => {
    return quests.value.find(q => q.id === questId) || null
  }

  const getQuestProgress = (questId) => {
    if (!questProgress.value[questId]) {
      questProgress.value[questId] = {
        questId,
        objectives: {},
        completed: false,
        claimed: false,
        unlocked: false,
        unlockedAt: null,
        completedAt: null
      }
    }
    return questProgress.value[questId]
  }

  const getObjectiveProgress = (questId, objectiveId) => {
    const progress = getQuestProgress(questId)
    if (!progress.objectives[objectiveId]) {
      progress.objectives[objectiveId] = {
        current: 0,
        target: 1,
        completed: false
      }
    }
    return progress.objectives[objectiveId]
  }

  const checkQuestUnlockCondition = (condition) => {
    if (!condition) return true

    switch (condition.type) {
      case 'game_start':
        return isInitialized.value
      case 'chapter_start':
        return chaptersStarted.value.includes(condition.target)
      case 'chapter_completed':
        return completedChapters.value.includes(condition.target)
      case 'quest_complete':
        return completedQuests.value.includes(condition.target)
      case 'affinity_reach':
        return (characterAffinities.value[condition.characterId] || 0) >= condition.value
      case 'emotion_reached':
        return emotionValue.value >= condition.value
      default:
        return false
    }
  }

  const checkQuestUnlock = (quest) => {
    const progress = getQuestProgress(quest.id)
    if (progress.unlocked) return true
    if (!quest.unlockConditions || quest.unlockConditions.length === 0) return true

    const allMet = quest.unlockConditions.every(condition => checkQuestUnlockCondition(condition))
    if (allMet) {
      progress.unlocked = true
      progress.unlockedAt = Date.now()
      if (!activeQuests.value.includes(quest.id)) {
        activeQuests.value.push(quest.id)
      }
      showQuestNotification(`📜 新任务解锁：${quest.title}`, 'info', 3000)
      saveQuestProgress()
    }
    return allMet
  }

  const initializeQuestSystem = () => {
    quests.value.forEach(quest => {
      checkQuestUnlock(quest)
    })
    updateTotalEmotionAccumulated()
    updateTotalCombosTriggered()
  }

  const updateObjectiveProgress = (questId, objectiveId, increment = 1) => {
    const quest = getQuestById(questId)
    if (!quest) return

    const progress = getQuestProgress(questId)
    if (progress.completed) return

    if (!progress.unlocked) {
      if (!checkQuestUnlock(quest)) return
    }

    const objective = quest.objectives.find(o => o.id === objectiveId)
    if (!objective) return

    const objProgress = getObjectiveProgress(questId, objectiveId)
    objProgress.target = objective.count || 1
    objProgress.current = Math.min(objProgress.target, objProgress.current + increment)
    objProgress.completed = objProgress.current >= objProgress.target

    checkQuestCompletion(questId)
    saveQuestProgress()
  }

  const checkQuestCompletion = (questId) => {
    const quest = getQuestById(questId)
    const progress = getQuestProgress(questId)

    if (progress.completed) return

    const allObjectivesCompleted = quest.objectives.every(obj => {
      const objProgress = getObjectiveProgress(questId, obj.id)
      return objProgress.completed
    })

    if (allObjectivesCompleted) {
      progress.completed = true
      progress.completedAt = Date.now()
      completedQuests.value.push(questId)

      const index = activeQuests.value.indexOf(questId)
      if (index > -1) {
        activeQuests.value.splice(index, 1)
      }

      claimQuestRewards(questId)

      if (quest.nextQuest) {
        const nextQuest = getQuestById(quest.nextQuest)
        if (nextQuest) {
          checkQuestUnlock(nextQuest)
        }
      }

      showQuestNotification(`✅ 任务完成：${quest.title}`, 'success', 4000)
    }
  }

  const claimQuestRewards = (questId) => {
    const quest = getQuestById(questId)
    const progress = getQuestProgress(questId)

    if (!quest || !quest.rewards || progress.claimed) return

    progress.claimed = true

    if (quest.rewards.emotion) {
      emotionValue.value += quest.rewards.emotion
      showNotification(`💖 情绪值 +${quest.rewards.emotion}`, 'success', 2000)
    }

    if (quest.rewards.materials && quest.rewards.materials.length > 0) {
      const materialNames = quest.rewards.materials.map(mId => {
        const mat = getMaterialById(mId)
        return mat ? mat.name : mId
      }).join('、')
      showNotification(`🎁 获得素材：${materialNames}`, 'success', 2500)
    }

    if (quest.rewards.affinity) {
      Object.entries(quest.rewards.affinity).forEach(([charId, value]) => {
        characterAffinities.value[charId] = Math.min(100, (characterAffinities.value[charId] || 0) + value)
        const char = characterRegistry.value.find(c => c.id === charId)
        if (char) {
          showNotification(`💕 ${char.name}好感度 +${value}`, 'success', 2000)
        }
      })
      saveCharacterRelationData()
      checkAffinityChapterUnlocks()
    }

    if (quest.rewards.unlockQuest) {
      quest.rewards.unlockQuest.forEach(qId => {
        const q = getQuestById(qId)
        if (q) checkQuestUnlock(q)
      })
    }

    if (quest.rewards.unlockChapter) {
      quest.rewards.unlockChapter.forEach(chId => {
        if (!unlockedChapters.value.includes(chId)) {
          unlockedChapters.value.push(chId)
          const ch = getChapterById(chId)
          if (ch) {
            showNotification(`📚 解锁章节：${ch.title}`, 'success', 3000)
          }
        }
      })
    }

    if (quest.rewards.unlockMaterial) {
      quest.rewards.unlockMaterial.forEach(mId => {
        if (!newGamePlus.value.unlockedHiddenMaterialIds.includes(mId)) {
          newGamePlus.value.unlockedHiddenMaterialIds.push(mId)
          const mat = hiddenMaterialsRegistry.value.find(m => m.id === mId)
          if (mat) {
            showNotification(`✨ 解锁隐藏素材：${mat.name}`, 'success', 3000)
          }
        }
      })
      saveNewGamePlusData()
    }

    if (quest.rewards.unlockAchievement) {
      quest.rewards.unlockAchievement.forEach(achId => {
        const achievement = crossCycleAchievements.value.find(a => a.id === achId)
        if (achievement && !achievement.unlocked) {
          achievement.unlocked = true
          achievement.unlockedAt = Date.now()
          showNotification(`🏆 成就解锁：${achievement.name}`, 'success', 3000)
        }
      })
      saveCrossCycleAchievements()
    }

    saveQuestProgress()
  }

  const trackQuestEvent = (eventType, eventData) => {
    if (!isInitialized.value) return

    activeQuests.value.forEach(questId => {
      const quest = getQuestById(questId)
      if (!quest) return

      quest.objectives.forEach(objective => {
        let shouldUpdate = false

        switch (objective.type) {
          case 'place_material':
            shouldUpdate = eventType === 'place_material' && eventData.materialId === objective.target
            break
          case 'trigger_combo':
            shouldUpdate = eventType === 'trigger_combo' && eventData.comboId === objective.target
            break
          case 'complete_scene':
            shouldUpdate = eventType === 'complete_scene' && eventData.sceneId === objective.target
            break
          case 'complete_chapter':
            shouldUpdate = eventType === 'complete_chapter' && eventData.chapterId === objective.target
            break
          case 'start_chapter':
            shouldUpdate = eventType === 'start_chapter' && eventData.chapterId === objective.target
            break
          case 'emotion_reach':
            shouldUpdate = eventType === 'emotion_change' && emotionValue.value >= objective.target
            break
          case 'total_emotion_reach':
            shouldUpdate = eventType === 'emotion_change' && totalEmotionAccumulated.value >= objective.target
            break
          case 'total_combos':
            shouldUpdate = eventType === 'trigger_combo' && totalCombosTriggered.value >= objective.target
            break
          case 'find_hidden_dialogue':
            shouldUpdate = eventType === 'find_hidden_dialogue' && eventData.chapterId === objective.target
            break
          case 'chapter_complete_perfect':
            shouldUpdate = eventType === 'complete_chapter' && eventData.chapterId === objective.target && eventData.isPerfect
            break
        }

        if (shouldUpdate) {
          updateObjectiveProgress(questId, objective.id, 1)
        }
      })
    })

    quests.value.forEach(quest => {
      if (!activeQuests.value.includes(quest.id) && !completedQuests.value.includes(quest.id)) {
        checkQuestUnlock(quest)
      }
    })
  }

  const updateTotalEmotionAccumulated = () => {
    let total = emotionValue.value
    Object.values(chapterScoreData.value).forEach(score => {
      if (score.totalEmotion) total += score.totalEmotion
    })
    totalEmotionAccumulated.value = total
  }

  const updateTotalCombosTriggered = () => {
    const globalSet = buildGlobalTriggeredComboSet()
    totalCombosTriggered.value = globalSet.size + triggeredCombos.value.length
  }

  const showQuestNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now()
    questNotifications.value.push({ id, message, type })
    showNotification(message, type, duration)
    setTimeout(() => {
      const index = questNotifications.value.findIndex(n => n.id === id)
      if (index > -1) {
        questNotifications.value.splice(index, 1)
      }
    }, duration)
  }

  const toggleQuestPanel = () => {
    showQuestPanel.value = !showQuestPanel.value
  }

  const openQuestPanel = () => {
    showQuestPanel.value = true
  }

  const closeQuestPanel = () => {
    showQuestPanel.value = false
  }

  const selectQuest = (questId) => {
    selectedQuestId.value = questId
  }

  const clearSelectedQuest = () => {
    selectedQuestId.value = null
  }

  const getQuestTypeInfo = (type) => {
    return questTypeLabels[type] || questTypeLabels.main
  }

  const sortedActiveQuests = computed(() => {
    return activeQuests.value
      .map(id => getQuestById(id))
      .filter(Boolean)
      .sort((a, b) => a.priority - b.priority)
  })

  const sortedCompletedQuests = computed(() => {
    return completedQuests.value
      .map(id => getQuestById(id))
      .filter(Boolean)
      .sort((a, b) => {
        const progressA = getQuestProgress(a.id)
        const progressB = getQuestProgress(b.id)
        return (progressB.completedAt || 0) - (progressA.completedAt || 0)
      })
  })

  const questCompletionStats = computed(() => {
    const total = quests.value.length
    const completed = completedQuests.value.length
    const active = activeQuests.value.length
    const locked = total - completed - active

    const byType = {}
    Object.keys(questTypeLabels).forEach(type => {
      const typeQuests = quests.value.filter(q => q.type === type)
      byType[type] = {
        total: typeQuests.length,
        completed: typeQuests.filter(q => completedQuests.value.includes(q.id)).length,
        active: typeQuests.filter(q => activeQuests.value.includes(q.id)).length
      }
    })

    return {
      total,
      completed,
      active,
      locked,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      byType
    }
  })

  const currentChapterQuests = computed(() => {
    if (!currentChapterId.value) return []
    return sortedActiveQuests.value.filter(q => q.chapterId === currentChapterId.value)
  })

  const saveQuestProgress = () => {
    try {
      localStorage.setItem(QUEST_PROGRESS_KEY, JSON.stringify({
        questProgress: questProgress.value,
        activeQuests: activeQuests.value,
        completedQuests: completedQuests.value,
        totalEmotionAccumulated: totalEmotionAccumulated.value,
        totalCombosTriggered: totalCombosTriggered.value,
        scenesCompleted: scenesCompleted.value,
        chaptersStarted: chaptersStarted.value
      }))
    } catch (e) {
      console.error('Failed to save quest progress:', e)
    }
  }

  const loadQuestProgress = () => {
    try {
      const saved = localStorage.getItem(QUEST_PROGRESS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        questProgress.value = parsed.questProgress || {}
        activeQuests.value = parsed.activeQuests || []
        completedQuests.value = parsed.completedQuests || []
        totalEmotionAccumulated.value = parsed.totalEmotionAccumulated || 0
        totalCombosTriggered.value = parsed.totalCombosTriggered || 0
        scenesCompleted.value = parsed.scenesCompleted || []
        chaptersStarted.value = parsed.chaptersStarted || []
      }
    } catch (e) {
      console.error('Failed to load quest progress:', e)
    }
  }

  const resetQuestProgress = () => {
    questProgress.value = {}
    activeQuests.value = []
    completedQuests.value = []
    totalEmotionAccumulated.value = 0
    totalCombosTriggered.value = 0
    scenesCompleted.value = []
    chaptersStarted.value = []
    localStorage.removeItem(QUEST_PROGRESS_KEY)
    initializeQuestSystem()
  }

  const startChapterWithTracking = (chapterId) => {
    const chapter = getChapterById(chapterId)
    if (!chapter || !unlockedChapters.value.includes(chapterId)) return

    resetStats()
    startChapter(chapterId)
    saveChapterSnapshot(chapterId)
    startGameSession()
  }

  watch(currentDialogueIndex, () => {
    if (!currentChapterId.value || !isInitialized.value) return
    dialogueCountSinceLastAutoSave.value++
    markSessionActive()
    if (dialogueCountSinceLastAutoSave.value >= AUTO_SAVE_DIALOGUE_INTERVAL) {
      if (autoSave()) {
        showNotification('自动存档已保存', 'info', 1500)
      }
    }
  })

  watch(isWaitingForMaterial, (val, oldVal) => {
    if (!isInitialized.value) return
    if (oldVal === true && val === false) {
      markSessionActive()
      if (autoSave()) {
        showNotification('素材放置完成，已自动存档', 'info', 1800)
      }
    }
  })

  watch(currentSceneId, (newScene, oldScene) => {
    if (!isInitialized.value || !currentChapterId.value) return
    if (newScene && oldScene && newScene !== oldScene) {
      markSessionActive()
      if (autoSave()) {
        showNotification('场景切换，已自动存档', 'info', 1500)
      }
    }
  })

  setupEventListeners()

  return {
    chapters,
    materials,
    scenes,
    endings,
    currentChapterId,
    currentSceneId,
    currentDialogueIndex,
    emotionValue,
    perfectPlacementCount,
    totalDialogueCount,
    positiveBonus,
    placedMaterials,
    unlockedChapters,
    completedChapters,
    isWaitingForMaterial,
    requiredMaterialId,
    showSaveModal,
    showLoadModal,
    saveSlots,
    gameCompleted,
    currentEnding,
    triggeredCombos,
    pendingHiddenDialogues,
    isShowingHiddenDialogue,
    sceneBackgroundOverride,
    activeSceneFeedback,
    comboBonusTotal,
    optionalMaterialsPlaced,
    requiredMaterialPlaced,
    comboJustTriggered,
    activeHiddenDialogue,
    autoSaveEnabled,
    lastAutoSaveTime,
    autoSaveData,
    chapterSnapshots,
    notification,
    showRecoveryModal,
    recoveryData,
    isInitialized,
    currentChapterLog,
    chapterScoreData,
    dialogueHistory,
    typingSpeed,
    currentChapter,
    currentScene,
    currentDialogue,
    availableMaterials,
    filteredAvailableMaterials,
    currentSceneCombos,
    currentSceneTriggeredCombos,
    currentSceneOptionalMaterials,
    availableOptionalMaterials,
    canPlaceOptionalMaterial,
    materialCategories,
    materialTags,
    activeMaterialFilter,
    materialUsageHistory,
    materialPlacementSequence,
    chapterCompletionDetails,
    keyDialogueLines,
    hiddenDialogueSequence,
    branchStats,
    currentPathSequence,
    currentTimeOfDay,
    currentWeather,
    currentEnvironmentVariant,
    effectiveSceneBackground,
    currentEnvironmentInfo,
    sceneRecommendedMaterials,
    scenePlacedMaterialIds,
    allRecommendedMaterialIds,
    getMaterialPriorityInfo,
    hasPendingRecommendations,
    setMaterialFilter,
    resetMaterialFilter,
    getMaterialUsageCount,
    canProceed,
    emotionPercentage,
    emotionTiers,
    currentEmotionTier,
    emotionTierProgress,
    emotionSceneTint,
    emotionDialogueStyle,
    chapterEmotionProgress,
    getMaterialById,
    getChapterById,
    setEnvironment,
    startChapter,
    startChapterWithTracking,
    nextDialogue,
    placeMaterial,
    placeOptionalMaterial,
    checkMaterialCombos,
    triggerCombo,
    dismissComboNotification,
    completeChapter,
    completeGame,
    evaluateEndingConditions,
    checkEndingTriggerConditions,
    selectEnding,
    saveGame,
    loadGame,
    loadSavesFromStorage,
    resetGame,
    goToChapterSelect,
    resetStats,
    validateSaveData,
    showNotification,
    clearNotification,
    autoSave,
    loadAutoSave,
    restoreFromAutoSave,
    saveChapterSnapshot,
    loadChapterSnapshots,
    hasChapterSnapshot,
    rollbackToChapterStart,
    deleteChapterSnapshot,
    getChapterScoreDetail,
    getChapterTotalCombos,
    getChapterTriggeredCombos,
    getChapterTotalHiddenDialogues,
    getChapterTriggeredHiddenDialogues,
    getChapterCompletion,
    getChapterUncollectedCombos,
    getChapterCollectedHint,
    isChapterConditionMet,
    getUnmetConditions,
    getMetConditions,
    getConditionProgress,
    isChapterVisible,
    areAllConditionsMet,
    checkAndUnlockChapters,
    saveChapterScoreData,
    loadChapterScoreData,
    backupSaveSlots,
    restoreFromBackup,
    markSessionActive,
    markSessionEnded,
    startHeartbeat,
    stopHeartbeat,
    startGameSession,
    endGameSession,
    checkForCrashRecovery,
    confirmRecovery,
    dismissRecovery,
    setupEventListeners,
    cleanupEventListeners,
    addToDialogueHistory,
    setTypingSpeed,
    recordBranchChoice,
    recordSceneTransition,
    finalizeChapterPathStats,
    getTopChoicePaths,
    getHotTransitions,
    getSceneDecisionSummary,
    getChapterBranchOverview,
    saveBranchStats,
    loadBranchStats,
    resetBranchStats,
    generateBranchStatsReport,
    tutorialState,
    getTutorialSteps,
    showTutorial,
    hideTutorial,
    nextTutorialStep,
    prevTutorialStep,
    setTutorialStep,
    markTutorialStepCompleted,
    completeTutorial,
    saveTutorialState,
    loadTutorialState,
    resetTutorial,
    shouldShowFirstTimeTutorial,
    getCurrentTutorialStep,
    generateSaveThumbnail,
    latestSaveSlotIndex,
    getSaveThumbnail,
    newGamePlus,
    hiddenMaterialsRegistry,
    crossCycleAchievements,
    ngpNotification,
    achievementNotification,
    newlyUnlockedAchievements,
    ACHIEVEMENT_CATEGORIES,
    ACHIEVEMENT_RARITY,
    calculateInheritedEmotion,
    getEffectiveInheritanceRatio,
    getUnlockedHiddenMaterials,
    isMaterialUnlocked,
    checkHiddenMaterialUnlockConditions,
    checkCrossCycleAchievements,
    checkAchievements,
    checkAchievementsByCategory,
    unlockAchievement,
    getAchievementsByCategory,
    getAchievementRarityInfo,
    getAchievementCategoryInfo,
    getAchievementStats,
    getRecentlyUnlockedAchievements,
    clearNewlyUnlockedAchievements,
    saveNewGamePlusData,
    loadNewGamePlusData,
    saveCrossCycleAchievements,
    loadCrossCycleAchievements,
    startNewCycle,
    getAllMaterialsWithHidden,
    isNgpConditionMet,
    showNgpNotification,
    getNgpSummary,
    generateNgpNextGoals,
    getGalleryDialogues,
    getGalleryScenes,
    getGalleryMaterials,
    getGalleryEndings,
    getGalleryStats,
    getEndingTypeLabel,
    getEndingTypeIcon,
    characterRegistry,
    characterAffinities,
    affinityLog,
    exclusiveDialogueUnlocked,
    affinityNotifications,
    affinityHiddenChapters,
    characterExclusiveDialogues,
    getCharacterAffinity,
    getCharacterAffinityTier,
    getCharacterAffinityProgress,
    changeAffinity,
    processDialogueAffinity,
    processMaterialAffinity,
    processChapterCompletionAffinity,
    checkExclusiveDialogueUnlocks,
    checkAffinityChapterUnlocks,
    getAffinitySummary,
    saveCharacterRelationData,
    loadCharacterRelationData,
    dismissAffinityNotification,
    clearAffinityNotifications,
    quests,
    questProgress,
    activeQuests,
    completedQuests,
    questNotifications,
    showQuestPanel,
    selectedQuestId,
    totalEmotionAccumulated,
    totalCombosTriggered,
    scenesCompleted,
    chaptersStarted,
    getQuestById,
    getQuestProgress,
    getObjectiveProgress,
    checkQuestUnlock,
    trackQuestEvent,
    toggleQuestPanel,
    openQuestPanel,
    closeQuestPanel,
    selectQuest,
    clearSelectedQuest,
    getQuestTypeInfo,
    sortedActiveQuests,
    sortedCompletedQuests,
    questCompletionStats,
    currentChapterQuests,
    saveQuestProgress,
    loadQuestProgress,
    resetQuestProgress,
    runtimeWarnings,
    showRuntimeWarningModal,
    validateRuntimeData,
    dismissRuntimeWarning
  }
})
