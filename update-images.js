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
    
    // 转换问题中的图片字段
    if (paperData.questions && Array.isArray(paperData.questions)) {
      let questionUpdated = 0;
      let optionUpdated = 0;
      
      // 处理每个问题
      paperData.questions.forEach(question => {
        // 转换问题的image字段为images数组
        if (question.image && !question.images) {
          question.images = [question.image];
          questionUpdated++;
          // 保留原始image字段以保证兼容性
        }
        
        // 处理选项中的图片
        if (question.options && Array.isArray(question.options)) {
          question.options.forEach(option => {
            // 转换选项的image字段为images数组
            if (option.image && !option.images) {
              option.images = [option.image];
              optionUpdated++;
              // 保留原始image字段以保证兼容性
            }
          });
        }
      });
      
      // 保存更新后的文件
      fs.writeFileSync(filePath, JSON.stringify(paperData, null, 2), 'utf8');
      console.log(`${fileName}: 已更新 ${questionUpdated} 个问题和 ${optionUpdated} 个选项的图片字段`);
    } else {
      console.log(`${fileName}: 未找到有效的问题数组`);
    }
  } catch (error) {
    console.error(`处理 ${fileName} 时出错:`, error.message);
  }
});

console.log('所有文件处理完成！'); 