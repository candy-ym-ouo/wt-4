import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useGameStore } from './gameStore'

const PROFILE_STORAGE_KEY = 'journal_user_profile'
const EMOTION_HISTORY_KEY = 'journal_emotion_history'
const FAVORITES_KEY = 'journal_favorites'
const PREFERENCES_KEY = 'journal_preferences'

export const useProfileStore = defineStore('profile', () => {
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

  const userProfile = ref({
    nickname: '旅人',
    avatar: '🌸',
    createdAt: null,
    lastPlayedAt: null,
    totalPlayTime: 0,
    totalPlaySessions: 0
  })

  const clearRecords = ref([])

  const emotionHistory = ref([])

  const preferences = ref({
    favoriteMaterials: [],
    favoriteTags: [],
    preferredCharacters: [],
    materialUsageCount: {},
    choicePatterns: {},
    favoriteTimeOfDay: 'day',
    favoriteWeather: 'clear'
  })

  const favorites = ref({
    dialogues: [],
    scenes: [],
    materials: [],
    endings: [],
    combos: []
  })

  const playSessions = ref([])

  const profileNotification = ref(null)

  const totalClearCount = computed(() => clearRecords.value.length)

  const perfectClearCount = computed(() => 
    clearRecords.value.filter(r => r.isPerfect).length
  )

  const averageEmotion = computed(() => {
    if (emotionHistory.value.length === 0) return 0
    const sum = emotionHistory.value.reduce((acc, e) => acc + e.value, 0)
    return Math.round(sum / emotionHistory.value.length)
  })

  const emotionTrend = computed(() => {
    if (emotionHistory.value.length < 2) return 'stable'
    const recent = emotionHistory.value.slice(-10)
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2))
    const secondHalf = recent.slice(Math.floor(recent.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b.value, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b.value, 0) / secondHalf.length
    const diff = secondAvg - firstAvg
    if (diff > 5) return 'rising'
    if (diff < -5) return 'falling'
    return 'stable'
  })

  const favoriteMaterial = computed(() => {
    const usage = preferences.value.materialUsageCount
    const sorted = Object.entries(usage).sort((a, b) => b[1] - a[1])
    if (sorted.length === 0) return null
    const gs = safeGetGameStore()
    if (gs) {
      return gs.getMaterialById(sorted[0][0])
    }
    return { id: sorted[0][0], count: sorted[0][1] }
  })

  const mostPlayedChapter = computed(() => {
    if (clearRecords.value.length === 0) return null
    const chapterCounts = {}
    clearRecords.value.forEach(r => {
      chapterCounts[r.chapterId] = (chapterCounts[r.chapterId] || 0) + 1
    })
    const sorted = Object.entries(chapterCounts).sort((a, b) => b[1] - a[1])
    const gs = safeGetGameStore()
    if (gs && sorted.length > 0) {
      const chapter = gs.getChapterById(sorted[0][0])
      return chapter ? { ...chapter, playCount: sorted[0][1] } : null
    }
    return null
  })

  const totalFavoritesCount = computed(() => {
    return (
      favorites.value.dialogues.length +
      favorites.value.scenes.length +
      favorites.value.materials.length +
      favorites.value.endings.length +
      favorites.value.combos.length
    )
  })

  const initProfile = () => {
    if (!userProfile.value.createdAt) {
      userProfile.value.createdAt = Date.now()
      saveProfile()
    }
  }

  const updateLastPlayed = () => {
    userProfile.value.lastPlayedAt = Date.now()
    userProfile.value.totalPlaySessions++
    saveProfile()
  }

  const addPlayTime = (seconds) => {
    userProfile.value.totalPlayTime += seconds
    saveProfile()
  }

  const addClearRecord = (chapterId, score, isPerfect, details = {}) => {
    const record = {
      id: `clear_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chapterId,
      score,
      isPerfect,
      completedAt: Date.now(),
      playDuration: details.playDuration || 0,
      finalEmotion: details.finalEmotion || 0,
      materialsUsed: details.materialsUsed || [],
      combosTriggered: details.combosTriggered || [],
      endingReached: details.endingId || null,
      choices: details.choices || [],
      ...details
    }
    clearRecords.value.push(record)
    saveProfile()

    recordEmotion(details.finalEmotion || 0, 'chapter_complete', { chapterId })
    updatePreferencesAfterChapter(details)
  }

  const getChapterClearRecords = (chapterId) => {
    return clearRecords.value.filter(r => r.chapterId === chapterId)
  }

  const getBestScore = (chapterId) => {
    const records = getChapterClearRecords(chapterId)
    if (records.length === 0) return null
    return records.reduce((best, current) => 
      current.score > best.score ? current : best
    )
  }

  const recordEmotion = (value, source = 'gameplay', detail = {}) => {
    const entry = {
      timestamp: Date.now(),
      value,
      source,
      ...detail
    }
    emotionHistory.value.push(entry)
    
    if (emotionHistory.value.length > 500) {
      emotionHistory.value = emotionHistory.value.slice(-500)
    }
    
    saveEmotionHistory()
  }

  const getEmotionTrendData = (period = 'recent') => {
    let data = [...emotionHistory.value]
    
    if (period === 'today') {
      const today = new Date().setHours(0, 0, 0, 0)
      data = data.filter(e => e.timestamp >= today)
    } else if (period === 'week') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      data = data.filter(e => e.timestamp >= weekAgo)
    } else if (period === 'recent') {
      data = data.slice(-50)
    }
    
    return {
      data,
      average: data.length > 0 ? Math.round(data.reduce((a, b) => a + b.value, 0) / data.length) : 0,
      max: data.length > 0 ? Math.max(...data.map(e => e.value)) : 0,
      min: data.length > 0 ? Math.min(...data.map(e => e.value)) : 0,
      trend: calculateTrend(data)
    }
  }

  const calculateTrend = (data) => {
    if (data.length < 2) return 'stable'
    const mid = Math.floor(data.length / 2)
    const firstHalf = data.slice(0, mid)
    const secondHalf = data.slice(mid)
    const firstAvg = firstHalf.reduce((a, b) => a + b.value, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b.value, 0) / secondHalf.length
    const diff = secondAvg - firstAvg
    if (diff > 10) return 'rising'
    if (diff > 3) return 'slightly_rising'
    if (diff < -10) return 'falling'
    if (diff < -3) return 'slightly_falling'
    return 'stable'
  }

  const updatePreferencesAfterChapter = (details) => {
    if (details.materialsUsed) {
      details.materialsUsed.forEach(matId => {
        preferences.value.materialUsageCount[matId] = 
          (preferences.value.materialUsageCount[matId] || 0) + 1
      })
    }
    savePreferences()
  }

  const recordChoice = (choiceType, choiceId, context = {}) => {
    const key = `${choiceType}:${choiceId}`
    if (!preferences.value.choicePatterns[key]) {
      preferences.value.choicePatterns[key] = {
        type: choiceType,
        id: choiceId,
        count: 0,
        firstChosenAt: Date.now()
      }
    }
    preferences.value.choicePatterns[key].count++
    preferences.value.choicePatterns[key].lastChosenAt = Date.now()
    savePreferences()
  }

  const getTopChoices = (type, limit = 5) => {
    const choices = Object.values(preferences.value.choicePatterns)
      .filter(c => c.type === type)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
    return choices
  }

  const addFavorite = (type, item) => {
    if (!favorites.value[type]) {
      favorites.value[type] = []
    }
    
    const exists = favorites.value[type].some(f => f.id === item.id)
    if (exists) {
      return false
    }
    
    favorites.value[type].push({
      ...item,
      favoritedAt: Date.now()
    })
    saveFavorites()
    showNotification(`已添加到收藏`, 'success')
    return true
  }

  const removeFavorite = (type, itemId) => {
    if (!favorites.value[type]) return false
    const index = favorites.value[type].findIndex(f => f.id === itemId)
    if (index === -1) return false
    favorites.value[type].splice(index, 1)
    saveFavorites()
    showNotification(`已取消收藏`, 'info')
    return true
  }

  const isFavorite = (type, itemId) => {
    if (!favorites.value[type]) return false
    return favorites.value[type].some(f => f.id === itemId)
  }

  const toggleFavorite = (type, item) => {
    if (isFavorite(type, item.id)) {
      return removeFavorite(type, item.id)
    } else {
      return addFavorite(type, item)
    }
  }

  const getFavoritesByType = (type) => {
    return favorites.value[type] || []
  }

  const getProfileStats = () => {
    const gs = safeGetGameStore()
    return {
      profile: userProfile.value,
      totalClearCount: totalClearCount.value,
      perfectClearCount: perfectClearCount.value,
      averageEmotion: averageEmotion.value,
      emotionTrend: emotionTrend.value,
      totalFavorites: totalFavoritesCount.value,
      favoriteMaterial: favoriteMaterial.value,
      mostPlayedChapter: mostPlayedChapter.value,
      totalPlayTime: formatPlayTime(userProfile.value.totalPlayTime),
      playSessions: userProfile.value.totalPlaySessions
    }
  }

  const formatPlayTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  const showNotification = (message, type = 'info') => {
    const gs = safeGetGameStore()
    if (gs) {
      gs.showNotification(message, type)
    }
  }

  const saveProfile = () => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({
        profile: userProfile.value,
        clearRecords: clearRecords.value
      }))
    } catch (e) {
      console.error('Failed to save profile:', e)
    }
  }

  const saveEmotionHistory = () => {
    try {
      localStorage.setItem(EMOTION_HISTORY_KEY, JSON.stringify(emotionHistory.value))
    } catch (e) {
      console.error('Failed to save emotion history:', e)
    }
  }

  const savePreferences = () => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences.value))
    } catch (e) {
      console.error('Failed to save preferences:', e)
    }
  }

  const saveFavorites = () => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.value))
    } catch (e) {
      console.error('Failed to save favorites:', e)
    }
  }

  const loadProfile = () => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.profile) {
          userProfile.value = { ...userProfile.value, ...parsed.profile }
        }
        if (parsed.clearRecords) {
          clearRecords.value = parsed.clearRecords
        }
      }
    } catch (e) {
      console.error('Failed to load profile:', e)
    }
  }

  const loadEmotionHistory = () => {
    try {
      const saved = localStorage.getItem(EMOTION_HISTORY_KEY)
      if (saved) {
        emotionHistory.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load emotion history:', e)
    }
  }

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        preferences.value = { ...preferences.value, ...parsed }
      }
    } catch (e) {
      console.error('Failed to load preferences:', e)
    }
  }

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        favorites.value = { ...favorites.value, ...parsed }
      }
    } catch (e) {
      console.error('Failed to load favorites:', e)
    }
  }

  const resetProfile = () => {
    userProfile.value = {
      nickname: '旅人',
      avatar: '🌸',
      createdAt: null,
      lastPlayedAt: null,
      totalPlayTime: 0,
      totalPlaySessions: 0
    }
    clearRecords.value = []
    emotionHistory.value = []
    preferences.value = {
      favoriteMaterials: [],
      favoriteTags: [],
      preferredCharacters: [],
      materialUsageCount: {},
      choicePatterns: {},
      favoriteTimeOfDay: 'day',
      favoriteWeather: 'clear'
    }
    favorites.value = {
      dialogues: [],
      scenes: [],
      materials: [],
      endings: [],
      combos: []
    }
    localStorage.removeItem(PROFILE_STORAGE_KEY)
    localStorage.removeItem(EMOTION_HISTORY_KEY)
    localStorage.removeItem(PREFERENCES_KEY)
    localStorage.removeItem(FAVORITES_KEY)
  }

  let unwatchEmotion = null

  const initialize = () => {
    loadProfile()
    loadEmotionHistory()
    loadPreferences()
    loadFavorites()
    initProfile()

    if (unwatchEmotion) unwatchEmotion()
    unwatchEmotion = watch(
      () => {
        const gs = safeGetGameStore()
        return gs ? gs.emotionValue : null
      },
      (newVal, oldVal) => {
        if (newVal !== null && newVal !== oldVal) {
          const gs = safeGetGameStore()
          if (gs && gs.currentSceneId) {
            recordEmotion(newVal, 'gameplay', {
              sceneId: gs.currentSceneId,
              chapterId: gs.currentChapterId
            })
          }
        }
      }
    )
  }

  return {
    userProfile,
    clearRecords,
    emotionHistory,
    preferences,
    favorites,
    playSessions,

    totalClearCount,
    perfectClearCount,
    averageEmotion,
    emotionTrend,
    favoriteMaterial,
    mostPlayedChapter,
    totalFavoritesCount,

    initProfile,
    updateLastPlayed,
    addPlayTime,

    addClearRecord,
    getChapterClearRecords,
    getBestScore,

    recordEmotion,
    getEmotionTrendData,

    recordChoice,
    getTopChoices,
    updatePreferencesAfterChapter,

    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    getFavoritesByType,

    getProfileStats,
    showNotification,

    initialize,
    resetProfile
  }
})
