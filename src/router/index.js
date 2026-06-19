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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
