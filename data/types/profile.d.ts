import { ReactNode } from 'react'
import { Os } from './profile/os'
import { Images } from './profile/images'
import { Blog } from './profile/blog'
import { SoundSystem } from './profile/soundSystem'

export default interface profileType {
  usertag: string
  customText?: string
  color?: string
  os: Os
  blog?: Blog
  images?: Images
  soundSystem?: SoundSystem
}


