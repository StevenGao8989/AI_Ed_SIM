/**
 * 斜坡碰撞动画示例
 * 题目：在斜坡上方顶端放一个质量m = 0.5kg球，坡度为30度，长5厘米，
 * 另一个质量为M = 1kg的小球离斜坡5厘米。水平面为粗糙水平面，动摩擦因数μ=0.25，
 * 计算碰撞后第二个球的速度。
 */

var Example = Example || {};

Example.rampCollision = function() {
    var Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Composite = Matter.Composite,
        Bodies = Matter.Bodies,
        Common = Matter.Common,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse;

    // create engine
    var engine = Engine.create(),
        world = engine.world;

    // 设置重力
    engine.world.gravity.y = 9.8; // 标准重力加速度

    // create renderer
    var render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: 1000,
            height: 600,
            wireframes: false,
            background: '#f0f0f0',
            showVelocity: false,
            showCollisions: true
        }
    });

    Render.run(render);

    // create runner
    var runner = Runner.create();
    Runner.run(runner, engine);

    // 定义颜色
    var rampColor = '#8B4513',      // 棕色斜坡
        ball1Color = '#FF6B6B',     // 红色小球 (m = 0.5kg)
        ball2Color = '#4ECDC4',     // 青色大球 (M = 1kg)
        groundColor = '#666666';    // 灰色地面

    // 物理参数
    var rampAngle = Math.PI / 6;    // 30度 = π/6 弧度
    var rampLength = 200;           // 斜坡长度 (像素) - 延长至200像素
    var ball1Mass = 0.5;            // 小球质量
    var ball2Mass = 1.0;            // 大球质量
    var friction = 0.25;            // 动摩擦因数

    // 地面位置 - 延长至画布边界
    var groundY = 550;
    var groundWidth = 1000;         // 使用画布宽度
    var groundX = 1000 / 2;         // 地面中心X坐标

    // 计算斜坡位置，使右端与地面接触
    var rampWidth = 10;
    var rampRightX = groundX + groundWidth / 2 - 400; // 斜坡右端距离地面右端400像素
    var rampRightY = groundY - 10; // 斜坡右端在地面上方10像素
    
    // 计算斜坡中心位置
    var rampX = rampRightX - (rampLength / 2) * Math.cos(rampAngle);
    var rampY = rampRightY - (rampLength / 2) * Math.sin(rampAngle);

    // 创建斜坡 (静态矩形)
    var ramp = Bodies.rectangle(rampX, rampY, rampLength, rampWidth, {
        isStatic: true,
        angle: rampAngle,
        render: {
            fillStyle: rampColor,
            strokeStyle: '#654321',
            lineWidth: 2
        }
    });

    // 创建粗糙水平面 (静态矩形)
    var ground = Bodies.rectangle(groundX, groundY, groundWidth, 20, {
        isStatic: true,
        friction: friction,
        frictionStatic: friction,
        render: {
            fillStyle: groundColor,
            strokeStyle: '#333333',
            lineWidth: 2
        }
    });

    // 计算小球初始位置 (斜坡顶端，确保与斜坡接触)
    var ball1Radius = 15;
    var rampStartX = rampX - (rampLength / 2) * Math.cos(rampAngle);
    var rampStartY = rampY - (rampLength / 2) * Math.sin(rampAngle);
    var ball1X = rampStartX + ball1Radius * Math.sin(rampAngle);
    var ball1Y = rampStartY - ball1Radius * Math.cos(rampAngle);

    // 创建小球 (m = 0.5kg)
    var ball1 = Bodies.circle(ball1X, ball1Y, ball1Radius, {
        mass: ball1Mass,
        friction: 0.1,
        frictionStatic: 0.1,
        restitution: 0.3,
        render: {
            fillStyle: ball1Color,
            strokeStyle: '#CC5555',
            lineWidth: 2
        }
    });

    // 计算大球初始位置 (离斜坡右端5厘米，转换为像素约50像素)
    var ball2Radius = 20;
    var ball2X = rampRightX + 50; // 斜坡右端向右50像素
    var ball2Y = rampRightY - ball2Radius; // 在地面上方

    // 创建大球 (M = 1kg)
    var ball2 = Bodies.circle(ball2X, ball2Y, ball2Radius, {
        mass: ball2Mass,
        friction: friction,
        frictionStatic: friction,
        restitution: 0.3,
        render: {
            fillStyle: ball2Color,
            strokeStyle: '#3BA39C',
            lineWidth: 2
        }
    });

    // 添加所有物体到世界
    Composite.add(world, [ramp, ground, ball1, ball2]);

    // 添加鼠标控制
    var mouse = Mouse.create(render.canvas),
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

    Composite.add(world, mouseConstraint);

    // keep the mouse in sync with rendering
    render.mouse = mouse;

    // 添加碰撞事件监听器
    Matter.Events.on(engine, 'collisionStart', function(event) {
        var pairs = event.pairs;

        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            var bodyA = pair.bodyA;
            var bodyB = pair.bodyB;

            // 检查是否是小球和大球的碰撞
            if ((bodyA === ball1 && bodyB === ball2) || (bodyA === ball2 && bodyB === ball1)) {
                console.log('球体碰撞发生！');
                console.log('小球速度:', bodyA === ball1 ? bodyA.velocity : bodyB.velocity);
                console.log('大球速度:', bodyA === ball2 ? bodyA.velocity : bodyB.velocity);

                // 计算碰撞后的速度 (简化的弹性碰撞)
                var v1 = bodyA === ball1 ? bodyA.velocity : bodyB.velocity;
                var v2 = bodyA === ball2 ? bodyA.velocity : bodyB.velocity;

                // 动量守恒和能量守恒
                var totalMass = ball1Mass + ball2Mass;
                var v1New = {
                    x: (v1.x * (ball1Mass - ball2Mass) + 2 * ball2Mass * v2.x) / totalMass,
                    y: (v1.y * (ball1Mass - ball2Mass) + 2 * ball2Mass * v2.y) / totalMass
                };
                var v2New = {
                    x: (v2.x * (ball2Mass - ball1Mass) + 2 * ball1Mass * v1.x) / totalMass,
                    y: (v2.y * (ball2Mass - ball1Mass) + 2 * ball1Mass * v1.y) / totalMass
                };

                console.log('碰撞后小球速度:', v1New);
                console.log('碰撞后大球速度:', v2New);
                
                // 应用碰撞后的速度到球体
                Matter.Body.setVelocity(ball1, v1New);
                Matter.Body.setVelocity(ball2, v2New);
            }
        }
    });

    // 添加速度显示
    var showVelocities = function() {
        var context = render.canvas.getContext('2d');
        context.save();
        context.font = '12px Arial';
        context.fillStyle = '#000000';

        // 显示小球速度
        context.fillText('小球速度: ' +
            Math.sqrt(ball1.velocity.x * ball1.velocity.x + ball1.velocity.y * ball1.velocity.y).toFixed(2) +
            ' m/s', 10, 30);

        // 显示大球速度
        context.fillText('大球速度: ' +
            Math.sqrt(ball2.velocity.x * ball2.velocity.x + ball2.velocity.y * ball2.velocity.y).toFixed(2) +
            ' m/s', 10, 50);

        // 显示物理参数
        context.fillText('斜坡角度: 30°', 10, 70);
        context.fillText('小球质量: 0.5kg', 10, 90);
        context.fillText('大球质量: 1.0kg', 10, 110);
        context.fillText('摩擦因数: 0.25', 10, 130);

        context.restore();
    };

    // 重写渲染函数以添加速度显示
    var originalRender = render.render;
    render.render = function() {
        originalRender.call(render);
        showVelocities();
    };

    // 添加重置功能
    var resetSimulation = function() {
        // 重置小球位置
        Matter.Body.setPosition(ball1, { x: ball1X, y: ball1Y });
        Matter.Body.setVelocity(ball1, { x: 0, y: 0 });
        Matter.Body.setAngle(ball1, 0);
        Matter.Body.setAngularVelocity(ball1, 0);

        // 重置大球位置
        Matter.Body.setPosition(ball2, { x: ball2X, y: ball2Y });
        Matter.Body.setVelocity(ball2, { x: 0, y: 0 });
        Matter.Body.setAngle(ball2, 0);
        Matter.Body.setAngularVelocity(ball2, 0);
    };

    // 添加键盘控制
    document.addEventListener('keydown', function(event) {
        switch(event.code) {
            case 'KeyR':
                resetSimulation();
                console.log('仿真已重置');
                break;
            case 'KeyS':
                // 开始仿真
                Runner.start(runner);
                console.log('仿真开始');
                break;
            case 'KeyP':
                // 暂停仿真
                Runner.stop(runner);
                console.log('仿真暂停');
                break;
        }
    });

    // 添加说明文字
    var addInstructions = function() {
        var context = render.canvas.getContext('2d');
        context.save();
        context.font = '14px Arial';
        context.fillStyle = '#333333';
        context.fillText('控制说明:', 10, 550);
        context.fillText('R - 重置仿真', 10, 570);
        context.fillText('S - 开始仿真', 10, 590);
        context.fillText('P - 暂停仿真', 10, 610);
        context.restore();
    };

    // 重写渲染函数以添加说明
    var originalRender2 = render.render;
    render.render = function() {
        originalRender2.call(render);
        showVelocities();
        addInstructions();
    };

    // fit the render viewport to the scene
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: 1000, y: 600 }
    });

    // 初始暂停，等待用户开始
    Runner.stop(runner);

    // context for MatterTools.Demo
    return {
        engine: engine,
        runner: runner,
        render: render,
        canvas: render.canvas,
        ball1: ball1,
        ball2: ball2,
        ramp: ramp,
        ground: ground,
        resetSimulation: resetSimulation,
        stop: function() {
            Matter.Render.stop(render);
            Matter.Runner.stop(runner);
        }
    };
};

Example.rampCollision.title = 'Ramp Collision Physics';
Example.rampCollision.for = '>=0.14.2';

if (typeof module !== 'undefined') {
    module.exports = Example.rampCollision;
}
