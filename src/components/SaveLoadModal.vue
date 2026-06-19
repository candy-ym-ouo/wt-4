<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content slide-up">
      <h3 class="handwriting modal-title">
        {{ mode === 'save' ? '保存游戏' : '读取存档' }}
      </h3>
      
      <div class="save-slots">
        <div
          v-for="(slot, index) in slots"
          :key="index"
          class="save-slot"
          :class="{ 'has-save': slot }"
          @click="handleSlotClick(index)"
        >
          <div class="slot-number">存档 {{ index + 1 }}</div>
          <div v-if="slot" class="slot-info">
            <div class="slot-chapter">{{ getChapterName(slot.currentChapterId) }}</div>
            <div class="slot-emotion">💕 {{ slot.emotionValue }}</div>
            <div class="slot-time">{{ formatDate(slot.timestamp) }}</div>
          </div>
          <div v-else class="slot-empty">
            空存档
          </div>
          <div v-if="mode === 'save' && slot" class="slot-overlay">
            点击覆盖
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-ghost" @click="handleClose">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'save'
  }
})

const emit = defineEmits(['close', 'saved', 'loaded'])

const gameStore = useGameStore()

const slots = computed(() => gameStore.saveSlots)

const getChapterName = (chapterId) => {
  const chapter = gameStore.getChapterById(chapterId)
  return chapter ? chapter.title : '未知章节'
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSlotClick = (index) => {
  if (props.mode === 'save') {
    if (slots.value[index] && !confirm('确定要覆盖这个存档吗？')) {
      return
    }
    gameStore.saveGame(index)
    emit('saved')
    emit('close')
  } else {
    if (!slots.value[index]) return
    gameStore.loadGame(index)
    emit('loaded')
    emit('close')
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-title {
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 25px;
  color: var(--text-primary);
}

.save-slots {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.save-slot {
  position: relative;
  padding: 20px;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  overflow: hidden;
}

.save-slot:hover {
  border-color: var(--accent-pink);
  background: rgba(244, 114, 182, 0.05);
  transform: translateY(-2px);
}

.save-slot.has-save {
  border-style: solid;
  background: var(--bg-primary);
}

.slot-number {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
  font-weight: 500;
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.slot-chapter {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.slot-emotion {
  color: var(--accent-pink);
  font-size: 0.9rem;
}

.slot-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.slot-empty {
  color: var(--text-secondary);
  font-style: italic;
}

.slot-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.save-slot:hover .slot-overlay {
  opacity: 1;
}

.modal-actions {
  text-align: center;
}

@media (max-width: 768px) {
  .modal-content {
    padding: 20px;
  }

  .save-slot {
    padding: 15px;
  }
}
</style>
