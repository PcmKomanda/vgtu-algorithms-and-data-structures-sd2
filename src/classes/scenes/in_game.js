import fs from "fs";
import { LinkedList, Queue, Stack } from "mnemonist";
import { saveFightHistory } from "../../helpers/fightHistorySaver.js";
import {
  clearScreenArea,
  printAt,
  printBatch,
  printRPS,
  resetCursor,
} from "../../helpers/printer.js";
import Colors from "../colors.js";

class inGameScene {
  constructor(game) {
    this.game = game;

    this.timer = this.game.timer;
    this.screen = this.game.screen;

    this.rules = JSON.parse(
      fs.readFileSync("./src/config/rules.json", "utf-8")
    );

    this.temp_move = null;
    this.isHuman = null;
    this.waitingForEnter = false;
    this.waitingForUndo = false;
    this.currentPlayer = null;

    this.p1_move_history = new Queue();
    this.p2_move_history = new Queue();
    this.p1_no_damage_streak = 0;
    this.p2_no_damage_streak = 0;

    this.fightHistory = new Stack();
    this.p1_has_undone = false;
    this.p2_has_undone = false;
    this.p1_skip_next = false;
    this.p2_skip_next = false;

    this.completeFightHistory = new LinkedList();
  }

  async render() {
    if (!this.timer.interval) {
      this.timer.start();
    }

    console.clear();
    resetCursor();

    this.timer.printElapsed();

    this.renderHealthBars();

    if (this.game.SETTINGS.PLAYERS === 2) {
      await this.fight(
        this.game.players.getPlayers()[0],
        this.game.players.getPlayers()[1]
      );

      const returnMsg = "Press Enter to return to main menu";
      printAt(
        this.screen.center_w - Math.floor(returnMsg.length / 2),
        this.screen.center_h + 12,
        returnMsg.replace("Enter", Colors.BOLD + "Enter" + Colors.RESET)
      );

      await this.waitForEnter();
      this.game.sceneHandler.setScene("main_menu");
      this.game.main();
    } else if (this.game.SETTINGS.PLAYERS === 3) {
      this.startThreePlayerFight();
    } else if (this.game.SETTINGS.PLAYERS === 4) {
      this.startFourPlayerFight();
    }
  }

  handleInput(k) {
    if (this.waitingForEnter && k === "\r") {
      this.waitingForEnter = false;
    }

    if (this.isHuman) {
      if (["r", "p", "s"].includes(k)) {
        const moveMap = { r: "rock", p: "paper", s: "scissors" };
        this.temp_move = moveMap[k];
      }
      if (this.waitingForUndo && ["1", "2", "3"].includes(k)) {
        this.undoSteps = parseInt(k);
        this.temp_move = "Undo";
      }
    }
  }

  async fight(player_1, player_2) {
    this.fightPlayers = { player_1, player_2 };

    this.refreshFightState();
    this.completeFightHistory.clear();

    while (player_1.lives_left > 0 && player_2.lives_left > 0) {
      this.clearPlayArea();

      this.printPlayerNames(player_1, player_2);

      let p1_move, p2_move;
      const artWidth = 20;
      const artHeight = 7;
      const spacing = 10;
      const totalWidth = artWidth * 2 + spacing;
      const startX = (this.screen.cols - totalWidth) / 2;
      const y = this.screen.center_h - artHeight / 2;

      if (this.p1_skip_next) {
        const skipMsg = `${player_1.getName()} skips this round!`;
        printAt(
          this.screen.center_w / 2 - skipMsg.length / 2,
          this.screen.center_h,
          skipMsg
        );
        p1_move = null;
        p2_move = await this.getPlayerMove(player_2);

        if (p2_move === "Undo") {
          this.p2_has_undone = true;
          this.p2_skip_next = true;
          this.isHuman = false;
          this.undoFightSteps(this.undoSteps, player_1, player_2);
          this.currentPlayer = null;
          clearScreenArea(0, this.screen.rows - 2, this.screen.cols, 1);
          continue;
        }

        printRPS((this.screen.center_w / 2) * 3, y, `${p2_move}_left`);
        this.p1_skip_next = false;
      } else if (this.p2_skip_next) {
        const skipMsg = `${player_2.getName()} skips this round!`;
        printAt(
          (this.screen.center_w / 2) * 3 - skipMsg.length / 2,
          this.screen.center_h,
          skipMsg
        );
        p1_move = await this.getPlayerMove(player_1);

        if (p1_move === "Undo") {
          this.p1_has_undone = true;
          this.p1_skip_next = true;
          this.isHuman = false;
          this.undoFightSteps(this.undoSteps, player_1, player_2);
          this.currentPlayer = null;
          clearScreenArea(0, this.screen.rows - 2, this.screen.cols, 1);
          continue;
        }

        p2_move = null;
        printRPS(startX, y, `${p1_move}_right`);
        this.p2_skip_next = false;
      } else {
        const moves = await this.getBothMovesAndDisplay(player_1, player_2);

        if (moves.undo) {
          continue;
        }

        p1_move = moves.p1_move;
        p2_move = moves.p2_move;
      }

      if (p1_move) {
        this.p1_move_history.enqueue(p1_move);
        if (this.p1_move_history.size > 3) this.p1_move_history.dequeue();
      }
      if (p2_move) {
        this.p2_move_history.enqueue(p2_move);
        if (this.p2_move_history.size > 3) this.p2_move_history.dequeue();
      }

      let round_winner = null;
      if (!p1_move || !p2_move) {
        round_winner = p1_move ? player_1 : player_2;
      } else if (p1_move === p2_move) {
        round_winner = "draw";
      } else if (this.rules.game_rules[p1_move].beats === p2_move) {
        round_winner = player_1;
      } else {
        round_winner = player_2;
      }

      if (round_winner === "draw") {
        this.p1_no_damage_streak++;
        this.p2_no_damage_streak++;
      } else if (round_winner === player_1) {
        this.p1_no_damage_streak++;
        this.p2_no_damage_streak = 0;
        this.p2_move_history.clear();
      } else if (round_winner === player_2) {
        this.p2_no_damage_streak++;
        this.p1_no_damage_streak = 0;
        this.p1_move_history.clear();
      }

      let damage = 1;

      if (this.game.SETTINGS.COMBOS) {
        const checkPlayerCombo = (player, moveHistory, noStreaks, xPos) => {
          if (
            noStreaks >= 3 &&
            moveHistory.size === 3 &&
            round_winner === player
          ) {
            if (this.checkCombo(moveHistory)) {
              damage = 2;
              const comboMoves = Array.from(moveHistory.values()).join(" → ");
              printAt(
                xPos,
                this.screen.center_h - 10,
                `COMBO! ${comboMoves} - Extra Damage!`
              );
              moveHistory.clear();
            }
          }
        };

        checkPlayerCombo(
          player_1,
          this.p1_move_history,
          this.p1_no_damage_streak,
          this.screen.center_w / 2 - 15
        );
        checkPlayerCombo(
          player_2,
          this.p2_move_history,
          this.p2_no_damage_streak,
          (this.screen.center_w / 2) * 3 - 15
        );
      }

      const p1_moves = Array.from(this.p1_move_history.values());
      const p2_moves = Array.from(this.p2_move_history.values());

      this.fightHistory.push({
        p1_lives: player_1.lives_left,
        p2_lives: player_2.lives_left,
        p1_move_history: p1_moves,
        p2_move_history: p2_moves,
        p1_no_damage_streak: this.p1_no_damage_streak,
        p2_no_damage_streak: this.p2_no_damage_streak,
        p1_move,
        p2_move,
        round_winner: round_winner === "draw" ? "draw" : round_winner.getName(),
        damage,
      });

      if (round_winner === player_1) {
        player_2.lives_left = Math.max(0, player_2.lives_left - damage);
      } else if (round_winner === player_2) {
        player_1.lives_left = Math.max(0, player_1.lives_left - damage);
      }

      this.completeFightHistory.push({
        round: this.completeFightHistory.size + 1,
        player_1_move: p1_move || "skipped",
        player_2_move: p2_move || "skipped",
        winner: round_winner === "draw" ? "draw" : round_winner.getName(),
        damage,
        player_1_lives_after: player_1.lives_left,
        player_2_lives_after: player_2.lives_left,
      });

      this.renderHealthBars();

      if (player_1.lives_left > 0 && player_2.lives_left > 0) {
        clearScreenArea(0, this.screen.rows - 2, this.screen.cols, 1);
        const continueMessage = "Press Enter to continue next round...";
        printAt(
          this.screen.center_w - Math.floor(continueMessage.length / 2),
          this.screen.rows - 3,
          continueMessage
        );
        await this.waitForEnter();
        clearScreenArea(0, this.screen.rows - 3, this.screen.cols, 1);
      }
    }

    const fight_winner = player_1.lives_left > 0 ? player_1 : player_2;

    const fightRounds = Array.from(this.completeFightHistory.values());
    saveFightHistory(player_1, player_2, fight_winner, fightRounds);

    printAt(
      this.screen.center_w - 10,
      this.screen.center_h + 10,
      `Winner: ${fight_winner.getName()}`
    );
  }

  async startThreePlayerFight() {
    const players = this.game.players.getPlayers();
    const player_1 = players[0];

    const otherPlayers = [players[1], players[2]];
    const randomIndex = Math.floor(Math.random() * 2);
    const firstOpponent = otherPlayers[randomIndex];
    const waitingPlayer = otherPlayers[1 - randomIndex];

    printAt(
      this.screen.center_w - 20,
      10,
      `Round 1: ${player_1.getName()} vs ${firstOpponent.getName()}`
    );
    printAt(
      this.screen.center_w - 15,
      11,
      `${waitingPlayer.getName()} waits...`
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // First fight: Player 1 vs random opponent
    await this.fight(player_1, firstOpponent);

    let firstWinner, loser;
    if (player_1.lives_left > 0) {
      firstWinner = player_1;
      loser = firstOpponent;
      firstWinner.lives_left = firstWinner.lives;
    } else {
      firstWinner = firstOpponent;
      loser = player_1;
      firstWinner.lives_left = firstWinner.lives;
    }

    this.clearPlayArea();
    printAt(
      this.screen.center_w - 20,
      10,
      `Final: ${firstWinner.getName()} vs ${waitingPlayer.getName()}`
    );
    printAt(
      this.screen.center_w - 15,
      11,
      `${Colors.FG_RED}${loser.getName()} is eliminated!${Colors.RESET}`
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Final fight: Winner vs waiting player
    await this.fight(firstWinner, waitingPlayer);

    const returnMsg = "Press Enter to return to main menu";
    printAt(
      this.screen.center_w - Math.floor(returnMsg.length / 2),
      this.screen.center_h + 12,
      returnMsg.replace("Enter", Colors.BOLD + "Enter" + Colors.RESET)
    );

    await this.waitForEnter();
    this.game.sceneHandler.setScene("main_menu");
    this.game.main();
  }

  async startFourPlayerFight() {
    const players = this.game.players.getPlayers();

    // Shuffle players for random matchups
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const semifinal1_p1 = shuffled[0];
    const semifinal1_p2 = shuffled[1];
    const semifinal2_p1 = shuffled[2];
    const semifinal2_p2 = shuffled[3];

    this.clearPlayArea();
    printAt(this.screen.center_w - 15, 10, "FOUR PLAYER TOURNAMENT");
    printAt(this.screen.center_w - 15, 12, "Semi-Final 1:");
    printAt(
      this.screen.center_w - 15,
      13,
      `${semifinal1_p1.getName()} vs ${semifinal1_p2.getName()}`
    );
    printAt(this.screen.center_w - 15, 15, "Semi-Final 2:");
    printAt(
      this.screen.center_w - 15,
      16,
      `${semifinal2_p1.getName()} vs ${semifinal2_p2.getName()}`
    );
    const startMsg = "Press Enter to start...";
    printAt(
      this.screen.center_w - Math.floor(startMsg.length / 2),
      20,
      startMsg
    );

    await this.waitForEnter();

    // Semi-Final 1
    this.clearPlayArea();
    printAt(
      this.screen.center_w - 20,
      10,
      `Semi-Final 1: ${semifinal1_p1.getName()} vs ${semifinal1_p2.getName()}`
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.refreshFightState();

    await this.fight(semifinal1_p1, semifinal1_p2);

    // Determine winner of Semi-Final 1
    let winner1, loser1;
    if (semifinal1_p1.lives_left > 0) {
      winner1 = semifinal1_p1;
      loser1 = semifinal1_p2;
      winner1.lives_left = winner1.lives;
    } else {
      winner1 = semifinal1_p2;
      loser1 = semifinal1_p1;
      winner1.lives_left = winner1.lives;
    }

    // Show Semi-Final 1 result
    this.clearPlayArea();
    const sf1WinnerText = `Semi-Final 1 Winner: ${winner1.getName()}`;
    const sf1LoserText = `${loser1.getName()} is eliminated!`;
    const continueText = "Press Enter to continue...";
    printAt(
      this.screen.center_w - Math.floor(sf1WinnerText.length / 2),
      10,
      sf1WinnerText
    );
    printAt(
      this.screen.center_w - Math.floor(sf1LoserText.length / 2),
      11,
      `${Colors.FG_RED}${sf1LoserText}${Colors.RESET}`
    );
    printAt(
      this.screen.center_w - Math.floor(continueText.length / 2),
      15,
      continueText
    );

    await this.waitForEnter();

    // Semi-Final 2
    this.clearPlayArea();
    printAt(
      this.screen.center_w - 20,
      10,
      `Semi-Final 2: ${semifinal2_p1.getName()} vs ${semifinal2_p2.getName()}`
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.refreshFightState();

    await this.fight(semifinal2_p1, semifinal2_p2);

    // Determine winner of Semi-Final 2
    let winner2, loser2;
    if (semifinal2_p1.lives_left > 0) {
      winner2 = semifinal2_p1;
      loser2 = semifinal2_p2;
      winner2.lives_left = winner2.lives;
    } else {
      winner2 = semifinal2_p2;
      loser2 = semifinal2_p1;
      winner2.lives_left = winner2.lives;
    }

    // Show Semi-Final 2 result
    this.clearPlayArea();
    const sf2WinnerText = `Semi-Final 2 Winner: ${winner2.getName()}`;
    const sf2LoserText = `${loser2.getName()} is eliminated!`;
    printAt(
      this.screen.center_w - Math.floor(sf2WinnerText.length / 2),
      10,
      sf2WinnerText
    );
    printAt(
      this.screen.center_w - Math.floor(sf2LoserText.length / 2),
      11,
      `${Colors.FG_RED}${sf2LoserText}${Colors.RESET}`
    );
    printAt(
      this.screen.center_w - Math.floor(continueText.length / 2),
      15,
      continueText
    );

    await this.waitForEnter();

    // Final Fight
    this.clearPlayArea();
    printAt(
      this.screen.center_w - 20,
      10,
      `FINAL: ${winner1.getName()} vs ${winner2.getName()}`
    );
    const loserText = `${loser1.getName()} and ${loser2.getName()} are eliminated!`;
    printAt(
      this.screen.center_w - Math.floor(loserText.length / 2),
      11,
      `${Colors.FG_RED}${loserText}${Colors.RESET}`
    );
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.refreshFightState();

    await this.fight(winner1, winner2);

    const returnMsg = "Press Enter to return to main menu";
    printAt(
      this.screen.center_w - Math.floor(returnMsg.length / 2),
      this.screen.center_h + 12,
      returnMsg.replace("Enter", Colors.BOLD + "Enter" + Colors.RESET)
    );

    await this.waitForEnter();
    this.game.sceneHandler.setScene("main_menu");
    this.game.main();
  }

  refreshFightState() {
    this.p1_move_history.clear();
    this.p2_move_history.clear();
    this.fightHistory.clear();
    this.p1_has_undone = false;
    this.p2_has_undone = false;
    this.p1_skip_next = false;
    this.p2_skip_next = false;
    this.p1_no_damage_streak = 0;
    this.p2_no_damage_streak = 0;
  }

  checkCombo(moveHistory) {
    if (moveHistory.size !== 3) return false;

    const moves = [];
    const iterator = moveHistory.values();
    for (const move of iterator) {
      moves.push(move);
    }

    for (const combo of this.rules.combos) {
      if (
        combo[0] === moves[0] &&
        combo[1] === moves[1] &&
        combo[2] === moves[2]
      ) {
        return true;
      }
    }
    return false;
  }

  undoFightSteps(steps, player_1, player_2) {
    const actualSteps = Math.min(steps, this.fightHistory.size);

    for (let i = 0; i < actualSteps; i++) {
      this.fightHistory.pop();
    }

    if (this.fightHistory.size > 0) {
      const state = this.fightHistory.peek();
      player_1.lives_left = state.p1_lives;
      player_2.lives_left = state.p2_lives;

      this.p1_move_history.clear();
      state.p1_move_history.forEach((move) =>
        this.p1_move_history.enqueue(move)
      );

      this.p2_move_history.clear();
      state.p2_move_history.forEach((move) =>
        this.p2_move_history.enqueue(move)
      );

      this.p1_no_damage_streak = state.p1_no_damage_streak;
      this.p2_no_damage_streak = state.p2_no_damage_streak;
    } else {
      player_1.lives_left = player_1.lives;
      player_2.lives_left = player_2.lives;
      this.p1_move_history.clear();
      this.p2_move_history.clear();
      this.p1_no_damage_streak = 0;
      this.p2_no_damage_streak = 0;
    }

    this.clearPlayArea();
    this.renderHealthBars();
  }

  async waitForEnter() {
    return new Promise((resolve) => {
      this.waitingForEnter = true;

      const checkEnter = setInterval(() => {
        if (!this.waitingForEnter) {
          clearInterval(checkEnter);
          resolve();
        }
      }, 100);
    });
  }

  async getPlayerMove(player) {
    if (player.isBot()) {
      return player.randomMove();
    } else {
      this.currentPlayer = player;
      this.updatePlayerNameHighlight();

      const { player_1, player_2 } = this.fightPlayers;
      const anyoneSkipping = this.p1_skip_next || this.p2_skip_next;
      const currentPlayerHasUndone =
        (player === player_1 && this.p1_has_undone) ||
        (player === player_2 && this.p2_has_undone);
      const canUndo =
        this.fightHistory.size > 0 &&
        !anyoneSkipping &&
        !currentPlayerHasUndone;

      if (canUndo) {
        this.waitingForUndo = true;
      }

      return new Promise((resolve) => {
        this.isHuman = true;
        this.temp_move = null;
        this.undoSteps = 0;

        const checkMove = setInterval(() => {
          if (this.temp_move) {
            clearInterval(checkMove);
            this.isHuman = false;
            this.waitingForUndo = false;
            this.currentPlayer = null;
            this.updatePlayerNameHighlight();
            resolve(this.temp_move);
          }
        }, 100);
      });
    }
  }

  async getBothMovesAndDisplay(player_1, player_2) {
    const p1_move = await this.getPlayerMove(player_1);

    if (p1_move === "Undo") {
      this.p1_has_undone = true;
      this.p1_skip_next = true;
      this.isHuman = false;
      this.undoFightSteps(this.undoSteps, player_1, player_2);
      this.currentPlayer = null;
      clearScreenArea(0, this.screen.rows - 2, this.screen.cols, 1);
      return { undo: true };
    }

    const p2_move = await this.getPlayerMove(player_2);

    if (p2_move === "Undo") {
      this.p2_has_undone = true;
      this.p2_skip_next = true;
      this.isHuman = false;
      this.undoFightSteps(this.undoSteps, player_1, player_2);
      this.currentPlayer = null;
      clearScreenArea(0, this.screen.rows - 2, this.screen.cols, 1);
      return { undo: true };
    }

    const artWidth = 20;
    const artHeight = 7;
    const spacing = 10;
    const totalWidth = artWidth * 2 + spacing;
    const startX = (this.screen.cols - totalWidth) / 2;
    const y = this.screen.center_h - artHeight / 2;

    printRPS(startX, y, `${p1_move}_right`);
    printRPS(startX + artWidth + spacing, y, `${p2_move}_left`);

    return { p1_move, p2_move };
  }

  clearPlayArea() {
    clearScreenArea(0, 6, this.screen.cols, this.screen.rows - 10);
  }

  printPlayerNames(player_1, player_2) {
    if (player_1 && player_2) {
      this.displayedPlayers = { player_1, player_2 };
    }

    if (!player_1 || !player_2) return;

    clearScreenArea(0, 5, this.screen.cols, 1);

    const p1IsActive =
      this.currentPlayer && this.currentPlayer.getName() === player_1.getName();
    const p2IsActive =
      this.currentPlayer && this.currentPlayer.getName() === player_2.getName();

    const lines = [
      {
        x: this.screen.center_w / 2,
        y: 5,
        text: p1IsActive
          ? `${Colors.FG_YELLOW}${player_1.getName()}${Colors.RESET}`
          : player_1.getName(),
      },
      {
        x: (this.screen.center_w / 2) * 3,
        y: 5,
        text: p2IsActive
          ? `${Colors.FG_YELLOW}${player_2.getName()}${Colors.RESET}`
          : player_2.getName(),
      },
    ];

    printBatch(lines);

    this.printControls();

    clearScreenArea(0, this.screen.rows - 2, this.screen.cols, 1);

    if (this.fightPlayers && this.currentPlayer && this.isHuman) {
      const { player_1: p1, player_2: p2 } = this.fightPlayers;

      const isP1Turn = this.currentPlayer === p1 && p1IsActive;
      const isP2Turn = this.currentPlayer === p2 && p2IsActive;

      if (isP1Turn || isP2Turn) {
        const anyoneSkipping = this.p1_skip_next || this.p2_skip_next;
        const currentPlayerHasUndone =
          (this.currentPlayer === p1 && this.p1_has_undone) ||
          (this.currentPlayer === p2 && this.p2_has_undone);

        const canUndo =
          this.fightHistory.size > 0 &&
          !anyoneSkipping &&
          !currentPlayerHasUndone;

        if (canUndo) {
          const maxUndo = Math.min(3, this.fightHistory.size);
          const undoMessage = `${this.currentPlayer.getName()} press ${
            maxUndo === 1 ? "1" : `1-${maxUndo}`
          } to undo, or R/P/S to play`;
          printAt(
            this.screen.center_w - Math.floor(undoMessage.length / 2),
            this.screen.rows - 2,
            undoMessage
          );
        }
      }
    }
  }
  updatePlayerNameHighlight() {
    if (this.displayedPlayers) {
      this.printPlayerNames(
        this.displayedPlayers.player_1,
        this.displayedPlayers.player_2
      );
    }
  }

  async waitForEnter() {
    return new Promise((resolve) => {
      this.waitingForEnter = true;

      const checkEnter = setInterval(() => {
        if (!this.waitingForEnter) {
          clearInterval(checkEnter);
          resolve();
        }
      }, 100);
    });
  }

  async getPlayerMove(player) {
    if (player.isBot()) {
      return player.randomMove();
    } else {
      this.currentPlayer = player;
      this.updatePlayerNameHighlight(); // Refresh

      const { player_1, player_2 } = this.fightPlayers;
      const canUndo =
        this.fightHistory.size > 0 &&
        ((player === player_1 && !this.p1_has_undone) ||
          (player === player_2 && !this.p2_has_undone));

      if (canUndo) {
        const maxUndo = Math.min(3, this.fightHistory.size);
        const undoMessage = `${player.getName()} press 1-${maxUndo} to undo`;
        printAt(
          this.screen.center_w - Math.floor(undoMessage.length / 2),
          this.screen.rows - 4,
          undoMessage
        );
        this.waitingForUndo = true;
      }

      return new Promise((resolve) => {
        this.isHuman = true;
        this.temp_move = null;
        this.undoSteps = 0;

        const checkMove = setInterval(() => {
          if (this.temp_move) {
            clearInterval(checkMove);
            this.isHuman = false;
            this.waitingForUndo = false;
            this.currentPlayer = null; // for clearing highlight
            this.updatePlayerNameHighlight();
            clearScreenArea(0, this.screen.rows - 4, this.screen.cols, 1); // clear undo message
            resolve(this.temp_move);
          }
        }, 100);
      });
    }
  }

  clearPlayArea() {
    clearScreenArea(0, 6, this.screen.cols, this.screen.rows - 10);
  }

  printControls() {
    const controls = "R - Rock | P - Paper | S - Scissors | Enter - Continue";
    printAt(
      this.screen.center_w - Math.floor(controls.length / 2),
      this.screen.rows - 1,
      Colors.whiteDim(controls)
    );
  }

  updatePlayerNameHighlight() {
    if (this.displayedPlayers) {
      this.printPlayerNames(
        this.displayedPlayers.player_1,
        this.displayedPlayers.player_2
      );
    }
  }

  renderHealthBars(current_player = null) {
    const activePlayer = current_player || this.currentPlayer;
    this.game.players.getPlayers().forEach((player) => {
      player.print(activePlayer);
    });
  }
}

export default inGameScene;
