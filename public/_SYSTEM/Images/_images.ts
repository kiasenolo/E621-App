import { defaultImages } from "@/data/types/profile/images";

const path = "/_SYSTEM/Images/"

const DefaultImages: defaultImages = {
  owos: {
    preview: path + "/owos/preview.png",
    lock: path + "/owos/lock.png",
    main: path + "/owos/main.png",
    avatar: path + "/owos/avatar.png"
  },
  root: {
    background: path + "/root/background.png",
    avatar: path + "/root/avatar.png"
  },
  blog: path + "blog.png",
  AFK: path + "AFK.png"
}

export default DefaultImages