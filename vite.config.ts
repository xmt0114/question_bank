import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 根据命令行参数设置环境变量
  process.env.VITE_APP_MODE = mode === 'user' ? 'user' : 'admin'
  
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    define: {
      // 将环境变量传递给前端
      'import.meta.env.VITE_APP_MODE': JSON.stringify(process.env.VITE_APP_MODE),
      // 确保其他环境变量也被正确定义
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV || '')
    }
  }
})

