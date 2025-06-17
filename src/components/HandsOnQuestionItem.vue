<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { Question } from '@/types/question'
import speechService, { SpeechServiceStatus } from '@/services/speechService'

const props = defineProps<{
  question: Question
}>()

// 判断题目是否有图片
const hasQuestionImages = computed(() => {
  return (props.question.image && props.question.image.length > 0) || 
         (props.question.images && props.question.images.length > 0)
})

// 判断题目是否有富文本内容
const hasRichContent = computed(() => {
  return props.question.richContent && props.question.richContent.length > 0
})

// 获取纯文本内容，用于语音朗读
const plainTextContent = computed(() => {
  if (props.question.richContent) {
    try {
      // 创建一个临时的DOM元素来解析HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = props.question.richContent
      // 获取纯文本内容
      return tempDiv.textContent || tempDiv.innerText || props.question.title
    } catch (error) {
      console.error('解析富文本内容时出错:', error)
      return props.question.title
    }
  }
  return props.question.title
})

// 语音服务相关
const speechAvailable = computed(() => {
  const available = speechService.isAvailable()
  console.log('HandsOnQuestionItem - 语音服务可用状态:', available)
  return available
})
const isSpeaking = ref(false)

// 监听语音状态
watch(() => speechService.getStatus(), (status) => {
  console.log('HandsOnQuestionItem - 语音服务状态变化:', status)
  isSpeaking.value = status === SpeechServiceStatus.SPEAKING
}, { immediate: true })

// 在组件挂载时输出调试信息
onMounted(() => {
  console.log('HandsOnQuestionItem 组件挂载 - 语音服务状态:', speechService.getStatus())
  console.log('HandsOnQuestionItem 组件挂载 - 语音服务可用状态:', speechAvailable.value)
})

// 文本朗读函数
const speakText = () => {
  if (!speechAvailable.value) return

  try {
    // 如果当前正在朗读，先停止
    speechService.stop()

    // 开始朗读新文本
    speechService.speak(plainTextContent.value)
  } catch (error) {
    console.error('朗读文本时出错:', error)
  }
}
</script>

<template>
  <div class="question-container">
    <div class="question-header">
      <div class="question-title">
        <div class="title-content">
          <div class="question-type-wrapper">
            <span class="question-type">[实操题]</span>
          </div>
          <!-- 使用富文本内容或标题 -->
          <div v-if="hasRichContent" class="question-rich-content">
            <div v-html="question.richContent"></div>
          </div>
          <div v-else class="question-title-text">
            {{ question.title }}
          </div>
          <button
            v-if="speechAvailable"
            class="speak-button"
            :class="{ 'speaking': isSpeaking }"
            @click.stop="speakText"
            title="朗读题目"
          >
            <font-awesome-icon :icon="['fas', 'volume-high']" />
          </button>
        </div>
      </div>

      <!-- 题目图片显示 - 支持多图片 - 仅在没有富文本内容时显示 -->
      <div v-if="!hasRichContent && hasQuestionImages" class="question-images">
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

/* 富文本内容样式 */
.question-rich-content {
  flex: 1;
  min-width: 0;
  margin-right: 10px;
}

/* 富文本内容中的图片样式 */
.question-rich-content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 10px 0;
  border-radius: 4px;
}

/* 富文本内容中的表格样式 */
.question-rich-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
}

.question-rich-content :deep(table td), 
.question-rich-content :deep(table th) {
  border: 1px solid #dcdfe6;
  padding: 8px;
}

/* 富文本内容中的列表样式 */
.question-rich-content :deep(ul), 
.question-rich-content :deep(ol) {
  padding-left: 20px;
  margin: 10px 0;
}

/* 富文本内容中的代码样式 */
.question-rich-content :deep(pre), 
.question-rich-content :deep(code) {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 2px 4px;
  font-family: monospace;
}

.question-rich-content :deep(pre) {
  padding: 10px;
  overflow-x: auto;
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
  max-width: 80%;
  text-align: center;
}

.question-image img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
  object-fit: contain; /* 保持图片比例 */
}
</style> 