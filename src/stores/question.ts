import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Paper, Question, UserAnswer, ExamResult } from '@/types/question'
import { mockPapers } from '@/data/mockData'

export const useQuestionStore = defineStore('question', () => {
  const papers = ref<Paper[]>(mockPapers)
  const currentPaperId = ref<string>('')
  const currentQuestionIndex = ref<number>(0)
  const userAnswers = ref<Record<string, UserAnswer>>({})
  const examStartTime = ref<Date | null>(null)
  const examEndTime = ref<Date | null>(null)
  const examMode = ref<'tutorial' | 'exam'>('tutorial')

  const currentPaper = computed(() => {
    return papers.value.find(paper => paper.id === currentPaperId.value) || null
  })

  const currentQuestion = computed(() => {
    if (!currentPaper.value) return null
    return currentPaper.value.questions[currentQuestionIndex.value] || null
  })

  const totalQuestions = computed(() => {
    if (!currentPaper.value) return 0
    return currentPaper.value.questions.length
  })

  const isLastQuestion = computed(() => {
    return currentQuestionIndex.value === totalQuestions.value - 1
  })

  const isFirstQuestion = computed(() => {
    return currentQuestionIndex.value === 0
  })

  const examResult = computed(() => {
    if (!currentPaper.value) return null

    const correctAnswers = Object.values(userAnswers.value).filter(a => a.isCorrect).length
    const score = Math.round((correctAnswers / totalQuestions.value) * 100)

    const result: ExamResult = {
      paperId: currentPaperId.value,
      userAnswers: userAnswers.value,
      score,
      totalQuestions: totalQuestions.value,
      correctAnswers,
      startTime: examStartTime.value!,
      endTime: examEndTime.value || undefined
    }

    return result
  })

  function startExam(paperId: string, mode: 'tutorial' | 'exam') {
    currentPaperId.value = paperId
    currentQuestionIndex.value = 0
    userAnswers.value = {}
    examStartTime.value = new Date()
    examEndTime.value = null
    examMode.value = mode

    // 初始化用户答案
    if (currentPaper.value) {
      currentPaper.value.questions.forEach(question => {
        userAnswers.value[question.id] = {
          questionId: question.id,
          answer: Array.isArray(question.answer) ? [] : '',
          isCorrect: false,
          isAnswered: false
        }
      })
    }
  }

  function submitAnswer(questionId: string, answer: string | string[]) {
    const question = currentPaper.value?.questions.find(q => q.id === questionId)
    if (!question) return

    const isCorrect = Array.isArray(question.answer)
      ? JSON.stringify(answer.sort()) === JSON.stringify(question.answer.sort())
      : answer === question.answer

    userAnswers.value[questionId] = {
      questionId,
      answer,
      isCorrect,
      isAnswered: true
    }
  }

  function nextQuestion() {
    if (currentQuestionIndex.value < totalQuestions.value - 1) {
      currentQuestionIndex.value++
    }
  }

  function prevQuestion() {
    if (currentQuestionIndex.value > 0) {
      currentQuestionIndex.value--
    }
  }

  function goToQuestion(index: number) {
    if (index >= 0 && index < totalQuestions.value) {
      currentQuestionIndex.value = index
    }
  }

  function finishExam() {
    examEndTime.value = new Date()
  }

  return {
    papers,
    currentPaperId,
    currentQuestionIndex,
    userAnswers,
    examStartTime,
    examEndTime,
    examMode,
    currentPaper,
    currentQuestion,
    totalQuestions,
    isLastQuestion,
    isFirstQuestion,
    examResult,
    startExam,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    finishExam
  }
})
