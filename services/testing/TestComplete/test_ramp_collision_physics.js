// Test ramp collision physics problem: Ball on ramp colliding with stationary ball
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { execSync } = require('child_process');

// Set environment variables
require('dotenv').config({ path: '.env.local' });

/**
 * Ramp Collision Physics Simulator
 */
class RampCollisionPhysicsSimulator {
  constructor() {
    this.g = 9.8; // Gravitational acceleration
  }

  /**
   * Simulate ramp collision physics process
   */
  simulate(params) {
    console.log('⚡ Starting ramp collision physics simulation...');
    console.log('📊 Physics parameters:', params);

    const frames = [];
    const dt = 0.005; // Time step
    
    // Extract parameters
    const m1 = params.m1 || 0.1;        // Ball 1 mass (kg)
    const m2 = params.m2 || 0.1;        // Ball 2 mass (kg)
    const rampLength = params.rampLength || 0.05; // Ramp length (5cm)
    const angle = params.angle || 30;   // Ramp angle (degrees)
    const distance = params.distance || 0.05; // Distance between ramp and ball 2 (5cm)
    const e = params.e || 0.8;          // Coefficient of restitution
    const mu = params.mu || 0.0;        // Coefficient of friction (0 = frictionless)

    const angleRad = angle * Math.PI / 180;
    let time = 0;

    // Calculate key positions and parameters
    const ball_radius = 0.025; // Ball radius (2.5cm) - increased size
    
    // Phase 1: Ball 1 slides down the ramp
    console.log('📉 Phase 1: Ball 1 slides down the ramp');
    const rampHeight = rampLength * Math.sin(angleRad); // Ramp height
    
    // Calculate acceleration with friction
    // Net acceleration = g*sin(θ) - μ*g*cos(θ) = g*(sin(θ) - μ*cos(θ))
    const acceleration = this.g * (Math.sin(angleRad) - mu * Math.cos(angleRad));
    const v1_bottom = Math.sqrt(2 * acceleration * rampLength); // Velocity at bottom of ramp
    const t1 = Math.sqrt(2 * rampLength / acceleration); // Time to slide down
    
    for (let i = 0; i <= Math.ceil(t1 / dt); i++) {
      const t = i * dt;
      if (t > t1) break;
      
      const s = 0.5 * acceleration * t * t; // Distance along ramp (with friction)
      const v = acceleration * t; // Velocity along ramp (with friction)
      
      // Ensure ball doesn't exceed ramp length
      const clampedS = Math.min(s, rampLength);
      const x = clampedS * Math.cos(angleRad);
      const y = rampHeight - clampedS * Math.sin(angleRad);
      
      frames.push({
        time: time + t,
        phase: 'ramp_slide',
        bodies: [
          {
            id: 'ball1',
            position: [x, y],
            velocity: [v * Math.cos(angleRad), -v * Math.sin(angleRad)],
            energy: {
              kinetic: 0.5 * m1 * v * v,
              potential: m1 * this.g * y
            }
          },
          {
            id: 'ball2',
            position: [rampLength * Math.cos(angleRad) + distance + ball_radius, 0],
            velocity: [0, 0],
            energy: { kinetic: 0, potential: 0 }
          }
        ]
      });
    }
    
    time += t1;
    console.log(`  Slide time: ${t1.toFixed(2)}s, Bottom velocity: ${v1_bottom.toFixed(2)}m/s`);

    // Phase 2: Ball 1 moves horizontally to collision point
    console.log('🛤️ Phase 2: Ball 1 moves horizontally to collision point');
    const t2 = distance / (v1_bottom * Math.cos(angleRad)); // Time to reach collision point
    
    for (let i = 0; i <= Math.ceil(t2 / dt); i++) {
      const t = i * dt;
      if (t > t2) break;
      
      const x = rampLength * Math.cos(angleRad) + v1_bottom * Math.cos(angleRad) * t;
      const v = v1_bottom * Math.cos(angleRad); // Horizontal velocity
      
      frames.push({
        time: time + t,
        phase: 'horizontal_motion',
        bodies: [
          {
            id: 'ball1',
            position: [x, 0],
            velocity: [v, 0],
            energy: {
              kinetic: 0.5 * m1 * v * v,
              potential: 0
            }
          },
          {
            id: 'ball2',
            position: [rampLength * Math.cos(angleRad) + distance, 0],
            velocity: [0, 0],
            energy: { kinetic: 0, potential: 0 }
          }
        ]
      });
    }
    
    time += t2;
    console.log(`  Horizontal motion time: ${t2.toFixed(2)}s`);

    // Phase 3: Collision
    console.log('💥 Phase 3: Collision');
    const v1_before = v1_bottom * Math.cos(angleRad); // Ball 1 velocity before collision
    const v2_before = 0; // Ball 2 velocity before collision
    
    // Collision equations (momentum conservation + coefficient of restitution)
    // m1*v1_before + m2*v2_before = m1*v1_after + m2*v2_after
    // e = (v2_after - v1_after) / (v1_before - v2_before)
    const v1_after = ((m1 - e * m2) * v1_before) / (m1 + m2);
    const v2_after = ((m2 + e * m2) * v1_before) / (m1 + m2);
    
    // Collision before: balls approaching (edge-to-edge contact)
    const collision_x = rampLength * Math.cos(angleRad) + distance;
    frames.push({
      time: time,
      phase: 'collision',
      bodies: [
        {
          id: 'ball1',
          position: [collision_x - ball_radius, 0], // Ball 1 right edge at collision point
          velocity: [v1_before, 0],
          energy: { kinetic: 0.5 * m1 * v1_before * v1_before }
        },
        {
          id: 'ball2',
          position: [collision_x + ball_radius, 0], // Ball 2 left edge at collision point
          velocity: [v2_before, 0],
          energy: { kinetic: 0.5 * m2 * v2_before * v2_before }
        }
      ]
    });
    
    // Collision after: balls separating (edge-to-edge contact)
    frames.push({
      time: time + dt,
      phase: 'post_collision',
      bodies: [
        {
          id: 'ball1',
          position: [collision_x - ball_radius, 0], // Ball 1 right edge at collision point
          velocity: [v1_after, 0],
          energy: { 
            kinetic: 0.5 * m1 * v1_after * v1_after,
            lost: 0.5 * m1 * v1_before * v1_before - 0.5 * m1 * v1_after * v1_after
          }
        },
        {
          id: 'ball2',
          position: [collision_x + ball_radius, 0], // Ball 2 left edge at collision point
          velocity: [v2_after, 0],
          energy: { 
            kinetic: 0.5 * m2 * v2_after * v2_after,
            gained: 0.5 * m2 * v2_after * v2_after
          }
        }
      ]
    });
    
    time += dt;
    console.log(`  Ball 1 velocity after collision: ${v1_after.toFixed(2)}m/s`);
    console.log(`  Ball 2 velocity after collision: ${v2_after.toFixed(2)}m/s`);

    // Phase 4: Post-collision motion
    console.log('🏃 Phase 4: Post-collision motion');
    const t4 = 0.5; // Show motion for 0.5 seconds
    
    for (let i = 0; i <= Math.ceil(t4 / dt); i++) {
      const t = i * dt;
      if (t > t4) break;
      
      const x1 = collision_x - ball_radius + v1_after * t;
      const x2 = collision_x + ball_radius + v2_after * t;
      
      frames.push({
        time: time + t,
        phase: 'post_collision_motion',
        bodies: [
          {
            id: 'ball1',
            position: [x1, 0],
            velocity: [v1_after, 0],
            energy: { kinetic: 0.5 * m1 * v1_after * v1_after }
          },
          {
            id: 'ball2',
            position: [x2, 0],
            velocity: [v2_after, 0],
            energy: { kinetic: 0.5 * m2 * v2_after * v2_after }
          }
        ]
      });
    }
    
    time += t4;
    console.log(`  Post-collision motion time: ${t4.toFixed(2)}s`);

    console.log('✅ Ramp collision physics simulation complete');
    console.log(`📊 Simulation stats: ${frames.length} frames, ${time.toFixed(2)}s`);

    return {
      frames: frames,
      results: {
        v1_bottom: v1_bottom.toFixed(3),           // Ball 1 velocity at bottom of ramp
        v1_after: v1_after.toFixed(3),             // Ball 1 velocity after collision
        v2_after: v2_after.toFixed(3),             // Ball 2 velocity after collision
        total_time: time.toFixed(2)
      },
      phases: ['ramp_slide', 'horizontal_motion', 'collision', 'post_collision', 'post_collision_motion']
    };
  }
}

/**
 * Ramp Collision Physics Renderer
 */
class RampCollisionPhysicsRenderer {
  constructor(width = 1200, height = 800) {
    this.width = width;
    this.height = height;
    this.scale = 2000; // pixels/meter (scaled up for small objects)
    this.originX = 200; // X origin offset
    this.originY = height - 200; // Y origin offset
  }

  /**
   * Render ramp collision physics scene
   */
  async renderFrames(simulation, outputDir) {
    console.log('🎨 Starting ramp collision physics scene rendering...');
    
    const framesDir = path.join(outputDir, 'frames');
    // Clear old frames
    if (fs.existsSync(framesDir)) {
      fs.rmSync(framesDir, { recursive: true, force: true });
    }
    fs.mkdirSync(framesDir, { recursive: true });

    const frameFiles = [];
    for (let i = 0; i < simulation.frames.length; i++) {
      const frame = simulation.frames[i];
      const canvas = createCanvas(this.width, this.height);
      const ctx = canvas.getContext('2d');

      // Clear background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, this.width, this.height);

      // Draw physics scene
      this.drawPhysicsScene(ctx, frame);
      
      // Save frame
      const frameFile = `frame_${i.toString().padStart(6, '0')}.png`;
      const framePath = path.join(framesDir, frameFile);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(framePath, buffer);
      frameFiles.push(frameFile);

      if (i % 50 === 0) {
        console.log(`  Rendering progress: ${i + 1}/${simulation.frames.length} (${((i + 1) / simulation.frames.length * 100).toFixed(1)}%)`);
      }
    }

    console.log(`✅ Rendering complete: ${frameFiles.length} frames`);
    return frameFiles;
  }

  drawPhysicsScene(ctx, frame) {
    // Draw ramp
    this.drawRamp(ctx);
    
    // Draw ground
    this.drawGround(ctx);
    
    // Draw balls
    this.drawBalls(ctx, frame);
    
    // Draw trajectory
    this.drawTrajectory(ctx, frame);
  }

  drawRamp(ctx) {
    // Draw ramp (5cm long, 30° angle)
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const angleRad = 30 * Math.PI / 180;
    const rampLength = 0.05 * this.scale; // 5cm
    const rampEndX = this.originX + rampLength * Math.cos(angleRad);
    const rampEndY = this.originY - rampLength * Math.sin(angleRad);
    
    // Ramp start (bottom)
    const rampStartX = this.originX;
    const rampStartY = this.originY;
    
    // Draw ramp
    ctx.moveTo(rampStartX, rampStartY);
    ctx.lineTo(rampEndX, rampEndY);
    ctx.stroke();
    
    // Draw ramp support
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rampStartX, rampStartY);
    ctx.lineTo(rampStartX, rampStartY + 20);
    ctx.stroke();
  }

  drawGround(ctx) {
    // Draw horizontal ground
    ctx.strokeStyle = '#495057';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, this.originY);
    ctx.lineTo(this.width, this.originY);
    ctx.stroke();
  }

  drawBalls(ctx, frame) {
    frame.bodies.forEach(body => {
      const x = this.originX + body.position[0] * this.scale;
      const y = this.originY - body.position[1] * this.scale;
      
      // Choose color based on ball type
      let color = '#007bff'; // Default blue
      if (body.id === 'ball2') {
        color = '#28a745'; // Green
      }
      
      // Draw ball (increased size)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI); // Increased from 8 to 20 pixels
      ctx.fill();
      
      // Draw ball border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw velocity vector
      if (body.velocity) {
        const vx = body.velocity[0];
        const vy = body.velocity[1];
        const speed = Math.sqrt(vx * vx + vy * vy);
        
        if (speed > 0.01) {
          ctx.strokeStyle = '#dc3545';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + vx * this.scale * 0.1, y - vy * this.scale * 0.1);
          ctx.stroke();
        }
      }
    });
  }

  drawTrajectory(ctx, frame) {
    // Draw trajectory (simplified)
    if (frame.phase === 'horizontal_motion' || frame.phase === 'post_collision_motion') {
      const ball1 = frame.bodies.find(b => b.id === 'ball1');
      if (ball1) {
        const x = this.originX + ball1.position[0] * this.scale;
        const y = this.originY - ball1.position[1] * this.scale;
        
        // Draw trajectory point
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
}

/**
 * Test ramp collision physics
 */
async function testRampCollisionPhysics() {
  try {
    console.log('🚀 Starting ramp collision physics test...');
    
    // Create output directory
    const outputDir = path.join(__dirname, 'output_ramp_collision');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create problem analysis result
    const aiResult = {
      scenario: "Ramp collision system",
      objects: [
        {"id": "ball1", "mass": 0.1, "initial_position": "Top of ramp"},
        {"id": "ball2", "mass": 0.1, "initial_position": "5cm from ramp bottom"}
      ],
      phases: ["ramp_slide", "horizontal_motion", "collision", "post_collision", "post_collision_motion"],
      parameters: {"m1": 0.1, "m2": 0.1, "rampLength": 0.05, "angle": 30, "distance": 0.05, "e": 0.8, "mu": 0.0, "g": 9.8},
      targets: ["v1_bottom", "v1_after", "v2_after"],
      note: "Based on problem parameters"
    };
    
    const aiResultPath = path.join(outputDir, 'ai_analysis_ramp_collision.json');
    fs.writeFileSync(aiResultPath, JSON.stringify(aiResult, null, 2));
    console.log('📁 Parameter configuration saved to:', aiResultPath);

    // Step 1: Physics simulation
    console.log('\n=== Step 1: Ramp collision physics simulation ===');
    const simulator = new RampCollisionPhysicsSimulator();
    
    // Use hardcoded physics parameters
    const params = {
      m1: 0.1,        // Ball 1 mass
      m2: 0.1,        // Ball 2 mass
      rampLength: 0.05, // Ramp length (5cm)
      angle: 30,      // Ramp angle
      distance: 0.05, // Distance between ramp and ball 2 (5cm)
      e: 0.8,         // Coefficient of restitution
      mu: 0.0         // Coefficient of friction (0 = frictionless)
    };

    const simulation = simulator.simulate(params);
    
    // Save simulation results
    const simResultPath = path.join(outputDir, 'simulation_result_ramp_collision.json');
    fs.writeFileSync(simResultPath, JSON.stringify(simulation, null, 2));
    console.log('📁 Simulation results saved to:', simResultPath);

    // Step 2: Render video frames
    console.log('\n=== Step 2: Render ramp collision animation ===');
    const renderer = new RampCollisionPhysicsRenderer();
    const frameFiles = await renderer.renderFrames(simulation, outputDir);

    // Step 3: Generate video
    console.log('\n=== Step 3: Generate video ===');
    const videoPath = path.join(outputDir, 'ramp_collision_physics_animation.mp4');
    const framesPattern = path.join(outputDir, 'frames', 'frame_%06d.png');
    
    try {
      console.log('🎬 Starting FFmpeg encoding...');
      execSync(`ffmpeg -y -r 30 -i "${framesPattern}" -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart "${videoPath}"`, {
        stdio: 'pipe'
      });
      
      const stats = fs.statSync(videoPath);
      console.log(`✅ Video generated successfully: ${videoPath}`);
      console.log(`📏 Video size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
      console.log(`⏱️ Estimated duration: ${(frameFiles.length / 30).toFixed(1)} seconds`);
      
    } catch (ffmpegError) {
      console.error('❌ FFmpeg encoding failed:', ffmpegError.message);
      console.log('💡 Please ensure FFmpeg is installed on the system');
    }

    // Display final results
    console.log('\n🎉 Ramp collision physics test complete!');
    console.log(`  Total simulation time = ${simulation.results.total_time} s`);
    
    console.log('\n📊 Calculation results:');
    console.log(`  Ball 1 velocity at bottom of ramp = ${simulation.results.v1_bottom} m/s`);
    console.log(`  Ball 1 velocity after collision = ${simulation.results.v1_after} m/s`);
    console.log(`  Ball 2 velocity after collision = ${simulation.results.v2_after} m/s`);
    
    console.log('\n📁 Output files:');
    console.log(`  Parameter configuration: ${outputDir}/ai_analysis_ramp_collision.json`);
    console.log(`  Simulation results: ${simResultPath}`);
    console.log(`  Video file: ${videoPath}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  testRampCollisionPhysics();
}

module.exports = { RampCollisionPhysicsSimulator, RampCollisionPhysicsRenderer };
