import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 试卷目录路径
const papersDir = path.join(__dirname, 'public', 'data', 'papers');

// 读取目录中的所有JSON文件
const paperFiles = fs.readdirSync(papersDir).filter(file => file.endsWith('.json'));

console.log(`找到 ${paperFiles.length} 个试卷JSON文件`);

// 处理每个文件
paperFiles.forEach(fileName => {
  const filePath = path.join(papersDir, fileName);
  
  try {
    // 读取JSON文件
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const paperData = JSON.parse(fileContent);
    
    let questionFieldsRemoved = 0;
    let optionFieldsRemoved = 0;
    
    // 移除问题中的旧image字段
    if (paperData.questions && Array.isArray(paperData.questions)) {
      paperData.questions.forEach(question => {
        // 如果已经有images字段，则移除旧的image字段
        if (question.images && question.image) {
          delete question.image;
          questionFieldsRemoved++;
        }
        
        // 处理选项中的图片
        if (question.options && Array.isArray(question.options)) {
          question.options.forEach(option => {
            // 如果已经有images字段，则移除旧的image字段
            if (option.images && option.image) {
              delete option.image;
              optionFieldsRemoved++;
            }
          });
        }
      });
      
      // 保存更新后的文件
      fs.writeFileSync(filePath, JSON.stringify(paperData, null, 2), 'utf8');
      console.log(`${fileName}: 已移除 ${questionFieldsRemoved} 个问题和 ${optionFieldsRemoved} 个选项的旧image字段`);
    } else {
      console.log(`${fileName}: 未找到有效的问题数组`);
    }
  } catch (error) {
    console.error(`处理 ${fileName} 时出错:`, error.message);
  }
});

console.log('所有文件处理完成！'); 