<template>
  <div class="combos-panel">
    <div class="form-group">
      <label class="form-label">选择场景</label>
      <select
        class="form-select form-input-sm"
        :value="editorStore.selectedSceneId || ''"
        @change="onSceneChange($event.target.value)"
      >
        <option value="">请选择场景</option>
        <optgroup v-for="ch in editorStore.chapters" :key="ch.id" :label="ch.title">
          <option v-for="sid in ch.scenes" :key="sid" :value="sid">
            {{ sid }}
          </option>
        </optgroup>
      </select>
    </div>

    <button
      class="btn btn-primary btn-sm w-full mb-3"
      :disabled="!editorStore.selectedSceneId"
      @click="editorStore.addCombo(editorStore.selectedSceneId)"
    >
      ➕ 新建组合
    </button>

    <div class="panel-list">
      <div
        v-for="combo in sceneCombos"
        :key="combo.id"
        class="sidebar-item"
        :class="{ active: editorStore.selectedComboId === combo.id }"
        @click="editorStore.selectedComboId = combo.id"
      >
        <div class="sidebar-item-icon">✨</div>
        <div class="sidebar-item-content">
          <div class="sidebar-item-title">{{ combo.name }}</div>
          <div class="sidebar-item-subtitle">
            🎨 {{ combo.materials?.length || 0 }} 素材 · 💖 +{{ combo.emotionBonus }}
          </div>
        </div>
        <div class="sidebar-item-actions">
          <button class="icon-btn danger" @click.stop="editorStore.deleteCombo(editorStore.selectedSceneId, combo.id)" title="删除">🗑️</button>
        </div>
      </div>
    </div>

    <div v-if="!editorStore.selectedSceneId" class="empty-state" style="padding: 30px 10px;">
      <div class="empty-state-icon" style="font-size: 2.5rem;">🎬</div>
      <div class="empty-state-text" style="font-size: 0.85rem;">请先选择场景</div>
    </div>
    <div v-else-if="sceneCombos.length === 0" class="empty-state" style="padding: 30px 10px;">
      <div class="empty-state-icon" style="font-size: 2.5rem;">✨</div>
      <div class="empty-state-text" style="font-size: 0.85rem;">该场景暂无组合</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const sceneCombos = computed(() => {
  if (!editorStore.selectedScene) return []
  return editorStore.selectedScene.materialCombos || []
})

const onSceneChange = (val) => {
  editorStore.selectedSceneId = val || null
  editorStore.selectedComboId = null
}
</script>

<style scoped>
.w-full { width: 100%; }
.mb-3 { margin-bottom: 12px; }
.panel-list {
  display: flex;
  flex-direction: column;
}
</style>
