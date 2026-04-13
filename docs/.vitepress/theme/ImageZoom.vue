<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const visible = ref(false)
const src = ref('')
const alt = ref('')
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, tx: 0, ty: 0 })

// 绑定所有文档图片
function bindImages() {
  const imgs = document.querySelectorAll<HTMLImageElement>('.vp-doc img')
  imgs.forEach((img) => {
    if (img.dataset.zoomBound) return
    img.dataset.zoomBound = '1'
    img.style.cursor = 'zoom-in'
    img.addEventListener('click', () => open(img))
  })
}

function open(img: HTMLImageElement) {
  src.value = img.src
  alt.value = img.alt || ''
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  visible.value = true
  document.body.style.overflow = 'hidden'
}

function close() {
  visible.value = false
  document.body.style.overflow = ''
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.15 : 0.15
  scale.value = Math.min(Math.max(scale.value + delta, 0.5), 5)
}

function onMouseDown(e: MouseEvent) {
  if (e.button !== 0) return
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY, tx: translateX.value, ty: translateY.value }
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  translateX.value = dragStart.value.tx + (e.clientX - dragStart.value.x)
  translateY.value = dragStart.value.ty + (e.clientY - dragStart.value.y)
}

function onMouseUp() {
  isDragging.value = false
}

function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('zoom-backdrop')) {
    close()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (!visible.value) return
  if (e.key === 'Escape') close()
  if (e.key === '+' || e.key === '=') scale.value = Math.min(scale.value + 0.25, 5)
  if (e.key === '-') scale.value = Math.max(scale.value - 0.25, 0.5)
  if (e.key === '0') { scale.value = 1; translateX.value = 0; translateY.value = 0 }
}

function resetZoom() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

// 路由切换后重新绑定新出现的图片
let observer: MutationObserver | null = null

onMounted(() => {
  nextTick(bindImages)
  window.addEventListener('keydown', onKeydown)

  observer = new MutationObserver(() => nextTick(bindImages))
  observer.observe(document.body, { childList: true, subtree: true })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  observer?.disconnect()
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="zoom-fade">
      <div
        v-if="visible"
        class="zoom-backdrop"
        @click="onBackdropClick"
        @wheel.prevent="onWheel"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseUp"
      >
        <!-- 工具栏 -->
        <div class="zoom-toolbar" @click.stop>
          <button class="zoom-tool-btn" @click="scale = Math.min(scale + 0.25, 5)" title="放大 (+)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <span class="zoom-scale-label">{{ Math.round(scale * 100) }}%</span>
          <button class="zoom-tool-btn" @click="scale = Math.max(scale - 0.25, 0.5)" title="缩小 (-)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <button class="zoom-tool-btn" @click="resetZoom" title="重置 (0)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
          </button>
          <div class="zoom-divider"/>
          <button class="zoom-tool-btn zoom-close-btn" @click="close" title="关闭 (Esc)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- 图片容器 -->
        <div
          class="zoom-image-wrap"
          :class="{ dragging: isDragging }"
          @mousedown.stop="onMouseDown"
          @click.stop
        >
          <img
            :src="src"
            :alt="alt"
            class="zoom-image"
            :style="{
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }"
            draggable="false"
          />
        </div>

        <!-- 图注 -->
        <div v-if="alt" class="zoom-caption" @click.stop>{{ alt }}</div>

        <!-- 快捷键提示 -->
        <div class="zoom-hint" @click.stop>滚轮缩放 · 拖拽移动 · Esc 关闭</div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.zoom-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.zoom-image-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.zoom-image {
  max-width: 90vw;
  max-height: 88vh;
  object-fit: contain;
  transition: transform 0.12s ease;
  border-radius: 4px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.dragging .zoom-image {
  transition: none;
}

/* 工具栏 */
.zoom-toolbar {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(30, 30, 30, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.zoom-tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.zoom-tool-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.zoom-close-btn:hover {
  background: rgba(255, 80, 80, 0.25);
  color: #ff6b6b;
}

.zoom-scale-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  min-width: 38px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.zoom-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 4px;
}

/* 图注 */
.zoom-caption {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  max-width: 600px;
  padding: 8px 18px;
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  text-align: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* 快捷键提示 */
.zoom-hint {
  position: fixed;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  color: rgba(255, 255, 255, 0.3);
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
}

/* 过渡动画 */
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition: opacity 0.2s ease;
}
.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
}
</style>
