export const monitoringData = {
  throwingEvents: [
    {
      id: 1,
      time: '2025-01-20 14:30:22',
      location: 'A栋3单元',
      type: '高空抛物',
      status: '已处理',
      detail: '检测到3楼住户抛出垃圾'
    },
    {
      id: 2,
      time: '2025-01-20 13:45:15',
      location: 'B栋2单元',
      type: '高空抛物',
      status: '未处理',
      detail: '检测到12楼住户抛出烟头'
    },
    {
      id: 3,
      time: '2025-01-20 12:20:33',
      location: 'C栋1单元',
      type: '高空抛物',
      status: '处理中',
      detail: '检测到8楼住户抛出饮料瓶'
    },
    {
      id: 4,
      time: '2025-01-20 11:15:48',
      location: 'D栋4单元',
      type: '高空抛物',
      status: '已处理',
      detail: '检测到15楼住户抛出食物残渣'
    },
    {
      id: 5,
      time: '2025-01-20 10:05:27',
      location: 'A栋1单元',
      type: '高空抛物',
      status: '已处理',
      detail: '检测到6楼住户抛出纸巾'
    }
  ],
  
  elevatorEvents: [
    {
      id: 1,
      time: '2025-01-20 15:20:10',
      location: 'B栋1号电梯',
      type: '电瓶车违规进入',
      status: '未处理',
      detail: '检测到电瓶车进入电梯'
    },
    {
      id: 2,
      time: '2025-01-20 14:45:30',
      location: 'A栋2号电梯',
      type: '超载警告',
      status: '已处理',
      detail: '电梯超载预警，已自动报警'
    },
    {
      id: 3,
      time: '2025-01-20 13:30:22',
      location: 'C栋3号电梯',
      type: '困人事件',
      status: '已处理',
      detail: '电梯故障导致乘客被困'
    },
    {
      id: 4,
      time: '2025-01-20 12:15:40',
      location: 'D栋1号电梯',
      type: '异常震动',
      status: '已处理',
      detail: '检测到电梯运行异常震动'
    },
    {
      id: 5,
      time: '2025-01-20 11:05:18',
      location: 'B栋3号电梯',
      type: '按键故障',
      status: '处理中',
      detail: '电梯内部按键无响应'
    }
  ],
  
  securityEvents: [
    {
      id: 1,
      time: '2025-01-20 16:10:25',
      location: '小区东门',
      type: '可疑人员',
      status: '已处理',
      detail: '检测到陌生人员徘徊'
    },
    {
      id: 2,
      time: '2025-01-20 15:30:42',
      location: '地下车库B区',
      type: '异常聚集',
      status: '已处理',
      detail: '检测到多人聚集逗留'
    },
    {
      id: 3,
      time: '2025-01-20 14:20:15',
      location: '儿童游乐场',
      type: '安全隐患',
      status: '处理中',
      detail: '发现设施存在安全隐患'
    },
    {
      id: 4,
      time: '2025-01-20 13:15:33',
      location: '西门停车场',
      type: '车辆剐蹭',
      status: '未处理',
      detail: '检测到车辆剐蹭事件'
    },
    {
      id: 5,
      time: '2025-01-20 12:05:50',
      location: '北门快递点',
      type: '物品遗失',
      status: '已处理',
      detail: '居民报告快递物品遗失'
    }
  ]
} 