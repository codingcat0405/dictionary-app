import { readFileSync } from 'fs'
import { gunzipSync } from 'zlib' // Use Node's zlib instead of Bun
import { join } from 'path'

// Interfaces for the dictionary data structures
interface DictInfo {
  [key: string]: string
}

interface WordIndexEntry {
  word: string
  dataOffset: number
  dataSize: number
}

interface DefinitionResult {
  found: boolean
  word?: string
  definition?: string
  message?: string
}

export class StarDictReader {
  private readonly basePath: string
  private readonly ifoPath: string
  private readonly idxPath: string
  private readonly dictPath: string
  public dictInfo: DictInfo
  private readonly wordIndex: WordIndexEntry[]

  constructor(basePath: string, infoPath: string, idxPath: string, dictPath: string) {
    this.basePath = basePath
    this.ifoPath = join(this.basePath, infoPath)
    this.idxPath = join(this.basePath, idxPath)
    this.dictPath = join(this.basePath, dictPath)
    this.dictInfo = {}
    this.wordIndex = []
  }

  // Initialize the dictionary by reading the .ifo and .idx files
  public initialize(): boolean {
    try {
      // Parse the .ifo file (dictionary information)
      this.parseIfoFile()

      // Parse the .idx file (word index)
      this.parseIdxFile()

      return true
    } catch (error) {
      console.error('Error initializing dictionary:', error)
      return false
    }
  }

  // Parse the .ifo file to get dictionary metadata
  private parseIfoFile(): void {
    const ifoContent = readFileSync(this.ifoPath, 'utf8')
    const lines = ifoContent.split('\n')

    for (const line of lines) {
      if (line.includes('=')) {
        const [key, value] = line.split('=')
        if (!key || !value) {
          continue
        }
        this.dictInfo[key.trim()] = value.trim()
      }
    }

    console.log('Dictionary info:', this.dictInfo)
  }

  // Parse the .idx file to build the word index
  private parseIdxFile(): void {
    try {
      const idxBuffer = readFileSync(this.idxPath)
      let offset = 0

      while (offset < idxBuffer.length) {
        // Find the end of the word (null-terminated)
        let wordEnd = offset
        while (idxBuffer[wordEnd] !== 0 && wordEnd < idxBuffer.length) {
          wordEnd++
        }

        // Extract the word
        const word = idxBuffer.slice(offset, wordEnd).toString('utf8')
        offset = wordEnd + 1

        // Extract data offset (4 bytes)
        const dataOffset = idxBuffer.readUInt32BE(offset)
        offset += 4

        // Extract data size (4 bytes)
        const dataSize = idxBuffer.readUInt32BE(offset)
        offset += 4

        // Add to index
        this.wordIndex.push({
          word,
          dataOffset,
          dataSize
        })
      }

      // Sort the index by word for binary search
      this.wordIndex.sort((a, b) => a.word.localeCompare(b.word))
    } catch (error) {
      console.error('Error parsing idx file:', error)
      throw error
    }
  }

  // Look up a word and get its definition
  public getDefinition(word: string): DefinitionResult {
    // Simple binary search to find the word
    let left = 0
    let right = this.wordIndex.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      const entry = this.wordIndex[mid]
      if (!entry) {
        continue
      }

      const comparison = word.localeCompare(entry.word)

      if (comparison === 0) {
        // Found the word, extract its definition
        return this.extractDefinition(entry)
      } else if (comparison < 0) {
        right = mid - 1
      } else {
        left = mid + 1
      }
    }

    // Word not found
    return {
      found: false,
      message: `Word "${word}" not found`
    }
  }

  // Get the definition from the .dict.dz file
  private extractDefinition(entry: WordIndexEntry): DefinitionResult {
    try {
      // Read the compressed dictionary file
      const dictContent = readFileSync(this.dictPath)

      // Decompress using Node's gunzipSync
      const uncompressedContent = gunzipSync(dictContent)

      // Extract the definition using the offset and size from the index
      const definitionBuffer = uncompressedContent.slice(
        entry.dataOffset,
        entry.dataOffset + entry.dataSize
      )

      // Properly decode the buffer as UTF-8
      const definition = new TextDecoder('utf-8').decode(definitionBuffer)

      return {
        found: true,
        word: entry.word,
        definition
      }
    } catch (error) {
      const err = error as Error
      console.error('Error extracting definition:', err)
      return {
        found: false,
        message: `Error retrieving definition for "${entry.word}": ${err.message}`
      }
    }
  }

  // Get similar words (optional feature)
  public getSimilarWords(prefix: string, limit: number = 10): string[] {
    return this.wordIndex
      .filter((entry) => entry.word.startsWith(prefix))
      .map((entry) => entry.word)
      .slice(0, limit)
  }

  // Add method to get random words (useful for testing or features like "Word of the day")
  public getRandomWords(count: number = 1): string[] {
    const randomWords: string[] = []
    const totalWords = this.wordIndex.length

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * totalWords)
      const entry = this.wordIndex[randomIndex]
      if (entry) {
        randomWords.push(entry.word)
      }
    }

    return randomWords
  }

  // Add method to search within definitions (useful for reverse lookup)
  public searchInDefinitions(searchTerm: string, limit: number = 10): string[] {
    const results: string[] = []
    let count = 0

    // This is a simplified approach - for a real app, you'd want to build a reverse index
    for (const entry of this.wordIndex) {
      if (count >= limit) break

      const definition = this.extractDefinition(entry)
      if (
        definition.found &&
        definition.definition &&
        definition.definition.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        results.push(entry.word)
        count++
      }
    }

    return results
  }

  // Add method to get word count
  public getWordCount(): number {
    return this.wordIndex.length
  }
}
