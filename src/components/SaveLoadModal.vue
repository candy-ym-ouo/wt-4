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
          :class="{
            'has-save': slot,
            'is-latest': mode === 'load' && slot && index === latestSlot
          }"
          @click="handleSlotClick(index)"
        >
          <div class="slot-header">
            <span class="slot-number">存档 {{ index + 1 }}</span>
            <span v-if="mode === 'load' && slot && index === latestSlot" class="latest-badge">
              ⭐ 最近进度
            </span>
          </div>

          <div v-if="slot" class="slot-info">
            <div class="slot-chapter-row">
              <span class="slot-chapter-title">
                {{ getThumbnail(slot).chapterTitle }}
              </span>
              <span class="slot-chapter-subtitle">
                {{ getThumbnail(slot).chapterSubtitle }}
              </span>
            </div>

            <div class="slot-scene-info">
              <span class="scene-label">📍</span>
              <span class="scene-name">{{ getThumbnail(slot).sceneName }}</span>
            </div>

            <div class="slot-progress-section">
              <div class="progress-label-row">
                <span>章节进度</span>
                <span class="progress-percent">{{ getThumbnail(slot).chapterProgress }}%</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: getThumbnail(slot).chapterProgress + '%' }"
                ></div>
              </div>
            </div>

            <div class="slot-preview">
              "{{ getThumbnail(slot).dialoguePreview }}"
            </div>

            <div class="slot-stats-row">
              <div class="stat-item">
                <span class="stat-icon">{{ getThumbnail(slot).emotionIcon }}</span>
                <span class="stat-label">{{ getThumbnail(slot).emotionTier }}</span>
                <span class="stat-value">{{ getThumbnail(slot).emotionValue }}</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-icon">📖</span>
                <span class="stat-label">章节</span>
                <span class="stat-value">
                  {{ getThumbnail(slot).completedChaptersCount }}/{{ getThumbnail(slot).totalChaptersCount }}
                </span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-icon">✨</span>
                <span class="stat-label">组合</span>
                <span class="stat-value">{{ getThumbnail(slot).triggeredCombosCount }}</span>
              </div>
            </div>

            <div class="slot-time-row">
              <span class="slot-time-icon">🕐</span>
              <span class="slot-time">{{ formatDate(slot.timestamp) }}</span>
              <span class="slot-playtime">
                · 对话 {{ getThumbnail(slot).playTimeDialogues }} 条
              </span>
            </div>
          </div>

          <div v-else class="slot-empty">
            <div class="empty-icon">📋</div>
            <div class="empty-text">空存档</div>
            <div class="empty-hint">
              {{ mode === 'save' ? '点击此处保存游戏进度' : '暂无存档数据' }}
            </div>
          </div>

          <div v-if="mode === 'save' && slot" class="slot-hover-hint">
            <span class="hover-icon">⚠️</span>
            <span>点击将覆盖此存档</span>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-ghost" @click="handleClose">取消</button>
      </div>
    </div>

    <div v-if="showConfirmDialog" class="confirm-overlay" @click.self="cancelSave">
      <div class="confirm-dialog slide-up">
        <div class="confirm-icon">⚠️</div>
        <h4 class="confirm-title">确认覆盖存档？</h4>
        <div class="confirm-content">
          <p>此操作将永久覆盖「存档 {{ overwriteSlot + 1 }}」的内容：</p>
          <div v-if="overwriteSlot !== null && slots[overwriteSlot]" class="confirm-preview">
            <div class="preview-chapter">
              {{ getThumbnail(slots[overwriteSlot]).chapterTitle }}
            </div>
            <div class="preview-time">
              {{ formatDate(slots[overwriteSlot].timestamp) }}
            </div>
          </div>
          <p class="confirm-warning">覆盖后将无法恢复，请谨慎操作。</p>
        </div>
        <div class="confirm-actions">
          <button class="btn btn-ghost" @click="cancelSave">取消</button>
          <button class="btn btn-danger" @click="confirmSave">确认覆盖</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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
const latestSlot = computed(() => gameStore.latestSaveSlotIndex)

const showConfirmDialog = ref(false)
const overwriteSlot = ref(null)

const getThumbnail = (slot) => {
  if (slot?.thumbnail) {
    return slot.thumbnail
  }
  const chapter = gameStore.getChapterById(slot?.currentChapterId)
  return {
    chapterTitle: chapter?.title || '未知章节',
    chapterSubtitle: chapter?.subtitle || '',
    sceneName: slot?.currentSceneId || '未知场景',
    dialoguePreview: '剧情进行中...',
    emotionValue: slot?.emotionValue || 0,
    emotionTier: '平静',
    emotionIcon: '🌙',
    chapterProgress: 0,
    completedChaptersCount: slot?.completedChapters?.length || 0,
    totalChaptersCount: gameStore.chapters.length,
    triggeredCombosCount: slot?.triggeredCombos?.length || 0,
    playTimeDialogues: slot?.totalDialogueCount || 0
  }
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSlotClick = (index) => {
  if (props.mode === 'save') {
    if (slots.value[index]) {
      overwriteSlot.value = index
      showConfirmDialog.value = true
    } else {
      performSave(index)
    }
  } else {
    if (!slots.value[index]) return
    gameStore.loadGame(index)
    gameStore.showNotification('存档已读取', 'success')
    emit('loaded')
    emit('close')
  }
}

const performSave = (index) => {
  gameStore.saveGame(index)
  gameStore.showNotification('游戏已保存', 'success')
  emit('saved')
  emit('close')
}

const confirmSave = () => {
  if (overwriteSlot.value !== null) {
    performSave(overwriteSlot.value)
  }
  showConfirmDialog.value = false
  overwriteSlot.value = null
}

const cancelSave = () => {
  showConfirmDialog.value = false
  overwriteSlot.value = null
}

const handleClose = () => {
  showConfirmDialog.value = false
  overwriteSlot.value = null
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
  max-width: 560px;
  width: 90%;
  max-height: 82vh;
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
  gap: 14px;
  margin-bottom: 20px;
}

.save-slot {
  position: relative;
  padding: 18px 20px;
  border: 2px dashed #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
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
  border-color: #e5e7eb;
}

.save-slot.is-latest {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  box-shadow: 0 2px 12px rgba(245, 158, 11, 0.15);
}

.save-slot.is-latest:hover {
  border-color: #d97706;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.25);
}

.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.slot-number {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.latest-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400e;
  background: rgba(245, 158, 11, 0.18);
  padding: 3px 10px;
  border-radius: 20px;
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slot-chapter-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.slot-chapter-title {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 1.05rem;
}

.slot-chapter-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.slot-scene-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.scene-label {
  font-size: 0.9rem;
}

.scene-name {
  color: var(--text-primary);
}

.slot-progress-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.progress-percent {
  font-weight: 600;
  color: var(--accent-pink);
}

.progress-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f472b6 0%, #ec4899 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.slot-preview {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-style: italic;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  border-left: 3px solid var(--accent-pink);
  line-height: 1.5;
}

.slot-stats-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 10px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.stat-icon {
  font-size: 1.1rem;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(0, 0, 0, 0.08);
}

.slot-time-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.slot-time-icon {
  font-size: 0.9rem;
}

.slot-time {
  font-weight: 500;
}

.slot-playtime {
  opacity: 0.7;
}

.slot-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 10px;
  text-align: center;
}

.empty-icon {
  font-size: 2rem;
  opacity: 0.3;
}

.empty-text {
  color: var(--text-secondary);
  font-weight: 500;
}

.empty-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

.slot-hover-hint {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(239, 68, 68, 0.92);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  opacity: 0;
  transition: opacity 0.25s ease;
  backdrop-filter: blur(2px);
}

.hover-icon {
  font-size: 1.1rem;
}

.save-slot:hover .slot-hover-hint {
  opacity: 1;
}

.modal-actions {
  text-align: center;
}

.confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(2px);
}

.confirm-dialog {
  background: white;
  border-radius: 16px;
  padding: 28px;
  max-width: 400px;
  width: 85%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.confirm-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.confirm-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.confirm-content {
  text-align: left;
  margin-bottom: 20px;
}

.confirm-content p {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 8px 0;
}

.confirm-preview {
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px 14px;
  margin: 10px 0;
  border-left: 3px solid #f59e0b;
}

.preview-chapter {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.preview-time {
  font-size: 0.8rem;
  color: #6b7280;
}

.confirm-warning {
  color: #dc2626 !important;
  font-weight: 500;
  margin-top: 10px !important;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-actions .btn {
  flex: 1;
  min-width: 100px;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.slide-up {
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .modal-content {
    padding: 20px;
  }

  .save-slot {
    padding: 14px 16px;
  }

  .slot-stats-row {
    gap: 4px;
  }

  .stat-label {
    font-size: 0.65rem;
  }

  .confirm-dialog {
    padding: 22px 20px;
  }
}
</style>
