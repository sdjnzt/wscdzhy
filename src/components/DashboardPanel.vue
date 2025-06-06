<template>
  <div class="dashboard-panel">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in statistics" :key="stat.title">
        <el-card class="stat-card" :class="stat.type">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="32"><component :is="stat.icon"/></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时监控和告警信息 -->
    <el-row :gutter="20" class="dashboard-row">
      <el-col :span="16">
        <el-card class="monitor-card">
          <template #header>
            <div class="card-header">
              <span class="title">实时监控</span>
              <el-radio-group v-model="monitorType" size="small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="important">重点区域</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="monitor-grid">
            <div v-for="camera in activeMonitors" :key="camera.id" class="monitor-item">
              <div class="camera-preview">
                <div class="mock-preview">{{ camera.location }}</div>
                <el-tag
                  size="small"
                  :type="camera.status === '在线' ? 'success' : 'danger'"
                  class="camera-status"
                >
                  {{ camera.status }}
                </el-tag>
              </div>
              <div class="camera-info">
                <span>{{ camera.name }}</span>
                <el-tag size="small" :type="camera.type === '高空抛物' ? 'warning' : 'info'">
                  {{ camera.type }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="alarm-card">
          <template #header>
            <div class="card-header">
              <span class="title">今日告警</span>
              <el-tag type="danger" effect="dark" v-if="hasNewAlarm">新告警</el-tag>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="alarm in alarms"
              :key="alarm.id"
              :type="alarm.level"
              :timestamp="alarm.time"
              :hollow="alarm.status === '未处理'"
            >
              <h4>{{ alarm.title }}</h4>
              <p class="alarm-content">{{ alarm.content }}</p>
              <p class="alarm-location">
                <el-icon><Location /></el-icon>
                {{ alarm.location }}
              </p>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据统计图表 -->
    <el-row :gutter="20" class="dashboard-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title">设备运行状态</span>
              <el-select v-model="deviceType" size="small" style="width: 120px">
                <el-option label="全部设备" value="all" />
                <el-option label="摄像头" value="camera" />
                <el-option label="电梯" value="elevator" />
              </el-select>
            </div>
          </template>
          <div ref="deviceStatusChart" class="chart"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title">告警趋势</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="alarmTrendChart" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时数据 -->
    <el-row :gutter="20" class="dashboard-row">
      <el-col :span="8">
        <el-card class="data-card">
          <template #header>
            <div class="card-header">
              <span class="title">电梯运行状态</span>
            </div>
          </template>
          <div class="elevator-list">
            <div v-for="elevator in elevators" :key="elevator.id" class="elevator-item">
              <div class="elevator-info">
                <span class="elevator-name">{{ elevator.name }}</span>
                <el-tag :type="getElevatorStatusType(elevator.status)">
                  {{ elevator.status }}
                </el-tag>
              </div>
              <div class="elevator-detail">
                <span>当前楼层: {{ elevator.currentFloor }}F</span>
                <span>载重率: {{ elevator.load }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="data-card">
          <template #header>
            <div class="card-header">
              <span class="title">车位使用情况</span>
            </div>
          </template>
          <div ref="parkingChart" class="chart parking-chart"></div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="data-card">
          <template #header>
            <div class="card-header">
              <span class="title">访客统计</span>
            </div>
          </template>
          <div class="visitor-stats">
            <div class="stat-row" v-for="stat in visitorStats" :key="stat.label">
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-trend" :class="stat.trend">
                {{ stat.percentage }}
                <el-icon><component :is="stat.trend === 'up' ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import {
  Monitor, Warning, Van, User, Location,
  ArrowUp, ArrowDown, Connection, VideoCamera
} from '@element-plus/icons-vue'

// 顶部统计数据
const statistics = ref([
  {
    title: '设备总数',
    value: '386',
    type: 'primary',
    icon: 'Monitor',
    change: '+12'
  },
  {
    title: '今日告警',
    value: '24',
    type: 'danger',
    icon: 'Warning',
    change: '-5'
  },
  {
    title: '车位使用',
    value: '78%',
    type: 'warning',
    icon: 'Van',
    change: '+8%'
  },
  {
    title: '今日访客',
    value: '156',
    type: 'success',
    icon: 'User',
    change: '+23'
  }
])

// 监控点位数据
const monitorType = ref('all')
const activeMonitors = ref([
  {
    id: 1,
    name: '1号楼前广场',
    location: '1号监控点',
    status: '在线',
    type: '高空抛物'
  },
  {
    id: 2,
    name: '2号楼电梯口',
    location: '2号监控点',
    status: '在线',
    type: '人流监控'
  },
  {
    id: 3,
    name: '地下车库入口',
    location: '3号监控点',
    status: '在线',
    type: '车辆监控'
  },
  {
    id: 4,
    name: '小区南门',
    location: '4号监控点',
    status: '离线',
    type: '人流监控'
  }
])

// 告警数据
const hasNewAlarm = ref(true)
const alarms = ref([
  {
    id: 1,
    title: '高空抛物告警',
    content: '检测到3号楼高空抛物行为',
    time: '10:24:35',
    location: '3号楼西侧',
    level: 'danger',
    status: '未处理'
  },
  {
    id: 2,
    title: '电梯故障告警',
    content: '1号楼2号电梯出现故障',
    time: '09:15:22',
    location: '1号楼2号电梯',
    level: 'warning',
    status: '处理中'
  },
  {
    id: 3,
    title: '非法闯入告警',
    content: '检测到未登记车辆进入',
    time: '08:45:11',
    location: '地下车库入口',
    level: 'warning',
    status: '已处理'
  }
])

// 电梯数据
const elevators = ref([
  {
    id: 1,
    name: '1号楼1号电梯',
    status: '运行中',
    currentFloor: 8,
    load: 45
  },
  {
    id: 2,
    name: '1号楼2号电梯',
    status: '故障',
    currentFloor: 1,
    load: 0
  },
  {
    id: 3,
    name: '2号楼1号电梯',
    status: '运行中',
    currentFloor: 15,
    load: 65
  },
  {
    id: 4,
    name: '2号楼2号电梯',
    status: '维护中',
    currentFloor: 1,
    load: 0
  }
])

// 访客统计
const visitorStats = ref([
  {
    label: '今日访客',
    value: '156人',
    percentage: '12%',
    trend: 'up'
  },
  {
    label: '车辆进出',
    value: '289次',
    percentage: '8%',
    trend: 'up'
  },
  {
    label: '快递配送',
    value: '78单',
    percentage: '5%',
    trend: 'down'
  },
  {
    label: '平均停留',
    value: '2.5小时',
    percentage: '15%',
    trend: 'up'
  }
])

// 图表相关
const deviceType = ref('all')
const timeRange = ref('week')
const deviceStatusChart = ref(null)
const alarmTrendChart = ref(null)
const parkingChart = ref(null)

// 初始化图表
const initCharts = () => {
  // 设备状态图表
  const deviceChart = echarts.init(deviceStatusChart.value)
  deviceChart.setOption({
    title: {
      text: '设备状态分布'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: [
          { value: 320, name: '正常运行' },
          { value: 42, name: '离线' },
          { value: 18, name: '故障' },
          { value: 6, name: '维护中' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  })

  // 告警趋势图表
  const alarmChart = echarts.init(alarmTrendChart.value)
  alarmChart.setOption({
    title: {
      text: '告警趋势'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['高空抛物', '电梯故障', '非法闯入']
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '高空抛物',
        type: 'line',
        data: [5, 3, 6, 4, 8, 2, 3]
      },
      {
        name: '电梯故障',
        type: 'line',
        data: [2, 1, 3, 2, 1, 2, 1]
      },
      {
        name: '非法闯入',
        type: 'line',
        data: [1, 2, 1, 3, 2, 4, 2]
      }
    ]
  })

  // 车位使用图表
  const parking = echarts.init(parkingChart.value)
  parking.setOption({
    series: [
      {
        type: 'gauge',
        progress: {
          show: true,
          width: 18
        },
        axisLine: {
          lineStyle: {
            width: 18
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          length: 15,
          lineStyle: {
            width: 2,
            color: '#999'
          }
        },
        pointer: {
          show: false
        },
        axisLabel: {
          distance: 25,
          color: '#999',
          fontSize: 14
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#333'
        },
        data: [{
          value: 78,
          name: '车位使用率'
        }]
      }
    ]
  })

  // 监听窗口大小变化
  const handleResize = () => {
    deviceChart.resize()
    alarmChart.resize()
    parking.resize()
  }
  window.addEventListener('resize', handleResize)

  // 组件卸载时清理
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    deviceChart.dispose()
    alarmChart.dispose()
    parking.dispose()
  })
}

// 获取电梯状态样式
const getElevatorStatusType = (status) => {
  const typeMap = {
    '运行中': 'success',
    '故障': 'danger',
    '维护中': 'warning',
    '停用': 'info'
  }
  return typeMap[status] || 'info'
}

onMounted(() => {
  initCharts()
})
</script>

<style scoped>
.dashboard-panel {
  padding: 20px;
}

.dashboard-row {
  margin-top: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  padding: 20px;
  border-radius: 8px;
  margin-right: 15px;
}

.stat-info {
  flex-grow: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-title {
  color: #666;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.monitor-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.camera-preview {
  position: relative;
  height: 150px;
  background: #000;
}

.mock-preview {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
}

.camera-status {
  position: absolute;
  top: 10px;
  right: 10px;
}

.camera-info {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alarm-content {
  color: #666;
  margin: 5px 0;
}

.alarm-location {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #999;
  font-size: 12px;
}

.chart {
  height: 300px;
}

.parking-chart {
  height: 200px;
}

.elevator-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.elevator-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

.elevator-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.elevator-name {
  font-weight: bold;
}

.elevator-detail {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 14px;
}

.visitor-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: bold;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}

.stat-trend.up {
  color: #67c23a;
}

.stat-trend.down {
  color: #f56c6c;
}

/* 统计卡片主题样式 */
.primary .stat-icon {
  background-color: #ecf5ff;
  color: #409eff;
}

.success .stat-icon {
  background-color: #f0f9eb;
  color: #67c23a;
}

.warning .stat-icon {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.danger .stat-icon {
  background-color: #fef0f0;
  color: #f56c6c;
}
</style>