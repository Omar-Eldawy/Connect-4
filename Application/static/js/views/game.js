export function renderGame(container, method) {
    const rows = 6;
    const cols = 7;
    let currentPlayer = 1;
    let value1 = 0;
    let value2 = 0;
    let board = Array(rows).fill().map(() => Array(cols).fill(0));
    let maxDepth = 1

    function createBoard() {
        let boardHTML = '<div class="game-board">';
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                boardHTML += `<div class="cell" data-row="${row}" data-col="${col}"></div>`;
            }
        }
        boardHTML += '</div>';
        return boardHTML;
    }

    function handleCellClick(event) {
        const col = parseInt(event.target.dataset.col);
        if (!isValidMove(col)) return;

        const row = getLowestEmptyRow(col);

        getScore(col)

        makeMove(row, col);
        updateBoard();

        if(method != 0){
            triggerAi()
        }
    }

    async function triggerAi() {
        const requestData = {
            board: convertBoardToCharachterFormat(board),
            piece: convertPlayerToCharachterFormat(currentPlayer),
            max_depth: maxDepth,
            method: convertMethodToStringFormat(method)
        };
    
        try {
            const response = await fetch('http://127.0.0.1:5000/ai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Unknown error');
            }
    
            const data = await response.json();
    
            const col = data.position;

            if (!isValidMove(col)) return;
            const row = getLowestEmptyRow(col);
            getScore(col)
            makeMove(row, col);
            updateBoard();

            console.log('AI Position:', col);

        } catch (error) {
            console.error('Error making AI request:', error);
        }

    }

    async function getScore(col) {
        const requestData = {
            board: convertBoardToCharachterFormat(board),
            piece: convertPlayerToCharachterFormat(currentPlayer),
            position: col
        };
    
        try {
            const response = await fetch('http://127.0.0.1:5000/score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log('Score:', data.score);
                if(currentPlayer == 2) {
                    value1 += data.score
                    if(method == 0) {
                        document.getElementById('player1-score').textContent = `Player1 Score: ${value1}`;
                    } else {
                        document.getElementById('player1-score').textContent = `Your Score: ${value1}`;
                    }
                } else {
                    value2 += data.score
                    if(method == 0) {
                        document.getElementById('player2-score').textContent = `Player2 Score: ${value2}`;
                    } else {
                        document.getElementById('player2-score').textContent = `Ai Score: ${value2}`;
                    }
                }
                
            } else {
                console.error('Error in response:', await response.json());
            }
        } catch (error) {
            console.error('Error sending request:', error);
        }
    }

    function isValidMove(col) {
        return board[0][col] === 0;
    }

    function getLowestEmptyRow(col) {
        for (let row = rows - 1; row >= 0; row--) {
            if (board[row][col] === 0) return row;
        }
        return -1;
    }

    function makeMove(row, col) {
        board[row][col] = currentPlayer;
        currentPlayer = currentPlayer === 1 ? 2 : 1;
    }

    function updateBoard() {
        const cells = container.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            cell.className = 'cell';
            if (board[row][col] === 1) cell.classList.add('player1');
            if (board[row][col] === 2) cell.classList.add('player2');
        });
    }

    function handleCellHover(event) {
        const col = parseInt(event.target.dataset.col);
        const cellsInColumn = container.querySelectorAll(`.cell[data-col="${col}"]`);
        cellsInColumn.forEach(cell => cell.classList.add('hovered-column'));
    }

    function handleCellHoverOut(event) {
        const col = parseInt(event.target.dataset.col);
        const cellsInColumn = container.querySelectorAll(`.cell[data-col="${col}"]`);
        cellsInColumn.forEach(cell => cell.classList.remove('hovered-column'));
    }

    function convertBoardToCharachterFormat(board) {
        return board.map(row => row.map(cell => {
            if (cell === 0) return '';
            if (cell === 1) return 'r'; 
            if (cell === 2) return 'y';
        }));
    }

    function convertPlayerToCharachterFormat(player) {
        return player === 1 ? 'r' : 'y';
    }

    function convertMethodToStringFormat(method) {
        if(method == 1) {
            return "MinMax";
        } else if(method == 2) {
            return "AlphaBeta";
        } else if(method == 3) {
            return "ExpectiiMinMax";
        }
    }

    container.innerHTML = `
        <div class="in-game-details">
            <div class="players-status">
            ${
                method == 0 
                ? `
                <h1 id="player1-score" style="color: #E94949;">Player1 Score: ${value1}</h1>
                <h1 id="player2-score" style="color: #FFD634;">Player2 Score: ${value2}</h1>` 
                : `
                <h1 id="player1-score" style="color: #E94949;">Your Score: ${value1}</h1>
                <h1 id="player2-score" style="color: #FFD634;">AI Score: ${value2}</h1>`
            }
            </div>
            <a class="btn btn-gold">Show Search Tree</a>
        </div>

        ${createBoard()}
    `;

    const cells = container.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
        cell.addEventListener('mouseenter', handleCellHover);
        cell.addEventListener('mouseleave', handleCellHoverOut);
    });
}
