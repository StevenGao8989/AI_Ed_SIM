// services/export/FFmpegEncoder.ts
// FFmpeg编码器：libx264 + yuv420p + faststart

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * FFmpeg编码配置
 */
export interface FFmpegConfig {
  codec: string;           // 视频编码器 (libx264, libx265, etc.)
  pixelFormat: string;     // 像素格式 (yuv420p, yuv444p, etc.)
  crf: number;            // 质量因子 (0-51, 越小质量越高)
  preset: string;         // 编码预设 (ultrafast, fast, medium, slow, etc.)
  profile: string;        // 编码配置文件 (baseline, main, high)
  level: string;          // 编码级别 (3.1, 4.0, 4.1, etc.)
  faststart: boolean;     // 是否启用快速开始
  fps: number;            // 帧率
  bitrate?: string;       // 比特率 (可选，如 "2000k")
  maxrate?: string;       // 最大比特率
  bufsize?: string;       // 缓冲区大小
  gop?: number;           // GOP大小
  keyint?: number;        // 关键帧间隔
  scenecut?: number;      // 场景切换阈值
  threads?: number;       // 编码线程数
}

/**
 * 编码结果
 */
export interface EncodeResult {
  outputPath: string;
  duration: number;
  fileSize: number;
  fps: number;
  resolution: { width: number; height: number };
  codec: string;
  pixelFormat: string;
  bitrate: string;
  encodeTime: number;
  success: boolean;
  error?: string;
}

/**
 * FFmpeg编码器
 */
export class FFmpegEncoder {
  private config: FFmpegConfig;

  constructor(config: Partial<FFmpegConfig> = {}) {
    this.config = {
      codec: 'libx264',
      pixelFormat: 'yuv420p',
      crf: 18,              // 高质量
      preset: 'medium',
      profile: 'high',
      level: '4.1',
      faststart: true,
      fps: 30,
      gop: 30,
      keyint: 60,
      scenecut: 40,
      threads: 0,           // 自动检测
      ...config
    };
  }

  /**
   * 编码MP4视频
   */
  async encodeMP4(
    inputPattern: string,
    outputPath: string,
    fps?: number
  ): Promise<EncodeResult> {
    console.log('🎬 开始FFmpeg编码...');
    console.log(`📥 输入: ${inputPattern}`);
    console.log(`📤 输出: ${outputPath}`);
    
    const startTime = performance.now();
    const actualFps = fps || this.config.fps;
    
    try {
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // 构建FFmpeg命令
      const ffmpegArgs = this.buildFFmpegArgs(inputPattern, outputPath, actualFps);
      
      console.log('🔧 FFmpeg命令:', 'ffmpeg', ffmpegArgs.join(' '));
      
      // 执行FFmpeg
      const { stdout, stderr } = await this.executeFFmpeg(ffmpegArgs);
      
      // 分析结果
      const result = await this.analyzeOutput(outputPath, stdout, stderr, startTime, actualFps);
      
      console.log('✅ FFmpeg编码完成');
      console.log(`📊 文件大小: ${(result.fileSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`⏱️ 编码时间: ${result.encodeTime.toFixed(2)}ms`);
      
      return result;
      
    } catch (error) {
      console.error('❌ FFmpeg编码失败:', error);
      
      return {
        outputPath: outputPath,
        duration: 0,
        fileSize: 0,
        fps: actualFps,
        resolution: { width: 0, height: 0 },
        codec: this.config.codec,
        pixelFormat: this.config.pixelFormat,
        bitrate: '0kbps',
        encodeTime: performance.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 构建FFmpeg参数
   */
  private buildFFmpegArgs(inputPattern: string, outputPath: string, fps: number): string[] {
    const args: string[] = [];
    
    // 输入参数
    args.push('-y');                    // 覆盖输出文件
    args.push('-f', 'image2');          // 输入格式
    args.push('-framerate', fps.toString());
    args.push('-i', inputPattern);      // 输入文件模式
    
    // 视频编码参数
    args.push('-c:v', this.config.codec);
    args.push('-pix_fmt', this.config.pixelFormat);
    args.push('-crf', this.config.crf.toString());
    args.push('-preset', this.config.preset);
    args.push('-profile:v', this.config.profile);
    args.push('-level', this.config.level);
    
    // GOP和关键帧设置
    if (this.config.gop) {
      args.push('-g', this.config.gop.toString());
    }
    if (this.config.keyint) {
      args.push('-keyint_min', this.config.keyint.toString());
    }
    if (this.config.scenecut !== undefined) {
      args.push('-sc_threshold', this.config.scenecut.toString());
    }
    
    // 比特率控制（如果指定）
    if (this.config.bitrate) {
      args.push('-b:v', this.config.bitrate);
    }
    if (this.config.maxrate) {
      args.push('-maxrate', this.config.maxrate);
      args.push('-bufsize', this.config.bufsize || this.config.maxrate);
    }
    
    // 多线程设置
    if (this.config.threads) {
      args.push('-threads', this.config.threads.toString());
    }
    
    // 快速开始（Web优化）
    if (this.config.faststart) {
      args.push('-movflags', '+faststart');
    }
    
    // 其他优化
    args.push('-tune', 'animation');    // 动画优化
    args.push('-x264opts', 'ref=3:mixed-refs=1:no-fast-pskip=1:8x8dct=1');
    
    // 输出文件
    args.push(outputPath);
    
    return args;
  }

  /**
   * 执行FFmpeg命令
   */
  private async executeFFmpeg(args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      
      let stdout = '';
      let stderr = '';
      
      ffmpeg.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`FFmpeg exited with code ${code}\n${stderr}`));
        }
      });
      
      ffmpeg.on('error', (error) => {
        reject(new Error(`Failed to start FFmpeg: ${error.message}`));
      });
    });
  }

  /**
   * 分析输出结果
   */
  private async analyzeOutput(
    outputPath: string,
    stdout: string,
    stderr: string,
    startTime: number,
    fps: number
  ): Promise<EncodeResult> {
    const encodeTime = performance.now() - startTime;
    
    // 检查文件是否存在
    if (!fs.existsSync(outputPath)) {
      throw new Error('输出文件未生成');
    }
    
    const fileStats = fs.statSync(outputPath);
    const fileSize = fileStats.size;
    
    if (fileSize === 0) {
      throw new Error('输出文件为空');
    }
    
    // 解析FFmpeg输出信息
    const info = this.parseFFmpegOutput(stderr);
    
    return {
      outputPath: outputPath,
      duration: info.duration,
      fileSize: fileSize,
      fps: fps,
      resolution: info.resolution,
      codec: this.config.codec,
      pixelFormat: this.config.pixelFormat,
      bitrate: info.bitrate,
      encodeTime: encodeTime,
      success: true
    };
  }

  /**
   * 解析FFmpeg输出信息
   */
  private parseFFmpegOutput(stderr: string): {
    duration: number;
    resolution: { width: number; height: number };
    bitrate: string;
  } {
    let duration = 0;
    let resolution = { width: 0, height: 0 };
    let bitrate = '0kbps';
    
    // 解析时长
    const durationMatch = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
    if (durationMatch) {
      const hours = parseInt(durationMatch[1]);
      const minutes = parseInt(durationMatch[2]);
      const seconds = parseFloat(durationMatch[3]);
      duration = hours * 3600 + minutes * 60 + seconds;
    }
    
    // 解析分辨率
    const resolutionMatch = stderr.match(/(\d+)x(\d+)/);
    if (resolutionMatch) {
      resolution.width = parseInt(resolutionMatch[1]);
      resolution.height = parseInt(resolutionMatch[2]);
    }
    
    // 解析比特率
    const bitrateMatch = stderr.match(/bitrate:\s*(\d+)\s*kb\/s/);
    if (bitrateMatch) {
      bitrate = bitrateMatch[1] + 'kbps';
    }
    
    return { duration, resolution, bitrate };
  }

  /**
   * 检查FFmpeg是否可用
   */
  static async checkFFmpegAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('ffmpeg -version');
      return stdout.includes('ffmpeg version');
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取FFmpeg版本信息
   */
  static async getFFmpegVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync('ffmpeg -version');
      const versionMatch = stdout.match(/ffmpeg version ([^\s]+)/);
      return versionMatch ? versionMatch[1] : 'unknown';
    } catch (error) {
      throw new Error('FFmpeg not available');
    }
  }

  /**
   * 批量编码（多个输入）
   */
  async encodeBatch(
    inputs: Array<{ pattern: string; output: string; fps?: number }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<EncodeResult[]> {
    console.log(`🎬 开始批量编码，共${inputs.length}个任务...`);
    
    const results: EncodeResult[] = [];
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      
      try {
        const result = await this.encodeMP4(input.pattern, input.output, input.fps);
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, inputs.length);
        }
        
        console.log(`✅ 任务 ${i + 1}/${inputs.length} 完成: ${input.output}`);
      } catch (error) {
        console.error(`❌ 任务 ${i + 1}/${inputs.length} 失败: ${error.message}`);
        
        results.push({
          outputPath: input.output,
          duration: 0,
          fileSize: 0,
          fps: input.fps || this.config.fps,
          resolution: { width: 0, height: 0 },
          codec: this.config.codec,
          pixelFormat: this.config.pixelFormat,
          bitrate: '0kbps',
          encodeTime: 0,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`🎯 批量编码完成: ${successCount}/${inputs.length} 成功`);
    
    return results;
  }

  /**
   * 优化Web播放
   */
  static createWebOptimizedConfig(fps: number = 30): FFmpegConfig {
    return {
      codec: 'libx264',
      pixelFormat: 'yuv420p',
      crf: 23,              // Web平衡质量
      preset: 'fast',       // 快速编码
      profile: 'main',      // 兼容性好
      level: '4.0',
      faststart: true,      // Web必需
      fps: fps,
      bitrate: '2000k',     // 适中比特率
      maxrate: '2500k',
      bufsize: '5000k',
      gop: fps,             // 1秒一个GOP
      keyint: fps * 2,      // 2秒最大关键帧间隔
      scenecut: 40,
      threads: 0
    };
  }

  /**
   * 创建高质量配置
   */
  static createHighQualityConfig(fps: number = 60): FFmpegConfig {
    return {
      codec: 'libx264',
      pixelFormat: 'yuv420p',
      crf: 15,              // 高质量
      preset: 'slow',       // 慢速高质量
      profile: 'high',
      level: '4.1',
      faststart: true,
      fps: fps,
      gop: fps,
      keyint: fps,
      scenecut: 40,
      threads: 0
    };
  }
}

/**
 * 便捷编码函数
 */
export async function encodeMP4(
  inputPattern: string,
  outputPath: string,
  fps: number,
  config?: Partial<FFmpegConfig>
): Promise<EncodeResult> {
  const encoder = new FFmpegEncoder(config);
  return await encoder.encodeMP4(inputPattern, outputPath, fps);
}

/**
 * 默认编码器实例
 */
export const ffmpegEncoder = new FFmpegEncoder();
