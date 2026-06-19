<template>
  <div class="quest-notification-container">
    <TransitionGroup name="notification-list">
      <div
        v-for="notification in visibleNotifications"
        :key="notification.id"
        class="quest-notification"
        :class="'notification-type-' + notification.type"
        @click="handleNotificationClick(notification)"
      >
        <div class="notification-icon">
          {{ getNotificationIcon(notification) }}
        </div>
        <div class="notification-content">
          <div class="notification-title">
            {{ notification.title }}
          </div>
          <div class="notification-message">
            {{ notification.message }}
          </div>
        </div>
        <button class="notification-close" @click.stop="dismissNotification(notification.id)">
          <span>✕</span>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()

const visibleNotifications = computed(() => {
  return gameStore.questNotifications.filter(n => !n.dismissed)
})

const getNotificationIcon = (notification) => {
  const icons = {
    unlock: '✨',
    complete: '🎉',
    reward: '🎁',
    progress: '📈',
    milestone: '🏆'
  }
  return icons[notification.type] || '📜'
}

const handleNotificationClick = (notification) => {
  if (notification.questId) {
    gameStore.selectQuest(notification.questId)
    gameStore.openQuestPanel()
  }
  dismissNotification(notification.id)
}

const dismissNotification = (id) => {
  gameStore.dismissQuestNotification(id)
}
</script>

<style scoped>
.quest-notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2000;
  pointer-events: none;
}

.quest-notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  cursor: pointer;
  min-width: 280px;
  max-width: 360px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.quest-notification::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--accent-pink);
}

.notification-type-unlock::before { background: linear-gradient(180deg, #8b5cf6, #ec4899); }
.notification-type-complete::before { background: linear-gradient(180deg, #10b981, #06b6d4); }
.notification-type-reward::before { background: linear-gradient(180deg, #f59e0b, #ef4444); }
.notification-type-progress::before { background: linear-gradient(180deg, #3b82f6, #8b5cf6); }
.notification-type-milestone::before { background: linear-gradient(180deg, #fbbf24, #ec4899); }

.quest-notification:hover {
  transform: translateX(-4px);
  box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.3);
}

.notification-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
  animation: iconBounce 0.6s ease;
}

@keyframes iconBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.notification-type-unlock .notification-title { color: #8b5cf6; }
.notification-type-complete .notification-title { color: #10b981; }
.notification-type-reward .notification-title { color: #f59e0b; }
.notification-type-progress .notification-title { color: #3b82f6; }
.notification-type-milestone .notification-title { color: #fbbf24; }

.notification-message {
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-close {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.notification-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-primary);
}

.notification-list-enter-active,
.notification-list-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.notification-list-enter-from {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}

.notification-list-leave-to {
  opacity: 0;
  transform: translateX(100px) scale(0.9);
}

.notification-list-move {
  transition: transform 0.3s ease;
}

@media (max-width: 640px) {
  .quest-notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .quest-notification {
    min-width: auto;
    max-width: none;
  }
}
</style>
