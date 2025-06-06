<template>
  <div class="command-dashboard">
    <!-- 顶部操作栏 -->
    <div class="command-header">
      <div class="title-section">
        <h2>指挥调度中心</h2>
        <div class="status-badges">
          <div class="status-badge online">
            <span class="badge-dot"></span>
            <span class="badge-text">在线设备: 132</span>
          </div>
          <div class="status-badge alert">
            <span class="badge-dot"></span>
            <span class="badge-text">告警: 2</span>
          </div>
        </div>
      </div>
      <div class="action-buttons">
        <el-button-group>
          <el-button type="primary" @click="handleEmergency">
            <el-icon><AlarmClock /></el-icon>紧急调度
          </el-button>
          <el-button type="warning" @click="handleBroadcast">
            <el-icon><Microphone /></el-icon>紧急广播
          </el-button>
          <el-button type="danger" @click="handleEvacuation">
            <el-icon><Warning /></el-icon>疏散指令
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧面板 - 区域树和告警列表 -->
      <div class="left-panel">
        <div class="panel-section">
          <div class="section-header">
            <h3>园区区域</h3>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索区域"
              prefix-icon="Search"
              clearable
              size="small"
            />
          </div>
          <div class="section-content">
            <el-tree
              :data="areaData"
              :props="defaultProps"
              highlight-current
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <el-tag 
                    size="small" 
                    :type="data.status === 'normal' ? 'success' : 'danger'"
                  >
                    {{ data.status === 'normal' ? '正常' : '异常' }}
                  </el-tag>
                </div>
              </template>
            </el-tree>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-header">
            <h3>实时告警</h3>
            <el-button type="primary" link>全部</el-button>
          </div>
          <div class="section-content">
            <div class="alert-list">
              <div 
                v-for="alert in alertList" 
                :key="alert.id" 
                class="alert-item"
                :class="{ 'high-priority': alert.level === 'high' }"
              >
                <div class="alert-icon" :class="alert.type">
                  <el-icon v-if="alert.type === 'security'"><Lock /></el-icon>
                  <el-icon v-else-if="alert.type === 'fire'"><Warning /></el-icon>
                  <el-icon v-else-if="alert.type === 'device'"><Connection /></el-icon>
                  <el-icon v-else><InfoFilled /></el-icon>
                </div>
                <div class="alert-content">
                  <div class="alert-title">{{ alert.title }}</div>
                  <div class="alert-info">
                    <span>{{ alert.location }}</span>
                    <span>{{ alert.time }}</span>
                  </div>
                </div>
                <div class="alert-actions">
                  <el-button size="small" type="primary" @click="handleAlertAction(alert)">
                    处理
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 中间地图区域 -->
      <div class="center-panel">
        <div class="map-container" id="command-map">
          <div class="map-overlay">
            <div class="map-controls">
              <div class="control-button" @click="zoomIn">
                <el-icon><Plus /></el-icon>
              </div>
              <div class="control-button" @click="zoomOut">
                <el-icon><Minus /></el-icon>
              </div>
              <div class="control-button" @click="resetView">
                <el-icon><Aim /></el-icon>
              </div>
            </div>
            <div class="map-layers">
              <div 
                class="layer-button" 
                v-for="layer in mapLayers" 
                :key="layer.id"
                :class="{ active: layer.active }"
                @click="toggleLayer(layer)"
              >
                {{ layer.name }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="command-tools">
          <div 
            class="tool-item" 
            v-for="tool in commandTools" 
            :key="tool.id"
            @click="activateTool(tool)"
          >
            <el-icon><component :is="tool.icon" /></el-icon>
            <span>{{ tool.name }}</span>
          </div>
        </div>
      </div>
      
      <!-- 右侧信息面板 -->
      <div class="right-panel">
        <div class="panel-section">
          <div class="section-header">
            <h3>设备状态</h3>
            <el-select v-model="deviceType" size="small" placeholder="设备类型">
              <el-option label="全部" value="all" />
              <el-option label="摄像头" value="camera" />
              <el-option label="门禁" value="door" />
              <el-option label="传感器" value="sensor" />
            </el-select>
          </div>
          <div class="section-content">
            <div id="device-status-chart" class="chart-container"></div>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-header">
            <h3>人员分布</h3>
            <el-radio-group v-model="personnelView" size="small">
              <el-radio-button label="area">区域</el-radio-button>
              <el-radio-button label="time">时段</el-radio-button>
            </el-radio-group>
          </div>
          <div class="section-content">
            <div id="personnel-chart" class="chart-container"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部状态栏 -->
    <div class="status-footer">
      <div class="status-item">
        <div class="status-label">系统状态</div>
        <div class="status-value normal">正常运行</div>
      </div>
      <div class="status-item">
        <div class="status-label">网络延迟</div>
        <div class="status-value">12ms</div>
      </div>
      <div class="status-item">
        <div class="status-label">最近更新</div>
        <div class="status-value">{{ currentTime }}</div>
      </div>
      <div class="status-spacer"></div>
      <div class="status-item">
        <el-button type="primary" link @click="refreshData">
          <el-icon><Refresh /></el-icon> 刷新数据
        </el-button>
      </div>
    </div>
    
    <!-- 紧急调度对话框 -->
    <el-dialog
      v-model="emergencyDialogVisible"
      title="紧急调度"
      width="50%"
    >
      <div class="emergency-form">
        <el-form :model="emergencyForm" label-width="100px">
          <el-form-item label="事件类型">
            <el-select v-model="emergencyForm.type" placeholder="选择事件类型">
              <el-option label="火灾" value="fire" />
              <el-option label="安全事件" value="security" />
              <el-option label="设备故障" value="device" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="事件区域">
            <el-cascader
              v-model="emergencyForm.area"
              :options="emergencyAreas"
              placeholder="选择区域"
            />
          </el-form-item>
          <el-form-item label="紧急程度">
            <el-rate v-model="emergencyForm.level" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="emergencyForm.description"
              type="textarea"
              rows="3"
            />
          </el-form-item>
          <el-form-item label="调度人员">
            <el-select
              v-model="emergencyForm.personnel"
              multiple
              placeholder="选择调度人员"
            >
              <el-option label="安保组A" value="security_a" />
              <el-option label="消防组B" value="fire_b" />
              <el-option label="技术组C" value="tech_c" />
              <el-option label="管理组D" value="management_d" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="emergencyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEmergency">
            确认调度
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { 
  AlarmClock, 
  Microphone, 
  Warning, 
  Search, 
  Lock, 
  Connection, 
  InfoFilled, 
  Plus, 
  Minus, 
  Aim, 
  Refresh,
  Location,
  VideoCamera,
  ChatLineRound,
  Position,
  Operation,
  DataLine,
  User
} from '@element-plus/icons-vue'

// 状态数据
const searchKeyword = ref('')
const deviceType = ref('all')
const personnelView = ref('area')
const currentTime = ref(new Date().toLocaleTimeString())
const emergencyDialogVisible = ref(false)

// 区域树数据
const areaData = ref([
  {
    label: 'A区',
    status: 'normal',
    children: [
      { label: 'A1号楼', status: 'normal' },
      { label: 'A2号楼', status: 'normal' },
      { label: 'A区停车场', status: 'normal' }
    ]
  },
  {
    label: 'B区',
    status: 'normal',
    children: [
      { label: 'B1号楼', status: 'normal' },
      { label: 'B2号楼', status: 'normal' }
    ]
  },
  {
    label: 'C区',
    status: 'alert',
    children: [
      { label: 'C1号楼', status: 'alert' },
      { label: 'C2号楼', status: 'normal' }
    ]
  },
  {
    label: 'D区',
    status: 'normal',
    children: [
      { label: 'D1号楼', status: 'normal' }
    ]
  }
])

const defaultProps = {
  children: 'children',
  label: 'label'
}

// 告警列表数据
const alertList = ref([
  {
    id: 1,
    type: 'security',
    level: 'high',
    title: '未授权人员进入',
    location: 'C1号楼 3楼',
    time: '10分钟前'
  },
  {
    id: 2,
    type: 'device',
    level: 'medium',
    title: '摄像头离线',
    location: 'B区停车场',
    time: '30分钟前'
  },
  {
    id: 3,
    type: 'fire',
    level: 'high',
    title: '烟雾报警器触发',
    location: 'A2号楼 5楼',
    time: '1小时前'
  },
  {
    id: 4,
    type: 'device',
    level: 'low',
    title: '门禁系统异常',
    location: 'D1号楼大厅',
    time: '2小时前'
  }
])

// 地图图层
const mapLayers = ref([
  { id: 1, name: '摄像头', active: true },
  { id: 2, name: '门禁', active: true },
  { id: 3, name: '人员', active: true },
  { id: 4, name: '车辆', active: false }
])

// 调度工具
const commandTools = ref([
  { id: 1, name: '查看', icon: 'VideoCamera', active: true },
  { id: 2, name: '广播', icon: 'ChatLineRound', active: false },
  { id: 3, name: '指令', icon: 'Operation', active: false },
  { id: 4, name: '跟踪', icon: 'Position', active: false },
  { id: 5, name: '统计', icon: 'DataLine', active: false }
])

// 紧急调度表单
const emergencyForm = ref({
  type: '',
  area: [],
  level: 3,
  description: '',
  personnel: []
})

// 紧急调度区域选项
const emergencyAreas = ref([
  {
    value: 'A',
    label: 'A区',
    children: [
      { value: 'A1', label: 'A1号楼' },
      { value: 'A2', label: 'A2号楼' },
      { value: 'A_parking', label: 'A区停车场' }
    ]
  },
  {
    value: 'B',
    label: 'B区',
    children: [
      { value: 'B1', label: 'B1号楼' },
      { value: 'B2', label: 'B2号楼' }
    ]
  },
  {
    value: 'C',
    label: 'C区',
    children: [
      { value: 'C1', label: 'C1号楼' },
      { value: 'C2', label: 'C2号楼' }
    ]
  },
  {
    value: 'D',
    label: 'D区',
    children: [
      { value: 'D1', label: 'D1号楼' }
    ]
  }
])

// 图表实例
let deviceChart = null
let personnelChart = null

// 初始化设备状态图表
const initDeviceChart = () => {
  const chartDom = document.getElementById('device-status-chart')
  if (!chartDom) return
  
  deviceChart = echarts.init(chartDom)
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: '60%',
        data: [
          { value: 735, name: '正常', itemStyle: { color: '#67C23A' } },
          { value: 48, name: '离线', itemStyle: { color: '#909399' } },
          { value: 24, name: '异常', itemStyle: { color: '#F56C6C' } },
          { value: 18, name: '维护', itemStyle: { color: '#E6A23C' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {c} ({d}%)',
          fontSize: 12
        }
      }
    ]
  }
  
  deviceChart.setOption(option)
}

// 初始化人员分布图表
const initPersonnelChart = () => {
  const chartDom = document.getElementById('personnel-chart')
  if (!chartDom) return
  
  personnelChart = echarts.init(chartDom)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['A区', 'B区', 'C区', 'D区'],
      axisLabel: {
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12
      }
    },
    series: [
      {
        name: '人员数量',
        type: 'bar',
        data: [120, 80, 60, 40],
        itemStyle: {
          color: '#409EFF',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }
  
  personnelChart.setOption(option)
}

// 初始化园区地图
const initMap = () => {
  const mapDom = document.getElementById('command-map')
  if (!mapDom) return
  
  // 使用SVG模拟园区地图，不依赖外部API
  const mapSvg = `
    <svg width="100%" height="100%" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景 -->
      <rect x="0" y="0" width="800" height="600" fill="#E8F4FC" />
      
      <!-- 道路 -->
      <path d="M100,100 L700,100 L700,500 L100,500 Z" stroke="#CCCCCC" stroke-width="20" fill="none" />
      <path d="M400,100 L400,500" stroke="#CCCCCC" stroke-width="15" fill="none" />
      <path d="M100,300 L700,300" stroke="#CCCCCC" stroke-width="15" fill="none" />
      
      <!-- A区 -->
      <rect x="150" y="150" width="200" height="100" fill="#AED6F1" stroke="#3498DB" stroke-width="2" />
      <text x="250" y="200" font-size="20" text-anchor="middle" fill="#2874A6">A区</text>
      
      <!-- B区 -->
      <rect x="450" y="150" width="200" height="100" fill="#AED6F1" stroke="#3498DB" stroke-width="2" />
      <text x="550" y="200" font-size="20" text-anchor="middle" fill="#2874A6">B区</text>
      
      <!-- C区 -->
      <rect x="150" y="350" width="200" height="100" fill="#F5B7B1" stroke="#E74C3C" stroke-width="2" />
      <text x="250" y="400" font-size="20" text-anchor="middle" fill="#922B21">C区</text>
      
      <!-- D区 -->
      <rect x="450" y="350" width="200" height="100" fill="#AED6F1" stroke="#3498DB" stroke-width="2" />
      <text x="550" y="400" font-size="20" text-anchor="middle" fill="#2874A6">D区</text>
      
      <!-- 摄像头图标 -->
      <circle cx="150" cy="150" r="5" fill="#E74C3C" />
      <circle cx="350" cy="150" r="5" fill="#E74C3C" />
      <circle cx="150" cy="250" r="5" fill="#E74C3C" />
      <circle cx="350" cy="250" r="5" fill="#E74C3C" />
      
      <circle cx="450" cy="150" r="5" fill="#E74C3C" />
      <circle cx="650" cy="150" r="5" fill="#E74C3C" />
      <circle cx="450" cy="250" r="5" fill="#E74C3C" />
      <circle cx="650" cy="250" r="5" fill="#E74C3C" />
      
      <circle cx="150" cy="350" r="5" fill="#E74C3C" />
      <circle cx="350" cy="350" r="5" fill="#E74C3C" />
      <circle cx="150" cy="450" r="5" fill="#E74C3C" />
      <circle cx="350" cy="450" r="5" fill="#E74C3C" />
      
      <circle cx="450" cy="350" r="5" fill="#E74C3C" />
      <circle cx="650" cy="350" r="5" fill="#E74C3C" />
      <circle cx="450" cy="450" r="5" fill="#E74C3C" />
      <circle cx="650" cy="450" r="5" fill="#E74C3C" />
      
      <!-- 门禁图标 -->
      <rect x="245" y="150" r="5" width="10" height="10" fill="#27AE60" />
      <rect x="545" y="150" r="5" width="10" height="10" fill="#27AE60" />
      <rect x="245" y="350" r="5" width="10" height="10" fill="#27AE60" />
      <rect x="545" y="350" r="5" width="10" height="10" fill="#27AE60" />
      
      <!-- 标注提示 -->
      <circle cx="730" cy="120" r="5" fill="#E74C3C" />
      <text x="750" y="125" font-size="12" text-anchor="start" fill="#333333">摄像头</text>
      
      <rect x="725" cy="145" width="10" height="10" fill="#27AE60" />
      <text x="750" y="155" font-size="12" text-anchor="start" fill="#333333">门禁</text>
      
      <!-- 告警标记 -->
      <circle cx="250" cy="400" r="15" fill="rgba(231, 76, 60, 0.5)" stroke="#E74C3C" stroke-width="2">
        <animate attributeName="r" values="15;20;15" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <text x="250" y="405" font-size="16" text-anchor="middle" fill="#FFFFFF">!</text>
    </svg>
  `;
  
  // 插入SVG地图
  mapDom.innerHTML = mapSvg;
  
  // 添加互动元素
  const mapAreas = mapDom.querySelectorAll('rect[x][y][width][height]');
  mapAreas.forEach(area => {
    area.style.cursor = 'pointer';
    area.addEventListener('mouseover', () => {
      const originalFill = area.getAttribute('fill');
      area.setAttribute('original-fill', originalFill);
      area.setAttribute('fill', '#D6EAF8');
    });
    area.addEventListener('mouseout', () => {
      const originalFill = area.getAttribute('original-fill');
      area.setAttribute('fill', originalFill);
    });
    area.addEventListener('click', () => {
      const areaText = area.nextElementSibling.textContent;
      console.log(`点击了 ${areaText}`);
    });
  });
}

// 地图操作方法
const zoomIn = () => {
  console.log('地图放大')
}

const zoomOut = () => {
  console.log('地图缩小')
}

const resetView = () => {
  console.log('重置地图视图')
}

const toggleLayer = (layer) => {
  layer.active = !layer.active
  console.log(`切换图层: ${layer.name}, 状态: ${layer.active ? '显示' : '隐藏'}`)
}

const activateTool = (tool) => {
  commandTools.value.forEach(t => {
    t.active = t.id === tool.id
  })
  console.log(`激活工具: ${tool.name}`)
}

// 处理区域点击
const handleNodeClick = (data) => {
  console.log('选中区域:', data.label)
}

// 处理告警操作
const handleAlertAction = (alert) => {
  console.log('处理告警:', alert.title)
}

// 处理紧急调度
const handleEmergency = () => {
  emergencyDialogVisible.value = true
}

// 提交紧急调度
const submitEmergency = () => {
  console.log('紧急调度表单:', emergencyForm.value)
  emergencyDialogVisible.value = false
}

// 处理紧急广播
const handleBroadcast = () => {
  console.log('触发紧急广播')
}

// 处理疏散指令
const handleEvacuation = () => {
  console.log('触发疏散指令')
}

// 刷新数据
const refreshData = () => {
  currentTime.value = new Date().toLocaleTimeString()
  console.log('刷新数据')
}

// 监听窗口大小变化
const handleResize = () => {
  deviceChart?.resize()
  personnelChart?.resize()
}

// 定时更新时间
let timer = null

// 组件挂载
onMounted(() => {
  // 使用setTimeout确保DOM已完全渲染
  setTimeout(() => {
    initDeviceChart()
    initPersonnelChart()
    initMap()
  }, 100)
  
  // 定时更新时间
  timer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
  
  window.addEventListener('resize', handleResize)
})

// 组件卸载
onUnmounted(() => {
  deviceChart?.dispose()
  personnelChart?.dispose()
  clearInterval(timer)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.command-dashboard {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  background-color: #f5f7fa;
}

/* 顶部操作栏 */
.command-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

.title-section {
  display: flex;
  align-items: center;
}

.title-section h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-right: 24px;
}

.status-badges {
  display: flex;
  gap: 16px;
}

.status-badge {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 16px;
  background-color: #f5f7fa;
}

.status-badge.online {
  background-color: rgba(103, 194, 58, 0.1);
}

.status-badge.alert {
  background-color: rgba(245, 108, 108, 0.1);
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.online .badge-dot {
  background-color: #67C23A;
}

.alert .badge-dot {
  background-color: #F56C6C;
}

.badge-text {
  font-size: 14px;
  color: #606266;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  flex: 1;
  gap: 16px;
  margin-bottom: 16px;
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 中间地图面板 */
.center-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 右侧面板 */
.right-panel {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 面板通用样式 */
.panel-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.section-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

/* 区域树自定义样式 */
.custom-tree-node {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}

/* 告警列表 */
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border-radius: 8px;
  background-color: #f5f7fa;
  border-left: 4px solid #409EFF;
  transition: all 0.3s;
}

.alert-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.alert-item.high-priority {
  border-left-color: #F56C6C;
  background-color: rgba(245, 108, 108, 0.05);
}

.alert-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
}

.alert-icon.security {
  background-color: rgba(144, 147, 153, 0.2);
  color: #909399;
}

.alert-icon.fire {
  background-color: rgba(245, 108, 108, 0.2);
  color: #F56C6C;
}

.alert-icon.device {
  background-color: rgba(230, 162, 60, 0.2);
  color: #E6A23C;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.alert-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

/* 地图容器 */
.map-container {
  flex: 1;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
}

.map-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-self: flex-end;
  pointer-events: auto;
}

.control-button {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.control-button:hover {
  background-color: #ecf5ff;
}

.map-layers {
  display: flex;
  gap: 8px;
  align-self: flex-start;
  pointer-events: auto;
}

.layer-button {
  padding: 6px 12px;
  border-radius: 4px;
  background-color: white;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  color: #606266;
}

.layer-button.active {
  background-color: #409EFF;
  color: white;
}

.layer-button:hover {
  transform: translateY(-2px);
}

/* 指挥工具 */
.command-tools {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.tool-item:hover {
  transform: translateY(-2px);
  color: #409EFF;
}

.tool-item i {
  font-size: 24px;
}

.tool-item span {
  font-size: 14px;
}

/* 图表容器 */
.chart-container {
  height: 100%;
  min-height: 200px;
}

/* 底部状态栏 */
.status-footer {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.status-item {
  display: flex;
  align-items: center;
  margin-right: 24px;
}

.status-label {
  font-size: 14px;
  color: #909399;
  margin-right: 8px;
}

.status-value {
  font-size: 14px;
  color: #303133;
}

.status-value.normal {
  color: #67C23A;
}

.status-spacer {
  flex: 1;
}

/* 响应式调整 */
@media (max-width: 1400px) {
  .main-content {
    flex-direction: column;
  }
  
  .left-panel, .right-panel {
    width: 100%;
    flex-direction: row;
  }
  
  .command-tools {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .left-panel, .right-panel {
    flex-direction: column;
  }
  
  .command-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .action-buttons {
    width: 100%;
  }
}
</style> 