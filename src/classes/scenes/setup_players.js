import { printBatch, resetCursor } from "../../helpers/printer.js";
import Colors from "../colors.js";

class SetupPlayersScene {
  constructor(game) {
    this.game = game;

    this.settings = this.game.SETTINGS;
    this.screen = this.game.screen;

    this.temp_players = [];
    this.current_selection = 0;
  }

  render() {
    console.clear();
    resetCursor();
    const lines = [];

    lines.push({
      x: this.screen.center_w - 10,
      y: this.screen.center_h,
      text: `${Colors.FG_GREEN}${Colors.BOLD}Žaidėjų nustatymai${Colors.RESET}`,
    });
    // name is automatically Player 1, Player 2, etc. But user still has to have option to go up/down to select player and change type to bot/human
    for (let i = 0; i < this.settings.PLAYERS; i++) {
      if (this.temp_players[i] === undefined) {
        this.temp_players[i] = { bot: false };
      }
      const isSelected = this.current_selection === i;
      const playerType = this.temp_players[i].bot ? "Bot" : "Human";
      const displayText = `Player ${i + 1}: ${playerType}`;
      const text = isSelected
        ? `${Colors.FG_YELLOW}${Colors.BOLD}${displayText}${Colors.RESET}`
        : displayText;
      lines.push({
        x: this.screen.center_w - 15,
        y: this.screen.center_h + i + 2,
        text,
      });
    }

    lines.push({
      x: 0,
      y: this.screen.rows,
      text: Colors.whiteDim(
        "W/S: Keisti žaidėją, A/D: Keisti tipą, Enter: Pradėti žaidimą"
      ),
    });
    printBatch(lines);
  }

  handleInput(k) {
    if (k === "\x1B") {
      this.game.sceneHandler.setScene("setup_game");
      this.current_selection = "PLAYERS";
      console.clear();
      resetCursor();
      this.game.main();
    } else if (k === "\r") {
      this.game.reset();

      this.game.SETTINGS = this.settings;

      for (let i = 0; i < this.settings.PLAYERS; i++) {
        this.game.initializePlayer(
          `Player ${i + 1}`,
          this.settings.INITIAL_LIVES,
          this.temp_players[i]?.bot
        );
      }
      this.game.sceneHandler.setScene("in_game");
      console.clear();
      resetCursor();
      this.game.main();
    } else if (k === "w") {
      const currentIndex = this.current_selection;
      const newIndex =
        (currentIndex - 1 + this.settings.PLAYERS) % this.settings.PLAYERS;
      this.current_selection = newIndex;
      this.render();
    } else if (k === "s") {
      const currentIndex = this.current_selection;
      const newIndex = (currentIndex + 1) % this.settings.PLAYERS;
      this.current_selection = newIndex;
      this.render();
    } else if (k === "a" || k === "d") {
      const player = this.temp_players[this.current_selection];
      player.bot = !player.bot;
      const type = player.bot ? "Bot" : "Human";
      this.render();
    }
  }
}

export default SetupPlayersScene;
