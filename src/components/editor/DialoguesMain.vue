<template>
  <div class="dialogues-main">
    <div class="toolbar">
      <h2 class="m-0">💬 对白管理</h2>
      <div class="toolbar-actions">
        <select
          class="form-select form-input-sm"
          style="width: 240px;"
          :value="editorStore.selectedSceneId || ''"
          @change="onSceneChange($event.target.value)"
        >
          <option value="">请选择场景</option>
          <optgroup v-for="ch in editorStore.chapters" :key="ch.id" :label="ch.title">
            <option v-for="sid in ch.scenes" :key="sid" :value="sid">{{ sid }}</option>
          </optgroup>
        </select>
        <button
          class="btn btn-primary btn-sm"
          :disabled="!editorStore.selectedSceneId"
          @click="editorStore.addDialogue(editorStore.selectedSceneId)"
        >
          ➕ 添加对白
        </button>
      </div>
    </div>

    <div v-if="!editorStore.selectedScene" class="empty-state">
      <div class="empty-state-icon">💬</div>
      <div class="empty-state-text">请先选择一个场景来管理对白</div>
    </div>

    <div v-else class="dialogues-flow">
      <div
        v-for="(d, idx) in editorStore.selectedScene.dialogues"
        :key="d.id"
        class="dialogue-card"
        :class="{ active: editorStore.selectedDialogueIndex === idx }"
        @click="editorStore.selectedDialogueIndex = idx"
      >
        <div class="d-card-header">
          <span class="d-number">{{ idx + 1 }}</span>
          <span class="d-speaker">{{ d.speaker }}</span>
          <div class="d-badges">
            <span v-if="d.isKeyLine" class="tag tag-yellow">关键句</span>
            <span v-if="d.trigger" class="tag tag-pink">{{ getTriggerLabel(d.trigger) }}</span>
            <span class="tag tag-gray">💕 {{ d.emotionChange || 0 }}</span>
          </div>
        </div>
        <div class="d-card-text">
          {{ d.text }}
        </div>
        <div v-if="d.trigger === 'set_environment' && d.environment" class="d-card-env">
          🌤️ {{ getTimeLabel(d.environment.timeOfDay) }} · {{ getWeatherLabel(d.environment.weather) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const onSceneChange = (val) => {
  editorStore.selectedSceneId = val || null
  editorStore.selectedDialogueIndex = null
}

const getTriggerLabel = (t) => ({
  material_required: '需素材',
  chapter_complete: '章节完成',
  game_complete: '游戏完成',
  set_environment: '环境'
}[t] || t)

const getTimeLabel = (t) => ({ day: '白天', dusk: '黄昏', night: '夜晚' }[t] || t)
const getWeatherLabel = (w) => ({ clear: '晴', cloudy: '多云', rain: '雨', snow: '雪', star: '星空' }[w] || w)
</script>

<style scoped>
.m-0 { margin: 0; }
.dialogues-flow {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 700px;
}
.dialogue-card {
  background: white;
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
}
.dialogue-card:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}
.dialogue-card.active {
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.15);
}
.d-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.d-number {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
}
.d-speaker {
  font-weight: 600;
  color: var(--accent-purple);
  font-size: 0.95rem;
}
.d-badges {
  margin-left: auto;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.d-card-text {
  font-size: 0.95rem;
  color: var(--text-primary);
  line-height: 1.7;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border-left: 3px solid var(--accent-purple);
}
.d-card-env {
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
}
</style>
