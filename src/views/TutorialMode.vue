<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuestionStore } from '@/stores/question'
import QuestionItem from '@/components/QuestionItem.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const questionStore = useQuestionStore()

const showResult = ref(false)
const loading = ref(true)

onMounted(() => {
  const paperId = route.query.paper as string

  if (!paperId) {
    ElMessage.error('未选择题目，请返回首页重新选择')
    router.push('/')
    return
  }

  // 初始化题目
  questionStore.startExam(paperId, 'tutorial')
  loading.value = false
})

const currentQuestion = computed(() => questionStore.currentQuestion)
const currentQuestionIndex = computed(() => questionStore.currentQuestionIndex)
const totalQuestions = computed(() => questionStore.totalQuestions)
const isLastQuestion = computed(() => questionStore.isLastQuestion)
const isFirstQuestion = computed(() => questionStore.isFirstQuestion)

const currentUserAnswer = computed(() => {
  if (!currentQuestion.value) return undefined

  const answer = questionStore.userAnswers[currentQuestion.value.id]
  return answer?.isAnswered ? answer.answer : undefined
})

const handleSubmitAnswer = (answer: string | string[]) => {
  if (!currentQuestion.value) return

  questionStore.submitAnswer(currentQuestion.value.id, answer)
  showResult.value = true
}

const nextQuestion = () => {
  showResult.value = false
  questionStore.nextQuestion()
}

const prevQuestion = () => {
  // 检查上一题是否已经回答过
  const prevIndex = currentQuestionIndex.value - 1
  if (prevIndex >= 0) {
    const prevQuestionId = questionStore.currentPaper?.questions[prevIndex].id
    if (prevQuestionId) {
      const prevAnswer = questionStore.userAnswers[prevQuestionId]
      showResult.value = prevAnswer?.isAnswered || false
    }
  }
  questionStore.prevQuestion()
}

const finishExam = () => {
  ElMessage.success('恭喜你完成了所有题目！')
  router.push('/')
}

const backToHome = async () => {
  try {
    await ElMessageBox.confirm(
      '返回首页将丢失当前答题进度，确定要返回吗？',
      '返回确认',
      {
        confirmButtonText: '确定返回',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    router.push('/')
  } catch (e) {
    // 用户取消返回
    return
  }
}
</script>

<template>
  <div class="tutorial-container">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="10" animated />
    </div>

    <template v-else>
      <div class="tutorial-header">
        <div class="mode-title">
          <h2>讲解模式</h2>
        </div>
        <div class="header-controls">
          <div class="progress-info">
            <span>题目 {{ currentQuestionIndex + 1 }}/{{ totalQuestions }}</span>
          </div>
          <el-button @click="backToHome" type="primary" plain>返回首页</el-button>
        </div>
      </div>

      <div class="tutorial-actions">
        <div>
          <el-button
            v-if="!isFirstQuestion"
            @click="prevQuestion"
          >
            上一题
          </el-button>
        </div>

        <div>
          <el-button
            v-if="!isLastQuestion && showResult"
            type="primary"
            @click="nextQuestion"
          >
            下一题
          </el-button>

          <el-button
            v-if="!isLastQuestion && !showResult"
            @click="nextQuestion"
          >
            跳过
          </el-button>

          <el-button
            v-if="isLastQuestion && showResult"
            type="success"
            @click="finishExam"
          >
            完成
          </el-button>
        </div>
      </div>

      <div class="question-wrapper">
        <QuestionItem
          v-if="currentQuestion"
          :question="currentQuestion"
          :user-answer="currentUserAnswer"
          :show-result="showResult"
          @submit="handleSubmitAnswer"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.tutorial-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading {
  padding: 2rem;
}

.tutorial-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  width: 100%;
}

.mode-title {
  width: 100%;
  text-align: center;
  margin-bottom: 1.5rem;
}

.mode-title h2 {
  color: #409EFF;
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  padding: 0.5rem 1.5rem;
  border-bottom: 2px solid #409EFF;
  display: inline-block;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  width: 100%;
  padding: 0 1rem;
}

.progress-info {
  font-size: 16px;
  font-weight: 500;
  background-color: #f0f9ff;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid #d9ecff;
}

.question-wrapper {
  margin-top: 2rem;
  width: 100%;
  max-width: 700px;
  min-height: 400px;
}

.tutorial-actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 700px;
}
</style>
