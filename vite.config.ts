import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 只在生产构建时生成类型声明
    process.env.NODE_ENV === 'production' ? dts() : null
  ].filter(Boolean),
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
    // 构建选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 去掉 console
        drop_debugger: true, // 去掉 debugger
        pure_funcs: ['console.log'], // 移除 console.log 函数调用
        passes: 1 // 降低压缩级别以提高速度
      }
    }
  }
})