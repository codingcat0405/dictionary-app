import React, { useEffect } from 'react'
import { ParsedDictionaryEntry } from '@renderer/types'
import { HiMiniSpeakerWave } from 'react-icons/hi2'
import { CiHeart } from 'react-icons/ci'
import { FaHeart } from 'react-icons/fa'

const DictionaryEntry: React.FC<{
  entry: ParsedDictionaryEntry
  dictionary: string
  similarWords: string[]
  findSimilarWord: (word: string) => Promise<void>
  onHeartClick: () => void
}> = ({ entry, dictionary, similarWords, findSimilarWord, onHeartClick }) => {
  const [isSaved, setIsSaved] = React.useState<boolean>(false)

  const { word, pronunciation, partsOfSpeech, specializedFields } = entry

  const handleSpeak = (): void => {
    window.electron.ipcRenderer.send('speak_word', word.trim())
  }

  const checkSavedWord = (): boolean => {
    const savedWords = window.localStorage.getItem('saved') ?? '[]'
    const savedWordsList: { word: string; dictionary: string }[] = JSON.parse(savedWords)
    console.log(savedWordsList)
    console.log(word)
    const res = savedWordsList.some(
      (savedWord) => savedWord.word === word && savedWord.dictionary === dictionary
    )
    console.log(res)
    setIsSaved(res)
    return res
  }
  useEffect(() => {
    checkSavedWord()
  }, [word, dictionary])
  if (!entry || !entry.word) {
    return <div>No definition found</div>
  }

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md h-[calc(100vh-150px)] overflow-y-auto">
      <div className="flex gap-1 items-center">
        <h2 className="text-lg font-bold underline">{word}</h2>
        {pronunciation && <div className="pronunciation">[/{pronunciation}/]</div>}
        {dictionary === 'ev' && pronunciation && (
          <button onClick={handleSpeak} className="cursor-pointer">
            <HiMiniSpeakerWave />
          </button>
        )}
        <button
          className="cursor-pointer"
          onClick={() => {
            onHeartClick()
            checkSavedWord()
          }}
        >
          {isSaved ? <FaHeart className="text-red-500" /> : <CiHeart className="text-red-500" />}
        </button>
      </div>
      {partsOfSpeech.map((pos, posIndex) => (
        <div key={posIndex} className="mt-2">
          <h3 className="font-bold underline">{pos.type}</h3>

          <div className="definitions">
            {pos.definitions.map((def, defIndex) => (
              <div key={defIndex} className="definition">
                <div className="definition-text">• {def.text}</div>

                {def.examples && def.examples.length > 0 && (
                  <div className="examples">
                    {def.examples.map((ex, exIndex) => (
                      <div key={exIndex} className="example">
                        → <span className="example-phrase">{ex.phrase}:</span>
                        <br />
                        <span className="text-gray-600">&nbsp;&nbsp;&nbsp;&nbsp;{ex.meaning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {pos.idioms && pos.idioms.length > 0 && (
            <div className="mt-2">
              <h4 className="font-bold underline">Idioms & Phrases</h4>
              {pos.idioms.map((idiom, idiomIndex) => (
                <div key={idiomIndex} className="idiom">
                  <div className="idiom-phrase">◆ {idiom.phrase}</div>
                  <div className="text-gray-600">{idiom.meaning}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {specializedFields && specializedFields.length > 0 && (
        <div className="specialized-fields">
          <h3 className="font-bold underline mt-2">Specialized Terminology</h3>
          {specializedFields.map((field, fieldIndex) => (
            <div key={fieldIndex} className="field">
              <h4>{field.field}</h4>
              <div className="terms">
                {field.terms.map((term, termIndex) => (
                  <span key={termIndex} className="term">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2">
        <p className="font-bold underline">Từ liên quan:</p>
        <div className="flex items-center flex-wrap gap-2">
          {similarWords.map((word, index) => (
            <div
              onClick={async () => {
                await findSimilarWord(word)
              }}
              key={index}
              className="text-blue-600 cursor-pointer hover:underline"
            >
              {word}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DictionaryEntry
