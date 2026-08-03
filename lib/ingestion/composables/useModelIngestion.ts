import { provideApolloClient, useMutation } from '@vue/apollo-composable'
import { useAccountStore } from '~/store/accounts'
import { useHostAppStore } from '~/store/hostApp'
import {
  completeModelIngestionWithVersion,
  createModelIngestion,
  updateModelIngestionProgress,
  failModelIngestionWithError,
  failModelIngestionWithCancel
} from '../graphql/mutations'
import type { SourceDataInput } from '~~/lib/common/generated/gql/graphql'
import type { ISenderModelCard } from '~/lib/models/card/send'
import { storeToRefs } from 'pinia'
import { ToastNotificationType } from '@speckle/ui-components'

/**
 * New way of creating versions.
 * It is essential for server to track limits on versions.
 * The flow is as follows:
 * 0. Check if the user has enough limits to create a new version (this is handled outside of this composable)
 * 1. Start a new ingestion
 * 2. Update the ingestion with the new data when connector throws progress via 'setModelProgress' event
 * 3. Complete the version with the root object id that passed by connector or server/sketchup bridges in JS
 */
export const useModelIngestion = () => {
  const store = useHostAppStore()

  const accountStore = useAccountStore()

  const startIngestion = async (
    senderModelCard: ISenderModelCard,
    progressMessage: string,
    sourceData: SourceDataInput
  ) => {
    console.log('[Publish Debug] [Ingestion] startIngestion called for modelCard:', senderModelCard.modelCardId, {
      projectId: senderModelCard.projectId,
      modelId: senderModelCard.modelId,
      progressMessage,
      sourceData
    })
    const { activeIngestions } = storeToRefs(store)
    const client = accountStore.getAccountClient(senderModelCard.accountId)
    const { mutate } = provideApolloClient(client)(() =>
      useMutation(createModelIngestion)
    )

    const res = await mutate({
      input: {
        projectId: senderModelCard.projectId,
        modelId: senderModelCard.modelId,
        progressMessage,
        sourceData,
        maxIdleTimeoutSeconds: 7200 // 2h
      }
    })

    console.log('[Publish Debug] [Ingestion] createModelIngestion raw response:', res)

    if (res?.errors?.length) {
      const msg = res.errors[0].message
      console.error('[Publish Debug] [Ingestion] startIngestion returned GraphQL errors:', res.errors)
      store.setNotification({
        type: ToastNotificationType.Danger,
        title: 'Ingestion Error',
        description: msg
      })
      throw new Error(`[GraphQL Ingestion Error] ${msg}`)
    }

    const ingestionId = res?.data?.projectMutations.modelIngestionMutations.create.id
    console.log('[Publish Debug] [Ingestion] Created Ingestion ID:', ingestionId)
    if (ingestionId) {
      activeIngestions.value[senderModelCard.modelCardId] = ingestionId
    }

    return res?.data?.projectMutations.modelIngestionMutations.create
  }

  const updateIngestion = async (
    senderModelCard: ISenderModelCard,
    ingestionId: string,
    progressMessage: string,
    progress?: number
  ) => {
    console.log('[Publish Debug] [Ingestion] updateIngestion:', { ingestionId, progressMessage, progress })
    const client = accountStore.getAccountClient(senderModelCard.accountId)
    const { mutate } = provideApolloClient(client)(() =>
      useMutation(updateModelIngestionProgress)
    )

    const res = await mutate({
      input: {
        projectId: senderModelCard.projectId,
        ingestionId,
        progressMessage,
        progress
      }
    })

    if (res?.errors?.length) {
      const msg = res.errors[0].message
      console.error('[Publish Debug] [Ingestion] updateIngestion error:', res.errors)
      store.setNotification({
        type: ToastNotificationType.Danger,
        title: 'Ingestion Error',
        description: msg
      })
      throw new Error(msg)
    }

    return res?.data?.projectMutations.modelIngestionMutations.updateProgress
  }

  const failIngestion = async (
    senderModelCard: ISenderModelCard,
    ingestionId: string,
    errorReason: string,
    errorStacktrace?: string
  ) => {
    console.log('[Publish Debug] [Ingestion] failIngestion:', { ingestionId, errorReason, errorStacktrace })
    const client = accountStore.getAccountClient(senderModelCard.accountId)
    const { mutate } = provideApolloClient(client)(() =>
      useMutation(failModelIngestionWithError)
    )

    const res = await mutate({
      input: {
        projectId: senderModelCard.projectId,
        ingestionId,
        errorReason,
        errorStacktrace
      }
    })

    if (res?.errors?.length) {
      const msg = res.errors[0].message
      console.error('[Publish Debug] [Ingestion] failIngestion error:', res.errors)
      store.setNotification({
        type: ToastNotificationType.Danger,
        title: 'Ingestion Error',
        description: msg
      })
      throw new Error(msg)
    }

    const { activeIngestions } = storeToRefs(store)

    // clean the failed ingestion
    activeIngestions.value = Object.fromEntries(
      Object.entries(activeIngestions.value).filter(
        ([key]) => key !== senderModelCard.modelCardId
      )
    )
  }

  const cancelIngestion = async (
    senderModelCard: ISenderModelCard,
    ingestionId: string,
    cancellationMessage: string = 'Cancelled by user'
  ) => {
    console.log('[Publish Debug] [Ingestion] cancelIngestion:', { ingestionId, cancellationMessage })
    const client = accountStore.getAccountClient(senderModelCard.accountId)
    const { mutate } = provideApolloClient(client)(() =>
      useMutation(failModelIngestionWithCancel)
    )

    const res = await mutate({
      input: {
        projectId: senderModelCard.projectId,
        ingestionId,
        cancellationMessage
      }
    })

    if (res?.errors?.length) {
      const msg = res.errors[0].message
      console.error('[Publish Debug] [Ingestion] cancelIngestion error:', res.errors)
      store.setNotification({
        type: ToastNotificationType.Danger,
        title: 'Ingestion Error',
        description: msg
      })
      throw new Error(msg)
    }

    const { activeIngestions } = storeToRefs(store)

    // clean the cancelled ingestion
    activeIngestions.value = Object.fromEntries(
      Object.entries(activeIngestions.value).filter(
        ([key]) => key !== senderModelCard.modelCardId
      )
    )
  }

  const completeIngestionWithVersion = async (
    senderModelCard: ISenderModelCard,
    ingestionId: string,
    rootObjectId: string
  ) => {
    console.log('[Publish Debug] [Ingestion] completeIngestionWithVersion:', { ingestionId, rootObjectId })
    const client = accountStore.getAccountClient(senderModelCard.accountId)
    const { mutate } = provideApolloClient(client)(() =>
      useMutation(completeModelIngestionWithVersion)
    )

    const res = await mutate({
      input: {
        projectId: senderModelCard.projectId,
        ingestionId,
        rootObjectId
      }
    })

    if (res?.errors?.length) {
      const msg = res.errors[0].message
      console.error('[Publish Debug] [Ingestion] completeIngestionWithVersion error:', res.errors)
      store.setNotification({
        type: ToastNotificationType.Danger,
        title: 'Ingestion Error',
        description: msg
      })
      throw new Error(msg)
    }

    const { activeIngestions } = storeToRefs(store)

    // clean the completed ingestion
    activeIngestions.value = Object.fromEntries(
      Object.entries(activeIngestions.value).filter(
        ([key]) => key !== senderModelCard.modelCardId
      )
    )

    return res?.data?.projectMutations.modelIngestionMutations.completeWithVersion
  }

  return {
    startIngestion,
    updateIngestion,
    failIngestion,
    cancelIngestion,
    completeIngestionWithVersion
  }
}
