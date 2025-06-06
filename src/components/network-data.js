// 生成系统状态数据
export const getSystemStatus = () => {
  return {
    platforms: 8,
    totalPlatforms: 10,
    onlineDevices: 357,
    networkStatus: '正常',
    bandwidth: '78%',
    lastUpdate: new Date().toLocaleString()
  }
}

// 生成平台列表数据
export const getPlatformList = () => {
  return [
    {
      name: '市公安局平台',
      type: 'GB/T28181',
      status: '在线',
      ip: '192.168.10.100',
      port: '5060',
      deviceCount: 156
    },
    {
      name: '区公安分局平台',
      type: 'GB/T28181',
      status: '在线',
      ip: '192.168.10.101',
      port: '5060',
      deviceCount: 89
    },
    {
      name: '交警大队平台',
      type: 'GB/T28181',
      status: '在线',
      ip: '192.168.10.102',
      port: '5060',
      deviceCount: 45
    },
    {
      name: '高新区平台',
      type: 'ONVIF',
      status: '在线',
      ip: '192.168.10.103',
      port: '80',
      deviceCount: 67
    },
    {
      name: '开发区平台',
      type: 'SDK',
      status: '离线',
      ip: '192.168.10.104',
      port: '8000',
      deviceCount: 34
    },
    {
      name: '社区监控平台',
      type: 'ONVIF',
      status: '在线',
      ip: '192.168.10.105',
      port: '80',
      deviceCount: 28
    },
    {
      name: '商业广场平台',
      type: 'SDK',
      status: '在线',
      ip: '192.168.10.106',
      port: '8000',
      deviceCount: 42
    },
    {
      name: '工业园区平台',
      type: 'GB/T28181',
      status: '离线',
      ip: '192.168.10.107',
      port: '5060',
      deviceCount: 51
    }
  ]
}

// 生成设备列表数据
export const getDeviceList = () => {
  return [
    {
      name: '枫林路口球机',
      ip: '192.168.1.100',
      platform: '市公安局平台',
      status: '在线',
      type: '球机',
      model: 'DS-2DC6223IW-A',
      location: '枫林路与银杏路交叉口'
    },
    {
      name: '银杏路监控点',
      ip: '192.168.1.101',
      platform: '市公安局平台',
      status: '在线',
      type: '枪机',
      model: 'DS-2CD3T25D-I5',
      location: '银杏路沿街'
    },
    {
      name: '市民广场1号',
      ip: '192.168.1.102',
      platform: '区公安分局平台',
      status: '在线',
      type: '球机',
      model: 'DS-2DC6223IW-A',
      location: '市民广场北入口'
    },
    {
      name: '市民广场2号',
      ip: '192.168.1.103',
      platform: '区公安分局平台',
      status: '离线',
      type: '枪机',
      model: 'DS-2CD3T25D-I5',
      location: '市民广场南入口'
    },
    {
      name: '东门收费站',
      ip: '192.168.1.104',
      platform: '交警大队平台',
      status: '在线',
      type: '卡口',
      model: 'DS-2CD7A27FWD-LZ',
      location: '东门收费站入口'
    },
    {
      name: '西门收费站',
      ip: '192.168.1.105',
      platform: '交警大队平台',
      status: '在线',
      type: '卡口',
      model: 'DS-2CD7A27FWD-LZ',
      location: '西门收费站入口'
    },
    {
      name: '高新园区大门',
      ip: '192.168.1.106',
      platform: '高新区平台',
      status: '在线',
      type: '人脸抓拍',
      model: 'DS-2CD7347WD-L',
      location: '高新园区正门'
    },
    {
      name: '科技路监控点',
      ip: '192.168.1.107',
      platform: '高新区平台',
      status: '在线',
      type: '枪机',
      model: 'DS-2CD3T25D-I5',
      location: '科技路与创新路交叉口'
    },
    {
      name: '商业街1号',
      ip: '192.168.1.108',
      platform: '商业广场平台',
      status: '在线',
      type: '球机',
      model: 'DS-2DC6223IW-A',
      location: '商业街步行街入口'
    },
    {
      name: '商业街2号',
      ip: '192.168.1.109',
      platform: '商业广场平台',
      status: '在线',
      type: '全景相机',
      model: 'DS-2CD6924F-IS',
      location: '商业街中心广场'
    }
  ]
} 