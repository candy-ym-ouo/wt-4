<template>
  <div class="review-preview">
    <div class="preview-header">
      <div>
        <h2 class="m-0">📖 章节预览</h2>
        <p class="preview-subtitle">查看章节内容、对白流程和整体结构</p>
      </div>
      <div class="header-actions">
        <select class="form-input form-input-sm" v-model="reviewStore.selectedChapterId">
          <option :value="null">选择章节...</option>
          <option v-for="c in reviewStore.chapters" :key="c.id" :value="c.id">
            {{ c.title }}
          </option>
        </select>
        <button class="btn btn-secondary btn-sm" @click="refreshValidation" :disabled="!reviewStore.selectedChapterId">
          🔄 重新校验
        </button>
      </div>
    </div>

    <div v-if="!reviewStore.selectedChapter" class="empty-state">
      <div class="empty-state-icon">📚</div>
      <div class="empty-state-text">请从上方选择一个章节进行预览</div>
    </div>

    <template v-else>
      <div class="chapter-overview card" :style="{ background: reviewStore.selectedChapter.background }">
        <div class="overview-header">
          <div>
            <h3 class="chapter-title">{{ reviewStore.selectedChapter.title }}</h3>
            <div class="chapter-subtitle">{{ reviewStore.selectedChapter.subtitle }}</div>
          </div>
          <div class="overview-badges">
            <span class="tag" :class="reviewStore.selectedChapter.unlocked ? 'tag-green' : 'tag-gray'">
              {{ reviewStore.selectedChapter.unlocked ? '已解锁' : '未解锁' }}
            </span>
            <span v-if="reviewStore.selectedChapter.hidden" class="tag tag-purple">隐藏章节</span>
            <span class="tag tag-yellow">🎯 情绪目标 {{ reviewStore.selectedChapter.emotionTarget }}</span>
          </div>
        </div>
        <p class="chapter-desc">{{ reviewStore.selectedChapter.description }}</p>
        <p class="chapter-teaser">「{{ reviewStore.selectedChapter.teaser }}」</p>
        <div class="overview-stats">
          <div class="stat-item">
            <span class="stat-icon">🎬</span>
            <span class="stat-value">{{ reviewStore.chapterScenes.length }}</span>
            <span class="stat-label">场景</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">💬</span>
            <span class="stat-value">{{ totalDialogues }}</span>
            <span class="stat-label">对白</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">🎨</span>
            <span class="stat-value">{{ reviewStore.selectedChapter.requiredMaterials?.length || 0 }}</span>
            <span class="stat-label">必需素材</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">✨</span>
            <span class="stat-value">{{ totalCombos }}</span>
            <span class="stat-label">组合</span>
          </div>
        </div>
      </div>

      <div v-if="validationResult" class="validation-summary">
        <div class="validation-card error" v-if="validationResult.errors.length > 0">
          <div class="validation-header">
            <span class="validation-icon">❌</span>
            <span>错误 ({{ validationResult.errors.length }})</span>
          </div>
          <ul class="validation-list">
            <li v-for="(err, i) in validationResult.errors" :key="'err-'+i">{{ err }}</li>
          </ul>
        </div>
        <div class="validation-card warning" v-if="validationResult.warnings.length > 0">
          <div class="validation-header">
            <span class="validation-icon">⚠️</span>
            <span>警告 ({{ validationResult.warnings.length }})</span>
          </div>
          <ul class="validation-list">
            <li v-for="(warn, i) in validationResult.warnings" :key="'warn-'+i">{{ warn }}</li>
          </ul>
        </div>
        <div class="validation-card success" v-if="validationResult.valid && validationResult.warnings.length === 0">
          <div class="validation-header">
            <span class="validation-icon">✅</span>
            <span>章节结构校验通过</span>
          </div>
        </div>
      </div>

      <div class="scenes-timeline">
        <div class="timeline-title">场景流程</div>
        <div class="timeline-list">
          <div
            v-for="(scene, idx) in reviewStore.chapterScenes"
            :key="scene.id"
            class="timeline-item"
            :class="{ active: expandedScene === scene.id }"
            @click="toggleScene(scene.id)"
          >
            <div class="timeline-connector" v-if="idx < reviewStore.chapterScenes.length - 1"></div>
            <div class="timeline-node">{{ idx + 1 }}</div>
            <div class="timeline-content">
              <div class="scene-header-row">
                <span class="scene-id">{{ scene.id }}</span>
                <div class="scene-tags">
                  <span class="tag tag-gray">{{ scene.timeOfDay }}</span>
                  <span class="tag tag-gray">{{ scene.weather }}</span>
                  <span v-if="scene.requiredMaterial" class="tag tag-pink">
                    需要: {{ getMaterialName(scene.requiredMaterial) }}
                  </span>
                  <span v-if="scene.nextScene" class="tag tag-blue">→ {{ scene.nextScene }}</span>
                </div>
              </div>
              <div class="scene-stats-row">
                <span>💬 {{ scene.dialogues?.length || 0 }} 条对白</span>
                <span v-if="scene.materialCombos?.length">✨ {{ scene.materialCombos.length }} 个组合</span>
                <span v-if="scene.optionalMaterials?.length">🎨 {{ scene.optionalMaterials.length }} 个可选素材</span>
              </div>

              <div v-if="expandedScene === scene.id" class="scene-dialogues">
                <div v-for="dialogue in scene.dialogues" :key="dialogue.id" class="dialogue-item">
                  <span class="speaker-tag">{{ dialogue.speaker }}</span>
                  <span class="dialogue-text">{{ dialogue.text }}</span>
                  <span class="emotion-badge" :class="dialogue.emotionChange > 0 ? 'positive' : 'neutral'">
                    {{ dialogue.emotionChange > 0 ? '+' : '' }}{{ dialogue.emotionChange }}
                  </span>
                  <span v-if="dialogue.trigger" class="trigger-tag">{{ dialogue.trigger }}</span>
                </div>

                <div v-if="scene.materialCombos?.length" class="combos-section">
                  <div class="section-title">素材组合</div>
                  <div v-for="combo in scene.materialCombos" :key="combo.id" class="combo-item">
                    <div class="combo-name">✨ {{ combo.name }} <span class="combo-bonus">+{{ combo.emotionBonus }} 情绪</span></div>
                    <div class="combo-materials">
                      <span v-for="matId in combo.materials" :key="matId" class="material-chip">
                        {{ getMaterialName(matId) }}
                      </span>
                    </div>
                    <div v-if="combo.description" class="combo-desc">{{ combo.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="review-notes-section card">
        <div class="section-title">📝 审核意见</div>
        <div class="add-note">
          <textarea
            class="form-textarea"
            v-model="newNote"
            placeholder="添加审核意见..."
            rows="2"
          ></textarea>
          <button class="btn btn-primary btn-sm" @click="addNote" :disabled="!newNote.trim()">
            提交意见
          </button>
        </div>
        <div v-if="notes.length === 0" class="no-notes">暂无审核意见</div>
        <div v-else class="notes-list">
          <div v-for="note in notes" :key="note.id" class="note-item" :class="{ resolved: note.resolved }">
            <div class="note-content">{{ note.content }}</div>
            <div class="note-meta">
              <span>{{ formatTime(note.createdAt) }}</span>
              <button v-if="!note.resolved" class="icon-btn" @click="resolveNote(note.id)">
                ✓ 标记解决
              </button>
              <span v-else class="resolved-tag">已解决</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useReviewStore } from '../../stores/reviewStore'

const reviewStore = useReviewStore()
const expandedScene = ref(null)
const newNote = ref('')
const validationResult = ref(null)

const totalDialogues = computed(() => {
  return reviewStore.chapterScenes.reduce((sum, s) => sum + (s.dialogues?.length || 0), 0)
})

const totalCombos = computed(() => {
  return reviewStore.chapterScenes.reduce((sum, s) => sum + (s.materialCombos?.length || 0), 0)
})

const notes = computed(() => {
  if (!reviewStore.selectedChapterId) return []
  return reviewStore.getReviewNotes('chapter', reviewStore.selectedChapterId)
})

const getMaterialName = (id) => {
  const mat = reviewStore.materials.find(m => m.id === id)
  return mat ? mat.name : id
}

const toggleScene = (sceneId) => {
  expandedScene.value = expandedScene.value === sceneId ? null : sceneId
}

const refreshValidation = () => {
  if (reviewStore.selectedChapterId) {
    validationResult.value = reviewStore.validateChapterStructure(reviewStore.selectedChapterId)
  }
}

const addNote = () => {
  if (!newNote.value.trim() || !reviewStore.selectedChapterId) return
  reviewStore.addReviewNote('chapter', reviewStore.selectedChapterId, newNote.value.trim())
  newNote.value = ''
}

const resolveNote = (noteId) => {
  if (!reviewStore.selectedChapterId) return
  reviewStore.resolveReviewNote('chapter', reviewStore.selectedChapterId, noteId)
}

const formatTime = (iso) => {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

watch(() => reviewStore.selectedChapterId, (id) => {
  expandedScene.value = null
  if (id) {
    validationResult.value = reviewStore.validateChapterStructure(id)
  } else {
    validationResult.value = null
  }
}, { immediate: true })
</script>

<style scoped>
.m-0 { margin: 0; }

.review-preview {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.preview-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chapter-overview {
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-md);
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.chapter-title {
  font-size: 1.5rem;
  margin: 0;
  color: var(--text-primary);
}

.chapter-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-style: italic;
}

.overview-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chapter-desc {
  font-size: 0.95rem;
  line-height: 1.7;
  margin-bottom: 8px;
}

.chapter-teaser {
  font-family: var(--font-handwriting);
  font-size: 1.1rem;
  color: var(--accent-purple);
  margin-bottom: 16px;
}

.overview-stats {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-icon {
  font-size: 1.3rem;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.validation-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.validation-card {
  padding: 14px 18px;
  border-radius: 12px;
}

.validation-card.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.validation-card.warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.validation-card.success {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
}

.validation-header {
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.validation-list {
  margin: 0;
  padding-left: 24px;
  font-size: 0.85rem;
  line-height: 1.7;
}

.validation-card.error .validation-list { color: #991b1b; }
.validation-card.warning .validation-list { color: #92400e; }

.scenes-timeline {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.timeline-title {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.timeline-list {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.timeline-item:hover {
  background: var(--bg-secondary);
}

.timeline-item.active {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(244, 114, 182, 0.08));
}

.timeline-connector {
  position: absolute;
  left: 21px;
  top: 48px;
  bottom: -12px;
  width: 2px;
  background: var(--border-color);
}

.timeline-node {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.scene-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.scene-id {
  font-weight: 600;
  font-family: monospace;
  color: var(--text-primary);
}

.scene-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.scene-stats-row {
  display: flex;
  gap: 16px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.tag-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.scene-dialogues {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dialogue-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.88rem;
  line-height: 1.6;
}

.dialogue-text {
  flex: 1;
  min-width: 200px;
}

.emotion-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.emotion-badge.positive {
  background: #dcfce7;
  color: #15803d;
}

.emotion-badge.neutral {
  background: #f3f4f6;
  color: #4b5563;
}

.trigger-tag {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: #ede9fe;
  color: #6d28d9;
  border-radius: 10px;
  font-weight: 500;
  flex-shrink: 0;
}

.combos-section {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--border-color);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.combo-item {
  background: var(--bg-secondary);
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 8px;
}

.combo-name {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
}

.combo-bonus {
  color: var(--accent-green);
  font-weight: 700;
}

.combo-materials {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.material-chip {
  font-size: 0.75rem;
  padding: 2px 10px;
  background: #fce7f3;
  color: #be185d;
  border-radius: 10px;
}

.combo-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
}

.review-notes-section {
  padding: 20px;
}

.add-note {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: flex-end;
}

.add-note .form-textarea {
  flex: 1;
}

.no-notes {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note-item {
  padding: 12px 14px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border-left: 3px solid var(--accent-purple);
}

.note-item.resolved {
  border-left-color: var(--accent-green);
  opacity: 0.7;
}

.note-content {
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.resolved-tag {
  color: var(--accent-green);
  font-weight: 600;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--accent-green);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
}

.icon-btn:hover {
  background: rgba(16, 185, 129, 0.1);
}
</style>
