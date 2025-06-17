<script setup lang="ts">
import { computed } from 'vue'
import type { UserAnswer, Question } from '@/types/question'
import { QuestionType } from '@/types/question'

const props = defineProps<{
  currentIndex: number
  totalQuestions: number
  userAnswers: Record<string, UserAnswer>
  questionIds: string[]
  questions: Question[]
  showResult?: boolean
}>()

const emit = defineEmits<{
  (e: 'navigate', index: number): void
}>()

const groupedQuestions = computed(() => {
  if (!props.questions || props.questions.length === 0) return {}

  const groups: Record<string, { type: string, questions: Array<{ question: Question, index: number }> }> = {
    [QuestionType.SingleChoice]: { type: '单选题', questions: [] },
    [QuestionType.MultipleChoice]: { type: '多选题', questions: [] },
    [QuestionType.TrueFalse]: { type: '判断题', questions: [] },
    [QuestionType.HandsOn]: { type: '实操题', questions: [] }
  }

  props.questions.forEach((question, index) => {
    if (question.type in groups) {
      groups[question.type].questions.push({
        question,
        index
      })
    }
  })

  Object.keys(groups).forEach(key => {
    if (groups[key].questions.length === 0) {
      delete groups[key]
    }
  })

  return groups as Record<string, { type: string, questions: Array<{ question: Question, index: number }> }>
})

const getQuestionStatus = (questionId: string, _index: number) => {
  try {
    // 如果是实操题，直接标记为已完成
    const question = props.questions.find(q => q.id === questionId)
    if (question && question.type === QuestionType.HandsOn) {
      return props.showResult ? 'correct' : 'answered'
    }

    const answer = props.userAnswers[questionId]

    if (!answer || !answer.isAnswered) {
      return 'unanswered'
    }

    if (!props.showResult) {
      return 'answered'
    }

    return answer.isCorrect ? 'correct' : 'wrong'
  } catch (error) {
    console.error('获取题目状态时出错:', error)
    return 'unanswered' // 默认返回未作答状态
  }
}

const completedCount = computed(() => {
  try {
    // 计算已完成的题目数量，实操题默认计为已完成
    let count = 0
    
    props.questions.forEach(question => {
      if (question.type === QuestionType.HandsOn) {
        count++
      } else {
        const answer = props.userAnswers[question.id]
        if (answer && answer.isAnswered) {
          count++
        }
      }
    })
    
    return count
  } catch (error) {
    console.error('计算已完成题目数量时出错:', error)
    return 0
  }
})

const correctCount = computed(() => {
  try {
    if (!props.showResult) return 0
    
    // 计算正确的题目数量，实操题不计入评分
    let count = 0
    
    props.questions.forEach(question => {
      if (question.type !== QuestionType.HandsOn) {
        const answer = props.userAnswers[question.id]
        if (answer && answer.isCorrect) {
          count++
        }
      }
    })
    
    return count
  } catch (error) {
    console.error('计算正确题目数量时出错:', error)
    return 0
  }
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

    <div class="question-groups" v-if="questions && questions.length > 0">
      <div 
        v-for="(group, type) in groupedQuestions" 
        :key="type" 
        class="question-group"
      >
        <div class="question-group-header">
          <div class="question-type-label">{{ group.type }}</div>
          <div class="question-count">{{ group.questions.length }}题</div>
        </div>
        
        <div class="question-buttons">
          <button
            v-for="item in group.questions"
            :key="item.question.id"
            class="question-button"
            :class="[
              getQuestionStatus(item.question.id, item.index),
              { active: item.index === currentIndex }
            ]"
            @click="navigateToQuestion(item.index)"
          >
            {{ item.index + 1 }}
          </button>
        </div>
      </div>
    </div>

    <div class="question-buttons" v-else>
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

.question-groups {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.question-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #e6e6e6;
}

.question-type-label {
  font-weight: bold;
  color: #409EFF;
  font-size: 14px;
}

.question-count {
  font-size: 12px;
  color: #606266;
}

.question-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
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
  margin-top: 10px;
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
