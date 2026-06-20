<template>
  <div class="branch-validation">
    <div class="validation-header">
      <div>
        <h2 class="m-0">🔀 分支校验</h2>
        <p class="validation-subtitle">检查剧情分支逻辑、素材触发条件和流程完整性</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary btn-sm" @click="runValidation">
          🔍 运行校验
        </button>
      </div>
    </div>

    <div v-if="!result" class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-text">点击上方按钮运行分支校验</div>
    </div>

    <template v-else>
      <div class="summary-cards">
        <div class="summary-card error" v-if="result.errors.length > 0">
          <div class="summary-icon">❌</div>
          <div class="summary-count">{{ result.errors.length }}</div>
          <div class="summary-label">错误</div>
        </div>
        <div class="summary-card warning" v-if="result.warnings.length > 0">
          <div class="summary-icon">⚠️</div>
          <div class="summary-count">{{ result.warnings.length }}</div>
          <div class="summary-label">警告</div>
        </div>
        <div class="summary-card info">
          <div class="summary-icon">🔀</div>
          <div class="summary-count">{{ result.branchInfo.length }}</div>
          <div class="summary-label">分支点</div>
        </div>
        <div class="summary-card success" v-if="result.valid">
          <div class="summary-icon">✅</div>
          <div class="summary-count">通过</div>
          <div class="summary-label">校验</div>
        </div>
      </div>

      <div v-if="result.errors.length > 0" class="issue-section">
        <div class="section-title">❌ 错误问题</div>
        <div class="issue-list">
          <div v-for="(err, i) in result.errors" :key="'err-'+i" class="issue-item error">
            <span class="issue-icon">❌</span>
            <span class="issue-text">{{ err }}</span>
          </div>
        </div>
      </div>

      <div v-if="result.warnings.length > 0" class="issue-section">
        <div class="section-title">⚠️ 警告提示</div>
        <div class="issue-list">
          <div v-for="(warn, i) in result.warnings" :key="'warn-'+i" class="issue-item warning">
            <span class="issue-icon">⚠️</span>
            <span class="issue-text">{{ warn }}</span>
          </div>
        </div>
      </div>

      <div class="branch-overview">
        <div class="section-title">🔀 分支点总览 ({{ result.branchInfo.length }})</div>

        <div v-if="result.branchInfo.length === 0" class="no-branches">
          当前没有检测到素材分支点
        </div>

        <div v-else class="branch-list">
          <div
            v-for="(branch, idx) in result.branchInfo"
            :key="idx"
            class="branch-card"
            :class="{ expanded: expandedBranch === idx }"
            @click="toggleBranch(idx)"
          >
            <div class="branch-header">
              <div class="branch-main">
                <span class="branch-chapter">{{ branch.chapterTitle }}</span>
                <span class="branch-arrow">›</span>
                <span class="branch-scene">{{ branch.sceneId }}</span>
              </div>
              <div class="branch-badges">
                <span class="tag tag-pink">需要 {{ getMaterialName(branch.requiredMaterial) }}</span>
                <span v-if="branch.optionalMaterials.length > 0" class="tag tag-purple">
                  {{ branch.optionalMaterials.length }} 个可选
                </span>
                <span v-if="branch.comboCount > 0" class="tag tag-yellow">
                  {{ branch.comboCount }} 个组合
                </span>
              </div>
            </div>
            <div class="branch-desc">{{ branch.description }}</div>

            <div v-if="expandedBranch === idx" class="branch-detail">
              <div class="detail-row">
                <span class="detail-label">必需素材:</span>
                <div class="material-tags">
                  <span class="material-tag required">
                    {{ getMaterialName(branch.requiredMaterial) }}
                    <span class="material-id">({{ branch.requiredMaterial }})</span>
                  </span>
                </div>
              </div>

              <div v-if="branch.optionalMaterials.length > 0" class="detail-row">
                <span class="detail-label">可选素材:</span>
                <div class="material-tags">
                  <span v-for="matId in branch.optionalMaterials" :key="matId" class="material-tag optional">
                    {{ getMaterialName(matId) }}
                    <span class="material-id">({{ matId }})</span>
                  </span>
                </div>
              </div>

              <div v-if="getSceneCombos(branch.sceneId).length > 0" class="detail-row">
                <span class="detail-label">素材组合:</span>
                <div class="combos-list">
                  <div v-for="combo in getSceneCombos(branch.sceneId)" :key="combo.id" class="combo-row">
                    <span class="combo-name">✨ {{ combo.name }}</span>
                    <div class="combo-mats">
                      <span v-for="matId in combo.materials" :key="matId" class="mini-mat">
                        {{ getMaterialName(matId) }}
                      </span>
                    </div>
                    <span class="combo-emotion">+{{ combo.emotionBonus }} 情绪</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flow-diagram">
        <div class="section-title">📊 章节流程图</div>
        <div class="chapters-flow">
          <div v-for="chapter in reviewStore.chapters" :key="chapter.id" class="chapter-flow">
            <div class="flow-chapter-title">
              <span class="flow-chapter-badge">{{ chapter.title }}</span>
              <span class="flow-chapter-count">{{ chapter.scenes?.length || 0 }} 场景</span>
            </div>
            <div class="flow-scenes">
              <div
                v-for="(sceneId, sIdx) in chapter.scenes"
                :key="sceneId"
                class="flow-scene"
                :class="{ 'has-branch': hasBranch(sceneId) }"
              >
                <div class="flow-node">
                  <span class="flow-node-num">{{ sIdx + 1 }}</span>
                  <span class="flow-node-id">{{ sceneId }}</span>
                  <span v-if="hasBranch(sceneId)" class="flow-branch-indicator">🔀</span>
                </div>
                <div v-if="sIdx < chapter.scenes.length - 1" class="flow-connector"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useReviewStore } from '../../stores/reviewStore'

const reviewStore = useReviewStore()
const result = ref(null)
const expandedBranch = ref(null)

const runValidation = () => {
  result.value = reviewStore.validateBranches()
}

const toggleBranch = (idx) => {
  expandedBranch.value = expandedBranch.value === idx ? null : idx
}

const getMaterialName = (id) => {
  const mat = reviewStore.materials.find(m => m.id === id)
  return mat ? mat.name : id
}

const getSceneCombos = (sceneId) => {
  const scene = reviewStore.scenes[sceneId]
  return scene?.materialCombos || []
}

const hasBranch = (sceneId) => {
  const scene = reviewStore.scenes[sceneId]
  return scene && (scene.requiredMaterial || (scene.materialCombos && scene.materialCombos.length > 0))
}

onMounted(() => {
  runValidation()
})
</script>

<style scoped>
.m-0 { margin: 0; }

.branch-validation {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.validation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.validation-subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.summary-card {
  background: white;
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 2px solid transparent;
}

.summary-card.error {
  border-color: #fecaca;
  background: linear-gradient(135deg, #fef2f2, white);
}

.summary-card.warning {
  border-color: #fde68a;
  background: linear-gradient(135deg, #fffbeb, white);
}

.summary-card.info {
  border-color: #bfdbfe;
  background: linear-gradient(135deg, #eff6ff, white);
}

.summary-card.success {
  border-color: #bbf7d0;
  background: linear-gradient(135deg, #dcfce7, white);
}

.summary-icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.summary-count {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.issue-section {
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

.issue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.issue-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.88rem;
}

.issue-item.error {
  background: #fef2f2;
  color: #991b1b;
}

.issue-item.warning {
  background: #fffbeb;
  color: #92400e;
}

.issue-icon {
  flex-shrink: 0;
}

.branch-overview {
  background: white;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
}

.no-branches {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.branch-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.branch-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.branch-card:hover {
  background: #fff;
  border-color: var(--border-color);
}

.branch-card.expanded {
  border-color: var(--accent-purple);
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(244, 114, 182, 0.05));
}

.branch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.branch-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.branch-chapter {
  font-weight: 600;
  color: var(--text-primary);
}

.branch-arrow {
  color: var(--text-secondary);
}

.branch-scene {
  font-family: monospace;
  color: var(--accent-purple);
  font-size: 0.85rem;
}

.branch-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.branch-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-style: italic;
}

.branch-detail {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.detail-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 80px;
  padding-top: 4px;
}

.material-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.material-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.material-tag.required {
  background: #fce7f3;
  color: #be185d;
}

.material-tag.optional {
  background: #ede9fe;
  color: #6d28d9;
}

.material-id {
  font-size: 0.7rem;
  opacity: 0.6;
  font-family: monospace;
}

.combos-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.combo-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  flex-wrap: wrap;
}

.combo-name {
  font-weight: 600;
  font-size: 0.85rem;
  min-width: 100px;
}

.combo-mats {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.mini-mat {
  font-size: 0.75rem;
  padding: 2px 8px;
  background: var(--bg-primary);
  border-radius: 10px;
}

.combo-emotion {
  margin-left: auto;
  color: var(--accent-green);
  font-weight: 700;
  font-size: 0.8rem;
}

.flow-diagram {
  background: white;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
}

.chapters-flow {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chapter-flow {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 14px 16px;
}

.flow-chapter-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.flow-chapter-badge {
  font-weight: 600;
  padding: 4px 12px;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
}

.flow-chapter-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.flow-scenes {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
}

.flow-scene {
  display: flex;
  align-items: flex-start;
}

.flow-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 70px;
  padding: 10px 8px;
  background: white;
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
  border: 2px solid var(--border-color);
  position: relative;
}

.flow-scene.has-branch .flow-node {
  border-color: var(--accent-pink);
  background: linear-gradient(135deg, #fff, #fdf2f8);
}

.flow-node-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent-purple);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.flow-scene.has-branch .flow-node-num {
  background: var(--accent-pink);
}

.flow-node-id {
  font-size: 0.7rem;
  font-family: monospace;
  color: var(--text-secondary);
  text-align: center;
}

.flow-branch-indicator {
  font-size: 0.9rem;
}

.flow-connector {
  width: 30px;
  height: 2px;
  background: var(--border-color);
  margin-top: 22px;
  flex-shrink: 0;
}
</style>
