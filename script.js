// 五子棋游戏主逻辑
class GomokuGame {
    constructor() {
        this.BOARD_SIZE = 15;
        this.EMPTY = 0;
        this.BLACK = 1;
        this.WHITE = 2;
        
        this.board = [];        this.currentPlayer = this.BLACK;
        this.gameMode = 'player'; // 'player' 或 'ai'
        this.playerColor = this.BLACK; // 玩家在AI模式下的颜色
        this.aiColor = this.WHITE;
        this.aiDifficulty = 'medium'; // AI难度
        this.gameStarted = false;
        this.gameOver = false;
        this.winner = null;        this.ai = new GomokuAI();
        this.isAiThinking = false;
        this.forbiddenRules = new ForbiddenRules();
        
        // 教程系统
        this.tutorial = null;
        
        // 统计数据
        this.stats = {
            blackWins: parseInt(localStorage.getItem('blackWins') || '0'),
            whiteWins: parseInt(localStorage.getItem('whiteWins') || '0'),
            draws: parseInt(localStorage.getItem('draws') || '0')
        };
          this.initializeBoard();
        this.initializeUI();
        this.updateStats();
        
        // 显示欢迎信息
        this.showWelcomeMessage();
    }
    
    // 显示欢迎信息
    showWelcomeMessage() {
        // 检查是否是第一次访问
        const hasVisited = localStorage.getItem('hasVisited');
        if (!hasVisited) {
            setTimeout(() => {
                const welcomeMessage = `
                    <div class="welcome-content">
                        <h3>🎉 欢迎来到五子棋禁手规则游戏！</h3>
                        <p>这是一个完整的五子棋游戏，实现了标准的禁手规则。</p>
                        
                        <div class="feature-highlights">
                            <div class="feature-item">
                                <span class="feature-icon">🎓</span>
                                <div>
                                    <strong>新手？</strong><br>
                                    点击"新手教程"学习禁手规则
                                </div>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">🤖</span>
                                <div>
                                    <strong>挑战AI</strong><br>
                                    4个难度等级，无法战胜模式等你挑战
                                </div>
                            </div>
                            <div class="feature-item">
                                <span class="feature-icon">🛠️</span>
                                <div>
                                    <strong>调试工具</strong><br>
                                    实时分析局面，了解禁手规则细节
                                </div>
                            </div>
                        </div>
                        
                        <div class="rule-reminder">
                            <strong>重要提醒:</strong> 禁手规则仅对黑棋（先手）有效，红色标记会提示禁手位置。
                        </div>
                    </div>
                `;
                
                this.showModal('欢迎', welcomeMessage, 'welcome');
                localStorage.setItem('hasVisited', 'true');
            }, 1000);
        }
    }
    
    // 初始化棋盘
    initializeBoard() {
        this.board = Array(this.BOARD_SIZE).fill(null).map(() => Array(this.BOARD_SIZE).fill(this.EMPTY));
    }
    
    // 初始化UI
    initializeUI() {
        this.gameBoard = document.getElementById('gameBoard');
        this.gameStatus = document.getElementById('gameStatus');        this.currentPlayerDisplay = document.getElementById('currentPlayer');
        this.gameModeSelect = document.getElementById('gameMode');
        this.playerOrderSelect = document.getElementById('playerOrder');
        this.playerOrderGroup = document.getElementById('playerOrderGroup');
        this.aiDifficultySelect = document.getElementById('aiDifficulty');        this.aiDifficultyGroup = document.getElementById('aiDifficultyGroup');        this.newGameBtn = document.getElementById('newGameBtn');        this.resetBtn = document.getElementById('resetBtn');        this.rulesBtn = document.getElementById('rulesBtn');
        this.tutorialBtn = document.getElementById('tutorialBtn');
        this.debugBtn = document.getElementById('debugBtn');
        this.hintBtn = document.getElementById('hintBtn');
        this.hintLevelSelect = document.getElementById('hintLevel');
        this.hintGroup = document.getElementById('hintGroup');
        
        // 提示相关状态
        this.currentHints = [];
        this.hintCooldown = false;
          this.createBoardUI();
        this.bindEvents();
        this.updateGameModeVisibility();
        
        // 初始化时隐藏AI相关选项
        this.aiDifficultyGroup.style.display = 'none';
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
    }    // 绑定事件
    bindEvents() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.rulesBtn.addEventListener('click', () => this.showRulesExplanation());
        this.tutorialBtn.addEventListener('click', () => this.startTutorial());
        this.debugBtn.addEventListener('click', () => this.toggleDebugPanel());
        this.hintBtn.addEventListener('click', () => this.getHint());
        this.gameModeSelect.addEventListener('change', () => this.updateGameModeVisibility());
    }
      // 更新游戏模式相关选项的可见性
    updateGameModeVisibility() {
        const isAiMode = this.gameModeSelect.value === 'ai';
        this.playerOrderGroup.style.display = isAiMode ? 'block' : 'none';
        this.aiDifficultyGroup.style.display = isAiMode ? 'block' : 'none';
        this.hintGroup.style.display = isAiMode ? 'block' : 'none';
        this.hintBtn.style.display = isAiMode ? 'block' : 'none';
    }    // 开始新游戏
    startNewGame() {
        this.gameMode = this.gameModeSelect.value;
        
        if (this.gameMode === 'ai') {
            const playerOrder = this.playerOrderSelect.value;
            this.playerColor = playerOrder === 'first' ? this.BLACK : this.WHITE;
            this.aiColor = playerOrder === 'first' ? this.WHITE : this.BLACK;
            this.aiDifficulty = this.aiDifficultySelect.value;
            
            // 设置AI难度
            this.ai.setDifficulty(this.aiDifficulty);
        }
        
        this.initializeBoard();
        this.currentPlayer = this.BLACK; // 黑棋总是先手
        this.gameStarted = true;
        this.gameOver = false;
        this.winner = null;
        this.isAiThinking = false;
          // 清理禁手规则缓存以提高性能
        this.forbiddenRules.clearCache();
        
        // 清除提示
        this.clearHintsFromBoard();
        
        this.updateBoard();
        this.updateGameStatus();
        this.updateCurrentPlayer();
        
        // 显示禁手位置警告（仅对黑棋）
        this.updateForbiddenWarnings();
        
        // 无法战胜模式的特别提示
        if (this.gameMode === 'ai' && this.aiDifficulty === 'impossible') {
            setTimeout(() => {
                this.updateGameStatus('⚠️ 挑战无法战胜模式！AI将全力以赴');
                setTimeout(() => this.updateGameStatus(), 2000);
            }, 1000);
        }
        
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
        this.initializeBoard();        this.updateBoard();
        this.updateGameStatus();
        this.updateCurrentPlayer();
        
        // 显示禁手位置警告（仅对黑棋）
        this.updateForbiddenWarnings();
    }
    
    // 处理棋格点击
    handleCellClick(event) {
        if (!this.gameStarted || this.gameOver || this.isAiThinking) return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        // 检查是否是AI模式且轮到AI下棋
        if (this.gameMode === 'ai' && this.currentPlayer === this.aiColor) return;
        
        this.makeMove(row, col);
    }    // 下棋
    makeMove(row, col) {
        if (this.board[row][col] !== this.EMPTY) return false;
        
        // 清除提示
        this.clearHintsFromBoard();
        
        // 检查禁手规则
        const forbiddenCheck = this.forbiddenRules.checkForbiddenMove(this.board, row, col, this.currentPlayer);
        if (forbiddenCheck.isForbidden) {
            this.handleForbiddenMove(forbiddenCheck);
            return false;
        }
        
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
        
        // 更新禁手警告
        this.updateForbiddenWarnings();
        
        // 如果是AI模式且轮到AI，让AI下棋
        if (this.gameMode === 'ai' && this.currentPlayer === this.aiColor && !this.gameOver) {
            setTimeout(() => this.makeAiMove(), 500); // 稍微延迟让用户看到自己的落子
        }
        
        return true;
    }
    
    // 处理禁手违规
    handleForbiddenMove(forbiddenCheck) {
        this.gameOver = true;
        this.winner = this.currentPlayer === this.BLACK ? this.WHITE : this.BLACK;
        
        // 显示禁手违规信息
        this.showForbiddenMoveDialog(forbiddenCheck);
        
        // 更新统计（对手获胜）
        if (this.winner === this.BLACK) {
            this.stats.blackWins++;
        } else {
            this.stats.whiteWins++;
        }
        
        this.saveStats();
        this.updateStats();
        this.updateGameStatus();
        this.disableBoard();
    }
    
    // 显示禁手违规对话框
    showForbiddenMoveDialog(forbiddenCheck) {
        const playerText = this.currentPlayer === this.BLACK ? '黑棋' : '白棋';
        let message = `${playerText}违反禁手规则！\n\n`;
        message += `违规类型：${forbiddenCheck.description}\n\n`;
        message += `${this.currentPlayer === this.BLACK ? '白棋' : '黑棋'}获胜！`;
        
        // 创建并显示模态对话框
        this.showModal('禁手违规', message, forbiddenCheck.reason);
          // 更新游戏状态显示
        this.updateGameStatus(`⚠️ ${forbiddenCheck.description} - ${this.currentPlayer === this.BLACK ? '白棋' : '黑棋'}获胜`);
    }
    
    // 显示规则说明
    showRulesExplanation() {
        const rules = this.forbiddenRules.getRuleExplanation();
        
        let content = `
            <div class="rules-explanation">
                <h4>${rules.title}</h4>
                <p><em>${rules.description}</em></p>
                
                ${rules.rules.map(rule => `
                    <div class="rule-item">
                        <h5>${rule.name}</h5>
                        <p>${rule.description}</p>
                        <div class="rule-example">${rule.example}</div>
                    </div>
                `).join('')}
                
                <div class="rule-notes">
                    <strong>重要提示：</strong>
                    <ul>
                        ${rules.notes.map(note => `<li>${note}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
          this.showModal('五子棋禁手规则说明', content, 'info');
    }
    
    // 更新禁手位置警告
    updateForbiddenWarnings() {
        // 清除所有现有的警告
        const cells = this.gameBoard.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('forbidden-warning');
        });
        
        // 如果游戏未开始或已结束，不显示警告
        if (!this.gameStarted || this.gameOver) return;
        
        // 只为黑棋显示禁手警告
        if (this.currentPlayer !== this.BLACK) return;
        
        // 检查所有空位置，标记可能导致禁手的位置
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === this.EMPTY) {
                    const forbiddenCheck = this.forbiddenRules.checkForbiddenMove(this.board, row, col, this.BLACK);
                    if (forbiddenCheck.isForbidden) {
                        const cell = this.getCellElement(row, col);
                        if (cell) {
                            cell.classList.add('forbidden-warning');
                            cell.title = `禁手警告: ${forbiddenCheck.description}`;
                        }
                    }
                }
            }
        }
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
    
    // 启动教程
    startTutorial() {
        // 初始化教程系统
        if (!this.tutorial) {
            this.tutorial = new ForbiddenRulesTutorial(this);
        }
        
        // 重置游戏状态
        this.resetGame();
        
        // 开始教程
        this.tutorial.startTutorial();
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
                const difficultyText = this.getDifficultyText(this.aiDifficulty);
                this.gameStatus.textContent = `AI对战进行中 (${difficultyText})`;
            }
        }
    }
    
    // 获取难度文本
    getDifficultyText(difficulty) {
        const difficultyMap = {
            'easy': '简单',
            'medium': '中等',
            'hard': '困难',
            'impossible': '无法战胜'
        };
        return difficultyMap[difficulty] || '中等';
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
      // 显示模态对话框
    showModal(title, content, type = 'info') {
        // 移除已存在的模态框
        const existingModal = document.querySelector('.modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // 处理内容格式
        const isHtmlContent = content.includes('<');
        const formattedContent = isHtmlContent ? content : content.replace(/\n/g, '<br>');
        
        modal.innerHTML = `
            <div class="modal-content ${type}">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${isHtmlContent ? formattedContent : `<p>${formattedContent}</p>`}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary modal-ok">确定</button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.modal-ok').addEventListener('click', () => {
            modal.remove();
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // 显示动画
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
    
    // 切换调试面板
    toggleDebugPanel() {
        let debugPanel = document.querySelector('.debug-panel');
        
        if (debugPanel) {
            debugPanel.remove();
        } else {
            this.createDebugPanel();
        }
    }
    
    // 创建调试面板
    createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.className = 'debug-panel';
        
        debugPanel.innerHTML = `
            <button class="debug-close">&times;</button>
            <h4>🛠️ 调试面板</h4>
            
            <div class="debug-section">
                <h5>缓存状态</h5>
                <div class="debug-info">
                    <div>缓存大小: <span id="cache-size">${this.forbiddenRules.cache.size}</span></div>
                    <div>最大缓存: ${this.forbiddenRules.maxCacheSize}</div>
                </div>
            </div>
            
            <div class="debug-section">
                <h5>当前游戏状态</h5>
                <div class="debug-info">
                    <div>游戏模式: ${this.gameMode}</div>
                    <div>当前玩家: ${this.currentPlayer === this.BLACK ? '黑棋' : '白棋'}</div>
                    <div>游戏进行中: ${this.gameStarted ? '是' : '否'}</div>
                    <div>游戏结束: ${this.gameOver ? '是' : '否'}</div>
                </div>
            </div>
            
            <div class="debug-section">
                <h5>禁手检测</h5>
                <div class="debug-info">
                    <div>黑棋禁手位置: <span id="forbidden-count">0</span></div>
                    <button id="show-forbidden-analysis" class="btn btn-warning" style="margin-top: 5px; width: 100%; font-size: 0.8rem;">分析当前局面</button>
                </div>
            </div>
            
            <div class="test-controls">
                <button id="run-basic-test" class="btn btn-info">基础测试</button>
                <button id="run-comprehensive-test" class="btn btn-success">综合测试</button>
            </div>
            
            <div class="test-controls">
                <button id="clear-cache" class="btn btn-secondary">清理缓存</button>
                <button id="performance-test" class="btn btn-warning">性能测试</button>
            </div>
        `;
        
        document.body.appendChild(debugPanel);
        
        // 绑定调试面板事件
        debugPanel.querySelector('.debug-close').addEventListener('click', () => {
            debugPanel.remove();
        });
        
        debugPanel.querySelector('#show-forbidden-analysis').addEventListener('click', () => {
            this.showForbiddenAnalysis();
        });
        
        debugPanel.querySelector('#run-basic-test').addEventListener('click', () => {
            if (typeof testForbiddenRules !== 'undefined') {
                testForbiddenRules();
            } else {
                console.log('基础测试函数未找到');
            }
        });
        
        debugPanel.querySelector('#run-comprehensive-test').addEventListener('click', () => {
            if (typeof runComprehensiveTest !== 'undefined') {
                runComprehensiveTest();
            } else {
                console.log('综合测试函数未找到');
            }
        });
        
        debugPanel.querySelector('#clear-cache').addEventListener('click', () => {
            this.forbiddenRules.clearCache();
            this.updateDebugInfo();
            console.log('缓存已清理');
        });
        
        debugPanel.querySelector('#performance-test').addEventListener('click', () => {
            this.runPerformanceTest();
        });
        
        // 更新调试信息
        this.updateDebugInfo();
        
        // 每秒更新一次调试信息
        this.debugInterval = setInterval(() => {
            if (document.querySelector('.debug-panel')) {
                this.updateDebugInfo();
            } else {
                clearInterval(this.debugInterval);
            }
        }, 1000);
    }
    
    // 更新调试信息
    updateDebugInfo() {
        const cacheSize = document.getElementById('cache-size');
        const forbiddenCount = document.getElementById('forbidden-count');
        
        if (cacheSize) {
            cacheSize.textContent = this.forbiddenRules.cache.size;
        }
        
        if (forbiddenCount && this.gameStarted && this.currentPlayer === this.BLACK) {
            let count = 0;
            for (let row = 0; row < this.BOARD_SIZE; row++) {
                for (let col = 0; col < this.BOARD_SIZE; col++) {
                    if (this.board[row][col] === this.EMPTY) {
                        const result = this.forbiddenRules.checkForbiddenMove(this.board, row, col, this.BLACK);
                        if (result.isForbidden) count++;
                    }
                }
            }
            forbiddenCount.textContent = count;
        }
    }
    
    // 显示禁手分析
    showForbiddenAnalysis() {
        if (!this.gameStarted) {
            this.showModal('分析结果', '请先开始游戏再进行分析');
            return;
        }
        
        const analysis = this.analyzeForbiddenPositions();
        let content = `
            <div class="forbidden-analysis">
                <h4>当前局面禁手分析</h4>
                <p><strong>分析时间:</strong> ${new Date().toLocaleTimeString()}</p>
                <p><strong>当前玩家:</strong> ${this.currentPlayer === this.BLACK ? '黑棋' : '白棋'}</p>
                
                <div class="analysis-section">
                    <h5>禁手统计</h5>
                    <ul>
                        <li>长连禁手: ${analysis.longConnection} 个位置</li>
                        <li>双四禁手: ${analysis.doubleFour} 个位置</li>
                        <li>双活三禁手: ${analysis.doubleThree} 个位置</li>
                        <li>总计禁手: ${analysis.total} 个位置</li>
                    </ul>
                </div>
                
                <div class="analysis-section">
                    <h5>建议</h5>
                    <p>${this.getStrategicAdvice(analysis)}</p>
                </div>
            </div>
        `;
        
        this.showModal('禁手分析', content, 'info');
    }
    
    // 分析禁手位置
    analyzeForbiddenPositions() {
        const analysis = {
            longConnection: 0,
            doubleFour: 0,
            doubleThree: 0,
            total: 0,
            positions: []
        };
        
        if (this.currentPlayer !== this.BLACK) {
            return analysis;
        }
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === this.EMPTY) {
                    const result = this.forbiddenRules.checkForbiddenMove(this.board, row, col, this.BLACK);
                    if (result.isForbidden) {
                        analysis.total++;
                        analysis.positions.push({row, col, reason: result.reason});
                        
                        switch (result.reason) {
                            case 'long_connection':
                                analysis.longConnection++;
                                break;
                            case 'double_four':
                                analysis.doubleFour++;
                                break;
                            case 'double_three':
                                analysis.doubleThree++;
                                break;
                        }
                    }
                }
            }
        }
        
        return analysis;
    }
    
    // 获取战略建议
    getStrategicAdvice(analysis) {
        if (analysis.total === 0) {
            return '✅ 当前没有禁手位置，可以自由下棋。建议寻找进攻或防守的最佳位置。';
        }
        
        let advice = `⚠️ 发现 ${analysis.total} 个禁手位置，需要谨慎下棋。`;
        
        if (analysis.longConnection > 0) {
            advice += ` 注意避免形成长连。`;
        }
        
        if (analysis.doubleFour > 0) {
            advice += ` 当前有 ${analysis.doubleFour} 个位置会形成双四，避免同时形成两个四。`;
        }
        
        if (analysis.doubleThree > 0) {
            advice += ` 当前有 ${analysis.doubleThree} 个位置会形成双活三，小心不要同时形成两个活三。`;
        }
        
        advice += ' 建议优先考虑进攻和防守，避免落入禁手陷阱。';
        
        return advice;
    }
    
    // 运行性能测试
    runPerformanceTest() {
        console.log('🔄 开始性能测试...');
        
        const testBoard = Array(15).fill(null).map(() => Array(15).fill(this.EMPTY));
        
        // 创建一个复杂的测试局面
        const testPositions = [
            [7, 7, this.BLACK], [7, 8, this.BLACK], [8, 7, this.BLACK],
            [6, 6, this.BLACK], [6, 7, this.BLACK], [5, 5, this.WHITE],
            [9, 9, this.WHITE], [10, 10, this.WHITE], [4, 4, this.BLACK]
        ];
        
        testPositions.forEach(([row, col, color]) => {
            testBoard[row][col] = color;
        });
        
        const iterations = 500;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            // 测试不同位置的禁手检测
            const testRow = Math.floor(Math.random() * 15);
            const testCol = Math.floor(Math.random() * 15);
            if (testBoard[testRow][testCol] === this.EMPTY) {
                this.forbiddenRules.checkForbiddenMove(testBoard, testRow, testCol, this.BLACK);
            }
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / iterations;
        
        const result = `
            性能测试完成！
            
            📊 测试结果:
            • 总测试次数: ${iterations}
            • 总用时: ${totalTime.toFixed(2)}ms
            • 平均用时: ${avgTime.toFixed(4)}ms
            • 缓存命中: ${this.forbiddenRules.cache.size} 条记录
            
            ${avgTime < 1.0 ? '✅ 性能优秀！' : avgTime < 5.0 ? '⚠️ 性能良好' : '❌ 性能需要优化'}
        `;
          this.showModal('性能测试结果', result);
        console.log(result);
    }
    
    // ======== 提示功能 ========
    
    // 获取提示
    getHint() {
        // 检查是否在AI模式
        if (this.gameMode !== 'ai') {
            this.showModal('提示功能', '提示功能仅在人机对战模式下可用！', 'warning');
            return;
        }
        
        // 检查游戏是否开始
        if (!this.gameStarted) {
            this.showModal('提示功能', '请先开始新游戏！', 'warning');
            return;
        }
        
        // 检查游戏是否结束
        if (this.gameOver) {
            this.showModal('提示功能', '游戏已结束，无需提示！', 'info');
            return;
        }
        
        // 检查是否轮到玩家下棋
        if (this.currentPlayer !== this.playerColor) {
            this.showModal('提示功能', '请等待AI下棋完成！', 'warning');
            return;
        }
        
        // 检查冷却时间
        if (this.hintCooldown) {
            this.showModal('提示功能', '请稍等，提示功能冷却中...', 'warning');
            return;
        }
        
        // 获取提示级别
        const hintLevel = this.hintLevelSelect.value;
        
        // 显示加载状态
        this.hintBtn.disabled = true;
        this.hintBtn.textContent = '🔄 分析中...';
        
        // 使用setTimeout来避免UI阻塞
        setTimeout(() => {
            try {
                // 获取AI提示
                const hint = this.ai.getHint(this.board, this.playerColor, hintLevel);
                
                if (hint && hint.suggestions.length > 0) {
                    this.showHintResult(hint);
                    this.displayHintOnBoard(hint.suggestions);
                } else {
                    this.showModal('提示功能', '暂时没有找到明显的好棋，请根据局面自由发挥。', 'info');
                }
            } catch (error) {
                console.error('获取提示时出错:', error);
                this.showModal('提示功能', '获取提示时出现错误，请稍后再试。', 'error');
            }
            
            // 恢复按钮状态
            this.hintBtn.disabled = false;
            this.hintBtn.textContent = '💡 获取提示';
            
            // 设置冷却时间
            this.startHintCooldown();
        }, 100);
    }
    
    // 显示提示结果
    showHintResult(hint) {
        const levelIcons = {
            simple: '💡',
            expert: '🎯',
            master: '👑'
        };
        
        const levelNames = {
            simple: '简单提示',
            expert: '高手提示',
            master: '大师提示'
        };
        
        let content = `
            <div class="hint-modal">
                <h3>${levelIcons[hint.level]} ${levelNames[hint.level]}</h3>
                <p>${hint.description}</p>
                
                <div class="hint-suggestion-list">
                    <h4>推荐位置：</h4>
        `;
        
        hint.suggestions.forEach((suggestion, index) => {
            const priorityColors = {
                win: 'priority-win',
                critical_defense: 'priority-critical_defense',
                attack: 'priority-attack',
                defense: '',
                good_attack: '',
                normal: '',
                forbidden: ''
            };
            
            const priorityNames = {
                win: '🏆 获胜',
                critical_defense: '🛡️ 关键防守',
                attack: '⚔️ 强攻',
                defense: '🔒 防守',
                good_attack: '🎯 进攻',
                normal: '📍 常规',
                forbidden: '🚫 禁手'
            };
            
            content += `
                <div class="hint-item ${priorityColors[suggestion.priority]}">
                    <div class="hint-position">
                        ${index + 1}. 第${suggestion.row + 1}行第${suggestion.col + 1}列
                        <span class="hint-confidence">${suggestion.confidence}%</span>
                    </div>
                    <div class="hint-description">
                        ${priorityNames[suggestion.priority]} - ${suggestion.description}
                    </div>
                </div>
            `;
        });
        
        content += `
                </div>
                
                <div class="hint-explanation">
                    <strong>详细分析：</strong><br>
                    ${hint.explanation}
                </div>
            </div>
        `;
        
        this.showModal('AI智能提示', content, 'info');
    }
    
    // 在棋盘上显示提示
    displayHintOnBoard(suggestions) {
        // 清除之前的提示
        this.clearHintsFromBoard();
        
        suggestions.forEach((suggestion, index) => {
            const cell = this.gameBoard.children[suggestion.row * this.BOARD_SIZE + suggestion.col];
            if (cell && !cell.classList.contains('occupied')) {
                const hint = document.createElement('div');
                hint.className = `hint-suggestion priority-${suggestion.priority}`;
                hint.textContent = index + 1;
                hint.title = `${suggestion.description} (可信度: ${suggestion.confidence}%)`;
                
                // 点击提示可直接下棋
                hint.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.clearHintsFromBoard();
                    this.handleCellClick({ target: cell });
                });
                
                cell.appendChild(hint);
                this.currentHints.push(hint);
            }
        });
        
        // 5秒后自动清除提示
        setTimeout(() => {
            this.clearHintsFromBoard();
        }, 5000);
    }
    
    // 清除棋盘上的提示
    clearHintsFromBoard() {
        this.currentHints.forEach(hint => {
            if (hint.parentNode) {
                hint.parentNode.removeChild(hint);
            }
        });
        this.currentHints = [];
    }
    
    // 开始提示冷却
    startHintCooldown() {
        this.hintCooldown = true;
        
        setTimeout(() => {
            this.hintCooldown = false;
        }, 3000); // 3秒冷却时间
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new GomokuGame();
});
