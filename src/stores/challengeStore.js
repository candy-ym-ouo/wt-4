import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import challengesData from '../data/challenges.json'

const CHALLENGE_RECORDS_KEY = 'journal_game_challenge_records'
const CHALLENGE_LEADERBOARD_KEY = 'journal_game_challenge_leaderboard'
const UNLOCKED_CHALLENGES_KEY = 'journal_game_unlocked_challenges'

export const useChallengeStore = defineStore('challenge', () => {
  const challenges = ref(challengesData)
  const unlockedChallengeIds = ref([])
  const currentChallengeId = ref(null)
  const isChallengeMode = ref(false)
  const challengeStartTime = ref(null)
  const challengeTimeRemaining = ref(0)
  const challengeRoundsUsed = ref(0)
  const challengeMaterialUsed = ref([])
  const challengeCompleted = ref(false)
  const challengeResult = ref(null)
  const challengeRecords = ref({})
  const challengeLeaderboard = ref({})
  let timerInterval = null

  const currentChallenge = computed(() => {
    if (!currentChallengeId.value) return null
    return challenges.value.find(c => c.id === currentChallengeId.value) || null
  })

  const isChallengeUnlocked = (challengeId) => {
    return unlockedChallengeIds.value.includes(challengeId)
  }

  const isChallengeCompleted = (challengeId) => {
    return !!challengeRecords.value[challengeId]
  }

  const getChallengeBestScore = (challengeId) => {
    const record = challengeRecords.value[challengeId]
    return record ? record.bestScore : 0
  }

  const getChallengeLeaderboard = (challengeId) => {
    return challengeLeaderboard.value[challengeId] || []
  }

  const getDifficultyInfo = (difficulty) => {
    const map = {
      easy: { name: '简单', color: '#10b981', bgColor: '#d1fae5' },
      normal: { name: '普通', color: '#f59e0b', bgColor: '#fef3c7' },
      hard: { name: '困难', color: '#ef4444', bgColor: '#fee2e2' },
      legendary: { name: '传说', color: '#8b5cf6', bgColor: '#ede9fe' }
    }
    return map[difficulty] || map.normal
  }

  const startChallenge = (challengeId) => {
    const challenge = challenges.value.find(c => c.id === challengeId)
    if (!challenge) return false
    if (!isChallengeUnlocked(challengeId)) return false

    currentChallengeId.value = challengeId
    isChallengeMode.value = true
    challengeStartTime.value = Date.now()
    challengeTimeRemaining.value = challenge.timeLimit
    challengeRoundsUsed.value = 0
    challengeMaterialUsed.value = []
    challengeCompleted.value = false
    challengeResult.value = null

    startTimer()
    return true
  }

  const startTimer = () => {
    stopTimer()
    timerInterval = setInterval(() => {
      if (challengeTimeRemaining.value > 0) {
        challengeTimeRemaining.value--
      } else {
        failChallengeByTimeout()
      }
    }, 1000)
  }

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  const pauseChallenge = () => {
    stopTimer()
  }

  const resumeChallenge = () => {
    if (isChallengeMode.value && !challengeCompleted.value) {
      startTimer()
    }
  }

  const incrementRound = () => {
    if (isChallengeMode.value && !challengeCompleted.value) {
      challengeRoundsUsed.value++
      const challenge = currentChallenge.value
      if (challenge && challengeRoundsUsed.value >= challenge.maxRounds) {
        failChallengeByRounds()
        return false
      }
      return true
    }
    return true
  }

  const recordMaterialUsed = (materialId) => {
    if (isChallengeMode.value && !challengeCompleted.value) {
      challengeMaterialUsed.value.push(materialId)
    }
  }

  const isMaterialAllowed = (materialId) => {
    const challenge = currentChallenge.value
    if (!challenge) return true
    return challenge.allowedMaterials.includes(materialId)
  }

  const completeChallenge = (gameStore) => {
    if (!isChallengeMode.value || challengeCompleted.value) return null

    stopTimer()
    challengeCompleted.value = true

    const challenge = currentChallenge.value
    const timeUsed = challenge.timeLimit - challengeTimeRemaining.value
    const totalEmotion = gameStore.emotionValue

    const chapter = gameStore.getChapterById(challenge.chapterId)
    const totalCombos = gameStore.getChapterTotalCombos(challenge.chapterId)
    const triggeredCombos = gameStore.getChapterTriggeredCombos(challenge.chapterId)

    const isPerfect = totalEmotion >= challenge.targetEmotion && triggeredCombos >= totalCombos

    const score = calculateScore(challenge, timeUsed, totalEmotion, triggeredCombos, totalCombos, isPerfect)

    const result = {
      challengeId: challenge.id,
      chapterId: challenge.chapterId,
      completedAt: Date.now(),
      timeUsed,
      totalEmotion,
      roundsUsed: challengeRoundsUsed.value,
      materialsUsed: [...challengeMaterialUsed.value],
      triggeredCombos,
      totalCombos,
      isPerfect,
      score,
      targetReached: totalEmotion >= challenge.targetEmotion
    }

    challengeResult.value = result
    saveChallengeRecord(challenge.id, result)
    updateLeaderboard(challenge.id, result)

    return result
  }

  const calculateScore = (challenge, timeUsed, totalEmotion, triggeredCombos, totalCombos, isPerfect) => {
    const scoring = challenge.scoring
    let score = scoring.baseScore

    const timeBonus = Math.max(0, (challenge.timeLimit - timeUsed) * scoring.timeBonusPerSecond)
    score += timeBonus

    const emotionScore = Math.max(0, totalEmotion * scoring.emotionMultiplier)
    score += emotionScore

    if (isPerfect) {
      score += scoring.perfectBonus
    }

    score += triggeredCombos * scoring.comboBonus

    return Math.floor(score)
  }

  const failChallengeByTimeout = () => {
    stopTimer()
    challengeCompleted.value = true
    challengeResult.value = {
      challengeId: currentChallengeId.value,
      failed: true,
      reason: 'timeout',
      timeUsed: currentChallenge.value.timeLimit,
      completedAt: Date.now()
    }
  }

  const failChallengeByRounds = () => {
    stopTimer()
    challengeCompleted.value = true
    challengeResult.value = {
      challengeId: currentChallengeId.value,
      failed: true,
      reason: 'rounds_exceeded',
      roundsUsed: challengeRoundsUsed.value,
      completedAt: Date.now()
    }
  }

  const saveChallengeRecord = (challengeId, result) => {
    const existing = challengeRecords.value[challengeId]
    if (!existing || result.score > existing.bestScore) {
      challengeRecords.value[challengeId] = {
        bestScore: result.score,
        bestTime: result.timeUsed,
        bestEmotion: result.totalEmotion,
        lastPlayed: Date.now(),
        playCount: (existing?.playCount || 0) + 1,
        isPerfect: existing ? existing.isPerfect || result.isPerfect : result.isPerfect
      }
    } else {
      existing.playCount++
      existing.lastPlayed = Date.now()
    }
    saveChallengeRecordsToStorage()
  }

  const updateLeaderboard = (challengeId, result) => {
    if (!challengeLeaderboard.value[challengeId]) {
      challengeLeaderboard.value[challengeId] = []
    }

    const leaderboard = challengeLeaderboard.value[challengeId]
    const entry = {
      rank: 0,
      playerName: '玩家',
      score: result.score,
      timeUsed: result.timeUsed,
      totalEmotion: result.totalEmotion,
      isPerfect: result.isPerfect,
      completedAt: result.completedAt,
      isPlayer: true
    }

    leaderboard.push(entry)
    leaderboard.sort((a, b) => b.score - a.score)
    leaderboard.forEach((e, i) => e.rank = i + 1)

    if (leaderboard.length > 20) {
      challengeLeaderboard.value[challengeId] = leaderboard.slice(0, 20)
    }

    saveLeaderboardToStorage()
  }

  const exitChallenge = () => {
    stopTimer()
    currentChallengeId.value = null
    isChallengeMode.value = false
    challengeStartTime.value = null
    challengeTimeRemaining.value = 0
    challengeRoundsUsed.value = 0
    challengeMaterialUsed.value = []
    challengeCompleted.value = false
    challengeResult.value = null
  }

  const checkAndUnlockChallenges = (gameStore) => {
    challenges.value.forEach(challenge => {
      if (unlockedChallengeIds.value.includes(challenge.id)) return

      if (!challenge.unlockConditions || challenge.unlockConditions.length === 0) {
        if (challenge.unlocked) {
          unlockedChallengeIds.value.push(challenge.id)
        }
        return
      }

      const allMet = challenge.unlockConditions.every(condition => {
        return checkUnlockCondition(condition, gameStore)
      })

      if (allMet) {
        unlockedChallengeIds.value.push(challenge.id)
      }
    })

    saveUnlockedChallengesToStorage()
  }

  const checkUnlockCondition = (condition, gameStore) => {
    switch (condition.type) {
      case 'chapter_completed':
        return gameStore.completedChapters.includes(condition.target)
      case 'emotion_reached':
        const detail = gameStore.chapterCompletionDetails[condition.target]
        return detail ? detail.totalEmotion >= condition.value : false
      case 'challenge_completed':
        return !!challengeRecords.value[condition.target]
      case 'combo_triggered':
        const comboCount = gameStore.getChapterTriggeredCombos(condition.target)
        return comboCount >= (condition.minCount || 1)
      default:
        return false
    }
  }

  const getUnmetConditions = (challengeId, gameStore) => {
    const challenge = challenges.value.find(c => c.id === challengeId)
    if (!challenge || !challenge.unlockConditions) return []

    return challenge.unlockConditions.filter(condition => {
      return !checkUnlockCondition(condition, gameStore)
    })
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const saveChallengeRecordsToStorage = () => {
    try {
      localStorage.setItem(CHALLENGE_RECORDS_KEY, JSON.stringify(challengeRecords.value))
    } catch (e) {
      console.error('Failed to save challenge records:', e)
    }
  }

  const loadChallengeRecordsFromStorage = () => {
    try {
      const saved = localStorage.getItem(CHALLENGE_RECORDS_KEY)
      if (saved) {
        challengeRecords.value = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load challenge records:', e)
      challengeRecords.value = {}
    }
  }

  const saveLeaderboardToStorage = () => {
    try {
      localStorage.setItem(CHALLENGE_LEADERBOARD_KEY, JSON.stringify(challengeLeaderboard.value))
    } catch (e) {
      console.error('Failed to save leaderboard:', e)
    }
  }

  const loadLeaderboardFromStorage = () => {
    try {
      const saved = localStorage.getItem(CHALLENGE_LEADERBOARD_KEY)
      if (saved) {
        challengeLeaderboard.value = JSON.parse(saved)
      } else {
        initializeDefaultLeaderboard()
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e)
      challengeLeaderboard.value = {}
      initializeDefaultLeaderboard()
    }
  }

  const initializeDefaultLeaderboard = () => {
    const defaultNames = ['文艺小清新', '手账达人', '樱花少女', '时光旅者', '四季诗人']
    challenges.value.forEach(challenge => {
      if (!challengeLeaderboard.value[challenge.id]) {
        const entries = []
        for (let i = 0; i < 5; i++) {
          const baseScore = challenge.scoring.baseScore
          const score = Math.floor(baseScore * (1 - i * 0.15) + Math.random() * baseScore * 0.2)
          const timeUsed = Math.floor(challenge.timeLimit * (0.4 + i * 0.1))
          entries.push({
            rank: i + 1,
            playerName: defaultNames[i % defaultNames.length],
            score,
            timeUsed,
            totalEmotion: Math.floor(challenge.targetEmotion * (0.8 + Math.random() * 0.4)),
            isPerfect: i === 0,
            completedAt: Date.now() - (i + 1) * 86400000,
            isPlayer: false
          })
        }
        challengeLeaderboard.value[challenge.id] = entries
      }
    })
    saveLeaderboardToStorage()
  }

  const saveUnlockedChallengesToStorage = () => {
    try {
      localStorage.setItem(UNLOCKED_CHALLENGES_KEY, JSON.stringify(unlockedChallengeIds.value))
    } catch (e) {
      console.error('Failed to save unlocked challenges:', e)
    }
  }

  const loadUnlockedChallengesFromStorage = () => {
    try {
      const saved = localStorage.getItem(UNLOCKED_CHALLENGES_KEY)
      if (saved) {
        unlockedChallengeIds.value = JSON.parse(saved)
      } else {
        challenges.value.forEach(c => {
          if (c.unlocked && (!c.unlockConditions || c.unlockConditions.length === 0)) {
            unlockedChallengeIds.value.push(c.id)
          }
        })
      }
    } catch (e) {
      console.error('Failed to load unlocked challenges:', e)
      unlockedChallengeIds.value = []
    }
  }

  const getPlayerRank = (challengeId) => {
    const leaderboard = challengeLeaderboard.value[challengeId]
    if (!leaderboard) return null
    const playerEntry = leaderboard.find(e => e.isPlayer)
    return playerEntry ? playerEntry.rank : null
  }

  const initialize = (gameStore) => {
    loadChallengeRecordsFromStorage()
    loadLeaderboardFromStorage()
    loadUnlockedChallengesFromStorage()
    if (gameStore) {
      checkAndUnlockChallenges(gameStore)
    }
  }

  return {
    challenges,
    currentChallengeId,
    currentChallenge,
    isChallengeMode,
    challengeTimeRemaining,
    challengeRoundsUsed,
    challengeMaterialUsed,
    challengeCompleted,
    challengeResult,
    challengeRecords,
    challengeLeaderboard,
    unlockedChallengeIds,
    isChallengeUnlocked,
    isChallengeCompleted,
    getChallengeBestScore,
    getChallengeLeaderboard,
    getDifficultyInfo,
    startChallenge,
    completeChallenge,
    exitChallenge,
    pauseChallenge,
    resumeChallenge,
    incrementRound,
    recordMaterialUsed,
    isMaterialAllowed,
    checkAndUnlockChallenges,
    getUnmetConditions,
    formatTime,
    getPlayerRank,
    initialize
  }
})
