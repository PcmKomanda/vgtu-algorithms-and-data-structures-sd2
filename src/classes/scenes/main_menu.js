import { printBatch, resetCursor } from "../../helpers/printer.js";
import Colors from "../colors.js";

class MainMenuScene {
  constructor(game) {
    this.game = game;

    this.screen = this.game.screen;
  }

  render() {
    console.clear();
    resetCursor();

    const lines = [];

    lines.push({
      x: this.screen.center_w - 7,
      y: this.screen.center_h,
      text: `${Colors.FG_GREEN}${Colors.BOLD}Muštynių žaidimas!${Colors.RESET}`,
    });

    this.game.text.main_menu.options.forEach((option, index) => {
      option = option.split(": ");
      lines.push({
        x: this.screen.center_w - 10,
        y: this.screen.center_h + index + 2,
        text: `${Colors.FG_CYAN}${Colors.BOLD}${option[0]}${Colors.RESET}: ${option[1]}`,
      });
    });

    printBatch(lines);
  }

  handleInput(k) {
    if (k === "\r") {
      // this.game.game_state.current_status = "setup_game";
      this.game.sceneHandler.setScene("setup_game");
      this.game.main();
    }
  }
}

export default MainMenuScene;
