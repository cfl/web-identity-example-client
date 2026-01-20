<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import apiClient from '../services/api'
const data = reactive({
  message: '',
})
let error = ref('')

onMounted(async () => {
  try {
    const response = await apiClient.get('api/hello')
    data.message = response.data?.message
  } catch (err: any) {
    error.value = err.message
  }
})
</script>

<template>
  <div v-if="!error">Backend says {{ data }}</div>
  <div v-if="error">Error occurred {{ error }}</div>
</template>
