"use strict";
/**
 * 动态物理渲染器 - 能够根据任意物理题目动态生成3D场景
 *
 * 功能：
 * 1. 动态分析物理类型
 * 2. 自动生成3D场景
 * 3. 智能相机控制
 * 4. 自适应光照
 * 5. 动态特效
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicPhysicsRenderer = void 0;
// 动态物理渲染器
class DynamicPhysicsRenderer {
    constructor() {
        this.objects = new Map();
        this.lights = [];
        this.effects = [];
        this.initializeRenderer();
    }
    /**
     * 渲染仿真结果
     */
    async renderSimulation(simulationResult, ir, config) {
        const startTime = Date.now();
        const result = {
            success: false,
            frames: [],
            frameCount: 0,
            duration: 0,
            resolution: { width: config.width, height: config.height },
            errors: [],
            warnings: []
        };
        try {
            console.log('🎨 Starting dynamic physics rendering...');
            console.log(`📊 Physics type: ${this.analyzePhysicsType(ir)}`);
            console.log(`📐 Resolution: ${config.width}x${config.height}`);
            console.log(`🎬 Duration: ${config.duration}s @ ${config.fps}fps`);
            // 1. 分析物理类型
            const physicsType = this.analyzePhysicsType(ir);
            // 2. 设置场景
            this.setupScene(config, physicsType);
            // 3. 创建3D对象
            this.createObjects(ir, physicsType);
            // 4. 设置光照
            this.setupLighting(config, physicsType);
            // 5. 设置特效
            this.setupEffects(config, physicsType);
            // 6. 渲染帧序列
            const totalFrames = Math.floor(config.duration * config.fps);
            const timeStep = config.duration / totalFrames;
            for (let frame = 0; frame < totalFrames; frame++) {
                const time = frame * timeStep;
                // 更新对象状态
                this.updateObjects(simulationResult, time, physicsType);
                // 更新相机
                this.updateCamera(time, config, physicsType);
                // 更新特效
                this.updateEffects(time, physicsType);
                // 渲染帧
                const frameData = this.renderFrame();
                result.frames.push(frameData);
                if (frame % Math.floor(totalFrames / 10) === 0) {
                    console.log(`📸 Rendered ${frame + 1}/${totalFrames} frames`);
                }
            }
            result.frameCount = totalFrames;
            result.duration = Date.now() - startTime;
            result.success = true;
            console.log('✅ Rendering completed successfully!');
            console.log(`📸 Frames: ${result.frameCount}`);
            console.log(`⏱️  Time: ${result.duration}ms`);
        }
        catch (error) {
            result.errors.push(`Rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.success = false;
        }
        return result;
    }
    /**
     * 分析物理类型
     */
    analyzePhysicsType(ir) {
        const modules = ir.system?.modules || [];
        const moduleTypes = modules.map(m => m.type);
        if (moduleTypes.includes('kinematics') && moduleTypes.includes('dynamics')) {
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
        else if (moduleTypes.includes('thermal')) {
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
     * 初始化渲染器
     */
    initializeRenderer() {
        // 这里应该初始化Three.js渲染器
        // 由于这是TypeScript接口，实际实现需要Three.js库
        console.log('🎨 Initializing Three.js renderer...');
    }
    /**
     * 设置场景
     */
    setupScene(config, physicsType) {
        console.log(`🏗️  Setting up scene for ${physicsType}...`);
        // 根据物理类型设置不同的场景
        switch (physicsType) {
            case 'complex_kinematics':
                this.setupComplexKinematicsScene(config);
                break;
            case 'oscillatory_system':
                this.setupOscillatorySystemScene(config);
                break;
            case 'wave_system':
                this.setupWaveSystemScene(config);
                break;
            case 'electromagnetic_system':
                this.setupElectromagneticSystemScene(config);
                break;
            default:
                this.setupGeneralPhysicsScene(config);
                break;
        }
    }
    /**
     * 设置复杂运动学场景
     */
    setupComplexKinematicsScene(config) {
        // 创建地面
        const ground = this.createGround(20, 20, '#666666');
        this.scene.add(ground);
        // 创建斜面
        const incline = this.createIncline(10, 5, 30, '#888888');
        this.scene.add(incline);
        // 设置相机位置
        this.camera.position.set(15, 10, 15);
        this.camera.lookAt(0, 0, 0);
    }
    /**
     * 设置振荡系统场景
     */
    setupOscillatorySystemScene(config) {
        // 创建弹簧
        const spring = this.createSpring(0, 0, 0, 0, -2, 0, '#FFD700');
        this.scene.add(spring);
        // 创建支撑点
        const support = this.createBox(0, 1, 0, 2, 0.2, 2, '#8B4513');
        this.scene.add(support);
        // 设置相机位置
        this.camera.position.set(8, 5, 8);
        this.camera.lookAt(0, 0, 0);
    }
    /**
     * 设置波动系统场景
     */
    setupWaveSystemScene(config) {
        // 创建波动表面
        const waveSurface = this.createWaveSurface(20, 20, '#0066CC');
        this.scene.add(waveSurface);
        // 设置相机位置
        this.camera.position.set(0, 15, 15);
        this.camera.lookAt(0, 0, 0);
    }
    /**
     * 设置电磁系统场景
     */
    setupElectromagneticSystemScene(config) {
        // 创建电场线
        const fieldLines = this.createFieldLines();
        this.scene.add(fieldLines);
        // 设置相机位置
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);
    }
    /**
     * 设置通用物理场景
     */
    setupGeneralPhysicsScene(config) {
        // 创建简单的地面
        const ground = this.createGround(10, 10, '#666666');
        this.scene.add(ground);
        // 设置相机位置
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
    }
    /**
     * 创建3D对象
     */
    createObjects(ir, physicsType) {
        console.log(`🎯 Creating objects for ${physicsType}...`);
        if (ir.system?.objects) {
            for (const obj of ir.system.objects) {
                const sceneObject = this.createObjectFromIR(obj, physicsType);
                this.scene.add(sceneObject);
                this.objects.set(obj.id, sceneObject);
            }
        }
    }
    /**
     * 从IR创建3D对象
     */
    createObjectFromIR(obj, physicsType) {
        const objectType = this.determineObjectType(obj, physicsType);
        switch (objectType) {
            case 'sphere':
                return this.createSphere(obj.initialPosition?.x || 0, obj.initialPosition?.y || 0, obj.initialPosition?.z || 0, obj.radius || 0.5, obj.color || '#FF0000');
            case 'box':
                return this.createBox(obj.initialPosition?.x || 0, obj.initialPosition?.y || 0, obj.initialPosition?.z || 0, obj.width || 1, obj.height || 1, obj.depth || 1, obj.color || '#FF0000');
            case 'cylinder':
                return this.createCylinder(obj.initialPosition?.x || 0, obj.initialPosition?.y || 0, obj.initialPosition?.z || 0, obj.radius || 0.5, obj.height || 1, obj.color || '#FF0000');
            default:
                return this.createSphere(obj.initialPosition?.x || 0, obj.initialPosition?.y || 0, obj.initialPosition?.z || 0, 0.5, '#FF0000');
        }
    }
    /**
     * 确定对象类型
     */
    determineObjectType(obj, physicsType) {
        // 根据物理类型和对象属性确定3D对象类型
        if (obj.type) {
            return obj.type;
        }
        switch (physicsType) {
            case 'complex_kinematics':
                return 'sphere'; // 通常是小球
            case 'oscillatory_system':
                return 'box'; // 通常是方块
            case 'wave_system':
                return 'sphere'; // 通常是粒子
            case 'electromagnetic_system':
                return 'sphere'; // 通常是带电粒子
            default:
                return 'sphere';
        }
    }
    /**
     * 设置光照
     */
    setupLighting(config, physicsType) {
        console.log(`💡 Setting up lighting for ${physicsType}...`);
        // 环境光
        const ambientLight = this.createAmbientLight(config.lighting.ambient, config.lighting.color);
        this.scene.add(ambientLight);
        // 方向光
        const directionalLight = this.createDirectionalLight(config.lighting.directional, config.lighting.color, { x: 10, y: 10, z: 5 });
        this.scene.add(directionalLight);
        // 根据物理类型添加特殊光照
        switch (physicsType) {
            case 'electromagnetic_system':
                this.addElectromagneticLighting();
                break;
            case 'wave_system':
                this.addWaveLighting();
                break;
        }
    }
    /**
     * 设置特效
     */
    setupEffects(config, physicsType) {
        console.log(`✨ Setting up effects for ${physicsType}...`);
        if (config.effects.particles) {
            this.createParticleSystem(physicsType);
        }
        if (config.effects.trails) {
            this.createTrailSystem(physicsType);
        }
        if (config.effects.forces) {
            this.createForceVisualization(physicsType);
        }
        if (config.effects.energy) {
            this.createEnergyVisualization(physicsType);
        }
        if (config.effects.grid) {
            this.createGrid(physicsType);
        }
    }
    /**
     * 更新对象状态
     */
    updateObjects(simulationResult, time, physicsType) {
        // 找到对应时间的仿真数据
        const timeData = this.findTimeData(simulationResult, time);
        if (timeData) {
            for (const objectId in timeData.objects) {
                const obj = timeData.objects[objectId];
                const sceneObject = this.objects.get(objectId);
                if (sceneObject) {
                    // 更新位置
                    sceneObject.position.set(obj.position.x, obj.position.y, obj.position.z);
                    // 更新旋转
                    if (obj.rotation) {
                        sceneObject.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
                    }
                    // 根据物理类型更新特殊属性
                    this.updateObjectProperties(sceneObject, obj, physicsType);
                }
            }
        }
    }
    /**
     * 更新相机
     */
    updateCamera(time, config, physicsType) {
        switch (config.camera.mode) {
            case 'orbit':
                this.updateOrbitCamera(time, config);
                break;
            case 'follow':
                this.updateFollowCamera(time, config, physicsType);
                break;
            case 'free':
                this.updateFreeCamera(time, config);
                break;
            default:
                // 固定相机，不需要更新
                break;
        }
    }
    /**
     * 更新特效
     */
    updateEffects(time, physicsType) {
        // 更新粒子系统
        this.updateParticleSystem(time, physicsType);
        // 更新轨迹
        this.updateTrailSystem(time, physicsType);
        // 更新力可视化
        this.updateForceVisualization(time, physicsType);
        // 更新能量可视化
        this.updateEnergyVisualization(time, physicsType);
    }
    /**
     * 渲染帧
     */
    renderFrame() {
        // 渲染场景
        this.renderer.render(this.scene, this.camera);
        // 获取帧数据
        const canvas = this.renderer.domElement;
        return canvas.toDataURL('image/png');
    }
    // 辅助方法 - 创建3D对象
    createSphere(x, y, z, radius, color) {
        // Three.js SphereGeometry 和 MeshBasicMaterial
        return { type: 'sphere', position: { x, y, z }, radius, color };
    }
    createBox(x, y, z, width, height, depth, color) {
        return { type: 'box', position: { x, y, z }, width, height, depth, color };
    }
    createCylinder(x, y, z, radius, height, color) {
        return { type: 'cylinder', position: { x, y, z }, radius, height, color };
    }
    createGround(width, depth, color) {
        return { type: 'plane', width, depth, color };
    }
    createIncline(width, height, angle, color) {
        return { type: 'incline', width, height, angle, color };
    }
    createSpring(x1, y1, z1, x2, y2, z2, color) {
        return { type: 'spring', start: { x: x1, y: y1, z: z1 }, end: { x: x2, y: y2, z: z2 }, color };
    }
    createWaveSurface(width, depth, color) {
        return { type: 'waveSurface', width, depth, color };
    }
    createFieldLines() {
        return { type: 'fieldLines' };
    }
    // 辅助方法 - 创建光照
    createAmbientLight(intensity, color) {
        return { type: 'ambientLight', intensity, color };
    }
    createDirectionalLight(intensity, color, position) {
        return { type: 'directionalLight', intensity, color, position };
    }
    // 辅助方法 - 特效
    createParticleSystem(physicsType) {
        console.log(`✨ Creating particle system for ${physicsType}`);
    }
    createTrailSystem(physicsType) {
        console.log(`🌊 Creating trail system for ${physicsType}`);
    }
    createForceVisualization(physicsType) {
        console.log(`⚡ Creating force visualization for ${physicsType}`);
    }
    createEnergyVisualization(physicsType) {
        console.log(`🔋 Creating energy visualization for ${physicsType}`);
    }
    createGrid(physicsType) {
        console.log(`📐 Creating grid for ${physicsType}`);
    }
    // 辅助方法 - 更新
    findTimeData(simulationResult, time) {
        // 找到最接近指定时间的仿真数据
        let closest = null;
        let minDiff = Infinity;
        for (const data of simulationResult.timeSeries) {
            const diff = Math.abs(data.time - time);
            if (diff < minDiff) {
                minDiff = diff;
                closest = data;
            }
        }
        return closest;
    }
    updateObjectProperties(sceneObject, obj, physicsType) {
        // 根据物理类型更新对象特殊属性
        switch (physicsType) {
            case 'electromagnetic_system':
                // 更新电磁场可视化
                break;
            case 'wave_system':
                // 更新波动效果
                break;
        }
    }
    updateOrbitCamera(time, config) {
        const radius = 15;
        const angle = time * 0.1;
        this.camera.position.x = Math.cos(angle) * radius;
        this.camera.position.z = Math.sin(angle) * radius;
        this.camera.lookAt(0, 0, 0);
    }
    updateFollowCamera(time, config, physicsType) {
        // 跟随主要对象的相机
        const mainObject = this.objects.values().next().value;
        if (mainObject) {
            this.camera.position.x = mainObject.position.x + 5;
            this.camera.position.y = mainObject.position.y + 5;
            this.camera.position.z = mainObject.position.z + 5;
            this.camera.lookAt(mainObject.position.x, mainObject.position.y, mainObject.position.z);
        }
    }
    updateFreeCamera(time, config) {
        // 自由相机移动
        this.camera.position.x = Math.sin(time * 0.05) * 10;
        this.camera.position.y = 5 + Math.sin(time * 0.1) * 2;
        this.camera.position.z = Math.cos(time * 0.05) * 10;
    }
    updateParticleSystem(time, physicsType) {
        // 更新粒子系统
    }
    updateTrailSystem(time, physicsType) {
        // 更新轨迹系统
    }
    updateForceVisualization(time, physicsType) {
        // 更新力可视化
    }
    updateEnergyVisualization(time, physicsType) {
        // 更新能量可视化
    }
    addElectromagneticLighting() {
        // 添加电磁场特殊光照
    }
    addWaveLighting() {
        // 添加波动特殊光照
    }
}
exports.DynamicPhysicsRenderer = DynamicPhysicsRenderer;
