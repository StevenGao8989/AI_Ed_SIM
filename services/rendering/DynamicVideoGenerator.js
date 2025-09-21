"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicVideoGenerator = void 0;
const DynamicPhysicsRenderer_1 = require("/Users/gaobingsong/Documents/AI_Ed_SIM/services/rendering/DynamicPhysicsRenderer");
// 动态视频生成器
class DynamicVideoGenerator {
    constructor(ffmpegPath) {
        this.renderer = new DynamicPhysicsRenderer_1.DynamicPhysicsRenderer();
        this.ffmpegPath = ffmpegPath || 'ffmpeg';
        this.ffmpegAvailable = false;
        this.checkFFmpegAvailability();
    }
    /**
     * 检查 FFmpeg 可用性
     */
    async checkFFmpegAvailability() {
        try {
            const { spawn } = require('child_process');
            return new Promise((resolve) => {
                const ffmpeg = spawn(this.ffmpegPath, ['-version'], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                ffmpeg.on('close', (code) => {
                    this.ffmpegAvailable = code === 0;
                    if (this.ffmpegAvailable) {
                        console.log('✅ FFmpeg is available');
                    }
                    else {
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
        }
        catch (error) {
            this.ffmpegAvailable = false;
            console.warn('⚠️ FFmpeg check failed:', error);
        }
    }
    /**
     * 生成视频
     */
    async generateVideo(simulationResult, ir, config) {
        const startTime = Date.now();
        const result = {
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
        }
        catch (error) {
            result.errors.push(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.success = false;
        }
        result.generationTime = Date.now() - startTime;
        return result;
    }
    /**
     * 分析物理类型
     */
    analyzePhysicsType(ir) {
        const modules = ir.system?.modules || [];
        const moduleTypes = modules.map(m => m.type);
        if (moduleTypes.includes('kinematics') && moduleTypes.includes('collision')) {
            return 'complex_kinematics';
        }
        else if (moduleTypes.includes('oscillation')) {
            return 'oscillatory_system';
        }
        else if (moduleTypes.includes('wave')) {
            return 'wave_system';
        }
        else if (moduleTypes.includes('electromagnetic')) {
            return 'electromagnetic_system';
        }
        else if (moduleTypes.includes('thermodynamics')) {
            return 'thermodynamic_system';
        }
        else if (moduleTypes.includes('fluid')) {
            return 'fluid_system';
        }
        else if (moduleTypes.includes('quantum')) {
            return 'quantum_system';
        }
        else if (moduleTypes.includes('relativistic')) {
            return 'relativistic_system';
        }
        else {
            return 'general_physics';
        }
    }
    /**
     * 根据物理类型优化配置
     */
    optimizeConfigForPhysicsType(config, physicsType) {
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
    async renderFrames(simulationResult, ir, config) {
        const renderConfig = {
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
    async encodeVideo(renderResult, config) {
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
            exec(ffmpegCommand, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        success: false,
                        errors: [`FFmpeg encoding failed: ${error.message}`]
                    });
                }
                else {
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
    buildFFmpegCommand(renderResult, config) {
        const physicsType = this.analyzePhysicsType({});
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
                command += ` -filter:v "setpts=${1 / config.effects.slowMotion}*PTS"`;
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
    getFilterCommand(filter) {
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
    async postProcess(config) {
        console.log('✨ Applying post-processing effects...');
        // 根据物理类型应用后处理
        const physicsType = this.analyzePhysicsType({});
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
    async getFileInfo(filePath) {
        const fs = require('fs');
        try {
            const stats = fs.statSync(filePath);
            return {
                size: stats.size,
                duration: 0 // 需要FFprobe获取实际时长
            };
        }
        catch (error) {
            return { size: 0, duration: 0 };
        }
    }
    /**
     * 计算压缩比
     */
    calculateCompressionRatio(renderResult, fileInfo) {
        const uncompressedSize = renderResult.frameCount * renderResult.resolution.width * renderResult.resolution.height * 3; // RGB
        return uncompressedSize / fileInfo.size;
    }
    // 辅助方法 - 根据物理类型获取配置
    getBackgroundColorForPhysicsType(physicsType) {
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
    getCameraModeForPhysicsType(physicsType) {
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
    shouldEnableParticles(physicsType) {
        return ['wave_system', 'electromagnetic_system', 'quantum_system'].includes(physicsType);
    }
    shouldEnableTrails(physicsType) {
        return ['complex_kinematics', 'oscillatory_system', 'electromagnetic_system'].includes(physicsType);
    }
    shouldEnableForces(physicsType) {
        return ['electromagnetic_system', 'complex_kinematics'].includes(physicsType);
    }
    shouldEnableEnergy(physicsType) {
        return ['oscillatory_system', 'wave_system', 'quantum_system'].includes(physicsType);
    }
    shouldEnableGrid(physicsType) {
        return ['electromagnetic_system', 'wave_system'].includes(physicsType);
    }
    // 后处理方法
    async applyElectromagneticPostProcessing(config) {
        console.log('⚡ Applying electromagnetic post-processing...');
    }
    async applyWavePostProcessing(config) {
        console.log('🌊 Applying wave post-processing...');
    }
    async applyQuantumPostProcessing(config) {
        console.log('🔬 Applying quantum post-processing...');
    }
    /**
     * 获取推荐配置
     */
    getRecommendedConfig(physicsType, quality = 'medium') {
        const baseConfig = {
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
    async generatePreview(simulationResult, ir, config = {}) {
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
    getSupportedFormats() {
        return ['mp4', 'webm', 'gif', 'avi'];
    }
    /**
     * 清理资源
     */
    async cleanup() {
        console.log('🧹 Cleaning up video generation resources...');
        // 清理临时文件
    }
}
exports.DynamicVideoGenerator = DynamicVideoGenerator;
