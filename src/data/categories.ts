import type { Category } from '@/types'

export const defaultCategories: Category[] = [
  {
    id: 'cat_food',
    name: '餐饮',
    type: 'expense',
    icon: '🍜',
    color: '#ef4444',
    keywords: ['餐厅', '饭店', '外卖', '美团', '饿了么', '肯德基', '麦当劳', '火锅', '烧烤', '咖啡', '星巴克', '奶茶', '午餐', '晚餐', '早餐', '小吃', '食堂']
  },
  {
    id: 'cat_transport',
    name: '交通',
    type: 'expense',
    icon: '🚗',
    color: '#3b82f6',
    keywords: ['地铁', '公交', '打车', '滴滴', '加油', '停车', '高铁', '火车', '机票', '航空', '出租', '网约车', '过路费']
  },
  {
    id: 'cat_shopping',
    name: '购物',
    type: 'expense',
    icon: '🛍️',
    color: '#8b5cf6',
    keywords: ['淘宝', '天猫', '京东', '拼多多', '超市', '商场', '便利店', '服装', '鞋子', '化妆品', '网购', '亚马逊']
  },
  {
    id: 'cat_entertainment',
    name: '娱乐',
    type: 'expense',
    icon: '🎮',
    color: '#ec4899',
    keywords: ['电影', '游戏', 'KTV', '酒吧', '演唱会', '旅游', '旅行', '酒店', '门票', '健身', '会员', '视频', '音乐']
  },
  {
    id: 'cat_house',
    name: '居家',
    type: 'expense',
    icon: '🏠',
    color: '#f59e0b',
    keywords: ['房租', '水电', '燃气', '物业', '网费', '话费', '电费', '水费', '煤气', '宽带', '家具', '家电', '装修']
  },
  {
    id: 'cat_medical',
    name: '医疗',
    type: 'expense',
    icon: '💊',
    color: '#10b981',
    keywords: ['医院', '药店', '药品', '体检', '挂号', '诊所', '牙', '看病']
  },
  {
    id: 'cat_education',
    name: '教育',
    type: 'expense',
    icon: '📚',
    color: '#6366f1',
    keywords: ['学费', '课程', '培训', '书本', '书', '考试', '学习', '学校']
  },
  {
    id: 'cat_communication',
    name: '通讯',
    type: 'expense',
    icon: '📱',
    color: '#14b8a6',
    keywords: ['话费', '流量', '手机', '宽带']
  },
  {
    id: 'cat_other_expense',
    name: '其他',
    type: 'expense',
    icon: '📝',
    color: '#94a3b8',
    keywords: []
  },
  {
    id: 'cat_salary',
    name: '工资',
    type: 'income',
    icon: '💰',
    color: '#10b981',
    keywords: ['工资', '薪水', '薪资', '收入', '发薪']
  },
  {
    id: 'cat_bonus',
    name: '奖金',
    type: 'income',
    icon: '🎁',
    color: '#f59e0b',
    keywords: ['奖金', '分红', '年终奖', '提成']
  },
  {
    id: 'cat_investment',
    name: '理财',
    type: 'income',
    icon: '📈',
    color: '#6366f1',
    keywords: ['利息', '理财', '基金', '股票', '投资', '分红']
  },
  {
    id: 'cat_refund',
    name: '退款',
    type: 'income',
    icon: '↩️',
    color: '#8b5cf6',
    keywords: ['退款', '退货', '报销']
  },
  {
    id: 'cat_other_income',
    name: '其他收入',
    type: 'income',
    icon: '💵',
    color: '#14b8a6',
    keywords: []
  }
]
