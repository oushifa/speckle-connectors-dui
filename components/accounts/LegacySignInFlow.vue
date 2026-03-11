<template>
  <div class="flex flex-col space-y-2">
    <div v-if="isDesktopServiceAvailable">
      <div v-show="!isAddingAccount" class="text-foreground-2 space-y-2">
        <FormButton
          text
          size="sm"
          full-width
          @click="showCustomServerInput = !showCustomServerInput"
        >
          {{ showCustomServerInput ? '使用默认服务器' : '设置自定义服务器 URL' }}
        </FormButton>
        <div v-if="showCustomServerInput">
          <FormTextInput
            v-model="customServerUrl"
            name="name"
            :show-label="false"
            color="foundation"
            autocomplete="off"
            show-clear
            @clear="showCustomServerInput = false"
          />
        </div>
        <div class="flex space-x-2">
          <FormButton
            color="outline"
            class="px-1"
            :icon-left="ArrowLeftIcon"
            hide-text
            @click="emit('backToSignIn')"
          />

          <FormButton full-width @click="startAccountAddFlow()">旧版登录</FormButton>
        </div>
      </div>

      <div v-show="isAddingAccount" class="text-foreground-2 mt-2 mb-4 space-y-2">
        <div class="text-sm text-center">请查看您的浏览器：正在等待授权完成。</div>
        <div class="py-2"><CommonLoadingBar :loading="isAddingAccount" /></div>
        <div v-if="showHelp" class="bg-blue-500/10 p-2 rounded-md space-y-2">
          <div class="text-sm text-center">遇到问题？</div>
          <FormButton size="sm" full-width @click="restartFlow()">重试</FormButton>
          <FormButton
            text
            size="sm"
            full-width
            @click="$openUrl('https://speckle.community')"
          >
            联系我们
          </FormButton>
        </div>
      </div>
    </div>
    <div v-else class="space-y-3">
      <div class="text-foreground-2 text-sm">
        需要桌面服务软件才能以旧版方式添加账户。该后台服务负责安全身份验证。
      </div>
      <div class="flex space-x-2">
        <FormButton
          color="outline"
          class="px-1"
          :icon-left="ArrowLeftIcon"
          hide-text
          @click="emit('backToSignIn')"
        />
        <FormButton full-width @click="$openUrl('https://releases.speckle.systems')">
          下载 Desktop Service
        </FormButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { useHostAppStore } from '~/store/hostApp'
import { ToastNotificationType } from '@speckle/ui-components'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useAccountStore } from '~~/store/accounts'
import { useDesktopService } from '~/lib/core/composables/desktopService'
import { ArrowLeftIcon } from '@heroicons/vue/24/solid'

const accountStore = useAccountStore()
const { pingDesktopService } = useDesktopService()
const hostApp = useHostAppStore()
const app = useNuxtApp()
const { trackEvent } = useMixpanel()

const emit = defineEmits<{
  (e: 'backToSignIn'): void
}>()

const showCustomServerInput = ref(false)
const isAddingAccount = ref(false)
const isDesktopServiceAvailable = ref(false) // this should be false default because there is a delay if /ping is not successful.
const customServerUrl = ref<string | undefined>('http://47.100.77.97:64482')
const showHelp = ref(false)

const accountCheckerIntervalFn = useIntervalFn(
  async () => {
    const previousAccountCount = accountStore.accounts.length
    await accountStore.refreshAccounts()
    const currentAccountCount = accountStore.accounts.length
    if (previousAccountCount !== currentAccountCount) {
      isAddingAccount.value = false
      showCustomServerInput.value = false
      accountCheckerIntervalFn.pause()
      trackEvent('DUI Account Added')
    }
  },
  1000,
  { immediate: false }
)

const startAccountAddFlow = () => {
  isAddingAccount.value = true
  accountCheckerIntervalFn.resume()
  setTimeout(() => {
    showHelp.value = true
  }, 10_000)
  const url = customServerUrl.value
    ? `http://localhost:29364/auth/add-account?serverUrl=${
        new URL(customServerUrl.value).origin
      }`
    : `http://localhost:29364/auth/add-account`

  app.$openUrl(url)

  // this is a annoying timeout that we cannot detect if user added same account or not.
  setTimeout(() => {
    if (isAddingAccount.value) {
      isAddingAccount.value = false
      showCustomServerInput.value = false
      accountCheckerIntervalFn.pause()
      // Note to Dim: not sure about toast
      hostApp.setNotification({
        title: '登录',
        type: ToastNotificationType.Info,
        description: '登录超时。可能是因为您尝试添加已存在的账户。'
      })
      // TODO: we could log it to sentry/seq later to see how likely it happens?
    }
  }, 30_000)
}

const restartFlow = () => {
  isAddingAccount.value = false
  showHelp.value = false
}

onMounted(async () => {
  isDesktopServiceAvailable.value = await pingDesktopService()
})
</script>
