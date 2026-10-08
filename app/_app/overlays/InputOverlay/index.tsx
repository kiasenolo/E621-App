import { Fragment, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createStore } from '../../store'
import { _powerSaveingMode } from '../../bridge'
import style from './style.module.scss'

type SelectOption<T> = {
  name: string
  info?: string
  key?: string
  value: T
}

type MessageButton<T> = {
  name: string
  value: T
  key?: string
}

type Frame = { id: number, closing: boolean, kind: string, props: any }

type InputCtx = {
  close: (event?: boolean) => void
}

type InputKind<P> = {
  layer?: string
  View: (props: { frame: Frame, props: P, ctx: InputCtx }) => ReactNode
  onKey?: (e: KeyboardEvent<HTMLDivElement>, props: P, ctx: InputCtx) => void
}

const frameStore = createStore<Frame[]>([])
const kinds = new Map<string, InputKind<any>>()
let frameId = 0

export let newInputCloseEvents: (() => void)[] = []

const CLOSE_DELAY = .3e3

function close(event?: boolean) {
  const closing = frameStore.get().filter(f => !f.closing).map(f => f.id)

  frameStore.set(list => list.map(f => ({ ...f, closing: true })))

  const remove = () => frameStore.set(list => list.filter(f => !closing.includes(f.id)))

  if (_powerSaveingMode)
    remove()
  else
    setTimeout(remove, CLOSE_DELAY)

  const events = newInputCloseEvents
  newInputCloseEvents = []

  if (event) {
    events.forEach(e => e())
  }
}

const ctx: InputCtx = { close }

export function defineInput<P>(name: string, kind: InputKind<P>) {
  kinds.set(name, kind)

  return (props: P, onClose?: () => void) => {
    newInputCloseEvents.push(onClose ?? (() => { }))
    frameStore.set(list => [...list, { kind: name, id: frameId++, closing: false, props }])
  }
}

export function useShow(closing: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useLayoutEffect(() => {
    void ref.current?.clientHeight
    setShown(true)
  }, [])

  return { ref, className: [style["frame"], shown && !closing ? style["show"] : ""].join(" ").trim() }
}

export function Menu({ children }: { children: ReactNode }) {
  return (
    <div className={style["menu"]}>
      <div className={style["frame"]} {...{ "overflow-bar-none": "" }}>
        {children}
      </div>
    </div>
  )
}

function InputLayer({ name, kind, frames }: { name: string, kind: InputKind<any>, frames: Frame[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const top = frames.findLast(f => !f.closing)
  const active = top !== undefined

  useEffect(() => {
    if (active) ref.current?.focus()
    else ref.current?.blur()
  }, [active])

  return (
    <div
      ref={ref}
      id={`_appKiase_input${name[0].toUpperCase()}${name.slice(1)}`}
      className={[style["Input"], kind.layer ? style[kind.layer] : ""].join(" ").trim()}
      tabIndex={active ? -1 : undefined}
      style={active ? { outline: "none" } : undefined}
      onKeyDown={e => { if (top) kind.onKey?.(e, top.props, ctx) }}
    >
      {frames.map(f => <Fragment key={f.id}><kind.View frame={f} props={f.props} ctx={ctx} /></Fragment>)}
    </div>
  )
}

export function InputOverlay({ powerSave }: { powerSave?: boolean }) {
  const frames = frameStore.use()

  return (
    <div id={style["InputOverlay"]} className={powerSave ? style["PowerSaveingMode"] : undefined}>
      {[...kinds].map(([name, kind]) => (
        <InputLayer key={name} name={name} kind={kind} frames={frames.filter(f => f.kind === name)} />
      ))}
    </div>
  )
}

type SelectProps = {
  options: SelectOption<any>[]
  onChange: (e: any) => void
}

const openSelect = defineInput<SelectProps>("select", {
  layer: "Select",
  View({ frame, props: { options, onChange }, ctx }) {
    const { ref, className } = useShow(frame.closing)

    return (
      <div
        ref={ref}
        className={className}
        onClick={e => { if (e.target === e.currentTarget) ctx.close(true) }}
      >
        <Menu>
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => {
                ctx.close()
                onChange(option.value)
              }}
            >
              <span className={style["name"]}>{option.name}</span>
              {option.info && <span className={style["info"]}>{option.info}</span>}
            </button>
          ))}
        </Menu>
      </div>
    )
  },
  onKey(e, { options, onChange }, ctx) {
    const index = options.findIndex(opt => opt.key === e.code)
    if (index === -1) return

    e.preventDefault()
    e.stopPropagation()

    ctx.close()
    onChange(options[index].value)
  },
})

type MessageProps = {
  msg: string
  buttons?: MessageButton<any>[]
  onClick?: (e: any) => void
}

const openMessage = defineInput<MessageProps>("message", {
  layer: "Message",
  View({ frame, props: { msg, buttons, onClick }, ctx }) {
    const { ref, className } = useShow(frame.closing)

    return (
      <div
        ref={ref}
        className={className}
        onClick={e => { if (e.target === e.currentTarget) ctx.close(true) }}
        onKeyDown={e => e.preventDefault()}
      >
        <Menu>
          <span
            className={style["text"]}
            {...{ "overflow-bar-none": "" }}
            dangerouslySetInnerHTML={{ __html: msg }}
          />
          <div className={style["button"]}>
            {(buttons ?? [{ name: "okei", value: "" }]).map((e, i) => (
              <button
                key={i}
                className={style["name"]}
                onClick={() => {
                  onClick?.(e.value ? e.value : "none")
                  ctx.close()
                }}
              >
                {e.name}
              </button>
            ))}
          </div>
        </Menu>
      </div>
    )
  },
  onKey(e, { buttons, onClick }, ctx) {
    const index = buttons?.findIndex(opt => opt.key === e.code) ?? -1
    if (index === -1) return

    e.preventDefault()
    e.stopPropagation()

    ctx.close()
    onClick?.(buttons![index].value)
  },
})

type TextInputProps = {
  msg: string
  defaultValue?: string
  onInput?: (e: any) => void
}

const openTextInput = defineInput<TextInputProps>("textInput", {
  layer: "TextInput",
  View({ frame, props: { msg, onInput, defaultValue }, ctx }) {
    const { ref, className } = useShow(frame.closing)
    const [inputValue, setInputValue] = useState(defaultValue ?? "")
    return (
      <div
        ref={ref}
        className={className}
        onClick={e => { if (e.target === e.currentTarget) ctx.close(true) }}
      >
        <Menu>
          <span
            className={style["text"]}
            {...{ "overflow-bar-none": "" }}
            dangerouslySetInnerHTML={{ __html: msg }}
          />
          <input
            type="text"
            autoFocus
            className={style["input"]}
            value={inputValue}
            onInput={e => setInputValue(e.currentTarget.value)}
            onKeyDown={e => {
              if (e.key !== "Enter") return
              onInput?.(inputValue)
              ctx.close()
            }}
          />
          <div className={style["button"]}>
            <button
              className={style["name"]}
              onClick={_ => ctx.close(true)}
            >
              {"Cancel"}
            </button>
            <button
              className={style["name"]}
              onClick={_ => {
                onInput?.(inputValue)
                ctx.close()
              }}
            >
              {"Enter"}
            </button>
          </div>
        </Menu>
      </div>
    )
  },
})


function method<A extends any[], R>(
  arity: number,
  open: (args: A, done: (r: R) => void, onClose?: () => void) => void
) {
  return {
    callback: (...a: any[]) => open(a.slice(0, arity) as A, a[arity] ?? (() => { }), a[arity + 1]),
    sync: (...args: A) => new Promise<R | undefined>(resolve => open(args, resolve, () => resolve(undefined))),
  }
}

const methods = {
  select: method<[options: SelectOption<any>[]], any>(1, ([options], done, onClose) =>
    openSelect({ options, onChange: done }, onClose)),

  message: method<[msg: string, buttons?: MessageButton<any>[]], any>(2, ([msg, buttons], done, onClose) =>
    openMessage({ msg, buttons, onClick: done }, onClose)),

  textInput: method<[msg: string, defaultValue?: string], string>(2, ([msg, defaultValue], done, onClose) =>
    openTextInput({ msg, defaultValue, onInput: done }, onClose)),
}

export const newInput = {
  _close: close,

  select: methods.select.callback as <T>(
    options: SelectOption<T>[],
    onChange: (e: T) => void,
    onClose?: () => void
  ) => void,

  message: methods.message.callback as <T>(
    msg: string,
    buttons?: MessageButton<T>[],
    onClick?: (e: T) => void,
    onClose?: () => void
  ) => void,

  textInput: methods.textInput.callback as (
    msg: string,
    defaultValue?: string,
    onInput?: (e: string) => void,
    onClose?: () => void
  ) => void,
}

export const newInputSync = {
  select: methods.select.sync as <T>(options: SelectOption<T>[]) => Promise<T | undefined>,
  message: methods.message.sync as <T = string>(msg: string, buttons?: MessageButton<T>[]) => Promise<T | "none" | undefined>,
  textInput: methods.textInput.sync as (msg: string, defaultValue?: string) => Promise<string | undefined>,
}
