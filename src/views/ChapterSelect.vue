<template>
  <div class="chapter-select page-container paper-texture">
    <div class="header">
      <h1 class="title text-gradient">文艺手账</h1>
      <p class="subtitle">翻开属于你的故事</p>
    </div>

    <div class="chapters-grid">
      <div
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        class="chapter-card fade-in"
        :style="{ 
          background: chapter.background,
          animationDelay: (index * 0.1) + 's',
          opacity: isChapterUnlocked(chapter.id) ? 1 : 0.5
        }"
        @click="selectChapter(chapter)"
      >
        <div class="washi-tape" :class="getTapeClass(index)"></div>
        <div class="chapter-content">
          <div class="chapter-number handwriting">{{ index + 1 }}</div>
          <h2 class="chapter-title handwriting">{{ chapter.title }}</h2>
          <p class="chapter-subtitle">{{ chapter.subtitle }}</p>
          <p class="chapter-description">{{ chapter.description }}</p>
          
          <div class="chapter-status">
            <span v-if="isChapterCompleted(chapter.id)" class="status-completed">
              ✓ 已完成
            </span>
            <span v-else-if="isChapterUnlocked(chapter.id)" class="status-unlocked">
              点击开始
            </span>
            <span v-else class="status-locked">
              🔒 未解锁
            </span>
          </div>

          <div class="chapter-materials">
            <span class="materials-label">所需素材：</span>
            <span 
              v-for="matId in chapter.requiredMaterials" 
              :key="matId"
              class="material-dot"
              :style="{ background: getMaterialColor(matId) }"
              :title="getMaterialName(matId)"
            ></span>
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-secondary" @click="openLoadModal">
        📂 读取存档
      </button>
      <button class="btn btn-ghost" @click="resetGame">
        🔄 重新开始
      </button>
    </div>

    <div v-if="showLoadModal" class="modal-overlay" @click.self="closeLoadModal">
      <div class="modal-content">
        <h3 class="handwriting" style="margin-bottom: 20px; font-size: 1.5rem;">选择存档</h3>
        <div class="save-slots">
          <div 
            v-for="(slot, index) in saveSlots" 
            :key="index"
            class="save-slot"
            :class="{ 'has-save': slot }"
            @click="loadSave(index)"
          >
            <div v-if="slot" class="save-info">
              <div class="save-chapter">{{ getChapterName(slot.currentChapterId) }}</div>
              <div class="save-emotion">情绪值: {{ slot.emotionValue }}</div>
              <div class="save-time">{{ formatDate(slot.timestamp) }}</div>
            </div>
            <div v-else class="save-empty">
              空存档
            </div>
          </div>
        </div>
        <button class="btn btn-ghost" style="margin-top: 20px;" @click="closeLoadModal">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const chapters = computed(() => gameStore.chapters)
const saveSlots = computed(() => gameStore.saveSlots)
const showLoadModal = computed(() => gameStore.showLoadModal)

const isChapterUnlocked = (chapterId) => {
  return gameStore.unlockedChapters.includes(chapterId)
}

const isChapterCompleted = (chapterId) => {
  return gameStore.completedChapters.includes(chapterId)
}

const getMaterialColor = (materialId) => {
  const material = gameStore.getMaterialById(materialId)
  return material ? material.color : '#ccc'
}

const getMaterialName = (materialId) => {
  const material = gameStore.getMaterialById(materialId)
  return material ? material.name : ''
}

const getTapeClass = (index) => {
  const classes = ['', 'washi-tape-purple', 'washi-tape-yellow', 'washi-tape-purple']
  return classes[index % 4]
}

const selectChapter = (chapter) => {
  if (!isChapterUnlocked(chapter.id)) return
  
  gameStore.startChapter(chapter.id)
  router.push(`/game/${chapter.id}`)
}

const openLoadModal = () => {
  gameStore.showLoadModal = true
}

const closeLoadModal = () => {
  gameStore.showLoadModal = false
}

const loadSave = (index) => {
  if (gameStore.loadGame(index)) {
    closeLoadModal()
    if (gameStore.currentChapterId) {
      router.push(`/game/${gameStore.currentChapterId}`)
    }
  }
}

const getChapterName = (chapterId) => {
  const chapter = gameStore.getChapterById(chapterId)
  return chapter ? chapter.title : '未知章节'
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const resetGame = () => {
  if (confirm('确定要重新开始吗？所有进度将会重置。')) {
    gameStore.resetGame()
    localStorage.removeItem('journal_game_saves')
    window.location.reload()
  }
}
</script>

<style scoped>
.chapter-select {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 0;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.chapter-card {
  position: relative;
  border-radius: 12px;
  padding: 30px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 320px;
  box-shadow: var(--shadow-md);
}

.chapter-card:hover {
  transform: translateY(-8px) rotate(1deg);
  box-shadow: var(--shadow-lg);
}

.chapter-card:nth-child(even):hover {
  transform: translateY(-8px) rotate(-1deg);
}

.chapter-content {
  position: relative;
  z-index: 1;
}

.chapter-number {
  font-size: 3rem;
  color: rgba(0, 0, 0, 0.1);
  position: absolute;
  top: -10px;
  right: 10px;
  font-weight: bold;
}

.chapter-title {
  font-size: 1.8rem;
  color: var(--text-primary);
  margin-bottom: 5px;
}

.chapter-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 15px;
  font-style: italic;
}

.chapter-description {
  font-size: 0.95rem;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 20px;
}

.chapter-status {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.8);
}

.status-completed {
  color: #059669;
}

.status-unlocked {
  color: var(--accent-pink);
}

.status-locked {
  color: var(--text-secondary);
}

.chapter-materials {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.materials-label {
  flex-shrink: 0;
}

.material-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.save-slots {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.save-slot {
  padding: 20px;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.save-slot:hover {
  border-color: var(--accent-pink);
  background: rgba(244, 114, 182, 0.05);
}

.save-slot.has-save {
  border-style: solid;
  background: var(--bg-primary);
}

.save-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.save-chapter {
  font-weight: 600;
  color: var(--text-primary);
}

.save-emotion {
  color: var(--accent-pink);
  font-size: 0.9rem;
}

.save-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.save-empty {
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .chapters-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .header {
    padding: 20px 0;
  }

  .chapter-card {
    min-height: 280px;
  }
}
</style>
