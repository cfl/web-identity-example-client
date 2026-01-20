import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useAuthStore = defineStore('storeAuth', () => {
  const user = reactive({
    keycloak: {
      idToken: null,
      accessToken: null,
    },
  })
  return {
    user,
    commit: (event: string, data?: any) => {
      if (event === 'login') {
        user.keycloak = {
          idToken: data.idToken,
          accessToken: data.token,
        }
      } else {
        user.keycloak = {
          idToken: null,
          accessToken: null,
        }
      }
    },
  }
})
