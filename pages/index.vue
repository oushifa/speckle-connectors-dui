<template>
  <div>
    <div v-if="(store.hostAppName && app.$isRunningOnConnector) || app.$isDev">
      <div v-if="!config.isDevMode" class="px-1">
        <CommonUpdateAlert />
      </div>
      <!-- IMPORTANT CHECK!! otherwise host app communication corrputed for many different reasons -->
      <div v-if="accounts.length != 0">
        <div
          v-if="hasNoModelCards"
          class="fixed h-screen w-screen flex items-center justify-center pr-2 pointer-events-none"
        >
          <LayoutPanel fancy-glow class="transition pointer-events-auto w-[90%]">
            <div class="flex">
              <h1
                class="text-heading-lg w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
              >
                你好！
              </h1>
              <button
                v-if="accountStore.activeAccount"
                v-tippy="'打开 Web 应用'"
                class="transition mr-1 opacity-70 hover:opacity-100"
                @click.stop="
                  $openUrl(accountStore.activeAccount.accountInfo.serverInfo.url)
                "
              >
                <ArrowTopRightOnSquareIcon class="w-4" />
              </button>
            </div>
            <!-- Returning null from host app is blocked by CI for now, hence host app send here empty documentInfo, we check it's id whether null or not. -->
            <div v-if="!!store.documentInfo?.id">
              <div class="text-foreground-2 text-body-sm">
                此文件中尚未发布或加载模型。
              </div>
              <div
                class="flex space-x-2 max-[275px]:flex-col max-[275px]:space-y-2 max-[275px]:space-x-0 mt-4"
              >
                <div v-if="app.$sendBinding" class="grow">
                  <FormButton
                    v-tippy="'将此文件中的对象发布到新模型'"
                    :icon-left="ArrowUpTrayIcon"
                    color="outline"
                    full-width
                    @click="handleSendClick"
                  >
                    发布
                  </FormButton>
                </div>
                <div v-if="app.$receiveBinding" class="grow">
                  <FormButton
                    v-tippy="'加载现有模型到此文件'"
                    :icon-left="ArrowDownTrayIcon"
                    color="outline"
                    full-width
                    @click="handleReceiveClick"
                  >
                    加载
                  </FormButton>
                </div>
              </div>
            </div>
            <div v-else>
              <div v-if="store.documentInfo?.message" class="text-foreground-2">
                {{ store.documentInfo?.message }}
              </div>
              <div v-else class="text-foreground-2">
                欢迎使用！请打开一个文件以使用此插件。
              </div>
            </div>
            <!-- TEMPORARY MESSAGE TO USER! will be deleted -->
            <div
              v-if="store.isDistributedBySpeckle"
              class="mt-2 bg-highlight-1 rounded-md p-2"
            >
              <h1
                class="text-heading-sm w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
              >
                适用于
                <span class="capitalize">{{ store.hostAppName }}</span>
                的 系统
              </h1>
              <div class="text-foreground-2 text-body-xs">
                通过我们的关键工作流程和教程，快速上手
                <span class="capitalize">{{ store.hostAppName }}:</span>
                <FormButton size="sm" color="outline" class="my-2" full-width>
                  开始使用
                </FormButton>
              </div>

              <!-- 
              <FormButton
                text
                size="sm"
                color="subtle"
                class=""
                full-width
                @click="
                  app.$openUrl(
                    'https://speckle.community/t/next-gen-connectors-supported-workflows-and-faq/16162'
                  )
                "
              >
                <span class="text-foreground-2 text-body-3xs truncate line-clamp-1">
                  New connectors announcement
                </span>
              </FormButton> -->
            </div>
            <!--Apply Revit Categories section (only if mapper binding exists)-->
            <div
              v-if="app.$revitMapperBinding"
              class="mt-2 bg-highlight-1 rounded-md p-2"
            >
              <h1
                class="text-heading-sm w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
              >
                分配 Revit 类别
              </h1>
              <div class="text-foreground-2 text-body-xs">
                设置 Rhino 几何类别，以便在 Revit 中准确加载 DirectShape。
                <FormButton
                  size="sm"
                  color="outline"
                  class="my-2"
                  full-width
                  @click="$router.push('/revit-mapper')"
                >
                  分配类别
                </FormButton>
              </div>
            </div>
          </LayoutPanel>
        </div>
        <div v-if="accounts.length !== 0 && !hasNoModelCards" class="space-y-2 pb-24">
          <div v-for="project in store.projectModelGroups" :key="project.projectId">
            <CommonProjectModelGroup :project="project" />
          </div>
        </div>
        <!-- Triggered by "Show Details" button on Toast Notification -->
        <ErrorDialog
          v-model:open="store.showErrorDialog"
          chromium65-compatibility
          @close="store.showErrorDialog = false"
        />
      </div>
      <!-- No accounts present: display a signin button. This currently launches manager. -->
      <!-- NOTE: The flow is horrible, we should migrate as many connectors as possible to their own account adding logic -->
      <div v-else>
        <div
          class="fixed h-screen w-screen flex items-center justify-center pr-2 pointer-events-none"
        >
          <HomeNoAccountsPanel />
        </div>
      </div>
    </div>
    <div
      v-else-if="!app.$isRunningOnConnector"
      class="flex-1 flex flex-col items-center justify-center py-12 gap-y-6"
    >
      <section
        class="w-full max-w-md flex flex-col gap-y-8 items-center mx-auto py-12 px-6 border rounded-2xl border-outline-2"
      >
        <NuxtImg
          :src="`/assets/images/pleading_spockle.svg`"
          alt=""
          class="w-20"
          width="120"
        />
        <h1 class="text-2xl md:text-3xl font-semibold text-foreground text-center">
          未检测到连接器。
        </h1>
        <FormButton color="outline" @click="openSpeckleConnectors">
          在这里获取
        </FormButton>
      </section>
    </div>
    <div v-else>
      <div class="fixed h-screen w-screen flex items-center pointer-events-none">
        <LayoutPanel fancy-glow class="transition pointer-events-auto w-full">
          <h1
            class="h4 font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block py-1 text-transparent bg-clip-text"
          >
            需要重新加载！
          </h1>
          <div class="text-foreground-2 mt-2 mb-4">
            宿主应用程序与用户界面的通信因某种原因丢失。
          </div>
          <FormButton :icon-left="ArrowPathIcon" full-width @click="reload()">
            重新加载
          </FormButton>
        </LayoutPanel>
      </div>
    </div>
    <SendWizard v-model:open="showSendDialog" @close="showSendDialog = false" />
    <ReceiveWizard
      v-model:open="showReceiveDialog"
      @close="showReceiveDialog = false"
    />
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/solid'
import { useAccountStore } from '~~/store/accounts'
import { useHostAppStore } from '~~/store/hostApp'
import { useConfigStore } from '~~/store/config'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
const app = useNuxtApp()
const config = useConfigStore()

// IMPORTANT: the account store needs to be awaited here, and in any other top level page to prevent
// race conditions on initialisation (model cards get loaded, but accounts are not there yet)
// TODO: guard against this later, incase we will have more top level entry pages
const accountStore = useAccountStore()
await accountStore.refreshAccounts()

const { accounts } = storeToRefs(accountStore)

const store = useHostAppStore()
const { trackEvent } = useMixpanel()

const showSendDialog = ref(false)
const showReceiveDialog = ref(false)

app.$baseBinding?.on('documentChanged', () => {
  showSendDialog.value = false
  showReceiveDialog.value = false
})

const handleSendClick = () => {
  showSendDialog.value = !showSendDialog.value
  trackEvent('DUI3 Action', { name: 'Publish Wizard', step: 'start' })
}

const handleReceiveClick = () => {
  showReceiveDialog.value = !showReceiveDialog.value
  trackEvent('DUI3 Action', { name: 'Load Wizard', step: 'start' })
}

const hasNoModelCards = computed(
  () => store.projectModelGroups.length === 0 || hasNoValidProjects.value
)
const hasNoValidProjects = computed(() => {
  const serverUrls = accounts.value
    .filter((acc) => acc.isValid)
    .map((acc) => acc.accountInfo.serverInfo.url)

  return (
    store.projectModelGroups.filter((p) => serverUrls.includes(p.serverUrl)).length ===
    0
  )
})

const reload = () => {
  window.location.reload()
}

const openSpeckleConnectors = () => {
  window.open('http://47.100.77.97:64482/connectors', '_blank')
}
</script>
