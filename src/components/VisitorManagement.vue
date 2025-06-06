<template>
  <div class="visitor-management">
    <el-row :gutter="20">
      <!-- 访客统计 -->
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

      <!-- 访客登记 -->
      <el-col :span="12">
        <el-card class="visitor-register">
          <template #header>
            <div class="card-header">
              <span class="title">访客登记</span>
              <el-button type="primary" @click="handleAddVisitor">
                <el-icon><Plus /></el-icon>新增访客
              </el-button>
            </div>
          </template>

          <el-form :model="visitorForm" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="访客姓名">
                  <el-input v-model="visitorForm.name" placeholder="请输入访客姓名"/>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系电话">
                  <el-input v-model="visitorForm.phone" placeholder="请输入联系电话"/>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="来访事由">
                  <el-select v-model="visitorForm.purpose" placeholder="请选择来访事由">
                    <el-option label="探亲访友" value="visit"/>
                    <el-option label="快递配送" value="delivery"/>
                    <el-option label="维修服务" value="maintenance"/>
                    <el-option label="其他" value="other"/>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="访问时间">
                  <el-date-picker
                    v-model="visitorForm.visitTime"
                    type="datetime"
                    placeholder="选择日期时间"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="访问地址">
                  <el-cascader
                    v-model="visitorForm.address"
                    :options="addressOptions"
                    placeholder="请选择访问地址"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="被访人">
                  <el-input v-model="visitorForm.host" placeholder="请输入被访人姓名"/>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="24">
                <el-form-item label="备注信息">
                  <el-input
                    type="textarea"
                    v-model="visitorForm.remark"
                    rows="2"
                    placeholder="请输入备注信息"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item>
              <el-button type="primary" @click="submitVisitor">登记</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 访客记录 -->
      <el-col :span="12">
        <el-card class="visitor-records">
          <template #header>
            <div class="card-header">
              <span class="title">访客记录</span>
              <div class="header-right">
                <el-input
                  v-model="searchQuery"
                  placeholder="搜索访客"
                  prefix-icon="Search"
                  style="width: 200px"
                />
                <el-button-group>
                  <el-button :icon="Refresh">刷新</el-button>
                  <el-button :icon="Download" @click="exportRecords">导出</el-button>
                </el-button-group>
              </div>
            </div>
          </template>

          <el-table :data="filteredRecords" height="400" style="width: 100%">
            <el-table-column prop="name" label="访客姓名" width="120"/>
            <el-table-column prop="phone" label="联系电话" width="140"/>
            <el-table-column prop="purpose" label="来访事由" width="120">
              <template #default="scope">
                <el-tag :type="getPurposeType(scope.row.purpose)">
                  {{ getPurposeName(scope.row.purpose) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="visitTime" label="访问时间" width="180"/>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button-group>
                  <el-button 
                    size="small"
                    :type="scope.row.status === '已进入' ? 'danger' : 'success'"
                    @click="handleVisitorStatus(scope.row)"
                  >
                    {{ scope.row.status === '已进入' ? '离开' : '进入' }}
                  </el-button>
                  <el-button 
                    size="small"
                    type="primary"
                    @click="viewDetail(scope.row)"
                  >
                    详情
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

      <!-- 访客统计图表 -->
      <el-col :span="24">
        <el-card class="visitor-statistics">
          <template #header>
            <div class="card-header">
              <span class="title">访客统计</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
                <el-radio-button label="year">本年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <div class="charts-container">
            <div ref="visitorTrendChart" class="chart"></div>
            <div ref="visitorTypeChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 访客详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="访客详情"
      width="600px"
    >
      <div class="visitor-detail">
        <div class="detail-item">
          <span class="label">访客姓名：</span>
          <span>{{ currentVisitor.name }}</span>
        </div>
        <div class="detail-item">
          <span class="label">联系电话：</span>
          <span>{{ currentVisitor.phone }}</span>
        </div>
        <div class="detail-item">
          <span class="label">来访事由：</span>
          <span>{{ getPurposeName(currentVisitor.purpose) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">访问时间：</span>
          <span>{{ currentVisitor.visitTime }}</span>
        </div>
        <div class="detail-item">
          <span class="label">访问地址：</span>
          <span>{{ getFullAddress(currentVisitor.address) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">被访人：</span>
          <span>{{ currentVisitor.host }}</span>
        </div>
        <div class="detail-item">
          <span class="label">当前状态：</span>
          <el-tag :type="getStatusType(currentVisitor.status)">
            {{ currentVisitor.status }}
          </el-tag>
        </div>
        <div class="detail-item">
          <span class="label">备注信息：</span>
          <span>{{ currentVisitor.remark || '无' }}</span>
        </div>
        <div class="visit-timeline">
          <h4>访问记录</h4>
          <el-timeline>
            <el-timeline-item
              v-for="record in currentVisitor.timeline"
              :key="record.time"
              :timestamp="record.time"
              :type="record.type"
            >
              {{ record.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Plus,
  Search,
  Refresh,
  Download,
  User,
  Timer,
  Location,
  Calendar
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// 统计数据
const statistics = ref([
  {
    title: '今日访客',
    value: '156',
    icon: 'User',
    type: 'primary'
  },
  {
    title: '在访人数',
    value: '32',
    icon: 'Location',
    type: 'success'
  },
  {
    title: '预约访客',
    value: '18',
    icon: 'Calendar',
    type: 'warning'
  },
  {
    title: '平均停留',
    value: '2.5h',
    icon: 'Timer',
    type: 'info'
  }
])

// 访客表单
const visitorForm = ref({
  name: '',
  phone: '',
  purpose: '',
  visitTime: '',
  address: [],
  host: '',
  remark: ''
})

// 地址选项
const addressOptions = [
  {
    value: '1',
    label: '1号楼',
    children: [
      {
        value: '1',
        label: '1单元',
        children: [
          { value: '101', label: '101室' },
          { value: '102', label: '102室' }
        ]
      }
    ]
  }
]

// 访客记录
const visitorRecords = ref([
  {
    name: '张三',
    phone: '13800138000',
    purpose: 'visit',
    visitTime: '2024-03-20 14:30',
    status: '已进入',
    address: ['1', '1', '101'],
    host: '李四',
    remark: '探亲',
    timeline: [
      { time: '14:30', content: '访客登记', type: 'primary' },
      { time: '14:35', content: '进入小区', type: 'success' }
    ]
  }
])

// 搜索和分页
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 筛选访客记录
const filteredRecords = computed(() => {
  return visitorRecords.value.filter(record =>
    record.name.includes(searchQuery.value) ||
    record.phone.includes(searchQuery.value)
  )
})

// 获取来访事由类型
const getPurposeType = (purpose) => {
  const types = {
    visit: 'primary',
    delivery: 'success',
    maintenance: 'warning',
    other: 'info'
  }
  return types[purpose]
}

// 获取来访事由名称
const getPurposeName = (purpose) => {
  const names = {
    visit: '探亲访友',
    delivery: '快递配送',
    maintenance: '维修服务',
    other: '其他'
  }
  return names[purpose]
}

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    '待进入': 'info',
    '已进入': 'success',
    '已离开': 'danger'
  }
  return types[status]
}

// 获取完整地址
const getFullAddress = (address) => {
  if (!address) return ''
  return address.map(code => {
    const building = addressOptions.find(b => b.value === code[0])
    const unit = building?.children.find(u => u.value === code[1])
    const room = unit?.children.find(r => r.value === code[2])
    return [building?.label, unit?.label, room?.label].filter(Boolean).join('-')
  }).join('')
}

// 处理访客状态
const handleVisitorStatus = (visitor) => {
  const action = visitor.status === '已进入' ? '离开' : '进入'
  ElMessage.success(`访客${visitor.name}已${action}`)
}

// 查看详情
const detailDialogVisible = ref(false)
const currentVisitor = ref({})
const viewDetail = (visitor) => {
  currentVisitor.value = visitor
  detailDialogVisible.value = true
}

// 导出记录
const exportRecords = () => {
  ElMessage.success('记录导出成功')
}

// 提交访客登记
const submitVisitor = () => {
  ElMessage.success('访客登记成功')
  resetForm()
}

// 重置表单
const resetForm = () => {
  visitorForm.value = {
    name: '',
    phone: '',
    purpose: '',
    visitTime: '',
    address: [],
    host: '',
    remark: ''
  }
}

// 图表引用
const visitorTrendChart = ref(null)
const visitorTypeChart = ref(null)

// 时间范围
const timeRange = ref('week')

// 初始化图表
const initCharts = () => {
  if (visitorTrendChart.value && visitorTypeChart.value) {
    const trendChart = echarts.init(visitorTrendChart.value)
    const typeChart = echarts.init(visitorTypeChart.value)
    
    // 趋势图配置
    const trendOption = {
      title: {
        text: '访客趋势'
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
        data: [120, 200, 150, 80, 70, 110, 130],
        type: 'line',
        smooth: true
      }]
    }
    
    // 类型图配置
    const typeOption = {
      title: {
        text: '访客类型分布'
      },
      tooltip: {
        trigger: 'item'
      },
      series: [{
        type: 'pie',
        radius: '50%',
        data: [
          { value: 235, name: '探亲访友' },
          { value: 274, name: '快递配送' },
          { value: 310, name: '维修服务' },
          { value: 335, name: '其他' }
        ]
      }]
    }
    
    // 设置图表配置
    trendChart.setOption(trendOption)
    typeChart.setOption(typeOption)
    
    // 监听窗口大小变化
    const handleResize = () => {
      trendChart.resize()
      typeChart.resize()
    }
    window.addEventListener('resize', handleResize)

    // 保存清理函数
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      trendChart.dispose()
      typeChart.dispose()
    })
  }
}

// 组件挂载时初始化图表
onMounted(() => {
  initCharts()
})
</script>

<style scoped>
.visitor-management {
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

.header-right {
  display: flex;
  gap: 10px;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.visitor-records {
  margin-bottom: 20px;
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

.visitor-detail {
  padding: 20px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.detail-item .label {
  width: 100px;
  color: #666;
}

.visit-timeline {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
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