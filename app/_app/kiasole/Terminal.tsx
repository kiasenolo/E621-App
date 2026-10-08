import { KeyboardEvent, ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import functions from '@/data/module/functions'
import consoleStyle from '../_app.styles/console.module.scss'
import { consoleFunction } from './consoleStore'
import { CommandContext, createDefaultCommands, createGlabsCommands, gap, withHelp } from './commands'
import { CommandType, findCommand, parseRecursive, setCustomCommandType, splitBySemicolon, tokenize } from './parser'
import { SuggestionItem, getSuggestions } from './suggest'
import useLocalStorage from '@/data/module/use/LocalStorage'

const HISTORY_LIMIT = 512

type Message = { node: ReactNode, level: "log" | "warn" | "error" }

export function Terminal({ exitCommand, powerSaveingMode }: {
  exitCommand?: () => void
  powerSaveingMode: boolean
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const [history, setHistory] = useLocalStorage<string[]>("KIASE-APP/kiasole/history", []);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [activeCommand, setActiveCommand] = useState<CommandType | null>(null);

  const [customCommand, setCustomCommand] = useState<setCustomCommandType>()
  const [glabs, setGlabs] = useState(false)

  const outputAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToEnd = useCallback((bump: boolean) => {
    const area = outputAreaRef.current
    if (!area) return;

    if (bump && area.scrollHeight > area.clientHeight) {
      area.classList.remove(consoleStyle["Bump"]);
      void area.offsetWidth;
      area.classList.add(consoleStyle["Bump"]);
    }

    area.scrollTop = area.scrollHeight;
  }, [])

  const print = useCallback(async (node: ReactNode, level: Message["level"]) => {
    setMessages(prev => [...prev, { node, level }]);

    if (!powerSaveingMode) {
      await functions.timeSleep(10);
    }
    scrollToEnd(!powerSaveingMode)
  }, [powerSaveingMode, scrollToEnd])

  const log = useCallback((msg: ReactNode) => print(msg, "log"), [print]);
  const error = useCallback((msg: ReactNode) => print(msg, "error"), [print]);
  const warn = useCallback((msg: ReactNode) => print(msg, "warn"), [print]);

  const logWithoutTimeout = useCallback((msg: ReactNode) => {
    setMessages(prev => [...prev, { node: msg, level: "log" }]);
    scrollToEnd(!powerSaveingMode)
  }, [powerSaveingMode, scrollToEnd]);

  const editLastLine = useCallback(async (msg: ReactNode) => {
    setMessages(prev => [...prev.slice(0, -1), { node: msg, level: "log" }]);

    if (!powerSaveingMode) {
      await functions.timeSleep(10);
    }
    scrollToEnd(false)
  }, [powerSaveingMode, scrollToEnd]);

  const removeLastLine = useCallback(() => {
    setMessages(prev => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => setMessages([]), []);

  const typeWriterEffect = useCallback(async (text: string, time?: number) => {
    if (!text) return;

    await log(text[0]);
    if (time) {
      await functions.timeSleep(time)
    }
    for (let i = 2; i <= text.length; i++) {
      await editLastLine(text.substring(0, i));
      if (time) {
        await functions.timeSleep(time)
      }
    }
  }, [log, editLastLine])

  const runCommandRef = useRef<(input: string) => Promise<void>>(async () => { })
  const run = useCallback((input: string) => runCommandRef.current(input), [])

  const enterGlabs = useCallback(() => {
    setCustomCommand(() => () => [])
    setGlabs(true)
  }, [])

  const commandList = useMemo(() => {
    const ctx: CommandContext = {
      log,
      error,
      warn,
      logWithoutTimeout,
      clear,
      runCommand: run,
      enterGlabs,
      exit: exitCommand ?? (() => window.close()),
    }

    const custom = customCommand ? customCommand(log, editLastLine, removeLastLine, run, typeWriterEffect) : [];

    return withHelp([
      ...(glabs ? createGlabsCommands(ctx) : createDefaultCommands(ctx)),
      ...custom,
    ], log)
  }, [glabs, customCommand, exitCommand, log, error, warn, logWithoutTimeout, clear, run, enterGlabs, editLastLine, removeLastLine, typeWriterEffect]);

  const runCommand = useCallback(async (input: string) => {
    if (!input.trim()) return;

    setHistory(prev => (prev[prev.length - 1] === input ? prev : [...prev, input].slice(-HISTORY_LIMIT)));
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
        const cmd = findCommand(commandList, cmdName);

        if (!cmd) {
          await error(`錯誤: 找不到指令 "${cmdName}"`);
          break;
        }

        const parsedParams = cmd.param ? parseRecursive(tokens, cmd.param, 1).data : {};

        await cmd.action(parsedParams);
      }
    } catch (e: any) {
      await error(`執行錯誤: ${e.message || e}`);
    } finally {
      setIsLocked(false);
    }
  }, [commandList, error, history]);

  useLayoutEffect(() => {
    runCommandRef.current = runCommand

    consoleFunction.log = log
    consoleFunction.error = error
    consoleFunction.warn = warn
    consoleFunction.editLastLine = editLastLine
    consoleFunction.runCommand = runCommand
    consoleFunction.setCustomCommand = setCustomCommand
    consoleFunction.typeWriterEffect = typeWriterEffect
  }, [runCommand, log, error, warn, editLastLine, typeWriterEffect])


  const handleInputChange = (value: string) => {
    setInputValue(value);
    setHistoryIndex(-1);

    const result = getSuggestions(value, commandList)

    setActiveCommand(result.activeCommand);
    setSuggestions(result.suggestions);
    setSuggestionIndex(result.suggestions.length > 0 ? 0 : -1);
  };

  const applySuggestion = (item: SuggestionItem) => {
    const rawTokens = inputValue.split(" ");

    let next: string;
    if (!activeCommand && rawTokens.length === 1) {
      next = item.value + " ";
    } else {
      rawTokens.pop();
      next = [...rawTokens, item.value].join(" ") + " ";
    }

    handleInputChange(next);
    inputRef.current?.focus();
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
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
        applySuggestion(suggestionIndex >= 0 ? suggestions[suggestionIndex] : suggestions[0]);
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
      }

      e.preventDefault();
      if (e.key === "ArrowUp") {
        if (history.length === 0) return;
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInputValue(history[newIndex]);
      } else {
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
      return;
    }

    if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  return (
    <div id={consoleStyle["Console"]} className={powerSaveingMode ? consoleStyle["PowerSaveingMode"] : ""}>
      <div className={consoleStyle["OutputArea"]} ref={outputAreaRef}>
        {messages.map((e, i) => (
          <div key={i} className={consoleStyle["Line"]} log-level={e.level}>
            {e.node}
          </div>
        ))}
      </div>

      <div className={consoleStyle["InputArea"]}>
        {!isLocked ? (
          <div className={consoleStyle["Input"]}>
            <div>{">"}</div>
            <input
              ref={inputRef}
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
          <div className={consoleStyle["SignatureHint"]}>
            <span className={consoleStyle["commandName"]}>{activeCommand.name}</span>
            <span className={consoleStyle["params"]}>
              {activeCommand.param?.map((p, idx) => (
                <span key={idx} className={consoleStyle["param"]}>
                  {p.required ? `[${p.name}]` : `<${p.name}>`}
                </span>
              ))}
            </span>
          </div>
        )}

        {!isLocked && suggestions.length > 0 && (
          <div className={consoleStyle["SuggestionBox"]}>
            {suggestions.map((item, idx) => (
              <div
                key={item.value + idx}
                className={[consoleStyle["suggestion"], idx === suggestionIndex ? consoleStyle["active"] : ""].join(" ")}
                onClick={() => applySuggestion(item)}
              >
                <div className={consoleStyle["leftGroup"]}>
                  <span className={consoleStyle["label"]}>{item.label}</span>
                  {item.type && <span className={consoleStyle["typeTag"]}>{item.type}</span>}
                </div>
                <div className={consoleStyle["rightGroup"]}>
                  {item.desc && <span className={consoleStyle["desc"]}>{item.desc}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
