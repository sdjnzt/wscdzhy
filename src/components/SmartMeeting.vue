<template>
  <div class="smart-meeting">
    <el-row :gutter="20">
      <!-- 左侧会议室列表 -->
      <el-col :span="6">
        <el-card class="room-list">
          <template #header>
            <div class="card-header">
              <span>会议室</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索会议室"
                prefix-icon="Search"
                clearable
                @clear="handleSearch"
                @input="handleSearch"
              />
            </div>
          </template>
          <el-scrollbar height="calc(100vh - 200px)">
            <el-tree
              :data="roomGroups"
              :props="defaultProps"
              @node-click="handleNodeClick"
              highlight-current
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <span v-if="data.type === 'room'" class="room-status">
                    <el-tag size="small" :type="data.status === 'available' ? 'success' : 'danger'">
                      {{ data.status === 'available' ? '空闲' : '使用中' }}
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
          <!-- 会议预约 -->
          <el-tab-pane label="会议预约" name="booking">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>预约列表</span>
                  <div class="header-actions">
                    <el-button type="primary" @click="handleAddBooking">新增预约</el-button>
                    <el-button type="success" @click="handleImport">批量导入</el-button>
                    <el-button type="warning" @click="handleExport">导出数据</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="paginatedBookings" style="width: 100%">
                <el-table-column prop="title" label="会议主题" />
                <el-table-column prop="room" label="会议室" />
                <el-table-column prop="organizer" label="组织者" />
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
                      <el-button type="primary" size="small" @click="handleEditBooking(scope.row)">编辑</el-button>
                      <el-button type="success" size="small" @click="handleStartMeeting(scope.row)">开始</el-button>
                      <el-button type="danger" size="small" @click="handleDeleteBooking(scope.row)">删除</el-button>
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

          <!-- 实时会议 -->
          <el-tab-pane label="实时会议" name="meeting">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-card class="meeting-card">
                  <template #header>
                    <div class="card-header">
                      <span>会议信息</span>
                      <div class="header-actions">
                        <el-button-group>
                          <el-button type="primary" :icon="VideoPlay" @click="startMeeting">开始会议</el-button>
                          <el-button type="danger" :icon="VideoPause" @click="endMeeting">结束会议</el-button>
                        </el-button-group>
                      </div>
                    </div>
                  </template>
                  <div class="meeting-content">
                    <div class="meeting-info">
                      <h3>{{ currentMeeting?.title }}</h3>
                      <p><strong>会议室：</strong>{{ currentMeeting?.room }}</p>
                      <p><strong>组织者：</strong>{{ currentMeeting?.organizer }}</p>
                      <p><strong>开始时间：</strong>{{ currentMeeting?.startTime }}</p>
                      <p><strong>结束时间：</strong>{{ currentMeeting?.endTime }}</p>
                      <p><strong>参会人数：</strong>{{ currentMeeting?.attendeeCount || 0 }}</p>
                    </div>
                    <div class="meeting-controls">
                      <el-button-group>
                        <el-button type="primary" :icon="Microphone" @click="toggleMicrophone">麦克风</el-button>
                        <el-button type="primary" :icon="VideoCamera" @click="toggleCamera">摄像头</el-button>
                        <el-button type="primary" :icon="Monitor" @click="toggleScreen">共享屏幕</el-button>
                        <el-button type="primary" :icon="ChatDotRound" @click="toggleChat">聊天</el-button>
                      </el-button-group>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="status-card">
                  <template #header>
                    <div class="card-header">
                      <span>参会人员</span>
                    </div>
                  </template>
                  <div class="attendee-list">
                    <el-table :data="attendeeList" style="width: 100%">
                      <el-table-column prop="name" label="姓名" />
                      <el-table-column prop="department" label="部门" />
                      <el-table-column prop="status" label="状态">
                        <template #default="scope">
                          <el-tag :type="scope.row.status === 'online' ? 'success' : 'info'">
                            {{ scope.row.status === 'online' ? '在线' : '离线' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>

          <!-- 会议记录 -->
          <el-tab-pane label="会议记录" name="records">
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
                <el-table-column prop="title" label="会议主题" />
                <el-table-column prop="room" label="会议室" />
                <el-table-column prop="organizer" label="组织者" />
                <el-table-column prop="startTime" label="开始时间" width="180" />
                <el-table-column prop="endTime" label="结束时间" width="180" />
                <el-table-column prop="duration" label="时长" />
                <el-table-column prop="attendeeCount" label="参会人数" />
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'completed' ? 'success' : 'danger'">
                      {{ scope.row.status === 'completed' ? '已完成' : '异常结束' }}
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
      </el-col>
    </el-row>

    <!-- 预约表单对话框 -->
    <el-dialog
      v-model="showBookingDialog"
      :title="dialogType === 'add' ? '新增预约' : '编辑预约'"
      width="50%"
      destroy-on-close
    >
      <el-form :model="bookingForm" label-width="100px">
        <el-form-item label="会议主题">
          <el-input v-model="bookingForm.title" placeholder="请输入会议主题" />
        </el-form-item>
        <el-form-item label="会议室">
          <el-select v-model="bookingForm.room" placeholder="请选择会议室">
            <el-option
              v-for="room in roomList"
              :key="room.id"
              :label="room.name"
              :value="room.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="组织者">
          <el-select v-model="bookingForm.organizer" placeholder="请选择组织者">
            <el-option label="张三" value="张三" />
            <el-option label="李四" value="李四" />
            <el-option label="王五" value="王五" />
          </el-select>
        </el-form-item>
        <el-form-item label="会议时间">
          <el-date-picker
            v-model="bookingForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
        <el-form-item label="参会人员">
          <el-select
            v-model="bookingForm.attendees"
            multiple
            placeholder="请选择参会人员"
          >
            <el-option label="张三" value="张三" />
            <el-option label="李四" value="李四" />
            <el-option label="王五" value="王五" />
          </el-select>
        </el-form-item>
        <el-form-item label="会议类型">
          <el-select v-model="bookingForm.type" placeholder="请选择会议类型">
            <el-option label="普通会议" value="normal" />
            <el-option label="视频会议" value="video" />
            <el-option label="培训会议" value="training" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="bookingForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBookingDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaveBooking">保存</el-button>
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
  Download,
  Microphone,
  VideoCamera,
  Monitor,
  ChatDotRound
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索关键词
const searchKeyword = ref('')

// 当前选中的会议室
const currentRoom = ref(null)

// 标签页
const activeTab = ref('booking')

// 日期范围
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 对话框控制
const showBookingDialog = ref(false)
const dialogType = ref('add')

// 预约表单
const bookingForm = ref({
  title: '',
  room: '',
  organizer: '',
  timeRange: [],
  attendees: [],
  type: 'normal',
  remark: ''
})

// 当前会议
const currentMeeting = ref(null)

// 会议室分组数据
const roomGroups = ref([
  {
    label: 'A区会议室',
    children: [
      {
        label: 'A区大会议室',
        type: 'room',
        status: 'available',
        id: 'A001',
        name: 'A区大会议室',
        capacity: 50,
        facilities: ['投影仪', '视频会议系统', '音响系统', '电子白板', '无线投屏'],
        area: '120平方米',
        location: 'A区3楼',
        lastMaintenance: '2025-05-15'
      },
      {
        label: 'A区小会议室',
        type: 'room',
        status: 'occupied',
        id: 'A002',
        name: 'A区小会议室',
        capacity: 20,
        facilities: ['投影仪', '视频会议系统', '电子白板'],
        area: '60平方米',
        location: 'A区3楼',
        lastMaintenance: '2025-05-15'
      },
      {
        label: 'A区培训室',
        type: 'room',
        status: 'available',
        id: 'A003',
        name: 'A区培训室',
        capacity: 100,
        facilities: ['投影仪', '视频会议系统', '音响系统', '电子白板', '无线投屏', '录播系统'],
        area: '200平方米',
        location: 'A区4楼',
        lastMaintenance: '2025-05-15'
      }
    ]
  },
  {
    label: 'B区会议室',
    children: [
      {
        label: 'B区会议室',
        type: 'room',
        status: 'available',
        id: 'B001',
        name: 'B区会议室',
        capacity: 30,
        facilities: ['投影仪', '视频会议系统', '音响系统', '电子白板'],
        area: '80平方米',
        location: 'B区2楼',
        lastMaintenance: '2025-05-15'
      },
      {
        label: 'B区洽谈室',
        type: 'room',
        status: 'available',
        id: 'B002',
        name: 'B区洽谈室',
        capacity: 10,
        facilities: ['视频会议系统', '电子白板'],
        area: '40平方米',
        location: 'B区2楼',
        lastMaintenance: '2025-05-15'
      }
    ]
  },
  {
    label: 'C区会议室',
    children: [
      {
        label: 'C区会议室',
        type: 'room',
        status: 'available',
        id: 'C001',
        name: 'C区会议室',
        capacity: 40,
        facilities: ['投影仪', '视频会议系统', '音响系统', '电子白板', '无线投屏'],
        area: '100平方米',
        location: 'C区1楼',
        lastMaintenance: '2025-05-15'
      },
      {
        label: 'C区多功能厅',
        type: 'room',
        status: 'available',
        id: 'C002',
        name: 'C区多功能厅',
        capacity: 200,
        facilities: ['投影仪', '视频会议系统', '音响系统', '电子白板', '无线投屏', '录播系统', '舞台灯光'],
        area: '300平方米',
        location: 'C区1楼',
        lastMaintenance: '2025-05-15'
      }
    ]
  }
])

// 会议室列表
const roomList = ref([
  { id: 'A001', name: 'A区大会议室' },
  { id: 'A002', name: 'A区小会议室' },
  { id: 'A003', name: 'A区培训室' },
  { id: 'B001', name: 'B区会议室' },
  { id: 'B002', name: 'B区洽谈室' },
  { id: 'C001', name: 'C区会议室' },
  { id: 'C002', name: 'C区多功能厅' }
])

// 树形配置
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 员工列表
const employeeList = ref([
  { id: 'E001', name: '王建国', department: '技术部', position: '技术总监', phone: '13905311234' },
  { id: 'E002', name: '张丽华', department: '产品部', position: '产品经理', phone: '13805322345' },
  { id: 'E003', name: '刘志强', department: '市场部', position: '市场总监', phone: '13705333456' },
  { id: 'E004', name: '周晓明', department: '人事部', position: '人事经理', phone: '13605344567' },
  { id: 'E005', name: '吴秀英', department: '财务部', position: '财务总监', phone: '13505355678' },
  { id: 'E006', name: '郑志明', department: '技术部', position: '高级工程师', phone: '13405366789' },
  { id: 'E007', name: '林美玲', department: '产品部', position: 'UI设计师', phone: '13305377890' },
  { id: 'E008', name: '黄建国', department: '市场部', position: '市场专员', phone: '13205388901' }
])

// 预约列表
const bookingList = ref([
  {
    title: '项目启动会',
    room: 'A区大会议室',
    organizer: '王建国',
    startTime: '2025-05-20 10:00:00',
    endTime: '2025-05-20 11:00:00',
    status: 'pending',
    type: 'normal',
    attendees: ['张丽华', '刘志强', '周晓明'],
    remark: '讨论项目整体规划和分工'
  },
  {
    title: '技术评审会',
    room: 'A区小会议室',
    organizer: '郑志明',
    startTime: '2025-05-20 14:00:00',
    endTime: '2025-05-20 15:00:00',
    status: 'completed',
    type: 'video',
    attendees: ['王建国', '林美玲', '黄建国'],
    remark: '评审新功能设计方案'
  },
  {
    title: '新员工培训',
    room: 'A区培训室',
    organizer: '周晓明',
    startTime: '2025-05-21 09:00:00',
    endTime: '2025-05-21 17:00:00',
    status: 'pending',
    type: 'training',
    attendees: ['王建国', '张丽华', '刘志强', '吴秀英'],
    remark: '新员工入职培训'
  },
  {
    title: '季度总结会',
    room: 'C区多功能厅',
    organizer: '吴秀英',
    startTime: '2025-05-22 14:00:00',
    endTime: '2025-05-22 17:00:00',
    status: 'pending',
    type: 'normal',
    attendees: ['王建国', '张丽华', '刘志强', '周晓明', '郑志明', '林美玲', '黄建国'],
    remark: '2024年第一季度工作总结'
  }
])

// 参会人员列表
const attendeeList = ref([
  {
    name: '王建国',
    department: '技术部',
    position: '技术总监',
    status: 'online',
    joinTime: '2025-05-20 10:00:00'
  },
  {
    name: '张丽华',
    department: '产品部',
    position: '产品经理',
    status: 'online',
    joinTime: '2025-05-20 10:01:00'
  },
  {
    name: '刘志强',
    department: '市场部',
    position: '市场总监',
    status: 'offline',
    joinTime: '2025-05-20 10:05:00'
  },
  {
    name: '周晓明',
    department: '人事部',
    position: '人事经理',
    status: 'online',
    joinTime: '2025-05-20 10:02:00'
  }
])

// 历史记录
const historyRecords = ref([
  {
    title: '项目启动会',
    room: 'A区大会议室',
    organizer: '王建国',
    startTime: '2025-05-20 10:00:00',
    endTime: '2025-05-20 11:00:00',
    duration: '1小时',
    attendeeCount: 15,
    status: 'completed',
    type: 'normal',
    remark: '讨论项目整体规划和分工'
  },
  {
    title: '技术评审会',
    room: 'A区小会议室',
    organizer: '郑志明',
    startTime: '2025-05-20 14:00:00',
    endTime: '2025-05-20 15:00:00',
    duration: '1小时',
    attendeeCount: 8,
    status: 'completed',
    type: 'video',
    remark: '评审新功能设计方案'
  },
  {
    title: '部门例会',
    room: 'B区会议室',
    organizer: '张丽华',
    startTime: '2025-05-19 10:00:00',
    endTime: '2025-05-19 11:00:00',
    duration: '1小时',
    attendeeCount: 12,
    status: 'completed',
    type: 'normal',
    remark: '产品部周例会'
  },
  {
    title: '客户洽谈',
    room: 'B区洽谈室',
    organizer: '刘志强',
    startTime: '2025-05-19 14:00:00',
    endTime: '2025-05-19 15:30:00',
    duration: '1.5小时',
    attendeeCount: 6,
    status: 'completed',
    type: 'video',
    remark: '与重要客户视频会议'
  }
])

// 计算当前页的数据
const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return bookingList.value.slice(start, end)
})

// 计算当前页的记录数据
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return historyRecords.value.slice(start, end)
})

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    running: 'success',
    completed: 'info',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待开始',
    running: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || '未知'
}

// 处理节点点击
const handleNodeClick = (data) => {
  if (data.type === 'room') {
    currentRoom.value = data
  }
}

// 处理搜索
const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value)
}

// 新增预约
const handleAddBooking = () => {
  dialogType.value = 'add'
  bookingForm.value = {
    title: '',
    room: '',
    organizer: '',
    timeRange: [],
    attendees: [],
    type: 'normal',
    remark: ''
  }
  showBookingDialog.value = true
}

// 编辑预约
const handleEditBooking = (booking) => {
  dialogType.value = 'edit'
  bookingForm.value = {
    ...booking,
    timeRange: [booking.startTime, booking.endTime]
  }
  showBookingDialog.value = true
}

// 删除预约
const handleDeleteBooking = (booking) => {
  ElMessageBox.confirm(
    `确定要删除会议"${booking.title}"吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = bookingList.value.findIndex(b => b.title === booking.title)
    if (index > -1) {
      bookingList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

// 开始会议
const handleStartMeeting = (booking) => {
  console.log('开始会议:', booking)
  currentMeeting.value = booking
  activeTab.value = 'meeting'
}

// 保存预约
const handleSaveBooking = () => {
  // 表单验证
  if (!bookingForm.value.title || !bookingForm.value.room || !bookingForm.value.organizer || 
      !bookingForm.value.timeRange || !bookingForm.value.attendees.length) {
    ElMessage.error('请填写完整信息')
    return
  }

  // 检查时间冲突
  const startTime = bookingForm.value.timeRange[0]
  const endTime = bookingForm.value.timeRange[1]
  const hasConflict = bookingList.value.some(booking => {
    if (booking.room === bookingForm.value.room && booking.status !== 'cancelled') {
      return (startTime >= booking.startTime && startTime < booking.endTime) ||
             (endTime > booking.startTime && endTime <= booking.endTime) ||
             (startTime <= booking.startTime && endTime >= booking.endTime)
    }
    return false
  })

  if (hasConflict) {
    ElMessage.error('该时间段会议室已被预约')
    return
  }

  if (dialogType.value === 'add') {
    // 添加新预约
    bookingList.value.unshift({
      ...bookingForm.value,
      startTime: bookingForm.value.timeRange[0],
      endTime: bookingForm.value.timeRange[1],
      status: 'pending'
    })
    ElMessage.success('添加成功')
  } else {
    // 更新预约
    const index = bookingList.value.findIndex(b => b.title === bookingForm.value.title)
    if (index > -1) {
      bookingList.value[index] = {
        ...bookingForm.value,
        startTime: bookingForm.value.timeRange[0],
        endTime: bookingForm.value.timeRange[1]
      }
      ElMessage.success('更新成功')
    }
  }
  showBookingDialog.value = false
}

// 开始会议
const startMeeting = () => {
  console.log('开始会议')
}

// 结束会议
const endMeeting = () => {
  console.log('结束会议')
  currentMeeting.value = null
}

// 切换麦克风
const toggleMicrophone = () => {
  console.log('切换麦克风')
}

// 切换摄像头
const toggleCamera = () => {
  console.log('切换摄像头')
}

// 切换屏幕共享
const toggleScreen = () => {
  console.log('切换屏幕共享')
}

// 切换聊天
const toggleChat = () => {
  console.log('切换聊天')
}

// 批量导入
const handleImport = () => {
  console.log('批量导入')
}

// 导出数据
const handleExport = () => {
  // 准备导出数据
  const exportData = activeTab.value === 'booking' ? bookingList.value.map(booking => ({
    '会议主题': booking.title,
    '会议室': booking.room,
    '组织者': booking.organizer,
    '开始时间': booking.startTime,
    '结束时间': booking.endTime,
    '会议类型': booking.type === 'normal' ? '普通会议' : booking.type === 'video' ? '视频会议' : '培训会议',
    '状态': getStatusText(booking.status),
    '参会人数': booking.attendees.length,
    '备注': booking.remark
  })) : historyRecords.value.map(record => ({
    '会议主题': record.title,
    '会议室': record.room,
    '组织者': record.organizer,
    '开始时间': record.startTime,
    '结束时间': record.endTime,
    '时长': record.duration,
    '参会人数': record.attendeeCount,
    '会议类型': record.type === 'normal' ? '普通会议' : record.type === 'video' ? '视频会议' : '培训会议',
    '状态': record.status === 'completed' ? '已完成' : '异常结束',
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
  total.value = activeTab.value === 'booking' ? bookingList.value.length : 
                activeTab.value === 'records' ? historyRecords.value.length : 0
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 监听标签页变化
watch(activeTab, (newTab) => {
  currentPage.value = 1
  total.value = newTab === 'booking' ? bookingList.value.length : 
                newTab === 'records' ? historyRecords.value.length : 0
})

// 初始化总数
total.value = bookingList.value.length
</script>

<style scoped>
.smart-meeting {
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

.room-list {
  height: calc(100vh - 100px);
}

.content-tabs {
  height: calc(100vh - 100px);
}

.meeting-card {
  height: calc(100vh - 150px);
}

.status-card {
  height: calc(100vh - 150px);
}

.meeting-content {
  padding: 20px;
}

.meeting-info {
  margin-bottom: 20px;
}

.meeting-info h3 {
  margin-bottom: 15px;
}

.meeting-info p {
  margin: 10px 0;
}

.meeting-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.attendee-list {
  padding: 10px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.room-status {
  margin-left: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 