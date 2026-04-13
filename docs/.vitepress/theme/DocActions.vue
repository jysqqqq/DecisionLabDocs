<script setup lang="ts">
import { ref, computed } from 'vue'
import { useData } from 'vitepress'

const { page, frontmatter, site } = useData()
const RAW_DOCS_DIR = '__raw'

// 复制状态
const copyState = ref<'idle' | 'success' | 'error'>('idle')
let copyTimer: ReturnType<typeof setTimeout> | null = null

function normalizeSiteBase(base: string) {
  if (!base || base === '/') return '/'
  return base.endsWith('/') ? base : `${base}/`
}

function joinSitePath(...segments: string[]) {
  return segments
    .filter(Boolean)
    .map((segment, index) => {
      if (index === 0) return segment.replace(/\/+$/, '')
      return segment.replace(/^\/+|\/+$/g, '')
    })
    .join('/')
    .replace(/^$/, '/')
}

function normalizePosixPath(input: string) {
  const isAbsolute = input.startsWith('/')
  const normalizedSegments: string[] = []

  for (const segment of input.split('/')) {
    if (!segment || segment === '.') continue

    if (segment === '..') {
      if (normalizedSegments.length > 0 && normalizedSegments[normalizedSegments.length - 1] !== '..') {
        normalizedSegments.pop()
      } else if (!isAbsolute) {
        normalizedSegments.push('..')
      }
      continue
    }

    normalizedSegments.push(segment)
  }

  const normalizedPath = normalizedSegments.join('/')
  if (isAbsolute) return normalizedPath ? `/${normalizedPath}` : '/'
  return normalizedPath
}

function dirnamePosix(filePath: string) {
  const normalizedPath = normalizePosixPath(filePath)
  const slashIndex = normalizedPath.lastIndexOf('/')
  if (slashIndex <= 0) return ''
  return normalizedPath.slice(0, slashIndex)
}

function joinPosixPath(...segments: string[]) {
  return normalizePosixPath(segments.filter(Boolean).join('/'))
}

function getRawDocPath(relativePath: string) {
  return joinSitePath(normalizeSiteBase(site.value.base), RAW_DOCS_DIR, relativePath)
}

function toAbsoluteSiteUrl(sitePath: string) {
  return new URL(sitePath, window.location.origin).toString()
}

function splitUrlSuffix(input: string) {
  const match = input.match(/^([^?#]*)(.*)$/)
  return {
    pathname: match?.[1] ?? input,
    suffix: match?.[2] ?? ''
  }
}

function shouldKeepUrl(url: string) {
  return /^(?:[a-z][a-z\d+\-.]*:|#)/i.test(url)
}

function rewriteAssetUrl(assetUrl: string, docRelativePath: string) {
  if (!assetUrl || shouldKeepUrl(assetUrl)) return assetUrl

  const { pathname, suffix } = splitUrlSuffix(assetUrl)

  if (!pathname) return assetUrl

  if (pathname.startsWith('/')) {
    const siteLocalPath = joinSitePath(
      normalizeSiteBase(site.value.base),
      pathname.replace(/^\/+/, '')
    )
    return `${toAbsoluteSiteUrl(siteLocalPath)}${suffix}`
  }

  const rawAssetRelativePath = joinPosixPath(dirnamePosix(docRelativePath), pathname)

  return `${toAbsoluteSiteUrl(getRawDocPath(rawAssetRelativePath))}${suffix}`
}

function rewriteMarkdownAssetUrls(markdown: string, docRelativePath: string) {
  const replaceLinkedUrl = (_match: string, prefix: string, url: string, suffix: string) => {
    return `${prefix}${rewriteAssetUrl(url, docRelativePath)}${suffix}`
  }

  return markdown
    .replace(/(!\[[^\]]*]\()([^)\s]+)([^)]*\))/g, replaceLinkedUrl)
    .replace(/(\[[^\]]*]\()([^)\s]+\.(?:png|jpe?g|gif|svg|webp|avif)(?:[?#][^)]*)?)([^)]*\))/gi, replaceLinkedUrl)
    .replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi, replaceLinkedUrl)
}

async function fetchMarkdown(): Promise<string> {
  const relativePath = page.value.relativePath
  const targetPath = import.meta.env.DEV
    ? joinSitePath(normalizeSiteBase(site.value.base), relativePath)
    : getRawDocPath(relativePath)

  const res = await fetch(targetPath)
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
    const relativePath = page.value.relativePath
    const text = await fetchMarkdown()
    const downloadableText = rewriteMarkdownAssetUrls(text, relativePath)
    const fileName = relativePath.split('/').pop() || 'document.md'
    const blob = new Blob([downloadableText], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    // fallback：下载页面文本内容，仍然保持 .md 扩展名
    const docEl = document.querySelector('.vp-doc')
    const text = docEl ? docEl.innerText : document.body.innerText
    const title = (frontmatter.value.title || document.title || 'document').replace(/\s+/g, '-')
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.md`
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
