<template>
  <div class="emotion-curve">
    <div class="section-header">
      <span class="section-icon">📈</span>
      <span class="section-title">情绪曲线</span>
      <div class="emotion-stats">
        <span class="stat-badge peak">
          <span class="badge-icon">📊</span>
          峰值 {{ peakEmotion }}
        </span>
        <span class="stat-badge final">
          <span class="badge-icon">💖</span>
          最终 {{ finalEmotion }}
        </span>
      </div>
    </div>

    <div class="curve-container" ref="curveContainer">
      <svg :width="svgWidth" :height="svgHeight" class="curve-svg">
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:0.8" />
            <stop offset="50%" style="stop-color:#f472b6;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0.8" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#f472b6;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#f472b6;stop-opacity:0" />
          </linearGradient>
        </defs>

        <g class="grid-lines">
          <line 
            v-for="i in 5" 
            :key="'h'+i"
            :x1="padding.left"
            :x2="svgWidth - padding.right"
            :y1="padding.top + (chartHeight / 5) * i"
            :y2="padding.top + (chartHeight / 5) * i"
            stroke="#e5e7eb"
            stroke-width="1"
            stroke-dasharray="4,4"
          />
        </g>

        <g class="y-axis">
          <text 
            v-for="(label, i) in yAxisLabels" 
            :key="'yl'+i"
            :x="padding.left - 10"
            :y="padding.top + chartHeight - (chartHeight / 4) * i + 4"
            text-anchor="end"
            class="axis-label"
          >{{ label }}</text>
        </g>

        <path 
          :d="areaPath"
          fill="url(#areaGradient)"
          class="area-path"
        />

        <path 
          :d="curvePath"
          fill="none"
          stroke="url(#curveGradient)"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="curve-path"
        />

        <g class="data-points">
          <g 
            v-for="(point, index) in displayPoints" 
            :key="index"
            class="data-point-group"
            @mouseenter="hoveredPoint = index"
            @mouseleave="hoveredPoint = null"
          >
            <circle
              :cx="getX(point.index)"
              :cy="getY(point.emotion)"
              :r="hoveredPoint === index ? 8 : 5"
              :fill="getPointColor(point.type)"
              :stroke="hoveredPoint === index ? '#fff' : 'transparent'"
              stroke-width="2"
              class="data-point"
            />
            <rect
              v-if="hoveredPoint === index"
              :x="getX(point.index) - 60"
              :y="getY(point.emotion) - 45"
              width="120"
              height="35"
              rx="6"
              fill="rgba(0,0,0,0.8)"
              class="tooltip-bg"
            />
            <text
              v-if="hoveredPoint === index"
              :x="getX(point.index)"
              :y="getY(point.emotion) - 23"
              text-anchor="middle"
              class="tooltip-text"
            >+{{ point.emotion }} 情绪值</text>
            <text
              v-if="hoveredPoint === index"
              :x="getX(point.index)"
              :y="getY(point.emotion) - 8"
              text-anchor="middle"
              class="tooltip-subtext"
            >{{ getTypeLabel(point.type) }}</text>
          </g>
        </g>

        <g class="chapter-dividers" v-if="showChapterDividers">
          <line
            v-for="divider in chapterDividers"
            :key="divider.chapterId"
            :x1="getX(divider.index)"
            :x2="getX(divider.index)"
            :y1="padding.top"
            :y2="padding.top + chartHeight"
            stroke="#d1d5db"
            stroke-width="1"
            stroke-dasharray="6,4"
            class="divider-line"
          />
          <text
            v-for="divider in chapterDividers"
            :key="'label-' + divider.chapterId"
            :x="getX(divider.index) + 5"
            :y="padding.top + 15"
            class="divider-label"
          >{{ divider.chapterTitle }}</text>
        </g>
      </svg>
    </div>

    <div class="legend">
      <div class="legend-item">
        <span class="legend-dot" style="background: #f472b6;"></span>
        <span class="legend-text">对话</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #8b5cf6;"></span>
        <span class="legend-text">素材</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #10b981;"></span>
        <span class="legend-text">组合</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #f59e0b;"></span>
        <span class="legend-text">隐藏对话</span>
      </div>
    </div>

    <div class="chapter-tabs" v-if="byChapter && byChapter.length > 0">
      <button 
        v-for="(chapter, idx) in byChapter"
        :key="chapter.chapterId"
        class="chapter-tab"
        :class="{ active: activeChapter === idx }"
        @click="activeChapter = idx"
      >
        {{ chapter.chapterTitle }}
        <span class="chapter-emotion">+{{ chapter.totalEmotion }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  showChapterDividers: {
    type: Boolean,
    default: true
  },
  height: {
    type: Number,
    default: 280
  }
})

const hoveredPoint = ref(null)
const activeChapter = ref(-1)
const curveContainer = ref(null)
const svgWidth = ref(600)

const padding = {
  top: 30,
  right: 20,
  bottom: 30,
  left: 50
}

const svgHeight = computed(() => props.height)
const chartHeight = computed(() => svgHeight.value - padding.top - padding.bottom)
const chartWidth = computed(() => svgWidth.value - padding.left - padding.right)

const overall = computed(() => props.data?.overall || [])
const byChapter = computed(() => props.data?.byChapter || [])
const peakEmotion = computed(() => props.data?.peakEmotion || 0)
const finalEmotion = computed(() => props.data?.finalEmotion || 0)

const displayPoints = computed(() => {
  if (activeChapter.value >= 0 && byChapter.value[activeChapter.value]) {
    return byChapter.value[activeChapter.value].points
  }
  return overall.value.filter((p, i) => i % Math.max(1, Math.floor(overall.value.length / 50)) === 0 || i === overall.value.length - 1)
})

const maxEmotion = computed(() => {
  const max = Math.max(...displayPoints.value.map(p => p.emotion), 100)
  return Math.ceil(max / 20) * 20
})

const yAxisLabels = computed(() => {
  const labels = []
  for (let i = 0; i <= 4; i++) {
    labels.push(Math.round((maxEmotion.value / 4) * i))
  }
  return labels
})

const chapterDividers = computed(() => {
  if (!props.showChapterDividers || activeChapter.value >= 0) return []
  
  const dividers = []
  let currentChapter = null
  overall.value.forEach((point, index) => {
    if (point.chapterId !== currentChapter && point.chapterId) {
      currentChapter = point.chapterId
      const chapter = byChapter.value.find(c => c.chapterId === point.chapterId)
      dividers.push({
        index,
        chapterId: point.chapterId,
        chapterTitle: chapter?.chapterTitle || point.chapterId
      })
    }
  })
  return dividers
})

const getX = (index) => {
  if (displayPoints.value.length <= 1) return padding.left
  const step = chartWidth.value / (displayPoints.value.length - 1)
  return padding.left + step * index
}

const getY = (emotion) => {
  if (maxEmotion.value === 0) return padding.top + chartHeight.value
  return padding.top + chartHeight.value - (emotion / maxEmotion.value) * chartHeight.value
}

const getPointColor = (type) => {
  const colors = {
    dialogue: '#f472b6',
    material: '#8b5cf6',
    combo: '#10b981',
    hidden_dialogue: '#f59e0b',
    perfect_bonus: '#06b6d4',
    start: '#6b7280'
  }
  return colors[type] || '#f472b6'
}

const getTypeLabel = (type) => {
  const labels = {
    dialogue: '对话',
    material: '素材',
    combo: '组合',
    hidden_dialogue: '隐藏对话',
    perfect_bonus: '完美奖励',
    start: '开始'
  }
  return labels[type] || type
}

const curvePath = computed(() => {
  if (displayPoints.value.length < 2) return ''
  
  let path = `M ${getX(0)} ${getY(displayPoints.value[0].emotion)}`
  
  for (let i = 1; i < displayPoints.value.length; i++) {
    const prev = displayPoints.value[i - 1]
    const curr = displayPoints.value[i]
    const cpx1 = getX(i - 0.5)
    const cpy1 = getY(prev.emotion)
    const cpx2 = getX(i - 0.5)
    const cpy2 = getY(curr.emotion)
    path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${getX(i)} ${getY(curr.emotion)}`
  }
  
  return path
})

const areaPath = computed(() => {
  if (displayPoints.value.length < 2) return ''
  
  let path = `M ${getX(0)} ${padding.top + chartHeight.value}`
  path += ` L ${getX(0)} ${getY(displayPoints.value[0].emotion)}`
  
  for (let i = 1; i < displayPoints.value.length; i++) {
    const prev = displayPoints.value[i - 1]
    const curr = displayPoints.value[i]
    const cpx1 = getX(i - 0.5)
    const cpy1 = getY(prev.emotion)
    const cpx2 = getX(i - 0.5)
    const cpy2 = getY(curr.emotion)
    path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${getX(i)} ${getY(curr.emotion)}`
  }
  
  path += ` L ${getX(displayPoints.value.length - 1)} ${padding.top + chartHeight.value}`
  path += ' Z'
  
  return path
})

const updateWidth = () => {
  if (curveContainer.value) {
    svgWidth.value = curveContainer.value.offsetWidth
  }
}

watch(() => props.data, () => {
  activeChapter.value = -1
}, { deep: true })

if (typeof window !== 'undefined') {
  updateWidth()
  window.addEventListener('resize', updateWidth)
}
</script>

<style scoped>
.emotion-curve {
  background: linear-gradient(135deg, #fdf2f8, #faf5ff);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #fbcfe8;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.section-icon {
  font-size: 1.3rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  flex: 1;
}

.emotion-stats {
  display: flex;
  gap: 8px;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.stat-badge.peak {
  background: #fef3c7;
  color: #d97706;
}

.stat-badge.final {
  background: #fce7f3;
  color: #be185d;
}

.badge-icon {
  font-size: 0.9rem;
}

.curve-container {
  width: 100%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  padding: 10px;
}

.curve-svg {
  display: block;
  width: 100%;
  height: auto;
}

.axis-label {
  font-size: 0.7rem;
  fill: #9ca3af;
}

.curve-path {
  filter: drop-shadow(0 2px 4px rgba(244, 114, 182, 0.3));
}

.data-point {
  cursor: pointer;
  transition: all 0.2s ease;
}

.data-point-group:hover .data-point {
  filter: drop-shadow(0 0 6px rgba(244, 114, 182, 0.6));
}

.tooltip-bg {
  pointer-events: none;
}

.tooltip-text {
  font-size: 0.75rem;
  font-weight: 600;
  fill: white;
  pointer-events: none;
}

.tooltip-subtext {
  font-size: 0.65rem;
  fill: #d1d5db;
  pointer-events: none;
}

.divider-line {
  opacity: 0.6;
}

.divider-label {
  font-size: 0.65rem;
  fill: #6b7280;
  font-weight: 500;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6b7280;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.chapter-tabs {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.chapter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.chapter-tab:hover {
  background: rgba(255, 255, 255, 0.9);
}

.chapter-tab.active {
  background: linear-gradient(135deg, #f472b6, #8b5cf6);
  color: white;
}

.chapter-emotion {
  font-size: 0.7rem;
  opacity: 0.8;
}

@media (max-width: 640px) {
  .emotion-curve {
    padding: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .emotion-stats {
    width: 100%;
    justify-content: flex-start;
  }
  
  .legend {
    gap: 12px;
  }
}
</style>
