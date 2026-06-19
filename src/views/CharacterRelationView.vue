<template>
  <div class="character-relation page-container paper-texture">
    <div class="header">
      <h1 class="title text-gradient">角色关系</h1>
      <p class="subtitle">每一段羁绊，都是故事的一部分</p>
    </div>

    <div class="characters-grid">
      <div
        v-for="char in affinitySummary"
        :key="char.id"
        class="character-card fade-in"
        :style="{ borderColor: char.color }"
      >
        <div class="card-header" :style="{ background: char.gradient }">
          <div class="character-icon">{{ char.icon }}</div>
          <div class="character-identity">
            <h2 class="character-name handwriting">{{ char.name }}</h2>
            <p class="character-title">{{ char.title }}</p>
          </div>
          <div class="affinity-badge" :style="{ background: char.color }">
            <span class="affinity-value">{{ char.affinity }}</span>
            <span class="affinity-label">好感</span>
          </div>
        </div>

        <div class="card-body">
          <p class="character-desc">{{ char.description }}</p>

          <div class="affinity-tier-section">
            <div class="tier-display" :style="{ color: char.tierColor }">
              <span class="tier-icon">{{ char.tierIcon }}</span>
              <span class="tier-name">{{ char.tier }}</span>
            </div>
            <div class="affinity-bar-wrapper">
              <div class="affinity-bar">
                <div
                  class="affinity-fill"
                  :style="{
                    width: char.affinity + '%',
                    background: `linear-gradient(90deg, ${char.color}88, ${char.color})`
                  }"
                ></div>
              </div>
              <div class="affinity-markers">
                <span
                  v-for="tier in getCharacterTiers(char.id)"
                  :key="tier.id"
                  class="marker"
                  :class="{ active: char.affinity >= tier.min }"
                  :style="{ left: tier.min + '%', borderColor: char.affinity >= tier.min ? char.color : '#e5e7eb' }"
                  :title="tier.name"
                ></span>
              </div>
            </div>
          </div>

          <div class="character-traits">
            <span class="trait-label">性格</span>
            <span class="trait-text">{{ char.personality }}</span>
          </div>

          <div class="exclusive-section">
            <div class="section-header">
              <span class="section-icon">💬</span>
              <span class="section-title">专属对话</span>
              <span class="section-count">{{ char.unlockedDialogueTiers }}/{{ char.totalDialogueTiers }}</span>
            </div>
            <div class="dialogue-tiers">
              <div
                v-for="tier in getCharacterTiers(char.id)"
                :key="tier.id"
                class="dialogue-tier-item"
                :class="{ unlocked: isDialogueTierUnlocked(char.id, tier.min), locked: !isDialogueTierUnlocked(char.id, tier.min) }"
              >
                <span class="tier-check">{{ isDialogueTierUnlocked(char.id, tier.min) ? '✅' : '🔒' }}</span>
                <span class="tier-text">
                  {{ isDialogueTierUnlocked(char.id, tier.min) ? getDialoguePreview(char.id, tier.min) : `好感度 ${tier.min} 解锁` }}
                </span>
              </div>
            </div>
          </div>

          <div class="chapter-unlock-section">
            <div class="section-header">
              <span class="section-icon">📖</span>
              <span class="section-title">隐藏章节</span>
            </div>
            <div class="chapter-unlock-info" :class="{ unlocked: char.isChapterUnlocked, locked: !char.isChapterUnlocked }">
              <span class="chapter-status">{{ char.isChapterUnlocked ? '✅ 已解锁' : '🔒 未解锁' }}</span>
              <span class="chapter-name">{{ char.chapterName || '???' }}</span>
              <span v-if="!char.isChapterUnlocked" class="chapter-hint">
                好感度达到 {{ getChapterUnlockAffinity(char.id) }} 即可解锁
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="relation-map">
      <h3 class="handwriting section-main-title">💕 关系全景</h3>
      <div class="relation-visual">
        <div class="relation-center">
          <div class="center-node">你</div>
        </div>
        <div
          v-for="(char, index) in affinitySummary"
          :key="char.id"
          class="relation-node"
          :style="getNodeStyle(index, char)"
        >
          <div class="node-icon" :style="{ background: char.color }">{{ char.icon }}</div>
          <div class="node-label">{{ char.name }}</div>
          <div class="node-affinity">{{ char.affinity }}</div>
          <div class="relation-line" :style="getLineStyle(index, char)"></div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-ghost" @click="goBack">← 返回</button>
    </div>

    <Transition name="notification">
      <div v-if="notification" class="notification-wrapper">
        <div class="notification slide-down" :class="'notification-' + notification.type">
          {{ notification.message }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const affinitySummary = computed(() => gameStore.getAffinitySummary())
const notification = computed(() => gameStore.notification)

const getCharacterTiers = (characterId) => {
  const char = gameStore.characterRegistry.find(c => c.id === characterId)
  return char?.affinityTiers || []
}

const isDialogueTierUnlocked = (characterId, tierMin) => {
  const key = `${characterId}_${tierMin}`
  return !!gameStore.exclusiveDialogueUnlocked[key]
}

const getDialoguePreview = (characterId, tierMin) => {
  const dialogues = gameStore.characterExclusiveDialogues[characterId]?.[tierMin]
  if (!dialogues || dialogues.length === 0) return '???'
  return dialogues[0].text.slice(0, 30) + '...'
}

const getChapterUnlockAffinity = (characterId) => {
  const char = gameStore.characterRegistry.find(c => c.id === characterId)
  return char?.chapterUnlock?.minAffinity || 60
}

const getNodeStyle = (index, char) => {
  const angles = [-90, 30, 150]
  const angle = angles[index % 3]
  const radius = 140
  const x = Math.cos((angle * Math.PI) / 180) * radius
  const y = Math.sin((angle * Math.PI) / 180) * radius
  return {
    transform: `translate(${x}px, ${y}px)`,
    '--node-color': char.color
  }
}

const getLineStyle = (index, char) => {
  const angles = [-90, 30, 150]
  const angle = angles[index % 3]
  const radius = 70
  const x = Math.cos((angle * Math.PI) / 180) * radius
  const y = Math.sin((angle * Math.PI) / 180) * radius
  const length = Math.sqrt(x * x + y * y)
  const lineAngle = Math.atan2(y, x) * (180 / Math.PI)
  return {
    width: length + 'px',
    transform: `rotate(${lineAngle}deg)`,
    background: `linear-gradient(90deg, ${char.color}44, ${char.color}aa)`,
    transformOrigin: '0 50%'
  }
}

const goBack = () => {
  router.push('/chapter-select')
}

onMounted(() => {
  gameStore.isInitialized = true
})
</script>

<style scoped>
.character-relation {
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px 0;
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.character-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  background: white;
}

.character-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.card-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
}

.character-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  backdrop-filter: blur(5px);
  flex-shrink: 0;
}

.character-identity {
  flex: 1;
}

.character-name {
  font-size: 1.8rem;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.character-title {
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 2px;
}

.affinity-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 14px;
  border-radius: 16px;
  color: white;
  font-weight: 700;
  flex-shrink: 0;
}

.affinity-value {
  font-size: 1.4rem;
  line-height: 1;
}

.affinity-label {
  font-size: 0.7rem;
  opacity: 0.85;
  margin-top: 2px;
}

.card-body {
  padding: 20px;
}

.character-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.affinity-tier-section {
  margin-bottom: 16px;
}

.tier-display {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-weight: 700;
  font-size: 1.1rem;
}

.tier-icon {
  font-size: 1.3rem;
}

.affinity-bar-wrapper {
  position: relative;
}

.affinity-bar {
  width: 100%;
  height: 10px;
  background: #f3f4f6;
  border-radius: 5px;
  overflow: hidden;
}

.affinity-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.affinity-markers {
  position: relative;
  height: 0;
}

.marker {
  position: absolute;
  top: -14px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  border: 2px solid #e5e7eb;
  transform: translateX(-50%);
  transition: all 0.3s ease;
}

.marker.active {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.character-traits {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.trait-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.trait-text {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.exclusive-section,
.chapter-unlock-section {
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.section-icon {
  font-size: 1rem;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.section-count {
  font-size: 0.8rem;
  color: var(--accent-purple);
  font-weight: 600;
  padding: 2px 8px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 10px;
}

.dialogue-tiers {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialogue-tier-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.82rem;
}

.dialogue-tier-item.unlocked {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
}

.dialogue-tier-item.locked {
  background: #f9fafb;
  color: var(--text-secondary);
  opacity: 0.7;
}

.tier-check {
  flex-shrink: 0;
  font-size: 0.85rem;
}

.tier-text {
  flex: 1;
  line-height: 1.4;
}

.chapter-unlock-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
}

.chapter-unlock-info.unlocked {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.08));
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.chapter-unlock-info.locked {
  background: #f9fafb;
  border: 1px dashed #e5e7eb;
}

.chapter-status {
  font-weight: 600;
}

.chapter-name {
  font-weight: 600;
  color: var(--text-primary);
}

.chapter-hint {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-left: auto;
}

.relation-map {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: var(--shadow-md);
  margin-bottom: 30px;
}

.section-main-title {
  text-align: center;
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.relation-visual {
  position: relative;
  width: 340px;
  height: 340px;
  margin: 0 auto;
}

.relation-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.center-node {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f472b6, #a78bfa);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 6px 20px rgba(244, 114, 182, 0.4);
}

.relation-node {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-left: -30px;
  margin-top: -40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 5;
}

.node-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.node-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.node-affinity {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-purple);
  padding: 2px 8px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 10px;
}

.relation-line {
  position: absolute;
  top: 50%;
  left: 50%;
  height: 3px;
  border-radius: 2px;
  z-index: 1;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.notification-wrapper {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  pointer-events: none;
}

.notification {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
}

.notification-success {
  background: rgba(16, 185, 129, 0.95);
  color: white;
}

.notification-info {
  background: rgba(59, 130, 246, 0.95);
  color: white;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

@media (max-width: 768px) {
  .characters-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .relation-visual {
    width: 280px;
    height: 280px;
  }

  .card-header {
    padding: 15px;
  }

  .character-icon {
    width: 48px;
    height: 48px;
    font-size: 2rem;
  }

  .character-name {
    font-size: 1.4rem;
  }
}
</style>
