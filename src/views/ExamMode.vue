<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuestionStore } from '@/stores/question'
import QuestionItem from '@/components/QuestionItem.vue'
import QuestionNavigation from '@/components/QuestionNavigation.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionType } from '@/types/question'

const route = useRoute()
const router = useRouter()
const questionStore = useQuestionStore()

const examFinished = ref(false)
const loading = ref(true)

onMounted(() => {
  const paperId = route.query.paper as string

  if (!paperId) {
    ElMessage.error('未选择题目，请返回首页重新选择')
    router.push('/')
    return
  }

  // 初始化题目
  questionStore.startExam(paperId, 'exam')
  loading.value = false
})

const currentQuestion = computed(() => questionStore.currentQuestion)
const currentQuestionIndex = computed(() => questionStore.currentQuestionIndex)
const totalQuestions = computed(() => questionStore.totalQuestions)
const userAnswers = computed(() => questionStore.userAnswers)
const examResult = computed(() => questionStore.examResult)
const currentPaper = computed(() => questionStore.currentPaper)

const questionIds = computed(() => {
  if (!currentPaper.value) return []
  return currentPaper.value.questions.map(q => q.id)
})

const currentUserAnswer = computed(() => {
  if (!currentQuestion.value) return undefined

  const answer = questionStore.userAnswers[currentQuestion.value.id]
  return answer?.isAnswered ? answer.answer : undefined
})

const handleSubmitAnswer = (answer: string | string[]) => {
  if (!currentQuestion.value) return

  questionStore.submitAnswer(currentQuestion.value.id, answer)
}

// 提交当前题目的答案（如果有选择但未提交）
const submitCurrentAnswer = () => {
  if (!currentQuestion.value || examFinished.value) return

  const questionId = currentQuestion.value.id
  const answer = questionStore.userAnswers[questionId]

  // 如果是多选题
  if (currentQuestion.value.type === QuestionType.MultipleChoice) {
    // 获取所有选中的复选框
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked')

    // 如果有选择但未提交
    if (checkboxes.length > 0 && (!answer || !answer.isAnswered)) {
      const answers = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).id.replace('option-', ''))
      handleSubmitAnswer(answers)
    }
  } else {
    // 单选题或判断题
    const selectedRadio = document.querySelector('input[type="radio"]:checked')

    // 如果有选择但未提交
    if (selectedRadio && (!answer || !answer.isAnswered)) {
      const radioValue = (selectedRadio as HTMLInputElement).id.replace('option-', '')
      handleSubmitAnswer(radioValue)
    }
  }
}

const navigateToQuestion = (index: number) => {
  // 在跳转前提交当前题目的答案
  submitCurrentAnswer()
  questionStore.goToQuestion(index)
}

const nextQuestion = () => {
  // 先提交当前题目的答案
  submitCurrentAnswer()

  // 然后跳转到下一题
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    questionStore.nextQuestion()
  } else {
    // 如果是最后一题，显示提示
    ElMessage({
      message: '这是最后一题，请点击“提交试卷”按钮完成测试',
      type: 'info'
    })
  }
}

const prevQuestion = () => {
  // 先提交当前题目的答案
  submitCurrentAnswer()

  if (currentQuestionIndex.value > 0) {
    questionStore.prevQuestion()
  }
}

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === totalQuestions.value - 1
})

const isFirstQuestion = computed(() => {
  return currentQuestionIndex.value === 0
})

const submitExam = async () => {
  // 先提交当前题目的答案
  submitCurrentAnswer()

  // 检查是否有未完成的题目
  const unansweredCount = Object.values(userAnswers.value).filter(a => !a.isAnswered).length

  if (unansweredCount > 0) {
    try {
      await ElMessageBox.confirm(
        `还有 ${unansweredCount} 道题目未完成，确定要提交吗？`,
        '提交确认',
        {
          confirmButtonText: '确定提交',
          cancelButtonText: '继续答题',
          type: 'warning'
        }
      )
    } catch (e) {
      return
    }
  }

  questionStore.finishExam()
  examFinished.value = true
  ElMessage.success('试卷已提交！')
}

const backToHome = async () => {
  // 如果考试已结束，直接返回首页
  if (examFinished.value) {
    router.push('/')
    return
  }

  // 如果考试未结束，先提示确认
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
  <div class="exam-container">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="10" animated />
    </div>

    <template v-else>
      <div class="exam-header">
        <div class="header-left">
          <h2>测试模式</h2>
        </div>
        <div v-if="!examFinished" class="exam-actions">
          <el-button @click="backToHome">返回首页</el-button>
          <el-button type="primary" @click="submitExam">提交试卷</el-button>
        </div>
        <div v-else class="exam-result">
          <div class="result-score">
            得分: <span>{{ examResult?.score }}</span>
          </div>
          <div class="result-correct">
            正确: <span>{{ examResult?.correctAnswers }}/{{ examResult?.totalQuestions }}</span>
          </div>
          <el-button type="primary" @click="backToHome">返回首页</el-button>
        </div>
      </div>

      <div class="exam-content">
        <div class="navigation-sidebar">
          <QuestionNavigation
            :current-index="currentQuestionIndex"
            :total-questions="totalQuestions"
            :user-answers="userAnswers"
            :question-ids="questionIds"
            :show-result="examFinished"
            @navigate="navigateToQuestion"
          />
        </div>

        <div class="question-content">
          <div v-if="!examFinished" class="navigation-buttons">
            <el-button
              :disabled="isFirstQuestion"
              @click="prevQuestion"
            >
              上一题
            </el-button>

            <el-button
              :disabled="isLastQuestion"
              @click="nextQuestion"
            >
              下一题
            </el-button>
          </div>

          <QuestionItem
            v-if="currentQuestion"
            :question="currentQuestion"
            :user-answer="currentUserAnswer"
            :show-result="examFinished"
            :disabled="examFinished"
            :hide-submit-button="true"
            @submit="handleSubmitAnswer"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.exam-container {
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

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  width: 100%;
  flex-wrap: wrap;
  gap: 1rem;
}

.exam-header h2 {
  color: #409EFF;
  margin: 0;
}

.exam-content {
  display: flex;
  gap: 2rem;
  width: 100%;
  justify-content: center;
}

.navigation-sidebar {
  width: 250px;
  flex-shrink: 0;
}

.question-content {
  flex-grow: 1;
  max-width: 700px;
  display: flex;
  flex-direction: column;
}

.question-content > div:last-child {
  min-height: 400px;
}

.exam-result {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.result-score, .result-correct {
  font-size: 16px;
}

.result-score span, .result-correct span {
  font-weight: bold;
  color: #409EFF;
}

@media (max-width: 768px) {
  .exam-content {
    flex-direction: column;
  }

  .navigation-sidebar {
    width: 100%;
    margin-bottom: 1.5rem;
  }
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  width: 100%;
}
</style>
