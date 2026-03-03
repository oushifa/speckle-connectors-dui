<template>
  <LayoutPanel fancy-glow class="transition pointer-events-auto w-full">
    <h1
      class="h4 w-full bg-red-400 text-center font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
    >
      欢迎使用
    </h1>
    <div v-if="isDesktopServiceAvailable || canAddAccount">
      <AccountsSignInFlow v-if="!showLegacy" />
      <AccountsLegacySignInFlow v-else @back-to-sign-in="showLegacy = false" />
      <FormButton
        v-if="!showLegacy"
        text
        full-width
        size="sm"
        class="text-xs"
        @click="showLegacy = true"
      >
        旧版登录
      </FormButton>
    </div>
    <div v-else>
      <div class="text-foreground-2 mt-2 mb-4">
        要登录并开始使用系统，您需要运行 Desktop Service。
        此轻量级后台服务处理安全身份验证。
      </div>
      <div class="space-y-3">
        <FormButton full-width>下载 Desktop Service</FormButton>
        <div class="text-center">
          <div class="text-foreground-2 text-xs mb-2">已安装？</div>
          <FormButton
            size="sm"
            full-width
            text
            link
            @click="accountStore.refreshAccounts()"
          >
            刷新以再次检查
          </FormButton>
        </div>
      </div>
    </div>
  </LayoutPanel>
</template>

<script setup lang="ts">
import { useAccountStore } from '~~/store/accounts'
import { useDesktopService } from '~/lib/core/composables/desktopService'
import type { BaseBridge } from '~/lib/bridge/base'

const accountStore = useAccountStore()
const { pingDesktopService } = useDesktopService()

const { $accountBinding } = useNuxtApp()
const canAddAccount = ['AddAccount', 'addAccount'].some((name) =>
  ($accountBinding as unknown as BaseBridge).availableMethodNames?.includes(name)
)

const showLegacy = ref(false)

const isDesktopServiceAvailable = ref(false) // this should be false default because there is a delay if /ping is not successful.

onMounted(async () => {
  isDesktopServiceAvailable.value = await pingDesktopService()
})
</script>
