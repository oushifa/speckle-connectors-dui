import type { ISendFilter } from '~~/lib/models/card/send'
import type {
  IBinding,
  IBindingSharedEvents
} from '~~/lib/bindings/definitions/IBinding'
import type { CardSetting } from '~/lib/models/card/setting'
import type { IModelCardSharedEvents } from '~/lib/models/card'
import type { ConversionResult } from '~/lib/conversions/conversionResult'
import type { CreateVersionArgs } from '~/lib/bridge/server'

export const ISendBindingKey = 'sendBinding'

export interface ISendBinding extends IBinding<ISendBindingEvents> {
  getSendFilters: () => Promise<ISendFilter[]>
  getSendSettings: () => Promise<CardSetting[]>
  send: (modelId: string) => Promise<void>
  cancelSend: (modelId: string) => Promise<void>
}

export interface ISendBindingEvents
  extends IBindingSharedEvents,
    IModelCardSharedEvents {
  refreshSendFilters: () => void
  setModelsExpired: (modelCardIds: string[]) => void
  setModelSendResult: (args: {
    modelCardId: string
    versionId: string
    sendConversionResults: ConversionResult[]
  }) => void
  setIdMap: (args: {
    modelCardId: string
    idMap: Record<string, string>
    newSelectedObjectIds: string[]
  }) => void
  /**
   * Use whenever want to cancel model card progress, it is used on Archicad so far since send operation blocks the UI thread.
   */
  triggerCancel: (modelCardId: string) => void
  triggerCreateVersion: (args: CreateVersionArgs) => void
}

export class MockedSendBinding implements ISendBinding {
  private listeners: Record<string, Function[]> = {}

  public async getSendFilters() {
    return await []
  }

  public async getSendSettings() {
    return await []
  }

  public async send(modelCardId: string) {
    console.log('[Publish Debug] MockedSendBinding.send called for modelCardId:', modelCardId, '(Running on Web Mock mode)')
    
    // 在 Mock 环境下模拟进度推进
    setTimeout(() => {
      this.emit('setModelProgress', {
        modelCardId,
        progress: { status: '正在转换 3D 几何对象 (Mock 模拟)...', progress: 0.5 }
      })
    }, 800)

    setTimeout(() => {
      this.emit('setModelSendResult', {
        modelCardId,
        versionId: 'mock_ver_' + Math.random().toString(36).substring(2, 8),
        sendConversionResults: [
          { status: 1, message: '转换成功 (Mock 模拟)' }
        ]
      })
    }, 2000)

    return Promise.resolve()
  }

  public async cancelSend(modelCardId: string) {
    console.log('[Publish Debug] MockedSendBinding.cancelSend:', modelCardId)
  }

  public async showDevTools() {
    console.log('Show dev tools')
  }

  public async openUrl(url: string) {
    window.open(url)
  }

  public on(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(fn)
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((fn) => fn(data))
    }
  }
}
