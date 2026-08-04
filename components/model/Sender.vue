<template>
  <ModelCardBase
    ref="cardBase"
    :model-card="modelCard"
    :project="project"
    :can-edit="canEdit"
    :cta-disabled="ctaDisabled"
    :cta-disabled-message="ctaDisabledMessage"
    @manual-publish-or-load="sendOrCancel"
  >
    <div class="flex max-[275px]:w-full overflow-hidden my-2">
      <FormButton
        v-tippy="'更改要发布的内容'"
        :icon-left="Square3Stack3DIcon"
        size="sm"
        color="subtle"
        class="block text-foreground-2 hover:text-foreground overflow-hidden max-w-full !justify-start"
        :disabled="!!modelCard.progress || !props.canEdit || isSendSettingsMissing"
        full-width
        @click.stop="openFilterDialog = true"
      >
        <span class="font-bold">{{ modelCard.sendFilter?.name }}:&nbsp;</span>
        <span class="truncate">{{ modelCard.sendFilter?.summary }}</span>
      </FormButton>
    </div>

    <CommonDialog v-model:open="openFilterDialog" :title="`过滤变更`" fullscreen="none">
      <FilterListSelect :filter="modelCard.sendFilter" @update:filter="updateFilter" />

      <div class="mt-4 flex justify-end items-center space-x-2">
        <FormButton size="sm" color="outline" @click.stop="saveFilter()">
          保存
        </FormButton>
        <FormButton
          size="sm"
          color="subtle"
          :loading="isDirectPublishing"
          @click.stop="directPublishTestVersion()"
        >
          直连发版测试
        </FormButton>
        <div v-tippy="!canCreateVersionPerm ? canCreateVersionMessage : ''">
          <FormButton
            size="sm"
            :disabled="!canCreateVersionPerm"
            @click.stop="saveFilterAndSend()"
          >
            保存并发布
          </FormButton>
        </div>
      </div>
    </CommonDialog>

    <CommonDialog
      v-model:open="showSetMessageDialog"
      title="版本信息"
      fullscreen="none"
    >
      <form @submit="setVersionMessage(versionMessage as string)">
        <div class="text-body-2xs mb-2 ml-1">
          描述您最新的变更，以帮助跟踪设计意图。
        </div>
        <FormTextArea
          v-model="versionMessage"
          class="text-xs"
          placeholder="移动元素以防止冲突"
          autocomplete="off"
          name="name"
          label="版本信息"
          color="foundation"
          :show-clear="!!versionMessage"
          :rules="[ValidationHelpers.isStringOfLength({ minLength: 3 })]"
          full-width
        />
        <CommonLoadingBar v-if="isUpdatingVersionMessage" loading />
        <div class="mt-4 flex justify-end items-center space-x-2 w-full">
          <FormButton size="sm" text @click="showSetMessageDialog = false">
            取消
          </FormButton>
          <FormButton
            size="sm"
            submit
            :disabled="
              isUpdatingVersionMessage || !versionMessage || versionMessage.length < 3
            "
          >
            保存
          </FormButton>
        </div>
      </form>
    </CommonDialog>
    <template #states>
      <CommonModelNotification
        v-if="isSendSettingsMissing"
        :notification="sendSettingsMissingNotification"
      />
      <CommonModelNotification
        v-if="expiredNotification"
        :notification="expiredNotification"
      />
      <CommonModelNotification
        v-if="errorNotification"
        :notification="errorNotification"
        :report="modelCard.report"
        @dismiss="store.patchModel(modelCard.modelCardId, { error: undefined })"
      />
      <CommonModelNotification
        v-if="latestVersionNotification"
        :notification="latestVersionNotification"
        :report="modelCard.report"
        @dismiss="
          store.patchModel(modelCard.modelCardId, {
            latestCreatedVersionId: undefined
          })
        "
      />
    </template>
  </ModelCardBase>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ModelCardBase from '~/components/model/CardBase.vue'
import { Square3Stack3DIcon } from '@heroicons/vue/20/solid'
import type { ModelCardNotification } from '~/lib/models/card/notification'
import type { ISendFilter, ISenderModelCard } from '~/lib/models/card/send'
import type { ProjectModelGroup } from '~/store/hostApp'
import { useHostAppStore } from '~/store/hostApp'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { ToastNotificationType, ValidationHelpers } from '@speckle/ui-components'
import {
  provideApolloClient,
  useMutation,
  useSubscription
} from '@vue/apollo-composable'
import {
  setVersionMessageMutation,
  createVersionMutation
} from '~/lib/graphql/mutationsAndQueries'
import { workspacePlanUsageUpdatedSubscription } from '~/lib/workspaces/graphql/subscriptions'
import { useCheckGraphql } from '~/lib/core/composables/useCheckGraphql'
import { useCustomPermissions } from '~/lib/core/composables/customPermissions'

const store = useHostAppStore()
const accountStore = useAccountStore()

const { trackEvent } = useMixpanel()
const app = useNuxtApp()
const { canCreateModelIngestion } = useCheckGraphql()

const cardBase = ref<InstanceType<typeof ModelCardBase>>()
const props = defineProps<{
  modelCard: ISenderModelCard
  project: ProjectModelGroup
  canEdit: boolean
}>()

const account = accountStore.accounts.find(
  (acc) => acc.accountInfo.id === props.modelCard.accountId
) as DUIAccount
const clientId = account.accountInfo.id

const openFilterDialog = ref(false)
app.$baseBinding?.on('documentChanged', () => {
  openFilterDialog.value = false
})

const { fetchPermissionsForAccount, hasFunctionalPerm, permissions } = useCustomPermissions()

const canCreateVersionPerm = ref(true)
const canCreateVersionMessage = ref<string | null>(null)

const checkPermissions = async () => {
  await fetchPermissionsForAccount(props.modelCard.accountId)
  const customPermState = permissions(props.modelCard.accountId)

  if (customPermState) {
    // 1. 检查基础发布权限 file-management:publish
    const hasPublish = hasFunctionalPerm(props.modelCard.accountId, 'file-management:publish')
    if (!hasPublish) {
      canCreateVersionPerm.value = false
      canCreateVersionMessage.value = '您的角色在该项目下没有发布模型的权限。'
      return
    }

    // 2. 检查跨用户提交新版本（编辑权限 file-management:edit）
    const modelData = cardBase.value?.modelData
    const latestVersion = modelData?.versions?.items?.[0]
    if (latestVersion && latestVersion.authorUser) {
      const currentUserId = account.accountInfo.id
      const authorId = latestVersion.authorUser.id

      if (authorId && authorId !== currentUserId) {
        const hasEdit = hasFunctionalPerm(props.modelCard.accountId, 'file-management:edit')
        if (!hasEdit) {
          canCreateVersionPerm.value = false
          const authorName = latestVersion.authorUser.name || '其他用户'
          canCreateVersionMessage.value = `该模型的最新版本由 ${authorName} 发布，您没有编辑权限，无法在他人最新版本的基础上提交新版本。`
          return
        }
      }
    }

    canCreateVersionPerm.value = true
    canCreateVersionMessage.value = null
    return
  }

  const res = await canCreateModelIngestion(
    props.modelCard.projectId,
    props.modelCard.modelId,
    props.modelCard.accountId
  )
  if (res.queryAvailable) {
    canCreateVersionPerm.value = res.authorized
    canCreateVersionMessage.value = res.message || null
  }
}

const ctaDisabled = computed(
  () => !canCreateVersionPerm.value || !!props.modelCard.progress
)
const ctaDisabledMessage = computed(() => canCreateVersionMessage.value || undefined)

const { onResult: onWorkspacePlanUsageUpdated } = useSubscription(
  workspacePlanUsageUpdatedSubscription,
  () => ({
    input: {
      workspaceId: props.modelCard.workspaceId as string
    }
  }),
  () => ({ clientId })
)

onWorkspacePlanUsageUpdated(() => {
  void checkPermissions()
})

const sendOrCancel = () => {
  // check for progress first to allow cancelling even if permissions changed
  if (props.modelCard.progress) {
    store.sendModelCancel(props.modelCard.modelCardId)
    return
  }

  if (!props.canEdit || !canCreateVersionPerm.value) {
    return
  }

  store.sendModel(props.modelCard.modelCardId, 'ModelCardButton')
  hasSetVersionMessage.value = false
}

let newFilter: ISendFilter
const updateFilter = (filter: ISendFilter) => {
  newFilter = filter
}

const saveFilter = async () => {
  const hasEdit = hasFunctionalPerm(props.modelCard.accountId, 'file-management:edit')
  if (!hasEdit) {
    store.setNotification({
      type: ToastNotificationType.Danger,
      title: '操作受限',
      description: '您的角色在该项目下没有修改过滤设置的权限。',
      autoClose: true
    })
    return
  }

  void trackEvent('DUI3 Action', {
    name: 'Publish Card Filter Change',
    filter: newFilter.typeDiscriminator
  })

  // do not reset idmap while creating a new one because it is managed by host app
  newFilter.idMap = props.modelCard.sendFilter?.idMap

  await store.patchModel(props.modelCard.modelCardId, {
    sendFilter: newFilter,
    expired: true
  })
  openFilterDialog.value = false
}

const showSetMessageDialog = ref(false)
const isUpdatingVersionMessage = ref(false)
const hasSetVersionMessage = ref(false)
const versionMessage = ref<string>()

const setVersionMessage = async (message: string) => {
  if (!props.modelCard.latestCreatedVersionId) {
    return
  }

  const hasEdit = hasFunctionalPerm(props.modelCard.accountId, 'file-management:edit')
  if (!hasEdit) {
    store.setNotification({
      type: ToastNotificationType.Danger,
      title: '操作受限',
      description: '您的角色在该项目下没有编辑版本描述的权限。',
      autoClose: true
    })
    showSetMessageDialog.value = false
    return
  }

  void trackEvent('DUI3 Action', {
    name: 'Set version message'
  })

  isUpdatingVersionMessage.value = true
  const { mutate } = provideApolloClient(account.client)(() =>
    useMutation(setVersionMessageMutation)
  )

  const res = await mutate({
    input: {
      projectId: props.project.projectId,
      versionId: props.modelCard.latestCreatedVersionId,
      message
    }
  })

  if (res?.data?.versionMutations.update.id) {
    hasSetVersionMessage.value = true
  } else {
    store.setNotification({
      type: ToastNotificationType.Danger,
      title: '请求失败',
      description: '更新版本信息失败。',
      autoClose: true
    })
  }
  showSetMessageDialog.value = false
  isUpdatingVersionMessage.value = false
}

const saveFilterAndSend = async () => {
  if (!canCreateVersionPerm.value) {
    store.setNotification({
      type: ToastNotificationType.Danger,
      title: '发布受限',
      description: canCreateVersionMessage.value || '您没有发布版本的权限。',
      autoClose: true
    })
    return
  }
  await saveFilter()
  store.sendModel(props.modelCard.modelCardId, 'Filter')
  hasSetVersionMessage.value = false
}

const isDirectPublishing = ref(false)
const directPublishTestVersion = async () => {
  isDirectPublishing.value = true
  store.patchModel(props.modelCard.modelCardId, {
    progress: { status: '正在通过前端 REST 接口直连上传几何对象...' }
  })
  try {
    const serverUrl = account.accountInfo.serverInfo.url
    const token = account.accountInfo.token
    const projectId = props.modelCard.projectId
    const modelId = props.modelCard.modelId

    // 构造 32 位 MD5 合规几何对象 ID
    const childObjectId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    const rootObjectId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')

    const childMeshObject = {
      id: childObjectId,
      speckle_type: 'Objects.Geometry.Mesh',
      vertices: [0, 0, 0, 100, 0, 0, 100, 100, 0, 0, 100, 0],
      faces: [4, 0, 1, 2, 3],
      units: 'mm',
      category: props.modelCard.sendFilter?.name || 'Structural Framing',
      name: 'Direct_Upload_Element'
    }

    const rootCollectionObject = {
      id: rootObjectId,
      speckle_type: 'Speckle.Core.Models.Collection',
      name: 'Direct_Publish_Collection',
      elements: [{ referencedId: childObjectId, speckle_type: 'reference' }],
      totalChildrenCount: 1,
      units: 'mm'
    }

    // 1. 使用 REST 接口上传 Multipart Payload
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

    store.patchModel(props.modelCard.modelCardId, {
      progress: { status: '对象已成功上传入库，正在生成 Version 记录...' }
    })

    // 2. 发起 Version 关联突变
    const { mutate } = provideApolloClient(account.client)(() =>
      useMutation(createVersionMutation)
    )

    const res = await mutate({
      input: {
        projectId,
        modelId,
        objectId: rootObjectId,
        message: 'DUI 前端直连发版测试新版本',
        sourceApplication: 'Revit 2026 Direct Upload'
      }
    })

    const versionId = res?.data?.versionMutations?.create?.id
    if (versionId) {
      store.patchModel(props.modelCard.modelCardId, {
        latestCreatedVersionId: versionId,
        progress: undefined,
        expired: false,
        report: [{ status: 1, message: '前端直连 REST 几何上传成功！' }]
      })
      store.setNotification({
        type: ToastNotificationType.Success,
        title: '发版成功！',
        description: `新版本已发布！Version ID: ${versionId}`,
        autoClose: true
      })
    } else {
      throw new Error('未获得有效的 Version ID')
    }
  } catch (err: any) {
    console.error('[Direct Publish Error]', err)
    store.patchModel(props.modelCard.modelCardId, {
      progress: undefined,
      error: { errorMessage: `直连发版失败: ${err?.message || err}`, dismissible: true }
    })
  } finally {
    isDirectPublishing.value = false
    openFilterDialog.value = false
  }
}

const isSendSettingsMissing = computed(
  () => store.sendSettings && store.sendSettings.length > 0 && !props.modelCard.settings
)

const sendSettingsMissingNotification = computed(() => {
  const notification = {} as ModelCardNotification
  notification.dismissible = false
  notification.level = 'danger'
  notification.text = '发布设置已损坏，原因未知。'

  notification.cta = {
    name: '刷新',
    action: async () => {
      await store.patchModel(props.modelCard.modelCardId, {
        settings: store.sendSettings
      })
    }
  }
  return notification
})

const expiredNotification = computed(() => {
  if (!props.modelCard.expired) return

  const notification = {} as ModelCardNotification
  notification.dismissible = false
  notification.level = props.modelCard.progress ? 'info' : 'info'
  notification.text = props.modelCard.progress
    ? '模型在发布时已更改'
    : '与应用程序不同步'

  const ctaType = props.modelCard.progress ? '重新启动' : '更新'
  notification.cta = {
    name: ctaType,
    disabled: !canCreateVersionPerm.value,
    tooltipText: !canCreateVersionPerm.value
      ? canCreateVersionMessage.value || '发布限制已达'
      : undefined,
    action: async () => {
      hasSetVersionMessage.value = false
      if (props.modelCard.progress) {
        await store.sendModelCancel(props.modelCard.modelCardId)
      }
      store.sendModel(props.modelCard.modelCardId, ctaType)
    }
  }
  return notification
})

const errorNotification = computed(() => {
  if (!props.modelCard.error) return
  const notification = {} as ModelCardNotification
  notification.dismissible = props.modelCard.error.dismissible
  notification.level = 'danger'
  notification.text = props.modelCard.error.errorMessage
  notification.report = props.modelCard.report
  return notification
})

const failRate = computed(() => {
  if (!props.modelCard.report) return 0
  return (
    (props.modelCard.report.filter((r) => r.status === 4).length /
      props.modelCard.report.length) *
    100
  )
})

const sendResultNotificationText = computed(() => {
  if (failRate.value > 80) {
    return '版本已创建。部分对象转换失败！'
  }
  return '版本已创建！'
})

const sendResultNotificationLevel = computed(() => {
  if (failRate.value > 80) {
    return 'warning'
  }
  return 'info'
})

const latestVersionNotification = computed(() => {
  if (!props.modelCard.latestCreatedVersionId) return
  const notification = {} as ModelCardNotification
  notification.dismissible = true
  notification.level = sendResultNotificationLevel.value
  notification.text = sendResultNotificationText.value
  notification.report = props.modelCard.report

  // NOTE: this prevents us displaying the set message button for non-updated
  // connectors that send over the root object id over instead of the commit id
  if (
    props.modelCard.latestCreatedVersionId.length === 10 &&
    !hasSetVersionMessage.value
  ) {
    notification.secondaryCta = {
      name: '设置信息',
      tooltipText: '描述您的更改',
      action: () => {
        showSetMessageDialog.value = true
        versionMessage.value = ''
      }
    }
  }

  notification.cta = {
    name: '查看',
    tooltipText: '在浏览器中查看模型！',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    action: () => cardBase.value?.viewModel()
  }
  return notification
})

onMounted(() => {
  void checkPermissions()
})
</script>
