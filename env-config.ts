const config: Record<string, string> = {
  serverUrl: 'http://47.100.77.97:64482'
}

const getConfig = (key: string) => {
  return config[key].replace(/\\/g, '')
}

export default getConfig
