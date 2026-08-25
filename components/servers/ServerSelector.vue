<template>
  <div class="relative">
    <!-- Trigger button: shows the active server -->
    <FormButton
      color="outline"
      size="sm"
      full-width
      :icon-left="ServerStackIcon"
      @click="showDropdown = !showDropdown"
    >
      <span class="truncate max-w-[10rem]">
        {{ activeServer?.name || '选择服务器' }}
      </span>
      <ChevronDownIcon class="w-3 h-3 ml-1 shrink-0" />
    </FormButton>

    <!-- Dropdown list -->
    <div
      v-if="showDropdown"
      class="absolute z-30 mt-1 w-full bg-foundation border border-outline-2 rounded-md shadow-lg overflow-hidden"
    >
      <div class="max-h-48 overflow-y-auto simple-scrollbar">
        <button
          v-for="server in servers"
          :key="server.id"
          type="button"
          class="flex items-center justify-between w-full px-2 py-1.5 text-left text-body-2xs hover:bg-highlight-1 transition"
          :class="server.id === activeServerId ? 'text-primary' : 'text-foreground'"
          @click="selectServer(server.id)"
        >
          <span class="flex items-center min-w-0 space-x-1.5">
            <span class="truncate">{{ server.name }}</span>
            <span class="text-foreground-2 truncate text-body-3xs">
              {{ server.url.replace(/^https?:\/\//, '') }}
            </span>
          </span>
          <span
            v-if="server.id === activeServerId"
            class="text-primary shrink-0"
            aria-hidden="true"
          >
            ✓
          </span>
        </button>
      </div>
      <div class="border-t border-outline-3 p-1">
        <FormButton text size="sm" full-width @click="openAddDialog()">
          <span class="flex items-center justify-center space-x-1">
            <PlusIcon class="w-3.5 h-3.5" />
            <span>新建服务器</span>
          </span>
        </FormButton>
      </div>
    </div>

    <!-- "Add server" dialog -->
    <CommonDialog
      v-model:open="showAddDialog"
      title="新建服务器"
      fullscreen="none"
      max-width="sm"
      :on-submit="handleAddServer"
    >
      <div class="space-y-3">
        <div>
          <label class="text-body-2xs text-foreground-2 block mb-1">名称</label>
          <FormTextInput
            v-model="newServerName"
            name="serverName"
            :show-label="false"
            placeholder="例如：测试服务器"
            color="foundation"
            autocomplete="off"
          />
        </div>
        <div>
          <label class="text-body-2xs text-foreground-2 block mb-1">服务器地址</label>
          <FormTextInput
            v-model="newServerUrl"
            name="serverUrl"
            :show-label="false"
            placeholder="https://192.168.160.43"
            color="foundation"
            autocomplete="off"
          />
          <p v-if="urlError" class="text-danger text-body-3xs mt-1">{{ urlError }}</p>
        </div>
        <FormButton
          full-width
          size="sm"
          submit
          :disabled="!newServerName.trim() || !newServerUrl.trim()"
        >
          添加
        </FormButton>
      </div>
    </CommonDialog>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, PlusIcon, ServerStackIcon } from '@heroicons/vue/20/solid'
import { storeToRefs } from 'pinia'
import { useServerStore } from '~/store/servers'

const serverStore = useServerStore()
const { servers, activeServer, activeServerId } = storeToRefs(serverStore)

const showDropdown = ref(false)
const showAddDialog = ref(false)
const newServerName = ref('')
const newServerUrl = ref('')
const urlError = ref('')

const openAddDialog = () => {
  showDropdown.value = false
  newServerName.value = ''
  newServerUrl.value = ''
  urlError.value = ''
  showAddDialog.value = true
}

const selectServer = (id: string) => {
  serverStore.selectServer(id)
  showDropdown.value = false
}

const handleAddServer = () => {
  urlError.value = ''
  if (!newServerUrl.value.trim()) return

  let normalized: string
  try {
    normalized = new URL(newServerUrl.value).origin
  } catch {
    urlError.value = '请输入有效的服务器地址（如 https://192.168.160.43）'
    return
  }

  serverStore.addServer(newServerName.value, normalized)
  showAddDialog.value = false
}
</script>
