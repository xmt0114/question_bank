<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { Question, Option } from '@/types/question'
import { QuestionType } from '@/types/question'
import speechService, { SpeechServiceStatus } from '@/services/speechService'

const props = defineProps<{
  question: Question
  userAnswer?: string | string[] | null
  showResult?: boolean
  disabled?: boolean
  hideSubmitButton?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', answer: string | string[]): void
}>()

// 判断是否为实操题
const isHandsOnQuestion = computed(() => {
  return props.question.type === QuestionType.HandsOn
})

// 判断题目是否有图片
const hasQuestionImages = computed(() => {
  return (props.question.image && props.question.image.length > 0) || 
         (props.question.images && props.question.images.length > 0)
})

// 判断选项是否有图片
const hasOptionImages = (option: Option) => {
  return (option.image && option.image.length > 0) || 
         (option.images && option.images.length > 0)
}

// 语音服务相关
const speechAvailable = computed(() => {
  const available = speechService.isAvailable()
  console.log('QuestionItem - 语音服务可用状态:', available)
  return available
})
const isSpeaking = ref(false)

// 监听语音状态
watch(() => speechService.getStatus(), (status) => {
  console.log('QuestionItem - 语音服务状态变化:', status)
  isSpeaking.value = status === SpeechServiceStatus.SPEAKING
}, { immediate: true })

const selectedAnswer = ref<string | string[] | null>(
  props.question.type === QuestionType.MultipleChoice ? [] : ''
)

// 当用户答案变化时更新选中状态
watch(() => props.userAnswer, (newVal) => {
  if (newVal !== undefined && newVal !== null) {
    selectedAnswer.value = Array.isArray(newVal) ? [...newVal] : newVal
  } else {
    selectedAnswer.value = props.question.type === QuestionType.MultipleChoice ? [] : ''
  }
}, { immediate: true })

// 当题目变化时重置选中状态
watch(() => props.question, () => {
  if (props.userAnswer !== undefined && props.userAnswer !== null) {
    selectedAnswer.value = Array.isArray(props.userAnswer) ? [...props.userAnswer] : props.userAnswer
  } else {
    selectedAnswer.value = props.question.type === QuestionType.MultipleChoice ? [] : ''
  }
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

  // 如果隐藏了提交按钮（在ExamMode模式下），选择选项后立即提交答案
  if (props.hideSubmitButton) {
    submitAnswer()
  }
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

  // 如果隐藏了提交按钮（在ExamMode模式下），选择选项后立即提交答案
  // 多选题需要至少选择一项才提交
  if (props.hideSubmitButton && multipleAnswer.length > 0) {
    submitAnswer()
  }
}

const submitAnswer = () => {
  // 确保不会提交null值
  const answer = selectedAnswer.value === null 
    ? (props.question.type === QuestionType.MultipleChoice ? [] : '') 
    : selectedAnswer.value
  emit('submit', answer)
}

// 判断提交按钮是否禁用
const isSubmitButtonDisabled = computed(() => {
  // 如果是实操题，提交按钮始终可用
  if (isHandsOnQuestion.value) {
    return false
  }
  
  // 对于其他题型，按原有逻辑处理
  return (props.question.type === QuestionType.MultipleChoice && 
          Array.isArray(selectedAnswer.value) && 
          selectedAnswer.value.length === 0) || 
         selectedAnswer.value === ''
})

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

// 在组件挂载时输出调试信息
onMounted(() => {
  console.log('QuestionItem 组件挂载 - 语音服务状态:', speechService.getStatus())
  console.log('QuestionItem 组件挂载 - 语音服务可用状态:', speechAvailable.value)
  
  // 使用nextTick确保组件完全初始化后再自动提交实操题答案
  nextTick(() => {
    // 如果是实操题，自动标记为已完成
    if (isHandsOnQuestion.value && !props.disabled && !props.showResult) {
      submitAnswer()
    }
  })
})

// 文本朗读函数
const speakText = (text: string) => {
  if (!speechAvailable.value) return

  // 如果当前正在朗读，先停止
  speechService.stop()

  // 开始朗读新文本
  speechService.speak(text)
}
</script>

<template>
  <div class="question-container">
    <div class="question-header">
      <div class="question-title">
        <div class="title-content">
          <div class="question-type-wrapper">
            <span class="question-type">
              {{
                question.type === QuestionType.SingleChoice ? '[单选题]' :
                question.type === QuestionType.MultipleChoice ? '[多选题]' : 
                question.type === QuestionType.HandsOn ? '[实操题]' : '[判断题]'
              }}
            </span>
          </div>
          <div class="question-title-text">
            {{ question.title }}
          </div>
          <button
            v-if="speechAvailable"
            class="speak-button"
            :class="{ 'speaking': isSpeaking }"
            @click.stop="speakText(question.title)"
            title="朗读题目"
          >
            <font-awesome-icon :icon="['fas', 'volume-high']" />
          </button>
        </div>
      </div>

      <!-- 题目图片显示 - 支持多图片 -->
      <div v-if="hasQuestionImages" class="question-images">
        <!-- 兼容旧数据 - 单图片 -->
        <div v-if="question.image && !question.images" class="question-image">
          <img :src="question.image" alt="题目图片">
        </div>
        <!-- 新数据 - 多图片 -->
        <div v-else-if="question.images" v-for="(image, index) in question.images" :key="index" class="question-image">
          <img :src="image" :alt="`题目图片${index + 1}`">
        </div>
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
          <div class="option-row">
            <div class="option-text-wrapper">
              <el-radio
                v-model="selectedAnswer"
                :label="option.id"
                :disabled="disabled"
              >
                <span class="option-id">{{ option.id }}.</span>
                <span v-if="option.text" class="option-text">{{ option.text }}</span>
              </el-radio>
            </div>
            
            <div class="button-wrapper">
              <button
                v-if="speechAvailable && option.text"
                class="speak-button"
                :class="{ 'speaking': isSpeaking }"
                @click.stop="speakText(option.text)"
                title="朗读选项"
              >
                <font-awesome-icon :icon="['fas', 'volume-high']" />
              </button>
            </div>
          </div>
          
          <!-- 选项图片显示 - 支持多图片 - 移到单独一行显示 -->
          <div v-if="hasOptionImages(option)" class="option-images-container">
            <div class="option-images">
              <!-- 兼容旧数据 - 单图片 -->
              <img v-if="option.image && !option.images" :src="option.image" alt="选项图片" class="option-image">
              <!-- 新数据 - 多图片 -->
              <img v-else-if="option.images" v-for="(image, index) in option.images" 
                   :key="index" 
                   :src="image" 
                   :alt="`选项${option.id}图片${index + 1}`" 
                   class="option-image">
            </div>
          </div>
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
          <div class="option-row">
            <div class="option-text-wrapper">
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
                </label>
              </div>
            </div>
            
            <div class="button-wrapper">
              <button
                v-if="speechAvailable && option.text"
                class="speak-button"
                :class="{ 'speaking': isSpeaking }"
                @click.stop="speakText(option.text)"
                title="朗读选项"
              >
                <font-awesome-icon :icon="['fas', 'volume-high']" />
              </button>
            </div>
          </div>
          
          <!-- 选项图片显示 - 支持多图片 - 移到单独一行显示 -->
          <div v-if="hasOptionImages(option)" class="option-images-container">
            <div class="option-images">
              <!-- 兼容旧数据 - 单图片 -->
              <img v-if="option.image && !option.images" :src="option.image" alt="选项图片" class="option-image">
              <!-- 新数据 - 多图片 -->
              <img v-else-if="option.images" v-for="(image, index) in option.images" 
                   :key="index" 
                   :src="image" 
                   :alt="`选项${option.id}图片${index + 1}`" 
                   class="option-image">
            </div>
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
        :disabled="isSubmitButtonDisabled"
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

.title-content {
  display: flex;
  align-items: flex-start;
  position: relative;
}

.question-type-wrapper {
  flex-shrink: 0;
  width: 70px; /* 固定宽度 */
  display: flex;
  align-items: center;
}

.question-type {
  color: #409EFF;
  font-weight: bold;
  white-space: nowrap; /* 防止换行 */
}

.question-title-text {
  flex: 1;
  min-width: 0;
  margin-right: 10px; /* 为朗读按钮留出空间 */
}

.speak-button {
  margin-left: 5px;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #409EFF;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.speak-button:hover {
  background-color: #66b1ff;
  transform: scale(1.05);
}

.speak-button.speaking {
  background-color: #67C23A;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 多图片布局样式 */
.question-images {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  margin-top: 15px;
}

.question-image {
  flex: 0 0 auto;
  max-width: 80%; /* 增大最大宽度，从48%改为80% */
  text-align: center;
}

.question-image img {
  max-width: 100%;
  max-height: 400px; /* 增大最大高度，从300px改为400px */
  border-radius: 4px;
  object-fit: contain; /* 保持图片比例 */
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

.option-content {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
}

.option:hover {
  background-color: #f5f7fa;
}

.option-id {
  margin-right: 8px;
  font-weight: bold;
}

.option-text-wrapper {
  flex: 1;
  min-width: 0;
}

.button-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 40px;
  flex-shrink: 0;
}

/* 新增选项行布局 */
.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* 选项图片容器 */
.option-images-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

/* 多图片选项样式 */
.option-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: center;
  max-width: 90%;
}

.option-image {
  min-width: 120px; /* 从100px增加到120px */
  max-width: 200px; /* 从150px增加到200px */
  max-height: 160px; /* 从120px增加到160px */
  border-radius: 4px;
  object-fit: contain; /* 保持图片比例 */
}

/* 如果只有一张图片，允许它更大一些 */
.option-images:has(img:only-child) .option-image {
  min-width: 150px; /* 从120px增加到150px */
  max-width: 250px; /* 从180px增加到250px */
  max-height: 200px; /* 从150px增加到200px */
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
  min-width: 0;
}

.custom-checkbox {
  margin-top: 3px;
  margin-right: 8px;
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.checkbox-label {
  display: flex;
  flex-wrap: wrap;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.option-text {
  word-break: break-word;
}
</style>
