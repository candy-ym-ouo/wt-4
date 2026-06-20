<template>
  <div class="app-container">
    <router-view />
    <AchievementNotification />
  </div>
</template>

<script setup>
import AchievementNotification from './components/AchievementNotification.vue'
</script>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-primary);
}
</style>
