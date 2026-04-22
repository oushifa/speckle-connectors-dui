const config: Record<string, string> = {
  serverUrl: 'http://47.100.77.97:64482'
  // serverUrl: 'http://192.168.154.28'
}

const getConfig = (key: string) => {
  return config[key].replace(/\\/g, '')
}

export default getConfig
