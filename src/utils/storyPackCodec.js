const PACK_FORMAT = 'story-pack'
const PACK_VERSION = '1.0'

const generateChecksum = (data) => {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

export const collectChapterDependencies = (chapters, scenes, endings, materials, chapterIds) => {
  const selectedChapters = chapters.filter(c => chapterIds.includes(c.id))
  const sceneIds = new Set()
  const materialIds = new Set()

  selectedChapters.forEach(chapter => {
    if (chapter.scenes) {
      chapter.scenes.forEach(sid => sceneIds.add(sid))
    }
    if (chapter.requiredMaterials) {
      chapter.requiredMaterials.forEach(mid => materialIds.add(mid))
    }
  })

  const selectedScenes = {}
  sceneIds.forEach(sid => {
    if (scenes[sid]) {
      selectedScenes[sid] = JSON.parse(JSON.stringify(scenes[sid]))
      const scene = selectedScenes[sid]
      if (scene.requiredMaterial) materialIds.add(scene.requiredMaterial)
      if (scene.optionalMaterials) {
        scene.optionalMaterials.forEach(mid => materialIds.add(mid))
      }
      if (scene.materialCombos) {
        scene.materialCombos.forEach(combo => {
          if (combo.materials) combo.materials.forEach(mid => materialIds.add(mid))
        })
      }
    }
  })

  const usedEndingIds = new Set()
  endings.forEach(ending => {
    if (ending.triggerConditions) {
      const cond = ending.triggerConditions
      if (cond.allChaptersCompleted || cond.allOfTheAbove) {
        const allMainChaptersSelected = selectedChapters.every(c => !c.hidden)
        if (allMainChaptersSelected) usedEndingIds.add(ending.id)
      }
      if (cond.minCompletedChapterCount !== undefined && cond.minCompletedChapterCount <= selectedChapters.length) {
        usedEndingIds.add(ending.id)
      }
    }
  })

  endings.forEach(ending => {
    const cond = ending.triggerConditions || {}
    const hasChapterRef = Object.keys(cond).some(key =>
      typeof cond[key] === 'string' && chapterIds.includes(cond[key])
    )
    if (usedEndingIds.has(ending.id) || hasChapterRef || Object.keys(cond).length === 0) {
      usedEndingIds.add(ending.id)
    }
  })

  const selectedEndings = endings.filter(e => usedEndingIds.has(e.id))
  const selectedMaterials = materials.filter(m => materialIds.has(m.id))

  return {
    chapters: selectedChapters,
    scenes: selectedScenes,
    endings: selectedEndings,
    materials: selectedMaterials
  }
}

export const createStoryPack = (chapters, scenes, endings, materials, options = {}) => {
  const { selectedChapterIds, name = '未命名剧情包', description = '', author = '' } = options

  let packData
  if (selectedChapterIds && selectedChapterIds.length > 0) {
    packData = collectChapterDependencies(chapters, scenes, endings, materials, selectedChapterIds)
  } else {
    packData = {
      chapters: JSON.parse(JSON.stringify(chapters)),
      scenes: JSON.parse(JSON.stringify(scenes)),
      endings: JSON.parse(JSON.stringify(endings)),
      materials: JSON.parse(JSON.stringify(materials))
    }
  }

  const metadata = {
    name,
    description,
    author,
    createdAt: new Date().toISOString(),
    chapters: packData.chapters.length,
    scenes: Object.keys(packData.scenes).length,
    endings: packData.endings.length,
    materials: packData.materials.length
  }

  const pack = {
    format: PACK_FORMAT,
    version: PACK_VERSION,
    metadata,
    data: packData,
    checksum: generateChecksum(packData)
  }

  return pack
}

export const parseStoryPack = (jsonString) => {
  try {
    const pack = JSON.parse(jsonString)

    if (pack.format !== PACK_FORMAT) {
      return { valid: false, error: `不支持的格式: ${pack.format}，期望: ${PACK_FORMAT}` }
    }

    if (!pack.data) {
      return { valid: false, error: '剧情包缺少数据字段' }
    }

    const { data } = pack
    if (!Array.isArray(data.chapters)) {
      return { valid: false, error: '剧情包章节数据格式错误' }
    }
    if (typeof data.scenes !== 'object' || data.scenes === null) {
      return { valid: false, error: '剧情包场景数据格式错误' }
    }
    if (!Array.isArray(data.endings)) {
      return { valid: false, error: '剧情包结局数据格式错误' }
    }
    if (!Array.isArray(data.materials)) {
      return { valid: false, error: '剧情包素材数据格式错误' }
    }

    const currentChecksum = generateChecksum(data)
    if (pack.checksum && pack.checksum !== currentChecksum) {
      return { valid: false, error: '数据校验失败，文件可能已损坏' }
    }

    return { valid: true, pack }
  } catch (e) {
    return { valid: false, error: `解析失败: ${e.message}` }
  }
}

export const getPackPreview = (pack) => {
  const { metadata, data } = pack

  const sceneCount = Object.keys(data.scenes).length
  const dialogueCount = Object.values(data.scenes).reduce((sum, s) => sum + (s.dialogues?.length || 0), 0)
  const comboCount = Object.values(data.scenes).reduce((sum, s) => sum + (s.materialCombos?.length || 0), 0)

  return {
    name: metadata?.name || '未命名',
    description: metadata?.description || '',
    author: metadata?.author || '',
    createdAt: metadata?.createdAt || '',
    stats: {
      chapters: data.chapters.length,
      scenes: sceneCount,
      endings: data.endings.length,
      materials: data.materials.length,
      dialogues: dialogueCount,
      combos: comboCount
    },
    chapterList: data.chapters.map(c => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle,
      sceneCount: c.scenes?.length || 0,
      hidden: c.hidden || false
    })),
    endingList: data.endings.map(e => ({
      id: e.id,
      title: e.title,
      type: e.type
    })),
    materialList: data.materials.map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      rarity: m.rarity
    }))
  }
}

export const validatePackIntegrity = (pack) => {
  const { data } = pack
  const errors = []
  const warnings = []

  const materialIds = new Set(data.materials.map(m => m.id))
  const sceneIds = new Set(Object.keys(data.scenes))
  const chapterIds = new Set(data.chapters.map(c => c.id))

  data.chapters.forEach(chapter => {
    if (!chapter.scenes || chapter.scenes.length === 0) {
      warnings.push(`章节「${chapter.title}」没有场景`)
    }
    chapter.scenes?.forEach(sid => {
      if (!sceneIds.has(sid)) {
        errors.push(`章节「${chapter.title}」引用了不存在的场景: ${sid}`)
      }
    })
    chapter.requiredMaterials?.forEach(mid => {
      if (!materialIds.has(mid)) {
        errors.push(`章节「${chapter.title}」引用了不存在的素材: ${mid}`)
      }
    })
  })

  Object.values(data.scenes).forEach(scene => {
    if (!scene.dialogues || scene.dialogues.length === 0) {
      errors.push(`场景「${scene.id}」没有对白`)
    }
    if (scene.chapter && !chapterIds.has(scene.chapter)) {
      warnings.push(`场景「${scene.id}」引用了包外章节: ${scene.chapter}`)
    }
    if (scene.requiredMaterial && !materialIds.has(scene.requiredMaterial)) {
      errors.push(`场景「${scene.id}」引用了不存在的必需素材: ${scene.requiredMaterial}`)
    }
    scene.optionalMaterials?.forEach(mid => {
      if (!materialIds.has(mid)) {
        errors.push(`场景「${scene.id}」引用了不存在的可选素材: ${mid}`)
      }
    })
    if (scene.nextScene && !sceneIds.has(scene.nextScene)) {
      warnings.push(`场景「${scene.id}」的 nextScene 指向包外场景: ${scene.nextScene}`)
    }
    scene.materialCombos?.forEach(combo => {
      combo.materials?.forEach(mid => {
        if (!materialIds.has(mid)) {
          errors.push(`组合「${combo.name}」引用了不存在的素材: ${mid}`)
        }
      })
    })
  })

  return { errors, warnings, isValid: errors.length === 0 }
}

export const detectConflicts = (packData, existingChapters, existingScenes, existingEndings, existingMaterials) => {
  const conflicts = {
    chapters: [],
    scenes: [],
    endings: [],
    materials: []
  }

  const existingChapterIds = new Set(existingChapters.map(c => c.id))
  const existingSceneIds = new Set(Object.keys(existingScenes))
  const existingEndingIds = new Set(existingEndings.map(e => e.id))
  const existingMaterialIds = new Set(existingMaterials.map(m => m.id))

  packData.chapters.forEach(chapter => {
    if (existingChapterIds.has(chapter.id)) {
      const existing = existingChapters.find(c => c.id === chapter.id)
      conflicts.chapters.push({
        id: chapter.id,
        incomingTitle: chapter.title,
        existingTitle: existing.title
      })
    }
  })

  Object.keys(packData.scenes).forEach(sid => {
    if (existingSceneIds.has(sid)) {
      conflicts.scenes.push({
        id: sid,
        incomingChapter: packData.scenes[sid].chapter,
        existingChapter: existingScenes[sid].chapter
      })
    }
  })

  packData.endings.forEach(ending => {
    if (existingEndingIds.has(ending.id)) {
      const existing = existingEndings.find(e => e.id === ending.id)
      conflicts.endings.push({
        id: ending.id,
        incomingTitle: ending.title,
        existingTitle: existing.title
      })
    }
  })

  packData.materials.forEach(material => {
    if (existingMaterialIds.has(material.id)) {
      const existing = existingMaterials.find(m => m.id === material.id)
      conflicts.materials.push({
        id: material.id,
        incomingName: material.name,
        existingName: existing.name
      })
    }
  })

  const hasConflicts = conflicts.chapters.length > 0 || conflicts.scenes.length > 0 ||
    conflicts.endings.length > 0 || conflicts.materials.length > 0

  return { conflicts, hasConflicts }
}

export const mergePackData = (packData, existingChapters, existingScenes, existingEndings, existingMaterials, strategy = 'rename') => {
  const idMap = { chapters: {}, scenes: {}, endings: {}, materials: {} }

  const generateNewId = (prefix) => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 6)
    return `${prefix}_${timestamp}_${random}`
  }

  const existingChapterIds = new Set(existingChapters.map(c => c.id))
  const existingSceneIds = new Set(Object.keys(existingScenes))
  const existingEndingIds = new Set(existingEndings.map(e => e.id))
  const existingMaterialIds = new Set(existingMaterials.map(m => m.id))

  const newMaterials = JSON.parse(JSON.stringify(packData.materials))
  newMaterials.forEach(mat => {
    if (strategy === 'rename' && existingMaterialIds.has(mat.id)) {
      const newId = generateNewId('mat', existingMaterialIds)
      idMap.materials[mat.id] = newId
      mat.id = newId
      existingMaterialIds.add(newId)
    } else {
      existingMaterialIds.add(mat.id)
    }
  })

  const newChapters = JSON.parse(JSON.stringify(packData.chapters))
  newChapters.forEach(chapter => {
    if (strategy === 'rename' && existingChapterIds.has(chapter.id)) {
      const newId = generateNewId('chapter', existingChapterIds)
      idMap.chapters[chapter.id] = newId
      chapter.id = newId
      if (chapter.title) chapter.title += ' (导入)'
      existingChapterIds.add(newId)
    } else {
      existingChapterIds.add(chapter.id)
    }

    if (chapter.requiredMaterials) {
      chapter.requiredMaterials = chapter.requiredMaterials.map(mid => idMap.materials[mid] || mid)
    }

    if (chapter.unlockConditions) {
      chapter.unlockConditions = chapter.unlockConditions.map(cond => {
        const mapped = { ...cond }
        if (mapped.target && idMap.chapters[mapped.target]) {
          mapped.target = idMap.chapters[mapped.target]
        }
        return mapped
      })
    }
  })

  const newScenes = JSON.parse(JSON.stringify(packData.scenes))
  Object.entries(newScenes).forEach(([sid, scene]) => {
    let newSid = sid
    if (strategy === 'rename' && existingSceneIds.has(sid)) {
      newSid = generateNewId('scene', existingSceneIds)
      idMap.scenes[sid] = newSid
      scene.id = newSid
      existingSceneIds.add(newSid)
    } else {
      existingSceneIds.add(sid)
    }

    if (scene.chapter && idMap.chapters[scene.chapter]) {
      scene.chapter = idMap.chapters[scene.chapter]
    }

    if (scene.requiredMaterial && idMap.materials[scene.requiredMaterial]) {
      scene.requiredMaterial = idMap.materials[scene.requiredMaterial]
    }

    if (scene.optionalMaterials) {
      scene.optionalMaterials = scene.optionalMaterials.map(mid => idMap.materials[mid] || mid)
    }

    if (scene.materialCombos) {
      scene.materialCombos.forEach(combo => {
        if (combo.materials) {
          combo.materials = combo.materials.map(mid => idMap.materials[mid] || mid)
        }
      })
    }

    if (scene.nextScene && idMap.scenes[scene.nextScene]) {
      scene.nextScene = idMap.scenes[scene.nextScene]
    }

    delete newScenes[sid]
    newScenes[newSid] = scene
  })

  newChapters.forEach(chapter => {
    if (chapter.scenes) {
      chapter.scenes = chapter.scenes.map(sid => idMap.scenes[sid] || sid)
    }
  })

  const newEndings = JSON.parse(JSON.stringify(packData.endings))
  newEndings.forEach(ending => {
    if (strategy === 'rename' && existingEndingIds.has(ending.id)) {
      const newId = generateNewId('ending', existingEndingIds)
      idMap.endings[ending.id] = newId
      ending.id = newId
      existingEndingIds.add(newId)
    } else {
      existingEndingIds.add(ending.id)
    }

    if (ending.triggerConditions) {
      const cond = ending.triggerConditions
      if (cond.materialOrder && Array.isArray(cond.materialOrder)) {
        cond.materialOrder = cond.materialOrder.map(mid => idMap.materials[mid] || mid)
      }
      if (cond.requiredMaterials && Array.isArray(cond.requiredMaterials)) {
        cond.requiredMaterials = cond.requiredMaterials.map(mid => idMap.materials[mid] || mid)
      }
      if (cond.requireChapter && idMap.chapters[cond.requireChapter]) {
        cond.requireChapter = idMap.chapters[cond.requireChapter]
      }
      if (cond.requireEnding && idMap.endings[cond.requireEnding]) {
        cond.requireEnding = idMap.endings[cond.requireEnding]
      }
      if (cond.requireScene && idMap.scenes[cond.requireScene]) {
        cond.requireScene = idMap.scenes[cond.requireScene]
      }
      if (cond.requiredChapters && Array.isArray(cond.requiredChapters)) {
        cond.requiredChapters = cond.requiredChapters.map(cid => idMap.chapters[cid] || cid)
      }
      if (cond.requiredEndings && Array.isArray(cond.requiredEndings)) {
        cond.requiredEndings = cond.requiredEndings.map(eid => idMap.endings[eid] || eid)
      }
      if (cond.requiredScenes && Array.isArray(cond.requiredScenes)) {
        cond.requiredScenes = cond.requiredScenes.map(sid => idMap.scenes[sid] || sid)
      }
    }
  })

  return {
    chapters: newChapters,
    scenes: newScenes,
    endings: newEndings,
    materials: newMaterials,
    idMap
  }
}

export const exportPackToFile = (pack, filename) => {
  const json = JSON.stringify(pack, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `story-pack-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export const readPackFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = parseStoryPack(e.target.result)
      if (result.valid) {
        resolve(result.pack)
      } else {
        reject(new Error(result.error))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}
