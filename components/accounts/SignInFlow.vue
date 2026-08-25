<template>
  <div class="flex flex-col space-y-2">
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
        placeholder=""
        color="foundation"
        autocomplete="off"
        show-clear
        @clear="showCustomServerInput = false"
      />
    </div>

    <FormButton v-if="canAddAccount" full-width @click="logIn()">登录</FormButton>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthManager } from '~/lib/authn/useAuthManager'
import type { BaseBridge } from '~/lib/bridge/base'
import getConfig from '~/env-config'
import { useServerStore } from '~/store/servers'

const customServerUrl = ref<string | undefined>('')
const showCustomServerInput = ref(false)

const serverStore = useServerStore()
const { activeServer } = storeToRefs(serverStore)

const { $accountBinding } = useNuxtApp()
const canAddAccount = ['AddAccount', 'addAccount'].some((name) =>
  ($accountBinding as unknown as BaseBridge).availableMethodNames?.includes(name)
)

const { generateChallenge } = useAuthManager()

const getTargetServerUrl = (): string => {
  // 1. explicit custom URL typed by the user wins
  if (customServerUrl.value) {
    return new URL(customServerUrl.value).origin
  }
  // 2. the server selected on the home page
  if (activeServer.value?.url) {
    return activeServer.value.url
  }
  // 3. fall back to the build-time configured server
  return getConfig('serverUrl')
}

const logIn = () => {
  const serverUrl = getTargetServerUrl()
  const challenge = generateChallenge(serverUrl)
  // const authUrl = `${serverUrl}/authn/verify/sdui/${challenge}`
  const authUrl = `${serverUrl}/lowcef.html?appId=sdui&challenge=${challenge}`
  window.location.href = authUrl
}
</script>
