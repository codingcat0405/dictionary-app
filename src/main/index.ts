import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { StarDictReader } from './StarDictReader'
import { ParsedDictionaryEntry, parseStarDictDefinition } from './dictionary-parser'
import say from 'say'
import { parse } from 'csv-parse'
import fs from 'fs'
function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Add keyboard shortcut to open DevTools (Ctrl+Shift+I)
  mainWindow.webContents.on('before-input-event', (_, input) => {
    if (input.control && input.shift && input.key === 'I') {
      mainWindow.webContents.openDevTools()
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function getDictionaryBasePath(subdir: string): string {
  // In production, the files are unpacked from asar and should be in resources
  const prodPath = path.join(process.resourcesPath, 'src', 'data', subdir)
  if (fs.existsSync(prodPath)) {
    return prodPath
  }

  // In development, try multiple possible paths
  const devPaths = [
    path.join(__dirname, '..', 'data', subdir), // out/data/subdir (built version)
    path.join(__dirname, '..', '..', 'src', 'data', subdir), // src/data/subdir (from out/main)
    path.join(process.cwd(), 'src', 'data', subdir), // absolute path from project root
    path.join(process.cwd(), 'out', 'data', subdir) // out/data/subdir from project root
  ]

  for (const devPath of devPaths) {
    if (fs.existsSync(devPath)) {
      return devPath
    }
  }

  // If none found, return the first path and let it fail with a clear error
  return devPaths[0]
}

// Create and initialize the reader
const evDictPath = getDictionaryBasePath('ev')
const evDict = new StarDictReader(
  evDictPath,
  'en_vi.ifo',
  'en_vi.idx',
  'en_vi.dict.dz'
)
const evInitialized = evDict.initialize()

const veDictPath = getDictionaryBasePath('ve')
const veDict = new StarDictReader(
  veDictPath,
  'star_vietanh.ifo',
  'star_vietanh.idx',
  'star_vietanh.dict.dz'
)
const veInitialized = veDict.initialize()

function lookupWord(dictionary: StarDictReader, word: string): ParsedDictionaryEntry | null {
  const result = dictionary.getDefinition(word)
  if (result.found && result.definition) {
    return parseStarDictDefinition(result.definition)
  } else {
    return null
    // Show similar words if none found
    // const similarWords = dictionary.getSimilarWords(word)
    // if (similarWords.length > 0) {
    //   console.log('Similar words:')
    //   console.log(similarWords.join(', '))
    // }
  }
}

function getRelatedWords(dictionary: StarDictReader, word: string): string[] {
  return dictionary.getSimilarWords(word, 14)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('lookup_word', (_, word: string, dictionaryType: 'ev' | 've') => {
    try {
      if (dictionaryType === 'ev') {
        return lookupWord(evDict, word)
      } else if (dictionaryType === 've') {
        return lookupWord(veDict, word)
      } else {
        throw new Error('Invalid dictionary type')
      }
    } catch (error) {
      console.error('Error in lookup_word:', error)
      return null
    }
  })

  ipcMain.handle('similar_word', (_, word: string, dictionaryType: 'ev' | 've') => {
    try {
      if (dictionaryType === 'ev') {
        return getRelatedWords(evDict, word)
      } else if (dictionaryType === 've') {
        return getRelatedWords(veDict, word)
      } else {
        throw new Error('Invalid dictionary type')
      }
    } catch (error) {
      console.error('Error in similar_word:', error)
      return []
    }
  })

  // Add handler to get dictionary status
  ipcMain.handle('get_dictionary_status', () => {
    return {
      ev: {
        path: evDictPath,
        initialized: evInitialized,
        wordCount: evDict.getWordCount()
      },
      ve: {
        path: veDictPath,
        initialized: veInitialized,
        wordCount: veDict.getWordCount()
      }
    }
  })

  ipcMain.on('speak_word', (_, word: string) => {
    try {
      say.speak(word)
    } catch (err) {
      console.log(err)
    }
  })

  ipcMain.handle(
    'choose-file',
    async (): Promise<{
      filePath: string
      data: { word: string; pronunciation: string; definition: string; image: string }[]
    } | null> => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [{ name: 'CSV files', extensions: ['csv'] }]
        })
        if (result.filePaths.length > 0) {
          //parse csv file
          const words = await parseDictionary(result.filePaths[0])
          console.log(words)
          return {
            filePath: result.filePaths[0],
            data: words
          }
        }
        return null
      } catch (err) {
        console.log(err)
        return null
      }
    }
  )

  function parseDictionary(
    filePath: string
  ): Promise<{ word: string; pronunciation: string; definition: string; image: string }[]> {
    return new Promise((resolve, reject) => {
      const records: { word: string; pronunciation: string; definition: string; image: string }[] =
        []
      fs.createReadStream(filePath)
        .pipe(parse({ delimiter: ',', from_line: 2 }))
        .on('data', function (row: string[]) {
          records.push({
            word: row[0],
            pronunciation: row[1],
            definition: row[2],
            image: row[3]
          })
        })
        .on('end', function () {
          resolve(records)
        })
        .on('error', function (err) {
          reject(err)
        })
    })
  }

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
