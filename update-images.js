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

// 更新每个试卷文件
paperFiles.forEach(file => {
  const filePath = path.join(papersDir, file);
  console.log(`正在处理: ${file}`);
  
  // 读取文件内容
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const paperData = JSON.parse(fileContent);
  
  // 更新每个问题
  if (paperData.questions && Array.isArray(paperData.questions)) {
    let updatedQuestions = 0;
    let updatedOptions = 0;
    
    // 遍历所有问题
    paperData.questions.forEach(question => {
      // 将问题的image字段转换为images数组
      if (question.image && (!question.images || question.images.length === 0)) {
        question.images = [question.image];
        updatedQuestions++;
      } else if (!question.images) {
        question.images = [];
      }
      
      // 将选项的image字段转换为images数组
      if (question.options && Array.isArray(question.options)) {
        question.options.forEach(option => {
          if (option.image && (!option.images || option.images.length === 0)) {
            option.images = [option.image];
            updatedOptions++;
          } else if (!option.images) {
            option.images = [];
          }
        });
      }
    });
    
    console.log(`  - 更新了 ${updatedQuestions} 个题目的图片字段`);
    console.log(`  - 更新了 ${updatedOptions} 个选项的图片字段`);
    
    // 写回文件
    fs.writeFileSync(filePath, JSON.stringify(paperData, null, 2), 'utf8');
  }
});

console.log('所有试卷更新完成！'); 