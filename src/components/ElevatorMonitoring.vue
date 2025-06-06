<template>
  <div class="elevator-monitoring">
    <el-row :gutter="20">
      <!-- 电梯状态统计 -->
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

      <!-- 电梯实时状态 -->
      <el-col :span="12">
        <el-card class="elevator-status">
          <template #header>
            <div class="card-header">
              <span class="title">电梯运行状态</span>
              <el-select v-model="selectedBuilding" placeholder="选择楼栋">
                <el-option
                  v-for="building in buildings"
                  :key="building.value"
                  :label="building.label"
                  :value="building.value"
                />
              </el-select>
            </div>
          </template>
          
          <div class="elevator-list">
            <div 
              v-for="elevator in filteredElevators" 
              :key="elevator.id"
              class="elevator-item"
              :class="elevator.status"
            >
              <div class="elevator-info">
                <div class="elevator-header">
                  <span class="elevator-name">{{ elevator.name }}</span>
                  <el-tag :type="getStatusType(elevator.status)">
                    {{ elevator.status }}
                  </el-tag>
                </div>
                <div class="elevator-details">
                  <div class="detail-item">
                    <span class="label">当前楼层</span>
                    <span class="value">{{ elevator.currentFloor }}F</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">运行方向</span>
                    <el-icon 
                      :size="20"
                      :class="elevator.direction"
                    >
                      <component :is="getDirectionIcon(elevator.direction)"/>
                    </el-icon>
                  </div>
                  <div class="detail-item">
                    <span class="label">载重</span>
                    <el-progress 
                      :percentage="elevator.load"
                      :status="getLoadStatus(elevator.load)"
                    />
                  </div>
                </div>
              </div>
              <div class="elevator-actions">
                <el-button-group>
                  <el-button 
                    size="small"
                    :type="elevator.status === '维护中' ? 'success' : 'warning'"
                    @click="handleMaintenance(elevator)"
                  >
                    {{ elevator.status === '维护中' ? '结束维护' : '开始维护' }}
                  </el-button>
                  <el-button 
                    size="small"
                    type="danger"
                    @click="handleEmergency(elevator)"
                  >
                    紧急停止
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 维护记录 -->
      <el-col :span="12">
        <el-card class="maintenance-record">
          <template #header>
            <div class="card-header">
              <span class="title">维护记录</span>
              <el-button type="primary" @click="handleAddMaintenance">
                <el-icon><Plus /></el-icon>添加记录
              </el-button>
            </div>
          </template>
          
          <el-timeline>
            <el-timeline-item
              v-for="record in maintenanceRecords"
              :key="record.id"
              :type="record.type"
              :timestamp="record.time"
              :icon="getMaintenanceIcon(record.type)"
            >
              <h4>{{ record.title }}</h4>
              <p>{{ record.description }}</p>
              <p class="record-info">
                <span>维护人员：{{ record.maintainer }}</span>
                <span>维护时长：{{ record.duration }}</span>
              </p>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <!-- 故障统计图表 -->
      <el-col :span="24">
        <el-card class="fault-statistics">
          <template #header>
            <div class="card-header">
              <span class="title">故障统计</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
                <el-radio-button label="year">本年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <div class="charts-container">
            <div ref="faultTrendChart" class="chart"></div>
            <div ref="faultTypeChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 维护记录表单 -->
    <el-dialog
      v-model="dialogVisible"
      title="添加维护记录"
      width="500px"
    >
      <el-form :model="maintenanceForm" label-width="100px">
        <el-form-item label="电梯">
          <el-select v-model="maintenanceForm.elevatorId" placeholder="请选择电梯">
            <el-option
              v-for="elevator in elevators"
              :key="elevator.id"
              :label="elevator.name"
              :value="elevator.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维护类型">
          <el-select v-model="maintenanceForm.type">
            <el-option label="定期保养" value="regular" />
            <el-option label="故障维修" value="repair" />
            <el-option label="年度检修" value="annual" />
          </el-select>
        </el-form-item>
        <el-form-item label="维护说明">
          <el-input
            type="textarea"
            v-model="maintenanceForm.description"
            rows="3"
          />
        </el-form-item>
        <el-form-item label="维护人员">
          <el-input v-model="maintenanceForm.maintainer" />
        </el-form-item>
        <el-form-item label="维护时长">
          <el-input-number 
            v-model="maintenanceForm.duration"
            :min="0.5"
            :step="0.5"
          />
          <span class="unit">小时</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMaintenance">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Plus,
  ArrowUp,
  ArrowDown,
  Tools,
  Warning,
  Connection
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

// 统计数据
const statistics = ref([
  {
    title: '运行电梯',
    value: '24/26',
    icon: 'Connection',
    type: 'success',
    change: '+1'
  },
  {
    title: '维护中',
    value: '2',
    icon: 'Tools',
    type: 'warning',
    change: '0'
  },
  {
    title: '故障数',
    value: '1',
    icon: 'Warning',
    type: 'danger',
    change: '-2'
  },
  {
    title: '今日运载',
    value: '3,856',
    icon: 'User',
    type: 'primary',
    change: '+526'
  }
])

// 楼栋数据
const buildings = ref([
  { label: 'A栋', value: 'A', floors: 32 },
  { label: 'B栋', value: 'B', floors: 28 },
  { label: 'C栋', value: 'C', floors: 26 },
  { label: 'D栋', value: 'D', floors: 30 }
])

const selectedBuilding = ref('A')

// 电梯数据
const elevators = ref([
  {
    id: 1,
    name: 'A栋1号电梯',
    building: 'A',
    status: '运行中',
    currentFloor: 8,
    direction: 'up',
    load: 45,
    lastMaintenance: '2025-01-20',
    nextMaintenance: '2024-01-25',
    manufacturer: '通力电梯',
    model: 'TL-3000',
    capacity: '1000kg',
    speed: '2.5m/s',
    installDate: '2022-06-15'
  },
  {
    id: 2,
    name: 'A栋2号电梯',
    building: 'A',
    status: '运行中',
    currentFloor: 15,
    direction: 'down',
    load: 65,
    lastMaintenance: '2025-01-19',
    nextMaintenance: '2025-01-26',
    manufacturer: '通力电梯',
    model: 'TL-3000',
    capacity: '1000kg',
    speed: '2.5m/s',
    installDate: '2022-06-15'
  },
  {
    id: 3,
    name: 'A栋3号电梯',
    building: 'A',
    status: '维护中',
    currentFloor: 1,
    direction: 'stop',
    load: 0,
    lastMaintenance: '2024-03-20',
    nextMaintenance: '2024-05-20',
    manufacturer: '通力电梯',
    model: 'TL-3000',
    capacity: '1000kg',
    speed: '2.5m/s',
    installDate: '2022-06-15'
  },
  {
    id: 4,
    name: 'B栋1号电梯',
    building: 'B',
    status: '运行中',
    currentFloor: 12,
    direction: 'up',
    load: 35,
    lastMaintenance: '2024-02-25',
    nextMaintenance: '2024-04-25',
    manufacturer: '迅达电梯',
    model: 'XD-2800',
    capacity: '800kg',
    speed: '2.0m/s',
    installDate: '2022-08-20'
  },
  {
    id: 5,
    name: 'B栋2号电梯',
    building: 'B',
    status: '故障',
    currentFloor: 6,
    direction: 'stop',
    load: 0,
    lastMaintenance: '2025-01-21',
    nextMaintenance: '2025-01-25',
    manufacturer: '迅达电梯',
    model: 'XD-2800',
    capacity: '800kg',
    speed: '2.0m/s',
    installDate: '2022-08-20'
  }
])

// 维护记录
const maintenanceRecords = ref([
  {
    id: 1,
    type: 'success',
    time: '2025-01-21 14:30:00',
    title: 'A栋3号电梯-年度检修',
    description: '完成电梯年度检修工作，更换主钢缆、曳引轮衬垫，检查制动器',
    maintainer: '张工',
    duration: '4.5',
    parts: ['主钢缆', '曳引轮衬垫', '制动器衬片'],
    cost: 12500
  },
  {
    id: 2,
    type: 'warning',
    time: '2025-01-22 09:15:00',
    title: 'B栋2号电梯-故障维修',
    description: '电梯门机故障维修，更换门机控制器，调试平层精度',
    maintainer: '李工',
    duration: '2.5',
    parts: ['门机控制器', '限位开关'],
    cost: 3800
  },
  {
    id: 3,
    type: 'success',
    time: '2025-01-21 10:20:00',
    title: 'A栋1号电梯-季度保养',
    description: '完成季度保养工作，检查曳引机、控制柜、轿厢装置',
    maintainer: '王工',
    duration: '3.0',
    parts: ['润滑油', '控制器滤网'],
    cost: 1500
  }
])

const dialogVisible = ref(false)
const timeRange = ref('week')
const faultTrendChart = ref(null)
const faultTypeChart = ref(null)

const maintenanceForm = ref({
  elevatorId: '',
  type: '',
  description: '',
  maintainer: '',
  duration: 1
})

// 过滤电梯列表
const filteredElevators = computed(() => {
  return elevators.value.filter(
    elevator => elevator.building === selectedBuilding.value
  )
})

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    '运行中': 'success',
    '维护中': 'warning',
    '故障': 'danger',
    '停用': 'info'
  }
  return types[status] || 'info'
}

// 获取方向图标
const getDirectionIcon = (direction) => {
  return direction === 'up' ? 'ArrowUp' : 'ArrowDown'
}

// 获取载重状态
const getLoadStatus = (load) => {
  if (load > 90) return 'exception'
  if (load > 70) return 'warning'
  return 'success'
}

// 获取维护记录图标
const getMaintenanceIcon = (type) => {
  return type === 'warning' ? Warning : Tools
}

// 处理维护操作
const handleMaintenance = (elevator) => {
  const action = elevator.status === '维护中' ? '结束' : '开始'
  ElMessageBox.confirm(
    `确定要${action}对${elevator.name}的维护吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.success(`已${action}维护`)
  })
}

// 处理紧急停止
const handleEmergency = (elevator) => {
  ElMessageBox.confirm(
    `确定要紧急停止${elevator.name}吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger',
    }
  ).then(() => {
    ElMessage.success('已发送紧急停止指令')
  })
}

// 添加维护记录
const handleAddMaintenance = () => {
  maintenanceForm.value = {
    elevatorId: '',
    type: '',
    description: '',
    maintainer: '',
    duration: 1
  }
  dialogVisible.value = true
}

// 提交维护记录
const submitMaintenance = () => {
  ElMessage.success('维护记录已添加')
  dialogVisible.value = false
}

// 初始化图表
onMounted(() => {
  // 故障趋势图
  const trendChart = echarts.init(faultTrendChart.value)
  trendChart.setOption({
    title: {
      text: '故障趋势分析'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [5, 3, 4, 2, 3, 1, 2],
      type: 'line',
      smooth: true,
      name: '故障次数',
      areaStyle: {}
    }]
  })

  // 故障类型图
  const typeChart = echarts.init(faultTypeChart.value)
  typeChart.setOption({
    title: {
      text: '故障类型分布'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      type: 'pie',
      radius: '50%',
      data: [
        { value: 35, name: '门机故障' },
        { value: 25, name: '平层故障' },
        { value: 15, name: '按钮故障' },
        { value: 15, name: '制动器故障' },
        { value: 10, name: '其他故障' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  })
})
</script>

<style scoped>
.elevator-monitoring {
  padding: 20px;
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

.elevator-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.elevator-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  transition: all 0.3s;
}

.elevator-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.elevator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.elevator-name {
  font-size: 16px;
  font-weight: bold;
}

.elevator-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.label {
  color: #666;
  font-size: 12px;
}

.value {
  font-size: 16px;
  font-weight: bold;
}

.elevator-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.maintenance-record {
  height: 400px;
  overflow-y: auto;
}

.record-info {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 12px;
  margin-top: 5px;
}

.charts-container {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 20px;
  height: 300px;
}

.chart {
  height: 100%;
}

.up {
  color: #67c23a;
}

.down {
  color: #f56c6c;
}

.unit {
  margin-left: 8px;
  color: #666;
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