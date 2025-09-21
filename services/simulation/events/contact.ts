// services/simulation/events/contact.ts
// 接触冲量处理：恢复系数、静/动摩擦、速度阈值判据

/**
 * 接触点信息
 */
export interface ContactPoint {
  p: [number, number];      // 接触点位置
  normal: [number, number]; // 法向量（单位向量）
  penetration: number;      // 穿透深度
}

/**
 * 材料属性
 */
export interface ContactMaterial {
  restitution: number;  // 恢复系数 e ∈ [0,1]
  mu_s: number;        // 静摩擦系数
  mu_k: number;        // 动摩擦系数
}

/**
 * 刚体状态
 */
export interface RigidBodyState {
  id: string;
  mass: number;
  inertia: number;
  position: [number, number];
  velocity: [number, number];
  angle: number;
  angularVelocity: number;
}

/**
 * 容差配置
 */
export interface ContactTolerances {
  v_eps: number;           // 速度阈值（静/动摩擦判据）
  penetration_tol: number; // 穿透容差
  impulse_min: number;     // 最小冲量阈值
}

/**
 * 冲量结果
 */
export interface ImpulseResult {
  normal: [number, number];    // 法向冲量
  tangent: [number, number];   // 切向冲量（摩擦）
  total: [number, number];     // 总冲量
  type: 'static' | 'kinetic' | 'rolling'; // 摩擦类型
  energy: {
    before: number;
    after: number;
    dissipated: number;      // 耗散能量
  };
}

/**
 * 接触冲量解析器
 */
export class ContactImpulseResolver {
  
  /**
   * 解析接触冲量（核心算法）
   */
  static resolveContactImpulse(
    body: RigidBodyState,
    contact: ContactPoint,
    material: ContactMaterial,
    tolerances: ContactTolerances
  ): ImpulseResult {
    const { p, normal } = contact;
    const { restitution, mu_s, mu_k } = material;
    const { v_eps } = tolerances;
    
    // 1. 计算接触点相对速度
    const vRel = this.calculateRelativeVelocity(body, p);
    const vn = this.dot(normal, vRel);  // 法向相对速度
    const tangent = this.getTangent(normal);
    const vt = this.dot(tangent, vRel); // 切向相对速度
    
    // 2. 计算有效质量
    const effMassNormal = this.calculateEffectiveMass(body, p, normal);
    const effMassTangent = this.calculateEffectiveMass(body, p, tangent);
    
    // 3. 法向冲量（恢复系数）
    const jn = -(1 + restitution) * vn / effMassNormal;
    
    // 4. 摩擦冲量（静/动判据）
    let jt = 0;
    let frictionType: 'static' | 'kinetic' | 'rolling' = 'static';
    
    const jtMax = mu_s * Math.abs(jn); // 最大静摩擦冲量
    
    if (Math.abs(vt) < v_eps) {
      // 静摩擦：尝试完全阻止切向运动
      const jtStatic = -effMassTangent * vt;
      
      if (Math.abs(jtStatic) <= jtMax) {
        jt = jtStatic;
        frictionType = 'static';
      } else {
        jt = -Math.sign(vt) * mu_k * Math.abs(jn);
        frictionType = 'kinetic';
      }
    } else {
      // 动摩擦
      jt = -Math.sign(vt) * mu_k * Math.abs(jn);
      frictionType = 'kinetic';
    }
    
    // 5. 计算总冲量
    const normalImpulse: [number, number] = [normal[0] * jn, normal[1] * jn];
    const tangentImpulse: [number, number] = [tangent[0] * jt, tangent[1] * jt];
    const totalImpulse: [number, number] = [
      normalImpulse[0] + tangentImpulse[0],
      normalImpulse[1] + tangentImpulse[1]
    ];
    
    // 6. 计算能量变化
    const energyBefore = this.calculateKineticEnergy(body);
    const bodyAfter = this.applyImpulse(body, p, totalImpulse);
    const energyAfter = this.calculateKineticEnergy(bodyAfter);
    const energyDissipated = energyBefore - energyAfter;
    
    return {
      normal: normalImpulse,
      tangent: tangentImpulse,
      total: totalImpulse,
      type: frictionType,
      energy: {
        before: energyBefore,
        after: energyAfter,
        dissipated: energyDissipated
      }
    };
  }

  /**
   * 计算接触点相对速度
   */
  private static calculateRelativeVelocity(
    body: RigidBodyState,
    contactPoint: [number, number]
  ): [number, number] {
    const [px, py] = contactPoint;
    const [bx, by] = body.position;
    const [vx, vy] = body.velocity;
    const omega = body.angularVelocity;
    
    // r = p - body.center
    const rx = px - bx;
    const ry = py - by;
    
    // v = v_center + ω × r
    const vRelX = vx - omega * ry;
    const vRelY = vy + omega * rx;
    
    return [vRelX, vRelY];
  }

  /**
   * 计算有效质量
   */
  private static calculateEffectiveMass(
    body: RigidBodyState,
    contactPoint: [number, number],
    direction: [number, number]
  ): number {
    const [px, py] = contactPoint;
    const [bx, by] = body.position;
    const [nx, ny] = direction;
    
    // r = p - body.center
    const rx = px - bx;
    const ry = py - by;
    
    // 有效质量公式：1/m_eff = 1/m + (r × n)²/I
    const crossProduct = rx * ny - ry * nx;
    const invEffMass = 1 / body.mass + (crossProduct * crossProduct) / body.inertia;
    
    return 1 / invEffMass;
  }

  /**
   * 应用冲量到刚体
   */
  private static applyImpulse(
    body: RigidBodyState,
    contactPoint: [number, number],
    impulse: [number, number]
  ): RigidBodyState {
    const [px, py] = contactPoint;
    const [bx, by] = body.position;
    const [jx, jy] = impulse;
    
    // r = p - body.center
    const rx = px - bx;
    const ry = py - by;
    
    // 线性冲量：Δv = J/m
    const deltaVx = jx / body.mass;
    const deltaVy = jy / body.mass;
    
    // 角冲量：Δω = (r × J)/I
    const deltaOmega = (rx * jy - ry * jx) / body.inertia;
    
    return {
      ...body,
      velocity: [body.velocity[0] + deltaVx, body.velocity[1] + deltaVy],
      angularVelocity: body.angularVelocity + deltaOmega
    };
  }

  /**
   * 计算动能
   */
  private static calculateKineticEnergy(body: RigidBodyState): number {
    const [vx, vy] = body.velocity;
    const omega = body.angularVelocity;
    
    const translational = 0.5 * body.mass * (vx * vx + vy * vy);
    const rotational = 0.5 * body.inertia * omega * omega;
    
    return translational + rotational;
  }

  /**
   * 向量点积
   */
  private static dot(a: [number, number], b: [number, number]): number {
    return a[0] * b[0] + a[1] * b[1];
  }

  /**
   * 获取切向量
   */
  private static getTangent(normal: [number, number]): [number, number] {
    return [-normal[1], normal[0]];
  }

  /**
   * 验证冲量合理性
   */
  static validateImpulse(
    impulse: ImpulseResult,
    material: ContactMaterial,
    tolerances: ContactTolerances
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // 检查能量守恒（允许耗散）
    if (impulse.energy.dissipated < 0) {
      issues.push('能量耗散为负值，违反热力学第二定律');
    }
    
    // 检查摩擦锥约束
    const normalMagnitude = Math.sqrt(impulse.normal[0]**2 + impulse.normal[1]**2);
    const tangentMagnitude = Math.sqrt(impulse.tangent[0]**2 + impulse.tangent[1]**2);
    
    if (tangentMagnitude > material.mu_s * normalMagnitude + 1e-6) {
      issues.push('摩擦冲量超出摩擦锥约束');
    }
    
    // 检查冲量大小
    const totalMagnitude = Math.sqrt(impulse.total[0]**2 + impulse.total[1]**2);
    if (totalMagnitude < tolerances.impulse_min) {
      issues.push('冲量过小，可能是数值误差');
    }
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
  }
}

/**
 * 默认接触解析器
 */
export const contactResolver = ContactImpulseResolver;
