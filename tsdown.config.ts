import { defineConfig } from 'tsdown'

export default defineConfig({
  // entry points — top-level index.ts
  entry: ['./index.ts'],

  // write build outputs to dist/
  outDir: 'dist',

  // emit both ESM and CJS for maximum compatibility
  format: ['esm', 'cjs'],

  // produce bundled .d.ts declarations
  dts: true,

  // remove dist before writing
  clean: true,

  // nice-to-have defaults
  sourcemap: true,
  target: 'node20',
  platform: 'node',
})
