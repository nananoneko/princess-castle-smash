/**
 * 游戏主循环
 * 负责管理游戏的更新和渲染周期
 */

class GameLoop {
    constructor() {
        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
        this.callback = null;
    }

    /**
     * 启动游戏循环
     */
    start(callback) {
        this.callback = callback;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    /**
     * 停止游戏循环
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * 暂停游戏循环
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * 恢复游戏循环
     */
    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.loop(this.lastTime);
        }
    }

    /**
     * 主循环函数
     */
    loop(timestamp) {
        if (!this.isRunning) return;

        // 计算时间差
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // 限制最大帧时间（防止卡顿后跳跃）
        const cappedDelta = Math.min(this.deltaTime, 100);

        // 执行回调（更新 + 渲染）
        if (this.callback) {
            this.callback(cappedDelta);
        }

        // 继续下一帧
        requestAnimationFrame((time) => this.loop(time));
    }

    /**
     * 获取当前 FPS
     */
    getFPS() {
        return Math.round(1000 / this.deltaTime);
    }
}
