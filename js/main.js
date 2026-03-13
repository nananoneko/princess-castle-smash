/**
 * 主游戏类
 * 整合所有系统，管理游戏状态和流程
 */

class Game {
    constructor() {
        // 核心组件
        this.canvas = document.getElementById('gameCanvas');
        this.gameLoop = new GameLoop();
        this.physics = new PhysicsEngine();
        this.renderer = new Renderer(this.canvas);
        this.soundManager = new SoundManager();
        
        // 游戏实体
        this.princess = null;
        this.projectiles = [];
        this.blocks = [];
        this.particleEmitter = new ParticleEmitter(500);
        
        // 系统
        this.inputHandler = null;
        this.castleGenerator = new CastleGenerator();
        
        // 游戏状态
        this.state = 'loading'; // loading, menu, playing, paused, levelComplete
        this.currentLevel = 1;
        this.score = 0;
        this.shotsFired = 0;
        this.blocksDestroyed = 0;
        
        // UI 元素
        this.uiElements = {};
        
        // 初始化
        this.init();
    }

    /**
     * 初始化游戏
     */
    async init() {
        // 设置画布尺寸（响应式）
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 缓存 UI 元素
        this.cacheUIElements();
        
        // 绑定 UI 事件
        this.bindUIEvents();
        
        // 初始化音效
        this.soundManager.init();
        
        // 创建输入处理器
        this.inputHandler = new InputHandler(this.canvas, this);
        
        // 显示主菜单
        this.showScreen('menu-screen');
        
        // 启动游戏循环
        this.gameLoop.start((deltaTime) => this.update(deltaTime));
        
        console.log('🎮 游戏初始化完成！');
    }

    /**
     * 调整画布尺寸
     */
    resizeCanvas() {
        const container = document.getElementById('game-container');

        // CSS 显示尺寸 = 逻辑尺寸（Canvas 内部已乘以 DPR）
        this.canvas.style.width = `${CONSTANTS.CANVAS_WIDTH}px`;
        this.canvas.style.height = `${CONSTANTS.CANVAS_HEIGHT}px`;

        // 如果容器太小，使用 transform 缩放
        const scaleX = container.clientWidth / CONSTANTS.CANVAS_WIDTH;
        const scaleY = container.clientHeight / CONSTANTS.CANVAS_HEIGHT;
        const scale = Math.min(scaleX, scaleY, 1);

        if (scale < 1) {
            this.canvas.style.transform = `scale(${scale})`;
            this.canvas.style.transformOrigin = 'center center';
        } else {
            this.canvas.style.transform = 'none';
        }
    }

    /**
     * 缓存 UI 元素
     */
    cacheUIElements() {
        this.uiElements = {
            menuScreen: document.getElementById('menu-screen'),
            gameUI: document.getElementById('game-ui'),
            pauseScreen: document.getElementById('pause-screen'),
            levelCompleteScreen: document.getElementById('level-complete-screen'),
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            menuBtn: document.getElementById('menu-btn'),
            nextLevelBtn: document.getElementById('next-level-btn'),
            levelDisplay: document.getElementById('level-display'),
            scoreDisplay: document.getElementById('score-display'),
            ammoDisplay: document.getElementById('ammo-display'),
            starDisplay: document.getElementById('star-display'),
            levelScore: document.getElementById('level-score'),
            completeLevel: document.getElementById('complete-level')
        };
    }

    /**
     * 绑定 UI 事件
     */
    bindUIEvents() {
        this.uiElements.startBtn.addEventListener('click', () => this.startGame());
        this.uiElements.pauseBtn.addEventListener('click', () => this.pause());
        this.uiElements.resumeBtn.addEventListener('click', () => this.resume());
        this.uiElements.restartBtn.addEventListener('click', () => this.restartLevel());
        this.uiElements.menuBtn.addEventListener('click', () => this.showMenu());
        this.uiElements.nextLevelBtn.addEventListener('click', () => this.nextLevel());
    }

    /**
     * 更新游戏状态
     */
    update(deltaTime) {
        // 始终渲染画面（包括菜单）
        this.render();
        
        if (this.state !== 'playing') return;
        
        // 更新公主
        if (this.princess) {
            this.princess.update(deltaTime);
        }
        
        // 更新投射物
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime, this.physics);
            
            // 检测碰撞
            this.checkProjectileCollisions(projectile);
            
            return projectile.alive;
        });
        
        // 更新积木块
        this.blocks.forEach(block => block.update(deltaTime, this.physics));
        
        // 检测积木块之间的碰撞
        this.checkBlockCollisions();
        
        // 移除被摧毁的积木块
        const destroyedBlocks = this.blocks.filter(b => b.isDestroyed);
        this.blocks = this.blocks.filter(b => !b.isDestroyed);
        
        // 处理被摧毁的积木块
        destroyedBlocks.forEach(block => {
            this.onBlockDestroyed(block);
        });
        
        // 更新粒子
        this.particleEmitter.update(deltaTime);
        
        // 检查关卡完成
        this.checkLevelComplete();
    }

    /**
     * 检测投射物碰撞
     */
    checkProjectileCollisions(projectile) {
        const circle = projectile.getCollisionCircle();

        for (const block of this.blocks) {
            if (this.physics.checkCircleRectCollision(circle, block.getCollisionRect())) {
                // 击中积木块 - 增加伤害到 35（确保一击必碎大部分方块）
                const damage = 35;
                const destroyed = block.takeDamage(damage);
                
                // 生成更多粒子特效
                this.particleEmitter.emit(
                    projectile.x,
                    projectile.y,
                    'heart',
                    8
                );
                
                // 添加冲击力 - 让附近的方块也被震飞
                this.physics.applyExplosion(
                    this.blocks,
                    projectile.x,
                    projectile.y,
                    3,      // 力度
                    80      // 爆炸半径
                );
                
                // 播放音效
                this.soundManager.playHitSound(block.type);
                
                // 标记投射物死亡
                projectile.onHit();
                
                break;
            }
        }
    }

    /**
     * 检测积木块碰撞
     */
    checkBlockCollisions() {
        for (let i = 0; i < this.blocks.length; i++) {
            for (let j = i + 1; j < this.blocks.length; j++) {
                const block1 = this.blocks[i];
                const block2 = this.blocks[j];
                
                if (this.physics.checkRectCollision(
                    block1.getCollisionRect(),
                    block2.getCollisionRect()
                )) {
                    this.physics.resolveBlockCollision(block1, block2);
                }
            }
        }
    }

    /**
     * 积木块被摧毁时调用
     */
    onBlockDestroyed(block) {
        this.blocksDestroyed++;
        this.score += this.getBlockScore(block.type);
        
        // 生成粒子爆炸
        const particleType = block.type === 'gold' ? 'gold' : 
                            block.type === 'glass' ? 'glass' : 
                            block.type === 'stone' ? 'stone' : 'wood';
        
        this.particleEmitter.explode(
            block.x + block.width / 2,
            block.y + block.height / 2,
            [particleType, 'spark'],
            15
        );
        
        // 播放破碎音效
        this.soundManager.playBreakSound(block.type);
        
        // 相机震动
        if (block.type === 'stone' || block.type === 'gold') {
            this.renderer.shake(8, 15);
        }
        
        // 更新 UI
        this.updateUI();
    }

    /**
     * 获取积木块分数
     */
    getBlockScore(type) {
        const scores = {
            'wood': 10,
            'stone': 20,
            'glass': 15,
            'gold': 50
        };
        return scores[type] || 10;
    }

    /**
     * 检查关卡完成
     */
    checkLevelComplete() {
        if (this.blocks.length === 0) {
            this.levelComplete();
        }
    }

    /**
     * 开始游戏
     */
    startGame() {
        // Resume audio context on first user interaction (required by browsers)
        this.soundManager.resume();
        this.currentLevel = 1;
        this.score = 0;
        this.startLevel(this.currentLevel);
    }

    /**
     * 开始关卡
     */
    startLevel(levelNum) {
        this.currentLevel = levelNum;
        this.shotsFired = 0;
        this.blocksDestroyed = 0;
        
        // 创建公主（固定在底部中央）
        this.princess = new Princess(
            CONSTANTS.CANVAS_WIDTH / 2 - 24,
            CONSTANTS.GROUND_Y - 64
        );
        
        // 生成城堡 - 根据关卡数决定难度
        let castle;
        if (levelNum <= 3) {
            // 前 3 关：固定金字塔
            castle = this.castleGenerator.generateCastle(levelNum, CONSTANTS.CANVAS_WIDTH);
        } else if (levelNum === 4) {
            // 第 4 关：混合城堡
            castle = this.castleGenerator.generateMixedCastle(CONSTANTS.CANVAS_WIDTH / 2 - 20, 20);
        } else {
            // 第 5 关及以后：随机生成更高层数的城堡（无限关卡）
            const rows = Math.min(3 + Math.floor((levelNum - 1) / 2), 10); // 最多 10 层
            castle = [];
            this.castleGenerator.generateRandomCastle(castle, CONSTANTS.CANVAS_WIDTH / 2 - 20, 20, rows);
        }
        this.blocks = castle;
        
        // 计算本关最大弹药数（方块数量 + 容错）
        const blockCount = this.blocks.length;
        const tolerance = this.calculateTolerance(levelNum); // 计算容错率
        this.maxAmmo = Math.ceil(blockCount * (1 + tolerance));
        this.maxAmmo = Math.max(this.maxAmmo, blockCount + 1); // 至少比方块数多 1
        
        // 清空投射物和粒子
        this.projectiles = [];
        this.particleEmitter.clear();
        
        // 更新 UI
        this.updateUI();
        
        // 切换到游戏界面
        this.state = 'playing';
        this.showScreen('game-ui');
        
        console.log(`🏰 第 ${levelNum} 关开始！方块数：${blockCount}, 弹药：${this.maxAmmo}, 容错：${(tolerance * 100).toFixed(0)}%`);
    }

    /**
     * 计算关卡容错率（关卡越高容错越低）
     */
    calculateTolerance(levelNum) {
        // 第1关 +20%，第2关 +19%，第3关 +18%...第21关 0%，之后保持 0%
        const tolerance = Math.max(0, 0.21 - levelNum * 0.01);
        return tolerance;
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.gameLoop.pause();
            this.showScreen('pause-screen');
        }
    }

    /**
     * 继续游戏
     */
    resume() {
        if (this.state === 'paused') {
            this.state = 'playing';
            this.gameLoop.resume();
            this.showScreen('game-ui');
            this.soundManager.resume();
        }
    }

    /**
     * 重新开始关卡
     */
    restartLevel() {
        this.startLevel(this.currentLevel);
    }

    /**
     * 下一关
     */
    nextLevel() {
        this.startLevel(this.currentLevel + 1);
    }

    /**
     * 关卡完成
     */
    levelComplete() {
        this.state = 'levelComplete';
        
        // 计算星级评价
        const stars = this.calculateStars();
        
        // 播放胜利音效
        this.soundManager.playVictorySound();
        
        // 更新 UI
        this.uiElements.levelScore.textContent = this.score;
        if (this.uiElements.completeLevel) {
            this.uiElements.completeLevel.textContent = this.currentLevel;
        }
        this.updateStarDisplay(stars);
        
        // 显示完成界面
        setTimeout(() => {
            this.showScreen('level-complete-screen');
        }, 500);
    }

    /**
     * 计算星级评价
     */
    calculateStars() {
        // 根据射击次数和剩余积木计算
        const accuracy = this.blocksDestroyed / Math.max(1, this.shotsFired);
        
        if (accuracy > 0.8) return 3;
        if (accuracy > 0.5) return 2;
        return 1;
    }

    /**
     * 更新星星显示
     */
    updateStarDisplay(stars) {
        const starElements = this.uiElements.starDisplay.querySelectorAll('.star');
        starElements.forEach((el, index) => {
            el.style.opacity = index < stars ? '1' : '0.3';
        });
    }

    /**
     * 显示主菜单
     */
    showMenu() {
        this.state = 'menu';
        this.showScreen('menu-screen');
    }

    /**
     * 显示指定屏幕
     */
    showScreen(screenId) {
        // 隐藏所有屏幕
        Object.values(this.uiElements).forEach(el => {
            if (el && el.classList.contains('screen')) {
                el.classList.remove('active');
            }
        });
        
        // 显示目标屏幕
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    }

    /**
     * 更新 UI
     */
    updateUI() {
        if (this.uiElements.levelDisplay) {
            this.uiElements.levelDisplay.textContent = this.currentLevel;
        }
        if (this.uiElements.scoreDisplay) {
            this.uiElements.scoreDisplay.textContent = this.score;
        }
        if (this.uiElements.ammoDisplay) {
            // 显示剩余弹药
            const remaining = Math.max(0, this.maxAmmo - this.shotsFired);
            this.uiElements.ammoDisplay.textContent = remaining;
            
            // 低弹药警告色
            if (remaining <= 3) {
                this.uiElements.ammoDisplay.style.color = '#FF4500';
            } else {
                this.uiElements.ammoDisplay.style.color = '#FFD700';
            }
        }
    }

    /**
     * 检查弹药耗尽
     */
    checkAmmoDepleted() {
        // 如果还有方块剩余，游戏结束
        if (this.blocks.length > 0) {
            this.gameOver();
        }
    }

    /**
     * 游戏结束
     */
    gameOver() {
        this.state = 'gameOver';
        
        // 播放失败音效（可选）
        
        alert(`💀 弹药耗尽！\n\n当前关卡：${this.currentLevel}\n得分：${this.score}\n\n点击确定重新开始`);
        
        this.restartLevel();
    }

    /**
     * 渲染游戏画面
     */
    render() {
        this.renderer.beginRender();
        
        // 绘制背景
        this.renderer.drawBackground();
        
        // 绘制游戏实体
        this.renderer.drawBlocks(this.blocks);
        this.renderer.drawPrincess(this.princess);
        this.renderer.drawProjectiles(this.projectiles);
        this.renderer.drawParticles(this.particleEmitter);
        
        // 绘制 UI
        this.renderer.drawUI(this);
        
        this.renderer.endRender();
        
        // 绘制调试信息（可选）
        // this.renderer.drawDebugInfo(
        //     this.gameLoop.getFPS(),
        //     this.blocks.length,
        //     this.particleEmitter.getCount()
        // );
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    
    // 将 game 对象暴露给全局作用域以便调试
    window.game = game;
});
