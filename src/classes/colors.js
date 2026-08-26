class Colors {
  static RESET = "\x1b[0m";
  static BOLD = "\x1b[1m";
  static DIM = "\x1b[2m";
  static UNDERSCORE = "\x1b[4m";
  static BLINK = "\x1b[5m";
  static REVERSE = "\x1b[7m";
  static HIDDEN = "\x1b[8m";

  static FG_BLACK = "\x1b[30m";
  static FG_RED = "\x1b[31m";
  static FG_GREEN = "\x1b[32m";
  static FG_YELLOW = "\x1b[33m";
  static FG_BLUE = "\x1b[34m";
  static FG_MAGENTA = "\x1b[35m";
  static FG_CYAN = "\x1b[36m";
  static FG_WHITE = "\x1b[37m";
  static FG_BRIGHT_WHITE = "\x1b[97m";

  static BG_BLACK = "\x1b[40m";
  static BG_RED = "\x1b[41m";
  static BG_GREEN = "\x1b[42m";
  static BG_YELLOW = "\x1b[43m";
  static BG_BLUE = "\x1b[44m";
  static BG_MAGENTA = "\x1b[45m";
  static BG_CYAN = "\x1b[46m";
  static BG_WHITE = "\x1b[47m";

  static whiteDim(text) {
    return `${Colors.FG_BRIGHT_WHITE}${Colors.DIM}${text}${Colors.RESET}`;
  }
}

export default Colors;
