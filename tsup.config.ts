
// tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    server: 'src/server/index.ts',
    client: 'src/client/index.ts',
    form: 'src/form/index.tsx'
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'next', 'zod', 'next/form']
})