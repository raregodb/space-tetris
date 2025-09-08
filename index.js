// Считываем имя для приветсвия на игровой странице
export function read() {
    const username = localStorage.getItem("tetris.username") || "Гость"; // Устанавливаем значение или "Гость"
    const welcomeMessage = document.getElementById("welcomeMessage");
    welcomeMessage.innerHTML = `<h1>Удачной игры, ${username}!<h1>`; // Устанавливаем текст приветствия
}


// Обновляем таблицу лидеров
export function displayLeaderboard() {
    const scores = JSON.parse(localStorage.getItem("tetris.scores")) || [];
    const scoreTable = document.getElementById('scoreTable');
    scoreTable.innerHTML = '<h3>TOP 10</h3>'; // Очищаем таблицу и добавляем заголовок

    // Добавляем рекордсменов
    scores.forEach((entry, index) => {
        const scoreEntry = document.createElement('div');
        scoreEntry.textContent = `${index + 1}. ${entry.username}: ${entry.score}`;
        scoreTable.appendChild(scoreEntry);
    });
}


// Вспомогательная функция для очищения таблицы
export function clearScoreTable() {
    const scoreTable = document.querySelector('.scoreTable');
    scoreTable.innerHTML = '<h3>TOP 10</h3>'; // Очищаем таблицу и добавляем заголовок
    localStorage.removeItem("tetris.scores");
}


// Воспроизведение фоновой музыки
export function playAudio() {
    const music = document.getElementById("music");
    if (music.paused) {
        music.play(); // Если музыка приостановлена, воспроизводим ее
    } else {
        music.pause(); // Если музыка воспроизводится, приостанавливаем ее
    }
}