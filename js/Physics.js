/**
 * 轻量级物理引擎
 * 负责重力、碰撞检测、运动模拟等物理效果
 */

class PhysicsEngine {
    constructor() {
        this.gravity = CONSTANTS.GRAVITY;
        this.friction = CONSTANTS.FRICTION;
        this.bounciness = CONSTANTS.BOUNCINESS;
        this.groundY = CONSTANTS.GROUND_Y;
    }

    /**
     * 更新积木块的物理状态
     */
    updateBlock(block, deltaTime) {
        // Static blocks don't move
        if (block.isStatic) return;

        // 应用重力
        block.vy += this.gravity;

        // 应用摩擦力
        block.vx *= this.friction;
        block.vy *= this.friction;

        // 更新位置
        block.x += block.vx;
        block.y += block.vy;

        // 地面碰撞检测
        if (block.y + block.height > this.groundY) {
            block.y = this.groundY - block.height;
            block.vy *= -this.bounciness;
            
            // 如果速度很小，就停止
            if (Math.abs(block.vy) < 1) {
                block.vy = 0;
            }
        }

        // 墙壁碰撞检测
        if (block.x < 0) {
            block.x = 0;
            block.vx *= -this.bounciness;
        }
        
        const canvasWidth = CONSTANTS.CANVAS_WIDTH;
        if (block.x + block.width > canvasWidth) {
            block.x = canvasWidth - block.width;
            block.vx *= -this.bounciness;
        }

        // 旋转模拟（简化版）
        if (block.vx !== 0 || block.vy !== 0) {
            block.rotation += block.vx * 0.05;
        }
    }

    /**
     * 更新投射物的物理状态
     */
    updateProjectile(projectile, deltaTime) {
        // 无重力，直线飞行

        // 更新位置
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;

        // 记录拖尾
        projectile.trail.push({ x: projectile.x, y: projectile.y });
        if (projectile.trail.length > projectile.maxTrailLength) {
            projectile.trail.shift();
        }

        // 边界检测
        if (projectile.y > CONSTANTS.GROUND_Y || 
            projectile.x < 0 || 
            projectile.x > CONSTANTS.CANVAS_WIDTH) {
            return false; // 需要移除
        }
        
        return true; // 继续存在
    }

    /**
     * 更新粒子物理状态
     */
    updateParticle(particle, deltaTime) {
        // 应用重力
        particle.vy += 0.3;

        // 应用空气阻力
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 生命衰减
        particle.life -= particle.decayRate;

        // 地面碰撞
        if (particle.y > CONSTANTS.GROUND_Y) {
            particle.y = CONSTANTS.GROUND_Y;
            particle.vy *= -0.5;
        }

        return particle.life > 0;
    }

    /**
     * 矩形碰撞检测 (AABB)
     */
    checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * 圆形与矩形碰撞检测
     */
    checkCircleRectCollision(circle, rect) {
        // 找到矩形上离圆心最近的点
        const closestX = Helpers.clamp(circle.x, rect.x, rect.x + rect.width);
        const closestY = Helpers.clamp(circle.y, rect.y, rect.y + rect.height);

        // 计算距离
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        const distanceSquared = distanceX ** 2 + distanceY ** 2;

        return distanceSquared < circle.radius ** 2;
    }

    /**
     * 矩形与矩形碰撞检测（带速度传递）
     */
    resolveBlockCollision(block1, block2) {
        if (!this.checkRectCollision(block1, block2)) {
            return false;
        }

        // 计算重叠量
        const overlapX = Math.min(
            block1.x + block1.width - block2.x,
            block2.x + block2.width - block1.x
        );
        
        const overlapY = Math.min(
            block1.y + block1.height - block2.y,
            block2.y + block2.height - block1.y
        );

        // 根据较小的重叠方向进行响应
        if (overlapX < overlapY) {
            // 水平碰撞
            const pushOut = block1.x < block2.x ? -overlapX : overlapX;
            block1.x += pushOut * 0.5;
            block2.x -= pushOut * 0.5;
            
            // 交换部分水平速度
            const tempVx = block1.vx;
            block1.vx = block2.vx * 0.5;
            block2.vx = tempVx * 0.5;
        } else {
            // 垂直碰撞
            const pushOut = block1.y < block2.y ? -overlapY : overlapY;
            block1.y += pushOut * 0.5;
            block2.y -= pushOut * 0.5;
            
            // 交换部分垂直速度
            const tempVy = block1.vy;
            block1.vy = block2.vy * 0.5;
            block2.vy = tempVy * 0.5;
        }

        return true;
    }

    /**
     * 检查积木块之间的连接稳定性
     */
    checkBlockSupport(blocks, block) {
        // 检查是否有其他块支撑当前块
        for (const other of blocks) {
            if (other === block) continue;

            // 检查是否在下方且有接触
            const isBelow = other.y >= block.y + block.height - 5;
            const hasHorizontalOverlap = 
                block.x + block.width > other.x &&
                block.x < other.x + other.width;

            if (isBelow && hasHorizontalOverlap) {
                return true;
            }
        }

        // 检查是否在地面上
        if (block.y + block.height >= CONSTANTS.GROUND_Y - 1) {
            return true;
        }

        return false;
    }

    /**
     * 应用爆炸力到周围的积木块
     */
    applyExplosion(blocks, explosionX, explosionY, force, radius) {
        for (const block of blocks) {
            const dx = block.x + block.width / 2 - explosionX;
            const dy = block.y + block.height / 2 - explosionY;
            const distance = Math.sqrt(dx ** 2 + dy ** 2);

            if (distance < radius) {
                // Make block dynamic when hit by explosion
                block.isStatic = false;

                // 计算冲击力（距离越近力越大）
                const impact = force * (1 - distance / radius);

                // 应用力向量
                block.vx += (dx / distance) * impact;
                block.vy += (dy / distance) * impact;
            }
        }
    }
}
