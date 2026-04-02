import Keycloak from 'keycloak-js'
import { useAuthStore } from '@/stores/auth'

// Export keycloak instance for use throughout the app
export let keycloak: Keycloak | null = null

export default {
  install: async (app: any) => {
    let initOptions = {
      url: import.meta.env.VITE_KEYCLOAK_AUTH_SERVER_URL || 'http://localhost:8080',
      realm: import.meta.env.VITE_KEYCLOAK_REALM || '',
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || '',
    }
    keycloak = new Keycloak(initOptions)
    keycloak.onTokenExpired = async () => {
      try {
        await keycloak!.updateToken(30)
        useAuthStore().commit('login', {
          idToken: keycloak!.idToken,
          token: keycloak!.token,
        })
      } catch (error) {
        keycloak!.login()
      }
    }
    
    // Load previously saved tokens from sessionStorage
    const savedToken = sessionStorage.getItem('kc_token')
    const savedIdToken = sessionStorage.getItem('kc_idToken')
    const savedRefreshToken = sessionStorage.getItem('kc_refreshToken')
    
    try {
      await keycloak.init({
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
      await keycloak.init({
        onLoad: 'login-required',
      })
    }

    if (!keycloak.authenticated) {
      await keycloak.login()
    }

    if (keycloak.authenticated && keycloak.token && keycloak.idToken) {
      useAuthStore().commit('login', {
        idToken: keycloak.idToken,
        token: keycloak.token,
      })
      
      // Save tokens to sessionStorage for next page navigation
      sessionStorage.setItem('kc_token', keycloak.token)
      sessionStorage.setItem('kc_idToken', keycloak.idToken)
      if (keycloak.refreshToken) {
        sessionStorage.setItem('kc_refreshToken', keycloak.refreshToken)
      }
      
      // Redirect to complete-user-info once per Keycloak session (AFTER tokens are saved)
      const currentPath = window.location.pathname
      const isCompleteUserInfoPage = currentPath.includes('/complete-user-info')
      
      // Use Keycloak session ID to create unique sessionStorage key
      const sessionId = keycloak.sessionId || keycloak.subject
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

    // Make keycloak instance available globally
    app.config.globalProperties.$keycloak = keycloak
  },
}

// Logout function
export const logout = () => {
  if (keycloak) {
    // Clear session storage
    sessionStorage.removeItem('kc_token')
    sessionStorage.removeItem('kc_idToken')
    sessionStorage.removeItem('kc_refreshToken')
    
    // Clear all complete-user-info-checked keys
    const keysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('complete-user-info-checked-')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key))
    
    // Clear auth store
    useAuthStore().commit('logout')
    
    // Logout from Keycloak
    keycloak.logout({
      redirectUri: window.location.origin
    })
  }
}
