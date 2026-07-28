import { useCustomPermissions } from '~/lib/core/composables/customPermissions'

export default defineNuxtPlugin(() => {
  if (typeof window !== 'undefined') {
    ;(window as any).useCustomPermissions = useCustomPermissions
  }
  return {
    provide: {
      useCustomPermissions
    }
  }
})
