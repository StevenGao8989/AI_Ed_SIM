/**
 * 动态视频生成器 - 能够根据任意物理题目动态生成视频
 * 
 * 功能：
 * 1. 动态分析物理类型
 * 2. 自动选择视频配置
 * 3. 智能编码参数
 * 4. 自适应质量设置
 * 5. 多格式支持
 */

import { SimulationResult } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/simulation/DynamicPhysicsSimulator';
import { PhysicsIR } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/ir/PhysicsIR';
import { DynamicPhysicsRenderer, RenderConfig, RenderResult } from '/Users/gaobingsong/Documents/AI_Ed_SIM/services/rendering/DynamicPhysicsRenderer';

// 视频生成配置
export interface VideoConfig {
  outputPath: string;
  format: 'mp4' | 'webm' | 'gif' | 'avi';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
  duration: number;
  codec: string;
  bitrate: string;
  audio?: {
    enabled: boolean;
    source?: string;
    volume: number;
  };
  effects?: {
    slowMotion?: number;
    timeLapse?: number;
    filters?: string[];
  };
}

// 视频生成结果
export interface VideoResult {
  success: boolean;
  outputPath: string;
  fileSize: number;
  duration: number;
  resolution: { width: number; height: number };
  format: string;
  fps: number;
  bitrate: string;
  generationTime: number;
  errors: string[];
  warnings: string[];
  metadata: {
    physicsType: string;
    frameCount: number;
    compressionRatio: number;
  };
}

// 动态视频生成器
export class DynamicVideoGenerator {
  private renderer: DynamicPhysicsRenderer;
  private ffmpegPath: string;
  private ffmpegAvailable: boolean;

  constructor(ffmpegPath?: string) {
    this.renderer = new DynamicPhysicsRenderer();
    this.ffmpegPath = ffmpegPath || 'ffmpeg';
    this.ffmpegAvailable = false;
    this.checkFFmpegAvailability();
  }

  /**
   * 检查 FFmpeg 可用性
   */
  private async checkFFmpegAvailability(): Promise<void> {
    try {
      const { spawn } = require('child_process');
      
      return new Promise((resolve) => {
        const ffmpeg = spawn(this.ffmpegPath, ['-version'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        ffmpeg.on('close', (code: number) => {
          this.ffmpegAvailable = code === 0;
          if (this.ffmpegAvailable) {
            console.log('✅ FFmpeg is available');
          } else {
            console.warn('⚠️ FFmpeg is not available. Video generation will be limited.');
          }
          resolve();
        });

        ffmpeg.on('error', () => {
          this.ffmpegAvailable = false;
          console.warn('⚠️ FFmpeg is not available. Video generation will be limited.');
          resolve();
        });
      });
    } catch (error) {
      this.ffmpegAvailable = false;
      console.warn('⚠️ FFmpeg check failed:', error);
    }
  }

  /**
   * 生成视频
   */
  async generateVideo(
    simulationResult: SimulationResult,
    ir: PhysicsIR,
    config: VideoConfig
  ): Promise<VideoResult> {
    const startTime = Date.now();
    
    const result: VideoResult = {
      success: false,
      outputPath: config.outputPath,
      fileSize: 0,
      duration: 0,
      resolution: config.resolution,
      format: config.format,
      fps: config.fps,
      bitrate: config.bitrate,
      generationTime: 0,
      errors: [],
      warnings: [],
      metadata: {
        physicsType: this.analyzePhysicsType(ir),
        frameCount: 0,
        compressionRatio: 0
      }
    };

    try {
      console.log('🎬 Starting dynamic video generation...');
      console.log(`📊 Physics type: ${result.metadata.physicsType}`);
      console.log(`📐 Resolution: ${config.resolution.width}x${config.resolution.height}`);
      console.log(`🎞️  Format: ${config.format}`);

      // 1. 分析物理类型并优化配置
      const optimizedConfig = this.optimizeConfigForPhysicsType(config, result.metadata.physicsType);
      
      // 2. 渲染帧序列
      console.log('📸 Rendering frame sequence...');
      const renderResult = await this.renderFrames(simulationResult, ir, optimizedConfig);
      
      if (!renderResult.success) {
        result.errors.push(...renderResult.errors);
        return result;
      }

      // 3. 编码视频
      console.log('🎞️ Encoding video...');
      const encodeResult = await this.encodeVideo(renderResult, optimizedConfig);
      
      if (!encodeResult.success) {
        result.errors.push(...encodeResult.errors);
        return result;
      }

      // 4. 后处理
      console.log('✨ Applying post-processing...');
      await this.postProcess(optimizedConfig);

      // 5. 获取文件信息
      const fileInfo = await this.getFileInfo(config.outputPath);
      result.fileSize = fileInfo.size;
      result.duration = fileInfo.duration;
      result.metadata.frameCount = renderResult.frameCount;
      result.metadata.compressionRatio = this.calculateCompressionRatio(renderResult, fileInfo);

      result.success = true;
      console.log('✅ Video generation completed successfully!');
      console.log(`📁 Output: ${result.outputPath}`);
      console.log(`📊 Size: ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`);

    } catch (error) {
      result.errors.push(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }

    result.generationTime = Date.now() - startTime;
    return result;
  }

  /**
   * 分析物理类型
   */
  private analyzePhysicsType(ir: PhysicsIR): string {
    const modules = ir.system?.modules || [];
    const moduleTypes = modules.map(m => m.type);
    
    if (moduleTypes.includes('kinematics') && moduleTypes.includes('dynamics')) {
      return 'complex_kinematics';
    } else if (moduleTypes.includes('oscillation')) {
      return 'oscillatory_system';
    } else if (moduleTypes.includes('wave')) {
      return 'wave_system';
    } else if (moduleTypes.includes('electromagnetic')) {
      return 'electromagnetic_system';
    } else if (moduleTypes.includes('thermal')) {
      return 'thermal_system';
    } else if (moduleTypes.includes('fluid')) {
      return 'fluid_system';
    } else if (moduleTypes.includes('quantum')) {
      return 'quantum_system';
    } else if (moduleTypes.includes('relativistic')) {
      return 'relativistic_system';
    } else {
      return 'general_physics';
    }
  }

  /**
   * 根据物理类型优化配置
   */
  private optimizeConfigForPhysicsType(config: VideoConfig, physicsType: string): VideoConfig {
    const optimized = { ...config };
    
    switch (physicsType) {
      case 'complex_kinematics':
        // 复杂运动学需要高帧率和清晰度
        optimized.fps = Math.max(config.fps, 30);
        optimized.quality = config.quality === 'low' ? 'medium' : config.quality;
        optimized.resolution = {
          width: Math.max(config.resolution.width, 640),
          height: Math.max(config.resolution.height, 480)
        };
        break;
        
      case 'oscillatory_system':
        // 振荡系统需要平滑的动画
        optimized.fps = Math.max(config.fps, 24);
        optimized.effects = {
          ...optimized.effects,
          slowMotion: optimized.effects?.slowMotion || 0.5
        };
        break;
        
      case 'wave_system':
        // 波动系统需要高分辨率
        optimized.resolution = {
          width: Math.max(config.resolution.width, 800),
          height: Math.max(config.resolution.height, 600)
        };
        optimized.quality = config.quality === 'low' ? 'high' : config.quality;
        break;
        
      case 'electromagnetic_system':
        // 电磁系统需要特殊效果
        optimized.effects = {
          ...optimized.effects,
          filters: [...(optimized.effects?.filters || []), 'glow', 'electric']
        };
        break;
        
      case 'quantum_system':
        // 量子系统需要特殊处理
        optimized.quality = 'ultra';
        optimized.fps = Math.max(config.fps, 60);
        break;
        
      case 'relativistic_system':
        // 相对论系统需要高精度
        optimized.quality = 'ultra';
        optimized.resolution = {
          width: Math.max(config.resolution.width, 1024),
          height: Math.max(config.resolution.height, 768)
        };
        break;
    }
    
    return optimized;
  }

  /**
   * 渲染帧序列
   */
  private async renderFrames(
    simulationResult: SimulationResult,
    ir: PhysicsIR,
    config: VideoConfig
  ): Promise<RenderResult> {
    const renderConfig: RenderConfig = {
      width: config.resolution.width,
      height: config.resolution.height,
      fps: config.fps,
      duration: config.duration,
      quality: config.quality,
      format: 'png_sequence',
      backgroundColor: this.getBackgroundColorForPhysicsType(this.analyzePhysicsType(ir)),
      camera: {
        mode: this.getCameraModeForPhysicsType(this.analyzePhysicsType(ir)),
        position: { x: 10, y: 10, z: 10 },
        target: { x: 0, y: 0, z: 0 },
        fov: 75,
        near: 0.1,
        far: 1000
      },
      lighting: {
        ambient: 0.4,
        directional: 0.8,
        shadows: true,
        color: '#FFFFFF'
      },
      effects: {
        particles: this.shouldEnableParticles(this.analyzePhysicsType(ir)),
        trails: this.shouldEnableTrails(this.analyzePhysicsType(ir)),
        forces: this.shouldEnableForces(this.analyzePhysicsType(ir)),
        energy: this.shouldEnableEnergy(this.analyzePhysicsType(ir)),
        grid: this.shouldEnableGrid(this.analyzePhysicsType(ir))
      }
    };

    return await this.renderer.renderSimulation(simulationResult, ir, renderConfig);
  }

  /**
   * 编码视频
   */
  private async encodeVideo(renderResult: RenderResult, config: VideoConfig): Promise<any> {
    if (!this.ffmpegAvailable) {
      return {
        success: false,
        errors: ['FFmpeg is not available']
      };
    }

    const { exec } = require('child_process');
    
    // 构建FFmpeg命令
    const ffmpegCommand = this.buildFFmpegCommand(renderResult, config);
    
    return new Promise((resolve) => {
      exec(ffmpegCommand, (error: any, stdout: string, stderr: string) => {
        if (error) {
          resolve({
            success: false,
            errors: [`FFmpeg encoding failed: ${error.message}`]
          });
        } else {
          resolve({
            success: true,
            output: stdout
          });
        }
      });
    });
  }

  /**
   * 构建FFmpeg命令
   */
  private buildFFmpegCommand(renderResult: RenderResult, config: VideoConfig): string {
    const physicsType = this.analyzePhysicsType({} as PhysicsIR);
    let command = `ffmpeg -r ${config.fps} -i frame_%04d.png`;
    
    // 视频编码器
    switch (config.format) {
      case 'mp4':
        command += ` -c:v libx264 -pix_fmt yuv420p`;
        break;
      case 'webm':
        command += ` -c:v libvpx-vp9 -pix_fmt yuv420p`;
        break;
      case 'gif':
        command += ` -vf "fps=${config.fps},scale=${config.resolution.width}:${config.resolution.height}:flags=lanczos,palettegen" -c:v gif`;
        break;
      default:
        command += ` -c:v libx264 -pix_fmt yuv420p`;
    }
    
    // 质量设置
    switch (config.quality) {
      case 'low':
        command += ` -crf 28 -preset fast`;
        break;
      case 'medium':
        command += ` -crf 23 -preset medium`;
        break;
      case 'high':
        command += ` -crf 18 -preset slow`;
        break;
      case 'ultra':
        command += ` -crf 15 -preset veryslow`;
        break;
    }
    
    // 分辨率
    command += ` -s ${config.resolution.width}x${config.resolution.height}`;
    
    // 比特率
    if (config.bitrate) {
      command += ` -b:v ${config.bitrate}`;
    }
    
    // 特殊效果
    if (config.effects) {
      if (config.effects.slowMotion) {
        command += ` -filter:v "setpts=${1/config.effects.slowMotion}*PTS"`;
      }
      if (config.effects.timeLapse) {
        command += ` -filter:v "setpts=${config.effects.timeLapse}*PTS"`;
      }
      if (config.effects.filters) {
        for (const filter of config.effects.filters) {
          command += this.getFilterCommand(filter);
        }
      }
    }
    
    // 输出文件
    command += ` -y "${config.outputPath}"`;
    
    return command;
  }

  /**
   * 获取滤镜命令
   */
  private getFilterCommand(filter: string): string {
    switch (filter) {
      case 'glow':
        return ` -filter:v "boxblur=2:1"`;
      case 'electric':
        return ` -filter:v "noise=alls=20:allf=t"`;
      case 'blur':
        return ` -filter:v "gblur=sigma=1"`;
      case 'sharpen':
        return ` -filter:v "unsharp=5:5:0.8:3:3:0.4"`;
      default:
        return '';
    }
  }

  /**
   * 后处理
   */
  private async postProcess(config: VideoConfig): Promise<void> {
    console.log('✨ Applying post-processing effects...');
    
    // 根据物理类型应用后处理
    const physicsType = this.analyzePhysicsType({} as PhysicsIR);
    
    switch (physicsType) {
      case 'electromagnetic_system':
        await this.applyElectromagneticPostProcessing(config);
        break;
      case 'wave_system':
        await this.applyWavePostProcessing(config);
        break;
      case 'quantum_system':
        await this.applyQuantumPostProcessing(config);
        break;
    }
  }

  /**
   * 获取文件信息
   */
  private async getFileInfo(filePath: string): Promise<{ size: number; duration: number }> {
    const fs = require('fs');
    
    try {
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        duration: 0 // 需要FFprobe获取实际时长
      };
    } catch (error) {
      return { size: 0, duration: 0 };
    }
  }

  /**
   * 计算压缩比
   */
  private calculateCompressionRatio(renderResult: RenderResult, fileInfo: any): number {
    const uncompressedSize = renderResult.frameCount * renderResult.resolution.width * renderResult.resolution.height * 3; // RGB
    return uncompressedSize / fileInfo.size;
  }

  // 辅助方法 - 根据物理类型获取配置
  private getBackgroundColorForPhysicsType(physicsType: string): string {
    switch (physicsType) {
      case 'electromagnetic_system':
        return '#000011'; // 深蓝色
      case 'wave_system':
        return '#001122'; // 深青色
      case 'quantum_system':
        return '#110011'; // 深紫色
      case 'relativistic_system':
        return '#111100'; // 深黄色
      default:
        return '#000000'; // 黑色
    }
  }

  private getCameraModeForPhysicsType(physicsType: string): 'fixed' | 'orbit' | 'follow' | 'free' {
    switch (physicsType) {
      case 'complex_kinematics':
        return 'follow';
      case 'oscillatory_system':
        return 'fixed';
      case 'wave_system':
        return 'orbit';
      case 'electromagnetic_system':
        return 'free';
      default:
        return 'fixed';
    }
  }

  private shouldEnableParticles(physicsType: string): boolean {
    return ['wave_system', 'electromagnetic_system', 'quantum_system'].includes(physicsType);
  }

  private shouldEnableTrails(physicsType: string): boolean {
    return ['complex_kinematics', 'oscillatory_system', 'electromagnetic_system'].includes(physicsType);
  }

  private shouldEnableForces(physicsType: string): boolean {
    return ['electromagnetic_system', 'complex_kinematics'].includes(physicsType);
  }

  private shouldEnableEnergy(physicsType: string): boolean {
    return ['oscillatory_system', 'wave_system', 'quantum_system'].includes(physicsType);
  }

  private shouldEnableGrid(physicsType: string): boolean {
    return ['electromagnetic_system', 'wave_system'].includes(physicsType);
  }

  // 后处理方法
  private async applyElectromagneticPostProcessing(config: VideoConfig): Promise<void> {
    console.log('⚡ Applying electromagnetic post-processing...');
  }

  private async applyWavePostProcessing(config: VideoConfig): Promise<void> {
    console.log('🌊 Applying wave post-processing...');
  }

  private async applyQuantumPostProcessing(config: VideoConfig): Promise<void> {
    console.log('🔬 Applying quantum post-processing...');
  }

  /**
   * 获取推荐配置
   */
  getRecommendedConfig(physicsType: string, quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'): VideoConfig {
    const baseConfig: VideoConfig = {
      outputPath: `output_${physicsType}.mp4`,
      format: 'mp4',
      quality,
      resolution: { width: 640, height: 480 },
      fps: 24,
      duration: 10,
      codec: 'libx264',
      bitrate: '1M'
    };

    return this.optimizeConfigForPhysicsType(baseConfig, physicsType);
  }

  /**
   * 生成预览
   */
  async generatePreview(
    simulationResult: SimulationResult,
    ir: PhysicsIR,
    config: Partial<VideoConfig> = {}
  ): Promise<VideoResult> {
    const physicsType = this.analyzePhysicsType(ir);
    const previewConfig = this.getRecommendedConfig(physicsType, 'low');
    
    // 覆盖配置
    const finalConfig = { ...previewConfig, ...config };
    finalConfig.duration = Math.min(finalConfig.duration, 5); // 预览限制5秒
    finalConfig.resolution = { width: 320, height: 240 }; // 低分辨率预览
    
    return await this.generateVideo(simulationResult, ir, finalConfig);
  }

  /**
   * 获取支持的格式
   */
  getSupportedFormats(): string[] {
    return ['mp4', 'webm', 'gif', 'avi'];
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up video generation resources...');
    // 清理临时文件
  }
}
