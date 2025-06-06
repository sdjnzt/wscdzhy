// 摄像头型号
const CAMERA_MODELS = {
  dome: { name: 'DS-2DC6223IW-A', desc: '200万球型摄像机' },
  bullet: { name: 'DS-2CD3T25D-I5', desc: '200万筒型摄像机' },
  ptz: { name: 'DS-2DE7230IW-AE', desc: '300万PTZ摄像机' },
  panoramic: { name: 'DS-2CD6924F-IS', desc: '全景摄像机' }
}

// 生成摄像头数据
export const getCameraData = () => {
  return [
    {
      id: 'east',
      label: '东区',
      children: [
        { id: 1, label: '1号楼大门', type: '球机', status: '在线' },
        { id: 2, label: '2号楼电梯厅', type: '半球', status: '在线' },
        { id: 3, label: '东区车库入口', type: '枪机', status: '在线' },
        { id: 4, label: '东区休闲广场', type: '球机', status: '在线' }
      ]
    },
    {
      id: 'west',
      label: '西区',
      children: [
        { id: 5, label: '3号楼大门', type: '球机', status: '在线' },
        { id: 6, label: '4号楼电梯厅', type: '半球', status: '离线' },
        { id: 7, label: '西区车库入口', type: '枪机', status: '在线' },
        { id: 8, label: '西区儿童乐园', type: '球机', status: '在线' }
      ]
    },
    {
      id: 'north',
      label: '北区',
      children: [
        { id: 9, label: '5号楼大门', type: '球机', status: '在线' },
        { id: 10, label: '6号楼电梯厅', type: '半球', status: '在线' },
        { id: 11, label: '北区车库入口', type: '枪机', status: '在线' },
        { id: 12, label: '北区健身广场', type: '球机', status: '在线' }
      ]
    },
    {
      id: 'south',
      label: '南区',
      children: [
        { id: 13, label: '7号楼大门', type: '球机', status: '在线' },
        { id: 14, label: '8号楼电梯厅', type: '半球', status: '在线' },
        { id: 15, label: '南区车库入口', type: '枪机', status: '在线' },
        { id: 16, label: '南区老年活动中心', type: '球机', status: '在线' }
      ]
    }
  ]
}

// 生成随机状态数据
export const generateStatusData = () => {
  return {
    totalCameras: 15,
    onlineCameras: 14,
    offlineCameras: 1,
    storageUsage: '78%',
    networkStatus: '正常',
    systemStatus: '运行中',
    lastUpdate: new Date().toLocaleString('zh-CN')
  }
}

// 调度组数据
export const getDispatchGroups = () => {
  return [
    {
      id: 1,
      name: '东区物业组',
      members: [
        { id: 1, name: '张明', role: '组长', status: '在线', phone: '13901234567', dept: '物业部' },
        { id: 2, name: '李华', role: '副组长', status: '在线', phone: '13812345678', dept: '安保部' },
        { id: 3, name: '王安', role: '成员', status: '离线', phone: '13923456789', dept: '保洁部' },
        { id: 4, name: '赵琳', role: '成员', status: '在线', phone: '13834567890', dept: '客服部' },
        { id: 5, name: '刘婷', role: '成员', status: '在线', phone: '13745678901', dept: '绿化部' }
      ]
    },
    {
      id: 2,
      name: '西区巡逻队',
      members: [
        { id: 6, name: '陈强', role: '组长', status: '在线', phone: '13656789012', dept: '安保部' },
        { id: 7, name: '吴勇', role: '成员', status: '在线', phone: '13567890123', dept: '安保部' },
        { id: 8, name: '孙伟', role: '成员', status: '在线', phone: '13478901234', dept: '安保部' }
      ]
    },
    {
      id: 3,
      name: '北区维修组',
      members: [
        { id: 9, name: '周工', role: '组长', status: '在线', phone: '13389012345', dept: '工程部' },
        { id: 10, name: '郑师', role: '成员', status: '离线', phone: '13290123456', dept: '工程部' },
        { id: 11, name: '马师', role: '成员', status: '在线', phone: '13112345678', dept: '工程部' }
      ]
    },
    {
      id: 4,
      name: '南区服务组',
      members: [
        { id: 12, name: '黄丽', role: '组长', status: '在线', phone: '13923456789', dept: '客服部' },
        { id: 13, name: '林美', role: '成员', status: '在线', phone: '13834567890', dept: '保洁部' },
        { id: 14, name: '胡晓', role: '成员', status: '在线', phone: '13745678901', dept: '绿化部' }
      ]
    }
  ]
}

// 摄像头列表数据
export const getCameraList = () => {
  return [
    { id: 1, name: '人民路与解放路路口球机', location: '人民路与解放路交叉口', type: '球机', status: '在线' },
    { id: 2, name: '和平路监控点', location: '和平路沿街', type: '枪机', status: '在线' },
    { id: 3, name: '市民广场北入口', location: '市民广场北门', type: '球机', status: '在线' },
    { id: 4, name: '东门收费站卡口', location: '东门收费站入口', type: '卡口', status: '在线' },
    { id: 5, name: '西门收费站卡口', location: '西门收费站入口', type: '卡口', status: '在线' },
    { id: 6, name: '高新园区大门', location: '高新园区正门', type: '人脸抓拍', status: '在线' },
    { id: 7, name: '科技路监控点', location: '科技路与创新路交叉口', type: '枪机', status: '离线' },
    { id: 8, name: '商业街步行街入口', location: '商业街北入口', type: '球机', status: '在线' }
  ]
}

// 生成最近半个月内的随机时间
const getRandomRecentDate = () => {
  const now = new Date()
  const fifteenDaysAgo = new Date(now - 15 * 24 * 60 * 60 * 1000)
  const randomTime = fifteenDaysAgo.getTime() + Math.random() * (now.getTime() - fifteenDaysAgo.getTime())
  return new Date(randomTime).toLocaleString('zh-CN')
}

// 调度记录数据
export const getInitialRecords = () => {
  return [
    {
      id: 1,
      type: 'warning',
      time: getRandomRecentDate(),
      content: '消息通知：5号楼1单元1802业主反映水管漏水，请维修组及时处理',
      operator: '周工',
      target: '北区维修组'
    },
    {
      id: 2,
      type: 'primary',
      time: getRandomRecentDate(),
      content: '发起视频调度：西区儿童乐园',
      operator: '陈强',
      target: '西区巡逻队'
    },
    {
      id: 3,
      type: 'success',
      time: getRandomRecentDate(),
      content: '语音广播：请注意，东区休闲广场将于今日16:00进行环境消杀，请各位居民避让',
      operator: '张明',
      target: '东区物业组'
    },
    {
      id: 4,
      type: 'info',
      time: getRandomRecentDate(),
      content: '消息通知：南区老年活动中心举办棋牌比赛，请做好秩序维护',
      operator: '黄丽',
      target: '南区服务组'
    },
    {
      id: 5,
      type: 'warning',
      time: getRandomRecentDate(),
      content: '指令消息：3号楼地下车库有车辆乱停放，请及时处理',
      operator: '陈强',
      target: '西区巡逻队'
    },
    {
      id: 6,
      type: 'primary',
      time: getRandomRecentDate(),
      content: '发起视频调度：1号楼大门，检查门禁系统',
      operator: '张明',
      target: '东区物业组'
    },
    {
      id: 7,
      type: 'info',
      time: getRandomRecentDate(),
      content: '消息通知：2号楼电梯维保人员到场，请做好配合工作',
      operator: '周工',
      target: '北区维修组'
    },
    {
      id: 8,
      type: 'success',
      time: getRandomRecentDate(),
      content: '语音广播：南区老年活动中心举办太极课程，欢迎居民参加',
      operator: '黄丽',
      target: '南区服务组'
    }
  ]
} 