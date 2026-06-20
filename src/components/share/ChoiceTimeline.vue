<template>
  <div class="choice-timeline">
    <div class="section-header">
      <span class="section-icon">🔀</span>
      <span class="section-title">关键选择</span>
      <span class="choice-count">{{ choices.length }} 个选择</span>
    </div>

    <div v-if="choices.length === 0" class="empty-state">
      <span class="empty-icon">📝</span>
      <span class="empty-text">暂无关键选择记录</span>
    </div>

    <div v-else class="timeline-container">
      <div class="timeline-line"></div>
      
      <div 
        v-for="(choice, index) in displayChoices" 
        :key="index"
        class="timeline-item"
        :class="{ 'is-perfect': choice.isPerfect, 'is-hidden': choice.choiceType === 'hidden_dialogue' }"
      >
        <div class="timeline-node">
          <div class="node-icon">{{ getNodeIcon(choice) }}</div>
          <div class="node-badge" v-if="choice.isPerfect">✓</div>
        </div>

        <div class="timeline-content">
          <div class="timeline-header">
            <span class="choice-type" :class="choice.choiceType">
              {{ getTypeLabel(choice.choiceType) }}
            </span>
            <span class="choice-order">#{{ index + 1 }}</span>
          </div>

          <div class="choice-main">
            <div class="choice-icon" v-if="choice.materialName">
              <span 
                class="material-emoji" 
                :style="{ background: choice.color || '#8b5cf6' }"
              >{{ getEmoji(choice.shape) }}</span>
            </div>
            <div class="choice-info">
              <div class="choice-title">
                {{ choice.materialName || choice.choiceText || '关键选择' }}
              </div>
              <div class="choice-detail" v-if="choice.choiceText && choice.materialName">
                {{ choice.choiceText }}
              </div>
            </div>
            <div class="choice-emotion" v-if="choice.emotionGain > 0">
              <span class="emotion-gain">+{{ choice.emotionGain }}</span>
              <span class="emotion-icon">💕</span>
            </div>
          </div>

          <div class="timeline-footer">
            <span class="chapter-tag">{{ getChapterTitle(choice.chapterId) }}</span>
            <span class="timestamp">{{ formatTime(choice.timestamp) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="choices.length > maxDisplay" class="show-more">
      <button class="show-more-btn" @click="toggleExpand">
        {{ isExpanded ? '收起' : `展开全部 ${choices.length} 个选择` }}
        <span class="arrow" :class="{ expanded: isExpanded }">▼</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  choices: {
    type: Array,
    default: () => []
  },
  chapterTitles: {
    type: Object,
    default: () => ({})
  },
  maxDisplay: {
    type: Number,
    default: 5
  }
})

const isExpanded = ref(false)

const displayChoices = computed(() => {
  if (isExpanded.value) return props.choices
  return props.choices.slice(0, props.maxDisplay)
})

const getNodeIcon = (choice) => {
  if (choice.choiceType === 'material') {
    const shapeIcons = {
      flower: '🌸',
      butterfly: '🦋',
      rectangle: '📄',
      circle: '☀️',
      cicada: '🦗',
      book: '📖',
      leaf: '🍂',
      cup: '☕',
      snowflake: '❄️',
      scarf: '🧣',
      heart: '💖',
      cloud: '☁️',
      star: '⭐',
      note: '🎵'
    }
    return shapeIcons[choice.shape] || '🎨'
  }
  if (choice.choiceType === 'dialogue') return '💬'
  if (choice.choiceType === 'hidden_dialogue') return '💎'
  return '✨'
}

const getEmoji = (shape) => {
  const emojiMap = {
    flower: '🌸',
    butterfly: '🦋',
    rectangle: '📄',
    circle: '☀️',
    cicada: '🦗',
    book: '📖',
    leaf: '🍂',
    cup: '☕',
    snowflake: '❄️',
    scarf: '🧣',
    heart: '💖',
    cloud: '☁️',
    star: '⭐',
    note: '🎵'
  }
  return emojiMap[shape] || '✨'
}

const getTypeLabel = (type) => {
  const labels = {
    material: '素材选择',
    dialogue: '对话选择',
    hidden_dialogue: '隐藏对话'
  }
  return labels[type] || type
}

const getChapterTitle = (chapterId) => {
  return props.chapterTitles[chapterId] || chapterId
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.choice-timeline {
  background: linear-gradient(135deg, #eff6ff, #faf5ff);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #bfdbfe;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.section-icon {
  font-size: 1.3rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  flex: 1;
}

.choice-count {
  font-size: 0.8rem;
  color: #6b7280;
  background: rgba(255, 255, 255, 0.7);
  padding: 4px 12px;
  border-radius: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.9rem;
}

.timeline-container {
  position: relative;
  padding-left: 30px;
}

.timeline-line {
  position: absolute;
  left: 14px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: linear-gradient(180deg, #60a5fa, #8b5cf6, #f472b6);
  border-radius: 1px;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
  animation: slideIn 0.3s ease forwards;
  opacity: 0;
  transform: translateX(-10px);
}

.timeline-item:nth-child(1) { animation-delay: 0.05s; }
.timeline-item:nth-child(2) { animation-delay: 0.1s; }
.timeline-item:nth-child(3) { animation-delay: 0.15s; }
.timeline-item:nth-child(4) { animation-delay: 0.2s; }
.timeline-item:nth-child(5) { animation-delay: 0.25s; }
.timeline-item:nth-child(6) { animation-delay: 0.3s; }
.timeline-item:nth-child(7) { animation-delay: 0.35s; }
.timeline-item:nth-child(8) { animation-delay: 0.4s; }

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-node {
  position: absolute;
  left: -30px;
  top: 5px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  border: 2px solid #8b5cf6;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
  z-index: 1;
}

.timeline-item.is-perfect .timeline-node {
  border-color: #10b981;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.timeline-item.is-hidden .timeline-node {
  border-color: #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.node-icon {
  font-size: 0.9rem;
}

.node-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  font-size: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.timeline-content {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 14px 16px;
  margin-left: 12px;
  border: 1px solid #e0e7ff;
  transition: all 0.2s ease;
}

.timeline-item.is-perfect .timeline-content {
  border-color: #bbf7d0;
  background: linear-gradient(135deg, rgba(220, 252, 231, 0.5), rgba(255, 255, 255, 0.8));
}

.timeline-item.is-hidden .timeline-content {
  border-color: #fde68a;
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.5), rgba(255, 255, 255, 0.8));
}

.timeline-content:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.choice-type {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.choice-type.material {
  background: #ede9fe;
  color: #7c3aed;
}

.choice-type.dialogue {
  background: #fce7f3;
  color: #be185d;
}

.choice-type.hidden_dialogue {
  background: #fef3c7;
  color: #d97706;
}

.choice-order {
  margin-left: auto;
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
}

.choice-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.choice-icon {
  flex-shrink: 0;
}

.material-emoji {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.choice-info {
  flex: 1;
  min-width: 0;
}

.choice-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.choice-detail {
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

.choice-emotion {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fce7f3;
  padding: 4px 10px;
  border-radius: 12px;
}

.emotion-gain {
  font-size: 0.9rem;
  font-weight: 700;
  color: #be185d;
}

.emotion-icon {
  font-size: 0.85rem;
}

.timeline-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.chapter-tag {
  font-size: 0.72rem;
  color: #6366f1;
  background: #eef2ff;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 500;
}

.timestamp {
  font-size: 0.72rem;
  color: #9ca3af;
  margin-left: auto;
}

.show-more {
  margin-top: 16px;
  text-align: center;
}

.show-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  color: #6366f1;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-more-btn:hover {
  background: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

.arrow {
  font-size: 0.65rem;
  transition: transform 0.2s ease;
}

.arrow.expanded {
  transform: rotate(180deg);
}

@media (max-width: 640px) {
  .choice-timeline {
    padding: 16px;
  }
  
  .timeline-container {
    padding-left: 24px;
  }
  
  .timeline-line {
    left: 10px;
  }
  
  .timeline-node {
    left: -24px;
    width: 28px;
    height: 28px;
  }
  
  .node-icon {
    font-size: 0.8rem;
  }
  
  .timeline-content {
    padding: 12px;
  }
  
  .choice-main {
    flex-wrap: wrap;
  }
  
  .choice-emotion {
    width: 100%;
    justify-content: center;
  }
}
</style>
