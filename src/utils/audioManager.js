const AUDIO_CHANNELS = {
  ambient: 'ambient',
  music: 'music',
  narration: 'narration',
  sfx: 'sfx'
}

class AudioTrack {
  constructor(id, config) {
    this.id = id
    this.config = config
    this.audio = null
    this.isPlaying = false
    this.isPaused = false
    this.isLoading = false
    this.currentVolume = config.volume || 1
    this.targetVolume = config.volume || 1
    this.fadeInterval = null
    this.onEndedCallback = null
  }

  async load() {
    if (this.audio || !this.config.src) return Promise.resolve()
    
    this.isLoading = true
    return new Promise((resolve, reject) => {
      this.audio = new Audio()
      this.audio.src = this.config.src
      this.audio.loop = this.config.loop || false
      this.audio.volume = 0
      this.audio.preload = 'auto'
      
      this.audio.addEventListener('canplaythrough', () => {
        this.isLoading = false
        resolve()
      })
      
      this.audio.addEventListener('error', (e) => {
        this.isLoading = false
        console.warn(`Audio load failed: ${this.config.src}`, e)
        resolve()
      })
      
      this.audio.addEventListener('ended', () => {
        if (!this.config.loop) {
          this.isPlaying = false
          if (this.onEndedCallback) {
            this.onEndedCallback()
          }
        }
      })
      
      this.audio.load()
    })
  }

  async play(options = {}) {
    if (!this.audio && this.config.src) {
      await this.load()
    }
    
    if (!this.audio) return
    
    const { fadeIn = this.config.fadeIn || 0, volume = null, onEnded = null } = options
    
    if (volume !== null) {
      this.targetVolume = volume
    }
    
    if (onEnded) {
      this.onEndedCallback = onEnded
    }
    
    if (this.isPaused) {
      this.audio.currentTime = this.pauseTime || 0
      this.isPaused = false
    }
    
    try {
      await this.audio.play()
      this.isPlaying = true
      
      if (fadeIn > 0) {
        this.fadeTo(this.targetVolume, fadeIn)
      } else {
        this.audio.volume = this.targetVolume
      }
    } catch (e) {
      console.warn(`Audio play failed: ${this.config.src}`, e)
    }
  }

  pause(options = {}) {
    if (!this.audio || !this.isPlaying) return
    
    const { fadeOut = this.config.fadeOut || 0 } = options
    
    const doPause = () => {
      this.pauseTime = this.audio.currentTime
      this.audio.pause()
      this.isPlaying = false
      this.isPaused = true
    }
    
    if (fadeOut > 0) {
      this.fadeTo(0, fadeOut, doPause)
    } else {
      doPause()
    }
  }

  stop(options = {}) {
    if (!this.audio) return
    
    const { fadeOut = this.config.fadeOut || 0 } = options
    
    const doStop = () => {
      this.audio.pause()
      this.audio.currentTime = 0
      this.isPlaying = false
      this.isPaused = false
      this.pauseTime = 0
      this.clearFade()
    }
    
    if (fadeOut > 0) {
      this.fadeTo(0, fadeOut, doStop)
    } else {
      doStop()
    }
  }

  setVolume(volume) {
    this.targetVolume = Math.max(0, Math.min(1, volume))
    if (this.audio && !this.fadeInterval) {
      this.audio.volume = this.targetVolume
    }
  }

  fadeTo(targetVolume, duration, callback) {
    if (!this.audio) {
      if (callback) callback()
      return
    }
    
    this.clearFade()
    
    const startVolume = this.audio.volume
    const endVolume = Math.max(0, Math.min(1, targetVolume))
    const steps = Math.max(1, Math.floor(duration / 50))
    const stepSize = (endVolume - startVolume) / steps
    let currentStep = 0
    
    this.fadeInterval = setInterval(() => {
      currentStep++
      const newVolume = startVolume + stepSize * currentStep
      this.audio.volume = Math.max(0, Math.min(1, newVolume))
      
      if (currentStep >= steps) {
        this.clearFade()
        this.audio.volume = endVolume
        if (callback) callback()
      }
    }, 50)
  }

  clearFade() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval)
      this.fadeInterval = null
    }
  }

  destroy() {
    this.stop()
    this.clearFade()
    if (this.audio) {
      this.audio.src = ''
      this.audio = null
    }
  }
}

class AudioManager {
  constructor() {
    this.tracks = new Map()
    this.channels = {
      [AUDIO_CHANNELS.ambient]: { volume: 1, muted: false, currentTrackId: null },
      [AUDIO_CHANNELS.music]: { volume: 1, muted: false, currentTrackId: null },
      [AUDIO_CHANNELS.narration]: { volume: 1, muted: false, currentTrackId: null },
      [AUDIO_CHANNELS.sfx]: { volume: 1, muted: false, currentTrackId: null }
    }
    this.globalVolume = 1
    this.globalMuted = false
    this.audioConfig = null
    this.isInitialized = false
  }

  init(audioConfig) {
    if (this.isInitialized) return
    this.audioConfig = audioConfig
    this.isInitialized = true
    
    this.loadSettings()
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('audio_settings')
      if (saved) {
        const settings = JSON.parse(saved)
        this.globalVolume = settings.globalVolume ?? 1
        this.globalMuted = settings.globalMuted ?? false
        if (settings.channels) {
          Object.keys(settings.channels).forEach(channel => {
            if (this.channels[channel]) {
              this.channels[channel].volume = settings.channels[channel].volume ?? 1
              this.channels[channel].muted = settings.channels[channel].muted ?? false
            }
          })
        }
      }
    } catch (e) {
      console.warn('Failed to load audio settings:', e)
    }
  }

  saveSettings() {
    try {
      const settings = {
        globalVolume: this.globalVolume,
        globalMuted: this.globalMuted,
        channels: {}
      }
      Object.keys(this.channels).forEach(channel => {
        settings.channels[channel] = {
          volume: this.channels[channel].volume,
          muted: this.channels[channel].muted
        }
      })
      localStorage.setItem('audio_settings', JSON.stringify(settings))
    } catch (e) {
      console.warn('Failed to save audio settings:', e)
    }
  }

  getTrackConfig(trackId) {
    if (!this.audioConfig) return null
    
    const categories = ['ambient', 'music', 'narration', 'sfx']
    for (const category of categories) {
      if (this.audioConfig[category]?.[trackId]) {
        return this.audioConfig[category][trackId]
      }
    }
    return null
  }

  getTrack(trackId) {
    if (!this.tracks.has(trackId)) {
      const config = this.getTrackConfig(trackId)
      if (!config) return null
      this.tracks.set(trackId, new AudioTrack(trackId, config))
    }
    return this.tracks.get(trackId)
  }

  getChannelForTrack(trackId) {
    const config = this.getTrackConfig(trackId)
    return config?.type || null
  }

  getEffectiveVolume(trackId, channel) {
    const track = this.getTrack(trackId)
    if (!track) return 0
    
    const channelConfig = this.channels[channel]
    if (!channelConfig) return 0
    
    if (this.globalMuted || channelConfig.muted) return 0
    
    return track.targetVolume * channelConfig.volume * this.globalVolume
  }

  async playTrack(trackId, options = {}) {
    const track = this.getTrack(trackId)
    if (!track) return false
    
    const channel = this.getChannelForTrack(trackId)
    const { channel: forceChannel = null, fadeIn = null, volume = null, onEnded = null } = options
    
    const targetChannel = forceChannel || channel
    if (targetChannel && this.channels[targetChannel]) {
      const currentTrackId = this.channels[targetChannel].currentTrackId
      if (currentTrackId && currentTrackId !== trackId) {
        this.stopTrack(currentTrackId, { fadeOut: track.config.fadeOut || 1500 })
      }
      this.channels[targetChannel].currentTrackId = trackId
    }
    
    const effectiveVolume = volume ?? track.config.volume
    
    await track.play({
      fadeIn: fadeIn ?? track.config.fadeIn,
      volume: effectiveVolume,
      onEnded
    })
    
    if (track.audio && targetChannel && this.channels[targetChannel]) {
      track.audio.volume = this.getEffectiveVolume(trackId, targetChannel)
    }
    
    return true
  }

  pauseTrack(trackId, options = {}) {
    const track = this.getTrack(trackId)
    if (!track) return
    
    track.pause(options)
  }

  stopTrack(trackId, options = {}) {
    const track = this.getTrack(trackId)
    if (!track) return
    
    const channel = this.getChannelForTrack(trackId)
    if (channel && this.channels[channel]?.currentTrackId === trackId) {
      this.channels[channel].currentTrackId = null
    }
    
    track.stop(options)
  }

  stopChannel(channel, options = {}) {
    const channelConfig = this.channels[channel]
    if (!channelConfig || !channelConfig.currentTrackId) return
    
    this.stopTrack(channelConfig.currentTrackId, options)
  }

  stopAll(options = {}) {
    Object.keys(AUDIO_CHANNELS).forEach(channel => {
      this.stopChannel(channel, options)
    })
  }

  pauseAll(options = {}) {
    this.tracks.forEach((track, trackId) => {
      if (track.isPlaying) {
        track.pause(options)
      }
    })
  }

  resumeAll() {
    this.tracks.forEach((track, trackId) => {
      if (track.isPaused) {
        track.play()
      }
    })
  }

  setGlobalVolume(volume) {
    this.globalVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
    this.saveSettings()
  }

  setChannelVolume(channel, volume) {
    if (!this.channels[channel]) return
    
    this.channels[channel].volume = Math.max(0, Math.min(1, volume))
    this.updateChannelVolumes(channel)
    this.saveSettings()
  }

  setGlobalMuted(muted) {
    this.globalMuted = muted
    this.updateAllVolumes()
    this.saveSettings()
  }

  setChannelMuted(channel, muted) {
    if (!this.channels[channel]) return
    
    this.channels[channel].muted = muted
    this.updateChannelVolumes(channel)
    this.saveSettings()
  }

  toggleGlobalMute() {
    this.setGlobalMuted(!this.globalMuted)
  }

  toggleChannelMute(channel) {
    if (!this.channels[channel]) return
    this.setChannelMuted(channel, !this.channels[channel].muted)
  }

  updateChannelVolumes(channel) {
    const channelConfig = this.channels[channel]
    if (!channelConfig?.currentTrackId) return
    
    const track = this.getTrack(channelConfig.currentTrackId)
    if (track?.audio) {
      track.audio.volume = this.getEffectiveVolume(channelConfig.currentTrackId, channel)
    }
  }

  updateAllVolumes() {
    Object.keys(this.channels).forEach(channel => {
      this.updateChannelVolumes(channel)
    })
  }

  playSfx(sfxId) {
    return this.playTrack(sfxId, { channel: AUDIO_CHANNELS.sfx })
  }

  playAmbient(ambientId, options = {}) {
    return this.playTrack(ambientId, { channel: AUDIO_CHANNELS.ambient, ...options })
  }

  playMusic(musicId, options = {}) {
    return this.playTrack(musicId, { channel: AUDIO_CHANNELS.music, ...options })
  }

  playNarration(narrationId, options = {}) {
    return this.playTrack(narrationId, { channel: AUDIO_CHANNELS.narration, ...options })
  }

  crossfadeAmbient(newAmbientId, duration = 2000) {
    const currentId = this.channels[AUDIO_CHANNELS.ambient].currentTrackId
    
    if (currentId === newAmbientId) return
    
    if (currentId) {
      this.stopTrack(currentId, { fadeOut: duration })
    }
    
    setTimeout(() => {
      this.playAmbient(newAmbientId, { fadeIn: duration })
    }, duration * 0.3)
  }

  crossfadeMusic(newMusicId, duration = 2000) {
    const currentId = this.channels[AUDIO_CHANNELS.music].currentTrackId
    
    if (currentId === newMusicId) return
    
    if (currentId) {
      this.stopTrack(currentId, { fadeOut: duration })
    }
    
    setTimeout(() => {
      this.playMusic(newMusicId, { fadeIn: duration })
    }, duration * 0.3)
  }

  getState() {
    return {
      globalVolume: this.globalVolume,
      globalMuted: this.globalMuted,
      channels: Object.fromEntries(
        Object.entries(this.channels).map(([key, value]) => [
          key,
          {
            volume: value.volume,
            muted: value.muted,
            currentTrackId: value.currentTrackId
          }
        ])
      ),
      activeTracks: Array.from(this.tracks.entries())
        .filter(([_, track]) => track.isPlaying)
        .map(([id]) => id)
    }
  }

  destroy() {
    this.tracks.forEach(track => track.destroy())
    this.tracks.clear()
    this.isInitialized = false
  }
}

const audioManager = new AudioManager()

export { audioManager, AUDIO_CHANNELS, AudioTrack, AudioManager }
export default audioManager
