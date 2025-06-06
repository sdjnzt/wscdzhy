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
          <el-table :data="paginatedAppointments" style="width: 100%">
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
          <el-table :data="paginatedRecords" style="width: 100%">
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
import { ref, computed, watch } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

// 标签页
const activeTab = ref('appointment')

// 日期范围
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

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
    visitorName: '王建国',
    phone: '13905311234',
    visitTime: '2025-05-20 10:00:00',
    hostName: '李志强',
    department: '技术部',
    status: 'pending',
    purpose: '项目对接',
    idCard: '370101199001011234'
  },
  {
    visitorName: '张丽华',
    phone: '13805322345',
    visitTime: '2025-05-20 14:00:00',
    hostName: '赵明辉',
    department: '行政部',
    status: 'approved',
    purpose: '商务洽谈',
    idCard: '370101199002022345'
  },
  {
    visitorName: '刘志强',
    phone: '13705333456',
    visitTime: '2025-05-20 09:30:00',
    hostName: '陈美玲',
    department: '人事部',
    status: 'approved',
    purpose: '面试',
    idCard: '370101199003033456'
  },
  {
    visitorName: '周晓明',
    phone: '13605344567',
    visitTime: '2025-05-20 11:00:00',
    hostName: '张伟华',
    department: '财务部',
    status: 'rejected',
    purpose: '财务审计',
    idCard: '370101199004044567'
  },
  {
    visitorName: '吴秀英',
    phone: '13505355678',
    visitTime: '2025-05-20 15:30:00',
    hostName: '王丽华',
    department: '市场部',
    status: 'pending',
    purpose: '市场调研',
    idCard: '370101199005055678'
  },
  {
    visitorName: '郑志明',
    phone: '13405366789',
    visitTime: '2025-05-20 16:00:00',
    hostName: '孙建国',
    department: '研发部',
    status: 'approved',
    purpose: '技术交流',
    idCard: '370101199006066789'
  },
  {
    visitorName: '林美玲',
    phone: '13305377890',
    visitTime: '2025-05-20 13:00:00',
    hostName: '杨志强',
    department: '生产部',
    status: 'pending',
    purpose: '设备维护',
    idCard: '370101199007077890'
  },
  {
    visitorName: '黄建国',
    phone: '13205388901',
    visitTime: '2025-05-20 14:30:00',
    hostName: '朱丽华',
    department: '质量部',
    status: 'approved',
    purpose: '质量检查',
    idCard: '370101199008088901'
  },
  {
    visitorName: '马志强',
    phone: '13905319902',
    visitTime: '2025-05-20 09:00:00',
    hostName: '刘建国',
    department: '技术部',
    status: 'pending',
    purpose: '技术咨询',
    idCard: '370101199009099012'
  },
  {
    visitorName: '赵丽华',
    phone: '13805321013',
    visitTime: '2025-05-20 10:30:00',
    hostName: '张美玲',
    department: '行政部',
    status: 'approved',
    purpose: '行政事务',
    idCard: '370101199010101234'
  },
  {
    visitorName: '陈志明',
    phone: '13705322124',
    visitTime: '2025-05-20 11:30:00',
    hostName: '王秀英',
    department: '人事部',
    status: 'approved',
    purpose: '人事面试',
    idCard: '370101199011112345'
  },
  {
    visitorName: '杨建国',
    phone: '13605323235',
    visitTime: '2025-05-20 13:30:00',
    hostName: '李丽华',
    department: '财务部',
    status: 'rejected',
    purpose: '财务咨询',
    idCard: '370101199012123456'
  },
  {
    visitorName: '朱志强',
    phone: '13505324346',
    visitTime: '2025-05-20 14:30:00',
    hostName: '周美玲',
    department: '市场部',
    status: 'pending',
    purpose: '市场合作',
    idCard: '370101199013134567'
  },
  {
    visitorName: '孙丽华',
    phone: '13405325457',
    visitTime: '2025-05-20 15:00:00',
    hostName: '吴建国',
    department: '研发部',
    status: 'approved',
    purpose: '研发交流',
    idCard: '370101199014145678'
  },
  {
    visitorName: '李志明',
    phone: '13305326568',
    visitTime: '2025-05-20 16:30:00',
    hostName: '郑秀英',
    department: '生产部',
    status: 'pending',
    purpose: '生产指导',
    idCard: '370101199015156789'
  }
])

// 访客记录
const visitorRecords = ref([
  {
    name: '王建国',
    phone: '13905311234',
    visitTime: '2025-05-20 10:00:00',
    leaveTime: '2025-05-20 11:30:00',
    hostName: '李志强',
    department: '技术部',
    status: 'completed',
    purpose: '项目对接',
    idCard: '370101199001011234'
  },
  {
    name: '张丽华',
    phone: '13805322345',
    visitTime: '2025-05-20 14:00:00',
    leaveTime: '2025-05-20 16:00:00',
    hostName: '赵明辉',
    department: '行政部',
    status: 'completed',
    purpose: '商务洽谈',
    idCard: '370101199002022345'
  },
  {
    name: '刘志强',
    phone: '13705333456',
    visitTime: '2025-05-20 09:30:00',
    leaveTime: '2025-05-20 11:00:00',
    hostName: '陈美玲',
    department: '人事部',
    status: 'completed',
    purpose: '面试',
    idCard: '370101199003033456'
  },
  {
    name: '周晓明',
    phone: '13605344567',
    visitTime: '2025-05-20 11:00:00',
    leaveTime: '2025-05-20 12:30:00',
    hostName: '张伟华',
    department: '财务部',
    status: 'completed',
    purpose: '财务审计',
    idCard: '370101199004044567'
  },
  {
    name: '吴秀英',
    phone: '13505355678',
    visitTime: '2025-05-20 15:30:00',
    leaveTime: '2025-05-20 17:00:00',
    hostName: '王丽华',
    department: '市场部',
    status: 'completed',
    purpose: '市场调研',
    idCard: '370101199005055678'
  },
  {
    name: '郑志明',
    phone: '13405366789',
    visitTime: '2025-05-20 16:00:00',
    leaveTime: '2025-05-20 17:30:00',
    hostName: '孙建国',
    department: '研发部',
    status: 'completed',
    purpose: '技术交流',
    idCard: '370101199006066789'
  },
  {
    name: '林美玲',
    phone: '13305377890',
    visitTime: '2025-05-20 13:00:00',
    leaveTime: '2025-05-20 14:30:00',
    hostName: '杨志强',
    department: '生产部',
    status: 'completed',
    purpose: '设备维护',
    idCard: '370101199007077890'
  },
  {
    name: '黄建国',
    phone: '13205388901',
    visitTime: '2025-05-20 14:30:00',
    leaveTime: '2025-05-20 16:00:00',
    hostName: '朱丽华',
    department: '质量部',
    status: 'completed',
    purpose: '质量检查',
    idCard: '370101199008088901'
  },
  {
    name: '马志强',
    phone: '13905319902',
    visitTime: '2025-05-20 09:00:00',
    leaveTime: '2025-05-20 10:30:00',
    hostName: '刘建国',
    department: '技术部',
    status: 'completed',
    purpose: '技术咨询',
    idCard: '370101199009099012'
  },
  {
    name: '赵丽华',
    phone: '13805321013',
    visitTime: '2025-05-20 10:30:00',
    leaveTime: '2025-05-20 12:00:00',
    hostName: '张美玲',
    department: '行政部',
    status: 'completed',
    purpose: '行政事务',
    idCard: '370101199010101234'
  },
  {
    name: '陈志明',
    phone: '13705322124',
    visitTime: '2025-05-20 11:30:00',
    leaveTime: '2025-05-20 13:00:00',
    hostName: '王秀英',
    department: '人事部',
    status: 'completed',
    purpose: '人事面试',
    idCard: '370101199011112345'
  },
  {
    name: '杨建国',
    phone: '13605323235',
    visitTime: '2025-05-20 13:30:00',
    leaveTime: '2025-05-20 15:00:00',
    hostName: '李丽华',
    department: '财务部',
    status: 'completed',
    purpose: '财务咨询',
    idCard: '370101199012123456'
  },
  {
    name: '朱志强',
    phone: '13505324346',
    visitTime: '2025-05-20 14:30:00',
    leaveTime: '2025-05-20 16:00:00',
    hostName: '周美玲',
    department: '市场部',
    status: 'completed',
    purpose: '市场合作',
    idCard: '370101199013134567'
  },
  {
    name: '孙丽华',
    phone: '13405325457',
    visitTime: '2025-05-20 15:00:00',
    leaveTime: '2025-05-20 16:30:00',
    hostName: '吴建国',
    department: '研发部',
    status: 'completed',
    purpose: '研发交流',
    idCard: '370101199014145678'
  },
  {
    name: '李志明',
    phone: '13305326568',
    visitTime: '2025-05-20 16:30:00',
    leaveTime: '2025-05-20 18:00:00',
    hostName: '郑秀英',
    department: '生产部',
    status: 'completed',
    purpose: '生产指导',
    idCard: '370101199015156789'
  }
])

// 计算当前页的预约数据
const paginatedAppointments = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return appointmentList.value.slice(start, end)
})

// 计算当前页的访客记录数据
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return visitorRecords.value.slice(start, end)
})

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
  ElMessageBox.confirm(
    `确定要删除访客 ${appointment.visitorName} 的预约吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = appointmentList.value.findIndex(a => a.visitorName === appointment.visitorName)
    if (index > -1) {
      appointmentList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

// 保存预约
const handleSaveAppointment = () => {
  // 表单验证
  if (!appointmentForm.value.visitorName || !appointmentForm.value.phone || !appointmentForm.value.visitTime || !appointmentForm.value.hostName || !appointmentForm.value.department) {
    ElMessage.error('请填写完整信息')
    return
  }

  // 手机号格式验证
  if (!/^1[3-9]\d{9}$/.test(appointmentForm.value.phone)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  if (dialogType.value === 'add') {
    // 添加新预约
    appointmentList.value.unshift({
      ...appointmentForm.value,
      status: 'pending'
    })
    ElMessage.success('添加成功')
  } else {
    // 更新预约
    const index = appointmentList.value.findIndex(a => a.visitorName === appointmentForm.value.visitorName)
    if (index > -1) {
      appointmentList.value[index] = { ...appointmentForm.value }
      ElMessage.success('更新成功')
    }
  }
  showAppointmentDialog.value = false
}

// 提交登记
const handleSubmitRegistration = () => {
  // 表单验证
  if (!visitorForm.value.name || !visitorForm.value.phone || !visitorForm.value.idCard || !visitorForm.value.purpose || !visitorForm.value.hostName || !visitorForm.value.department || !visitorForm.value.visitTime || !visitorForm.value.leaveTime) {
    ElMessage.error('请填写完整信息')
    return
  }

  // 手机号格式验证
  if (!/^1[3-9]\d{9}$/.test(visitorForm.value.phone)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  // 身份证号格式验证
  if (!/^\d{17}[\dXx]$/.test(visitorForm.value.idCard)) {
    ElMessage.error('请输入正确的身份证号')
    return
  }

  // 时间验证
  const visitTime = new Date(visitorForm.value.visitTime)
  const leaveTime = new Date(visitorForm.value.leaveTime)
  if (leaveTime <= visitTime) {
    ElMessage.error('离开时间必须晚于来访时间')
    return
  }

  // 模拟提交成功
  currentVisitor.value = {
    ...visitorForm.value,
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    status: 'pending'
  }

  // 添加到访客记录
  visitorRecords.value.unshift({
    ...visitorForm.value,
    status: 'completed'
  })

  ElMessage.success('登记成功')
  resetForm()
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
  if (!val) {
    return
  }
  const [start, end] = val
  // 根据日期范围筛选访客记录
  visitorRecords.value = visitorRecords.value.filter(record => {
    const recordTime = new Date(record.visitTime)
    return recordTime >= start && recordTime <= end
  })
}

// 导出记录
const handleExport = () => {
  // 准备导出数据
  const exportData = visitorRecords.value.map(record => ({
    '访客姓名': record.name,
    '联系电话': record.phone,
    '身份证号': record.idCard,
    '来访时间': record.visitTime,
    '离开时间': record.leaveTime,
    '被访人': record.hostName,
    '被访部门': record.department,
    '来访目的': record.purpose,
    '状态': getStatusText(record.status)
  }))

  // 模拟导出过程
  setTimeout(() => {
    ElMessage.success('导出成功')
  }, 1000)
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  total.value = activeTab.value === 'appointment' ? appointmentList.value.length : visitorRecords.value.length
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 监听标签页变化
watch(activeTab, (newTab) => {
  currentPage.value = 1
  total.value = newTab === 'appointment' ? appointmentList.value.length : visitorRecords.value.length
})

// 初始化总数
total.value = appointmentList.value.length
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