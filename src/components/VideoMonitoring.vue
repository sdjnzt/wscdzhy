<template>
  <div class="video-monitoring">
    <el-row :gutter="20">
      <!-- 左侧设备树 -->
      <el-col :span="6">
        <el-card class="device-tree">
          <template #header>
            <div class="tree-header">
              <span>监控点位</span>
              <el-input
                v-model="searchKey"
                placeholder="搜索设备"
                prefix-icon="Search"
                size="small"
              />
            </div>
          </template>
          
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="defaultProps"
            :filter-node-method="filterNode"
            node-key="id"
            highlight-current
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <div class="custom-tree-node">
                <el-icon><component :is="data.icon" /></el-icon>
                <span>{{ node.label }}</span>
                <el-tag 
                  size="small" 
                  :type="data.status === '在线' ? 'success' : 'danger'"
                  v-if="data.type === 'camera'"
                >
                  {{ data.status }}
                </el-tag>
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧视频区域 -->
      <el-col :span="18">
        <el-card class="video-wall">
          <template #header>
            <div class="wall-header">
              <div class="header-left">
                <span>视频预览</span>
                <el-radio-group v-model="layout" size="small">
                  <el-radio-button label="1">1×1</el-radio-button>
                  <el-radio-button label="4">2×2</el-radio-button>
                  <el-radio-button label="9">3×3</el-radio-button>
                </el-radio-group>
              </div>
              <div class="header-right">
                <el-button-group>
                  <el-button 
                    type="primary" 
                    :icon="VideoPlay"
                    @click="startAllVideo"
                  >
                    全部播放
                  </el-button>
                  <el-button 
                    type="danger" 
                    :icon="VideoPause"
                    @click="stopAllVideo"
                  >
                    全部停止
                  </el-button>
                </el-button-group>
              </div>
            </div>
          </template>

          <div class="video-container" :class="'layout-' + layout">
            <div 
              v-for="n in +layout" 
              :key="n" 
              class="video-item"
              @click="handleVideoClick(n - 1)"
              :class="{ active: currentVideoIndex === n - 1 }"
            >
              <div class="video-content">
                <img 
                  :src="defaultImages[n-1]"
                  class="video-image"
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
                  <span>监控画面 {{n}}</span>
                  <span>默认位置 {{n}}</span>
                </div>
                <!-- 右下角设备信息 -->
                <div class="device-info">
                  <span>设备编号: Camera_{{n.toString().padStart(2, '0')}}</span>
                  <span>分辨率: 1920×1080</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 云台控制 -->
        <el-card class="ptz-control" v-if="currentVideoIndex !== null">
          <template #header>
            <div class="control-header">
              <span>云台控制</span>
              <span class="current-camera">
                {{ videos[currentVideoIndex]?.name || '未选择摄像头' }}
              </span>
            </div>
          </template>

          <div class="control-panel">
            <div class="direction-control">
              <el-button-group class="vertical-group">
                <el-button @click="ptzControl('up')">
                  <el-icon><CaretTop /></el-icon>
                </el-button>
                <el-button @click="ptzControl('down')">
                  <el-icon><CaretBottom /></el-icon>
                </el-button>
              </el-button-group>
              <el-button-group class="horizontal-group">
                <el-button @click="ptzControl('left')">
                  <el-icon><CaretLeft /></el-icon>
                </el-button>
                <el-button @click="ptzControl('right')">
                  <el-icon><CaretRight /></el-icon>
                </el-button>
              </el-button-group>
            </div>

            <div class="zoom-control">
              <el-button-group>
                <el-button @click="ptzControl('zoomIn')">
                  <el-icon><ZoomIn /></el-icon>
                </el-button>
                <el-button @click="ptzControl('zoomOut')">
                  <el-icon><ZoomOut /></el-icon>
                </el-button>
              </el-button-group>
            </div>

            <div class="preset-control">
              <el-select v-model="currentPreset" placeholder="预置点">
                <el-option
                  v-for="item in presetPoints"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button-group>
                <el-button 
                  type="primary" 
                  @click="callPreset"
                  :disabled="!currentPreset"
                >
                  调用
                </el-button>
                <el-button 
                  type="success" 
                  @click="savePreset"
                  :disabled="!currentPreset"
                >
                  设置
                </el-button>
              </el-button-group>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { 
  VideoPlay, 
  VideoPause, 
  VideoCamera,
  Camera,
  CaretTop,
  CaretBottom,
  CaretLeft,
  CaretRight,
  ZoomIn,
  ZoomOut,
  FolderOpened,
  Monitor
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 搜索关键字
const searchKey = ref('')
const treeRef = ref(null)

// 监视搜索关键字变化
watch(searchKey, (val) => {
  treeRef.value?.filter(val)
})

// 设备树数据
const treeData = [
  {
    id: 1,
    label: 'A栋',
    icon: 'FolderOpened',
    children: [
      {
        id: 11,
        label: 'A1-高空抛物',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'A栋1单元西侧',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 12,
        label: 'A2-人流检测',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'A栋1单元大堂',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 13,
        label: 'A3-车库入口',
        type: 'camera',
        icon: 'Monitor',
        status: '离线',
        location: 'A栋地下车库入口',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264',
        lastOnline: '2024-03-20 14:30:15'
      }
    ]
  },
  {
    id: 2,
    label: 'B栋',
    icon: 'FolderOpened',
    children: [
      {
        id: 21,
        label: 'B1-高空抛物',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'B栋2单元东侧',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 22,
        label: 'B2-人流检测',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'B栋大堂',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      }
    ]
  },
  {
    id: 3,
    label: 'C栋',
    icon: 'FolderOpened',
    children: [
      {
        id: 31,
        label: 'C1-高空抛物',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'C栋3单元北侧',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 32,
        label: 'C2-广场监控',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'C栋楼下广场',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      }
    ]
  },
  {
    id: 4,
    label: '公共区域',
    icon: 'FolderOpened',
    children: [
      {
        id: 41,
        label: 'D1-小区大门',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: '小区主入口',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 42,
        label: 'D2-停车场',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: '地面停车场',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 43,
        label: 'D3-儿童乐园',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: '中心花园',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      }
    ]
  },
  {
    id: 5,
    label: 'E栋',
    icon: 'FolderOpened',
    children: [
      {
        id: 51,
        label: 'E1-高空抛物',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'E栋1单元东侧',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 52,
        label: 'E2-人流检测',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'E栋大堂',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 53,
        label: 'E3-电梯监控',
        type: 'camera',
        icon: 'Monitor',
        status: '离线',
        location: 'E栋1单元电梯',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264',
        lastOnline: '2024-03-20 16:30:15'
      }
    ]
  },
  {
    id: 6,
    label: 'F栋',
    icon: 'FolderOpened',
    children: [
      {
        id: 61,
        label: 'F1-高空抛物',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'F栋2单元西侧',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 62,
        label: 'F2-人流检测',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'F栋大堂',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 63,
        label: 'F3-楼道监控',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'F栋1单元一层',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      }
    ]
  },
  {
    id: 7,
    label: 'G栋',
    icon: 'FolderOpened',
    children: [
      {
        id: 71,
        label: 'G1-高空抛物',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'G栋3单元北侧',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 72,
        label: 'G2-人流检测',
        type: 'camera',
        icon: 'Monitor',
        status: '离线',
        location: 'G栋大堂',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264',
        lastOnline: '2024-03-20 17:45:30'
      }
    ]
  },
  {
    id: 8,
    label: 'H栋',
    icon: 'FolderOpened',
    children: [
      {
        id: 81,
        label: 'H1-高空抛物',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'H栋1单元东侧',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 82,
        label: 'H2-电梯监控',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'H栋1单元电梯',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      }
    ]
  },
  {
    id: 9,
    label: 'I栋',
    icon: 'FolderOpened',
    children: [
      {
        id: 91,
        label: 'I1-高空抛物',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'I栋2单元西侧',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      },
      {
        id: 92,
        label: 'I2-人流检测',
        type: 'camera',
        icon: 'Monitor',
        status: '在线',
        location: 'I栋大堂',
        resolution: '1920×1080',
        frameRate: '25fps',
        streamType: 'H.264'
      }
    ]
  }
]

const defaultProps = {
  children: 'children',
  label: 'label'
}

// 过滤节点方法
const filterNode = (value, data) => {
  if (!value) return true
  return data.label.includes(value)
}

// 视频墙布局
const layout = ref('4')
const currentVideoIndex = ref(null)
const videos = ref([])
const currentPreset = ref('')

// 预置点列表
const presetPoints = [
  { value: '1', label: '大门入口' },
  { value: '2', label: '垃圾投放处' },
  { value: '3', label: '消防通道' },
  { value: '4', label: '电动车充电处' },
  { value: '5', label: '快递柜' },
  { value: '6', label: '车库入口' }
]

// 修改 defaultImages 数组
const defaultImages = [
  '/wscdzhy/images/camera/222.jpg',
  '/wscdzhy/images/camera/333.jpg',
  '/wscdzhy/images/camera/444.png',
  '/wscdzhy/images/camera/555.png',
  '/wscdzhy/images/camera/555.png',
  '/wscdzhy/images/camera/888.png',
  '/wscdzhy/images/camera/777.png',
  '/wscdzhy/images/camera/888.png',
  '/wscdzhy/images/camera/888.png'

]

// 处理设备树节点点击
const handleNodeClick = (data) => {
  if (data.type === 'camera') {
    if (data.status === '离线') {
      ElMessage.warning(`${data.label}当前离线，最后在线时间：${data.lastOnline}`)
      return
    }
    
    if (currentVideoIndex.value !== null && !videos.value[currentVideoIndex.value]) {
      videos.value[currentVideoIndex.value] = {
        id: data.id,
        name: data.label,
        location: data.location,
        resolution: data.resolution,
        frameRate: data.frameRate,
        streamType: data.streamType,
        status: 'playing',
        startTime: new Date().toLocaleString(),
        recordStatus: true,
        ptzEnabled: true
      }
      ElMessage.success(`已添加到窗口 ${currentVideoIndex.value + 1}`)
    }
  }
}

// 处理视频窗口点击
const handleVideoClick = (index) => {
  currentVideoIndex.value = index
}

// 播放视频
const playVideo = (index) => {
  if (videos.value[index]) {
    videos.value[index].status = 'playing'
    ElMessage.success('开始播放')
  }
}

// 暂停视频
const pauseVideo = (index) => {
  if (videos.value[index]) {
    videos.value[index].status = 'paused'
    ElMessage.success('已暂停')
  }
}

// 截图
const snapshot = (index) => {
  if (videos.value[index]) {
    ElMessage.success('截图已保存')
  }
}

// 开始所有视频
const startAllVideo = () => {
  videos.value.forEach((video, index) => {
    if (video) {
      playVideo(index)
    }
  })
}

// 停止所有视频
const stopAllVideo = () => {
  videos.value.forEach((video, index) => {
    if (video) {
      pauseVideo(index)
    }
  })
}

// 云台控制
const ptzControl = (direction) => {
  if (currentVideoIndex.value !== null && videos.value[currentVideoIndex.value]) {
    const camera = videos.value[currentVideoIndex.value]
    ElMessage.success(`${camera.name} - 云台控制：${direction}`)
    // 模拟云台控制延迟
    setTimeout(() => {
      ElMessage.success(`${camera.name} - ${direction}操作完成`)
    }, 500)
  }
}

// 调用预置点
const callPreset = () => {
  if (currentVideoIndex.value !== null && videos.value[currentVideoIndex.value]) {
    const camera = videos.value[currentVideoIndex.value]
    const preset = presetPoints.find(p => p.value === currentPreset.value)
    ElMessage.success(`${camera.name} - 调用预置点：${preset.label}`)
  }
}

// 保存预置点
const savePreset = () => {
  if (currentVideoIndex.value !== null && videos.value[currentVideoIndex.value]) {
    const camera = videos.value[currentVideoIndex.value]
    const preset = presetPoints.find(p => p.value === currentPreset.value)
    ElMessage.success(`${camera.name} - 设置预置点：${preset.label}`)
  }
}

const handleImageError = (e) => {
  console.error('图片加载失败:', e.target.src)
  // 打印完整的图片URL
  console.log('完整URL:', new URL(e.target.src, window.location.href).href)
}

const handleImageLoad = (e) => {
  console.log('图片加载成功:', e.target.src)
}

// 测试图片是否存在
const testImageUrls = () => {
  defaultImages.forEach(url => {
    const img = new Image()
    img.onload = () => console.log('图片存在:', url)
    img.onerror = () => console.error('图片不存在:', url)
    img.src = url
  })
}

// 添加当前时间显示
const currentTime = ref('')

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

// 组件挂载时测试图片
onMounted(() => {
  testImageUrls()
  updateTime()
  setInterval(updateTime, 1000)
})
</script>

<style scoped>
.video-monitoring {
  padding: 20px;
}

.device-tree {
  height: calc(100vh - 140px);
  overflow-y: auto;
}

.tree-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.custom-tree-node .el-tag {
  margin-left: auto;
}

.video-wall {
  margin-bottom: 20px;
}

.wall-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.video-container {
  display: grid;
  gap: 10px;
  aspect-ratio: 16/9;
  background: #000;
  padding: 10px;
}

.layout-1 {
  grid-template-columns: 1fr;
}

.layout-4 {
  grid-template-columns: repeat(2, 1fr);
}

.layout-9 {
  grid-template-columns: repeat(3, 1fr);
}

.video-item {
  position: relative;
  background: #1a1a1a;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.video-item.active {
  border-color: var(--el-color-primary);
}

.video-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  gap: 10px;
}

.video-content {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}

.video-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.video-info {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  color: #fff;
  text-shadow: 0 0 2px rgba(0,0,0,0.5);
  z-index: 1;
}

.video-controls {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: none;
}

.video-item:hover .video-controls {
  display: block;
}

.ptz-control {
  height: 200px;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-camera {
  color: var(--el-color-primary);
  font-size: 14px;
}

.control-panel {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px;
}

.direction-control {
  display: flex;
  gap: 10px;
}

.vertical-group {
  display: flex;
  flex-direction: column;
}

.preset-control {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.el-button-group .el-button {
  margin-left: -1px;
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
  z-index: 1;
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
  z-index: 1;
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
  z-index: 1;
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
  z-index: 1;
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

/* 选中状态的视频窗口 */
.video-item.active {
  border: 2px solid var(--el-color-primary);
  border-radius: 4px;
}
</style> 