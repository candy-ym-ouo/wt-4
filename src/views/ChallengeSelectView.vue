<template>
  <div class="challenge-select page-container paper-texture">
    <div class="header">
      <button class="btn btn-ghost back-btn" @click="goBack">← 返回</button>
      <h1 class="title text-gradient handwriting">限时挑战</h1>
      <p class="subtitle">突破极限，挑战自我</p>
    </div>

    <div class="challenge-stats card">
      <div class="stat-item">
        <span class="stat-icon">🏆</span>
        <span class="stat-value">{{ completedCount }}</span>
        <span class="stat-label">已完成挑战</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">⭐</span>
        <span class="stat-value">{{ totalBestScore }}</span>
        <span class="stat-label">最高总分</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🎯</span>
        <span class="stat-value">{{ perfectCount }}</span>
        <span class="stat-label">完美通关</span>
      </div>
    </div>

    <div class="challenges-grid">
      <div
        v-for="challenge in challenges"
        :key="challenge.id"
        class="challenge-card fade-in"
        :class="{
          'challenge-locked': !isUnlocked(challenge.id),
          'challenge-completed': isCompleted(challenge.id),
          'challenge-perfect': isPerfect(challenge.id)
        }"
        :style="{ background: challenge.background }"
        @click="handleChallengeClick(challenge)"
      >
        <div class="challenge-content">
          <div class="challenge-icon">{{ challenge.icon }}</div>
          <div class="challenge-header">
            <h2 class="challenge-title handwriting">{{ challenge.title }}</h2>
            <span 
              class="difficulty-badge"
              :style="{ 
                background: getDifficultyInfo(challenge.difficulty).bgColor,
                color: getDifficultyInfo(challenge.difficulty).color 
              }"
            >
              {{ getDifficultyInfo(challenge.difficulty).name }}
            </span>
          </div>
          <p class="challenge-subtitle">{{ challenge.subtitle }}</p>
          <p class="challenge-description">{{ challenge.description }}</p>

          <div class="challenge-constraints">
            <div class="constraint-item">
              <span class="constraint-icon">⏱️</span>
              <span class="constraint-text">{{ formatTime(challenge.timeLimit) }}</span>
            </div>
            <div class="constraint-item">
              <span class="constraint-icon">🎯</span>
              <span class="constraint-text">目标 {{ challenge.targetEmotion }} 💕</span>
            </div>
            <div class="constraint-item">
              <span class="constraint-icon">🔄</span>
              <span class="constraint-text">{{ challenge.maxRounds }} 回合</span>
            </div>
          </div>

          <div class="challenge-materials">
            <span class="materials-label">可用素材：</span>
            <div class="material-dots">
              <span
                v-for="matId in challenge.allowedMaterials"
                :key="matId"
                class="material-dot"
                :style="{ background: getMaterialColor(matId) }"
                :title="getMaterialName(matId)"
              ></span>
            </div>
          </div>

          <div v-if="isCompleted(challenge.id)" class="challenge-best">
            <span class="best-label">最高分：</span>
            <span class="best-score">{{ getBestScore(challenge.id) }}</span>
            <span v-if="isPerfect(challenge.id)" class="perfect-tag">✨ 完美</span>
          </div>

          <div v-if="!isUnlocked(challenge.id)" class="challenge-lock-info">
            <div class="lock-icon">🔒</div>
            <p class="lock-text">未解锁</p>
            <div class="unlock-conditions-mini">
              <div
                v-for="(cond, idx) in getUnmetConditions(challenge.id)"
                :key="idx"
                class="condition-mini"
              >
                <span class="condition-dot">⬜</span>
                <span class="condition-text-mini">{{ cond.description }}</span>
              </div>
            </div>
          </div>

          <div v-else class="challenge-actions">
            <button class="btn btn-primary start-btn" @click.stop="startChallenge(challenge.id)">
              ⚡ 开始挑战
            </button>
            <button 
              v-if="isCompleted(challenge.id)" 
              class="btn btn-ghost leaderboard-btn" 
              @click.stop="viewLeaderboard(challenge.id)"
            >
              🏆 排行榜
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showLeaderboardModal" class="modal-overlay" @click.self="showLeaderboardModal = false">
      <div class="modal-content leaderboard-modal slide-up">
        <div class="modal-header">
          <h3 class="handwriting modal-title">🏆 排行榜 - {{ selectedChallengeForLeaderboard?.title }}</h3>
          <button class="icon-btn" @click="showLeaderboardModal = false">✕</button>
        </div>
        <div class="leaderboard-list">
          <div
            v-for="entry in currentLeaderboard"
            :key="entry.rank"
            class="leaderboard-item"
            :class="{ 
              'player-entry': entry.isPlayer,
              'top-1': entry.rank === 1,
              'top-2': entry.rank === 2,
              'top-3': entry.rank === 3
            }"
          >
            <div class="rank-col">
              <span v-if="entry.rank <= 3" class="rank-medal">{{ getMedalEmoji(entry.rank) }}</span>
              <span v-else class="rank-number">{{ entry.rank }}</span>
            </div>
            <div class="player-col">
              <span class="player-name">{{ entry.playerName }}</span>
              <span class="player-details">
                ⏱️ {{ formatTime(entry.timeUsed) }} · 💕 {{ entry.totalEmotion }}
                <span v-if="entry.isPerfect" class="perfect-mini">✨</span>
              </span>
            </div>
            <div class="score-col">
              <span class="score-value">{{ entry.score }}</span>
            </div>
          </div>
          <div v-if="currentLeaderboard.length === 0" class="empty-leaderboard">
            <div class="empty-icon">📭</div>
            <p>暂无排行记录</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChallengeStore } from '../stores/challengeStore'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const challengeStore = useChallengeStore()
const gameStore = useGameStore()

const showLeaderboardModal = ref(false)
const selectedChallengeForLeaderboard = ref(null)

const challenges = computed(() => challengeStore.challenges)

const completedCount = computed(() => {
  return challenges.value.filter(c => challengeStore.isChallengeCompleted(c.id)).length
})

const totalBestScore = computed(() => {
  return challenges.value.reduce((sum, c) => sum + challengeStore.getChallengeBestScore(c.id), 0)
})

const perfectCount = computed(() => {
  return challenges.value.filter(c => {
    const record = challengeStore.challengeRecords[c.id]
    return record?.isPerfect
  }).length
})

const currentLeaderboard = computed(() => {
  if (!selectedChallengeForLeaderboard.value) return []
  return challengeStore.getChallengeLeaderboard(selectedChallengeForLeaderboard.value.id)
})

const isUnlocked = (challengeId) => challengeStore.isChallengeUnlocked(challengeId)
const isCompleted = (challengeId) => challengeStore.isChallengeCompleted(challengeId)
const getBestScore = (challengeId) => challengeStore.getChallengeBestScore(challengeId)
const getDifficultyInfo = (difficulty) => challengeStore.getDifficultyInfo(difficulty)
const formatTime = (seconds) => challengeStore.formatTime(seconds)

const isPerfect = (challengeId) => {
  const record = challengeStore.challengeRecords[challengeId]
  return record?.isPerfect || false
}

const getMaterialColor = (materialId) => {
  const material = gameStore.getMaterialById(materialId)
  return material ? material.color : '#ccc'
}

const getMaterialName = (materialId) => {
  const material = gameStore.getMaterialById(materialId)
  return material ? material.name : ''
}

const getUnmetConditions = (challengeId) => {
  return challengeStore.getUnmetConditions(challengeId, gameStore)
}

const getMedalEmoji = (rank) => {
  const medals = ['🥇', '🥈', '🥉']
  return medals[rank - 1] || ''
}

const handleChallengeClick = (challenge) => {
  if (!isUnlocked(challenge.id)) {
    const unmet = getUnmetConditions(challenge.id)
    if (unmet.length > 0) {
      const messages = unmet.map((c, i) => `${i + 1}. ${c.description}`).join('\n')
      gameStore.showNotification(
        `挑战「${challenge.title}」暂未解锁，还差以下条件：\n${messages}`,
        'warning',
        5000
      )
    }
  }
}

const startChallenge = (challengeId) => {
  const challenge = challenges.value.find(c => c.id === challengeId)
  if (!challenge) return

  if (confirm(`确定要开始挑战「${challenge.title}」吗？\n\n挑战规则：\n• 限时 ${formatTime(challenge.timeLimit)}\n• 目标情绪 ${challenge.targetEmotion} 💕\n• 最多 ${challenge.maxRounds} 回合\n• 限定 ${challenge.allowedMaterials.length} 种素材`)) {
    challengeStore.startChallenge(challengeId)
    router.push(`/game/${challenge.chapterId}`)
  }
}

const viewLeaderboard = (challengeId) => {
  const challenge = challenges.value.find(c => c.id === challengeId)
  selectedChallengeForLeaderboard.value = challenge
  showLeaderboardModal.value = true
}

const goBack = () => {
  router.push('/chapter-select')
}

onMounted(() => {
  challengeStore.initialize(gameStore)
})
</script>

<style scoped>
.challenge-select {
  min-height: 100vh;
  padding-bottom: 40px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding: 30px 0;
  position: relative;
}

.back-btn {
  position: absolute;
  top: 30px;
  left: 0;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  font-style: italic;
}

.challenge-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 40px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--accent-purple);
  font-family: var(--font-handwriting);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.challenge-card {
  border-radius: 16px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.challenge-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}

.challenge-card.challenge-locked {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(30%);
}

.challenge-card.challenge-completed {
  border: 2px solid #10b981;
}

.challenge-card.challenge-perfect {
  border: 2px solid #fbbf24;
  box-shadow: var(--shadow-md), 0 0 20px rgba(251, 191, 36, 0.3);
}

.challenge-content {
  position: relative;
  z-index: 1;
}

.challenge-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.challenge-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.challenge-title {
  font-size: 1.5rem;
  margin: 0;
  color: var(--text-primary);
}

.difficulty-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.challenge-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 10px;
}

.challenge-description {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
  margin-bottom: 15px;
}

.challenge-constraints {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.constraint-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.6);
  padding: 4px 10px;
  border-radius: 10px;
}

.constraint-icon {
  font-size: 1rem;
}

.challenge-materials {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.materials-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.material-dots {
  display: flex;
  gap: 6px;
}

.material-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.challenge-best {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  margin-bottom: 15px;
}

.best-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.best-score {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--accent-purple);
}

.perfect-tag {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: #fef3c7;
  color: #b45309;
  border-radius: 8px;
  font-weight: 600;
}

.challenge-lock-info {
  text-align: center;
  padding: 15px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.lock-icon {
  font-size: 2rem;
  margin-bottom: 5px;
}

.lock-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
  font-weight: 600;
}

.unlock-conditions-mini {
  text-align: left;
}

.condition-mini {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  padding: 3px 0;
}

.condition-dot {
  font-size: 0.7rem;
  flex-shrink: 0;
}

.condition-text-mini {
  line-height: 1.3;
}

.challenge-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.start-btn {
  flex: 1;
  justify-content: center;
}

.leaderboard-btn {
  flex-shrink: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 25px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f3f4f6;
}

.modal-title {
  font-size: 1.5rem;
  color: var(--accent-purple);
  margin: 0;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 5px 10px;
  border-radius: 8px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f3f4f6;
  color: var(--text-primary);
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 15px;
  border-radius: 12px;
  background: #f9fafb;
  transition: all 0.2s;
}

.leaderboard-item:hover {
  background: #f3f4f6;
}

.leaderboard-item.player-entry {
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  border: 2px solid #fbbf24;
}

.leaderboard-item.top-1 {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}

.leaderboard-item.top-2 {
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
}

.leaderboard-item.top-3 {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
}

.rank-col {
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.rank-medal {
  font-size: 1.5rem;
}

.rank-number {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--text-secondary);
}

.player-col {
  flex: 1;
  min-width: 0;
}

.player-name {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.player-details {
  display: block;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.perfect-mini {
  margin-left: 4px;
}

.score-col {
  flex-shrink: 0;
}

.score-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--accent-purple);
  font-family: var(--font-handwriting);
}

.empty-leaderboard {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .challenges-grid {
    grid-template-columns: 1fr;
  }

  .challenge-stats {
    flex-wrap: wrap;
    gap: 20px;
  }

  .stat-item {
    min-width: 80px;
  }

  .header {
    padding: 20px 0;
  }

  .title {
    font-size: 2rem;
  }

  .challenge-actions {
    flex-direction: column;
  }
}
</style>
