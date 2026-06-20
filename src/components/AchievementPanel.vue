<template>
  <div class="achievement-panel-overlay" v-if="showAchievementPanel" @click.self="closeAchievementPanel">
    <div class="achievement-panel">
      <div class="achievement-panel-header">
        <div class="achievement-panel-title-row">
          <span class="achievement-panel-icon">🏆</span>
          <h2 class="achievement-panel-title">成就徽章</h2>
        </div>
        <button class="achievement-panel-close" @click="closeAchievementPanel">
          <span>✕</span>
        </button>
      </div>

      <div class="achievement-stats">
        <div class="achievement-stat-item">
          <span class="stat-icon">✅</span>
          <span class="stat-value">{{ stats.unlocked }}/{{ stats.total }}</span>
          <span class="stat-label">已解锁</span>
        </div>
        <div class="achievement-stat-item">
          <span class="stat-icon">📖</span>
          <span class="stat-value">{{ stats.chapterCompleted }}/{{ stats.chapterTotal }}</span>
          <span class="stat-label">章节</span>
        </div>
        <div class="achievement-stat-item">
          <span class="stat-icon">🎨</span>
          <span class="stat-value">{{ stats.comboCompleted }}/{{ stats.comboTotal }}</span>
          <span class="stat-label">组合</span>
        </div>
        <div class="achievement-stat-item">
          <span class="stat-icon">🔮</span>
          <span class="stat-value">{{ stats.hiddenCompleted }}/{{ stats.hiddenTotal }}</span>
          <span class="stat-label">隐藏</span>
        </div>
        <div class="achievement-stat-item">
          <span class="stat-icon">💖</span>
          <span class="stat-value">{{ stats.emotionCompleted }}/{{ stats.emotionTotal }}</span>
          <span class="stat-label">情绪</span>
        </div>
      </div>

      <div class="achievement-progress-bar">
        <div 
          class="achievement-progress-fill" 
          :style="{ width: stats.percent + '%' }"
        ></div>
        <span class="achievement-progress-text">{{ Math.round(stats.percent) }}% 完成度</span>
      </div>

      <div class="achievement-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="achievement-tab" 
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.name }}</span>
          <span class="tab-badge" v-if="getTabCount(tab.id) > 0">{{ getTabCount(tab.id) }}</span>
        </button>
      </div>

      <div class="achievement-list-container">
        <div class="achievement-list">
          <div 
            v-for="(achievement, index) in filteredAchievements" 
            :key="achievement.id"
            class="achievement-item-wrapper"
            :style="{ animationDelay: index * 0.05 + 's' }"
          >
            <AchievementBadge 
              :achievement="achievement"
              :show-reward="true"
              @click="selectAchievement(achievement)"
            />
          </div>

          <div class="empty-state" v-if="filteredAchievements.length === 0">
            <span class="empty-icon">{{ getEmptyIcon() }}</span>
            <p class="empty-text">暂无{{ getCurrentTabName() }}成就</p>
            <p class="empty-hint">{{ getEmptyHint() }}</p>
          </div>
        </div>
      </div>

      <div class="achievement-panel-footer">
        <div class="rarity-legend">
          <span class="legend-label">稀有度:</span>
          <span v-for="rarity in rarityList" :key="rarity.id" class="legend-item">
            <span class="legend-dot" :style="{ background: rarity.color }"></span>
            <span>{{ rarity.name }}</span>
          </span>
        </div>
      </div>
    </div>

    <Transition name="modal-fade">
      <div class="achievement-detail-modal" v-if="selectedAchievement" @click.self="selectedAchievement = null">
        <div class="achievement-detail-content">
          <div class="detail-icon" :class="`rarity-${selectedAchievement.rarity}`">
            <span>{{ selectedAchievement.icon }}</span>
          </div>
          <h3 class="detail-name">{{ selectedAchievement.unlocked ? selectedAchievement.name : '???' }}</h3>
          <div class="detail-rarity" :style="getRarityStyle(selectedAchievement.rarity)">
            {{ getRarityLabel(selectedAchievement.rarity) }}
          </div>
          <p class="detail-description">
            {{ selectedAchievement.unlocked ? selectedAchievement.description : '继续探索以解锁此成就' }}
          </p>
          <div class="detail-category">
            <span class="category-icon">{{ getCategoryIcon(selectedAchievement.category) }}</span>
            <span>{{ getCategoryLabel(selectedAchievement.category) }}</span>
          </div>
          <div v-if="selectedAchievement.unlocked && selectedAchievement.reward" class="detail-reward">
            <span class="reward-label">奖励:</span>
            <span class="reward-value">{{ getRewardText(selectedAchievement.reward) }}</span>
          </div>
          <div v-if="selectedAchievement.unlocked && selectedAchievement.unlockedAt" class="detail-time">
            解锁时间: {{ formatDate(selectedAchievement.unlockedAt) }}
          </div>
          <button class="detail-close-btn" @click="selectedAchievement = null">关闭</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'
import { useGameStore } from '../stores/gameStore'
import AchievementBadge from './AchievementBadge.vue'

const props = defineProps({
  showAchievementPanel: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const gameStore = useGameStore()
const activeTab = ref('all')
const selectedAchievement = ref(null)

const tabs = [
  { id: 'all', name: '全部', icon: '🏆' },
  { id: 'unlocked', name: '已解锁', icon: '✅' },
  { id: 'locked', name: '未解锁', icon: '🔒' },
  { id: ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION, name: '章节', icon: '📖' },
  { id: ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO, name: '组合', icon: '🎨' },
  { id: ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH, name: '隐藏', icon: '🔮' },
  { id: ACHIEVEMENT_CATEGORIES.HIGH_EMOTION, name: '情绪', icon: '💖' }
]

const ACHIEVEMENT_CATEGORIES = gameStore.ACHIEVEMENT_CATEGORIES

const stats = computed(() => gameStore.getAchievementStats())

const rarityList = computed(() => {
  return Object.values(gameStore.ACHIEVEMENT_RARITY)
})

const filteredAchievements = computed(() => {
  const all = gameStore.crossCycleAchievements
  
  switch (activeTab.value) {
    case 'all':
      return [...all].sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1
        if (!a.unlocked && b.unlocked) return 1
        return a.rarity.localeCompare(b.rarity)
      })
    case 'unlocked':
      return all.filter(a => a.unlocked)
    case 'locked':
      return all.filter(a => !a.unlocked)
    default:
      return all.filter(a => a.category === activeTab.value)
  }
})

const getTabCount = (tabId) => {
  const all = gameStore.crossCycleAchievements
  switch (tabId) {
    case 'all': return all.length
    case 'unlocked': return all.filter(a => a.unlocked).length
    case 'locked': return all.filter(a => !a.unlocked).length
    default: return all.filter(a => a.category === tabId).length
  }
}

const getCurrentTabName = () => {
  const tab = tabs.find(t => t.id === activeTab.value)
  return tab ? tab.name : ''
}

const getEmptyIcon = () => {
  const icons = {
    all: '🏆',
    unlocked: '🔒',
    locked: '✨',
    [ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION]: '📖',
    [ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO]: '🎨',
    [ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH]: '🔮',
    [ACHIEVEMENT_CATEGORIES.HIGH_EMOTION]: '💖'
  }
  return icons[activeTab.value] || '🏆'
}

const getEmptyHint = () => {
  const hints = {
    all: '开始你的冒险，解锁各种成就吧！',
    unlocked: '继续探索，解锁更多成就！',
    locked: '所有成就都已解锁，太棒了！',
    [ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION]: '完成章节可解锁此类成就',
    [ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO]: '尝试不同的素材组合来解锁',
    [ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH]: '探索隐藏分支和对话',
    [ACHIEVEMENT_CATEGORIES.HIGH_EMOTION]: '保持高情绪值通关'
  }
  return hints[activeTab.value] || '继续探索！'
}

const getCategoryIcon = (category) => {
  const icons = {
    [ACHIEVEMENT_CATEGORIES.CHAPTER_COMPLETION]: '📖',
    [ACHIEVEMENT_CATEGORIES.MATERIAL_COMBO]: '🎨',
    [ACHIEVEMENT_CATEGORIES.HIDDEN_BRANCH]: '🔮',
    [ACHIEVEMENT_CATEGORIES.HIGH_EMOTION]: '💖',
    [ACHIEVEMENT_CATEGORIES.CROSS_CYCLE]: '🔄'
  }
  return icons[category] || '🏆'
}

const getCategoryLabel = (category) => {
  return gameStore.getAchievementCategoryInfo(category).name
}

const getRarityStyle = (rarity) => {
  const info = gameStore.getAchievementRarityInfo(rarity)
  return {
    background: info.bgColor,
    color: info.color,
    borderColor: info.color
  }
}

const getRarityLabel = (rarity) => {
  return gameStore.getAchievementRarityInfo(rarity).name
}

const getRewardText = (reward) => {
  if (!reward) return ''
  switch (reward.type) {
    case 'emotion_bonus': return `情绪值 +${reward.value}`
    case 'inheritance_ratio': return `继承比例 +${Math.round(reward.value * 100)}%`
    case 'max_inheritance': return `最大继承 +${reward.value}`
    case 'unlock_material': return '解锁隐藏素材'
    default: return '神秘奖励'
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('zh-CN')
}

const selectAchievement = (achievement) => {
  selectedAchievement.value = achievement
}

const closeAchievementPanel = () => {
  emit('close')
}
</script>

<style scoped>
.achievement-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2500;
  padding: 20px;
}

.achievement-panel {
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border-radius: 24px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: panelSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.achievement-panel-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}

.achievement-panel-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.achievement-panel-icon {
  font-size: 2rem;
}

.achievement-panel-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #92400e;
}

.achievement-panel-close {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  color: #92400e;
  transition: all 0.2s ease;
}

.achievement-panel-close:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: scale(1.1);
}

.achievement-stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 20px 24px;
  background: #fefce8;
}

.achievement-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.achievement-progress-bar {
  margin: 0 24px 16px;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.achievement-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  border-radius: 12px;
  transition: width 0.5s ease;
}

.achievement-progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1f2937;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.achievement-tabs {
  display: flex;
  gap: 8px;
  padding: 0 24px 16px;
  overflow-x: auto;
  border-bottom: 1px solid #e5e7eb;
}

.achievement-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #6b7280;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.achievement-tab:hover {
  border-color: #fbbf24;
  color: #f59e0b;
}

.achievement-tab.active {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #fbbf24;
  color: #92400e;
  font-weight: 600;
}

.tab-icon {
  font-size: 0.9rem;
}

.tab-badge {
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

.achievement-tab.active .tab-badge {
  background: rgba(255, 255, 255, 0.6);
}

.achievement-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.achievement-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.achievement-item-wrapper {
  animation: itemFadeIn 0.4s ease forwards;
  opacity: 0;
}

@keyframes itemFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 0.85rem;
  color: #9ca3af;
}

.achievement-panel-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.rarity-legend {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #6b7280;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.achievement-detail-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2600;
  padding: 20px;
}

.achievement-detail-content {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  animation: modalPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalPopIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.detail-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}

.detail-icon.rarity-rare {
  background: linear-gradient(135deg, #ede9fe, #c4b5fd);
}

.detail-icon.rarity-epic {
  background: linear-gradient(135deg, #fce7f3, #f9a8d4);
}

.detail-icon.rarity-legendary {
  background: linear-gradient(135deg, #fef3c7, #fbbf24);
  animation: legendaryPulse 2s ease-in-out infinite;
}

@keyframes legendaryPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.6); }
}

.detail-name {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px;
}

.detail-rarity {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid;
  margin-bottom: 12px;
}

.detail-description {
  font-size: 0.95rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 16px;
}

.detail-category {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 12px;
}

.category-icon {
  font-size: 1rem;
}

.detail-reward {
  padding: 12px;
  background: #f5f3ff;
  border-radius: 12px;
  margin-bottom: 12px;
}

.reward-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #7c3aed;
  display: block;
  margin-bottom: 4px;
}

.reward-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #5b21b6;
}

.detail-time {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 20px;
}

.detail-close-btn {
  width: 100%;
  padding: 12px;
  border: none;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.detail-close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

@media (max-width: 768px) {
  .achievement-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .achievement-list {
    grid-template-columns: 1fr;
  }
  
  .achievement-panel-header {
    padding: 16px;
  }
  
  .achievement-stats {
    padding: 16px;
  }
  
  .achievement-tabs {
    padding: 0 16px 12px;
  }
  
  .achievement-list-container {
    padding: 16px;
  }
  
  .achievement-panel-footer {
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .achievement-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
