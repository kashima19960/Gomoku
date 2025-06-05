// AI算法模块
class GomokuAI {
    constructor() {
        this.BOARD_SIZE = 15;
        this.EMPTY = 0;
        this.BLACK = 1;
        this.WHITE = 2;
        
        // 难度设置
        this.difficulty = 'medium'; // easy, medium, hard, impossible
        this.difficultySettings = {
            easy: {
                depth: 1,
                candidateLimit: 5,
                errorRate: 0.3, // 30%概率选择非最优解
                usePattern: false
            },
            medium: {
                depth: 2,
                candidateLimit: 10,
                errorRate: 0.1, // 10%概率选择非最优解
                usePattern: true
            },
            hard: {
                depth: 3,
                candidateLimit: 15,
                errorRate: 0.05, // 5%概率选择非最优解
                usePattern: true
            },
            impossible: {
                depth: 4,
                candidateLimit: 20,
                errorRate: 0, // 永不出错
                usePattern: true,
                enhancedDefense: true // 增强防御
            }
        };
        
        // 评估模式的分数权重
        this.SCORES = {
            // 连五
            FIVE: 100000,
            // 活四
            LIVE_FOUR: 10000,
            // 死四
            DEAD_FOUR: 5000,
            // 活三
            LIVE_THREE: 1000,
            // 死三
            DEAD_THREE: 100,
            // 活二
            LIVE_TWO: 50,
            // 死二
            DEAD_TWO: 10,
            // 活一
            LIVE_ONE: 1
        };
          // 方向向量：横、竖、主对角线、副对角线
        this.DIRECTIONS = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 主对角线
            [1, -1]   // 副对角线
        ];
        
        // 禁手检测器
        this.forbiddenRules = new ForbiddenRules();
    }
    
    // 设置AI难度
    setDifficulty(difficulty) {
        if (this.difficultySettings[difficulty]) {
            this.difficulty = difficulty;
        }
    }
    
    // 获取当前难度设置
    getCurrentSettings() {
        return this.difficultySettings[this.difficulty];
    }
    
    // 获取AI的下一步落子位置
    getBestMove(board, aiColor) {
        const settings = this.getCurrentSettings();
        const opponent = aiColor === this.BLACK ? this.WHITE : this.BLACK;
        
        // 检查是否有立即获胜的机会
        const winMove = this.findWinningMove(board, aiColor);
        if (winMove) return winMove;
        
        // 检查是否需要阻止对手获胜
        const blockMove = this.findWinningMove(board, opponent);
        if (blockMove) {
            // 在无法战胜模式下，永远阻挡玩家获胜
            if (this.difficulty === 'impossible') {
                return blockMove;
            }
            // 其他难度下有小概率不阻挡（模拟失误）
            if (Math.random() > settings.errorRate) {
                return blockMove;
            }
        }
        
        // 无法战胜模式下的额外防御检查
        if (this.difficulty === 'impossible') {
            const criticalDefenseMove = this.findCriticalDefenseMove(board, opponent);
            if (criticalDefenseMove) {
                return criticalDefenseMove;
            }
        }
          // 使用极大极小算法搜索最佳位置
        const candidates = this.getCandidateMoves(board, settings.candidateLimit);
        let bestMoves = [];
        let bestScore = -Infinity;
        
        for (const move of candidates) {
            // 检查AI是否会违反禁手规则（如果AI是黑棋）
            if (aiColor === this.BLACK) {
                const forbiddenCheck = this.forbiddenRules.checkForbiddenMove(board, move.row, move.col, aiColor);
                if (forbiddenCheck.isForbidden) {
                    continue; // 跳过会导致禁手的位置
                }
            }
            
            const newBoard = this.copyBoard(board);
            newBoard[move.row][move.col] = aiColor;
            
            let score;
            if (settings.usePattern) {
                score = this.minimax(newBoard, settings.depth - 1, -Infinity, Infinity, false, aiColor, opponent);
            } else {
                // 简单模式使用基础评估
                score = this.evaluateBoard(newBoard, aiColor) - this.evaluateBoard(newBoard, opponent);
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }
        
        // 根据难度决定是否选择最优解
        if (Math.random() < settings.errorRate && bestMoves.length > 1) {
            // 随机选择一个次优解
            const randomIndex = Math.floor(Math.random() * Math.min(3, candidates.length));
            return candidates[randomIndex];
        }
        
        // 从最优解中随机选择一个
        return bestMoves[Math.floor(Math.random() * bestMoves.length)] || candidates[0];    }
    
    // 寻找关键防御位置（针对无法战胜模式）
    findCriticalDefenseMove(board, opponent) {
        const criticalMoves = [];
        
        // 寻找对手的活三、死四等危险棋型
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (board[row][col] === this.EMPTY) {
                    // 模拟对手在此位置下棋
                    board[row][col] = opponent;
                    const score = this.evaluatePositionForColor(board, row, col, opponent);
                    board[row][col] = this.EMPTY;
                    
                    // 如果对手在此位置能形成强势棋型，则标记为关键防御点
                    if (score >= this.SCORES.LIVE_THREE) {
                        criticalMoves.push({ row, col, score });
                    }
                }
            }
        }
        
        // 按威胁程度排序，优先防御最危险的位置
        criticalMoves.sort((a, b) => b.score - a.score);
        
        return criticalMoves.length > 0 ? criticalMoves[0] : null;
    }
    
    // Minimax算法与Alpha-Beta剪枝
    minimax(board, depth, alpha, beta, isMaximizing, aiColor, opponent) {
        // 检查游戏结束条件
        const winner = this.checkWinner(board);
        if (winner === aiColor) return this.SCORES.FIVE;
        if (winner === opponent) return -this.SCORES.FIVE;
        if (depth === 0) return this.evaluateBoard(board, aiColor) - this.evaluateBoard(board, opponent);
        
        const settings = this.getCurrentSettings();
        const candidates = this.getCandidateMoves(board, Math.min(8, settings.candidateLimit)); // 限制搜索范围
          if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of candidates) {
                // 检查AI下棋是否会违反禁手规则
                if (aiColor === this.BLACK) {
                    const forbiddenCheck = this.forbiddenRules.checkForbiddenMove(board, move.row, move.col, aiColor);
                    if (forbiddenCheck.isForbidden) {
                        continue; // 跳过禁手位置
                    }
                }
                
                const newBoard = this.copyBoard(board);
                newBoard[move.row][move.col] = aiColor;
                const eval_score = this.minimax(newBoard, depth - 1, alpha, beta, false, aiColor, opponent);
                maxEval = Math.max(maxEval, eval_score);
                alpha = Math.max(alpha, eval_score);
                if (beta <= alpha) break; // Alpha-Beta剪枝
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of candidates) {
                // 检查对手下棋是否会违反禁手规则
                if (opponent === this.BLACK) {
                    const forbiddenCheck = this.forbiddenRules.checkForbiddenMove(board, move.row, move.col, opponent);
                    if (forbiddenCheck.isForbidden) {
                        // 如果对手的移动会导致禁手，这对AI有利
                        minEval = Math.min(minEval, -this.SCORES.FIVE);
                        continue;
                    }
                }
                
                const newBoard = this.copyBoard(board);
                newBoard[move.row][move.col] = opponent;
                const eval_score = this.minimax(newBoard, depth - 1, alpha, beta, true, aiColor, opponent);
                minEval = Math.min(minEval, eval_score);
                beta = Math.min(beta, eval_score);
                if (beta <= alpha) break; // Alpha-Beta剪枝
            }
            return minEval;
        }
    }
    
    // 寻找能立即获胜的位置
    findWinningMove(board, color) {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (board[row][col] === this.EMPTY) {
                    board[row][col] = color;
                    if (this.checkWinAtPosition(board, row, col, color)) {
                        board[row][col] = this.EMPTY;
                        return { row, col };
                    }
                    board[row][col] = this.EMPTY;
                }
            }
        }
        return null;
    }
    
    // 检查指定位置是否获胜
    checkWinAtPosition(board, row, col, color) {
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
            
            if (count >= 5) return true;
        }
        return false;
    }
    
    // 获取候选落子位置
    getCandidateMoves(board, maxMoves = 20) {
        const candidates = [];
        const occupied = new Set();
        
        // 找到所有已占据的位置
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (board[row][col] !== this.EMPTY) {
                    occupied.add(`${row},${col}`);
                }
            }
        }
        
        // 如果棋盘为空，选择中心位置
        if (occupied.size === 0) {
            return [{ row: 7, col: 7 }];
        }
        
        // 在已占据位置周围寻找候选位置
        for (const pos of occupied) {
            const [row, col] = pos.split(',').map(Number);
            
            for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    
                    if (newRow >= 0 && newRow < this.BOARD_SIZE && 
                        newCol >= 0 && newCol < this.BOARD_SIZE && 
                        board[newRow][newCol] === this.EMPTY) {
                        
                        const key = `${newRow},${newCol}`;
                        if (!candidates.some(c => c.row === newRow && c.col === newCol)) {
                            candidates.push({ row: newRow, col: newCol });
                        }
                    }
                }
            }
        }
        
        // 按评估分数排序候选位置
        candidates.sort((a, b) => {
            const scoreA = this.evaluatePosition(board, a.row, a.col);
            const scoreB = this.evaluatePosition(board, b.row, b.col);
            return scoreB - scoreA;
        });
        
        return candidates.slice(0, maxMoves);
    }
    
    // 评估单个位置的分数
    evaluatePosition(board, row, col) {
        let score = 0;
        
        // 考虑该位置对所有方向的影响
        for (const [dx, dy] of this.DIRECTIONS) {
            score += this.evaluateDirection(board, row, col, dx, dy, this.BLACK);
            score += this.evaluateDirection(board, row, col, dx, dy, this.WHITE);
        }
        
        return score;
    }
      // 评估棋盘状态
    evaluateBoard(board, color) {
        let score = 0;
        const settings = this.getCurrentSettings();
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (board[row][col] === color) {
                    let positionScore = this.evaluatePositionForColor(board, row, col, color);
                    
                    // 无法战胜模式下增强位置价值评估
                    if (this.difficulty === 'impossible') {
                        positionScore *= 1.2;
                        // 中心位置额外加分
                        const centerDistance = Math.abs(row - 7) + Math.abs(col - 7);
                        positionScore += (14 - centerDistance) * 2;
                    }
                    
                    score += positionScore;
                }
            }
        }
        
        return score;
    }
    
    // 为特定颜色评估位置
    evaluatePositionForColor(board, row, col, color) {
        let score = 0;
        
        for (const [dx, dy] of this.DIRECTIONS) {
            const pattern = this.getPattern(board, row, col, dx, dy, color);
            score += this.getPatternScore(pattern);
        }
        
        return score;
    }
    
    // 获取指定方向的模式
    getPattern(board, row, col, dx, dy, color) {
        let pattern = '';
        
        // 向前扫描
        for (let i = -4; i <= 4; i++) {
            const r = row + i * dx;
            const c = col + i * dy;
            
            if (r < 0 || r >= this.BOARD_SIZE || c < 0 || c >= this.BOARD_SIZE) {
                pattern += 'X'; // 边界
            } else if (board[r][c] === color) {
                pattern += 'O'; // 己方棋子
            } else if (board[r][c] === this.EMPTY) {
                pattern += '_'; // 空位
            } else {
                pattern += 'X'; // 对方棋子
            }
        }
        
        return pattern;
    }
      // 根据模式计算分数
    getPatternScore(pattern) {
        const settings = this.getCurrentSettings();
        let baseScore = 0;
        
        // 连五
        if (pattern.includes('OOOOO')) baseScore = this.SCORES.FIVE;
        
        // 活四
        else if (pattern.includes('_OOOO_')) baseScore = this.SCORES.LIVE_FOUR;
        
        // 死四
        else if (pattern.includes('XOOOO_') || pattern.includes('_OOOOX')) baseScore = this.SCORES.DEAD_FOUR;
        
        // 活三
        else if (pattern.includes('_OOO_')) baseScore = this.SCORES.LIVE_THREE;
        else if (pattern.includes('_OO_O_') || pattern.includes('_O_OO_')) baseScore = this.SCORES.LIVE_THREE;
        
        // 死三
        else if (pattern.includes('XOOO_') || pattern.includes('_OOOX')) baseScore = this.SCORES.DEAD_THREE;
        
        // 活二
        else if (pattern.includes('_OO_')) baseScore = this.SCORES.LIVE_TWO;
        else if (pattern.includes('_O_O_')) baseScore = this.SCORES.LIVE_TWO;
        
        // 死二
        else if (pattern.includes('XOO_') || pattern.includes('_OOX')) baseScore = this.SCORES.DEAD_TWO;
        
        // 活一
        else if (pattern.includes('_O_')) baseScore = this.SCORES.LIVE_ONE;
        
        // 无法战胜模式下提高威胁棋型的分数
        if (this.difficulty === 'impossible' && baseScore >= this.SCORES.LIVE_THREE) {
            baseScore *= 1.5;
        }
        
        return baseScore;
    }
    
    // 评估方向上的模式
    evaluateDirection(board, row, col, dx, dy, color) {
        let count = 0;
        let blocks = 0;
        
        // 正方向
        let r = row + dx, c = col + dy;
        while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && board[r][c] === color) {
            count++;
            r += dx;
            c += dy;
        }
        if (r < 0 || r >= this.BOARD_SIZE || c < 0 || c >= this.BOARD_SIZE || board[r][c] !== this.EMPTY) {
            blocks++;
        }
        
        // 反方向
        r = row - dx;
        c = col - dy;
        while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && board[r][c] === color) {
            count++;
            r -= dx;
            c -= dy;
        }
        if (r < 0 || r >= this.BOARD_SIZE || c < 0 || c >= this.BOARD_SIZE || board[r][c] !== this.EMPTY) {
            blocks++;
        }
        
        return this.getScoreByCount(count, blocks);
    }
    
    // 根据连子数和阻塞数计算分数
    getScoreByCount(count, blocks) {
        if (count >= 5) return this.SCORES.FIVE;
        if (count === 4) return blocks === 0 ? this.SCORES.LIVE_FOUR : this.SCORES.DEAD_FOUR;
        if (count === 3) return blocks === 0 ? this.SCORES.LIVE_THREE : this.SCORES.DEAD_THREE;
        if (count === 2) return blocks === 0 ? this.SCORES.LIVE_TWO : this.SCORES.DEAD_TWO;
        if (count === 1) return blocks === 0 ? this.SCORES.LIVE_ONE : 0;
        return 0;
    }
    
    // 检查游戏获胜者
    checkWinner(board) {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                const color = board[row][col];
                if (color !== this.EMPTY && this.checkWinAtPosition(board, row, col, color)) {
                    return color;
                }
            }
        }
        return null;
    }
    
    // 复制棋盘
    copyBoard(board) {
        return board.map(row => [...row]);
    }
}
