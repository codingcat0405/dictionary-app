import React, { useEffect } from 'react'
import { ParsedDictionaryEntry } from '@renderer/types'
import { HiMiniSpeakerWave } from 'react-icons/hi2'
import { CiHeart } from 'react-icons/ci'
import { FaHeart } from 'react-icons/fa'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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
    const res = savedWordsList.some(
      (savedWord) => savedWord.word === word && savedWord.dictionary === dictionary
    )
    setIsSaved(res)
    return res
  }
  useEffect(() => {
    checkSavedWord()
  }, [word, dictionary])
  if (!entry || !entry.word) {
    return <div className="text-body text-muted-foreground">No definition found</div>
  }

  return (
    <div className="h-[calc(100vh-150px)] w-full overflow-y-auto rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-h2 text-neutral-900">{word}</h2>
        {pronunciation && (
          <span className="text-small text-muted-foreground">[/{pronunciation}/]</span>
        )}
        {dictionary === 'ev' && pronunciation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSpeak}
                className="cursor-pointer text-neutral-500 hover:text-primary-600"
                aria-label="Phát âm"
              >
                <HiMiniSpeakerWave />
              </button>
            </TooltipTrigger>
            <TooltipContent>Phát âm</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="cursor-pointer"
              onClick={() => {
                onHeartClick()
                checkSavedWord()
              }}
              aria-label={isSaved ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            >
              {isSaved ? (
                <FaHeart className="text-red-500" />
              ) : (
                <CiHeart className="text-red-500" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>{isSaved ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}</TooltipContent>
        </Tooltip>
      </div>
      {partsOfSpeech.map((pos, posIndex) => (
        <div key={posIndex} className="mt-3">
          <h3 className="text-body-md font-semibold text-neutral-800 underline">{pos.type}</h3>

          <div className="space-y-2">
            {pos.definitions.map((def, defIndex) => (
              <div key={defIndex} className="text-body text-neutral-800">
                <div>• {def.text}</div>

                {def.examples && def.examples.length > 0 && (
                  <div className="ml-2 mt-1 space-y-1">
                    {def.examples.map((ex, exIndex) => (
                      <div key={exIndex} className="text-small">
                        → <span className="font-medium">{ex.phrase}:</span>
                        <br />
                        <span className="text-muted-foreground">
                          &nbsp;&nbsp;&nbsp;&nbsp;{ex.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {pos.idioms && pos.idioms.length > 0 && (
            <div className="mt-2">
              <h4 className="text-body-md font-semibold text-neutral-800 underline">
                Idioms & Phrases
              </h4>
              {pos.idioms.map((idiom, idiomIndex) => (
                <div key={idiomIndex} className="text-body">
                  <div className="font-medium">◆ {idiom.phrase}</div>
                  <div className="text-small text-muted-foreground">{idiom.meaning}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {specializedFields && specializedFields.length > 0 && (
        <div className="mt-3">
          <h3 className="text-body-md font-semibold text-neutral-800 underline">
            Specialized Terminology
          </h3>
          {specializedFields.map((field, fieldIndex) => (
            <div key={fieldIndex} className="mt-1">
              <h4 className="text-body-md text-neutral-700">{field.field}</h4>
              <div className="flex flex-wrap gap-1">
                {field.terms.map((term, termIndex) => (
                  <span key={termIndex} className="text-small text-neutral-600">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator className="my-3" />
      <div>
        <p className="text-body-md text-neutral-700">Từ liên quan:</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {similarWords.map((word, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-primary-100"
              onClick={async () => {
                await findSimilarWord(word)
              }}
            >
              {word}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DictionaryEntry
