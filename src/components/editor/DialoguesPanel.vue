<template>
  <div class="dialogues-panel">
    <div class="form-group">
      <label class="form-label">选择场景</label>
      <select
        class="form-select form-input-sm"
        :value="editorStore.selectedSceneId || ''"
        @change="editorStore.selectedSceneId = $event.target.value || null"
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
      @click="editorStore.addDialogue(editorStore.selectedSceneId)"
    >
      ➕ 添加对白
    </button>

    <div v-if="!editorStore.selectedScene" class="empty-state" style="padding: 30px 10px;">
      <div class="empty-state-icon" style="font-size: 2.5rem;">💬</div>
      <div class="empty-state-text" style="font-size: 0.85rem;">请先选择场景</div>
    </div>

    <div v-else class="panel-list">
      <div
        v-for="(d, idx) in sceneDialogues"
        :key="d.id"
        class="sidebar-item"
        :class="{ active: editorStore.selectedDialogueIndex === idx }"
        @click="editorStore.selectedDialogueIndex = idx"
      >
        <div class="sidebar-item-icon">{{ idx + 1 }}</div>
        <div class="sidebar-item-content">
          <div class="sidebar-item-title">
            <span class="speaker-tag">{{ d.speaker }}</span>
          </div>
          <div class="sidebar-item-subtitle">
            {{ d.text?.substring(0, 18) }}
          </div>
        </div>
        <div class="sidebar-item-actions">
          <button class="icon-btn" @click.stop="moveUp(idx)" :disabled="idx === 0" title="上移">↑</button>
          <button class="icon-btn" @click.stop="moveDown(idx)" :disabled="idx === sceneDialogues.length - 1" title="下移">↓</button>
          <button class="icon-btn danger" @click.stop="editorStore.deleteDialogue(editorStore.selectedSceneId, idx)" title="删除">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const sceneDialogues = computed(() => editorStore.selectedScene?.dialogues || [])

const moveUp = (idx) => {
  if (idx > 0) {
    editorStore.moveDialogue(editorStore.selectedSceneId, idx, idx - 1)
  }
}

const moveDown = (idx) => {
  if (idx < sceneDialogues.value.length - 1) {
    editorStore.moveDialogue(editorStore.selectedSceneId, idx, idx + 1)
  }
}
</script>

<style scoped>
.w-full { width: 100%; }
.mb-3 { margin-bottom: 12px; }
.panel-list {
  display: flex;
  flex-direction: column;
}
.speaker-tag {
  font-size: 0.8rem;
  color: var(--accent-purple);
  font-weight: 600;
}
</style>
