// 五子棋禁手规则教程系统
class ForbiddenRulesTutorial {
    constructor(game) {
        this.game = game;
        this.currentStep = 0;
        this.isActive = false;
        
        // 教程步骤
        this.tutorialSteps = [
            {
                title: "欢迎学习五子棋禁手规则！",
                description: "禁手规则让五子棋更加公平有趣。让我们通过实例来学习吧！",
                board: [],
                highlight: null,
                action: "开始教程"
            },
            {
                title: "什么是长连禁手？",
                description: "黑棋不能形成六子或以上的连线。这是为了防止黑棋过于强势。",
                board: [
                    [7, 5, 1], [7, 6, 1], [7, 7, 1], [7, 8, 1], [7, 9, 1]
                ],
                highlight: [7, 10],
                action: "在此位置下棋会形成六连，这是被禁止的！"
            },
            {
                title: "五连获胜优先",
                description: "如果下棋能形成五连获胜，则不算禁手。五连是最高目标！",
                board: [
                    [7, 5, 1], [7, 6, 1], [7, 7, 1], [7, 8, 1]
                ],
                highlight: [7, 9],
                action: "这里形成五连，直接获胜，不算禁手"
            },
            {
                title: "什么是双四禁手？",
                description: "黑棋不能同时形成两个四（包括活四和死四）。",
                board: [
                    [6, 7, 1], [8, 7, 1], [9, 7, 1], [10, 7, 1],
                    [7, 6, 1], [7, 8, 1], [7, 9, 1]
                ],
                highlight: [7, 7],
                action: "此位置同时形成两个四，违反双四禁手"
            },
            {
                title: "什么是双活三禁手？",
                description: "黑棋不能同时形成两个活三。活三是指能够形成活四的三。",
                board: [
                    [6, 7, 1], [8, 7, 1],
                    [7, 6, 1], [7, 8, 1]
                ],
                highlight: [7, 7],
                action: "此位置同时形成两个活三，违反双活三禁手"
            },
            {
                title: "白棋不受限制",
                description: "所有禁手规则只对黑棋（先手）有效，白棋可以自由下棋。",
                board: [
                    [7, 5, 2], [7, 6, 2], [7, 7, 2], [7, 8, 2], [7, 9, 2]
                ],
                highlight: [7, 10],
                action: "白棋可以形成长连，不受禁手限制"
            },
            {
                title: "实战练习",
                description: "现在你已经了解了基本规则，开始实战练习吧！注意观察红色警告。",
                board: [],
                highlight: null,
                action: "开始新游戏进行练习"
            }
        ];
    }
    
    // 开始教程
    startTutorial() {
        this.isActive = true;
        this.currentStep = 0;
        this.showTutorialStep();
    }
    
    // 显示教程步骤
    showTutorialStep() {
        const step = this.tutorialSteps[this.currentStep];
        
        // 清空当前棋盘
        this.game.initializeBoard();
        
        // 设置教程棋盘状态
        step.board.forEach(([row, col, color]) => {
            this.game.board[row][col] = color;
        });
        
        // 更新棋盘显示
        this.game.updateBoard();
        
        // 高亮特殊位置
        if (step.highlight) {
            const [row, col] = step.highlight;
            const cell = this.game.getCellElement(row, col);
            if (cell) {
                cell.classList.add('tutorial-highlight');
                
                // 检查是否是禁手位置
                const result = this.game.forbiddenRules.checkForbiddenMove(
                    this.game.board, row, col, this.game.BLACK
                );
                
                if (result.isForbidden) {
                    cell.classList.add('forbidden-warning');
                    cell.title = `禁手警告: ${result.description}`;
                }
            }
        }
        
        // 显示教程对话框
        this.showTutorialDialog(step);
    }
    
    // 显示教程对话框
    showTutorialDialog(step) {
        const isLastStep = this.currentStep === this.tutorialSteps.length - 1;
        const isFirstStep = this.currentStep === 0;
        
        let content = `
            <div class="tutorial-content">
                <div class="tutorial-progress">
                    步骤 ${this.currentStep + 1} / ${this.tutorialSteps.length}
                </div>
                <h3>${step.title}</h3>
                <p>${step.description}</p>
                <div class="tutorial-action">
                    <strong>${step.action}</strong>
                </div>
                <div class="tutorial-controls">
                    ${!isFirstStep ? '<button id="tutorial-prev" class="btn btn-secondary">上一步</button>' : ''}
                    ${!isLastStep ? '<button id="tutorial-next" class="btn btn-primary">下一步</button>' : 
                      '<button id="tutorial-finish" class="btn btn-success">完成教程</button>'}
                    <button id="tutorial-skip" class="btn btn-warning">跳过教程</button>
                </div>
            </div>
        `;
        
        // 移除现有的教程对话框
        const existingTutorial = document.querySelector('.tutorial-modal');
        if (existingTutorial) {
            existingTutorial.remove();
        }
        
        // 创建教程模态框
        const modal = document.createElement('div');
        modal.className = 'modal tutorial-modal show';
        
        modal.innerHTML = `
            <div class="modal-content tutorial">
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        const nextBtn = modal.querySelector('#tutorial-next');
        const prevBtn = modal.querySelector('#tutorial-prev');
        const finishBtn = modal.querySelector('#tutorial-finish');
        const skipBtn = modal.querySelector('#tutorial-skip');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevStep());
        }
        
        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.finishTutorial());
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skipTutorial());
        }
    }
    
    // 下一步
    nextStep() {
        if (this.currentStep < this.tutorialSteps.length - 1) {
            this.clearHighlights();
            this.currentStep++;
            this.showTutorialStep();
        }
    }
    
    // 上一步
    prevStep() {
        if (this.currentStep > 0) {
            this.clearHighlights();
            this.currentStep--;
            this.showTutorialStep();
        }
    }
    
    // 完成教程
    finishTutorial() {
        this.isActive = false;
        this.clearHighlights();
        this.closeTutorialDialog();
        
        // 开始新游戏
        this.game.startNewGame();
        
        // 显示完成消息
        setTimeout(() => {
            this.game.showModal(
                '教程完成！', 
                '恭喜你完成了禁手规则教程！现在可以开始实战了。记住：\n\n' +
                '• 黑棋不能形成长连（6+子）\n' +
                '• 黑棋不能同时形成双四\n' +
                '• 黑棋不能同时形成双活三\n' +
                '• 白棋不受任何限制\n\n' +
                '红色警告会提示你禁手位置，祝你游戏愉快！',
                'success'
            );
        }, 500);
    }
    
    // 跳过教程
    skipTutorial() {
        this.isActive = false;
        this.clearHighlights();
        this.closeTutorialDialog();
        this.game.resetGame();
    }
    
    // 清除高亮
    clearHighlights() {
        const highlightedCells = document.querySelectorAll('.tutorial-highlight');
        highlightedCells.forEach(cell => {
            cell.classList.remove('tutorial-highlight');
            cell.classList.remove('forbidden-warning');
            cell.title = '';
        });
    }
    
    // 关闭教程对话框
    closeTutorialDialog() {
        const tutorialModal = document.querySelector('.tutorial-modal');
        if (tutorialModal) {
            tutorialModal.remove();
        }
    }
}

// 将教程系统添加到全局
if (typeof window !== 'undefined') {
    window.ForbiddenRulesTutorial = ForbiddenRulesTutorial;
}
