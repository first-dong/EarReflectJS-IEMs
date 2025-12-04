# 使用指南

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 开发模式

启动开发服务器，自动打开示例页面：

```bash
pnpm dev
```

访问 `http://localhost:3000/example/index.html` 查看示例。

### 3. 构建

构建生产版本：

```bash
pnpm build
```

构建产物将输出到 `dist` 目录：
- `ear-reflect-js.js` - ES Module 格式
- `ear-reflect-js.umd.cjs` - UMD 格式
- `index.d.ts` - TypeScript 类型定义

### 4. 本地测试

#### 方式一：使用开发模式（推荐）

```bash
pnpm dev
```

然后访问 `http://localhost:3000/example/index.html`

#### 方式二：使用构建后的文件

1. 先构建项目：
```bash
pnpm build
```

2. 使用 HTTP 服务器访问 `example/standalone.html`：
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve .
```

3. 访问 `http://localhost:8000/example/standalone.html`

**注意：** 由于浏览器安全策略，必须通过 HTTP/HTTPS 协议访问，不能直接打开 HTML 文件（file://）。

## 在项目中使用

### 作为 npm 包使用

```bash
pnpm add ear-reflect-js
```

```typescript
import { EarReflect } from 'ear-reflect-js';

const earReflect = new EarReflect();
await earReflect.start();
```

### 直接使用构建文件

```html
<script type="module">
  import { EarReflect } from './dist/ear-reflect-js.js';
  
  const earReflect = new EarReflect();
  await earReflect.start();
</script>
```

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ 移动端浏览器

**重要提示：**
- 需要 HTTPS 环境或 localhost 才能访问麦克风
- 首次使用需要用户授权麦克风权限
- 某些浏览器可能需要用户交互（如点击按钮）后才能启动音频

## 常见问题

### 1. 无法获取麦克风权限

确保：
- 使用 HTTPS 或 localhost
- 用户已授权麦克风权限
- 浏览器支持 MediaDevices API

### 2. 没有声音

检查：
- 音量是否设置为 0
- 系统音量是否正常
- 浏览器是否阻止了自动播放（需要用户交互）

### 3. 延迟较高

尝试：
- 设置 `latency: 0` 使用最小延迟
- 降低采样率（不推荐）
- 关闭降噪功能

### 4. 降噪效果不明显

调整：
- 增加 `noiseReductionLevel` 值
- 检查麦克风质量
- 调整环境噪声水平

## 发布到 npm

1. 确保已登录 npm：
```bash
npm login
```

2. 更新版本号：
```bash
npm version patch  # 或 minor, major
```

3. 发布：
```bash
npm publish
```

## 发布到 GitHub

1. 初始化 Git 仓库（如果还没有）：
```bash
git init
git add .
git commit -m "Initial commit"
```

2. 创建 GitHub 仓库并推送：
```bash
git remote add origin <your-repo-url>
git push -u origin main
```

3. 创建 GitHub Release（可选）：
- 在 GitHub 上创建新的 Release
- 上传构建后的文件（dist 目录）

