<template>
  <div class="story-editor">
    <header class="editor-header">
      <div class="header-left">
        <button class="btn btn-ghost back-btn" @click="goBack">
          ← 返回
        </button>
        <h1 class="editor-title">📝 剧情编辑器</h1>
        <span v-if="editorStore.isDirty" class="dirty-indicator">● 未保存</span>
        <span v-else-if="editorStore.lastSavedAt" class="saved-indicator">
          ✓ {{ formatSavedTime }}
        </span>
      </div>
      <div class="header-right">
        <button class="btn btn-secondary" @click="handleValidate">
          🔍 校验
        </button>
        <button class="btn btn-secondary" @click="editorStore.resetToDefaults">
          ↺ 重置
        </button>
        <button class="btn btn-primary" @click="editorStore.exportData">
          💾 导出数据
        </button>
      </div>
    </header>

    <div class="editor-body">
      <nav class="editor-sidebar">
        <div class="nav-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="nav-tab"
            :class="{ active: editorStore.activeTab === tab.id }"
            @click="editorStore.activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
            <span class="tab-count">{{ getTabCount(tab.id) }}</span>
          </button>
        </div>
        <div class="sidebar-content">
          <slot name="sidebar"></slot>
        </div>
      </nav>

      <main class="editor-main">
        <slot name="main"></slot>
      </main>

      <aside class="editor-detail" v-if="hasDetail">
        <div class="detail-header">
          <h3>{{ detailTitle }}</h3>
        </div>
        <div class="detail-content">
          <slot name="detail"></slot>
        </div>
      </aside>
    </div>

    <Transition name="notification">
      <div v-if="editorStore.notification" class="notification-wrapper">
        <div class="notification" :class="'notification-' + editorStore.notification.type">
          {{ editorStore.notification.message }}
        </div>
      </div>
    </Transition>

    <div v-if="showValidateModal" class="modal-overlay" @click.self="showValidateModal = false">
      <div class="modal-card">
        <h3 class="modal-title">🔍 数据校验结果</h3>
        <div class="modal-body">
          <div v-if="validationResult.errors.length > 0" class="validate-section">
            <h4 class="validate-error-title">❌ 错误 ({{ validationResult.errors.length }})</h4>
            <ul class="validate-list">
              <li v-for="(err, i) in validationResult.errors" :key="'err-'+i" class="validate-item error">
                {{ err }}
              </li>
            </ul>
          </div>
          <div v-if="validationResult.warnings.length > 0" class="validate-section">
            <h4 class="validate-warning-title">⚠️ 警告 ({{ validationResult.warnings.length }})</h4>
            <ul class="validate-list">
              <li v-for="(warn, i) in validationResult.warnings" :key="'warn-'+i" class="validate-item warning">
                {{ warn }}
              </li>
            </ul>
          </div>
          <div v-if="validationResult.isValid && validationResult.warnings.length === 0" class="validate-success">
            ✅ 所有数据校验通过！
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="showValidateModal = false">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEditorStore } from '../stores/editorStore'

const props = defineProps({
  hasDetail: {
    type: Boolean,
    default: false
  },
  detailTitle: {
    type: String,
    default: '详情'
  }
})

const router = useRouter()
const editorStore = useEditorStore()

const showValidateModal = ref(false)
const validationResult = ref({ errors: [], warnings: [], isValid: true })

const tabs = [
  { id: 'chapters', label: '章节', icon: '📚' },
  { id: 'scenes', label: '场景', icon: '🎬' },
  { id: 'dialogues', label: '对白', icon: '💬' },
  { id: 'combos', label: '组合', icon: '✨' },
  { id: 'endings', label: '结局', icon: '🌟' },
  { id: 'io', label: '数据', icon: '📦' }
]

const getTabCount = (tabId) => {
  switch (tabId) {
    case 'chapters': return editorStore.chapters.length
    case 'scenes': return Object.keys(editorStore.scenes).length
    case 'dialogues':
      return Object.values(editorStore.scenes).reduce((sum, s) => sum + (s.dialogues?.length || 0), 0)
    case 'combos':
      return Object.values(editorStore.scenes).reduce((sum, s) => sum + (s.materialCombos?.length || 0), 0)
    case 'endings': return editorStore.endings.length
    default: return ''
  }
}

const formatSavedTime = computed(() => {
  if (!editorStore.lastSavedAt) return ''
  return editorStore.lastSavedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
})

const goBack = () => {
  if (editorStore.isDirty && !confirm('有未保存的更改，确定要离开吗？')) {
    return
  }
  router.push('/chapter-select')
}

const handleValidate = () => {
  validationResult.value = editorStore.validateData()
  showValidateModal.value = true
}
</script>

<style scoped>
.story-editor {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.editor-header {
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

.editor-title {
  font-size: 1.3rem;
  margin: 0;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dirty-indicator {
  font-size: 0.85rem;
  color: #ef4444;
  font-weight: 600;
}

.saved-indicator {
  font-size: 0.85rem;
  color: #10b981;
  font-weight: 500;
}

.header-right {
  display: flex;
  gap: 10px;
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-tabs {
  display: flex;
  flex-wrap: wrap;
  padding: 12px 8px;
  gap: 6px;
  border-bottom: 1px solid var(--border-color);
}

.nav-tab {
  flex: 1;
  min-width: calc(50% - 6px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  border: none;
  background: var(--bg-secondary);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.nav-tab:hover {
  background: #e9d5ff;
}

.nav-tab.active {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
}

.tab-icon {
  font-size: 1.3rem;
}

.tab-label {
  font-size: 0.8rem;
  font-weight: 500;
}

.tab-count {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 0.7rem;
  background: rgba(0, 0, 0, 0.1);
  padding: 1px 6px;
  border-radius: 10px;
}

.nav-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.editor-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-secondary);
}

.editor-detail {
  width: 380px;
  background: white;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.detail-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
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

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.modal-title {
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  font-size: 1.2rem;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.validate-section {
  margin-bottom: 16px;
}

.validate-error-title {
  color: #ef4444;
  margin: 0 0 8px 0;
  font-size: 0.95rem;
}

.validate-warning-title {
  color: #f59e0b;
  margin: 0 0 8px 0;
  font-size: 0.95rem;
}

.validate-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.validate-item {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 6px;
}

.validate-item.error {
  background: #fef2f2;
  color: #991b1b;
}

.validate-item.warning {
  background: #fffbeb;
  color: #92400e;
}

.validate-success {
  text-align: center;
  padding: 30px;
  font-size: 1.1rem;
  color: #10b981;
  font-weight: 600;
}

@media (max-width: 1024px) {
  .editor-detail {
    display: none;
  }
  .editor-sidebar {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .editor-body {
    flex-direction: column;
  }
  .editor-sidebar {
    width: 100%;
    max-height: 200px;
  }
  .editor-main {
    padding: 16px;
  }
}
</style>
