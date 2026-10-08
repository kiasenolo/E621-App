import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { createStore } from '../store'
import type { setCustomCommandType } from './parser'

export type ConsoleShell = {
  open: boolean
  height?: string
  zoom?: string
  takeover: boolean
  removed: string[]
}

export const consoleShell = createStore<ConsoleShell>({
  open: false,
  takeover: false,
  removed: [],
})

type consoleFunctionType = {
  log: (msg: ReactNode) => void;
  error: (msg: string) => void;
  warn: (msg: string) => void;
  editLastLine: (msg: ReactNode) => void;
  runCommand: (input: string) => void;
  setCustomCommand: Dispatch<SetStateAction<setCustomCommandType | undefined>>;
  typeWriterEffect: (text: string, time?: number | undefined) => Promise<void>;
}

export const consoleFunction: consoleFunctionType = {
  log: () => { },
  error: () => { },
  warn: () => { },
  editLastLine: () => { },
  runCommand: () => { },
  setCustomCommand: () => { },
  typeWriterEffect: async () => { },
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
  const next = open ?? !consoleShell.get().open

  consoleShell.set(s => ({ ...s, open: next }));

  (next ? Kiasole.onStart : Kiasole.onClose)?.()

  return next
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
