/**
 * 语音服务 - 使用Web Speech API提供文本朗读功能
 */

// 语音服务状态
export enum SpeechServiceStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  SPEAKING = 'speaking',
  ERROR = 'error',
  UNSUPPORTED = 'unsupported'
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private status: SpeechServiceStatus = SpeechServiceStatus.INITIALIZING;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private preferredVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.init();
  }

  /**
   * 初始化语音服务
   */
  private init(): void {
    // 检查浏览器是否支持语音合成
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;

      // 添加调试日志
      console.log('语音合成支持检测: 支持 speechSynthesis');
      console.log('浏览器信息:', navigator.userAgent);

      // 加载可用的语音
      this.loadVoices();

      // 如果voices为空，可能需要等待voiceschanged事件
      if (this.voices.length === 0) {
        console.log('语音列表为空，添加voiceschanged事件监听器');
        this.synth.addEventListener('voiceschanged', () => {
          console.log('voiceschanged 事件触发');
          this.loadVoices();
        });
      }
    } else {
      this.status = SpeechServiceStatus.UNSUPPORTED;
      console.warn('当前浏览器不支持语音合成功能');
    }
  }

  /**
   * 加载可用的语音
   */
  private loadVoices(): void {
    if (!this.synth) return;

    this.voices = this.synth.getVoices();
    console.log('加载到的语音数量:', this.voices.length);

    if (this.voices.length > 0) {
      // 输出所有可用的语音
      this.voices.forEach((voice, index) => {
        console.log(`语音 ${index + 1}:`, voice.name, voice.lang, voice.default ? '(默认)' : '');
      });

      // 尝试找到中文语音
      this.preferredVoice = this.voices.find(voice =>
        voice.lang.includes('zh') || voice.lang.includes('cmn')
      ) || null;

      if (this.preferredVoice) {
        console.log('选择的中文语音:', this.preferredVoice.name, this.preferredVoice.lang);
      } else {
        console.log('未找到中文语音，使用默认语音');
      }

      this.status = SpeechServiceStatus.READY;
      console.log('语音服务状态设置为: READY');
    } else {
      // 如果没有可用的语音，设置为错误状态
      this.status = SpeechServiceStatus.ERROR;
      console.warn('未找到可用的语音，语音服务状态设置为: ERROR');
    }
  }

  /**
   * 获取当前服务状态
   */
  public getStatus(): SpeechServiceStatus {
    return this.status;
  }

  /**
   * 检查语音服务是否可用
   */
  public isAvailable(): boolean {
    const available = this.status === SpeechServiceStatus.READY;
    console.log('检查语音服务是否可用:', available, '当前状态:', this.status);
    return available;
  }

  /**
   * 朗读文本
   * @param text 要朗读的文本
   */
  public speak(text: string): void {
    if (!this.synth || !this.isAvailable()) {
      console.warn('语音服务不可用');
      return;
    }

    // 如果当前有正在朗读的内容，先停止
    this.stop();

    // 创建新的语音实例
    const utterance = new SpeechSynthesisUtterance(text);

    // 设置语音
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }

    // 设置语速和音调
    utterance.rate = 1.0;  // 正常语速
    utterance.pitch = 1.0; // 正常音调

    // 设置事件处理
    utterance.onstart = () => {
      this.status = SpeechServiceStatus.SPEAKING;
    };

    utterance.onend = () => {
      this.status = SpeechServiceStatus.READY;
      this.currentUtterance = null;
    };

    utterance.onerror = (event) => {
      console.error('语音合成错误:', event);
      this.status = SpeechServiceStatus.ERROR;
      this.currentUtterance = null;
    };

    // 保存当前朗读实例
    this.currentUtterance = utterance;

    // 开始朗读
    this.synth.speak(utterance);
  }

  /**
   * 停止当前朗读
   */
  public stop(): void {
    if (!this.synth) return;

    this.synth.cancel();
    this.currentUtterance = null;

    if (this.status === SpeechServiceStatus.SPEAKING) {
      this.status = SpeechServiceStatus.READY;
    }
  }

  /**
   * 检查是否正在朗读
   */
  public isSpeaking(): boolean {
    return this.status === SpeechServiceStatus.SPEAKING;
  }

  /**
   * 获取当前朗读实例
   */
  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }
}

// 创建单例实例
const speechService = new SpeechService();

export default speechService;
