/**
 * 爱心弹丸类
 * 公主发射的爱心投射物
 */

class HeartProjectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 10;
        
        // 拖尾效果
        this.trail = [];
        this.maxTrailLength = 15;
        
        // 动画
        this.rotation = 0;
        this.scale = 1;
        this.pulseSpeed = 0.2;
        
        // 标记是否存活
        this.alive = true;

        // 发射后无敌帧数（穿过头顶方块）
        this.invincibleFrames = 8;
    }

    /**
     * 更新弹丸状态
     */
    update(deltaTime, physics) {
        // 保存当前位置到拖尾
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // 应用物理
        if (physics) {
            this.alive = physics.updateProjectile(this, deltaTime);
        } else {
            // 简化版物理（无重力直线飞行）
            this.x += this.vx;
            this.y += this.vy;
            
            // 边界检测
            if (this.y > CONSTANTS.GROUND_Y || 
                this.x < 0 || 
                this.x > CONSTANTS.CANVAS_WIDTH) {
                this.alive = false;
            }
        }

        // 减少无敌帧
        if (this.invincibleFrames > 0) {
            this.invincibleFrames--;
        }

        // 旋转动画
        this.rotation += 0.1;
        
        // 脉冲动画
        this.scale = 1 + Math.sin(Date.now() / 100) * 0.1;
    }

    /**
     * 绘制爱心弹丸
     */
    draw(ctx) {
        ctx.save();
        
        // 绘制拖尾
        this.trail.forEach((pos, index) => {
            const alpha = index / this.trail.length;
            const size = this.radius * (index / this.trail.length);
            
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = CONSTANTS.COLORS.HEART_TRAIL;
            
            Helpers.drawHeart(ctx, pos.x, pos.y, size * 2, CONSTANTS.COLORS.HEART_TRAIL);
        });
        
        ctx.globalAlpha = 1.0;
        
        // 绘制主体爱心
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // 添加发光效果
        ctx.shadowColor = CONSTANTS.COLORS.HEART;
        ctx.shadowBlur = 15;
        
        Helpers.drawHeart(ctx, 0, 0, this.radius * 2, CONSTANTS.COLORS.HEART);
        
        // 添加高光
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-3, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * 获取碰撞体
     */
    getCollisionCircle() {
        return {
            x: this.x,
            y: this.y,
            radius: this.radius
        };
    }

    /**
     * 击中目标时调用
     */
    onHit() {
        this.alive = false;
    }
}
