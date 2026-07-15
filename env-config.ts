const getConfig = (key: string): string => {
  if (key === 'serverUrl') {
    // 1. 尝试从 Nuxt 3 客户端的 runtimeConfig 获取 (浏览器环境)
    if (typeof window !== 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const config = useRuntimeConfig()
        const url = config?.public?.speckleServerUrl
        if (url) {
          return url.replace(/\\/g, '')
        }
      } catch {
        // useRuntimeConfig 可能会在未初始化或非 Nuxt 环境下报错，此时回退到 process.env
      }
    }

    // 2. 尝试从 Node.js 的 process.env 获取 (服务端或 CLI 环境，如 codegen.ts)
    if (typeof process !== 'undefined' && process.env?.SPECKLE_SERVER_URL) {
      return process.env.SPECKLE_SERVER_URL.replace(/\\/g, '')
    }
  }

  // 默认回退值
  return 'http://127.0.0.1:3000'
}

export default getConfig

