import { printAt } from "../helpers/printer.js";
import Colors from "./colors.js";

class SceneHandler {
  constructor(game) {
    this.game = game;

    this.scenes = {
      main_menu: import("./scenes/main_menu.js"),
      setup_game: import("./scenes/setup_game.js"),
      setup_players: import("./scenes/setup_players.js"),
      in_game: import("./scenes/in_game.js"),
    };

    this.cachedScenes = {};
  }

  async getSceneInstance(status) {
    if (!this.scenes[status]) return null;

    if (!this.cachedScenes[status]) {
      const module = await this.scenes[status];
      const SceneClass = module.default;
      this.cachedScenes[status] = new SceneClass(this.game);
    }
    return this.cachedScenes[status];
  }

  async renderScene() {
    const currentStatus = this.game.game_state.current_status;
    const sceneInstance = await this.getSceneInstance(currentStatus);

    if (sceneInstance) {
      sceneInstance.render();
    } else {
      console.clear();
      printAt(
        this.game.screen.center_w - 14,
        this.game.screen.center_h,
        `${Colors.FG_RED}${Colors.BOLD}No scene found for status: ${currentStatus}${Colors.RESET}`
      );
    }
  }

  getCurrentSceneInstance() {
    const currentStatus = this.game.game_state.current_status;
    return this.getSceneInstance(currentStatus);
  }

  setScene(status) {
    this.game.game_state.current_status = status;
  }

  getScene(status) {
    return this.cachedScenes[status] || null;
  }

  isScene(status) {
    return this.game.game_state.current_status === status;
  }
}

export default SceneHandler;
