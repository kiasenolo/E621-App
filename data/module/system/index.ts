import fs from "fs"

export const system = {
  logOut: (name: string, message: string, other?: string) => {
    return;
    const LOG_DIR = process.cwd() + "/.log/"

    const LOG_FILE = LOG_DIR + name + ".log";
    const MSG = `[ ${new Date().getTime()} ] ${message} /// ${other ?? "NONE"}\n`

    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR)
    }

    if (fs.existsSync(LOG_FILE)) {
      fs.appendFileSync(LOG_FILE, MSG)
    } else {
      fs.writeFileSync(LOG_FILE, MSG)
    }
  }
}