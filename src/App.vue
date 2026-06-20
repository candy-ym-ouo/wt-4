<template>
  <div class="app-container">
    <router-view />
    <AchievementNotification />
    <DecorationNotification />
  </div>
</template>

<script setup>
import AchievementNotification from './components/AchievementNotification.vue'
import DecorationNotification from './components/DecorationNotification.vue'
</script>

<style scoped>
.app-container {
  width: 100%;
  min-height: 100vh;
  background: var(--bg-primary);
}
</style>
