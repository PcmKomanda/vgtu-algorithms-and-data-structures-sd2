import { printBatch, resetCursor } from "../../helpers/printer.js";
import Colors from "../colors.js";

class SetupGameScene {
  static MAX_PLAYERS = 4;
  static MIN_PLAYERS = 2;
  static MAX_LIVES = 50;
  constructor(game) {
    this.game = game;

    this.screen = this.game.screen;

    this.current_selection = Object.keys(this.game.SETTINGS)[0];
  }

  render() {
    console.clear();
    const lines = [];

    lines.push({
      x: this.screen.center_w - 7,
      y: this.screen.center_h,
      text: `${Colors.FG_GREEN}${Colors.BOLD}Nustatymai${Colors.RESET}`,
    });

    const keys = Object.keys(this.game.SETTINGS);
    keys.forEach((key, index) => {
      const isSelected = this.current_selection === key;
      const displayText = `${key}: ${this.game.SETTINGS[key]}`;
      const text = isSelected
        ? `${Colors.FG_YELLOW}${Colors.BOLD}${displayText}${Colors.RESET}`
        : displayText;
      lines.push({
        x: this.game.screen.center_w - 10,
        y: this.game.screen.center_h + index + 2,
        text,
      });
    });

    lines.push({
      x: 0,
      y: this.screen.rows,
      text: Colors.whiteDim(
        "W/S: Keisti nustatymą, A/D: Keisti reikšmę, Enter: Patvirtinti"
      ),
    });

    printBatch(lines);
  }

  handleInput(k) {
    const Settings = this.game.SETTINGS;
    const MaxPlayers = SetupGameScene.MAX_PLAYERS;
    const MinPlayers = SetupGameScene.MIN_PLAYERS;
    const MaxLives = SetupGameScene.MAX_LIVES;

    if (k === "\x1B") {
      this.game.sceneHandler.setScene("main_menu");
      this.current_selection = "PLAYERS";
      console.clear();
      resetCursor();
      this.game.main();
    } else if (k === "\r") {
      this.game.sceneHandler.setScene("setup_players");
      this.current_selection = 0;
      this.game.main();
    } else if (k === "w") {
      const keys = Object.keys(Settings);
      const currentIndex = keys.indexOf(this.current_selection);
      const newIndex = (currentIndex - 1 + keys.length) % keys.length;
      this.current_selection = keys[newIndex];
      this.render();
    } else if (k === "s") {
      const keys = Object.keys(Settings);
      const currentIndex = keys.indexOf(this.current_selection);
      const newIndex = (currentIndex + 1) % keys.length;
      this.current_selection = keys[newIndex];
      this.render();
    } else if (k === "d") {
      if (this.isCurrentSelection("PLAYERS") && Settings.PLAYERS < MaxPlayers) {
        Settings.PLAYERS++;
      } else if (this.isCurrentSelection("COMBOS")) {
        Settings.COMBOS = !Settings.COMBOS;
      } else if (
        this.isCurrentSelection("INITIAL_LIVES") &&
        Settings.INITIAL_LIVES < MaxLives
      ) {
        Settings.INITIAL_LIVES++;
      }
      this.render();
    } else if (k === "a") {
      if (this.isCurrentSelection("PLAYERS") && Settings.PLAYERS > MinPlayers) {
        Settings.PLAYERS--;
      } else if (this.isCurrentSelection("COMBOS")) {
        Settings.COMBOS = !Settings.COMBOS;
      } else if (
        !this.isCurrentSelection("PLAYERS") &&
        !this.isCurrentSelection("COMBOS") &&
        Settings[this.current_selection] > 1
      ) {
        Settings[this.current_selection]--;
      }
      this.render();
    }
  }

  isCurrentSelection(selection) {
    return this.current_selection === selection;
  }
}

export default SetupGameScene;
