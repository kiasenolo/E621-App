import { createStore } from '../store'
import { _powerSaveingMode } from '../bridge'
import functions from '@/data/module/functions'
import style from '../_app.module.scss'

/* Notic */

type Notic = { id: number, html: string, zIndex: string, hide: boolean }

const noticStore = createStore<Notic[]>([])
let noticId = 0

const patchNotic = (id: number, patch: Partial<Notic>) =>
  noticStore.set(list => list.map(n => n.id === id ? { ...n, ...patch } : n))

const removeNotic = (id: number) =>
  noticStore.set(list => list.filter(n => n.id !== id))

export const throwNotic = (message: string, time?: number) => {
  const id = noticId++

  noticStore.set(list => [...list, { id, html: message, zIndex: new Date().getTime().toString(), hide: false }]);

  (
    async () => {
      await functions.timeSleep(time || 3e3)

      patchNotic(id, { hide: true })

      await functions.timeSleep(3e3)

      removeNotic(id)
    }
  )()
}

export const clearNotic = () => {
  noticStore.get().forEach(({ id }) => {
    (async () => {
      patchNotic(id, { hide: true })
      await functions.timeSleep(3e3)
      removeNotic(id)
    })()
  })
}

export const throwNewNotic = (message: string, time?: number) => {
  clearNotic()
  throwNotic(message, time)
}

export function NoticLayer() {
  const list = noticStore.use()

  return (
    <div id={style["Notic"]}>
      {list.map(n => (
        <div
          key={n.id}
          className={n.hide ? style["hide"] : undefined}
          style={{ zIndex: n.zIndex }}
          dangerouslySetInnerHTML={{ __html: n.html }}
        />
      ))}
    </div>
  )
}

/* Flash */

type Flash = { id: number, color?: string, zIndex: string }

const flashStore = createStore<Flash[]>([])
let flashId = 0

export const flash = (color?: string) => {
  if (_powerSaveingMode) return false

  const id = flashId++

  flashStore.set(list => [...list, { id, color, zIndex: new Date().getTime().toString() }]);

  (
    async () => {
      await functions.timeSleep(1e3)

      flashStore.set(list => list.filter(f => f.id !== id))
    }
  )()

  return true
}

export function EffectLayer() {
  const list = flashStore.use()

  return (
    <div id={style["Effect"]}>
      <div id={style["Flash"]}>
        {list.map(f => (
          <div key={f.id} style={{ backgroundColor: f.color, zIndex: f.zIndex }} />
        ))}
      </div>
    </div>
  )
}
