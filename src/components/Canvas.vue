<template>
  <div class="canvas-container" ref="containerRef">
    <v-stage
      ref="stageRef"
      :config="stageConfig"
      @click="handleStageClick"
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

        <v-group
          v-for="(placed, index) in placedMaterials"
          :key="`${placed.id}-${index}`"
          :config="{
            x: placed.x,
            y: placed.y,
            rotation: placed.rotation || 0,
            draggable: true,
            offsetX: 30,
            offsetY: 30
          }"
          @dragend="(e) => handleDragEnd(e, index)"
        >
          <component
            :is="getShapeComponent(placed.id)"
            :material="getMaterialById(placed.id)"
            :index="index"
          />
        </v-group>

        <v-group
          v-if="selectedMaterial && isWaitingForMaterial"
          :config="{
            x: mousePos.x,
            y: mousePos.y,
            offsetX: 30,
            offsetY: 30,
            opacity: 0.6,
            listening: false
          }"
        >
          <component
            :is="getShapeComponent(selectedMaterial.id)"
            :material="selectedMaterial"
            :index="-1"
          />
        </v-group>
      </v-layer>
    </v-stage>

    <div v-if="isWaitingForMaterial && requiredMaterial" class="material-hint pulse">
      <span class="hint-icon">✨</span>
      <span class="hint-text">请放置「{{ requiredMaterial.name }}」</span>
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

const placedMaterials = computed(() => gameStore.placedMaterials)
const isWaitingForMaterial = computed(() => gameStore.isWaitingForMaterial)
const requiredMaterialId = computed(() => gameStore.requiredMaterialId)

const requiredMaterial = computed(() => {
  if (!requiredMaterialId.value) return null
  return gameStore.getMaterialById(requiredMaterialId.value)
})

const stageConfig = computed(() => ({
  width: stageWidth.value,
  height: stageHeight.value
}))

const gradientColors = computed(() => {
  const colors = props.background.match(/#[a-fA-F0-9]{6}/g) || ['#fef3c7', '#fde68a']
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

const handleStageClick = (e) => {
  if (!isWaitingForMaterial.value || !selectedMaterial.value) return

  const stage = e.target.getStage()
  const pos = stage.getPointerPosition()

  if (selectedMaterial.value.id === requiredMaterialId.value) {
    const success = gameStore.placeMaterial(selectedMaterial.value.id, pos)
    if (success) {
      emit('materialPlaced', selectedMaterial.value)
      selectedMaterial.value = null
    }
  }
}

const handleDragEnd = (e, index) => {
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
  if (!isWaitingForMaterial.value) return
  selectedMaterial.value = material
}

const handleResize = () => {
  if (!containerRef.value) return
  const width = Math.min(containerRef.value.offsetWidth, 600)
  stageWidth.value = width
  stageHeight.value = Math.min(450, width * 0.75)
}

const FlowerShape = {
  props: ['material', 'index'],
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
  props: ['material', 'index'],
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
  props: ['material', 'index'],
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
      })
    ])
  }
}

const CircleShape = {
  props: ['material', 'index'],
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
      })
    ])
  }
}

const CicadaShape = {
  props: ['material', 'index'],
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
      })
    ])
  }
}

const BookShape = {
  props: ['material', 'index'],
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
      })
    ])
  }
}

const LeafShape = {
  props: ['material', 'index'],
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
      })
    ])
  }
}

const CupShape = {
  props: ['material', 'index'],
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
      })
    ])
  }
}

const SnowflakeShape = {
  props: ['material', 'index'],
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
      })
    ])
  }
}

const ScarfShape = {
  props: ['material', 'index'],
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
      })
    ])
  }
}

const HeartShape = {
  props: ['material', 'index'],
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
      })
    ])
  }
}

const CloudShape = {
  props: ['material', 'index'],
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
      })
    ])
  }
}

const StarShape = {
  props: ['material', 'index'],
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
      })
    ])
  }
}

const NoteShape = {
  props: ['material', 'index'],
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
      })
    ])
  }
}

const MaterialShape = {
  props: ['material', 'index'],
  setup(props) {
    return () => h('v-circle', {
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
    })
  }
}

watch(() => props.background, () => {
  if (layerRef.value) {
    layerRef.value.getLayer().batchDraw()
  }
})

watch(() => gameStore.placedMaterials, () => {
  if (layerRef.value) {
    layerRef.value.getLayer().batchDraw()
  }
}, { deep: true })

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
  selectMaterial
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
}

.hint-icon {
  font-size: 1.2rem;
}

.hint-text {
  font-size: 0.95rem;
}
</style>
