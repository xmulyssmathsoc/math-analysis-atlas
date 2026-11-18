# 从本地到 GitHub Pages

## 1. 创建仓库

请在 GitHub 的 `xmulyssmathsoc` 账户下创建一个**公开**仓库，推荐名称 `math-analysis-atlas`。若 API/连接器不能创建仓库，可打开 https://github.com/new 手动创建，确保 Owner 为 `xmulyssmathsoc`。

不勾选 Initialize with README（因为本项目已经包含 README）。

## 2. 上传代码

在项目解压目录中执行（本步骤需要本机已安装 Git，并拥有目标账户的推送权限）：

```bash
git init
git add .
git commit -m "feat: launch Math Atlas interactive analysis library"
git branch -M main
git remote add origin https://github.com/xmulyssmathsoc/math-analysis-atlas.git
git push -u origin main
```

`git push` 会通过本机已配置的 GitHub 身份认证；无需把访问令牌写进文件。也可以从 GitHub 仓库页面使用 **Add file → Upload files** 上传解压后的文件及目录。

## 3. 公开站点（GitHub Pages）

仓库已经包含 `.github/workflows/pages.yml`，推送到 `main` 后会运行验证并准备静态网页。打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**；随后在 **Actions** 查看部署任务是否成功。

若部署配置、权限与构建均正常，网址通常为：

`https://xmulyssmathsoc.github.io/math-analysis-atlas/`

这是**预期 URL，不代表已经实际部署成功**。若仓库改名，请按新名字调整 URL；如遇页面 404，先检查 Pages 设定及 Actions 日志。

## 4. 可选：真正 AI 模型接入

以下是 Cloudflare Worker 示例，不是免费或自动启用的模型服务：

1. 安装 Node.js、Wrangler（`npm install -g wrangler` 或使用 `npx wrangler`）。
2. 复制 `backend/wrangler.toml.example` 为 `backend/wrangler.toml`，把 `ALLOWED_ORIGIN` 改为你实际的页面来源 Origin（例如 `https://xmulyssmathsoc.github.io`，**不含路径**）。
3. 在 `backend/` 内执行 `npx wrangler login`、`npx wrangler secret put OPENAI_API_KEY`。
4. 部署前先建立 **访问认证、Cloudflare WAF/速率限制、滥用拦截、成本预算和日志监控**。示例 Worker 未提供完整生产安全措施，切勿直接作为对公网无限制使用的付费 API 代理。
5. `npx wrangler deploy`，将生成的 `https://...workers.dev/api/tutor` 地址填入网站顶部 ⚙ 设置。
6. 测试浏览器发出的请求确实由 Worker 调用模型，确认没有将密钥暴露在网页源码、请求体或 Git 仓库中。

**注意**：Github Pages 站点根路径与页面 Origin 不同。源 `https://xmulyssmathsoc.github.io/math-analysis-atlas/` 的 Origin 仍是 `https://xmulyssmathsoc.github.io`。

## 5. 隐私与成本

默认本地模式没有模型调用成本，学习进度仅保存在当前浏览器 `localStorage`。启用远端 AI 后，输入会发送至你部署的 Worker，再转发至模型服务；在面向学生提供服务前，必须提供数据处理告知、用户同意、适当的使用政策，并按实际用户规模配置成本与隐私保护。
