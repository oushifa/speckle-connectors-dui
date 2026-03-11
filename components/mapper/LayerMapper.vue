<template>
  <div class="px-2">
    <p class="h5">Layer Selection</p>
    <div class="space-y-2 my-2">
      <!-- Multi-select layer dropdown -->
      <FormSelectMulti
        :key="selectedLayers.length === 0 ? 'empty' : 'hasSelection'"
        :model-value="selectedLayers"
        name="layerSelection"
        label="选择图层"
        class="w-full"
        fixed-height
        size="sm"
        :items="layerOptions"
        :allow-unset="false"
        by="id"
        clearable
        :search="true"
        :search-placeholder="''"
        :filter-predicate="layerSearchFilterPredicate"
        mount-menu-on-body
        @update:model-value="(value) => $emit('update:selectedLayers', value as LayerOption[])"
      >
        <template #something-selected="{ value }">
          <span class="text-primary text-xs">
            {{ `${value.length} layer${value.length !== 1 ? 's' : ''} selected` }}
          </span>
        </template>
        <template #option="{ item }">
          <span class="text-xs">{{ item.name }}</span>
        </template>
      </FormSelectMulti>

      <!-- Layer selection summary -->
      <div
        v-if="selectedLayers.length === 0"
        class="space-y-2 p-2 bg-highlight-1 rounded-md text-body-xs"
      >
        <div class="text-foreground-2">未选择图层，从上面的下拉菜单中选择图层！</div>
      </div>
      <div v-else class="space-y-2 p-2 bg-highlight-1 rounded-md text-body-xs">
        <div>
          已选择 {{ selectedLayers.length }} 图层:
          {{ selectedLayers.map((l) => l.name).join(', ') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface LayerOption {
  id: string
  name: string
  [key: string]: unknown
}

defineProps<{
  selectedLayers: LayerOption[]
  layerOptions: LayerOption[]
}>()

defineEmits<{
  'update:selectedLayers': [layers: LayerOption[]]
}>()

// Search predicate for layer dropdown
const layerSearchFilterPredicate = (
  item: LayerOption | string | number | Record<string, unknown>,
  query: string
): boolean => {
  if (typeof item === 'object' && item !== null && 'name' in item) {
    const layerItem = item as LayerOption
    return layerItem.name.toLowerCase().includes(query.toLowerCase())
  }
  return false
}
</script>
