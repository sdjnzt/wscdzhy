<template>
  <div class="broadcast-system">
    <el-row :gutter="20">
      <!-- 左侧设备列表 -->
      <el-col :span="6">
        <el-card class="device-list">
          <template #header>
            <div class="card-header">
              <span>广播设备</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索设备"
                prefix-icon="Search"
                clearable
                @clear="handleSearch"
                @input="handleSearch"
              />
            </div>
          </template>
          <el-scrollbar height="calc(100vh - 200px)">
            <el-tree
              :data="deviceGroups"
              :props="defaultProps"
              @node-click="handleNodeClick"
              highlight-current
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <span v-if="data.type === 'device'" class="device-status">
                    <el-tag size="small" :type="data.status === 'online' ? 'success' : 'danger'">
                      {{ data.status === 'online' ? '在线' : '离线' }}
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
          <!-- 广播任务 -->
          <el-tab-pane label="广播任务" name="tasks">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>任务列表</span>
                  <div class="header-actions">
                    <el-button type="primary" @click="handleAddTask">新增任务</el-button>
                    <el-button type="success" @click="handleImport">批量导入</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="taskList" style="width: 100%">
                <el-table-column prop="name" label="任务名称" />
                <el-table-column prop="type" label="广播类型" />
                <el-table-column prop="content" label="广播内容" show-overflow-tooltip />
                <el-table-column prop="schedule" label="播放时间" width="180" />
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
                      <el-button type="primary" size="small" @click="handleEditTask(scope.row)">编辑</el-button>
                      <el-button type="success" size="small" @click="handlePlayTask(scope.row)">播放</el-button>
                      <el-button type="danger" size="small" @click="handleDeleteTask(scope.row)">删除</el-button>
                    </el-button-group>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>

          <!-- 实时广播 -->
          <el-tab-pane label="实时广播" name="broadcast">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-card class="broadcast-card">
                  <template #header>
                    <div class="card-header">
                      <span>广播控制</span>
                      <div class="header-actions">
                        <el-button-group>
                          <el-button type="primary" :icon="VideoPlay" @click="startBroadcast">开始广播</el-button>
                          <el-button type="danger" :icon="VideoPause" @click="stopBroadcast">停止广播</el-button>
                        </el-button-group>
                      </div>
                    </div>
                  </template>
                  <div class="broadcast-content">
                    <el-form :model="broadcastForm" label-width="100px">
                      <el-form-item label="广播类型">
                        <el-select v-model="broadcastForm.type" placeholder="请选择广播类型">
                          <el-option label="语音广播" value="voice" />
                          <el-option label="音乐广播" value="music" />
                          <el-option label="紧急广播" value="emergency" />
                        </el-select>
                      </el-form-item>
                      <el-form-item label="广播内容">
                        <el-input
                          v-model="broadcastForm.content"
                          type="textarea"
                          :rows="4"
                          placeholder="请输入广播内容"
                        />
                      </el-form-item>
                      <el-form-item label="音量">
                        <el-slider v-model="broadcastForm.volume" :min="0" :max="100" />
                      </el-form-item>
                      <el-form-item label="播放区域">
                        <el-checkbox-group v-model="broadcastForm.areas">
                          <el-checkbox label="A区">A区</el-checkbox>
                          <el-checkbox label="B区">B区</el-checkbox>
                          <el-checkbox label="C区">C区</el-checkbox>
                        </el-checkbox-group>
                      </el-form-item>
                    </el-form>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="status-card">
                  <template #header>
                    <div class="card-header">
                      <span>广播状态</span>
                    </div>
                  </template>
                  <div class="status-content" v-if="currentBroadcast">
                    <div class="status-info">
                      <p><strong>广播类型：</strong>{{ currentBroadcast.type }}</p>
                      <p><strong>播放区域：</strong>{{ currentBroadcast.areas.join(', ') }}</p>
                      <p><strong>当前音量：</strong>{{ currentBroadcast.volume }}%</p>
                      <p><strong>开始时间：</strong>{{ currentBroadcast.startTime }}</p>
                      <p><strong>状态：</strong>
                        <el-tag :type="currentBroadcast.status === 'playing' ? 'success' : 'info'">
                          {{ currentBroadcast.status === 'playing' ? '播放中' : '已停止' }}
                        </el-tag>
                      </p>
                    </div>
                  </div>
                  <div v-else class="no-broadcast">
                    <el-empty description="暂无广播" />
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>

          <!-- 广播记录 -->
          <el-tab-pane label="广播记录" name="records">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>广播记录</span>
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
              <el-table :data="broadcastRecords" style="width: 100%">
                <el-table-column prop="time" label="广播时间" width="180" />
                <el-table-column prop="type" label="广播类型" />
                <el-table-column prop="content" label="广播内容" show-overflow-tooltip />
                <el-table-column prop="areas" label="播放区域" />
                <el-table-column prop="duration" label="播放时长" />
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
                      {{ scope.row.status === 'success' ? '成功' : '失败' }}
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

    <!-- 任务表单对话框 -->
    <el-dialog
      v-model="showTaskDialog"
      :title="dialogType === 'add' ? '新增任务' : '编辑任务'"
      width="50%"
      destroy-on-close
    >
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="广播类型">
          <el-select v-model="taskForm.type" placeholder="请选择广播类型">
            <el-option label="语音广播" value="voice" />
            <el-option label="音乐广播" value="music" />
            <el-option label="紧急广播" value="emergency" />
          </el-select>
        </el-form-item>
        <el-form-item label="广播内容">
          <el-input
            v-model="taskForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入广播内容"
          />
        </el-form-item>
        <el-form-item label="播放时间">
          <el-date-picker
            v-model="taskForm.schedule"
            type="datetime"
            placeholder="请选择播放时间"
          />
        </el-form-item>
        <el-form-item label="播放区域">
          <el-checkbox-group v-model="taskForm.areas">
            <el-checkbox label="A区">A区</el-checkbox>
            <el-checkbox label="B区">B区</el-checkbox>
            <el-checkbox label="C区">C区</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTaskDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaveTask">保存</el-button>
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

// 当前选中的设备
const currentDevice = ref(null)

// 标签页
const activeTab = ref('tasks')

// 日期范围
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 对话框控制
const showTaskDialog = ref(false)
const dialogType = ref('add')

// 广播表单
const broadcastForm = ref({
  type: 'voice',
  content: '',
  volume: 50,
  areas: ['A区']
})

// 任务表单
const taskForm = ref({
  name: '',
  type: 'voice',
  content: '',
  schedule: '',
  areas: ['A区']
})

// 当前广播
const currentBroadcast = ref(null)

// 设备分组数据
const deviceGroups = ref([
  {
    label: 'A区广播',
    children: [
      {
        label: 'A区主广播',
        type: 'device',
        status: 'online',
        id: 'A001',
        name: 'A区主广播',
        location: 'A区大厅',
        lastHeartbeat: '2024-03-20 10:00:00'
      },
      {
        label: 'A区副广播',
        type: 'device',
        status: 'online',
        id: 'A002',
        name: 'A区副广播',
        location: 'A区走廊',
        lastHeartbeat: '2024-03-20 10:00:00'
      }
    ]
  },
  {
    label: 'B区广播',
    children: [
      {
        label: 'B区主广播',
        type: 'device',
        status: 'offline',
        id: 'B001',
        name: 'B区主广播',
        location: 'B区大厅',
        lastHeartbeat: '2024-03-20 09:30:00'
      }
    ]
  }
])

// 树形配置
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 任务列表
const taskList = ref([
  {
    name: '早间广播',
    type: 'voice',
    content: '各位同事早上好，欢迎来到公司...',
    schedule: '2024-03-20 08:00:00',
    status: 'pending'
  },
  {
    name: '午间音乐',
    type: 'music',
    content: '播放轻音乐...',
    schedule: '2024-03-20 12:00:00',
    status: 'completed'
  }
])

// 广播记录
const broadcastRecords = ref([
  {
    time: '2024-03-20 08:00:00',
    type: '语音广播',
    content: '各位同事早上好，欢迎来到公司...',
    areas: 'A区, B区',
    duration: '5分钟',
    status: 'success'
  },
  {
    time: '2024-03-20 12:00:00',
    type: '音乐广播',
    content: '播放轻音乐...',
    areas: 'A区',
    duration: '30分钟',
    status: 'success'
  }
])

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    playing: 'success',
    completed: 'info',
    failed: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    pending: '待播放',
    playing: '播放中',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status] || '未知'
}

// 处理节点点击
const handleNodeClick = (data) => {
  if (data.type === 'device') {
    currentDevice.value = data
  }
}

// 处理搜索
const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value)
}

// 新增任务
const handleAddTask = () => {
  dialogType.value = 'add'
  taskForm.value = {
    name: '',
    type: 'voice',
    content: '',
    schedule: '',
    areas: ['A区']
  }
  showTaskDialog.value = true
}

// 编辑任务
const handleEditTask = (task) => {
  dialogType.value = 'edit'
  taskForm.value = { ...task }
  showTaskDialog.value = true
}

// 删除任务
const handleDeleteTask = (task) => {
  console.log('删除任务:', task)
}

// 播放任务
const handlePlayTask = (task) => {
  console.log('播放任务:', task)
}

// 保存任务
const handleSaveTask = () => {
  console.log('保存任务:', taskForm.value)
  showTaskDialog.value = false
}

// 开始广播
const startBroadcast = () => {
  console.log('开始广播:', broadcastForm.value)
  currentBroadcast.value = {
    ...broadcastForm.value,
    startTime: new Date().toLocaleString(),
    status: 'playing'
  }
}

// 停止广播
const stopBroadcast = () => {
  console.log('停止广播')
  currentBroadcast.value = null
}

// 批量导入
const handleImport = () => {
  console.log('批量导入')
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
.broadcast-system {
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

.device-list {
  height: calc(100vh - 100px);
}

.content-tabs {
  height: calc(100vh - 100px);
}

.broadcast-card {
  height: calc(100vh - 150px);
}

.status-card {
  height: calc(100vh - 150px);
}

.broadcast-content {
  padding: 20px;
}

.status-content {
  padding: 20px;
}

.status-info p {
  margin: 10px 0;
}

.no-broadcast {
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

.device-status {
  margin-left: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 