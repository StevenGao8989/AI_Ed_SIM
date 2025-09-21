// types/physics.ts
// Physics Contract 类型定义

/**
 * 物理合同：定义物理世界的几何、物性、约束和验收标准
 */
export type PhysicsContract = {
  world: {
    coord: "xy_y_up" | "xy_y_down";
    gravity: [number, number];
    constants?: Record<string, number>;
  };
  surfaces: Array<{
    id: string;
    type: "plane";
    point: [number, number];
    normal: [number, number];
    mu_s?: number;
    mu_k?: number;
    restitution?: number;
  }>;
  bodies: Array<{
    id: string;
    shape: "box" | "circle" | "point";
    size?: number[];
    mass: number;
    init: {
      x: number;
      y: number;
      vx: number;
      vy: number;
    };
    contacts?: string[];
  }>;
  phases?: Array<{
    id?: string;
    name?: string;
    description?: string;
    startCondition?: any;
    endCondition?: any;
    dominantForces?: string[];
  }>;
  expected_events?: Array<{
    name: string;
    type: "contact" | "separation" | "velocity_zero" | "position_extreme";
    body?: string;
    surface?: string;
    timeWindow?: [number, number];
    condition?: any;
  }>;
  acceptance_tests?: Assertion[];
  tolerances: {
    r2_min?: number;
    rel_err?: number;
    event_time_sec?: number;
    energy_drift_rel?: number;
    v_eps?: number;
  };
};

/**
 * 验收测试断言类型
 */
export type Assertion =
  | {
      kind: "event_time";
      name: string;
      of: string;
      window?: [number, number];
    }
  | {
      kind: "shape";
      name: string;
      of: string;
      pattern: "single_peak" | "parabola" | "monotonic";
      tol?: number;
    }
  | {
      kind: "conservation";
      name: string;
      quantity: "energy" | "momentum" | "angular_momentum";
      drift?: number;
    }
  | {
      kind: "ratio";
      name: string;
      expr: string;
      tol?: number;
    };

/**
 * 解析输出结构
 */
export interface ParseOutput {
  dsl: any; // PhysicsDSL
  contract: PhysicsContract;
  confidence: number; // 0..1
  abstain?: boolean;
  metadata?: {
    source: string;
    timestamp: number;
    processingTime: number;
    warnings: string[];
  };
}

/**
 * 验证报告
 */
export interface ValidationReport {
  success: boolean;
  score: number;
  errors: ValidationError[];
  warnings: string[];
  details: {
    units: boolean;
    geometry: boolean;
    physics: boolean;
    feasibility: boolean;
  };
}

/**
 * 验证错误
 */
export interface ValidationError {
  code: string;
  message: string;
  severity: "error" | "warning" | "info";
  location?: string;
  suggestion?: string;
}

/**
 * Pre-Sim Gate 错误
 */
export class PreSimGateError extends Error {
  public readonly code: string;
  public readonly details: ValidationReport;

  constructor(message: string, code: string, details: ValidationReport) {
    super(message);
    this.name = 'PreSimGateError';
    this.code = code;
    this.details = details;
  }
}

/**
 * VCS 评分结构
 */
export type VCS = {
  intent: number;      // 意图符合度 (0-1)
  physics: number;     // 物理正确性 (0-1)
  numeric: number;     // 数值精度 (0-1)
  render: number;      // 渲染一致性 (0-1)
  total: number;       // 总分 (0-1)
  details?: {
    intentTests: any[];
    physicsChecks: any[];
    numericMetrics: any[];
    renderConsistency: any[];
  };
};

/**
 * 仿真状态
 */
export interface SimState {
  time: number;
  bodies: Array<{
    id: string;
    position: [number, number];
    velocity: [number, number];
    acceleration: [number, number];
    mass: number;
    forces: [number, number];
    contacts: string[];
  }>;
  energy: {
    kinetic: number;
    potential: number;
    total: number;
  };
  events: Array<{
    time: number;
    type: string;
    body?: string;
    surface?: string;
    data?: any;
  }>;
}

/**
 * 仿真轨迹
 */
export interface SimTrace {
  states: SimState[];
  events: Array<{
    time: number;
    type: string;
    body?: string;
    surface?: string;
    impulse?: [number, number];
    data?: any;
  }>;
  metadata: {
    integrator: string;
    totalSteps: number;
    adaptiveSteps: number;
    eventCount: number;
    computationTime: number;
  };
}

/**
 * 渲染输出
 */
export interface RenderOut {
  frames: Array<{
    time: number;
    objects: Array<{
      id: string;
      screenPos: [number, number];
      size: number;
      color: string;
      vectors?: Array<{
        type: "velocity" | "acceleration" | "force";
        start: [number, number];
        end: [number, number];
        color: string;
      }>;
    }>;
    environment: {
      surfaces: Array<{
        id: string;
        screenPoints: [number, number][];
        color: string;
      }>;
    };
    annotations: Array<{
      text: string;
      position: [number, number];
      color: string;
    }>;
  }>;
  metadata: {
    totalFrames: number;
    frameRate: number;
    resolution: [number, number];
    coordinateTransform: {
      scale: number;
      offsetX: number;
      offsetY: number;
    };
  };
}

/**
 * 用户问题输入
 */
export interface UserProblem {
  type: "text" | "image";
  content: string;
  language?: string;
  metadata?: any;
}
