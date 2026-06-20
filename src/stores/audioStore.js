import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import audioManager, { AUDIO_CHANNELS } from '../utils/audioManager'
import audiosData from '../data/audios.json'

export const useAudioStore = defineStore('audio', () => {
  const isInitialized = ref(false)
  const isMuted = ref(false)
  const isPaused = ref(false)
  
  const globalVolume = ref(0.7)
  const ambientVolume = ref(0.6)
  const musicVolume = ref(0.5)
  const narrationVolume = ref(0.8)
  const sfxVolume = ref(0.6)
  
  const currentAmbientId = ref(null)
  const currentMusicId = ref(null)
  const currentNarrationId = ref(null)
  
  const currentSceneAudio = ref({ ambient: null, music: null })
  const currentEndingAudio = ref({ music: null, ambient: null })
  
  const showAudioPanel = ref(false)
  
  const isNarrationEnabled = ref(true)
  const isAmbientEnabled = ref(true)
  const isMusicEnabled = ref(true)
  const isSfxEnabled = ref(true)
  
  const narrationQueue = ref([])
  const isPlayingNarration = ref(false)
  
  const initAudio = () => {
    if (isInitialized.value) return
    
    audioManager.init(audiosData)
    
    loadAudioSettings()
    
    audioManager.setGlobalVolume(globalVolume.value)
    audioManager.setChannelVolume(AUDIO_CHANNELS.ambient, ambientVolume.value)
    audioManager.setChannelVolume(AUDIO_CHANNELS.music, musicVolume.value)
    audioManager.setChannelVolume(AUDIO_CHANNELS.narration, narrationVolume.value)
    audioManager.setChannelVolume(AUDIO_CHANNELS.sfx, sfxVolume.value)
    
    isInitialized.value = true
    
    console.log('[Audio] Audio system initialized')
  }
  
  const loadAudioSettings = () => {
    try {
      const saved = localStorage.getItem('audio_settings')
      if (saved) {
        const settings = JSON.parse(saved)
        if (settings.globalVolume !== undefined) globalVolume.value = settings.globalVolume
        if (settings.ambientVolume !== undefined) ambientVolume.value = settings.ambientVolume
        if (settings.musicVolume !== undefined) musicVolume.value = settings.musicVolume
        if (settings.narrationVolume !== undefined) narrationVolume.value = settings.narrationVolume
        if (settings.sfxVolume !== undefined) sfxVolume.value = settings.sfxVolume
        if (settings.isNarrationEnabled !== undefined) isNarrationEnabled.value = settings.isNarrationEnabled
        if (settings.isAmbientEnabled !== undefined) isAmbientEnabled.value = settings.isAmbientEnabled
        if (settings.isMusicEnabled !== undefined) isMusicEnabled.value = settings.isMusicEnabled
        if (settings.isSfxEnabled !== undefined) isSfxEnabled.value = settings.isSfxEnabled
        if (settings.isMuted !== undefined) isMuted.value = settings.isMuted
      }
    } catch (e) {
      console.warn('Failed to load audio settings:', e)
    }
  }
  
  const saveAudioSettings = () => {
    try {
      const settings = {
        globalVolume: globalVolume.value,
        ambientVolume: ambientVolume.value,
        musicVolume: musicVolume.value,
        narrationVolume: narrationVolume.value,
        sfxVolume: sfxVolume.value,
        isNarrationEnabled: isNarrationEnabled.value,
        isAmbientEnabled: isAmbientEnabled.value,
        isMusicEnabled: isMusicEnabled.value,
        isSfxEnabled: isSfxEnabled.value,
        isMuted: isMuted.value
      }
      localStorage.setItem('audio_settings', JSON.stringify(settings))
    } catch (e) {
      console.warn('Failed to save audio settings:', e)
    }
  }
  
  const setGlobalVolume = (volume) => {
    globalVolume.value = Math.max(0, Math.min(1, volume))
    audioManager.setGlobalVolume(globalVolume.value)
    saveAudioSettings()
  }
  
  const setAmbientVolume = (volume) => {
    ambientVolume.value = Math.max(0, Math.min(1, volume))
    audioManager.setChannelVolume(AUDIO_CHANNELS.ambient, ambientVolume.value)
    saveAudioSettings()
  }
  
  const setMusicVolume = (volume) => {
    musicVolume.value = Math.max(0, Math.min(1, volume))
    audioManager.setChannelVolume(AUDIO_CHANNELS.music, musicVolume.value)
    saveAudioSettings()
  }
  
  const setNarrationVolume = (volume) => {
    narrationVolume.value = Math.max(0, Math.min(1, volume))
    audioManager.setChannelVolume(AUDIO_CHANNELS.narration, narrationVolume.value)
    saveAudioSettings()
  }
  
  const setSfxVolume = (volume) => {
    sfxVolume.value = Math.max(0, Math.min(1, volume))
    audioManager.setChannelVolume(AUDIO_CHANNELS.sfx, sfxVolume.value)
    saveAudioSettings()
  }
  
  const toggleMute = () => {
    isMuted.value = !isMuted.value
    audioManager.setGlobalMuted(isMuted.value)
    saveAudioSettings()
  }
  
  const toggleAmbient = () => {
    isAmbientEnabled.value = !isAmbientEnabled.value
    audioManager.setChannelMuted(AUDIO_CHANNELS.ambient, !isAmbientEnabled.value)
    saveAudioSettings()
    
    if (isAmbientEnabled.value && currentAmbientId.value) {
      playAmbient(currentAmbientId.value)
    }
  }
  
  const toggleMusic = () => {
    isMusicEnabled.value = !isMusicEnabled.value
    audioManager.setChannelMuted(AUDIO_CHANNELS.music, !isMusicEnabled.value)
    saveAudioSettings()
    
    if (isMusicEnabled.value && currentMusicId.value) {
      playMusic(currentMusicId.value)
    }
  }
  
  const toggleNarration = () => {
    isNarrationEnabled.value = !isNarrationEnabled.value
    audioManager.setChannelMuted(AUDIO_CHANNELS.narration, !isNarrationEnabled.value)
    saveAudioSettings()
    
    if (!isNarrationEnabled.value) {
      stopNarration()
    }
  }
  
  const toggleSfx = () => {
    isSfxEnabled.value = !isSfxEnabled.value
    audioManager.setChannelMuted(AUDIO_CHANNELS.sfx, !isSfxEnabled.value)
    saveAudioSettings()
  }
  
  const playAmbient = (ambientId, options = {}) => {
    if (!isInitialized.value) initAudio()
    if (!isAmbientEnabled.value) return false
    
    currentAmbientId.value = ambientId
    return audioManager.playAmbient(ambientId, options)
  }
  
  const playMusic = (musicId, options = {}) => {
    if (!isInitialized.value) initAudio()
    if (!isMusicEnabled.value) return false
    
    currentMusicId.value = musicId
    return audioManager.playMusic(musicId, options)
  }
  
  const playSfx = (sfxId) => {
    if (!isInitialized.value) initAudio()
    if (!isSfxEnabled.value) return false
    
    return audioManager.playSfx(sfxId)
  }
  
  const playNarration = (narrationId, options = {}) => {
    if (!isInitialized.value) initAudio()
    if (!isNarrationEnabled.value) return false
    
    currentNarrationId.value = narrationId
    
    return audioManager.playNarration(narrationId, {
      ...options,
      onEnded: () => {
        isPlayingNarration.value = false
        processNarrationQueue()
        if (options.onEnded) options.onEnded()
      }
    })
  }
  
  const enqueueNarration = (speaker, dialogueId, text) => {
    if (!isNarrationEnabled.value) return
    
    const narrationConfig = getNarrationConfig(speaker)
    
    narrationQueue.value.push({
      speaker,
      dialogueId,
      text,
      config: narrationConfig
    })
    
    if (!isPlayingNarration.value) {
      processNarrationQueue()
    }
  }
  
  const processNarrationQueue = () => {
    if (narrationQueue.value.length === 0) {
      isPlayingNarration.value = false
      return
    }
    
    const nextItem = narrationQueue.value.shift()
    
    if (nextItem.config && nextItem.config.id) {
      isPlayingNarration.value = true
      playNarration(nextItem.config.id)
    } else {
      processNarrationQueue()
    }
  }
  
  const clearNarrationQueue = () => {
    narrationQueue.value = []
    isPlayingNarration.value = false
    stopNarration()
  }
  
  const stopNarration = () => {
    audioManager.stopChannel(AUDIO_CHANNELS.narration)
    currentNarrationId.value = null
    isPlayingNarration.value = false
  }
  
  const stopAmbient = (options = {}) => {
    audioManager.stopChannel(AUDIO_CHANNELS.ambient, options)
    currentAmbientId.value = null
  }
  
  const stopMusic = (options = {}) => {
    audioManager.stopChannel(AUDIO_CHANNELS.music, options)
    currentMusicId.value = null
  }
  
  const crossfadeAmbient = (newAmbientId, duration = 2000) => {
    if (!isAmbientEnabled.value) {
      currentAmbientId.value = newAmbientId
      return
    }
    currentAmbientId.value = newAmbientId
    audioManager.crossfadeAmbient(newAmbientId, duration)
  }
  
  const crossfadeMusic = (newMusicId, duration = 2000) => {
    if (!isMusicEnabled.value) {
      currentMusicId.value = newMusicId
      return
    }
    currentMusicId.value = newMusicId
    audioManager.crossfadeMusic(newMusicId, duration)
  }
  
  const getSceneAudio = (sceneId, timeOfDay, weather) => {
    const variantKey = `${timeOfDay}_${weather}`
    const sceneMapping = audiosData.sceneMapping?.[sceneId]
    
    if (!sceneMapping) return null
    
    const variantAudio = sceneMapping[variantKey] || sceneMapping[Object.keys(sceneMapping)[0]]
    
    return variantAudio || null
  }
  
  const changeSceneAudio = (sceneId, timeOfDay, weather) => {
    if (!isInitialized.value) initAudio()
    
    const sceneAudio = getSceneAudio(sceneId, timeOfDay, weather)
    if (!sceneAudio) return
    
    currentSceneAudio.value = sceneAudio
    
    if (sceneAudio.ambient && sceneAudio.ambient !== currentAmbientId.value) {
      crossfadeAmbient(sceneAudio.ambient, 2000)
    }
    
    if (sceneAudio.music && sceneAudio.music !== currentMusicId.value) {
      crossfadeMusic(sceneAudio.music, 2500)
    }
  }
  
  const getEndingAudio = (endingId) => {
    return audiosData.endingMapping?.[endingId] || null
  }
  
  const playEndingAudio = (endingId) => {
    if (!isInitialized.value) initAudio()
    
    const endingAudio = getEndingAudio(endingId)
    if (!endingAudio) return
    
    currentEndingAudio.value = endingAudio
    
    if (endingAudio.music) {
      crossfadeMusic(endingAudio.music, 3000)
    }
    
    if (endingAudio.ambient) {
      crossfadeAmbient(endingAudio.ambient, 2500)
    }
  }
  
  const getNarrationConfig = (speaker) => {
    const narrationId = audiosData.speakerNarration?.[speaker]
    if (!narrationId) return null
    
    return audiosData.narration?.[narrationId] || null
  }
  
  const playDialogueNarration = (dialogue) => {
    if (!isNarrationEnabled.value) return
    if (!dialogue?.speaker) return
    
    const speaker = dialogue.speaker
    
    if (audiosData.speakerNarration?.[speaker]) {
      enqueueNarration(speaker, dialogue.id, dialogue.text)
    }
  }
  
  const pauseAll = () => {
    if (!isInitialized.value) return
    isPaused.value = true
    audioManager.pauseAll()
  }
  
  const resumeAll = () => {
    if (!isInitialized.value) return
    isPaused.value = false
    audioManager.resumeAll()
  }
  
  const stopAll = (options = {}) => {
    if (!isInitialized.value) return
    audioManager.stopAll(options)
    currentAmbientId.value = null
    currentMusicId.value = null
    currentNarrationId.value = null
    clearNarrationQueue()
  }
  
  const toggleAudioPanel = () => {
    showAudioPanel.value = !showAudioPanel.value
  }
  
  const audioState = computed(() => {
    return {
      isInitialized: isInitialized.value,
      isMuted: isMuted.value,
      isPaused: isPaused.value,
      globalVolume: globalVolume.value,
      ambientVolume: ambientVolume.value,
      musicVolume: musicVolume.value,
      narrationVolume: narrationVolume.value,
      sfxVolume: sfxVolume.value,
      currentAmbientId: currentAmbientId.value,
      currentMusicId: currentMusicId.value,
      currentNarrationId: currentNarrationId.value,
      isAmbientEnabled: isAmbientEnabled.value,
      isMusicEnabled: isMusicEnabled.value,
      isNarrationEnabled: isNarrationEnabled.value,
      isSfxEnabled: isSfxEnabled.value,
      isPlayingNarration: isPlayingNarration.value
    }
  })
  
  return {
    isInitialized,
    isMuted,
    isPaused,
    globalVolume,
    ambientVolume,
    musicVolume,
    narrationVolume,
    sfxVolume,
    currentAmbientId,
    currentMusicId,
    currentNarrationId,
    currentSceneAudio,
    currentEndingAudio,
    showAudioPanel,
    isNarrationEnabled,
    isAmbientEnabled,
    isMusicEnabled,
    isSfxEnabled,
    narrationQueue,
    isPlayingNarration,
    audioState,
    
    initAudio,
    loadAudioSettings,
    saveAudioSettings,
    setGlobalVolume,
    setAmbientVolume,
    setMusicVolume,
    setNarrationVolume,
    setSfxVolume,
    toggleMute,
    toggleAmbient,
    toggleMusic,
    toggleNarration,
    toggleSfx,
    playAmbient,
    playMusic,
    playSfx,
    playNarration,
    enqueueNarration,
    clearNarrationQueue,
    stopNarration,
    stopAmbient,
    stopMusic,
    crossfadeAmbient,
    crossfadeMusic,
    getSceneAudio,
    changeSceneAudio,
    getEndingAudio,
    playEndingAudio,
    getNarrationConfig,
    playDialogueNarration,
    pauseAll,
    resumeAll,
    stopAll,
    toggleAudioPanel
  }
})
