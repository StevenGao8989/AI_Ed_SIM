// Matter.js implementation for ramp collision physics problem
const Matter = require('matter-js');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Set environment variables
require('dotenv').config({ path: '.env.local' });

/**
 * Matter.js Ramp Collision Physics Simulator
 */
class MatterRampCollisionSimulator {
  constructor() {
    // Create engine and world
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    
    // Set up canvas
    this.canvas = createCanvas(1200, 800);
    this.ctx = this.canvas.getContext('2d');
    
    // Physics parameters
    this.scale = 2000; // pixels per meter (scaled up for small objects)
    this.originX = 200;
    this.originY = 600;
    
    // Set gravity (increased for faster motion)
    this.world.gravity.y = 2.0;
    
    // Problem parameters
    this.rampLength = 0.05; // 5cm in meters
    this.rampAngle = 30; // degrees
    this.distance = 0.01; // 1cm between ramp and ball 2 (reduced for collision)
    this.ballRadius = 0.01; // 1cm radius
    
    // Create physics bodies
    this.createBodies();
    
    // Set up collision detection
    this.setupCollisionDetection();
  }
  
  createBodies() {
    // Convert to radians
    const angleRad = this.rampAngle * Math.PI / 180;
    
    // Calculate ramp dimensions
    const rampWidth = this.rampLength * this.scale;
    const rampHeight = 20; // 20 pixels thick
    
    // Calculate ramp position
    const rampX = this.originX + (this.rampLength / 2) * this.scale * Math.cos(angleRad);
    const rampY = this.originY - (this.rampLength / 2) * this.scale * Math.sin(angleRad);
    
    // Create ramp (static body)
    this.ramp = Matter.Bodies.rectangle(rampX, rampY, rampWidth, rampHeight, {
      angle: angleRad,
      isStatic: true,
      render: {
        fillStyle: '#6c757d',
        strokeStyle: '#495057',
        lineWidth: 2
      }
    });
    
    // Create ground (static body)
    this.ground = Matter.Bodies.rectangle(600, this.originY + 10, 1200, 20, {
      isStatic: true,
      render: {
        fillStyle: '#95a5a6',
        strokeStyle: '#7f8c8d',
        lineWidth: 2
      }
    });
    
    // Create ball 1 (starts at top of ramp)
    const ball1X = this.originX - (this.rampLength / 2) * this.scale * Math.cos(angleRad);
    const ball1Y = this.originY - (this.rampLength / 2) * this.scale * Math.sin(angleRad) - this.ballRadius * this.scale;
    
    this.ball1 = Matter.Bodies.circle(ball1X, ball1Y, this.ballRadius * this.scale, {
      restitution: 0.8, // Coefficient of restitution
      friction: 0.0, // No friction for better sliding
      frictionAir: 0.0, // No air resistance
      density: 0.001, // Low density for realistic motion
      render: {
        fillStyle: '#007bff',
        strokeStyle: '#0056b3',
        lineWidth: 2
      }
    });
    
    // Create ball 2 (stationary, 5cm from ramp bottom)
    // Position ball2 so it's exactly 5cm from the ramp bottom edge
    const rampBottomX = this.originX + (this.rampLength / 2) * this.scale * Math.cos(angleRad);
    const ball2X = rampBottomX + this.distance * this.scale + this.ballRadius * this.scale;
    const ball2Y = this.originY - this.ballRadius * this.scale;
    
    this.ball2 = Matter.Bodies.circle(ball2X, ball2Y, this.ballRadius * this.scale, {
      restitution: 0.8,
      friction: 0.0,
      frictionAir: 0.0,
      density: 0.001,
      isStatic: true, // Start as static, will be made dynamic after collision
      render: {
        fillStyle: '#28a745',
        strokeStyle: '#1e7e34',
        lineWidth: 2
      }
    });
    
    // Add all bodies to world
    Matter.World.add(this.world, [this.ramp, this.ground, this.ball1, this.ball2]);
    
    // Store collision point for reference
    this.collisionPoint = {
      x: ball2X,
      y: ball2Y
    };
  }
  
  setupCollisionDetection() {
    // Track collision between ball1 and ball2
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // Check if ball1 collides with ball2
        if ((bodyA === this.ball1 && bodyB === this.ball2) || 
            (bodyA === this.ball2 && bodyB === this.ball1)) {
          
          console.log('💥 Collision detected!');
          console.log(`Ball 1 velocity: ${Math.sqrt(bodyA.velocity.x**2 + bodyA.velocity.y**2).toFixed(3)} m/s`);
          
          // Make ball2 dynamic after collision
          if (bodyB === this.ball2) {
            Matter.Body.setStatic(this.ball2, false);
            console.log('Ball 2 is now dynamic');
          }
        }
      }
    });
  }
  
  render() {
    // Clear canvas
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw coordinate system (optional)
    this.drawCoordinateSystem();
    
    // Render all bodies
    const bodies = Matter.Composite.allBodies(this.world);
    bodies.forEach(body => {
      this.renderBody(body);
    });
    
    // Draw velocity vectors
    this.drawVelocityVectors();
    
    // Draw collision point marker
    this.drawCollisionPoint();
  }
  
  renderBody(body) {
    this.ctx.save();
    this.ctx.translate(body.position.x, body.position.y);
    this.ctx.rotate(body.angle);
    
    if (body.circleRadius) {
      // Render circle
      this.ctx.beginPath();
      this.ctx.arc(0, 0, body.circleRadius, 0, 2 * Math.PI);
      this.ctx.fillStyle = body.render.fillStyle;
      this.ctx.fill();
      this.ctx.strokeStyle = body.render.strokeStyle;
      this.ctx.lineWidth = body.render.lineWidth;
      this.ctx.stroke();
    } else {
      // Render rectangle
      this.ctx.fillStyle = body.render.fillStyle;
      this.ctx.fillRect(-body.bounds.max.x/2, -body.bounds.max.y/2, 
                       body.bounds.max.x, body.bounds.max.y);
      this.ctx.strokeStyle = body.render.strokeStyle;
      this.ctx.lineWidth = body.render.lineWidth;
      this.ctx.strokeRect(-body.bounds.max.x/2, -body.bounds.max.y/2, 
                         body.bounds.max.x, body.bounds.max.y);
    }
    
    this.ctx.restore();
  }
  
  drawVelocityVectors() {
    // Draw velocity vector for ball1
    if (this.ball1 && this.ball1.velocity) {
      const speed1 = Math.sqrt(this.ball1.velocity.x**2 + this.ball1.velocity.y**2);
      if (speed1 > 0.1) {
        this.ctx.strokeStyle = '#dc3545';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.ball1.position.x, this.ball1.position.y);
        this.ctx.lineTo(
          this.ball1.position.x + this.ball1.velocity.x * 10,
          this.ball1.position.y + this.ball1.velocity.y * 10
        );
        this.ctx.stroke();
        
        // Draw speed label
        this.ctx.fillStyle = '#dc3545';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(
          `v1: ${speed1.toFixed(2)} m/s`,
          this.ball1.position.x + 20,
          this.ball1.position.y - 10
        );
      }
    }
    
    // Draw velocity vector for ball2
    if (this.ball2 && this.ball2.velocity) {
      const speed2 = Math.sqrt(this.ball2.velocity.x**2 + this.ball2.velocity.y**2);
      if (speed2 > 0.1) {
        this.ctx.strokeStyle = '#ffc107';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.ball2.position.x, this.ball2.position.y);
        this.ctx.lineTo(
          this.ball2.position.x + this.ball2.velocity.x * 10,
          this.ball2.position.y + this.ball2.velocity.y * 10
        );
        this.ctx.stroke();
        
        // Draw speed label
        this.ctx.fillStyle = '#ffc107';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(
          `v2: ${speed2.toFixed(2)} m/s`,
          this.ball2.position.x + 20,
          this.ball2.position.y - 10
        );
      }
    }
  }
  
  drawCollisionPoint() {
    // Draw collision point marker
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    this.ctx.beginPath();
    this.ctx.arc(this.collisionPoint.x, this.collisionPoint.y, 5, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Draw collision point label
    this.ctx.fillStyle = '#dc3545';
    this.ctx.font = '10px Arial';
    this.ctx.fillText('Collision Point', this.collisionPoint.x + 10, this.collisionPoint.y - 10);
  }
  
  drawCoordinateSystem() {
    // Draw grid (optional)
    this.ctx.strokeStyle = '#e9ecef';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < this.canvas.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < this.canvas.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }
  
  simulate(duration = 3) {
    console.log('⚡ Starting Matter.js simulation...');
    
    const frames = [];
    const fps = 60;
    const dt = 1 / fps;
    const totalSteps = Math.floor(duration * fps);
    
    // Reset ball2 to static
    Matter.Body.setStatic(this.ball2, true);
    Matter.Body.setVelocity(this.ball2, { x: 0, y: 0 });
    
    // Reset ball1 position
    const angleRad = this.rampAngle * Math.PI / 180;
    const ball1X = this.originX - (this.rampLength / 2) * this.scale * Math.cos(angleRad);
    const ball1Y = this.originY - (this.rampLength / 2) * this.scale * Math.sin(angleRad) - this.ballRadius * this.scale;
    Matter.Body.setPosition(this.ball1, { x: ball1X, y: ball1Y });
    Matter.Body.setVelocity(this.ball1, { x: 0, y: 0 });
    
    // Debug: Log initial positions
    console.log(`Ball 1 initial position: (${ball1X.toFixed(1)}, ${ball1Y.toFixed(1)})`);
    console.log(`Ball 2 position: (${this.ball2.position.x.toFixed(1)}, ${this.ball2.position.y.toFixed(1)})`);
    console.log(`Distance between balls: ${Math.abs(ball1X - this.ball2.position.x).toFixed(1)} pixels`);
    
    for (let step = 0; step < totalSteps; step++) {
      // Update physics engine
      Matter.Engine.update(this.engine, dt * 1000);
      
      // Render current frame
      this.render();
      
      // Save frame
      const buffer = this.canvas.toBuffer('image/png');
      frames.push(buffer);
      
      // Log progress
      if (step % 60 === 0) {
        const time = step / fps;
        console.log(`  Time: ${time.toFixed(2)}s`);
        
        if (this.ball1.velocity) {
          const speed1 = Math.sqrt(this.ball1.velocity.x**2 + this.ball1.velocity.y**2);
          console.log(`    Ball 1 speed: ${speed1.toFixed(3)} m/s`);
        }
        
        if (this.ball2.velocity && !this.ball2.isStatic) {
          const speed2 = Math.sqrt(this.ball2.velocity.x**2 + this.ball2.velocity.y**2);
          console.log(`    Ball 2 speed: ${speed2.toFixed(3)} m/s`);
        }
      }
    }
    
    console.log(`✅ Simulation complete: ${frames.length} frames`);
    return frames;
  }
  
  getResults() {
    const results = {
      ball1_final_velocity: 0,
      ball2_final_velocity: 0,
      collision_detected: false
    };
    
    if (this.ball1.velocity) {
      results.ball1_final_velocity = Math.sqrt(
        this.ball1.velocity.x**2 + this.ball1.velocity.y**2
      );
    }
    
    if (this.ball2.velocity && !this.ball2.isStatic) {
      results.ball2_final_velocity = Math.sqrt(
        this.ball2.velocity.x**2 + this.ball2.velocity.y**2
      );
      results.collision_detected = true;
    }
    
    return results;
  }
}

/**
 * Matter.js Ramp Collision Physics Renderer
 */
class MatterRampCollisionRenderer {
  constructor() {
    this.width = 1200;
    this.height = 800;
  }
  
  async renderFrames(simulator, outputDir) {
    console.log('🎨 Starting Matter.js frame rendering...');
    
    const framesDir = path.join(outputDir, 'frames');
    if (fs.existsSync(framesDir)) {
      fs.rmSync(framesDir, { recursive: true, force: true });
    }
    fs.mkdirSync(framesDir, { recursive: true });
    
    // Run simulation and get frames
    const frames = simulator.simulate(3); // 3 seconds
    
    const frameFiles = [];
    for (let i = 0; i < frames.length; i++) {
      const frameFile = `frame_${i.toString().padStart(6, '0')}.png`;
      const framePath = path.join(framesDir, frameFile);
      fs.writeFileSync(framePath, frames[i]);
      frameFiles.push(frameFile);
      
      if (i % 60 === 0) {
        console.log(`  Rendering progress: ${i + 1}/${frames.length} (${((i + 1) / frames.length * 100).toFixed(1)}%)`);
      }
    }
    
    console.log(`✅ Rendering complete: ${frameFiles.length} frames`);
    return frameFiles;
  }
}

/**
 * Test Matter.js ramp collision physics
 */
async function testMatterRampCollision() {
  try {
    console.log('🚀 Starting Matter.js ramp collision physics test...');
    
    // Create output directory
    const outputDir = path.join(__dirname, 'output_matter_ramp_collision');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create problem analysis result
    const aiResult = {
      scenario: "Matter.js Ramp Collision System",
      objects: [
        {"id": "ball1", "mass": 0.1, "initial_position": "Top of ramp"},
        {"id": "ball2", "mass": 0.1, "initial_position": "5cm from ramp bottom"}
      ],
      phases: ["ramp_slide", "horizontal_motion", "collision", "post_collision"],
      parameters: {
        "rampLength": 0.05,
        "angle": 30,
        "distance": 0.05,
        "ballRadius": 0.01,
        "restitution": 0.8,
        "friction": 0.1
      },
      targets: ["v1_final", "v2_final"],
      note: "Matter.js physics engine implementation"
    };
    
    const aiResultPath = path.join(outputDir, 'ai_analysis_matter_ramp_collision.json');
    fs.writeFileSync(aiResultPath, JSON.stringify(aiResult, null, 2));
    console.log('📁 Parameter configuration saved to:', aiResultPath);

    // Step 1: Matter.js physics simulation
    console.log('\n=== Step 1: Matter.js Physics Simulation ===');
    const simulator = new MatterRampCollisionSimulator();
    
    // Step 2: Render video frames
    console.log('\n=== Step 2: Render Matter.js Animation ===');
    const renderer = new MatterRampCollisionRenderer();
    const frameFiles = await renderer.renderFrames(simulator, outputDir);

    // Step 3: Generate video
    console.log('\n=== Step 3: Generate Video ===');
    const videoPath = path.join(outputDir, 'matter_ramp_collision_physics_animation.mp4');
    const framesPattern = path.join(outputDir, 'frames', 'frame_%06d.png');
    
    try {
      console.log('🎬 Starting FFmpeg encoding...');
      execSync(`ffmpeg -y -r 60 -i "${framesPattern}" -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart "${videoPath}"`, {
        stdio: 'pipe'
      });
      
      const stats = fs.statSync(videoPath);
      console.log(`✅ Video generated successfully: ${videoPath}`);
      console.log(`📏 Video size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
      console.log(`⏱️ Estimated duration: ${(frameFiles.length / 60).toFixed(1)} seconds`);
      
    } catch (ffmpegError) {
      console.error('❌ FFmpeg encoding failed:', ffmpegError.message);
      console.log('💡 Please ensure FFmpeg is installed on the system');
    }

    // Get simulation results
    const results = simulator.getResults();
    
    // Display final results
    console.log('\n🎉 Matter.js ramp collision physics test complete!');
    
    console.log('\n📊 Matter.js Physics Results:');
    console.log(`  Ball 1 final velocity: ${results.ball1_final_velocity.toFixed(3)} m/s`);
    console.log(`  Ball 2 final velocity: ${results.ball2_final_velocity.toFixed(3)} m/s`);
    console.log(`  Collision detected: ${results.collision_detected ? 'Yes' : 'No'}`);
    
    console.log('\n📁 Output files:');
    console.log(`  Parameter configuration: ${outputDir}/ai_analysis_matter_ramp_collision.json`);
    console.log(`  Video file: ${videoPath}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  testMatterRampCollision();
}

module.exports = { MatterRampCollisionSimulator, MatterRampCollisionRenderer };
