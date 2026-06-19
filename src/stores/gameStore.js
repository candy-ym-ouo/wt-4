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

  const nextDialogue = () => {
    if (!currentScene.value) return

    const dialogue = currentDialogue.value
    if (!dialogue) return

    emotionValue.value += dialogue.emotionChange || 0

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

  const placeMaterial = (materialId, position) => {
    if (!isWaitingForMaterial.value || requiredMaterialId.value !== materialId) return false

    const material = getMaterialById(materialId)
    if (!material) return false

    placedMaterials.value.push({
      id: materialId,
      x: position.x,
      y: position.y,
      rotation: Math.random() * 20 - 10
    })

    emotionValue.value += material.emotion || 0

    isWaitingForMaterial.value = false
    requiredMaterialId.value = null

    if (currentDialogueIndex.value < currentScene.value.dialogues.length - 1) {
      currentDialogueIndex.value++
    } else if (currentScene.value.nextScene) {
      currentSceneId.value = currentScene.value.nextScene
      currentDialogueIndex.value = 0
    }

    return true
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

    let ending = endings.value.find(e => e.type === 'normal')
    if (emotionValue.value >= 100) {
      ending = endings.value.find(e => e.type === 'special')
    } else if (emotionValue.value >= 90) {
      ending = endings.value.find(e => e.type === 'good')
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
    goToChapterSelect
  }
})
