<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from 'vitepress'

const { page, frontmatter } = useData()

// 复制状态
const copyState = ref<'idle' | 'success' | 'error'>('idle')
let copyTimer: ReturnType<typeof setTimeout> | null = null

// 从 VitePress 的 rawcontent / page 中获取源文件路径
const filePath = computed(() => page.value.filePath)

async function fetchMarkdown(): Promise<string> {
  // VitePress dev 模式下，原始 .md 文件通过 /@fs/ 路径可访问
  // 生产环境中我们通过 page.value.relativePath 构造路径
  const relativePath = page.value.relativePath // e.g. "使用文档/项目管理/01-创建项目.md"
  // 尝试从站点根路径读取（dev server 会透传）
  const res = await fetch(`/${relativePath}`)
  if (!res.ok) throw new Error('无法读取文件')
  return res.text()
}

async function copyContent() {
  if (copyTimer) clearTimeout(copyTimer)
  try {
    const text = await fetchMarkdown()
    await navigator.clipboard.writeText(text)
    copyState.value = 'success'
  } catch (e) {
    // fallback：复制页面可见文字
    try {
      const docEl = document.querySelector('.vp-doc')
      const text = docEl ? docEl.innerText : document.body.innerText
      await navigator.clipboard.writeText(text)
      copyState.value = 'success'
    } catch {
      copyState.value = 'error'
    }
  }
  copyTimer = setTimeout(() => { copyState.value = 'idle' }, 2000)
}

async function downloadMarkdown() {
  try {
    const text = await fetchMarkdown()
    const relativePath = page.value.relativePath
    const fileName = relativePath.split('/').pop() || 'document.md'
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    // fallback：下载页面文本内容
    const docEl = document.querySelector('.vp-doc')
    const text = docEl ? docEl.innerText : document.body.innerText
    const title = (frontmatter.value.title || document.title || 'document').replace(/\s+/g, '-')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
}

const copyLabel = computed(() => {
  if (copyState.value === 'success') return '已复制 ✓'
  if (copyState.value === 'error') return '复制失败'
  return '复制全文'
})
</script>

<template>
  <div class="doc-actions">
    <button
      class="doc-action-btn"
      :class="{ success: copyState === 'success', error: copyState === 'error' }"
      @click="copyContent"
      :title="copyLabel"
    >
      <svg v-if="copyState === 'idle'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <svg v-else-if="copyState === 'success'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      {{ copyLabel }}
    </button>

    <button class="doc-action-btn" @click="downloadMarkdown" title="下载 Markdown 文件">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      下载 .md
    </button>
  </div>
</template>

<style scoped>
.doc-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--vp-c-divider);
}

.doc-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
  line-height: 1.4;
}

.doc-action-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
}

.doc-action-btn.success {
  border-color: var(--vp-c-green-1, #3dd68c);
  color: var(--vp-c-green-1, #3dd68c);
  background: var(--vp-c-bg);
}

.doc-action-btn.error {
  border-color: var(--vp-c-red-1, #f44336);
  color: var(--vp-c-red-1, #f44336);
  background: var(--vp-c-bg);
}
</style>
