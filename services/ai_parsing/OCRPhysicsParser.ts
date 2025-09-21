// services/ai_parsing/OCRPhysicsParser.ts
// OCR物理题目解析器：支持图片输入的物理题目识别

import type { ParsedQuestion } from './PhysicsAIParser';

/**
 * OCR配置接口
 */
export interface OCRConfig {
  provider: 'tesseract' | 'azure' | 'google' | 'baidu';
  apiKey?: string;
  language: 'chi_sim' | 'eng' | 'chi_sim+eng';
  enablePreprocessing: boolean;
  enablePostprocessing: boolean;
  confidence: number;
}

/**
 * 图片预处理配置
 */
export interface ImagePreprocessingConfig {
  enableDenoising: boolean;
  enableContrast: boolean;
  enableRotation: boolean;
  enableSkewCorrection: boolean;
  targetDPI: number;
  grayscale: boolean;
}

/**
 * OCR结果接口
 */
export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
  processingTime: number;
  errors: string[];
  warnings: string[];
}

/**
 * 文字边界框
 */
export interface BoundingBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

/**
 * OCR物理题目解析器
 */
export class OCRPhysicsParser {
  private config: OCRConfig;
  private preprocessingConfig: ImagePreprocessingConfig;

  constructor(config: Partial<OCRConfig> = {}) {
    const defaultConfig: OCRConfig = {
      provider: 'tesseract',
      enablePreprocessing: true,
      enablePostprocessing: true,
      confidence: 0.8,
      language: 'chi_sim'
    };
    
    this.config = { ...defaultConfig, ...config };

    this.preprocessingConfig = {
      enableDenoising: true,
      enableContrast: true,
      enableRotation: true,
      enableSkewCorrection: true,
      targetDPI: 300,
      grayscale: true
    };
  }

  /**
   * 从图片解析物理题目
   */
  async parsePhysicsFromImage(
    imagePath: string,
    fallbackParser?: any
  ): Promise<ParsedQuestion> {
    console.log('🖼️ 开始OCR物理题目解析...');
    console.log(`📂 图片路径: ${imagePath}`);

    try {
      // 1. 图片预处理
      const preprocessedImage = await this.preprocessImage(imagePath);
      console.log('✅ 图片预处理完成');

      // 2. OCR文字识别
      const ocrResult = await this.performOCR(preprocessedImage);
      console.log(`✅ OCR识别完成，置信度: ${ocrResult.confidence}`);
      console.log(`📝 识别文本: ${ocrResult.text.substring(0, 100)}...`);

      // 3. 文本后处理
      const cleanedText = await this.postprocessText(ocrResult.text);
      console.log('✅ 文本后处理完成');

      // 4. 物理题目解析
      let parsedResult: ParsedQuestion;
      if (fallbackParser) {
        parsedResult = await fallbackParser.parseQuestion(cleanedText);
      } else {
        parsedResult = await this.basicPhysicsTextParsing(cleanedText);
      }

      // 5. 添加OCR元数据
      (parsedResult as any).metadata = {
        ...(parsedResult as any).metadata,
        inputType: 'image',
        ocrProvider: this.config.provider,
        ocrConfidence: ocrResult.confidence,
        originalImagePath: imagePath,
        recognizedText: cleanedText
      };

      console.log('✅ OCR物理题目解析完成');
      return parsedResult;

    } catch (error) {
      console.error('❌ OCR解析失败:', error);
      throw new Error(`OCR解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 图片预处理
   */
  private async preprocessImage(imagePath: string): Promise<string> {
    if (!this.config.enablePreprocessing) {
      return imagePath;
    }

    console.log('🔧 开始图片预处理...');
    
    // 这里可以集成图像处理库如Sharp或Canvas
    // 目前返回原始路径，实际实现时需要：
    // 1. 降噪处理
    // 2. 对比度增强
    // 3. 倾斜校正
    // 4. DPI调整
    // 5. 灰度转换

    return imagePath;
  }

  /**
   * 执行OCR识别
   */
  private async performOCR(imagePath: string): Promise<OCRResult> {
    console.log(`🔍 使用${this.config.provider}进行OCR识别...`);

    try {
      switch (this.config.provider) {
        case 'tesseract':
          return await this.performTesseractOCR(imagePath);
        case 'azure':
          return await this.performAzureOCR(imagePath);
        case 'google':
          return await this.performGoogleOCR(imagePath);
        case 'baidu':
          return await this.performBaiduOCR(imagePath);
        default:
          throw new Error(`不支持的OCR提供商: ${this.config.provider}`);
      }
    } catch (error) {
      throw new Error(`OCR识别失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Tesseract OCR实现
   */
  private async performTesseractOCR(imagePath: string): Promise<OCRResult> {
    // 模拟Tesseract OCR调用
    // 实际实现需要安装tesseract.js或调用系统tesseract
    
    const startTime = Date.now();
    
    // 模拟OCR结果
    const mockResult: OCRResult = {
      success: true,
      text: "一个质量为2kg的物体，从高度h=5m处自由下落，落地后与地面发生完全弹性碰撞，然后沿斜面θ=30°向上滑动，斜面摩擦系数μ=0.2。已知重力加速度g=9.8m/s²，求：1. 物体落地时的速度v1 2. 物体沿斜面滑行的最大距离s 3. 整个过程中机械能损失了多少",
      confidence: 0.92,
      boundingBoxes: [],
      processingTime: Date.now() - startTime,
      errors: [],
      warnings: []
    };

    return mockResult;
  }

  /**
   * Azure OCR实现
   */
  private async performAzureOCR(imagePath: string): Promise<OCRResult> {
    // TODO: 实现Azure Computer Vision OCR API调用
    throw new Error('Azure OCR暂未实现');
  }

  /**
   * Google OCR实现
   */
  private async performGoogleOCR(imagePath: string): Promise<OCRResult> {
    // TODO: 实现Google Vision API调用
    throw new Error('Google OCR暂未实现');
  }

  /**
   * 百度OCR实现
   */
  private async performBaiduOCR(imagePath: string): Promise<OCRResult> {
    // TODO: 实现百度OCR API调用
    throw new Error('百度OCR暂未实现');
  }

  /**
   * 文本后处理
   */
  private async postprocessText(text: string): Promise<string> {
    if (!this.config.enablePostprocessing) {
      return text;
    }

    console.log('🧹 开始文本后处理...');

    let cleanedText = text;

    // 1. 去除多余空格和换行
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

    // 2. 修正常见OCR错误
    const corrections = {
      '0': ['o', 'O'],
      '1': ['l', 'I'],
      '5': ['S'],
      '8': ['B'],
      'θ': ['0', 'θ', 'Θ'],
      'μ': ['u', 'μ', 'µ'],
      '²': ['^2', '2'],
      '°': ['度', '°']
    };

    for (const [correct, wrong] of Object.entries(corrections)) {
      for (const w of wrong) {
        cleanedText = cleanedText.replace(new RegExp(w, 'g'), correct);
      }
    }

    // 3. 物理符号标准化
    cleanedText = cleanedText
      .replace(/重力加速度\s*[gG]\s*=?\s*(\d+\.?\d*)/g, '重力加速度g=$1')
      .replace(/质量\s*[mM]\s*=?\s*(\d+\.?\d*)/g, '质量m=$1')
      .replace(/高度\s*[hH]\s*=?\s*(\d+\.?\d*)/g, '高度h=$1')
      .replace(/角度\s*[θΘ]\s*=?\s*(\d+\.?\d*)/g, '角度θ=$1');

    console.log('✅ 文本后处理完成');
    return cleanedText;
  }

  /**
   * 基础物理文本解析
   */
  private async basicPhysicsTextParsing(text: string): Promise<ParsedQuestion> {
    // 简单的物理题目解析（作为fallback）
    const result: ParsedQuestion = {
      subject: 'physics',
      topic: '未知',
      question: text,
      parameters: [],
      units: []
    };

    // 简单的参数提取
    const paramRegex = /([a-zA-Zθμ]+)\s*=?\s*(\d+\.?\d*)\s*([a-zA-Z\/²°]*)/g;
    let match;
    while ((match = paramRegex.exec(text)) !== null) {
      const [, symbol, value, unit] = match;
      result.parameters.push({
        symbol,
        value: parseFloat(value),
        unit: unit || '',
        role: 'given',
        note: `从OCR识别的参数`
      });
    }

    return result;
  }

  /**
   * 验证OCR结果质量
   */
  validateOCRResult(result: OCRResult): boolean {
    return (
      result.success &&
      result.confidence >= this.config.confidence &&
      result.text.length > 10 &&
      result.errors.length === 0
    );
  }

  /**
   * 获取支持的图片格式
   */
  getSupportedFormats(): string[] {
    return ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif', 'webp'];
  }
}

// 导出默认配置
export const defaultOCRConfig: OCRConfig = {
  provider: 'tesseract',
  language: 'chi_sim',
  enablePreprocessing: true,
  enablePostprocessing: true,
  confidence: 0.8
};
