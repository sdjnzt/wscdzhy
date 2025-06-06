<template>
  <div class="video-monitoring">
    <el-row :gutter="20">
      <!-- 左侧视频列表 -->
      <el-col :span="6">
        <el-card class="video-list">
          <template #header>
            <div class="card-header">
              <span>监控点位</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索摄像头"
                prefix-icon="Search"
                clearable
                @clear="handleSearch"
                @input="handleSearch"
              />
            </div>
          </template>
          <el-scrollbar height="calc(100vh - 200px)">
            <el-tree
              :data="cameraGroups"
              :props="defaultProps"
              @node-click="handleNodeClick"
              highlight-current
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <span v-if="data.type === 'camera'" class="camera-status">
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

      <!-- 右侧视频显示区域 -->
      <el-col :span="18">
        <el-card class="video-display">
          <template #header>
            <div class="card-header">
              <span>{{ currentCamera ? currentCamera.name : '请选择摄像头' }}</span>
              <div class="header-actions">
                <el-button-group>
                  <el-button type="primary" :icon="VideoPlay" @click="handlePlay">播放</el-button>
                  <el-button type="primary" :icon="VideoPause" @click="handlePause">暂停</el-button>
                  <el-button type="primary" :icon="VideoCamera" @click="handleSnapshot">截图</el-button>
                </el-button-group>
                <el-button-group class="ml-2">
                  <el-button type="success" :icon="VideoPlay" @click="showPlayback = true">回放</el-button>
                  <el-button type="warning" :icon="Setting" @click="showSettings = true">设置</el-button>
                </el-button-group>
              </div>
            </div>
          </template>
          
          <!-- 视频显示区域 -->
          <div class="video-container">
            <div v-if="currentCamera" class="video-player">
              <div class="video-placeholder">
                <el-icon :size="48"><VideoCamera /></el-icon>
                <p>摄像头 {{ currentCamera.name }} 实时画面</p>
              </div>
            </div>
            <div v-else class="video-placeholder">
              <el-icon :size="48"><VideoCamera /></el-icon>
              <p>请选择要查看的摄像头</p>
            </div>
          </div>

          <!-- 视频控制面板 -->
          <div class="video-controls" v-if="currentCamera">
            <el-slider v-model="volume" :max="100" :min="0" />
            <div class="control-buttons">
              <el-button-group>
                <el-button :icon="Mute" @click="handleMute">静音</el-button>
                <el-button :icon="FullScreen" @click="handleFullScreen">全屏</el-button>
              </el-button-group>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 录像回放对话框 -->
    <el-dialog
      v-model="showPlayback"
      title="录像回放"
      width="80%"
      destroy-on-close
    >
      <div class="playback-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-calendar v-model="playbackDate" />
          </el-col>
          <el-col :span="18">
            <div class="playback-timeline">
              <el-timeline>
                <el-timeline-item
                  v-for="(record, index) in playbackRecords"
                  :key="index"
                  :timestamp="record.time"
                  :type="record.type"
                >
                  {{ record.content }}
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-dialog>

    <!-- 摄像头设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="摄像头设置"
      width="50%"
      destroy-on-close
    >
      <el-form :model="cameraSettings" label-width="100px">
        <el-form-item label="摄像头名称">
          <el-input v-model="cameraSettings.name" />
        </el-form-item>
        <el-form-item label="分辨率">
          <el-select v-model="cameraSettings.resolution">
            <el-option label="1080P" value="1080p" />
            <el-option label="720P" value="720p" />
            <el-option label="480P" value="480p" />
          </el-select>
        </el-form-item>
        <el-form-item label="帧率">
          <el-select v-model="cameraSettings.fps">
            <el-option label="30fps" value="30" />
            <el-option label="25fps" value="25" />
            <el-option label="20fps" value="20" />
          </el-select>
        </el-form-item>
        <el-form-item label="码率">
          <el-select v-model="cameraSettings.bitrate">
            <el-option label="4Mbps" value="4" />
            <el-option label="2Mbps" value="2" />
            <el-option label="1Mbps" value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  VideoPlay,
  VideoPause,
  VideoCamera,
  Setting,
  Mute,
  FullScreen,
  Search
} from '@element-plus/icons-vue'

// 搜索关键词
const searchKeyword = ref('')

// 摄像头分组数据
const cameraGroups = ref([
  {
    label: 'A区监控',
    children: [
      {
        label: 'A区大门',
        type: 'camera',
        status: 'online',
        id: 'A001',
        name: 'A区大门摄像头'
      },
      {
        label: 'A区停车场',
        type: 'camera',
        status: 'online',
        id: 'A002',
        name: 'A区停车场摄像头'
      }
    ]
  },
  {
    label: 'B区监控',
    children: [
      {
        label: 'B区大门',
        type: 'camera',
        status: 'offline',
        id: 'B001',
        name: 'B区大门摄像头'
      },
      {
        label: 'B区走廊',
        type: 'camera',
        status: 'online',
        id: 'B002',
        name: 'B区走廊摄像头'
      }
    ]
  },
  {
    label: 'C区监控',
    children: [
      {
        label: 'C区大厅',
        type: 'camera',
        status: 'online',
        id: 'C001',
        name: 'C区大厅摄像头'
      },
      {
        label: 'C区电梯',
        type: 'camera',
        status: 'online',
        id: 'C002',
        name: 'C区电梯摄像头'
      }
    ]
  }
])

// 树形配置
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 当前选中的摄像头
const currentCamera = ref(null)

// 音量控制
const volume = ref(50)

// 对话框控制
const showPlayback = ref(false)
const showSettings = ref(false)

// 回放日期
const playbackDate = ref(new Date())

// 回放记录
const playbackRecords = ref([
  {
    time: '2024-03-20 10:00:00',
    content: '正常监控画面',
    type: 'success'
  },
  {
    time: '2024-03-20 10:15:00',
    content: '检测到人员移动',
    type: 'warning'
  },
  {
    time: '2024-03-20 10:30:00',
    content: '检测到异常行为',
    type: 'danger'
  }
])

// 摄像头设置
const cameraSettings = ref({
  name: '',
  resolution: '1080p',
  fps: '30',
  bitrate: '4'
})

// 处理节点点击
const handleNodeClick = (data) => {
  if (data.type === 'camera') {
    currentCamera.value = data
    cameraSettings.value.name = data.name
  }
}

// 处理搜索
const handleSearch = () => {
  // 实现搜索逻辑
  console.log('搜索关键词:', searchKeyword.value)
}

// 视频控制方法
const handlePlay = () => {
  console.log('播放视频')
}

const handlePause = () => {
  console.log('暂停视频')
}

const handleSnapshot = () => {
  console.log('截图')
}

const handleMute = () => {
  console.log('静音')
}

const handleFullScreen = () => {
  console.log('全屏')
}

// 保存设置
const saveSettings = () => {
  console.log('保存设置:', cameraSettings.value)
  showSettings.value = false
}
</script>

<style scoped>
.video-monitoring {
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

.ml-2 {
  margin-left: 10px;
}

.video-list {
  height: calc(100vh - 100px);
}

.video-display {
  height: calc(100vh - 100px);
}

.video-container {
  height: calc(100vh - 250px);
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.video-player {
  width: 100%;
  height: 100%;
}

.video-placeholder {
  color: #909399;
  text-align: center;
}

.video-placeholder .el-icon {
  margin-bottom: 10px;
}

.video-controls {
  padding: 10px 0;
}

.control-buttons {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.playback-container {
  min-height: 400px;
}

.playback-timeline {
  height: 400px;
  overflow-y: auto;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.camera-status {
  margin-left: 10px;
}
</style> 