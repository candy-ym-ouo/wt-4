<template>
  <div class="quest-detail-overlay" v-if="selectedQuest" @click.self="clearSelection">
    <div class="quest-detail-modal">
      <div class="quest-detail-header" :class="'quest-type-' + selectedQuest.type">
        <div class="quest-type-large">
          <span class="type-icon-large">{{ getTypeInfo(selectedQuest.type).icon }}</span>
          <span class="type-name-large">{{ getTypeInfo(selectedQuest.type).name }}</span>
        </div>
        <button class="detail-close" @click="clearSelection">
          <span>✕</span>
        </button>
      </div>

      <div class="quest-detail-body">
        <div class="quest-title-section">
          <span class="quest-icon-large">{{ selectedQuest.icon }}</span>
          <h2 class="quest-title-large">{{ selectedQuest.title }}</h2>
        </div>

        <p class="quest-description-large">{{ selectedQuest.description }}</p>

        <div class="quest-detail-section">
          <h3 class="section-title">
            <span>🎯</span>
            <span>任务目标</span>
          </h3>
          <div class="objectives-list">
            <div 
              v-for="obj in selectedQuest.objectives" 
              :key="obj.id"
              class="objective-item-large"
              :class="{ completed: isObjectiveCompleted(selectedQuest.id, obj.id) }"
            >
              <div class="objective-status">
                <span class="status-circle">
                  {{ isObjectiveCompleted(selectedQuest.id, obj.id) ? '✓' : '' }}
                </span>
              </div>
              <div class="objective-info">
                <p class="objective-text-large">{{ obj.description }}</p>
                <div class="objective-progress-bar">
                  <div 
                    class="objective-progress-fill"
                    :style="{ width: getObjectivePercent(selectedQuest.id, obj.id) + '%' }"
                  ></div>
                </div>
                <span class="objective-count-large">
                  {{ getObjectiveProgress(selectedQuest.id, obj.id) }} / {{ obj.count }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="quest-detail-section">
          <h3 class="section-title">
            <span>🎁</span>
            <span>任务奖励</span>
          </h3>
          <div class="rewards-grid">
            <div class="reward-item-large" v-if="selectedQuest.rewards.emotion">
              <span class="reward-icon">💕</span>
              <span class="reward-name">情绪值</span>
              <span class="reward-value">+{{ selectedQuest.rewards.emotion }}</span>
            </div>
            <div class="reward-item-large" v-if="selectedQuest.rewards.materials?.length">
              <span class="reward-icon">📦</span>
              <span class="reward-name">素材</span>
              <span class="reward-value">{{ selectedQuest.rewards.materials.length }}个</span>
            </div>
            <div class="reward-item-large" v-if="selectedQuest.rewards.affinity">
              <span class="reward-icon">❤️</span>
              <span class="reward-name">好感度</span>
              <span class="reward-value" v-for="(value, key) in selectedQuest.rewards.affinity" :key="key">
                {{ key }} +{{ value }}
              </span>
            </div>
            <div class="reward-item-large" v-if="selectedQuest.rewards.unlockChapter">
              <span class="reward-icon">📖</span>
              <span class="reward-name">解锁章节</span>
              <span class="reward-value">{{ selectedQuest.rewards.unlockChapter }}</span>
            </div>
            <div class="reward-item-large" v-if="selectedQuest.rewards.unlockQuest?.length">
              <span class="reward-icon">✨</span>
              <span class="reward-name">解锁任务</span>
              <span class="reward-value">{{ selectedQuest.rewards.unlockQuest.length }}个</span>
            </div>
          </div>
        </div>

        <div class="quest-detail-section" v-if="selectedQuest.unlockConditions?.length">
          <h3 class="section-title">
            <span>🔓</span>
            <span>解锁条件</span>
          </h3>
          <div class="conditions-list">
            <div 
              v-for="(condition, index) in selectedQuest.unlockConditions" 
              :key="index"
              class="condition-item"
            >
              <span class="condition-icon">{{ getConditionIcon(condition.type) }}</span>
              <span class="condition-text">{{ getConditionText(condition) }}</span>
            </div>
          </div>
        </div>

        <div class="quest-progress-section">
          <div class="progress-info">
            <span class="progress-label">总进度</span>
            <span class="progress-value">{{ getQuestProgressPercent(selectedQuest.id) }}%</span>
          </div>
          <div class="progress-bar-large">
            <div 
              class="progress-fill-large"
              :style="{ width: getQuestProgressPercent(selectedQuest.id) + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <div class="quest-detail-footer">
        <button class="btn-secondary" @click="clearSelection">
          关闭
        </button>
        <button 
          v-if="canClaimRewards(selectedQuest.id)"
          class="btn-primary"
          @click="claimRewards(selectedQuest.id)"
        >
          🎉 领取奖励
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()

const selectedQuest = computed(() => {
  if (!gameStore.selectedQuestId) return null
  return gameStore.getQuestById(gameStore.selectedQuestId)
})

const getTypeInfo = (type) => {
  return gameStore.getQuestTypeInfo(type)
}

const getObjectiveProgress = (questId, objectiveId) => {
  return gameStore.getObjectiveProgress(questId, objectiveId)
}

const isObjectiveCompleted = (questId, objectiveId) => {
  const quest = gameStore.getQuestById(questId)
  const objective = quest?.objectives.find(o => o.id === objectiveId)
  if (!objective) return false
  return getObjectiveProgress(questId, objectiveId) >= objective.count
}

const getObjectivePercent = (questId, objectiveId) => {
  const quest = gameStore.getQuestById(questId)
  const objective = quest?.objectives.find(o => o.id === objectiveId)
  if (!objective) return 0
  const current = getObjectiveProgress(questId, objectiveId)
  return Math.min(100, Math.round((current / objective.count) * 100))
}

const getQuestProgressPercent = (questId) => {
  const quest = gameStore.getQuestById(questId)
  if (!quest) return 0
  const progress = gameStore.getQuestProgress(questId)
  let completed = 0
  quest.objectives.forEach(obj => {
    const current = progress.objectives[obj.id]?.current || 0
    if (current >= obj.count) completed++
  })
  return Math.round((completed / quest.objectives.length) * 100)
}

const canClaimRewards = (questId) => {
  const progress = gameStore.getQuestProgress(questId)
  return progress.completed && !progress.claimed
}

const claimRewards = (questId) => {
  gameStore.claimQuestRewards(questId)
}

const clearSelection = () => {
  gameStore.clearSelectedQuest()
}

const getConditionIcon = (type) => {
  const icons = {
    chapter_start: '📖',
    chapter_complete: '✅',
    scene_complete: '🎬',
    place_material: '🎨',
    emotion_reach: '💕',
    combo_trigger: '⚡',
    complete_quest: '🎯',
    find_hidden: '🔍'
  }
  return icons[type] || '📋'
}

const getConditionText = (condition) => {
  const texts = {
    chapter_start: `开始第 ${condition.target.replace('chapter', '')} 章`,
    chapter_complete: `完成第 ${condition.target.replace('chapter', '')} 章`,
    scene_complete: `完成场景 ${condition.target}`,
    place_material: `放置 ${condition.target} 素材 ${condition.count || 1} 次`,
    emotion_reach: `情绪值达到 ${condition.target}`,
    combo_trigger: `触发 ${condition.count || 1} 个组合`,
    complete_quest: `完成任务 ${condition.target}`,
    find_hidden: `发现隐藏对话`
  }
  return texts[condition.type] || condition.type
}
</script>

<style scoped>
.quest-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
}

.quest-detail-modal {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.5);
  animation: modalSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.quest-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #fdf2f8 0%, #f5f3ff 100%);
  position: relative;
}

.quest-detail-header.quest-type-main { background: linear-gradient(135deg, #fdf2f8 0%, #ffe4e6 100%); }
.quest-detail-header.quest-type-side { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); }
.quest-detail-header.quest-type-collect { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); }
.quest-detail-header.quest-type-milestone { background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); }
.quest-detail-header.quest-type-achievement { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }

.quest-type-large {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-icon-large {
  font-size: 1.4rem;
}

.type-name-large {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.detail-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-secondary);
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-close:hover {
  background: var(--accent-pink);
  color: white;
  transform: rotate(90deg);
}

.quest-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.quest-title-section {
  text-align: center;
  margin-bottom: 16px;
}

.quest-icon-large {
  font-size: 3rem;
  display: block;
  margin-bottom: 8px;
  animation: titleIconFloat 3s ease-in-out infinite;
}

@keyframes titleIconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.quest-title-large {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.quest-description-large {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 24px 0;
  padding: 12px 16px;
  background: var(--bg-primary);
  border-radius: 12px;
  border-left: 3px solid var(--accent-pink);
}

.quest-detail-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.section-title span:first-child {
  font-size: 1.1rem;
}

.objectives-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.objective-item-large {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: var(--bg-primary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.objective-item-large.completed {
  background: rgba(16, 185, 129, 0.06);
  border-color: rgba(16, 185, 129, 0.3);
}

.objective-status {
  flex-shrink: 0;
}

.status-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: transparent;
  transition: all 0.3s ease;
}

.objective-item-large.completed .status-circle {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.objective-info {
  flex: 1;
  min-width: 0;
}

.objective-text-large {
  margin: 0 0 6px 0;
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.objective-item-large.completed .objective-text-large {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.objective-progress-bar {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.objective-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-pink), var(--accent-purple));
  border-radius: 2px;
  transition: width 0.5s ease;
}

.objective-item-large.completed .objective-progress-fill {
  background: linear-gradient(90deg, #10b981, #059669);
}

.objective-count-large {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.rewards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.reward-item-large {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%);
  border-radius: 12px;
  border: 1px solid #fcd34d;
  transition: all 0.2s ease;
}

.reward-item-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
}

.reward-icon {
  font-size: 1.4rem;
}

.reward-name {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.reward-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: #be185d;
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-primary);
  border-radius: 10px;
}

.condition-icon {
  font-size: 1.1rem;
}

.condition-text {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.quest-progress-section {
  padding: 16px;
  background: var(--bg-primary);
  border-radius: 12px;
  margin-top: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.progress-value {
  font-size: 1.1rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.progress-bar-large {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill-large {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-pink), var(--accent-purple));
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.progress-fill-large::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: progressShine 2s ease-in-out infinite;
}

@keyframes progressShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.quest-detail-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.btn-secondary {
  flex: 1;
  padding: 12px 20px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--bg-primary);
  border-color: var(--accent-pink);
}

.btn-primary {
  flex: 1.5;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: btnPulse 2s ease-in-out infinite;
}

@keyframes btnPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(236, 72, 153, 0); }
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(236, 72, 153, 0.4);
}

@media (max-width: 640px) {
  .quest-detail-overlay {
    padding: 0;
    align-items: stretch;
  }

  .quest-detail-modal {
    max-height: 100vh;
    border-radius: 0;
  }

  .quest-detail-body {
    padding: 16px;
  }

  .rewards-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .quest-detail-footer {
    flex-direction: column;
  }
}
</style>
