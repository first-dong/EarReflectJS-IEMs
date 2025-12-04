/**
 * 音频处理器配置选项
 */
export interface AudioProcessorOptions {
  /** 是否启用降噪 */
  enableNoiseReduction?: boolean;
  /** 降噪强度 (0-1) */
  noiseReductionLevel?: number;
  /** 低通滤波器频率（Hz） */
  lowPassFrequency?: number;
  /** 高通滤波器频率（Hz） */
  highPassFrequency?: number;
}

/**
 * 音频处理器类
 * 提供降噪、滤波等音频处理功能
 */
export class AudioProcessor {
  private audioContext: AudioContext;
  public readonly inputNode: GainNode;
  public readonly outputNode: GainNode;
  private lowPassFilter: BiquadFilterNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private noiseGate: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  private options: Required<AudioProcessorOptions>;
  private noiseLevel: number = 0;
  private isProcessing: boolean = false;

  constructor(audioContext: AudioContext, options: AudioProcessorOptions = {}) {
    this.audioContext = audioContext;
    this.options = {
      enableNoiseReduction: options.enableNoiseReduction ?? true,
      noiseReductionLevel: options.noiseReductionLevel ?? 0.5,
      lowPassFrequency: options.lowPassFrequency ?? 8000,
      highPassFrequency: options.highPassFrequency ?? 80
    };

    // 创建输入和输出节点
    this.inputNode = audioContext.createGain();
    this.outputNode = audioContext.createGain();

    // 初始化音频处理链
    this.setupAudioChain();
  }

  /**
   * 设置音频处理链
   */
  private setupAudioChain(): void {
    let currentNode: AudioNode = this.inputNode;

    // 创建分析器用于检测噪声水平
    if (this.options.enableNoiseReduction) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      currentNode.connect(this.analyser);
    }

    // 高通滤波器：去除低频噪声
    this.highPassFilter = this.audioContext.createBiquadFilter();
    this.highPassFilter.type = 'highpass';
    this.highPassFilter.frequency.value = this.options.highPassFrequency;
    this.highPassFilter.Q.value = 1;
    currentNode.connect(this.highPassFilter);
    currentNode = this.highPassFilter;

    // 低通滤波器：去除高频噪声
    this.lowPassFilter = this.audioContext.createBiquadFilter();
    this.lowPassFilter.type = 'lowpass';
    this.lowPassFilter.frequency.value = this.options.lowPassFrequency;
    this.lowPassFilter.Q.value = 1;
    currentNode.connect(this.lowPassFilter);
    currentNode = this.lowPassFilter;

    // 噪声门：根据信号强度动态调整增益
    if (this.options.enableNoiseReduction) {
      this.noiseGate = this.audioContext.createGain();
      this.noiseGate.gain.value = 1.0;
      currentNode.connect(this.noiseGate);
      currentNode = this.noiseGate;
      
      // 启动噪声检测和处理
      this.startNoiseReduction();
    }

    // 连接到输出节点
    currentNode.connect(this.outputNode);
  }

  /**
   * 启动降噪处理
   */
  private startNoiseReduction(): void {
    if (!this.options.enableNoiseReduction || !this.analyser || !this.noiseGate) {
      return;
    }

    this.isProcessing = true;
    this.processNoiseReduction();
  }

  /**
   * 处理降噪（使用 requestAnimationFrame 进行实时处理）
   */
  private processNoiseReduction(): void {
    if (!this.isProcessing || !this.analyser || !this.noiseGate) {
      return;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // 计算平均音量
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const normalizedAverage = average / 255;

    // 更新噪声水平（使用指数移动平均）
    this.noiseLevel = this.noiseLevel * 0.9 + normalizedAverage * 0.1;

    // 根据噪声水平和降噪强度调整增益
    const threshold = 0.01 + (this.options.noiseReductionLevel * 0.05);
    let gain = 1.0;

    if (normalizedAverage < threshold) {
      // 信号低于阈值，应用降噪
      const reduction = (threshold - normalizedAverage) / threshold;
      gain = 1.0 - (reduction * this.options.noiseReductionLevel);
      gain = Math.max(0.1, gain); // 最小增益为 0.1，避免完全静音
    }

    // 平滑增益变化，避免突然的音量变化
    const currentGain = this.noiseGate.gain.value;
    const targetGain = gain;
    const smoothedGain = currentGain * 0.7 + targetGain * 0.3;
    
    this.noiseGate.gain.value = smoothedGain;

    // 继续处理
    requestAnimationFrame(() => this.processNoiseReduction());
  }

  /**
   * 启用/禁用降噪
   */
  setNoiseReduction(enabled: boolean): void {
    this.options.enableNoiseReduction = enabled;
    
    if (enabled && !this.isProcessing) {
      this.startNoiseReduction();
    } else if (!enabled) {
      this.isProcessing = false;
      if (this.noiseGate) {
        this.noiseGate.gain.value = 1.0;
      }
    }
  }

  /**
   * 设置降噪强度
   */
  setNoiseReductionLevel(level: number): void {
    if (level < 0 || level > 1) {
      throw new Error('降噪强度必须在 0-1 之间');
    }
    this.options.noiseReductionLevel = level;
  }

  /**
   * 设置低通滤波器频率
   */
  setLowPassFrequency(frequency: number): void {
    if (this.lowPassFilter) {
      this.lowPassFilter.frequency.value = frequency;
    }
  }

  /**
   * 设置高通滤波器频率
   */
  setHighPassFrequency(frequency: number): void {
    if (this.highPassFilter) {
      this.highPassFilter.frequency.value = frequency;
    }
  }

  /**
   * 断开所有连接
   */
  disconnect(): void {
    this.isProcessing = false;
    
    if (this.inputNode) {
      this.inputNode.disconnect();
    }
    
    if (this.highPassFilter) {
      this.highPassFilter.disconnect();
    }
    
    if (this.lowPassFilter) {
      this.lowPassFilter.disconnect();
    }
    
    if (this.noiseGate) {
      this.noiseGate.disconnect();
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
    }
    
    if (this.outputNode) {
      this.outputNode.disconnect();
    }
  }
}

