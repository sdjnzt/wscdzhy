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
              <el-table :data="planList" style="width: 100%">
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
                    <el-table :data="realtimeRecords" style="width: 100%">
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
              <el-table :data="historyRecords" style="width: 100%">
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
import { ref } from 'vue'
import {
  VideoPlay,
  VideoPause,
  Search,
  Download
} from '@element-plus/icons-vue'

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
        lastCheck: '2024-03-20 10:00:00'
      },
      {
        label: 'A区走廊',
        type: 'point',
        status: 'normal',
        id: 'A002',
        name: 'A区走廊',
        location: 'A区走廊',
        lastCheck: '2024-03-20 10:00:00'
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
        lastCheck: '2024-03-20 09:30:00'
      }
    ]
  }
])

// 巡更点列表
const pointList = ref([
  { id: 'A001', name: 'A区大门' },
  { id: 'A002', name: 'A区走廊' },
  { id: 'B001', name: 'B区大门' }
])

// 树形配置
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 计划列表
const planList = ref([
  {
    name: '早班巡更',
    type: 'daily',
    patroller: '张三',
    startTime: '08:00',
    endTime: '16:00',
    status: 'pending'
  },
  {
    name: '晚班巡更',
    type: 'daily',
    patroller: '李四',
    startTime: '16:00',
    endTime: '24:00',
    status: 'completed'
  }
])

// 实时记录
const realtimeRecords = ref([
  {
    time: '2024-03-20 10:00:00',
    point: 'A区大门',
    patroller: '张三',
    status: 'normal',
    remark: '一切正常'
  },
  {
    time: '2024-03-20 10:05:00',
    point: 'A区走廊',
    patroller: '张三',
    status: 'normal',
    remark: '一切正常'
  }
])

// 历史记录
const historyRecords = ref([
  {
    time: '2024-03-20 09:00:00',
    plan: '早班巡更',
    patroller: '张三',
    point: 'A区大门',
    status: 'normal',
    remark: '一切正常'
  },
  {
    time: '2024-03-20 09:30:00',
    plan: '早班巡更',
    patroller: '张三',
    point: 'B区大门',
    status: 'abnormal',
    remark: '发现异常情况'
  }
])

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
  console.log('删除计划:', plan)
}

// 开始计划
const handleStartPlan = (plan) => {
  console.log('开始计划:', plan)
}

// 保存计划
const handleSavePlan = () => {
  console.log('保存计划:', planForm.value)
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
  console.log('导出数据')
}

// 处理日期变化
const handleDateChange = (val) => {
  console.log('日期范围:', val)
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  console.log('每页条数:', val)
}

// 处理页码变化
const handleCurrentChange = (val) => {
  console.log('当前页:', val)
}
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