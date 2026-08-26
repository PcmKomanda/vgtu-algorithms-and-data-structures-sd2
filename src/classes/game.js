import fs from "fs";
import logger from "../logger.js";
import InputHandler from "./inputHandler.js";
import { Player, Players } from "./player.js";
import SceneHandler from "./sceneHandler.js";
import Timer from "./timer.js";
class Game {
  constructor() {
    this.game_state = {
      current_status: "main_menu",
      current_round: 1,
    };

    this.text = JSON.parse(fs.readFileSync("./src/config/text.json", "utf-8"));
    this.rules = JSON.parse(
      fs.readFileSync("./src/config/rules.json", "utf-8")
    );

    const total_cols = process.stdout.columns;
    const total_rows = process.stdout.rows;
    this.screen = {
      cols: total_cols,
      rows: total_rows,
      center_w: Math.floor(total_cols / 2),
      center_h: Math.floor(total_rows / 2),
    };

    this.inputHandler = new InputHandler(this);
    this.players = new Players();
    this.timer = new Timer(this);
    this.sceneHandler = new SceneHandler(this);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", (key) => this.inputHandler.handleKey(key));

    this.SETTINGS = {
      PLAYERS: 2, // number of players
      INITIAL_LIVES: 10, // starting lives per player
      COMBOS: true, // enable or disable combos
    };
  }

  main() {
    this.sceneHandler.renderScene();
  }

  // Player management
  initializePlayer(name, lives = this.SETTINGS.INITIAL_LIVES, bot = false) {
    logger(`Initializing player: ${name} with ${lives} lives, bot: ${bot}`);
    this.players.addPlayer(new Player(name, 0, lives, bot));
  }

  getCurrentPlayer() {
    logger(
      `${
        this.players.getCurrentPlayer(this.game_state.current_turn) instanceof
        Player
      }`
    );
    return this.players.getCurrentPlayer(this.game_state.current_turn);
  }

  getPlayers() {
    return this.players.getPlayers();
  }
  // Reset game state
  reset() {
    this.players.clear();
    this.game_state.current_turn = 1;
    this.game_state.current_round = 1;
    this.timer.reset();
  }
}

export default Game;
