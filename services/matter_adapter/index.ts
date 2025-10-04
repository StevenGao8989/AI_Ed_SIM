/**
 * Matter.js 适配器模块入口
 * 
 * 导出主要的适配器类和函数
 */

export { 
  PhysicsContractAdapter, 
  createPhysicsContractAdapter, 
  adaptPhysicsContract,
  type PhysicsContract,
  type SimulationResult 
} from './Adapter';

// 默认导出适配器工厂函数
import { createPhysicsContractAdapter } from './Adapter';
export default createPhysicsContractAdapter;