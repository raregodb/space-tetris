import * as tetrominos from "./tetrominos.js"
import {colors} from "./tetrominos.js";
import {displayLeaderboard} from "./index.js";


const canvas = document.getElementById('Well');
const context = canvas.getContext('2d');

const nextTetrominoCanvas = document.getElementById("nextTetrominoCanvas");
const nextTetrominoContext = nextTetrominoCanvas.getContext('2d');


let destroyAudio = new Audio('../audio/laser2.mp3');

let gameOver = false;
let tetrominoSequence = [];
let grid = 32;
let frames = 34;
let countFrames = 0;

let level = 0;
let score = 0;
let countDestroyedLines = 0;

let rAF = null;

const playField = [];
const nextTetrominoField = [];

for (let row = -4; row < 20; row++) {
    playField[row] = [];

    for (let col = 0; col < 10; col++) {
        playField[row][col] = 0;
    }
}

for (let row = 0; row < 4; row++) {
    nextTetrominoField[row] = [];

    for (let col = 0; col < 4; col++) {
        nextTetrominoField[row][col] = 0;
    }
}

function generateRandomTetrominoSequence() {
    const tetrominoes = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    shuffle(tetrominoes);

    return tetrominoes;
}


// Проверка на возможность передвижения на указанные matrix, cellRow, cellCol
function isValidMove(matrix, cellRow, cellCol) {
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col] && (
                // Какая-то часть тетрамино находится вне канваса?
                cellCol + col < 0 ||
                cellCol + col >= playField[0].length ||
                cellRow + row >= playField.length ||
                // Тетрамино столкнулась с другой фигурой?
                playField[cellRow + row][cellCol + col])
            ) {
                return false;
            }
        }
    }
    return true;
}


// Функция обновления счета и уровней, а также увелечение скорости
function upgradeScoreSystem(comboLines) {
    if (countDestroyedLines >= 10 && countDestroyedLines !== 0) {
        level++;
        if (frames >= 6) {
            frames -= 2;
        }
        countDestroyedLines = 0;
    }

    switch (comboLines) {
        case 1:
            score += 40 * (comboLines + 1);
            break;

        case 2:
            score += 100 * (comboLines + 1);
            break;

        case 3:
            score += 300 * (comboLines + 1);
            break;

        case 4:
            score += 1200 * (comboLines + 1);
            break;

        default:
            break;
    }

    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('level').textContent = `Level: ${level}`;
}

// Расположить тетрамино на игровом поле
function placeTetromino() {
    let countComboLines = 0;

    for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
            if (tetromino.matrix[row][col]) {
                //Условия для проигрыша: какая-то часть тетрамино вне экрана сверху
                if (tetromino.row + row < 0) {
                    saveScore(localStorage.getItem("tetris.username"), score);
                    displayLeaderboard();
                    return showGameOver(); // Возвращаем экран конца игры
                }
                // Добавляем на матрицу поля значения тетрамино
                playField[tetromino.row + row][tetromino.col + col] = tetromino.name;
            }
        }
    }

    // Проверка на уничтожение линий. Идем снизу вверх (с последней строки до 0)
    for (let row = playField.length - 1; row >= 0; ) {
        // Каждый элемент в строке чем-то заполнен (не 0)
        if (playField[row].every(cell => !!cell)) {
            // Сдвигаем каждую строку сверху на один вниз вместо этой (она уничтожается)
            for (let r = row; r >= 0; r--) {
                for (let c = 0; c < playField[r].length; c++) {
                    playField[r][c] = playField[r-1][c];
                }
            }
            // Подсчитываем кол-во уничтоженных линий всего и комбо линий
            countDestroyedLines++;
            countComboLines++;

            // Звук
            if (!gameOver)
                destroyAudio.play();
        }
        else {
            row--;
        }
    }

    upgradeScoreSystem(countComboLines);
    countComboLines = 0;

    tetromino = getNextTetromino();
    tetrominoSequence.pop();
}


// Получить следующий тетрамино
function getNextTetromino() {
    if (tetrominoSequence.length === 0) {
        tetrominoSequence = generateRandomTetrominoSequence();
    }

    let tetrominoName = tetrominoSequence[tetrominoSequence.length - 1];
    let tetrominoMatrix = tetrominos.tetrominos[tetrominoName];
    let col = Math.floor(playField[0].length / 2) - Math.floor(tetrominoMatrix[0].length / 2);
    let row = -2;

    return {
        name: tetrominoName,
        matrix: tetrominoMatrix,
        row: row,
        col: col
    };
}

let tetromino = getNextTetromino();
tetrominoSequence.pop();


// Попытка фигуры переместиться вниз на одну клеточку
function tryToMove() {
    // Обнуляем счетчик кадров
    countFrames = 0;

    let newRow = tetromino.row + 1;

    if (isValidMove(tetromino.matrix, newRow, tetromino.col)) {
        tetromino.row = newRow;
    }
    else {
        placeTetromino();
    }
}


// Отрисовываем следующий тетрамино (в доп канвасе)
function upgradeNextTetrominoVisualization() {
    nextTetrominoContext.clearRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
    let nextTetromino = getNextTetromino();


    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (nextTetromino.matrix[row][col]) {
                const name = nextTetromino.name;
                nextTetrominoContext.fillStyle = tetrominos.colors[name];
                nextTetrominoContext.fillRect(col * grid, row * grid, grid-1, grid-1);
            }
        }
    }
}

// Конец игры
function showGameOver() {
    cancelAnimationFrame(rAF);
    gameOver = true;

    // Рисуем полупрозрачный черный прямоугольник
    context.fillStyle = 'darkred';
    context.globalAlpha = 0.75;
    context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);

// Сбрасываем прозрачность
    context.globalAlpha = 1;

// Устанавливаем стиль текста
    context.fillStyle = 'crimson'; // Ярко-красный цвет текста
    context.font = '36px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

// Рисуем обводку текста
    const text = 'GAME OVER!';
    const x = canvas.width / 2;
    const y = canvas.height / 2;

// Рисуем обводку (темно-красный цвет)
    context.fillStyle = 'darkred';
    context.fillText(text, x + 2, y); // Смещение вправо
    context.fillText(text, x - 2, y); // Смещение влево
    context.fillText(text, x, y + 2); // Смещение вниз
    context.fillText(text, x, y - 2); // Смещение вверх

// Рисуем основной текст
    context.fillStyle = 'crimson'; // Основной цвет текста
    context.fillText(text, x, y); // Основной текст
}


// Сохраняем счет
export function saveScore(username, score) {
    if (!username)
        username = "Гость";
    const scores = JSON.parse(localStorage.getItem("tetris.scores")) || [];
    let check = false;
    for (let i = 0; i < scores.length; i++) {
        if (scores[i].username === username) {
            if (scores[i].score < score)
                scores[i].score = score;
            check = true;
            break;
        }
    }
    if (!check)
        scores.push({ username, score });

    scores.sort((a, b) => b.score - a.score); // Сортируем по убыванию очков
    localStorage.setItem("tetris.scores", JSON.stringify(scores.slice(0, 10))); // Сохраняем только топ 10

    check = false;
}


// Перезапускаем игру
function restartGame() {
    gameOver = false;
    score = 0;
    level = 0;
    frames = 34;
    countDestroyedLines = 0;
    upgradeScoreSystem(0);

    context.clearRect(0,0,canvas.width,canvas.height);

    for (let row = -2; row < playField.length; row++) {
        for (let col = 0; col < playField[row].length; col++) {
            playField[row][col] = 0;
        }
    }

    tetrominoSequence.length = 0;
    tetromino = getNextTetromino();
    tetrominoSequence.pop();

    // Start the game loop again
    rAF = requestAnimationFrame(gameLoop);
}


// Рисуем разметку на игровом поле
function drawGrid () {
    context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    context.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += grid) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
    }

    for (let y = 0; y < canvas.height; y += grid) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
    }
}


// Главный цикл игры
export function gameLoop() {
    // создает цикл, который обновляет состояние игры и отрисовывает элементы на экране с определенной частотой.
    rAF = requestAnimationFrame(gameLoop);
    // Очищаем наше игровое поле
    context.clearRect(0,0,canvas.width,canvas.height);

    // Рисуем сетку на нем
    drawGrid();

    // Рисуем игровое поле со всеми статичными фигурами
    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 10; col++) {
            if (playField[row][col]) {
                const name = playField[row][col];
                context.fillStyle = tetrominos.colors[name];
                context.fillRect(col * grid, row * grid, grid-1, grid-1);
            }

        }
    }

    // По прохождении определенного кол-ва фреймов фигура пытается упасть (без участия игрока)
    if (tetromino) {
        if (++countFrames > frames) {
            tryToMove();
        }
    }

    context.fillStyle = colors[tetromino.name];


    // Отрисовка движущейся (управляемой игроком) фигуры
    for (let row = 0; row < tetromino.matrix.length; row++) {
        for (let col = 0; col < tetromino.matrix[row].length; col++) {
            if (tetromino.matrix[row][col]) {
                context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid-1, grid-1);
            }
        }
    }

    upgradeNextTetrominoVisualization();
}


// Слушатель для нажатия кнопок
document.addEventListener('keydown', (event) => {
    const keyName = event.key;
    let newCol;
    let newMatrix;
    let newRow;

    //console.log(keyName);
    switch (keyName) {

        case "ArrowRight":
            newCol = tetromino.col + 1;

            if (isValidMove(tetromino.matrix, tetromino.row, newCol)) {
                tetromino.col = newCol;
            }
            break;

        case "ArrowLeft":
            newCol = tetromino.col - 1;

            if (isValidMove(tetromino.matrix, tetromino.row, newCol)) {
                tetromino.col = newCol;
            }
            break;

        case "ArrowUp":
            newMatrix = tetromino.matrix[0].map((val, index) => tetromino.matrix.map(row => row[index]).reverse());

            if (isValidMove(newMatrix, tetromino.row, tetromino.col)) {
                tetromino.matrix = newMatrix;
            }
            break;

        case "ArrowDown":
            newRow = tetromino.row + 1;

            if (isValidMove(tetromino.matrix, newRow, tetromino.col)) {
                tetromino.row = newRow;
                score++;
            }
            break;

        case " ":
            let check = false;

            while (!check) {
                newRow = tetromino.row + 1;
                if (!isValidMove(tetromino.matrix, newRow, tetromino.col))
                {
                    tetromino.row = newRow - 1;

                    placeTetromino();
                    check = true;
                }
                else {
                    tetromino.row = newRow;
                    score += 2;
                }
            }
            let dropAudio = new Audio('../audio/laser.mp3');
            if (!gameOver)
                dropAudio.play();
            break;

        case 'r' ||'R':
            saveScore(localStorage.getItem("tetris.username"), score);
            displayLeaderboard();
            showGameOver();
            restartGame();
            break;
    }


})
