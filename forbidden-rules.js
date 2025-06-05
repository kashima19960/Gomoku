// 五子棋禁手规则检测模块
class ForbiddenRules {
    constructor() {
        this.BOARD_SIZE = 15;
        this.EMPTY = 0;
        this.BLACK = 1;
        this.WHITE = 2;
        
        // 方向向量：横、竖、主对角线、副对角线
        this.DIRECTIONS = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 主对角线
            [1, -1]   // 副对角线
        ];
        
        // 性能优化：缓存已计算的结果
        this.cache = new Map();
        this.cacheSize = 0;
        this.maxCacheSize = 1000;
    }
      /**
     * 检查指定位置是否是禁手
     * @param {Array} board - 棋盘状态
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {number} color - 棋子颜色
     * @returns {Object} 禁手检测结果
     */
    checkForbiddenMove(board, row, col, color) {
        // 禁手规则仅适用于黑棋（先手）
        if (color !== this.BLACK) {
            return { isForbidden: false, reason: null };
        }
        
        // 生成缓存键
        const cacheKey = this.generateCacheKey(board, row, col, color);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        // 创建临时棋盘，放置棋子
        const tempBoard = this.copyBoard(board);
        tempBoard[row][col] = color;
        
        // 检查是否形成五连（五连优先，不算禁手）
        if (this.checkWin(tempBoard, row, col, color)) {
            const result = { isForbidden: false, reason: null };
            this.cacheResult(cacheKey, result);
            return result;
        }
        
        // 检查长连禁手（六子或以上）
        const longConnection = this.checkLongConnection(tempBoard, row, col, color);
        if (longConnection.hasLongConnection) {
            const result = { 
                isForbidden: true, 
                reason: 'long_connection',
                description: `长连禁手：${longConnection.length}子连线`,
                direction: longConnection.direction
            };
            this.cacheResult(cacheKey, result);
            return result;
        }
        
        // 检查双四禁手
        const doubleFour = this.checkDoubleFour(tempBoard, row, col, color);
        if (doubleFour.hasDoubleFour) {
            const result = { 
                isForbidden: true, 
                reason: 'double_four',
                description: '双四禁手：同时形成两个四',
                patterns: doubleFour.patterns
            };
            this.cacheResult(cacheKey, result);
            return result;
        }
        
        // 检查双活三禁手
        const doubleThree = this.checkDoubleThree(tempBoard, row, col, color);
        if (doubleThree.hasDoubleThree) {
            const result = { 
                isForbidden: true, 
                reason: 'double_three',
                description: '双活三禁手：同时形成两个活三',
                patterns: doubleThree.patterns
            };
            this.cacheResult(cacheKey, result);
            return result;
        }
        
        const result = { isForbidden: false, reason: null };
        this.cacheResult(cacheKey, result);
        return result;
    }
    
    /**
     * 生成缓存键
     */
    generateCacheKey(board, row, col, color) {
        // 只考虑当前位置周围5x5范围的棋盘状态
        let key = `${row},${col},${color}:`;
        for (let r = Math.max(0, row - 2); r <= Math.min(this.BOARD_SIZE - 1, row + 2); r++) {
            for (let c = Math.max(0, col - 2); c <= Math.min(this.BOARD_SIZE - 1, col + 2); c++) {
                key += board[r][c];
            }
        }
        return key;
    }
    
    /**
     * 缓存结果
     */
    cacheResult(key, result) {
        if (this.cacheSize >= this.maxCacheSize) {
            // 清理一半缓存
            const keysToDelete = Array.from(this.cache.keys()).slice(0, this.maxCacheSize / 2);
            keysToDelete.forEach(k => this.cache.delete(k));
            this.cacheSize -= keysToDelete.length;
        }
        
        this.cache.set(key, result);
        this.cacheSize++;
    }
    
    /**
     * 清理缓存
     */
    clearCache() {
        this.cache.clear();
        this.cacheSize = 0;
    }
    
    /**
     * 检查长连禁手（六子或以上连线）
     */
    checkLongConnection(board, row, col, color) {
        for (const [dx, dy] of this.DIRECTIONS) {
            let count = 1; // 包含当前位置
            
            // 正方向计数
            let r = row + dx, c = col + dy;
            while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && board[r][c] === color) {
                count++;
                r += dx;
                c += dy;
            }
            
            // 反方向计数
            r = row - dx;
            c = col - dy;
            while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && board[r][c] === color) {
                count++;
                r -= dx;
                c -= dy;
            }
            
            if (count >= 6) {
                return { 
                    hasLongConnection: true, 
                    length: count, 
                    direction: [dx, dy] 
                };
            }
        }
        
        return { hasLongConnection: false };
    }
    
    /**
     * 检查双四禁手
     */
    checkDoubleFour(board, row, col, color) {
        const fourPatterns = [];
        
        for (const [dx, dy] of this.DIRECTIONS) {
            const pattern = this.analyzeLine(board, row, col, dx, dy, color);
            if (pattern.isFour) {
                fourPatterns.push({
                    direction: [dx, dy],
                    type: pattern.isLiveFour ? 'live' : 'dead',
                    pattern: pattern
                });
            }
        }
        
        return {
            hasDoubleFour: fourPatterns.length >= 2,
            patterns: fourPatterns
        };
    }
    
    /**
     * 检查双活三禁手
     */
    checkDoubleThree(board, row, col, color) {
        const liveThreePatterns = [];
        
        for (const [dx, dy] of this.DIRECTIONS) {
            const pattern = this.analyzeLine(board, row, col, dx, dy, color);
            if (pattern.isLiveThree) {
                liveThreePatterns.push({
                    direction: [dx, dy],
                    pattern: pattern
                });
            }
        }
        
        return {
            hasDoubleThree: liveThreePatterns.length >= 2,
            patterns: liveThreePatterns
        };
    }
    
    /**
     * 分析指定方向的棋型
     */
    analyzeLine(board, row, col, dx, dy, color) {
        // 获取该方向上的棋子序列
        const sequence = this.getSequence(board, row, col, dx, dy, color);
        
        // 分析棋型
        return this.analyzePattern(sequence, color);
    }
    
    /**
     * 获取指定方向上的棋子序列
     */
    getSequence(board, row, col, dx, dy, color) {
        const sequence = [];
        
        // 向前扫描5个位置
        for (let i = -4; i <= 4; i++) {
            const r = row + i * dx;
            const c = col + i * dy;
            
            if (r < 0 || r >= this.BOARD_SIZE || c < 0 || c >= this.BOARD_SIZE) {
                sequence.push('WALL'); // 边界
            } else if (board[r][c] === color) {
                sequence.push('SELF'); // 己方棋子
            } else if (board[r][c] === this.EMPTY) {
                sequence.push('EMPTY'); // 空位
            } else {
                sequence.push('ENEMY'); // 对方棋子
            }
        }
        
        return sequence;
    }    /**
     * 分析棋型模式
     */
    analyzePattern(sequence, color) {
        const pattern = sequence.join('');
        
        // 将模式转换为更容易分析的格式
        const simplified = pattern
            .replace(/SELF/g, 'O')
            .replace(/EMPTY/g, '_')
            .replace(/(ENEMY|WALL)/g, 'X');
        
        const result = {
            sequence: simplified,
            isFive: false,
            isFour: false,
            isLiveFour: false,
            isDeadFour: false,
            isThree: false,
            isLiveThree: false,
            isDeadThree: false
        };
        
        // 连五检测
        if (simplified.includes('OOOOO')) {
            result.isFive = true;
            return result;
        }
        
        // 活四检测：_OOOO_
        if (this.hasPattern(simplified, '_OOOO_')) {
            result.isFour = true;
            result.isLiveFour = true;
            return result;
        }
        
        // 死四检测：更精确的检测
        const deadFourPatterns = [
            'XOOOO_', '_OOOOX',  // 一端被堵的四
            'OOO_O', 'O_OOO',    // 中间有洞的四
            'OO_OO'              // 中间隔一的四
        ];
        
        for (const deadPattern of deadFourPatterns) {
            if (this.hasPattern(simplified, deadPattern)) {
                result.isFour = true;
                result.isDeadFour = true;
                return result;
            }
        }
        
        // 活三检测：能够形成两个四的三
        if (this.isLiveThreePattern(simplified)) {
            result.isThree = true;
            result.isLiveThree = true;
            return result;
        }
        
        // 死三检测
        const deadThreePatterns = [
            'XOOO_', '_OOOX',    // 一端被堵的三
            'XOO_O_', '_O_OOX',  // 跳三但一端被堵
            'OO_O', 'O_OO'       // 简单的跳三
        ];
        
        for (const deadPattern of deadThreePatterns) {
            if (this.hasPattern(simplified, deadPattern)) {
                result.isThree = true;
                result.isDeadThree = true;
                return result;
            }
        }
        
        return result;
    }
    
    /**
     * 检查是否有指定模式
     */
    hasPattern(sequence, pattern) {
        return sequence.includes(pattern);
    }
    
    /**
     * 检查是否是活三模式
     */
    isLiveThreePattern(sequence) {
        // 活三的定义：能够在下一步形成两个四的三
        const liveThreePatterns = [
            '_OOO__',   // 标准活三
            '__OOO_',   // 标准活三（反向）
            '_O_OO_',   // 跳活三1
            '_OO_O_'    // 跳活三2
        ];
        
        for (const pattern of liveThreePatterns) {
            if (this.hasPattern(sequence, pattern)) {
                // 验证是否真的能形成活四
                if (this.canFormMultipleFours(sequence, pattern)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * 检查是否能形成多个四
     */
    canFormMultipleFours(sequence, threePattern) {
        const index = sequence.indexOf(threePattern);
        if (index === -1) return false;
        
        // 检查在不同位置下子是否能形成四
        let possibleFours = 0;
        
        // 对于标准活三 _OOO__
        if (threePattern === '_OOO__') {
            // 检查左侧和右侧第一个空位
            if (index > 0 && sequence[index - 1] === '_') possibleFours++;
            if (index + 5 < sequence.length && sequence[index + 4] === '_') possibleFours++;
        }
        // 对于跳活三 _O_OO_
        else if (threePattern === '_O_OO_') {
            // 检查中间空位和两端
            if (index > 0 && sequence[index - 1] === '_') possibleFours++;
            if (index + 6 < sequence.length && sequence[index + 5] === '_') possibleFours++;
            // 中间的空位也能形成四
            possibleFours++;
        }
        // 对于跳活三 _OO_O_
        else if (threePattern === '_OO_O_') {
            // 检查中间空位和两端
            if (index > 0 && sequence[index - 1] === '_') possibleFours++;
            if (index + 6 < sequence.length && sequence[index + 5] === '_') possibleFours++;
            // 中间的空位也能形成四
            possibleFours++;
        }
        
        return possibleFours >= 2;
    }
      /**
     * 检查五连获胜
     */
    checkWin(board, row, col, color) {
        for (const [dx, dy] of this.DIRECTIONS) {
            let count = 1;
            
            // 正方向计数
            let r = row + dx, c = col + dy;
            while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && board[r][c] === color) {
                count++;
                r += dx;
                c += dy;
            }
            
            // 反方向计数
            r = row - dx;
            c = col - dy;
            while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && board[r][c] === color) {
                count++;
                r -= dx;
                c -= dy;
            }
            
            if (count === 5) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 复制棋盘
     */
    copyBoard(board) {
        return board.map(row => [...row]);
    }
    
    /**
     * 获取禁手规则说明
     */
    getRuleExplanation() {
        return {
            title: "五子棋禁手规则",
            description: "禁手规则仅适用于黑棋（先手），白棋不受限制",
            rules: [
                {
                    name: "长连禁手",
                    description: "黑棋不能形成六子或以上的连线",
                    example: "●●●●●● (六连或更多)"
                },
                {
                    name: "双四禁手", 
                    description: "黑棋不能同时形成两个四（包括活四和死四）",
                    example: "一步棋同时形成两个四的局面"
                },
                {
                    name: "双活三禁手",
                    description: "黑棋不能同时形成两个活三",
                    example: "一步棋同时形成两个活三的局面"
                }
            ],
            notes: [
                "如果黑棋同时形成五连和禁手，五连获胜（五最大）",
                "白棋可以自由下棋，不受任何禁手限制",
                "违反禁手规则的黑棋立即判负"
            ]
        };
    }
}
