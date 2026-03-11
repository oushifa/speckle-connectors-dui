<template>
  <div class="space-y-2 p-2 bg-highlight-1 rounded-md text-body-xs">
    <div v-if="!hasSelection">未选择对象，前往模型选择对象！</div>
    <div v-else>{{ selectionSummary }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hasSelection: boolean
  selectionSummary: string
}>()
</script>
