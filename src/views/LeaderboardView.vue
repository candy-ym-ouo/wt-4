<template>
  <div class="leaderboard-view page-container paper-texture">
    <div class="leaderboard-content fade-in">
      <div class="page-header">
        <button class="btn btn-ghost back-btn" @click="goBack">← 返回</button>
        <h1 class="title handwriting text-gradient">🏆 排行榜</h1>
        <p class="subtitle">谁是最强手账大师？</p>
      </div>

      <div class="challenge-tabs">
        <div
          v-for="challenge in unlockedChallenges"
          :key="challenge.id"
          class="tab-item"
          :class="{ active: selectedChallengeId === challenge.id }"
          :style="{ '--tab-color': getDifficultyInfo(challenge.difficulty).color }"
          @click="selectChallenge(challenge.id)"
        >
          <span class="tab-icon">{{ challenge.icon }}</span>
          <span class="tab-title">{{ challenge.title }}</span>
        </div>
      </div>

      <div v-if="selectedChallenge" class="leaderboard-card card">
        <div class="leaderboard-header">
          <div class="challenge-info">
            <span class="challenge-icon">{{ selectedChallenge.icon }}</span>
            <div>
              <h2 class="challenge-title handwriting">{{ selectedChallenge.title }}</h2>
              <p class="challenge-subtitle">{{ selectedChallenge.subtitle }}</p>
            </div>
          </div>
          <div class="challenge-stats-mini">
            <span class="mini-stat">⏱️ {{ formatTime(selectedChallenge.timeLimit) }}</span>
            <span class="mini-stat">🎯 {{ selectedChallenge.targetEmotion }} 💕</span>
          </div>
        </div>

        <div class="podium-section">
          <div
            v-for="entry in topThree"
            :key="'podium-' + entry.rank"
            class="podium-item"
            :class="'rank-' + entry.rank"
          >
            <div class="podium-rank">
              <span class="podium-medal">{{ getMedalEmoji(entry.rank) }}</span>
            </div>
            <div class="podium-player">
              <span class="podium-name">{{ entry.playerName }}</span>
              <span v-if="entry.isPlayer" class="player-tag">你</span>
            </div>
            <div class="podium-score handwriting">{{ entry.score }}</div>
            <div class="podium-details">
              ⏱️ {{ formatTime(entry.timeUsed) }} · 💕 {{ entry.totalEmotion }}
            </div>
            <div 
              class="podium-stand"
              :style="{ height: getPodiumHeight(entry.rank) + 'px' }"
            >
              <span class="podium-rank-number">{{ entry.rank }}</span>
            </div>
          </div>
        </div>

        <div class="leaderboard-list">
          <div
            v-for="entry in restOfLeaderboard"
            :key="entry.rank"
            class="leaderboard-item"
            :class="{ 'player-entry': entry.isPlayer }"
          >
            <div class="rank-col">
              <span class="rank-number">{{ entry.rank }}</span>
            </div>
            <div class="player-col">
              <div class="player-info">
                <span class="player-name">{{ entry.playerName }}</span>
                <span v-if="entry.isPlayer" class="player-badge">这是你</span>
                <span v-if="entry.isPerfect" class="perfect-badge">✨ 完美</span>
              </div>
              <div class="player-stats">
                <span class="stat-pill">⏱️ {{ formatTime(entry.timeUsed) }}</span>
                <span class="stat-pill">💕 {{ entry.totalEmotion }}</span>
              </div>
            </div>
            <div class="score-col">
              <span class="score-value handwriting">{{ entry.score }}</span>
            </div>
          </div>
        </div>

        <div v-if="currentLeaderboard.length === 0" class="empty-leaderboard">
          <div class="empty-icon">📭</div>
          <p class="empty-text">暂无排行记录</p>
          <p class="empty-hint">成为第一个上榜的人吧！</p>
          <button class="btn btn-primary" @click="goToChallenge">
            ⚡ 立即挑战
          </button>
        </div>

        <div v-if="playerEntry" class="player-highlight card">
          <div class="highlight-label">我的最佳成绩</div>
          <div class="highlight-content">
            <div class="highlight-rank">
              <span class="highlight-rank-number">#{{ playerEntry.rank }}</span>
              <span class="highlight-rank-label">排名</span>
            </div>
            <div class="highlight-score">
              <span class="highlight-score-value handwriting">{{ playerEntry.score }}</span>
              <span class="highlight-score-label">得分</span>
            </div>
            <div class="highlight-stats">
              <div class="highlight-stat">
                <span class="highlight-stat-value">{{ formatTime(playerEntry.timeUsed) }}</span>
                <span class="highlight-stat-label">用时</span>
              </div>
              <div class="highlight-stat">
                <span class="highlight-stat-value">{{ playerEntry.totalEmotion }}</span>
                <span class="highlight-stat-label">情绪值</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChallengeStore } from '../stores/challengeStore'
import { useGameStore } from '../stores/gameStore'

const route = useRoute()
const router = useRouter()
const challengeStore = useChallengeStore()
const gameStore = useGameStore()

const selectedChallengeId = ref(null)

const unlockedChallenges = computed(() => {
  return challengeStore.challenges.filter(c => challengeStore.isChallengeUnlocked(c.id))
})

const selectedChallenge = computed(() => {
  if (!selectedChallengeId.value) return null
  return challengeStore.challenges.find(c => c.id === selectedChallengeId.value) || null
})

const currentLeaderboard = computed(() => {
  if (!selectedChallengeId.value) return []
  return challengeStore.getChallengeLeaderboard(selectedChallengeId.value)
})

const topThree = computed(() => {
  return currentLeaderboard.value.slice(0, 3)
})

const restOfLeaderboard = computed(() => {
  return currentLeaderboard.value.slice(3)
})

const playerEntry = computed(() => {
  return currentLeaderboard.value.find(e => e.isPlayer)
})

const getDifficultyInfo = (difficulty) => challengeStore.getDifficultyInfo(difficulty)
const formatTime = (seconds) => challengeStore.formatTime(seconds)

const getMedalEmoji = (rank) => {
  const medals = ['🥇', '🥈', '🥉']
  return medals[rank - 1] || ''
}

const getPodiumHeight = (rank) => {
  const heights = [120, 90, 70]
  return heights[rank - 1] || 50
}

const selectChallenge = (challengeId) => {
  selectedChallengeId.value = challengeId
}

const goBack = () => {
  router.push('/challenge-select')
}

const goToChallenge = () => {
  if (selectedChallenge.value) {
    challengeStore.startChallenge(selectedChallenge.value.id)
    router.push(`/game/${selectedChallenge.value.chapterId}`)
  }
}

onMounted(() => {
  challengeStore.initialize(gameStore)
  const challengeId = route.params.challengeId || route.query.challengeId
  if (challengeId) {
    selectedChallengeId.value = challengeId
  } else if (unlockedChallenges.value.length > 0) {
    selectedChallengeId.value = unlockedChallenges.value[0].id
  }
})
</script>

<style scoped>
.leaderboard-view {
  min-height: 100vh;
  padding-bottom: 40px;
}

.leaderboard-content {
  max-width: 700px;
  margin: 0 auto;
}

.page-header {
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

.challenge-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
  margin-bottom: 25px;
  -webkit-overflow-scrolling: touch;
}

.tab-item {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-item:hover {
  background: var(--bg-primary);
  transform: translateY(-2px);
}

.tab-item.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
  border-color: var(--tab-color, var(--accent-purple));
}

.tab-icon {
  font-size: 1.3rem;
}

.tab-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.leaderboard-card {
  margin-bottom: 20px;
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f3f4f6;
}

.challenge-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.challenge-icon {
  font-size: 2.5rem;
}

.challenge-title {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0 0 3px 0;
}

.challenge-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
}

.challenge-stats-mini {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.mini-stat {
  font-size: 0.8rem;
  color: var(--text-secondary);
  background: #f3f4f6;
  padding: 3px 10px;
  border-radius: 8px;
}

.podium-section {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px 0;
}

.podium-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.podium-item.rank-1 {
  order: 2;
}

.podium-item.rank-2 {
  order: 1;
}

.podium-item.rank-3 {
  order: 3;
}

.podium-rank {
  position: relative;
}

.podium-medal {
  font-size: 2.5rem;
}

.podium-player {
  display: flex;
  align-items: center;
  gap: 5px;
}

.podium-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.player-tag {
  font-size: 0.65rem;
  padding: 1px 6px;
  background: #fbbf24;
  color: white;
  border-radius: 6px;
  font-weight: 600;
}

.podium-score {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--accent-purple);
}

.podium-details {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.podium-stand {
  width: 70px;
  background: linear-gradient(180deg, #e9d5ff, #c4b5fd);
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8px;
  position: relative;
}

.podium-item.rank-1 .podium-stand {
  background: linear-gradient(180deg, #fde68a, #fbbf24);
}

.podium-item.rank-2 .podium-stand {
  background: linear-gradient(180deg, #e5e7eb, #9ca3af);
}

.podium-item.rank-3 .podium-stand {
  background: linear-gradient(180deg, #fed7aa, #f97316);
}

.podium-rank-number {
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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
  padding: 14px 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s;
}

.leaderboard-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.leaderboard-item.player-entry {
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  border: 2px solid #fbbf24;
}

.rank-col {
  width: 36px;
  text-align: center;
  flex-shrink: 0;
}

.rank-number {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--text-secondary);
}

.player-col {
  flex: 1;
  min-width: 0;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.player-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.player-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: #fbbf24;
  color: white;
  border-radius: 10px;
  font-weight: 600;
}

.perfect-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: #10b981;
  color: white;
  border-radius: 10px;
  font-weight: 600;
}

.player-stats {
  display: flex;
  gap: 8px;
}

.stat-pill {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: #e5e7eb;
  color: var(--text-secondary);
  border-radius: 8px;
}

.score-col {
  flex-shrink: 0;
}

.score-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--accent-purple);
}

.empty-leaderboard {
  text-align: center;
  padding: 50px 20px;
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-text {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 5px;
}

.empty-hint {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.player-highlight {
  margin-top: 25px;
  background: linear-gradient(135deg, #fef3c7, #fce7f3);
  border: 2px solid #fbbf24;
}

.highlight-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #b45309;
  margin-bottom: 15px;
  text-align: center;
}

.highlight-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 20px;
}

.highlight-rank,
.highlight-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.highlight-rank-number {
  font-size: 2rem;
  font-weight: bold;
  color: #f59e0b;
}

.highlight-rank-label,
.highlight-score-label,
.highlight-stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.highlight-score-value {
  font-size: 2rem;
  color: var(--accent-purple);
}

.highlight-stats {
  display: flex;
  gap: 20px;
}

.highlight-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.highlight-stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
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
  .podium-section {
    gap: 8px;
  }

  .podium-stand {
    width: 55px;
  }

  .podium-medal {
    font-size: 2rem;
  }

  .podium-score {
    font-size: 1.2rem;
  }

  .highlight-content {
    flex-wrap: wrap;
  }

  .challenge-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .challenge-stats-mini {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .title {
    font-size: 2rem;
  }
}
</style>
