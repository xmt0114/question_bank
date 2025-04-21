import type { Organization, Category, Level, Paper } from '@/types/question'

/**
 * 从JSON文件加载组织数据
 * @returns Promise<Organization[]> 组织数据列表
 */
export async function loadOrganizations(): Promise<Organization[]> {
  try {
    const response = await fetch('/data/organizations.json')
    if (!response.ok) {
      throw new Error(`Failed to load organizations: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading organizations:', error)
    return []
  }
}

/**
 * 从JSON文件加载类别数据
 * @returns Promise<Category[]> 类别数据列表
 */
export async function loadCategories(): Promise<Category[]> {
  try {
    const response = await fetch('/data/categories.json')
    if (!response.ok) {
      throw new Error(`Failed to load categories: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading categories:', error)
    return []
  }
}

/**
 * 从JSON文件加载级别数据
 * @returns Promise<Level[]> 级别数据列表
 */
export async function loadLevels(): Promise<Level[]> {
  try {
    const response = await fetch('/data/levels.json')
    if (!response.ok) {
      throw new Error(`Failed to load levels: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading levels:', error)
    return []
  }
}

/**
 * 从JSON文件加载试卷数据
 * @param paperId 试卷ID
 * @returns Promise<Paper | null> 试卷数据或null（如果加载失败）
 */
export async function loadPaper(paperId: string): Promise<Paper | null> {
  try {
    const response = await fetch(`/data/papers/${paperId}.json`)
    if (!response.ok) {
      throw new Error(`Failed to load paper: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error loading paper ${paperId}:`, error)
    return null
  }
}

/**
 * 获取指定级别下的所有试卷元数据（不包含题目）
 * @param levelId 级别ID
 * @returns Promise<Paper[]> 试卷元数据列表
 */
export async function loadPapersByLevel(levelId: string): Promise<Paper[]> {
  try {
    const response = await fetch(`/data/papersByLevel/${levelId}.json`)
    if (!response.ok) {
      throw new Error(`Failed to load papers for level ${levelId}: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error loading papers for level ${levelId}:`, error)
    return []
  }
}

/**
 * 加载所有基础数据（组织、类别、级别）
 * @returns Promise<{organizations: Organization[], categories: Category[], levels: Level[]}>
 */
export async function loadAllBaseData() {
  const [organizations, categories, levels] = await Promise.all([
    loadOrganizations(),
    loadCategories(),
    loadLevels()
  ])
  
  return { organizations, categories, levels }
}
