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
        placeholder="http://47.100.77.97:64482"
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
import { useAuthManager } from '~/lib/authn/useAuthManager'
import type { BaseBridge } from '~/lib/bridge/base'

const customServerUrl = ref<string | undefined>('http://47.100.77.97:64482')
const showCustomServerInput = ref(false)

const { $accountBinding } = useNuxtApp()
const canAddAccount = ['AddAccount', 'addAccount'].some((name) =>
  ($accountBinding as unknown as BaseBridge).availableMethodNames?.includes(name)
)

const { generateChallenge } = useAuthManager()

const logIn = () => {
  const serverUrl = customServerUrl.value
    ? new URL(customServerUrl.value).origin
    : 'http://47.100.77.97:64482'
  const challenge = generateChallenge(serverUrl)
  // const authUrl = `${serverUrl}/authn/verify/DUI/${challenge}`
  const authUrl = `${serverUrl}/lowcef.html?appId=DUI&challenge=${challenge}`
  window.location.href = authUrl
}
</script>
