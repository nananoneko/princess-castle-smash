/**
 * 公主角色类
 * 负责绘制和动画像素风格的公主
 */

class Princess {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 64;
        this.scale = 6; // 像素放大倍数
        
        // 动画状态
        this.frame = 0;
        this.frameCount = 0;
        this.state = 'idle'; // idle, aiming, shooting
        this.floatOffset = 0;
        
        // 像素画数据（8x8 网格）
        this.pixelArt = [
            [0,0,2,2,2,2,0,0],  // 皇冠
            [0,2,2,2,2,2,2,0],  // 头发
            [0,3,3,3,3,3,3,0],  // 脸
            [0,0,3,0,0,3,0,0],  // 眼睛
            [0,3,3,3,3,3,3,0],  // 身体
            [1,1,1,1,1,1,1,1],  // 裙子
            [0,1,1,1,1,1,1,0],  // 裙子
            [0,0,4,4,4,4,0,0],  // 脚
        ];
        
        this.colors = {
            1: CONSTANTS.COLORS.PRINCESS_DRESS,
            2: CONSTANTS.COLORS.PRINCESS_HAIR,
            3: CONSTANTS.COLORS.PRINCESS_SKIN,
            4: CONSTANTS.COLORS.PRINCESS_SHOES,
        };
    }

    /**
     * 更新公主状态
     */
    update(deltaTime) {
        // 待机动画：上下浮动
        this.floatOffset = Math.sin(Date.now() / 500) * 3;
        
        // 动画帧更新
        this.frameCount += deltaTime;
        if (this.frameCount > 200) {
            this.frameCount = 0;
            this.frame = (this.frame + 1) % 2;
        }
    }

    /**
     * 绘制公主
     */
    draw(ctx) {
        ctx.save();
        
        // 确保坐标是整数，避免亚像素渲染导致模糊
        const drawX = Math.floor(this.x);
        const drawY = Math.floor(this.y + this.floatOffset);
        
        // 绘制像素画
        this.pixelArt.forEach((row, rowIndex) => {
            row.forEach((pixel, colIndex) => {
                if (pixel !== 0) {
                    ctx.fillStyle = this.colors[pixel];
                    ctx.fillRect(
                        drawX + colIndex * this.scale,
                        drawY + rowIndex * this.scale,
                        this.scale,
                        this.scale
                    );
                }
            });
        });
        
        // 添加高光效果
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(drawX + 20, drawY + 10, 4, 4);
        ctx.globalAlpha = 1.0;
        
        ctx.restore();
    }

    /**
     * 发射爱心弹丸
     */
    shoot(targetX, targetY) {
        this.state = 'shooting';

        // 计算从公主头顶到目标的方向
        const startX = this.x + 24;
        const startY = this.y - 30;
        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 直线飞向目标，速度 15
        const speed = 15;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;

        return new HeartProjectile(startX, startY, vx, vy);
    }

    /**
     * 获取公主的中心位置
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }

    /**
     * 设置状态
     */
    setState(state) {
        this.state = state;
    }
}
