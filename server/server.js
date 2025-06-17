const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4000;

// 中间件
app.use(cors());
app.use(express.json());

// 提供静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// 设置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据文件类型选择不同的目标目录
    if (file.mimetype.startsWith('image/')) {
      cb(null, path.join(__dirname, '..', 'public', 'uploads'));
    } else {
      cb(null, path.join(__dirname, 'uploads'));
    }
  },
  filename: function (req, file, cb) {
    // 为图片创建统一格式的文件名，避免中文编码问题
    if (file.mimetype.startsWith('image/')) {
      const fileExt = path.extname(file.originalname);
      const fileName = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}${fileExt}`;
      cb(null, fileName);
    } else {
      // 对于非图片文件，使用时间戳命名
      cb(null, Date.now() + '-' + file.originalname);
    }
  }
});

const upload = multer({ storage: storage });

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 确保图片上传目录存在
const imageUploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(imageUploadsDir)) {
  fs.mkdirSync(imageUploadsDir, { recursive: true });
}

// 数据文件路径
const dataDir = path.join(__dirname, '..', 'public', 'data');
const organizationsPath = path.join(dataDir, 'organizations.json');
const categoriesPath = path.join(dataDir, 'categories.json');
const levelsPath = path.join(dataDir, 'levels.json');
const papersDir = path.join(dataDir, 'papers');
const papersByLevelDir = path.join(dataDir, 'papersByLevel');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(papersDir)) {
  fs.mkdirSync(papersDir, { recursive: true });
}
if (!fs.existsSync(papersByLevelDir)) {
  fs.mkdirSync(papersByLevelDir, { recursive: true });
}

// 辅助函数：读取JSON文件
function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// 辅助函数：写入JSON文件
function writeJsonFile(filePath, data) {
  try {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

// API路由

// 组织相关API
app.get('/api/organizations', (req, res) => {
  const organizations = readJsonFile(organizationsPath);
  res.json(organizations);
});

app.post('/api/organizations', (req, res) => {
  const organizations = readJsonFile(organizationsPath);
  const newOrganization = req.body;
  
  // 验证必填字段
  if (!newOrganization.id || !newOrganization.name) {
    return res.status(400).json({ error: 'ID and name are required' });
  }
  
  // 检查ID是否已存在
  if (organizations.some(org => org.id === newOrganization.id)) {
    return res.status(400).json({ error: 'Organization ID already exists' });
  }
  
  organizations.push(newOrganization);
  
  if (writeJsonFile(organizationsPath, organizations)) {
    res.status(201).json(newOrganization);
  } else {
    res.status(500).json({ error: 'Failed to save organization' });
  }
});

app.put('/api/organizations/:id', (req, res) => {
  const organizations = readJsonFile(organizationsPath);
  const { id } = req.params;
  const updatedOrganization = req.body;
  
  // 验证必填字段
  if (!updatedOrganization.id || !updatedOrganization.name) {
    return res.status(400).json({ error: 'ID and name are required' });
  }
  
  // 检查ID是否匹配
  if (updatedOrganization.id !== id) {
    return res.status(400).json({ error: 'Organization ID in body does not match URL parameter' });
  }
  
  const index = organizations.findIndex(org => org.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  organizations[index] = updatedOrganization;
  
  if (writeJsonFile(organizationsPath, organizations)) {
    res.json(updatedOrganization);
  } else {
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

app.delete('/api/organizations/:id', (req, res) => {
  const organizations = readJsonFile(organizationsPath);
  const { id } = req.params;
  
  const index = organizations.findIndex(org => org.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Organization not found' });
  }
  
  // 检查是否有依赖关系
  const categories = readJsonFile(categoriesPath);
  const hasReferences = categories.some(cat => cat.organizationId === id);
  
  if (hasReferences) {
    return res.status(400).json({ error: 'Cannot delete organization with existing categories' });
  }
  
  organizations.splice(index, 1);
  
  if (writeJsonFile(organizationsPath, organizations)) {
    res.json({ message: 'Organization deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

// 类别相关API
app.get('/api/categories', (req, res) => {
  const categories = readJsonFile(categoriesPath);
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const categories = readJsonFile(categoriesPath);
  const newCategory = req.body;
  
  // 验证必填字段
  if (!newCategory.id || !newCategory.name || !newCategory.organizationId) {
    return res.status(400).json({ error: 'ID, name, and organizationId are required' });
  }
  
  // 检查ID是否已存在
  if (categories.some(cat => cat.id === newCategory.id)) {
    return res.status(400).json({ error: 'Category ID already exists' });
  }
  
  // 检查组织是否存在
  const organizations = readJsonFile(organizationsPath);
  if (!organizations.some(org => org.id === newCategory.organizationId)) {
    return res.status(400).json({ error: 'Referenced organization does not exist' });
  }
  
  categories.push(newCategory);
  
  if (writeJsonFile(categoriesPath, categories)) {
    res.status(201).json(newCategory);
  } else {
    res.status(500).json({ error: 'Failed to save category' });
  }
});

app.put('/api/categories/:id', (req, res) => {
  const categories = readJsonFile(categoriesPath);
  const { id } = req.params;
  const updatedCategory = req.body;
  
  // 验证必填字段
  if (!updatedCategory.id || !updatedCategory.name || !updatedCategory.organizationId) {
    return res.status(400).json({ error: 'ID, name, and organizationId are required' });
  }
  
  // 检查ID是否匹配
  if (updatedCategory.id !== id) {
    return res.status(400).json({ error: 'Category ID in body does not match URL parameter' });
  }
  
  const index = categories.findIndex(cat => cat.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  // 检查组织是否存在
  const organizations = readJsonFile(organizationsPath);
  if (!organizations.some(org => org.id === updatedCategory.organizationId)) {
    return res.status(400).json({ error: 'Referenced organization does not exist' });
  }
  
  categories[index] = updatedCategory;
  
  if (writeJsonFile(categoriesPath, categories)) {
    res.json(updatedCategory);
  } else {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const categories = readJsonFile(categoriesPath);
  const { id } = req.params;
  
  const index = categories.findIndex(cat => cat.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  // 检查是否有依赖关系
  const levels = readJsonFile(levelsPath);
  const hasReferences = levels.some(level => level.categoryId === id);
  
  if (hasReferences) {
    return res.status(400).json({ error: 'Cannot delete category with existing levels' });
  }
  
  categories.splice(index, 1);
  
  if (writeJsonFile(categoriesPath, categories)) {
    res.json({ message: 'Category deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// 级别相关API
app.get('/api/levels', (req, res) => {
  const levels = readJsonFile(levelsPath);
  res.json(levels);
});

app.post('/api/levels', (req, res) => {
  const levels = readJsonFile(levelsPath);
  const newLevel = req.body;
  
  // 验证必填字段
  if (!newLevel.id || !newLevel.name || !newLevel.categoryId) {
    return res.status(400).json({ error: 'ID, name, and categoryId are required' });
  }
  
  // 检查ID是否已存在
  if (levels.some(level => level.id === newLevel.id)) {
    return res.status(400).json({ error: 'Level ID already exists' });
  }
  
  // 检查类别是否存在
  const categories = readJsonFile(categoriesPath);
  if (!categories.some(cat => cat.id === newLevel.categoryId)) {
    return res.status(400).json({ error: 'Referenced category does not exist' });
  }
  
  levels.push(newLevel);
  
  if (writeJsonFile(levelsPath, levels)) {
    // 创建空的试卷元数据文件
    const papersByLevelPath = path.join(papersByLevelDir, `${newLevel.id}.json`);
    writeJsonFile(papersByLevelPath, []);
    
    res.status(201).json(newLevel);
  } else {
    res.status(500).json({ error: 'Failed to save level' });
  }
});

app.put('/api/levels/:id', (req, res) => {
  const levels = readJsonFile(levelsPath);
  const { id } = req.params;
  const updatedLevel = req.body;
  
  // 验证必填字段
  if (!updatedLevel.id || !updatedLevel.name || !updatedLevel.categoryId) {
    return res.status(400).json({ error: 'ID, name, and categoryId are required' });
  }
  
  // 检查ID是否匹配
  if (updatedLevel.id !== id) {
    return res.status(400).json({ error: 'Level ID in body does not match URL parameter' });
  }
  
  const index = levels.findIndex(level => level.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Level not found' });
  }
  
  // 检查类别是否存在
  const categories = readJsonFile(categoriesPath);
  if (!categories.some(cat => cat.id === updatedLevel.categoryId)) {
    return res.status(400).json({ error: 'Referenced category does not exist' });
  }
  
  levels[index] = updatedLevel;
  
  if (writeJsonFile(levelsPath, levels)) {
    res.json(updatedLevel);
  } else {
    res.status(500).json({ error: 'Failed to update level' });
  }
});

app.delete('/api/levels/:id', (req, res) => {
  const levels = readJsonFile(levelsPath);
  const { id } = req.params;
  
  const index = levels.findIndex(level => level.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Level not found' });
  }
  
  // 检查是否有依赖关系
  const papersByLevelPath = path.join(papersByLevelDir, `${id}.json`);
  const papers = readJsonFile(papersByLevelPath);
  
  if (papers.length > 0) {
    return res.status(400).json({ error: 'Cannot delete level with existing papers' });
  }
  
  levels.splice(index, 1);
  
  if (writeJsonFile(levelsPath, levels)) {
    // 删除对应的试卷元数据文件
    if (fs.existsSync(papersByLevelPath)) {
      fs.unlinkSync(papersByLevelPath);
    }
    
    res.json({ message: 'Level deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete level' });
  }
});

// 试卷相关API
app.get('/api/papers/by-level/:levelId', (req, res) => {
  const { levelId } = req.params;
  const papersByLevelPath = path.join(papersByLevelDir, `${levelId}.json`);
  const papers = readJsonFile(papersByLevelPath);
  res.json(papers);
});

app.get('/api/papers/:id', (req, res) => {
  const { id } = req.params;
  const paperPath = path.join(papersDir, `${id}.json`);
  
  if (!fs.existsSync(paperPath)) {
    return res.status(404).json({ error: 'Paper not found' });
  }
  
  const paper = readJsonFile(paperPath);
  res.json(paper);
});

app.post('/api/papers', (req, res) => {
  const newPaper = req.body;
  
  // 验证必填字段
  if (!newPaper.id || !newPaper.name || !newPaper.levelId || !Array.isArray(newPaper.questions)) {
    return res.status(400).json({ error: 'ID, name, levelId, and questions array are required' });
  }
  
  // 检查级别是否存在
  const levels = readJsonFile(levelsPath);
  if (!levels.some(level => level.id === newPaper.levelId)) {
    return res.status(400).json({ error: 'Referenced level does not exist' });
  }
  
  // 保存完整试卷
  const paperPath = path.join(papersDir, `${newPaper.id}.json`);
  
  if (fs.existsSync(paperPath)) {
    return res.status(400).json({ error: 'Paper ID already exists' });
  }
  
  if (writeJsonFile(paperPath, newPaper)) {
    // 更新试卷元数据
    const papersByLevelPath = path.join(papersByLevelDir, `${newPaper.levelId}.json`);
    const papers = readJsonFile(papersByLevelPath);
    
    // 创建不包含题目的元数据对象
    const paperMeta = {
      id: newPaper.id,
      name: newPaper.name,
      levelId: newPaper.levelId
    };
    
    papers.push(paperMeta);
    
    if (writeJsonFile(papersByLevelPath, papers)) {
      res.status(201).json(paperMeta);
    } else {
      // 如果元数据更新失败，删除已创建的试卷文件
      if (fs.existsSync(paperPath)) {
        fs.unlinkSync(paperPath);
      }
      res.status(500).json({ error: 'Failed to update paper metadata' });
    }
  } else {
    res.status(500).json({ error: 'Failed to save paper' });
  }
});

app.put('/api/papers/:id', (req, res) => {
  const { id } = req.params;
  const updatedPaper = req.body;
  
  // 验证必填字段
  if (!updatedPaper.id || !updatedPaper.name || !updatedPaper.levelId || !Array.isArray(updatedPaper.questions)) {
    return res.status(400).json({ error: 'ID, name, levelId, and questions array are required' });
  }
  
  // 检查ID是否匹配
  if (updatedPaper.id !== id) {
    return res.status(400).json({ error: 'Paper ID in body does not match URL parameter' });
  }
  
  const paperPath = path.join(papersDir, `${id}.json`);
  
  if (!fs.existsSync(paperPath)) {
    return res.status(404).json({ error: 'Paper not found' });
  }
  
  // 获取原始试卷数据以检查级别是否变更
  const originalPaper = readJsonFile(paperPath);
  const levelChanged = originalPaper.levelId !== updatedPaper.levelId;
  
  // 检查级别是否存在
  const levels = readJsonFile(levelsPath);
  if (!levels.some(level => level.id === updatedPaper.levelId)) {
    return res.status(400).json({ error: 'Referenced level does not exist' });
  }
  
  if (writeJsonFile(paperPath, updatedPaper)) {
    // 如果级别变更，需要更新两个级别的元数据
    if (levelChanged) {
      // 从原级别移除
      const oldPapersByLevelPath = path.join(papersByLevelDir, `${originalPaper.levelId}.json`);
      const oldPapers = readJsonFile(oldPapersByLevelPath);
      const filteredOldPapers = oldPapers.filter(p => p.id !== id);
      writeJsonFile(oldPapersByLevelPath, filteredOldPapers);
      
      // 添加到新级别
      const newPapersByLevelPath = path.join(papersByLevelDir, `${updatedPaper.levelId}.json`);
      const newPapers = readJsonFile(newPapersByLevelPath);
      
      const paperMeta = {
        id: updatedPaper.id,
        name: updatedPaper.name,
        levelId: updatedPaper.levelId
      };
      
      newPapers.push(paperMeta);
      writeJsonFile(newPapersByLevelPath, newPapers);
    } else {
      // 仅更新当前级别的元数据
      const papersByLevelPath = path.join(papersByLevelDir, `${updatedPaper.levelId}.json`);
      const papers = readJsonFile(papersByLevelPath);
      
      const index = papers.findIndex(p => p.id === id);
      if (index !== -1) {
        papers[index] = {
          id: updatedPaper.id,
          name: updatedPaper.name,
          levelId: updatedPaper.levelId
        };
        writeJsonFile(papersByLevelPath, papers);
      }
    }
    
    res.json(updatedPaper);
  } else {
    res.status(500).json({ error: 'Failed to update paper' });
  }
});

app.delete('/api/papers/:id', (req, res) => {
  const { id } = req.params;
  const paperPath = path.join(papersDir, `${id}.json`);
  
  if (!fs.existsSync(paperPath)) {
    return res.status(404).json({ error: 'Paper not found' });
  }
  
  // 获取试卷数据以找到对应的级别
  const paper = readJsonFile(paperPath);
  const levelId = paper.levelId;
  
  // 从文件系统删除试卷
  try {
    fs.unlinkSync(paperPath);
    
    // 更新试卷元数据
    const papersByLevelPath = path.join(papersByLevelDir, `${levelId}.json`);
    const papers = readJsonFile(papersByLevelPath);
    const filteredPapers = papers.filter(p => p.id !== id);
    
    if (writeJsonFile(papersByLevelPath, filteredPapers)) {
      res.json({ message: 'Paper deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update paper metadata' });
    }
  } catch (error) {
    console.error(`Error deleting paper ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete paper' });
  }
});

// 文件上传API
app.post('/api/upload/paper', upload.single('file'), (req, res) => {
  try {
    const { levelId } = req.body;
    
    if (!levelId) {
      return res.status(400).json({ error: 'Level ID is required' });
    }
    
    // 检查级别是否存在
    const levels = readJsonFile(levelsPath);
    if (!levels.some(level => level.id === levelId)) {
      return res.status(400).json({ error: 'Referenced level does not exist' });
    }
    
    // 读取上传的文件
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let paperData;
    
    try {
      paperData = JSON.parse(fileContent);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }
    
    // 验证试卷数据
    if (!paperData.id || !paperData.name || !Array.isArray(paperData.questions)) {
      return res.status(400).json({ error: 'Invalid paper format: missing required fields' });
    }
    
    // 设置级别ID
    paperData.levelId = levelId;
    
    // 检查ID是否已存在
    const paperPath = path.join(papersDir, `${paperData.id}.json`);
    if (fs.existsSync(paperPath)) {
      return res.status(400).json({ error: 'Paper ID already exists' });
    }
    
    // 保存试卷数据
    if (writeJsonFile(paperPath, paperData)) {
      // 更新试卷元数据
      const papersByLevelPath = path.join(papersByLevelDir, `${levelId}.json`);
      const papers = readJsonFile(papersByLevelPath);
      
      const paperMeta = {
        id: paperData.id,
        name: paperData.name,
        levelId: levelId
      };
      
      papers.push(paperMeta);
      
      if (writeJsonFile(papersByLevelPath, papers)) {
        // 删除临时上传文件
        fs.unlinkSync(filePath);
        
        res.status(201).json(paperMeta);
      } else {
        // 如果元数据更新失败，删除已创建的试卷文件
        if (fs.existsSync(paperPath)) {
          fs.unlinkSync(paperPath);
        }
        res.status(500).json({ error: 'Failed to update paper metadata' });
      }
    } else {
      res.status(500).json({ error: 'Failed to save paper' });
    }
  } catch (error) {
    console.error('Error processing uploaded file:', error);
    res.status(500).json({ error: 'Failed to process uploaded file' });
  }
});

// 图片上传API
app.post('/api/upload/image', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    // 验证文件类型
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: '只能上传图片文件' });
    }

    // 返回图片URL
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.status(201).json({ 
      url: imageUrl,
      message: '图片上传成功' 
    });
  } catch (error) {
    console.error('图片上传处理错误:', error);
    res.status(500).json({ error: '图片上传失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
