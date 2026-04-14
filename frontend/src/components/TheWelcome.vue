<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import apiClient from '../services/api'
import { logout, keycloak } from '../plugins/AuthPlugin'

const { t, locale } = useI18n()

const data = reactive({
  user: {
    email: ''
  }
})
let formattedMessage = ref('')
let error = ref('')

onMounted(async () => {
  try {
    const response = await apiClient.get('api/hello')
    data.user = response.data?.user
    formattedMessage.value = JSON.stringify(data.user, null, 2)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
  }
})

const handleLogout = () => {
  logout()
}

const toggleLocale = () => {
  const newLocale = locale.value === 'en' ? 'fr' : 'en'
  console.log('>> Toggle locale from', locale.value, 'to', newLocale)
  // Store the new locale preference
  localStorage.setItem('preferredLocale', newLocale)
  console.log('>> Updated localStorage to:', newLocale)
  // Update i18n locale immediately for instant UI change
  locale.value = newLocale
  console.log('>> UI updated to:', newLocale)
}
</script>

<template>
  <div class="container">
      <header class="topWhite">
        <button @click="toggleLocale" class="locale-button">
          {{ t('language') }}
        </button>
        <button @click="handleLogout" class="logout-button">{{ t('logout') }}</button>
      </header>
      <section class="header">
          <h1 v-if="!error">{{ t('hello') }} {{ data.user?.email }}</h1>
      </section>
      <section class="page">
        <div class="content">
            <div v-if="!error">{{ t('jwtContents') }} <pre id="json">{{ formattedMessage }}</pre></div>
            <div v-if="error">{{ t('errorOccurred') }} {{ error }}</div>
        </div>
      </section>

  </div>
</template>

<style>
body {
  margin: 0;
  width: 100%;
  height: 100%;
}
  .topWhite {
    margin-top: 0px;
    display: flex;
    background-color: rgb(237, 237, 237);
    width: 100%;
    min-height: 80px;
    justify-content: flex-end;
    align-items: center;
    padding: 0 20px;
  }
  .locale-button {
    background-color: #3e7d78;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.3s ease;
    margin-right: 10px;
  }
  .locale-button:hover {
    background-color: #2f5f5b;
  }
  .logout-button {
    background-color: #437d3e;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.3s ease;
  }
  .logout-button:hover {
    background-color: #356330;
  }
  .header {
    display: flex;
    height: 130px;
    background-color: #437d3e;
    color: white;
    justify-content: center;
    align-content: center;
  }
  .page {
    background-color: rgb(237, 237, 237);;
    width: 100%;
    display: flex;
    justify-content: center;
    height: 100%;
  }
  .content {
    background-color: white;
    padding: 20px;
    min-height: 100%;
    border-radius: 6px;
    min-height: 100vh;
    max-width: 60%;
    text-align: center;
  }
</style>