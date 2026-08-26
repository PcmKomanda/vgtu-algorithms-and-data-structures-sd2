import { printAt } from "../helpers/printer.js";
import Colors from "./colors.js";

class Timer {
  constructor(game) {
    this.elapsed = 0;
    this.interval = null;
    this.game = game;
  }

  start() {
    if (this.interval) return;

    this.interval = setInterval(() => {
      if (this.game.game_state.current_status === "in_game") {
        this.elapsed++;
        this.printElapsed();
      }
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  reset() {
    this.elapsed = 0;
  }

  getElapsed() {
    const totalSeconds = this.elapsed;
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return `${minutes}:${seconds}`;
  }

  printElapsed() {
    const text = this.getElapsed();
    printAt(
      this.game.screen.center_w - 5,
      0,
      `${Colors.FG_MAGENTA}${Colors.BOLD}${text}${Colors.RESET}`
    );
  }
}

export default Timer;
