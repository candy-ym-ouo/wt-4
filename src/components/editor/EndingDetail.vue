<template>
  <div class="ending-detail" v-if="ending">
    <div class="form-group">
      <label class="form-label">结局 ID</label>
      <input
        class="form-input form-input-sm"
        :value="ending.id"
        disabled
        style="background: var(--bg-secondary); font-family: monospace;"
      />
    </div>

    <div class="form-group">
      <label class="form-label">结局标题</label>
      <input
        class="form-input"
        :value="ending.title"
        @input="updateField('title', $event.target.value)"
        placeholder="输入结局标题"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">结局类型</label>
        <select
          class="form-select"
          :value="ending.type"
          @change="updateField('type', $event.target.value)"
        >
          <option value="normal">📖 普通结局</option>
          <option value="good">🌸 好结局</option>
          <option value="special">✨ 特殊结局</option>
          <option value="perfect_path">🏆 完美结局</option>
          <option value="true">💎 真结局</option>
          <option value="dialogue_master">💬 对白大师</option>
          <option value="time_sequence">⏰ 时序结局</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">最低情绪值</label>
        <input
          type="number"
          class="form-input"
          :value="ending.minEmotion"
          @input="updateField('minEmotion', Number($event.target.value) || 0)"
        />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">描述</label>
      <textarea
        class="form-textarea"
        rows="2"
        :value="ending.description"
        @input="updateField('description', $event.target.value)"
        placeholder="结局的简短描述..."
      ></textarea>
    </div>

    <div class="form-group">
      <label class="form-label">结局内容</label>
      <textarea
        class="form-textarea"
        rows="6"
        :value="ending.content"
        @input="updateField('content', $event.target.value)"
        placeholder="结局的详细内容..."
        style="font-family: var(--font-serif); line-height: 1.8;"
      ></textarea>
    </div>

    <div class="form-group">
      <label class="form-label">背景样式</label>
      <input
        class="form-input"
        :value="ending.background"
        @input="updateField('background', $event.target.value)"
        placeholder="linear-gradient(...) 或 #色值"
      />
      <div class="preview-bg" :style="{ background: ending.background }"></div>
    </div>

    <div class="form-divider"></div>
    <h4 class="section-title">🎯 触发条件</h4>

    <div class="form-group">
      <label class="form-label">
        <input
          type="checkbox"
          :checked="!!ending.triggerConditions?.allOfTheAbove"
          @change="toggleCondition('allOfTheAbove', $event.target.checked)"
        />
        需要全部满足以下条件
      </label>
    </div>

    <div class="condition-list">
      <div class="condition-item">
        <label class="condition-label">
          <input
            type="checkbox"
            :checked="ending.triggerConditions?.allChaptersCompleted"
            @change="toggleCondition('allChaptersCompleted', $event.target.checked)"
          />
          所有章节完成
        </label>
      </div>

      <div class="condition-item">
        <label class="condition-label">
          <input
            type="checkbox"
            :checked="ending.triggerConditions?.allChaptersPerfect"
            @change="toggleCondition('allChaptersPerfect', $event.target.checked)"
          />
          所有章节完美完成
        </label>
      </div>

      <div class="condition-item">
        <label class="condition-label">
          <input
            type="checkbox"
            :checked="ending.triggerConditions?.allCombosTriggered"
            @change="toggleCondition('allCombosTriggered', $event.target.checked)"
          />
          所有组合已触发
        </label>
      </div>

      <div class="condition-item">
        <label class="condition-label">
          <input
            type="checkbox"
            :checked="ending.triggerConditions?.allHiddenDialogues"
            @change="toggleCondition('allHiddenDialogues', $event.target.checked)"
          />
          所有隐藏对白已发现
        </label>
      </div>

      <div class="condition-item">
        <label class="condition-label">
          <input
            type="checkbox"
            :checked="ending.triggerConditions?.seasonComboTriggered"
            @change="toggleCondition('seasonComboTriggered', $event.target.checked)"
          />
          四季组合已触发
        </label>
      </div>

      <div class="condition-item">
        <label class="condition-label">
          <input
            type="checkbox"
            :checked="ending.triggerConditions?.keyLinesFound"
            @change="toggleCondition('keyLinesFound', $event.target.checked)"
          />
          关键台词已发现
        </label>
      </div>

      <div class="condition-item">
        <label class="condition-label">
          <input
            type="checkbox"
            :checked="ending.triggerConditions?.orderStrict"
            @change="toggleCondition('orderStrict', $event.target.checked)"
          />
          素材顺序严格模式
        </label>
      </div>
    </div>

    <div class="form-divider-small"></div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">情绪值阈值</label>
        <input
          type="number"
          class="form-input form-input-sm"
          :value="ending.triggerConditions?.emotionValue ?? ''"
          @input="setNumCondition('emotionValue', $event.target.value)"
          placeholder="留空则不设置"
        />
      </div>
      <div class="form-group">
        <label class="form-label">最低分数</label>
        <input
          type="number"
          class="form-input form-input-sm"
          :value="ending.triggerConditions?.minFinalScore ?? ''"
          @input="setNumCondition('minFinalScore', $event.target.value)"
          placeholder="留空则不设置"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">最低完美率</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          class="form-input form-input-sm"
          :value="ending.triggerConditions?.minPerfectRate ?? ''"
          @input="setNumCondition('minPerfectRate', $event.target.value)"
          placeholder="0-1，留空则不设置"
        />
      </div>
      <div class="form-group">
        <label class="form-label">最少章节数</label>
        <input
          type="number"
          class="form-input form-input-sm"
          :value="ending.triggerConditions?.minCompletedChapterCount ?? ''"
          @input="setNumCondition('minCompletedChapterCount', $event.target.value)"
          placeholder="留空则不设置"
        />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">素材顺序（逗号分隔ID）</label>
      <input
        class="form-input form-input-sm"
        :value="ending.triggerConditions?.materialOrder?.join(', ') || ''"
        @input="setOrderCondition($event.target.value)"
        placeholder="例如: flower, sun, leaf, snowflake"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const ending = computed(() => editorStore.selectedEnding)

const updateField = (field, value) => {
  if (!ending.value) return
  editorStore.updateEnding(ending.value.id, { [field]: value })
}

const getConditions = () => {
  if (!ending.value) return {}
  return ending.value.triggerConditions || {}
}

const setConditions = (next) => {
  if (!ending.value) return
  editorStore.updateEnding(ending.value.id, { triggerConditions: next })
}

const toggleCondition = (key, enabled) => {
  const current = getConditions()
  const next = { ...current }
  if (enabled) {
    next[key] = true
  } else {
    delete next[key]
  }
  setConditions(next)
}

const setNumCondition = (key, rawVal) => {
  const current = getConditions()
  const next = { ...current }
  if (rawVal === '' || rawVal === null || rawVal === undefined) {
    delete next[key]
  } else {
    next[key] = Number(rawVal)
  }
  setConditions(next)
}

const setOrderCondition = (rawVal) => {
  const current = getConditions()
  const next = { ...current }
  const arr = rawVal.split(',').map(s => s.trim()).filter(Boolean)
  if (arr.length > 0) {
    next.materialOrder = arr
  } else {
    delete next.materialOrder
  }
  setConditions(next)
}
</script>

<style scoped>
.preview-bg {
  margin-top: 8px;
  height: 60px;
  border-radius: 10px;
  border: 1.5px solid var(--border-color);
}
.condition-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.condition-item {
  padding: 8px 10px;
  background: var(--bg-secondary);
  border-radius: 8px;
}
.condition-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-primary);
  cursor: pointer;
}
.condition-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-purple);
}
.form-divider-small {
  height: 1px;
  background: var(--border-color-light);
  margin: 12px 0;
}
</style>
