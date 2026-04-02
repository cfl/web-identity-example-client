import Keycloak from 'keycloak-js'
import { useAuthStore } from '@/stores/auth'

export default {
  install: async (app: any) => {
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
    
    // Load previously saved tokens from sessionStorage
    const savedToken = sessionStorage.getItem('kc_token')
    const savedIdToken = sessionStorage.getItem('kc_idToken')
    const savedRefreshToken = sessionStorage.getItem('kc_refreshToken')
    
    try {
      await authObject.init({
        onLoad: 'login-required',
        token: savedToken || undefined,
        idToken: savedIdToken || undefined,
        refreshToken: savedRefreshToken || undefined,
      })
    } catch (error) {
      // If init fails with saved tokens, clear them and try fresh login
      console.error('Failed to init with saved tokens:', error)
      sessionStorage.removeItem('kc_token')
      sessionStorage.removeItem('kc_idToken')
      sessionStorage.removeItem('kc_refreshToken')
      await authObject.init({
        onLoad: 'login-required',
      })
    }

    if (!authObject.authenticated) {
      await authObject.login()
    }

    if (authObject.authenticated && authObject.token && authObject.idToken) {
      useAuthStore().commit('login', {
        idToken: authObject.idToken,
        token: authObject.token,
      })
      
      // Save tokens to sessionStorage for next page navigation
      sessionStorage.setItem('kc_token', authObject.token)
      sessionStorage.setItem('kc_idToken', authObject.idToken)
      if (authObject.refreshToken) {
        sessionStorage.setItem('kc_refreshToken', authObject.refreshToken)
      }
      
      // Redirect to complete-user-info once per Keycloak session (AFTER tokens are saved)
      const currentPath = window.location.pathname
      const isCompleteUserInfoPage = currentPath.includes('/complete-user-info')
      
      // Use Keycloak session ID to create unique sessionStorage key
      const sessionId = authObject.sessionId || authObject.subject
      const sessionKey = `complete-user-info-checked-${sessionId}`
      const hasChecked = sessionStorage.getItem(sessionKey)
      
      // Only redirect if this is a fresh login
      if (!hasChecked && !isCompleteUserInfoPage) {
        sessionStorage.setItem(sessionKey, 'true')
        
        const currentUrl = window.location.origin + window.location.pathname + window.location.search
        const clientId = initOptions.clientId
        const webIdentityFrontendUrl = import.meta.env.VITE_WEB_IDENTITY_FRONTEND_URL || 'http://localhost:4005'
        
        const completeUserInfoUrl = `${webIdentityFrontendUrl}/complete-user-info?final_destination=${encodeURIComponent(currentUrl)}&clientId=${encodeURIComponent(clientId)}`
        window.location.href = completeUserInfoUrl
      }
    } else {
      useAuthStore().commit('logout')
    }
  },
}
