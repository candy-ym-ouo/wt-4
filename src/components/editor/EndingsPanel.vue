<template>
  <div class="endings-panel">
    <button
      class="btn btn-primary btn-sm w-full mb-3"
      @click="editorStore.addEnding()"
    >
      ➕ 新建结局
    </button>

    <div class="panel-list">
      <div
        v-for="ending in editorStore.endings"
        :key="ending.id"
        class="sidebar-item"
        :class="{ active: editorStore.selectedEndingId === ending.id }"
        @click="editorStore.selectedEndingId = ending.id"
      >
        <div class="sidebar-item-icon">{{ getTypeIcon(ending.type) }}</div>
        <div class="sidebar-item-content">
          <div class="sidebar-item-title">{{ ending.title }}</div>
          <div class="sidebar-item-subtitle">
            {{ getTypeLabel(ending.type) }} · 💖 {{ ending.minEmotion }}
          </div>
        </div>
        <div class="sidebar-item-actions">
          <button class="icon-btn danger" @click.stop="editorStore.deleteEnding(ending.id)" title="删除">🗑️</button>
        </div>
      </div>
    </div>

    <div v-if="editorStore.endings.length === 0" class="empty-state" style="padding: 30px 10px;">
      <div class="empty-state-icon" style="font-size: 2.5rem;">🌟</div>
      <div class="empty-state-text" style="font-size: 0.85rem;">暂无结局</div>
    </div>
  </div>
</template>

<script setup>
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const getTypeIcon = (type) => {
  const map = {
    true: '💎',
    perfect_path: '🏆',
    dialogue_master: '💬',
    time_sequence: '⏰',
    special: '✨',
    good: '🌸',
    normal: '📖'
  }
  return map[type] || '🌟'
}

const getTypeLabel = (type) => {
  const map = {
    true: '真结局',
    perfect_path: '完美结局',
    dialogue_master: '对白大师',
    time_sequence: '时序结局',
    special: '特殊结局',
    good: '好结局',
    normal: '普通结局'
  }
  return map[type] || type
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
