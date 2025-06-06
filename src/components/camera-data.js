// 修改摄像头状态类型
const CameraStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  CONNECTING: 'connecting'  // 添加连接中状态
}

// 生成摄像头数据
export const getCameraData = () => {
  return [
    {
      id: '1',
      label: 'A栋',
      type: 'area',
      children: [
        {
          id: 'a-1',
          label: 'A栋大门',
          type: 'camera',
          status: CameraStatus.CONNECTING,  // 改为连接中状态
          model: 'DS-2CD3T25D-I5',
          ip: '192.168.1.101'
        },
        {
          id: 'a-2',
          label: 'A栋1单元门厅',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD3T25D-I5',
          ip: '192.168.1.102'
        },
        {
          id: 'a-3',
          label: 'A栋电梯间',
          type: 'camera',
          status: 'offline',
          model: 'DS-2CD3T25D-I5',
          ip: '192.168.1.103'
        },
        {
          id: 'a-4',
          label: 'A栋2单元门厅',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD3T25D-I5',
          ip: '192.168.1.104'
        },
        {
          id: 'a-5',
          label: 'A栋后门',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD3T25D-I5',
          ip: '192.168.1.105'
        }
      ]
    },
    {
      id: '2',
      label: '地下车库',
      type: 'area',
      children: [
        {
          id: 'p-1',
          label: '地库入口',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD6924F-IS',
          ip: '192.168.1.201'
        },
        {
          id: 'p-2',
          label: '地库A区',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD6924F-IS',
          ip: '192.168.1.202'
        },
        {
          id: 'p-3',
          label: '地库B区',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD6924F-IS',
          ip: '192.168.1.203'
        },
        {
          id: 'p-4',
          label: '地库出口',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD6924F-IS',
          ip: '192.168.1.204'
        }
      ]
    },
    {
      id: '3',
      label: '公共区域',
      type: 'area',
      children: [
        {
          id: 'pub-1',
          label: '中心广场',
          type: 'camera',
          status: 'online',
          model: 'DS-2DC6223IW-A',
          ip: '192.168.1.301'
        },
        {
          id: 'pub-2',
          label: '篮球场',
          type: 'camera',
          status: 'online',
          model: 'DS-2DC6223IW-A',
          ip: '192.168.1.302'
        },
        {
          id: 'pub-3',
          label: '垃圾投放点',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD3T25D-I5',
          ip: '192.168.1.303'
        },
        {
          id: 'pub-4',
          label: '游泳池',
          type: 'camera',
          status: 'online',
          model: 'DS-2DC6223IW-A',
          ip: '192.168.1.304'
        },
        {
          id: 'pub-5',
          label: '健身区',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD3T25D-I5',
          ip: '192.168.1.305'
        }
      ]
    },
    {
      id: '4',
      label: 'B栋',
      type: 'area',
      children: [
        {
          id: 'b-1',
          label: 'B栋大门',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD3T25D-I5',
          ip: '192.168.1.401'
        },
        {
          id: 'b-2',
          label: 'B栋1单元门厅',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD3T25D-I5',
          ip: '192.168.1.402'
        },
        {
          id: 'b-3',
          label: 'B栋电梯间',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD3T25D-I5',
          ip: '192.168.1.403'
        }
      ]
    },
    {
      id: '5',
      label: '周界防范',
      type: 'area',
      children: [
        {
          id: 'per-1',
          label: '东门岗亭',
          type: 'camera',
          status: 'online',
          model: 'DS-2DE7230IW-AE',
          ip: '192.168.1.501'
        },
        {
          id: 'per-2',
          label: '西门岗亭',
          type: 'camera',
          status: 'online',
          model: 'DS-2DE7230IW-AE',
          ip: '192.168.1.502'
        },
        {
          id: 'per-3',
          label: '南围墙',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD6924F-IS',
          ip: '192.168.1.503'
        },
        {
          id: 'per-4',
          label: '北围墙',
          type: 'camera',
          status: 'online',
          model: 'DS-2CD6924F-IS',
          ip: '192.168.1.504'
        }
      ]
    }
  ]
}

// 生成系统状态数据
export const getSystemStatus = () => {
  return {
    totalCameras: 60,
    onlineCameras: 57,
    offlineCameras: 1,
    storageUsage: '78%',
    networkStatus: '正常',
    systemStatus: '运行中',
    lastUpdate: new Date().toLocaleString('zh-CN')
  }
} 