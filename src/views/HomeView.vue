<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useQuestionStore } from '@/stores/question'

const router = useRouter()
const questionStore = useQuestionStore()

// 初始化选择
onMounted(() => {
  questionStore.initSelection()
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
</script>

<template>
  <main>
    <div class="home-container">
      <div class="selection-container">
        <!-- 组织选择 -->
        <div class="selection-section">
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

        <!-- 类别选择 -->
        <div class="selection-section" v-if="questionStore.selectedOrganizationId">
          <div class="card-container category-cards">
            <div
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

        <!-- 级别选择 -->
        <div class="selection-section" v-if="questionStore.selectedCategoryId">
          <div class="card-container level-cards">
            <div
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

        <!-- 试卷选择 -->
        <div class="selection-section" v-if="questionStore.selectedLevelId">
          <div class="card-container paper-cards">
            <div
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
        <div class="mode-selection" v-if="questionStore.currentPaperId">
          <div class="mode-buttons">
            <el-button type="primary" size="large" @click="startTutorial">讲解模式</el-button>
            <el-button type="success" size="large" @click="startExam">测试模式</el-button>
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
  padding: 1rem;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: #409EFF;
}

.selection-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  transition: all 0.3s ease;
  cursor: pointer;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.card.active {
  border: 2px solid #409EFF;
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(64, 158, 255, 0.3);
}

/* 组织和类别卡片的图片样式 */
.card-image {
  height: 100px;
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
  padding: 0.75rem;
  font-weight: 500;
  color: #303133;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
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
  height: 50px;
  background-color: #E6A23C;
}

.level-card .card-title {
  color: white;
}

/* 试卷卡片特殊样式 */
.paper-card {
  height: 50px;
  background-color: #F56C6C;
}

.paper-card .card-title {
  color: white;
}

/* 模式选择样式 */
.mode-selection {
  margin-top: 1rem;
}

.mode-selection h2 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  color: #606266;
  text-align: left;
  padding-left: 0.5rem;
  border-left: 4px solid #409EFF;
}

.mode-buttons {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 1.5rem 0;
}

.mode-buttons .el-button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
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
</style>
