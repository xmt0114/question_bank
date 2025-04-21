<template>
  <div class="settings-container">
    <div class="settings-header">
      <h1>题库管理系统</h1>
      <div class="header-actions">
        <el-button type="primary" @click="goToHome">返回主页</el-button>
      </div>
    </div>

    <div class="settings-content">
      <div class="settings-sidebar">
        <el-menu
          :default-active="activeMenu"
          class="settings-menu"
          router
        >
          <el-menu-item index="/settings/organizations">
            <el-icon><Briefcase /></el-icon>
            <span>组织管理</span>
          </el-menu-item>
          <el-menu-item index="/settings/categories">
            <el-icon><Collection /></el-icon>
            <span>类别管理</span>
          </el-menu-item>
          <el-menu-item index="/settings/levels">
            <el-icon><Histogram /></el-icon>
            <span>级别管理</span>
          </el-menu-item>
          <el-menu-item index="/settings/papers">
            <el-icon><Document /></el-icon>
            <span>试卷管理</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="settings-main">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Briefcase, Collection, Histogram, Document } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const activeMenu = computed(() => route.path)

const goToHome = () => {
  router.push('/')
}
</script>

<style scoped>
.settings-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #ebeef5;
}

.settings-header h1 {
  color: #409EFF;
  margin: 0;
  font-size: 1.8rem;
}

.settings-content {
  display: flex;
  gap: 2rem;
}

.settings-sidebar {
  width: 220px;
  flex-shrink: 0;
}

.settings-menu {
  border-right: none;
}

.settings-main {
  flex: 1;
  min-height: 500px;
  background-color: #fff;
  border-radius: 4px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .settings-content {
    flex-direction: column;
  }

  .settings-sidebar {
    width: 100%;
    margin-bottom: 1rem;
  }
}
</style>
