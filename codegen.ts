import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'http://47.100.77.97:64482/graphql',
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
