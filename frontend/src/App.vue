<script setup lang="ts">
import TheWelcome from './components/TheWelcome.vue'
</script>

<template>
  <!-- <TheWelcome></TheWelcome> -->
  <Suspense>
    <RouterView />
  </Suspense>
</template>

<style scoped>
body {
  margin: 0;
  top: 0;
  height: 100%;
}
</style>
