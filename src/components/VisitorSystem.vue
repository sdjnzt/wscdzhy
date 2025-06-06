<template>
  <div class="visitor-system">
    <el-tabs v-model="activeTab" class="content-tabs">
      <!-- 访客预约 -->
      <el-tab-pane label="访客预约" name="appointment">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>预约列表</span>
              <div class="header-actions">
                <el-button type="primary" @click="handleAddAppointment">新增预约</el-button>
                <el-button type="success" @click="handleExport">导出记录</el-button>
              </div>
            </div>
          </template>
          <el-table :data="appointmentList" style="width: 100%">
            <el-table-column prop="visitorName" label="访客姓名" />
            <el-table-column prop="phone" label="联系电话" />
            <el-table-column prop="visitTime" label="来访时间" width="180" />
            <el-table-column prop="hostName" label="被访人" />
            <el-table-column prop="department" label="被访部门" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button-group>
                  <el-button type="primary" size="small" @click="handleEditAppointment(scope.row)">编辑</el-button>
                  <el-button type="danger" size="small" @click="handleDeleteAppointment(scope.row)">删除</el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 访客登记 -->
      <el-tab-pane label="访客登记" name="registration">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-card class="registration-card">
              <template #header>
                <div class="card-header">
                  <span>访客登记</span>
                </div>
              </template>
              <el-form :model="visitorForm" label-width="100px">
                <el-form-item label="访客姓名">
                  <el-input v-model="visitorForm.name" placeholder="请输入访客姓名" />
                </el-form-item>
                <el-form-item label="联系电话">
                  <el-input v-model="visitorForm.phone" placeholder="请输入联系电话" />
                </el-form-item>
                <el-form-item label="身份证号">
                  <el-input v-model="visitorForm.idCard" placeholder="请输入身份证号" />
                </el-form-item>
                <el-form-item label="来访目的">
                  <el-input v-model="visitorForm.purpose" type="textarea" placeholder="请输入来访目的" />
                </el-form-item>
                <el-form-item label="被访人">
                  <el-input v-model="visitorForm.hostName" placeholder="请输入被访人姓名" />
                </el-form-item>
                <el-form-item label="被访部门">
                  <el-select v-model="visitorForm.department" placeholder="请选择被访部门">
                    <el-option label="行政部" value="行政部" />
                    <el-option label="人事部" value="人事部" />
                    <el-option label="财务部" value="财务部" />
                    <el-option label="技术部" value="技术部" />
                  </el-select>
                </el-form-item>
                <el-form-item label="来访时间">
                  <el-date-picker
                    v-model="visitorForm.visitTime"
                    type="datetime"
                    placeholder="请选择来访时间"
                  />
                </el-form-item>
                <el-form-item label="预计离开">
                  <el-date-picker
                    v-model="visitorForm.leaveTime"
                    type="datetime"
                    placeholder="请选择预计离开时间"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSubmitRegistration">提交登记</el-button>
                  <el-button @click="resetForm">重置</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="visitor-card">
              <template #header>
                <div class="card-header">
                  <span>访客信息</span>
                </div>
              </template>
              <div class="visitor-info" v-if="currentVisitor">
                <div class="visitor-avatar">
                  <el-avatar :size="100" :src="currentVisitor.avatar" />
                </div>
                <div class="visitor-details">
                  <p><strong>姓名：</strong>{{ currentVisitor.name }}</p>
                  <p><strong>电话：</strong>{{ currentVisitor.phone }}</p>
                  <p><strong>身份证：</strong>{{ currentVisitor.idCard }}</p>
                  <p><strong>来访时间：</strong>{{ currentVisitor.visitTime }}</p>
                  <p><strong>状态：</strong>
                    <el-tag :type="getStatusType(currentVisitor.status)">
                      {{ getStatusText(currentVisitor.status) }}
                    </el-tag>
                  </p>
                </div>
              </div>
              <div v-else class="no-visitor">
                <el-empty description="暂无访客信息" />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 访客记录 -->
      <el-tab-pane label="访客记录" name="records">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>访客记录</span>
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
          <el-table :data="visitorRecords" style="width: 100%">
            <el-table-column prop="name" label="访客姓名" />
            <el-table-column prop="phone" label="联系电话" />
            <el-table-column prop="visitTime" label="来访时间" width="180" />
            <el-table-column prop="leaveTime" label="离开时间" width="180" />
            <el-table-column prop="hostName" label="被访人" />
            <el-table-column prop="department" label="被访部门" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
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
    </el-tabs>

    <!-- 预约表单对话框 -->
    <el-dialog
      v-model="showAppointmentDialog"
      :title="dialogType === 'add' ? '新增预约' : '编辑预约'"
      width="50%"
      destroy-on-close
    >
      <el-form :model="appointmentForm" label-width="100px">
        <el-form-item label="访客姓名">
          <el-input v-model="appointmentForm.visitorName" placeholder="请输入访客姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="appointmentForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="来访时间">
          <el-date-picker
            v-model="appointmentForm.visitTime"
            type="datetime"
            placeholder="请选择来访时间"
          />
        </el-form-item>
        <el-form-item label="被访人">
          <el-input v-model="appointmentForm.hostName" placeholder="请输入被访人姓名" />
        </el-form-item>
        <el-form-item label="被访部门">
          <el-select v-model="appointmentForm.department" placeholder="请选择被访部门">
            <el-option label="行政部" value="行政部" />
            <el-option label="人事部" value="人事部" />
            <el-option label="财务部" value="财务部" />
            <el-option label="技术部" value="技术部" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAppointmentDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaveAppointment">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Download } from '@element-plus/icons-vue'

// 标签页
const activeTab = ref('appointment')

// 日期范围
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 对话框控制
const showAppointmentDialog = ref(false)
const dialogType = ref('add')

// 访客表单
const visitorForm = ref({
  name: '',
  phone: '',
  idCard: '',
  purpose: '',
  hostName: '',
  department: '',
  visitTime: '',
  leaveTime: ''
})

// 预约表单
const appointmentForm = ref({
  visitorName: '',
  phone: '',
  visitTime: '',
  hostName: '',
  department: ''
})

// 当前访客
const currentVisitor = ref(null)

// 预约列表
const appointmentList = ref([
  {
    visitorName: '张三',
    phone: '13800138000',
    visitTime: '2024-03-20 10:00:00',
    hostName: '李四',
    department: '技术部',
    status: 'pending'
  },
  {
    visitorName: '王五',
    phone: '13900139000',
    visitTime: '2024-03-20 14:00:00',
    hostName: '赵六',
    department: '行政部',
    status: 'approved'
  }
])

// 访客记录
const visitorRecords = ref([
  {
    name: '张三',
    phone: '13800138000',
    visitTime: '2024-03-20 10:00:00',
    leaveTime: '2024-03-20 11:30:00',
    hostName: '李四',
    department: '技术部',
    status: 'completed'
  },
  {
    name: '王五',
    phone: '13900139000',
    visitTime: '2024-03-20 14:00:00',
    leaveTime: '2024-03-20 16:00:00',
    hostName: '赵六',
    department: '行政部',
    status: 'completed'
  }
])

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'info'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成'
  }
  return texts[status] || '未知'
}

// 新增预约
const handleAddAppointment = () => {
  dialogType.value = 'add'
  appointmentForm.value = {
    visitorName: '',
    phone: '',
    visitTime: '',
    hostName: '',
    department: ''
  }
  showAppointmentDialog.value = true
}

// 编辑预约
const handleEditAppointment = (appointment) => {
  dialogType.value = 'edit'
  appointmentForm.value = { ...appointment }
  showAppointmentDialog.value = true
}

// 删除预约
const handleDeleteAppointment = (appointment) => {
  console.log('删除预约:', appointment)
}

// 保存预约
const handleSaveAppointment = () => {
  console.log('保存预约:', appointmentForm.value)
  showAppointmentDialog.value = false
}

// 提交登记
const handleSubmitRegistration = () => {
  console.log('提交登记:', visitorForm.value)
  // 模拟提交成功
  currentVisitor.value = {
    ...visitorForm.value,
    avatar: 'https://example.com/avatar.jpg',
    status: 'pending'
  }
}

// 重置表单
const resetForm = () => {
  visitorForm.value = {
    name: '',
    phone: '',
    idCard: '',
    purpose: '',
    hostName: '',
    department: '',
    visitTime: '',
    leaveTime: ''
  }
}

// 处理日期变化
const handleDateChange = (val) => {
  console.log('日期范围:', val)
}

// 导出记录
const handleExport = () => {
  console.log('导出记录')
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
.visitor-system {
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

.content-tabs {
  height: calc(100vh - 100px);
}

.registration-card {
  height: calc(100vh - 150px);
  overflow-y: auto;
}

.visitor-card {
  height: calc(100vh - 150px);
}

.visitor-info {
  padding: 20px;
}

.visitor-avatar {
  text-align: center;
  margin-bottom: 20px;
}

.visitor-details p {
  margin: 10px 0;
}

.no-visitor {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 