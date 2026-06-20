<template>
  <div class="decoration-notification-container">
    <TransitionGroup name="decoration-list">
      <div
        v-for="notification in visibleNotifications"
        :key="notification.id"
        class="decoration-notification"
        :class="`rarity-${notification.rarity.id}`"
        @click="handleClick(notification)"
      >
        <div class="notification-icon-wrapper">
          <div class="notification-icon">
            <span>{{ notification.icon }}</span>
          </div>
          <div class="notification-glow"></div>
        </div>
        
        <div class="notification-content">
          <div class="notification-badge">🎨 装扮解锁</div>
          <div class="notification-title">{{ notification.name }}</div>
          <div class="notification-description">{{ notification.description }}</div>
          <div class="notification-rarity" :style="getRarityStyle(notification.rarity)">
            {{ notification.rarity.name }}
          </div>
        </div>

        <button class="notification-close" @click.stop="dismiss()">
          <span>✕</span>
        </button>

        <div class="notification-particles">
          <span v-for="i in 12" :key="i" class="particle" :style="getParticleStyle(i)"></span>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDecorationStore } from '../stores/decorationStore'

const decorationStore = useDecorationStore()

const visibleNotifications = computed(() => {
  return decorationStore.decorationNotification ? [decorationStore.decorationNotification] : []
})

const getRarityStyle = (rarity) => {
  return {
    background: rarity.bgColor,
    color: rarity.color
  }
}

const getParticleStyle = (index) => {
  const angle = (index / 12) * 360
  const delay = index * 0.05
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`
  }
}

const handleClick = (notification) => {
  dismiss()
}

const dismiss = () => {
  decorationStore.decorationNotification = null
}
</script>

<style scoped>
.decoration-notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 3000;
  pointer-events: none;
}

.decoration-notification {
  display: flex;
  align-items: stretch;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  cursor: pointer;
  min-width: 320px;
  max-width: 400px;
  position: relative;
  overflow: hidden;
}

.decoration-notification.rarity-common { border-color: #6b7280; }
.decoration-notification.rarity-rare { 
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #faf5ff, #ffffff);
}
.decoration-notification.rarity-epic { 
  border-color: #ec4899;
  background: linear-gradient(135deg, #fdf2f8, #ffffff);
}
.decoration-notification.rarity-legendary { 
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7, #fff7ed, #ffffff);
  box-shadow: 0 20px 40px -10px rgba(245, 158, 11, 0.3);
}

.notification-icon-wrapper {
  position: relative;
  flex-shrink: 0;
}

.notification-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  animation: iconBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 2;
}

.rarity-rare .notification-icon {
  background: linear-gradient(135deg, #ede9fe, #c4b5fd);
}

.rarity-epic .notification-icon {
  background: linear-gradient(135deg, #fce7f3, #f9a8d4);
}

.rarity-legendary .notification-icon {
  background: linear-gradient(135deg, #fef3c7, #fbbf24);
  animation: iconBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), iconShine 2s ease-in-out infinite;
}

@keyframes iconBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes iconShine {
  0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.5); }
  50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.8); }
}

.notification-glow {
  position: absolute;
  inset: -10px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: glowPulse 1.5s ease-in-out infinite;
  z-index: 1;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.2); opacity: 0.3; }
}

.notification-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.notification-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #8b5cf6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.rarity-rare .notification-badge { color: #8b5cf6; }
.rarity-epic .notification-badge { color: #ec4899; }
.rarity-legendary .notification-badge { color: #f59e0b; }

.notification-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.notification-description {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 8px;
  line-height: 1.4;
}

.notification-rarity {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  align-self: flex-start;
}

.notification-close {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #9ca3af;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.notification-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #6b7280;
}

.notification-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #8b5cf6;
  border-radius: 50%;
  top: 50%;
  left: 30%;
  animation: particleExplode 1.5s ease-out forwards;
  animation-delay: var(--delay);
}

.rarity-rare .particle { background: #8b5cf6; }
.rarity-epic .particle { background: #ec4899; }
.rarity-legendary .particle { background: #f59e0b; }

@keyframes particleExplode {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(150px);
    opacity: 0;
  }
}

.decoration-list-enter-active,
.decoration-list-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.decoration-list-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}

.decoration-list-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}

.decoration-list-move {
  transition: transform 0.3s ease;
}

@media (max-width: 640px) {
  .decoration-notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .decoration-notification {
    min-width: auto;
    max-width: none;
    padding: 16px;
  }

  .notification-icon {
    width: 56px;
    height: 56px;
    font-size: 1.6rem;
    border-radius: 12px;
  }
}
</style>
