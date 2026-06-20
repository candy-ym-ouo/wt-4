<template>
  <div class="warning-panel">
    <div class="warning-header">
      <div class="warning-title-row">
        <h3 class="warning-title">🚨 剧情分支预警</h3>
        <button class="icon-btn" @click="$emit('close')" title="关闭">✕</button>
      </div>
      <div class="warning-meta">
        <span v-if="warningStore.lastValidatedAt" class="validated-time">
          上次校验: {{ formatTime(warningStore.lastValidatedAt) }}
        </span>
        <button class="btn btn-sm btn-secondary" @click="handleValidate" :disabled="warningStore.isValidating">
          {{ warningStore.isValidating ? '校验中...' : '🔄 重新校验' }}
        </button>
      </div>
    </div>

    <div class="warning-summary">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="summary-card"
        :class="{ active: warningStore.activeCategoryFilter === cat.id }"
        @click="toggleCategoryFilter(cat.id)"
      >
        <span class="summary-icon">{{ cat.meta.icon }}</span>
        <span class="summary-label">{{ cat.meta.label }}</span>
        <span class="summary-count" :style="{ background: cat.meta.color }">{{ cat.count }}</span>
      </div>
    </div>

    <div class="warning-severity-bar">
      <button
        class="severity-btn"
        :class="{ active: warningStore.activeSeverityFilter === 'all' }"
        @click="warningStore.setFilter(undefined, 'all')"
      >
        全部 {{ warningStore.totalCount }}
      </button>
      <button
        class="severity-btn severity-error"
        :class="{ active: warningStore.activeSeverityFilter === 'error' }"
        @click="warningStore.setFilter(undefined, 'error')"
      >
        ❌ 错误 {{ warningStore.errorCount }}
      </button>
      <button
        class="severity-btn severity-warning"
        :class="{ active: warningStore.activeSeverityFilter === 'warning' }"
        @click="warningStore.setFilter(undefined, 'warning')"
      >
        ⚠️ 警告 {{ warningStore.warningCount }}
      </button>
      <button
        class="severity-btn severity-info"
        :class="{ active: warningStore.activeSeverityFilter === 'info' }"
        @click="warningStore.setFilter(undefined, 'info')"
      >
        ℹ️ 提示 {{ warningStore.infoCount }}
      </button>
    </div>

    <div class="warning-list" v-if="warningStore.filteredWarnings.length > 0">
      <div
        v-for="(w, i) in warningStore.filteredWarnings"
        :key="i"
        class="warning-item"
        :class="'severity-' + w.severity"
        @click="handleWarningClick(w)"
      >
        <div class="warning-item-header">
          <span class="warning-item-severity">
            {{ w.severity === 'error' ? '❌' : w.severity === 'warning' ? '⚠️' : 'ℹ️' }}
          </span>
          <span class="warning-item-code">{{ w.code }}</span>
          <span class="warning-item-category" :style="{ color: getCategoryMeta(w.category).color }">
            {{ getCategoryMeta(w.category).icon }} {{ getCategoryMeta(w.category).label }}
          </span>
        </div>
        <div class="warning-item-message">{{ w.message }}</div>
        <div class="warning-item-footer" v-if="w.targetId || w.targetField">
          <span v-if="w.targetId" class="warning-target-id">ID: {{ w.targetId }}</span>
          <span v-if="w.targetField" class="warning-target-field">字段: {{ w.targetField }}</span>
        </div>
      </div>
    </div>

    <div v-else class="warning-empty">
      <div class="warning-empty-icon">✅</div>
      <div class="warning-empty-text">
        {{ warningStore.totalCount === 0 ? '未发现数据问题，所有校验通过！' : '当前筛选条件下无匹配项' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWarningStore } from '../stores/warningStore'
import { useEditorStore } from '../stores/editorStore'

const emit = defineEmits(['close', 'navigate'])

const warningStore = useWarningStore()
const editorStore = useEditorStore()

const categories = computed(() => {
  const cats = []
  for (const [id, meta] of Object.entries(warningStore.CATEGORY_META)) {
    cats.push({
      id,
      meta,
      count: warningStore.categoryCounts[id] || 0
    })
  }
  return cats
})

function getCategoryMeta(category) {
  return warningStore.CATEGORY_META[category] || { label: '未知', icon: '❓', color: '#6b7280' }
}

function toggleCategoryFilter(categoryId) {
  warningStore.setFilter(
    warningStore.activeCategoryFilter === categoryId ? 'all' : categoryId,
    undefined
  )
}

function formatTime(date) {
  if (!date) return ''
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function handleValidate() {
  warningStore.runFullValidation(
    editorStore.chapters,
    editorStore.scenes,
    editorStore.endings,
    editorStore.materials
  )
}

function handleWarningClick(w) {
  if (w.category === warningStore.CATEGORY.BROKEN_CHAIN || w.category === warningStore.CATEGORY.MISSING_DIALOGUE || w.category === warningStore.CATEGORY.UNCONFIGURED_ASSET) {
    const sceneId = w.targetId
    if (editorStore.scenes[sceneId]) {
      editorStore.selectedSceneId = sceneId
      emit('navigate', 'scenes', sceneId)
    }
  } else if (w.category === warningStore.CATEGORY.UNREACHABLE_ENDING) {
    const ending = editorStore.endings.find(e => e.id === w.targetId)
    if (ending) {
      editorStore.selectedEndingId = ending.id
      emit('navigate', 'endings', ending.id)
    }
  }
}
</script>

<style scoped>
.warning-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.warning-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.warning-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.warning-title {
  margin: 0;
  font-size: 1.05rem;
  background: linear-gradient(135deg, #ef4444, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.warning-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.validated-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.warning-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.summary-card:hover {
  border-color: var(--border-color);
  transform: translateY(-1px);
}

.summary-card.active {
  border-color: var(--accent-purple);
  background: rgba(167, 139, 250, 0.08);
}

.summary-icon {
  font-size: 1.1rem;
}

.summary-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.summary-count {
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
}

.warning-severity-bar {
  display: flex;
  gap: 6px;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border-color);
  overflow-x: auto;
}

.severity-btn {
  padding: 5px 12px;
  border-radius: 16px;
  border: 1.5px solid var(--border-color);
  background: white;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  color: var(--text-secondary);
}

.severity-btn:hover {
  border-color: var(--accent-purple);
}

.severity-btn.active {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  border-color: transparent;
}

.severity-error.active {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.severity-warning.active {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.severity-info.active {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
}

.warning-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
}

.warning-item {
  padding: 12px 14px;
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s;
  border-left: 4px solid transparent;
}

.warning-item:hover {
  transform: translateX(2px);
}

.warning-item.severity-error {
  background: #fef2f2;
  border-left-color: #ef4444;
}

.warning-item.severity-warning {
  background: #fffbeb;
  border-left-color: #f59e0b;
}

.warning-item.severity-info {
  background: #eff6ff;
  border-left-color: #3b82f6;
}

.warning-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.warning-item-severity {
  font-size: 0.85rem;
}

.warning-item-code {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-secondary);
  font-family: monospace;
}

.warning-item-category {
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: auto;
}

.warning-item-message {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-primary);
}

.warning-item-footer {
  display: flex;
  gap: 12px;
  margin-top: 6px;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.warning-target-id,
.warning-target-field {
  padding: 1px 6px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  font-family: monospace;
}

.warning-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.warning-empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

.warning-empty-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
}
</style>
