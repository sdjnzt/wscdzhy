<template>
  <div class="welcome-dashboard">
    <!-- 顶部统计卡片 -->
    <div class="stat-row">
      <div class="stat-card" @click="handleShortcut(shortcuts[0])">
        <div class="stat-icon camera">
          <i class="el-icon"><VideoCamera /></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">128</div>
          <div class="stat-title">视频监控</div>
          <div class="stat-desc">在线设备</div>
        </div>
      </div>
      
      <div class="stat-card" @click="handleShortcut(shortcuts[1])">
        <div class="stat-icon face">
          <i class="el-icon"><User /></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">2,560</div>
          <div class="stat-title">人脸识别</div>
          <div class="stat-desc">人脸库数量</div>
        </div>
      </div>
      
      <div class="stat-card" @click="handleShortcut(shortcuts[2])">
        <div class="stat-icon door">
          <i class="el-icon"><Key /></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">86</div>
          <div class="stat-title">门禁管理</div>
          <div class="stat-desc">在线门禁</div>
        </div>
      </div>
      
      <div class="stat-card" @click="handleShortcut(shortcuts[3])">
        <div class="stat-icon vehicle">
          <i class="el-icon"><Van /></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">24</div>
          <div class="stat-title">车辆道闸</div>
          <div class="stat-desc">在线道闸</div>
        </div>
      </div>
    </div>

    <!-- 中间内容区域 -->
    <div class="dashboard-content">
      <!-- 左侧图表和地图 -->
      <div class="content-left">
        <div class="chart-wrapper">
          <div class="chart-header">
            <h3>园区人流量</h3>
            <div class="chart-actions">
              <el-radio-group v-model="flowTimeRange" size="small">
                <el-radio-button label="day">日</el-radio-button>
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div id="flow-chart" class="chart-body"></div>
        </div>
        
        <div class="chart-wrapper">
          <div class="chart-header">
            <h3>车辆通行量</h3>
            <div class="chart-actions">
              <el-radio-group v-model="vehicleTimeRange" size="small">
                <el-radio-button label="day">日</el-radio-button>
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div id="vehicle-chart" class="chart-body"></div>
        </div>
        
        <div class="map-wrapper">
          <div class="chart-header">
            <h3>园区实时监控</h3>
            <div class="chart-actions">
              <el-button-group>
                <el-button type="primary" size="small" @click="startMonitoring">
                  <el-icon><VideoPlay /></el-icon> 开始监控
                </el-button>
                <el-button type="danger" size="small" @click="stopMonitoring">
                  <el-icon><VideoPause /></el-icon> 停止监控
                </el-button>
              </el-button-group>
            </div>
          </div>
          <div id="park-map" class="map-body">
            <div class="map-overlay">
              <div class="map-stats">
                <div class="map-stat-item">
                  <div class="map-stat-value">24</div>
                  <div class="map-stat-label">摄像头</div>
                </div>
                <div class="map-stat-item">
                  <div class="map-stat-value">4</div>
                  <div class="map-stat-label">门禁</div>
                </div>
                <div class="map-stat-item">
                  <div class="map-stat-value">6</div>
                  <div class="map-stat-label">道闸</div>
              </div>
              </div>
            </div>
          </div>
        </div>
    </div>

      <!-- 右侧快捷入口和通知 -->
      <div class="content-right">
    <div class="quick-access">
          <h3>快捷入口</h3>
          <div class="shortcut-grid">
            <div v-for="item in shortcuts" :key="item.id" 
                 class="shortcut-item" 
                 @click="handleShortcut(item)">
              <i class="el-icon"><component :is="item.icon" /></i>
              <span>{{ item.name }}</span>
            </div>
          </div>
    </div>

        <div class="notification-panel">
          <div class="panel-header">
            <h3>系统通知</h3>
                <el-button type="primary" link>查看更多</el-button>
              </div>
          <div class="notification-list">
            <div v-for="notice in notices" :key="notice.id" class="notification-item">
              <div class="notification-badge" :class="notice.type"></div>
              <div class="notification-content">
                <div class="notification-title">
                  <el-tag size="small" :type="notice.type">{{ notice.tag }}</el-tag>
                  <span>{{ notice.title }}</span>
                </div>
                <div class="notification-time">{{ notice.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  VideoCamera,
  User,
  Key,
  Van,
  VideoPlay,
  VideoPause,
  Monitor,
  Bell,
  Setting,
  Document,
  DataLine,
  Warning
} from '@element-plus/icons-vue'

const router = useRouter()

// 时间范围选择
const flowTimeRange = ref('day')
const vehicleTimeRange = ref('day')

// 图表实例
let flowChart = null
let vehicleChart = null

// 快捷入口数据
const shortcuts = [
  { id: 1, name: '视频监控', icon: 'VideoCamera', path: '/video' },
  { id: 2, name: '人脸识别', icon: 'User', path: '/face' },
  { id: 3, name: '门禁管理', icon: 'Key', path: '/access' },
  { id: 4, name: '车辆道闸', icon: 'Van', path: '/vehicle' },
  { id: 5, name: '访客系统', icon: 'Document', path: '/visitor' },
  { id: 6, name: '公共广播', icon: 'Bell', path: '/broadcast' },
  { id: 7, name: '刷卡识别', icon: 'Key', path: '/card' },
  { id: 8, name: '电子巡更', icon: 'DataLine', path: '/patrol' },
  { id: 9, name: '智慧会议', icon: 'Monitor', path: '/meeting' },
  { id: 10, name: '系统设置', icon: 'Setting', path: '/settings' }
]

// 通知数据
const notices = [
  {
    id: 1,
    title: '系统升级通知：将于今晚22:00进行系统维护',
    type: 'warning',
    tag: '系统',
    time: '10分钟前'
  },
  {
    id: 2,
    title: 'A区大门门禁设备离线，请及时处理',
    type: 'danger',
    tag: '告警',
    time: '30分钟前'
  },
  {
    id: 3,
    title: '新增访客预约：张三将于今日14:00来访',
    type: 'info',
    tag: '访客',
    time: '1小时前'
  },
  {
    id: 4,
    title: 'B区停车场车位已满，请注意疏导',
    type: 'warning',
    tag: '提醒',
    time: '2小时前'
  }
]

// 初始化人员流量图表
const initFlowChart = () => {
  const chartDom = document.getElementById('flow-chart')
  if (!chartDom) return
  
  flowChart = echarts.init(chartDom)
  
  const option = {
    color: ['#409EFF', '#67C23A'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['进入人数', '离开人数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: '进入人数',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(64, 158, 255, 0.8)'
              },
              {
                offset: 1,
                color: 'rgba(64, 158, 255, 0.1)'
              }
            ]
          }
        },
        emphasis: {
          focus: 'series'
        },
        data: [120, 132, 101, 134, 90, 230, 210, 182]
      },
      {
        name: '离开人数',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(103, 194, 58, 0.8)'
              },
              {
                offset: 1,
                color: 'rgba(103, 194, 58, 0.1)'
              }
            ]
          }
        },
        emphasis: {
          focus: 'series'
        },
        data: [220, 182, 191, 234, 290, 330, 310, 123]
      }
    ]
  }
  
  flowChart.setOption(option)
}

// 初始化车辆通行图表
const initVehicleChart = () => {
  const chartDom = document.getElementById('vehicle-chart')
  if (!chartDom) return
  
  vehicleChart = echarts.init(chartDom)
  
  const option = {
    color: ['#409EFF', '#67C23A'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['进入车辆', '离开车辆']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        axisTick: { show: false },
        data: ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00']
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: '进入车辆',
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        data: [20, 32, 21, 34, 40, 30, 20, 12]
      },
      {
        name: '离开车辆',
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        data: [30, 22, 31, 24, 30, 20, 10, 22]
      }
    ]
  }
  
  vehicleChart.setOption(option)
}

// 初始化园区地图
const initParkMap = () => {
  const mapDom = document.getElementById('park-map')
  if (!mapDom) return
  
  // 这里可以集成真实地图API，如百度地图、高德地图等
  // 现在使用背景图模拟
  mapDom.style.backgroundImage = "url('https://api.map.baidu.com/staticimage/v2?ak=E4805d16520de693a3fe707cdc962045&width=600&height=400&zoom=16')";
}

// 处理快捷入口点击
const handleShortcut = (item) => {
  router.push(item.path)
}

// 开始园区监控
const startMonitoring = () => {
  // 实际项目中可以调用摄像头API开始监控
  console.log('开始园区监控')
}

// 停止园区监控
const stopMonitoring = () => {
  // 实际项目中可以调用摄像头API停止监控
  console.log('停止园区监控')
}

// 监听窗口大小变化
const handleResize = () => {
  flowChart?.resize()
  vehicleChart?.resize()
}

// 初始化
onMounted(() => {
  // 使用setTimeout确保DOM已完全渲染
  setTimeout(() => {
    initFlowChart()
    initVehicleChart()
    initParkMap()
  }, 100)
  
  window.addEventListener('resize', handleResize)
})

// 清理资源
onUnmounted(() => {
  flowChart?.dispose()
  vehicleChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.welcome-dashboard {
  padding: 16px;
  height: calc(100vh - 120px);
  overflow: auto;
}

/* 顶部统计卡片 */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-icon i {
  font-size: 24px;
  color: #fff;
}

.stat-icon.camera {
  background: linear-gradient(135deg, #409EFF, #1E88E5);
}

.stat-icon.face {
  background: linear-gradient(135deg, #F56C6C, #E53935);
}

.stat-icon.door {
  background: linear-gradient(135deg, #67C23A, #43A047);
}

.stat-icon.vehicle {
  background: linear-gradient(135deg, #E6A23C, #FB8C00);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-title {
  font-size: 16px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-desc {
  font-size: 12px;
  color: #909399;
}

/* 内容区域 */
.dashboard-content {
  display: flex;
  gap: 16px;
  height: calc(100vh - 220px);
}

.content-left {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 图表和地图 */
.chart-wrapper, .map-wrapper {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  flex: 1;
}

.chart-header, .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-header h3, .panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.chart-body, .map-body {
  flex: 1;
  padding: 16px;
  height: 100%;
  min-height: 200px;
}

/* 地图 */
.map-body {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

.map-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.map-stats {
  display: flex;
  gap: 16px;
}

.map-stat-item {
  text-align: center;
}

.map-stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.map-stat-label {
  font-size: 12px;
  color: #606266;
}

/* 快捷入口 */
.quick-access, .notification-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.quick-access h3 {
  margin: 0;
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  border-bottom: 1px solid #f0f0f0;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.shortcut-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.shortcut-item:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
}

.shortcut-item i {
  font-size: 24px;
  color: #409EFF;
}

.shortcut-item span {
  font-size: 14px;
  color: #606266;
}

/* 通知面板 */
.notification-list {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 12px;
  margin-top: 6px;
}

.notification-badge.info {
  background-color: #409EFF;
}

.notification-badge.warning {
  background-color: #E6A23C;
}

.notification-badge.danger {
  background-color: #F56C6C;
}

.notification-content {
  flex: 1;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.notification-title span {
  font-size: 14px;
  color: #303133;
  word-break: break-word;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

/* 响应式调整 */
@media (max-width: 1400px) {
  .stat-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dashboard-content {
    flex-direction: column;
  }
  
  .content-left, .content-right {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .stat-row {
    grid-template-columns: 1fr;
  }
}
</style> 