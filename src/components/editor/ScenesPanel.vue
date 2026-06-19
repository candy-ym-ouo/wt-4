<template>
  <div class="scenes-panel">
    <div class="form-group">
      <label class="form-label">选择章节</label>
      <select
        class="form-select form-input-sm"
        :value="editorStore.selectedChapterId || ''"
        @change="onChapterChange($event.target.value)"
      >
        <option value="">全部章节</option>
        <option v-for="ch in editorStore.chapters" :key="ch.id" :value="ch.id">
          {{ ch.title }}
        </option>
      </select>
    </div>

    <button
      class="btn btn-primary btn-sm w-full mb-3"
      :disabled="!editorStore.selectedChapterId"
      @click="editorStore.addScene(editorStore.selectedChapterId)"
    >
      ➕ 新建场景
    </button>

    <div class="panel-list">
      <div
        v-for="scene in filteredScenes"
        :key="scene.id"
        class="sidebar-item"
        :class="{ active: editorStore.selectedSceneId === scene.id }"
        @click="selectScene(scene.id)"
      >
        <div class="sidebar-item-icon">🎬</div>
        <div class="sidebar-item-content">
          <div class="sidebar-item-title">{{ scene.id }}</div>
          <div class="sidebar-item-subtitle">
            💬 {{ scene.dialogues?.length || 0 }} ·
            🌤️ {{ getTimeOfDayLabel(scene.timeOfDay) }}/{{ getWeatherLabel(scene.weather) }}
          </div>
        </div>
        <div class="sidebar-item-actions">
          <button class="icon-btn danger" @click.stop="editorStore.deleteScene(scene.id)" title="删除">🗑️</button>
        </div>
      </div>
    </div>

    <div v-if="filteredScenes.length === 0" class="empty-state" style="padding: 30px 10px;">
      <div class="empty-state-icon" style="font-size: 2.5rem;">🎬</div>
      <div class="empty-state-text" style="font-size: 0.85rem;">
        {{ editorStore.selectedChapterId ? '该章节暂无场景' : '请先选择章节' }}
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
    return Object.values(editorStore.scenes).filter(s => s.chapter === editorStore.selectedChapterId)
  }
  return Object.values(editorStore.scenes)
})

const onChapterChange = (val) => {
  editorStore.selectedChapterId = val || null
  editorStore.selectedSceneId = null
}

const selectScene = (sceneId) => {
  const scene = editorStore.scenes[sceneId]
  if (scene) {
    editorStore.selectedChapterId = scene.chapter
  }
  editorStore.selectedSceneId = sceneId
  editorStore.selectedDialogueIndex = null
}

const getTimeOfDayLabel = (t) => {
  const map = { day: '白天', dusk: '黄昏', night: '夜晚' }
  return map[t] || t
}

const getWeatherLabel = (w) => {
  const map = { clear: '晴', cloudy: '云', rain: '雨', snow: '雪', star: '星' }
  return map[w] || w
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
