// Types for the parsed dictionary entry
interface DictionaryExample {
  phrase: string
  meaning: string
}

interface DictionaryIdiom {
  phrase: string
  meaning: string
}

interface DictionaryDefinition {
  text: string
  examples?: DictionaryExample[]
}

interface DictionaryPartOfSpeech {
  type: string
  definitions: DictionaryDefinition[]
  idioms?: DictionaryIdiom[]
}

interface SpecializedField {
  field: string
  terms: string[]
}

export interface ParsedDictionaryEntry {
  word: string
  pronunciation?: string
  partsOfSpeech: DictionaryPartOfSpeech[]
  specializedFields?: SpecializedField[]
}

/**
 * Parses a raw StarDict definition into a structured object
 * @param rawDefinition The raw definition text from StarDict
 * @returns A structured object representing the dictionary entry
 */
export function parseStarDictDefinition(rawDefinition: string): ParsedDictionaryEntry {
  // Split the definition into lines
  const lines = rawDefinition.split('\n')

  // Initialize the result object
  const result: ParsedDictionaryEntry = {
    word: '',
    partsOfSpeech: []
  }

  let currentPartOfSpeech: DictionaryPartOfSpeech | null = null
  let currentDefinition: DictionaryDefinition | null = null
  let inSpecializedField = false
  let currentSpecializedField: SpecializedField | null = null
  let currentIdiom: string | null = null

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) continue

    // Word and pronunciation line (starts with @)
    if (line.startsWith('@') && !result.word) {
      const wordPronMatch = line.match(/@([^/]+)(?:\/([^/]+)\/)?/)
      if (wordPronMatch) {
        result.word = wordPronMatch[1].trim()
        if (wordPronMatch[2]) {
          result.pronunciation = wordPronMatch[2].trim()
        }
      }
      continue
    }

    // Specialized field (starts with @, but after the word is already set)
    if (line.startsWith('@') && result.word) {
      inSpecializedField = true
      currentPartOfSpeech = null
      currentDefinition = null
      currentIdiom = null

      const fieldName = line.substring(1).trim()

      if (!result.specializedFields) {
        result.specializedFields = []
      }

      currentSpecializedField = {
        field: fieldName,
        terms: []
      }

      result.specializedFields.push(currentSpecializedField)
      continue
    }

    // Part of speech line (starts with *)
    if (line.startsWith('*')) {
      inSpecializedField = false
      currentSpecializedField = null
      currentIdiom = null

      currentPartOfSpeech = {
        type: line.substring(1).trim(),
        definitions: [],
        idioms: []
      }
      result.partsOfSpeech.push(currentPartOfSpeech)
      currentDefinition = null
      continue
    }

    // If we're in a specialized field, add terms
    if (inSpecializedField && currentSpecializedField && line.startsWith('-')) {
      currentSpecializedField.terms.push(line.substring(1).trim())
      continue
    }

    // If we're not in a specialized field or part of speech, skip
    if (!inSpecializedField && !currentPartOfSpeech) continue

    // Definition line (starts with -)
    if (line.startsWith('-')) {
      // If there's a current idiom, this line is the meaning of the idiom
      if (currentIdiom && currentPartOfSpeech && currentPartOfSpeech.idioms) {
        currentPartOfSpeech.idioms.push({
          phrase: currentIdiom,
          meaning: line.substring(1).trim()
        })
        currentIdiom = null
        continue
      }

      // Otherwise this is a regular definition
      if (currentPartOfSpeech) {
        currentDefinition = {
          text: line.substring(1).trim(),
          examples: []
        }
        currentPartOfSpeech.definitions.push(currentDefinition)
      }
      continue
    }

    // Example line (starts with =)
    if (line.startsWith('=') && currentDefinition) {
      const exampleMatch = line.match(/=([^+]+)\+(.+)/)
      if (exampleMatch) {
        if (!currentDefinition.examples) {
          currentDefinition.examples = []
        }
        currentDefinition.examples.push({
          phrase: exampleMatch[1].trim(),
          meaning: exampleMatch[2].trim()
        })
      }
      continue
    }

    // Idiom line (starts with !)
    if (line.startsWith('!') && currentPartOfSpeech) {
      currentIdiom = line.substring(1).trim()
      continue
    }
  }

  return result
}
