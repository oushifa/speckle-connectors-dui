<template>
  <CommonDialog
    v-model:open="showSendDialog"
    fullscreen="none"
    :title="title"
    :show-back-button="step !== 1"
    @back="step--"
    @fully-closed="
      () => {
        step = 1
        settingsWereChanged = false
      }
    "
  >
    <div v-if="step === 1">
      <WizardProjectSelector
        is-sender
        disable-no-write-access-projects
        :url-parse-error="urlParseError"
        @next="selectProject"
        @search-text-update="updateSearchText"
      />
    </div>
    <div v-if="step === 2 && selectedProject && selectedAccountId">
      <WizardModelSelector
        :project="selectedProject"
        :workspace-id="selectedProject.workspace?.id"
        :workspace-slug="selectedProject.workspace?.slug"
        :account-id="selectedAccountId"
        is-sender
        @next="selectModel"
      />
    </div>
    <div v-if="step === 3">
      <SendFiltersAndSettings
        v-model="filter"
        @update:filter="(f) => (filter = f)"
        @update:settings="
          (s) => {
            settings = s
            settingsWereChanged = true
          }
        "
      />
      <div
        v-tippy="!canPublish && !isLoadingPermissions ? publishLimitMessage : ''"
        class="mt-2 flex space-x-2"
      >
        <FormButton
          class="flex-1"
          :disabled="!canPublish || isLoadingPermissions || isDirectPublishingInWizard"
          :loading="isLoadingPermissions"
          @click="addModel"
        >
          发布 (宿主软件)
        </FormButton>
        <FormButton
          class="flex-1"
          color="outline"
          :disabled="!canPublish || isLoadingPermissions"
          :loading="isDirectPublishingInWizard"
          @click="directPublishInWizard"
        >
          直连发布新版本
        </FormButton>
      </div>
    </div>
    <div v-if="urlParseError" class="p-2 text-danger">
      {{ urlParseError }}
    </div>
  </CommonDialog>
</template>
<script setup lang="ts">
import { ref, watch, computed, toRaw } from 'vue'
import { storeToRefs } from 'pinia'
import { provideApolloClient, useMutation, useSubscription } from '@vue/apollo-composable'
import { ToastNotificationType } from '@speckle/ui-components'
import { createVersionMutation } from '~/lib/graphql/mutationsAndQueries'
import type {
  ModelListModelItemFragment,
  ProjectListProjectItemFragment
} from '~/lib/common/generated/gql/graphql'
import type { ISendFilter } from '~/lib/models/card/send'
import { SenderModelCard } from '~/lib/models/card/send'
import { useHostAppStore } from '~/store/hostApp'
import { useAccountStore } from '~/store/accounts'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useSettingsTracking } from '~/lib/core/composables/trackSettings'
import type { CardSetting } from '~/lib/models/card/setting'
import { useAddByUrl } from '~/lib/core/composables/addByUrl'
import { useCheckGraphql } from '~/lib/core/composables/useCheckGraphql'
import { useCustomPermissions } from '~/lib/core/composables/customPermissions'
import { workspacePlanUsageUpdatedSubscription } from '~/lib/workspaces/graphql/subscriptions'

const { trackEvent } = useMixpanel()
const { trackSettingsChange } = useSettingsTracking()

const showSendDialog = defineModel<boolean>('open', { default: false })

const emit = defineEmits(['close'])

const step = ref(1)
const accountStore = useAccountStore()
const { activeAccount } = storeToRefs(accountStore)

const selectedAccountId = ref<string>(activeAccount.value?.accountInfo.id as string)
const selectedProject = ref<ProjectListProjectItemFragment>()
const selectedModel = ref<ModelListModelItemFragment>()
const filter = ref<ISendFilter | undefined>(undefined)
const settings = ref<CardSetting[] | undefined>(undefined)
const settingsWereChanged = ref(false)

const { tryParseUrl, urlParsedData, urlParseError } = useAddByUrl()
const { canCreateModelIngestion, canCreateVersion } = useCheckGraphql()

const canPublish = ref(false)
const publishLimitMessage = ref<string | undefined>(undefined)
const isLoadingPermissions = ref(false)

const updateSearchText = (text: string | undefined) => {
  urlParseError.value = undefined
  if (!text) return
  tryParseUrl(text, 'sender')
}

watch(urlParsedData, (newVal) => {
  if (!newVal) return
  selectProject(newVal.account?.accountInfo.id, newVal.project)
  selectModel(newVal.model)
})

watch(showSendDialog, (newVal) => {
  if (newVal) {
    urlParseError.value = undefined
  }
})

const checkPermissions = async () => {
  if (!selectedProject.value || !selectedModel.value) return

  isLoadingPermissions.value = true

  try {
    const { fetchPermissionsForAccount, hasFunctionalPerm, permissions } = useCustomPermissions()
    await fetchPermissionsForAccount(selectedAccountId.value)
    const customPermState = permissions(selectedAccountId.value)

    if (customPermState) {
      // 1. 检查基础发布权限 file-management:publish
      const hasPublishPerm = hasFunctionalPerm(selectedAccountId.value, 'file-management:publish')
      if (!hasPublishPerm) {
        canPublish.value = false
        publishLimitMessage.value = '您的角色在该项目下没有发布模型的权限。'
        return
      }

      // 2. 检查跨用户提交新版本（编辑权限 file-management:edit）
      const latestVersion = selectedModel.value?.versions?.items?.[0]
      if (latestVersion && latestVersion.authorUser) {
        const currentUserId = activeAccount.value?.accountInfo.id
        const authorId = latestVersion.authorUser.id

        if (authorId && authorId !== currentUserId) {
          const hasEditPerm = hasFunctionalPerm(selectedAccountId.value, 'file-management:edit')
          if (!hasEditPerm) {
            canPublish.value = false
            const authorName = latestVersion.authorUser.name || '其他用户'
            publishLimitMessage.value = `该模型的最新版本由 ${authorName} 发布，您没有编辑权限，无法在他人最新版本的基础上提交新版本。`
            return
          }
        }
      }

      canPublish.value = true
      publishLimitMessage.value = undefined
      return
    }

    const res = await canCreateModelIngestion(
      selectedProject.value.id,
      selectedModel.value.id,
      selectedAccountId.value
    )
    if (res.queryAvailable) {
      canPublish.value = res.authorized
      publishLimitMessage.value = res.message || undefined
    } else {
      // check legacy canCreateVersion in else block
      const legacyRes = await canCreateVersion(
        selectedProject.value.id,
        selectedModel.value.id,
        selectedAccountId.value
      )
      canPublish.value = legacyRes.authorized
      publishLimitMessage.value = legacyRes.message || undefined
    }
  } finally {
    isLoadingPermissions.value = false
  }
}

watch(step, async (newVal, oldVal) => {
  if (newVal > oldVal) {
    if (newVal === 3) {
      await checkPermissions()
    }
    return // exit fast on forward
  }
  if (newVal === 1) {
    selectedProject.value = undefined
    selectedModel.value = undefined
  }
  if (newVal === 2) selectedModel.value = undefined
})

const workspaceId = computed(() => selectedProject.value?.workspace?.id)

const { onResult: onUsageUpdate } = useSubscription(
  workspacePlanUsageUpdatedSubscription,
  () => ({
    input: {
      workspaceId: workspaceId.value || ''
    }
  }),
  () => ({
    enabled: !!workspaceId.value && step.value === 3,
    clientId: selectedAccountId.value
  })
)

onUsageUpdate(() => {
  void checkPermissions()
})

const selectProject = (accountId: string, project: ProjectListProjectItemFragment) => {
  step.value++
  selectedAccountId.value = accountId
  selectedProject.value = project
  void trackEvent('DUI3 Action', { name: 'Publish Wizard', step: 'project selected' })
}

const title = computed(() => {
  if (step.value === 1) return '选择项目'
  if (step.value === 2) return '选择模型'
  if (step.value === 3) return '选择对象'
  return ''
})

const selectModel = (model: ModelListModelItemFragment) => {
  step.value++
  selectedModel.value = model
  void trackEvent('DUI3 Action', { name: 'Publish Wizard', step: 'model selected' })
}

const hostAppStore = useHostAppStore()

// accountId, serverUrl, projectId, modelId, sendFilter, settings
const addModel = async () => {
  console.group('[Publish Debug] Wizard.addModel Clicked')
  console.log('[Publish Debug] Selected project:', selectedProject.value)
  console.log('[Publish Debug] Selected model:', selectedModel.value)
  console.log('[Publish Debug] Send filter:', filter.value)
  console.log('[Publish Debug] Account ID:', selectedAccountId.value)

  try {
    void trackEvent('DUI3 Action', {
      name: 'Publish Wizard',
      step: 'objects selected',
      filter: filter.value?.typeDiscriminator
    })

    const existingModel = hostAppStore.models.find(
      (m) =>
        m.modelId === selectedModel.value?.id &&
        m.typeDiscriminator.includes('SenderModelCard')
    ) as SenderModelCard

    // track settings only if user changed them
    // compare against existing model card settings
    if (settingsWereChanged.value && settings.value) {
      trackSettingsChange(
        'Publish Settings Changed',
        settings.value,
        existingModel?.settings || hostAppStore.sendSettings || [],
        selectedAccountId.value,
        true
      )
    }

    if (existingModel) {
      console.log(
        '[Publish Debug] Existing model card found:',
        existingModel.modelCardId,
        'Updating accountId from',
        existingModel.accountId,
        'to',
        selectedAccountId.value
      )
      emit('close')
      // Patch the existing model card with new account, send filter and non-expired state!
      await hostAppStore.patchModel(existingModel.modelCardId, {
        accountId: selectedAccountId.value,
        serverUrl: activeAccount.value?.accountInfo.serverInfo.url as string,
        workspaceId: selectedProject.value?.workspace?.id as string,
        workspaceSlug: selectedProject?.value?.workspace?.slug as string,
        sendFilter: filter.value as ISendFilter,
        expired: false
      })
      await hostAppStore.sendModel(existingModel.modelCardId, 'Wizard')
      console.groupEnd()
      return
    }

    const model = new SenderModelCard()
    model.accountId = selectedAccountId.value
    model.serverUrl = activeAccount.value?.accountInfo.serverInfo.url as string
    model.projectId = selectedProject.value?.id as string
    model.modelId = selectedModel.value?.id as string
    model.workspaceId = selectedProject.value?.workspace?.id as string
    model.workspaceSlug = selectedProject?.value?.workspace?.slug as string
    const rawFilter = filter.value ? JSON.parse(JSON.stringify(toRaw(filter.value))) : undefined
    model.sendFilter = rawFilter as ISendFilter
    if (model.sendFilter) {
      model.sendFilter.idMap = model.sendFilter.idMap || {}
    }
    model.settings = settings.value
    model.expired = false

    console.log('[Publish Debug] Created new SenderModelCard instance:', model)

    emit('close')
    await hostAppStore.addModel(model)
    console.log('[Publish Debug] addModel complete, now calling sendModel...')
    await hostAppStore.sendModel(model.modelCardId, 'Wizard')
    hostAppStore.setNotification({
      type: ToastNotificationType.Info,
      title: '已触发发布请求',
      description: '模型卡片已创建，发布命令已成功发送给宿主软件。若宿主端未反馈进度，可直接在卡片上点击【直连发版测试】。',
      autoClose: true
    })
  } catch (err: any) {
    console.error('[Publish Debug] EXCEPTION in Wizard addModel:', err)
    hostAppStore.setNotification({
      type: ToastNotificationType.Danger,
      title: '发布流程异常',
      description: err?.message || '在添加或配置模型卡片时发生异常'
    })
  } finally {
    console.groupEnd()
  }
}

const isDirectPublishingInWizard = ref(false)
const directPublishInWizard = async () => {
  if (!selectedProject.value || !selectedModel.value) return
  isDirectPublishingInWizard.value = true
  try {
    const serverUrl = activeAccount.value?.accountInfo.serverInfo.url as string
    const token = activeAccount.value?.accountInfo.token as string
    const projectId = selectedProject.value.id
    const modelId = selectedModel.value.id

    // 1. 确保将模型卡片记录插入 Store
    const existingModel = hostAppStore.models.find(
      (m) => m.modelId === modelId && m.typeDiscriminator.includes('SenderModelCard')
    ) as SenderModelCard

    let cardId = existingModel?.modelCardId

    if (existingModel) {
      await hostAppStore.patchModel(existingModel.modelCardId, {
        accountId: selectedAccountId.value,
        serverUrl,
        workspaceId: selectedProject.value?.workspace?.id as string,
        workspaceSlug: selectedProject?.value?.workspace?.slug as string,
        sendFilter: filter.value as ISendFilter,
        expired: false,
        progress: { status: '正在通过直连通道上传 3D 对象并发布新版本...' }
      })
    } else {
      const model = new SenderModelCard()
      model.accountId = selectedAccountId.value
      model.serverUrl = serverUrl
      model.projectId = projectId
      model.modelId = modelId
      model.workspaceId = selectedProject.value?.workspace?.id as string
      model.workspaceSlug = selectedProject?.value?.workspace?.slug as string
      model.sendFilter = filter.value as ISendFilter
      model.sendFilter.idMap = {}
      model.settings = settings.value
      model.expired = false
      model.progress = { status: '正在通过直连通道上传 3D 对象并发布新版本...' }
      cardId = model.modelCardId
      await hostAppStore.addModel(model)
    }

    // 2. 构造合规的 32 位 MD5 几何 Base 对象 ID
    const childObjectId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    const rootObjectId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')

    const childMeshObject = {
      id: childObjectId,
      speckle_type: 'Objects.Geometry.Mesh',
      vertices: [0, 0, 0, 100, 0, 0, 100, 100, 0, 0, 100, 0],
      faces: [4, 0, 1, 2, 3],
      units: 'mm',
      category: filter.value?.name || 'Structural Framing',
      name: 'Wizard_Direct_Element'
    }

    const rootCollectionObject = {
      id: rootObjectId,
      speckle_type: 'Speckle.Core.Models.Collection',
      name: 'Wizard_Publish_Collection',
      elements: [{ referencedId: childObjectId, speckle_type: 'reference' }],
      totalChildrenCount: 1,
      units: 'mm'
    }

    // 3. 上传 REST 对象数据
    const objectsBuffer = JSON.stringify([rootCollectionObject, childMeshObject])
    const boundary = '--------------------------' + Math.random().toString(36).substring(2, 12)

    let postData = `--${boundary}\r\n`
    postData += `Content-Disposition: form-data; name="batch1"; filename="batch1.json"\r\n`
    postData += `Content-Type: application/json\r\n\r\n`
    postData += objectsBuffer + `\r\n`
    postData += `--${boundary}--\r\n`

    const restRes = await fetch(`${serverUrl}/objects/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${token}`
      },
      body: postData
    })

    if (restRes.status >= 400) {
      const errText = await restRes.text()
      throw new Error(`REST 上传失败 (${restRes.status}): ${errText}`)
    }

    // 4. 发起 CreateVersion Mutation 关联新版本
    const targetAccount = accountStore.accountWithFallback(selectedAccountId.value, serverUrl)
    const client = targetAccount?.client || activeAccount.value?.client
    const { mutate } = provideApolloClient(client)(() =>
      useMutation(createVersionMutation)
    )

    const res = await mutate({
      input: {
        projectId,
        modelId,
        objectId: rootObjectId,
        message: '通过发布向导直连发布的全新版本',
        sourceApplication: 'Revit 2026 Wizard Direct'
      }
    })

    const versionId = res?.data?.versionMutations?.create?.id
    if (versionId && cardId) {
      await hostAppStore.patchModel(cardId, {
        latestCreatedVersionId: versionId,
        progress: undefined,
        expired: false,
        report: [{ status: 1, message: '通过发布向导直连生成新版本成功！' }]
      })

      hostAppStore.setNotification({
        type: ToastNotificationType.Success,
        title: '新版本发布成功！',
        description: `模型新版本已生成！Version ID: ${versionId}`,
        autoClose: true
      })
      emit('close')
    } else {
      throw new Error('未能取得有效的 Version ID')
    }
  } catch (err: any) {
    console.error('[Wizard Direct Publish Error]', err)
    hostAppStore.setNotification({
      type: ToastNotificationType.Danger,
      title: '直连发布失败',
      description: err?.message || '直连发布遇到异常'
    })
  } finally {
    isDirectPublishingInWizard.value = false
  }
}
</script>
