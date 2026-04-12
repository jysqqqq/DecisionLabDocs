import { defineConfig } from "vitepress";
import mathjax3 from "markdown-it-mathjax3";

export default defineConfig({
  lang: "zh-CN",
  title: "DecisionLab 文档站",
  description: "DecisionLab 产品文档、使用文档与项目交付材料站点",
  cleanUrls: true,
  lastUpdated: true,
  markdown: {
    config: (md) => {
      md.use(mathjax3);
    }
  },
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "首页", link: "/" },
      { text: "使用文档", link: "/使用文档/00-使用文档总览" },
      { text: "项目交付物", link: "/项目交付物/" }
    ],
    sidebar: [
      {
        text: "使用文档",
        items: [
          { text: "使用文档总览", link: "/使用文档/00-使用文档总览" },
          { text: "用户与登录使用说明", link: "/使用文档/01-用户与登录使用说明" },
          { text: "项目管理使用说明", link: "/使用文档/02-项目管理使用说明" },
          { text: "决策管线使用说明：需求澄清与问卷", link: "/使用文档/03-决策管线使用说明-需求澄清与问卷" },
          { text: "决策管线使用说明：数据采集、计算与报告", link: "/使用文档/04-决策管线使用说明-数据采集计算与报告" },
          { text: "QFD 决策流使用说明", link: "/使用文档/05-QFD决策流使用说明" },
          { text: "算法插件与系统设置说明", link: "/使用文档/06-算法插件与系统设置说明" },
          { text: "个人中心与日常维护说明", link: "/使用文档/07-个人中心与日常维护说明" }
        ]
      },
      {
        text: "项目交付物",
        items: [
          { text: "交付物总览", link: "/项目交付物/" },
          { text: "项目整体实施方案", link: "/项目交付物/01-项目整体实施方案" },
          { text: "技术选型与工具清单", link: "/项目交付物/02-技术选型与工具清单" },
          { text: "智能问卷生成模块（Kano-QFD）交付说明", link: "/项目交付物/03-智能问卷生成模块（Kano-QFD）交付说明" },
          { text: "客户反馈数据收集模块（AI）交付说明", link: "/项目交付物/04-客户反馈数据收集模块（AI）交付说明" },
          { text: "可视化报告生成模块（AI）交付说明", link: "/项目交付物/05-可视化报告生成模块（AI）交付说明" },
          { text: "项目总结报告", link: "/项目交付物/06-项目总结报告" },
          { text: "交付物清单", link: "/项目交付物/07-交付物清单" },
          { text: "QFD 决策流算法说明书", link: "/项目交付物/08-QFD决策流算法说明书" }
        ]
      }
    ],
    search: {
      provider: "local"
    },
    footer: {
      message: "DecisionLab 文档站",
      copyright: "MIT Licensed | Copyright (c) 2026 DecisionLabDocs Contributors"
    },
    docFooter: {
      prev: "上一页",
      next: "下一页"
    },
    outline: {
      label: "页面目录"
    },
    returnToTopLabel: "返回顶部",
    sidebarMenuLabel: "菜单",
    darkModeSwitchLabel: "主题",
    lightModeSwitchTitle: "切换到浅色模式",
    darkModeSwitchTitle: "切换到深色模式"
  }
});
