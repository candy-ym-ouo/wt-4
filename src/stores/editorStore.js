import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import chaptersData from '../data/chapters.json'
import scenesData from '../data/scenes.json'
import endingsData from '../data/endings.json'
import materialsData from '../data/materials.json'

export const useEditorStore = defineStore('editor', () => {
  const chapters = ref(JSON.parse(JSON.stringify(chaptersData)))
  const scenes = ref(JSON.parse(JSON.stringify(scenesData)))
  const endings = ref(JSON.parse(JSON.stringify(endingsData)))
  const materials = ref(JSON.parse(JSON.stringify(materialsData)))

  const selectedChapterId = ref(null)
  const selectedSceneId = ref(null)
  const selectedDialogueIndex = ref(null)
  const selectedComboId = ref(null)
  const selectedEndingId = ref(null)
  const activeTab = ref('chapters')

  const isDirty = ref(false)
  const lastSavedAt = ref(null)
  const notification = ref(null)

  const unlockConditionTypes = [
    { id: 'chapter_completed', name: '章节完成', needsTarget: true, needsValue: false, needsMinCount: false, needsCycle: false, needsMaterialId: false, needsAchievementId: false, needsEndingId: false },
    { id: 'emotion_reached', name: '情绪值达到', needsTarget: true, needsValue: true, needsMinCount: false, needsCycle: false, needsMaterialId: false, needsAchievementId: false, needsEndingId: false },
    { id: 'combo_triggered', name: '组合触发', needsTarget: true, needsValue: false, needsMinCount: true, needsCycle: false, needsMaterialId: false, needsAchievementId: false, needsEndingId: false },
    { id: 'hidden_dialogue_found', name: '隐藏对话发现', needsTarget: true, needsValue: false, needsMinCount: true, needsCycle: false, needsMaterialId: false, needsAchievementId: false, needsEndingId: false },
    { id: 'cycle_reached', name: '周目数达到', needsTarget: false, needsValue: false, needsMinCount: false, needsCycle: true, needsMaterialId: false, needsAchievementId: false, needsEndingId: false },
    { id: 'total_playthroughs', name: '总通关次数', needsTarget: false, needsValue: true, needsMinCount: false, needsCycle: false, needsMaterialId: false, needsAchievementId: false, needsEndingId: false },
    { id: 'has_inherited_emotion', name: '有继承情绪值', needsTarget: false, needsValue: false, needsMinCount: false, needsCycle: false, needsMaterialId: false, needsAchievementId: false, needsEndingId: false },
    { id: 'hidden_material_unlocked', name: '隐藏素材解锁', needsTarget: false, needsValue: false, needsMinCount: false, needsCycle: false, needsMaterialId: true, needsAchievementId: false, needsEndingId: false },
    { id: 'achievement_unlocked', name: '成就解锁', needsTarget: false, needsValue: false, needsMinCount: false, needsCycle: false, needsMaterialId: false, needsAchievementId: true, needsEndingId: false },
    { id: 'ending_discovered', name: '结局已发现', needsTarget: false, needsValue: false, needsMinCount: false, needsCycle: false, needsMaterialId: false, needsAchievementId: false, needsEndingId: true }
  ]

  const dialogueTriggerTypes = [
    { id: null, name: '无（普通对白）' },
    { id: 'material_required', name: '需要放置素材' },
    { id: 'chapter_complete', name: '章节完成' },
    { id: 'game_complete', name: '游戏完成' },
    { id: 'set_environment', name: '设置环境' }
  ]

  const timeOfDayOptions = [
    { id: 'day', name: '白天' },
    { id: 'dusk', name: '黄昏' },
    { id: 'night', name: '夜晚' }
  ]

  const weatherOptions = [
    { id: 'clear', name: '晴朗' },
    { id: 'cloudy', name: '多云' },
    { id: 'rain', name: '雨天' },
    { id: 'snow', name: '下雪' },
    { id: 'star', name: '星空' }
  ]

  const selectedChapter = computed(() => {
    return chapters.value.find(c => c.id === selectedChapterId.value) || null
  })

  const selectedScene = computed(() => {
    return scenes.value[selectedSceneId.value] || null
  })

  const selectedDialogue = computed(() => {
    if (!selectedScene.value || selectedDialogueIndex.value === null) return null
    return selectedScene.value.dialogues[selectedDialogueIndex.value] || null
  })

  const selectedCombo = computed(() => {
    if (!selectedScene.value || !selectedComboId.value) return null
    return (selectedScene.value.materialCombos || []).find(c => c.id === selectedComboId.value) || null
  })

  const selectedEnding = computed(() => {
    return endings.value.find(e => e.id === selectedEndingId.value) || null
  })

  const availableScenes = computed(() => {
    if (!selectedChapterId.value) return []
    return Object.values(scenes.value).filter(s => s.chapter === selectedChapterId.value)
  })

  const allSceneIds = computed(() => Object.keys(scenes.value))
  const allMaterialIds = computed(() => materials.value.map(m => m.id))
  const allChapterIds = computed(() => chapters.value.map(c => c.id))

  const showNotification = (message, type = 'info', duration = 3000) => {
    notification.value = { message, type }
    setTimeout(() => {
      if (notification.value?.message === message) {
        notification.value = null
      }
    }, duration)
  }

  const markDirty = () => {
    isDirty.value = true
  }

  watch([chapters, scenes, endings], () => {
    markDirty()
  }, { deep: true })

  const generateId = (prefix) => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 6)
    return `${prefix}_${timestamp}_${random}`
  }

  const addChapter = () => {
    const newChapter = {
      id: generateId('chapter'),
      title: '新章节',
      subtitle: '副标题',
      description: '章节描述...',
      teaser: '章节预告...',
      background: '#fef3c7',
      unlocked: false,
      hidden: false,
      hiddenHint: null,
      unlockConditions: [],
      requiredMaterials: [],
      emotionTarget: 50,
      scenes: []
    }
    chapters.value.push(newChapter)
    selectedChapterId.value = newChapter.id
    showNotification('已创建新章节', 'success')
    return newChapter
  }

  const updateChapter = (chapterId, updates) => {
    const index = chapters.value.findIndex(c => c.id === chapterId)
    if (index !== -1) {
      chapters.value[index] = { ...chapters.value[index], ...updates }
      showNotification('章节已更新', 'success')
    }
  }

  const deleteChapter = (chapterId) => {
    const chapter = chapters.value.find(c => c.id === chapterId)
    if (!chapter) return

    if (chapter.scenes && chapter.scenes.length > 0) {
      if (!confirm(`该章节包含 ${chapter.scenes.length} 个场景，确定要删除吗？`)) {
        return
      }
      chapter.scenes.forEach(sceneId => {
        delete scenes.value[sceneId]
      })
    }

    chapters.value = chapters.value.filter(c => c.id !== chapterId)
    if (selectedChapterId.value === chapterId) {
      selectedChapterId.value = null
      selectedSceneId.value = null
    }
    showNotification('章节已删除', 'success')
  }

  const duplicateChapter = (chapterId) => {
    const original = chapters.value.find(c => c.id === chapterId)
    if (!original) return

    const duplicated = JSON.parse(JSON.stringify(original))
    duplicated.id = generateId('chapter')
    duplicated.title = original.title + ' (副本)'
    duplicated.scenes = []

    original.scenes.forEach(sceneId => {
      const origScene = scenes.value[sceneId]
      if (origScene) {
        const dupScene = JSON.parse(JSON.stringify(origScene))
        const newSceneId = generateId('scene')
        dupScene.id = newSceneId
        dupScene.chapter = duplicated.id
        dupScene.dialogues = dupScene.dialogues.map(d => ({ ...d, id: generateId('d') }))
        if (dupScene.materialCombos) {
          dupScene.materialCombos = dupScene.materialCombos.map(c => ({ ...c, id: generateId('combo') }))
        }
        if (dupScene.nextScene) dupScene.nextScene = null
        scenes.value[newSceneId] = dupScene
        duplicated.scenes.push(newSceneId)
      }
    })

    chapters.value.push(duplicated)
    selectedChapterId.value = duplicated.id
    showNotification('章节已复制', 'success')
  }

  const addScene = (chapterId) => {
    const chapter = chapters.value.find(c => c.id === chapterId)
    if (!chapter) return

    const newSceneId = generateId('scene')
    const newScene = {
      id: newSceneId,
      chapter: chapterId,
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      timeOfDay: 'day',
      weather: 'clear',
      variants: {},
      dialogues: [
        {
          id: generateId('d'),
          speaker: '旁白',
          text: '新场景的第一句对白...',
          emotionChange: 2,
          trigger: null
        }
      ],
      requiredMaterial: null,
      optionalMaterials: [],
      materialCombos: [],
      nextScene: null
    }
    scenes.value[newSceneId] = newScene
    chapter.scenes.push(newSceneId)
    selectedSceneId.value = newSceneId
    selectedDialogueIndex.value = 0
    showNotification('已创建新场景', 'success')
    return newScene
  }

  const updateScene = (sceneId, updates) => {
    if (scenes.value[sceneId]) {
      scenes.value[sceneId] = { ...scenes.value[sceneId], ...updates }
      showNotification('场景已更新', 'success')
    }
  }

  const deleteScene = (sceneId) => {
    const scene = scenes.value[sceneId]
    if (!scene) return

    const chapter = chapters.value.find(c => c.id === scene.chapter)
    if (chapter) {
      chapter.scenes = chapter.scenes.filter(id => id !== sceneId)
    }

    Object.values(scenes.value).forEach(s => {
      if (s.nextScene === sceneId) {
        s.nextScene = null
      }
    })

    delete scenes.value[sceneId]
    if (selectedSceneId.value === sceneId) {
      selectedSceneId.value = null
      selectedDialogueIndex.value = null
    }
    showNotification('场景已删除', 'success')
  }

  const moveScene = (chapterId, fromIndex, toIndex) => {
    const chapter = chapters.value.find(c => c.id === chapterId)
    if (!chapter) return
    const scenesArr = chapter.scenes
    if (fromIndex < 0 || fromIndex >= scenesArr.length || toIndex < 0 || toIndex >= scenesArr.length) return
    const [removed] = scenesArr.splice(fromIndex, 1)
    scenesArr.splice(toIndex, 0, removed)
    showNotification('场景顺序已更新', 'success')
  }

  const addDialogue = (sceneId) => {
    const scene = scenes.value[sceneId]
    if (!scene) return

    const newDialogue = {
      id: generateId('d'),
      speaker: '旁白',
      text: '新的对白内容...',
      emotionChange: 1,
      trigger: null
    }
    scene.dialogues.push(newDialogue)
    selectedDialogueIndex.value = scene.dialogues.length - 1
    showNotification('已添加对白', 'success')
    return newDialogue
  }

  const updateDialogue = (sceneId, index, updates) => {
    const scene = scenes.value[sceneId]
    if (!scene || !scene.dialogues[index]) return
    scene.dialogues[index] = { ...scene.dialogues[index], ...updates }
    showNotification('对白已更新', 'success')
  }

  const deleteDialogue = (sceneId, index) => {
    const scene = scenes.value[sceneId]
    if (!scene || !scene.dialogues[index]) return
    if (scene.dialogues.length <= 1) {
      showNotification('场景至少需要一条对白', 'warning')
      return
    }
    scene.dialogues.splice(index, 1)
    if (selectedDialogueIndex.value === index) {
      selectedDialogueIndex.value = Math.max(0, index - 1)
    } else if (selectedDialogueIndex.value > index) {
      selectedDialogueIndex.value--
    }
    showNotification('对白已删除', 'success')
  }

  const moveDialogue = (sceneId, fromIndex, toIndex) => {
    const scene = scenes.value[sceneId]
    if (!scene) return
    const dialogues = scene.dialogues
    if (fromIndex < 0 || fromIndex >= dialogues.length || toIndex < 0 || toIndex >= dialogues.length) return
    const [removed] = dialogues.splice(fromIndex, 1)
    dialogues.splice(toIndex, 0, removed)
    if (selectedDialogueIndex.value === fromIndex) {
      selectedDialogueIndex.value = toIndex
    }
    showNotification('对白顺序已更新', 'success')
  }

  const addCombo = (sceneId) => {
    const scene = scenes.value[sceneId]
    if (!scene) return
    if (!scene.materialCombos) scene.materialCombos = []

    const newCombo = {
      id: generateId('combo'),
      name: '新组合',
      materials: [],
      emotionBonus: 5,
      description: '组合描述...',
      hiddenDialogue: null,
      sceneFeedback: null,
      environmentChange: null
    }
    scene.materialCombos.push(newCombo)
    selectedComboId.value = newCombo.id
    showNotification('已创建新组合', 'success')
    return newCombo
  }

  const updateCombo = (sceneId, comboId, updates) => {
    const scene = scenes.value[sceneId]
    if (!scene || !scene.materialCombos) return
    const index = scene.materialCombos.findIndex(c => c.id === comboId)
    if (index !== -1) {
      scene.materialCombos[index] = { ...scene.materialCombos[index], ...updates }
      showNotification('组合已更新', 'success')
    }
  }

  const deleteCombo = (sceneId, comboId) => {
    const scene = scenes.value[sceneId]
    if (!scene || !scene.materialCombos) return
    scene.materialCombos = scene.materialCombos.filter(c => c.id !== comboId)
    if (selectedComboId.value === comboId) {
      selectedComboId.value = null
    }
    showNotification('组合已删除', 'success')
  }

  const addEnding = () => {
    const newEnding = {
      id: generateId('ending'),
      title: '新结局',
      type: 'normal',
      minEmotion: 50,
      description: '结局描述...',
      content: '结局内容...',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #dbeafe 100%)',
      triggerConditions: {}
    }
    endings.value.push(newEnding)
    selectedEndingId.value = newEnding.id
    showNotification('已创建新结局', 'success')
    return newEnding
  }

  const updateEnding = (endingId, updates) => {
    const index = endings.value.findIndex(e => e.id === endingId)
    if (index !== -1) {
      endings.value[index] = { ...endings.value[index], ...updates }
      showNotification('结局已更新', 'success')
    }
  }

  const deleteEnding = (endingId) => {
    if (endings.value.length <= 1) {
      showNotification('至少需要保留一个结局', 'warning')
      return
    }
    endings.value = endings.value.filter(e => e.id !== endingId)
    if (selectedEndingId.value === endingId) {
      selectedEndingId.value = null
    }
    showNotification('结局已删除', 'success')
  }

  const addUnlockCondition = (chapterId) => {
    const chapter = chapters.value.find(c => c.id === chapterId)
    if (!chapter) return
    if (!chapter.unlockConditions) chapter.unlockConditions = []

    chapter.unlockConditions.push({
      type: 'chapter_completed',
      target: '',
      description: ''
    })
    showNotification('已添加解锁条件', 'success')
  }

  const updateUnlockCondition = (chapterId, index, updates) => {
    const chapter = chapters.value.find(c => c.id === chapterId)
    if (!chapter || !chapter.unlockConditions[index]) return
    chapter.unlockConditions[index] = { ...chapter.unlockConditions[index], ...updates }
  }

  const deleteUnlockCondition = (chapterId, index) => {
    const chapter = chapters.value.find(c => c.id === chapterId)
    if (!chapter) return
    chapter.unlockConditions.splice(index, 1)
    showNotification('解锁条件已删除', 'success')
  }

  const exportData = () => {
    const data = {
      chapters: chapters.value,
      scenes: scenes.value,
      endings: endings.value,
      materials: materials.value,
      exportedAt: new Date().toISOString()
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `story-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    isDirty.value = false
    lastSavedAt.value = new Date()
    showNotification('数据已导出', 'success')
  }

  const importData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (!data.chapters || !data.scenes || !data.endings) {
        throw new Error('数据格式不正确')
      }
      if (!confirm('导入将覆盖当前所有数据，确定继续吗？')) {
        return
      }
      chapters.value = data.chapters
      scenes.value = data.scenes
      endings.value = data.endings
      if (data.materials) {
        materials.value = data.materials
      }
      selectedChapterId.value = null
      selectedSceneId.value = null
      selectedDialogueIndex.value = null
      selectedComboId.value = null
      selectedEndingId.value = null
      isDirty.value = false
      lastSavedAt.value = new Date()
      showNotification('数据已导入', 'success')
    } catch (e) {
      showNotification('导入失败: ' + e.message, 'error')
    }
  }

  const validateData = () => {
    const errors = []
    const warnings = []

    chapters.value.forEach(chapter => {
      if (!chapter.scenes || chapter.scenes.length === 0) {
        warnings.push(`章节「${chapter.title}」没有场景`)
      }
      chapter.scenes.forEach(sceneId => {
        if (!scenes.value[sceneId]) {
          errors.push(`章节「${chapter.title}」引用了不存在的场景: ${sceneId}`)
        }
      })
      if (chapter.requiredMaterials) {
        chapter.requiredMaterials.forEach(matId => {
          if (!materials.value.find(m => m.id === matId)) {
            errors.push(`章节「${chapter.title}」引用了不存在的素材: ${matId}`)
          }
        })
      }
    })

    Object.values(scenes.value).forEach(scene => {
      if (!scene.dialogues || scene.dialogues.length === 0) {
        errors.push(`场景「${scene.id}」没有对白`)
      }
      if (scene.requiredMaterial && !materials.value.find(m => m.id === scene.requiredMaterial)) {
        errors.push(`场景「${scene.id}」引用了不存在的必需素材: ${scene.requiredMaterial}`)
      }
      if (scene.optionalMaterials) {
        scene.optionalMaterials.forEach(matId => {
          if (!materials.value.find(m => m.id === matId)) {
            errors.push(`场景「${scene.id}」引用了不存在的可选素材: ${matId}`)
          }
        })
      }
      if (scene.nextScene && !scenes.value[scene.nextScene]) {
        errors.push(`场景「${scene.id}」的 nextScene 指向不存在的场景: ${scene.nextScene}`)
      }
      if (scene.materialCombos) {
        scene.materialCombos.forEach(combo => {
          combo.materials.forEach(matId => {
            if (!materials.value.find(m => m.id === matId)) {
              errors.push(`组合「${combo.name}」引用了不存在的素材: ${matId}`)
            }
          })
        })
      }
    })

    return { errors, warnings, isValid: errors.length === 0 }
  }

  const resetToDefaults = () => {
    if (!confirm('确定要重置所有数据为默认值吗？此操作不可撤销。')) {
      return
    }
    chapters.value = JSON.parse(JSON.stringify(chaptersData))
    scenes.value = JSON.parse(JSON.stringify(scenesData))
    endings.value = JSON.parse(JSON.stringify(endingsData))
    materials.value = JSON.parse(JSON.stringify(materialsData))
    selectedChapterId.value = null
    selectedSceneId.value = null
    selectedDialogueIndex.value = null
    selectedComboId.value = null
    selectedEndingId.value = null
    isDirty.value = false
    showNotification('已重置为默认数据', 'success')
  }

  return {
    chapters,
    scenes,
    endings,
    materials,
    selectedChapterId,
    selectedSceneId,
    selectedDialogueIndex,
    selectedComboId,
    selectedEndingId,
    activeTab,
    isDirty,
    lastSavedAt,
    notification,
    unlockConditionTypes,
    dialogueTriggerTypes,
    timeOfDayOptions,
    weatherOptions,
    selectedChapter,
    selectedScene,
    selectedDialogue,
    selectedCombo,
    selectedEnding,
    availableScenes,
    allSceneIds,
    allMaterialIds,
    allChapterIds,
    showNotification,
    addChapter,
    updateChapter,
    deleteChapter,
    duplicateChapter,
    addScene,
    updateScene,
    deleteScene,
    moveScene,
    addDialogue,
    updateDialogue,
    deleteDialogue,
    moveDialogue,
    addCombo,
    updateCombo,
    deleteCombo,
    addEnding,
    updateEnding,
    deleteEnding,
    addUnlockCondition,
    updateUnlockCondition,
    deleteUnlockCondition,
    exportData,
    importData,
    validateData,
    resetToDefaults
  }
})
