import type { Organization, Category, Level, Paper } from '@/types/question'

const API_BASE_URL = 'http://localhost:4000/api'

/**
 * 通用API请求函数
 */
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API request failed with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API request error for ${url}:`, error)
    throw error
  }
}

// 组织相关API
export async function getOrganizations(): Promise<Organization[]> {
  return apiRequest<Organization[]>('/organizations')
}

export async function createOrganization(organization: Organization): Promise<Organization> {
  return apiRequest<Organization>('/organizations', {
    method: 'POST',
    body: JSON.stringify(organization)
  })
}

export async function updateOrganization(organization: Organization): Promise<Organization> {
  return apiRequest<Organization>(`/organizations/${organization.id}`, {
    method: 'PUT',
    body: JSON.stringify(organization)
  })
}

export async function deleteOrganization(id: string): Promise<void> {
  return apiRequest<void>(`/organizations/${id}`, {
    method: 'DELETE'
  })
}

// 类别相关API
export async function getCategories(): Promise<Category[]> {
  return apiRequest<Category[]>('/categories')
}

export async function createCategory(category: Category): Promise<Category> {
  return apiRequest<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(category)
  })
}

export async function updateCategory(category: Category): Promise<Category> {
  return apiRequest<Category>(`/categories/${category.id}`, {
    method: 'PUT',
    body: JSON.stringify(category)
  })
}

export async function deleteCategory(id: string): Promise<void> {
  return apiRequest<void>(`/categories/${id}`, {
    method: 'DELETE'
  })
}

// 级别相关API
export async function getLevels(): Promise<Level[]> {
  return apiRequest<Level[]>('/levels')
}

export async function createLevel(level: Level): Promise<Level> {
  return apiRequest<Level>('/levels', {
    method: 'POST',
    body: JSON.stringify(level)
  })
}

export async function updateLevel(level: Level): Promise<Level> {
  return apiRequest<Level>(`/levels/${level.id}`, {
    method: 'PUT',
    body: JSON.stringify(level)
  })
}

export async function deleteLevel(id: string): Promise<void> {
  return apiRequest<void>(`/levels/${id}`, {
    method: 'DELETE'
  })
}

// 试卷相关API
export async function getPapersByLevel(levelId: string): Promise<Paper[]> {
  return apiRequest<Paper[]>(`/papers/by-level/${levelId}`)
}

export async function getPaper(id: string): Promise<Paper> {
  return apiRequest<Paper>(`/papers/${id}`)
}

export async function createPaper(paper: Paper): Promise<Paper> {
  return apiRequest<Paper>('/papers', {
    method: 'POST',
    body: JSON.stringify(paper)
  })
}

export async function updatePaper(paper: Paper): Promise<Paper> {
  return apiRequest<Paper>(`/papers/${paper.id}`, {
    method: 'PUT',
    body: JSON.stringify(paper)
  })
}

export async function deletePaper(id: string): Promise<void> {
  return apiRequest<void>(`/papers/${id}`, {
    method: 'DELETE'
  })
}

// 文件上传API
export async function uploadPaperFile(file: File, levelId: string): Promise<Paper> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('levelId', levelId)

  try {
    const response = await fetch(`${API_BASE_URL}/upload/paper`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Upload failed with status ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('File upload error:', error)
    throw error
  }
}
