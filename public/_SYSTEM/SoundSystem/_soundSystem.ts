import { defaultSoundSystem } from "@/data/types/profile/soundSystem";

const Spath = "/_SYSTEM/SoundSystem/SFX/"
const Mpath = "/_SYSTEM/SoundSystem/Music/"


const DefaultMusicAndSound: defaultSoundSystem = {
  Music: {
    "ARKTESE FELOTA KIATAKSE": Mpath + "ARKTESE FELOTA KIATAKSE.ogg",
    "Love Story": Mpath + "Love Story.ogg"
  },
  SFX: {
    root: {
      back: Spath + "Root/back.ogg",
      change: Spath + "Root/change.ogg",
      enter: Spath + "Root/enter.ogg",
      in: Spath + "Root/in.ogg",
    },
    owos: {
      logout: Spath + "OwOs/logout.ogg",
      login: Spath + "OwOs/login.ogg",
      notcorrect: Spath + "OwOs/notcorrect.ogg",
      correct: Spath + "OwOs/correct.ogg",
      grouphover: Spath + "OwOs/grouphover.ogg",
      button: {
        hover: Spath + "OwOs/Button/hover.ogg",
        press: Spath + "OwOs/Button/press.ogg",
        release: Spath + "OwOs/Button/release.ogg",
      },
      powerOptions: {
        open: Spath + "OwOs/PowerOptions/open.ogg",
        close: Spath + "OwOs/PowerOptions/close.ogg",
      },
      preview: {
        open: Spath + "OwOs/Preview/open.ogg",
        close: Spath + "OwOs/Preview/close.ogg",
        zoomin: Spath + "OwOs/Preview/zoomin.ogg",
        zoomout: Spath + "OwOs/Preview/zoomout.ogg",
        board: {
          open: Spath + "OwOs/Preview/Board/open.ogg",
          close: Spath + "OwOs/Preview/Board/close.ogg",
        },
        apply: {
          lock: {
            hover: Spath + "OwOs/Preview/Apply/Lock/hover.ogg",
            press: Spath + "OwOs/Preview/Apply/Lock/press.ogg",
            release: Spath + "OwOs/Preview/Apply/Lock/release.ogg",
          },
          main: {
            hover: Spath + "OwOs/Preview/Apply/Main/hover.ogg",
            press: Spath + "OwOs/Preview/Apply/Main/press.ogg",
            release: Spath + "OwOs/Preview/Apply/Main/release.ogg",
          }
        }
      }
    }
  }
}

export default DefaultMusicAndSound