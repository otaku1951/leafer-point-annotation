import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    process.env.NODE_ENV === 'production' ? dts({
      outDirs: ['dist'],
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
      tsconfigPath: './tsconfig.json'
    }) : null
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'LeaferPointAnnotation',
      formats: ['es', 'umd'],
      fileName: (format) => `leafer-point-annotation.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        },
        exports: "named"
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
        passes: 1
      }
    }
  }
})