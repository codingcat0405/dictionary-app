import React, { useCallback, useEffect } from 'react'
import { Button, Dropdown, Input, MenuProps, Select } from 'antd'
import { ParsedDictionaryEntry } from '@renderer/types'
import DictionaryEntry from '@renderer/components/DictionaryEntry'
import { debounce } from 'lodash'
import { US, VN } from 'country-flag-icons/react/1x1'
import { useNavigate } from 'react-router-dom'

const DictionaryPage: React.FC = () => {
  const navigate = useNavigate()
  const [dictionary, setDictionary] = React.useState<string>('ev')
  const [word, setWord] = React.useState<string>('')
  const [dictionaryEntry, setDictionaryEntry] = React.useState<ParsedDictionaryEntry | null>(null)
  const [similarWords, setSimilarWords] = React.useState<string[]>([])
  const [showSimilarWords, setShowSimilarWords] = React.useState<boolean>(false)
  const [debouncedValue, setDebouncedValue] = React.useState<string>('')
  const [similarMenuItems, setSimilarMenuItems] = React.useState<MenuProps['items']>([])
  const [recentsWords, setRecentsWords] = React.useState<{ word: string; dictionary: string }[]>([])
  const [savedWords, setSavedWords] = React.useState<{ word: string; dictionary: string }[]>([])

  const getSavedWords = (): void => {
    const recentsWords = window.localStorage.getItem('recents') ?? '[]'
    const recentWords: { word: string; dictionary: string }[] = JSON.parse(recentsWords)
    setRecentsWords(recentWords)
    const savedWords = window.localStorage.getItem('saved') ?? '[]'
    const savedWordsList: { word: string; dictionary: string }[] = JSON.parse(savedWords)
    setSavedWords(savedWordsList)
  }
  useEffect(() => {
    getSavedWords()
  }, [])
  const saveWordsToStorage = (
    word: string,
    dictionary: string,
    type: 'recents' | 'saved'
  ): void => {
    //save to recents word
    const wordsStr = window.localStorage.getItem(type) ?? '[]'
    const words: { word: string; dictionary: string }[] = JSON.parse(wordsStr)
    //if recents word we skip existing word, but with saved word we remove existing word
    const isExist = words.find((item) => item.word === word && item.dictionary === dictionary)
    if (isExist) {
      if (type === 'recents') {
        return
      }
      words.splice(words.indexOf(isExist), 1)
      window.localStorage.setItem(type, JSON.stringify(words))
      setSavedWords(words)
      return
    }
    if (type === 'recents' && words.length >= 5) {
      words.shift()
    }

    words.push({
      word,
      dictionary
    })
    window.localStorage.setItem(type, JSON.stringify(words))
    getSavedWords() //refresh recents words
  }

  const handleLookupWord = async (w: string, dictionary: string): Promise<void> => {
    if (!w) return
    try {
      const resp = await window.electron.ipcRenderer.invoke('lookup_word', w.trim(), dictionary)
      setDictionaryEntry(resp)
      if (!resp) {
        setShowSimilarWords(true)
      } else {
        setShowSimilarWords(false)
      }
      //get half of the word
      const halfWord = w.trim().slice(0, Math.floor(word.length / 2))
      const similarWords = await window.electron.ipcRenderer.invoke(
        'similar_word',
        halfWord,
        dictionary
      )
      setSimilarWords(similarWords)
    } catch (error) {
      console.error('Error in handleLookupWord:', error)
      setDictionaryEntry(null)
      setShowSimilarWords(false)
      setSimilarWords([])
    }
  }
  const findSimilarWord = async (w: string, dictionaryArg?: string): Promise<void> => {
    setWord(w)
    setDictionaryEntry(null)
    setSimilarWords([])
    if (dictionaryArg) {
      setDictionary(dictionaryArg)
    }
    await handleLookupWord(w, dictionaryArg ? dictionaryArg : dictionary)
  }
  // Create a debounced function
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setDebouncedValue(value)
    }, 500),
    []
  )
  useEffect(() => {
    if (debouncedValue) {
      window.electron.ipcRenderer
        .invoke('similar_word', debouncedValue, dictionary)
        .then((similarWords: string[]) => {
          setSimilarMenuItems(
            similarWords.map((word) => ({
              label: word,
              key: word
            }))
          )
        })
    }
  }, [debouncedValue, dictionary])

  const onClick: MenuProps['onClick'] = async ({ key }) => {
    setWord(key)
    setDictionaryEntry(null)
    setSimilarWords([])
    setShowSimilarWords(false)
    await handleLookupWord(key, dictionary)
    saveWordsToStorage(key, dictionary, 'recents')
  }
  return (
    <div className="mt-4">
      <div className="container mx-auto flex gap-2">
        <div className="w-1/3">
          <form
            className="bg-white rounded-lg shadow-md p-2 self-start"
            onSubmit={async (e) => {
              e.preventDefault()
              await handleLookupWord(word, dictionary)
              saveWordsToStorage(word, dictionary, 'recents')
            }}
          >
            <div className="text-center font-bold text-lg mb-2">Tra từ</div>
            <Dropdown trigger={['click']} menu={{ items: similarMenuItems, onClick }}>
              <Input
                value={word}
                placeholder="Nhập từ cần tra cứu"
                onChange={(e) => {
                  setWord(e.target.value)
                  debouncedSearch(e.target.value)
                }}
              />
            </Dropdown>

            <div className="flex items-center gap-2 mt-2">
              <Button type="primary" htmlType="submit" className="w-2/3" block>
                Tra từ
              </Button>
              <Select
                style={{ width: 'calc(1/3 * 100%)' }}
                value={dictionary}
                onChange={(value: string) => {
                  setDictionary(value)
                  setDictionaryEntry(null)
                  setWord('')
                  setSimilarWords([])
                  setShowSimilarWords(false)
                }}
              >
                <Select.Option value="ev">
                  <US />
                </Select.Option>
                <Select.Option value="ve">
                  <VN />
                </Select.Option>
              </Select>
            </div>
            <div className="mt-3">
              Từ đã tra:
              <div className="flex items-center flex-wrap gap-2">
                {recentsWords.map((word, index) => (
                  <div
                    onClick={async () => {
                      await findSimilarWord(word.word, word.dictionary)
                    }}
                    key={index}
                    className="text-blue-600 cursor-pointer hover:underline"
                  >
                    {word.word}
                  </div>
                ))}
              </div>
            </div>
          </form>
          <div className="bg-white rounded-lg shadow-md p-2 self-start mt-5">
            <div className="text-center font-bold text-lg mb-2">Từ yêu thích</div>
            <div className="flex items-center flex-wrap gap-2">
              {savedWords.map((word, index) => (
                <div
                  onClick={async () => {
                    await findSimilarWord(word.word, word.dictionary)
                  }}
                  key={index}
                  className="text-blue-600 cursor-pointer hover:underline"
                >
                  {word.word}
                </div>
              ))}
            </div>
          </div>
          <Button
            type="primary"
            className="w-full mt-5"
            onClick={() => {
              navigate('/advanced-dictionary')
            }}
          >
            Tra từ điển chuyên ngành
          </Button>
        </div>

        <div className="w-2/3">
          {dictionaryEntry ? (
            <DictionaryEntry
              entry={dictionaryEntry}
              dictionary={dictionary}
              similarWords={similarWords}
              findSimilarWord={findSimilarWord}
              onHeartClick={() => {
                saveWordsToStorage(word, dictionary, 'saved')
                getSavedWords()
              }}
            />
          ) : showSimilarWords ? (
            <div>
              <h4 className="text-lg font-bold">Không tìm thấy từ</h4>
              <p className="font-bold underline">Gợi ý:</p>
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
          ) : (
            <div className="text-center">
              <h4 className="text-lg font-bold">Nhập từ cần tra cứu</h4>
              <p className="text-gray-500">Ví dụ: hello, world, ...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DictionaryPage
