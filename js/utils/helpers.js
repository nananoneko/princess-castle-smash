/**
 * 工具函数库
 */

const Helpers = {
    /**
     * 随机数生成
     */
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * 随机整数
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 限制数值范围
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * 计算两点距离
     */
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    /**
     * 角度转弧度
     */
    degToRad(degrees) {
        return degrees * Math.PI / 180;
    },

    /**
     * 弧度转角度
     */
    radToDeg(radians) {
        return radians * 180 / Math.PI;
    },

    /**
     * 线性插值
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * 映射数值范围
     */
    map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    /**
     * 检查矩形碰撞 (AABB)
     */
    checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    /**
     * 检查圆形与矩形碰撞
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
    },

    /**
     * 绘制像素风格矩形（带边框）
     */
    drawPixelRect(ctx, x, y, width, height, color, borderColor = null) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);

        if (borderColor) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
        }
    },

    /**
     * 绘制爱心形状
     */
    drawHeart(ctx, x, y, size, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = color;
        
        // 绘制爱心路径
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        
        // 左半部分
        ctx.moveTo(0, topCurveHeight);
        ctx.bezierCurveTo(
            0, 0,
            -size / 2, 0,
            -size / 2, topCurveHeight
        );
        ctx.bezierCurveTo(
            -size / 2, (size + topCurveHeight) / 2,
            0, size,
            0, size * 1.5
        );
        
        // 右半部分
        ctx.bezierCurveTo(
            0, size,
            size / 2, (size + topCurveHeight) / 2,
            size / 2, topCurveHeight
        );
        ctx.bezierCurveTo(
            size / 2, 0,
            0, 0,
            0, topCurveHeight
        );
        
        ctx.fill();
        ctx.restore();
    },

    /**
     * 绘制星星形状
     */
    drawStar(ctx, x, y, points, outerRadius, innerRadius, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = color;
        ctx.beginPath();

        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / points) * i - Math.PI / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }

        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    /**
     * 屏幕震动效果
     */
    shakeCanvas(canvas, duration, intensity) {
        const originalTransform = canvas.style.transform;
        let startTime = null;

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            if (elapsed < duration) {
                const offsetX = (Math.random() - 0.5) * intensity;
                const offsetY = (Math.random() - 0.5) * intensity;
                canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                requestAnimationFrame(animate);
            } else {
                canvas.style.transform = originalTransform;
            }
        }

        requestAnimationFrame(animate);
    }
};

// 全局常量
const CONSTANTS = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GROUND_Y: 570,  // 降低地面位置（从 550 改为 570），给城堡更多空间
    GRAVITY: 0.5,
    FRICTION: 0.99,
    BOUNCINESS: 0.3,
    
    // 颜色配置
    COLORS: {
        // 公主
        PRINCESS_DRESS: '#FFB6C1',
        PRINCESS_HAIR: '#FFD700',
        PRINCESS_SKIN: '#FFE4C4',
        PRINCESS_SHOES: '#8B4513',
        
        // 背景
        SKY_TOP: '#87CEEB',
        SKY_BOTTOM: '#DDA0DD',
        GRASS: '#7CFC00',
        
        // 积木
        WOOD_LIGHT: '#DEB887',
        WOOD_DARK: '#8B4513',
        STONE: '#808080',
        GLASS: 'rgba(135, 206, 235, 0.6)',
        GOLD: '#FFD700',
        
        // 特效
        HEART: '#FF69B4',
        HEART_TRAIL: '#FFB6C1',
        PARTICLE_SPARK: '#FFFFE0',
        PARTICLE_WOOD: '#DEB887',
        PARTICLE_STONE: '#808080'
    }
};
