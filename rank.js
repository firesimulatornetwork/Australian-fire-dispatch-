// This file contains the logic for the player ranking system.

// Define the different rank levels and the score required to achieve them.
const rankLevels = [
    { level: "Rookie", score: 0 },
    { level: "Cadet", score: 10 },
    { level: "Lieutenant", score: 25 },
    { level: "Captain", score: 50 },
    { level: "Commander", score: 100 },
    { level: "Chief", score: 250 },
];

/**
 * Updates the player's rank based on their score.
 * This function is called every time a mission is completed.
 * @param {number} points - The points to add to the player's score.
 */
function updateRank(points) {
    // Add the earned points to the player's total rank score.
    gameState.rank.score += points;

    // Iterate through the rank levels to check if the player has advanced.
    for (let i = rankLevels.length - 1; i >= 0; i--) {
        const rank = rankLevels[i];
        // If the player's current score is greater than or equal to the score required for a rank,
        // and that rank is higher than their current rank, update their rank level.
        if (gameState.rank.score >= rank.score && rank.level !== gameState.rank.level) {
            gameState.rank.level = rank.level;
            updateUI(); // Refresh the UI to show the new rank.
            return; // Exit the function once the rank is updated.
        }
    }
}