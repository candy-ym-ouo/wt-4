<template>
  <div class="challenge-result page-container paper-texture">
    <div class="result-content fade-in">
      <div v-if="result && !result.failed" class="result-success">
        <div class="result-header">
          <div class="result-icon">{{ result.isPerfect ? '👑' : '🎉' }}</div>
          <h1 class="result-title handwriting">
            {{ result.isPerfect ? '完美通关！' : '挑战完成！' }}
          </h1>
          <p class="result-subtitle">{{ challenge?.title }}</p>
        </div>

        <div class="score-card card">
          <div class="score-main">
            <span class="score-label">最终得分</span>
            <span class="score-value handwriting">{{ result.score }}</span>
            <div v-if="playerRank" class="rank-badge">
              🏆 排行榜第 {{ playerRank }} 名
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card card">
            <span class="stat-icon">⏱️</span>
            <span class="stat-value">{{ formatTime(result.timeUsed) }}</span>
            <span class="stat-label">用时</span>
            <span class="stat-detail">
              剩余 {{ formatTime((challenge?.timeLimit || 0) - result.timeUsed) }}
            </span>
          </div>
          <div class="stat-card card">
            <span class="stat-icon">💕</span>
            <span class="stat-value" :class="{ 'reached': result.targetReached }">{{ result.totalEmotion }}</span>
            <span class="stat-label">情绪值</span>
            <span class="stat-detail">
              目标 {{ challenge?.targetEmotion }}
              <span :class="result.targetReached ? 'text-success' : 'text-warning'">
                {{ result.targetReached ? '✓ 达成' : '✗ 未达成' }}
              </span>
            </span>
          </div>
          <div class="stat-card card">
            <span class="stat-icon">🔄</span>
            <span class="stat-value">{{ result.roundsUsed }}</span>
            <span class="stat-label">使用回合</span>
            <span class="stat-detail">
              共 {{ challenge?.maxRounds }} 回合
            </span>
          </div>
          <div class="stat-card card">
            <span class="stat-icon">🎯</span>
            <span class="stat-value">{{ result.triggeredCombos }}/{{ result.totalCombos }}</span>
            <span class="stat-label">组合触发</span>
            <span class="stat-detail">
              {{ result.triggeredCombos >= result.totalCombos ? '✓ 全部触发' : '继续努力' }}
            </span>
          </div>
        </div>

        <div class="score-breakdown card">
          <h2 class="section-title handwriting">📊 得分明细</h2>
          <div class="breakdown-list">
            <div class="breakdown-item">
              <span class="breakdown-label">基础分</span>
              <span class="breakdown-value">+{{ challenge?.scoring.baseScore }}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                时间奖励
                <span class="breakdown-hint">
                  (剩余 {{ formatTime((challenge?.timeLimit || 0) - result.timeUsed) }})
                </span>
              </span>
              <span class="breakdown-value">+{{ timeBonusScore }}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">情绪得分</span>
              <span class="breakdown-value">+{{ emotionScore }}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">
                组合奖励
                <span class="breakdown-hint">({{ result.triggeredCombos }} 个组合)</span>
              </span>
              <span class="breakdown-value">+{{ comboBonusScore }}</span>
            </div>
            <div v-if="result.isPerfect" class="breakdown-item perfect-item">
              <span class="breakdown-label">✨ 完美通关奖励</span>
              <span class="breakdown-value">+{{ challenge?.scoring.perfectBonus }}</span>
            </div>
            <div class="breakdown-total">
              <span class="total-label">总计</span>
              <span class="total-value">{{ result.score }}</span>
            </div>
          </div>
        </div>

        <div v-if="isNewRecord" class="new-record-banner">
          <span class="record-icon">🌟</span>
          <span class="record-text">新纪录！超越了自己的最佳成绩！</span>
        </div>

        <div class="result-actions">
          <button class="btn btn-primary btn-large" @click="retryChallenge">
            🔄 再试一次
          </button>
          <button class="btn btn-secondary btn-large" @click="viewLeaderboard">
            🏆 查看排行榜
          </button>
          <button class="btn btn-ghost btn-large" @click="backToChallenges">
            📋 返回挑战列表
          </button>
        </div>
      </div>

      <div v-else-if="result && result.failed" class="result-fail">
        <div class="result-header">
          <div class="result-icon">⏰</div>
          <h1 class="result-title handwriting">挑战失败</h1>
          <p class="result-subtitle">{{ challenge?.title }}</p>
        </div>

        <div class="fail-reason card">
          <div class="fail-icon">💔</div>
          <h3 class="fail-title">
            {{ result.reason === 'timeout' ? '时间耗尽了' : '回合数用完了' }}
          </h3>
          <p class="fail-desc">
            {{ result.reason === 'timeout' 
              ? '别灰心，下次一定能更快的！' 
              : '合理规划素材使用，挑战更高分数！' }}
          </p>
        </div>

        <div class="result-actions">
          <button class="btn btn-primary btn-large" @click="retryChallenge">
            🔄 重新挑战
          </button>
          <button class="btn btn-ghost btn-large" @click="backToChallenges">
            📋 返回挑战列表
          </button>
        </div>
      </div>

      <div v-else class="no-data card">
        <div class="no-data-icon">📭</div>
        <p class="no-data-text">暂无挑战结果</p>
        <button class="btn btn-primary" @click="backToChallenges">
          返回挑战列表
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChallengeStore } from '../stores/challengeStore'
import { useGameStore } from '../stores/gameStore'

const route = useRoute()
const router = useRouter()
const challengeStore = useChallengeStore()
const gameStore = useGameStore()

const challenge = computed(() => challengeStore.currentChallenge)
const result = computed(() => challengeStore.challengeResult)

const playerRank = computed(() => {
  if (!result.value || result.value.failed) return null
  if (!challenge.value) return null
  return challengeStore.getPlayerRank(challenge.value.id)
})

const isNewRecord = computed(() => {
  if (!result.value || result.value.failed) return false
  if (!challenge.value) return false
  const bestScore = challengeStore.getChallengeBestScore(challenge.value.id)
  return result.value.score >= bestScore && result.value.score > 0
})

const timeBonusScore = computed(() => {
  if (!challenge.value || !result.value) return 0
  const timeRemaining = challenge.value.timeLimit - result.value.timeUsed
  return Math.max(0, timeRemaining * challenge.value.scoring.timeBonusPerSecond)
})

const emotionScore = computed(() => {
  if (!challenge.value || !result.value) return 0
  return Math.max(0, result.value.totalEmotion * challenge.value.scoring.emotionMultiplier)
})

const comboBonusScore = computed(() => {
  if (!challenge.value || !result.value) return 0
  return result.value.triggeredCombos * challenge.value.scoring.comboBonus
})

const formatTime = (seconds) => challengeStore.formatTime(seconds)

const retryChallenge = () => {
  if (challenge.value) {
    challengeStore.startChallenge(challenge.value.id)
    router.push(`/game/${challenge.value.chapterId}`)
  }
}

const viewLeaderboard = () => {
  if (challenge.value) {
    router.push(`/leaderboard/${challenge.value.id}`)
  }
}

const backToChallenges = () => {
  challengeStore.exitChallenge()
  router.push('/challenge-select')
}

onMounted(() => {
  if (!result.value) {
    router.push('/challenge-select')
  }
})
</script>

<style scoped>
.challenge-result {
  min-height: 100vh;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.result-content {
  max-width: 600px;
  width: 100%;
}

.result-header {
  text-align: center;
  margin-bottom: 30px;
}

.result-icon {
  font-size: 4rem;
  margin-bottom: 15px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.result-title {
  font-size: 2.5rem;
  color: var(--accent-purple);
  margin-bottom: 5px;
}

.result-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-style: italic;
}

.score-card {
  text-align: center;
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  border: 3px solid #fbbf24;
  margin-bottom: 25px;
}

.score-main {
  padding: 20px;
}

.score-label {
  display: block;
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.score-value {
  display: block;
  font-size: 4rem;
  color: var(--accent-purple);
  line-height: 1;
  margin-bottom: 10px;
}

.rank-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.stat-card {
  text-align: center;
  padding: 20px 15px;
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  display: block;
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text-primary);
  font-family: var(--font-handwriting);
  margin-bottom: 4px;
}

.stat-value.reached {
  color: #10b981;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-detail {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.text-success {
  color: #10b981;
  font-weight: 600;
}

.text-warning {
  color: #f59e0b;
  font-weight: 600;
}

.score-breakdown {
  margin-bottom: 25px;
}

.section-title {
  font-size: 1.3rem;
  color: var(--text-primary);
  margin-bottom: 15px;
  text-align: center;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f9fafb;
  border-radius: 8px;
}

.breakdown-label {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.breakdown-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-left: 5px;
}

.breakdown-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-purple);
}

.breakdown-item.perfect-item {
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  border: 1px solid #fbbf24;
}

.breakdown-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--accent-purple);
  border-radius: 10px;
  margin-top: 5px;
}

.total-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
}

.total-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  font-family: var(--font-handwriting);
}

.new-record-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  border: 2px solid #fbbf24;
  border-radius: 12px;
  margin-bottom: 25px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
  50% { box-shadow: 0 0 20px 5px rgba(251, 191, 36, 0.2); }
}

.record-icon {
  font-size: 1.5rem;
}

.record-text {
  font-size: 1rem;
  font-weight: 600;
  color: #b45309;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-large {
  width: 100%;
  padding: 14px 24px;
  font-size: 1.05rem;
  justify-content: center;
}

.result-fail .result-title {
  color: #ef4444;
}

.fail-reason {
  text-align: center;
  padding: 40px 20px;
  background: #fef2f2;
  border: 2px solid #fecaca;
  margin-bottom: 30px;
}

.fail-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.fail-title {
  font-size: 1.5rem;
  color: #ef4444;
  margin-bottom: 10px;
}

.fail-desc {
  font-size: 1rem;
  color: var(--text-secondary);
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
  margin-bottom: 20px;
}

.card {
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card {
    padding: 15px 10px;
  }

  .stat-value {
    font-size: 1.4rem;
  }

  .result-title {
    font-size: 2rem;
  }

  .score-value {
    font-size: 3rem;
  }
}
</style>
