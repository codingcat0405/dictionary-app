import { Filter } from 'bad-words'

const filter = new Filter()

export const badWordsFilter = filter

export const isProfane = (text: string): boolean => {
  return badWordsFilter.isProfane(text)
}

export const cleanText = (text: string): string => {
  return badWordsFilter.clean(text)
}
