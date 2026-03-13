/**
 * 渲染系统
 * 负责绘制游戏的所有视觉元素
 */

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });

        // 适配高分屏（Retina）
        this.dpr = window.devicePixelRatio || 1;
        this.canvas.width = CONSTANTS.CANVAS_WIDTH * this.dpr;
        this.canvas.height = CONSTANTS.CANVAS_HEIGHT * this.dpr;

        // 相机震动效果
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeTime = 0;
    }

    /**
     * 开始渲染新帧
     */
    beginRender() {
        const ctx = this.ctx;
        const dpr = this.dpr;

        // 重置 transform 并清空画布
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 应用相机震动
        if (this.shakeTime > 0) {
            this.shakeOffset.x = (Math.random() - 0.5) * this.shakeTime;
            this.shakeOffset.y = (Math.random() - 0.5) * this.shakeTime;
            this.shakeTime -= 0.5;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
        }

        // 每帧重新设置 DPR 缩放 + 震动偏移
        ctx.setTransform(dpr, 0, 0, dpr, this.shakeOffset.x * dpr, this.shakeOffset.y * dpr);
    }

    /**
     * 像素清晰度测试
     */
    drawPixelTest() {
        // 在角落绘制一个像素网格测试图案
        const ctx = this.ctx;
        ctx.fillStyle = '#FF0000';
        // 绘制 8x8 的像素格
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if ((i + j) % 2 === 0) {
                    ctx.fillRect(i * 4, j * 4, 4, 4);
                }
            }
        }
    }

    /**
     * 结束渲染
     */
    endRender() {
        // No-op: transform is reset at the start of each frame
    }

    /**
     * 绘制背景
     */
    drawBackground() {
        const ctx = this.ctx;
        const width = CONSTANTS.CANVAS_WIDTH;
        const height = CONSTANTS.CANVAS_HEIGHT;

        // 天空渐变
        const skyGradient = ctx.createLinearGradient(0, 0, 0, CONSTANTS.GROUND_Y);
        skyGradient.addColorStop(0, CONSTANTS.COLORS.SKY_TOP);
        skyGradient.addColorStop(1, CONSTANTS.COLORS.SKY_BOTTOM);
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);
        
        // 云朵
        this.drawClouds();
        
        // 草地
        const grassGradient = ctx.createLinearGradient(0, CONSTANTS.GROUND_Y, 0, height);
        grassGradient.addColorStop(0, CONSTANTS.COLORS.GRASS);
        grassGradient.addColorStop(1, '#228B22');
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, CONSTANTS.GROUND_Y, width, height - CONSTANTS.GROUND_Y);
        
        // 地面装饰（小花）
        this.drawFlowers();
    }

    /**
     * 绘制云朵
     */
    drawClouds() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        // 简单的云朵形状
        const cloudPositions = [
            { x: 100, y: 80, size: 1 },
            { x: 300, y: 120, size: 0.8 },
            { x: 600, y: 60, size: 1.2 },
            { x: 450, y: 150, size: 0.7 }
        ];
        
        cloudPositions.forEach(cloud => {
            ctx.save();
            ctx.translate(cloud.x, cloud.y);
            ctx.scale(cloud.size, cloud.size);
            
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.arc(25, -10, 25, 0, Math.PI * 2);
            ctx.arc(50, 0, 30, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }

    /**
     * 绘制花朵装饰
     */
    drawFlowers() {
        const ctx = this.ctx;
        const flowerColors = ['#FF69B4', '#FFFF00', '#FF6347', '#DDA0DD'];
        
        for (let i = 0; i < 20; i++) {
            const x = (i * 73) % CONSTANTS.CANVAS_WIDTH;
            const y = CONSTANTS.GROUND_Y + 10 + (i % 3) * 15;
            
            ctx.fillStyle = flowerColors[i % flowerColors.length];
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * 绘制公主
     */
    drawPrincess(princess) {
        if (princess) {
            princess.draw(this.ctx);
        }
    }

    /**
     * 绘制投射物
     */
    drawProjectiles(projectiles) {
        projectiles.forEach(projectile => projectile.draw(this.ctx));
    }

    /**
     * 绘制积木块
     */
    drawBlocks(blocks) {
        // 先绘制所有积木
        blocks.forEach(block => block.draw(this.ctx));
    }

    /**
     * 绘制粒子
     */
    drawParticles(particleEmitter) {
        if (particleEmitter) {
            particleEmitter.draw(this.ctx);
        }
    }

    /**
     * 绘制 UI 指示器
     */
    drawUI(gameState) {
        const ctx = this.ctx;
        
        // 绘制瞄准线（如果鼠标按下）
        if (gameState.inputHandler && gameState.inputHandler.isMouseDown) {
            // 可以在这里添加瞄准辅助线
        }
    }

    /**
     * 相机震动
     */
    shake(intensity = 10, duration = 20) {
        this.shakeTime = duration;
    }

    /**
     * 绘制调试信息
     */
    drawDebugInfo(fps, blockCount, particleCount) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 200, 80);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${fps}`, 20, 30);
        ctx.fillText(`Blocks: ${blockCount}`, 20, 50);
        ctx.fillText(`Particles: ${particleCount}`, 20, 70);
        
        ctx.restore();
    }
}
