<template>
  <CommonDialog
    v-model:open="isOpen"
    :title="dialogTitle"
    :buttons="dialogButtons"
    :on-submit="onSubmit"
    max-width="md"
    fullscreen="none"
  >
    <div class="flex flex-col gap-2">
      <p class="text-body-xs text-foreground font-medium">
        {{ dialogIntro }}
      </p>
      <FormTextArea
        v-model="feedback"
        name="feedback"
        label="反馈"
        color="foundation"
      />
      <p v-if="!hideSuppport" class="text-body-xs !leading-4">
        需要帮助？请前往我们的
        <FormButton
          target="_blank"
          link
          text
          @click="$openUrl(`https://speckle.community/`)"
        >
          社区论坛
        </FormButton>
        寻求支持，我们可以一起讨论并解决问题。
      </p>
    </div>
  </CommonDialog>
</template>

<script setup lang="ts">
import { ToastNotificationType, type LayoutDialogButton } from '@speckle/ui-components'
import { useForm } from 'vee-validate'
import { useZapier } from '~/lib/core/composables/zapier'
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useAccountStore } from '~/store/accounts'
import { useHostAppStore } from '~/store/hostApp'

type FormValues = { feedback: string }

const props = defineProps<{
  title?: string
  intro?: string
  hideSuppport?: boolean
  metadata?: Record<string, unknown>
}>()

const isOpen = defineModel<boolean>('open', { required: true })

const { trackEvent } = useMixpanel()
const { sendWebhook } = useZapier()
const { handleSubmit } = useForm<FormValues>()
const accountStore = useAccountStore()
const hostApp = useHostAppStore()

const feedback = ref('')

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: '发送',
    props: { color: 'primary' },
    submit: true,
    id: 'sendFeedback'
  }
])

const dialogTitle = computed(() => props.title || '给我们反馈')

const dialogIntro = computed(
  () =>
    props.intro ||
    '我们如何改进 Speckle？如果您有功能请求，请分享您将如何使用它以及它对您的重要性'
)

const onSubmit = handleSubmit(async () => {
  if (!feedback.value) return

  isOpen.value = false

  trackEvent('Feedback Sent', {
    message: feedback.value,
    feedbackType: 'dui3',
    ...props.metadata
  })

  hostApp.setNotification({
    type: ToastNotificationType.Success,
    title: '感谢您的反馈！'
  })

  const userId = accountStore.defaultAccount.accountInfo.userInfo.id ?? ''

  await sendWebhook('https://hooks.zapier.com/hooks/catch/12120532/2m4okri/', {
    userId,
    feedback: [
      `**Action:** User Feedback`,
      `**Type:** dui3`,
      `**User ID:** ${userId}`,
      `**Feedback:** ${feedback.value}`
    ].join('\n')
  })
})

watch(isOpen, (newVal) => {
  if (newVal) {
    feedback.value = ''
  }
})
</script>
