import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/chapter-select'
  },
  {
    path: '/chapter-select',
    name: 'ChapterSelect',
    component: () => import('../views/ChapterSelect.vue')
  },
  {
    path: '/game/:chapterId',
    name: 'Game',
    component: () => import('../views/GameView.vue')
  },
  {
    path: '/chapter-score/:chapterId',
    name: 'ChapterScore',
    component: () => import('../views/ChapterScoreView.vue')
  },
  {
    path: '/ending',
    name: 'Ending',
    component: () => import('../views/EndingView.vue')
  },
  {
    path: '/story-editor',
    name: 'StoryEditor',
    component: () => import('../views/StoryEditor.vue')
  },
  {
    path: '/memory-gallery',
    name: 'MemoryGallery',
    component: () => import('../views/MemoryGallery.vue')
  },
  {
    path: '/character-relation',
    name: 'CharacterRelation',
    component: () => import('../views/CharacterRelationView.vue')
  },
  {
    path: '/story-calendar',
    name: 'StoryCalendar',
    component: () => import('../views/StoryCalendar.vue')
  },
  {
    path: '/decoration-gallery',
    name: 'DecorationGallery',
    component: () => import('../views/DecorationGallery.vue')
  },
  {
    path: '/challenge-select',
    name: 'ChallengeSelect',
    component: () => import('../views/ChallengeSelectView.vue')
  },
  {
    path: '/challenge-result',
    name: 'ChallengeResult',
    component: () => import('../views/ChallengeResultView.vue')
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('../views/LeaderboardView.vue')
  },
  {
    path: '/leaderboard/:challengeId',
    name: 'LeaderboardForChallenge',
    component: () => import('../views/LeaderboardView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
