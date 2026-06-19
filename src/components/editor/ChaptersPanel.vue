<template>
  <div class="chapters-panel">
    <button class="btn btn-primary btn-sm w-full mb-3" @click="editorStore.addChapter">
      ➕ 新建章节
    </button>
    <div class="panel-list">
      <div
        v-for="chapter in editorStore.chapters"
        :key="chapter.id"
        class="sidebar-item"
        :class="{ active: editorStore.selectedChapterId === chapter.id }"
        @click="editorStore.selectedChapterId = chapter.id"
      >
        <div class="sidebar-item-icon">📖</div>
        <div class="sidebar-item-content">
          <div class="sidebar-item-title">{{ chapter.title }}</div>
          <div class="sidebar-item-subtitle">{{ chapter.scenes?.length || 0 }} 个场景</div>
        </div>
        <div class="sidebar-item-actions">
          <button class="icon-btn" @click.stop="editorStore.duplicateChapter(chapter.id)" title="复制">📋</button>
          <button class="icon-btn danger" @click.stop="editorStore.deleteChapter(chapter.id)" title="删除">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useEditorStore } from '../../stores/editorStore'
const editorStore = useEditorStore()
</script>

<style scoped>
.w-full {
  width: 100%;
}
.mb-3 {
  margin-bottom: 12px;
}
.panel-list {
  display: flex;
  flex-direction: column;
}
</style>
