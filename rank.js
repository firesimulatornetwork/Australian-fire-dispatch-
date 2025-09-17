// We no longer need the hardcoded ranks here.
// They are now defined in settings.js.

function updateRank(points) {
    gameState.rank.score += points;
    let newRank = gameState.rank.level;
    
    for (let i = settings.ranks.length - 1; i >= 0; i--) {
        if (gameState.rank.score >= settings.ranks[i].score) {
            newRank = settings.ranks[i].name;
            break;
        }
    }

    if (newRank !== gameState.rank.level) {
        gameState.rank.level = newRank;
        alert(`Congratulations! You've been promoted to ${newRank}!`);
    }

    updateUI();
}