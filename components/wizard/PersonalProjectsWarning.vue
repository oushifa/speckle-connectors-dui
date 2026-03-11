<template>
  <div>
    <div
      class="px-3 py-1 rounded-md shadow transition overflow-hidden bg-foundation border-foundation-2 hover:shadow-md border-1 group"
    >
      <div class="flex flex-col sm:flex-row sm:gap-2 text-foreground">
        <div class="flex flex-col gap-4">
          <div class="text-body-xs">
            <h1
              class="mb-1 text-sm font-semibold w-full inline-block py-1 bg-clip-text"
            >
              迁移您的项目到工作空间
            </h1>
            <p class="mb-2">
              <span class="text-xs">
                个人项目将在 2026 年 1 月 1
                日归档。迁移到工作空间以创建新项目、模型、邀请新项目协作者、查看 7
                天前的评论和版本。
              </span>
            </p>

            <FormButton
              color="primary"
              size="sm"
              class="mb-2"
              @click="
                $openUrl(
                  `${accountStore.activeAccount.accountInfo.serverInfo.url}/projects`
                )
              "
            >
              迁移项目
            </FormButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAccountStore } from '~/store/accounts'

const accountStore = useAccountStore()
const { $openUrl } = useNuxtApp()
</script>
