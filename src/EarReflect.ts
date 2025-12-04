import { AudioProcessor, type AudioProcessorOptions } from './AudioProcessor';

/**
 * 耳返配置选项
 */
export interface EarReflectOptions {
  /** 音量大小 (0-1) */
  volume?: number;
  /** 是否启用降噪 */
  enableNoiseReduction?: boolean;
  /** 降噪强度 (0-1) */
  noiseReductionLevel?: number;
  /** 延迟缓冲区大小（毫秒） */
  latency?: number;
  /** 音频采样率 */
  sampleRate?: number;
  /** 音频通道数 */
  channels?: number;
  /** 音频处理器配置 */
  audioProcessorOptions?: AudioProcessorOptions;
}

/**
 * 耳返状态
 */
export interface EarReflectStatus {
  /** 是否正在运行 */
  isRunning: boolean;
  /** 是否已初始化 */
  isInitialized: boolean;
  /** 当前音量 */
  volume: number;
  /** 是否启用降噪 */
  noiseReductionEnabled: boolean;
  /** 当前延迟（毫秒） */
  latency: number;
}

/**
 * 实时耳返类
 * 提供麦克风输入即时播放功能，支持音量调节、降噪和延迟优化
 */
export class EarReflect {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private audioProcessor: AudioProcessor | null = null;
  private audioElement: HTMLAudioElement | null = null;
  
  private options: Required<EarReflectOptions>;
  private status: EarReflectStatus;

  constructor(options: EarReflectOptions = {}) {
    this.options = {
      volume: options.volume ?? 0.7,
      enableNoiseReduction: options.enableNoiseReduction ?? true,
      noiseReductionLevel: options.noiseReductionLevel ?? 0.5,
      latency: options.latency ?? 0,
      sampleRate: options.sampleRate ?? 44100,
      channels: options.channels ?? 1,
      audioProcessorOptions: options.audioProcessorOptions ?? {}
    };

    this.status = {
      isRunning: false,
      isInitialized: false,
      volume: this.options.volume,
      noiseReductionEnabled: this.options.enableNoiseReduction,
      latency: this.options.latency
    };
  }

  /**
   * 初始化音频上下文和处理器
   */
  private async initializeAudioContext(): Promise<void> {
    if (this.audioContext) {
      return;
    }

    // 创建音频上下文，使用低延迟模式
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass({
      sampleRate: this.options.sampleRate,
      latencyHint: this.options.latency > 0 ? 'interactive' : 'playback'
    });

    // 创建音频处理器
    this.audioProcessor = new AudioProcessor(this.audioContext, {
      enableNoiseReduction: this.options.enableNoiseReduction,
      noiseReductionLevel: this.options.noiseReductionLevel,
      ...this.options.audioProcessorOptions
    });

    this.status.isInitialized = true;
  }

  /**
   * 启动耳返
   * @throws {Error} 如果无法获取麦克风权限或初始化失败
   */
  async start(): Promise<void> {
    if (this.status.isRunning) {
      console.warn('耳返已经在运行中');
      return;
    }

    try {
      // 初始化音频上下文
      await this.initializeAudioContext();

      // 获取麦克风权限
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false, // 关闭回声消除，避免影响耳返
          noiseSuppression: false, // 关闭浏览器降噪，使用自定义降噪
          autoGainControl: false,
          sampleRate: this.options.sampleRate,
          channelCount: this.options.channels
        }
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!this.audioContext) {
        throw new Error('音频上下文未初始化');
      }

      // 创建源节点
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // 创建增益节点用于音量控制
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.options.volume;

      // 创建目标节点用于输出到音频元素
      this.destinationNode = this.audioContext.createMediaStreamDestination();

      // 连接音频处理链
      this.sourceNode.connect(this.gainNode);
      
      // 通过音频处理器处理音频
      if (this.audioProcessor) {
        this.gainNode.connect(this.audioProcessor.inputNode);
        this.audioProcessor.outputNode.connect(this.destinationNode);
      } else {
        this.gainNode.connect(this.destinationNode);
      }

      // 创建音频元素用于播放
      this.audioElement = new Audio();
      this.audioElement.srcObject = this.destinationNode.stream;
      this.audioElement.autoplay = true;
      this.audioElement.volume = 1.0;

      // 处理音频上下文可能被暂停的情况（浏览器策略）
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.status.isRunning = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      throw new Error(`启动耳返失败: ${errorMessage}`);
    }
  }

  /**
   * 停止耳返
   */
  stop(): void {
    if (!this.status.isRunning) {
      return;
    }

    // 停止音频元素
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }

    // 断开音频节点连接
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
    }

    if (this.destinationNode) {
      this.destinationNode.disconnect();
      this.destinationNode = null;
    }

    // 停止媒体流
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // 关闭音频上下文
    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }

    this.status.isRunning = false;
  }

  /**
   * 设置音量
   * @param volume 音量大小 (0-1)
   */
  setVolume(volume: number): void {
    if (volume < 0 || volume > 1) {
      throw new Error('音量值必须在 0-1 之间');
    }

    this.options.volume = volume;
    this.status.volume = volume;

    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  /**
   * 获取当前音量
   */
  getVolume(): number {
    return this.status.volume;
  }

  /**
   * 启用/禁用降噪
   * @param enabled 是否启用
   */
  setNoiseReduction(enabled: boolean): void {
    this.options.enableNoiseReduction = enabled;
    this.status.noiseReductionEnabled = enabled;

    if (this.audioProcessor) {
      this.audioProcessor.setNoiseReduction(enabled);
    }
  }

  /**
   * 设置降噪强度
   * @param level 降噪强度 (0-1)
   */
  setNoiseReductionLevel(level: number): void {
    if (level < 0 || level > 1) {
      throw new Error('降噪强度必须在 0-1 之间');
    }

    this.options.noiseReductionLevel = level;

    if (this.audioProcessor) {
      this.audioProcessor.setNoiseReductionLevel(level);
    }
  }

  /**
   * 获取当前状态
   */
  getStatus(): EarReflectStatus {
    return { ...this.status };
  }

  /**
   * 检查浏览器兼容性
   */
  static checkCompatibility(): {
    supported: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // 检查 MediaDevices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push('浏览器不支持 MediaDevices API');
    }

    // 检查 AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      issues.push('浏览器不支持 AudioContext API');
    }

    // 检查 MediaStreamAudioSourceNode
    if (AudioContextClass && !AudioContextClass.prototype.createMediaStreamSource) {
      issues.push('浏览器不支持 MediaStreamAudioSourceNode');
    }

    return {
      supported: issues.length === 0,
      issues
    };
  }

  /**
   * 销毁实例，释放所有资源
   */
  destroy(): void {
    this.stop();
    this.audioProcessor = null;
  }
}

