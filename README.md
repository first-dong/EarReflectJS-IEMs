# EarReflectJS

一个可复用的 Web 实时耳返 TypeScript 库，基于 Web Audio API 实现，支持音量调节、降噪和延迟优化。

[![GitHub](https://img.shields.io/badge/GitHub-first--dong%2FEarReflectJS--IEMs-blue)](https://github.com/first-dong/EarReflectJS-IEMs)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**项目地址：** [https://github.com/first-dong/EarReflectJS-IEMs](https://github.com/first-dong/EarReflectJS-IEMs)

## ✨ 特性

- 🎤 **实时耳返**：麦克风输入即时播放，低延迟
- 🔊 **音量调节**：支持 0-1 范围的音量控制
- 🎚️ **智能降噪**：可配置的降噪强度和开关
- ⚡ **延迟优化**：针对实时场景优化的音频处理
- 🌐 **跨浏览器**：兼容 Chrome、Firefox、Safari 等主流浏览器
- 📱 **移动端支持**：适配移动设备和桌面设备
- 📦 **ES Module**：支持 ES Module 和 UMD 格式
- 🎯 **TypeScript**：完整的 TypeScript 类型定义

## 📦 安装



### 方式一：克隆仓库后本地安装

```bash
# 克隆仓库
git clone https://github.com/first-dong/EarReflectJS-IEMs.git
cd EarReflectJS-IEMs

# 安装依赖
pnpm install

# 构建项目
pnpm build
```

然后在你的项目中引用构建后的文件：

```typescript
import { EarReflect } from './path/to/EarReflectJS-IEMs/dist/ear-reflect-js.js';
```

## 🚀 快速开始

### 基础用法

```typescript
import { EarReflect } from 'ear-reflect-js';

// 创建耳返实例
const earReflect = new EarReflect({
  volume: 0.7,
  enableNoiseReduction: true,
  noiseReductionLevel: 0.5
});

// 启动耳返
await earReflect.start();

// 停止耳返
earReflect.stop();
```

### 完整示例

```typescript
import { EarReflect } from 'ear-reflect-js';

const earReflect = new EarReflect({
  volume: 0.8,                    // 音量大小 (0-1)
  enableNoiseReduction: true,      // 启用降噪
  noiseReductionLevel: 0.6,       // 降噪强度 (0-1)
  latency: 0,                     // 延迟（毫秒）
  sampleRate: 44100,              // 采样率
  channels: 1                      // 通道数
});

try {
  // 启动耳返
  await earReflect.start();
  console.log('耳返已启动');
  
  // 动态调整音量
  earReflect.setVolume(0.5);
  
  // 动态调整降噪
  earReflect.setNoiseReduction(true);
  earReflect.setNoiseReductionLevel(0.8);
  
  // 获取当前状态
  const status = earReflect.getStatus();
  console.log(status);
  
} catch (error) {
  console.error('启动失败:', error);
} finally {
  // 停止并清理资源
  earReflect.destroy();
}
```

### HTML 中使用

```html
<!DOCTYPE html>
<html>
<head>
  <title>耳返示例</title>
</head>
<body>
  <button id="start">开始</button>
  <button id="stop">停止</button>
  <input type="range" id="volume" min="0" max="1" step="0.01" value="0.7">
  
  <script type="module">
    // 从 GitHub 安装后使用
    import { EarReflect } from './node_modules/ear-reflect-js/dist/ear-reflect-js.js';
    // 或直接使用构建后的文件
    // import { EarReflect } from './path/to/EarReflectJS-IEMs/dist/ear-reflect-js.js';
    
    const earReflect = new EarReflect();
    
    document.getElementById('start').addEventListener('click', async () => {
      await earReflect.start();
    });
    
    document.getElementById('stop').addEventListener('click', () => {
      earReflect.stop();
    });
    
    document.getElementById('volume').addEventListener('input', (e) => {
      earReflect.setVolume(parseFloat(e.target.value));
    });
  </script>
</body>
</html>
```

## 📖 API 文档

### EarReflect 类

#### 构造函数

```typescript
new EarReflect(options?: EarReflectOptions)
```

**选项：**

- `volume?: number` - 音量大小 (0-1)，默认 `0.7`
- `enableNoiseReduction?: boolean` - 是否启用降噪，默认 `true`
- `noiseReductionLevel?: number` - 降噪强度 (0-1)，默认 `0.5`
- `latency?: number` - 延迟缓冲区大小（毫秒），默认 `0`
- `sampleRate?: number` - 音频采样率，默认 `44100`
- `channels?: number` - 音频通道数，默认 `1`

#### 方法

##### `start(): Promise<void>`

启动耳返。需要用户授权麦克风权限。

##### `stop(): void`

停止耳返，释放所有资源。

##### `setVolume(volume: number): void`

设置音量大小 (0-1)。

##### `getVolume(): number`

获取当前音量。

##### `setNoiseReduction(enabled: boolean): void`

启用/禁用降噪。

##### `setNoiseReductionLevel(level: number): void`

设置降噪强度 (0-1)。

##### `getStatus(): EarReflectStatus`

获取当前状态。

##### `destroy(): void`

销毁实例，释放所有资源。

#### 静态方法

##### `checkCompatibility(): { supported: boolean; issues: string[] }`

检查浏览器兼容性。

```typescript
const compatibility = EarReflect.checkCompatibility();
if (compatibility.supported) {
  console.log('浏览器支持');
} else {
  console.log('不支持:', compatibility.issues);
}
```

## 🌐 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ 移动端浏览器（iOS Safari、Chrome Mobile）

**注意：** 需要 HTTPS 环境或 localhost 才能访问麦克风。

## 🔧 开发

### 克隆项目

```bash
git clone https://github.com/first-dong/EarReflectJS-IEMs.git
cd EarReflectJS-IEMs
```

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

访问 `http://localhost:3000/example/index.html` 查看示例。

### 构建

```bash
pnpm build
```

构建产物将输出到 `dist` 目录。

### 类型检查

```bash
pnpm type-check
```

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 更新日志

### 1.0.0

- 初始版本
- 实现基础耳返功能
- 支持音量调节
- 支持降噪功能
- 支持延迟优化
- 完整的 TypeScript 类型定义

