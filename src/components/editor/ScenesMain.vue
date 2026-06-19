<template>
  <div class="scenes-main">
    <div class="toolbar">
      <h2 class="m-0">🎬 场景管理</h2>
      <div class="toolbar-actions">
        <select
          class="form-select form-input-sm"
          style="width: 200px;"
          :value="editorStore.selectedChapterId || ''"
          @change="editorStore.selectedChapterId = $event.target.value || null"
        >
          <option value="">全部章节</option>
          <option v-for="ch in editorStore.chapters" :key="ch.id" :value="ch.id">
            {{ ch.title }}
          </option>
        </select>
        <button
          class="btn btn-primary btn-sm"
          :disabled="!editorStore.selectedChapterId"
          @click="editorStore.addScene(editorStore.selectedChapterId)"
        >
          ➕ 新建场景
        </button>
      </div>
    </div>

    <div v-if="filteredScenes.length === 0" class="empty-state">
      <div class="empty-state-icon">🎬</div>
      <div class="empty-state-text">
        {{ editorStore.selectedChapterId ? '该章节还没有场景' : '请先选择一个章节' }}
      </div>
    </div>

    <div v-else class="scenes-flow">
      <div
        v-for="(scene, idx) in filteredScenes"
        :key="scene.id"
        class="scene-card"
        :class="{ active: editorStore.selectedSceneId === scene.id }"
        @click="editorStore.selectedSceneId = scene.id"
      >
        <div class="scene-flow">
          <div class="scene-card-header">
            <span class="scene-index">{{ idx + 1 }}</span>
            <span class="scene-id">{{ scene.id }}</span>
            <div class="scene-tags">
              <span class="tag tag-purple">{{ getTimeLabel(scene.timeOfDay) }}</span>
              <span class="tag tag-blue">{{ getWeatherLabel(scene.weather) }}</span>
            </div>
          </div>
          <div class="scene-preview" :style="{ background: scene.background }">
            <div class="scene-preview-text">
              {{ scene.dialogues?.[0]?.text?.substring(0, 40) || '...' }}
            </div>
          </div>
          <div class="scene-card-footer">
            <span>💬 {{ scene.dialogues?.length || 0 }} 对白</span>
            <span>✨ {{ scene.materialCombos?.length || 0 }} 组合</span>
            <span v-if="scene.requiredMaterial">🎨 1素材</span>
          </div>
          <div v-if="scene.nextScene" class="scene-arrow">
            → {{ scene.nextScene }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const filteredScenes = computed(() => {
  if (editorStore.selectedChapterId) {
    const chapter = editorStore.chapters.find(c => c.id === editorStore.selectedChapterId)
    if (chapter) {
      return chapter.scenes.map(id => editorStore.scenes[id]).filter(Boolean)
    }
  }
  return Object.values(editorStore.scenes)
})

const getTimeLabel = (t) => ({ day: '☀️ 白天', dusk: '🌅 黄昏', night: '🌙 夜晚' }[t] || t)
const getWeatherLabel = (w) => ({ clear: '晴', cloudy: '多云', rain: '雨', snow: '雪', star: '星空' }[w] || w)
</script>

<style scoped>
.m-0 { margin: 0; }
.scenes-flow {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.scene-card {
  background: white;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
  overflow: hidden;
}
.scene-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.scene-card.active {
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.15);
}
.scene-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color-light);
}
.scene-index {
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}
.scene-id {
  flex: 1;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-primary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.scene-tags {
  display: flex;
  gap: 4px;
}
.tag-blue {
  background: #dbeafe;
  color: #1d4ed8;
}
.scene-preview {
  height: 80px;
  display: flex;
  align-items: flex-end;
  padding: 12px 14px;
}
.scene-preview-text {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.8rem;
  font-style: italic;
}
.scene-card-footer {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-secondary);
  font-size: 0.75rem;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-color-light);
}
.scene-arrow {
  padding: 8px 14px;
  font-size: 0.75rem;
  color: var(--accent-purple);
  font-family: monospace;
  border-top: 1px dashed var(--border-color-light);
  background: #faf5ff;
}
</style>
