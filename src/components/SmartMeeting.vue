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
              <el-table :data="bookingList" style="width: 100%">
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
              <el-table :data="historyRecords" style="width: 100%">
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
import { ref } from 'vue'
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
        facilities: ['投影仪', '视频会议系统', '音响系统']
      },
      {
        label: 'A区小会议室',
        type: 'room',
        status: 'occupied',
        id: 'A002',
        name: 'A区小会议室',
        capacity: 20,
        facilities: ['投影仪', '视频会议系统']
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
        facilities: ['投影仪', '视频会议系统', '音响系统']
      }
    ]
  }
])

// 会议室列表
const roomList = ref([
  { id: 'A001', name: 'A区大会议室' },
  { id: 'A002', name: 'A区小会议室' },
  { id: 'B001', name: 'B区会议室' }
])

// 树形配置
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 预约列表
const bookingList = ref([
  {
    title: '项目启动会',
    room: 'A区大会议室',
    organizer: '张三',
    startTime: '2024-03-20 10:00:00',
    endTime: '2024-03-20 11:00:00',
    status: 'pending'
  },
  {
    title: '技术评审会',
    room: 'A区小会议室',
    organizer: '李四',
    startTime: '2024-03-20 14:00:00',
    endTime: '2024-03-20 15:00:00',
    status: 'completed'
  }
])

// 参会人员列表
const attendeeList = ref([
  {
    name: '张三',
    department: '技术部',
    status: 'online'
  },
  {
    name: '李四',
    department: '产品部',
    status: 'online'
  },
  {
    name: '王五',
    department: '市场部',
    status: 'offline'
  }
])

// 历史记录
const historyRecords = ref([
  {
    title: '项目启动会',
    room: 'A区大会议室',
    organizer: '张三',
    startTime: '2024-03-20 10:00:00',
    endTime: '2024-03-20 11:00:00',
    duration: '1小时',
    attendeeCount: 15,
    status: 'completed'
  },
  {
    title: '技术评审会',
    room: 'A区小会议室',
    organizer: '李四',
    startTime: '2024-03-20 14:00:00',
    endTime: '2024-03-20 15:00:00',
    duration: '1小时',
    attendeeCount: 8,
    status: 'completed'
  }
])

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
  console.log('删除预约:', booking)
}

// 开始会议
const handleStartMeeting = (booking) => {
  console.log('开始会议:', booking)
  currentMeeting.value = booking
  activeTab.value = 'meeting'
}

// 保存预约
const handleSaveBooking = () => {
  console.log('保存预约:', bookingForm.value)
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