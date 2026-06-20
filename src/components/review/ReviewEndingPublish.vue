<template>
  <div class="ending-publish">
    <div class="publish-header">
      <div>
        <h2 class="m-0">🌟 结局发布流程</h2>
        <p class="publish-subtitle">审核结局内容、校验触发条件并管理发布状态</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary btn-sm" @click="runValidation">
          🔍 校验全部结局
        </button>
      </div>
    </div>

    <div v-if="validationResult" class="publish-overview">
      <div class="overview-card total">
        <div class="overview-count">{{ reviewStore.endings.length }}</div>
        <div class="overview-label">结局总数</div>
      </div>
      <div class="overview-card published">
        <div class="overview-count">{{ publishedCount }}</div>
        <div class="overview-label">已发布</div>
      </div>
      <div class="overview-card review">
        <div class="overview-count">{{ reviewCount }}</div>
        <div class="overview-label">审核中</div>
      </div>
      <div class="overview-card draft">
        <div class="overview-count">{{ draftCount }}</div>
        <div class="overview-label">草稿</div>
      </div>
      <div class="overview-card error" v-if="validationResult.errors.length > 0">
        <div class="overview-count">{{ validationResult.errors.length }}</div>
        <div class="overview-label">待修复错误</div>
      </div>
    </div>

    <div v-if="validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0)" class="global-issues">
      <div v-if="validationResult.errors.length > 0" class="issues-block error">
        <div class="issues-title">❌ 全局错误</div>
        <ul class="issues-list">
          <li v-for="(e, i) in validationResult.errors" :key="i">{{ e }}</li>
        </ul>
      </div>
      <div v-if="validationResult.warnings.length > 0" class="issues-block warning">
        <div class="issues-title">⚠️ 全局警告</div>
        <ul class="issues-list">
          <li v-for="(w, i) in validationResult.warnings" :key="i">{{ w }}</li>
        </ul>
      </div>
    </div>

    <div class="endings-list">
      <div
        v-for="ending in reviewStore.endings"
        :key="ending.id"
        class="ending-card"
        :class="{ expanded: expandedEnding === ending.id }"
      >
        <div class="ending-header" @click="toggleEnding(ending.id)">
          <div class="ending-main">
            <div
              class="ending-preview"
              :style="{ background: ending.background }"
            >
              <span class="ending-emoji">{{ getTypeEmoji(ending.type) }}</span>
            </div>
            <div class="ending-info">
              <div class="ending-title-row">
                <h3 class="ending-title">{{ ending.title }}</h3>
                <span class="type-tag" :class="getTypeClass(ending.type)">{{ ending.type }}</span>
              </div>
              <div class="ending-meta">
                <span class="ending-id">{{ ending.id }}</span>
                <span class="ending-emotion">🎯 最低情绪 {{ ending.minEmotion }}</span>
              </div>
              <p class="ending-desc">{{ ending.description }}</p>
            </div>
          </div>
          <div class="ending-status-col">
            <span class="status-badge" :class="getStatusClass(ending.id)">
              {{ getStatus(ending.id).status }}
            </span>
            <span class="chevron">{{ expandedEnding === ending.id ? '▲' : '▼' }}</span>
          </div>
        </div>

        <div v-if="expandedEnding === ending.id" class="ending-detail">
          <div class="detail-grid">
            <div class="detail-panel">
              <div class="panel-title">📋 内容完整性检查</div>
              <div class="check-list">
                <div class="check-item" :class="{ pass: getAnalysis(ending.id).hasContent }">
                  <span class="check-icon">{{ getAnalysis(ending.id).hasContent ? '✅' : '❌' }}</span>
                  <span>内容文本</span>
                </div>
                <div class="check-item" :class="{ pass: getAnalysis(ending.id).hasConditions }">
                  <span class="check-icon">{{ getAnalysis(ending.id).hasConditions ? '✅' : '❌' }}</span>
                  <span>触发条件</span>
                </div>
                <div class="check-item" :class="{ pass: getAnalysis(ending.id).hasDescription }">
                  <span class="check-icon">{{ getAnalysis(ending.id).hasDescription ? '✅' : '⚠️' }}</span>
                  <span>结局描述</span>
                </div>
                <div class="check-item" :class="{ pass: getAnalysis(ending.id).hasBackground }">
                  <span class="check-icon">{{ getAnalysis(ending.id).hasBackground ? '✅' : '⚠️' }}</span>
                  <span>背景样式</span>
                </div>
                <div class="check-item" :class="{ pass: hasAudioMapping(ending.id) }">
                  <span class="check-icon">{{ hasAudioMapping(ending.id) ? '✅' : '⚠️' }}</span>
                  <span>音效映射</span>
                </div>
              </div>
            </div>

            <div class="detail-panel">
              <div class="panel-title">⚙️ 触发条件</div>
              <div v-if="ending.triggerConditions && Object.keys(ending.triggerConditions).length > 0" class="conditions-list">
                <div v-for="(val, key) in ending.triggerConditions" :key="key" class="condition-item">
                  <span class="cond-key">{{ formatConditionKey(key) }}</span>
                  <span class="cond-val">{{ formatConditionValue(val) }}</span>
                </div>
              </div>
              <div v-else class="no-conditions">未设置触发条件</div>
            </div>
          </div>

          <div class="detail-panel content-panel">
            <div class="panel-title">📝 结局内容预览</div>
            <div class="content-preview" :style="{ background: ending.background }">
              <div class="content-text">{{ ending.content }}</div>
            </div>
          </div>

          <div class="detail-panel">
            <div class="panel-title">📝 审核意见</div>
            <div class="add-note-row">
              <input
                type="text"
                class="form-input"
                v-model="noteInputs[ending.id]"
                placeholder="添加审核意见..."
                @keyup.enter="addEndingNote(ending.id)"
              />
              <button class="btn btn-secondary btn-sm" @click="addEndingNote(ending.id)">提交</button>
            </div>
            <div v-if="getEndingNotes(ending.id).length === 0" class="no-notes">暂无审核意见</div>
            <div v-else class="notes-list">
              <div v-for="note in getEndingNotes(ending.id)" :key="note.id" class="note-item" :class="{ resolved: note.resolved }">
                <span class="note-content">{{ note.content }}</span>
                <span class="note-time">{{ formatTime(note.createdAt) }}</span>
                <button v-if="!note.resolved" class="resolve-btn" @click="resolveEndingNote(ending.id, note.id)">
                  ✓ 解决
                </button>
                <span v-else class="resolved-label">已解决</span>
              </div>
            </div>
          </div>

          <div class="publish-actions">
            <div class="status-flow">
              <div
                class="flow-step"
                :class="{ active: getStatus(ending.id).status === 'draft', done: getStatus(ending.id).status !== 'draft' }"
              >
                <div class="step-dot">1</div>
                <span>草稿</span>
              </div>
              <div class="flow-line"></div>
              <div
                class="flow-step"
                :class="{ active: getStatus(ending.id).status === 'reviewing', done: getStatus(ending.id).status === 'published' || getStatus(ending.id).status === 'rejected' }"
              >
                <div class="step-dot">2</div>
                <span>审核中</span>
              </div>
              <div class="flow-line"></div>
              <div class="flow-step" :class="{ active: getStatus(ending.id).status === 'published' }">
                <div class="step-dot success">3</div>
                <span>已发布</span>
              </div>
            </div>

            <div class="action-buttons">
              <button
                class="btn btn-secondary btn-sm"
                @click="setStatus(ending.id, 'draft', '退回草稿')"
                :disabled="getStatus(ending.id).status === 'draft'"
              >
                📝 退回草稿
              </button>
              <button
                class="btn btn-secondary btn-sm"
                @click="setStatus(ending.id, 'reviewing', '提交审核')"
                :disabled="getStatus(ending.id).status === 'reviewing'"
              >
                🔍 提交审核
              </button>
              <button
                class="btn btn-secondary btn-sm reject-btn"
                @click="setStatus(ending.id, 'rejected', '审核不通过')"
                :disabled="getStatus(ending.id).status === 'rejected'"
              >
                ❌ 驳回
              </button>
              <button
                class="btn btn-primary btn-sm"
                @click="handlePublish(ending.id)"
                :disabled="getStatus(ending.id).status === 'published' || !canPublish(ending.id)"
              >
                🚀 发布
              </button>
            </div>
          </div>

          <div v-if="getStatus(ending.id).updatedAt" class="last-update">
            最后更新: {{ formatTime(getStatus(ending.id).updatedAt) }}
            <span v-if="getStatus(ending.id).comment"> · {{ getStatus(ending.id).comment }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useReviewStore } from '../../stores/reviewStore'

const reviewStore = useReviewStore()
const expandedEnding = ref(null)
const validationResult = ref(null)
const noteInputs = reactive({})

const runValidation = () => {
  validationResult.value = reviewStore.validateEndings()
}

const publishedCount = computed(() => {
  return reviewStore.endings.filter(e => reviewStore.getPublishStatus('ending', e.id).status === 'published').length
})

const reviewCount = computed(() => {
  return reviewStore.endings.filter(e => reviewStore.getPublishStatus('ending', e.id).status === 'reviewing').length
})

const draftCount = computed(() => {
  return reviewStore.endings.filter(e => {
    const s = reviewStore.getPublishStatus('ending', e.id).status
    return s === 'draft' || s === 'rejected'
  }).length
})

const toggleEnding = (id) => {
  expandedEnding.value = expandedEnding.value === id ? null : id
}

const getStatus = (endingId) => {
  return reviewStore.getPublishStatus('ending', endingId)
}

const getStatusClass = (endingId) => {
  const status = getStatus(endingId).status
  switch (status) {
    case 'published': return 'status-published'
    case 'reviewing': return 'status-reviewing'
    case 'rejected': return 'status-rejected'
    default: return 'status-draft'
  }
}

const getTypeEmoji = (type) => {
  const map = {
    eternal: '💫',
    true: '💖',
    perfect_path: '✨',
    ngp_perfect: '🌟',
    ngp_special: '💭',
    dialogue_master: '💬',
    time_sequence: '⏳',
    special: '🎭',
    good: '🌸',
    normal: '📖'
  }
  return map[type] || '🌟'
}

const getTypeClass = (type) => {
  const map = {
    eternal: 'type-eternal',
    true: 'type-true',
    perfect_path: 'type-perfect',
    ngp_perfect: 'type-ngp',
    ngp_special: 'type-ngp',
    dialogue_master: 'type-dialogue',
    time_sequence: 'type-time',
    special: 'type-special',
    good: 'type-good',
    normal: 'type-normal'
  }
  return map[type] || 'type-normal'
}

const getAnalysis = (endingId) => {
  if (!validationResult.value) return { hasContent: false, hasConditions: false, hasDescription: false, hasBackground: false }
  const analysis = validationResult.value.endingAnalysis.find(a => a.ending.id === endingId)
  return analysis || { hasContent: false, hasConditions: false, hasDescription: false, hasBackground: false }
}

const hasAudioMapping = (endingId) => {
  return !!reviewStore.audios.endingMapping?.[endingId]
}

const formatConditionKey = (key) => {
  const map = {
    currentCycle: '周目数',
    allEndingsDiscovered: '发现全部结局',
    allHiddenMaterialsUnlocked: '解锁全部隐藏素材',
    allAchievementsUnlocked: '解锁全部成就',
    emotionValue: '情绪值',
    isNgpCycle: '是否二周目',
    hasInheritedEmotion: '有继承情绪值',
    allChaptersCompleted: '完成全部章节',
    minFinalScore: '最低最终分数',
    allChaptersPerfect: '全章节完美',
    allCombosTriggered: '触发全部组合',
    allHiddenDialogues: '发现全部隐藏对话',
    hasPerfectCycle: '存在完美周目',
    allOfTheAbove: '满足以上所有条件',
    seasonComboTriggered: '触发四季组合',
    allCombosTriggered: '触发全部组合',
    minPerfectRate: '最低完美率',
    keyLinesFound: '发现关键台词'
  }
  return map[key] || key
}

const formatConditionValue = (val) => {
  if (typeof val === 'boolean') return val ? '是' : '否'
  if (Array.isArray(val)) return val.join(', ')
  return String(val)
}

const getEndingNotes = (endingId) => {
  return reviewStore.getReviewNotes('ending', endingId)
}

const addEndingNote = (endingId) => {
  const note = noteInputs[endingId]?.trim()
  if (!note) return
  reviewStore.addReviewNote('ending', endingId, note)
  noteInputs[endingId] = ''
}

const resolveEndingNote = (endingId, noteId) => {
  reviewStore.resolveReviewNote('ending', endingId, noteId)
}

const setStatus = (endingId, status, comment) => {
  reviewStore.setPublishStatus('ending', endingId, status, comment)
}

const canPublish = (endingId) => {
  if (!validationResult.value) return false
  const analysis = getAnalysis(endingId)
  return analysis.hasContent && analysis.hasConditions
}

const handlePublish = (endingId) => {
  reviewStore.publishEnding(endingId)
}

const formatTime = (iso) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

onMounted(() => {
  runValidation()
})
</script>

<style scoped>
.m-0 { margin: 0; }

.ending-publish {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.publish-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.publish-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.publish-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 14px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
}

.overview-card.total {
  background: linear-gradient(135deg, #f5f3ff, white);
  border-color: #ddd6fe;
}

.overview-card.published {
  background: linear-gradient(135deg, #dcfce7, white);
  border-color: #bbf7d0;
}

.overview-card.review {
  background: linear-gradient(135deg, #fef9c3, white);
  border-color: #fde68a;
}

.overview-card.draft {
  background: linear-gradient(135deg, #f3f4f6, white);
  border-color: #e5e7eb;
}

.overview-card.error {
  background: linear-gradient(135deg, #fef2f2, white);
  border-color: #fecaca;
}

.overview-count {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.overview-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.global-issues {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.issues-block {
  border-radius: 12px;
  padding: 14px 18px;
}

.issues-block.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.issues-block.warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.issues-title {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.issues-list {
  margin: 0;
  padding-left: 20px;
  font-size: 0.85rem;
  line-height: 1.7;
}

.issues-block.error .issues-list { color: #991b1b; }
.issues-block.warning .issues-list { color: #92400e; }

.endings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ending-card {
  background: white;
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.ending-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  cursor: pointer;
  transition: background 0.15s;
  gap: 16px;
}

.ending-header:hover {
  background: var(--bg-secondary);
}

.ending-main {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.ending-preview {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.ending-emoji {
  font-size: 2rem;
}

.ending-info {
  flex: 1;
  min-width: 0;
}

.ending-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.ending-title {
  font-size: 1.05rem;
  margin: 0;
  color: var(--text-primary);
}

.type-tag {
  font-size: 0.7rem;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.type-eternal { background: linear-gradient(135deg, #fef3c7, #fce7f3); color: #92400e; }
.type-true { background: #fce7f3; color: #be185d; }
.type-perfect { background: #ede9fe; color: #6d28d9; }
.type-ngp { background: #fef9c3; color: #854d0e; }
.type-dialogue { background: #dbeafe; color: #1d4ed8; }
.type-time { background: #f3f4f6; color: #374151; }
.type-special { background: #fed7aa; color: #9a3412; }
.type-good { background: #dcfce7; color: #15803d; }
.type-normal { background: #f3f4f6; color: #4b5563; }

.ending-meta {
  display: flex;
  gap: 14px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.ending-id {
  font-family: monospace;
}

.ending-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.ending-status-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.status-badge {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-published {
  background: #dcfce7;
  color: #15803d;
}

.status-reviewing {
  background: #fef9c3;
  color: #854d0e;
}

.status-rejected {
  background: #fef2f2;
  color: #991b1b;
}

.status-draft {
  background: #f3f4f6;
  color: #4b5563;
}

.chevron {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.ending-detail {
  padding: 0 18px 18px;
  border-top: 1px solid var(--border-color-light);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding-top: 16px;
}

.detail-panel {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 14px 16px;
}

.panel-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  padding: 6px 10px;
  border-radius: 8px;
}

.check-item.pass {
  background: #dcfce7;
}

.check-icon {
  font-size: 0.9rem;
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.condition-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: white;
  border-radius: 8px;
  font-size: 0.85rem;
}

.cond-key {
  font-weight: 500;
  color: var(--text-secondary);
}

.cond-val {
  font-weight: 600;
  color: var(--accent-purple);
}

.no-conditions {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
  padding: 20px;
}

.content-panel {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 14px 16px;
}

.content-preview {
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.content-text {
  font-family: var(--font-serif);
  line-height: 1.9;
  font-size: 0.9rem;
  white-space: pre-line;
  color: var(--text-primary);
}

.add-note-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.add-note-row .form-input {
  flex: 1;
}

.no-notes {
  text-align: center;
  padding: 14px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.note-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  font-size: 0.85rem;
  border-left: 3px solid var(--accent-purple);
  flex-wrap: wrap;
}

.note-item.resolved {
  border-left-color: var(--accent-green);
  opacity: 0.7;
}

.note-content {
  flex: 1;
}

.note-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.resolve-btn {
  background: transparent;
  border: none;
  color: var(--accent-green);
  font-size: 0.8rem;
  cursor: pointer;
  font-weight: 500;
}

.resolved-label {
  font-size: 0.75rem;
  color: var(--accent-green);
  font-weight: 600;
}

.publish-actions {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.4;
}

.flow-step.active,
.flow-step.done {
  opacity: 1;
}

.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e5e7eb;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.flow-step.active .step-dot {
  background: var(--accent-purple);
}

.flow-step.done .step-dot {
  background: #9ca3af;
}

.flow-step .step-dot.success {
  background: #10b981;
}

.flow-step.active .step-dot.success {
  background: #10b981;
}

.flow-step span {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.flow-line {
  width: 40px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 8px;
  margin-bottom: 22px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.reject-btn {
  color: #ef4444;
  border-color: #fecaca;
}

.reject-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.last-update {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
  padding-top: 4px;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
