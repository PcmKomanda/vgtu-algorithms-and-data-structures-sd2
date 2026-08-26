import { printAt } from "../helpers/printer.js";
import logger from "../logger.js";
import Colors from "./colors.js";

export class Player {
  constructor(name, score = 0, lives = 3, bot = false) {
    this.name = name;
    this.score = score;
    this.lives = lives;
    this.lives_left = lives;
    this.bot = bot;
  }

  getID() {
    return this.name.split(" ")[1];
  }

  getName() {
    return this.name;
  }

  getHealth() {
    return this.lives_left;
  }

  getScore() {
    return this.score;
  }

  isBot() {
    return this.bot;
  }

  print(player) {
    const user_id = this.getID();

    const isPlayerTurn =
      parseInt(user_id) === parseInt(player ? player.getID() : 0);

    const isEliminated = this.lives_left === 0;
    const healthBar =
      `${Colors.FG_RED}${"♥".repeat(this.lives_left)}${Colors.RESET}` +
      "♡".repeat(this.lives - this.lives_left);
    let text = `${
      isPlayerTurn ? Colors.FG_YELLOW : isEliminated ? Colors.FG_RED : ""
    }${this.isBot() ? "[BOT] " : ""}${this.name}: ${Colors.RESET}`;

    const l = this.isBot() ? 8 + this.name.length : this.name.length + 2;
    // top_left - 1, top_right - 2, bottom_left - 3, bottom_right - 4
    logger(`Printing player: ${this.name}`);
    switch (user_id) {
      case "1":
        printAt(0, 0, `${text}${healthBar}`);
        break;
      case "2":
        printAt(
          process.stdout.columns - l - this.lives,
          0,
          `${text}${healthBar}`
        );
        break;
      case "3":
        printAt(0, process.stdout.rows - 1, `${text}${healthBar}`);
        break;
      case "4":
        printAt(
          process.stdout.columns - l - this.lives,
          process.stdout.rows - 1,
          `${text}${healthBar}`
        );
        break;
      default:
        break;
    }
  }

  randomMove() {
    const moves = ["rock", "paper", "scissors"];
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }
}

export class Players {
  constructor() {
    this.players = [];
  }

  addPlayer(player) {
    this.players.push(player);
  }

  clear() {
    this.players = [];
  }

  getPlayers() {
    return this.players;
  }

  getCurrentPlayer(turn) {
    return this.players[turn - 1];
  }

  getAlivePlayers() {
    return this.players.filter((player) => player.getHealth() > 0);
  }

  hasWinner() {
    return this.getAlivePlayers().length === 1;
  }

  getWinner() {
    const alivePlayers = this.getAlivePlayers();
    return alivePlayers.length === 1 ? alivePlayers[0] : null;
  }
}
