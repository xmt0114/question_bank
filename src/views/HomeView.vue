<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useQuestionStore } from '@/stores/question'

const router = useRouter()
const questionStore = useQuestionStore()

// 加载状态
const loading = computed(() => questionStore.loading)

// 判断是否为管理员模式
const isAdminMode = import.meta.env.VITE_APP_MODE === 'admin'

// 初始化选择
onMounted(async () => {
  await questionStore.initSelection()
})

const startTutorial = () => {
  if (!questionStore.currentPaperId) {
    ElMessage.warning('请先选择一套题目')
    return
  }
  router.push({
    path: '/tutorial',
    query: { paper: questionStore.currentPaperId }
  })
}

const startExam = () => {
  if (!questionStore.currentPaperId) {
    ElMessage.warning('请先选择一套题目')
    return
  }
  router.push({
    path: '/exam',
    query: { paper: questionStore.currentPaperId }
  })
}

const goToSettings = () => {
  router.push('/settings')
}
</script>

<template>
  <main>
    <div class="home-container">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>
      <div v-else>
        <div class="home-header">
          <div></div>
          <el-button v-if="isAdminMode" type="info" @click="goToSettings">管理设置</el-button>
        </div>

        <div class="selection-container">
        <!-- 选择区域框 -->
          <div class="selection-box">
          <!-- 组织选择 -->
            <h4 class="selection-box-title">组织选择</h4>
            <div class="card-container org-cards">
              <div
                v-for="org in questionStore.organizationList"
                :key="org.id"
                class="card org-card"
                :class="{ active: questionStore.selectedOrganizationId === org.id }"
                @click="questionStore.selectOrganization(org.id)"
              >
                <div class="card-image">
                  <img :src="org.image" :alt="org.name">
                </div>
                <div class="card-title">
                  {{ org.name }}
                </div>
              </div>
            </div>
          </div>

          <div class="selection-box">
          <!-- 类别选择 -->
            <h4 class="selection-box-title">类别选择</h4>
            <div class="card-container category-cards">
              <div v-if="questionStore.filteredCategories.length === 0" class="no-data">暂无</div>
              <div
                v-else
                v-for="category in questionStore.filteredCategories"
                :key="category.id"
                class="card category-card"
                :class="{ active: questionStore.selectedCategoryId === category.id }"
                @click="questionStore.selectCategory(category.id)"
              >
                <div class="card-image">
                  <img :src="category.image" :alt="category.name">
                </div>
                <div class="card-title">
                  {{ category.name }}
                </div>
              </div>
            </div>
          </div>

          <div class="selection-box">
          <!-- 级别选择 -->
            <h4 class="selection-box-title">级别选择</h4>
            <div class="card-container level-cards">
              <div v-if="questionStore.filteredLevels.length === 0" class="no-data">暂无</div>
              <div
                v-else
                v-for="level in questionStore.filteredLevels"
                :key="level.id"
                class="card level-card"
                :class="{ active: questionStore.selectedLevelId === level.id }"
                @click="questionStore.selectLevel(level.id)"
              >
                <div class="card-title">
                  {{ level.name }}
                </div>
              </div>
            </div>
          </div>

          <div class="selection-box">
          <!-- 试卷选择 -->
            <h4 class="selection-box-title">试卷选择</h4>
            <div class="card-container paper-cards">
              <div v-if="questionStore.filteredPapers.length === 0" class="no-data">暂无</div>
              <div
                v-else
                v-for="paper in questionStore.filteredPapers"
                :key="paper.id"
                class="card paper-card"
                :class="{ active: questionStore.currentPaperId === paper.id }"
                @click="questionStore.selectPaper(paper.id)"
              >
                <div class="card-title">
                  {{ paper.name }}
                </div>
              </div>
            </div>
          </div>

          <!-- 模式选择 -->
          <div class="mode-buttons">
            <el-button type="primary" size="large" @click="startTutorial" :loading="loading">讲解模式</el-button>
            <el-button type="success" size="large" @click="startExam" :loading="loading">测试模式</el-button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.5rem;
  text-align: center;
}

.loading-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.home-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
}

.home-header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #409EFF;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: #409EFF;
}

.selection-container {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.selection-section {
  margin-bottom: 0.5rem;
}

.selection-section h2 {
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  color: #606266;
  text-align: left;
  padding-left: 0.5rem;
  border-left: 4px solid #409EFF;
}

/* 卡片容器样式 */
.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: flex-start;
}

/* 组织卡片样式 - 每行5个 */
.org-cards {
  --cards-per-row: 5;
}

/* 类别卡片样式 - 每行6个 */
.category-cards {
  --cards-per-row: 6;
}

/* 级别卡片样式 - 每行7个 */
.level-cards {
  --cards-per-row: 7;
}

/* 试卷卡片样式 - 每行5个 */
.paper-cards {
  --cards-per-row: 5;
}

/* 通用卡片样式 */
.card {
  flex: 0 0 calc(100% / var(--cards-per-row) - 1rem);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  /* 预留出边框空间，避免选中时的布局跳动 */
  border: 2px solid transparent;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.card.active {
  border: 2px solid #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(64, 158, 255, 0.3);
}

/* 组织和类别卡片的图片样式 */
.card-image {
  height: 80px;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f9ff;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 卡片标题样式 */
.card-title {
  padding: 0.5rem;
  font-weight: 500;
  color: #303133;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  font-size: 0.9rem;
}

/* 组织卡片特殊样式 */
.org-card .card-title {
  background-color: #409EFF;
  color: white;
}

/* 类别卡片特殊样式 */
.category-card .card-title {
  background-color: #67C23A;
  color: white;
}

/* 级别卡片特殊样式 */
.level-card {
  height: 40px;
  background-color: #E6A23C;
}

.level-card .card-title {
  color: white;
}

/* 试卷卡片特殊样式 */
.paper-card {
  height: 40px;
  background-color: #F56C6C;
}

.paper-card .card-title {
  color: white;
}

/* 模式选择样式 */
.mode-selection {
  margin-top: 2rem;
}

.mode-selection h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  color: #409EFF;
  text-align: center;
  font-weight: bold;
  padding: 0.5rem;
  border-bottom: 2px solid #409EFF;
  display: inline-block;
}

.mode-buttons {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 0.8rem 0;
}

.mode-buttons .el-button {
  padding: 1.2rem 4rem;
  font-size: 1.4rem;
  font-weight: bold;
  min-width: 180px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .org-cards, .paper-cards {
    --cards-per-row: 4;
  }

  .category-cards {
    --cards-per-row: 5;
  }

  .level-cards {
    --cards-per-row: 6;
  }
}

@media (max-width: 992px) {
  .org-cards, .paper-cards {
    --cards-per-row: 3;
  }

  .category-cards {
    --cards-per-row: 4;
  }

  .level-cards {
    --cards-per-row: 5;
  }
}

@media (max-width: 768px) {
  .org-cards, .category-cards, .paper-cards {
    --cards-per-row: 2;
  }

  .level-cards {
    --cards-per-row: 3;
  }
}

@media (max-width: 576px) {
  .org-cards, .category-cards, .level-cards, .paper-cards {
    --cards-per-row: 1;
  }
}

/* 增强选择框样式，使边框更加明显 */
.selection-box {
  border: 2px solid #409EFF;
  border-radius: 6px;
  padding: 0.8rem;
  margin-bottom: 0.3rem;
  background-color: rgba(240, 249, 255, 0.5);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  position: relative;
}

.selection-box-title {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  padding: 0 1rem;
  color: #409EFF;
  font-size: 0.9rem;
  font-weight: bold;
  border: 2px solid #409EFF;
  border-radius: 15px;
}

/* 调整各选择区域标题样式，使其更加突出 */
.selection-section h3 {
  margin: 1rem 0 0.75rem 0;
  font-size: 1.2rem;
  color: #303133;
  text-align: left;
  padding: 0.3rem 0.8rem;
  border-left: 6px solid #409EFF;
  background-color: rgba(64, 158, 255, 0.1);
  border-radius: 0 4px 4px 0;
  font-weight: bold;
}

/* 暂无数据样式 */
.no-data {
  width: 100%;
  height: 80px; /* 与卡片高度保持一致 */
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #909399;
  font-size: 1rem;
  background-color: rgba(144, 147, 153, 0.1);
  border-radius: 4px;
}
</style>
