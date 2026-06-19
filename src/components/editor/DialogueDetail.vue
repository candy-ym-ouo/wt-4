<template>
  <div class="dialogue-detail" v-if="dialogue && scene">
    <div class="form-group">
      <label class="form-label">说话人</label>
      <input
        class="form-input"
        :value="dialogue.speaker"
        @input="updateField('speaker', $event.target.value)"
        placeholder="旁白、你、回忆、内心..."
      />
    </div>

    <div class="form-group">
      <label class="form-label">对白内容</label>
      <textarea
        class="form-textarea"
        :value="dialogue.text"
        @input="updateField('text', $event.target.value)"
        rows="4"
      ></textarea>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">情绪变化</label>
        <input
          type="number"
          class="form-input"
          :value="dialogue.emotionChange"
          @input="updateField('emotionChange', Number($event.target.value))"
        />
      </div>
      <div class="form-group" style="display: flex; align-items: flex-end;">
        <label class="form-checkbox">
          <input
            type="checkbox"
            :checked="dialogue.isKeyLine"
            @change="updateField('isKeyLine', $event.target.checked)"
          />
          <span>关键对白</span>
        </label>
      </div>
    </div>

    <div class="form-divider"></div>
    <h4 class="section-title">⚡ 触发效果</h4>

    <div class="form-group">
      <label class="form-label">触发类型</label>
      <select
        class="form-select"
        :value="dialogue.trigger || ''"
        @change="onTriggerChange($event.target.value)"
      >
        <option v-for="t in editorStore.dialogueTriggerTypes" :key="String(t.id)" :value="t.id || ''">
          {{ t.name }}
        </option>
      </select>
    </div>

    <div v-if="dialogue.trigger === 'set_environment'" class="env-config">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">时间</label>
          <select
            class="form-select form-input-sm"
            :value="dialogue.environment?.timeOfDay || 'day'"
            @change="updateEnv('timeOfDay', $event.target.value)"
          >
            <option v-for="t in editorStore.timeOfDayOptions" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">天气</label>
          <select
            class="form-select form-input-sm"
            :value="dialogue.environment?.weather || 'clear'"
            @change="updateEnv('weather', $event.target.value)"
          >
            <option v-for="w in editorStore.weatherOptions" :key="w.id" :value="w.id">
              {{ w.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="dialogue.trigger === 'material_required'" class="info-box">
      💡 触发时会要求玩家放置当前场景的「必需素材」
    </div>
    <div v-else-if="dialogue.trigger === 'chapter_complete'" class="info-box">
      💡 触发时会标记当前章节完成
    </div>
    <div v-else-if="dialogue.trigger === 'game_complete'" class="info-box">
      💡 触发时会结束游戏并计算结局
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const dialogue = computed(() => editorStore.selectedDialogue)
const scene = computed(() => editorStore.selectedScene)

const updateField = (field, value) => {
  editorStore.updateDialogue(scene.value.id, editorStore.selectedDialogueIndex, { [field]: value })
}

const onTriggerChange = (val) => {
  const trigger = val || null
  const updates = { trigger }
  if (trigger === 'set_environment' && !dialogue.value.environment) {
    updates.environment = { timeOfDay: 'day', weather: 'clear' }
  } else if (trigger !== 'set_environment') {
    updates.environment = undefined
  }
  editorStore.updateDialogue(scene.value.id, editorStore.selectedDialogueIndex, updates)
}

const updateEnv = (field, value) => {
  const env = dialogue.value.environment || { timeOfDay: 'day', weather: 'clear' }
  updateField('environment', { ...env, [field]: value })
}
</script>

<style scoped>
.env-config {
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 10px;
  margin-top: 8px;
}
.info-box {
  margin-top: 8px;
  padding: 10px 12px;
  background: #fef9c3;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #854d0e;
}
</style>
