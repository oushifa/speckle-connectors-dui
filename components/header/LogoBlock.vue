<template>
  <!-- <NuxtLink class="flex items-center" to="/"> -->
  <div></div>
  <!-- <div v-if="!minimal" class="text-primary h6 mt-0 font-bold leading-7 md:flex">
      Speckle
    </div> -->
  <!-- </NuxtLink> -->
</template>
<script setup lang="ts">
defineProps({
  minimal: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  }
})
</script>
