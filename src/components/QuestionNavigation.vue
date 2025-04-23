<script setup lang="ts">
import { computed } from 'vue'
import type { UserAnswer } from '@/types/question'

const props = defineProps<{
  currentIndex: number
  totalQuestions: number
  userAnswers: Record<string, UserAnswer>
  questionIds: string[]
  showResult?: boolean
}>()

const emit = defineEmits<{
  (e: 'navigate', index: number): void
}>()

const getQuestionStatus = (questionId: string, _index: number) => {
  const answer = props.userAnswers[questionId]

  if (!answer || !answer.isAnswered) {
    return 'unanswered'
  }

  if (!props.showResult) {
    return 'answered'
  }

  return answer.isCorrect ? 'correct' : 'wrong'
}

const completedCount = computed(() => {
  return Object.values(props.userAnswers).filter(a => a.isAnswered).length
})

const correctCount = computed(() => {
  if (!props.showResult) return 0
  return Object.values(props.userAnswers).filter(a => a.isCorrect).length
})

const navigateToQuestion = (index: number) => {
  emit('navigate', index)
}
</script>

<template>
  <div class="navigation-container">
    <div class="navigation-header">
      <h3>题目导航</h3>
      <div class="navigation-stats">
        <div class="stat-item">
          <span>已完成:</span>
          <span class="stat-value">{{ completedCount }}/{{ totalQuestions }}</span>
        </div>
        <div v-if="showResult" class="stat-item">
          <span>正确:</span>
          <span class="stat-value">{{ correctCount }}/{{ totalQuestions }}</span>
        </div>
      </div>
    </div>

    <div class="question-buttons">
      <button
        v-for="(questionId, index) in questionIds"
        :key="questionId"
        class="question-button"
        :class="[
          getQuestionStatus(questionId, index),
          { active: index === currentIndex }
        ]"
        @click="navigateToQuestion(index)"
      >
        {{ index + 1 }}
      </button>
    </div>

    <div class="navigation-legend">
      <div class="legend-item">
        <div class="legend-color unanswered"></div>
        <span>未答题</span>
      </div>
      <div class="legend-item">
        <div class="legend-color answered"></div>
        <span>已答题</span>
      </div>
      <div v-if="showResult" class="legend-item">
        <div class="legend-color correct"></div>
        <span>答对</span>
      </div>
      <div v-if="showResult" class="legend-item">
        <div class="legend-color wrong"></div>
        <span>答错</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.navigation-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.navigation-header {
  margin-bottom: 20px;
}

.navigation-header h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #409EFF;
}

.navigation-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.stat-item {
  font-size: 14px;
}

.stat-value {
  font-weight: bold;
  margin-left: 5px;
}

.question-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.question-button {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: all 0.3s;
}

.question-button:hover {
  border-color: #409EFF;
}

.question-button.active {
  border: 2px solid #409EFF;
  color: #409EFF;
}

.question-button.unanswered {
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
}

.question-button.answered {
  background-color: #e6f1fc;
  color: #409EFF;
  border: 1px solid #409EFF;
}

.question-button.correct {
  background-color: #f0f9eb;
  color: #67c23a;
  border-color: #67c23a;
}

.question-button.wrong {
  background-color: #fef0f0;
  color: #f56c6c;
  border-color: #f56c6c;
}

.navigation-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  margin-right: 5px;
  border: 1px solid #dcdfe6;
}

.legend-color.unanswered {
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
}

.legend-color.answered {
  background-color: #e6f1fc;
  border: 1px solid #409EFF;
}

.legend-color.correct {
  background-color: #f0f9eb;
  border-color: #67c23a;
}

.legend-color.wrong {
  background-color: #fef0f0;
  border-color: #f56c6c;
}
</style>
