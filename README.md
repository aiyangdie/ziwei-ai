<p align="center"><img src="assets/covers/24-ziwei-ai.jpg" alt="星言紫微 项目封面" width="100%"></p>

<h1 align="center">星言 · 紫微 AI 助手</h1>

<p align="center">iztro 排盘 + Cloudflare Workers AI 对话解读</p>

<p align="center">
  <a href="https://aiyangdie.github.io/ziwei-ai/">在线体验</a>
</p>

## 简介

输入阳历生日、时辰和性别，先用 [iztro](https://github.com/sylarlong/iztro) 排出十二宫盘，再由 AI 用自然语言解读性格、事业、财运与感情。Workers AI 未接通时自动降级为本地速读，页面不会白屏。

## 功能

- 生日 + 时辰 + 性别 → 十二宫命盘
- AI 助手问答：性格 / 事业 / 财运 / 感情
- 断网或未配置模型时降级为本地速读
- 纯前端构建，可托管在任意静态平台

## 快速开始

```bash
cd ziwei-ai
npm install
npm run dev
```

## 部署到 Cloudflare Pages

1. 打开 [API Tokens](https://dash.cloudflare.com/profile/api-tokens) 创建自定义 Token，勾选：Account · Cloudflare Pages · Edit，Account · Workers Scripts · Edit，Account · Workers AI · Run，Zone · DNS · Edit
2. 构建并发布：

```bash
npm run build
npx wrangler pages project create ziwei-ai --production-branch=main
npx wrangler pages deploy dist --project-name=ziwei-ai
```

3. 绑定域名后，把原有 A 记录停用，让 Pages 接管解析

## 许可证

仓库未附 LICENSE 文件，使用与分发请先联系作者确认。
