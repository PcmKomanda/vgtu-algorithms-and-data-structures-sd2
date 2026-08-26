import fs from "fs";
import logger from "../logger.js";

export function saveFightHistory(player_1, player_2, winner, rounds) {
  const fightData = {
    timestamp: new Date().toISOString(),
    player_1: player_1.getName(),
    player_2: player_2.getName(),
    winner: winner.getName(),
    rounds,
  };

  // Create logs directory if it doesn't exist
  if (!fs.existsSync("./logs")) {
    fs.mkdirSync("./logs", { recursive: true });
  }

  const historyFile = "./logs/fight_history.json";
  let allHistory = [];

  if (fs.existsSync(historyFile)) {
    try {
      allHistory = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
    } catch (error) {
      logger(`Error reading fight history: ${error.message}`);
    }
  }

  allHistory.push(fightData);

  try {
    fs.writeFileSync(historyFile, JSON.stringify(allHistory, null, 2));
    logger(`Fight history saved to ${historyFile}`);
  } catch (error) {
    logger(`Error saving fight history: ${error.message}`);
  }
}
