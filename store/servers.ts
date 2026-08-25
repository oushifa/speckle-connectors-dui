import { defineStore } from 'pinia'
import getConfig from '~/env-config'

export type ServerInfo = {
  id: string
  name: string
  url: string
}

const STORAGE_KEY = 'speckle_servers'
const ACTIVE_KEY = 'speckle_active_server_id'

/**
 * Manages the list of servers the user has configured in the DUI home page.
 * The selected server determines which server the DUI connects to and reads
 * data from. Persisted in localStorage so it survives reloads.
 */
export const useServerStore = defineStore('serverStore', () => {
  const servers = ref<ServerInfo[]>([])
  const activeServerId = ref<string>()

  const readServers = (): ServerInfo[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as ServerInfo[]) : []
    } catch {
      return []
    }
  }

  const writeServers = (list: ServerInfo[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  const loadActiveServerId = (): string | undefined => {
    try {
      return localStorage.getItem(ACTIVE_KEY) || undefined
    } catch {
      return undefined
    }
  }

  /** The currently selected server object, if any. */
  const activeServer = computed(() => {
    return servers.value.find((s) => s.id === activeServerId.value)
  })

  /** Initialize with persisted data; seeds a default server if none exist. */
  const init = () => {
    servers.value = readServers()
    activeServerId.value = loadActiveServerId()

    // Seed a default server entry from the build-time config if the list is empty.
    if (servers.value.length === 0) {
      const defaultUrl = getConfig('serverUrl')
      if (defaultUrl) {
        try {
          const url = new URL(defaultUrl).origin
          const name = new URL(url).hostname || '默认服务器'
          addServer(name, url)
        } catch {
          // fall through; empty list is fine, user can add one manually
        }
      }
    }

    // If the persisted active id no longer exists, fall back to the first server.
    if (!activeServer.value && servers.value.length > 0) {
      selectServer(servers.value[0].id)
    }
  }

  const addServer = (name: string, url: string): ServerInfo | null => {
    let normalizedUrl: string
    try {
      normalizedUrl = new URL(url).origin
    } catch {
      return null
    }
    const normalizedName = name.trim() || new URL(normalizedUrl).hostname
    const generateId = () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2)}`
    const server: ServerInfo = {
      id: generateId(),
      name: normalizedName,
      url: normalizedUrl
    }
    servers.value.push(server)
    writeServers(servers.value)
    // Selecting the newly added server makes the flow predictable.
    selectServer(server.id)
    return server
  }

  const removeServer = (id: string) => {
    servers.value = servers.value.filter((s) => s.id !== id)
    writeServers(servers.value)
    if (activeServerId.value === id) {
      activeServerId.value = servers.value[0]?.id
      if (activeServerId.value) {
        localStorage.setItem(ACTIVE_KEY, activeServerId.value)
      } else {
        localStorage.removeItem(ACTIVE_KEY)
      }
    }
  }

  const selectServer = (id: string) => {
    if (!servers.value.find((s) => s.id === id)) return
    activeServerId.value = id
    localStorage.setItem(ACTIVE_KEY, id)
  }

  init()

  return {
    servers,
    activeServerId,
    activeServer,
    init,
    addServer,
    removeServer,
    selectServer
  }
})
