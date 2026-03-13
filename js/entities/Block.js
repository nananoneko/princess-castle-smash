/**
 * 积木块类
 * 构成城堡的基本单元
 */

class Block {
    constructor(x, y, type = 'wood') {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.type = type;
        
        // 物理属性
        this.vx = 0;
        this.vy = 0;
        this.rotation = 0;
        this.mass = this.getMass();
        
        // 生命值和防御力
        this.health = this.getMaxHealth();
        this.maxHealth = this.health;
        
        // 状态
        this.isDestroyed = false;
        this.flashTime = 0;
        this.isStatic = true; // Blocks are static until hit

        // 连接状态（用于稳定性检测）
        this.connected = true;
    }

    /**
     * 获取类型对应的最大生命值
     */
    getMaxHealth() {
        const healthMap = {
            'wood': 10,      // 木块：1 击必碎
            'stone': 25,     // 石块：2-3 击
            'glass': 5,      // 玻璃：1 击必碎
            'gold': 40       // 金块：4 击左右
        };
        return healthMap[this.type] || 10;
    }

    /**
     * 获取类型对应的质量
     */
    getMass() {
        const massMap = {
            'wood': 1.0,
            'stone': 2.0,
            'glass': 0.5,
            'gold': 3.0
        };
        return massMap[this.type] || 1.0;
    }

    /**
     * 获取颜色
     */
    getColor() {
        const colorMap = {
            'wood': [CONSTANTS.COLORS.WOOD_LIGHT, CONSTANTS.COLORS.WOOD_DARK],
            'stone': [CONSTANTS.COLORS.STONE, '#696969'],
            'glass': [CONSTANTS.COLORS.GLASS, 'rgba(135, 206, 235, 0.3)'],
            'gold': [CONSTANTS.COLORS.GOLD, '#FFA500']
        };
        return colorMap[this.type] || colorMap['wood'];
    }

    /**
     * 承受伤害
     */
    takeDamage(amount) {
        this.isStatic = false; // Become dynamic when hit
        this.health -= amount;
        this.flashTime = 5; // 闪烁 5 帧

        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        return false;
    }

    /**
     * 销毁积木块
     */
    destroy() {
        this.isDestroyed = true;
    }

    /**
     * 更新积木块状态
     */
    update(deltaTime, physics) {
        if (physics) {
            physics.updateBlock(this, deltaTime);
        }
        
        // 减少闪烁时间
        if (this.flashTime > 0) {
            this.flashTime--;
        }
        
        // 检查是否掉出边界
        if (this.y > CONSTANTS.GROUND_Y + 100) {
            this.isDestroyed = true;
        }
    }

    /**
     * 绘制积木块
     */
    draw(ctx) {
        if (this.isDestroyed) return;
        
        ctx.save();
        
        // 使用整数坐标
        const drawX = Math.floor(this.x);
        const drawY = Math.floor(this.y);
        
        // 应用旋转（围绕中心）
        ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.translate(-this.width / 2, -this.height / 2);
        
        const colors = this.getColor();
        
        // 绘制主体
        ctx.fillStyle = this.flashTime > 0 ? '#FFFFFF' : colors[0];
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制边框/纹理
        ctx.strokeStyle = colors[1];
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, this.width, this.height);
        
        // 根据类型添加特殊效果
        if (this.type === 'wood') {
            // 木纹
            ctx.beginPath();
            ctx.moveTo(5, 10);
            ctx.lineTo(35, 10);
            ctx.moveTo(5, 20);
            ctx.lineTo(35, 20);
            ctx.moveTo(5, 30);
            ctx.lineTo(35, 30);
            ctx.strokeStyle = colors[1];
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (this.type === 'stone') {
            // 石纹
            ctx.fillStyle = colors[1];
            ctx.globalAlpha = 0.3;
            ctx.fillRect(5, 5, 10, 10);
            ctx.fillRect(25, 25, 10, 10);
            ctx.globalAlpha = 1.0;
        } else if (this.type === 'gold') {
            // 金光闪闪
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.3;
            ctx.beginPath();
            ctx.moveTo(10, 10);
            ctx.lineTo(20, 5);
            ctx.lineTo(30, 10);
            ctx.lineTo(20, 15);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;
        } else if (this.type === 'glass') {
            // 透明效果
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(5, 5, 15, 15);
            ctx.globalAlpha = 1.0;
        }
        
        // 绘制生命值指示（如果受伤）
        if (this.health < this.maxHealth) {
            const healthPercent = this.health / this.maxHealth;
            
            // 生命条背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, -8, this.width, 6);
            
            // 生命条
            ctx.fillStyle = healthPercent > 0.5 ? '#7CFC00' : '#FF4500';
            ctx.fillRect(2, -6, (this.width - 4) * healthPercent, 4);
        }
        
        ctx.restore();
    }

    /**
     * 获取碰撞矩形
     */
    getCollisionRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
