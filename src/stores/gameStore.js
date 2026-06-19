import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import chaptersData from '../data/chapters.json'
import materialsData from '../data/materials.json'
import scenesData from '../data/scenes.json'
import endingsData from '../data/endings.json'

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

  const currentChapter = computed(() => {
    return chapters.value.find(c => c.id === currentChapterId.value)
  })

  const currentScene = computed(() => {
    return scenes.value[currentSceneId.value] || null
  })

  const currentDialogue = computed(() => {
    if (!currentScene.value) return null
    return currentScene.value.dialogues[currentDialogueIndex.value] || null
  })

  const availableMaterials = computed(() => {
    if (!currentChapter.value) return []
    return materials.value.filter(m => 
      currentChapter.value.requiredMaterials.includes(m.id)
    )
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
  }

  const resetStats = () => {
    perfectPlacementCount.value = 0
    totalDialogueCount.value = 0
    positiveBonus.value = 0
  }

  const nextDialogue = () => {
    if (!currentScene.value) return

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

    if (dialogue.trigger === 'material_required') {
      isWaitingForMaterial.value = true
      requiredMaterialId.value = currentScene.value.requiredMaterial
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
    }
  }

  const placeMaterial = (materialId, position, stageWidth = 800, stageHeight = 500) => {
    if (!isWaitingForMaterial.value || requiredMaterialId.value !== materialId) return false

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

    isWaitingForMaterial.value = false
    requiredMaterialId.value = null

    if (currentDialogueIndex.value < currentScene.value.dialogues.length - 1) {
      currentDialogueIndex.value++
    } else if (currentScene.value.nextScene) {
      currentSceneId.value = currentScene.value.nextScene
      currentDialogueIndex.value = 0
    }

    return { success: true, isPerfect: isPerfect, bonus: placementBonus }
  }

  const completeChapter = () => {
    const chapter = currentChapter.value
    if (!chapter) return

    if (!completedChapters.value.includes(chapter.id)) {
      completedChapters.value.push(chapter.id)
    }

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
  }

  const saveGame = (slotIndex) => {
    const saveData = {
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
      timestamp: Date.now()
    }

    saveSlots.value[slotIndex] = saveData

    localStorage.setItem('journal_game_saves', JSON.stringify(saveSlots.value))
    return true
  }

  const loadGame = (slotIndex) => {
    const saveData = saveSlots.value[slotIndex]
    if (!saveData) return false

    currentChapterId.value = saveData.currentChapterId
    currentSceneId.value = saveData.currentSceneId
    currentDialogueIndex.value = saveData.currentDialogueIndex
    emotionValue.value = saveData.emotionValue
    placedMaterials.value = saveData.placedMaterials
    unlockedChapters.value = saveData.unlockedChapters
    completedChapters.value = saveData.completedChapters
    isWaitingForMaterial.value = saveData.isWaitingForMaterial
    requiredMaterialId.value = saveData.requiredMaterialId
    perfectPlacementCount.value = saveData.perfectPlacementCount || 0
    totalDialogueCount.value = saveData.totalDialogueCount || 0
    positiveBonus.value = saveData.positiveBonus || 0
    gameCompleted.value = false
    currentEnding.value = null

    return true
  }

  const loadSavesFromStorage = () => {
    const saved = localStorage.getItem('journal_game_saves')
    if (saved) {
      try {
        saveSlots.value = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to load saves:', e)
      }
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
    resetStats()
  }

  const goToChapterSelect = () => {
    currentChapterId.value = null
    currentSceneId.value = null
    currentDialogueIndex.value = 0
    placedMaterials.value = []
    isWaitingForMaterial.value = false
    requiredMaterialId.value = null
    gameCompleted.value = false
    currentEnding.value = null
  }

  loadSavesFromStorage()

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
    currentChapter,
    currentScene,
    currentDialogue,
    availableMaterials,
    canProceed,
    emotionPercentage,
    getMaterialById,
    getChapterById,
    startChapter,
    nextDialogue,
    placeMaterial,
    completeChapter,
    completeGame,
    saveGame,
    loadGame,
    loadSavesFromStorage,
    resetGame,
    goToChapterSelect,
    resetStats
  }
})
