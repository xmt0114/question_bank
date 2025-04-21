<template>
  <div class="levels-manager">
    <div class="manager-header">
      <h2>级别管理</h2>
      <el-button type="primary" @click="showAddDialog">添加级别</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="levels"
      style="width: 100%"
      border
    >
      <el-table-column prop="id" label="ID" width="180" />
      <el-table-column prop="name" label="名称" />
      <el-table-column label="所属类别" width="180">
        <template #default="scope">
          {{ getCategoryName(scope.row.categoryId) }}
        </template>
      </el-table-column>
      <el-table-column label="所属组织" width="180">
        <template #default="scope">
          {{ getOrganizationName(getCategoryOrganizationId(scope.row.categoryId)) }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column label="操作" width="200">
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
            type="danger"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑级别' : '添加级别'"
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
        <el-form-item label="所属组织" prop="organizationId">
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
        </el-form-item>
        <el-form-item label="所属类别" prop="categoryId">
          <el-select 
            v-model="form.categoryId" 
            placeholder="请选择类别" 
            style="width: 100%"
            :disabled="!selectedOrganizationId"
          >
            <el-option
              v-for="cat in filteredCategories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="400px"
    >
      <p>确定要删除级别 "{{ currentLevel?.name }}" 吗？此操作不可恢复。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确定删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import type { Level, Category, Organization } from '@/types/question'
import * as apiService from '@/services/apiService'

const levels = ref<Level[]>([])
const categories = ref<Category[]>([])
const organizations = ref<Organization[]>([])
const loading = ref(true)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const currentLevel = ref<Level | null>(null)
const formRef = ref<FormInstance>()
const selectedOrganizationId = ref('')

const form = reactive({
  id: '',
  name: '',
  categoryId: '',
  description: ''
})

const filteredCategories = computed(() => {
  if (!selectedOrganizationId.value) return []
  return categories.value.filter(cat => cat.organizationId === selectedOrganizationId.value)
})

const rules = reactive<FormRules>({
  id: [
    { required: true, message: '请输入级别ID', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: 'ID只能包含小写字母、数字和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入级别名称', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择所属类别', trigger: 'change' }
  ]
})

onMounted(async () => {
  await Promise.all([
    fetchLevels(),
    fetchCategories(),
    fetchOrganizations()
  ])
})

async function fetchLevels() {
  loading.value = true
  try {
    levels.value = await apiService.getLevels()
  } catch (error) {
    ElMessage.error('获取级别列表失败')
    console.error('Failed to fetch levels:', error)
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    categories.value = await apiService.getCategories()
  } catch (error) {
    ElMessage.error('获取类别列表失败')
    console.error('Failed to fetch categories:', error)
  }
}

async function fetchOrganizations() {
  try {
    organizations.value = await apiService.getOrganizations()
  } catch (error) {
    ElMessage.error('获取组织列表失败')
    console.error('Failed to fetch organizations:', error)
  }
}

function getCategoryName(categoryId: string): string {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : '未知类别'
}

function getCategoryOrganizationId(categoryId: string): string {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.organizationId : ''
}

function getOrganizationName(organizationId: string): string {
  const org = organizations.value.find(o => o.id === organizationId)
  return org ? org.name : '未知组织'
}

function handleOrganizationChange() {
  form.categoryId = ''
}

function showAddDialog() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row: Level) {
  isEdit.value = true
  Object.assign(form, row)
  
  // 设置所属组织
  const category = categories.value.find(c => c.id === row.categoryId)
  if (category) {
    selectedOrganizationId.value = category.organizationId
  }
  
  dialogVisible.value = true
}

function handleDelete(row: Level) {
  currentLevel.value = row
  deleteDialogVisible.value = true
}

async function confirmDelete() {
  if (!currentLevel.value) return

  try {
    await apiService.deleteLevel(currentLevel.value.id)
    ElMessage.success('删除成功')
    await fetchLevels()
    deleteDialogVisible.value = false
  } catch (error: any) {
    if (error.message.includes('existing papers')) {
      ElMessage.error('无法删除：该级别下存在试卷数据')
    } else {
      ElMessage.error('删除失败')
    }
    console.error('Failed to delete level:', error)
  }
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.categoryId = ''
  form.description = ''
  selectedOrganizationId.value = ''
}

async function submitForm() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const levelData: Level = {
          id: form.id,
          name: form.name,
          categoryId: form.categoryId,
          description: form.description
        }

        if (isEdit.value) {
          await apiService.updateLevel(levelData)
          ElMessage.success('更新成功')
        } else {
          await apiService.createLevel(levelData)
          ElMessage.success('添加成功')
        }

        dialogVisible.value = false
        await fetchLevels()
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          ElMessage.error('ID已存在，请使用其他ID')
        } else if (error.message.includes('category does not exist')) {
          ElMessage.error('所选类别不存在')
        } else {
          ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
        }
        console.error('Failed to save level:', error)
      }
    }
  })
}
</script>

<style scoped>
.levels-manager {
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
</style>
