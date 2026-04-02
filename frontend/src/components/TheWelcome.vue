<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import apiClient from '../services/api'
import { logout } from '../plugins/AuthPlugin'

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
  } catch (err: any) {
    error.value = err.message
  }
})

const handleLogout = () => {
  logout()
}
</script>

<template>
  <div class="container">
      <header class="topWhite">
        <button @click="handleLogout" class="logout-button">Logout</button>
      </header>
      <section class="header">
          <h1 v-if="!error">Hello {{ data.user?.email }}</h1>
      </section>
      <section class="page">
        <div class="content">
            <div v-if="!error"> The contents of your JWT token are: <pre id="json">{{ formattedMessage }}</pre></div>
            <div v-if="error">Error occurred {{ error }}</div>
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