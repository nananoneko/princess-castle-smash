/**
 * 城堡生成器
 * 负责生成不同难度和布局的城堡
 */

class CastleGenerator {
    constructor() {
        this.blockSize = 40;
        this.spacing = 4; // 积木间距
    }

    /**
     * 生成指定关卡的城堡
     */
    generateCastle(level, canvasWidth = CONSTANTS.CANVAS_WIDTH) {
        const blocks = [];
        const centerX = canvasWidth / 2 - this.blockSize / 2;
        const startY = 10; // 从最顶部开始（距离顶部 10 像素）

        switch (level) {
            case 1:
                // 简单金字塔（3 层）- 生成在屏幕最上方
                this.generatePyramid(blocks, centerX, startY, 3);
                break;
                
            case 2:
                // 中等城堡（4 层）
                this.generatePyramid(blocks, centerX, startY, 4);
                break;
                
            case 3:
                // 复杂城堡（混合类型）
                this.generateMixedCastle(blocks, centerX, startY);
                break;
                
            default:
                // 随机生成更高层数的城堡
                const rows = Math.min(3 + Math.floor((level - 1) / 2), 8);
                this.generateRandomCastle(blocks, centerX, startY, rows);
                break;
        }

        return blocks;
    }

    /**
     * 生成金字塔结构（倒三角形，从上往下生成）
     */
    generatePyramid(blocks, centerX, startY, rows) {
        const blockSize = this.blockSize + this.spacing;
        
        // 第一层（最上面）：1 个金块
        blocks.push(new Block(centerX - blockSize/2, startY + 0 * blockSize, 'gold'));
        
        if (rows >= 2) {
            // 第二层：2 个木块
            for (let i = 0; i < 2; i++) {
                const x = centerX - blockSize + i * blockSize;
                const y = startY + 1 * blockSize;
                blocks.push(new Block(x, y, 'wood'));
            }
        }
        
        if (rows >= 3) {
            // 第三层：3 个木块
            for (let i = 0; i < 3; i++) {
                const x = centerX - blockSize * 1.5 + i * blockSize;
                const y = startY + 2 * blockSize;
                blocks.push(new Block(x, y, 'wood'));
            }
        }
        
        if (rows >= 4) {
            // 第四层：4 个木块
            for (let i = 0; i < 4; i++) {
                const x = centerX - blockSize * 2 + i * blockSize;
                const y = startY + 3 * blockSize;
                blocks.push(new Block(x, y, 'wood'));
            }
        }
    }


    /**
     * 生成混合城堡（从上往下）
     */
    generateMixedCastle(blocks, centerX, startY) {
        const blockSize = this.blockSize + this.spacing;
        
        // 第 1 层：1 个金块（最上面）
        blocks.push(new Block(centerX - blockSize/2, startY, 'gold'));
        
        // 第 2 层：2 个玻璃块
        for (let i = 0; i < 2; i++) {
            const x = centerX - blockSize + i * blockSize;
            blocks.push(new Block(x, startY + blockSize, 'glass'));
        }
        
        // 第 3 层：3 个木块
        for (let i = 0; i < 3; i++) {
            const x = centerX - blockSize * 1.5 + i * blockSize;
            blocks.push(new Block(x, startY + 2 * blockSize, 'wood'));
        }
        
        // 第 4 层：4 个石块
        for (let i = 0; i < 4; i++) {
            const x = centerX - blockSize * 2 + i * blockSize;
            blocks.push(new Block(x, startY + 3 * blockSize, 'stone'));
        }
    }

    /**
     * 生成随机城堡（从上往下，支持无限关卡）
     */
    generateRandomCastle(blocks, centerX, startY, rows) {
        const blockSize = this.blockSize + this.spacing;
        const types = ['wood', 'wood', 'wood', 'stone', 'glass'];
        
        for (let row = 0; row < rows; row++) {
            const cols = Math.min(row + 1, 6); // 最多 6 列
            const rowWidth = cols * blockSize;
            const startX = centerX - rowWidth / 2 + blockSize / 2;
            
            for (let col = 0; col < cols; col++) {
                const x = startX + col * blockSize;
                const y = startY + row * blockSize;
                
                // 随机选择类型
                const rand = Math.random();
                let type;
                
                if (row === 0 && rand > 0.7) {
                    type = 'gold';
                } else if (row < 2 && rand > 0.5) {
                    type = 'stone';
                } else if (rand > 0.8) {
                    type = 'glass';
                } else {
                    type = 'wood';
                }
                
                blocks.push(new Block(x, y, type));
            }
        }
    }


    /**
     * 生成特殊挑战关卡
     */
    generateChallengeCastle(type, canvasWidth) {
        const blocks = [];
        const centerX = canvasWidth / 2 - this.blockSize / 2;
        const startY = 80;
        
        switch (type) {
            case 'tower':
                // 高塔
                for (let row = 0; row < 10; row++) {
                    blocks.push(new Block(centerX, startY + row * 44, 'stone'));
                }
                break;
                
            case 'bridge':
                // 桥梁结构
                // 两个柱子
                for (let row = 0; row < 6; row++) {
                    blocks.push(new Block(centerX - 60, startY + row * 44, 'stone'));
                    blocks.push(new Block(centerX + 60, startY + row * 44, 'stone'));
                }
                // 桥面
                for (let i = -2; i <= 2; i++) {
                    blocks.push(new Block(centerX + i * 44, startY + 6 * 44, 'wood'));
                }
                break;
                
            case 'stairs':
                // 楼梯
                for (let row = 0; row < 6; row++) {
                    for (let col = 0; col <= row; col++) {
                        const x = centerX - 100 + col * 44;
                        blocks.push(new Block(x, startY + row * 44, 'wood'));
                    }
                }
                break;
        }
        
        return blocks;
    }
}
