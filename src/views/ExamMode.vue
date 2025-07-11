<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuestionStore } from '@/stores/question'
import QuestionItem from '@/components/QuestionItem.vue'
import HandsOnQuestionItem from '@/components/HandsOnQuestionItem.vue'
import QuestionNavigation from '@/components/QuestionNavigation.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionType } from '@/types/question'

const route = useRoute()
const router = useRouter()
const questionStore = useQuestionStore()

const examFinished = ref(false)
const storeLoading = computed(() => questionStore.loading)
// 增加显示模式状态，'single'表示单题显示，'full'表示整卷显示
const displayMode = ref('single')

onMounted(async () => {
  const paperId = route.query.paper as string

  if (!paperId) {
    ElMessage.error('未选择题目，请返回首页重新选择')
    router.push('/')
    return
  }

  // 初始化题目
  await questionStore.startExam(paperId, 'exam')
})

// 切换显示模式
const toggleDisplayMode = () => {
  displayMode.value = displayMode.value === 'single' ? 'full' : 'single'
}

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

// 检查当前题目是否为实操题
const isHandsOnQuestion = computed(() => {
  return currentQuestion.value?.type === QuestionType.HandsOn
})

const handleSubmitAnswer = (answer: string | string[] | null, questionId: string) => {
  if (!questionId) return

  try {
    // 如果是实操题，不需要提交答案，但需要标记为已完成
    const question = currentPaper.value?.questions.find(q => q.id === questionId)
    if (question?.type === QuestionType.HandsOn) {
      questionStore.submitAnswer(questionId, null);
      return;
    }

    questionStore.submitAnswer(questionId, answer)
  } catch (error) {
    console.error('处理答案提交时出错:', error)
  }
}

// 提交当前题目的答案（如果有选择但未提交）
const submitCurrentAnswer = () => {
  if (!currentQuestion.value || examFinished.value) return

  try {
    // 如果是实操题，不需要提交答案
    if (currentQuestion.value.type === QuestionType.HandsOn) {
      questionStore.submitAnswer(currentQuestion.value.id, null as any);
      return;
    }

    const questionId = currentQuestion.value.id
    const answer = questionStore.userAnswers[questionId]

    // 如果是多选题
    if (currentQuestion.value.type === QuestionType.MultipleChoice) {
      // 获取所有选中的复选框
      const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked')

      // 如果有选择但未提交
      if (checkboxes.length > 0 && (!answer || !answer.isAnswered)) {
        const answers = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).id.replace('option-', ''))
        handleSubmitAnswer(answers, questionId)
      }
    } else {
      // 单选题或判断题
      const selectedRadio = document.querySelector('input[type="radio"]:checked')

      // 如果有选择但未提交
      if (selectedRadio && (!answer || !answer.isAnswered)) {
        const radioValue = (selectedRadio as HTMLInputElement).id.replace('option-', '')
        handleSubmitAnswer(radioValue, questionId)
      }
    }
  } catch (error) {
    console.error('提交当前答案时出错:', error)
  }
}

const navigateToQuestion = (index: number) => {
  // 在跳转前提交当前题目的答案
  submitCurrentAnswer()
  questionStore.goToQuestion(index)
  
  // 移除自动切换到单题模式的逻辑，让用户保持在当前模式下
  // 整卷模式下，导航将滚动到对应题目
  if (displayMode.value === 'full') {
    // 延迟一下，确保DOM已更新
    setTimeout(() => {
      const questionElement = document.getElementById(`full-question-${index}`)
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
  }
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
      message: '这是最后一题，请点击"提交试卷"按钮完成测试',
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
  // 不立即清除状态，因为还需要显示结果
  // 在返回首页时才清除状态
  ElMessage.success('试卷已提交！')
}

const backToHome = async () => {
  // 如果考试已结束，直接返回首页
  if (examFinished.value) {
    questionStore.clearExamState()
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
    questionStore.clearExamState()
    router.push('/')
  } catch (e) {
    // 用户取消返回
    return
  }
}
</script>

<template>
  <div class="exam-container">
    <div v-if="storeLoading" class="loading">
      <el-skeleton :rows="10" animated />
    </div>

    <template v-else>
      <div class="exam-header">
        <div class="paper-info" v-if="questionStore.currentPaper && questionStore.currentLevel && questionStore.currentCategory && questionStore.currentOrganization">
          <div class="info-item">
            <span class="label">组织：</span>
            <span class="value">{{ questionStore.currentOrganization.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">类别：</span>
            <span class="value">{{ questionStore.currentCategory.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">级别：</span>
            <span class="value">{{ questionStore.currentLevel.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">试卷：</span>
            <span class="value">{{ questionStore.currentPaper.name }}</span>
          </div>
        </div>

        <div v-if="!examFinished" class="exam-actions">
          <!-- 添加显示模式切换按钮 -->
          <el-button type="info" @click="toggleDisplayMode">
            {{ displayMode === 'single' ? '整卷模式' : '单题模式' }}
          </el-button>
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
            :questions="currentPaper?.questions || []"
            :show-result="examFinished"
            @navigate="navigateToQuestion"
          />
        </div>

        <!-- 单题模式 -->
        <div v-if="displayMode === 'single'" class="question-content">
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

          <!-- 根据题型选择不同的组件 -->
          <template v-if="currentQuestion">
            <HandsOnQuestionItem
              v-if="isHandsOnQuestion"
              :question="currentQuestion"
            />
            <QuestionItem
              v-else
              :question="currentQuestion"
              :user-answer="currentUserAnswer"
              :show-result="examFinished"
              :disabled="examFinished"
              :hide-submit-button="true"
              @submit="(answer) => handleSubmitAnswer(answer, currentQuestion?.id || '')"
            />
          </template>
        </div>

        <!-- 整卷模式 -->
        <div v-else class="full-paper-content">
          <div 
            v-for="(question, index) in currentPaper?.questions" 
            :key="question.id" 
            class="full-paper-question"
            :id="`full-question-${index}`"
          >
            <div class="question-header">
              <div class="question-number">第 {{ index + 1 }} 题</div>
              <div 
                v-if="question.type !== QuestionType.HandsOn" 
                class="question-status" 
                :class="userAnswers[question.id]?.isAnswered ? 'answered' : 'unanswered'"
              >
                {{ userAnswers[question.id]?.isAnswered ? '已作答' : '未作答' }}
              </div>
              <div v-else class="question-status answered">
                实操题
              </div>
            </div>
            
            <!-- 根据题型选择不同的组件 -->
            <HandsOnQuestionItem
              v-if="question.type === QuestionType.HandsOn"
              :question="question"
            />
            <QuestionItem
              v-else
              :question="question"
              :user-answer="userAnswers[question.id]?.answer"
              :show-result="examFinished"
              :disabled="examFinished"
              :hide-submit-button="true"
              @submit="(answer) => handleSubmitAnswer(answer, question.id)"
            />
            
            <el-divider />
          </div>
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
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  width: 100%;
  gap: 1rem;
}

.header-left {
  width: 100%;
  text-align: center;
}

.exam-header h2 {
  color: #409EFF;
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
  padding: 0.5rem 1.5rem;
  border-bottom: 2px solid #409EFF;
  display: inline-block;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.paper-info {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin: 0.5rem 0;
  background-color: #f0f9ff;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #d9ecff;
  width: 100%;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: bold;
  color: #606266;
  margin-right: 0.25rem;
}

.info-item .value {
  color: #409EFF;
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
  position: sticky;
  top: 20px;
  align-self: flex-start;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
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

/* 整卷模式样式 */
.full-paper-content {
  flex-grow: 1;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.full-paper-question {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #ebeef5;
}

.question-number {
  font-size: 1.1rem;
  font-weight: bold;
  color: #409EFF;
}

.question-status {
  font-size: 0.9rem;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.question-status.answered {
  background-color: #f0f9eb;
  color: #67c23a;
}

.question-status.unanswered {
  background-color: #fef0f0;
  color: #f56c6c;
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
    position: static;
    max-height: none;
  }
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  width: 100%;
}
</style>
