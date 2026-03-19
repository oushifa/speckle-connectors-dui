<template>
  <CommonAlert
    v-if="
      store.isDistributedBySpeckle &&
      store.latestAvailableVersion &&
      !store.isConnectorUpToDate &&
      !hasDismissedAlert &&
      !store.isUpdateNotificationDisabled &&
      false
    "
    v-tippy="'版本: ' + store.latestAvailableVersion?.Number + ', 发布于 ' + createdAgo"
    color="neutral"
    size="xs"
    hide-icon
    class="mt-1"
  >
    <template #description>
      <div class="flex items-center">
        <div class="text-body-3xs truncate line-clamp-1 min-w-0">有可用更新</div>
        <div class="inline-flex justify-end -mr-3 grow">
          <FormButton size="sm" color="outline" @click="store.downloadLatestVersion()">
            下载
          </FormButton>
          <FormButton
            size="sm"
            color="subtle"
            hide-text
            :icon-left="XMarkIcon"
            @click="hasDismissedAlert = true"
          />
        </div>
      </div>
    </template>
  </CommonAlert>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useHostAppStore } from '~~/store/hostApp'
const store = useHostAppStore()
const hasDismissedAlert = ref(false)
const createdAgo = computed(() => {
  return dayjs(store.latestAvailableVersion?.Date).from(dayjs())
})
</script>
