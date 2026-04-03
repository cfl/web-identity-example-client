import Keycloak from 'keycloak-js'
import { useAuthStore } from '@/stores/auth'

// Export keycloak instance for use throughout the app
export let keycloak: Keycloak | null = null

export default {
  install: async (app: any) => {
    const initOptions = {
      url: import.meta.env.VITE_KEYCLOAK_AUTH_SERVER_URL || 'http://localhost:8080',
      realm: import.meta.env.VITE_KEYCLOAK_REALM || '',
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || '',
    }
    keycloak = new Keycloak(initOptions)
    
    keycloak.onTokenExpired = async () => {
      try {
        await keycloak?.updateToken(30)
        if (keycloak?.idToken && keycloak?.token) {
          useAuthStore().commit('login', {
            idToken: keycloak.idToken,
            token: keycloak.token
          })
        }
      } catch (error) {
        console.error('Error when updating token ', error)
        keycloak?.login()
      }
    }
    
    // Initialize Keycloak without loading tokens from sessionStorage
    // Tokens will be kept in memory only for better security
    await keycloak.init({
      onLoad: 'login-required',   // ensures the user is logged in automatically
      checkLoginIframe: true,     // enables silent token refresh via hidden iframe
      pkceMethod: 'S256'          // required for public frontend-only clients
    })

    if (!keycloak.authenticated) {
      await keycloak.login()
    }

    if (keycloak.authenticated && keycloak.token && keycloak.idToken) {
      useAuthStore().commit('login', {
        idToken: keycloak.idToken,
        token: keycloak.token
      })
      
      // Check if this is a fresh login or a page reload/silent refresh
      const currentPath = window.location.pathname
      const isCompleteUserInfoPage = currentPath.includes('/complete-user-info')
      const freshLoginFlag = 'not-fresh-login'
      const hasPreviouslyRedirected = sessionStorage.getItem(freshLoginFlag)
      
      // Only redirect if this is a fresh login (flag not set and not already on complete-user-info page)
      if (!hasPreviouslyRedirected && !isCompleteUserInfoPage) {
        // Set the flag BEFORE redirecting to prevent future redirects on reloads/refreshes
        sessionStorage.setItem(freshLoginFlag, 'true')
        
        const currentUrl = window.location.origin + window.location.pathname + window.location.search
        const clientId = initOptions.clientId
        const webIdentityFrontendUrl = import.meta.env.VITE_WEB_IDENTITY_FRONTEND_URL || 'http://localhost:4005'
        
        const completeUserInfoUrl = `${webIdentityFrontendUrl}/complete-user-info?final_destination=${encodeURIComponent(currentUrl)}&clientId=${encodeURIComponent(clientId)}`
        window.location.replace(completeUserInfoUrl)
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
    // Clear the fresh login flag from session storage
    sessionStorage.removeItem('not-fresh-login')
    
    // Clear auth store
    useAuthStore().commit('logout')
    
    // Logout from Keycloak
    keycloak.logout({
      redirectUri: window.location.origin
    })
  }
}
