// 五子棋游戏主逻辑
class GomokuGame {
    constructor() {
        this.BOARD_SIZE = 15;
        this.EMPTY = 0;
        this.BLACK = 1;
        this.WHITE = 2;
        
        this.board = [];
        this.currentPlayer = this.BLACK;
        this.gameMode = 'player'; // 'player' 或 'ai'
        this.playerColor = this.BLACK; // 玩家在AI模式下的颜色
        this.aiColor = this.WHITE;
        this.gameStarted = false;
        this.gameOver = false;
        this.winner = null;
        this.ai = new GomokuAI();
        this.isAiThinking = false;
        
        // 统计数据
        this.stats = {
            blackWins: parseInt(localStorage.getItem('blackWins') || '0'),
            whiteWins: parseInt(localStorage.getItem('whiteWins') || '0'),
            draws: parseInt(localStorage.getItem('draws') || '0')
        };
        
        this.initializeBoard();
        this.initializeUI();
        this.updateStats();
    }
    
    // 初始化棋盘
    initializeBoard() {
        this.board = Array(this.BOARD_SIZE).fill(null).map(() => Array(this.BOARD_SIZE).fill(this.EMPTY));
    }
    
    // 初始化UI
    initializeUI() {
        this.gameBoard = document.getElementById('gameBoard');
        this.gameStatus = document.getElementById('gameStatus');
        this.currentPlayerDisplay = document.getElementById('currentPlayer');
        this.gameModeSelect = document.getElementById('gameMode');
        this.playerOrderSelect = document.getElementById('playerOrder');
        this.playerOrderGroup = document.getElementById('playerOrderGroup');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        this.createBoardUI();
        this.bindEvents();
        this.updatePlayerOrderVisibility();
    }
    
    // 创建棋盘UI
    createBoardUI() {
        this.gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    // 绑定事件
    bindEvents() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.gameModeSelect.addEventListener('change', () => this.updatePlayerOrderVisibility());
    }
    
    // 更新玩家顺序选择的可见性
    updatePlayerOrderVisibility() {
        const isAiMode = this.gameModeSelect.value === 'ai';
        this.playerOrderGroup.style.display = isAiMode ? 'block' : 'none';
    }
    
    // 开始新游戏
    startNewGame() {
        this.gameMode = this.gameModeSelect.value;
        
        if (this.gameMode === 'ai') {
            const playerOrder = this.playerOrderSelect.value;
            this.playerColor = playerOrder === 'first' ? this.BLACK : this.WHITE;
            this.aiColor = playerOrder === 'first' ? this.WHITE : this.BLACK;
        }
        
        this.initializeBoard();
        this.currentPlayer = this.BLACK; // 黑棋总是先手
        this.gameStarted = true;
        this.gameOver = false;
        this.winner = null;
        this.isAiThinking = false;
        
        this.updateBoard();
        this.updateGameStatus();
        this.updateCurrentPlayer();
        
        // 如果AI先手，让AI下第一步
        if (this.gameMode === 'ai' && this.aiColor === this.BLACK) {
            this.makeAiMove();
        }
    }
    
    // 重置游戏
    resetGame() {
        this.gameStarted = false;
        this.gameOver = false;
        this.winner = null;
        this.isAiThinking = false;
        this.initializeBoard();
        this.updateBoard();
        this.updateGameStatus();
        this.updateCurrentPlayer();
    }
    
    // 处理棋格点击
    handleCellClick(event) {
        if (!this.gameStarted || this.gameOver || this.isAiThinking) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        // 检查是否是AI模式且轮到AI下棋
        if (this.gameMode === 'ai' && this.currentPlayer === this.aiColor) return;
        
        this.makeMove(row, col);
    }
    
    // 下棋
    makeMove(row, col) {
        if (this.board[row][col] !== this.EMPTY) return false;
        
        this.board[row][col] = this.currentPlayer;
        this.updateBoard();
        
        // 检查游戏是否结束
        if (this.checkWin(row, col)) {
            this.endGame(this.currentPlayer);
            return true;
        }
        
        if (this.checkDraw()) {
            this.endGame(null);
            return true;
        }
        
        // 切换玩家
        this.switchPlayer();
        this.updateCurrentPlayer();
        
        // 如果是AI模式且轮到AI，让AI下棋
        if (this.gameMode === 'ai' && this.currentPlayer === this.aiColor && !this.gameOver) {
            setTimeout(() => this.makeAiMove(), 500); // 稍微延迟让用户看到自己的落子
        }
        
        return true;
    }
    
    // AI下棋
    async makeAiMove() {
        if (this.gameOver || this.isAiThinking) return;
        
        this.isAiThinking = true;
        this.updateGameStatus('AI正在思考中...');
        
        // 显示加载动画
        this.currentPlayerDisplay.innerHTML = '<div class="loading"></div>';
        
        try {
            // 使用setTimeout模拟异步计算，避免阻塞UI
            setTimeout(() => {
                const move = this.ai.getBestMove(this.board, this.aiColor);
                
                if (move) {
                    this.makeMove(move.row, move.col);
                }
                
                this.isAiThinking = false;
                this.updateGameStatus();
                this.updateCurrentPlayer();
            }, 100);
        } catch (error) {
            console.error('AI计算出错:', error);
            this.isAiThinking = false;
            this.updateGameStatus();
            this.updateCurrentPlayer();
        }
    }
    
    // 切换玩家
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === this.BLACK ? this.WHITE : this.BLACK;
    }
    
    // 检查获胜
    checkWin(row, col) {
        const color = this.board[row][col];
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            // 正方向计数
            let r = row + dx, c = col + dy;
            while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && this.board[r][c] === color) {
                count++;
                r += dx;
                c += dy;
            }
            
            // 反方向计数
            r = row - dx;
            c = col - dy;
            while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && this.board[r][c] === color) {
                count++;
                r -= dx;
                c -= dy;
            }
            
            if (count >= 5) {
                this.highlightWinningLine(row, col, dx, dy, color);
                return true;
            }
        }
        return false;
    }
    
    // 高亮获胜线
    highlightWinningLine(row, col, dx, dy, color) {
        const cells = [];
        
        // 收集获胜线上的所有棋子
        cells.push({ row, col });
        
        // 正方向
        let r = row + dx, c = col + dy;
        while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && this.board[r][c] === color) {
            cells.push({ row: r, col: c });
            r += dx;
            c += dy;
        }
        
        // 反方向
        r = row - dx;
        c = col - dy;
        while (r >= 0 && r < this.BOARD_SIZE && c >= 0 && c < this.BOARD_SIZE && this.board[r][c] === color) {
            cells.push({ row: r, col: c });
            r -= dx;
            c -= dy;
        }
        
        // 高亮前5个棋子
        cells.slice(0, 5).forEach(cell => {
            const cellElement = this.getCellElement(cell.row, cell.col);
            if (cellElement) {
                cellElement.style.background = 'rgba(255, 215, 0, 0.8)';
                cellElement.style.transform = 'scale(1.1)';
            }
        });
    }
    
    // 检查平局
    checkDraw() {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === this.EMPTY) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // 结束游戏
    endGame(winner) {
        this.gameOver = true;
        this.winner = winner;
        
        // 更新统计
        if (winner === this.BLACK) {
            this.stats.blackWins++;
        } else if (winner === this.WHITE) {
            this.stats.whiteWins++;
        } else {
            this.stats.draws++;
        }
        
        this.saveStats();
        this.updateStats();
        this.updateGameStatus();
        this.disableBoard();
    }
    
    // 禁用棋盘
    disableBoard() {
        const cells = this.gameBoard.querySelectorAll('.cell');
        cells.forEach(cell => cell.classList.add('disabled'));
    }
    
    // 更新棋盘显示
    updateBoard() {
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                const cell = this.getCellElement(row, col);
                const piece = cell.querySelector('.piece');
                
                if (piece) {
                    piece.remove();
                }
                
                if (this.board[row][col] !== this.EMPTY) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${this.board[row][col] === this.BLACK ? 'black' : 'white'}`;
                    cell.appendChild(pieceElement);
                }
                
                // 移除禁用状态
                cell.classList.remove('disabled');
                cell.style.background = '';
                cell.style.transform = '';
            }
        }
    }
    
    // 获取棋格元素
    getCellElement(row, col) {
        return this.gameBoard.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }
    
    // 更新游戏状态显示
    updateGameStatus(customMessage = null) {
        if (customMessage) {
            this.gameStatus.textContent = customMessage;
            return;
        }
        
        if (!this.gameStarted) {
            this.gameStatus.textContent = '选择游戏模式并开始新游戏';
        } else if (this.gameOver) {
            if (this.winner === this.BLACK) {
                this.gameStatus.textContent = '🎉 黑棋获胜！';
            } else if (this.winner === this.WHITE) {
                this.gameStatus.textContent = '🎉 白棋获胜！';
            } else {
                this.gameStatus.textContent = '🤝 平局！';
            }
        } else {
            if (this.gameMode === 'player') {
                this.gameStatus.textContent = '玩家对战进行中';
            } else {
                this.gameStatus.textContent = 'AI对战进行中';
            }
        }
    }
    
    // 更新当前玩家显示
    updateCurrentPlayer() {
        if (!this.gameStarted || this.gameOver) {
            this.currentPlayerDisplay.textContent = '-';
            return;
        }
        
        const playerText = this.currentPlayer === this.BLACK ? '黑棋' : '白棋';
        
        if (this.gameMode === 'ai') {
            if (this.currentPlayer === this.playerColor) {
                this.currentPlayerDisplay.textContent = `${playerText} (玩家)`;
            } else {
                this.currentPlayerDisplay.textContent = `${playerText} (AI)`;
            }
        } else {
            this.currentPlayerDisplay.textContent = playerText;
        }
    }
    
    // 保存统计数据
    saveStats() {
        localStorage.setItem('blackWins', this.stats.blackWins.toString());
        localStorage.setItem('whiteWins', this.stats.whiteWins.toString());
        localStorage.setItem('draws', this.stats.draws.toString());
    }
    
    // 更新统计显示
    updateStats() {
        document.getElementById('blackWins').textContent = this.stats.blackWins;
        document.getElementById('whiteWins').textContent = this.stats.whiteWins;
        document.getElementById('draws').textContent = this.stats.draws;
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new GomokuGame();
});
