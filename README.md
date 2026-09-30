# 星言 · 紫微 AI 助手

基于 [iztro](https://github.com/sylarlong/iztro) 排盘 + Cloudflare Workers AI 对话解读。

## 本地预览

```bash
cd ziwei-ai
npm install
npm run dev
```

## 部署到 Cloudflare Pages（绑定 arizonalawyer.sbs）

你当前账号里的 API Token **只有读权限**，无法创建/上传 Pages。请新建一个 Token：

1. 打开 https://dash.cloudflare.com/profile/api-tokens
2. Create Token → 自定义，勾选：
   - Account · Cloudflare Pages · Edit
   - Account · Workers Scripts · Edit
   - Account · Workers AI · Run
   - Zone · DNS · Edit（选择 arizonalawyer.sbs）
3. 在本目录执行：

```powershell
$env:CLOUDFLARE_API_TOKEN="你的新Token"
$env:CLOUDFLARE_ACCOUNT_ID="06dd8db13879ed7a1a90b62f681e1496"
npm run build
npx wrangler pages project create ziwei-ai --production-branch=main
npx wrangler pages deploy dist --project-name=ziwei-ai
npx wrangler pages domains add arizonalawyer.sbs --project=ziwei-ai
```

4. DNS：把根域名原来的 A 记录（`45.63.69.143`）删掉或停用，让 Pages 自动接管；`moontv.arizonalawyer.sbs` 可保留不动。

## 功能

- 阳历生日 + 时辰 + 性别 → iztro 十二宫盘
- AI 助手问答（性格 / 事业 / 财运 / 感情）
- Workers AI 未接通时自动降级为本地速读
