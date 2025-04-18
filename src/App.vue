<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">题库练习系统</h1>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer">
      <p>© 2025 题库练习系统 - 基于Vue 3 + TypeScript开发</p>
    </footer>
  </div>
</template>

<style>
/* 全局样式 */
:root {
  --primary-color: #409EFF;
  --success-color: #67C23A;
  --warning-color: #E6A23C;
  --danger-color: #F56C6C;
  --info-color: #909399;
  --text-color: #303133;
  --text-color-secondary: #606266;
  --border-color: #DCDFE6;
  --background-color: #F5F7FA;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
  color: var(--text-color);
  background-color: var(--background-color);
}

* {
  box-sizing: border-box;
}
</style>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  color: var(--primary-color);
  margin: 0;
  font-size: 2.2rem;
  text-align: center;
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  background: linear-gradient(135deg, var(--primary-color) 0%, #66b1ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
}

.app-main {
  flex: 1;
  padding: 1rem 0;
}

.app-footer {
  background-color: #fff;
  padding: 1rem;
  text-align: center;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  border-top: 1px solid var(--border-color);
}
</style>
