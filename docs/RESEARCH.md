# 资源库搭建调研与依据

调研日期：2026-11-18。以下是产品结构、内容范围、教学方式与技术选型的参考来源。**本项目仅参考组织思路并链接原站，没有抓取或转载外部教材全文。**

## 课程内容与难度范围

- **MIT OCW · 18.100B Real Analysis (Spring 2025)** — 讲义包括实数、数列、柯西准则、紧致性、微分、Riemann 积分和一致收敛等，作为本科严格分析主线的结构参照： https://ocw.mit.edu/courses/18-100b-real-analysis-spring-2025/pages/lecture-notes/
- **MIT 18.125 Measure and Integration** — 用于确定更高阶阶段的测度、Lebesgue 积分和 Lᵖ 空间范围： https://ocw.mit.edu/courses/18-125-measure-and-integration-fall-2003/
- **OpenStax Calculus Volumes 1–3** — 形成从单变量微积分到多变量微积分的基础覆盖参考；需查阅原站许可。 https://openstax.org/books/calculus-volume-1/pages/preface
- **MIT · Gilbert Strang Calculus Open Textbook** — 系统教材与应用思路： https://ocw.mit.edu/courses/res-18-001-calculus-fall-2023/pages/open-textbook/
- **3Blue1Brown · Essence of Calculus** — 图像直觉与可视化数学的教学参考： https://www.3blue1brown.com/lessons/essence-of-calculus/

## AI 辅导设计依据

- **OECD Digital Education Outlook 2026**，章节关于苏格拉底式 AI 辅导、解释性和人类监督，强调 AI 辅导应公开教学动作的依据： https://www.oecd.org/content/dam/oecd/en/publications/reports/2026/01/oecd-digital-education-outlook-2026_940e0dd8/062a7394-en.pdf
- **Stanford SCALE · The Evidence Base on AI in K-12: A 2026 Review**：教学结构和提示策略重要，不同研究对苏格拉底式问答的体验/结果并非一致。https://scale.stanford.edu/sites/default/files/The%20Evidence%20Base%20on%20AI%20in%20K-12%20Report.pdf
- **NBER Working Paper 35620 (2026)**，关于 Khanmigo 的现场研究，提醒“工具有了”不等于“有效使用”与深度对话已经发生： https://www.nber.org/papers/w35620
- **Adaptive Mathematics Knowledge Graph MCP**，公开示例采用先修关系、诊断和学习者状态，启发本项目的可追溯结构；原项目领域与目标不同，我们没有复用其数据： https://github.com/shikharpant/adaptive-graph

## 技术选择

- **D3 force simulation 文档**：图可视化的交互惯例与未来可扩展方案（首版采用独立 SVG 分层布局）：https://github.com/d3/d3/blob/main/docs/d3-force/simulation.md
- **KaTeX auto-render 文档**：公式渲染方式：https://katex.org/docs/autorender
- **GitHub Pages 官方说明**：静态站点入口、分支/Actions 部署：https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## 知识质量声明

课程层级参考公开课程范围，但概念描述、例题、图谱依赖和题目答案均由本项目独立编排，并且仅完成初步的结构校验。严谨证明和数学细节需要持续人工同行复核。资源库不应把数据节点数量等同于完整课程质量。
