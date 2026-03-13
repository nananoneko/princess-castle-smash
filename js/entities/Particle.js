/**
 * 粒子类
 * 用于各种特效：爆炸、火花、碎片等
 */

class Particle {
    constructor(x, y, type = 'spark') {
        this.x = x;
        this.y = y;
        this.type = type;
        
        // 根据类型设置属性
        this.initProperties();
        
        // 生命值和衰减
        this.life = 1.0;
        this.decayRate = this.getRandomDecayRate();
        
        // 标记是否存活
        this.alive = true;
    }

    /**
     * 初始化属性
     */
    initProperties() {
        const configs = {
            'spark': {
                colors: ['#FFFFE0', '#FFD700', '#FFA500'],
                sizeRange: [2, 5],
                speedRange: [3, 8],
                decayRange: [0.02, 0.04]
            },
            'wood': {
                colors: [CONSTANTS.COLORS.WOOD_LIGHT, CONSTANTS.COLORS.WOOD_DARK],
                sizeRange: [3, 6],
                speedRange: [2, 5],
                decayRange: [0.015, 0.03]
            },
            'stone': {
                colors: ['#808080', '#696969', '#A9A9A9'],
                sizeRange: [4, 8],
                speedRange: [1, 4],
                decayRange: [0.01, 0.025]
            },
            'glass': {
                colors: ['rgba(135, 206, 235, 0.8)', 'rgba(175, 238, 238, 0.8)'],
                sizeRange: [2, 4],
                speedRange: [4, 10],
                decayRange: [0.02, 0.05]
            },
            'gold': {
                colors: ['#FFD700', '#FFA500', '#FFFF00'],
                sizeRange: [3, 7],
                speedRange: [2, 6],
                decayRange: [0.015, 0.035]
            },
            'heart': {
                colors: ['#FF69B4', '#FFB6C1', '#FF1493'],
                sizeRange: [4, 8],
                speedRange: [1, 3],
                decayRange: [0.01, 0.02]
            },
            'star': {
                colors: ['#FFD700', '#FFFF00', '#FFFACD'],
                sizeRange: [3, 6],
                speedRange: [2, 5],
                decayRange: [0.015, 0.03]
            }
        };

        const config = configs[this.type] || configs['spark'];
        
        // 随机选择颜色
        this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
        
        // 随机大小
        this.size = Helpers.random(config.sizeRange[0], config.sizeRange[1]);
        
        // 随机速度方向
        const angle = Math.random() * Math.PI * 2;
        const speed = Helpers.random(config.speedRange[0], config.speedRange[1]);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // 随机衰减率
        this.decayRate = Helpers.random(config.decayRange[0], config.decayRange[1]);
        
        // 旋转
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    /**
     * 获取随机衰减率
     */
    getRandomDecayRate() {
        return Helpers.random(0.01, 0.05);
    }

    /**
     * 更新粒子状态
     */
    update(deltaTime) {
        // 应用重力
        this.vy += 0.2;
        
        // 应用空气阻力
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        
        // 地面碰撞
        if (this.y > CONSTANTS.GROUND_Y) {
            this.y = CONSTANTS.GROUND_Y;
            this.vy *= -0.5;
            this.vx *= 0.8;
        }
        
        // 生命衰减
        this.life -= this.decayRate;
        
        // 死亡检测
        if (this.life <= 0) {
            this.alive = false;
        }
        
        // 旋转
        this.rotation += this.rotationSpeed;
    }

    /**
     * 绘制粒子
     */
    draw(ctx) {
        ctx.save();
        
        // 设置透明度
        ctx.globalAlpha = this.life;
        
        // 移动到粒子位置
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 根据类型绘制不同形状
        if (this.type === 'heart') {
            Helpers.drawHeart(ctx, 0, 0, this.size * 2, this.color);
        } else if (this.type === 'star') {
            Helpers.drawStar(ctx, 0, 0, 5, this.size, this.size / 2, this.color);
        } else {
            // 默认绘制矩形
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
        
        ctx.restore();
        ctx.globalAlpha = 1.0;
    }
}

/**
 * 粒子发射器
 * 批量生成和管理粒子
 */
class ParticleEmitter {
    constructor(maxParticles = 500) {
        this.particles = [];
        this.maxParticles = maxParticles;
    }

    /**
     * 发射粒子
     */
    emit(x, y, type, count = 10) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) {
                // 移除最老的粒子
                this.particles.shift();
            }
            this.particles.push(new Particle(x, y, type));
        }
    }

    /**
     * 爆炸效果
     */
    explode(x, y, types = ['spark', 'wood'], totalParticles = 20) {
        types.forEach(type => {
            const count = Math.floor(totalParticles / types.length);
            this.emit(x, y, type, count);
        });
    }

    /**
     * 更新所有粒子
     */
    update(deltaTime) {
        // 过滤掉死亡的粒子
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.alive;
        });
    }

    /**
     * 绘制所有粒子
     */
    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    /**
     * 清空所有粒子
     */
    clear() {
        this.particles = [];
    }

    /**
     * 获取粒子数量
     */
    getCount() {
        return this.particles.length;
    }
}
