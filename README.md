# DecisionLab Docs

基于 VitePress 构建的中文 Markdown 文档站点，用于承载 DecisionLab 的使用文档、项目交付物与算法说明资料。

## 快速开始

```bash
pnpm install
pnpm docs:dev
```

默认开发地址通常为 `http://localhost:5173`。

## 常用命令

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

## 目录结构

```text
.
├── docs
│   ├── .vitepress
│   │   └── config.ts
│   ├── public
│   ├── 使用文档
│   ├── 项目交付物
│   └── index.md
├── LICENSE
├── package.json
└── README.md
```

## 当前展示内容

- 当前站点同时展示 `docs/使用文档/` 和 `docs/项目交付物/` 两类内容。
- 首页定位为 DecisionLab 总文档站，适合统一承载产品文档和交付材料。
- 如需新增展示页面，优先补充到 `docs/使用文档/` 或 `docs/项目交付物/`，并同步更新 `docs/.vitepress/config.ts`。

## 贡献方式

1. Fork 并克隆仓库。
2. 创建特性分支并补充或修改文档。
3. 本地运行 `pnpm docs:build` 确认构建通过。
4. 提交 Pull Request 说明变更目的与影响范围。

## 开源协议

本项目采用 MIT License。
