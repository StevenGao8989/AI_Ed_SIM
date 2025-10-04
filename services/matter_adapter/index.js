"use strict";
/**
 * Matter.js 适配器模块入口
 *
 * 导出主要的适配器类和函数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptPhysicsContract = exports.createPhysicsContractAdapter = exports.PhysicsContractAdapter = void 0;
var Adapter_1 = require("./Adapter");
Object.defineProperty(exports, "PhysicsContractAdapter", { enumerable: true, get: function () { return Adapter_1.PhysicsContractAdapter; } });
Object.defineProperty(exports, "createPhysicsContractAdapter", { enumerable: true, get: function () { return Adapter_1.createPhysicsContractAdapter; } });
Object.defineProperty(exports, "adaptPhysicsContract", { enumerable: true, get: function () { return Adapter_1.adaptPhysicsContract; } });
// 默认导出适配器工厂函数
const Adapter_2 = require("./Adapter");
exports.default = Adapter_2.createPhysicsContractAdapter;
