# Vid2CSS

AI-powered video to CSS animation converter.

Record it. Get the code.

## Vision

前端开发者天天遇到一个场景：看到某个网站的动画效果很想用，但不知道怎么实现。现在你需要打开 CodePen 搜索、翻文档、手动调试。Vid2CSS 让你直接录个屏，AI 帮你把动画还原成 CSS 代码。

## How It Works

```
录制屏幕 / 上传 GIF
       ↓
   提取关键帧
       ↓
   AI 分析运动轨迹
       ↓
  生成 CSS @keyframes
       ↓
   复制 / 导出代码
```

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 19 + Vite + TypeScript | 快速开发，生态好 |
| AI Model | Agnes 2.0 Flash (OpenAI compatible) | 免费额度，图像理解能力强 |
| Frame Extraction | Canvas API (browser) | 零服务端，用户浏览器内完成 |
| Styling | Tailwind CSS 4 | 快速构建 UI |
| Deployment | Cloudflare Pages | 免费，已有基础设施 |
| Storage | Cloudflare R2 | 临时存储上传的视频/帧 |

## MVP Scope (v0.1)

### Core Features
- [ ] 视频/GIF 上传 + 拖拽
- [ ] 录屏功能（MediaRecorder API）
- [ ] 自动提取关键帧（每 100ms）
- [ ] 关键帧预览 + 手动选择起止帧
- [ ] AI 分析运动轨迹，生成 CSS @keyframes
- [ ] 代码预览 + 一键复制
- [ ] 实时预览生成的动画效果

### Out of Scope (v0.1)
- ~~Framer Motion / GSAP 代码导出~~ (v0.2)
- ~~多元素分离追踪~~ (v0.2)
- ~~自定义缓动曲线编辑器~~ (v0.2)
- ~~用户账户系统~~ (v0.3)

## Architecture

```
┌─────────────────────────────────────────┐
│              Browser (Client)             │
│                                           │
│  ┌──────────┐    ┌──────────────────┐    │
│  │  Upload / │───→│  Frame Extractor │    │
│  │  Record   │    │  (Canvas API)    │    │
│  └──────────┘    └────────┬─────────┘    │
│                           │               │
│                    Keyframes (images)     │
│                           │               │
│                    ┌──────▼──────┐        │
│                    │  AI Engine   │        │
│                    │  (Agnes API) │        │
│                    └──────┬──────┘        │
│                           │               │
│                    CSS @keyframes          │
│                           │               │
│                    ┌──────▼──────┐        │
│                    │  Preview +   │        │
│                    │  Code Editor │        │
│                    └─────────────┘        │
└─────────────────────────────────────────┘
```

## AI Prompt Strategy

发送关键帧给 AI 时的 prompt 设计：

```
你是一个 CSS 动画专家。用户上传了一段动画的 {N} 帧截图。
请分析帧间变化，生成对应的 CSS @keyframes 动画。

要求：
1. 识别运动的元素和运动属性（translate/rotate/scale/opacity/color）
2. 精确计算每帧的时间百分比
3. 使用合适的 CSS 缓动函数
4. 输出可直接使用的完整 CSS 代码
5. 如果动画涉及多个元素，为每个元素生成独立的 @keyframes

帧时间线：{frame_timestamps}
```

## Project Structure

```
vid2css/
├── src/
│   ├── components/
│   │   ├── UploadZone.tsx        # 拖拽上传区域
│   │   ├── Recorder.tsx          # 录屏组件
│   │   ├── FrameTimeline.tsx     # 关键帧时间线选择器
│   │   ├── Preview.tsx           # 动画预览播放器
│   │   ├── CodeOutput.tsx        # 代码展示 + 复制
│   │   └── Header.tsx
│   ├── lib/
│   │   ├── frameExtractor.ts     # Canvas 帧提取逻辑
│   │   ├── aiEngine.ts           # Agnes API 调用
│   │   └── cssParser.ts          # AI 输出解析 + 校验
│   ├── App.tsx
│   ├── main.tsx
│   └── styles/
│       └── global.css
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

## Roadmap

| Version | Milestone | Target |
|---------|-----------|--------|
| v0.1 | MVP: 上传/录屏 → AI 生成 CSS | Week 1-2 |
| v0.2 | 多元素分离 + GSAP/Framer 导出 + 缓动编辑器 | Week 3-4 |
| v0.3 | 用户系统 + 历史记录 + 收藏 + 分享 | Week 5-6 |
| v0.4 | 浏览器插件（网页上直接录任意元素动画） | Week 7-8 |
| v1.0 | 自研 CV 模型替代 AI API，离线可用 | 长期 |

## Development

```bash
npm install
npm run dev
```

## License

MIT
