import { ACCESS_TOKEN_KEY, getApiUrl } from '@renderer/constants'
import axios from 'axios'
import queryString from 'query-string'

const axiosClient = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'content-type': 'application/json'
  },
  paramsSerializer: (params) => queryString.stringify(params)
})

// Separate client for file uploads (multipart/form-data)
// Note: Don't set Content-Type header - axios will set it automatically with boundary
const uploadClient = axios.create({
  baseURL: getApiUrl()
})

// Function to update base URL when server IP changes
export const updateApiBaseUrl = (): void => {
  axiosClient.defaults.baseURL = getApiUrl()
}

//add token to header
const addAuthToken = (config: any) => {
  const userString = window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? '{}'
  const { token } = JSON.parse(userString)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

axiosClient.interceptors.request.use(async (config) => {
  return addAuthToken(config)
})

uploadClient.interceptors.request.use(async (config) => {
  return addAuthToken(config)
})

axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data
    }
    return response
  },
  (error) => {
    throw error
  }
)

uploadClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data
    }
    return response
  },
  (error) => {
    throw error
  }
)

export default axiosClient
export { uploadClient }
