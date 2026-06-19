<template>
  <div class="chapter-detail" v-if="chapter">
    <div class="form-group">
      <label class="form-label">章节标题</label>
      <input
        class="form-input"
        :value="chapter.title"
        @input="updateField('title', $event.target.value)"
      />
    </div>

    <div class="form-group">
      <label class="form-label">副标题</label>
      <input
        class="form-input"
        :value="chapter.subtitle"
        @input="updateField('subtitle', $event.target.value)"
      />
    </div>

    <div class="form-group">
      <label class="form-label">章节描述</label>
      <textarea
        class="form-textarea"
        :value="chapter.description"
        @input="updateField('description', $event.target.value)"
        rows="3"
      ></textarea>
    </div>

    <div class="form-group">
      <label class="form-label">章节预告</label>
      <input
        class="form-input"
        :value="chapter.teaser"
        @input="updateField('teaser', $event.target.value)"
      />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">背景色</label>
        <input
          type="color"
        class="form-input"
        :value="chapter.background"
        @input="updateField('background', $event.target.value)"
        style="height: 40px; padding: 4px;"
      />
    </div>
      <div class="form-group">
        <label class="form-label">情绪目标</label>
        <input
          type="number"
          class="form-input"
          :value="chapter.emotionTarget"
          @input="updateField('emotionTarget', Number($event.target.value))"
        />
      </div>
    </div>

    <div class="form-row">
      <label class="form-checkbox">
        <input type="checkbox" :checked="chapter.unlocked" @change="updateField('unlocked', $event.target.checked)" />
        <span>默认解锁</span>
      </label>
      <label class="form-checkbox">
        <input type="checkbox" :checked="chapter.hidden" @change="updateField('hidden', $event.target.checked)" />
        <span>隐藏章节</span>
      </label>
    </div>

    <div v-if="chapter.hidden" class="form-group">
      <label class="form-label">隐藏提示</label>
      <input
        class="form-input"
        :value="chapter.hiddenHint || ''"
        @input="updateField('hiddenHint', $event.target.value)"
        placeholder="显示在章节选择界面的提示文字"
      />
    </div>

    <div class="form-divider"></div>
    <h4 class="section-title">🔓 解锁条件</h4>

    <div v-if="!chapter.unlockConditions?.length" class="empty-state" style="padding: 20px;">
      <div class="empty-state-text" style="font-size: 0.85rem;">暂无解锁条件</div>
    </div>

    <div v-else class="conditions-list">
      <div v-for="(cond, idx) in chapter.unlockConditions" :key="idx" class="condition-item">
        <div class="condition-row">
          <select
            class="form-select form-input-sm"
            :value="cond.type"
            @change="updateCondition(idx, 'type', $event.target.value)"
          >
            <option v-for="t in editorStore.unlockConditionTypes" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
          <button class="icon-btn danger" @click="editorStore.deleteUnlockCondition(chapter.id, idx)">🗑️</button>
        </div>
        <div class="condition-fields">
          <div v-if="getConditionType(cond.type)?.needsTarget" class="form-group" style="margin-top: 8px;">
            <label class="form-label">目标章节</label>
            <select
              class="form-select form-input-sm"
              :value="cond.target"
              @change="updateCondition(idx, 'target', $event.target.value)"
            >
              <option value="">选择章节</option>
              <option v-for="ch in otherChapters" :key="ch.id" :value="ch.id">{{ ch.title }}</option>
            </select>
          </div>
          <div v-if="getConditionType(cond.type)?.needsValue" class="form-group">
            <label class="form-label">数值</label>
            <input
              type="number"
              class="form-input form-input-sm"
              :value="cond.value"
              @change="updateCondition(idx, 'value', Number($event.target.value))"
            />
          </div>
          <div v-if="getConditionType(cond.type)?.needsMinCount" class="form-group">
            <label class="form-label">最小数量</label>
            <input
              type="number"
              class="form-input form-input-sm"
              :value="cond.minCount"
              @change="updateCondition(idx, 'minCount', Number($event.target.value))"
            />
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <input
              class="form-input form-input-sm"
              :value="cond.description"
              @input="updateCondition(idx, 'description', $event.target.value)"
              placeholder="条件描述文字"
            />
          </div>
        </div>
      </div>
    </div>

    <button class="btn btn-secondary btn-sm w-full mt-2" @click="editorStore.addUnlockCondition(chapter.id)">
      ➕ 添加解锁条件
    </button>

    <div class="form-divider"></div>
    <h4 class="section-title">🎬 关联场景</h4>
    <div v-if="!chapter.scenes?.length" class="empty-state" style="padding: 20px;">
      <div class="empty-state-text" style="font-size: 0.85rem;">暂无场景，去场景标签页添加</div>
    </div>
    <div v-else class="scenes-preview">
      <div v-for="(sceneId, i) in chapter.scenes" :key="sceneId" class="scene-preview-item">
        <span class="scene-idx">{{ i + 1 }}</span>
        <span class="scene-name">{{ getScene(sceneId)?.id || sceneId }}</span>
        <span class="scene-dialogue-count">
          💬 {{ getScene(sceneId)?.dialogues?.length || 0 }}
        </span>
      </div>
    </div>
    <button
      class="btn btn-secondary btn-sm w-full mt-2"
      @click="addSceneToChapter"
    >
      ➕ 添加场景
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const chapter = computed({
  get() { return editorStore.selectedChapter }
})

const otherChapters = computed(() => {
  return editorStore.chapters.filter(c => c.id !== chapter.value?.id)
})

const updateField = (field, value) => {
  editorStore.updateChapter(chapter.value.id, { [field]: value })
}

const updateCondition = (index, field, value) => {
  editorStore.updateUnlockCondition(chapter.value.id, index, { [field]: value })
}

const getConditionType = (typeId) => {
  return editorStore.unlockConditionTypes.find(t => t.id === typeId)
}

const getScene = (sceneId) => editorStore.scenes[sceneId] || null

const addSceneToChapter = () => {
  editorStore.addScene(chapter.value.id)
  editorStore.activeTab = 'scenes'
}
</script>

<style scoped>
.w-full {
  width: 100%;
}
.mt-2 {
  margin-top: 8px;
}
.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}
.condition-item {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid var(--border-color-light);
}
.condition-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.condition-row .form-select {
  flex: 1;
}
.condition-fields {
  margin-top: 4px;
}
.scenes-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.scene-preview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  font-size: 0.85rem;
}
.scene-idx {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}
.scene-name {
  flex: 1;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-primary);
}
.scene-dialogue-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
</style>
