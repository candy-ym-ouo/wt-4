import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import decorationsData from '../data/decorations.json'
import { useGameStore } from './gameStore'

const DECORATION_STORAGE_KEY = 'journal_decorations'
const APPLIED_DECORATION_KEY = 'journal_applied_decorations'

export const DECORATION_CATEGORIES = {
  BACKGROUND: 'background',
  FRAME: 'frame',
  FONT: 'font',
  COVER: 'cover'
}

export const DECORATION_CATEGORY_INFO = {
  [DECORATION_CATEGORIES.BACKGROUND]: {
    id: DECORATION_CATEGORIES.BACKGROUND,
    name: '页面背景',
    icon: '🎨',
    description: '装扮你的手账页面背景'
  },
  [DECORATION_CATEGORIES.FRAME]: {
    id: DECORATION_CATEGORIES.FRAME,
    name: '贴纸边框',
    icon: '🖼️',
    description: '为内容添加精美的边框'
  },
  [DECORATION_CATEGORIES.FONT]: {
    id: DECORATION_CATEGORIES.FONT,
    name: '字体主题',
    icon: '✍️',
    description: '选择你喜欢的字体风格'
  },
  [DECORATION_CATEGORIES.COVER]: {
    id: DECORATION_CATEGORIES.COVER,
    name: '章节封面',
    icon: '📖',
    description: '为章节设计独特的封面'
  }
}

export const DECORATION_RARITY = {
  COMMON: { id: 'common', name: '普通', color: '#6b7280', bgColor: '#f3f4f6' },
  RARE: { id: 'rare', name: '稀有', color: '#8b5cf6', bgColor: '#ede9fe' },
  EPIC: { id: 'epic', name: '史诗', color: '#ec4899', bgColor: '#fce7f3' },
  LEGENDARY: { id: 'legendary', name: '传说', color: '#f59e0b', bgColor: '#fef3c7' }
}

export const useDecorationStore = defineStore('decoration', () => {
  let _gameStore = null
  
  const getGameStore = () => {
    if (!_gameStore) {
      _gameStore = useGameStore()
    }
    return _gameStore
  }

  const safeGetGameStore = () => {
    try {
      return getGameStore()
    } catch (e) {
      return null
    }
  }

  const decorations = ref(decorationsData.map(d => ({ ...d })))

  const unlockedDecorationIds = ref([])
  const decorationUnlockTimes = ref({})

  const appliedDecorations = ref({
    [DECORATION_CATEGORIES.BACKGROUND]: 'bg_spring_sakura',
    [DECORATION_CATEGORIES.FRAME]: 'frame_hearts',
    [DECORATION_CATEGORIES.FONT]: 'font_elegant_serif',
    [DECORATION_CATEGORIES.COVER]: 'cover_spring'
  })

  const chapterCovers = ref({})

  const decorationNotification = ref(null)
  const newlyUnlockedDecorations = ref([])

  const totalDecorations = computed(() => decorations.value.length)
  
  const unlockedCount = computed(() => 
    decorations.value.filter(d => d.unlocked || unlockedDecorationIds.value.includes(d.id)).length
  )

  const lockedCount = computed(() => totalDecorations.value - unlockedCount.value)

  const completionPercent = computed(() => 
    totalDecorations.value > 0 ? (unlockedCount.value / totalDecorations.value) * 100 : 0
  )

  const backgroundDecorations = computed(() => 
    decorations.value.filter(d => d.category === DECORATION_CATEGORIES.BACKGROUND)
  )

  const frameDecorations = computed(() => 
    decorations.value.filter(d => d.category === DECORATION_CATEGORIES.FRAME)
  )

  const fontDecorations = computed(() => 
    decorations.value.filter(d => d.category === DECORATION_CATEGORIES.FONT)
  )

  const coverDecorations = computed(() => 
    decorations.value.filter(d => d.category === DECORATION_CATEGORIES.COVER)
  )

  const unlockedBackgrounds = computed(() => 
    backgroundDecorations.value.filter(d => isDecorationUnlocked(d.id))
  )

  const unlockedFrames = computed(() => 
    frameDecorations.value.filter(d => isDecorationUnlocked(d.id))
  )

  const unlockedFonts = computed(() => 
    fontDecorations.value.filter(d => isDecorationUnlocked(d.id))
  )

  const unlockedCovers = computed(() => 
    coverDecorations.value.filter(d => isDecorationUnlocked(d.id))
  )

  const getCategoryDecorations = (category) => {
    return decorations.value.filter(d => d.category === category)
  }

  const getUnlockedCategoryDecorations = (category) => {
    return getCategoryDecorations(category).filter(d => isDecorationUnlocked(d.id))
  }

  const getDecorationById = (id) => {
    return decorations.value.find(d => d.id === id)
  }

  const isDecorationUnlocked = (id) => {
    const decoration = getDecorationById(id)
    if (!decoration) return false
    return decoration.unlocked || unlockedDecorationIds.value.includes(id)
  }

  const isDecorationApplied = (category, id) => {
    return appliedDecorations.value[category] === id
  }

  const getAppliedDecoration = (category) => {
    const id = appliedDecorations.value[category]
    return getDecorationById(id)
  }

  const getChapterCover = (chapterId) => {
    const coverId = chapterCovers.value[chapterId]
    if (coverId) {
      return getDecorationById(coverId)
    }
    return getAppliedDecoration(DECORATION_CATEGORIES.COVER)
  }

  const applyDecoration = (category, id) => {
    if (!isDecorationUnlocked(id)) {
      showNotification('该装扮尚未解锁', 'warning')
      return false
    }
    
    const decoration = getDecorationById(id)
    if (!decoration || decoration.category !== category) {
      return false
    }

    appliedDecorations.value[category] = id
    saveAppliedDecorations()
    
    const categoryInfo = DECORATION_CATEGORY_INFO[category]
    showNotification(`已应用「${decoration.name}」到${categoryInfo.name}`, 'success')
    return true
  }

  const applyChapterCover = (chapterId, coverId) => {
    if (!isDecorationUnlocked(coverId)) {
      showNotification('该封面尚未解锁', 'warning')
      return false
    }
    
    const decoration = getDecorationById(coverId)
    if (!decoration || decoration.category !== DECORATION_CATEGORIES.COVER) {
      return false
    }

    chapterCovers.value[chapterId] = coverId
    saveAppliedDecorations()
    
    showNotification(`已为章节设置「${decoration.name}」封面`, 'success')
    return true
  }

  const resetChapterCover = (chapterId) => {
    if (chapterCovers.value[chapterId]) {
      delete chapterCovers.value[chapterId]
      saveAppliedDecorations()
      showNotification('已重置章节封面为默认', 'success')
      return true
    }
    return false
  }

  const unlockDecoration = (id) => {
    if (isDecorationUnlocked(id)) {
      return false
    }

    const decoration = getDecorationById(id)
    if (!decoration) {
      return false
    }

    unlockedDecorationIds.value.push(id)
    decorationUnlockTimes.value[id] = Date.now()
    
    newlyUnlockedDecorations.value.push({
      ...decoration,
      unlockedAt: decorationUnlockTimes.value[id]
    })

    showDecorationUnlockNotification(decoration)
    saveDecorations()
    
    return true
  }

  const checkDecorationUnlockConditions = () => {
    const state = {
      completedChapters: getGameStore().completedChapters,
      chapterCompletionDetails: getGameStore().chapterCompletionDetails,
      emotionValue: getGameStore().emotionValue,
      newGamePlus: getGameStore().newGamePlus,
      crossCycleAchievements: getGameStore().crossCycleAchievements,
      chapters: getGameStore().chapters,
      scenes: getGameStore().scenes
    }

    const globalTriggeredComboSet = buildGlobalTriggeredComboSet()
    const totalCombosTriggered = globalTriggeredComboSet.size

    const totalHiddenDialogues = getGameStore().chapters.reduce((sum, ch) =>
      sum + getGameStore().getChapterTotalHiddenDialogues(ch.id), 0)
    const foundHiddenDialogues = getGameStore().chapters.reduce((sum, ch) =>
      sum + getGameStore().getChapterTriggeredHiddenDialogues(ch.id), 0)

    decorations.value.forEach(decoration => {
      if (isDecorationUnlocked(decoration.id)) return
      
      const condition = decoration.unlockCondition
      if (!condition) return

      let shouldUnlock = false

      switch (condition.type) {
        case 'chapter_completed':
          shouldUnlock = state.completedChapters.includes(condition.target)
          break

        case 'chapter_perfect':
          const chapterDetail = state.chapterCompletionDetails[condition.target]
          shouldUnlock = chapterDetail?.isPerfect || false
          break

        case 'all_chapters_completed':
          shouldUnlock = state.chapters.every(ch => state.completedChapters.includes(ch.id))
          break

        case 'all_chapters_perfect':
          shouldUnlock = state.chapters.every(ch => {
            const detail = state.chapterCompletionDetails[ch.id]
            return detail?.isPerfect || false
          })
          break

        case 'ending_discovered':
          shouldUnlock = state.newGamePlus.discoveredEndingIds.includes(condition.target)
          break

        case 'all_endings':
          shouldUnlock = state.newGamePlus.discoveredEndingIds.length >= 6
          break

        case 'emotion_reached':
          shouldUnlock = state.emotionValue >= condition.value
          break

        case 'combo_triggered':
          shouldUnlock = totalCombosTriggered >= condition.count
          break

        case 'hidden_dialogue':
          shouldUnlock = foundHiddenDialogues >= condition.count
          break

        case 'all_hidden_dialogues':
          shouldUnlock = totalHiddenDialogues > 0 && foundHiddenDialogues >= totalHiddenDialogues
          break

        case 'achievement':
          const achievement = state.crossCycleAchievements.find(a => a.id === condition.target)
          shouldUnlock = achievement?.unlocked || false
          break

        case 'all_achievements':
          shouldUnlock = state.crossCycleAchievements.every(a => a.unlocked)
          break

        case 'cycle_3':
          shouldUnlock = state.newGamePlus.totalPlaythroughs >= 3
          break

        case 'cycle_5':
          shouldUnlock = state.newGamePlus.totalPlaythroughs >= 5
          break

        case 'perfect_cycle':
          shouldUnlock = state.newGamePlus.perfectCycleHistory.length >= 1
          break

        case 'material_unlocked':
          shouldUnlock = state.newGamePlus.unlockedHiddenMaterialIds.includes(condition.target)
          break
      }

      if (shouldUnlock) {
        unlockDecoration(decoration.id)
      }
    })
  }

  const buildGlobalTriggeredComboSet = () => {
    const globalSet = new Set()
    
    Object.keys(getGameStore().chapterSnapshots || {}).forEach(chapterId => {
      const snapshot = getGameStore().chapterSnapshots[chapterId]
      if (snapshot?.triggeredCombos) {
        snapshot.triggeredCombos.forEach(comboId => globalSet.add(comboId))
      }
    })
    
    getGameStore().triggeredCombos.forEach(combo => {
      globalSet.add(combo.id)
    })
    
    return globalSet
  }

  const showDecorationUnlockNotification = (decoration) => {
    const rarity = DECORATION_RARITY[decoration.rarity.toUpperCase()]
    decorationNotification.value = {
      id: decoration.id,
      name: decoration.name,
      description: decoration.description,
      icon: DECORATION_CATEGORY_INFO[decoration.category].icon,
      rarity: rarity,
      category: decoration.category,
      timestamp: Date.now()
    }

    setTimeout(() => {
      if (decorationNotification.value?.id === decoration.id) {
        decorationNotification.value = null
      }
    }, 4000)
  }

  const showNotification = (message, type = 'info') => {
    getGameStore().showNotification(message, type)
  }

  const clearNewlyUnlocked = () => {
    newlyUnlockedDecorations.value = []
  }

  const getCategoryStats = (category) => {
    const all = getCategoryDecorations(category)
    const unlocked = all.filter(d => isDecorationUnlocked(d.id))
    return {
      total: all.length,
      unlocked: unlocked.length,
      percent: all.length > 0 ? (unlocked.length / all.length) * 100 : 0
    }
  }

  const getStats = () => {
    return {
      total: totalDecorations.value,
      unlocked: unlockedCount.value,
      percent: completionPercent.value,
      background: getCategoryStats(DECORATION_CATEGORIES.BACKGROUND),
      frame: getCategoryStats(DECORATION_CATEGORIES.FRAME),
      font: getCategoryStats(DECORATION_CATEGORIES.FONT),
      cover: getCategoryStats(DECORATION_CATEGORIES.COVER),
      byRarity: {
        common: getRarityStats('common'),
        rare: getRarityStats('rare'),
        epic: getRarityStats('epic'),
        legendary: getRarityStats('legendary')
      }
    }
  }

  const getRarityStats = (rarity) => {
    const all = decorations.value.filter(d => d.rarity === rarity)
    const unlocked = all.filter(d => isDecorationUnlocked(d.id))
    return {
      total: all.length,
      unlocked: unlocked.length
    }
  }

  const getAppliedStyle = (category) => {
    const decoration = getAppliedDecoration(category)
    if (!decoration) return {}

    const preview = decoration.preview
    const style = {}

    switch (category) {
      case DECORATION_CATEGORIES.BACKGROUND:
        if (preview.type === 'gradient') {
          style.background = preview.value
        }
        if (preview.pattern) {
          style.backgroundPattern = preview.pattern
        }
        break

      case DECORATION_CATEGORIES.FRAME:
        style.borderStyle = preview.style
        style.borderColor = preview.color
        break

      case DECORATION_CATEGORIES.FONT:
        style.fontFamily = preview.family
        if (preview.effect === 'gradient') {
          style.color = preview.color
          style.backgroundClip = 'text'
          style.WebkitBackgroundClip = 'text'
          style.WebkitTextFillColor = 'transparent'
        } else {
          style.color = preview.color
        }
        style.fontEffect = preview.effect
        break

      case DECORATION_CATEGORIES.COVER:
        style.coverBackground = preview.background
        style.coverIcon = preview.icon
        style.coverTitleColor = preview.titleColor
        style.coverEffect = preview.effect
        break
    }

    return style
  }

  const saveDecorations = () => {
    try {
      const saveData = {
        unlockedDecorationIds: unlockedDecorationIds.value,
        decorationUnlockTimes: decorationUnlockTimes.value
      }
      localStorage.setItem(DECORATION_STORAGE_KEY, JSON.stringify(saveData))
    } catch (e) {
      console.error('Failed to save decorations:', e)
    }
  }

  const loadDecorations = () => {
    try {
      const saved = localStorage.getItem(DECORATION_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.unlockedDecorationIds) {
          unlockedDecorationIds.value = parsed.unlockedDecorationIds
        }
        if (parsed.decorationUnlockTimes) {
          decorationUnlockTimes.value = parsed.decorationUnlockTimes
        }
      }
    } catch (e) {
      console.error('Failed to load decorations:', e)
    }
  }

  const saveAppliedDecorations = () => {
    try {
      const saveData = {
        appliedDecorations: appliedDecorations.value,
        chapterCovers: chapterCovers.value
      }
      localStorage.setItem(APPLIED_DECORATION_KEY, JSON.stringify(saveData))
    } catch (e) {
      console.error('Failed to save applied decorations:', e)
    }
  }

  const loadAppliedDecorations = () => {
    try {
      const saved = localStorage.getItem(APPLIED_DECORATION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.appliedDecorations) {
          appliedDecorations.value = {
            ...appliedDecorations.value,
            ...parsed.appliedDecorations
          }
        }
        if (parsed.chapterCovers) {
          chapterCovers.value = parsed.chapterCovers
        }
      }
    } catch (e) {
      console.error('Failed to load applied decorations:', e)
    }
  }

  const resetDecorations = () => {
    unlockedDecorationIds.value = []
    decorationUnlockTimes.value = {}
    newlyUnlockedDecorations.value = []
    appliedDecorations.value = {
      [DECORATION_CATEGORIES.BACKGROUND]: 'bg_spring_sakura',
      [DECORATION_CATEGORIES.FRAME]: 'frame_hearts',
      [DECORATION_CATEGORIES.FONT]: 'font_elegant_serif',
      [DECORATION_CATEGORIES.COVER]: 'cover_spring'
    }
    chapterCovers.value = {}
    localStorage.removeItem(DECORATION_STORAGE_KEY)
    localStorage.removeItem(APPLIED_DECORATION_KEY)
  }

  let unwatch1 = null
  let unwatch2 = null

  const initialize = () => {
    loadDecorations()
    loadAppliedDecorations()
    
    if (unwatch1) unwatch1()
    if (unwatch2) unwatch2()
    
    unwatch1 = watch(
      () => {
        const gs = safeGetGameStore()
        if (!gs || !gs.newGamePlus) return []
        return [
          gs.completedChapters,
          gs.emotionValue,
          gs.newGamePlus.totalPlaythroughs,
          gs.newGamePlus.discoveredEndingIds,
          gs.newGamePlus.perfectCycleHistory,
          gs.newGamePlus.unlockedHiddenMaterialIds,
          gs.triggeredCombos
        ]
      },
      () => {
        const gs = safeGetGameStore()
        if (gs) {
          checkDecorationUnlockConditions()
        }
      },
      { deep: true }
    )

    unwatch2 = watch(
      () => {
        const gs = safeGetGameStore()
        if (gs && gs.crossCycleAchievements) {
          return gs.crossCycleAchievements.filter(a => a.unlocked).length
        }
        return 0
      },
      () => {
        const gs = safeGetGameStore()
        if (gs) {
          checkDecorationUnlockConditions()
        }
      }
    )
  }

  return {
    decorations,
    unlockedDecorationIds,
    decorationUnlockTimes,
    appliedDecorations,
    chapterCovers,
    decorationNotification,
    newlyUnlockedDecorations,

    totalDecorations,
    unlockedCount,
    lockedCount,
    completionPercent,

    backgroundDecorations,
    frameDecorations,
    fontDecorations,
    coverDecorations,

    unlockedBackgrounds,
    unlockedFrames,
    unlockedFonts,
    unlockedCovers,

    getCategoryDecorations,
    getUnlockedCategoryDecorations,
    getDecorationById,
    isDecorationUnlocked,
    isDecorationApplied,
    getAppliedDecoration,
    getChapterCover,

    applyDecoration,
    applyChapterCover,
    resetChapterCover,
    unlockDecoration,
    checkDecorationUnlockConditions,

    getStats,
    getCategoryStats,
    getAppliedStyle,

    clearNewlyUnlocked,
    initialize,
    resetDecorations,

    DECORATION_CATEGORIES,
    DECORATION_CATEGORY_INFO,
    DECORATION_RARITY
  }
})
