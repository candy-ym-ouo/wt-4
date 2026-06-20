<template>
  <div class="material-check">
    <div class="check-header">
      <div>
        <h2 class="m-0">🎨 素材关联检查</h2>
        <p class="check-subtitle">检查素材引用关系、孤立素材和章节素材匹配度</p>
      </div>
      <div class="header-actions">
        <select class="form-input form-input-sm" v-model="filterType">
          <option value="all">全部素材</option>
          <option value="orphan">未引用素材</option>
          <option value="used">已引用素材</option>
          <option value="rare">稀有素材</option>
        </select>
        <button class="btn btn-primary btn-sm" @click="runCheck">
          🔄 重新检查
        </button>
      </div>
    </div>

    <div v-if="!result" class="empty-state">
      <div class="empty-state-icon">🎨</div>
      <div class="empty-state-text">正在加载素材关联数据...</div>
    </div>

    <template v-else>
      <div class="overview-stats">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <div class="stat-value">{{ reviewStore.materials.length }}</div>
            <div class="stat-label">素材总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ usedCount }}</div>
            <div class="stat-label">已使用</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">⚠️</div>
          <div class="stat-info">
            <div class="stat-value">{{ result.orphanMaterials.length }}</div>
            <div class="stat-label">未引用</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">❌</div>
          <div class="stat-info">
            <div class="stat-value">{{ errorCount }}</div>
            <div class="stat-label">错误</div>
          </div>
        </div>
      </div>

      <div v-if="result.issues.length > 0" class="issues-section">
        <div class="section-title">🔍 关联问题 ({{ result.issues.length }})</div>
        <div class="issues-list">
          <div v-for="(issue, i) in result.issues" :key="i" class="issue-item" :class="issue.severity">
            <span class="issue-icon">{{ issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️' }}</span>
            <span class="issue-type">{{ issue.type }}</span>
            <span class="issue-text">{{ issue.message }}</span>
          </div>
        </div>
      </div>

      <div class="audio-issues-section" v-if="audioIssues.length > 0">
        <div class="section-title">🔊 音效关联问题 ({{ audioIssues.length }})</div>
        <div class="issues-list">
          <div v-for="(issue, i) in audioIssues" :key="'audio-'+i" class="issue-item" :class="issue.severity">
            <span class="issue-icon">{{ issue.severity === 'error' ? '❌' : '⚠️' }}</span>
            <span class="issue-type">{{ issue.type }}</span>
            <span class="issue-text">{{ issue.message }}</span>
          </div>
        </div>
      </div>

      <div class="materials-table-section">
        <div class="table-header">
          <div class="section-title">📋 素材引用明细</div>
        </div>
        <div class="materials-table">
          <div class="table-row table-head">
            <div class="col-material">素材</div>
            <div class="col-category">分类</div>
            <div class="col-rarity">稀有度</div>
            <div class="col-emotion">情绪值</div>
            <div class="col-usage">使用统计</div>
            <div class="col-chapters">章节</div>
            <div class="col-scenes">场景</div>
            <div class="col-combos">组合</div>
          </div>
          <div
            v-for="mat in filteredMaterials"
            :key="mat.id"
            class="table-row"
            :class="{ 'orphan': getUsage(mat.id).totalUsage === 0 }"
          >
            <div class="col-material">
              <div class="material-display">
                <span class="material-dot" :style="{ background: mat.color }"></span>
                <span class="material-name">{{ mat.name }}</span>
                <span class="material-id">{{ mat.id }}</span>
              </div>
            </div>
            <div class="col-category">{{ mat.category }}</div>
            <div class="col-rarity">
              <span class="tag" :class="getRarityClass(mat.rarity)">{{ mat.rarity }}</span>
            </div>
            <div class="col-emotion">+{{ mat.emotion }}</div>
            <div class="col-usage">
              <span class="usage-badge" :class="getUsageClass(getUsage(mat.id).totalUsage)">
                {{ getUsage(mat.id).totalUsage }} 次
              </span>
            </div>
            <div class="col-chapters">
              <div v-if="getUsage(mat.id).usedInChapters.length > 0" class="usage-tags">
                <span v-for="c in getUsage(mat.id).usedInChapters" :key="c" class="mini-tag">{{ c }}</span>
              </div>
              <span v-else class="no-usage">-</span>
            </div>
            <div class="col-scenes">
              <div v-if="getUsage(mat.id).usedInScenes.length > 0 || getUsage(mat.id).usedAsOptional.length > 0" class="usage-tags">
                <span v-for="s in getUsage(mat.id).usedInScenes" :key="'s-'+s" class="mini-tag required">{{ s }}</span>
                <span v-for="s in getUsage(mat.id).usedAsOptional" :key="'o-'+s" class="mini-tag optional">{{ s }}</span>
              </div>
              <span v-else class="no-usage">-</span>
            </div>
            <div class="col-combos">
              <div v-if="getUsage(mat.id).usedInCombos.length > 0" class="usage-tags">
                <span v-for="c in getUsage(mat.id).usedInCombos" :key="c" class="mini-tag combo">{{ c.split('/').pop() }}</span>
              </div>
              <span v-else class="no-usage">-</span>
            </div>
          </div>
        </div>
      </div>

      <div class="orphan-section" v-if="result.orphanMaterials.length > 0">
        <div class="section-title">🚨 未被引用的素材 ({{ result.orphanMaterials.length }})</div>
        <div class="orphan-grid">
          <div v-for="mat in result.orphanMaterials" :key="mat.id" class="orphan-card">
            <span class="material-dot lg" :style="{ background: mat.color }"></span>
            <div class="orphan-info">
              <div class="orphan-name">{{ mat.name }}</div>
              <div class="orphan-id">{{ mat.id }}</div>
              <div class="orphan-desc">{{ mat.description }}</div>
            </div>
            <span class="tag tag-gray">{{ mat.rarity }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReviewStore } from '../../stores/reviewStore'

const reviewStore = useReviewStore()
const result = ref(null)
const audioIssues = ref([])
const filterType = ref('all')

const runCheck = () => {
  result.value = reviewStore.checkMaterialRelations()
  audioIssues.value = reviewStore.validateAudioIntegrity()
}

const getUsage = (matId) => {
  return result.value?.materialUsage?.[matId] || {
    usedInChapters: [],
    usedInScenes: [],
    usedInCombos: [],
    usedAsOptional: [],
    totalUsage: 0
  }
}

const usedCount = computed(() => {
  if (!result.value) return 0
  return Object.values(result.value.materialUsage).filter(u => u.totalUsage > 0).length
})

const errorCount = computed(() => {
  if (!result.value) return 0
  return result.value.issues.filter(i => i.severity === 'error').length
})

const filteredMaterials = computed(() => {
  if (!result.value) return []
  const materials = reviewStore.materials
  switch (filterType.value) {
    case 'orphan':
      return materials.filter(m => getUsage(m.id).totalUsage === 0)
    case 'used':
      return materials.filter(m => getUsage(m.id).totalUsage > 0)
    case 'rare':
      return materials.filter(m => m.rarity === 'rare')
    default:
      return materials
  }
})

const getRarityClass = (rarity) => {
  switch (rarity) {
    case 'rare': return 'tag-yellow'
    case 'legendary': return 'tag-purple'
    default: return 'tag-gray'
  }
}

const getUsageClass = (count) => {
  if (count === 0) return 'usage-zero'
  if (count < 2) return 'usage-low'
  if (count < 5) return 'usage-medium'
  return 'usage-high'
}

onMounted(() => {
  runCheck()
})
</script>

<style scoped>
.m-0 { margin: 0; }

.material-check {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.check-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.check-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.stat-card {
  background: white;
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.stat-icon.green {
  background: linear-gradient(135deg, #d1fae5, #86efac);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
}

.stat-icon.red {
  background: linear-gradient(135deg, #fecaca, #fca5a5);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.issues-section,
.audio-issues-section,
.materials-table-section,
.orphan-section {
  background: white;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 12px;
}

.issues-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.issue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.issue-item.error {
  background: #fef2f2;
  color: #991b1b;
}

.issue-item.warning {
  background: #fffbeb;
  color: #92400e;
}

.issue-item.info {
  background: #eff6ff;
  color: #1e40af;
}

.issue-icon {
  flex-shrink: 0;
}

.issue-type {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  font-family: monospace;
  flex-shrink: 0;
}

.table-header {
  margin-bottom: 12px;
}

.materials-table {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: 1.6fr 0.7fr 0.7fr 0.6fr 0.7fr 1fr 1.2fr 1fr;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid var(--border-color-light);
  font-size: 0.85rem;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row.table-head {
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.table-row.orphan {
  background: #fef2f2;
}

.material-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.material-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.material-dot.lg {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.material-name {
  font-weight: 600;
  color: var(--text-primary);
}

.material-id {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-family: monospace;
}

.usage-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.usage-zero {
  background: #fef2f2;
  color: #991b1b;
}

.usage-low {
  background: #fffbeb;
  color: #92400e;
}

.usage-medium {
  background: #dbeafe;
  color: #1e40af;
}

.usage-high {
  background: #dcfce7;
  color: #15803d;
}

.usage-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mini-tag {
  font-size: 0.7rem;
  padding: 2px 6px;
  background: var(--bg-secondary);
  border-radius: 6px;
  color: var(--text-secondary);
}

.mini-tag.required {
  background: #fce7f3;
  color: #be185d;
}

.mini-tag.optional {
  background: #ede9fe;
  color: #6d28d9;
}

.mini-tag.combo {
  background: #fef3c7;
  color: #92400e;
}

.no-usage {
  color: var(--text-secondary);
  opacity: 0.5;
}

.orphan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.orphan-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
}

.orphan-info {
  flex: 1;
  min-width: 0;
}

.orphan-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.orphan-id {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-family: monospace;
  margin-bottom: 4px;
}

.orphan-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}
</style>
