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
