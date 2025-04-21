<template>
  <div class="categories-manager">
    <div class="manager-header">
      <h2>类别管理</h2>
      <el-button type="primary" @click="showAddDialog">添加类别</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="categories"
      style="width: 100%"
      border
    >
      <el-table-column prop="id" label="ID" width="180" />
      <el-table-column prop="name" label="名称" />
      <el-table-column label="所属组织" width="180">
        <template #default="scope">
          {{ getOrganizationName(scope.row.organizationId) }}
        </template>
      </el-table-column>
      <el-table-column label="图片" width="150">
        <template #default="scope">
          <el-image
            v-if="scope.row.image"
            :src="scope.row.image"
            style="width: 100px; height: 60px"
            fit="contain"
          />
          <span v-else>无图片</span>
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
      :title="isEdit ? '编辑类别' : '添加类别'"
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
          <el-select v-model="form.organizationId" placeholder="请选择组织" style="width: 100%">
            <el-option
              v-for="org in organizations"
              :key="org.id"
              :label="org.name"
              :value="org.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="图片URL" prop="image">
          <el-input v-model="form.image" />
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
      <p>确定要删除类别 "{{ currentCategory?.name }}" 吗？此操作不可恢复。</p>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import type { Category, Organization } from '@/types/question'
import * as apiService from '@/services/apiService'

const categories = ref<Category[]>([])
const organizations = ref<Organization[]>([])
const loading = ref(true)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const isEdit = ref(false)
const currentCategory = ref<Category | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  id: '',
  name: '',
  organizationId: '',
  image: '',
  description: ''
})

const rules = reactive<FormRules>({
  id: [
    { required: true, message: '请输入类别ID', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: 'ID只能包含小写字母、数字和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入类别名称', trigger: 'blur' }
  ],
  organizationId: [
    { required: true, message: '请选择所属组织', trigger: 'change' }
  ]
})

onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchOrganizations()
  ])
})

async function fetchCategories() {
  loading.value = true
  try {
    categories.value = await apiService.getCategories()
  } catch (error) {
    ElMessage.error('获取类别列表失败')
    console.error('Failed to fetch categories:', error)
  } finally {
    loading.value = false
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

function getOrganizationName(organizationId: string): string {
  const org = organizations.value.find(o => o.id === organizationId)
  return org ? org.name : '未知组织'
}

function showAddDialog() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row: Category) {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

function handleDelete(row: Category) {
  currentCategory.value = row
  deleteDialogVisible.value = true
}

async function confirmDelete() {
  if (!currentCategory.value) return

  try {
    await apiService.deleteCategory(currentCategory.value.id)
    ElMessage.success('删除成功')
    await fetchCategories()
    deleteDialogVisible.value = false
  } catch (error: any) {
    if (error.message.includes('existing levels')) {
      ElMessage.error('无法删除：该类别下存在级别数据')
    } else {
      ElMessage.error('删除失败')
    }
    console.error('Failed to delete category:', error)
  }
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.organizationId = ''
  form.image = ''
  form.description = ''
}

async function submitForm() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const categoryData: Category = {
          id: form.id,
          name: form.name,
          organizationId: form.organizationId,
          image: form.image,
          description: form.description
        }

        if (isEdit.value) {
          await apiService.updateCategory(categoryData)
          ElMessage.success('更新成功')
        } else {
          await apiService.createCategory(categoryData)
          ElMessage.success('添加成功')
        }

        dialogVisible.value = false
        await fetchCategories()
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          ElMessage.error('ID已存在，请使用其他ID')
        } else if (error.message.includes('organization does not exist')) {
          ElMessage.error('所选组织不存在')
        } else {
          ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
        }
        console.error('Failed to save category:', error)
      }
    }
  })
}
</script>

<style scoped>
.categories-manager {
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
