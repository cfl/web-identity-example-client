import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/', // Your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  const token = useAuthStore().user.keycloak.accessToken
  if (token) {
    config.headers['authorization'] = `Bearer ${token}`
  }
  return config
})

export default apiClient
