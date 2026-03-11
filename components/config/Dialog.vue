<template>
  <!-- ONLY FOR TEST FOR NOW-->
  <form class="flex flex-col space-y-4 form-json-form">
    <FormJsonForm :schema="jsonSchema" @change="onParamsFormChange"></FormJsonForm>
  </form>
</template>

<script setup lang="ts">
import type { JsonFormsChangeEvent } from '@jsonforms/vue'

const jsonSchema = {
  type: 'object',
  properties: {
    acceptTerms: {
      type: 'boolean',
      title: '我同意条款和条件'
    },
    username: { type: 'string', title: '用户名', default: 'a' },
    color: {
      type: 'string',
      title: '最喜欢的颜色',
      enum: ['red', 'green', 'blue']
    },
    multiSelect: {
      type: 'array',
      title: '多选择最喜欢的字符',
      enum: ['a', 'b', 'c', 'd']
    }
  }
}

const paramsFormState = ref<JsonFormsChangeEvent>()
const onParamsFormChange = (e: JsonFormsChangeEvent) => {
  paramsFormState.value = e
  console.log(e)
}
</script>
