// 生成最近半个月内的随机时间
const getRandomTime = (daysAgo) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  // 生成当天内的随机时间
  date.setHours(Math.floor(Math.random() * 24))
  date.setMinutes(Math.floor(Math.random() * 60))
  date.setSeconds(Math.floor(Math.random() * 60))
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 安保人员名单
const securityStaff = [
  { name: '王建国', title: '安保队长' },
  { name: '李明', title: '安保主管' },
  { name: '张伟', title: '安保员' },
  { name: '刘强', title: '安保员' },
  { name: '陈勇', title: '安保员' }
]

// 物业人员名单
const propertyStaff = [
  { name: '赵志强', title: '物业经理' },
  { name: '孙丽', title: '物业主管' },
  { name: '周红', title: '物业客服' },
  { name: '吴小明', title: '维修主管' },
  { name: '郑大勇', title: '维修工程师' }
]

// 生成处理记录
const generateRecords = (eventTime, type) => {
  const records = []
  // 系统预警
  records.push({
    id: 1,
    time: eventTime,
    type: 'warning',
    title: '系统预警',
    content: '智能监控系统检测到异常事件',
    operator: '智慧安防系统'
  })

  // 安保人员处理
  const responseTime = new Date(new Date(eventTime).getTime() + 5 * 60 * 1000) // 5分钟后
  const securityPerson = securityStaff[Math.floor(Math.random() * securityStaff.length)]
  records.push({
    id: 2,
    time: responseTime.toLocaleString('zh-CN'),
    type: 'primary',
    title: '安保响应',
    content: `安保人员已到达${type.label}现场进行处理`,
    operator: `${securityPerson.name}（${securityPerson.title}）`
  })

  // 处理完成
  const completeTime = new Date(new Date(eventTime).getTime() + 20 * 60 * 1000) // 20分钟后
  const propertyPerson = propertyStaff[Math.floor(Math.random() * propertyStaff.length)]
  records.push({
    id: 3,
    time: completeTime.toLocaleString('zh-CN'),
    type: 'success',
    title: '处理完成',
    content: generateHandleContent(type, propertyPerson),
    operator: `${propertyPerson.name}（${propertyPerson.title}）`
  })

  // 对于某些事件类型，添加后续跟进记录
  if (['throwing', 'intrusion', 'fire'].includes(type.value)) {
    const followUpTime = new Date(new Date(eventTime).getTime() + 40 * 60 * 1000) // 40分钟后
    const manager = propertyStaff.find(p => p.title === '物业经理')
    records.push({
      id: 4,
      time: followUpTime.toLocaleString('zh-CN'),
      type: 'info',
      title: '后续跟进',
      content: generateFollowUpContent(type),
      operator: `${manager.name}（${manager.title}）`
    })
  }

  return records
}

// 生成处理完成内容
function generateHandleContent(type, staff) {
  const contents = {
    throwing: '现场已清理完毕，已做好记录并上报相关部门',
    intrusion: '可疑人员已被劝离，已加强该区域巡查频次',
    fire: '消防隐患已排除，已完成安全检查',
    crowd: '现场秩序已恢复正常，人员已有序疏散',
    vehicle: '违停车辆已移动，已做好违规记录',
    elevator: '电梯故障已修复，已完成测试运行',
    noise: '噪音问题已处理，相关人员已做好沟通',
    facility: '设施已修复完毕，已恢复正常使用'
  }
  return contents[type.value]
}

// 生成后续跟进内容
function generateFollowUpContent(type) {
  const contents = {
    throwing: '已召开业主委员会会议，讨论加装监控等防范措施',
    intrusion: '已完成周边安防设施排查，并制定新的巡查方案',
    fire: '已组织全体业主进行消防安全培训，并更新应急预案'
  }
  return contents[type.value]
}

// 事件类型定义
export const eventTypes = [
  { value: 'throwing', label: '高空抛物', icon: 'Warning' },
  { value: 'intrusion', label: '非法闯入', icon: 'Lock' },
  { value: 'fire', label: '火灾隐患', icon: 'Aim' },
  { value: 'crowd', label: '人员聚集', icon: 'User' },
  { value: 'vehicle', label: '车辆违停', icon: 'Van' },
  { value: 'elevator', label: '电梯故障', icon: 'Service' },
  { value: 'noise', label: '噪音扰民', icon: 'Bell' },
  { value: 'facility', label: '设施损坏', icon: 'Tools' }
]

// 事件等级定义
export const eventLevels = [
  { value: 'urgent', label: '紧急', type: 'danger' },
  { value: 'high', label: '重要', type: 'warning' },
  { value: 'normal', label: '普通', type: 'info' }
]

// 生成事件数据
export const generateEvents = () => {
  const events = []
  const locations = [
    'A栋1单元', 'A栋2单元', 'B栋1单元', 'B栋2单元',
    'C栋1单元', '地下车库A区', '地下车库B区', '小区大门',
    '中心广场', '儿童游乐场', '篮球场', '垃圾站'
  ]

  // 生成15天内的随机事件
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 15) // 0-14天前
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const level = eventLevels[Math.floor(Math.random() * eventLevels.length)]
    const location = locations[Math.floor(Math.random() * locations.length)]
    const eventTime = getRandomTime(daysAgo)

    events.push({
      id: i + 1,
      title: `${location}${type.label}事件`,
      type,
      level,
      time: eventTime,
      duration: `${Math.floor(Math.random() * 20 + 5)}分钟`, // 5-25分钟
      location,
      description: generateDescription(type, location),
      status: { 
        label: daysAgo > 1 ? '已处理' : Math.random() > 0.5 ? '已处理' : '处理中',
        type: daysAgo > 1 ? 'success' : Math.random() > 0.5 ? 'success' : 'warning'
      },
      videoUrl: `/videos/event${i + 1}.mp4`,
      records: generateRecords(eventTime, type)
    })
  }

  // 按时间降序排序
  return events.sort((a, b) => new Date(b.time) - new Date(a.time))
}

// 生成事件描述
function generateDescription(type, location) {
  const descriptions = {
    throwing: [
      `监控发现有居民从${location}向下抛掷物品，存在安全隐患`,
      `${location}发生高空抛物行为，已及时发现并处理`,
      `${location}监控捕捉到高空抛物行为，立即启动应急预案`
    ],
    intrusion: [
      `${location}发现可疑人员徘徊，已通知保安前往查看`,
      `${location}监控发现未授权人员进入，已启动安保响应`,
      `${location}检测到异常入侵行为，保安已到场处理`
    ],
    fire: [
      `${location}烟感报警器触发，消防人员已到场检查`,
      `${location}发现明火隐患，已及时处置`,
      `${location}监测到烟雾报警，已展开消防检查`
    ],
    crowd: [
      `${location}出现大量人员聚集，已派人疏导`,
      `${location}人员密度超标，已启动疏散预案`,
      `${location}检测到异常人群聚集，正在进行疏导`
    ],
    vehicle: [
      `${location}发现违规停放车辆，已通知车主移动`,
      `${location}出现占用消防通道车辆，已进行处理`,
      `${location}检测到违停行为，保安已前往处理`
    ],
    elevator: [
      `${location}电梯发生故障，维修人员已在处理`,
      `${location}电梯运行异常，已启动应急预案`,
      `${location}电梯故障报警，维保人员已到场`
    ],
    noise: [
      `${location}收到噪音投诉，物业已前往处理`,
      `${location}出现严重噪音干扰，已进行劝导`,
      `${location}检测到持续性噪音，已派员查看`
    ],
    facility: [
      `${location}公共设施出现损坏，维修人员已到场`,
      `${location}设备设施异常，已安排维修`,
      `${location}发现设施故障，维修工作进行中`
    ]
  }

  const typeDescriptions = descriptions[type.value]
  return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)]
} 