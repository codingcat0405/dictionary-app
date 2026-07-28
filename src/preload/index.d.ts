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
  pickImages: () => Promise<{ success: boolean; filePaths: string[]; error?: string }>
  pickAudio: () => Promise<{ success: boolean; filePath: string | null; error?: string }>
  pickDocument: () => Promise<{
    success: boolean
    filePath: string | null
    fileName: string | null
    fileSize: number | null
    mimeType: string | null
    error?: string
  }>
  readFile: (filePath: string) => Promise<Buffer>
  saveFileToDisk: (
    url: string,
    suggestedFileName: string
  ) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
