<template>
  <div class="story-review">
    <header class="review-header">
      <div class="header-left">
        <button class="btn btn-ghost back-btn" @click="goBack">
          ← 返回
        </button>
        <h1 class="review-title">🛡️ 剧情审核后台</h1>
      </div>
      <div class="header-right">
        <button class="btn btn-secondary" @click="runFullReview">
          🔍 全面审核
        </button>
        <button class="btn btn-primary" @click="showDashboard = !showDashboard">
          📊 {{ showDashboard ? '隐藏' : '查看' }}概览
        </button>
      </div>
    </header>

    <Transition name="dashboard">
      <div v-if="showDashboard && fullReviewResult" class="dashboard-panel">
        <div class="dashboard-grid">
          <div class="dashboard-card">
            <div class="dash-icon blue">📚</div>
            <div class="dash-content">
              <div class="dash-value">{{ fullReviewResult.summary.chapters }}</div>
              <div class="dash-label">章节</div>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="dash-icon purple">🎬</div>
            <div class="dash-content">
              <div class="dash-value">{{ fullReviewResult.summary.scenes }}</div>
              <div class="dash-label">场景</div>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="dash-icon pink">💬</div>
            <div class="dash-content">
              <div class="dash-value">{{ fullReviewResult.summary.dialogues }}</div>
              <div class="dash-label">对白</div>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="dash-icon yellow">🌟</div>
            <div class="dash-content">
              <div class="dash-value">{{ fullReviewResult.summary.endings }}</div>
              <div class="dash-label">结局</div>
            </div>
          </div>
          <div class="dashboard-card">
            <div class="dash-icon green">🎨</div>
            <div class="dash-content">
              <div class="dash-value">{{ fullReviewResult.summary.materials }}</div>
              <div class="dash-label">素材</div>
            </div>
          </div>
          <div class="dashboard-card" :class="fullReviewResult.summary.canPublish ? 'ok' : 'danger'">
            <div class="dash-icon">{{ fullReviewResult.summary.canPublish ? '✅' : '❌' }}</div>
            <div class="dash-content">
              <div class="dash-value">
                {{ fullReviewResult.summary.errorCount }} / {{ fullReviewResult.summary.warningCount }}
              </div>
              <div class="dash-label">错误 / 警告</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <div class="review-body">
      <nav class="review-sidebar">
        <div class="nav-tabs">
          <button
            v-for="mod in modules"
            :key="mod.id"
            class="nav-tab"
            :class="{ active: reviewStore.activeModule === mod.id }"
            @click="reviewStore.activeModule = mod.id"
          >
            <span class="tab-icon">{{ mod.icon }}</span>
            <span class="tab-label">{{ mod.label }}</span>
            <span class="tab-desc">{{ mod.desc }}</span>
          </button>
        </div>
      </nav>

      <main class="review-main">
        <ReviewChapterPreview v-if="reviewStore.activeModule === 'preview'" />
        <ReviewBranchValidation v-else-if="reviewStore.activeModule === 'branches'" />
        <ReviewMaterialCheck v-else-if="reviewStore.activeModule === 'materials'" />
        <ReviewEndingPublish v-else-if="reviewStore.activeModule === 'endings'" />
      </main>
    </div>

    <Transition name="notification">
      <div v-if="reviewStore.notification" class="notification-wrapper">
        <div class="notification" :class="'notification-' + reviewStore.notification.type">
          {{ reviewStore.notification.message }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReviewStore } from '../stores/reviewStore'
import ReviewChapterPreview from '../components/review/ReviewChapterPreview.vue'
import ReviewBranchValidation from '../components/review/ReviewBranchValidation.vue'
import ReviewMaterialCheck from '../components/review/ReviewMaterialCheck.vue'
import ReviewEndingPublish from '../components/review/ReviewEndingPublish.vue'

const router = useRouter()
const reviewStore = useReviewStore()
const showDashboard = ref(true)
const fullReviewResult = ref(null)

const modules = [
  { id: 'preview', label: '章节预览', icon: '📖', desc: '查看章节与对白内容' },
  { id: 'branches', label: '分支校验', icon: '🔀', desc: '检查剧情分支逻辑' },
  { id: 'materials', label: '素材关联', icon: '🎨', desc: '验证素材引用完整性' },
  { id: 'endings', label: '结局发布', icon: '🌟', desc: '结局审核与发布流程' }
]

const goBack = () => {
  router.push('/chapter-select')
}

const runFullReview = () => {
  fullReviewResult.value = reviewStore.runFullReview()
  reviewStore.showNotification('全面审核完成', 'success')
}

onMounted(() => {
  runFullReview()
})
</script>

<style scoped>
.story-review {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  padding: 8px 12px;
  font-size: 0.9rem;
}

.review-title {
  font-size: 1.3rem;
  margin: 0;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-right {
  display: flex;
  gap: 10px;
}

.dashboard-enter-active,
.dashboard-leave-active {
  transition: all 0.3s ease;
}

.dashboard-enter-from,
.dashboard-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
}

.dashboard-panel {
  padding: 0 24px 16px;
  padding-top: 16px;
  background: linear-gradient(135deg, #f8fafc, #faf8f5);
  border-bottom: 1px solid var(--border-color);
  max-height: 500px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.dashboard-card {
  background: white;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
}

.dashboard-card.ok {
  border-color: #bbf7d0;
  background: linear-gradient(135deg, #dcfce7, white);
}

.dashboard-card.danger {
  border-color: #fecaca;
  background: linear-gradient(135deg, #fef2f2, white);
}

.dash-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
}

.dash-icon.blue { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
.dash-icon.purple { background: linear-gradient(135deg, #ede9fe, #ddd6fe); }
.dash-icon.pink { background: linear-gradient(135deg, #fce7f3, #fbcfe8); }
.dash-icon.yellow { background: linear-gradient(135deg, #fef3c7, #fde68a); }
.dash-icon.green { background: linear-gradient(135deg, #d1fae5, #a7f3d0); }

.dash-content {
  display: flex;
  flex-direction: column;
}

.dash-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.dash-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.review-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.review-sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid var(--border-color);
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-tabs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 14px 14px;
  border: none;
  background: var(--bg-secondary);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.nav-tab:hover {
  background: #ede9fe;
}

.nav-tab.active {
  background: linear-gradient(135deg, #6366f1, #ec4899);
  color: white;
  box-shadow: var(--shadow-md);
}

.tab-icon {
  font-size: 1.4rem;
}

.tab-label {
  font-size: 0.95rem;
  font-weight: 600;
}

.tab-desc {
  font-size: 0.75rem;
  opacity: 0.7;
}

.review-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-primary);
}

.notification-wrapper {
  position: fixed;
  top: 80px;
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

.notification-info {
  background: rgba(59, 130, 246, 0.95);
  color: white;
}

.notification-success {
  background: rgba(16, 185, 129, 0.95);
  color: white;
}

.notification-warning {
  background: rgba(245, 158, 11, 0.95);
  color: white;
}

.notification-error {
  background: rgba(239, 68, 68, 0.95);
  color: white;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

@media (max-width: 1024px) {
  .review-sidebar {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .review-body {
    flex-direction: column;
  }
  .review-sidebar {
    width: 100%;
    max-height: 220px;
    padding: 12px;
  }
  .nav-tabs {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .nav-tab {
    flex: 1;
    min-width: calc(50% - 6px);
  }
  .review-main {
    padding: 16px;
  }
}
</style>
