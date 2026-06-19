import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import chaptersData from '../data/chapters.json'
import materialsData from '../data/materials.json'
import scenesData from '../data/scenes.json'
import endingsData from '../data/endings.json'

const AUTO_SAVE_KEY = 'journal_game_autosave'
const AUTO_SAVE_BACKUP_KEY = 'journal_game_autosave_backup'
const CHAPTER_SNAPSHOTS_KEY = 'journal_game_chapter_snapshots'
const SESSION_KEY = 'journal_game_session'
const BACKUP_KEY = 'journal_game_saves_backup'
const CHAPTER_SCORE_KEY = 'journal_game_chapter_scores'
const AUTO_SAVE_DIALOGUE_INTERVAL = 5
const HEARTBEAT_INTERVAL = 20000
const CRASH_RECOVERY_THRESHOLD = 180000

export const useGameStore = defineStore('game', () => {
  const chapters = ref(chaptersData)
  const materials = ref(materialsData)
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

  const currentChapter = computed(() => {
    return chapters.value.find(c => c.id === currentChapterId.value)
  })

  const currentScene = computed(() => {
    return scenes.value[currentSceneId.value] || null
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
    if (!currentScene.value?.optionalMaterials) return []
    return materials.value.filter(m => currentScene.value.optionalMaterials.includes(m.id))
  })

  const availableOptionalMaterials = computed(() => {
    if (!requiredMaterialPlaced.value) return []
    return currentSceneOptionalMaterials.value.filter(m => 
      !optionalMaterialsPlaced.value.some(p => p.id === m.id)
    )
  })

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

  const getMaterialById = (id) => {
    return materials.value.find(m => m.id === id)
  }

  const getChapterById = (id) => {
    return chapters.value.find(c => c.id === id)
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

  const startChapter = (chapterId) => {
    const chapter = getChapterById(chapterId)
    if (!chapter || !unlockedChapters.value.includes(chapterId)) return

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
  }

  const resetStats = () => {
    perfectPlacementCount.value = 0
    totalDialogueCount.value = 0
    positiveBonus.value = 0
  }

  const nextDialogue = () => {
    if (!currentScene.value) return

    if (activeHiddenDialogue.value) {
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

    const baseEmotion = dialogue.emotionChange || 0
    const randomFluctuation = Math.floor(Math.random() * 3) - 1
    const finalEmotion = Math.max(0, baseEmotion + randomFluctuation)
    emotionValue.value += finalEmotion
    totalDialogueCount.value++
    if (randomFluctuation > 0) {
      positiveBonus.value += randomFluctuation
    }
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
    }

    if (currentDialogueIndex.value < currentScene.value.dialogues.length - 1) {
      currentDialogueIndex.value++
    } else if (currentScene.value.nextScene) {
      currentSceneId.value = currentScene.value.nextScene
      currentDialogueIndex.value = 0
      sceneBackgroundOverride.value = null
      activeSceneFeedback.value = null
      optionalMaterialsPlaced.value = []
      requiredMaterialPlaced.value = false
      comboJustTriggered.value = null
    }
  }

  const showHiddenDialogue = (hiddenDialogue) => {
    activeHiddenDialogue.value = { ...hiddenDialogue }
    isShowingHiddenDialogue.value = true

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

    comboJustTriggered.value = combo

    setTimeout(() => {
      if (comboJustTriggered.value?.id === combo.id) {
        comboJustTriggered.value = null
      }
    }, 4000)

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

    const newlyTriggered = checkMaterialCombos()
    const comboResults = newlyTriggered.map(combo => triggerCombo(combo)).filter(Boolean)

    if (currentDialogueIndex.value < currentScene.value.dialogues.length - 1) {
      currentDialogueIndex.value++
    } else if (currentScene.value.nextScene) {
      currentSceneId.value = currentScene.value.nextScene
      currentDialogueIndex.value = 0
      sceneBackgroundOverride.value = null
      activeSceneFeedback.value = null
      optionalMaterialsPlaced.value = []
      requiredMaterialPlaced.value = false
      comboJustTriggered.value = null
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

    chapterScoreData.value[chapter.id] = {
      chapterId: chapter.id,
      completedAt: Date.now(),
      emotionBreakdown,
      totalEmotion: Object.values(emotionBreakdown).reduce((a, b) => a + b, 0),
      materialChoices,
      allCombos,
      triggeredComboCount: allCombos.filter(c => c.triggered).length,
      totalComboCount: allCombos.length,
      emotionTarget: chapter.emotionTarget || 0,
      log: [...currentChapterLog.value]
    }

    saveChapterScoreData()

    const nextChapterIndex = chapters.value.findIndex(c => c.id === chapter.id) + 1
    if (nextChapterIndex < chapters.value.length) {
      const nextChapter = chapters.value[nextChapterIndex]
      if (!unlockedChapters.value.includes(nextChapter.id)) {
        unlockedChapters.value.push(nextChapter.id)
      }
    }
  }

  const completeGame = () => {
    gameCompleted.value = true

    const completedChapterCount = completedChapters.value.length + (currentChapterId.value && !completedChapters.value.includes(currentChapterId.value) ? 1 : 0)
    const totalMaterialCount = Object.values(scenes.value).filter(s => s.requiredMaterial).length
    const placedCount = placedMaterials.value.length
    const perfectRate = totalMaterialCount > 0 ? perfectPlacementCount.value / totalMaterialCount : 0

    const maxPossibleEmotion = 310
    const baseScore = (emotionValue.value / maxPossibleEmotion) * 100
    const chapterBonus = (completedChapterCount / 4) * 20
    const perfectBonus = perfectRate * 15
    const materialBonus = (placedCount / Math.max(1, totalMaterialCount)) * 10
    const finalScore = Math.min(100, baseScore + chapterBonus + perfectBonus + materialBonus)

    let ending = endings.value.find(e => e.type === 'normal')
    if (finalScore >= 90 && completedChapterCount === 4 && perfectRate >= 0.6) {
      ending = endings.value.find(e => e.type === 'special')
    } else if (finalScore >= 65 && completedChapterCount >= 2) {
      ending = endings.value.find(e => e.type === 'good')
    }

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
        }
      }
    }

    currentEnding.value = ending
    autoSave()
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

  const resetGame = () => {
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
    resetStats()
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('journal_game_saves')
      localStorage.removeItem(AUTO_SAVE_KEY)
      localStorage.removeItem(AUTO_SAVE_BACKUP_KEY)
      localStorage.removeItem(CHAPTER_SNAPSHOTS_KEY)
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(BACKUP_KEY)
      localStorage.removeItem(CHAPTER_SCORE_KEY)
    }
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

  const serializeGameState = () => {
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
      timestamp: Date.now()
    }
    return {
      ...baseData,
      checksum: createChecksum(baseData)
    }
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
    comboJustTriggered.value = null
    gameCompleted.value = false
    currentEnding.value = null
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

  loadSavesFromStorage()
  loadChapterSnapshots()
  loadAutoSave()
  loadChapterScoreData()

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
    currentChapter,
    currentScene,
    currentDialogue,
    availableMaterials,
    currentSceneCombos,
    currentSceneTriggeredCombos,
    currentSceneOptionalMaterials,
    availableOptionalMaterials,
    canPlaceOptionalMaterial,
    canProceed,
    emotionPercentage,
    getMaterialById,
    getChapterById,
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
    cleanupEventListeners
  }
})
