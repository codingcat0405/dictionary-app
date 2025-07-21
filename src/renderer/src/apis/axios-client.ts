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

// Function to update base URL when server IP changes
export const updateApiBaseUrl = (): void => {
  axiosClient.defaults.baseURL = getApiUrl()
}

//add token to header
axiosClient.interceptors.request.use(async (config) => {
  const userString = window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? '{}'
  const { token } = JSON.parse(userString)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
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

export default axiosClient
