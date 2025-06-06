<template>
  <div class="vehicle-management">
    <el-row :gutter="20">
      <!-- 车辆统计 -->
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

      <!-- 车辆列表 -->
      <el-col :span="16">
        <el-card class="vehicle-list">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="title">车辆管理</span>
                <el-input
                  v-model="searchQuery"
                  placeholder="搜索车牌号/车主"
                  prefix-icon="Search"
                  style="width: 200px"
                />
              </div>
              <el-button type="primary" @click="handleAddVehicle">
                <el-icon><Plus /></el-icon>添加车辆
              </el-button>
            </div>
          </template>

          <el-table :data="filteredVehicles" style="width: 100%">
            <el-table-column type="expand">
              <template #default="props">
                <div class="vehicle-detail">
                  <el-descriptions :column="3" border>
                    <el-descriptions-item label="车主姓名">
                      {{ props.row.owner }}
                    </el-descriptions-item>
                    <el-descriptions-item label="联系电话">
                      {{ props.row.phone }}
                    </el-descriptions-item>
                    <el-descriptions-item label="所属小区">
                      {{ props.row.community }}
                    </el-descriptions-item>
                    <el-descriptions-item label="车位号">
                      {{ props.row.parkingSpace }}
                    </el-descriptions-item>
                    <el-descriptions-item label="车辆品牌">
                      {{ props.row.brand }}
                    </el-descriptions-item>
                    <el-descriptions-item label="车辆型号">
                      {{ props.row.model }}
                    </el-descriptions-item>
                    <el-descriptions-item label="注册时间">
                      {{ props.row.registerTime }}
                    </el-descriptions-item>
                    <el-descriptions-item label="到期时间">
                      {{ props.row.expireTime }}
                    </el-descriptions-item>
                    <el-descriptions-item label="备注">
                      {{ props.row.remark }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="plateNumber" label="车牌号" width="120"/>
            <el-table-column prop="owner" label="车主" width="100"/>
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="getVehicleType(scope.row.type)">
                  {{ scope.row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="parkingSpace" label="车位号" width="100"/>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button-group>
                  <el-button 
                    size="small"
                    type="primary"
                    @click="handleEdit(scope.row)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    size="small"
                    :type="scope.row.status === '已进入' ? 'danger' : 'success'"
                    @click="handleVehicleStatus(scope.row)"
                  >
                    {{ scope.row.status === '已进入' ? '离场' : '进场' }}
                  </el-button>
                  <el-button 
                    size="small"
                    type="danger"
                    @click="handleDelete(scope.row)"
                  >
                    删除
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 最近通行记录 -->
      <el-col :span="8">
        <el-card class="pass-records">
          <template #header>
            <div class="card-header">
              <span class="title">最近通行</span>
              <el-button text @click="viewAllRecords">
                查看全部<el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="record in passRecords"
              :key="record.id"
              :type="record.type"
              :timestamp="record.time"
              :hollow="record.type === 'primary'"
            >
              <div class="record-content">
                <span class="plate-number">{{ record.plateNumber }}</span>
                <span class="action">{{ record.action }}</span>
                <span class="location">{{ record.location }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <!-- 车辆统计图表 -->
      <el-col :span="24">
        <el-card class="vehicle-statistics">
          <template #header>
            <div class="card-header">
              <span class="title">车辆统计</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
                <el-radio-button label="year">本年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <div class="charts-container">
            <div ref="vehicleTrendChart" class="chart"></div>
            <div ref="parkingOccupancyChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 车辆表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加车辆' : '编辑车辆'"
      width="600px"
    >
      <el-form :model="vehicleForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号">
              <el-input v-model="vehicleForm.plateNumber"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车主姓名">
              <el-input v-model="vehicleForm.owner"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="vehicleForm.phone"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆类型">
              <el-select v-model="vehicleForm.type">
                <el-option label="业主车辆" value="业主车辆"/>
                <el-option label="访客车辆" value="访客车辆"/>
                <el-option label="物业车辆" value="物业车辆"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车辆品牌">
              <el-input v-model="vehicleForm.brand"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆型号">
              <el-input v-model="vehicleForm.model"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属小区">
              <el-select v-model="vehicleForm.community">
                <el-option label="A区" value="A区"/>
                <el-option label="B区" value="B区"/>
                <el-option label="C区" value="C区"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车位号">
              <el-input v-model="vehicleForm.parkingSpace"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="到期时间">
              <el-date-picker
                v-model="vehicleForm.expireTime"
                type="date"
                placeholder="选择日期"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input
            type="textarea"
            v-model="vehicleForm.remark"
            rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitVehicle">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import {
  Plus,
  Search,
  Refresh,
  Download,
  ArrowRight,
  Van,
  Timer,
  Location
} from '@element-plus/icons-vue'

// 统计数据
const statistics = ref([
  {
    title: '总车位数',
    value: 500,
    type: 'primary',
    icon: 'Parking'
  },
  {
    title: '已使用',
    value: 320,
    type: 'success',
    icon: 'Van'
  },
  {
    title: '剩余车位',
    value: 180,
    type: 'warning',
    icon: 'Place'
  },
  {
    title: '今日流量',
    value: 156,
    type: 'info',
    icon: 'TrendCharts'
  }
])

// 搜索和分页
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 对话框控制
const dialogVisible = ref(false)
const dialogType = ref('add')
const vehicleForm = ref({
  plateNumber: '',
  owner: '',
  phone: '',
  type: '',
  brand: '',
  model: '',
  community: '',
  parkingSpace: '',
  expireTime: '',
  remark: ''
})

// 获取车辆类型样式
const getVehicleType = (type) => {
  const types = {
    '业主车辆': 'success',
    '访客车辆': 'warning',
    '物业车辆': 'info'
  }
  return types[type]
}

// 获取状态样式
const getStatusType = (status) => {
  const types = {
    '已进入': 'success',
    '已离场': 'info',
    '异常': 'danger'
  }
  return types[status]
}

// 处理车辆状态
const handleVehicleStatus = (vehicle) => {
  const action = vehicle.status === '已进入' ? '离场' : '进场'
  ElMessage.success(`车辆 ${vehicle.plateNumber} 已${action}`)
}

// 编辑车辆
const handleEdit = (vehicle) => {
  dialogType.value = 'edit'
  vehicleForm.value = { ...vehicle }
  dialogVisible.value = true
}

// 删除车辆
const handleDelete = (vehicle) => {
  ElMessageBox.confirm(
    `确定要删除车辆 ${vehicle.plateNumber} 的信息吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.success('删除成功')
  })
}

// 添加车辆
const handleAddVehicle = () => {
  dialogType.value = 'add'
  vehicleForm.value = {
    plateNumber: '',
    owner: '',
    phone: '',
    type: '',
    brand: '',
    model: '',
    community: '',
    parkingSpace: '',
    expireTime: '',
    remark: ''
  }
  dialogVisible.value = true
}

// 提交车辆信息
const submitVehicle = () => {
  ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
  dialogVisible.value = false
}

// 查看所有记录
const viewAllRecords = () => {
  ElMessage('查看所有通行记录')
}

// 图表引用
const vehicleTrendChart = ref(null)
const parkingOccupancyChart = ref(null)

// 时间范围
const timeRange = ref('week')

// 初始化图表
const initCharts = () => {
  if (vehicleTrendChart.value && parkingOccupancyChart.value) {
    const trendChart = echarts.init(vehicleTrendChart.value)
    const occupancyChart = echarts.init(parkingOccupancyChart.value)
    
    // 车流量趋势图配置
    const trendOption = {
      title: {
        text: '车流量趋势'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [150, 230, 180, 120, 140, 260, 180],
        type: 'line',
        smooth: true,
        areaStyle: {}
      }]
    }
    
    // 车位占用率图配置
    const occupancyOption = {
      title: {
        text: '车位占用率'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}%'
      },
      series: [{
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
          name: '占用率'
        }]
      }]
    }
    
    // 设置图表配置
    trendChart.setOption(trendOption)
    occupancyChart.setOption(occupancyOption)
    
    // 监听窗口大小变化
    const handleResize = () => {
      trendChart.resize()
      occupancyChart.resize()
    }
    window.addEventListener('resize', handleResize)

    // 保存清理函数
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      trendChart.dispose()
      occupancyChart.dispose()
    })
  }
}

// 组件挂载时初始化图表
onMounted(() => {
  initCharts()
})
</script>

<style scoped>
.vehicle-management {
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

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.vehicle-detail {
  padding: 20px;
}

.pass-records {
  height: 400px;
  overflow-y: auto;
}

.record-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.plate-number {
  font-weight: bold;
}

.action {
  color: var(--el-color-primary);
}

.location {
  color: #666;
  font-size: 12px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.charts-container {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 20px;
  height: 300px;
  margin-top: 20px;
}

.chart {
  height: 100%;
  min-height: 300px;
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

.info .stat-icon {
  background-color: #f4f4f5;
  color: #909399;
}
</style> 