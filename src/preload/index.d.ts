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
  uploadImages: () => Promise<{ success: boolean; urls: string[]; error?: string }>
  uploadAudio: () => Promise<{ success: boolean; url: string | null; error?: string }>
  uploadDocument: () => Promise<{
    success: boolean
    url: string | null
    fileName: string | null
    fileSize: number | null
    mimeType: string | null
    error?: string
  }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
