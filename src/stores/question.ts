import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Paper, UserAnswer, ExamResult, Organization, Category, Level } from '@/types/question'
import * as dataService from '@/services/dataService'

export const useQuestionStore = defineStore('question', () => {
  // 数据存储
  const organizationList = ref<Organization[]>([])
  const categoryList = ref<Category[]>([])
  const levelList = ref<Level[]>([])
  const papers = ref<Paper[]>([])

  // 加载状态
  const loading = ref<boolean>(false)
  const paperCache = ref<Record<string, Paper>>({}) // 缓存已加载的试卷

  // 选择状态
  const selectedOrganizationId = ref<string>('')
  const selectedCategoryId = ref<string>('')
  const selectedLevelId = ref<string>('')
  const currentPaperId = ref<string>('')

  // 考试状态
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

  async function startExam(paperId: string, mode: 'tutorial' | 'exam') {
    loading.value = true
    try {
      // 先清除旧的考试状态，避免状态混淆
      // 但保留当前选择的组织、类别、级别信息
      currentQuestionIndex.value = 0
      userAnswers.value = {}
      examStartTime.value = null
      examEndTime.value = null

      // 设置当前试卷
      await selectPaper(paperId)

      // 初始化考试状态
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

      // 设置级别、类别和组织
      if (currentPaper.value) {
        // 设置级别
        const level = levelList.value.find(l => l.id === currentPaper.value?.levelId)
        if (level) {
          selectedLevelId.value = level.id

          // 设置类别
          const category = categoryList.value.find(c => c.id === level.categoryId)
          if (category) {
            selectedCategoryId.value = category.id

            // 设置组织
            const organization = organizationList.value.find(o => o.id === category.organizationId)
            if (organization) {
              selectedOrganizationId.value = organization.id
            }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to start exam with paper ${paperId}:`, error)
    } finally {
      loading.value = false
    }
  }

  function submitAnswer(questionId: string, answer: string | string[]) {
    const question = currentPaper.value?.questions.find(q => q.id === questionId)
    if (!question) return

    const isCorrect = Array.isArray(question.answer)
      ? JSON.stringify(Array.isArray(answer) ? [...answer].sort() : []) === JSON.stringify([...question.answer].sort())
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

  // 清除考试状态
  function clearExamState() {
    console.log('Clearing exam state...')

    try {
      // 重置考试相关状态
      currentQuestionIndex.value = 0
      userAnswers.value = {}
      examStartTime.value = null
      examEndTime.value = null
      examMode.value = 'tutorial'

      // 清除所有试卷缓存，确保完全重置
      console.log('Clearing all paper cache')
      Object.keys(paperCache.value).forEach(key => {
        delete paperCache.value[key]
      })
      paperCache.value = {}

      // 重置当前试卷ID
      currentPaperId.value = ''

      console.log('Exam state cleared successfully')
    } catch (error) {
      console.error('Error clearing exam state:', error)
    }
  }

  // 组织相关的计算属性和方法
  const filteredCategories = computed(() => {
    if (!selectedOrganizationId.value) return []
    return categoryList.value.filter(category => category.organizationId === selectedOrganizationId.value)
  })

  const filteredLevels = computed(() => {
    if (!selectedCategoryId.value) return []
    return levelList.value.filter(level => level.categoryId === selectedCategoryId.value)
  })

  const filteredPapers = computed(() => {
    if (!selectedLevelId.value) return []
    return papers.value.filter(paper => paper.levelId === selectedLevelId.value)
  })

  // 选择组织
  function selectOrganization(organizationId: string) {
    selectedOrganizationId.value = organizationId
    // 重置下级选择
    selectedCategoryId.value = ''
    selectedLevelId.value = ''
    currentPaperId.value = ''

    // 自动选择第一个类别（如果有）
    const firstCategory = filteredCategories.value[0]
    if (firstCategory) {
      selectCategory(firstCategory.id)
    }
  }

  // 选择类别
  function selectCategory(categoryId: string) {
    selectedCategoryId.value = categoryId
    // 重置下级选择
    selectedLevelId.value = ''
    currentPaperId.value = ''

    // 自动选择第一个级别（如果有）
    const firstLevel = filteredLevels.value[0]
    if (firstLevel) {
      selectLevel(firstLevel.id)
    }
  }

  // 选择级别
  async function selectLevel(levelId: string) {
    selectedLevelId.value = levelId
    // 重置试卷选择
    currentPaperId.value = ''

    loading.value = true
    try {
      // 加载该级别下的试卷元数据
      const levelPapers = await dataService.loadPapersByLevel(levelId)

      // 更新试卷列表
      const existingPapers = papers.value.filter(p => p.levelId !== levelId)
      papers.value = [...existingPapers, ...levelPapers]

      // 自动选择第一个试卷（如果有）
      const firstPaper = levelPapers[0]
      if (firstPaper) {
        selectPaper(firstPaper.id)
      }
    } catch (error) {
      console.error(`Failed to load papers for level ${levelId}:`, error)
    } finally {
      loading.value = false
    }
  }

  // 选择试卷
  async function selectPaper(paperId: string) {
    // 如果当前有选中的试卷，且与要选择的不同，则清除旧的缓存
    const oldPaperId = currentPaperId.value
    if (oldPaperId && oldPaperId !== paperId && paperCache.value[oldPaperId]) {
      console.log(`Switching papers from ${oldPaperId} to ${paperId}, clearing old cache`)
      delete paperCache.value[oldPaperId]
    }

    currentPaperId.value = paperId

    // 如果试卷已经在缓存中，不需要重新加载
    if (paperCache.value[paperId]) {
      console.log(`Paper ${paperId} found in cache, using cached version`)
      return
    }

    loading.value = true
    try {
      // 加载试卷详细数据
      const paperData = await dataService.loadPaper(paperId)
      if (paperData) {
        // 更新缓存
        paperCache.value[paperId] = paperData

        // 更新试卷列表中的试卷数据
        const paperIndex = papers.value.findIndex(p => p.id === paperId)
        if (paperIndex !== -1) {
          papers.value[paperIndex] = paperData
        } else {
          papers.value.push(paperData)
        }
      }
    } catch (error) {
      console.error(`Failed to load paper ${paperId}:`, error)
    } finally {
      loading.value = false
    }
  }

  // 获取当前选中的组织
  const currentOrganization = computed(() => {
    if (!selectedOrganizationId.value) return null
    return organizationList.value.find(org => org.id === selectedOrganizationId.value) || null
  })

  // 获取当前选中的类别
  const currentCategory = computed(() => {
    if (!selectedCategoryId.value) return null
    return categoryList.value.find(cat => cat.id === selectedCategoryId.value) || null
  })

  // 获取当前选中的级别
  const currentLevel = computed(() => {
    if (!selectedLevelId.value) return null
    return levelList.value.find(level => level.id === selectedLevelId.value) || null
  })

  // 初始化选择
  async function initSelection() {
    loading.value = true
    try {
      // 加载基础数据
      const { organizations, categories, levels } = await dataService.loadAllBaseData()
      organizationList.value = organizations
      categoryList.value = categories
      levelList.value = levels

      // 如果有组织，选择第一个
      const firstOrg = organizationList.value[0]
      if (firstOrg) {
        selectOrganization(firstOrg.id)
      }
    } catch (error) {
      console.error('Failed to initialize data:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    // 数据列表
    organizationList,
    categoryList,
    levelList,
    papers,

    // 选择状态
    selectedOrganizationId,
    selectedCategoryId,
    selectedLevelId,
    currentPaperId,

    // 考试状态
    currentQuestionIndex,
    userAnswers,
    examStartTime,
    examEndTime,
    examMode,
    loading,

    // 计算属性
    filteredCategories,
    filteredLevels,
    filteredPapers,
    currentOrganization,
    currentCategory,
    currentLevel,
    currentPaper,
    currentQuestion,
    totalQuestions,
    isLastQuestion,
    isFirstQuestion,
    examResult,

    // 方法
    selectOrganization,
    selectCategory,
    selectLevel,
    selectPaper,
    initSelection,
    startExam,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    finishExam,
    clearExamState
  }
})
