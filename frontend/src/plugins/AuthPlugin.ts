import Keycloak from 'keycloak-js'
import { useAuthStore } from '@/stores/auth'

export default {
  install: async (app: any) => {
    console.log('Starting auth plugin installation')
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
        useAuthStore().commit('login', {
          idToken: authObject.idToken,
          token: authObject.token,
        })
      } catch (error) {
        authObject.login()
      }
    }
    
    // Redirect to complete-user-info once per Keycloak session
    authObject.onAuthSuccess = () => {
      const currentPath = window.location.pathname
      const isCompleteUserInfoPage = currentPath.includes('/complete-user-info')
      
      // Use Keycloak session ID to create unique sessionStorage key
      const sessionId = authObject.sessionId || authObject.subject
      const sessionKey = `complete-user-info-checked-${sessionId}`
      const hasChecked = sessionStorage.getItem(sessionKey)
        
      // If we've already checked for this session OR we're on the complete-user-info page, skip
      if (hasChecked || isCompleteUserInfoPage) {
        return
      }
      
      // Set the flag BEFORE redirecting
      sessionStorage.setItem(sessionKey, 'true')
      
      const currentUrl = window.location.origin + window.location.pathname + window.location.search
      const clientId = initOptions.clientId
      const webIdentityFrontendUrl = import.meta.env.VITE_WEB_IDENTITY_FRONTEND_URL || 'http://localhost:4005'
      
      const completeUserInfoUrl = `${webIdentityFrontendUrl}/complete-user-info?final_destination=${encodeURIComponent(currentUrl)}&clientId=${encodeURIComponent(clientId)}`
      window.location.href = completeUserInfoUrl
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
      console.log('Saving tokens to store')
      useAuthStore().commit('login', {
        idToken: authObject.idToken,
        token: authObject.token,
      })
    } else {
      useAuthStore().commit('logout')
    }
  },
}
