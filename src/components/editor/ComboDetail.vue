<template>
  <div class="combo-detail" v-if="combo">
    <div class="form-group">
      <label class="form-label">组合 ID</label>
      <input
        class="form-input form-input-sm"
        :value="combo.id"
        disabled
        style="background: var(--bg-secondary); font-family: monospace;"
      />
    </div>

    <div class="form-group">
      <label class="form-label">组合名称</label>
      <input
        class="form-input"
        :value="combo.name"
        @input="updateField('name', $event.target.value)"
        placeholder="输入组合名称"
      />
    </div>

    <div class="form-group">
      <label class="form-label">描述</label>
      <textarea
        class="form-textarea"
        rows="3"
        :value="combo.description"
        @input="updateField('description', $event.target.value)"
        placeholder="组合的描述信息..."
      ></textarea>
    </div>

    <div class="form-group">
      <label class="form-label">情绪奖励值</label>
      <input
        type="number"
        class="form-input"
        :value="combo.emotionBonus"
        @input="updateField('emotionBonus', Number($event.target.value) || 0)"
      />
    </div>

    <div class="form-divider"></div>
    <h4 class="section-title">🎨 素材配置</h4>
    <div class="form-hint">选择触发此组合所需的素材</div>

    <div class="material-chips">
      <label
        v-for="m in editorStore.materials"
        :key="'combo-mat-'+m.id"
        class="material-chip"
        :class="{ active: combo.materials?.includes(m.id) }"
      >
        <input
          type="checkbox"
          :checked="combo.materials?.includes(m.id)"
          @change="toggleMaterial(m.id)"
          style="display: none;"
        />
        <span class="chip-color" :style="{ background: m.color }"></span>
        <span class="chip-name">{{ m.name }}</span>
      </label>
    </div>

    <div class="form-divider"></div>
    <h4 class="section-title">⚡ 触发效果</h4>

    <div class="form-group">
      <label class="form-label">场景反馈文字</label>
      <textarea
        class="form-textarea"
        rows="2"
        :value="combo.sceneFeedback || ''"
        @input="updateField('sceneFeedback', $event.target.value || null)"
        placeholder="组合触发时显示的反馈文字（可选）"
      ></textarea>
    </div>

    <div class="form-group">
      <label class="form-label">隐藏对白 ID</label>
      <input
        class="form-input form-input-sm"
        :value="combo.hiddenDialogue || ''"
        @input="updateField('hiddenDialogue', $event.target.value || null)"
        placeholder="对白 ID，触发后显示隐藏对白（可选）"
      />
    </div>

    <div class="form-group">
      <label class="form-label">环境变化</label>
      <div class="env-row">
        <select
          class="form-select form-input-sm"
          :value="combo.environmentChange?.timeOfDay || ''"
          @change="updateEnv('timeOfDay', $event.target.value || null)"
        >
          <option value="">时间不变</option>
          <option v-for="t in editorStore.timeOfDayOptions" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
        <select
          class="form-select form-input-sm"
          :value="combo.environmentChange?.weather || ''"
          @change="updateEnv('weather', $event.target.value || null)"
        >
          <option value="">天气不变</option>
          <option v-for="w in editorStore.weatherOptions" :key="w.id" :value="w.id">
            {{ w.name }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const combo = computed(() => editorStore.selectedCombo)

const updateField = (field, value) => {
  if (!editorStore.selectedSceneId || !combo.value) return
  editorStore.updateCombo(editorStore.selectedSceneId, combo.value.id, { [field]: value })
}

const toggleMaterial = (matId) => {
  if (!editorStore.selectedSceneId || !combo.value) return
  const current = combo.value.materials || []
  const next = current.includes(matId)
    ? current.filter(id => id !== matId)
    : [...current, matId]
  updateField('materials', next)
}

const updateEnv = (field, value) => {
  if (!editorStore.selectedSceneId || !combo.value) return
  const current = combo.value.environmentChange || {}
  const next = { ...current }
  if (value) {
    next[field] = value
  } else {
    delete next[field]
  }
  if (Object.keys(next).length === 0) {
    updateField('environmentChange', null)
  } else {
    updateField('environmentChange', next)
  }
}
</script>

<style scoped>
.material-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.material-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--bg-secondary);
  border: 1.5px solid var(--border-color);
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}
.material-chip.active {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(244, 114, 182, 0.15));
  border-color: var(--accent-purple);
  color: var(--accent-purple);
  font-weight: 500;
}
.chip-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.chip-name {
  user-select: none;
}
.env-row {
  display: flex;
  gap: 8px;
}
.env-row > * {
  flex: 1;
}
</style>
