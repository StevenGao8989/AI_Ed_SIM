// services/ai_parsing/MultiLanguageSupport.ts
// 多语言支持模块：支持多种语言的物理题目解析

import type { ParsedQuestion } from './PhysicsAIParser';

/**
 * 支持的语言
 */
export type SupportedLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'fr-FR' | 'de-DE' | 'es-ES';

/**
 * 语言配置
 */
export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  aiModel: string;
  physicsTerms: Record<string, string>;
  unitTranslations: Record<string, string>;
  commonPhrases: Record<string, string>;
}

/**
 * 翻译结果
 */
export interface TranslationResult {
  success: boolean;
  originalText: string;
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  confidence: number;
  errors: string[];
}

/**
 * 多语言物理解析器
 */
export class MultiLanguagePhysicsParser {
  private languageConfigs: Map<SupportedLanguage, LanguageConfig> = new Map();
  private defaultLanguage: SupportedLanguage = 'zh-CN';

  constructor() {
    this.initializeLanguageConfigs();
  }

  /**
   * 初始化语言配置
   */
  private initializeLanguageConfigs(): void {
    // 中文配置
    this.languageConfigs.set('zh-CN', {
      code: 'zh-CN',
      name: 'Chinese (Simplified)',
      nativeName: '简体中文',
      aiModel: 'deepseek-v3',
      physicsTerms: {
        'mass': '质量',
        'velocity': '速度',
        'acceleration': '加速度',
        'force': '力',
        'energy': '能量',
        'momentum': '动量',
        'gravity': '重力',
        'friction': '摩擦',
        'collision': '碰撞',
        'incline': '斜面',
        'free_fall': '自由落体',
        'elastic': '弹性',
        'kinetic_energy': '动能',
        'potential_energy': '势能'
      },
      unitTranslations: {
        'm': '米',
        'kg': '千克',
        's': '秒',
        'N': '牛顿',
        'J': '焦耳',
        'm/s': '米每秒',
        'm/s²': '米每二次方秒',
        '°': '度'
      },
      commonPhrases: {
        'find': '求',
        'given': '已知',
        'calculate': '计算',
        'determine': '确定',
        'solve_for': '求解'
      }
    });

    // 英文配置
    this.languageConfigs.set('en-US', {
      code: 'en-US',
      name: 'English (US)',
      nativeName: 'English',
      aiModel: 'gpt-4',
      physicsTerms: {
        '质量': 'mass',
        '速度': 'velocity',
        '加速度': 'acceleration',
        '力': 'force',
        '能量': 'energy',
        '动量': 'momentum',
        '重力': 'gravity',
        '摩擦': 'friction',
        '碰撞': 'collision',
        '斜面': 'incline',
        '自由落体': 'free fall',
        '弹性': 'elastic',
        '动能': 'kinetic energy',
        '势能': 'potential energy'
      },
      unitTranslations: {
        '米': 'm',
        '千克': 'kg',
        '秒': 's',
        '牛顿': 'N',
        '焦耳': 'J',
        '米每秒': 'm/s',
        '米每二次方秒': 'm/s²',
        '度': '°'
      },
      commonPhrases: {
        '求': 'find',
        '已知': 'given',
        '计算': 'calculate',
        '确定': 'determine',
        '求解': 'solve for'
      }
    });

    // 日文配置
    this.languageConfigs.set('ja-JP', {
      code: 'ja-JP',
      name: 'Japanese',
      nativeName: '日本語',
      aiModel: 'gpt-4',
      physicsTerms: {
        'mass': '質量',
        'velocity': '速度',
        'acceleration': '加速度',
        'force': '力',
        'energy': 'エネルギー',
        'momentum': '運動量',
        'gravity': '重力',
        'friction': '摩擦',
        'collision': '衝突',
        'incline': '斜面',
        'free_fall': '自由落下',
        'elastic': '弾性',
        'kinetic_energy': '運動エネルギー',
        'potential_energy': '位置エネルギー'
      },
      unitTranslations: {
        'm': 'メートル',
        'kg': 'キログラム',
        's': '秒',
        'N': 'ニュートン',
        'J': 'ジュール',
        'm/s': 'メートル毎秒',
        'm/s²': 'メートル毎秒の二乗',
        '°': '度'
      },
      commonPhrases: {
        'find': '求める',
        'given': '与えられた',
        'calculate': '計算する',
        'determine': '決定する',
        'solve_for': '解く'
      }
    });
  }

  /**
   * 检测语言
   */
  async detectLanguage(text: string): Promise<SupportedLanguage> {
    console.log('🔍 检测文本语言...');

    // 简单的语言检测逻辑
    if (/[\u4e00-\u9fff]/.test(text)) {
      return 'zh-CN'; // 中文
    } else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return 'ja-JP'; // 日文
    } else if (/[\uac00-\ud7af]/.test(text)) {
      return 'ko-KR'; // 韩文
    } else {
      return 'en-US'; // 默认英文
    }
  }

  /**
   * 翻译文本
   */
  async translateText(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage = 'zh-CN'
  ): Promise<TranslationResult> {
    console.log(`🌐 翻译文本: ${sourceLanguage} → ${targetLanguage}`);

    if (sourceLanguage === targetLanguage) {
      return {
        success: true,
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        confidence: 1.0,
        errors: []
      };
    }

    try {
      // 这里可以集成翻译API（Google Translate、Azure Translator等）
      // 目前使用简单的词汇替换作为示例
      const translatedText = await this.performBasicTranslation(text, sourceLanguage, targetLanguage);

      return {
        success: true,
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
        confidence: 0.8,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        originalText: text,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Translation failed']
      };
    }
  }

  /**
   * 基础翻译实现
   */
  private async performBasicTranslation(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): Promise<string> {
    const sourceConfig = this.languageConfigs.get(sourceLanguage);
    const targetConfig = this.languageConfigs.get(targetLanguage);

    if (!sourceConfig || !targetConfig) {
      throw new Error(`不支持的语言: ${sourceLanguage} 或 ${targetLanguage}`);
    }

    let translatedText = text;

    // 翻译物理术语
    for (const [sourcePhrase, targetPhrase] of Object.entries(sourceConfig.physicsTerms)) {
      const targetTerm = targetConfig.physicsTerms[targetPhrase] || targetPhrase;
      translatedText = translatedText.replace(new RegExp(sourcePhrase, 'gi'), targetTerm);
    }

    // 翻译单位
    for (const [sourceUnit, targetUnit] of Object.entries(sourceConfig.unitTranslations)) {
      const targetUnitTranslation = targetConfig.unitTranslations[targetUnit] || targetUnit;
      translatedText = translatedText.replace(new RegExp(sourceUnit, 'g'), targetUnitTranslation);
    }

    return translatedText;
  }

  /**
   * 解析多语言物理题目
   */
  async parseMultiLanguagePhysics(
    text: string,
    physicsParser: any,
    targetLanguage: SupportedLanguage = 'zh-CN'
  ): Promise<ParsedQuestion> {
    console.log('🌍 开始多语言物理题目解析...');

    try {
      // 1. 检测语言
      const detectedLanguage = await this.detectLanguage(text);
      console.log(`🔍 检测到语言: ${detectedLanguage}`);

      // 2. 翻译到目标语言
      const translationResult = await this.translateText(text, detectedLanguage, targetLanguage);
      if (!translationResult.success) {
        throw new Error(`翻译失败: ${translationResult.errors.join(', ')}`);
      }

      // 3. 解析翻译后的文本
      const parsedResult = await physicsParser.parseQuestion(translationResult.translatedText);

      // 4. 添加多语言元数据
      parsedResult.metadata = {
        ...parsedResult.metadata,
        originalLanguage: detectedLanguage,
        targetLanguage: targetLanguage,
        translationConfidence: translationResult.confidence,
        originalText: text,
        translatedText: translationResult.translatedText
      };

      console.log('✅ 多语言物理题目解析完成');
      return parsedResult;

    } catch (error) {
      console.error('❌ 多语言解析失败:', error);
      throw new Error(`多语言解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): LanguageConfig[] {
    return Array.from(this.languageConfigs.values());
  }

  /**
   * 获取语言配置
   */
  getLanguageConfig(language: SupportedLanguage): LanguageConfig | undefined {
    return this.languageConfigs.get(language);
  }

  /**
   * 添加新语言支持
   */
  addLanguageSupport(config: LanguageConfig): void {
    this.languageConfigs.set(config.code, config);
  }
}

// 导出默认实例
export const multiLanguageParser = new MultiLanguagePhysicsParser();
