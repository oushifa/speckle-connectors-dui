import { useCustomPermissions as _useCustomPermissions } from '~/lib/core/composables/customPermissions'

export function useCustomPermissions() {
  return _useCustomPermissions()
}

export type { CustomUserPermissions } from '~/lib/core/composables/customPermissions'
