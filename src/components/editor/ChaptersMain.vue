<template>
  <div class="chapters-main">
    <div class="toolbar">
      <h2 class="m-0">📚 章节管理</h2>
      <div class="toolbar-actions">
        <button class="btn btn-primary btn-sm" @click="editorStore.addChapter">
          ➕ 新建章节
        </button>
      </div>
    </div>

    <div v-if="editorStore.chapters.length === 0" class="empty-state">
      <div class="empty-state-icon">📖</div>
      <div class="empty-state-text">还没有章节，点击上方按钮创建第一个章节吧</div>
    </div>

    <div v-else class="chapters-grid">
      <div
        v-for="chapter in editorStore.chapters" :key="chapter.id"
        class="chapter-card"
        :class="{ active: editorStore.selectedChapterId === chapter.id }"
        @click="editorStore.selectedChapterId = chapter.id"
        :style="{ background: chapter.background }"
      >
        <div class="card-header">
          <h3 class="card-title">{{ chapter.title }}</h3>
          <div class="card-badges">
            <span v-if="chapter.unlocked" class="tag tag-green">已解锁</span>
            <span v-else class="tag tag-gray">未解锁</span>
            <span v-if="chapter.hidden" class="tag tag-purple">隐藏</span>
          </div>
        </div>
        <div class="card-subtitle">{{ chapter.subtitle }}</div>
        <p class="card-desc">{{ chapter.description }}</p>
        <div class="card-footer">
          <span class="card-stat">🎬 {{ chapter.scenes?.length || 0 }} 场景</span>
          <span class="card-stat">🎯 情绪目标 {{ chapter.emotionTarget }}</span>
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
.m-0 {
  margin: 0;
}
.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.chapter-card {
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}
.chapter-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}
.chapter-card.active {
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.15);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
.card-title {
  font-size: 1.15rem;
  margin: 0;
  color: var(--text-primary);
}
.card-badges {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.card-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 10px;
}
.card-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 14px;
}
.card-footer {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.card-stat {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
}
</style>
