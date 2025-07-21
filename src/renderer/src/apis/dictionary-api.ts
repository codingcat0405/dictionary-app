import axiosClient from './axios-client'
export interface Exercise {
  id: number
  name: string
  questions: {
    id: number
    question: string
    answerA: string
    answerB: string
    answerC: string
    answerD: string
    rightAnswer: number
  }[]
  createdAt: string
  updatedAt: string
}

export interface UserExerciseResult {
  id: number
  exerciseId: number
  userId: number
  result: string
  score: number
  createdAt: string
  updatedAt: string
  exercise: Exercise
}

const dictionaryApi = {
  register: async (data: { username: string; password: string; fullName: string }) => {
    return await axiosClient.post('/users/register', data)
  },
  login: async (data: {
    username: string
    password: string
  }): Promise<{
    token: string
    user: {
      id: string
      username: string
      role: string
    }
  }> => {
    return await axiosClient.post('/users/login', data)
  },
  me: async () => {
    return await axiosClient.get('/users/me')
  },
  createDictionary: async (data: {
    word: string
    pronunciation: string
    definition: string
    type: number
  }) => {
    return await axiosClient.post('/dictionary', data)
  },
  getDictionary: async (params: {
    page: number
    limit: number
  }): Promise<{
    contents: {
      id: number
      word: string
      pronunciation: string
      definition: string
      type: number
      createdAt: string
      updatedAt: string
    }[]
    total: number
    page: number
    limit: number
  }> => {
    return await axiosClient.get('/dictionary/all', { params })
  },
  deleteDictionary: async (id: number) => {
    return await axiosClient.delete(`/dictionary/${id}`)
  },
  updateDictionary: async (data: {
    id: number
    word: string
    pronunciation: string
    definition: string
    type: number
  }) => {
    return await axiosClient.put(`/dictionary/${data.id}`, data)
  },
  createExercise: async (data: {
    name: string
    questions: {
      question: string
      answerA: string
      answerB: string
      answerC: string
      answerD: string
      rightAnswer: number // 0: A, 1: B, 2: C, 3: D
    }[]
  }) => {
    return await axiosClient.post('/exercise', data)
  },
  getAllExercises: async (params: {
    page: number
    limit: number
  }): Promise<{
    contents: Exercise[]
    total: number
    page: number
    limit: number
  }> => {
    return await axiosClient.get('/exercise/all', { params })
  },
  deleteExercise: async (id: number) => {
    return await axiosClient.delete(`/exercise/${id}`)
  },
  updateExercise: async (
    id: number,
    data: {
      name: string
      questions: {
        question: string
        answerA: string
        answerB: string
        answerC: string
        answerD: string
        rightAnswer: number
      }[]
    }
  ) => {
    return await axiosClient.put(`/exercise/${id}`, data)
  },
  findWord: async (word: string, type: number) => {
    return await axiosClient.get(`/dictionary`, { params: { word, type } })
  },
  // New exercise methods
  getExercise: async (id: number): Promise<Exercise> => {
    return await axiosClient.get(`/exercise/${id}`)
  },
  submitExerciseResult: async (data: {
    exerciseId: number
    result: string
  }): Promise<UserExerciseResult> => {
    return await axiosClient.post('/exercise/submit', data)
  },
  getUserExercises: async (params: {
    page: number
    limit: number
  }): Promise<{
    content: UserExerciseResult[]
    total: number
    page: number
    limit: number
  }> => {
    return await axiosClient.get('/exercise/user', { params })
  },
  getUserExerciseResult: async (exerciseId: number): Promise<UserExerciseResult> => {
    return await axiosClient.get(`/exercise/user/${exerciseId}`)
  },
  getExerciseStats: async (): Promise<{
    totalExercises: number
    totalSubmissions: number
    exerciseStats: {
      exerciseId: number
      exerciseName: string
      submissionCount: number
    }[]
  }> => {
    return await axiosClient.get('/exercise/stats')
  },
  getExerciseSubmissions: async (
    exerciseId: number
  ): Promise<{
    submissions: {
      id: number
      userId: number
      exerciseId: number
      result: string
      score: number
      createdAt: string
      updatedAt: string
      user: {
        id: number
        username: string
        fullName: string
      }
    }[]
    total: number
  }> => {
    return await axiosClient.get(`/exercise/${exerciseId}/submissions`)
  }
}

export default dictionaryApi
