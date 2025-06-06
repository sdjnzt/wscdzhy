<template>
  <div class="video-dispatch">
    <!-- 左侧监控点列表 -->
    <div class="camera-list">
      <!-- 系统状态卡片 -->
      <div class="status-card">
        <div class="status-header">
          <h4>系统状态</h4>
          <span class="update-time">更新时间: {{ systemStatus.lastUpdate }}</span>
        </div>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">在线摄像头</span>
            <span class="value success">{{ systemStatus.onlineCameras }}/{{ systemStatus.totalCameras }}</span>
          </div>
          <div class="status-item">
            <span class="label">存储使用率</span>
            <span class="value warning">{{ systemStatus.storageUsage }}</span>
          </div>
          <div class="status-item">
            <span class="label">网络状态</span>
            <span class="value">{{ systemStatus.networkStatus }}</span>
          </div>
          <div class="status-item">
            <span class="label">系统状态</span>
            <span class="value">{{ systemStatus.systemStatus }}</span>
          </div>
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索监控点位"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-select v-model="filterArea" placeholder="区域" style="width: 80px">
              <el-option label="全部" value="" />
              <el-option label="A栋" value="A" />
              <el-option label="B栋" value="B" />
              <el-option label="地库" value="P" />
              <el-option label="公共" value="C" />
            </el-select>
          </template>
        </el-input>
      </div>

      <!-- 监控点树形列表 -->
      <div class="camera-tree">
        <el-scrollbar>
          <el-tree
            :data="cameraList"
            :props="defaultProps"
            node-key="id"
            :default-expanded-keys="['1', '2', '3']"
            @node-click="handleCameraSelect"
          >
            <template #default="{ node, data }">
              <div class="camera-node">
                <el-icon v-if="data.type === 'area'"><FolderOpened /></el-icon>
                <el-icon v-else><VideoCamera /></el-icon>
                <span>{{ node.label }}</span>
                <el-tag 
                  v-if="data.type === 'camera'" 
                  :type="data.status === 'online' ? 'success' : data.status === 'connecting' ? 'warning' : 'danger'"
                  size="small"
                >
                  {{ data.status === 'online' ? '在线' : data.status === 'connecting' ? '连接中' : '离线' }}
                </el-tag>
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>
    </div>

    <!-- 右侧视频区域 -->
    <div class="video-area">
      <!-- 操作按钮组 -->
      <div class="operation-btns">
        <el-button-group>
          <el-button 
            type="primary" 
            :disabled="!selectedCamera || selectedCamera.status !== 'online'"
            @click="handleRecord"
          >
            <el-icon><VideoCameraFilled /></el-icon>录制
          </el-button>
          <el-button 
            type="primary"
            :disabled="!selectedCamera || selectedCamera.status !== 'online'"
            @click="handleSnapshot"
          >
            <el-icon><Camera /></el-icon>抓拍
          </el-button>
          <el-button 
            type="primary"
            :disabled="!selectedCamera || selectedCamera.status !== 'online'"
            @click="handlePlayback"
          >
            <el-icon><VideoPlay /></el-icon>回放
          </el-button>
        </el-button-group>
      </div>

      <!-- 视频画面 -->
      <div class="video-container">
        <div class="video-box">
          <div class="video-player">
            <img 
              :src="currentImage"
              class="camera-image"
              alt="监控画面"
            />
            <!-- 左上角摄像头信息 -->
            <div class="camera-status">
              <div class="status-dot"></div>
              <span>实时监控</span>
            </div>
            <!-- 右上角时间戳 -->
            <div class="timestamp">
              {{ currentTime }}
            </div>
            <!-- 左下角位置信息 -->
            <div class="location-info">
              <span>{{ selectedCamera ? selectedCamera.label : '默认监控点' }}</span>
              <span>{{ selectedCamera ? selectedCamera.location : '默认位置' }}</span>
            </div>
            <!-- 右下角设备信息 -->
            <div class="device-info">
              <span>设备编号: {{ selectedCamera ? selectedCamera.id : 'Camera_01' }}</span>
              <span>分辨率: 1920×1080</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 云台控制 -->
      <div class="ptz-control" v-if="selectedCamera?.status === 'online'">
        <div class="ptz-speed">
          云台速度：<el-slider v-model="ptzSpeed" :min="1" :max="10" style="width: 200px" />
        </div>
        <div class="ptz-buttons">
          <el-button-group>
            <el-button @click="handlePTZ('up')">
              <el-icon><CaretTop /></el-icon>
            </el-button>
          </el-button-group>
          <el-button-group>
            <el-button @click="handlePTZ('left')">
              <el-icon><CaretLeft /></el-icon>
            </el-button>
            <el-button @click="handlePTZ('auto')">
              <el-icon><Aim /></el-icon>
            </el-button>
            <el-button @click="handlePTZ('right')">
              <el-icon><CaretRight /></el-icon>
            </el-button>
          </el-button-group>
          <el-button-group>
            <el-button @click="handlePTZ('down')">
              <el-icon><CaretBottom /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  Search,
  FolderOpened,
  VideoCamera,
  VideoCameraFilled,
  Camera,
  VideoPlay,
  CaretTop,
  CaretBottom,
  CaretLeft,
  CaretRight,
  Aim,
  Loading
} from '@element-plus/icons-vue'
import { getCameraData, getSystemStatus } from './camera-data'
import { ElMessage } from 'element-plus'

// 状态数据
const cameraList = ref([])
const systemStatus = ref({})
const searchKeyword = ref('')
const filterArea = ref('')
const selectedCamera = ref(null)
const ptzSpeed = ref(5)

// 添加连接状态控制
const isConnecting = ref(false)

// 添加默认监控画面数组
const defaultImages = [
  '/smart-community/images/camera/222.jpg',
  '/smart-community/images/camera/333.jpg',
  '/smart-community/images/camera/444.png',
  '/smart-community/images/camera/555.png',
  '/smart-community/images/camera/777.png',
  '/smart-community/images/camera/888.png'
]

// 默认显示第一张图片
const currentImage = ref(defaultImages[0])

// 添加当前时间显示
const currentTime = ref('')

// 初始化数据
onMounted(() => {
  // 加载摄像头数据
  cameraList.value = getCameraData()
  // 加载系统状态
  systemStatus.value = getSystemStatus()
  updateTime()
  setInterval(updateTime, 1000)
})

// 树形控件配置
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 选择摄像头
const handleCameraSelect = (data) => {
  if (data.type === 'camera') {
    selectedCamera.value = data
    // 根据摄像头ID选择不同的图片
    const index = parseInt(data.id) % defaultImages.length
    currentImage.value = defaultImages[index]
    if (data.status === 'online') {
      // 选中在线摄像头时，显示连接中状态
      isConnecting.value = true
      ElMessage({
        message: `正在连接: ${data.label}`,
        type: 'info'
      })
      
      // 模拟连接过程，3秒后连接成功
      setTimeout(() => {
        isConnecting.value = false
        ElMessage({
          message: `连接成功: ${data.label}`,
          type: 'success'
        })
      }, 5000)
    }
  }
}

// 处理录制
const handleRecord = () => {
  ElMessage.success('开始录制')
}

// 处理抓拍
const handleSnapshot = () => {
  ElMessage.success('抓拍成功')
}

// 处理回放
const handlePlayback = () => {
  ElMessage.success('正在打开回放')
}

// 处理云台控制
const handlePTZ = (direction) => {
  if (!selectedCamera.value || selectedCamera.value.status !== 'online') return
  ElMessage({
    message: `云台控制: ${direction}, 速度: ${ptzSpeed.value}`,
    type: 'success'
  })
}

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
</script>

<style scoped>
.video-dispatch {
  display: flex;
  height: 100%;
  gap: 20px;
  padding: 20px;
  background: #f0f2f5;
}

.camera-list {
  width: 300px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.status-card {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.status-header h4 {
  margin: 0;
  font-size: 14px;
}

.update-time {
  font-size: 12px;
  color: #999;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.status-item .label {
  font-size: 12px;
  color: #666;
}

.status-item .value {
  font-size: 14px;
  font-weight: bold;
}

.status-item .value.success {
  color: #67c23a;
}

.status-item .value.warning {
  color: #e6a23c;
}

.search-box {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.camera-tree {
  flex: 1;
  overflow: hidden;
}

.camera-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.video-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.operation-btns {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  display: flex;
  justify-content: flex-start;
}

.video-container {
  flex: 1;
  background: #1e1e1e;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.video-box {
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.video-player {
  width: 100%;
  height: 100%;
  position: relative;
}

.camera-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

/* 摄像头状态样式 */
.camera-status {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #67c23a;
  border-radius: 50%;
  box-shadow: 0 0 8px #67c23a;
  animation: pulse 2s infinite;
}

/* 时间戳样式 */
.timestamp {
  position: absolute;
  top: 16px;
  right: 16px;
  color: #fff;
  font-family: monospace;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

/* 位置信息样式 */
.location-info {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #fff;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

/* 设备信息样式 */
.device-info {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  color: #fff;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

/* 添加闪烁动画 */
@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.ptz-control {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.ptz-speed {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.ptz-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.ptz-buttons .el-button {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.operation-btns .el-button {
  padding: 8px 15px;
}

.operation-btns .el-icon {
  margin-right: 5px;
}

/* 添加连接中状态的样式 */
.connecting {
  color: #e6a23c;
}

.connecting .el-icon {
  font-size: 48px;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.camera-info {
  margin-top: 10px;
  text-align: center;
  color: #909399;
}
</style> 