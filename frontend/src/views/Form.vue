<script setup lang="ts">

import { ref } from 'vue'
import apiClient from '../services/api'

const userToken = ref()

const formsURL = ref()
const readyToLoadForm = ref(false)
try {
    const response = await apiClient.get('api/signUserToken')
    userToken.value = response.data.userIdToken
    const encodedUserToken = encodeURI(userToken.value)
    formsURL.value = `https://ca.makeforms.co/xx7nkai/?userToken=${encodedUserToken}`
    readyToLoadForm.value = true
} catch (err: any) {
    console.log('Error in example ', err)
}

</script>

<template>
    <template v-if="readyToLoadForm">
        <iframe :src="formsURL" style="width: 100%;height: 500px;max-height: 100%;max-width: 100%;"
            frameborder="none"></iframe>
    </template>
</template>