<template>
  <div class="monitoring-dashboard">
    <el-row :gutter="20">
      <!-- 顶部统计卡片 -->
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

      <!-- 实时告警列表 -->
      <el-col :span="16">
        <el-card class="alarm-list">
          <template #header>
            <div class="card-header">
              <span class="title">实时告警</span>
              <el-tag type="danger" effect="dark" v-if="hasNewAlarm">
                新告警
              </el-tag>
            </div>
          </template>
          <div class="alarm-table">
            <el-table :data="alarms" height="400">
              <el-table-column type="expand">
                <template #default="props">
                  <div class="alarm-detail">
                    <el-image
                      :src="props.row.snapshot"
                      :preview-src-list="[props.row.snapshot]"
                      fit="contain"
                      class="alarm-image"
                    />
                    <div class="detail-info">
                      <p><strong>详细位置：</strong>{{ props.row.location }}</p>
                      <p><strong>告警描述：</strong>{{ props.row.description }}</p>
                      <p><strong>处理建议：</strong>{{ props.row.suggestion }}</p>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="time" label="时间" width="180" />
              <el-table-column prop="type" label="类型" width="120">
                <template #default="scope">
                  <el-tag :type="getAlarmType(scope.row.type)">
                    {{ scope.row.type }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="location" label="位置" width="180" />
              <el-table-column prop="status" label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="scope.row.status === '已处理' ? 'success' : 'danger'">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180">
                <template #default="scope">
                  <el-button-group>
                    <el-button 
                      size="small" 
                      type="primary"
                      @click="handleAlarm(scope.row)"
                      :disabled="scope.row.status === '已处理'"
                    >
                      处理
                    </el-button>
                    <el-button 
                      size="small" 
                      @click="viewVideo(scope.row)"
                    >
                      回放
                    </el-button>
                  </el-button-group>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <!-- 实时监控点位 -->
      <el-col :span="8">
        <el-card class="camera-list">
          <template #header>
            <div class="card-header">
              <span class="title">监控点位</span>
              <el-switch
                v-model="showOffline"
                active-text="显示离线"
              />
            </div>
          </template>
          <div class="camera-grid">
            <div 
              v-for="camera in filteredCameras" 
              :key="camera.id"
              class="camera-item"
              :class="{ offline: !camera.online }"
              @click="viewCamera(camera)"
            >
              <div class="camera-preview">
                <div class="mock-preview">摄像头预览</div>
                <el-tag 
                  size="small"
                  :type="camera.online ? 'success' : 'info'"
                  class="camera-status"
                >
                  {{ camera.online ? '在线' : '离线' }}
                </el-tag>
              </div>
              <div class="camera-info">
                <span>{{ camera.name }}</span>
                <span class="camera-location">{{ camera.location }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警处理对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="告警处理"
      width="500px"
    >
      <el-form :model="alarmForm" label-width="100px">
        <el-form-item label="处理方式">
          <el-select v-model="alarmForm.method" placeholder="请选择处理方式">
            <el-option label="现场处理" value="onsite" />
            <el-option label="远程处理" value="remote" />
            <el-option label="转交处理" value="transfer" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input
            type="textarea"
            v-model="alarmForm.description"
            rows="3"
            placeholder="请输入处理说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAlarmHandle">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 视频回放对话框 -->
    <el-dialog
      v-model="videoDialogVisible"
      title="视频回放"
      width="800px"
    >
      <div class="video-player">
        <div class="mock-player">视频回放画面</div>
        <div class="player-controls">
          <el-slider v-model="playProgress" :max="100" />
          <div class="control-buttons">
            <el-button-group>
              <el-button :icon="VideoPlay">播放</el-button>
              <el-button :icon="VideoPause">暂停</el-button>
            </el-button-group>
            <span class="time-display">00:00:00 / 00:05:00</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Warning,
  VideoPlay,
  VideoPause,
  Bell,
  Connection
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 统计数据
const statistics = ref([
  {
    title: '今日告警',
    value: '28',
    icon: 'Warning',
    type: 'danger',
    change: '+5'
  },
  {
    title: '待处理',
    value: '5',
    icon: 'Bell',
    type: 'warning',
    change: '-2'
  },
  {
    title: '在线设备',
    value: '42/45',
    icon: 'Connection',
    type: 'success',
    change: '+1'
  },
  {
    title: '覆盖区域',
    value: '12',
    icon: 'Location',
    type: 'primary',
    change: '0'
  }
])

// 告警数据
const alarms = ref([
  {
    id: 1,
    time: '2025-01-22 14:30:25',
    type: '高空抛物',
    location: 'A栋1单元西侧',
    status: '未处理',
    snapshot: '/mock/alarm1.jpg',
    description: '发现高空抛物行为，疑似生活垃圾，已触发声光警报',
    suggestion: '1. 及时清理抛物物品\n2. 排查可疑楼层\n3. 加强巡查力度'
  },
  {
    id: 2,
    time: '2025-01-22 14:15:12',
    type: '人员闯入',
    location: 'B栋地下车库',
    status: '处理中',
    snapshot: '/mock/alarm2.jpg',
    description: '检测到可疑人员在地下车库徘徊，未佩戴访客证',
    suggestion: '1. 保安巡查确认\n2. 核实人员身份\n3. 做好记录登记'
  },
  {
    id: 3,
    time: '2025-01-21 13:45:30',
    type: '异常聚集',
    location: 'C栋楼下广场',
    status: '已处理',
    snapshot: '/mock/alarm3.jpg',
    description: '检测到5人以上聚集，持续时间超过15分钟',
    suggestion: '1. 现场了解情况\n2. 必要时进行疏导\n3. 保持场地秩序'
  },
  {
    id: 4,
    time: '2025-01-21 13:20:18',
    type: '高空抛物',
    location: 'D栋3单元',
    status: '已处理',
    snapshot: '/mock/alarm4.jpg',
    description: '监测到高空抛物行为，物品疑似烟头',
    suggestion: '1. 清理现场\n2. 排查源头\n3. 加强宣传教育'
  },
  {
    id: 5,
    time: '2025-01-20 12:55:42',
    type: '异常聚集',
    location: 'E栋电梯口',
    status: '已处理',
    snapshot: '/mock/alarm5.jpg',
    description: '电梯口处检测到多人聚集，可能影响通行',
    suggestion: '1. 及时疏导\n2. 保持通道畅通\n3. 注意秩序维护'
  },
  {
    id: 6,
    time: '2025-01-20 14:40:33',
    type: '车辆占道',
    location: 'F栋消防通道',
    status: '未处理',
    snapshot: '/mock/alarm6.jpg',
    description: '私家车占用消防通道，影响消防车通行',
    suggestion: '1. 及时联系车主\n2. 清理占用车辆\n3. 加强停车管理'
  },
  {
    id: 7,
    time: '2025-01-19 14:25:15',
    type: '设备故障',
    location: 'G栋2单元电梯',
    status: '处理中',
    snapshot: '/mock/alarm7.jpg',
    description: '2号电梯运行异常，发出异响',
    suggestion: '1. 立即停用电梯\n2. 联系维保单位\n3. 张贴提示公告'
  },
  {
    id: 8,
    time: '2025-01-19 15:10:28',
    type: '宠物扰民',
    location: 'H栋3单元',
    status: '已处理',
    snapshot: '/mock/alarm8.jpg',
    description: '业主反映有犬吠声持续影响休息',
    suggestion: '1. 了解情况\n2. 劝导宠物主人\n3. 加强文明养宠宣传'
  },
  {
    id: 9,
    time: '2025-01-19 13:35:50',
    type: '消防隐患',
    location: 'I栋楼道',
    status: '处理中',
    snapshot: '/mock/alarm9.jpg',
    description: '楼道堆放杂物，占用消防通道',
    suggestion: '1. 清理杂物\n2. 联系业主\n3. 张贴禁止堆放提示'
  },
  {
    id: 10,
    time: '2025-01-18 16:05:22',
    type: '噪音扰民',
    location: 'J栋1单元',
    status: '已处理',
    snapshot: '/mock/alarm10.jpg',
    description: '装修噪音超出允许时段',
    suggestion: '1. 现场制止\n2. 告知装修规定\n3. 做好记录备案'
  }
])

// 摄像头数据
const cameras = ref([
  {
    id: 1,
    name: 'A1-高空抛物',
    location: 'A栋1单元西侧',
    online: true,
    type: '高空抛物',
    lastUpdate: '2025-01-22 14:35:12'
  },
  {
    id: 2,
    name: 'A2-人流检测',
    location: 'A栋1单元大堂',
    online: true,
    type: '人流检测',
    lastUpdate: '2025-01-21 14:35:10'
  },
  {
    id: 3,
    name: 'B1-车库入口',
    location: 'B栋地下车库',
    online: true,
    type: '车辆检测',
    lastUpdate: '2025-01-21 14:35:08'
  },
  {
    id: 4,
    name: 'B2-高空抛物',
    location: 'B栋2单元东侧',
    online: false,
    type: '高空抛物',
    lastUpdate: '2025-01-21 14:30:00'
  },
  {
    id: 5,
    name: 'C1-广场监控',
    location: 'C栋楼下广场',
    online: true,
    type: '人流检测',
    lastUpdate: '2025-01-20 14:35:15'
  },
  {
    id: 6,
    name: 'D1-高空抛物',
    location: 'D栋3单元北侧',
    online: true,
    type: '高空抛物',
    lastUpdate: '2025-01-20 14:35:05'
  }
])

const hasNewAlarm = ref(true)
const showOffline = ref(true)
const dialogVisible = ref(false)
const videoDialogVisible = ref(false)
const playProgress = ref(0)

const alarmForm = ref({
  method: '',
  description: '',
  handler: '张工',
  handleTime: new Date().toLocaleString(),
  followUp: false,
  priority: 'high'
})

// 视频回放数据
const videoPlayback = ref({
  startTime: '2024-03-20 14:25:00',
  endTime: '2024-03-20 14:35:00',
  duration: '00:10:00',
  currentTime: '00:00:00'
})

// 过滤摄像头列表
const filteredCameras = computed(() => {
  if (showOffline.value) {
    return cameras.value
  }
  return cameras.value.filter(camera => camera.online)
})

// 获取告警类型样式
const getAlarmType = (type) => {
  const types = {
    '高空抛物': 'danger',
    '人员闯入': 'warning',
    '异常聚集': 'info'
  }
  return types[type] || 'info'
}

// 处理告警
const handleAlarm = (alarm) => {
  alarmForm.value = {
    method: '',
    description: '',
    handler: '张工',
    handleTime: new Date().toLocaleString(),
    followUp: false,
    priority: alarm.type === '高空抛物' ? 'high' : 'medium',
    alarmId: alarm.id,
    alarmType: alarm.type,
    location: alarm.location
  }
  dialogVisible.value = true
}

// 提交告警处理
const submitAlarmHandle = () => {
  const { alarmId, handler, method, description } = alarmForm.value
  // 模拟API调用
  setTimeout(() => {
    const alarm = alarms.value.find(a => a.id === alarmId)
    if (alarm) {
      alarm.status = '已处理'
      alarm.handler = handler
      alarm.handleMethod = method
      alarm.handleDescription = description
      alarm.handleTime = new Date().toLocaleString()
    }
    ElMessage.success('告警处理成功')
    dialogVisible.value = false
  }, 500)
}

// 查看视频回放
const viewVideo = (alarm) => {
  videoDialogVisible.value = true
}

// 查看摄像头
const viewCamera = (camera) => {
  if (!camera.online) {
    ElMessage.warning(`${camera.name}当前离线，最后在线时间：${camera.lastUpdate}`)
    return
  }
  ElMessage.success(`正在查看${camera.name}，位于${camera.location}`)
}
</script>

<style scoped>
.monitoring-dashboard {
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

.alarm-detail {
  padding: 20px;
  display: flex;
  gap: 20px;
}

.alarm-image {
  width: 200px;
  height: 150px;
  border-radius: 4px;
}

.detail-info {
  flex-grow: 1;
}

.camera-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  height: 400px;
  overflow-y: auto;
}

.camera-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.camera-item:hover {
  border-color: var(--el-color-primary);
}

.camera-item.offline {
  opacity: 0.6;
}

.camera-preview {
  position: relative;
  height: 100px;
  background: #000;
}

.mock-preview {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.camera-status {
  position: absolute;
  top: 5px;
  right: 5px;
}

.camera-info {
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.camera-location {
  font-size: 12px;
  color: #666;
}

.video-player {
  background: #000;
  border-radius: 4px;
  overflow: hidden;
}

.mock-player {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
}

.player-controls {
  background: rgba(0,0,0,0.8);
  padding: 10px;
}

.control-buttons {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-display {
  color: #fff;
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