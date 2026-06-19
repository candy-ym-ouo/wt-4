<template>
  <div class="combos-main">
    <div class="toolbar">
      <h2 class="m-0">✨ 素材组合管理</h2>
      <div class="toolbar-actions">
        <select
          class="form-select form-input-sm"
          style="width: 220px;"
          :value="editorStore.selectedSceneId || ''"
          @change="editorStore.selectedSceneId = $event.target.value || null"
        >
          <option value="">全部场景</option>
          <optgroup v-for="ch in editorStore.chapters" :key="ch.id" :label="ch.title">
            <option v-for="sid in ch.scenes" :key="sid" :value="sid">
              {{ sid }}
            </option>
          </optgroup>
        </select>
        <button
          class="btn btn-primary btn-sm"
          :disabled="!editorStore.selectedSceneId"
          @click="editorStore.addCombo(editorStore.selectedSceneId)"
        >
          ➕ 新建组合
        </button>
      </div>
    </div>

    <div v-if="allCombos.length === 0" class="empty-state">
      <div class="empty-state-icon">✨</div>
      <div class="empty-state-text">
        {{ editorStore.selectedSceneId ? '该场景还没有组合' : '请先选择一个场景' }}
      </div>
    </div>

    <div v-else class="combos-grid">
      <div
        v-for="item in allCombos"
        :key="item.combo.id"
        class="combo-card"
        :class="{ active: editorStore.selectedComboId === item.combo.id }"
        @click="selectCombo(item)"
      >
        <div class="combo-card-header">
          <span class="combo-icon">✨</span>
          <span class="combo-name">{{ item.combo.name }}</span>
          <span class="tag tag-pink">+{{ item.combo.emotionBonus }} 💖</span>
        </div>
        <div class="combo-scene-tag">
          🎬 {{ item.sceneId }}
        </div>
        <div class="combo-materials">
          <div
            v-for="matId in item.combo.materials"
            :key="matId"
            class="material-badge"
            :style="{ background: getMaterialColor(matId) + '33', borderColor: getMaterialColor(matId) }"
          >
            {{ getMaterialName(matId) }}
          </div>
          <div v-if="!item.combo.materials?.length" class="no-materials">
            暂无素材
          </div>
        </div>
        <div class="combo-desc">
          {{ item.combo.description?.substring(0, 50) || '暂无描述' }}
        </div>
        <div class="combo-footer">
          <span v-if="item.combo.hiddenDialogue" class="tag tag-purple">💬 隐藏对白</span>
          <span v-if="item.combo.environmentChange" class="tag tag-blue">🌤️ 环境变化</span>
          <span v-if="item.combo.sceneFeedback" class="tag tag-green">📝 场景反馈</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const allCombos = computed(() => {
  const result = []
  Object.entries(editorStore.scenes).forEach(([sceneId, scene]) => {
    if (editorStore.selectedSceneId && sceneId !== editorStore.selectedSceneId) return
    ;(scene.materialCombos || []).forEach(combo => {
      result.push({ combo, sceneId })
    })
  })
  return result
})

const getMaterialName = (id) => {
  const m = editorStore.materials.find(x => x.id === id)
  return m?.name || id
}

const getMaterialColor = (id) => {
  const m = editorStore.materials.find(x => x.id === id)
  return m?.color || '#9ca3af'
}

const selectCombo = (item) => {
  editorStore.selectedSceneId = item.sceneId
  editorStore.selectedComboId = item.combo.id
}
</script>

<style scoped>
.m-0 { margin: 0; }
.combos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.combo-card {
  background: white;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.combo-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.combo-card.active {
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.15);
}
.combo-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.combo-icon {
  font-size: 1.2rem;
}
.combo-name {
  flex: 1;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}
.combo-scene-tag {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: monospace;
  background: var(--bg-secondary);
  padding: 3px 8px;
  border-radius: 6px;
  align-self: flex-start;
}
.combo-materials {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 28px;
}
.material-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  border: 1.5px solid;
  font-weight: 500;
}
.no-materials {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
}
.combo-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  flex: 1;
}
.combo-footer {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid var(--border-color-light);
}
</style>
