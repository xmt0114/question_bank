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
            :title="`${index + 1}. ${getQuestionTitle(question)}`"
          >
            <div class="question-detail">
              <div class="question-actions">
                <el-button size="small" type="primary" @click="handleEditQuestion(question, index)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteQuestion(question, index)">删除</el-button>
              </div>

              <p><strong>题目类型：</strong> {{ getQuestionTypeName(question.type) }}</p>
              
              <!-- 普通题目显示标题文本 -->
              <p v-if="question.type !== 'handson'"><strong>题目内容：</strong> {{ question.title }}</p>
              
              <!-- 实操题显示富文本内容（精简版） -->
              <div v-else>
                <p><strong>题目内容：</strong></p>
                <div class="rich-content-preview-compact" v-html="question.richContent"></div>
              </div>

              <div v-if="question.images && question.images.length > 0" class="question-image">
                <div v-for="(img, imgIndex) in question.images" :key="imgIndex" class="image-item">
                  <img :src="img" alt="题目图片" style="max-width: 100%; max-height: 300px;">
                </div>
              </div>

              <div v-if="question.type !== 'handson'" class="question-options">
                <p><strong>选项：</strong></p>
                <ul>
                  <li v-for="option in question.options" :key="option.id">
                    {{ option.id }}: {{ option.text }}
                    <div v-if="option.images && option.images.length > 0" class="option-images">
                      <img v-for="(_, imgIndex) in option.images" :key="imgIndex" :src="option.images[imgIndex]" alt="选项图片" style="max-width: 100px; max-height: 60px; margin-right: 5px;">
                    </div>
                  </li>
                </ul>
              </div>

              <p v-if="question.type !== 'handson'"><strong>答案：</strong> {{ Array.isArray(question.answer) ? question.answer.join(', ') : question.answer }}</p>
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
        <el-form-item label="题目类型">
          <el-select v-model="questionForm.type">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
            <el-option label="判断题" value="truefalse" />
            <el-option label="实操题" value="handson" />
          </el-select>
        </el-form-item>

        <!-- 非实操题的题目内容 -->
        <el-form-item v-if="questionForm.type !== 'handson'" label="题目内容" prop="title">
          <el-input v-model="questionForm.title" type="textarea" :rows="3" placeholder="请输入题目内容" />
        </el-form-item>

        <!-- 实操题的富文本编辑器 -->
        <el-form-item v-if="questionForm.type === 'handson'" label="富文本内容" prop="richContent">
          <div class="rich-editor-container">
            <el-alert
              title="支持编辑带格式的内容（图片、表格等）"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 10px;"
            />
            
            <!-- WangEditor 编辑器组件 -->
            <div class="editor-container">
              <Toolbar
                style="border-bottom: 1px solid #ccc"
                :editor="editorRef"
                :defaultConfig="toolbarConfig"
                :mode="mode"
              />
              <Editor
                style="height: 300px; overflow-y: hidden;"
                v-model="editorHtml"
                :defaultConfig="editorConfig"
                :mode="mode"
                @onCreated="handleCreated"
                @onChange="handleEditorChange"
              />
            </div>
            
            <div class="preview-header">预览</div>
            <div class="rich-content-preview-compact" v-html="questionForm.richContent"></div>
          </div>
        </el-form-item>

        <el-form-item label="题目图片" prop="images">
          <!-- 仅在非实操题时显示 -->
          <div v-if="questionForm.type !== 'handson'" class="image-container">
            <div v-for="(_, imgIndex) in questionForm.images" :key="imgIndex" class="image-input-item">
              <el-input v-model="questionForm.images[imgIndex]" placeholder="请输入图片URL">
                <template #append>
                  <el-button type="danger" @click="removeImage(imgIndex)">删除</el-button>
                </template>
              </el-input>
            </div>
            <div class="add-image-button">
              <el-button type="primary" @click="addImage">添加图片</el-button>
            </div>
          </div>
        </el-form-item>

        <el-divider>选项</el-divider>

        <template v-if="questionForm.type !== 'handson'">
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
            <el-form-item label="选项图片" :prop="`options.${index}.images`">
              <div class="image-container">
                <div v-for="(_, imgIndex) in option.images" :key="imgIndex" class="image-input-item">
                  <el-input v-model="option.images[imgIndex]" placeholder="请输入图片URL">
                    <template #append>
                      <el-button type="danger" @click="removeOptionImage(index, imgIndex)">删除</el-button>
                    </template>
                  </el-input>
                </div>
                <div class="add-image-button">
                  <el-button type="primary" @click="addOptionImage(index)">添加图片</el-button>
                </div>
              </div>
            </el-form-item>
          </div>

          <el-form-item>
            <el-button type="primary" @click="addOption">添加选项</el-button>
          </el-form-item>
        </template>

        <el-divider></el-divider>

        <el-form-item :label="questionForm.type === 'multiple' ? '正确答案（多选）' : '正确答案'">
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
            {{ getQuestionTitle(scope.row) }}
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
              :disabled="scope.$index === (currentPaper?.questions?.length ?? 0) - 1"
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
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, onActivated } from 'vue'
import { ElMessage, ElMessageBox, ElLoading, FormInstance, FormRules } from 'element-plus'
import * as apiService from '@/services/apiService'
import type { Organization, Category, Level, Paper, Question } from '@/types/question'
import { QuestionType } from '@/types/question'
// 引入WangEditor
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IEditorConfig, IToolbarConfig, IDomEditor } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'

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
  images: [] as string[],
  richContent: '',
  options: [
    { id: 'A', text: '', images: [] as string[] },
    { id: 'B', text: '', images: [] as string[] }
  ],
  answer: '',
  explanation: ''
})

// WangEditor 相关变量
const editorRef = ref<IDomEditor | null>(null)
const editorHtml = ref('')
const mode = ref('default') // 编辑器模式，默认为default
const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: [
    'uploadVideo', // 禁用视频上传
    'insertVideo', // 禁用视频插入
    'group-video', // 禁用视频分组
    'insertLink', // 禁用插入链接
    'group-link' // 禁用链接分组
  ]
}
const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    // 图片上传配置
    uploadImage: {
      // 自定义上传图片的回调函数
      customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
        // 创建FormData对象
        const formData = new FormData();
        formData.append('file', file);
        
        // 显示上传中提示
        const loading = ElLoading.service({
          lock: true,
          text: '图片上传中...',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        
        // 调用上传API
        apiService.uploadImage(formData)
          .then((res: any) => {
            // 获取图片URL并插入编辑器
            const url = res.url;
            insertFn(url, file.name, url);
            ElMessage.success('图片上传成功');
          })
          .catch((err: any) => {
            console.error('图片上传失败:', err);
            ElMessage.error('图片上传失败');
            
            // 如果上传失败，使用base64作为备选方案
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const url = reader.result as string;
              insertFn(url, file.name, url);
              ElMessage.warning('已使用本地图片，但不会保存到服务器');
            };
          })
          .finally(() => {
            loading.close();
          });
      }
    }
  }
}

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
    { 
      required: true, 
      message: '请输入题目内容', 
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        // 如果是实操题且有富文本内容，可以自动提取标题
        if (questionForm.type === 'handson' && questionForm.richContent && !value) {
          updateTitleFromRichContent();
          if (questionForm.title) {
            callback();
            return;
          }
        }
        
        if (value) {
          callback();
        } else {
          if (questionForm.type === 'handson') {
            callback(new Error('请输入题目内容或填写富文本内容'));
          } else {
            callback(new Error('请输入题目内容'));
          }
        }
      }
    }
  ],
  richContent: [
    {
      validator: (_rule, value, callback) => {
        // 如果是实操题，富文本内容是必填的
        if (questionForm.type === 'handson' && !value) {
          callback(new Error('实操题请填写富文本内容'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  answer: [
    { 
      required: true, 
      message: '请选择正确答案', 
      trigger: 'change',
      // 只有非实操题才需要答案
      validator: (_rule, value, callback) => {
        if (questionForm.type === 'handson' || value) {
          callback();
        } else {
          callback(new Error('请选择正确答案'));
        }
      }
    }
  ],
  explanation: [
    { required: true, message: '请输入解析内容', trigger: 'blur' }
  ]
})

// 监听题目类型变化
watch(() => questionForm.type, (newType) => {
  // 当切换到实操题时，清空选项和答案
  if (newType === 'handson') {
    // 实操题不需要答案
    questionForm.answer = '';
    // 保留选项数组但清空内容，以便切换回其他题型时能恢复
    questionForm.options = [];
  } else if (questionForm.options.length === 0) {
    // 如果从实操题切换回其他题型，恢复默认选项
    questionForm.options = [
      { id: 'A', text: '', images: [] as string[] },
      { id: 'B', text: '', images: [] as string[] }
    ];
    
    // 根据题型设置默认答案格式
    if (newType === 'multiple') {
      // 对于多选题，我们需要使用数组，但由于类型限制，这里先使用空字符串
      // 在提交表单时会根据题型进行处理
      questionForm.answer = '';
    } else {
      questionForm.answer = '';
    }
  }
}, { immediate: true })

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
    
    // 设置默认选项
    setDefaultSelections()
  } catch (error) {
    ElMessage.error('初始化数据失败')
    console.error('Failed to initialize data:', error)
  }
}

// 设置默认选项
function setDefaultSelections() {
  // 如果有组织，默认选择第一个
  if (organizations.value.length > 0 && !selectedOrganizationId.value) {
    selectedOrganizationId.value = organizations.value[0].id
    
    // 根据选择的组织，过滤出相关类别
    const orgCategories = categories.value.filter(cat => cat.organizationId === selectedOrganizationId.value)
    
    // 如果有类别，默认选择第一个
    if (orgCategories.length > 0) {
      selectedCategoryId.value = orgCategories[0].id
      
      // 根据选择的类别，过滤出相关级别
      const catLevels = levels.value.filter(level => level.categoryId === selectedCategoryId.value)
      
      // 如果有级别，默认选择第一个
      if (catLevels.length > 0) {
        selectedLevelId.value = catLevels[0].id
        
        // 加载试卷列表
        loadPapers()
      }
    }
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
  // 重置类别和级别选择
  selectedCategoryId.value = ''
  selectedLevelId.value = ''
  papers.value = []
  
  // 如果选择了组织，自动选择第一个类别（如果存在）
  if (selectedOrganizationId.value && filteredCategories.value.length > 0) {
    selectedCategoryId.value = filteredCategories.value[0].id
    
    // 如果选择了类别，自动选择第一个级别（如果存在）
    if (selectedCategoryId.value && filteredLevels.value.length > 0) {
      selectedLevelId.value = filteredLevels.value[0].id
      loadPapers()
    }
  }
}

// 处理类别变更
function handleCategoryChange() {
  // 重置级别选择
  selectedLevelId.value = ''
  papers.value = []
  
  // 如果选择了类别，自动选择第一个级别（如果存在）
  if (selectedCategoryId.value && filteredLevels.value.length > 0) {
    selectedLevelId.value = filteredLevels.value[0].id
    loadPapers()
  }
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

// 组件挂载时，如果已经有数据但没有选择，设置默认选项
onMounted(() => {
  if (organizations.value.length > 0 && !selectedOrganizationId.value) {
    setDefaultSelections()
  }
})

// 组件激活时（从缓存中恢复），如果没有选择但有数据，设置默认选项
onActivated(() => {
  if (organizations.value.length > 0 && !selectedOrganizationId.value) {
    setDefaultSelections()
  }
})

// 题目管理相关方法

// 重置题目表单
function resetQuestionForm() {
  questionForm.id = generateQuestionId()
  questionForm.type = 'single'
  questionForm.title = ''
  questionForm.images = []
  questionForm.richContent = ''
  questionForm.options = [
    { id: 'A', text: '', images: [] as string[] },
    { id: 'B', text: '', images: [] as string[] }
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
      images: []
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
  questionForm.richContent = question.richContent || ''
  
  // 兼容旧版本：如果有image字段但没有images字段，创建包含单个image的images数组
  if (question.image && (!question.images || question.images.length === 0)) {
    questionForm.images = [question.image]
  } else {
    questionForm.images = question.images || []
  }
  
  // 复制选项，并处理选项中的图片字段
  questionForm.options = JSON.parse(JSON.stringify(question.options)).map((opt: any) => {
    // 兼容旧版本：如果选项有image字段但没有images字段，创建包含单个image的images数组
    if (opt.image && (!opt.images || opt.images.length === 0)) {
      opt.images = [opt.image]
    } else if (!opt.images) {
      opt.images = []
    }
    return opt
  })
  
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
function validateQuestionTypeOrder(questions: Question[]): boolean {
  if (!questions || questions.length <= 1) return true;
  
  // 过滤掉实操题，实操题不参与题型顺序检查
  const nonHandsOnQuestions = questions.filter(q => q.type !== QuestionType.HandsOn);
  if (nonHandsOnQuestions.length <= 1) return true;
  
  // 记录当前题型和上一个题型
  let currentType = nonHandsOnQuestions[0].type;
  let typeChanges = 0;
  
  // 检查题型变化次数
  for (let i = 1; i < nonHandsOnQuestions.length; i++) {
    if (nonHandsOnQuestions[i].type !== currentType) {
      currentType = nonHandsOnQuestions[i].type;
      typeChanges++;
    }
  }
  
  // 如果题型变化次数大于等于题型数量，说明题型有穿插
  const uniqueTypes = new Set(nonHandsOnQuestions.map((q: Question) => q.type));
  return typeChanges < uniqueTypes.size;
}

// 获取题型顺序建议
function getSuggestedQuestionOrder(questions: Question[]): Question[] {
  if (!questions || questions.length === 0) return [];
  
  // 分离实操题和其他题型
  const handsOnQuestions = questions.filter(q => q.type === QuestionType.HandsOn);
  const nonHandsOnQuestions = questions.filter(q => q.type !== QuestionType.HandsOn);
  
  // 按题型分组（非实操题）
  const groups: Record<string, Question[]> = {
    'single': [],
    'multiple': [],
    'truefalse': []
  };
  
  nonHandsOnQuestions.forEach((q: Question) => {
    if (q.type in groups) {
      groups[q.type].push({...q});
    }
  });
  
  // 推荐顺序：单选题 -> 多选题 -> 判断题 -> 实操题
  return [
    ...groups['single'], 
    ...groups['multiple'], 
    ...groups['truefalse'],
    ...handsOnQuestions
  ];
}

// 修改submitQuestionForm函数
async function submitQuestionForm() {
  if (!questionFormRef.value || !currentPaper.value) return;

  await questionFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 处理实操题特殊情况
        const isHandsOn = questionForm.type === 'handson';
        
        // 如果是实操题且没有手动设置标题，从富文本中提取
        if (isHandsOn && !questionForm.title && questionForm.richContent) {
          updateTitleFromRichContent();
        }
        
        const question = {
          id: questionForm.id,
          type: questionForm.type as QuestionType,
          title: questionForm.title,
          images: questionForm.images || [],
          // 如果是实操题，添加富文本内容
          ...(isHandsOn && questionForm.richContent ? { richContent: questionForm.richContent } : {}),
          // 实操题不需要选项，使用空数组
          options: isHandsOn ? [] : JSON.parse(JSON.stringify(questionForm.options)),
          // 实操题不需要答案，使用null
          answer: isHandsOn ? null : questionForm.answer,
          explanation: questionForm.explanation
        };

        if (isEditQuestion.value) {
          // 编辑现有题目
          if (currentPaper.value && currentPaper.value.questions) {
            currentPaper.value.questions[currentQuestionIndex.value] = question;
          }
        } else {
          // 添加新题目
          if (currentPaper.value && currentPaper.value.questions) {
            currentPaper.value.questions.push(question);
          }
        }

        // 检查题型顺序是否合规 (实操题不参与题型顺序检查)
        if (currentPaper.value && currentPaper.value.questions) {
          const nonHandsOnQuestions = currentPaper.value.questions.filter(q => q.type !== 'handson');
          if (nonHandsOnQuestions.length > 1 && !validateQuestionTypeOrder(nonHandsOnQuestions)) {
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
              if (currentPaper.value) {
                currentPaper.value.questions = suggested;
              }
              ElMessage.success('已自动调整题目顺序');
            } catch (e) {
              // 用户选择手动调整，展示建议
              ElMessage.warning('请手动调整题目顺序，确保同一题型的题目连续排列');
              questionDialogVisible.value = false;
              return;
            }
          }
        }

        // 更新试卷
        if (currentPaper.value) {
          await apiService.updatePaper(currentPaper.value);
        }

        ElMessage.success(isEditQuestion.value ? '编辑题目成功' : '添加题目成功');
        questionDialogVisible.value = false;
      } catch (error) {
        ElMessage.error(isEditQuestion.value ? '编辑题目失败' : '添加题目失败');
        console.error('Failed to submit question:', error);
      }
    } else {
      console.log('表单验证失败');
    }
  });
}

// 从富文本内容中提取标题
function updateTitleFromRichContent() {
  if (!questionForm.richContent) return;
  
  try {
    // 创建一个临时的DOM元素来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = questionForm.richContent;
    
    // 获取纯文本内容作为标题
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // 取前50个字符作为标题，避免过长
    questionForm.title = textContent.trim().substring(0, 50);
    if (textContent.length > 50) {
      questionForm.title += '...';
    }
  } catch (error) {
    console.error('从富文本提取标题时出错:', error);
  }
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

// 添加题目图片
function addImage() {
  if (!questionForm.images) {
    questionForm.images = []
  }
  questionForm.images.push('')
}

// 删除题目图片
function removeImage(index: number) {
  questionForm.images.splice(index, 1)
}

// 添加选项图片
function addOptionImage(optionIndex: number) {
  if (!questionForm.options[optionIndex].images) {
    questionForm.options[optionIndex].images = []
  }
  questionForm.options[optionIndex].images.push('')
}

// 删除选项图片
function removeOptionImage(optionIndex: number, imgIndex: number) {
  questionForm.options[optionIndex].images.splice(imgIndex, 1)
}

// 处理编辑器创建完成事件
const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
  // 如果有初始内容，设置到编辑器中
  if (questionForm.richContent) {
    editorHtml.value = questionForm.richContent
  }
}

// 处理编辑器内容变化事件
const handleEditorChange = (editor: IDomEditor) => {
  questionForm.richContent = editor.getHtml()
  updateTitleFromRichContent()
}

// 组件销毁前销毁编辑器实例
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

// 监听级别变化
watch(selectedLevelId, (newVal) => {
  if (newVal) {
    loadPapers()
  }
})

// 获取题目标题
function getQuestionTitle(question: any): string {
  if (question.type === 'handson' && question.richContent) {
    // 创建一个临时的DOM元素来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = question.richContent;
    
    // 获取纯文本内容
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // 取前50个字符作为标题，避免过长
    const title = textContent.trim().substring(0, 50);
    return title + (textContent.length > 50 ? '...' : '');
  } else {
    // 对于普通题目，直接截取标题
    return question.title ? (question.title.substring(0, 50) + (question.title.length > 50 ? '...' : '')) : '';
  }
}
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

.image-item {
  margin-bottom: 10px;
  text-align: center;
}

.image-input-item {
  margin-bottom: 10px;
}

.option-images {
  display: flex;
  flex-wrap: wrap;
  margin-top: 5px;
}

.image-item {
  margin-bottom: 10px;
  text-align: center;
}

.image-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.image-input-item {
  margin-bottom: 15px;
  width: 100%;
}

.add-image-button {
  margin-top: 5px;
}

.option-images {
  display: flex;
  flex-wrap: wrap;
  margin-top: 5px;
  gap: 8px;
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

.rich-editor-container {
  width: 100%;
}

.rich-editor-actions {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.preview-header {
  font-weight: bold;
  margin: 15px 0 10px;
}

.rich-content-preview {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
  margin-bottom: 15px;
  min-height: 100px;
  background-color: #fafafa;
  overflow: auto;
}

/* 富文本预览中的样式 */
.rich-content-preview :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 10px 0;
  display: block;
}

.rich-content-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
}

.rich-content-preview :deep(table td),
.rich-content-preview :deep(table th) {
  border: 1px solid #dcdfe6;
  padding: 8px;
}

.rich-content-preview :deep(ul),
.rich-content-preview :deep(ol) {
  padding-left: 20px;
  margin: 10px 0;
}

.rich-content-preview :deep(pre),
.rich-content-preview :deep(code) {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 2px 4px;
  font-family: monospace;
}

.rich-content-preview :deep(pre) {
  padding: 10px;
  overflow-x: auto;
}

.rich-content-preview :deep(p) {
  margin: 8px 0;
}

.rich-content-preview :deep(h1),
.rich-content-preview :deep(h2),
.rich-content-preview :deep(h3),
.rich-content-preview :deep(h4),
.rich-content-preview :deep(h5),
.rich-content-preview :deep(h6) {
  margin: 12px 0;
  font-weight: bold;
}

/* 确保题目详情中的富文本预览样式正确 */
.question-detail .rich-content-preview {
  margin: 10px 0 20px 0;
  max-width: 100%;
  overflow-x: auto;
}

.rich-content-notice {
  margin-top: 10px;
}

.html-tips {
  font-size: 13px;
}

.html-tips code {
  background-color: #f5f7fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

/* 富文本编辑器弹窗样式 */
:deep(.rich-text-dialog .el-message-box__input) {
  width: 100%;
}

:deep(.rich-text-dialog .el-textarea__inner) {
  min-height: 300px;
  font-family: monospace;
}

/* WangEditor 相关样式 */
.editor-container {
  border: 1px solid #ccc;
  z-index: 100;
  margin-bottom: 20px;
}

.w-e-text-container {
  height: 300px !important;
}

.rich-content-preview {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
  margin-bottom: 15px;
  min-height: 100px;
  background-color: #fafafa;
  overflow: auto;
}

.preview-header {
  margin-top: 15px;
  font-weight: bold;
  color: #606266;
}

/* 精简版富文本预览样式 */
.rich-content-preview-compact {
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 15px;
  background-color: #fafafa;
  max-height: 200px;
  overflow: auto;
}

.rich-content-preview-compact :deep(img) {
  max-width: 100%;
  max-height: 150px;
  height: auto;
  margin: 5px 0;
  display: inline-block;
}

.rich-content-preview-compact :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 5px 0;
}

.rich-content-preview-compact :deep(table td),
.rich-content-preview-compact :deep(table th) {
  border: 1px solid #dcdfe6;
  padding: 5px;
}

.rich-content-preview-compact :deep(p) {
  margin: 5px 0;
}
</style>
