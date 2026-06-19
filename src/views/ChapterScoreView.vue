<template>
  <div class="score-view page-container paper-texture">
    <div class="score-content fade-in">
      <div class="score-header">
        <button class="btn btn-ghost back-btn" @click="goBack">← 返回</button>
        <div class="header-center">
          <h1 class="title text-gradient handwriting">{{ chapter?.title }}</h1>
          <p class="subtitle">{{ chapter?.subtitle }} · 评分明细</p>
        </div>
      </div>

      <div v-if="scoreData" class="score-body">
        <div class="score-overview card">
          <div class="overview-icon">📊</div>
          <h2 class="section-title handwriting">总览</h2>
          <div class="overview-stats">
            <div class="overview-stat">
              <span class="overview-stat-value">{{ scoreData.totalEmotion }}</span>
              <span class="overview-stat-label">章节情绪值</span>
            </div>
            <div class="overview-stat">
              <span class="overview-stat-value">{{ scoreData.emotionTarget }}</span>
              <span class="overview-stat-label">目标情绪值</span>
            </div>
            <div class="overview-stat">
              <span class="overview-stat-value" :class="targetReached ? 'reached' : 'missed'">
                {{ targetReached ? '✓' : '✗' }}
              </span>
              <span class="overview-stat-label">目标达成</span>
            </div>
          </div>
          <div class="emotion-progress">
            <div class="emotion-progress-track">
              <div
                class="emotion-progress-fill"
                :style="{ width: emotionProgressPercent + '%' }"
              ></div>
              <div
                class="emotion-progress-target"
                :style="{ left: emotionTargetPercent + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="score-section card">
          <div class="section-header">
            <span class="section-icon">💕</span>
            <h2 class="section-title handwriting">情绪来源</h2>
          </div>
          <div class="emotion-breakdown">
            <div
              v-for="item in emotionBreakdownItems"
              :key="item.type"
              class="breakdown-item"
            >
              <div class="breakdown-left">
                <span class="breakdown-icon">{{ item.icon }}</span>
                <span class="breakdown-label">{{ item.label }}</span>
              </div>
              <div class="breakdown-right">
                <div class="breakdown-bar-wrapper">
                  <div
                    class="breakdown-bar"
                    :style="{ width: item.percent + '%', background: item.color }"
                  ></div>
                </div>
                <span class="breakdown-value">+{{ item.value }}</span>
              </div>
            </div>
          </div>
          <div class="emotion-timeline">
            <h3 class="timeline-title">情绪变化时间线</h3>
            <div class="timeline-list">
              <div
                v-for="(entry, index) in scoreData.log"
                :key="index"
                class="timeline-item"
                :class="'timeline-' + entry.type"
              >
                <div class="timeline-dot" :style="{ background: getLogTypeColor(entry.type) }"></div>
                <div class="timeline-content">
                  <span class="timeline-type">{{ getLogTypeLabel(entry.type) }}</span>
                  <span class="timeline-amount" :style="{ color: getLogTypeColor(entry.type) }">+{{ entry.amount }}</span>
                  <span v-if="entry.text" class="timeline-detail">{{ truncateText(entry.text, 30) }}</span>
                  <span v-if="entry.materialName" class="timeline-detail">{{ entry.materialName }}{{ entry.isPerfect ? ' ✨完美' : '' }}</span>
                  <span v-if="entry.comboName" class="timeline-detail">{{ entry.comboName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="score-section card">
          <div class="section-header">
            <span class="section-icon">🎯</span>
            <h2 class="section-title handwriting">关键选择节点</h2>
          </div>
          <div class="choices-list">
            <div
              v-for="choice in scoreData.materialChoices"
              :key="choice.sceneId + '-' + choice.materialId"
              class="choice-item"
            >
              <div class="choice-left">
                <span class="choice-badge" :class="choice.isOptional ? 'optional' : 'required'">
                  {{ choice.isOptional ? '可选' : '必选' }}
                </span>
                <span class="choice-material">{{ choice.materialName }}</span>
              </div>
              <div class="choice-right">
                <span v-if="choice.isPerfect" class="choice-perfect">✨ 完美放置</span>
                <span v-else class="choice-normal">普通放置</span>
              </div>
            </div>
            <div v-if="scoreData.materialChoices.length === 0" class="empty-hint">
              暂无素材放置记录
            </div>
          </div>
        </div>

        <div class="score-section card">
          <div class="section-header">
            <span class="section-icon">🔮</span>
            <h2 class="section-title handwriting">隐藏分支达成</h2>
            <span class="section-badge">{{ scoreData.triggeredComboCount }} / {{ scoreData.totalComboCount }}</span>
          </div>
          <div class="combo-achievement-list">
            <div
              v-for="combo in scoreData.allCombos"
              :key="combo.id"
              class="combo-achievement-item"
              :class="{ achieved: combo.triggered, locked: !combo.triggered }"
            >
              <div class="combo-left">
                <span class="combo-status-icon">{{ combo.triggered ? '✅' : '🔒' }}</span>
                <div class="combo-info">
                  <span class="combo-name">{{ combo.triggered ? combo.name : '???' }}</span>
                  <span class="combo-desc">{{ combo.triggered ? combo.description : '未解锁的隐藏分支' }}</span>
                </div>
              </div>
              <div class="combo-right">
                <span v-if="combo.triggered" class="combo-bonus">+{{ combo.emotionBonus }} 💕</span>
                <span v-if="combo.hasHiddenDialogue && combo.triggered" class="combo-hidden-tag">隐藏对白</span>
                <span v-if="!combo.triggered" class="combo-hint">
                  需要组合素材
                </span>
              </div>
            </div>
            <div v-if="scoreData.allCombos.length === 0" class="empty-hint">
              本章节暂无隐藏分支
            </div>
          </div>
          <div class="combo-progress-summary">
            <div class="combo-progress-track">
              <div
                class="combo-progress-fill"
                :style="{ width: comboProgressPercent + '%' }"
              ></div>
            </div>
            <span class="combo-progress-text">
              已解锁 {{ scoreData.triggeredComboCount }} / {{ scoreData.totalComboCount }} 个隐藏分支
            </span>
          </div>
        </div>
      </div>

      <div v-else class="no-data card">
        <div class="no-data-icon">📭</div>
        <p class="no-data-text">暂无评分数据</p>
        <p class="no-data-hint">完成章节后将自动生成本章节的评分明细</p>
        <button class="btn btn-primary" @click="goBack">返回章节选择</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const chapterId = computed(() => route.params.chapterId)
const chapter = computed(() => gameStore.getChapterById(chapterId.value))
const scoreData = computed(() => gameStore.getChapterScoreDetail(chapterId.value))

const targetReached = computed(() => {
  if (!scoreData.value) return false
  return scoreData.value.totalEmotion >= scoreData.value.emotionTarget
})

const emotionProgressPercent = computed(() => {
  if (!scoreData.value) return 0
  const max = Math.max(scoreData.value.emotionTarget * 1.5, scoreData.value.totalEmotion, 1)
  return Math.min(100, (scoreData.value.totalEmotion / max) * 100)
})

const emotionTargetPercent = computed(() => {
  if (!scoreData.value) return 0
  const max = Math.max(scoreData.value.emotionTarget * 1.5, scoreData.value.totalEmotion, 1)
  return Math.min(100, (scoreData.value.emotionTarget / max) * 100)
})

const comboProgressPercent = computed(() => {
  if (!scoreData.value || scoreData.value.totalComboCount === 0) return 0
  return (scoreData.value.triggeredComboCount / scoreData.value.totalComboCount) * 100
})

const emotionBreakdownItems = computed(() => {
  if (!scoreData.value) return []
  const bd = scoreData.value.emotionBreakdown
  const total = scoreData.value.totalEmotion || 1
  const items = [
    { type: 'dialogue', label: '剧情对话', icon: '💬', color: '#3b82f6', value: bd.dialogue },
    { type: 'hidden_dialogue', label: '隐藏对白', icon: '🔮', color: '#8b5cf6', value: bd.hidden_dialogue },
    { type: 'material', label: '素材放置', icon: '🎨', color: '#f472b6', value: bd.material },
    { type: 'perfect_bonus', label: '完美加成', icon: '✨', color: '#fbbf24', value: bd.perfect_bonus },
    { type: 'combo', label: '组合加成', icon: '🎁', color: '#10b981', value: bd.combo }
  ]
  return items.map(item => ({
    ...item,
    percent: (item.value / total) * 100
  }))
})

const getLogTypeColor = (type) => {
  const colors = {
    dialogue: '#3b82f6',
    hidden_dialogue: '#8b5cf6',
    material: '#f472b6',
    perfect_bonus: '#fbbf24',
    combo: '#10b981'
  }
  return colors[type] || '#6b7280'
}

const getLogTypeLabel = (type) => {
  const labels = {
    dialogue: '对话',
    hidden_dialogue: '隐藏对白',
    material: '素材',
    perfect_bonus: '完美加成',
    combo: '组合'
  }
  return labels[type] || type
}

const truncateText = (text, maxLen) => {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

const goBack = () => {
  router.push('/chapter-select')
}

onMounted(() => {
  if (!chapter.value) {
    router.push('/chapter-select')
  }
})
</script>

<style scoped>
.score-view {
  min-height: 100vh;
  padding-bottom: 40px;
}

.score-content {
  max-width: 640px;
  margin: 0 auto;
}

.score-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px 0;
}

.back-btn {
  flex-shrink: 0;
  font-size: 1rem;
  padding: 8px 16px;
}

.header-center {
  text-align: center;
  flex: 1;
}

.header-center .title {
  font-size: 2rem;
  margin-bottom: 5px;
}

.subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-style: italic;
}

.card {
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  padding: 24px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.card::before {
  height: 3px;
}

.score-overview {
  text-align: center;
}

.overview-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.overview-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 20px;
}

.overview-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.overview-stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-pink);
  font-family: var(--font-handwriting);
}

.overview-stat-value.reached {
  color: #10b981;
}

.overview-stat-value.missed {
  color: #ef4444;
}

.overview-stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.emotion-progress {
  margin-top: 10px;
}

.emotion-progress-track {
  position: relative;
  height: 10px;
  background: #f3e8ff;
  border-radius: 5px;
  overflow: visible;
}

.emotion-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ec4899, #8b5cf6);
  border-radius: 5px;
  transition: width 0.8s ease;
}

.emotion-progress-target {
  position: absolute;
  top: -3px;
  width: 3px;
  height: 16px;
  background: #fbbf24;
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(251, 191, 36, 0.5);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.section-icon {
  font-size: 1.5rem;
}

.section-title {
  font-size: 1.4rem;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.section-badge {
  font-size: 0.85rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
}

.emotion-breakdown {
  margin-bottom: 25px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.breakdown-item:last-child {
  border-bottom: none;
}

.breakdown-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 120px;
}

.breakdown-icon {
  font-size: 1.2rem;
}

.breakdown-label {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
}

.breakdown-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.breakdown-bar-wrapper {
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.breakdown-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
  min-width: 2px;
}

.breakdown-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 40px;
  text-align: right;
}

.emotion-timeline {
  border-top: 1px solid #f3f4f6;
  padding-top: 20px;
}

.timeline-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 15px;
}

.timeline-list {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 0;
  position: relative;
}

.timeline-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}

.timeline-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.timeline-type {
  font-weight: 500;
  color: var(--text-primary);
}

.timeline-amount {
  font-weight: 700;
}

.timeline-detail {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.choice-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
}

.choice-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.choice-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
  text-transform: uppercase;
}

.choice-badge.required {
  background: #fef3c7;
  color: #92400e;
}

.choice-badge.optional {
  background: #ede9fe;
  color: #5b21b6;
}

.choice-material {
  font-weight: 500;
  color: var(--text-primary);
}

.choice-right {
  display: flex;
  align-items: center;
}

.choice-perfect {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fbbf24;
}

.choice-normal {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.combo-achievement-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.combo-achievement-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.combo-achievement-item.achieved {
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1px solid #bbf7d0;
}

.combo-achievement-item.locked {
  background: #f9fafb;
  border: 1px dashed #e5e7eb;
  opacity: 0.75;
}

.combo-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.combo-status-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.combo-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.combo-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.combo-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.combo-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.combo-bonus {
  font-size: 0.85rem;
  font-weight: 600;
  color: #10b981;
}

.combo-hidden-tag {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: #ede9fe;
  color: #7c3aed;
  border-radius: 10px;
  font-weight: 500;
}

.combo-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
}

.combo-progress-summary {
  padding-top: 15px;
  border-top: 1px solid #f3f4f6;
}

.combo-progress-track {
  height: 8px;
  background: #f3e8ff;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.combo-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ec4899, #8b5cf6);
  border-radius: 4px;
  transition: width 0.8s ease;
}

.combo-progress-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
  display: block;
}

.empty-hint {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.no-data {
  text-align: center;
  padding: 60px 30px;
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.no-data-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.no-data-hint {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 25px;
}

@media (max-width: 768px) {
  .score-header {
    flex-direction: column;
    text-align: center;
  }

  .overview-stats {
    gap: 20px;
  }

  .overview-stat-value {
    font-size: 1.5rem;
  }

  .breakdown-left {
    min-width: 90px;
  }

  .combo-achievement-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .combo-right {
    align-self: flex-end;
  }

  .choice-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
