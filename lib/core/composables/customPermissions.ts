import { ref } from 'vue'
import { useAccountStore } from '~/store/accounts'

export interface CustomUserPermissions {
  userId: string | null
  roleId: string | null
  roleName: string | null
  menuPerms: string[]
  modelPerms: string[]
  dataPerms: string[]
  isAdmin: boolean
}

// Global cache for custom permissions per account ID
const permissionsCache = ref<Record<string, CustomUserPermissions>>({})
const loadingAccounts = ref<Record<string, boolean>>({})

export function useCustomPermissions() {
  const accountStore = useAccountStore()

  const fetchPermissionsForAccount = async (accountId: string, force = false) => {
    if (permissionsCache.value[accountId] && !force) {
      return permissionsCache.value[accountId]
    }

    const acc = accountStore.accounts.find((a) => a.accountInfo.id === accountId)
    if (!acc || !acc.isValid) {
      return null
    }

    loadingAccounts.value[accountId] = true
    try {
      const serverUrl = acc.accountInfo.serverInfo.url
      const token = acc.accountInfo.token

      const data = await $fetch<any>(`${serverUrl}/api/v1/custom-roles/me/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const state: CustomUserPermissions = {
        userId: data.userId || null,
        roleId: data.roleId || null,
        roleName: data.roleName || null,
        menuPerms: data.menuPerms || [],
        modelPerms: data.modelPerms || [],
        dataPerms: data.dataPerms || [],
        isAdmin: !!data.isAdmin
      }

      permissionsCache.value[accountId] = state
      return state
    } catch (e) {
      console.error(`Failed to fetch custom permissions for account ${accountId}:`, e)
      const fallbackState: CustomUserPermissions = {
        userId: null,
        roleId: null,
        roleName: null,
        menuPerms: [],
        modelPerms: [],
        dataPerms: [],
        isAdmin: false
      }
      permissionsCache.value[accountId] = fallbackState
      return fallbackState
    } finally {
      loadingAccounts.value[accountId] = false
    }
  }

  const hasMenuPerm = (accountId: string, menuId: string) => {
    const perm = permissionsCache.value[accountId]
    if (!perm) return true
    if (perm.isAdmin) return true
    return perm.menuPerms.includes(menuId)
  }

  const hasFunctionalPerm = (accountId: string, permissionCode: string) => {
    const perm = permissionsCache.value[accountId]
    if (!perm) return true
    if (perm.isAdmin) return true
    return perm.modelPerms.includes(permissionCode)
  }

  return {
    fetchPermissionsForAccount,
    hasMenuPerm,
    hasFunctionalPerm,
    isLoading: (accountId: string) => !!loadingAccounts.value[accountId],
    permissions: (accountId: string) => permissionsCache.value[accountId]
  }
}
