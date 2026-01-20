import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import AuthPlugin from './plugins/AuthPlugin'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())

app.config.globalProperties.$store = useAuthStore()
await AuthPlugin.install(app)
app.use(router)
app.mount('#app')
