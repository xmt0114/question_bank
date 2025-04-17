import { Paper, QuestionType } from '@/types/question'

export const mockPapers: Paper[] = [
  {
    id: 'robot-theory',
    name: '机器人一级理论',
    questions: [
      {
        id: 'rt-1',
        type: QuestionType.SingleChoice,
        title: '机器人的三大定律是由哪位科幻作家提出的？',
        options: [
          { id: 'A', text: '艾萨克·阿西莫夫' },
          { id: 'B', text: '阿瑟·克拉克' },
          { id: 'C', text: '罗伯特·海因莱因' },
          { id: 'D', text: '菲利普·迪克' }
        ],
        answer: 'A',
        explanation: '机器人三大定律是由科幻作家艾萨克·阿西莫夫在1942年提出的，用于规范机器人的行为准则。'
      },
      {
        id: 'rt-2',
        type: QuestionType.MultipleChoice,
        title: '以下哪些是工业机器人的主要组成部分？',
        options: [
          { id: 'A', text: '机械本体' },
          { id: 'B', text: '控制系统' },
          { id: 'C', text: '驱动系统' },
          { id: 'D', text: '感知系统' }
        ],
        answer: ['A', 'B', 'C', 'D'],
        explanation: '工业机器人通常由机械本体、控制系统、驱动系统和感知系统四大部分组成。'
      },
      {
        id: 'rt-3',
        type: QuestionType.TrueFalse,
        title: '机器人可以完全替代人类工作，不需要人类监督。',
        options: [
          { id: 'A', text: '正确' },
          { id: 'B', text: '错误' }
        ],
        answer: 'B',
        explanation: '尽管机器人可以自动完成许多任务，但目前的技术水平下，大多数机器人系统仍需要人类监督和干预，特别是在复杂、变化的环境中。'
      },
      {
        id: 'rt-4',
        type: QuestionType.SingleChoice,
        title: '下图所示的机器人属于哪种类型？',
        image: 'https://via.placeholder.com/600x400?text=Robot+Arm+Image',
        options: [
          { id: 'A', text: '直角坐标机器人' },
          { id: 'B', text: '关节型机器人' },
          { id: 'C', text: 'SCARA机器人' },
          { id: 'D', text: '并联机器人' }
        ],
        answer: 'B',
        explanation: '图中所示的是典型的关节型机器人，它模仿人类手臂的结构，具有多个旋转关节，可以实现复杂的空间运动。'
      },
      {
        id: 'rt-5',
        type: QuestionType.MultipleChoice,
        title: '以下哪些是机器人编程的常用方法？',
        options: [
          { id: 'A', text: '示教编程' },
          { id: 'B', text: '离线编程' },
          { id: 'C', text: '引导式编程' },
          { id: 'D', text: '自然语言编程' }
        ],
        answer: ['A', 'B', 'C'],
        explanation: '机器人编程的常用方法包括示教编程、离线编程和引导式编程。自然语言编程目前在工业机器人中应用较少。'
      }
    ]
  },
  {
    id: 'robot-practice',
    name: '机器人一级实操',
    questions: [
      {
        id: 'rp-1',
        type: QuestionType.SingleChoice,
        title: '在操作工业机器人时，以下哪种行为是正确的？',
        options: [
          { id: 'A', text: '在机器人运行时进入其工作范围' },
          { id: 'B', text: '在未经培训的情况下操作机器人' },
          { id: 'C', text: '在操作前检查安全装置是否正常工作' },
          { id: 'D', text: '在机器人出现异常时继续使用' }
        ],
        answer: 'C',
        explanation: '操作工业机器人前必须检查安全装置是否正常工作，这是确保操作安全的基本步骤。'
      },
      {
        id: 'rp-2',
        type: QuestionType.MultipleChoice,
        title: '以下哪些是工业机器人示教器的基本功能？',
        options: [
          { id: 'A', text: '手动控制机器人运动' },
          { id: 'B', text: '编辑和修改程序' },
          { id: 'C', text: '设置系统参数' },
          { id: 'D', text: '自动修复机器人硬件故障' }
        ],
        answer: ['A', 'B', 'C'],
        explanation: '工业机器人示教器的基本功能包括手动控制机器人运动、编辑和修改程序、设置系统参数等，但不能自动修复硬件故障。'
      },
      {
        id: 'rp-3',
        type: QuestionType.TrueFalse,
        title: '在示教模式下，机器人会以最高速度运行。',
        options: [
          { id: 'A', text: '正确' },
          { id: 'B', text: '错误' }
        ],
        answer: 'B',
        explanation: '在示教模式下，机器人通常会以较低的速度运行，以确保操作人员的安全。'
      },
      {
        id: 'rp-4',
        type: QuestionType.SingleChoice,
        title: '下图中的示教器按钮表示什么功能？',
        image: 'https://via.placeholder.com/600x400?text=Teach+Pendant+Image',
        options: [
          { id: 'A', text: '启动程序' },
          { id: 'B', text: '紧急停止' },
          { id: 'C', text: '切换坐标系' },
          { id: 'D', text: '增加速度' }
        ],
        answer: 'B',
        explanation: '图中红色的蘑菇状按钮是紧急停止按钮，用于在紧急情况下立即停止机器人的所有动作。'
      },
      {
        id: 'rp-5',
        type: QuestionType.MultipleChoice,
        title: '在进行机器人点位示教时，需要记录哪些信息？',
        options: [
          { id: 'A', text: '位置坐标' },
          { id: 'B', text: '姿态角度' },
          { id: 'C', text: '运动速度' },
          { id: 'D', text: '机器人序列号' }
        ],
        answer: ['A', 'B', 'C'],
        explanation: '在进行机器人点位示教时，通常需要记录位置坐标、姿态角度和运动速度等信息，机器人序列号与点位示教无关。'
      }
    ]
  },
  {
    id: 'primary-theory',
    name: '小学理论学习',
    questions: [
      {
        id: 'pt-1',
        type: QuestionType.SingleChoice,
        title: '下列哪个是地球上最大的海洋？',
        options: [
          { id: 'A', text: '大西洋' },
          { id: 'B', text: '印度洋' },
          { id: 'C', text: '太平洋' },
          { id: 'D', text: '北冰洋' }
        ],
        answer: 'C',
        explanation: '太平洋是地球上最大的海洋，面积约占地球表面的三分之一。'
      },
      {
        id: 'pt-2',
        type: QuestionType.MultipleChoice,
        title: '以下哪些是我国的四大发明？',
        options: [
          { id: 'A', text: '造纸术' },
          { id: 'B', text: '印刷术' },
          { id: 'C', text: '指南针' },
          { id: 'D', text: '火药' }
        ],
        answer: ['A', 'B', 'C', 'D'],
        explanation: '我国的四大发明是造纸术、印刷术、指南针和火药，它们对世界文明的发展产生了重大影响。'
      },
      {
        id: 'pt-3',
        type: QuestionType.TrueFalse,
        title: '地球是太阳系中最大的行星。',
        options: [
          { id: 'A', text: '正确' },
          { id: 'B', text: '错误' }
        ],
        answer: 'B',
        explanation: '地球不是太阳系中最大的行星，木星才是太阳系中最大的行星。'
      },
      {
        id: 'pt-4',
        type: QuestionType.SingleChoice,
        title: '下图中的动物属于哪一类？',
        image: 'https://via.placeholder.com/600x400?text=Dolphin+Image',
        options: [
          { id: 'A', text: '鱼类' },
          { id: 'B', text: '两栖类' },
          { id: 'C', text: '爬行类' },
          { id: 'D', text: '哺乳类' }
        ],
        answer: 'D',
        explanation: '图中的海豚是哺乳动物，尽管它们生活在水中，但它们通过肺呼吸，产仔并哺乳。'
      },
      {
        id: 'pt-5',
        type: QuestionType.MultipleChoice,
        title: '以下哪些是常见的可再生能源？',
        options: [
          { id: 'A', text: '太阳能' },
          { id: 'B', text: '风能' },
          { id: 'C', text: '煤炭' },
          { id: 'D', text: '水能' }
        ],
        answer: ['A', 'B', 'D'],
        explanation: '太阳能、风能和水能都是可再生能源，而煤炭是不可再生的化石燃料。'
      }
    ]
  }
]
