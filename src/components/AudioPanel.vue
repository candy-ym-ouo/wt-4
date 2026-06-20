<template>
  <div v-if="show" class="audio-panel-overlay" @click.self="$emit('close')">
    <div class="audio-panel">
      <div class="panel-header">
        <span class="panel-icon">🔊</span>
        <span class="panel-title">音频设置</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="panel-content">
        <div class="volume-section">
          <div class="volume-item">
            <div class="volume-label">
              <span class="volume-icon">🔊</span>
              <span>总音量</span>
            </div>
            <div class="volume-control">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                v-model.number="localGlobalVolume"
                @input="updateGlobalVolume"
              />
              <span class="volume-value">{{ Math.round(localGlobalVolume * 100) }}%</span>
            </div>
          </div>
        </div>
        
        <div class="volume-divider"></div>
        
        <div class="volume-section">
          <div class="volume-item">
            <div class="volume-label">
              <span class="volume-icon">🎵</span>
              <span>音乐</span>
            </div>
            <div class="volume-control">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                v-model.number="localMusicVolume"
                @input="updateMusicVolume"
              />
              <span class="volume-value">{{ Math.round(localMusicVolume * 100) }}%</span>
            </div>
          </div>
          
          <div class="volume-item">
            <div class="volume-label">
              <span class="volume-icon">🌿</span>
              <span>环境音</span>
            </div>
            <div class="volume-control">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                v-model.number="localAmbientVolume"
                @input="updateAmbientVolume"
              />
              <span class="volume-value">{{ Math.round(localAmbientVolume * 100) }}%</span>
            </div>
          </div>
          
          <div class="volume-item">
            <div class="volume-label">
              <span class="volume-icon">🎙️</span>
              <span>旁白</span>
            </div>
            <div class="volume-control">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                v-model.number="localNarrationVolume"
                @input="updateNarrationVolume"
              />
              <span class="volume-value">{{ Math.round(localNarrationVolume * 100) }}%</span>
            </div>
          </div>
          
          <div class="volume-item">
            <div class="volume-label">
              <span class="volume-icon">✨</span>
              <span>音效</span>
            </div>
            <div class="volume-control">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                v-model.number="localSfxVolume"
                @input="updateSfxVolume"
              />
              <span class="volume-value">{{ Math.round(localSfxVolume * 100) }}%</span>
            </div>
          </div>
        </div>
        
        <div class="volume-divider"></div>
        
        <div class="toggle-section">
          <div class="toggle-item" @click="toggleNarrationEnabled">
            <div class="toggle-label">
              <span class="toggle-icon">🎙️</span>
              <span>旁白配音</span>
            </div>
            <div class="toggle-switch" :class="{ active: localNarrationEnabled }">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>
        
        <div class="current-audio-info" v-if="currentMusicId || currentAmbientId">
          <div class="info-title">当前播放</div>
          <div v-if="currentMusicId" class="info-item">
            <span class="info-icon">🎵</span>
            <span class="info-text">{{ getAudioName(currentMusicId) }}</span>
          </div>
          <div v-if="currentAmbientId" class="info-item">
            <span class="info-icon">🌿</span>
            <span class="info-text">{{ getAudioName(currentAmbientId) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useAudioStore } from '../stores/audioStore'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

const audioStore = useAudioStore()

const localGlobalVolume = ref(audioStore.globalVolume)
const localMusicVolume = ref(audioStore.musicVolume)
const localAmbientVolume = ref(audioStore.ambientVolume)
const localNarrationVolume = ref(audioStore.narrationVolume)
const localSfxVolume = ref(audioStore.sfxVolume)
const localNarrationEnabled = ref(audioStore.isNarrationEnabled)

const currentMusicId = computed(() => audioStore.currentMusicId)
const currentAmbientId = computed(() => audioStore.currentAmbientId)

watch(() => props.show, (newVal) => {
  if (newVal) {
    localGlobalVolume.value = audioStore.globalVolume
    localMusicVolume.value = audioStore.musicVolume
    localAmbientVolume.value = audioStore.ambientVolume
    localNarrationVolume.value = audioStore.narrationVolume
    localSfxVolume.value = audioStore.sfxVolume
    localNarrationEnabled.value = audioStore.isNarrationEnabled
  }
})

const updateGlobalVolume = () => {
  audioStore.setGlobalVolume(localGlobalVolume.value)
}

const updateMusicVolume = () => {
  audioStore.setMusicVolume(localMusicVolume.value)
}

const updateAmbientVolume = () => {
  audioStore.setAmbientVolume(localAmbientVolume.value)
}

const updateNarrationVolume = () => {
  audioStore.setNarrationVolume(localNarrationVolume.value)
}

const updateSfxVolume = () => {
  audioStore.setSfxVolume(localSfxVolume.value)
}

const toggleNarrationEnabled = () => {
  localNarrationEnabled.value = !localNarrationEnabled.value
  audioStore.setNarrationEnabled(localNarrationEnabled.value)
}

const getAudioName = (audioId) => {
  if (!audioId) return ''
  const audio = audioStore.getAudioById(audioId)
  return audio?.name || audioId
}
</script>

<style scoped>
.audio-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.audio-panel {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f472b6, #a78bfa);
  color: white;
}

.panel-icon {
  font-size: 1.5rem;
}

.panel-title {
  font-size: 1.2rem;
  font-weight: 700;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.panel-content {
  padding: 24px;
}

.volume-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.volume-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.volume-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.volume-icon {
  font-size: 1.1rem;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.volume-control input[type="range"] {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, #f472b6, #a78bfa);
  appearance: none;
  cursor: pointer;
}

.volume-control input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  border: 2px solid #f472b6;
}

.volume-control input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  border: 2px solid #f472b6;
}

.volume-value {
  font-size: 0.85rem;
  color: var(--text-secondary);
  min-width: 45px;
  text-align: right;
  font-weight: 600;
}

.volume-divider {
  height: 1px;
  background: var(--border-color, #e5e7eb);
  margin: 20px 0;
}

.toggle-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-primary, #f9fafb);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-item:hover {
  background: var(--bg-secondary, #f3f4f6);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--text-primary);
}

.toggle-icon {
  font-size: 1.2rem;
}

.toggle-switch {
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: #d1d5db;
  position: relative;
  transition: background 0.3s;
}

.toggle-switch.active {
  background: linear-gradient(135deg, #f472b6, #a78bfa);
}

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s;
}

.toggle-switch.active .toggle-knob {
  transform: translateX(22px);
}

.current-audio-info {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #fdf2f8, #faf5ff);
  border-radius: 12px;
  border: 1px solid #fbcfe8;
}

.info-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-icon {
  font-size: 1rem;
}

.info-text {
  flex: 1;
  font-weight: 500;
}
</style>
