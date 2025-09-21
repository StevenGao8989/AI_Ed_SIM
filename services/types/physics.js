"use strict";
// types/physics.ts
// Physics Contract 类型定义
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreSimGateError = void 0;
/**
 * Pre-Sim Gate 错误
 */
class PreSimGateError extends Error {
    constructor(message, code, details) {
        super(message);
        this.name = 'PreSimGateError';
        this.code = code;
        this.details = details;
    }
}
exports.PreSimGateError = PreSimGateError;
