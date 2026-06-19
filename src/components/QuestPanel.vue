<template>
  <div class="quest-panel-overlay" v-if="showQuestPanel" @click.self="closeQuestPanel">
    <div class="quest-panel">
      <div class="quest-panel-header">
        <div class="quest-panel-title-row">
          <span class="quest-panel-icon">📜</span>
          <h2 class="quest-panel-title">任务委托</h2>
        </div>
        <button class="quest-panel-close" @click="closeQuestPanel">
          <span>✕</span>
        </button>
      </div>

      <div class="quest-stats">
        <div class="quest-stat-item">
          <span class="stat-icon">📖</span>
          <span class="stat-value">{{ stats.mainCompleted }}/{{ stats.mainTotal }}</span>
          <span class="stat-label">主线</span>
        </div>
        <div class="quest-stat-item">
          <span class="stat-icon">✨</span>
          <span class="stat-value">{{ stats.sideCompleted }}/{{ stats.sideTotal }}</span>
          <span class="stat-label">支线</span>
        </div>
        <div class="quest-stat-item">
          <span class="stat-icon">🎯</span>
          <span class="stat-value">{{ stats.collectCompleted }}/{{ stats.collectTotal }}</span>
          <span class="stat-label">收集</span>
        </div>
        <div class="quest-stat-item">
          <span class="stat-icon">🏆</span>
          <span class="stat-value">{{ stats.milestoneCompleted }}/{{ stats.milestoneTotal }}</span>
          <span class="stat-label">里程碑</span>
        </div>
      </div>

      <div class="quest-tabs">
        <button 
          class="quest-tab" 
          :class="{ active: activeTab === 'active' }"
          @click="activeTab = 'active'"
        >
          <span>进行中</span>
          <span class="tab-badge" v-if="activeQuests.length > 0">{{ activeQuests.length }}</span>
        </button>
        <button 
          class="quest-tab" 
          :class="{ active: activeTab === 'completed' }"
          @click="activeTab = 'completed'"
        >
          <span>已完成</span>
          <span class="tab-badge" v-if="completedQuests.length > 0">{{ completedQuests.length }}</span>
        </button>
      </div>

      <div class="quest-list-container">
        <div class="quest-list" v-if="activeTab === 'active'">
          <div 
            v-for="quest in activeQuests" 
            :key="quest.id"
            class="quest-card"
            :class="'quest-type-' + quest.type"
            @click="selectQuest(quest.id)"
          >
            <div class="quest-card-header">
              <div class="quest-type-badge">
                <span class="type-icon">{{ getTypeInfo(quest.type).icon }}</span>
                <span class="type-name">{{ getTypeInfo(quest.type).name }}</span>
              </div>
              <div class="quest-priority" v-if="quest.priority <= 2">
                <span>⭐</span>
              </div>
            </div>
            
            <div class="quest-card-body">
              <h3 class="quest-title">{{ quest.icon }} {{ quest.title }}</h3>
              <p class="quest-description">{{ quest.description }}</p>
              
              <div class="quest-objectives">
                <div 
                  v-for="obj in quest.objectives" 
                  :key="obj.id"
                  class="quest-objective"
                  :class="{ completed: isObjectiveCompleted(quest.id, obj.id) }"
                >
                  <span class="objective-check">
                    {{ isObjectiveCompleted(quest.id, obj.id) ? '✓' : '○' }}
                  </span>
                  <span class="objective-text">{{ obj.description }}</span>
                  <span class="objective-count">
                    {{ getObjectiveProgress(quest.id, obj.id) }}/{{ obj.count }}
                  </span>
                </div>
              </div>

              <div class="quest-progress-bar">
                <div 
                  class="quest-progress-fill"
                  :style="{ width: getQuestProgressPercent(quest.id) + '%' }"
                ></div>
              </div>
            </div>

            <div class="quest-card-footer">
              <div class="quest-rewards">
                <span class="rewards-label">奖励:</span>
                <span class="reward-item" v-if="quest.rewards.emotion">💕 {{ quest.rewards.emotion }}</span>
                <span class="reward-item" v-if="quest.rewards.materials?.length">📦 {{ quest.rewards.materials.length }}个素材</span>
                <span class="reward-item" v-if="quest.rewards.affinity">❤️ 好感度</span>
              </div>
              <button 
                v-if="canClaimRewards(quest.id)"
                class="claim-btn"
                @click.stop="claimRewards(quest.id)"
              >
                领取奖励
              </button>
            </div>
          </div>

          <div class="empty-state" v-if="activeQuests.length === 0">
            <span class="empty-icon">📭</span>
            <p class="empty-text">暂无进行中的任务</p>
            <p class="empty-hint">继续探索故事，解锁更多委托吧！</p>
          </div>
        </div>

        <div class="quest-list" v-else>
          <div 
            v-for="quest in completedQuests" 
            :key="quest.id"
            class="quest-card quest-completed"
            :class="'quest-type-' + quest.type"
          >
            <div class="quest-card-header">
              <div class="quest-type-badge">
                <span class="type-icon">{{ getTypeInfo(quest.type).icon }}</span>
                <span class="type-name">{{ getTypeInfo(quest.type).name }}</span>
              </div>
              <div class="quest-completed-badge">
                <span>✓ 已完成</span>
              </div>
            </div>
            
            <div class="quest-card-body">
              <h3 class="quest-title">{{ quest.icon }} {{ quest.title }}</h3>
              <p class="quest-description">{{ quest.description }}</p>
              
              <div class="quest-rewards">
                <span class="rewards-label">已获得:</span>
                <span class="reward-item" v-if="quest.rewards.emotion">💕 {{ quest.rewards.emotion }}</span>
                <span class="reward-item" v-if="quest.rewards.materials?.length">📦 {{ quest.rewards.materials.length }}个素材</span>
                <span class="reward-item" v-if="quest.rewards.affinity">❤️ 好感度</span>
              </div>
            </div>
          </div>

          <div class="empty-state" v-if="completedQuests.length === 0">
            <span class="empty-icon">🌱</span>
            <p class="empty-text">还没有完成任何任务</p>
            <p class="empty-hint">开始你的冒险吧！</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()
const activeTab = ref('active')

const showQuestPanel = computed(() => gameStore.showQuestPanel)
const activeQuests = computed(() => gameStore.sortedActiveQuests)
const completedQuests = computed(() => gameStore.sortedCompletedQuests)
const stats = computed(() => gameStore.questCompletionStats)

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

const selectQuest = (questId) => {
  gameStore.selectQuest(questId)
}

const closeQuestPanel = () => {
  gameStore.closeQuestPanel()
}
</script>

<style scoped>
.quest-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.quest-panel {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  animation: panelSlideIn 0.3s ease;
}

@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.quest-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, #fdf2f8 0%, #f5f3ff 100%);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.quest-panel-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quest-panel-icon {
  font-size: 1.6rem;
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.quest-panel-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.quest-panel-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(236, 72, 153, 0.1);
  color: var(--accent-pink);
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quest-panel-close:hover {
  background: var(--accent-pink);
  color: white;
  transform: rotate(90deg);
}

.quest-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 16px 24px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

.quest-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.quest-stat-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  font-size: 1.2rem;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.quest-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.quest-tab {
  flex: 1;
  padding: 14px 20px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.quest-tab:hover {
  color: var(--accent-pink);
}

.quest-tab.active {
  color: var(--accent-pink);
  border-bottom-color: var(--accent-pink);
}

.tab-badge {
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(236, 72, 153, 0.15);
  color: var(--accent-pink);
  font-size: 0.75rem;
  font-weight: 600;
}

.quest-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: var(--bg-primary);
  border-radius: 0 0 var(--border-radius) var(--border-radius);
}

.quest-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quest-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.quest-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.quest-card.quest-type-main {
  border-left: 4px solid #ec4899;
}

.quest-card.quest-type-side {
  border-left: 4px solid #8b5cf6;
}

.quest-card.quest-type-collect {
  border-left: 4px solid #f59e0b;
}

.quest-card.quest-type-milestone {
  border-left: 4px solid #06b6d4;
}

.quest-card.quest-type-achievement {
  border-left: 4px solid #10b981;
}

.quest-card.quest-completed {
  opacity: 0.8;
}

.quest-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid var(--border-color);
}

.quest-type-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.quest-type-main .quest-type-badge {
  background: rgba(236, 72, 153, 0.1);
  color: #ec4899;
}

.quest-type-side .quest-type-badge {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.quest-type-collect .quest-type-badge {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.quest-type-milestone .quest-type-badge {
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
}

.quest-type-achievement .quest-type-badge {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.type-icon {
  font-size: 0.9rem;
}

.quest-priority {
  animation: priorityPulse 1.5s ease-in-out infinite;
}

@keyframes priorityPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.quest-completed-badge {
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  font-size: 0.75rem;
  font-weight: 600;
}

.quest-card-body {
  padding: 14px 16px;
}

.quest-title {
  margin: 0 0 6px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.quest-description {
  margin: 0 0 12px 0;
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.quest-objectives {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.quest-objective {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-primary);
  border-radius: 8px;
  font-size: 0.82rem;
  transition: all 0.2s ease;
}

.quest-objective.completed {
  background: rgba(16, 185, 129, 0.08);
}

.objective-check {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.quest-objective.completed .objective-check {
  background: #10b981;
  color: white;
}

.objective-text {
  flex: 1;
  color: var(--text-primary);
}

.quest-objective.completed .objective-text {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.objective-count {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.quest-progress-bar {
  height: 4px;
  background: var(--bg-primary);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.quest-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-pink), var(--accent-purple));
  border-radius: 2px;
  transition: width 0.5s ease;
}

.quest-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid var(--border-color);
}

.quest-rewards {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.rewards-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.reward-item {
  padding: 3px 8px;
  border-radius: 8px;
  background: var(--bg-primary);
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-primary);
}

.claim-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--accent-pink), var(--accent-purple));
  color: white;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: claimPulse 2s ease-in-out infinite;
}

@keyframes claimPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(236, 72, 153, 0); }
}

.claim-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .quest-panel-overlay {
    padding: 0;
    align-items: stretch;
  }

  .quest-panel {
    max-height: 100vh;
    border-radius: 0;
  }

  .quest-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 12px 16px;
  }

  .quest-list-container {
    padding: 12px 16px;
  }

  .quest-panel-header {
    padding: 16px 20px;
  }

  .quest-tabs {
    padding: 0 16px;
  }
}
</style>
