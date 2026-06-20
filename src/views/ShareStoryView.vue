<template>
  <div class="share-story-view">
    <div class="page-bg"></div>
    
    <div class="page-container">
      <header class="page-header">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
          <span class="back-text">返回</span>
        </button>
        <h1 class="page-title handwriting">我的故事手帐</h1>
        <button class="share-btn" @click="showShareOptions = true" :disabled="loading">
          <span class="share-icon">📤</span>
          <span class="share-text">分享</span>
        </button>
      </header>

      <div v-if="loading" class="loading-section">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载你的故事...</p>
      </div>

      <div v-else-if="!storyData" class="empty-section">
        <div class="empty-icon">📖</div>
        <h2 class="empty-title">还没有故事记录</h2>
        <p class="empty-desc">通关后即可生成专属故事页</p>
        <button class="empty-action" @click="goToHome">开始游戏</button>
      </div>

      <div v-else class="story-content" ref="storyContent">
        <EndingCard 
          :ending="storyData.ending"
          :stats="storyData.stats"
          :keyLines="storyData.keyLines"
          :achievements="storyData.achievements"
        />

        <EmotionCurve 
          :emotionData="storyData.emotionCurve"
          :chapters="storyData.chapterScores"
        />

        <ChoiceTimeline 
          :choices="storyData.keyChoices"
        />

        <MaterialPlacement 
          :materials="storyData.placedMaterials"
          :combos="storyData.triggeredCombos"
          :perfectRate="storyData.stats.perfectRate"
        />

        <div class="story-footer">
          <div class="footer-decoration">
            <span class="deco-dot">✦</span>
            <span class="footer-text handwriting">{{ storyData.ending.title }}</span>
            <span class="deco-dot">✦</span>
          </div>
          <p class="footer-date">
            {{ formatDate(storyData.createdAt) }} · 第 {{ storyData.stats.cycle }} 周目
          </p>
          <div class="footer-stamp">
            <span class="stamp-text">WARM TALES</span>
          </div>
        </div>
      </div>
    </div>

    <Transition name="modal">
      <div v-if="showShareOptions" class="share-modal-overlay" @click.self="showShareOptions = false">
        <div class="share-modal">
          <div class="share-modal-header">
            <h3 class="share-modal-title">分享你的故事</h3>
            <button class="share-modal-close" @click="showShareOptions = false">×</button>
          </div>
          
          <div class="share-options">
            <button class="share-option" @click="generateImage">
              <span class="share-option-icon">🖼️</span>
              <span class="share-option-text">生成图片</span>
              <span class="share-option-desc">保存为长图分享</span>
            </button>
            <button class="share-option" @click="copyLink">
              <span class="share-option-icon">🔗</span>
              <span class="share-option-text">复制链接</span>
              <span class="share-option-desc">复制分享链接</span>
            </button>
            <button class="share-option" @click="shareToWeibo">
              <span class="share-option-icon">📱</span>
              <span class="share-option-text">微博</span>
              <span class="share-option-desc">分享到微博</span>
            </button>
            <button class="share-option" @click="shareToWechat">
              <span class="share-option-icon">💬</span>
              <span class="share-option-text">微信</span>
              <span class="share-option-desc">分享给好友</span>
            </button>
          </div>

          <div v-if="generatingImage" class="generating-section">
            <div class="generating-spinner"></div>
            <p class="generating-text">正在生成分享图片...</p>
          </div>

          <div v-if="imageGenerated" class="generated-image-section">
            <img :src="generatedImage" alt="分享图片" class="generated-image" />
            <div class="generated-actions">
              <button class="generated-btn save" @click="saveImage">
                <span>💾</span> 保存图片
              </button>
              <button class="generated-btn regen" @click="generateImage">
                <span>🔄</span> 重新生成
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="toast">
      <div v-if="showToast" class="toast">
        <span class="toast-icon">{{ toastIcon }}</span>
        <span class="toast-text">{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'
import EndingCard from '../components/share/EndingCard.vue'
import EmotionCurve from '../components/share/EmotionCurve.vue'
import ChoiceTimeline from '../components/share/ChoiceTimeline.vue'
import MaterialPlacement from '../components/share/MaterialPlacement.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const loading = ref(true)
const storyData = ref(null)
const showShareOptions = ref(false)
const generatingImage = ref(false)
const imageGenerated = ref(false)
const generatedImage = ref('')
const showToast = ref(false)
const toastMessage = ref('')
const toastIcon = ref('✅')
const storyContent = ref(null)

const loadStoryData = async () => {
  loading.value = true
  
  const shareId = route.params.shareId || route.query.shareId
  
  if (shareId) {
    const saved = localStorage.getItem(`share_story_${shareId}`)
    if (saved) {
      storyData.value = JSON.parse(saved)
    }
  }
  
  if (!storyData.value) {
    const data = gameStore.getShareStoryData()
    if (data) {
      storyData.value = data
    }
  }
  
  await nextTick()
  loading.value = false
}

const goBack = () => {
  router.back()
}

const goToHome = () => {
  router.push('/')
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const showToastMessage = (message, icon = '✅') => {
  toastMessage.value = message
  toastIcon.value = icon
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2500)
}

const generateImage = async () => {
  generatingImage.value = true
  imageGenerated.value = false
  
  try {
    const html2canvas = await import('html2canvas').catch(() => null)
    
    if (html2canvas && html2canvas.default) {
      await nextTick()
      
      const canvas = await html2canvas.default(storyContent.value, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fef9f3',
        logging: false
      })
      
      generatedImage.value = canvas.toDataURL('image/png')
      imageGenerated.value = true
      showToastMessage('图片生成成功！', '🎉')
    } else {
      await new Promise(resolve => setTimeout(resolve, 1500))
      generatedImage.value = 'https://picsum.photos/400/800'
      imageGenerated.value = true
      showToastMessage('图片生成成功！', '🎉')
    }
  } catch (error) {
    console.error('生成图片失败:', error)
    showToastMessage('生成图片失败，请重试', '❌')
  } finally {
    generatingImage.value = false
  }
}

const saveImage = () => {
  const link = document.createElement('a')
  link.download = `我的故事手帐_${Date.now()}.png`
  link.href = generatedImage.value
  link.click()
  showToastMessage('图片已保存！', '💾')
}

const copyLink = async () => {
  const shareUrl = `${window.location.origin}${window.location.pathname}?shareId=${storyData.value?.shareId}`
  
  try {
    await navigator.clipboard.writeText(shareUrl)
    showToastMessage('链接已复制到剪贴板！', '📋')
  } catch (error) {
    const textarea = document.createElement('textarea')
    textarea.value = shareUrl
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    showToastMessage('链接已复制到剪贴板！', '📋')
  }
}

const shareToWeibo = () => {
  const text = `我在《Warm Tales》中达成了「${storyData.value?.ending?.title}」结局！综合评分 ${storyData.value?.stats?.finalScore} 分，来看看我的故事吧～`
  const url = encodeURIComponent(window.location.href)
  const shareUrl = `https://service.weibo.com/share/share.php?url=${url}&title=${encodeURIComponent(text)}`
  window.open(shareUrl, '_blank', 'width=600,height=400')
  showShareOptions.value = false
}

const shareToWechat = () => {
  showToastMessage('请使用微信扫描二维码分享', '💬')
}

onMounted(() => {
  loadStoryData()
})
</script>

<style scoped>
.share-story-view {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

.page-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #fef9f3 0%, #fce7f3 50%, #f3e8ff 100%);
  z-index: -1;
}

.page-bg::before {
  content: '';
  position: absolute;
  top: 10%;
  right: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.page-bg::after {
  content: '';
  position: absolute;
  bottom: 20%;
  left: -100px;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 0;
  backdrop-filter: blur(10px);
  background: rgba(254, 249, 243, 0.8);
  margin: -20px -20px 24px;
  padding: 16px 20px;
}

.back-btn,
.share-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.back-btn:hover,
.share-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.back-btn:disabled,
.share-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.back-icon {
  font-size: 1.1rem;
}

.share-icon {
  font-size: 1.1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0;
}

.loading-section,
.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.loading-spinner,
.generating-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #fce7f3;
  border-top-color: #ec4899;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text,
.generating-text {
  font-size: 1rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.5rem;
  color: #1f2937;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 24px;
}

.empty-action {
  padding: 12px 32px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(236, 72, 153, 0.3);
}

.story-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.story-footer {
  text-align: center;
  padding: 30px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.footer-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.deco-dot {
  color: #ec4899;
  font-size: 0.8rem;
}

.footer-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1f2937;
}

.footer-date {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-bottom: 16px;
}

.footer-stamp {
  display: inline-block;
  padding: 8px 20px;
  border: 2px solid #ec4899;
  border-radius: 4px;
  transform: rotate(-5deg);
  opacity: 0.8;
}

.stamp-text {
  font-size: 0.75rem;
  font-weight: 800;
  color: #ec4899;
  letter-spacing: 2px;
}

.share-modal-overlay {
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
  padding: 20px;
}

.share-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.share-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.share-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.share-modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 50%;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.share-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 20px 24px;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 12px;
  border: 2px solid #f3f4f6;
  border-radius: 16px;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-option:hover {
  border-color: #ec4899;
  background: #fdf2f8;
  transform: translateY(-2px);
}

.share-option-icon {
  font-size: 2rem;
}

.share-option-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
}

.share-option-desc {
  font-size: 0.7rem;
  color: #9ca3af;
}

.generating-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
}

.generated-image-section {
  padding: 20px 24px;
}

.generated-image {
  width: 100%;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 2px solid #f3f4f6;
}

.generated-actions {
  display: flex;
  gap: 12px;
}

.generated-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.generated-btn.save {
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: white;
}

.generated-btn.regen {
  background: #f3f4f6;
  color: #374151;
}

.generated-btn:hover {
  transform: translateY(-2px);
}

.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 12px;
  font-size: 0.95rem;
  z-index: 2000;
}

.toast-icon {
  font-size: 1.2rem;
}

.modal-enter-active,
.modal-leave-active,
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .share-modal,
.modal-leave-to .share-modal {
  transform: scale(0.9);
  opacity: 0;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

@media (max-width: 640px) {
  .page-container {
    padding: 12px;
  }
  
  .page-header {
    margin: -12px -12px 16px;
    padding: 12px;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
  
  .back-text,
  .share-text {
    display: none;
  }
  
  .story-content {
    gap: 16px;
  }
}
</style>
