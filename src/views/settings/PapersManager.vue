<template>
  <div class="papers-manager">
    <div class="manager-header">
      <h2>试卷管理</h2>
    </div>

    <div class="hierarchy-selector">
      <el-card class="selector-card">
        <template #header>
          <div class="card-header">
            <span>选择层级</span>
          </div>
        </template>
        <div class="selector-content">
          <div class="selector-item">
            <span class="label">组织：</span>
            <el-select
              v-model="selectedOrganizationId"
              placeholder="请选择组织"
              style="width: 100%"
              @change="handleOrganizationChange"
            >
              <el-option
                v-for="org in organizations"
                :key="org.id"
                :label="org.name"
                :value="org.id"
              />
            </el-select>
          </div>

          <div class="selector-item">
            <span class="label">类别：</span>
            <el-select
              v-model="selectedCategoryId"
              placeholder="请选择类别"
              style="width: 100%"
              :disabled="!selectedOrganizationId"
              @change="handleCategoryChange"
            >
              <el-option
                v-for="cat in filteredCategories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              />
            </el-select>
          </div>

          <div class="selector-item">
            <span class="label">级别：</span>
            <el-select
              v-model="selectedLevelId"
              placeholder="请选择级别"
              style="width: 100%"
              :disabled="!selectedCategoryId"
              @change="handleLevelChange"
            >
              <el-option
                v-for="level in filteredLevels"
                :key="level.id"
                :label="level.name"
                :value="level.id"
              />
            </el-select>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="selectedLevelId" class="papers-section">
      <div class="papers-header">
        <h3>{{ getCurrentLevelName() }} 试卷列表</h3>
        <div class="papers-actions">
          <el-upload
            class="upload-demo"
            action="#"
            :http-request="handleFileUpload"
            :show-file-list="false"
            accept=".json"
          >
            <el-button type="primary">上传试卷JSON</el-button>
          </el-upload>
          <el-button type="success" @click="showAddDialog">添加试卷</el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="papers"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column prop="name" label="名称" />
        <el-table-column label="操作" width="300">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="success"
              @click="handleView(scope.row)"
            >
              查看题目
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑试卷' : '添加试卷'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="ID" prop="id" :disabled="isEdit">
          <el-input v-model="form.id" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item v-if="isEdit" label="题目数量">
          <span>{{ currentPaper?.questions?.length || 0 }} 题</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看题目对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="试卷题目"
      width="800px"
    >
      <div v-if="currentPaper">
        <h3>{{ currentPaper.name }}</h3>
        <p>共 {{ currentPaper.questions?.length || 0 }} 题</p>

        <div class="question-actions">
          <el-button type="primary" @click="showAddQuestionDialog">添加题目</el-button>
          <el-button type="primary" @click="sortQuestions">题目排序</el-button>
        </div>

        <el-collapse>
          <el-collapse-item
            v-for="(question, index) in currentPaper.questions"
            :key="question.id"
            :title="`${index + 1}. ${question.title.substring(0, 50)}${question.title.length > 50 ? '...' : ''}`"
          >
            <div class="question-detail">
              <div class="question-actions">
                <el-button size="small" type="primary" @click="handleEditQuestion(question, index)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteQuestion(question, index)">删除</el-button>
              </div>

              <p><strong>题目类型：</strong> {{ getQuestionTypeName(question.type) }}</p>
              <p><strong>题目内容：</strong> {{ question.title }}</p>

              <div v-if="question.image" class="question-image">
                <img :src="question.image" alt="题目图片" style="max-width: 100%; max-height: 300px;">
              </div>

              <div class="question-options">
                <p><strong>选项：</strong></p>
                <ul>
                  <li v-for="option in question.options" :key="option.id">
                    {{ option.id }}: {{ option.text }}
                    <img v-if="option.image" :src="option.image" alt="选项图片" style="max-width: 100px; max-height: 60px;">
                  </li>
                </ul>
              </div>

              <p><strong>答案：</strong> {{ Array.isArray(question.answer) ? question.answer.join(', ') : question.answer }}</p>
              <p><strong>解析：</strong> {{ question.explanation }}</p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
    >
      <p>确定要删除试卷 "{{ currentPaperMeta?.name }}" 吗？此操作不可恢复。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确定删除</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 题目删除确认对话框 -->
    <el-dialog
      v-model="deleteQuestionDialogVisible"
      title="确认删除题目"
      width="400px"
    >
      <p>确定要删除这道题目吗？此操作不可恢复。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteQuestionDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDeleteQuestion">确定删除</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 题目编辑/添加对话框 -->
    <el-dialog
      v-model="questionDialogVisible"
      :title="isEditQuestion ? '编辑题目' : '添加题目'"
      width="800px"
    >
      <el-form
        ref="questionFormRef"
        :model="questionForm"
        :rules="questionRules"
        label-width="100px"
      >
        <el-form-item label="题目类型" prop="type">
          <el-select v-model="questionForm.type" placeholder="请选择题目类型">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="truefalse" />
          </el-select>
        </el-form-item>

        <el-form-item label="题目内容" prop="title">
          <el-input v-model="questionForm.title" type="textarea" :rows="3" placeholder="请输入题目内容" />
        </el-form-item>

        <el-form-item label="题目图片" prop="image">
          <el-input v-model="questionForm.image" placeholder="请输入图片URL（可选）" />
        </el-form-item>

        <el-divider>选项</el-divider>

        <div v-for="(option, index) in questionForm.options" :key="index" class="option-item">
          <el-row :gutter="20">
            <el-col :span="4">
              <el-form-item :label="`选项${option.id}`" :prop="`options.${index}.id`">
                <el-input v-model="option.id" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item label="选项内容" :prop="`options.${index}.text`">
                <el-input v-model="option.text" placeholder="请输入选项内容" />
              </el-form-item>
            </el-col>
            <el-col :span="4" class="option-actions">
              <el-button v-if="index > 1" type="danger" @click="removeOption(index)">删除</el-button>
            </el-col>
          </el-row>
          <el-form-item label="选项图片" :prop="`options.${index}.image`">
            <el-input v-model="option.image" placeholder="请输入图片URL（可选）" />
          </el-form-item>
        </div>

        <el-form-item>
          <el-button type="primary" @click="addOption">添加选项</el-button>
        </el-form-item>

        <el-divider></el-divider>

        <el-form-item label="正确答案" prop="answer">
          <el-select
            v-if="questionForm.type === 'single' || questionForm.type === 'truefalse'"
            v-model="questionForm.answer"
            placeholder="请选择正确答案"
          >
            <el-option
              v-for="option in questionForm.options"
              :key="option.id"
              :label="option.id"
              :value="option.id"
            />
          </el-select>
          <el-select
            v-else
            v-model="questionForm.answer"
            multiple
            placeholder="请选择正确答案（可多选）"
          >
            <el-option
              v-for="option in questionForm.options"
              :key="option.id"
              :label="option.id"
              :value="option.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="解析" prop="explanation">
          <el-input v-model="questionForm.explanation" type="textarea" :rows="3" placeholder="请输入解析内容" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="questionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitQuestionForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 题目排序对话框 -->
    <el-dialog
      v-model="sortDialogVisible"
      title="题目排序"
      width="80%"
    >
      <div v-if="showQuestionTypeWarning" class="sort-warning">
        <el-alert
          title="题型顺序不规范"
          type="warning"
          description="当前试卷的题型顺序不规范，建议按照单选题、多选题、判断题的顺序排列。"
          show-icon
          :closable="false"
        />
        <div class="auto-sort-button">
          <el-button type="primary" @click="autoSortQuestions">自动排序</el-button>
        </div>
      </div>
      
      <el-table :data="currentPaper?.questions || []" style="width: 100%">
        <el-table-column type="index" width="50" />
        <el-table-column label="题型" width="100">
          <template #default="scope">
            {{ getQuestionTypeName(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column label="题目内容" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.title }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              icon="ArrowUp" 
              circle 
              @click="moveQuestion(scope.$index, 'up')"
              :disabled="scope.$index === 0"
            />
            <el-button 
              type="primary" 
              size="small" 
              icon="ArrowDown" 
              circle 
              @click="moveQuestion(scope.$index, 'down')"
              :disabled="scope.$index === currentPaper?.questions.length - 1"
            />
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="sortDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSortedQuestions">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import type { Paper, Level, Category, Organization } from '@/types/question'
import * as apiService from '@/services/apiService'
import { QuestionType } from '@/types/question'

const organizations = ref<Organization[]>([])
const categories = ref<Category[]>([])
const levels = ref<Level[]>([])
const papers = ref<Paper[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const currentPaperMeta = ref<Paper | null>(null)
const currentPaper = ref<Paper | null>(null)
const formRef = ref<FormInstance>()

// 题目管理相关状态
const questionDialogVisible = ref(false)
const deleteQuestionDialogVisible = ref(false)
const isEditQuestion = ref(false)
const currentQuestionIndex = ref(-1)
const questionFormRef = ref<FormInstance>()

// 添加排序对话框状态
const sortDialogVisible = ref(false)
const showQuestionTypeWarning = ref(false)

const selectedOrganizationId = ref('')
const selectedCategoryId = ref('')
const selectedLevelId = ref('')

const form = reactive({
  id: '',
  name: '',
  levelId: '',
  questions: [] as any[]
})

// 题目表单
const questionForm = reactive({
  id: '',
  type: 'single',
  title: '',
  image: '',
  options: [
    { id: 'A', text: '', image: '' },
    { id: 'B', text: '', image: '' }
  ],
  answer: '',
  explanation: ''
})

const filteredCategories = computed(() => {
  if (!selectedOrganizationId.value) return []
  return categories.value.filter(cat => cat.organizationId === selectedOrganizationId.value)
})

const filteredLevels = computed(() => {
  if (!selectedCategoryId.value) return []
  return levels.value.filter(level => level.categoryId === selectedCategoryId.value)
})

const rules = reactive<FormRules>({
  id: [
    { required: true, message: '请输入试卷ID', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: 'ID只能包含小写字母、数字和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入试卷名称', trigger: 'blur' }
  ]
})

// 题目表单验证规则
const questionRules = reactive<FormRules>({
  type: [
    { required: true, message: '请选择题目类型', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入题目内容', trigger: 'blur' }
  ],
  answer: [
    { required: true, message: '请选择正确答案', trigger: 'change' }
  ],
  explanation: [
    { required: true, message: '请输入解析内容', trigger: 'blur' }
  ]
})

// 初始化数据
async function initData() {
  try {
    const [orgs, cats, lvls] = await Promise.all([
      apiService.getOrganizations(),
      apiService.getCategories(),
      apiService.getLevels()
    ])

    organizations.value = orgs
    categories.value = cats
    levels.value = lvls
  } catch (error) {
    ElMessage.error('初始化数据失败')
    console.error('Failed to initialize data:', error)
  }
}

// 加载试卷列表
async function loadPapers() {
  if (!selectedLevelId.value) return

  loading.value = true
  try {
    papers.value = await apiService.getPapersByLevel(selectedLevelId.value)
  } catch (error) {
    ElMessage.error('获取试卷列表失败')
    console.error('Failed to load papers:', error)
  } finally {
    loading.value = false
  }
}

// 处理组织变更
function handleOrganizationChange() {
  selectedCategoryId.value = ''
  selectedLevelId.value = ''
  papers.value = []
}

// 处理类别变更
function handleCategoryChange() {
  selectedLevelId.value = ''
  papers.value = []
}

// 处理级别变更
function handleLevelChange() {
  loadPapers()
}

// 获取当前级别名称
function getCurrentLevelName(): string {
  const level = levels.value.find(l => l.id === selectedLevelId.value)
  return level ? level.name : ''
}

// 获取题目类型名称
function getQuestionTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    'single': '单选题',
    'multiple': '多选题',
    'truefalse': '判断题'
  }
  return typeMap[type] || type
}

// 显示添加对话框
function showAddDialog() {
  isEdit.value = false
  resetForm()
  form.levelId = selectedLevelId.value
  dialogVisible.value = true
}

// 处理编辑
async function handleEdit(row: Paper) {
  isEdit.value = true
  currentPaperMeta.value = row

  try {
    loading.value = true
    const paperData = await apiService.getPaper(row.id)
    currentPaper.value = paperData

    resetForm()
    form.id = paperData.id
    form.name = paperData.name
    form.levelId = paperData.levelId
    form.questions = paperData.questions

    dialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取试卷详情失败')
    console.error('Failed to get paper details:', error)
  } finally {
    loading.value = false
  }
}

// 处理查看
async function handleView(row: Paper) {
  currentPaperMeta.value = row

  try {
    loading.value = true
    const paperData = await apiService.getPaper(row.id)
    currentPaper.value = paperData
    viewDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取试卷详情失败')
    console.error('Failed to get paper details:', error)
  } finally {
    loading.value = false
  }
}

// 处理删除
function handleDelete(row: Paper) {
  currentPaperMeta.value = row
  deleteDialogVisible.value = true
}

// 确认删除
async function confirmDelete() {
  if (!currentPaperMeta.value) return

  try {
    await apiService.deletePaper(currentPaperMeta.value.id)
    ElMessage.success('删除成功')
    await loadPapers()
    deleteDialogVisible.value = false
  } catch (error) {
    ElMessage.error('删除失败')
    console.error('Failed to delete paper:', error)
  }
}

// 重置表单
function resetForm() {
  form.id = ''
  form.name = ''
  form.levelId = ''
  form.questions = []
}

// 修改submitForm函数
async function submitForm() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const paperData: Paper = {
          id: form.id,
          name: form.name,
          levelId: form.levelId,
          questions: form.questions
        }

        // 如果是编辑模式且试卷中有题目，则验证题型顺序
        if (isEdit.value && paperData.questions.length > 0) {
          // 检查题型顺序是否合规
          if (!validateQuestionTypeOrder(paperData.questions)) {
            const suggested = getSuggestedQuestionOrder(paperData.questions);
            
            try {
              await ElMessageBox.confirm(
                '当前试卷的题型顺序不规范，建议按照单选题、多选题、判断题的顺序排列。是否自动调整题目顺序？',
                '题型顺序警告',
                {
                  confirmButtonText: '自动调整',
                  cancelButtonText: '手动调整',
                  type: 'warning'
                }
              );
              
              // 用户选择自动调整
              paperData.questions = suggested;
              ElMessage.success('已自动调整题目顺序');
            } catch (e) {
              // 用户选择手动调整，展示建议
              ElMessage.warning('请手动调整题目顺序，确保同一题型的题目连续排列');
              return;
            }
          }
        }

        if (isEdit.value) {
          await apiService.updatePaper(paperData)
          ElMessage.success('更新成功')
        } else {
          // 新建试卷时，初始化空的题目列表
          paperData.questions = []
          await apiService.createPaper(paperData)
          ElMessage.success('添加成功')
        }

        dialogVisible.value = false
        await loadPapers()
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          ElMessage.error('ID已存在，请使用其他ID')
        } else {
          ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
        }
        console.error('Failed to save paper:', error)
      }
    }
  })
}

// 处理文件上传
async function handleFileUpload(options: any) {
  if (!selectedLevelId.value) {
    ElMessage.error('请先选择级别')
    return
  }

  const file = options.file

  if (!file) {
    ElMessage.error('请选择文件')
    return
  }

  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    ElMessage.error('请上传JSON格式的文件')
    return
  }

  try {
    loading.value = true
    await apiService.uploadPaperFile(file, selectedLevelId.value)
    ElMessage.success('上传成功')
    await loadPapers()
  } catch (error: any) {
    ElMessage.error(`上传失败: ${error.message}`)
    console.error('Failed to upload paper:', error)
  } finally {
    loading.value = false
  }
}

// 初始化
initData()

// 题目管理相关方法

// 重置题目表单
function resetQuestionForm() {
  questionForm.id = generateQuestionId()
  questionForm.type = 'single'
  questionForm.title = ''
  questionForm.image = ''
  questionForm.options = [
    { id: 'A', text: '', image: '' },
    { id: 'B', text: '', image: '' }
  ]
  questionForm.answer = ''
  questionForm.explanation = ''
}

// 生成题目 ID
function generateQuestionId() {
  return 'q-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// 添加选项
function addOption() {
  const optionIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const nextIndex = questionForm.options.length

  if (nextIndex < optionIds.length) {
    questionForm.options.push({
      id: optionIds[nextIndex],
      text: '',
      image: ''
    })
  } else {
    ElMessage.warning('最多只能添加8个选项')
  }
}

// 删除选项
function removeOption(index: number) {
  // 至少保留两个选项
  if (questionForm.options.length > 2) {
    questionForm.options.splice(index, 1)

    // 如果删除的选项是答案，需要重置答案
    if (questionForm.type === 'single' || questionForm.type === 'truefalse') {
      const deletedOptionId = questionForm.options[index]?.id
      if (questionForm.answer === deletedOptionId) {
        questionForm.answer = ''
      }
    } else if (Array.isArray(questionForm.answer)) {
      const deletedOptionId = questionForm.options[index]?.id
      // @ts-ignore
      questionForm.answer = questionForm.answer.filter(id => id !== deletedOptionId)
    }
  } else {
    ElMessage.warning('至少需要两个选项')
  }
}

// 显示添加题目对话框
function showAddQuestionDialog() {
  isEditQuestion.value = false
  currentQuestionIndex.value = -1
  resetQuestionForm()
  questionDialogVisible.value = true
}

// 处理编辑题目
function handleEditQuestion(question: any, index: number) {
  isEditQuestion.value = true
  currentQuestionIndex.value = index

  // 复制题目数据到表单
  questionForm.id = question.id
  questionForm.type = question.type
  questionForm.title = question.title
  questionForm.image = question.image || ''
  questionForm.options = JSON.parse(JSON.stringify(question.options))
  questionForm.answer = question.answer
  questionForm.explanation = question.explanation

  questionDialogVisible.value = true
}

// 处理删除题目
function handleDeleteQuestion(_question: any, index: number) {
  currentQuestionIndex.value = index
  deleteQuestionDialogVisible.value = true
}

// 确认删除题目
async function confirmDeleteQuestion() {
  if (currentQuestionIndex.value === -1 || !currentPaper.value) return

  try {
    // 从试卷中删除题目
    currentPaper.value.questions.splice(currentQuestionIndex.value, 1)

    // 更新试卷
    await apiService.updatePaper(currentPaper.value)

    ElMessage.success('删除题目成功')
    deleteQuestionDialogVisible.value = false
  } catch (error) {
    ElMessage.error('删除题目失败')
    console.error('Failed to delete question:', error)
  }
}

// 添加题目顺序验证函数
function validateQuestionTypeOrder(questions) {
  if (!questions || questions.length <= 1) return true;
  
  // 记录当前题型和上一个题型
  let currentType = questions[0].type;
  let typeChanges = 0;
  
  // 检查题型变化次数
  for (let i = 1; i < questions.length; i++) {
    if (questions[i].type !== currentType) {
      currentType = questions[i].type;
      typeChanges++;
    }
  }
  
  // 如果题型变化次数大于等于题型数量，说明题型有穿插
  const uniqueTypes = new Set(questions.map(q => q.type));
  return typeChanges < uniqueTypes.size;
}

// 获取题型顺序建议
function getSuggestedQuestionOrder(questions) {
  if (!questions || questions.length === 0) return [];
  
  // 按题型分组
  const groups = {
    'single': [],
    'multiple': [],
    'truefalse': []
  };
  
  questions.forEach(q => {
    if (groups[q.type]) {
      groups[q.type].push({...q});
    }
  });
  
  // 推荐顺序：单选题 -> 多选题 -> 判断题
  return [
    ...groups['single'], 
    ...groups['multiple'], 
    ...groups['truefalse']
  ];
}

// 修改submitQuestionForm函数
async function submitQuestionForm() {
  if (!questionFormRef.value || !currentPaper.value) return;

  await questionFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const question = {
          id: questionForm.id,
          type: questionForm.type,
          title: questionForm.title,
          image: questionForm.image || '',
          options: JSON.parse(JSON.stringify(questionForm.options)),
          answer: questionForm.answer,
          explanation: questionForm.explanation
        };

        if (isEditQuestion.value) {
          // 编辑现有题目
          currentPaper.value.questions[currentQuestionIndex.value] = question;
        } else {
          // 添加新题目
          currentPaper.value.questions.push(question);
        }

        // 检查题型顺序是否合规
        if (!validateQuestionTypeOrder(currentPaper.value.questions)) {
          const suggested = getSuggestedQuestionOrder(currentPaper.value.questions);
          
          try {
            await ElMessageBox.confirm(
              '当前试卷的题型顺序不规范，建议按照单选题、多选题、判断题的顺序排列。是否自动调整题目顺序？',
              '题型顺序警告',
              {
                confirmButtonText: '自动调整',
                cancelButtonText: '手动调整',
                type: 'warning'
              }
            );
            
            // 用户选择自动调整
            currentPaper.value.questions = suggested;
            ElMessage.success('已自动调整题目顺序');
          } catch (e) {
            // 用户选择手动调整，展示建议
            ElMessage.warning('请手动调整题目顺序，确保同一题型的题目连续排列');
            questionDialogVisible.value = false;
            return;
          }
        }

        // 更新试卷
        await apiService.updatePaper(currentPaper.value);
        
        ElMessage.success(isEditQuestion.value ? '编辑题目成功' : '添加题目成功');
        questionDialogVisible.value = false;
      } catch (error) {
        ElMessage.error(isEditQuestion.value ? '编辑题目失败' : '添加题目失败');
        console.error('Failed to save question:', error);
      }
    }
  });
}

// 重排题目函数
function sortQuestions() {
  if (!currentPaper.value) return
  
  sortDialogVisible.value = true
  showQuestionTypeWarning.value = !validateQuestionTypeOrder(currentPaper.value.questions)
}

// 按题型自动排序
async function autoSortQuestions() {
  if (!currentPaper.value) return
  
  // 使用推荐顺序排序
  const suggested = getSuggestedQuestionOrder(currentPaper.value.questions)
  currentPaper.value.questions = suggested
  
  try {
    // 更新试卷
    await apiService.updatePaper(currentPaper.value)
    ElMessage.success('题目排序成功')
    sortDialogVisible.value = false
  } catch (error) {
    ElMessage.error('题目排序失败')
    console.error('Failed to sort questions:', error)
  }
}

// 移动题目位置
async function moveQuestion(index: number, direction: 'up' | 'down') {
  if (!currentPaper.value || !currentPaper.value.questions) return
  
  const questions = currentPaper.value.questions
  const newIndex = direction === 'up' ? index - 1 : index + 1
  
  // 检查是否可以移动
  if (newIndex < 0 || newIndex >= questions.length) return
  
  // 交换位置
  const temp = questions[index]
  questions[index] = questions[newIndex]
  questions[newIndex] = temp
  
  // 检查题型顺序
  showQuestionTypeWarning.value = !validateQuestionTypeOrder(questions)
}

// 保存排序结果
async function saveSortedQuestions() {
  if (!currentPaper.value) return
  
  try {
    // 更新试卷
    await apiService.updatePaper(currentPaper.value)
    ElMessage.success('题目排序保存成功')
    sortDialogVisible.value = false
  } catch (error) {
    ElMessage.error('题目排序保存失败')
    console.error('Failed to save sorted questions:', error)
  }
}

// 监听级别变化
watch(selectedLevelId, (newVal) => {
  if (newVal) {
    loadPapers()
  }
})
</script>

<style scoped>
.papers-manager {
  width: 100%;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.manager-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #303133;
}

.hierarchy-selector {
  margin-bottom: 2rem;
}

.selector-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selector-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.selector-item {
  flex: 1;
  min-width: 200px;
}

.selector-item .label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.papers-section {
  margin-top: 2rem;
}

.papers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.papers-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #303133;
}

.papers-actions {
  display: flex;
  gap: 1rem;
}

.question-detail {
  padding: 0.5rem;
}

.question-options {
  margin: 1rem 0;
}

.question-image {
  margin: 1rem 0;
  text-align: center;
}

.question-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}

.option-item {
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f8f8f8;
}

.option-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.sort-warning {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.auto-sort-button {
  margin-top: 10px;
}

@media (max-width: 768px) {
  .selector-content {
    flex-direction: column;
  }

  .papers-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>
