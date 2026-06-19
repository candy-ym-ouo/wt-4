<template>
  <div class="endings-main">
    <div class="toolbar">
      <h2 class="m-0">🌟 结局管理</h2>
      <div class="toolbar-actions">
        <button
          class="btn btn-primary btn-sm"
          @click="editorStore.addEnding()"
        >
          ➕ 新建结局
        </button>
      </div>
    </div>

    <div v-if="editorStore.endings.length === 0" class="empty-state">
      <div class="empty-state-icon">🌟</div>
      <div class="empty-state-text">还没有结局，点击上方按钮创建第一个结局</div>
    </div>

    <div v-else class="endings-grid">
      <div
        v-for="ending in editorStore.endings"
        :key="ending.id"
        class="ending-card"
        :class="{ active: editorStore.selectedEndingId === ending.id }"
        @click="editorStore.selectedEndingId = ending.id"
      >
        <div class="ending-preview" :style="{ background: ending.background }">
          <div class="ending-type-badge">
            <span class="type-icon">{{ getTypeIcon(ending.type) }}</span>
            <span class="type-name">{{ getTypeLabel(ending.type) }}</span>
          </div>
        </div>
        <div class="ending-card-body">
          <div class="ending-title-row">
            <h3 class="ending-title">{{ ending.title }}</h3>
            <span class="ending-emotion">💖 {{ ending.minEmotion }}</span>
          </div>
          <p class="ending-desc">{{ ending.description }}</p>
          <div class="ending-conditions">
            <span
              v-for="(value, key) in ending.triggerConditions"
              :key="key"
              class="condition-tag"
            >
              {{ formatCondition(key, value) }}
            </span>
            <span v-if="!ending.triggerConditions || Object.keys(ending.triggerConditions).length === 0" class="condition-tag empty">
              无特殊条件
            </span>
          </div>
        </div>
      </div>
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

const formatCondition = (key, value) => {
  const labelMap = {
    allOfTheAbove: '全部满足',
    emotionValue: `情绪≥${value}`,
    allChaptersCompleted: '全章节完成',
    seasonComboTriggered: '四季组合触发',
    allChaptersPerfect: '全章节完美',
    allCombosTriggered: '全组合触发',
    minPerfectRate: `完美率≥${Math.round(value * 100)}%`,
    allHiddenDialogues: '全隐藏对白',
    keyLinesFound: '关键台词发现',
    materialOrder: '素材顺序',
    orderStrict: '顺序严格',
    minFinalScore: `最低分≥${value}`,
    minCompletedChapterCount: `≥${value}章完成`
  }
  if (typeof value === 'boolean') {
    return value ? (labelMap[key] || key) : ''
  }
  if (Array.isArray(value)) {
    return `${labelMap[key] || key}: ${value.join(', ')}`
  }
  return labelMap[key] || `${key}: ${value}`
}
</script>

<style scoped>
.m-0 { margin: 0; }
.endings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.ending-card {
  background: white;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.ending-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.ending-card.active {
  border-color: var(--accent-purple);
  box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.15);
}
.ending-preview {
  height: 100px;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 12px 14px;
}
.ending-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}
.type-icon {
  font-size: 1rem;
}
.ending-card-body {
  padding: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ending-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ending-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}
.ending-emotion {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-pink);
  white-space: nowrap;
}
.ending-desc {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  flex: 1;
}
.ending-conditions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color-light);
}
.condition-tag {
  padding: 3px 8px;
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.1), rgba(244, 114, 182, 0.1));
  border-radius: 6px;
  font-size: 0.7rem;
  color: var(--accent-purple);
  font-weight: 500;
}
.condition-tag.empty {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}
</style>
