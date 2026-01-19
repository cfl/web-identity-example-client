import Keycloak from 'keycloak-js'
import { useAuthStore } from '@/stores/auth'

export default {
  install: async (app: any) => {
    useAuthStore().setLoading(true)
    let initOptions = {
      url: import.meta.env.VITE_KEYCLOAK_AUTH_SERVER_URL || 'http://localhost:8080',
      realm: import.meta.env.VITE_KEYCLOAK_REALM || '',
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || '',
    }
    const authObject = new Keycloak(initOptions)
    authObject.onTokenExpired = async () => {
      try {
        await authObject.updateToken(30)
      } catch (error) {
        authObject.login()
      }
    }
    let initializedKeycloak
    initializedKeycloak = await authObject.init({
      onLoad: 'login-required',
    })

    if (
      authObject.token &&
      authObject.idToken &&
      authObject.token != '' &&
      authObject.idToken != ''
    ) {
      useAuthStore().commit('login', {
        idToken: authObject.idToken,
        token: authObject.token,
      })
      useAuthStore().setLoading(false)
    } else {
      useAuthStore().commit('logout')
    }
  },
}
