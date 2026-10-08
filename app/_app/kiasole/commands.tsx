import type { ReactNode } from 'react'
import functions from '@/data/module/functions'
import { _app } from '../bridge'
import { consoleShell } from './consoleStore'
import { CommandType, ParamDef } from './parser'
import { emptyLine, fontUseMsgs, iconUseMsgs, kiloMsgs, musicMsgs, projectMsgs, shellMsgs } from './infoPages'
import { newInput } from '../overlays/InputOverlay'
import style from '../_app.module.scss'
import { customColorStore, defaultColorList } from '../overlays/ColorControl'
import PACKAGE_JSON from '@/package.json'

export const gap = {
  XL: "20px",
  L: "15px",
  M: "10px",
  S: "8px",
};

export type CommandContext = {
  log: (msg: ReactNode) => Promise<void>
  error: (msg: ReactNode) => Promise<void>
  warn: (msg: ReactNode) => Promise<void>
  logWithoutTimeout: (msg: ReactNode) => void
  clear: () => void
  runCommand: (input: string) => Promise<void>
  enterGlabs: () => void
  exit: () => void
}

const nothingText = ["0", "None", "null", "undefined", "nothing", "empty", "[]", "{}", "()"]

const printCommand = (
  name: string,
  dsc: string,
  print: (msg: ReactNode) => Promise<void>,
  log: CommandContext["log"],
): CommandType => ({
  name,
  dsc,
  param: [
    {
      name: "message",
      required: false,
      type: "string"
    }
  ],
  async action(param) {
    const msg = param.message;
    if (msg === undefined || msg === "") {
      await log(<div style={{ opacity: ".5" }}>
        {functions.randomChoose(nothingText)}
      </div>);
    } else {
      await print(msg);
    }
  },
})

const helpCommand = (): CommandType => ({
  name: "help",
  dsc: "List All Commands",
  alias: ["?"],
  action: async () => { }
})

export function withHelp(commands: CommandType[], log: CommandContext["log"]): CommandType[] {
  const helpIndex = commands.findIndex(c => c.name === "help");
  if (helpIndex === -1) return commands;

  const printParams = async (params: ParamDef[], level: number = 0) => {
    for (const p of params) {
      const req = p.required ? "*" : "";
      const opts = p.options ? `[${p.options.join("|")}]` : "";

      const indent = "  ".repeat(level + 1);

      await log(
        <div>
          <span style={{ opacity: ".5" }}>{indent}└ </span>
          {`${req}${p.name} `}
          <span style={{ opacity: ".6" }}>{`<${p.type}${opts}>`}</span>
          <span style={{ opacity: ".5" }}>{p.dsc ? ` : ${p.dsc}` : ""}</span>
        </div>
      );

      if (p.type === "group" && p.children && p.children.length > 0) {
        await printParams(p.children, level + 1);
      }
    }
  };

  const help: CommandType = {
    ...commands[helpIndex],
    action: async () => {
      await log(<div style={{ paddingBottom: gap.XL }}>{">> Commands >>"}</div>);

      for (const cmd of commands) {
        if (cmd.ignoreInHelp) continue;

        const alias = cmd.alias ? ` [ ${cmd.alias.join(",")} ]` : "";

        await log(
          <>
            <span style={{ fontWeight: "bold" }}>{cmd.name}</span>
            {alias}
            <span style={{ opacity: ".5" }}> - {cmd.dsc}</span>
          </>
        );

        if (cmd.param) {
          await printParams(cmd.param);
        }

        await log(<div style={{ height: gap.S }} />);
      }
      await log(<div style={{ paddingTop: gap.XL }}>{"<< Commands <<"}</div>);
    }
  }

  return commands.map((c, i) => i === helpIndex ? help : c);
}

export function createDefaultCommands(ctx: CommandContext): CommandType[] {
  const { log, error, warn } = ctx

  const printAll = async (msgs: ReactNode[]) => {
    for (const msg of msgs) {
      await log(msg)
    }
  }

  return [
    helpCommand(),
    {
      name: "clear",
      dsc: "Clear Console",
      alias: ["cls"],
      action: () => ctx.clear()
    },
    {
      name: "information",
      dsc: "some information",
      alias: ["info", "inf"],
      param: [
        {
          name: "type",
          type: "option",
          options: [
            "shell",
            "project",
            "fontuse",
            "iconuse",
            "music&sfx",
            "kilo",
          ]
        }
      ],
      async action(param) {
        switch (param.type as ("shell" | "project" | "fontuse" | "iconuse" | "music&sfx" | "kilo" | undefined)) {

          case 'project': {
            await log("正在取得版本資訊....")
            await log(emptyLine)

            const ver: string = PACKAGE_JSON.version

            await printAll(projectMsgs(ver))
            break;
          }

          case 'fontuse':
            await printAll(fontUseMsgs)
            break;

          case 'iconuse':
            await printAll(iconUseMsgs)
            break;

          case 'music&sfx':
            await printAll(musicMsgs)
            break;

          case 'kilo':
            await printAll(kiloMsgs)
            break;

          case 'shell':
          default:
            await printAll(shellMsgs)
        }
      },
    },
    {
      name: "colorsetting",
      dsc: "Disable/Enable Color Setting",
      param: [
        {
          name: "enable",
          dsc: "Turn on",
          type: "boolean"
        },
        {
          name: "disable",
          dsc: "Turn off",
          type: "boolean"
        },
        {
          name: "toggle",
          dsc: "Switch status",
          type: "boolean"
        },
        {
          name: "hide",
          dsc: "Switch display",
          type: "boolean"
        }
      ],
      async action(param) {
        if (param.enable) {
          _app.enableColor();
          await log("Color Control Center is [ Enabled ]");
        } else if (param.disable) {
          _app.disableColor();
          await log("Color Control Center is [ Disabled ]");
        } else if (param.hide) {
          const s = _app.hideColorPanel();
          await log(`Color Control Center is [ ${s ? "Hide" : "Visible"} ]`);
        } else {
          const s = _app.toggleColor();
          await log(`Color Control Center is [ ${s ? "Enabled" : "Disabled"} ]`);
        }
      },
    },
    {
      name: "color",
      dsc: "Color Management",
      alias: ["clr"],
      param: [
        {
          name: "list",
          type: "boolean",
          dsc: "List all colors"
        },
        {
          name: "set",
          type: "string",
          dsc: "Set color (Hex or ID)"
        },
        {
          name: "add",
          type: "string",
          dsc: "Add new color"
        },
        {
          name: "remove",
          type: "string",
          dsc: "Remove color by ID"
        }
      ],
        async action(param) {
          const listColors = async () => {
            await log("Requesting...");
            await log(<div style={{ paddingBottom: gap.XL }}>{">> Color List >>"}</div>);
            try {
              const defaultColor: string[][] = defaultColorList.map((e, i) => ([`[ -d${i.toString().padStart(2, "0")} ] ${e}`, e]));

              const colorList: string[][] = customColorStore.list().map((e, i) => ([`[ -c${i.toString().padStart(2, "0")} ] ${e}`, e]));

              await log(<div style={{ paddingBottom: gap.M }}>{"[ Default Color ]"}</div>);
              for (const color of defaultColor) {
                await log(<div style={{ paddingLeft: gap.M, color: color[1] }}>{color[0]}</div>);
              }

              await log(<div style={{ paddingBottom: gap.M, paddingTop: "10px" }}>{"[ Color List ]"}</div>);
              for (const color of colorList) {
                await log(<div style={{ paddingLeft: gap.M, color: color[1] }}>{color[0]}</div>);
              }
            } catch {
              await log(<div>{"Request Failed"}</div>);
            }
            await log(<div style={{ paddingTop: gap.XL }}>{"<< Color List <<"}</div>);
          };

          if (param.list || (Object.keys(param).length === 0)) {
            await listColors();
            return;
          }

          if (param.set) {
            const value = param.set;
            const codeMatch = value.match(/^(-[dc])(\d+)$/);

            if (codeMatch) {
              const prefix = codeMatch[1];
              const index = parseInt(codeMatch[2], 10);
              const mode = prefix === "-d" ? "lsdef" : "ls";
              const listName = prefix === "-d" ? "Default List" : "User List";

              await log(<div>{`Fetching color from [ ${value} ]...`}</div>);
              try {
                const colorList: string[] = mode === "lsdef" ? defaultColorList : customColorStore.list();

                if (colorList && colorList[index]) {
                  const targetColor = colorList[index];
                  _app.setColor(targetColor);
                  await log(
                    <div>
                      {"Resolved "}<span style={{ color: targetColor }}>{value}</span>
                      {" to "}<span style={{ color: targetColor }}>{targetColor}</span>
                    </div>
                  );
                } else {
                  await log(<div>{`Error: Index ${index} not found in ${listName}`}</div>);
                }
              } catch {
                await log(<div>{"Error: Failed to fetch color list"}</div>);
              }
            } else {
              _app.setColor(value);
              await log(<div>{"Set Color to "}<span style={{ color: value }}>{value}</span></div>);
            }
            return;
          }

          if (param.add) {
            const value = param.add;
            await log(<div>{`Adding color: ${value}`}</div>);
            customColorStore.add(value)
            await listColors();
            return;
          }

          if (param.remove) {
            const value = param.remove;
            const codeMatch = value.match(/^(-c)(\d+)$/);

            if (codeMatch) {
              const index = parseInt(codeMatch[2], 10);
              await log(<div>{`Removing color [ ${value} ]...`}</div>);

              customColorStore.remove(index);
              await listColors();
            } else {
              if (value.startsWith("-d")) {
                await log(<div>{"Error: Cannot remove Default Colors."}</div>);
              } else {
                await log(<div>{"Error: Invalid code. Use format like -c01"}</div>);
              }
            }
            return;
          }
        },
    },
    printCommand("log", "Print a message", log, log),
    printCommand("error", "Print a error message", error, log),
    printCommand("warn", "Print a warning message", warn, log),
    {
      name: "cursoreffects",
      dsc: "Special Cursor Effects Control",
      param: [
        {
          name: "enable",
          type: "boolean",
          dsc: "Enable effects"
        },
        {
          name: "disable",
          type: "boolean",
          dsc: "Disable effects"
        },
        {
          name: "toggle",
          type: "boolean",
          dsc: "Toggle effects"
        }
      ],
      async action(param) {
        let _s = false;

        if (param.enable) {
          _s = _app.informalFunction.CursorEffects("SET", true);
        } else if (param.disable) {
          _s = _app.informalFunction.CursorEffects("SET", false);
        } else {
          _s = _app.informalFunction.CursorEffects("TOG");
        }

        if (_s) {
          await log("Special Cursor is [ Enabled ]");
        } else {
          await log("Special Cursor is [ Disabled ]");
        }
      },
    },
    {
      name: "timeout",
      alias: ["sleep"],
      dsc: "Wait for a duration",
      param: [
        {
          name: "time",
          dsc: "Duration (ms)",
          required: true,
          type: "number"
        }
      ],
      async action(param) {
        if (param.time) {
          await functions.timeSleep(param.time);
        }
      },
    },
    {
      name: "console",
      dsc: "Terminal settings",
      param: [
        {
          name: "setting",
          type: "group",
          dsc: "Adjust terminal properties",
          children: [
            {
              name: "hight",
              type: "number",
              dsc: "Set height % (30-100)",
              required: false
            },
            {
              name: "zoom",
              type: "number",
              dsc: "Font zoom level % (80-200)",
              required: false
            }
          ]
        }
      ],
      action(param) {
        if (param.setting) {
          const { setting } = param
          if (setting.hight) {
            const hight = functions.clamp(setting.hight, 30, 100) + "%"
            consoleShell.set(s => ({ ...s, height: hight }))
            log(`set Terminal hight to ${functions.clamp(setting.hight, 30, 100)}%`)
          } else if (setting.zoom) {
            const zoom = functions.clamp(setting.zoom, 80, 200) + "%"
            consoleShell.set(s => ({ ...s, zoom }))
            log(`set Terminal zoom to ${functions.clamp(setting.zoom, 80, 200)}%`)
          }
        }

      },
    },
    {
      name: "togglefullscreen",
      alias: ["full"],
      action() {
        const elem = document.documentElement;

        if (!document.fullscreenElement) {
          if (elem.requestFullscreen) {
            elem.requestFullscreen()
              .then(() => {
                log("欸他全了")
              }).catch(() => {
                error("沒辦法全熒幕.w.")
              });
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
            log("欸他回來了")
          }
        }
      },
    },
    {
      name: "whatisglabs",
      dsc: ".....",
      ignoreInHelp: true,
      action: async () => {
        const msgs = [
          "好 那我解釋一下這個鳥東西好了",
          "其實glabs是KILO開的其中一個東西 全稱叫goreLabs 中文可以翻譯成不人道實驗室",
          <>{"詳細可以參見這個 "}<a href='/glabs/info' style={{ color: "red", textDecoration: "underline #920000ff" }}>{"目前還不存在的文檔"}</a></>,
          "額然後在這個終端裏面 就有個彩蛋叫glabs",
          "這個東西 破壞性的 不可逆 打了一次之後 就需要你自己重整網頁東西才會回來",
          "啊 寫這個彩蛋就單純爲了帥 所以沒有什麽鳥用",
          "你可以理解成小屁孩中二病發作沒有關係",
        ]
        for (const msg of msgs) {
          await log(<div style={{ color: "red" }}>{msg}</div>)
        }
      }
    },
    {
      name: "glabs",
      dsc: ".....",
      alias: ["gorelabs"],
      ignoreInHelp: true,
      action: async () => {
        /* 把整個 App 的外殼一塊一塊拆掉 */
        for (const id of ["CursorEffects", "ColorControCenter", "Effect", "Notic", "InputOverlay", "Main"]) {
          const ele = document.getElementById(style[id])
          if (!ele) continue

          ctx.logWithoutTimeout(<div style={{ color: "red" }}>{`${ele.tagName}${ele.id ? "#" + ele.id : ""}${ele.classList ? "." + ele.classList.value.split(" ").join(".") : ""} [ removed ]`}</div>);
          await functions.timeSleep(0)

          consoleShell.set(s => ({ ...s, removed: [...s.removed, id] }))
        }

        ctx.clear()

        consoleShell.set(s => ({ ...s, takeover: true }))

        ctx.clear()

        await ctx.runCommand("color set #ff0000")

        ctx.clear()

        const msgs = [
          "Welcome To goreLabs",
          "type help or ? see the command list",
        ]

        for (const msg of msgs) {
          await log(msg)
        }

        ctx.enterGlabs()
      }
    },
    {
      name: "exit",
      dsc: "Close terminal",
      action() { ctx.exit() },
    },
  ]
}

export function createGlabsCommands(ctx: CommandContext): CommandType[] {
  return [
    helpCommand(),
    {
      name: "kill",
      dsc: "terminate this gLabs process",
      async action() {
        consoleShell.set(s => ({ ...s, removed: [...s.removed, "Console"] }))
        await functions.timeSleep(1000);
        window.close();
      },
    },
    {
      name: "exit",
      dsc: "no",
      async action() {
        await ctx.log("no")
      },
    },
  ]
}
