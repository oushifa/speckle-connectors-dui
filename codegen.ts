import type { CodegenConfig } from '@graphql-codegen/cli'

import getConfig from './env-config'

const config: CodegenConfig = {
  schema: getConfig('serverUrl') + '/graphql',
  documents: ['{lib,components,layouts,pages,middleware}/**/*.{vue,js,ts}'],
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    './lib/common/generated/gql/': {
      preset: 'client',
      config: {
        useTypeImports: true,
        fragmentMasking: false,
        dedupeFragments: true,
        scalars: {
          JSONObject: '{}',
          DateTime: 'string'
        }
      },
      presetConfig: {
        fragmentMasking: false,
        dedupeFragments: true
      },
      plugins: []
    }
  }
}

export default config
