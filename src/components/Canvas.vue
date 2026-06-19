<template>
  <div class="canvas-container" ref="containerRef" :class="{ 'has-overlay': activeSceneFeedback, 'is-invalid': placementValidation?.valid === false }">
    <div v-if="sceneBackgroundOverride" class="bg-transition-layer" :style="{ background: sceneBackgroundOverride }"></div>
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @click="handleStageClick"
      @mousemove="handleStageMouseMove"
    >
      <v-layer ref="layerRef">
        <v-rect
          :config="{
            x: 0,
            y: 0,
            width: stageWidth,
            height: stageHeight,
            fillLinearGradientStartPoint: { x: 0, y: 0 },
            fillLinearGradientEndPoint: { x: stageWidth, y: stageHeight },
            fillLinearGradientColorStops: gradientColors,
            cornerRadius: 8
          }"
        />

        <v-group v-if="showGrid && selectedMaterial" :config="{ listening: false }">
          <v-line
            v-for="(x, i) in gridLinesX"
            :key="'gx-' + i"
            :config="{
              points: [x, 0, x, stageHeight],
              stroke: 'rgba(139, 92, 246, 0.15)',
              strokeWidth: 1,
              dash: [4, 4],
              listening: false
            }"
          />
          <v-line
            v-for="(y, i) in gridLinesY"
            :key="'gy-' + i"
            :config="{
              points: [0, y, stageWidth, y],
              stroke: 'rgba(139, 92, 246, 0.15)',
              strokeWidth: 1,
              dash: [4, 4],
              listening: false
            }"
          />
        </v-group>

        <v-group v-if="selectedMaterial && showCenterGuide" :config="{ listening: false }">
          <v-line
            :config="{
              points: [stageWidth / 2, 0, stageWidth / 2, stageHeight],
              stroke: 'rgba(236, 72, 153, 0.3)',
              strokeWidth: 1,
              dash: [6, 6],
              listening: false
            }"
          />
          <v-line
            :config="{
              points: [0, stageHeight / 2, stageWidth, stageHeight / 2],
              stroke: 'rgba(236, 72, 153, 0.3)',
              strokeWidth: 1,
              dash: [6, 6],
              listening: false
            }"
          />
          <v-circle
            :config="{
              x: stageWidth / 2,
              y: stageHeight / 2,
              radius: perfectZoneRadius,
              stroke: 'rgba(251, 191, 36, 0.4)',
              strokeWidth: 2,
              dash: [8, 4],
              listening: false
            }"
          />
        </v-group>

        <v-group
          v-for="(placed, index) in allPlacedMaterials"
          :key="`${placed.id}-${index}-${placed.isOptional ? 'opt' : 'req'}`"
          :config="{
            x: placed.x,
            y: placed.y,
            rotation: placed.rotation || 0,
            draggable: !placed.isOptional,
            offsetX: 30,
            offsetY: 30
          }"
          @dragend="(e) => handleDragEnd(e, index, placed.isOptional)"
        >
          <component
            :is="getShapeComponent(placed.id)"
            :material="getMaterialById(placed.id)"
            :index="index"
            :is-optional="placed.isOptional"
            :is-perfect="placed.isPerfect"
          />
        </v-group>

        <v-group
          v-if="selectedMaterial && (isWaitingForMaterial || canPlaceOptionalMaterial)"
          :config="{
            x: snappedPos.x,
            y: snappedPos.y,
            offsetX: 30,
            offsetY: 30,
            opacity: placementValidation?.valid === false ? 0.3 : 0.7,
            listening: false,
            scale: snapActive ? 1.08 : 1
          }"
        >
          <component
            :is="getShapeComponent(selectedMaterial.id)"
            :material="selectedMaterial"
            :index="-1"
          />
          <v-circle
            v-if="snapActive && snapType === 'grid'"
            :config="{
              x: 0,
              y: 0,
              radius: 35,
              stroke: '#8b5cf6',
              strokeWidth: 2,
              opacity: 0.6,
              dash: [4, 4]
            }"
          />
          <v-circle
            v-if="snapActive && snapType === 'center'"
            :config="{
              x: 0,
              y: 0,
              radius: 38,
              stroke: '#fbbf24',
              strokeWidth: 2.5,
              opacity: 0.7
            }"
          />
          <v-circle
            v-if="snapActive && snapType === 'edge'"
            :config="{
              x: 0,
              y: 0,
              radius: 35,
              stroke: '#10b981',
              strokeWidth: 2,
              opacity: 0.6,
              dash: [3, 3]
            }"
          />
        </v-group>

        <v-group v-if="selectedMaterial && snapActive && snapPoint" :config="{ listening: false }">
          <v-circle
            :config="{
              x: snapPoint.x,
              y: snapPoint.y,
              radius: 6,
              fill: snapType === 'center' ? '#fbbf24' : snapType === 'edge' ? '#10b981' : '#8b5cf6',
              opacity: 0.8,
              shadowColor: 'white',
              shadowBlur: 4,
              listening: false
            }"
          />
          <v-circle
            :config="{
              x: snapPoint.x,
              y: snapPoint.y,
              radius: 12,
              stroke: snapType === 'center' ? '#fbbf24' : snapType === 'edge' ? '#10b981' : '#8b5cf6',
              strokeWidth: 1.5,
              opacity: 0.5,
              listening: false
            }"
          />
        </v-group>

        <v-group v-if="selectedMaterial && placementValidation?.valid === false" :config="{ listening: false }">
          <v-circle
            :config="{
              x: snappedPos.x,
              y: snappedPos.y,
              radius: 32,
              stroke: '#ef4444',
              strokeWidth: 3,
              opacity: 0.7,
              listening: false
            }"
          />
          <v-line
            :config="{
              points: [snappedPos.x - 12, snappedPos.y - 12, snappedPos.x + 12, snappedPos.y + 12],
              stroke: '#ef4444',
              strokeWidth: 3,
              lineCap: 'round',
              listening: false
            }"
          />
          <v-line
            :config="{
              points: [snappedPos.x + 12, snappedPos.y - 12, snappedPos.x - 12, snappedPos.y + 12],
              stroke: '#ef4444',
              strokeWidth: 3,
              lineCap: 'round',
              listening: false
            }"
          />
        </v-group>
      </v-layer>
    </v-stage>

    <div v-if="isWaitingForMaterial && requiredMaterial" class="material-hint pulse">
      <span class="hint-icon">✨</span>
      <span class="hint-text">请放置「{{ requiredMaterial.name }}」（放在画面中央有加成哦～）</span>
    </div>

    <div v-if="selectedMaterial && snapActive && snapTypeLabel" class="snap-indicator" :class="'snap-' + snapType">
      <span class="snap-icon">{{ snapTypeIcon }}</span>
      <span class="snap-text">{{ snapTypeLabel }}</span>
    </div>

    <transition name="validation">
      <div v-if="placementValidation && !placementValidation.valid" class="validation-error" :style="validationErrorStyle">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ placementValidation.reason }}</span>
      </div>
    </transition>

    <div v-else-if="canPlaceOptionalMaterial && availableOptionalMaterials.length > 0" class="material-hint optional-hint pulse">
      <span class="hint-icon">🎨</span>
      <span class="hint-text">可放置额外素材：{{ availableOptionalMaterialNames }}，尝试解锁组合！</span>
    </div>

    <transition name="feedback">
      <div
        v-if="placementFeedback"
        :class="['placement-feedback', placementFeedback.type]"
        :style="{ left: placementFeedback.x + 'px', top: placementFeedback.y + 'px' }"
      >
        {{ placementFeedback.message }}
      </div>
    </transition>

    <transition name="combo-overlay">
      <div v-if="comboJustTriggered" class="combo-trigger-overlay">
        <div class="combo-glow"></div>
        <div class="combo-card">
          <div class="combo-burst">🌟</div>
          <div class="combo-label">组合解锁</div>
          <div class="combo-name">{{ comboJustTriggered.name }}</div>
          <div class="combo-desc">{{ comboJustTriggered.description }}</div>
          <div class="combo-reward">+{{ comboJustTriggered.emotionBonus }} 💕 额外情绪加成</div>
        </div>
      </div>
    </transition>

    <div v-if="activeSceneFeedback" class="scene-effects-layer" :class="activeSceneFeedback.type">
      <div v-for="i in particleCount" :key="i" class="particle" :style="getParticleStyle(i)">
        {{ getParticleEmoji(activeSceneFeedback.effect) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, h } from 'vue'
import { useGameStore } from '../stores/gameStore'

const props = defineProps({
  background: {
    type: String,
    default: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
  }
})

const emit = defineEmits(['materialPlaced'])

const gameStore = useGameStore()
const containerRef = ref(null)
const stageRef = ref(null)
const layerRef = ref(null)

const stageWidth = ref(600)
const stageHeight = ref(450)
const mousePos = ref({ x: 0, y: 0 })
const selectedMaterial = ref(null)
const placementFeedback = ref(null)
const particleCount = ref(15)

const gridSize = ref(30)
const snapThreshold = ref(15)
const showGrid = ref(true)
const showCenterGuide = ref(true)
const snapActive = ref(false)
const snapType = ref(null)
const snapPoint = ref(null)
const placementValidation = ref(null)
const materialRadius = 30

const perfectZoneRadius = computed(() => {
  const centerX = stageWidth.value / 2
  const centerY = stageHeight.value / 2
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
  return maxDist * 0.4
})

const gridLinesX = computed(() => {
  const lines = []
  for (let x = gridSize.value; x < stageWidth.value; x += gridSize.value) {
    lines.push(x)
  }
  return lines
})

const gridLinesY = computed(() => {
  const lines = []
  for (let y = gridSize.value; y < stageHeight.value; y += gridSize.value) {
    lines.push(y)
  }
  return lines
})

const snappedPos = computed(() => {
  if (!selectedMaterial.value) return mousePos.value
  return calculateSnappedPosition(mousePos.value.x, mousePos.value.y)
})

const snapTypeLabel = computed(() => {
  const labels = {
    grid: '网格吸附',
    center: '中心吸附',
    edge: '边缘吸附'
  }
  return labels[snapType.value] || ''
})

const snapTypeIcon = computed(() => {
  const icons = {
    grid: '📐',
    center: '🎯',
    edge: '📏'
  }
  return icons[snapType.value] || ''
})

const validationErrorStyle = computed(() => {
  return {
    left: snappedPos.value.x + 'px',
    top: Math.max(50, snappedPos.value.y - 50) + 'px'
  }
})

const calculateSnappedPosition = (x, y) => {
  let snappedX = x
  let snappedY = y
  let bestType = null
  let bestDist = Infinity
  let bestPoint = null

  const centerX = stageWidth.value / 2
  const centerY = stageHeight.value / 2

  const centerDist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
  if (centerDist < snapThreshold.value * 1.5 && centerDist < bestDist) {
    bestDist = centerDist
    bestType = 'center'
    bestPoint = { x: centerX, y: centerY }
    snappedX = centerX
    snappedY = centerY
  }

  const edgeThreshold = snapThreshold.value
  let edgeX = null
  let edgeY = null

  if (x < materialRadius + edgeThreshold && x > -edgeThreshold) {
    edgeX = materialRadius
  } else if (x > stageWidth.value - materialRadius - edgeThreshold && x < stageWidth.value + edgeThreshold) {
    edgeX = stageWidth.value - materialRadius
  }

  if (y < materialRadius + edgeThreshold && y > -edgeThreshold) {
    edgeY = materialRadius
  } else if (y > stageHeight.value - materialRadius - edgeThreshold && y < stageHeight.value + edgeThreshold) {
    edgeY = stageHeight.value - materialRadius
  }

  if (edgeX !== null || edgeY !== null) {
    const edgeSnapX = edgeX !== null ? edgeX : x
    const edgeSnapY = edgeY !== null ? edgeY : y
    const edgeDist = Math.sqrt(Math.pow(x - edgeSnapX, 2) + Math.pow(y - edgeSnapY, 2))
    if (edgeDist < bestDist) {
      bestDist = edgeDist
      bestType = 'edge'
      bestPoint = { x: edgeSnapX, y: edgeSnapY }
      snappedX = edgeSnapX
      snappedY = edgeSnapY
    }
  }

  const gridX = Math.round(x / gridSize.value) * gridSize.value
  const gridY = Math.round(y / gridSize.value) * gridSize.value
  const gridDist = Math.sqrt(Math.pow(x - gridX, 2) + Math.pow(y - gridY, 2))
  if (gridDist < snapThreshold.value && gridDist < bestDist) {
    bestDist = gridDist
    bestType = 'grid'
    bestPoint = { x: gridX, y: gridY }
    snappedX = gridX
    snappedY = gridY
  }

  snapActive.value = bestType !== null
  snapType.value = bestType
  snapPoint.value = bestPoint

  return { x: snappedX, y: snappedY }
}

const validatePlacement = (x, y) => {
  const margin = materialRadius

  if (x < margin || x > stageWidth.value - margin) {
    return { valid: false, reason: '超出画布边界' }
  }
  if (y < margin || y > stageHeight.value - margin) {
    return { valid: false, reason: '超出画布边界' }
  }

  const allPlaced = [...placedMaterials.value, ...optionalMaterialsPlaced.value]
  for (const placed of allPlaced) {
    const dist = Math.sqrt(Math.pow(x - placed.x, 2) + Math.pow(y - placed.y, 2))
    if (dist < materialRadius * 1.2) {
      return { valid: false, reason: '与其他素材太近' }
    }
  }

  return { valid: true }
}

const placedMaterials = computed(() => gameStore.placedMaterials)
const optionalMaterialsPlaced = computed(() => gameStore.optionalMaterialsPlaced)
const isWaitingForMaterial = computed(() => gameStore.isWaitingForMaterial)
const requiredMaterialId = computed(() => gameStore.requiredMaterialId)
const canPlaceOptionalMaterial = computed(() => gameStore.canPlaceOptionalMaterial)
const availableOptionalMaterials = computed(() => gameStore.availableOptionalMaterials)
const sceneBackgroundOverride = computed(() => gameStore.sceneBackgroundOverride)
const activeSceneFeedback = computed(() => gameStore.activeSceneFeedback)
const comboJustTriggered = computed(() => gameStore.comboJustTriggered)

const allPlacedMaterials = computed(() => [
  ...placedMaterials.value,
  ...optionalMaterialsPlaced.value
])

const requiredMaterial = computed(() => {
  if (!requiredMaterialId.value) return null
  return gameStore.getMaterialById(requiredMaterialId.value)
})

const availableOptionalMaterialNames = computed(() => {
  return availableOptionalMaterials.value.map(m => m.name).join('、')
})

const stageConfig = computed(() => ({
  width: stageWidth.value,
  height: stageHeight.value
}))

const gradientColors = computed(() => {
  const bg = sceneBackgroundOverride.value || props.background
  const colors = bg.match(/#[a-fA-F0-9]{6}/g) || ['#fef3c7', '#fde68a']
  return [0, colors[0], 1, colors[1] || colors[0]]
})

const getMaterialById = (id) => {
  return gameStore.getMaterialById(id)
}

const getShapeComponent = (materialId) => {
  const material = getMaterialById(materialId)
  if (!material) return MaterialShape

  const shapeMap = {
    flower: FlowerShape,
    butterfly: ButterflyShape,
    rectangle: RectangleShape,
    circle: CircleShape,
    cicada: CicadaShape,
    book: BookShape,
    leaf: LeafShape,
    cup: CupShape,
    snowflake: SnowflakeShape,
    scarf: ScarfShape,
    heart: HeartShape,
    cloud: CloudShape,
    star: StarShape,
    note: NoteShape
  }

  return shapeMap[material.shape] || MaterialShape
}

const handleStageMouseMove = (e) => {
  if (!selectedMaterial.value) {
    placementValidation.value = null
    return
  }

  const pos = snappedPos.value
  placementValidation.value = validatePlacement(pos.x, pos.y)
}

const handleStageClick = (e) => {
  if (!selectedMaterial.value) return
  if (!isWaitingForMaterial.value && !canPlaceOptionalMaterial.value) return

  const pos = snappedPos.value

  const validation = validatePlacement(pos.x, pos.y)
  if (!validation.valid) {
    placementFeedback.value = {
      type: 'error',
      message: validation.reason,
      x: pos.x,
      y: pos.y
    }
    setTimeout(() => {
      placementFeedback.value = null
    }, 1200)
    return
  }

  if (isWaitingForMaterial.value) {
    if (selectedMaterial.value.id !== requiredMaterialId.value) return
  } else if (canPlaceOptionalMaterial.value) {
    if (!availableOptionalMaterials.value.some(m => m.id === selectedMaterial.value.id)) return
  }

  const result = gameStore.placeMaterial(
    selectedMaterial.value.id,
    pos,
    stageWidth.value,
    stageHeight.value
  )

  if (result && result.success) {
    let feedbackType = result.isPerfect ? 'perfect' : 'normal'
    let feedbackMsg = result.isPerfect
      ? `完美放置！+${result.bonus} 情绪加成 ✨`
      : '放置成功'

    if (result.combosTriggered && result.combosTriggered.length > 0) {
      feedbackType = 'combo'
      const comboNames = result.combosTriggered.map(c => c.name).join('、')
      const totalBonus = result.combosTriggered.reduce((sum, c) => sum + (c.bonus || 0), 0)
      feedbackMsg = `🎉 组合「${comboNames}」解锁！共 +${totalBonus} 额外加成`
    } else if (result.isOptional) {
      feedbackType = 'optional'
      feedbackMsg = result.isPerfect
        ? `额外素材完美放置！+${result.bonus} ✨`
        : '额外素材放置成功'
    }

    placementFeedback.value = {
      type: feedbackType,
      message: feedbackMsg,
      x: pos.x,
      y: pos.y,
      animated: true
    }

    setTimeout(() => {
      placementFeedback.value = null
    }, result.combosTriggered?.length > 0 ? 2500 : 1500)

    emit('materialPlaced', { material: selectedMaterial.value, result })
    selectedMaterial.value = null
    placementValidation.value = null
  }
}

const handleDragEnd = (e, index, isOptional) => {
  if (isOptional) return
  const node = e.target
  const newX = node.x()
  const newY = node.y()

  if (placedMaterials.value[index]) {
    placedMaterials.value[index].x = newX
    placedMaterials.value[index].y = newY
  }
}

const handleMouseMove = (e) => {
  if (!stageRef.value) return
  const stage = stageRef.value.getStage()
  if (!stage) return

  const container = containerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  mousePos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

const selectMaterial = (material) => {
  if (!isWaitingForMaterial.value && !canPlaceOptionalMaterial.value) return
  selectedMaterial.value = material
  snapActive.value = false
  snapType.value = null
  snapPoint.value = null
  placementValidation.value = null
}

const resetCanvas = () => {
  selectedMaterial.value = null
  placementFeedback.value = null
  snapActive.value = false
  snapType.value = null
  snapPoint.value = null
  placementValidation.value = null
}

const handleResize = () => {
  if (!containerRef.value) return
  const width = Math.min(containerRef.value.offsetWidth, 600)
  stageWidth.value = width
  stageHeight.value = Math.min(450, width * 0.75)
}

const getParticleEmoji = (effect) => {
  const emojiMap = {
    petals: '🌸',
    sparkle: '✨',
    flutter: '🦋',
    notes: '🎵',
    hearts: '💖',
    stars: '⭐',
    sunshine: '☀️',
    clouds: '☁️',
    leaves: '🍂',
    pages: '📖',
    warm: '💫',
    time: '⏰',
    bloom: '🌺',
    rainbow_bloom: '🌈'
  }
  return emojiMap[effect] || '✨'
}

const getParticleStyle = (i) => {
  const seed = i * 37
  const left = (seed * 7.3) % 100
  const delay = (seed * 0.13) % 5
  const duration = 3 + ((seed * 0.21) % 4)
  const size = 18 + ((seed % 5) * 6)
  const rotate = ((seed * 17) % 360)
  return {
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    fontSize: `${size}px`,
    transform: `rotate(${rotate}deg)`
  }
}

const FlowerShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-circle', {
        config: {
          x: 0,
          y: -15,
          radius: 12,
          fill: props.material.color,
          opacity: 0.9
        }
      }),
      h('v-circle', {
        config: {
          x: 15,
          y: 0,
          radius: 12,
          fill: props.material.color,
          opacity: 0.9
        }
      }),
      h('v-circle', {
        config: {
          x: 0,
          y: 15,
          radius: 12,
          fill: props.material.color,
          opacity: 0.9
        }
      }),
      h('v-circle', {
        config: {
          x: -15,
          y: 0,
          radius: 12,
          fill: props.material.color,
          opacity: 0.9
        }
      }),
      h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 10,
          fill: '#fbbf24',
          opacity: 0.9
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 38,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.4,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 36,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.3
        }
      }) : null,
      h('v-shadow', {
        config: {
          color: 'black',
          blur: 5,
          offset: { x: 2, y: 2 },
          opacity: 0.2
        }
      })
    ])
  }
}

const ButterflyShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-ellipse', {
        config: {
          x: -12,
          y: -8,
          radiusX: 15,
          radiusY: 12,
          fill: props.material.color,
          opacity: 0.85,
          rotation: -30
        }
      }),
      h('v-ellipse', {
        config: {
          x: 12,
          y: -8,
          radiusX: 15,
          radiusY: 12,
          fill: props.material.color,
          opacity: 0.85,
          rotation: 30
        }
      }),
      h('v-ellipse', {
        config: {
          x: -8,
          y: 8,
          radiusX: 10,
          radiusY: 8,
          fill: props.material.color,
          opacity: 0.75,
          rotation: -20
        }
      }),
      h('v-ellipse', {
        config: {
          x: 8,
          y: 8,
          radiusX: 10,
          radiusY: 8,
          fill: props.material.color,
          opacity: 0.75,
          rotation: 20
        }
      }),
      h('v-ellipse', {
        config: {
          x: 0,
          y: 0,
          radiusX: 3,
          radiusY: 12,
          fill: '#4b5563'
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 38,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.4,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 36,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.3
        }
      }) : null,
      h('v-shadow', {
        config: {
          color: 'black',
          blur: 3,
          offset: { x: 1, y: 1 },
          opacity: 0.2
        }
      })
    ])
  }
}

const RectangleShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-rect', {
        config: {
          x: -25,
          y: -30,
          width: 50,
          height: 60,
          fill: props.material.color,
          cornerRadius: 3,
          shadowColor: 'black',
          shadowBlur: 5,
          shadowOffset: { x: 2, y: 2 },
          shadowOpacity: 0.2
        }
      }),
      h('v-line', {
        config: {
          points: [-18, -20, 18, -20],
          stroke: '#d1d5db',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [-18, -10, 18, -10],
          stroke: '#d1d5db',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [-18, 0, 18, 0],
          stroke: '#d1d5db',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [-18, 10, 18, 10],
          stroke: '#d1d5db',
          strokeWidth: 1
        }
      }),
      props.isPerfect ? h('v-rect', {
        config: {
          x: -29,
          y: -34,
          width: 58,
          height: 68,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.5,
          cornerRadius: 4,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-rect', {
        config: {
          x: -28,
          y: -33,
          width: 56,
          height: 66,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.35,
          cornerRadius: 4
        }
      }) : null
    ])
  }
}

const CircleShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 28,
          fill: props.material.color,
          shadowColor: 'black',
          shadowBlur: 5,
          shadowOffset: { x: 2, y: 2 },
          shadowOpacity: 0.2
        }
      }),
      h('v-circle', {
        config: {
          x: -8,
          y: -8,
          radius: 8,
          fill: 'rgba(255,255,255,0.4)'
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 36,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.45,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 34,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.35
        }
      }) : null
    ])
  }
}

const CicadaShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-ellipse', {
        config: {
          x: 0,
          y: 0,
          radiusX: 12,
          radiusY: 25,
          fill: props.material.color,
          shadowColor: 'black',
          shadowBlur: 3,
          shadowOffset: { x: 1, y: 1 },
          shadowOpacity: 0.2
        }
      }),
      h('v-ellipse', {
        config: {
          x: 0,
          y: -20,
          radiusX: 8,
          radiusY: 8,
          fill: '#4a5568'
        }
      }),
      h('v-ellipse', {
        config: {
          x: -18,
          y: -5,
          radiusX: 10,
          radiusY: 18,
          fill: props.material.color,
          opacity: 0.6,
          rotation: -15
        }
      }),
      h('v-ellipse', {
        config: {
          x: 18,
          y: -5,
          radiusX: 10,
          radiusY: 18,
          fill: props.material.color,
          opacity: 0.6,
          rotation: 15
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 38,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.4,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 36,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.3
        }
      }) : null
    ])
  }
}

const BookShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-rect', {
        config: {
          x: -28,
          y: -20,
          width: 56,
          height: 40,
          fill: props.material.color,
          cornerRadius: 2,
          shadowColor: 'black',
          shadowBlur: 5,
          shadowOffset: { x: 2, y: 2 },
          shadowOpacity: 0.2
        }
      }),
      h('v-rect', {
        config: {
          x: -25,
          y: -17,
          width: 50,
          height: 34,
          fill: '#fffbeb',
          cornerRadius: 1
        }
      }),
      h('v-line', {
        config: {
          points: [0, -17, 0, 17],
          stroke: '#d1d5db',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [-20, -10, -5, -10],
          stroke: '#9ca3af',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [-20, 0, -5, 0],
          stroke: '#9ca3af',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [5, -10, 20, -10],
          stroke: '#9ca3af',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [5, 0, 20, 0],
          stroke: '#9ca3af',
          strokeWidth: 1
        }
      }),
      props.isPerfect ? h('v-rect', {
        config: {
          x: -32,
          y: -24,
          width: 64,
          height: 48,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.45,
          cornerRadius: 3,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-rect', {
        config: {
          x: -30,
          y: -22,
          width: 60,
          height: 44,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.35,
          cornerRadius: 3
        }
      }) : null
    ])
  }
}

const LeafShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-path', {
        config: {
          data: 'M0,-30 C15,-20 20,10 0,30 C-20,10 -15,-20 0,-30',
          fill: props.material.color,
          shadowColor: 'black',
          shadowBlur: 3,
          shadowOffset: { x: 1, y: 1 },
          shadowOpacity: 0.2
        }
      }),
      h('v-line', {
        config: {
          points: [0, -25, 0, 25],
          stroke: 'rgba(0,0,0,0.2)',
          strokeWidth: 1.5
        }
      }),
      h('v-line', {
        config: {
          points: [0, -15, 10, -8],
          stroke: 'rgba(0,0,0,0.15)',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [0, -5, 12, 0],
          stroke: 'rgba(0,0,0,0.15)',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [0, 5, 10, 12],
          stroke: 'rgba(0,0,0,0.15)',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [0, -15, -10, -8],
          stroke: 'rgba(0,0,0,0.15)',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [0, -5, -12, 0],
          stroke: 'rgba(0,0,0,0.15)',
          strokeWidth: 1
        }
      }),
      h('v-line', {
        config: {
          points: [0, 5, -10, 12],
          stroke: 'rgba(0,0,0,0.15)',
          strokeWidth: 1
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 40,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.4,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 38,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.3
        }
      }) : null
    ])
  }
}

const CupShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-path', {
        config: {
          data: 'M-20,-15 L-15,25 Q0,30 15,25 L20,-15 Z',
          fill: props.material.color,
          shadowColor: 'black',
          shadowBlur: 5,
          shadowOffset: { x: 2, y: 2 },
          shadowOpacity: 0.2
        }
      }),
      h('v-ellipse', {
        config: {
          x: 0,
          y: -15,
          radiusX: 20,
          radiusY: 6,
          fill: '#fef3c7'
        }
      }),
      h('v-ellipse', {
        config: {
          x: 0,
          y: -15,
          radiusX: 15,
          radiusY: 4,
          fill: '#78350f',
          opacity: 0.8
        }
      }),
      h('v-path', {
        config: {
          data: 'M20,-5 Q35,-5 35,10 Q35,20 20,15',
          stroke: props.material.color,
          strokeWidth: 4,
          fill: null
        }
      }),
      h('v-path', {
        config: {
          data: 'M-8,-25 Q-6,-32 -8,-38',
          stroke: 'rgba(255,255,255,0.7)',
          strokeWidth: 2,
          fill: null
        }
      }),
      h('v-path', {
        config: {
          data: 'M0,-25 Q2,-32 0,-38',
          stroke: 'rgba(255,255,255,0.7)',
          strokeWidth: 2,
          fill: null
        }
      }),
      h('v-path', {
        config: {
          data: 'M8,-25 Q6,-32 8,-38',
          stroke: 'rgba(255,255,255,0.7)',
          strokeWidth: 2,
          fill: null
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 42,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.4,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 40,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.3
        }
      }) : null
    ])
  }
}

const SnowflakeShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-line', {
        config: {
          points: [0, -25, 0, 25],
          stroke: props.material.color,
          strokeWidth: 3,
          lineCap: 'round',
          shadowColor: 'black',
          shadowBlur: 3,
          shadowOffset: { x: 1, y: 1 },
          shadowOpacity: 0.1
        }
      }),
      h('v-line', {
        config: {
          points: [-22, -12, 22, 12],
          stroke: props.material.color,
          strokeWidth: 3,
          lineCap: 'round'
        }
      }),
      h('v-line', {
        config: {
          points: [-22, 12, 22, -12],
          stroke: props.material.color,
          strokeWidth: 3,
          lineCap: 'round'
        }
      }),
      h('v-line', {
        config: {
          points: [0, -20, -8, -28],
          stroke: props.material.color,
          strokeWidth: 2,
          lineCap: 'round'
        }
      }),
      h('v-line', {
        config: {
          points: [0, -20, 8, -28],
          stroke: props.material.color,
          strokeWidth: 2,
          lineCap: 'round'
        }
      }),
      h('v-line', {
        config: {
          points: [0, 20, -8, 28],
          stroke: props.material.color,
          strokeWidth: 2,
          lineCap: 'round'
        }
      }),
      h('v-line', {
        config: {
          points: [0, 20, 8, 28],
          stroke: props.material.color,
          strokeWidth: 2,
          lineCap: 'round'
        }
      }),
      h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 4,
          fill: props.material.color
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 38,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.4,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 36,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.3
        }
      }) : null
    ])
  }
}

const ScarfShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-rect', {
        config: {
          x: -25,
          y: -10,
          width: 50,
          height: 20,
          fill: props.material.color,
          cornerRadius: 5,
          shadowColor: 'black',
          shadowBlur: 3,
          shadowOffset: { x: 1, y: 1 },
          shadowOpacity: 0.2
        }
      }),
      h('v-rect', {
        config: {
          x: 15,
          y: -5,
          width: 15,
          height: 35,
          fill: props.material.color,
          cornerRadius: 3
        }
      }),
      h('v-line', {
        config: {
          points: [18, 25, 18, 32],
          stroke: props.material.color,
          strokeWidth: 2
        }
      }),
      h('v-line', {
        config: {
          points: [22, 25, 22, 35],
          stroke: props.material.color,
          strokeWidth: 2
        }
      }),
      h('v-line', {
        config: {
          points: [26, 25, 26, 32],
          stroke: props.material.color,
          strokeWidth: 2
        }
      }),
      h('v-rect', {
        config: {
          x: -18,
          y: -8,
          width: 8,
          height: 16,
          fill: 'rgba(255,255,255,0.3)',
          cornerRadius: 2
        }
      }),
      props.isPerfect ? h('v-rect', {
        config: {
          x: -30,
          y: -16,
          width: 60,
          height: 60,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.4,
          cornerRadius: 6,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-rect', {
        config: {
          x: -28,
          y: -14,
          width: 56,
          height: 56,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.35,
          cornerRadius: 6
        }
      }) : null
    ])
  }
}

const HeartShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-path', {
        config: {
          data: 'M0,20 C-30,-10 -30,-30 -10,-30 C0,-30 0,-20 0,-20 C0,-20 0,-30 10,-30 C30,-30 30,-10 0,20',
          fill: props.material.color,
          shadowColor: 'black',
          shadowBlur: 5,
          shadowOffset: { x: 2, y: 2 },
          shadowOpacity: 0.2
        }
      }),
      h('v-ellipse', {
        config: {
          x: -12,
          y: -20,
          radiusX: 6,
          radiusY: 4,
          fill: 'rgba(255,255,255,0.4)',
          rotation: -30
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: -5,
          radius: 42,
          stroke: '#fbbf24',
          strokeWidth: 2.5,
          opacity: 0.5,
          dash: [6, 4]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: -5,
          radius: 40,
          stroke: '#8b5cf6',
          strokeWidth: 2,
          opacity: 0.4
        }
      }) : null
    ])
  }
}

const CloudShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-circle', {
        config: {
          x: -15,
          y: 5,
          radius: 15,
          fill: props.material.color,
          shadowColor: 'black',
          shadowBlur: 3,
          shadowOffset: { x: 1, y: 1 },
          shadowOpacity: 0.1
        }
      }),
      h('v-circle', {
        config: {
          x: 0,
          y: -5,
          radius: 18,
          fill: props.material.color
        }
      }),
      h('v-circle', {
        config: {
          x: 15,
          y: 5,
          radius: 15,
          fill: props.material.color
        }
      }),
      h('v-ellipse', {
        config: {
          x: 0,
          y: 10,
          radiusX: 25,
          radiusY: 10,
          fill: props.material.color
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 38,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.4,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 36,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.3
        }
      }) : null
    ])
  }
}

const StarShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    const outerRadius = 25
    const innerRadius = 10
    const points = []
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (i * Math.PI) / 5 - Math.PI / 2
      points.push(Math.cos(angle) * radius, Math.sin(angle) * radius)
    }
    return () => h('v-group', {}, [
      h('v-line', {
        config: {
          points: points,
          fill: props.material.color,
          closed: true,
          shadowColor: 'black',
          shadowBlur: 5,
          shadowOffset: { x: 2, y: 2 },
          shadowOpacity: 0.2
        }
      }),
      h('v-circle', {
        config: {
          x: -5,
          y: -8,
          radius: 4,
          fill: 'rgba(255,255,255,0.5)'
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 38,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.5,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 36,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.35
        }
      }) : null
    ])
  }
}

const NoteShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-ellipse', {
        config: {
          x: -10,
          y: 15,
          radiusX: 8,
          radiusY: 6,
          fill: props.material.color,
          shadowColor: 'black',
          shadowBlur: 3,
          shadowOffset: { x: 1, y: 1 },
          shadowOpacity: 0.2
        }
      }),
      h('v-ellipse', {
        config: {
          x: 10,
          y: 20,
          radiusX: 8,
          radiusY: 6,
          fill: props.material.color
        }
      }),
      h('v-line', {
        config: {
          points: [-10, 15, -10, -25],
          stroke: props.material.color,
          strokeWidth: 3,
          lineCap: 'round'
        }
      }),
      h('v-line', {
        config: {
          points: [10, 20, 10, -20],
          stroke: props.material.color,
          strokeWidth: 3,
          lineCap: 'round'
        }
      }),
      h('v-line', {
        config: {
          points: [-10, -25, 10, -20],
          stroke: props.material.color,
          strokeWidth: 3,
          lineCap: 'round'
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 40,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.4,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 38,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.3
        }
      }) : null
    ])
  }
}

const MaterialShape = {
  props: ['material', 'index', 'isOptional', 'isPerfect'],
  setup(props) {
    return () => h('v-group', {}, [
      h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 25,
          fill: props.material?.color || '#ccc',
          shadowColor: 'black',
          shadowBlur: 5,
          shadowOffset: { x: 2, y: 2 },
          shadowOpacity: 0.2
        }
      }),
      props.isPerfect ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 34,
          stroke: '#fbbf24',
          strokeWidth: 2,
          opacity: 0.45,
          dash: [5, 5]
        }
      }) : null,
      props.isOptional ? h('v-circle', {
        config: {
          x: 0,
          y: 0,
          radius: 32,
          stroke: '#8b5cf6',
          strokeWidth: 1.5,
          opacity: 0.35
        }
      }) : null
    ])
  }
}

watch(() => props.background, () => {
  if (layerRef.value) {
    layerRef.value.getLayer().batchDraw()
  }
})

watch(sceneBackgroundOverride, () => {
  if (layerRef.value) {
    layerRef.value.getLayer().batchDraw()
  }
})

watch(() => gameStore.placedMaterials, () => {
  if (layerRef.value) {
    layerRef.value.getLayer().batchDraw()
  }
}, { deep: true })

watch(optionalMaterialsPlaced, () => {
  if (layerRef.value) {
    layerRef.value.getLayer().batchDraw()
  }
}, { deep: true })

watch(comboJustTriggered, (val) => {
  if (val && layerRef.value) {
    setTimeout(() => {
      layerRef.value.getLayer().batchDraw()
    }, 100)
  }
})

watch([selectedMaterial, snappedPos], () => {
  if (selectedMaterial.value) {
    placementValidation.value = validatePlacement(snappedPos.value.x, snappedPos.value.y)
  } else {
    placementValidation.value = null
  }
})

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
})

defineExpose({
  selectMaterial,
  resetCanvas
})
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  transition: box-shadow 0.4s ease;
}

.canvas-container.has-overlay {
  box-shadow: 0 10px 40px rgba(244, 114, 182, 0.25), 0 0 0 1px rgba(244, 114, 182, 0.1);
}

.bg-transition-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0;
  transition: opacity 1s ease;
  animation: bgFadeIn 1s ease forwards;
  pointer-events: none;
}

@keyframes bgFadeIn {
  to {
    opacity: 1;
  }
}

.material-hint {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 24px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-md);
  z-index: 10;
  font-weight: 500;
  color: var(--accent-pink);
  max-width: 90%;
}

.material-hint.optional-hint {
  background: linear-gradient(135deg, rgba(250, 245, 255, 0.98), rgba(245, 243, 255, 0.98));
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.hint-icon {
  font-size: 1.2rem;
}

.hint-text {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.placement-feedback {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  z-index: 20;
  pointer-events: none;
  white-space: nowrap;
}

.placement-feedback.perfect {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.placement-feedback.normal {
  background: rgba(255, 255, 255, 0.95);
  color: #4b5563;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.placement-feedback.optional {
  background: linear-gradient(135deg, #a78bfa, #8b5cf6);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);
}

.placement-feedback.combo {
  background: linear-gradient(135deg, #ec4899, #f472b6, #8b5cf6);
  color: white;
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
  font-size: 0.9rem;
  padding: 10px 20px;
}

.feedback-enter-active {
  animation: feedbackIn 0.3s ease-out;
}

.feedback-leave-active {
  animation: feedbackOut 0.5s ease-in;
}

@keyframes feedbackIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes feedbackOut {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) translateY(-30px);
  }
}

.combo-trigger-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
  background: radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%);
}

.combo-glow {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(244, 114, 182, 0.4) 0%, rgba(139, 92, 246, 0.2) 40%, transparent 70%);
  animation: glowPulse 1.5s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.combo-card {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 28px 32px;
  text-align: center;
  max-width: 85%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: comboCardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 2px solid transparent;
  background-image: linear-gradient(white, white), linear-gradient(135deg, #ec4899, #8b5cf6, #f59e0b);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

@keyframes comboCardIn {
  from {
    opacity: 0;
    transform: scale(0.3) rotate(-10deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

.combo-burst {
  font-size: 3rem;
  margin-bottom: 8px;
  animation: burstSpin 2s linear infinite;
  display: inline-block;
}

@keyframes burstSpin {
  0%, 100% {
    transform: rotate(-10deg) scale(1);
  }
  50% {
    transform: rotate(10deg) scale(1.1);
  }
}

.combo-label {
  font-size: 0.8rem;
  color: #8b5cf6;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.combo-name {
  font-size: 1.6rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.combo-desc {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 12px;
}

.combo-reward {
  display: inline-block;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.combo-overlay-enter-active {
  animation: comboOverlayIn 0.3s ease;
}

.combo-overlay-leave-active {
  animation: comboOverlayOut 0.5s ease;
}

@keyframes comboOverlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes comboOverlayOut {
  from { opacity: 1; }
  to { opacity: 0; }
  100% {
    .combo-card {
      transform: scale(1.1) translateY(-20px);
    }
  }
}

.scene-effects-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 15;
}

.particle {
  position: absolute;
  top: -50px;
  opacity: 0;
  animation: particleFall linear infinite;
}

@keyframes particleFall {
  0% {
    transform: translateY(-50px) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(600px) rotate(720deg);
    opacity: 0;
  }
}

.canvas-container.is-invalid {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5), var(--shadow-lg);
  animation: invalidShake 0.4s ease;
}

@keyframes invalidShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.snap-indicator {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 6px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 12;
  pointer-events: none;
  box-shadow: var(--shadow-sm);
  animation: snapIndicatorIn 0.2s ease-out;
}

.snap-indicator.snap-grid {
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.snap-indicator.snap-center {
  color: #d97706;
  border: 1px solid rgba(251, 191, 36, 0.4);
  background: linear-gradient(135deg, #fefce8, #fef3c7);
}

.snap-indicator.snap-edge {
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.snap-icon {
  font-size: 0.9rem;
}

@keyframes snapIndicatorIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.validation-error {
  position: absolute;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #dc2626;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  z-index: 25;
  pointer-events: none;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.error-icon {
  font-size: 1rem;
}

.validation-enter-active {
  animation: validationIn 0.2s ease-out;
}

.validation-leave-active {
  animation: validationOut 0.2s ease-in;
}

@keyframes validationIn {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}

@keyframes validationOut {
  from {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) scale(0.8);
  }
}

.placement-feedback.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  animation: errorPop 0.3s ease-out;
}

@keyframes errorPop {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.placement-feedback.animated {
  animation: placeSuccess 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes placeSuccess {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 0;
  }
  60% {
    transform: translate(-50%, -50%) scale(1.15);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.placement-feedback.perfect {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
  animation: perfectGlow 0.6s ease-out;
}

@keyframes perfectGlow {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 0 0 30px 10px rgba(251, 191, 36, 0.4);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
  }
}

@media (max-width: 768px) {
  .material-hint {
    top: 12px;
    padding: 10px 18px;
  }

  .hint-text {
    font-size: 0.8rem;
  }

  .combo-card {
    padding: 22px 24px;
  }

  .combo-name {
    font-size: 1.3rem;
  }

  .combo-desc {
    font-size: 0.8rem;
  }

  .particle {
    font-size: 14px !important;
  }

  .snap-indicator {
    bottom: 10px;
    padding: 4px 12px;
    font-size: 0.75rem;
  }

  .validation-error {
    padding: 6px 12px;
    font-size: 0.75rem;
  }

  .placement-feedback {
    padding: 6px 12px;
    font-size: 0.75rem;
  }

  .placement-feedback.combo {
    padding: 8px 14px;
    font-size: 0.8rem;
  }
}
</style>
