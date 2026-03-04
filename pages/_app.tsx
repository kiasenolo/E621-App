import '@/styles/globals.scss'
import type { AppProps } from 'next/app'
import HoverTips from "@/data/components/HoverTips"
import { Dispatch, ReactNode, RefObject, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import colormgr from '@/data/module/functions/color'
import functions from '@/data/module/functions'
import HeadSetting from '@/data/components/HeadSetting'
import style from './_app.module.scss'
import consoleStyle from './_app.styles/console.module.scss'
import WebEffect from '@/data/module/WebEffect'

export let _powerSaveingMode = true
export let _setPowerSaveingMode: Dispatch<SetStateAction<boolean>> = () => { }

export let _appScale = 100
export let _setAppScale: Dispatch<SetStateAction<number>> = () => { }

const ele = {
  notic: () => document.getElementById(style["Notic"])!,
  colorPanal: () => document.getElementById(style["ColorControCenter"])!,
  Effect: {
    flash: () => document.getElementById(style["Flash"])!,
  }
}

const ift = {
  cuef: {
    cur: () => document.getElementById(style["Cur"])!,
    clickAni: () => document.getElementById(style["clickAnimation"])!,
    traj: () => document.getElementById(style["Trajectory"])!,
    cureff: () => document.getElementById(style["CursorEffects"])!,
  }
}

const inalFt = {
  cuef: false
}

export let _app: {
  disableColor: () => boolean;
  enableColor: () => boolean;
  toggleColor: () => boolean;
  setColor: (color: string) => Object;
  setColor2: (color: string) => Object;
  informalFunction: {
    CursorEffects: (mode: "TOG" | "SET", status?: boolean) => boolean;
  };
  throwNotic: (message: string, time?: number) => HTMLDivElement;
  clearNotic: () => void;
  Effects: {
    FLASH: (color?: string) => HTMLDivElement | false;
  };
} = {
  disableColor: () => false,
  enableColor: () => false,
  toggleColor: () => false,
  setColor: () => ({ R: 0, G: 0, B: 0 }),
  setColor2: () => ({ R: 0, G: 0, B: 0 }),
  informalFunction: {
    CursorEffects: () => false,
  },
  throwNotic: () => document.createElement("div"),
  clearNotic: () => false,
  Effects: {
    FLASH: () => false,
  },
}

export let newInputCloseEvents: (() => void)[] = []

export const newInput = {
  _close: function (event?: boolean) {
    const inputs = document.getElementById(style["InputOverlay"])!.getElementsByClassName(style["Input"])

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const frames = input.getElementsByClassName(style["frame"])

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];

        frame.classList.remove(style["show"])

        if (_powerSaveingMode)
          frame.remove();
        else
          setTimeout(() => {
            frame.remove();
          }, .3e3);

      }
    }

    if (event) {
      newInputCloseEvents.forEach(e => e())
    }
    newInputCloseEvents = []

    const inputSelect = document.getElementById("_appKiase_inputSelect")
    if (inputSelect) {
      inputSelect.onkeydown = null;
      inputSelect.removeAttribute("tabindex");
      inputSelect.blur();
    }

    const inputMessage = document.getElementById("_appKiase_inputMessage")
    if (inputMessage) {
      inputMessage.onkeydown = null;
      inputMessage.removeAttribute("tabindex");
      inputMessage.blur();
    }
  },
  select: function <T>(
    options: {
      name: string
      info?: string
      key?: string
      value: T
    }[],
    onChange: (e: T) => void,
    onClose?: () => void
  ) {
    newInputCloseEvents.push(onClose ?? (() => { }))

    const inputSelect = document.getElementById("_appKiase_inputSelect")!
    inputSelect.setAttribute("tabindex", "-1")
    inputSelect.style.outline = "none"
    inputSelect.onkeydown = (e) => {

      const index = options.findIndex(opt => opt.key === e.code)

      if (index !== -1) {
        e.preventDefault();
        e.stopPropagation();

        this._close()
        onChange(options[index].value)
        inputSelect.onkeydown = null
      }
    }
    inputSelect.focus()

    const frame = document.createElement("div")
    frame.classList.add(style["frame"])

    frame.onclick = (e) => {
      if (e.target === frame) {
        this._close(true)
      }
    }

    {

      const menu = document.createElement("div")
      menu.classList.add(style["menu"])

      {
        const frame = document.createElement("div")
        frame.classList.add(style["frame"])
        frame.setAttribute("overflow-bar-none", "")

        options.forEach(option => {

          const button = document.createElement("button")

          {
            const span = document.createElement("span")
            span.classList.add(style["name"])
            span.innerText = option.name

            button.appendChild(span)
          }

          if (option.info) {
            const span = document.createElement("span")
            span.classList.add(style["info"])
            span.innerText = option.info

            button.appendChild(span)
          }

          button.onclick = () => {
            this._close()
            onChange(option.value)
          }

          frame.appendChild(button)

        })

        menu.appendChild(frame)

      }

      frame.appendChild(menu)

    }

    inputSelect.appendChild(frame)

    void frame.clientHeight
    frame.classList.add(style["show"])
  },

  message: function <T>(
    msg: string,
    buttons?: {
      name: string
      value: T
      key?: string
    }[],
    onClick?: (e: T) => void,
    onClose?: () => void
  ) {
    newInputCloseEvents.push(onClose ?? (() => { }))

    const inputMessage = document.getElementById("_appKiase_inputMessage")!
    inputMessage.setAttribute("tabindex", "-1")
    inputMessage.style.outline = "none"
    inputMessage.onkeydown = (e) => {
      if (buttons) {

        const index = buttons.findIndex(opt => opt.key === e.code)

        if (index !== -1) {
          e.preventDefault();
          e.stopPropagation();

          this._close()
          onClick?.(buttons[index].value)
          inputMessage.onkeydown = null
        }
      }
    }
    inputMessage.focus()

    const frame = document.createElement("div")
    frame.classList.add(style["frame"])
    frame.onclick = (e) => {
      if (e.target === frame) {
        this._close(true)
      }
    }

    frame.focus()
    frame.onkeydown = (e) => {
      e.preventDefault()
      if (buttons) {
        const index = buttons.findIndex(opt => opt.key === e.code)

        if (index !== -1) {
          this._close()
          onClick?.(buttons[index].value)
        }
      }
    }
    {

      const menu = document.createElement("div")
      menu.classList.add(style["menu"])

      {
        const frame = document.createElement("div")
        frame.classList.add(style["frame"])
        frame.setAttribute("overflow-bar-none", "")

        {

          const span = document.createElement("span")
          span.classList.add(style["text"])
          span.innerHTML = msg
          span.setAttribute("overflow-bar-none", "")

          frame.appendChild(span)

        }

        {

          const div = document.createElement("div")
          div.classList.add(style["button"]);

          (buttons ?? [{ name: "okei", value: "" }]).forEach(e => {
            const button = document.createElement("button")
            button.classList.add(style["name"])
            button.innerText = e.name

            button.onclick = () => {
              if (e.value) {
                onClick?.(e.value as any)
              } else {
                onClick?.("none" as any)
              }
              this._close()
            }

            div.appendChild(button)
          })

          frame.appendChild(div)

        }

        menu.appendChild(frame)

      }

      frame.appendChild(menu)

    }

    inputMessage.appendChild(frame)

    void frame.clientHeight
    frame.classList.add(style["show"])
  },
}

type ParamType = "number" | "string" | "boolean" | "option" | "group";

type ParamDef = {
  name: string;
  dsc?: string;
  type: ParamType;
  required?: boolean;
  prefix?: string;
  options?: string[];
  defaultValue?: any;
  children?: ParamDef[];
};

type CommandType = {
  name: string;
  dsc?: string;
  alias?: string[];
  param?: ParamDef[];
  ignoreInHelp?: boolean;
  action: (param: Record<string, any>) => void | Promise<void>;
};

export type setCustomCommandType = (
  log: (msg: ReactNode) => Promise<void>,
  editLastLine: (msg: ReactNode) => Promise<void>,
  removeLastLine: () => void,
  runCommand: (input: string) => Promise<void>,
  typeWriterEffect: (text: string, time?: number | undefined) => Promise<void>,
) => CommandType[]

const { Terminal, consoleFunction } = (() => {
  const cStyle = consoleStyle

  type SuggestionItem = {
    label: string;
    value: string;
    type?: string;
    desc?: string;
  };

  function tokenize(input: string): string[] {
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const tokens: string[] = [];
    let match;
    while ((match = regex.exec(input)) !== null) {
      tokens.push(match[1] ?? match[2] ?? match[0]);
    }
    return tokens;
  }

  const gap = {
    XL: "20px",
    L: "15px",
    M: "10px",
    S: "8px",
  };

  const emptyLine = <div style={{ opacity: "0", userSelect: "none" }}>{"awa"}</div>

  function parseValue(value: string, def: ParamDef): any {
    if (def.type === "number") {
      const n = Number(value);
      return isNaN(n) ? (def.defaultValue ?? 0) : n;
    }
    if (def.type === "boolean") {
      return ["true", "1", "yes", "on"].includes(value?.toLowerCase());
    }
    if (def.type === "option" && def.options) {
      if (!def.options.includes(value)) {
        throw new Error(`參數 "${def.name}" 必須是 [${def.options.join(", ")}] 之一`);
      }
    }
    return value;
  }

  async function parseRecursive(
    tokens: string[],
    defs: ParamDef[],
    startIndex: number
  ): Promise<{ data: Record<string, any>; nextIndex: number }> {
    const result: Record<string, any> = {};
    const usedParams = new Set<string>();
    let i = startIndex;

    while (i < tokens.length) {
      const token = tokens[i];

      const matchByName = defs.find(d => d.name === token);

      if (matchByName) {
        usedParams.add(matchByName.name);

        if (matchByName.type === "group") {
          const childResult = await parseRecursive(tokens, matchByName.children || [], i + 1);
          result[matchByName.name] = childResult.data;
          i = childResult.nextIndex;
        } else if (matchByName.type === "boolean") {
          const nextVal = tokens[i + 1];
          if (nextVal === "false" || nextVal === "true") {
            result[matchByName.name] = parseValue(nextVal, matchByName);
            i += 2;
          } else {
            result[matchByName.name] = true;
            i += 1;
          }
        } else {
          const valToken = tokens[i + 1];
          if (valToken === undefined && matchByName.required) {
            throw new Error(`參數 "${matchByName.name}" 缺少值`);
          }
          if (valToken) {
            result[matchByName.name] = parseValue(valToken, matchByName);
            i += 2;
          } else {
            i += 1;
          }
        }

      } else {
        const positionalMatch = defs.find(d =>
          !usedParams.has(d.name) &&
          d.type !== "group" &&
          d.type !== "boolean"
        );

        if (positionalMatch) {
          result[positionalMatch.name] = parseValue(token, positionalMatch);
          usedParams.add(positionalMatch.name);
          i += 1;
        } else {
          break;
        }
      }
    }

    return { data: result, nextIndex: i };
  }

  function getCommandSignature(cmd: CommandType): string {
    if (!cmd.param || cmd.param.length === 0) return "";
    return cmd.param.map(p => p.required ? `[${p.name}]` : `<${p.name}>`).join(" ");
  }

  function splitBySemicolon(input: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuote = false;
    let quoteChar = "";

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '"' || char === "'") {
        if (!inQuote) {
          inQuote = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuote = false;
        }
      }

      if (char === ';' && !inQuote) {
        if (current.trim()) result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) result.push(current.trim());
    return result;
  }

  function getLastSemicolonIndex(input: string): number {
    let lastIndex = -1;
    let inQuote = false;
    let quoteChar = "";

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '"' || char === "'") {
        if (!inQuote) {
          inQuote = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuote = false;
        }
      }
      if (char === ';' && !inQuote) {
        lastIndex = i;
      }
    }
    return lastIndex;
  }

  type consoleFunctionType = {
    log: (msg: ReactNode) => void;
    error: (msg: string) => void;
    warn: (msg: string) => void;
    editLastLine: (msg: ReactNode) => void;
    runCommand: (input: string) => void;
    setCustomCommand: Dispatch<SetStateAction<setCustomCommandType | undefined>>;
    typeWriterEffect: (text: string, time?: number | undefined) => Promise<void>;
  }

  const consoleFunction: consoleFunctionType = {
    log: () => { },
    error: () => { },
    warn: () => { },
    editLastLine: () => { },
    runCommand: () => { },
    setCustomCommand: () => { },
    typeWriterEffect: async () => { },
  }

  function Terminal(props: { exitCommand?: () => void, powerSaveingMode: boolean }) {
    const { powerSaveingMode } = props
    const [messages, setMessage] = useState<[ReactNode, "log" | "warn" | "error"][]>([]);
    const [isLocked, setIsLocked] = useState(false);

    const [inputValue, setInputValue] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [suggestionIndex, setSuggestionIndex] = useState(-1);

    const [activeCommand, setActiveCommand] = useState<CommandType | null>(null);
    const [activeParamIndex, setActiveParamIndex] = useState<number>(-1);
    const [customCommand, setCustomCommand] = useState<setCustomCommandType>()

    const [glabs, setGlabs] = useState<boolean>(false)

    const outputAreaRef = useRef<HTMLDivElement>(null);

    const afterLog = useCallback(async () => {
      if (!powerSaveingMode) {
        await functions.timeSleep(10);
      }

      if (outputAreaRef.current) {
        const area = outputAreaRef.current;
        if (!powerSaveingMode) {
          if (area.scrollHeight > area.clientHeight) {
            area.classList.remove(cStyle["Bump"]);
            void area.offsetWidth;
            area.classList.add(cStyle["Bump"]);
          }
        }

        area.scrollTop = area.scrollHeight;
      }
    }, [powerSaveingMode])

    const log = useCallback(async (msg: ReactNode) => {
      setMessage((prev) => [...prev, [msg, "log"]]);

      await afterLog()
    }, [afterLog]);

    const error = useCallback(async (msg: ReactNode) => {
      setMessage((prev) => [...prev, [msg, "error"]]);

      await afterLog()
    }, [afterLog]);

    const warn = useCallback(async (msg: ReactNode) => {
      setMessage((prev) => [...prev, [msg, "warn"]]);

      await afterLog()
    }, [afterLog]);

    const logWithoutTimeout = useCallback((msg: ReactNode) => {
      setMessage((prev) => [...prev, [msg, "log"]]);

      if (outputAreaRef.current) {
        const area = outputAreaRef.current;

        if (!powerSaveingMode) {
          if (area.scrollHeight > area.clientHeight) {
            area.classList.remove(cStyle["Bump"]);
            void area.offsetWidth;
            area.classList.add(cStyle["Bump"]);
          };
        }

        area.scrollTop = area.scrollHeight;
      }
    }, [powerSaveingMode]);

    const editLastLine = useCallback(async (msg: ReactNode) => {
      setMessage((prev) => [...prev.slice(0, -1), [msg, "log"]]);

      if (!powerSaveingMode) {
        await functions.timeSleep(10);
      };

      if (outputAreaRef.current) {
        outputAreaRef.current.scrollTop = outputAreaRef.current.scrollHeight;
      }
    }, [powerSaveingMode]);

    const removeLastLine = useCallback(() => {
      setMessage((prev) => [...prev.slice(0, -1)]);
    }, []);

    async function typeWriterEffect(text: string, time?: number) {
      if (!text) return;

      await log(text[0]);
      if (time) {
        await functions.timeSleep(time)
      }
      for (let i = 2; i <= text.length; i++) {
        const currentText = text.substring(0, i);
        await editLastLine(currentText);
        if (time) {
          await functions.timeSleep(time)
        }
      }
    }

    const defaultCommandList: CommandType[] = useMemo(() => {
      const _: CommandType[] = [
        {
          name: "help",
          dsc: "List All Commands",
          alias: ["?"],
          action: async () => { }
        },
        {
          name: "clear",
          dsc: "Clear Console",
          alias: ["cls"],
          action: () => setMessage([])
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
            }
          ],
          async action(param) {
            if (param.enable) {
              _app!.enableColor();
              await log("Color Control Center is [ Enabled ]");
            } else if (param.disable) {
              _app!.disableColor();
              await log("Color Control Center is [ Disabled ]");
            } else {
              const s = _app!.toggleColor();
              await log(`Color Control Center is [ ${s ? "Enabled" : "Disabled"} ]`);
            }
          },
        },
        {
          name: "log",
          dsc: "Print a message",
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
                {functions.randomChoose([
                  "0", "None", "null", "undefined", "nothing", "empty", "[]", "{}", "()"
                ])}
              </div>);
            } else {
              await log(msg);
            }
          },
        },
        {
          name: "error",
          dsc: "Print a error message",
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
                {functions.randomChoose([
                  "0", "None", "null", "undefined", "nothing", "empty", "[]", "{}", "()"
                ])}
              </div>);
            } else {
              await error(msg);
            }
          },
        },
        {
          name: "warn",
          dsc: "Print a warning message",
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
                {functions.randomChoose([
                  "0", "None", "null", "undefined", "nothing", "empty", "[]", "{}", "()"
                ])}
              </div>);
            } else {
              await warn(msg);
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
                const { hight } = setting
                {
                  const owo = document.getElementById(style["Console"])!.style
                  owo.height = functions.clamp(hight, 30, 100) + "%"
                }
                log(`set Terminal hight to ${functions.clamp(hight, 30, 100)}%`)
              } else if (setting.zoom) {
                const { zoom } = setting
                {
                  const owo = document.getElementById(style["Console"])!.style
                  owo.zoom = functions.clamp(zoom, 80, 200) + "%"
                }
                log(`set Terminal zoom to ${functions.clamp(zoom, 80, 200)}%`)
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
                  }).catch(err => {
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
          name: "exit",
          dsc: "Close terminal",
          action() { (props.exitCommand ?? window.close)() },
        },
      ]
      return _
    }, [log, props.exitCommand]);

    const [commandList, setCommandList] = useState<CommandType[]>([]);

    useEffect(() => {
      const run = runCommand
      const customCmds = customCommand ? customCommand(log, editLastLine, removeLastLine, run, typeWriterEffect) : [];
      const allCmds = [...defaultCommandList, ...customCmds];

      const helpCmdIndex = allCmds.findIndex(c => c.name === "help");
      if (helpCmdIndex !== -1) {
        allCmds[helpCmdIndex].action = async () => {
          await log(<div style={{ paddingBottom: gap.XL }}>{">> Commands >>"}</div>);

          const printParams = async (params: ParamDef[], level: number = 0) => {
            for (const p of params) {
              const req = p.required ? "*" : "";
              const opts = p.options ? `[${p.options.join("|")}]` : "";

              const indent = "\u00A0\u00A0".repeat(level + 1);
              const isGroup = p.type === "group";

              await log(
                <div>
                  <span style={{ opacity: ".5" }}>{indent}└ </span>
                  {`${req}${p.name} `}
                  <span style={{ opacity: ".6" }}>{`<${p.type}${opts}>`}</span>
                  <span style={{ opacity: ".5" }}>{p.dsc ? ` : ${p.dsc}` : ""}</span>
                </div>
              );

              if (isGroup && p.children && p.children.length > 0) {
                await printParams(p.children, level + 1);
              }
            }
          };

          for (const cmd of allCmds) {
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
        };
      }
      setCommandList(allCmds);
    }, [customCommand, defaultCommandList, log, glabs]);

    function splitBySemicolon(input: string): string[] {
      const result: string[] = [];
      let current = "";
      let inQuote = false;
      let quoteChar = "";

      for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (char === '"' || char === "'") {
          if (!inQuote) {
            inQuote = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuote = false;
          }
        }

        if (char === ';' && !inQuote) {
          if (current.trim()) result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      if (current.trim()) result.push(current.trim());
      return result;
    }

    const runCommand = useCallback(
      async (input: string) => {
        if (!input.trim()) return;

        setHistory((prev) => (prev[prev.length - 1] === input ? prev : [...prev, input]));
        setHistoryIndex(-1);
        setSuggestions([]);
        setActiveCommand(null);

        const commandSegments = splitBySemicolon(input);
        setIsLocked(true);

        try {
          for (const segment of commandSegments) {
            const tokens = tokenize(segment);
            if (tokens.length === 0) continue;

            const cmdName = tokens[0];
            const cmd = commandList.find((c) => c.name === cmdName || c.alias?.includes(cmdName));

            if (!cmd) {
              await error(`錯誤: 找不到指令 "${cmdName}"`);
              break;
            }

            let parsedParams: Record<string, any> = {};
            if (cmd.param) {
              const res = await parseRecursive(tokens, cmd.param, 1);
              parsedParams = res.data;
            }

            await cmd.action(parsedParams);
          }
        } catch (e: any) {
          await error(`執行錯誤: ${e.message || e}`);
        } finally {
          setIsLocked(false);
        }
      },
      [commandList, log]
    );

    const handleInputChange = (value: string) => {
      setInputValue(value);
      setHistoryIndex(-1);

      if (!value.trim()) {
        setSuggestions([]);
        setActiveCommand(null);
        return;
      }

      const lastSemiIndex = getLastSemicolonIndex(value);
      const currentSegment = value.slice(lastSemiIndex + 1);
      const trimmedSegment = currentSegment.trimStart();

      if (!trimmedSegment) {
        setSuggestions([]);
        setActiveCommand(null);
        return;
      }

      const rawTokens = trimmedSegment.split(" ");
      const tokens = rawTokens.filter(t => t !== "");
      const isInputtingLastToken = !currentSegment.endsWith(" ");
      const currentInput = isInputtingLastToken ? tokens[tokens.length - 1] : "";

      const cmdToken = tokens[0];
      const matchedCmd = commandList.find(c => c.name === cmdToken || c.alias?.includes(cmdToken));

      if (matchedCmd) {
        setActiveCommand(matchedCmd);

        let currentDefs = matchedCmd.param || [];
        let usedParams = new Set<string>();

        let depth = 1;
        while (depth < (isInputtingLastToken ? tokens.length - 1 : tokens.length)) {
          const t = tokens[depth];
          const match = currentDefs.find(d => d.name === t);

          if (match) {
            usedParams.add(match.name);
            if (match.type === "group" && match.children) {
              currentDefs = match.children;
              usedParams.clear();
              depth++;
            } else if (match.type === "boolean") {
              const next = tokens[depth + 1];
              if (next === "true" || next === "false") depth += 2;
              else depth++;
            } else {
              depth += 2;
            }
          } else {
            const posMatch = currentDefs.find(d => !usedParams.has(d.name) && d.type !== "group" && d.type !== "boolean");
            if (posMatch) {
              usedParams.add(posMatch.name);
              depth++;
            } else {
              break;
            }
          }
        }

        let newSuggestions: SuggestionItem[] = [];

        const possibleParams = currentDefs.filter(d => !usedParams.has(d.name));

        const prevToken = tokens[isInputtingLastToken ? tokens.length - 2 : tokens.length - 1];
        const explicitPrevParam = currentDefs.find(d => d.name === prevToken);

        if (explicitPrevParam && explicitPrevParam.type !== "group" && explicitPrevParam.type !== "boolean" && isInputtingLastToken) {
          if (explicitPrevParam.options) {
            newSuggestions = explicitPrevParam.options.filter(o => o.startsWith(currentInput))
              .map(o => ({ label: o, value: o, type: "VAL", desc: `Option` }));
          }
        } else {
          const paramNameSuggestions = possibleParams
            .filter(d => d.name.startsWith(currentInput))
            .map(d => ({
              label: d.name,
              value: d.name,
              type: d.type === "group" ? "GRP" : "PRM",
              desc: d.dsc
            }));

          newSuggestions.push(...paramNameSuggestions);

          const nextPositional = possibleParams.find(d => d.type !== "group" && d.type !== "boolean");
          if (nextPositional && nextPositional.options) {
            const optSuggestions = nextPositional.options
              .filter(o => o.startsWith(currentInput))
              .map(o => ({ label: o, value: o, type: "VAL", desc: `Value for ${nextPositional.name}` }));
            newSuggestions.push(...optSuggestions);
          }
        }

        setSuggestions(newSuggestions);
        setSuggestionIndex(newSuggestions.length > 0 ? 0 : -1);

      } else {
        setActiveCommand(null);
        setActiveParamIndex(-1);

        if (tokens.length === 1 && isInputtingLastToken) {
          const candidates = commandList
            .filter(c => !c.ignoreInHelp)
            .filter(c => c.name.startsWith(currentInput) || c.alias?.some(a => a.startsWith(currentInput)))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(c => ({
              label: c.name,
              value: c.name,
              type: "CMD",
              desc: getCommandSignature(c) || c.dsc
            }));

          setSuggestions(candidates);
          setSuggestionIndex(candidates.length > 0 ? 0 : -1);
        } else {
          setSuggestions([]);
        }
      }
    };

    const applySuggestion = (item: SuggestionItem) => {
      const rawTokens = inputValue.split(" ");

      if (!activeCommand && rawTokens.length === 1) {
        setInputValue(item.value + " ");
      } else {
        rawTokens.pop();
        setInputValue([...rawTokens, item.value].join(" ") + " ");
      }

      setSuggestions([]);
      document.getElementById("console-input")?.focus();
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (suggestions.length > 0 && suggestionIndex >= 0) {
          e.preventDefault();
          applySuggestion(suggestions[suggestionIndex]);
          return;
        }

        await log(<div style={{ paddingLeft: gap.M, paddingTop: gap.M, paddingBottom: gap.S }}>{`> ${inputValue}`}</div>);
        runCommand(inputValue);
        setInputValue("");
        setSuggestions([]);
        setActiveCommand(null);
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        if (suggestions.length > 0) {
          const target = suggestionIndex >= 0 ? suggestions[suggestionIndex] : suggestions[0];
          applySuggestion(target);
        }
        return;
      }

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (suggestions.length > 0) {
          e.preventDefault();
          const dir = e.key === "ArrowUp" ? -1 : 1;
          setSuggestionIndex(prev => {
            const next = prev + dir;
            if (next < 0) return suggestions.length - 1;
            if (next >= suggestions.length) return 0;
            return next;
          });
          return;
        } else {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            if (history.length === 0) return;
            const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
            setHistoryIndex(newIndex);
            setInputValue(history[newIndex]);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIndex === -1) return;
            const newIndex = historyIndex + 1;
            if (newIndex >= history.length) {
              setHistoryIndex(-1);
              setInputValue("");
            } else {
              setHistoryIndex(newIndex);
              setInputValue(history[newIndex]);
            }
          }
        }
      }

      if (e.key === "Escape") {
        setSuggestions([]);
      }
    };

    consoleFunction.log = log
    consoleFunction.error = error
    consoleFunction.warn = warn
    consoleFunction.editLastLine = editLastLine
    consoleFunction.runCommand = runCommand
    consoleFunction.setCustomCommand = setCustomCommand
    consoleFunction.typeWriterEffect = typeWriterEffect

    return (
      <div id={cStyle["Console"]} className={powerSaveingMode ? cStyle["PowerSaveingMode"] : ""}>
        <div className={cStyle["OutputArea"]} ref={outputAreaRef}>
          {[...messages].map((e, i) => (
            <div key={i} className={cStyle["Line"]} log-level={e[1]}>
              {e[0]}
            </div>
          ))}
        </div>

        <div className={cStyle["InputArea"]}>
          {!isLocked ? (
            <div className={cStyle["Input"]}>
              <div>{">"}</div>
              <input
                id="console-input"
                type="text"
                autoFocus
                autoComplete="off"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={activeCommand ? "" : "Enter command..."}
              />
            </div>
          ) : (
            <div style={{ opacity: ".5" }}>Running...</div>
          )}

          {activeCommand && !isLocked && (
            <div className={cStyle["SignatureHint"]}>
              <span className={cStyle["commandName"]}>{activeCommand.name}</span>
              <span className={cStyle["params"]}>
                {activeCommand.param?.map((p, idx) => {
                  const isActive = idx === activeParamIndex;
                  return (
                    <span key={idx} className={[cStyle["param"], isActive ? cStyle["active"] : ""].join(" ")}>
                      {p.required ? `[${p.name}]` : `<${p.name}>`}
                      {isActive && (
                        <>
                          {p.dsc ? <span className={cStyle["desc"]}> - {p.dsc}</span> : <></>}
                          <span className={cStyle["typeInfo"]}>{p.type}</span>
                        </>
                      )}
                    </span>
                  );
                })}
              </span>
            </div>
          )}

          {!isLocked && suggestions.length > 0 && (
            <div className={cStyle["SuggestionBox"]}>
              {suggestions.map((item, idx) => (
                <div
                  key={item.value + idx}
                  className={[cStyle["suggestion"], idx === suggestionIndex ? cStyle["active"] : ""].join(" ")}
                  onClick={() => applySuggestion(item)}
                >
                  <div className={cStyle["leftGroup"]}>
                    <span className={cStyle["label"]}>{item.label}</span>
                    {item.type && <span className={cStyle["typeTag"]}>{item.type}</span>}
                  </div>
                  <div className={cStyle["rightGroup"]}>
                    {item.desc && <span className={cStyle["desc"]}>{item.desc}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return {
    Terminal,
    consoleFunction,
  }
})()

const Components = {
  SVGFilters: () => {
    return (
      <svg style={{ display: "none" }}>
        <defs>
          <filter id="ftRgbShift" x="0" y="0" colorInterpolationFilters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
            <feComponentTransfer in="SourceGraphic" result="_R">
              <feFuncR type="table" tableValues="0 1" />
              <feFuncG type="table" tableValues="0 0" />
              <feFuncB type="table" tableValues="0 0" />
            </feComponentTransfer>

            <feComponentTransfer in="SourceGraphic" result="G">
              <feFuncR type="table" tableValues="0 0" />
              <feFuncG type="table" tableValues="0 1" />
              <feFuncB type="table" tableValues="0 0" />
            </feComponentTransfer>

            <feComponentTransfer in="SourceGraphic" result="_B">
              <feFuncR type="table" tableValues="0 0" />
              <feFuncG type="table" tableValues="0 0" />
              <feFuncB type="table" tableValues="0 1" />
            </feComponentTransfer>

            <feOffset in="_R" dx={-3} dy={-3} result="R" />
            <feOffset in="_B" dx={3} dy={3} result="B" />

            <feBlend in="R" in2="G" mode="screen" result="RG" />
            <feBlend in="RG" in2="B" mode="screen" result="Finle" />
            <feComposite in="Finle" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id="ftVHS" x="0" y="0" colorInterpolationFilters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" >
            <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="BK_Data" />

            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="_CR_Blur" />

            <feOffset in="_CR_Blur" dx="-5" result="CR_Blur" />

            <feBlend in="CR_Blur" in2="BK_Data" mode="color" result="Finle" />

            <feComposite in="Finle" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id="noiseOverlay" colorInterpolationFilters="sRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">

            <feTurbulence type="turbulence" baseFrequency="100 1" numOctaves="6" seed="1" stitchTiles="stitch" x="0%" y="0%" width="100%" height="100%" result="turbulence" />

            <feColorMatrix type="saturate" values="0" x="0%" y="0%" width="100%" height="100%" in="turbulence" result="colormatrix" />

            <feColorMatrix type="luminanceToAlpha" x="0%" y="0%" width="100%" height="100%" in="colormatrix" result="colormatrix3" />

            <feComponentTransfer x="0%" y="0%" width="100%" height="100%" in="colormatrix3" result="componentTransfer1">

              <feFuncR type="linear" slope="1" intercept="0" />
              <feFuncG type="linear" slope="1" intercept="0" />
              <feFuncB type="linear" slope="1" intercept="0" />
              <feFuncA type="linear" slope="0.5" intercept="0" />

            </feComponentTransfer>

            <feBlend mode="multiply" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" in2="componentTransfer1" result="blend1" />

          </filter>
        </defs>
      </svg>
    )
  }
}

type KiasoleType = {
  onStart: null | (() => void)
  onClose: null | (() => void)
  log: (msg: ReactNode) => void
  error: (msg: string) => void
  warn: (msg: string) => void
  editLastLine: (msg: ReactNode) => void
  runCommand: (input: string) => void
  setCustomCommand: typeof consoleFunction.setCustomCommand
  toggle: (open?: boolean) => boolean
}



export const toggleKiasole = (open?: boolean) => {
  const Console = document.getElementById(style["Console"])!
  if (open === undefined)
    if (Console.classList.toggle(style["display"])) {
      (Console.querySelector("input") as HTMLInputElement).focus();
      (Kiasole.onStart ?? (() => { }))();
      return true
    } else {
      (Console.querySelector("input") as HTMLInputElement).blur();
      (Kiasole.onClose ?? (() => { }))();
      return false
    }
  else {
    if (open) {
      Console.classList.add(style["display"]);
      (Console.querySelector("input") as HTMLInputElement).focus();
      (Kiasole.onStart ?? (() => { }))();
    } else {
      Console.classList.remove(style["display"]);
      (Console.querySelector("input") as HTMLInputElement).blur();
      (Kiasole.onClose ?? (() => { }))();
    }
    return open
  }
}

export const Kiasole: KiasoleType = {
  onStart: null,
  onClose: null,
  log: (msg) => consoleFunction.log(msg),
  error: (msg) => consoleFunction.error(msg),
  warn: (msg) => consoleFunction.warn(msg),
  editLastLine: (msg) => consoleFunction.editLastLine(msg),
  runCommand: (input) => consoleFunction.runCommand(input),
  setCustomCommand: (cmd) => consoleFunction.setCustomCommand(cmd),
  toggle: toggleKiasole
}

function MyApp({ Component, pageProps }: AppProps) {

  /* ColorControCenter */
  const [clrCtrlCntr, setClrCtrlCntr] = useState<boolean>(true)

  const [color, setColor] = useState<string>("#ffffff")
  const [color2, setColor2] = useState<string>("#ffffff")
  const [powerSaveingMode, setPowerSaveingMode] = useState<boolean>(false)
  const [appScale, setAppScale] = useState<number>(100)

  const colorSetting = useCallback((
    prefix: string,
    className: string,
    setColor: Dispatch<SetStateAction<string>>,
    color: string,
  ) => {

    const cssStr = {
      r: prefix + "-r",
      g: prefix + "-g",
      b: prefix + "-b",
    }

    const ClrRRagRf = useRef<HTMLInputElement>(null)
    const ClrGRagRf = useRef<HTMLInputElement>(null)
    const ClrBRagRf = useRef<HTMLInputElement>(null)

    const ClrRInpRf = useRef<HTMLInputElement>(null)
    const ClrGInpRf = useRef<HTMLInputElement>(null)
    const ClrBInpRf = useRef<HTMLInputElement>(null)

    const HexInpRf = useRef<HTMLInputElement>(null)

    useEffect(() => {
      const HexInp = HexInpRf.current!

      const value = (document.querySelector(":root") as HTMLDivElement).style

      /* Color */
      const colSetRag = {
        r: ClrRRagRf.current!,
        g: ClrGRagRf.current!,
        b: ClrBRagRf.current!
      };
      const colSetRagArr = [
        colSetRag.r,
        colSetRag.g,
        colSetRag.b
      ];

      const colSetInp = {
        r: ClrRInpRf.current!,
        g: ClrGInpRf.current!,
        b: ClrBInpRf.current!
      };
      const colSetInpArr = [
        colSetInp.r,
        colSetInp.g,
        colSetInp.b
      ];

      const onColorChange = () => {
        setColor(
          colormgr.rgbToHex({
            r: +`${colSetRag.r.value}`,
            g: +`${colSetRag.g.value}`,
            b: +`${colSetRag.b.value}`
          })
        )
      }
      const colSetInpArrEvent = () => {
        onColorChange();
        colSetRag.r.value = colSetInp.r.value;
        colSetRag.g.value = colSetInp.g.value;
        colSetRag.b.value = colSetInp.b.value;
        HexInp.value = colormgr.rgbToHex({
          r: +`${colSetRag.r.value}`,
          g: +`${colSetRag.g.value}`,
          b: +`${colSetRag.b.value}`
        })
      }
      colSetInpArr.forEach(e => e.addEventListener("input", colSetInpArrEvent))
      const colSetRagArrEvent = () => {
        onColorChange();
        colSetInp.r.value = colSetRag.r.value;
        colSetInp.g.value = colSetRag.g.value;
        colSetInp.b.value = colSetRag.b.value;
        HexInp.value = colormgr.rgbToHex({
          r: +`${colSetRag.r.value}`,
          g: +`${colSetRag.g.value}`,
          b: +`${colSetRag.b.value}`
        })
      }
      colSetRagArr.forEach(e => e.addEventListener("input", colSetRagArrEvent))
      const HexInpEvent = () => {
        setColor(HexInp.value)
        colSetInp.r.value = value.getPropertyValue(cssStr.r)
        colSetInp.g.value = value.getPropertyValue(cssStr.g)
        colSetInp.b.value = value.getPropertyValue(cssStr.b)

        colSetRag.r.value = value.getPropertyValue(cssStr.r)
        colSetRag.g.value = value.getPropertyValue(cssStr.g)
        colSetRag.b.value = value.getPropertyValue(cssStr.b)
      }
      HexInp.addEventListener("input", HexInpEvent)

      const nowColor = colormgr.hexToRgb(color);
      const colors: Array<"r" | "g" | "b"> = ["r", "g", "b"];
      colors.forEach(color => {
        value.setProperty(prefix + "-" + color, nowColor[color].toString())
      })

      return () => {
        colSetInpArr.forEach(e => e.removeEventListener("input", colSetInpArrEvent))
        colSetRagArr.forEach(e => e.removeEventListener("input", colSetRagArrEvent))
        HexInp.removeEventListener("input", HexInpEvent)
      }
    }, [color])

    return {
      Element: <div className={[style["ColorContro"], className].join(" ")}>
        {
          [
            [colormgr.hexToRgb(color).r, ClrRRagRf, ClrRInpRf, "ChannelR"],
            [colormgr.hexToRgb(color).g, ClrGRagRf, ClrGInpRf, "ChannelG"],
            [colormgr.hexToRgb(color).b, ClrBRagRf, ClrBInpRf, "ChannelB"],
          ]
            .map((e, i) =>
              <div className={style["SettingUnit"]} key={i}>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={e[0] as number}
                  ref={e[1] as RefObject<HTMLInputElement>}
                  hover-tips={e[3]}
                  kilo-style=""

                  onChange={() => { }}
                />
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={e[0] as number}
                  ref={e[2] as RefObject<HTMLInputElement>}
                  hover-tips={e[3]}
                  kilo-style=""

                  onChange={() => { }}
                />
              </div>
            )
        }
        <input
          type="text"
          className={style["HexInput"]}
          value={color}
          ref={HexInpRf}
          hover-tips={"HexInput"}
          kilo-style=""
          onChange={() => { }}
        />
      </div>
    }
  }, [])

  const ColorSet1 = colorSetting(
    "--theme-color",
    style["Pri"],
    setColor,
    color,
  )

  const ColorSet2 = colorSetting(
    "--theme-color2",
    style["Sec"],
    setColor2,
    color2,
  )

  const lastTapTimeRef = useRef<number>(0);

  const DOUBLE_TAP_DELAY = 300;

  _setPowerSaveingMode = setPowerSaveingMode
  _setAppScale = setAppScale

  useEffect(() => {
    _powerSaveingMode = powerSaveingMode
  }, [powerSaveingMode])

  useEffect(() => {
    _appScale = appScale
  }, [appScale])

  /* dbTouch */
  useEffect(() => {
    const DOUBLE_TAP_DELAY = 300;
    const FINGER_COUNT_STABILIZE_DELAY = 60;

    const lastTapTimes = { 3: 0, 4: 0 };
    let maxFingersInThisGesture = 0;
    let gestureTimer: ReturnType<typeof setTimeout> | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      const currentFingers = e.touches.length;
      if (currentFingers > maxFingersInThisGesture) {
        maxFingersInThisGesture = currentFingers;
      }

      if (gestureTimer) clearTimeout(gestureTimer);

      gestureTimer = setTimeout(() => {
        const finalFingers = maxFingersInThisGesture;
        const currentTime = Date.now();

        if (finalFingers === 3 || finalFingers === 4) {
          const lastTapTime = lastTapTimes[finalFingers];
          const timeSinceLastTap = currentTime - lastTapTime;

          if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
            if (finalFingers === 3) {
              toggleKiasole();
            } else {
              setPowerSaveingMode(prev => !prev);
            }
            lastTapTimes[finalFingers] = 0;
          } else {
            lastTapTimes[finalFingers] = currentTime;
          }
        }

        maxFingersInThisGesture = 0;
      }, FINGER_COUNT_STABILIZE_DELAY);
    };

    document.addEventListener("touchstart", handleTouchStart);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      if (gestureTimer) clearTimeout(gestureTimer);
    };
  }, [toggleKiasole]);

  /* Init Base Setting */
  useEffect(() => {
    const urlParams = new URL(window.location.toString()).searchParams
    /* SetThemeColor */
    const value = (document.querySelector(":root") as HTMLDivElement).style
    {
      const Color = urlParams.get("color")

      if (Color) {
        setColor(Color)
      }

      const Blur = urlParams.get("blur")
      if (Blur && !Number.isNaN(+`${Blur}`)) {
        value.setProperty("--blur-effect", `${Blur}px`)
      }
    }
  }, [])

  /* Key Events */
  useEffect(() => {
    const okd = (e: KeyboardEvent) => {

      if (e.code === "Backquote") {
        if (inalFt.cuef) {
          if (powerSaveingMode) return;
          ift.cuef.cureff().classList.add(style["hide"]);
        }

        document.getElementById(style["Main"])?.classList.add(style["hideCursor"])
      }

      if (e.code === "Escape") {
        newInput._close(true)
      }
    }

    const oku = () => {
      if (inalFt.cuef) ift.cuef.cureff().classList.remove(style["hide"]);

      document.getElementById(style["Main"])?.classList.remove(style["hideCursor"])
    }

    document.addEventListener("keydown", okd)
    document.addEventListener("keyup", oku)

    return () => {
      document.removeEventListener("keydown", okd)
      document.removeEventListener("keyup", oku)
    }
  }, [powerSaveingMode])

  /* CursorEffects */
  useEffect(() => {
    if (powerSaveingMode) return;
    ift.cuef.cureff().classList.toggle(style["hide"], !inalFt.cuef)

    const crtPoint = (x: number, y: number, ele: HTMLElement) => {
      if (!inalFt.cuef) return;
      const div = document.createElement("div")
      div.style.top = y + "px"
      div.style.left = x + "px"
      div.appendChild(document.createElement("div"))
      ele.appendChild(div)

      console.log(`x:${x} , y:${y}`);

      setTimeout(() => {
        div.remove()
      }, 10e3);
    }

    const touchMove = (e: TouchEvent) => {
      if (!inalFt.cuef) return;
      const points = e.changedTouches

      for (let index = 0; index < points.length; index++) {
        const p = points[index];
        crtPoint(p.clientX, p.clientY, ift.cuef.traj())
      }
    }

    const touchStart = (e: TouchEvent) => {
      if (!inalFt.cuef) return;
      const points = e.changedTouches

      for (let index = 0; index < points.length; index++) {
        const p = points[index];
        crtPoint(p.clientX, p.clientY, ift.cuef.clickAni())
      }
    }

    const touchEnd = () => {
      if (!inalFt.cuef) return;
      ift.cuef.cur().classList.add(style["hide"])
    }

    const mouseMove = (e: MouseEvent) => {
      if (!inalFt.cuef) return;

      console.log(`x:${e.clientX} , y:${e.clientY}`);

      const cur = ift.cuef.cur().style

      cur.top = e.clientY + "px"
      cur.left = e.clientX + "px"

      crtPoint(e.clientX, e.clientY, ift.cuef.traj())
    }

    const mouseDown = (e: MouseEvent) => {
      if (!inalFt.cuef) return;
      ift.cuef.cur().classList.add(style["down"])

      crtPoint(e.clientX, e.clientY, ift.cuef.clickAni())
    }

    const mouseUp = (e: MouseEvent) => {
      if (!inalFt.cuef) return;
      ift.cuef.cur().classList.remove(style["down"])
    }

    document.addEventListener("touchstart", touchStart)
    document.addEventListener("touchend", touchEnd)
    document.addEventListener("touchmove", touchMove)

    document.addEventListener("mousemove", mouseMove)
    document.addEventListener("mousedown", mouseDown)
    document.addEventListener("mouseup", mouseUp)

    return () => {
      document.removeEventListener("touchstart", touchStart)
      document.removeEventListener("touchend", touchEnd)
      document.removeEventListener("touchmove", touchMove)

      document.removeEventListener("mousemove", mouseMove)
      document.removeEventListener("mousedown", mouseDown)
      document.removeEventListener("mouseup", mouseUp)
    }
  }, [powerSaveingMode])

  /* Console */
  useEffect(() => {
    const onkeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.altKey || e.metaKey) && (e.code === "KeyI")) {
        toggleKiasole()
      }
      if (e.metaKey && e.altKey && (e.code === "Backquote")) {
        setPowerSaveingMode(e => !e)
      }
    }

    document.addEventListener("keydown", onkeydown);
    return () => {
      document.removeEventListener("keydown", onkeydown);
    };
  }, [Kiasole]);

  useEffect(() => {
    if (powerSaveingMode) return;
    const effect = WebEffect.onBlur(style["blur"], document.getElementById(style["Cur"])!)
    return () => {
      effect.RemoveEvent()
    }
  }, [powerSaveingMode])

  _app = {
    disableColor: function () {
      setClrCtrlCntr(false)
      return false
    },
    enableColor: function () {
      setClrCtrlCntr(true)
      return true
    },
    toggleColor: function () {
      setClrCtrlCntr(e => !e)
      return !clrCtrlCntr
    },
    setColor: function (color: string) {
      setColor(color)
      return colormgr.hexToRgb(color)
    },
    setColor2: function (color: string) {
      setColor2(color)
      return colormgr.hexToRgb(color)
    },
    informalFunction: {
      CursorEffects: function (mode: "TOG" | "SET", status?: boolean) {
        if (powerSaveingMode) return false;
        if (mode === "TOG") {
          this.CursorEffects("SET", !inalFt.cuef)
          return inalFt.cuef;
        }

        inalFt.cuef = status ?? false

        console.log(inalFt.cuef);

        return !ift.cuef.cureff().classList.toggle(style["hide"], !inalFt.cuef)
      }
    },
    throwNotic: (message: string, time?: number) => {
      const div = document.createElement("div")

      div.innerHTML = message

      div.style.zIndex = new Date().getTime().toString()

      ele.notic().appendChild(div);

      (
        async () => {
          await functions.timeSleep(time || 3e3)

          div.classList.add(style["hide"])

          await functions.timeSleep(3e3)

          div.remove()
        }
      )()

      return div
    },
    clearNotic: () => {
      const list = ele.notic().children

      for (let index = 0; index < list.length; index++) {
        const e = list[index];

        (async () => {
          e.classList.add(style["hide"])
          await functions.timeSleep(3e3)
          e.remove()
        })()

      }
    },
    Effects: {
      FLASH: (color?: string) => {
        if (powerSaveingMode) return false;
        {
          const div = document.createElement("div")

          if (color) {
            div.style.backgroundColor = color
          }

          div.style.zIndex = new Date().getTime().toString()

          ele.Effect.flash().appendChild(div);

          (
            async () => {

              await functions.timeSleep(1e3)

              div.remove()
            }
          )()

          return div
        }
      }
    }
  }

  return (
    <>
      <Components.SVGFilters />

      <HeadSetting />
      <div
        style={{ zoom: appScale + "%" }}
        id={style["KIASE_APP"]}
        className={powerSaveingMode ? style["PowerSaveingMode"] : ""}
      >

        <div id={style["CursorEffects"]}>
          <div id={style["clickAnimation"]} >
            <div />
          </div>
          <div id={style["Trajectory"]} >
            <div />
          </div>
          <div id={style["Cur"]}>
            <div className={style["circle"]}>
              <div />
            </div>
            <div className={style["circle"]}>
              <div />
            </div>
          </div>
        </div>


        <div id={style["ColorControCenter"]} className={clrCtrlCntr ? "" : style["Disable"]}>
          <div className={style["DisableText"]}>
            {"THE COLOR SETTING IS DISABLE"}
          </div>
          <div className={style["Frame"]}>
            {ColorSet1.Element}
            {ColorSet2.Element}
          </div>
        </div>


        <div id={style["Effect"]}>
          <div id={style["Flash"]}>
          </div>
        </div>

        <div id={style["Notic"]}>
        </div>

        <div id={style["InputOverlay"]}>
          <div className={[style["Input"], style["Select"]].join(" ")} id="_appKiase_inputSelect" />
          <div className={[style["Input"], style["Message"]].join(" ")} id="_appKiase_inputMessage" />
        </div>

        <div id={style["Console"]}>
          <Terminal powerSaveingMode={powerSaveingMode} exitCommand={() => {
            const Console = document.getElementById(style["Console"])!;

            Console.classList.remove(style["display"]);
            (Console.querySelector("input") as HTMLInputElement).blur();
            (Kiasole.onClose ?? (() => { }))();

            Kiasole.log("Terminal Closed")
          }} />
        </div>

        <div id={style["Main"]}>
          <Component {...pageProps} />
        </div>

      </div>

      <HoverTips></HoverTips>
    </>
  )
}

export default MyApp
