import fs from "fs";
function logger(message) {
  // Log the message with a timestamp to a log file in logs directory
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs");
  }

  // clear the log file every time the program starts. Confirm it by checking date
  if (process.uptime() * 1000 < 1) {
    fs.writeFileSync("logs/game.log", "New run found\n");
  }

  const logFile = `logs/game.log`;

  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, "New run found\n");
  }

  fs.appendFileSync(logFile, logMessage);
}

export default logger;
