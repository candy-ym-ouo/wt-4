<template>
  <StoryEditorView
    :hasDetail="hasDetail"
    :detailTitle="detailTitle"
  >
    <template #sidebar>
      <ChaptersPanel v-if="editorStore.activeTab === 'chapters'" />
      <ScenesPanel v-else-if="editorStore.activeTab === 'scenes'" />
      <DialoguesPanel v-else-if="editorStore.activeTab === 'dialogues'" />
      <CombosPanel v-else-if="editorStore.activeTab === 'combos'" />
      <EndingsPanel v-else-if="editorStore.activeTab === 'endings'" />
      <DataIoPanel v-else-if="editorStore.activeTab === 'io'" />
    </template>

    <template #main>
      <ChaptersMain v-if="editorStore.activeTab === 'chapters'" />
      <ScenesMain v-else-if="editorStore.activeTab === 'scenes'" />
      <DialoguesMain v-else-if="editorStore.activeTab === 'dialogues'" />
      <CombosMain v-else-if="editorStore.activeTab === 'combos'" />
      <EndingsMain v-else-if="editorStore.activeTab === 'endings'" />
      <DataIoMain v-else-if="editorStore.activeTab === 'io'" />
    </template>

    <template #detail>
      <ChapterDetail v-if="editorStore.activeTab === 'chapters' && editorStore.selectedChapter" />
      <SceneDetail v-else-if="editorStore.activeTab === 'scenes' && editorStore.selectedScene" />
      <DialogueDetail v-else-if="editorStore.activeTab === 'dialogues' && editorStore.selectedDialogue" />
      <ComboDetail v-else-if="editorStore.activeTab === 'combos' && editorStore.selectedCombo" />
      <EndingDetail v-else-if="editorStore.activeTab === 'endings' && editorStore.selectedEnding" />
      <div v-else class="empty-detail">
        <span class="empty-icon">👈</span>
        <p class="empty-text">从左侧选择项目进行编辑</p>
      </div>
    </template>
  </StoryEditorView>
</template>

<script setup>
import { computed } from 'vue'
import { useEditorStore } from '../stores/editorStore'
import StoryEditorView from './StoryEditorView.vue'

import ChaptersPanel from '../components/editor/ChaptersPanel.vue'
import ScenesPanel from '../components/editor/ScenesPanel.vue'
import DialoguesPanel from '../components/editor/DialoguesPanel.vue'
import CombosPanel from '../components/editor/CombosPanel.vue'
import EndingsPanel from '../components/editor/EndingsPanel.vue'
import DataIoPanel from '../components/editor/DataIoPanel.vue'

import ChaptersMain from '../components/editor/ChaptersMain.vue'
import ScenesMain from '../components/editor/ScenesMain.vue'
import DialoguesMain from '../components/editor/DialoguesMain.vue'
import CombosMain from '../components/editor/CombosMain.vue'
import EndingsMain from '../components/editor/EndingsMain.vue'
import DataIoMain from '../components/editor/DataIoMain.vue'

import ChapterDetail from '../components/editor/ChapterDetail.vue'
import SceneDetail from '../components/editor/SceneDetail.vue'
import DialogueDetail from '../components/editor/DialogueDetail.vue'
import ComboDetail from '../components/editor/ComboDetail.vue'
import EndingDetail from '../components/editor/EndingDetail.vue'

const editorStore = useEditorStore()

const hasDetail = computed(() => {
  switch (editorStore.activeTab) {
    case 'chapters': return !!editorStore.selectedChapter
    case 'scenes': return !!editorStore.selectedScene
    case 'dialogues': return !!editorStore.selectedDialogue
    case 'combos': return !!editorStore.selectedCombo
    case 'endings': return !!editorStore.selectedEnding
    default: return false
  }
})

const detailTitle = computed(() => {
  switch (editorStore.activeTab) {
    case 'chapters': return '📚 章节详情'
    case 'scenes': return '🎬 场景详情'
    case 'dialogues': return '💬 对白详情'
    case 'combos': return '✨ 组合详情'
    case 'endings': return '🌟 结局详情'
    default: return '详情'
  }
})
</script>

<style scoped>
.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 0.95rem;
}
</style>
