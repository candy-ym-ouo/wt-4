<template>
  <div class="data-io-panel">
    <div class="panel-header">
      <span class="panel-icon">💾</span>
      <span class="panel-title">数据管理</span>
    </div>

    <div class="io-stats">
      <div class="stat-item">
        <span class="stat-num">{{ editorStore.chapters.length }}</span>
        <span class="stat-label">章节</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ Object.keys(editorStore.scenes).length }}</span>
        <span class="stat-label">场景</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ editorStore.endings.length }}</span>
        <span class="stat-label">结局</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ editorStore.materials.length }}</span>
        <span class="stat-label">素材</span>
      </div>
    </div>

    <div class="io-status" v-if="editorStore.isDirty">
      <span class="status-dot dirty"></span>
      <span>有未保存的更改</span>
    </div>
    <div class="io-status" v-else-if="editorStore.lastSavedAt">
      <span class="status-dot clean"></span>
      <span>上次保存: {{ formatTime(editorStore.lastSavedAt) }}</span>
    </div>
  </div>
</template>

<script setup>
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const formatTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.data-io-panel {
  padding: 4px;
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 4px;
}
.panel-icon {
  font-size: 1.3rem;
}
.panel-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
}
.io-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.stat-item {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}
.stat-num {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-purple);
  line-height: 1;
  margin-bottom: 4px;
}
.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
.io-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.dirty {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
}
.status-dot.clean {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}
</style>
