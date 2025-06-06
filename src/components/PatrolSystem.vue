<template>
  <div class="patrol-system">
    <el-row :gutter="20">
      <!-- 左侧巡更点列表 -->
      <el-col :span="6">
        <el-card class="point-list">
          <template #header>
            <div class="card-header">
              <span>巡更点</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索巡更点"
                prefix-icon="Search"
                clearable
                @clear="handleSearch"
                @input="handleSearch"
              />
            </div>
          </template>
          <el-scrollbar height="calc(100vh - 200px)">
            <el-tree
              :data="pointGroups"
              :props="defaultProps"
              @node-click="handleNodeClick"
              highlight-current
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <span v-if="data.type === 'point'" class="point-status">
                    <el-tag size="small" :type="data.status === 'normal' ? 'success' : 'danger'">
                      {{ data.status === 'normal' ? '正常' : '异常' }}
                    </el-tag>
                  </span>
                </div>
              </template>
            </el-tree>
          </el-scrollbar>
        </el-card>
      </el-col>

      <!-- 右侧内容区域 -->
      <el-col :span="18">
        <el-tabs v-model="activeTab" class="content-tabs">
          <!-- 巡更计划 -->
          <el-tab-pane label="巡更计划" name="plans">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>计划列表</span>
                  <div class="header-actions">
                    <el-button type="primary" @click="handleAddPlan">新增计划</el-button>
                    <el-button type="success" @click="handleImport">批量导入</el-button>
                    <el-button type="warning" @click="handleExport">导出数据</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="paginatedPlans" style="width: 100%">
                <el-table-column prop="name" label="计划名称" />
                <el-table-column prop="type" label="巡更类型" />
                <el-table-column prop="patroller" label="巡更人员" />
                <el-table-column prop="startTime" label="开始时间" width="180" />
                <el-table-column prop="endTime" label="结束时间" width="180" />
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag :type="getStatusType(scope.row.status)">
                      {{ getStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="250">
                  <template #default="scope">
                    <el-button-group>
                      <el-button type="primary" size="small" @click="handleEditPlan(scope.row)">编辑</el-button>
                      <el-button type="success" size="small" @click="handleStartPlan(scope.row)">开始</el-button>
                      <el-button type="danger" size="small" @click="handleDeletePlan(scope.row)">删除</el-button>
                    </el-button-group>
                  </template>
                </el-table-column>
              </el-table>
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="total"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </el-card>
          </el-tab-pane>

          <!-- 实时巡更 -->
          <el-tab-pane label="实时巡更" name="patrol">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-card class="patrol-card">
                  <template #header>
                    <div class="card-header">
                      <span>巡更记录</span>
                      <div class="header-actions">
                        <el-button-group>
                          <el-button type="primary" :icon="VideoPlay" @click="startPatrol">开始巡更</el-button>
                          <el-button type="danger" :icon="VideoPause" @click="stopPatrol">停止巡更</el-button>
                        </el-button-group>
                      </div>
                    </div>
                  </template>
                  <div class="patrol-content">
                    <el-table :data="paginatedRecords" style="width: 100%">
                      <el-table-column prop="time" label="巡更时间" width="180" />
                      <el-table-column prop="point" label="巡更点" />
                      <el-table-column prop="patroller" label="巡更人员" />
                      <el-table-column prop="status" label="状态">
                        <template #default="scope">
                          <el-tag :type="scope.row.status === 'normal' ? 'success' : 'danger'">
                            {{ scope.row.status === 'normal' ? '正常' : '异常' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
                    </el-table>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="status-card">
                  <template #header>
                    <div class="card-header">
                      <span>巡更状态</span>
                    </div>
                  </template>
                  <div class="status-content" v-if="patrolStatus">
                    <div class="status-info">
                      <p><strong>巡更人员：</strong>{{ patrolStatus.patroller }}</p>
                      <p><strong>开始时间：</strong>{{ patrolStatus.startTime }}</p>
                      <p><strong>已巡更点数：</strong>{{ patrolStatus.pointCount }}</p>
                      <p><strong>状态：</strong>
                        <el-tag :type="patrolStatus.status === 'running' ? 'success' : 'info'">
                          {{ patrolStatus.status === 'running' ? '巡更中' : '已停止' }}
                        </el-tag>
                      </p>
                    </div>
                  </div>
                  <div v-else class="no-patrol">
                    <el-empty description="未开始巡更" />
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>

          <!-- 巡更记录 -->
          <el-tab-pane label="巡更记录" name="records">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>历史记录</span>
                  <div class="header-actions">
                    <el-date-picker
                      v-model="dateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      @change="handleDateChange"
                    />
                    <el-button type="primary" :icon="Download" @click="handleExport">导出记录</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="paginatedRecords" style="width: 100%">
                <el-table-column prop="time" label="巡更时间" width="180" />
                <el-table-column prop="plan" label="巡更计划" />
                <el-table-column prop="patroller" label="巡更人员" />
                <el-table-column prop="point" label="巡更点" />
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'normal' ? 'success' : 'danger'">
                      {{ scope.row.status === 'normal' ? '正常' : '异常' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" show-overflow-tooltip />
              </el-table>
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="total"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>

    <!-- 计划表单对话框 -->
    <el-dialog
      v-model="showPlanDialog"
      :title="dialogType === 'add' ? '新增计划' : '编辑计划'"
      width="50%"
      destroy-on-close
    >
      <el-form :model="planForm" label-width="100px">
        <el-form-item label="计划名称">
          <el-input v-model="planForm.name" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="巡更类型">
          <el-select v-model="planForm.type" placeholder="请选择巡更类型">
            <el-option label="日常巡更" value="daily" />
            <el-option label="重点巡更" value="important" />
            <el-option label="临时巡更" value="temporary" />
          </el-select>
        </el-form-item>
        <el-form-item label="巡更人员">
          <el-select v-model="planForm.patroller" placeholder="请选择巡更人员">
            <el-option label="张三" value="张三" />
            <el-option label="李四" value="李四" />
            <el-option label="王五" value="王五" />
          </el-select>
        </el-form-item>
        <el-form-item label="巡更时间">
          <el-time-picker
            v-model="planForm.timeRange"
            is-range
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="HH:mm"
          />
        </el-form-item>
        <el-form-item label="巡更点">
          <el-select
            v-model="planForm.points"
            multiple
            placeholder="请选择巡更点"
          >
            <el-option
              v-for="point in pointList"
              :key="point.id"
              :label="point.name"
              :value="point.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="planForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPlanDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSavePlan">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  VideoPlay,
  VideoPause,
  Search,
  Download
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索关键词
const searchKeyword = ref('')

// 当前选中的巡更点
const currentPoint = ref(null)

// 标签页
const activeTab = ref('plans')

// 日期范围
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 对话框控制
const showPlanDialog = ref(false)
const dialogType = ref('add')

// 计划表单
const planForm = ref({
  name: '',
  type: 'daily',
  patroller: '',
  timeRange: [],
  points: [],
  remark: ''
})

// 巡更状态
const patrolStatus = ref(null)

// 巡更点分组数据
const pointGroups = ref([
  {
    label: 'A区巡更点',
    children: [
      {
        label: 'A区大门',
        type: 'point',
        status: 'normal',
        id: 'A001',
        name: 'A区大门',
        location: 'A区大门',
        lastCheck: '2025-05-20 10:00:00',
        battery: '90%',
        signal: '强'
      },
      {
        label: 'A区走廊',
        type: 'point',
        status: 'normal',
        id: 'A002',
        name: 'A区走廊',
        location: 'A区走廊',
        lastCheck: '2025-05-20 10:00:00',
        battery: '85%',
        signal: '中'
      },
      {
        label: 'A区会议室',
        type: 'point',
        status: 'normal',
        id: 'A003',
        name: 'A区会议室',
        location: 'A区会议室',
        lastCheck: '2025-05-20 10:00:00',
        battery: '95%',
        signal: '强'
      },
      {
        label: 'A区休息区',
        type: 'point',
        status: 'normal',
        id: 'A004',
        name: 'A区休息区',
        location: 'A区休息区',
        lastCheck: '2025-05-20 10:00:00',
        battery: '88%',
        signal: '中'
      }
    ]
  },
  {
    label: 'B区巡更点',
    children: [
      {
        label: 'B区大门',
        type: 'point',
        status: 'abnormal',
        id: 'B001',
        name: 'B区大门',
        location: 'B区大门',
        lastCheck: '2025-05-20 09:30:00',
        battery: '0%',
        signal: '无'
      },
      {
        label: 'B区走廊',
        type: 'point',
        status: 'normal',
        id: 'B002',
        name: 'B区走廊',
        location: 'B区走廊',
        lastCheck: '2025-05-20 10:00:00',
        battery: '75%',
        signal: '弱'
      },
      {
        label: 'B区设备间',
        type: 'point',
        status: 'normal',
        id: 'B003',
        name: 'B区设备间',
        location: 'B区设备间',
        lastCheck: '2025-05-20 10:00:00',
        battery: '82%',
        signal: '中'
      }
    ]
  },
  {
    label: 'C区巡更点',
    children: [
      {
        label: 'C区大门',
        type: 'point',
        status: 'normal',
        id: 'C001',
        name: 'C区大门',
        location: 'C区大门',
        lastCheck: '2025-05-20 10:00:00',
        battery: '92%',
        signal: '强'
      },
      {
        label: 'C区走廊',
        type: 'point',
        status: 'normal',
        id: 'C002',
        name: 'C区走廊',
        location: 'C区走廊',
        lastCheck: '2025-05-20 10:00:00',
        battery: '78%',
        signal: '中'
      },
      {
        label: 'C区仓库',
        type: 'point',
        status: 'normal',
        id: 'C003',
        name: 'C区仓库',
        location: 'C区仓库',
        lastCheck: '2025-05-20 10:00:00',
        battery: '85%',
        signal: '强'
      }
    ]
  }
])

// 巡更点列表
const pointList = ref([
  { id: 'A001', name: 'A区大门' },
  { id: 'A002', name: 'A区走廊' },
  { id: 'A003', name: 'A区会议室' },
  { id: 'A004', name: 'A区休息区' },
  { id: 'B001', name: 'B区大门' },
  { id: 'B002', name: 'B区走廊' },
  { id: 'B003', name: 'B区设备间' },
  { id: 'C001', name: 'C区大门' },
  { id: 'C002', name: 'C区走廊' },
  { id: 'C003', name: 'C区仓库' }
])

// 巡更人员列表
const patrollerList = ref([
  { id: 'P001', name: '王建国', phone: '13905311234', department: '安保部' },
  { id: 'P002', name: '张丽华', phone: '13805322345', department: '安保部' },
  { id: 'P003', name: '刘志强', phone: '13705333456', department: '安保部' },
  { id: 'P004', name: '周晓明', phone: '13605344567', department: '安保部' }
])

// 计划列表
const planList = ref([
  {
    name: '早班巡更',
    type: 'daily',
    patroller: '王建国',
    startTime: '08:00',
    endTime: '16:00',
    status: 'pending',
    points: ['A001', 'A002', 'A003', 'A004'],
    remark: '日常巡更，重点关注设备间和仓库'
  },
  {
    name: '晚班巡更',
    type: 'daily',
    patroller: '张丽华',
    startTime: '16:00',
    endTime: '24:00',
    status: 'completed',
    points: ['B001', 'B002', 'B003'],
    remark: '日常巡更，确保所有区域安全'
  },
  {
    name: '重点区域巡更',
    type: 'important',
    patroller: '刘志强',
    startTime: '10:00',
    endTime: '12:00',
    status: 'running',
    points: ['C001', 'C002', 'C003'],
    remark: '重点检查仓库和设备间'
  },
  {
    name: '临时巡更',
    type: 'temporary',
    patroller: '周晓明',
    startTime: '14:00',
    endTime: '16:00',
    status: 'pending',
    points: ['A001', 'B001', 'C001'],
    remark: '临时检查各区域大门'
  }
])

// 实时记录
const realtimeRecords = ref([
  {
    time: '2025-05-20 10:00:00',
    point: 'A区大门',
    patroller: '王建国',
    status: 'normal',
    remark: '一切正常，大门安全'
  },
  {
    time: '2025-05-20 10:05:00',
    point: 'A区走廊',
    patroller: '王建国',
    status: 'normal',
    remark: '走廊照明正常，无异常'
  },
  {
    time: '2025-05-20 10:10:00',
    point: 'A区会议室',
    patroller: '王建国',
    status: 'normal',
    remark: '会议室门窗已锁，设备正常'
  },
  {
    time: '2025-05-20 10:15:00',
    point: 'A区休息区',
    patroller: '王建国',
    status: 'normal',
    remark: '休息区整洁，无异常'
  }
])

// 历史记录
const historyRecords = ref([
  {
    time: '2025-05-20 09:00:00',
    plan: '早班巡更',
    patroller: '王建国',
    point: 'A区大门',
    status: 'normal',
    remark: '大门安全，无异常'
  },
  {
    time: '2025-05-20 09:30:00',
    plan: '早班巡更',
    patroller: '王建国',
    point: 'B区大门',
    status: 'abnormal',
    remark: '发现大门未锁，已处理'
  },
  {
    time: '2025-05-20 10:00:00',
    plan: '早班巡更',
    patroller: '王建国',
    point: 'C区大门',
    status: 'normal',
    remark: '大门安全，无异常'
  },
  {
    time: '2025-05-20 16:00:00',
    plan: '晚班巡更',
    patroller: '张丽华',
    point: 'A区大门',
    status: 'normal',
    remark: '交接班正常，无异常'
  },
  {
    time: '2025-05-20 16:30:00',
    plan: '晚班巡更',
    patroller: '张丽华',
    point: 'B区大门',
    status: 'normal',
    remark: '大门安全，无异常'
  }
])

// 计算当前页的数据
const paginatedPlans = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return planList.value.slice(start, end)
})

// 计算当前页的记录数据
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return activeTab.value === 'patrol' ? realtimeRecords.value.slice(start, end) : historyRecords.value.slice(start, end)
})

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    running: 'success',
    completed: 'info',
    failed: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待执行',
    running: '执行中',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status] || '未知'
}

// 处理节点点击
const handleNodeClick = (data) => {
  if (data.type === 'point') {
    currentPoint.value = data
  }
}

// 处理搜索
const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value)
}

// 新增计划
const handleAddPlan = () => {
  dialogType.value = 'add'
  planForm.value = {
    name: '',
    type: 'daily',
    patroller: '',
    timeRange: [],
    points: [],
    remark: ''
  }
  showPlanDialog.value = true
}

// 编辑计划
const handleEditPlan = (plan) => {
  dialogType.value = 'edit'
  planForm.value = {
    ...plan,
    timeRange: [plan.startTime, plan.endTime]
  }
  showPlanDialog.value = true
}

// 删除计划
const handleDeletePlan = (plan) => {
  ElMessageBox.confirm(
    `确定要删除计划"${plan.name}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = planList.value.findIndex(p => p.name === plan.name)
    if (index > -1) {
      planList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

// 开始计划
const handleStartPlan = (plan) => {
  console.log('开始计划:', plan)
}

// 保存计划
const handleSavePlan = () => {
  // 表单验证
  if (!planForm.value.name || !planForm.value.type || !planForm.value.patroller || !planForm.value.timeRange || !planForm.value.points.length) {
    ElMessage.error('请填写完整信息')
    return
  }

  if (dialogType.value === 'add') {
    // 添加新计划
    planList.value.unshift({
      ...planForm.value,
      startTime: planForm.value.timeRange[0],
      endTime: planForm.value.timeRange[1],
      status: 'pending'
    })
    ElMessage.success('添加成功')
  } else {
    // 更新计划
    const index = planList.value.findIndex(p => p.name === planForm.value.name)
    if (index > -1) {
      planList.value[index] = {
        ...planForm.value,
        startTime: planForm.value.timeRange[0],
        endTime: planForm.value.timeRange[1]
      }
      ElMessage.success('更新成功')
    }
  }
  showPlanDialog.value = false
}

// 开始巡更
const startPatrol = () => {
  console.log('开始巡更')
  patrolStatus.value = {
    patroller: '张三',
    startTime: new Date().toLocaleString(),
    pointCount: 0,
    status: 'running'
  }
}

// 停止巡更
const stopPatrol = () => {
  console.log('停止巡更')
  patrolStatus.value = null
}

// 批量导入
const handleImport = () => {
  console.log('批量导入')
}

// 导出数据
const handleExport = () => {
  // 准备导出数据
  const exportData = activeTab.value === 'plans' ? planList.value.map(plan => ({
    '计划名称': plan.name,
    '巡更类型': plan.type === 'daily' ? '日常巡更' : plan.type === 'important' ? '重点巡更' : '临时巡更',
    '巡更人员': plan.patroller,
    '开始时间': plan.startTime,
    '结束时间': plan.endTime,
    '状态': getStatusText(plan.status),
    '备注': plan.remark
  })) : historyRecords.value.map(record => ({
    '巡更时间': record.time,
    '巡更计划': record.plan,
    '巡更人员': record.patroller,
    '巡更点': record.point,
    '状态': record.status === 'normal' ? '正常' : '异常',
    '备注': record.remark
  }))

  // 模拟导出过程
  setTimeout(() => {
    ElMessage.success('导出成功')
  }, 1000)
}

// 处理日期变化
const handleDateChange = (val) => {
  console.log('日期范围:', val)
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  total.value = activeTab.value === 'plans' ? planList.value.length : 
                activeTab.value === 'patrol' ? realtimeRecords.value.length : 
                historyRecords.value.length
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 监听标签页变化
watch(activeTab, (newTab) => {
  currentPage.value = 1
  total.value = newTab === 'plans' ? planList.value.length : 
                newTab === 'patrol' ? realtimeRecords.value.length : 
                historyRecords.value.length
})

// 初始化总数
total.value = planList.value.length
</script>

<style scoped>
.patrol-system {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.point-list {
  height: calc(100vh - 100px);
}

.content-tabs {
  height: calc(100vh - 100px);
}

.patrol-card {
  height: calc(100vh - 150px);
}

.status-card {
  height: calc(100vh - 150px);
}

.patrol-content {
  padding: 20px;
}

.status-content {
  padding: 20px;
}

.status-info p {
  margin: 10px 0;
}

.no-patrol {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.point-status {
  margin-left: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 