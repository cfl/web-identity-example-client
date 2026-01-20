<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import apiClient from '../services/api'
const data = reactive({
  message: '',
})
let error = ref('')

async function testTokenRefresh() {
  console.log('get data again to test refresh token ')
  const response = await apiClient.get('api/hello')
  data.message = response.data?.message
}

onMounted(async () => {
  const response = await apiClient.get('api/hello')
  data.message = response.data?.message
})
</script>

<template>
  <div v-if="!error">Backend says {{ data }}</div>
  <div v-if="error">Error occurred {{ error }}</div>
  <button @click="testTokenRefresh">Get Data Again</button>
</template>
