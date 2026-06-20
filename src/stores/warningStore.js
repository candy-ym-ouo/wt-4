import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

const CATEGORY = {
  BROKEN_CHAIN: 'broken_chain',
  MISSING_DIALOGUE: 'missing_dialogue',
  UNCONFIGURED_ASSET: 'unconfigured_asset',
  UNREACHABLE_ENDING: 'unreachable_ending'
}

const CATEGORY_META = {
  [CATEGORY.BROKEN_CHAIN]: { label: '断链场景', icon: '🔗', color: '#ef4444' },
  [CATEGORY.MISSING_DIALOGUE]: { label: '缺失对白', icon: '💬', color: '#f59e0b' },
  [CATEGORY.UNCONFIGURED_ASSET]: { label: '未配置素材', icon: '🧩', color: '#8b5cf6' },
  [CATEGORY.UNREACHABLE_ENDING]: { label: '不可达结局', icon: '🌟', color: '#06b6d4' }
}

export const useWarningStore = defineStore('warning', () => {
  const warnings = ref([])
  const lastValidatedAt = ref(null)
  const isValidating = ref(false)
  const activeCategoryFilter = ref('all')
  const activeSeverityFilter = ref('all')

  const filteredWarnings = computed(() => {
    return warnings.value.filter(w => {
      if (activeCategoryFilter.value !== 'all' && w.category !== activeCategoryFilter.value) return false
      if (activeSeverityFilter.value !== 'all' && w.severity !== activeSeverityFilter.value) return false
      return true
    })
  })

  const groupedWarnings = computed(() => {
    const groups = {}
    for (const cat of Object.values(CATEGORY)) {
      groups[cat] = warnings.value.filter(w => w.category === cat)
    }
    return groups
  })

  const errorCount = computed(() => warnings.value.filter(w => w.severity === SEVERITY.ERROR).length)
  const warningCount = computed(() => warnings.value.filter(w => w.severity === SEVERITY.WARNING).length)
  const infoCount = computed(() => warnings.value.filter(w => w.severity === SEVERITY.INFO).length)
  const totalCount = computed(() => warnings.value.length)
  const hasErrors = computed(() => errorCount.value > 0)
  const hasWarnings = computed(() => warningCount.value > 0 || errorCount.value > 0)

  const categoryCounts = computed(() => {
    const counts = {}
    for (const cat of Object.values(CATEGORY)) {
      counts[cat] = warnings.value.filter(w => w.category === cat).length
    }
    return counts
  })

  function _checkBrokenChainScenes(chapters, scenes) {
    const results = []
    const sceneIds = new Set(Object.keys(scenes))
    const chapterIds = new Set(chapters.map(c => c.id))

    const reachableScenes = new Set()
    for (const chapter of chapters) {
      if (chapter.scenes && chapter.scenes.length > 0) {
        reachableScenes.add(chapter.scenes[0])
      }
    }
    for (const scene of Object.values(scenes)) {
      if (scene.nextScene && sceneIds.has(scene.nextScene)) {
        reachableScenes.add(scene.nextScene)
      }
    }

    for (const scene of Object.values(scenes)) {
      if (scene.nextScene && !sceneIds.has(scene.nextScene)) {
        results.push({
          severity: SEVERITY.ERROR,
          category: CATEGORY.BROKEN_CHAIN,
          code: 'BROKEN_NEXT_SCENE',
          message: `场景「${scene.id}」的 nextScene 指向不存在的场景: ${scene.nextScene}`,
          targetId: scene.id,
          targetField: 'nextScene',
          fix: { field: 'nextScene', value: null }
        })
      }

      if (!chapterIds.has(scene.chapter)) {
        results.push({
          severity: SEVERITY.ERROR,
          category: CATEGORY.BROKEN_CHAIN,
          code: 'ORPHAN_SCENE_CHAPTER',
          message: `场景「${scene.id}」所属的章节不存在: ${scene.chapter}`,
          targetId: scene.id,
          targetField: 'chapter'
        })
      }
    }

    const scenesInChapters = new Set()
    for (const chapter of chapters) {
      if (chapter.scenes) {
        chapter.scenes.forEach(sid => scenesInChapters.add(sid))
      }
    }
    for (const sceneId of sceneIds) {
      if (!scenesInChapters.has(sceneId)) {
        results.push({
          severity: SEVERITY.WARNING,
          category: CATEGORY.BROKEN_CHAIN,
          code: 'ORPHAN_SCENE_UNREFERENCED',
          message: `场景「${sceneId}」未被任何章节引用，将成为孤立场景`,
          targetId: sceneId
        })
      }
    }

    for (const chapter of chapters) {
      if (!chapter.scenes || chapter.scenes.length === 0) continue
      const firstSceneId = chapter.scenes[0]
      for (let i = 0; i < chapter.scenes.length - 1; i++) {
        const sid = chapter.scenes[i]
        const scene = scenes[sid]
        if (!scene) continue
        const expectedNext = chapter.scenes[i + 1]
        if (scene.nextScene && scene.nextScene !== expectedNext) {
          results.push({
            severity: SEVERITY.INFO,
            category: CATEGORY.BROKEN_CHAIN,
            code: 'NON_LINEAR_FLOW',
            message: `章节「${chapter.title}」中场景「${sid}」的 nextScene(${scene.nextScene}) 与章节顺序中的下一场景(${expectedNext})不一致`,
            targetId: sid,
            targetField: 'nextScene'
          })
        }
      }
    }

    return results
  }

  function _checkMissingDialogues(scenes) {
    const results = []

    for (const scene of Object.values(scenes)) {
      if (!scene.dialogues || scene.dialogues.length === 0) {
        results.push({
          severity: SEVERITY.ERROR,
          category: CATEGORY.MISSING_DIALOGUE,
          code: 'EMPTY_DIALOGUES',
          message: `场景「${scene.id}」没有任何对白`,
          targetId: scene.id,
          targetField: 'dialogues'
        })
        continue
      }

      scene.dialogues.forEach((d, index) => {
        if (!d.id) {
          results.push({
            severity: SEVERITY.WARNING,
            category: CATEGORY.MISSING_DIALOGUE,
            code: 'MISSING_DIALOGUE_ID',
            message: `场景「${scene.id}」第 ${index + 1} 条对白缺少 id`,
            targetId: scene.id,
            targetField: `dialogues[${index}].id`
          })
        }
        if (!d.speaker || d.speaker.trim() === '') {
          results.push({
            severity: SEVERITY.WARNING,
            category: CATEGORY.MISSING_DIALOGUE,
            code: 'MISSING_SPEAKER',
            message: `场景「${scene.id}」第 ${index + 1} 条对白缺少说话人`,
            targetId: scene.id,
            targetField: `dialogues[${index}].speaker`
          })
        }
        if (!d.text || d.text.trim() === '') {
          results.push({
            severity: SEVERITY.ERROR,
            category: CATEGORY.MISSING_DIALOGUE,
            code: 'MISSING_TEXT',
            message: `场景「${scene.id}」第 ${index + 1} 条对白内容为空`,
            targetId: scene.id,
            targetField: `dialogues[${index}].text`
          })
        }
      })
    }

    return results
  }

  function _checkUnconfiguredAssets(scenes, materials, chapters) {
    const results = []
    const materialIds = new Set(materials.map(m => m.id))

    for (const scene of Object.values(scenes)) {
      if (!scene.requiredMaterial) {
        results.push({
          severity: SEVERITY.WARNING,
          category: CATEGORY.UNCONFIGURED_ASSET,
          code: 'NO_REQUIRED_MATERIAL',
          message: `场景「${scene.id}」未配置必需素材 (requiredMaterial)`,
          targetId: scene.id,
          targetField: 'requiredMaterial'
        })
      } else if (!materialIds.has(scene.requiredMaterial)) {
        results.push({
          severity: SEVERITY.ERROR,
          category: CATEGORY.UNCONFIGURED_ASSET,
          code: 'INVALID_REQUIRED_MATERIAL',
          message: `场景「${scene.id}」的必需素材不存在: ${scene.requiredMaterial}`,
          targetId: scene.id,
          targetField: 'requiredMaterial'
        })
      }

      if (scene.optionalMaterials) {
        scene.optionalMaterials.forEach((matId, i) => {
          if (!materialIds.has(matId)) {
            results.push({
              severity: SEVERITY.ERROR,
              category: CATEGORY.UNCONFIGURED_ASSET,
              code: 'INVALID_OPTIONAL_MATERIAL',
              message: `场景「${scene.id}」的可选素材[${i}]不存在: ${matId}`,
              targetId: scene.id,
              targetField: `optionalMaterials[${i}]`
            })
          }
        })
      }

      if (scene.materialCombos) {
        scene.materialCombos.forEach((combo, ci) => {
          if (!combo.materials || combo.materials.length === 0) {
            results.push({
              severity: SEVERITY.WARNING,
              category: CATEGORY.UNCONFIGURED_ASSET,
              code: 'EMPTY_COMBO_MATERIALS',
              message: `场景「${scene.id}」的组合「${combo.name || combo.id}」未配置素材列表`,
              targetId: scene.id,
              targetField: `materialCombos[${ci}].materials`
            })
          } else {
            combo.materials.forEach((matId, mi) => {
              if (!materialIds.has(matId)) {
                results.push({
                  severity: SEVERITY.ERROR,
                  category: CATEGORY.UNCONFIGURED_ASSET,
                  code: 'INVALID_COMBO_MATERIAL',
                  message: `场景「${scene.id}」的组合「${combo.name || combo.id}」引用了不存在的素材: ${matId}`,
                  targetId: scene.id,
                  targetField: `materialCombos[${ci}].materials[${mi}]`
                })
              }
            })
          }
          if (combo.hiddenDialogue) {
            if (!combo.hiddenDialogue.text || combo.hiddenDialogue.text.trim() === '') {
              results.push({
                severity: SEVERITY.WARNING,
                category: CATEGORY.UNCONFIGURED_ASSET,
                code: 'EMPTY_HIDDEN_DIALOGUE',
                message: `场景「${scene.id}」的组合「${combo.name || combo.id}」的隐藏对白内容为空`,
                targetId: scene.id,
                targetField: `materialCombos[${ci}].hiddenDialogue.text`
              })
            }
          }
        })
      }

      const slotMaterials = scene.materialSlots || []
      slotMaterials.forEach((slot, si) => {
        if (slot.requiredMaterial && !materialIds.has(slot.requiredMaterial)) {
          results.push({
            severity: SEVERITY.ERROR,
            category: CATEGORY.UNCONFIGURED_ASSET,
            code: 'INVALID_SLOT_MATERIAL',
            message: `场景「${scene.id}」的素材槽位[${si}]引用了不存在的素材: ${slot.requiredMaterial}`,
            targetId: scene.id,
            targetField: `materialSlots[${si}].requiredMaterial`
          })
        }
      })
    }

    for (const chapter of chapters) {
      if (chapter.requiredMaterials) {
        chapter.requiredMaterials.forEach((matId, i) => {
          if (!materialIds.has(matId)) {
            results.push({
              severity: SEVERITY.ERROR,
              category: CATEGORY.UNCONFIGURED_ASSET,
              code: 'INVALID_CHAPTER_MATERIAL',
              message: `章节「${chapter.title}」的必需素材[${i}]不存在: ${matId}`,
              targetId: chapter.id,
              targetField: `requiredMaterials[${i}]`
            })
          }
        })
      }
    }

    return results
  }

  function _checkUnreachableEndings(endings, chapters, scenes, materials) {
    const results = []
    const chapterIds = new Set(chapters.map(c => c.id))
    const materialIds = new Set(materials.map(m => m.id))
    const sceneIds = new Set(Object.keys(scenes))

    for (const ending of endings) {
      const conditions = ending.triggerConditions
      if (!conditions || Object.keys(conditions).length === 0) {
        continue
      }

      if (conditions.allChaptersCompleted) {
        for (const chapter of chapters) {
          if (chapter.hidden) {
            const canUnlock = _canChapterBeReached(chapter, chapters, scenes)
            if (!canUnlock) {
              results.push({
                severity: SEVERITY.WARNING,
                category: CATEGORY.UNREACHABLE_ENDING,
                code: 'UNREACHABLE_CHAPTER_FOR_ENDING',
                message: `结局「${ending.title}」要求所有章节完成，但隐藏章节「${chapter.title}」可能不可达`,
                targetId: ending.id,
                targetField: 'triggerConditions.allChaptersCompleted'
              })
            }
          }
        }
      }

      if (ending.minEmotion !== undefined && ending.minEmotion > 0) {
        let maxPossibleEmotion = 0
        for (const scene of Object.values(scenes)) {
          if (scene.dialogues) {
            maxPossibleEmotion += scene.dialogues.reduce((sum, d) => sum + (d.emotionChange || 0), 0)
          }
          if (scene.materialCombos) {
            maxPossibleEmotion += scene.materialCombos.reduce((sum, c) => sum + (c.emotionBonus || 0), 0)
          }
        }
        if (ending.minEmotion > maxPossibleEmotion) {
          results.push({
            severity: SEVERITY.ERROR,
            category: CATEGORY.UNREACHABLE_ENDING,
            code: 'EMOTION_THRESHOLD_IMPOSSIBLE',
            message: `结局「${ending.title}」需要情绪值 ${ending.minEmotion}，但全场景最大可得情绪值为 ${maxPossibleEmotion}`,
            targetId: ending.id,
            targetField: 'minEmotion'
          })
        }
      }

      if (conditions.seasonComboTriggered) {
        const hasSeasonCombo = Object.values(scenes).some(s =>
          s.materialCombos && s.materialCombos.some(c =>
            c.materials && c.materials.length >= 4
          )
        )
        if (!hasSeasonCombo) {
          results.push({
            severity: SEVERITY.WARNING,
            category: CATEGORY.UNREACHABLE_ENDING,
            code: 'MISSING_SEASON_COMBO',
            message: `结局「${ending.title}」要求触发季节组合，但未找到含4+素材的组合`,
            targetId: ending.id,
            targetField: 'triggerConditions.seasonComboTriggered'
          })
        }
      }

      if (conditions.allChaptersPerfect) {
        const nonHiddenChapters = chapters.filter(c => !c.hidden)
        if (nonHiddenChapters.length < chapters.length) {
          const allReachable = chapters.every(ch => !ch.hidden || _canChapterBeReached(ch, chapters, scenes))
          if (!allReachable) {
            results.push({
              severity: SEVERITY.WARNING,
              category: CATEGORY.UNREACHABLE_ENDING,
              code: 'PERFECT_UNREACHABLE_CHAPTER',
              message: `结局「${ending.title}」要求所有章节完美完成，但存在不可达的隐藏章节`,
              targetId: ending.id,
              targetField: 'triggerConditions.allChaptersPerfect'
            })
          }
        }
      }
    }

    return results
  }

  function _canChapterBeReached(chapter, allChapters, scenes) {
    if (!chapter.unlockConditions || chapter.unlockConditions.length === 0) return true
    for (const cond of chapter.unlockConditions) {
      if (cond.type === 'chapter_completed') {
        const target = allChapters.find(c => c.id === cond.target)
        if (!target) return false
        if (target.hidden && !_canChapterBeReached(target, allChapters, scenes)) return false
      }
      if (cond.type === 'affinity_reached') {
        return true
      }
    }
    return true
  }

  function runFullValidation(chapters, scenes, endings, materials) {
    isValidating.value = true
    const allWarnings = []

    allWarnings.push(..._checkBrokenChainScenes(chapters, scenes))
    allWarnings.push(..._checkMissingDialogues(scenes))
    allWarnings.push(..._checkUnconfiguredAssets(scenes, materials, chapters))
    allWarnings.push(..._checkUnreachableEndings(endings, chapters, scenes, materials))

    warnings.value = allWarnings
    lastValidatedAt.value = new Date()
    isValidating.value = false
    return allWarnings
  }

  function validateScene(scene, materials) {
    const results = []
    if (!scene) return results

    const materialIds = new Set(materials.map(m => m.id))

    if (scene.nextScene !== null && scene.nextScene !== undefined) {
      // this check needs full context, skip single-scene validation
    }
    if (!scene.dialogues || scene.dialogues.length === 0) {
      results.push({
        severity: SEVERITY.ERROR,
        category: CATEGORY.MISSING_DIALOGUE,
        code: 'EMPTY_DIALOGUES',
        message: `场景「${scene.id}」没有任何对白`,
        targetId: scene.id,
        targetField: 'dialogues'
      })
    }
    if (!scene.requiredMaterial) {
      results.push({
        severity: SEVERITY.WARNING,
        category: CATEGORY.UNCONFIGURED_ASSET,
        code: 'NO_REQUIRED_MATERIAL',
        message: `场景「${scene.id}」未配置必需素材`,
        targetId: scene.id,
        targetField: 'requiredMaterial'
      })
    } else if (!materialIds.has(scene.requiredMaterial)) {
      results.push({
        severity: SEVERITY.ERROR,
        category: CATEGORY.UNCONFIGURED_ASSET,
        code: 'INVALID_REQUIRED_MATERIAL',
        message: `场景「${scene.id}」的必需素材不存在: ${scene.requiredMaterial}`,
        targetId: scene.id,
        targetField: 'requiredMaterial'
      })
    }
    return results
  }

  function clearWarnings() {
    warnings.value = []
    lastValidatedAt.value = null
  }

  function setFilter(category, severity) {
    if (category !== undefined) activeCategoryFilter.value = category
    if (severity !== undefined) activeSeverityFilter.value = severity
  }

  return {
    warnings,
    lastValidatedAt,
    isValidating,
    activeCategoryFilter,
    activeSeverityFilter,
    filteredWarnings,
    groupedWarnings,
    errorCount,
    warningCount,
    infoCount,
    totalCount,
    hasErrors,
    hasWarnings,
    categoryCounts,
    runFullValidation,
    validateScene,
    clearWarnings,
    setFilter,
    SEVERITY,
    CATEGORY,
    CATEGORY_META
  }
})
