import { ElectronAPI } from '@electron-toolkit/preload'

interface CustomAPI {
  selectFile: () => Promise<string | null>
  getDictionaryStatus: () => Promise<{
    ev: {
      path: string
      initialized: boolean
      wordCount: number
    }
    ve: {
      path: string
      initialized: boolean
      wordCount: number
    }
  }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
