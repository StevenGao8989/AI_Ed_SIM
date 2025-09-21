const { CanvasPhysicsAnimationGenerator } = require('./CanvasPhysicsAnimationGenerator');

// 测试帧生成
async function testFrameGeneration() {
  console.log('🧪 测试帧生成...');
  
  const generator = new CanvasPhysicsAnimationGenerator();
  
  // 创建模拟的仿真数据
  const mockSimulationResult = {
    timeSeries: [
      // 自由落体阶段
      {
        time: 0.5,
        objects: {
          object1: {
            position: { x: 0, y: 3.75 },
            velocity: { x: 0, y: -4.9 },
            acceleration: { x: 0, y: -9.8 },
            mass: 2,
            radius: 0.1,
            onGround: false,
            onIncline: false,
            phase: 'free_fall'
          }
        }
      },
      // 碰撞阶段
      {
        time: 1.05,
        objects: {
          object1: {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 9.8 },
            acceleration: { x: 0, y: 98 },
            mass: 2,
            radius: 0.1,
            onGround: true,
            onIncline: false,
            phase: 'elastic_collision'
          }
        }
      },
      // 斜面滑动阶段
      {
        time: 2.0,
        objects: {
          object1: {
            position: { x: 1.5, y: 0 }, // 沿斜面1.5米
            velocity: { x: 2.5, y: 1.4 },
            acceleration: { x: -2.1, y: -1.2 },
            mass: 2,
            radius: 0.1,
            onGround: false,
            onIncline: true,
            phase: 'inclined_plane'
          }
        }
      }
    ],
    events: [
      { type: 'collision', time: 1.0, description: '物体落地碰撞' },
      { type: 'incline_start', time: 1.2, description: '开始斜面滑动' }
    ]
  };
  
  const mockIR = {
    system: {
      parameters: [
        { symbol: 'm', value: 2, unit: 'kg' },
        { symbol: 'h', value: 5, unit: 'm' },
        { symbol: 'theta', value: 30, unit: 'deg' },
        { symbol: 'mu', value: 0.2, unit: 'dimensionless' }
      ]
    }
  };
  
  const config = {
    width: 800,
    height: 600,
    fps: 10,
    duration: 3
  };
  
  try {
    // 生成几个关键帧
    const testTimes = [0.5, 1.05, 2.0];
    
    for (let i = 0; i < testTimes.length; i++) {
      const time = testTimes[i];
      const frameData = generator.generateFrameData(time, mockSimulationResult, config);
      const outputPath = `test_frame_${i + 1}.png`;
      
      await generator.generateCanvasFrame(frameData, config, outputPath);
      console.log(`✅ 生成测试帧 ${i + 1}: ${outputPath}`);
      console.log(`   时间: ${time}s, 阶段: ${frameData.object.phase}`);
      console.log(`   小球位置: (${frameData.object.position.x.toFixed(1)}, ${frameData.object.position.y.toFixed(1)})`);
      console.log(`   斜面角度: ${(frameData.environment.incline.angle * 180 / Math.PI).toFixed(1)}°`);
    }
    
  } catch (error) {
    console.error('❌ 帧生成测试失败:', error);
  }
}

testFrameGeneration();
