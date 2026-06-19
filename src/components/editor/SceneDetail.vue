<template>
  <div class="scene-detail" v-if="scene">
    <div class="form-group">
      <label class="form-label">场景 ID</label>
      <input
        class="form-input form-input-sm"
        :value="scene.id"
        disabled
        style="background: var(--bg-secondary); font-family: monospace;"
      />
    </div>

    <div class="form-group">
      <label class="form-label">背景样式</label>
      <input
        class="form-input"
        :value="scene.background"
        @input="updateField('background', $event.target.value)"
        placeholder="linear-gradient(...) 或 #色值"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">时间</label>
        <select
          class="form-select"
          :value="scene.timeOfDay"
          @change="updateField('timeOfDay', $event.target.value)"
        >
          <option v-for="t in editorStore.timeOfDayOptions" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">天气</label>
        <select
          class="form-select"
          :value="scene.weather"
          @change="updateField('weather', $event.target.value)"
        >
          <option v-for="w in editorStore.weatherOptions" :key="w.id" :value="w.id">
            {{ w.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">下一场景</label>
      <select
        class="form-select form-input-sm"
        :value="scene.nextScene || ''"
        @change="updateField('nextScene', $event.target.value || null)"
      >
        <option value="">无（章节结束）</option>
        <option v-for="sid in chapterSceneIds" :key="sid" :value="sid">
          {{ sid }}
        </option>
      </select>
    </div>

    <div class="form-divider"></div>
    <h4 class="section-title">🎨 素材配置</h4>

    <div class="form-group">
      <label class="form-label">必需素材</label>
      <select
        class="form-select form-input-sm"
        :value="scene.requiredMaterial || ''"
        @change="updateField('requiredMaterial', $event.target.value || null)"
      >
        <option value="">无</option>
        <option v-for="m in editorStore.materials" :key="m.id" :value="m.id">
          {{ m.name }} ({{ m.id }})
        </option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">可选素材</label>
      <div class="material-chips">
        <label
          v-for="m in editorStore.materials"
          :key="'opt-'+m.id"
          class="material-chip"
          :class="{ active: scene.optionalMaterials?.includes(m.id) }"
        >
          <input
            type="checkbox"
            :checked="scene.optionalMaterials?.includes(m.id)"
            @change="toggleOptionalMaterial(m.id)"
            style="display: none;"
          />
          <span class="chip-name">{{ m.name }}</span>
        </label>
      </div>
    </div>

    <div class="form-divider"></div>
    <h4 class="section-title">💬 对白列表</h4>

    <div v-if="!scene.dialogues?.length" class="empty-state" style="padding: 20px;">
      <div class="empty-state-text" style="font-size: 0.85rem;">暂无对白</div>
    </div>

    <div v-else class="dialogue-list">
      <div
        v-for="(d, idx) in scene.dialogues"
        :key="d.id"
        class="dialogue-item"
        :class="{ active: editorStore.selectedDialogueIndex === idx }"
        @click="selectDialogue(idx)"
      >
        <span class="d-idx">{{ idx + 1 }}</span>
        <div class="d-content">
          <span class="d-speaker">{{ d.speaker }}:</span>
          <span class="d-text">{{ d.text?.substring(0, 20) }}</span>
        </div>
        <span v-if="d.trigger" class="tag tag-pink" style="flex-shrink: 0;">
          {{ getTriggerLabel(d.trigger) }}
        </span>
      </div>
    </div>

    <button
      class="btn btn-secondary btn-sm w-full mt-2"
      @click="addDialogue"
    >
      ➕ 添加对白
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const scene = computed(() => editorStore.selectedScene)

const chapterSceneIds = computed(() => {
  const ch = editorStore.chapters.find(c => c.id === scene.value?.chapter)
  return ch?.scenes?.filter(id => id !== scene.value?.id) || []
})

const updateField = (field, value) => {
  editorStore.updateScene(scene.value.id, { [field]: value })
}

const toggleOptionalMaterial = (matId) => {
  const current = scene.value.optionalMaterials || []
  const next = current.includes(matId)
    ? current.filter(id => id !== matId)
    : [...current, matId]
  updateField('optionalMaterials', next)
}

const selectDialogue = (idx) => {
  editorStore.selectedDialogueIndex = idx
  editorStore.activeTab = 'dialogues'
}

const addDialogue = () => {
  editorStore.addDialogue(scene.value.id)
  editorStore.activeTab = 'dialogues'
}

const getTriggerLabel = (trigger) => {
  const map = {
    material_required: '需素材',
    chapter_complete: '章节完成',
    game_complete: '游戏完成',
    set_environment: '环境'
  }
  return map[trigger] || trigger
}
</script>

<style scoped>
.w-full { width: 100%; }
.mt-2 { margin-top: 8px; }
.material-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.material-chip {
  padding: 4px 10px;
  background: var(--bg-secondary);
  border: 1.5px solid var(--border-color);
  border-radius: 16px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}
.material-chip.active {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(244, 114, 182, 0.15));
  border-color: var(--accent-purple);
  color: var(--accent-purple);
  font-weight: 500;
}
.chip-name {
  user-select: none;
}
.dialogue-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  max-height: 240px;
  overflow-y: auto;
}
.dialogue-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1.5px solid transparent;
}
.dialogue-item:hover {
  background: white;
}
.dialogue-item.active {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.1), rgba(244, 114, 182, 0.1));
  border-color: var(--accent-purple);
}
.d-idx {
  width: 20px;
  height: 20px;
  background: var(--bg-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.d-content {
  flex: 1;
  min-width: 0;
  font-size: 0.8rem;
}
.d-speaker {
  color: var(--accent-purple);
  font-weight: 600;
  margin-right: 4px;
}
.d-text {
  color: var(--text-secondary);
}
</style>
