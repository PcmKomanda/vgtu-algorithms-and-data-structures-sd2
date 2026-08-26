import { printAt } from "../helpers/printer.js";
import logger from "../logger.js";

export default class InputHandler {
  constructor(game) {
    this.game = game;
  }

  handleKey(key) {
    const k = key.toString().toLowerCase();

    // 1. Handle Global Inputs (Exit, etc.)
    if (this._handleGlobalInput(k)) return;

    // 2. Handle Scene-Specific Inputs
    const current_scene = this.game.sceneHandler.getCurrentSceneInstance();
    if (current_scene) {
      current_scene.then((sceneInstance) => {
        if (sceneInstance && typeof sceneInstance.handleInput === "function") {
          sceneInstance.handleInput(k);
        }
      });
    }
  }

  _handleGlobalInput(k) {
    if (k === "\u0003" || k === "q") {
      logger(
        `'${k === "\u0003" ? "Ctrl+C" : "q"}' key pressed on ${
          this.game.game_state.current_status
        }, exiting game`
      );
      this.game.game_state.current_status = "exit";
      console.clear();
      printAt(this.game.screen.center_w - 5, 0, "Viso gero!");
      setTimeout(() => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.exit(0);
      }, 2000);

      return true;
    }
    return false;
  }
}
