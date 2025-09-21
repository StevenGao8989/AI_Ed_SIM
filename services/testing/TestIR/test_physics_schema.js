/**
 * 测试 PhysicsSchema.json 的有效性
 * 
 * 测试流程：
 * 1. 加载 PhysicsSchema.json
 * 2. 加载现有的 IR 文件
 * 3. 使用 JSON Schema 验证 IR 文件
 * 4. 生成验证报告
 */

const fs = require('fs');
const path = require('path');

// 简单的 JSON Schema 验证器（简化版）
class SimpleSchemaValidator {
  constructor(schema) {
    this.schema = schema;
  }

  validate(data) {
    const errors = [];
    const warnings = [];
    
    try {
      this.validateObject(data, this.schema, '', errors, warnings);
    } catch (error) {
      errors.push(`Schema validation error: ${error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateObject(data, schema, path, errors, warnings) {
    if (schema.type === 'object') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push(`Expected object at ${path}, got ${typeof data}`);
        return;
      }

      // 检查必需属性
      if (schema.required) {
        schema.required.forEach(prop => {
          if (!(prop in data)) {
            errors.push(`Missing required property '${prop}' at ${path}`);
          }
        });
      }

      // 验证属性
      if (schema.properties) {
        Object.keys(data).forEach(key => {
          if (schema.properties[key]) {
            this.validateObject(data[key], schema.properties[key], `${path}.${key}`, errors, warnings);
          } else if (!schema.additionalProperties) {
            warnings.push(`Unexpected property '${key}' at ${path}`);
          }
        });
      }
    } else if (schema.type === 'array') {
      if (!Array.isArray(data)) {
        errors.push(`Expected array at ${path}, got ${typeof data}`);
        return;
      }

      if (schema.minItems && data.length < schema.minItems) {
        errors.push(`Array at ${path} has ${data.length} items, minimum required is ${schema.minItems}`);
      }

      if (schema.items) {
        data.forEach((item, index) => {
          this.validateObject(item, schema.items, `${path}[${index}]`, errors, warnings);
        });
      }
    } else if (schema.type === 'string') {
      if (typeof data !== 'string') {
        errors.push(`Expected string at ${path}, got ${typeof data}`);
        return;
      }

      if (schema.minLength && data.length < schema.minLength) {
        errors.push(`String at ${path} has length ${data.length}, minimum required is ${schema.minLength}`);
      }

      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push(`String at ${path} does not match pattern ${schema.pattern}`);
        }
      }

      if (schema.enum && !schema.enum.includes(data)) {
        errors.push(`String at ${path} has value '${data}', expected one of: ${schema.enum.join(', ')}`);
      }
    } else if (schema.type === 'number') {
      if (typeof data !== 'number') {
        errors.push(`Expected number at ${path}, got ${typeof data}`);
        return;
      }

      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push(`Number at ${path} has value ${data}, minimum required is ${schema.minimum}`);
      }

      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push(`Number at ${path} has value ${data}, maximum allowed is ${schema.maximum}`);
      }
    } else if (schema.type === 'integer') {
      if (!Number.isInteger(data)) {
        errors.push(`Expected integer at ${path}, got ${typeof data}`);
        return;
      }

      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push(`Integer at ${path} has value ${data}, minimum required is ${schema.minimum}`);
      }

      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push(`Integer at ${path} has value ${data}, maximum allowed is ${schema.maximum}`);
      }
    } else if (schema.type === 'boolean') {
      if (typeof data !== 'boolean') {
        errors.push(`Expected boolean at ${path}, got ${typeof data}`);
        return;
      }
    }

    // 处理 $ref
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/', '').split('/');
      let refSchema = this.schema;
      
      for (const part of refPath) {
        if (refSchema && typeof refSchema === 'object' && part in refSchema) {
          refSchema = refSchema[part];
        } else {
          errors.push(`Invalid $ref path '${schema.$ref}' at ${path}`);
          return;
        }
      }
      
      if (refSchema && typeof refSchema === 'object') {
        this.validateObject(data, refSchema, path, errors, warnings);
      } else {
        errors.push(`Referenced schema not found for '${schema.$ref}' at ${path}`);
      }
    }
  }
}

async function testPhysicsSchema() {
  console.log('🔄 开始测试 PhysicsSchema.json...\n');

  try {
    // 1. 加载 PhysicsSchema.json
    const schemaPath = path.join(__dirname, '../../ir/PhysicsSchema.json');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema 文件不存在: ${schemaPath}`);
    }

    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    console.log('📋 加载的 Schema 信息:');
    console.log(`   📚 标题: ${schema.title}`);
    console.log(`   📝 描述: ${schema.description}`);
    console.log(`   🆔 ID: ${schema.$id}`);
    console.log(`   📊 必需属性: ${schema.required?.join(', ') || 'none'}`);
    console.log(`   🔧 定义数量: ${Object.keys(schema.definitions || {}).length}\n`);

    // 2. 加载现有的 IR 文件
    const irPath = path.join(__dirname, 'outputs/ir_physics_1758187216354_g95x0grlx.json');
    
    if (!fs.existsSync(irPath)) {
      throw new Error(`IR 文件不存在: ${irPath}`);
    }

    const irContent = fs.readFileSync(irPath, 'utf8');
    const ir = JSON.parse(irContent);
    
    console.log('📋 加载的 IR 信息:');
    console.log(`   🆔 ID: ${ir.metadata?.id || 'unknown'}`);
    console.log(`   📚 系统类型: ${ir.metadata?.system_type || 'unknown'}`);
    console.log(`   📊 模块数量: ${ir.system?.modules?.length || 0}`);
    console.log(`   ⚙️ 参数数量: ${ir.system?.parameters?.length || 0}\n`);

    // 3. 使用 JSON Schema 验证 IR 文件
    console.log('🔄 执行 Schema 验证...');
    const startTime = Date.now();
    
    const validator = new SimpleSchemaValidator(schema);
    const result = validator.validate(ir);
    
    const validationTime = Date.now() - startTime;

    // 4. 分析验证结果
    console.log('\n📊 Schema 验证结果:');
    console.log(`   ✅ 有效: ${result.valid ? '✅' : '❌'}`);
    console.log(`   ⏱️ 耗时: ${validationTime}ms`);
    console.log(`   ⚠️ 警告数量: ${result.warnings.length}`);
    console.log(`   ❌ 错误数量: ${result.errors.length}`);

    // 5. 显示详细错误和警告
    if (result.errors.length > 0) {
      console.log('\n❌ Schema 验证错误:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️ Schema 验证警告:');
      result.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    // 6. 分析 Schema 质量
    console.log('\n📈 Schema 质量分析:');
    const qualityScore = calculateSchemaQualityScore(result, schema);
    console.log(`   🎯 质量评分: ${qualityScore}/100`);
    
    if (qualityScore >= 90) {
      console.log('   🌟 优秀: Schema 质量很高，可以用于生产环境');
    } else if (qualityScore >= 70) {
      console.log('   👍 良好: Schema 质量良好，建议修复警告后使用');
    } else if (qualityScore >= 50) {
      console.log('   ⚠️ 一般: Schema 质量一般，需要修复错误和警告');
    } else {
      console.log('   ❌ 较差: Schema 质量较差，需要大量修复');
    }

    // 7. 保存验证报告
    const outputDir = path.join(__dirname, 'outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const report = {
      test_name: 'PhysicsSchema 验证测试',
      timestamp: new Date().toISOString(),
      schema: {
        title: schema.title,
        description: schema.description,
        id: schema.$id,
        required_properties: schema.required,
        definitions_count: Object.keys(schema.definitions || {}).length
      },
      input: {
        ir_file: irPath,
        ir_id: ir.metadata?.id,
        ir_system_type: ir.metadata?.system_type
      },
      validation: {
        success: result.valid,
        duration: validationTime,
        quality_score: qualityScore,
        errors: result.errors,
        warnings: result.warnings
      },
      recommendations: generateSchemaRecommendations(result, schema)
    };

    const reportPath = path.join(outputDir, `schema_validation_report.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 验证报告已保存到: ${reportPath}`);

    console.log(`\n⏱️ 总耗时: ${validationTime}ms`);
    console.log('🎉 PhysicsSchema 验证测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

/**
 * 计算 Schema 质量评分
 */
function calculateSchemaQualityScore(result, schema) {
  let score = 100;
  
  // 错误扣分：每个错误扣 15 分
  score -= result.errors.length * 15;
  
  // 警告扣分：每个警告扣 3 分
  score -= result.warnings.length * 3;
  
  // Schema 完整性加分
  if (schema.definitions && Object.keys(schema.definitions).length > 10) {
    score += 5; // 定义丰富
  }
  
  if (schema.required && schema.required.length > 5) {
    score += 5; // 必需属性完整
  }
  
  // 确保分数在 0-100 之间
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 生成改进建议
 */
function generateSchemaRecommendations(result, schema) {
  const recommendations = [];
  
  if (result.errors.length > 0) {
    recommendations.push('修复 Schema 验证错误：检查必需属性、类型匹配和格式要求');
  }
  
  if (result.warnings.length > 0) {
    recommendations.push('处理 Schema 验证警告：移除或允许额外的属性');
  }
  
  if (!schema.definitions || Object.keys(schema.definitions).length < 10) {
    recommendations.push('丰富 Schema 定义：添加更多类型定义以提高验证精度');
  }
  
  if (!schema.required || schema.required.length < 5) {
    recommendations.push('完善必需属性：确保所有关键属性都被标记为必需');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Schema 质量优秀，可以用于生产环境的 IR 验证');
  }
  
  return recommendations;
}

// 运行测试
if (require.main === module) {
  testPhysicsSchema();
}

module.exports = { testPhysicsSchema };
