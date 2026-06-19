<template>
  <div class="data-io-main">
    <div class="toolbar">
      <h2 class="m-0">💾 数据管理</h2>
    </div>

    <div class="io-cards">
      <div class="io-card export-card">
        <div class="io-card-icon">📤</div>
        <h3 class="io-card-title">导出数据</h3>
        <p class="io-card-desc">
          将当前所有剧情数据导出为 JSON 文件，可用于备份或迁移到其他项目。
        </p>
        <div class="io-card-info">
          <div class="info-row">
            <span>章节</span>
            <span class="info-val">{{ editorStore.chapters.length }}</span>
          </div>
          <div class="info-row">
            <span>场景</span>
            <span class="info-val">{{ Object.keys(editorStore.scenes).length }}</span>
          </div>
          <div class="info-row">
            <span>结局</span>
            <span class="info-val">{{ editorStore.endings.length }}</span>
          </div>
          <div class="info-row">
            <span>素材</span>
            <span class="info-val">{{ editorStore.materials.length }}</span>
          </div>
        </div>
        <button class="btn btn-primary w-full" @click="editorStore.exportData">
          💾 导出 JSON 文件
        </button>
      </div>

      <div class="io-card import-card">
        <div class="io-card-icon">📥</div>
        <h3 class="io-card-title">导入数据</h3>
        <p class="io-card-desc">
          从 JSON 文件导入剧情数据。<strong class="text-warning">注意：这将覆盖当前所有数据！</strong>
        </p>

        <div class="import-area" @click="triggerFileInput" @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop.prevent="onDrop" :class="{ drag: isDragging }">
          <input ref="fileInput" type="file" accept=".json" style="display: none;" @change="onFileChange" />
          <div class="import-icon">☁️</div>
          <div class="import-text">
            <p class="import-primary">点击或拖拽 JSON 文件到此处</p>
            <p class="import-secondary">支持 .json 格式文件</p>
          </div>
        </div>

        <div v-if="importPreview" class="import-preview">
          <div class="preview-title">📋 文件内容预览</div>
          <div class="preview-info">
            <div class="info-row">
              <span>章节</span>
              <span class="info-val">{{ importPreview.chapters || 0 }}</span>
            </div>
            <div class="info-row">
              <span>场景</span>
              <span class="info-val">{{ importPreview.scenes || 0 }}</span>
            </div>
            <div class="info-row">
              <span>结局</span>
              <span class="info-val">{{ importPreview.endings || 0 }}</span>
            </div>
            <div class="info-row" v-if="importPreview.exportedAt">
              <span>导出时间</span>
              <span class="info-val">{{ formatTime(importPreview.exportedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="io-card validate-card">
        <div class="io-card-icon">🔍</div>
        <h3 class="io-card-title">数据校验</h3>
        <p class="io-card-desc">
          检查数据完整性，发现无效引用或缺失配置。
        </p>
        <button class="btn btn-secondary w-full" @click="runValidate">
          🔍 开始校验
        </button>

        <div v-if="validationResult" class="validation-result">
          <div v-if="validationResult.isValid" class="valid-summary success">
            ✅ 数据校验通过
          </div>
          <div v-else class="valid-summary error">
            ❌ 发现 {{ validationResult.errors.length }} 个错误，{{ validationResult.warnings.length }} 个警告
          </div>

          <div v-if="validationResult.errors.length" class="valid-section">
            <div class="valid-section-title">❌ 错误</div>
            <div v-for="(e, i) in validationResult.errors" :key="'e'+i" class="valid-item error">
              {{ e }}
            </div>
          </div>

          <div v-if="validationResult.warnings.length" class="valid-section">
            <div class="valid-section-title">⚠️ 警告</div>
            <div v-for="(w, i) in validationResult.warnings" :key="'w'+i" class="valid-item warning">
              {{ w }}
            </div>
          </div>
        </div>
      </div>

      <div class="io-card reset-card">
        <div class="io-card-icon">↺</div>
        <h3 class="io-card-title">重置数据</h3>
        <p class="io-card-desc">
          将所有数据恢复为默认值。<strong class="text-danger">此操作不可撤销！</strong>
        </p>
        <button class="btn btn-danger w-full" @click="editorStore.resetToDefaults">
          ↺ 重置为默认数据
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const editorStore = useEditorStore()

const fileInput = ref(null)
const isDragging = ref(false)
const importPreview = ref(null)
const validationResult = ref(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const onDragOver = () => {
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
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
    try {
      const data = JSON.parse(content)
      importPreview.value = {
        chapters: data.chapters?.length || 0,
        scenes: data.scenes ? Object.keys(data.scenes).length : 0,
        endings: data.endings?.length || 0,
        materials: data.materials?.length || 0,
        exportedAt: data.exportedAt
      }
      if (confirm('确定要导入此文件吗？这将覆盖当前所有数据。')) {
        editorStore.importData(content)
        importPreview.value = null
      }
    } catch (err) {
      alert('文件格式错误：' + err.message)
    }
  }
  reader.readAsText(file)
}

const runValidate = () => {
  validationResult.value = editorStore.validateData()
}

const formatTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-CN')
}
</script>

<style scoped>
.m-0 { margin: 0; }
.w-full { width: 100%; }
.text-warning { color: #f59e0b; }
.text-danger { color: #ef4444; }

.io-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.io-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 2px solid transparent;
}
.io-card-icon {
  font-size: 2rem;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 14px;
}
.io-card-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
}
.io-card-desc {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
}
.io-card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-secondary);
}
.info-val {
  font-weight: 700;
  color: var(--text-primary);
}

.import-area {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-secondary);
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

.import-preview {
  padding: 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(34, 197, 94, 0.08));
  border: 1.5px solid rgba(16, 185, 129, 0.3);
  border-radius: 10px;
}
.preview-title {
  font-weight: 600;
  font-size: 0.85rem;
  color: #059669;
  margin-bottom: 8px;
}
.preview-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.validation-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color-light);
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
</style>
