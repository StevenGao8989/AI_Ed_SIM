/**
 * 仿真模块入口
 * 
 * 导出主要的仿真引擎类和函数
 */

// SimulationEngine removed - using MatterSimulationEngine instead

export { 
  MatterSimulationEngine, 
  createMatterSimulationEngine,
  type MatterSimulationResult 
} from './MatterSimulationEngine';

// 默认导出Matter.js仿真引擎工厂函数
export { createMatterSimulationEngine as default } from './MatterSimulationEngine';
