// scripts/run_pipeline.ts
// 主流水线：Contract → MP4 的完整管道

import { IRConverter } from '../services/ir/IRConverter';
import { ContractValidator } from '../services/ir/ContractValidator';
import { simulate } from '../services/simulation/Simulator';
import { ResultValidator } from '../services/validation/ResultValidator';
import { RenderCfgBuilder } from '../services/rendering/RenderCfgBuilder';
import { resample } from '../services/rendering/FrameResampler';
import { renderFrames } from '../services/rendering/CanvasFrameRenderer';
import { encodeMP4 } from '../services/export/FFmpegEncoder';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 流水线配置
 */
export interface PipelineConfig {
  tEnd: number;           // 仿真结束时间
  fps: number;           // 视频帧率
  resolution: [number, number]; // 视频分辨率
  outputDir: string;     // 输出目录
  tempDir: string;       // 临时目录
  enableValidation: boolean; // 是否启用验证
  enableOptimization: boolean; // 是否启用优化
}

/**
 * 流水线结果
 */
export interface PipelineResult {
  success: boolean;
  outputPath: string;
  statistics: {
    totalTime: number;
    simulationTime: number;
    renderingTime: number;
    encodingTime: number;
    validationTime: number;
  };
  validation: {
    preSimGate: any;
    postSimGate: any;
    quickCheck: any;
  };
  errors: string[];
  warnings: string[];
}

/**
 * 主流水线执行器
 */
export class Pipeline {
  private config: PipelineConfig;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      tEnd: 10.0,
      fps: 30,
      resolution: [1920, 1080],
      outputDir: './output',
      tempDir: './temp',
      enableValidation: true,
      enableOptimization: false,
      ...config
    };
  }

  /**
   * 执行完整流水线
   */
  async runPipeline(
    parsedQuestion: any,
    outputFilename: string = 'physics_animation.mp4'
  ): Promise<PipelineResult> {
    console.log('🚀 启动物理仿真流水线...');
    console.log(`📊 配置: ${this.config.tEnd}s, ${this.config.fps}fps, ${this.config.resolution[0]}x${this.config.resolution[1]}`);
    
    const startTime = performance.now();
    const result: PipelineResult = {
      success: false,
      outputPath: '',
      statistics: {
        totalTime: 0,
        simulationTime: 0,
        renderingTime: 0,
        encodingTime: 0,
        validationTime: 0
      },
      validation: {
        preSimGate: null,
        postSimGate: null,
        quickCheck: null
      },
      errors: [],
      warnings: []
    };
    
    try {
      // 确保输出目录存在
      this.ensureDirectories();
      
      // 1. IR转换：ParsedQuestion → DSL + Contract
      console.log('🔄 第1步: IR转换...');
      const irStartTime = performance.now();
      
      const { dsl, contract } = IRConverter.fromParsed(parsedQuestion);
      
      console.log('✅ IR转换完成');
      console.log(`📋 DSL: ${dsl.state.dof}自由度, ${dsl.events.length}个事件`);
      console.log(`📋 Contract: ${contract.bodies.length}个刚体, ${contract.surfaces.length}个表面`);
      
      // 2. Pre-Sim Gate：Contract验证
      console.log('🔒 第2步: Pre-Sim Gate验证...');
      const preSimStartTime = performance.now();
      
      const contractValidator = new ContractValidator();
      
      if (this.config.enableValidation) {
        contractValidator.assert(contract); // 硬门禁，失败时抛出异常
        result.validation.preSimGate = { success: true, message: 'Pre-Sim Gate通过' };
      } else {
        result.validation.preSimGate = { success: true, message: 'Pre-Sim Gate跳过' };
      }
      
      result.statistics.validationTime += performance.now() - preSimStartTime;
      console.log('✅ Pre-Sim Gate通过');
      
      // 3. 数值仿真
      console.log('🧮 第3步: 数值仿真...');
      const simStartTime = performance.now();
      
      const trace = await simulate(dsl, contract, this.config.tEnd);
      
      result.statistics.simulationTime = performance.now() - simStartTime;
      console.log(`✅ 仿真完成: ${trace.samples.length}个样本, ${trace.events.length}个事件`);
      console.log(`📊 仿真统计: ${trace.stats.steps}步, ${trace.stats.rejects}次拒绝, ${trace.stats.cpuMs.toFixed(2)}ms`);
      
      // 4. 快速检查（可选）
      if (this.config.enableValidation) {
        console.log('⚡ 第4步: 快速检查...');
        const quickCheckStartTime = performance.now();
        
        const resultValidator = new ResultValidator();
        result.validation.quickCheck = resultValidator.quickCheck(trace, contract);
        
        result.statistics.validationTime += performance.now() - quickCheckStartTime;
        
        if (!result.validation.quickCheck.success) {
          result.warnings.push(...result.validation.quickCheck.errors);
          console.log('⚠️ 快速检查发现问题，但继续执行');
        } else {
          console.log('✅ 快速检查通过');
        }
      }
      
      // 5. 渲染配置生成
      console.log('🎨 第5步: 渲染配置生成...');
      const renderConfigStartTime = performance.now();
      
      const renderConfig = RenderCfgBuilder.from(contract, trace, {
        fps: this.config.fps,
        size: this.config.resolution,
        showEnergy: true,
        showVectors: true
      });
      
      console.log('✅ 渲染配置生成完成');
      
      // 6. 帧重采样
      console.log('🎬 第6步: 帧重采样...');
      const resampledFrames = resample(trace, this.config.fps, {
        eventAlignment: true,
        interpolationMethod: 'linear'
      });
      
      console.log(`✅ 帧重采样完成: ${resampledFrames.length}帧`);
      
      // 7. 帧渲染
      console.log('🖼️ 第7步: 帧渲染...');
      const renderStartTime = performance.now();
      
      const framePattern = path.join(this.config.tempDir, 'frame_%06d.png');
      const renderResults = await renderFrames(
        resampledFrames,
        renderConfig,
        this.config.tempDir
      );
      
      result.statistics.renderingTime = performance.now() - renderStartTime;
      console.log(`✅ 帧渲染完成: ${renderResults.length}帧`);
      
      // 8. 视频编码
      console.log('🎞️ 第8步: 视频编码...');
      const encodeStartTime = performance.now();
      
      const outputPath = path.join(this.config.outputDir, outputFilename);
      const encodeResult = await encodeMP4(
        framePattern,
        outputPath,
        this.config.fps
      );
      
      result.statistics.encodingTime = performance.now() - encodeStartTime;
      
      if (encodeResult.success) {
        result.outputPath = outputPath;
        console.log(`✅ 视频编码完成: ${outputPath}`);
        console.log(`📹 视频信息: ${encodeResult.duration.toFixed(2)}s, ${(encodeResult.fileSize / 1024 / 1024).toFixed(2)}MB`);
      } else {
        throw new Error(`视频编码失败: ${encodeResult.error}`);
      }
      
      // 9. Post-Sim Gate（硬校验）
      if (this.config.enableValidation) {
        console.log('🔒 第9步: Post-Sim Gate验证...');
        const postSimStartTime = performance.now();
        
        const resultValidator = new ResultValidator();
        result.validation.postSimGate = resultValidator.acceptance(trace, contract);
        
        result.statistics.validationTime += performance.now() - postSimStartTime;
        
        if (!result.validation.postSimGate.success) {
          result.errors.push(...result.validation.postSimGate.errors);
          result.warnings.push(...result.validation.postSimGate.warnings);
          
          console.log(`❌ Post-Sim Gate失败 (评分: ${result.validation.postSimGate.score.toFixed(2)})`);
          console.log('⚠️ 视频已生成，但质量可能不符合要求');
        } else {
          console.log(`✅ Post-Sim Gate通过 (评分: ${result.validation.postSimGate.score.toFixed(2)})`);
        }
      }
      
      // 10. 清理临时文件
      this.cleanupTempFiles();
      
      result.success = true;
      result.statistics.totalTime = performance.now() - startTime;
      
      console.log('🎉 流水线执行完成！');
      console.log(`⏱️ 总耗时: ${result.statistics.totalTime.toFixed(2)}ms`);
      console.log(`📊 时间分布: 仿真${result.statistics.simulationTime.toFixed(0)}ms, 渲染${result.statistics.renderingTime.toFixed(0)}ms, 编码${result.statistics.encodingTime.toFixed(0)}ms`);
      
      return result;
      
    } catch (error) {
      result.errors.push(`流水线执行失败: ${error.message}`);
      result.statistics.totalTime = performance.now() - startTime;
      
      console.error('❌ 流水线执行失败:', error);
      
      // 清理临时文件
      this.cleanupTempFiles();
      
      return result;
    }
  }

  /**
   * 确保目录存在
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.config.tempDir)) {
      fs.mkdirSync(this.config.tempDir, { recursive: true });
    }
  }

  /**
   * 清理临时文件
   */
  private cleanupTempFiles(): void {
    try {
      if (fs.existsSync(this.config.tempDir)) {
        const files = fs.readdirSync(this.config.tempDir);
        for (const file of files) {
          if (file.startsWith('frame_') && file.endsWith('.png')) {
            fs.unlinkSync(path.join(this.config.tempDir, file));
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ 清理临时文件失败:', error.message);
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): PipelineConfig {
    return { ...this.config };
  }
}

/**
 * 便捷流水线执行函数
 */
export async function runPipeline(
  parsedQuestion: any,
  tEnd: number,
  outPath: string,
  config?: Partial<PipelineConfig>
): Promise<PipelineResult> {
  const pipeline = new Pipeline(config);
  const filename = path.basename(outPath);
  const outputDir = path.dirname(outPath);
  
  pipeline.updateConfig({ outputDir: outputDir });
  
  return await pipeline.runPipeline(parsedQuestion, filename);
}

/**
 * 默认流水线实例
 */
export const defaultPipeline = new Pipeline();
