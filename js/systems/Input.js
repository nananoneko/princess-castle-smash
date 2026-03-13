/**
 * 输入处理系统
 * 处理鼠标、触摸和键盘输入
 */

class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.isMouseDown = false;
        this.lastClickTime = 0;
        
        // 绑定事件
        this.bindEvents();
    }

    /**
     * 绑定输入事件
     */
    bindEvents() {
        // 鼠标点击
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // 触摸
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // 键盘
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    /**
     * 获取画布坐标
     */
    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        // 使用逻辑尺寸而非 canvas.width（已乘以 DPR），避免坐标偏移
        const scaleX = CONSTANTS.CANVAS_WIDTH / rect.width;
        const scaleY = CONSTANTS.CANVAS_HEIGHT / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    /**
     * 处理鼠标按下
     */
    handleMouseDown(e) {
        if (e.button !== 0) return; // 只处理左键
        
        this.isMouseDown = true;
        const coords = this.getCanvasCoordinates(e);
        
        // 如果在游戏中，发射爱心
        if (this.game && this.game.state === 'playing') {
            this.shootHeart(coords.x, coords.y);
        }
    }

    /**
     * 处理鼠标释放
     */
    handleMouseUp(e) {
        this.isMouseDown = false;
    }

    /**
     * 处理触摸开始
     */
    handleTouchStart(e) {
        e.preventDefault();
        this.isMouseDown = true;
        
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = CONSTANTS.CANVAS_WIDTH / rect.width;
        const scaleY = CONSTANTS.CANVAS_HEIGHT / rect.height;

        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        // 如果在游戏中，发射爱心
        if (this.game && this.game.state === 'playing') {
            this.shootHeart(x, y);
        }
    }

    /**
     * 处理触摸结束
     */
    handleTouchEnd(e) {
        e.preventDefault();
        this.isMouseDown = false;
    }

    /**
     * 处理键盘按下
     */
    handleKeyDown(e) {
        if (!this.game) return;
        
        switch (e.code) {
            case 'Escape':
            case 'KeyP':
                // 暂停/继续
                if (this.game.state === 'playing') {
                    this.game.pause();
                } else if (this.game.state === 'paused') {
                    this.game.resume();
                }
                break;
                
            case 'Space':
                // 空格键发射（向正上方）
                if (this.game.state === 'playing' && this.game.princess) {
                    const center = this.game.princess.getCenter();
                    this.shootHeart(center.x, 100);
                }
                break;
                
            case 'KeyR':
                // 重新开始
                if (this.game.state === 'playing' || this.game.state === 'paused') {
                    this.game.restartLevel();
                }
                break;
        }
    }

    /**
     * 发射爱心
     */
    shootHeart(targetX, targetY) {
        if (!this.game || !this.game.princess) return;
        
        // 检查弹药是否耗尽
        if (this.game.shotsFired >= this.game.maxAmmo) {
            console.log('💀 弹药耗尽！');
            this.game.checkAmmoDepleted();
            return;
        }
        
        // 限制发射频率
        const now = Date.now();
        if (now - this.lastClickTime < 200) return;
        this.lastClickTime = now;
        
        // 增加射击计数
        this.game.shotsFired++;
        
        // 发射
        const projectile = this.game.princess.shoot(targetX, targetY);
        if (projectile) {
            this.game.projectiles.push(projectile);

            // Resume audio context on user interaction and play sound
            if (this.game.soundManager) {
                this.game.soundManager.resume();
                this.game.soundManager.playShootSound();
            }
            
            // 更新 UI
            this.game.updateUI();
        }
    }

    /**
     * 检查是否点击了 UI 元素
     */
    isClickOnUI(x, y) {
        // 简单的边界检查，可以根据需要扩展
        return false;
    }

    /**
     * 销毁输入处理器
     */
    destroy() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        window.removeEventListener('keydown', this.handleKeyDown);
    }
}
