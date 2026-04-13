import DefaultTheme from 'vitepress/theme'
import DocActions from './DocActions.vue'
import ImageZoom from './ImageZoom.vue'
import type { Theme } from 'vitepress'
import { h } from 'vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-after': () => h(DocActions),
      'layout-bottom': () => h(ImageZoom)
    })
  },
  enhanceApp({ app }) {
    app.component('DocActions', DocActions)
    app.component('ImageZoom', ImageZoom)
  }
} satisfies Theme
