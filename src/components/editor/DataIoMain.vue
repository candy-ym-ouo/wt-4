<template>
  <div class="data-io-main">
    <div class="toolbar">
      <h2 class="m-0">📦 剧情包管理</h2>
    </div>

    <div class="io-section">
      <div class="section-header">
        <span class="section-icon">📤</span>
        <h3 class="section-title">导出剧情包</h3>
      </div>

      <div class="export-form">
        <div class="form-group">
          <label class="form-label">包名称</label>
          <input v-model="exportOptions.name" class="form-input" placeholder="输入剧情包名称" />
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
            <label class="form-label">描述</label>
            <input v-model="exportOptions.description" class="form-input" placeholder="简要描述剧情包内容" />
          </div>
          <div class="form-group">
            <label class="form-label">作者</label>
            <input v-model="exportOptions.author" class="form-input" placeholder="作者名" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            选择导出范围
            <span class="form-hint">（不选则导出全部）</span>
          </label>
          <div class="chapter-select-grid">
            <label
              v-for="chapter in editorStore.chapters"
              :key="chapter.id"
              class="chapter-select-item"
              :class="{ selected: exportOptions.selectedChapterIds.includes(chapter.id) }"
            >
              <input
                type="checkbox"
                :value="chapter.id"
                v-model="exportOptions.selectedChapterIds"
                class="chapter-checkbox"
              />
              <span class="chapter-select-title">{{ chapter.title }}</span>
              <span class="chapter-select-sub">{{ chapter.subtitle }}</span>
              <span v-if="chapter.hidden" class="chapter-badge hidden">隐藏</span>
            </label>
          </div>
        </div>

        <div class="export-summary">
          <div class="summary-item">
            <span class="summary-label">章节</span>
            <span class="summary-val">{{ exportChapterCount }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">场景</span>
            <span class="summary-val">{{ exportSceneCount }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">结局</span>
            <span class="summary-val">{{ editorStore.endings.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">素材</span>
            <span class="summary-val">{{ editorStore.materials.length }}</span>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn-secondary" @click="exportOptions.selectedChapterIds = []">
            清除选择
          </button>
          <button class="btn btn-secondary" @click="selectAllChapters">
            全选章节
          </button>
          <button class="btn btn-primary" @click="handleExportPack">
            📦 导出剧情包
          </button>
          <button class="btn btn-ghost" @click="editorStore.exportData">
            💾 导出原始 JSON
          </button>
        </div>
      </div>
    </div>

    <div class="io-section">
      <div class="section-header">
        <span class="section-icon">📥</span>
        <h3 class="section-title">导入剧情包</h3>
      </div>

      <div class="import-area" @click="triggerFileInput" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="onDrop" :class="{ drag: isDragging }">
        <input ref="fileInput" type="file" accept=".json" style="display: none;" @change="onFileChange" />
        <div class="import-icon">📂</div>
        <div class="import-text">
          <p class="import-primary">点击或拖拽剧情包文件到此处</p>
          <p class="import-secondary">支持剧情包 (.json) 格式</p>
        </div>
      </div>

      <div v-if="packPreview" class="pack-preview">
        <div class="preview-header">
          <div class="preview-name">{{ packPreview.preview.name }}</div>
          <div v-if="packPreview.preview.author" class="preview-author">by {{ packPreview.preview.author }}</div>
        </div>
        <div v-if="packPreview.preview.description" class="preview-desc">{{ packPreview.preview.description }}</div>

        <div class="preview-stats">
          <div class="stat-chip"><span class="chip-num">{{ packPreview.preview.stats.chapters }}</span> 章节</div>
          <div class="stat-chip"><span class="chip-num">{{ packPreview.preview.stats.scenes }}</span> 场景</div>
          <div class="stat-chip"><span class="chip-num">{{ packPreview.preview.stats.endings }}</span> 结局</div>
          <div class="stat-chip"><span class="chip-num">{{ packPreview.preview.stats.materials }}</span> 素材</div>
          <div class="stat-chip"><span class="chip-num">{{ packPreview.preview.stats.dialogues }}</span> 对白</div>
          <div class="stat-chip"><span class="chip-num">{{ packPreview.preview.stats.combos }}</span> 组合</div>
        </div>

        <details class="preview-details">
          <summary class="details-summary">查看详细内容</summary>
          <div class="details-body">
            <div class="detail-section">
              <div class="detail-section-title">📚 章节</div>
              <div v-for="ch in packPreview.preview.chapterList" :key="ch.id" class="detail-item">
                <span>{{ ch.title }}</span>
                <span class="detail-sub">{{ ch.subtitle }}</span>
                <span class="detail-count">{{ ch.sceneCount }} 场景</span>
                <span v-if="ch.hidden" class="chapter-badge hidden">隐藏</span>
              </div>
            </div>
            <div class="detail-section">
              <div class="detail-section-title">🌟 结局</div>
              <div v-for="e in packPreview.preview.endingList" :key="e.id" class="detail-item">
                <span>{{ e.title }}</span>
                <span class="detail-sub">{{ e.type }}</span>
              </div>
            </div>
            <div class="detail-section">
              <div class="detail-section-title">🎨 素材</div>
              <div class="material-tags">
                <span v-for="m in packPreview.preview.materialList" :key="m.id" class="material-tag" :class="m.rarity">
                  {{ m.name }}
                </span>
              </div>
            </div>
          </div>
        </details>

        <div v-if="packPreview.integrity && !packPreview.integrity.isValid" class="integrity-warning">
          <div class="warning-header">⚠️ 数据完整性问题</div>
          <div v-for="(e, i) in packPreview.integrity.errors" :key="'ie'+i" class="valid-item error">{{ e }}</div>
          <div v-for="(w, i) in packPreview.integrity.warnings" :key="'iw'+i" class="valid-item warning">{{ w }}</div>
        </div>

        <div v-if="packPreview.conflicts?.hasConflicts" class="conflict-warning">
          <div class="warning-header">⚡ 检测到冲突</div>
          <div v-if="packPreview.conflicts.conflicts.chapters.length" class="conflict-section">
            章节冲突：{{ packPreview.conflicts.conflicts.chapters.map(c => `「${c.existingTitle}」`).join('、') }}
          </div>
          <div v-if="packPreview.conflicts.conflicts.scenes.length" class="conflict-section">
            场景冲突：{{ packPreview.conflicts.conflicts.scenes.length }} 个场景ID重复
          </div>
          <div v-if="packPreview.conflicts.conflicts.endings.length" class="conflict-section">
            结局冲突：{{ packPreview.conflicts.conflicts.endings.map(c => `「${c.existingTitle}」`).join('、') }}
          </div>
          <div v-if="packPreview.conflicts.conflicts.materials.length" class="conflict-section">
            素材冲突：{{ packPreview.conflicts.conflicts.materials.map(c => `「${c.existingName}」`).join('、') }}
          </div>
        </div>

        <div class="import-mode">
          <label class="form-label">导入模式</label>
          <div class="mode-options">
            <label class="mode-option" :class="{ active: importMode === 'merge' }">
              <input type="radio" v-model="importMode" value="merge" />
              <div class="mode-content">
                <div class="mode-title">🔗 合并导入</div>
                <div class="mode-desc">保留现有数据，将剧情包内容追加进来。冲突项自动重命名。</div>
              </div>
            </label>
            <label class="mode-option" :class="{ active: importMode === 'replace' }">
              <input type="radio" v-model="importMode" value="replace" />
              <div class="mode-content">
                <div class="mode-title">🔄 替换导入</div>
                <div class="mode-desc">用剧情包数据完全替换当前数据。<strong class="text-danger">现有数据将丢失！</strong></div>
              </div>
            </label>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn-ghost" @click="cancelImport">取消</button>
          <button class="btn btn-primary" @click="handleImportPack" :disabled="!canImport">
            {{ importMode === 'merge' ? '🔗 合并导入' : '🔄 替换导入' }}
          </button>
        </div>
      </div>
    </div>

    <div class="io-section">
      <div class="section-header">
        <span class="section-icon">🔍</span>
        <h3 class="section-title">数据校验</h3>
      </div>
      <p class="section-desc">检查当前编辑器数据的完整性，发现无效引用或缺失配置。</p>
      <button class="btn btn-secondary" @click="runValidate">🔍 开始校验</button>

      <div v-if="validationResult" class="validation-result">
        <div v-if="validationResult.isValid" class="valid-summary success">
          ✅ 数据校验通过
        </div>
        <div v-else class="valid-summary error">
          ❌ 发现 {{ validationResult.errors.length }} 个错误，{{ validationResult.warnings.length }} 个警告
        </div>
        <div v-if="validationResult.errors.length" class="valid-section">
          <div class="valid-section-title">❌ 错误</div>
          <div v-for="(e, i) in validationResult.errors" :key="'e'+i" class="valid-item error">{{ e }}</div>
        </div>
        <div v-if="validationResult.warnings.length" class="valid-section">
          <div class="valid-section-title">⚠️ 警告</div>
          <div v-for="(w, i) in validationResult.warnings" :key="'w'+i" class="valid-item warning">{{ w }}</div>
        </div>
      </div>
    </div>

    <div class="io-section danger-zone">
      <div class="section-header">
        <span class="section-icon">⚠️</span>
        <h3 class="section-title">危险操作</h3>
      </div>
      <p class="section-desc">将所有数据恢复为默认值。此操作不可撤销！</p>
      <button class="btn btn-danger" @click="editorStore.resetToDefaults">↺ 重置为默认数据</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const fileInput = ref(null)
const isDragging = ref(false)
const packPreview = ref(null)
const pendingPackJson = ref(null)
const importMode = ref('merge')
const validationResult = ref(null)

const exportOptions = ref({
  name: '',
  description: '',
  author: '',
  selectedChapterIds: []
})

const exportChapterCount = computed(() => {
  if (exportOptions.value.selectedChapterIds.length === 0) {
    return editorStore.chapters.length
  }
  return exportOptions.value.selectedChapterIds.length
})

const exportSceneCount = computed(() => {
  if (exportOptions.value.selectedChapterIds.length === 0) {
    return Object.keys(editorStore.scenes).length
  }
  const sceneIds = new Set()
  editorStore.chapters.forEach(ch => {
    if (exportOptions.value.selectedChapterIds.includes(ch.id) && ch.scenes) {
      ch.scenes.forEach(sid => sceneIds.add(sid))
    }
  })
  return sceneIds.size
})

const canImport = computed(() => {
  if (!packPreview.value || !packPreview.value.valid) return false
  if (packPreview.value.integrity && !packPreview.value.integrity.isValid) return false
  return true
})

const selectAllChapters = () => {
  exportOptions.value.selectedChapterIds = editorStore.chapters.map(c => c.id)
}

const handleExportPack = () => {
  const options = {
    name: exportOptions.value.name || '未命名剧情包',
    description: exportOptions.value.description,
    author: exportOptions.value.author,
    selectedChapterIds: exportOptions.value.selectedChapterIds.length > 0
      ? exportOptions.value.selectedChapterIds
      : null
  }
  editorStore.exportStoryPack(options)
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const onDrop = (e) => {
  isDragging.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) processFile(file)
}

const onFileChange = (e) => {
  const file = e.target.files?.[0]
  if (file) processFile(file)
  e.target.value = ''
}

const processFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    const preview = editorStore.previewPack(content)
    if (preview.valid) {
      packPreview.value = preview
      pendingPackJson.value = content
    } else {
      alert('剧情包解析失败: ' + preview.error)
    }
  }
  reader.readAsText(file)
}

const handleImportPack = () => {
  if (!pendingPackJson.value) return
  editorStore.importStoryPack(pendingPackJson.value, importMode.value, 'rename')
  cancelImport()
}

const cancelImport = () => {
  packPreview.value = null
  pendingPackJson.value = null
}

const runValidate = () => {
  validationResult.value = editorStore.validateData()
}
</script>

<style scoped>
.m-0 { margin: 0; }
.w-full { width: 100%; }
.flex-1 { flex: 1; }
.text-warning { color: #f59e0b; }
.text-danger { color: #ef4444; }

.io-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-sm);
}
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.section-icon {
  font-size: 1.5rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 12px;
}
.section-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.section-desc {
  margin: 0 0 12px 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.form-group {
  margin-bottom: 14px;
}
.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}
.form-hint {
  font-weight: 400;
  color: var(--text-secondary);
  font-size: 0.8rem;
}
.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  font-size: 0.9rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.form-input:focus {
  outline: none;
  border-color: var(--accent-purple);
  background: white;
}
.form-row {
  display: flex;
  gap: 12px;
}

.chapter-select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}
.chapter-select-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-secondary);
}
.chapter-select-item:hover {
  border-color: var(--accent-purple);
}
.chapter-select-item.selected {
  border-color: var(--accent-purple);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.08));
}
.chapter-checkbox {
  accent-color: var(--accent-purple);
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.chapter-select-title {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-primary);
}
.chapter-select-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
.chapter-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.chapter-badge.hidden {
  background: rgba(139, 92, 246, 0.15);
  color: #7c3aed;
}

.export-summary {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: 10px;
  margin-bottom: 14px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.summary-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}
.summary-val {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-purple);
}

.btn-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.import-area {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 36px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-secondary);
  margin-bottom: 16px;
}
.import-area:hover,
.import-area.drag {
  border-color: var(--accent-purple);
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(244, 114, 182, 0.08));
}
.import-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}
.import-primary {
  margin: 0 0 4px 0;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}
.import-secondary {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.pack-preview {
  border: 1.5px solid rgba(16, 185, 129, 0.3);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(34, 197, 94, 0.04));
  border-radius: 14px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.preview-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.preview-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}
.preview-author {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.preview-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.preview-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.stat-chip {
  padding: 6px 12px;
  background: white;
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}
.chip-num {
  font-weight: 700;
  color: var(--accent-purple);
  margin-right: 2px;
}

.preview-details {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}
.details-summary {
  padding: 10px 14px;
  background: var(--bg-secondary);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  user-select: none;
}
.details-summary:hover {
  background: #e9d5ff;
}
.details-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}
.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-primary);
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--bg-secondary);
}
.detail-sub {
  color: var(--text-secondary);
  font-size: 0.75rem;
}
.detail-count {
  margin-left: auto;
  font-size: 0.7rem;
  color: var(--text-secondary);
}
.material-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.material-tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}
.material-tag.common { background: #f3f4f6; color: #4b5563; }
.material-tag.rare { background: #dbeafe; color: #1d4ed8; }
.material-tag.epic { background: #f3e8ff; color: #7c3aed; }
.material-tag.legendary { background: #fef3c7; color: #92400e; }

.integrity-warning,
.conflict-warning {
  padding: 12px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.integrity-warning {
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.conflict-warning {
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.warning-header {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 4px;
}
.integrity-warning .warning-header { color: #dc2626; }
.conflict-warning .warning-header { color: #d97706; }
.conflict-section {
  font-size: 0.8rem;
  color: var(--text-secondary);
  padding: 4px 0;
}

.import-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mode-options {
  display: flex;
  gap: 10px;
}
.mode-option {
  flex: 1;
  padding: 14px;
  border: 1.5px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-secondary);
}
.mode-option input[type="radio"] {
  display: none;
}
.mode-option:hover {
  border-color: var(--accent-purple);
}
.mode-option.active {
  border-color: var(--accent-purple);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.08));
}
.mode-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mode-title {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-primary);
}
.mode-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.validation-result {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
}
.valid-summary {
  padding: 10px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}
.valid-summary.success {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.valid-summary.error {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}
.valid-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.valid-section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.valid-item {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  line-height: 1.5;
}
.valid-item.error {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}
.valid-item.warning {
  background: rgba(245, 158, 11, 0.08);
  color: #d97706;
}

.danger-zone {
  border: 1.5px solid rgba(239, 68, 68, 0.2);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.02), rgba(239, 68, 68, 0.04));
}
</style>
