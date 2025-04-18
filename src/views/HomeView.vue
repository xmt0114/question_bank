<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useQuestionStore } from '@/stores/question'

const router = useRouter()
const questionStore = useQuestionStore()
const selectedCategory = ref('')
const selectedPaper = ref('')

// 获取所有题目类别
const categories = computed(() => {
  const categorySet = new Set(questionStore.papers.map(paper => paper.category))
  return Array.from(categorySet)
})

// 根据选择的类别筛选题目
const filteredPapers = computed(() => {
  if (!selectedCategory.value) return []
  return questionStore.papers.filter(paper => paper.category === selectedCategory.value)
})

const startTutorial = () => {
  if (!selectedPaper.value) {
    ElMessage.warning('请先选择一套题目')
    return
  }
  router.push({
    path: '/tutorial',
    query: { paper: selectedPaper.value }
  })
}

const startExam = () => {
  if (!selectedPaper.value) {
    ElMessage.warning('请先选择一套题目')
    return
  }
  router.push({
    path: '/exam',
    query: { paper: selectedPaper.value }
  })
}
</script>

<template>
  <main>
    <div class="home-container">
      <h1>题库练习系统</h1>

      <div class="paper-selection">
        <h2>请选择题目类别</h2>
        <el-select v-model="selectedCategory" placeholder="请选择题目类别" class="selection-dropdown">
          <el-option
            v-for="category in categories"
            :key="category"
            :label="category"
            :value="category"
          />
        </el-select>
        
        <h2 class="sub-title">请选择题目</h2>
        <el-select 
          v-model="selectedPaper" 
          placeholder="请选择题目" 
          :disabled="!selectedCategory" 
          class="selection-dropdown"
        >
          <el-option
            v-for="paper in filteredPapers"
            :key="paper.id"
            :label="paper.name"
            :value="paper.id"
          />
        </el-select>
      </div>

      <div class="mode-selection">
        <h2>请选择模式</h2>
        <div class="mode-buttons">
          <el-button type="primary" @click="startTutorial">讲解模式</el-button>
          <el-button type="success" @click="startExam">测试模式</el-button>
        </div>

        <div class="mode-description">
          <h3>讲解模式</h3>
          <p>每次只展示一道题目，完成后提交答案就显示提交的答案，正确答案以及对这道题目的点评</p>

          <h3>测试模式</h3>
          <p>整张试卷在右侧屏幕，左侧是题目序号的列表，并根据已经答题，未答题，正确，错误显示不同，并且点击可以跳转到具体题目</p>
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
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #409EFF;
}

.paper-selection {
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.paper-selection h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #606266;
}

.paper-selection .sub-title {
  margin-top: 1.5rem;
}

.selection-dropdown {
  width: 400px;
}

.mode-selection h2 {
  margin-bottom: 1rem;
}

.mode-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.mode-description {
  text-align: left;
  background-color: #f5f7fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.mode-description h3 {
  color: #409EFF;
  margin-bottom: 0.5rem;
}

.mode-description p {
  margin-bottom: 1.5rem;
}
</style>
