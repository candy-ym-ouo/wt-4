import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import chaptersData from '../data/chapters.json'
import scenesData from '../data/scenes.json'
import endingsData from '../data/endings.json'
import materialsData from '../data/materials.json'
import audiosData from '../data/audios.json'

export const useReviewStore = defineStore('review', () => {
  const activeModule = ref('preview')
  const selectedChapterId = ref(null)
  const selectedEndingId = ref(null)
  const reviewNotes = ref({})
  const publishStatus = ref({})
  const notification = ref(null)

  const chapters = ref(JSON.parse(JSON.stringify(chaptersData)))
  const scenes = ref(JSON.parse(JSON.stringify(scenesData)))
  const endings = ref(JSON.parse(JSON.stringify(endingsData)))
  const materials = ref(JSON.parse(JSON.stringify(materialsData)))
  const audios = ref(JSON.parse(JSON.stringify(audiosData)))

  const selectedChapter = computed(() => {
    return chapters.value.find(c => c.id === selectedChapterId.value) || null
  })

  const selectedEnding = computed(() => {
    return endings.value.find(e => e.id === selectedEndingId.value) || null
  })

  const chapterScenes = computed(() => {
    if (!selectedChapter.value) return []
    return selectedChapter.value.scenes.map(id => scenes.value[id]).filter(Boolean)
  })

  const allDialogues = computed(() => {
    return Object.values(scenes.value).flatMap(s => s.dialogues || [])
  })

  const showNotification = (message, type = 'info', duration = 3000) => {
    notification.value = { message, type }
    setTimeout(() => {
      if (notification.value?.message === message) {
        notification.value = null
      }
    }, duration)
  }

  const validateChapterStructure = (chapterId) => {
    const errors = []
    const warnings = []
    const chapter = chapters.value.find(c => c.id === chapterId)
    if (!chapter) {
      return { errors: ['章节不存在'], warnings: [], valid: false }
    }

    if (!chapter.title || chapter.title.trim() === '') {
      errors.push(`章节标题为空`)
    }
    if (!chapter.scenes || chapter.scenes.length === 0) {
      errors.push(`章节「${chapter.title}」没有关联任何场景`)
    }

    chapter.scenes.forEach((sceneId, idx) => {
      const scene = scenes.value[sceneId]
      if (!scene) {
        errors.push(`场景 ${sceneId} 不存在`)
        return
      }
      if (!scene.dialogues || scene.dialogues.length === 0) {
        errors.push(`场景「${sceneId}」没有对白`)
      }
      if (scene.dialogues && scene.dialogues.length > 0) {
        const lastDialogue = scene.dialogues[scene.dialogues.length - 1]
        if (lastDialogue.emotionChange === undefined || lastDialogue.emotionChange === null) {
          warnings.push(`场景「${sceneId}」最后一条对白缺少情绪变化值`)
        }
      }
      if (idx < chapter.scenes.length - 1 && !scene.nextScene && scene.requiredMaterial === null) {
        warnings.push(`场景「${sceneId}」没有设置 nextScene 或 requiredMaterial，可能导致流程中断`)
      }
    })

    if (chapter.requiredMaterials) {
      chapter.requiredMaterials.forEach(matId => {
        if (!materials.value.find(m => m.id === matId)) {
          errors.push(`章节必需素材不存在: ${matId}`)
        }
      })
    }

    return { errors, warnings, valid: errors.length === 0 }
  }

  const validateBranches = () => {
    const errors = []
    const warnings = []
    const branchInfo = []

    Object.values(scenes.value).forEach(scene => {
      const chapter = chapters.value.find(c => c.scenes?.includes(scene.id))
      const chapterTitle = chapter ? chapter.title : '未知章节'
      const combos = scene.materialCombos || []

      if (scene.requiredMaterial) {
        const hasOptional = scene.optionalMaterials && scene.optionalMaterials.length > 0
        branchInfo.push({
          sceneId: scene.id,
          chapterTitle,
          type: 'material_branch',
          requiredMaterial: scene.requiredMaterial,
          optionalMaterials: scene.optionalMaterials || [],
          comboCount: combos.length,
          description: `需要放置「${scene.requiredMaterial}」触发分支`
        })
        if (!materials.value.find(m => m.id === scene.requiredMaterial)) {
          errors.push(`场景「${scene.id}」必需素材不存在: ${scene.requiredMaterial}`)
        }
        if (combos.length === 0) {
          warnings.push(`场景「${scene.id}」有素材需求但没有定义组合效果`)
        }
      }

      if (scene.nextScene && !scenes.value[scene.nextScene]) {
        errors.push(`场景「${scene.id}」的 nextScene 指向不存在的场景: ${scene.nextScene}`)
      }

      combos.forEach(combo => {
        if (!combo.materials || combo.materials.length === 0) {
          warnings.push(`组合「${combo.name}」没有定义所需素材`)
        }
        combo.materials.forEach(matId => {
          if (!materials.value.find(m => m.id === matId)) {
            errors.push(`组合「${combo.name}」引用不存在的素材: ${matId}`)
          }
        })
      })
    })

    chapters.value.forEach(chapter => {
      const lastSceneId = chapter.scenes?.[chapter.scenes.length - 1]
      if (lastSceneId) {
        const lastScene = scenes.value[lastSceneId]
        if (lastScene && !lastScene.dialogues?.some(d => d.trigger === 'chapter_complete')) {
          warnings.push(`章节「${chapter.title}」最后一个场景缺少 chapter_complete 触发器`)
        }
      }
    })

    return { errors, warnings, branchInfo, valid: errors.length === 0 }
  }

  const checkMaterialRelations = () => {
    const issues = []
    const materialUsage = {}
    const orphanMaterials = []

    materials.value.forEach(mat => {
      materialUsage[mat.id] = {
        material: mat,
        usedInChapters: [],
        usedInScenes: [],
        usedInCombos: [],
        usedAsOptional: [],
        totalUsage: 0
      }
    })

    chapters.value.forEach(chapter => {
      chapter.requiredMaterials?.forEach(matId => {
        if (materialUsage[matId]) {
          materialUsage[matId].usedInChapters.push(chapter.title)
          materialUsage[matId].totalUsage++
        }
      })
    })

    Object.values(scenes.value).forEach(scene => {
      if (scene.requiredMaterial && materialUsage[scene.requiredMaterial]) {
        materialUsage[scene.requiredMaterial].usedInScenes.push(scene.id)
        materialUsage[scene.requiredMaterial].totalUsage++
      }
      scene.optionalMaterials?.forEach(matId => {
        if (materialUsage[matId]) {
          materialUsage[matId].usedAsOptional.push(scene.id)
          materialUsage[matId].totalUsage++
        }
      })
      scene.materialCombos?.forEach(combo => {
        combo.materials?.forEach(matId => {
          if (materialUsage[matId]) {
            materialUsage[matId].usedInCombos.push(`${scene.id}/${combo.name}`)
            materialUsage[matId].totalUsage++
          }
        })
      })
    })

    Object.keys(materialUsage).forEach(matId => {
      const usage = materialUsage[matId]
      if (usage.totalUsage === 0) {
        orphanMaterials.push(usage.material)
        issues.push({
          type: 'orphan',
          severity: 'warning',
          message: `素材「${usage.material.name}」(${matId}) 未被任何地方引用`
        })
      }
      if (usage.material.rarity === 'rare' && usage.totalUsage < 2) {
        issues.push({
          type: 'underused_rare',
          severity: 'info',
          message: `稀有素材「${usage.material.name}」仅被使用 ${usage.totalUsage} 次`
        })
      }
    })

    chapters.value.forEach(chapter => {
      chapter.requiredMaterials?.forEach(matId => {
        const chapterScenes = chapter.scenes?.map(id => scenes.value[id]).filter(Boolean)
        const sceneMatIds = chapterScenes.flatMap(s => [
          s.requiredMaterial,
          ...(s.optionalMaterials || []),
          ...(s.materialCombos?.flatMap(c => c.materials) || [])
        ]).filter(Boolean)
        if (!sceneMatIds.includes(matId)) {
          issues.push({
            type: 'unmatched_required',
            severity: 'warning',
            message: `章节「${chapter.title}」要求素材「${matId}」，但该章节场景中未使用此素材`
          })
        }
      })
    })

    return { issues, materialUsage, orphanMaterials }
  }

  const validateAudioIntegrity = () => {
    const issues = []
    const audioIds = new Set()

    const collectAudioIds = (obj) => {
      if (!obj || typeof obj !== 'object') return
      Object.values(obj).forEach(val => {
        if (val && typeof val === 'object') {
          if (val.id) audioIds.add(val.id)
          collectAudioIds(val)
        }
      })
    }
    collectAudioIds(audios.value)

    Object.entries(audios.value.sceneMapping || {}).forEach(([sceneId, mapping]) => {
      if (!scenes.value[sceneId]) {
        issues.push({ type: 'missing_scene', severity: 'warning', message: `音效映射引用了不存在的场景: ${sceneId}` })
      }
      Object.values(mapping).forEach(audioRef => {
        if (audioRef.ambient && !audioIds.has(audioRef.ambient)) {
          issues.push({ type: 'missing_audio', severity: 'error', message: `场景 ${sceneId} 引用了不存在的环境音: ${audioRef.ambient}` })
        }
        if (audioRef.music && !audioIds.has(audioRef.music)) {
          issues.push({ type: 'missing_audio', severity: 'error', message: `场景 ${sceneId} 引用了不存在的音乐: ${audioRef.music}` })
        }
      })
    })

    Object.entries(audios.value.endingMapping || {}).forEach(([endingId, mapping]) => {
      if (!endings.value.find(e => e.id === endingId)) {
        issues.push({ type: 'missing_ending', severity: 'warning', message: `结局音效映射引用了不存在的结局: ${endingId}` })
      }
      if (mapping.music && !audioIds.has(mapping.music)) {
        issues.push({ type: 'missing_audio', severity: 'error', message: `结局 ${endingId} 引用了不存在的音乐: ${mapping.music}` })
      }
    })

    return issues
  }

  const validateEndings = () => {
    const errors = []
    const warnings = []
    const endingAnalysis = []

    endings.value.forEach(ending => {
      const analysis = {
        ending,
        hasContent: !!ending.content && ending.content.trim().length > 0,
        hasConditions: !!ending.triggerConditions && Object.keys(ending.triggerConditions).length > 0,
        hasDescription: !!ending.description,
        hasBackground: !!ending.background
      }

      if (!analysis.hasContent) {
        errors.push(`结局「${ending.title}」缺少内容文本`)
      }
      if (!analysis.hasConditions) {
        errors.push(`结局「${ending.title}」缺少触发条件`)
      }
      if (!analysis.hasDescription) {
        warnings.push(`结局「${ending.title}」缺少描述`)
      }
      if (!analysis.hasBackground) {
        warnings.push(`结局「${ending.title}」缺少背景样式`)
      }

      const audioMap = audios.value.endingMapping?.[ending.id]
      if (!audioMap) {
        warnings.push(`结局「${ending.title}」没有配置音效映射`)
      }

      endingAnalysis.push(analysis)
    })

    const allTypes = endings.value.map(e => e.type)
    const requiredTypes = ['normal', 'good', 'true']
    requiredTypes.forEach(type => {
      if (!allTypes.includes(type)) {
        warnings.push(`缺少类型为「${type}」的结局`)
      }
    })

    return { errors, warnings, endingAnalysis, valid: errors.length === 0 }
  }

  const runFullReview = () => {
    const chapterResults = {}
    chapters.value.forEach(c => {
      chapterResults[c.id] = validateChapterStructure(c.id)
    })
    const branchResult = validateBranches()
    const materialResult = checkMaterialRelations()
    const audioIssues = validateAudioIntegrity()
    const endingResult = validateEndings()

    const allErrors = [
      ...Object.values(chapterResults).flatMap(r => r.errors),
      ...branchResult.errors,
      ...materialResult.issues.filter(i => i.severity === 'error').map(i => i.message),
      ...audioIssues.filter(i => i.severity === 'error').map(i => i.message),
      ...endingResult.errors
    ]
    const allWarnings = [
      ...Object.values(chapterResults).flatMap(r => r.warnings),
      ...branchResult.warnings,
      ...materialResult.issues.filter(i => i.severity !== 'error').map(i => i.message),
      ...audioIssues.filter(i => i.severity !== 'error').map(i => i.message),
      ...endingResult.warnings
    ]

    return {
      chapterResults,
      branchResult,
      materialResult,
      audioIssues,
      endingResult,
      summary: {
        errorCount: allErrors.length,
        warningCount: allWarnings.length,
        canPublish: allErrors.length === 0,
        chapters: chapters.value.length,
        scenes: Object.keys(scenes.value).length,
        dialogues: allDialogues.value.length,
        endings: endings.value.length,
        materials: materials.value.length
      }
    }
  }

  const addReviewNote = (targetType, targetId, note) => {
    const key = `${targetType}:${targetId}`
    if (!reviewNotes.value[key]) {
      reviewNotes.value[key] = []
    }
    reviewNotes.value[key].push({
      id: Date.now(),
      content: note,
      createdAt: new Date().toISOString(),
      resolved: false
    })
    showNotification('审核意见已添加', 'success')
  }

  const resolveReviewNote = (targetType, targetId, noteId) => {
    const key = `${targetType}:${targetId}`
    if (reviewNotes.value[key]) {
      const note = reviewNotes.value[key].find(n => n.id === noteId)
      if (note) {
        note.resolved = true
        showNotification('问题已标记为已解决', 'success')
      }
    }
  }

  const getReviewNotes = (targetType, targetId) => {
    const key = `${targetType}:${targetId}`
    return reviewNotes.value[key] || []
  }

  const setPublishStatus = (targetType, targetId, status, comment = '') => {
    const key = `${targetType}:${targetId}`
    publishStatus.value[key] = {
      status,
      comment,
      updatedAt: new Date().toISOString()
    }
    showNotification(`状态已更新为: ${status}`, 'success')
  }

  const getPublishStatus = (targetType, targetId) => {
    const key = `${targetType}:${targetId}`
    return publishStatus.value[key] || { status: 'draft', comment: '', updatedAt: null }
  }

  const publishEnding = (endingId) => {
    const ending = endings.value.find(e => e.id === endingId)
    if (!ending) {
      showNotification('结局不存在', 'error')
      return false
    }
    const validation = validateEndings()
    const endingErrors = validation.errors.filter(e => e.includes(ending.title))
    if (endingErrors.length > 0) {
      showNotification('存在错误，无法发布', 'error')
      return false
    }
    setPublishStatus('ending', endingId, 'published', '审核通过并发布')
    showNotification(`结局「${ending.title}」已发布`, 'success')
    return true
  }

  return {
    activeModule,
    selectedChapterId,
    selectedEndingId,
    reviewNotes,
    publishStatus,
    notification,
    chapters,
    scenes,
    endings,
    materials,
    audios,
    selectedChapter,
    selectedEnding,
    chapterScenes,
    allDialogues,
    showNotification,
    validateChapterStructure,
    validateBranches,
    checkMaterialRelations,
    validateAudioIntegrity,
    validateEndings,
    runFullReview,
    addReviewNote,
    resolveReviewNote,
    getReviewNotes,
    setPublishStatus,
    getPublishStatus,
    publishEnding
  }
})
