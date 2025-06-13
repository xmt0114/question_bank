<script setup lang="ts">
import { computed } from 'vue'
import { useQuestionStore } from '@/stores/question'
import { ArrowRight } from '@element-plus/icons-vue'

const questionStore = useQuestionStore()

// 计算当前选择的组织名称
const selectedOrganizationName = computed(() => {
  if (!questionStore.selectedOrganizationId) return ''
  const org = questionStore.organizationList.find(org => org.id === questionStore.selectedOrganizationId)
  return org ? org.name : ''
})

// 计算当前选择的类别名称
const selectedCategoryName = computed(() => {
  if (!questionStore.selectedCategoryId) return ''
  const category = questionStore.categoryList.find(cat => cat.id === questionStore.selectedCategoryId)
  return category ? category.name : ''
})

// 计算当前选择的级别名称
const selectedLevelName = computed(() => {
  if (!questionStore.selectedLevelId) return ''
  const level = questionStore.levelList.find(lvl => lvl.id === questionStore.selectedLevelId)
  return level ? level.name : ''
})

// 计算当前选择的试卷名称
const selectedPaperName = computed(() => {
  if (!questionStore.currentPaperId) return ''
  const paper = questionStore.papers.find(p => p.id === questionStore.currentPaperId)
  return paper ? paper.name : ''
})
</script>

<template>
  <div class="selection-path">
    <div class="path-item" :class="{ active: selectedOrganizationName }">
      <span class="path-label">组织:</span>
      <span class="path-value">{{ selectedOrganizationName || '未选择' }}</span>
    </div>
    <div class="path-arrow">
      <el-icon><arrow-right /></el-icon>
    </div>
    <div class="path-item" :class="{ active: selectedCategoryName }">
      <span class="path-label">类别:</span>
      <span class="path-value">{{ selectedCategoryName || '未选择' }}</span>
    </div>
    <div class="path-arrow">
      <el-icon><arrow-right /></el-icon>
    </div>
    <div class="path-item" :class="{ active: selectedLevelName }">
      <span class="path-label">级别:</span>
      <span class="path-value">{{ selectedLevelName || '未选择' }}</span>
    </div>
    <div class="path-arrow">
      <el-icon><arrow-right /></el-icon>
    </div>
    <div class="path-item" :class="{ active: selectedPaperName }">
      <span class="path-label">试卷:</span>
      <span class="path-value">{{ selectedPaperName || '未选择' }}</span>
    </div>
  </div>
</template>

<style scoped>
.selection-path {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
  gap: 0.3rem;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.path-item {
  display: flex;
  align-items: center;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.path-item.active {
  background-color: #ecf5ff;
  color: #409EFF;
  font-weight: 500;
}

.path-label {
  margin-right: 0.3rem;
  font-weight: normal;
}

.path-value {
  font-weight: 500;
}

.path-arrow {
  color: #909399;
  margin: 0 0.2rem;
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .selection-path {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .path-arrow {
    transform: rotate(90deg);
    margin: 0.2rem 0;
  }
}
</style> 