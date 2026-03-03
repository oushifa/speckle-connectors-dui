<template>
  <CommonDialog
    v-model:open="store.showErrorDialog"
    fullscreen="none"
    @close="store.showErrorDialog = false"
    @fully-closed="store.setHostAppError(null)"
  >
    <template #header>
      <div class="h5 font-bold">宿主应用错误</div>
    </template>
    <div class="text-foreground-2 text-sm font-normal mx-2 -mt-2">
      <div class="text-s font-bold mb-2">{{ store.hostAppError?.message }}</div>
      <div class="text-xs whitespace-pre-line truncate">
        {{ store.hostAppError?.error }}
      </div>
      <button class="text-s font-bold my-2" @click="toggleStackTrace">
        {{ showStackTrace ? '隐藏' : '显示' }} 堆栈跟踪
      </button>
      <div v-if="showStackTrace" class="text-xs whitespace-pre-line truncate">
        {{ store.hostAppError?.stackTrace }}
      </div>
    </div>
  </CommonDialog>
</template>

<script setup lang="ts">
import { useHostAppStore } from '~/store/hostApp'
const store = useHostAppStore()
const showStackTrace = ref(false)
const toggleStackTrace = () => {
  showStackTrace.value = !showStackTrace.value
}
</script>
