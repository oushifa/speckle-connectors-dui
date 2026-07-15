<template>
  <div
    v-tippy="cardTippy"
    :class="`group relative bg-foundation-2 rounded px-2 py-1  transition ${
      hasAccess
        ? 'cursor-pointer hover:text-primary hover:bg-primary-muted hover:shadow-md'
        : 'cursor-not-allowed italic bg-neutral-500/5'
    } `"
  >
    <div
      :class="`text-heading-sm text-ellipsis truncate ${
        hasAccess ? '' : 'text-foreground-2'
      }`"
    >
      {{ project.name }}
    </div>
    <div class="text-body-3xs text-foreground-2">
      {{ projectRole }}, 最后更新 {{ updatedAgo }}
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import type { ProjectListProjectItemFragment } from '~/lib/common/generated/gql/graphql'
import { useAccountStore } from '~/store/accounts'
import { useCustomPermissions } from '~/lib/core/composables/customPermissions'

const props = defineProps<{
  project: ProjectListProjectItemFragment
  isSender: boolean
}>()

const updatedAgo = computed(() => {
  return dayjs(props.project.updatedAt).from(dayjs())
})

const cardTippy = computed(() => (!hasAccess.value ? disabledMessage.value : ''))

// Previously we were having hard coded messaging, web team will provide better messaging per permission here instaed common message
const disabledMessage = computed(() => {
  const accountStore = useAccountStore()
  const accountId = accountStore.activeAccount.accountInfo.id
  const { hasFunctionalPerm } = useCustomPermissions()

  const baseAccess = props.isSender
    ? props.project.permissions.canPublish.authorized
    : props.project.permissions.canLoad.authorized

  if (!baseAccess) {
    return props.isSender
      ? props.project.permissions.canPublish.message
      : props.project.permissions.canLoad.message
  }

  const customAccess = props.isSender
    ? hasFunctionalPerm(accountId, 'file-management:publish')
    : hasFunctionalPerm(accountId, 'file-management:download')

  if (!customAccess) {
    return props.isSender
      ? '您的角色在该项目下没有发布模型的权限。'
      : '您的角色在该项目下没有加载模型的权限。'
  }
  return ''
})

const hasAccess = computed(() => {
  const accountStore = useAccountStore()
  const accountId = accountStore.activeAccount.accountInfo.id
  const { hasFunctionalPerm } = useCustomPermissions()

  const baseAccess = props.isSender
    ? props.project.permissions.canPublish.authorized
    : props.project.permissions.canLoad.authorized

  if (!baseAccess) return false

  return props.isSender
    ? hasFunctionalPerm(accountId, 'file-management:publish')
    : hasFunctionalPerm(accountId, 'file-management:download')
})

const projectRole = computed(() => {
  if (hasAccess.value) {
    return '可编辑'
  }
  return '可查看'
})
</script>
