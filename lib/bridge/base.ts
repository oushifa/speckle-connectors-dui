import { BaseBridgeErrorHandler } from '~/lib/bridge/errorHandler'
import type { Emitter } from 'nanoevents'
import { createNanoEvents } from 'nanoevents'

/**
 * A simple (typed) event emitter base class that host applications can use to send messages (and data) to the web ui,
 * e.g. via `browser.executeScriptAsync("myBindings.on('eventName', serializedData)")`.
 */
export class BaseBridge {
  public emitter: Emitter
  /**
   * Holds a list of connector implemented or available methods in this binding.
   */
  public availableMethodNames: string[] = []
  constructor() {
    this.emitter = createNanoEvents()
    this.availableMethodNames = []
    new BaseBridgeErrorHandler(this.emitter) // Where we set error to hostApp store
  }

  // NOTE: these do not need to be typed extra in here, as they will be properly typed on the specific binding's interface.
  on(event: string | number, callback: (...args: unknown[]) => void) {
    return this.emitter.on(event, callback)
  }

  // NOTE: this could be private - as it should be only used by the host application.
  emit(eventName: string, payload: string) {
    const parsedPayload = payload ? (JSON.parse(payload) as unknown) : null
    this.emitter.emit(eventName, parsedPayload)
  }

  /**
   * Emits an event whose payload was pushed inline by the host application as a
   * Base64 encoded UTF-8 JSON string.
   *
   * Unlike `emitResponseReady` (which calls back into the host via `GetCallResult`),
   * this needs no round-trip, so the event still reaches the UI immediately while the
   * host app is busy running the operation - e.g. progress updates during a long send.
   */
  emitPayload(eventName: string, base64Payload: string) {
    try {
      const binary = atob(base64Payload)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const json = new TextDecoder('utf-8').decode(bytes)
      this.emitter.emit(eventName, (json ? JSON.parse(json) : null) as unknown)
    } catch (e) {
      console.error(`Failed to emit payload for ${eventName}`, e)
    }
  }
}
