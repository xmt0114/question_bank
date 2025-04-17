<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Question } from '@/types/question'
import { QuestionType } from '@/types/question'

const props = defineProps<{
  question: Question
  userAnswer?: string | string[]
  showResult?: boolean
  disabled?: boolean
  hideSubmitButton?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', answer: string | string[]): void
}>()

const selectedAnswer = ref<string | string[]>(
  props.question.type === QuestionType.MultipleChoice ? [] : ''
)

// 当用户答案变化时更新选中状态
watch(() => props.userAnswer, (newVal) => {
  if (newVal !== undefined) {
    selectedAnswer.value = Array.isArray(newVal) ? [...newVal] : newVal
  }
}, { immediate: true })

// 当题目变化时重置选中状态
watch(() => props.question, () => {
  selectedAnswer.value = props.userAnswer || (props.question.type === QuestionType.MultipleChoice ? [] : '')
}, { immediate: true })

const isCorrect = computed(() => {
  if (!props.showResult) return false

  if (Array.isArray(props.question.answer)) {
    const userAnswerArray = Array.isArray(props.userAnswer) ? props.userAnswer : []
    return JSON.stringify([...userAnswerArray].sort()) === JSON.stringify([...props.question.answer].sort())
  } else {
    return props.userAnswer === props.question.answer
  }
})

const handleSingleSelect = (optionId: string) => {
  if (props.disabled) return
  selectedAnswer.value = optionId
}

const handleMultipleSelect = (optionId: string) => {
  if (props.disabled) return

  const multipleAnswer = Array.isArray(selectedAnswer.value) ? selectedAnswer.value : []
  const index = multipleAnswer.indexOf(optionId)

  if (index === -1) {
    multipleAnswer.push(optionId)
  } else {
    multipleAnswer.splice(index, 1)
  }

  selectedAnswer.value = multipleAnswer
}

const submitAnswer = () => {
  emit('submit', selectedAnswer.value)
}

const getOptionClass = (optionId: string) => {
  if (!props.showResult) return {}

  const isSelected = Array.isArray(selectedAnswer.value)
    ? selectedAnswer.value.includes(optionId)
    : selectedAnswer.value === optionId

  const isCorrectOption = Array.isArray(props.question.answer)
    ? props.question.answer.includes(optionId)
    : props.question.answer === optionId

  return {
    'option-correct': isCorrectOption,
    'option-wrong': isSelected && !isCorrectOption
  }
}
</script>

<template>
  <div class="question-container">
    <div class="question-header">
      <div class="question-title">
        <span class="question-type">
          {{
            question.type === QuestionType.SingleChoice ? '[单选题]' :
            question.type === QuestionType.MultipleChoice ? '[多选题]' : '[判断题]'
          }}
        </span>
        {{ question.title }}
      </div>

      <div v-if="question.image" class="question-image">
        <img :src="question.image" alt="题目图片">
      </div>
    </div>

    <div class="question-options">
      <template v-if="question.type === QuestionType.SingleChoice || question.type === QuestionType.TrueFalse">
        <div
          v-for="option in question.options"
          :key="option.id"
          class="option"
          :class="getOptionClass(option.id)"
          @click="handleSingleSelect(option.id)"
        >
          <el-radio
            v-model="selectedAnswer"
            :label="option.id"
            :disabled="disabled"
          >
            <span class="option-id">{{ option.id }}.</span>
            <span v-if="option.text" class="option-text">{{ option.text }}</span>
            <img v-if="option.image" :src="option.image" alt="选项图片" class="option-image">
          </el-radio>
        </div>
      </template>

      <template v-else-if="question.type === QuestionType.MultipleChoice">
        <div
          v-for="option in question.options"
          :key="option.id"
          class="option"
          :class="getOptionClass(option.id)"
          @click="handleMultipleSelect(option.id)"
        >
          <div class="checkbox-wrapper">
            <input
              type="checkbox"
              :id="`option-${option.id}`"
              :checked="Array.isArray(selectedAnswer) && selectedAnswer.includes(option.id)"
              :disabled="disabled"
              @change="handleMultipleSelect(option.id)"
              class="custom-checkbox"
            />
            <label :for="`option-${option.id}`" class="checkbox-label">
              <span class="option-id">{{ option.id }}.</span>
              <span v-if="option.text" class="option-text">{{ option.text }}</span>
              <img v-if="option.image" :src="option.image" alt="选项图片" class="option-image">
            </label>
          </div>
        </div>
      </template>
    </div>

    <div v-if="showResult" class="question-explanation">
      <div class="result-header">
        <div class="result-status" :class="{ 'correct': isCorrect, 'wrong': !isCorrect }">
          {{ isCorrect ? '回答正确' : '回答错误' }}
        </div>
        <div class="correct-answer">
          <span>正确答案: </span>
          <span v-if="Array.isArray(question.answer)">
            {{ question.answer.join(', ') }}
          </span>
          <span v-else>
            {{ question.answer }}
          </span>
        </div>
      </div>

      <div class="explanation">
        <h4>解析:</h4>
        <p>{{ question.explanation }}</p>
      </div>
    </div>

    <div v-if="!showResult && !disabled && !hideSubmitButton" class="question-actions">
      <el-button
        type="primary"
        @click="submitAnswer"
        :disabled="(question.type === QuestionType.MultipleChoice && Array.isArray(selectedAnswer) && selectedAnswer.length === 0) || selectedAnswer === ''"
      >
        提交答案
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.question-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.question-header {
  margin-bottom: 20px;
}

.question-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.5;
  margin-bottom: 15px;
}

.question-type {
  color: #409EFF;
  margin-right: 8px;
  font-weight: bold;
}

.question-image {
  margin-top: 15px;
  text-align: center;
}

.question-image img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
}

.question-options {
  margin-bottom: 20px;
}

.option {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  transition: background-color 0.3s;
}

.option:hover {
  background-color: #f5f7fa;
}

.option-id {
  margin-right: 8px;
  font-weight: bold;
}

.option-image {
  max-width: 100%;
  max-height: 150px;
  margin-top: 10px;
  border-radius: 4px;
}

.option-correct {
  background-color: rgba(103, 194, 58, 0.1);
  border: 1px solid #67c23a;
}

.option-wrong {
  background-color: rgba(245, 108, 108, 0.1);
  border: 1px solid #f56c6c;
}

.question-explanation {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.result-status {
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 4px;
}

.result-status.correct {
  background-color: #67c23a;
  color: white;
}

.result-status.wrong {
  background-color: #f56c6c;
  color: white;
}

.correct-answer {
  font-weight: bold;
}

.explanation h4 {
  margin-bottom: 10px;
  color: #409EFF;
}

.explanation p {
  line-height: 1.6;
}

.question-actions {
  margin-top: 20px;
  text-align: center;
}

.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
}

.custom-checkbox {
  margin-top: 3px;
  margin-right: 8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-label {
  display: flex;
  flex-wrap: wrap;
  cursor: pointer;
  flex: 1;
}
</style>
