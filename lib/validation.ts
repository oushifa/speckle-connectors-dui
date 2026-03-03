import { ValidationHelpers } from '@speckle/ui-components'
import type { GenericValidateFunction } from 'vee-validate'

export const isEmail = ValidationHelpers.isEmail

export const isOneOrMultipleEmails = ValidationHelpers.isOneOrMultipleEmails

export const isRequired = ValidationHelpers.isRequired

export const isSameAs = ValidationHelpers.isSameAs

export const isStringOfLength = ValidationHelpers.isStringOfLength

export const stringContains = ValidationHelpers.stringContains

export const isUrl = ValidationHelpers.isUrl

export const isItemSelected = ValidationHelpers.isItemSelected

const isValidModelName: GenericValidateFunction<string> = (name) => {
  name = name.trim()
  if (
    name.startsWith('/') ||
    name.endsWith('/') ||
    name.startsWith('#') ||
    name.startsWith('$') ||
    name.indexOf('//') !== -1 ||
    name.indexOf(',') !== -1
  )
    return '值不能以 "#" 或 "$" 开头，不能以 "/" 开头或结尾，不能有连续的斜杠，也不能包含逗号'

  if (['globals', 'main'].includes(name)) return `'main' 和 'globals' 是保留名称`

  return true
}

export function useModelNameValidationRules() {
  return computed(() => [
    isRequired,
    isStringOfLength({ maxLength: 512 }),
    isValidModelName
  ])
}
