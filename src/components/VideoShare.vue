<template>
  <div class="video-share">
    <!-- 左侧视频列表 -->
    <div class="share-sidebar">
      <!-- 顶部操作栏 -->
      <div class="action-bar">
        <div class="action-left">
          <el-button type="primary" @click="handleUpload">
            <el-icon><Upload /></el-icon>上传视频
          </el-button>
          <el-button @click="refreshList">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>
        
        <!-- 搜索和筛选 -->
        <div class="filter-group">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索视频名称/位置"
            prefix-icon="Search"
            clearable
            class="search-input"
          />
          <el-select v-model="filterType" placeholder="视频类型" clearable>
            <el-option label="全部类型" value="" />
            <el-option v-for="type in videoTypes" 
                      :key="type" 
                      :label="type" 
                      :value="type" />
          </el-select>
          <el-select v-model="filterStatus" placeholder="共享状态" clearable>
            <el-option label="全部状态" value="" />
            <el-option label="已共享" value="已共享" />
            <el-option label="未共享" value="未共享" />
          </el-select>
        </div>
      </div>
      
      <!-- 视频列表 -->
      <div class="video-list">
        <el-scrollbar>
          <el-table 
            :data="filteredVideoList" 
            style="width: 100%"
            @row-click="handlePlay"
            highlight-current-row
            :row-class-name="tableRowClassName"
          >
            <el-table-column type="index" width="50" align="center" />
            <el-table-column prop="name" label="视频名称" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="video-name">
                  <el-icon :class="getVideoIcon(row.type)"><VideoCamera /></el-icon>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getTypeTag(row.type)" size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置" width="150" show-overflow-tooltip />
            <el-table-column prop="duration" label="时长" width="80" align="center">
              <template #default="{ row }">
                <el-icon><Timer /></el-icon>
                {{ row.duration }}
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="80" align="center">
              <template #default="{ row }">
                <el-icon><Files /></el-icon>
                {{ row.size }}
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="上传时间" width="160" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '已共享' ? 'success' : 'info'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button-group>
                  <el-tooltip content="共享" placement="top">
                    <el-button type="primary" link @click.stop="handleShare(row)">
                      <el-icon><Share /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="下载" placement="top">
                    <el-button type="success" link @click.stop="handleDownload(row)">
                      <el-icon><Download /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top">
                    <el-button type="danger" link @click.stop="handleDelete(row)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
        </el-scrollbar>
      </div>
    </div>

    <!-- 右侧视频播放区 -->
    <div class="share-content">
      <div v-if="currentVideo" class="video-player">
        <div class="player-container">
          <video
            ref="videoRef"
            controls
            :src="currentVideo.url"
          ></video>
        </div>
        <div class="video-info">
          <div class="video-header">
            <h3>{{ currentVideo.name }}</h3>
            <div class="video-stats">
              <el-tooltip content="观看次数" placement="top">
                <el-tag type="info" size="small">
                  <el-icon><View /></el-icon>
                  {{ currentVideo.views }}
                </el-tag>
              </el-tooltip>
              <el-tooltip content="下载次数" placement="top">
                <el-tag type="info" size="small">
                  <el-icon><Download /></el-icon>
                  {{ currentVideo.downloads }}
                </el-tag>
              </el-tooltip>
            </div>
          </div>
          
          <div class="video-meta">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="类型">
                <el-tag :type="getTypeTag(currentVideo.type)" size="small">
                  {{ currentVideo.type }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="位置">{{ currentVideo.location }}</el-descriptions-item>
              <el-descriptions-item label="时长">
                <el-icon><Timer /></el-icon>
                {{ currentVideo.duration }}
              </el-descriptions-item>
              <el-descriptions-item label="大小">
                <el-icon><Files /></el-icon>
                {{ currentVideo.size }}
              </el-descriptions-item>
              <el-descriptions-item label="上传时间" :span="2">
                <el-icon><Calendar /></el-icon>
                {{ currentVideo.createTime }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          
          <div class="share-actions">
            <el-input
              v-model="shareLink"
              placeholder="共享链接"
              readonly
            >
              <template #prepend>
                <el-icon><Link /></el-icon>
              </template>
              <template #append>
                <el-button @click="copyLink">复制链接</el-button>
              </template>
            </el-input>
            
            <div class="action-buttons">
              <el-button type="primary" @click="handleDownload(currentVideo)">
                <el-icon><Download /></el-icon>下载视频
              </el-button>
              <el-button 
                :type="currentVideo.status === '已共享' ? 'success' : 'warning'"
                @click="handleShare(currentVideo)"
              >
                <el-icon><Share /></el-icon>
                {{ currentVideo.status === '已共享' ? '已共享' : '共享视频' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-player">
        <el-empty description="请选择要播放的视频">
          <template #image>
            <el-icon :size="60"><VideoPlay /></el-icon>
          </template>
        </el-empty>
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传视频"
      width="500px"
    >
      <el-upload
        class="upload-video"
        drag
        action="/api/upload"
        :on-success="handleUploadSuccess"
        :before-upload="beforeUpload"
        accept="video/*"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将视频拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持mp4、mov等格式视频文件
          </div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 分享对话框 -->
    <el-dialog
      v-model="shareDialogVisible"
      title="分享视频"
      width="400px"
    >
      <div class="share-dialog-content">
        <!-- 分享链接 -->
        <el-input
          v-model="shareLink"
          placeholder="分享链接"
          readonly
        >
          <template #append>
            <el-button @click="copyLink">复制</el-button>
          </template>
        </el-input>
        
        <!-- 分享方式 -->
        <div class="share-options">
          <div
            v-for="option in shareOptions"
            :key="option.label"
            class="share-option"
            @click="option.action"
          >
            <el-icon><component :is="option.icon" /></el-icon>
            <span>{{ option.label }}</span>
          </div>
        </div>
        
        <!-- 分享设置 -->
        <div class="share-settings">
          <h4>分享设置</h4>
          <el-form :model="shareSettings" label-width="100px">
            <el-form-item label="有效期">
              <el-select v-model="shareSettings.expirationTime">
                <el-option label="1天" :value="1" />
                <el-option label="7天" :value="7" />
                <el-option label="30天" :value="30" />
                <el-option label="永久" :value="-1" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="下载权限">
              <el-switch v-model="shareSettings.allowDownload" />
            </el-form-item>
            
            <el-form-item label="访问密码">
              <el-switch v-model="shareSettings.requirePassword" />
            </el-form-item>
            
            <el-form-item label="设置密码" v-if="shareSettings.requirePassword">
              <el-input
                v-model="shareSettings.password"
                placeholder="请输入访问密码"
                show-password
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-dialog>
    
    <!-- 二维码对话框 -->
    <el-dialog
      v-model="qrCodeVisible"
      title="扫码分享"
      width="300px"
      align-center
    >
      <div class="qrcode-container">
        <img :src="qrCodeUrl" alt="分享二维码" />
        <p>使用手机扫描二维码查看视频</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Share, Upload, UploadFilled, VideoCamera, Delete, VideoPlay, Timer, Files, Calendar, Link } from '@element-plus/icons-vue'

// 生成最近半个月内的随机时间
const getRandomTime = (daysAgo) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  // 生成当天内的随机时间
  date.setHours(Math.floor(Math.random() * 24))
  date.setMinutes(Math.floor(Math.random() * 60))
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 搜索和筛选状态
const searchKeyword = ref('')
const filterType = ref('')
const filterStatus = ref('')

// 过滤后的视频列表
const filteredVideoList = computed(() => {
  return videoList.value.filter(video => {
    // 关键词搜索
    const matchKeyword = !searchKeyword.value || 
      video.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      video.location.toLowerCase().includes(searchKeyword.value.toLowerCase())
    
    // 类型筛选
    const matchType = !filterType.value || video.type === filterType.value
    
    // 状态筛选
    const matchStatus = !filterStatus.value || video.status === filterStatus.value
    
    return matchKeyword && matchType && matchStatus
  })
})

// 视频列表数据
const videoList = ref([
  {
    id: 1,
    name: 'A栋高空抛物监控记录.mp4',
    createTime: getRandomTime(0),  // 今天
    status: '已共享',
    url: '/videos/sample1.mp4',
    size: '256MB',
    duration: '15:30',
    location: 'A栋1单元西侧',
    type: '高空抛物'
  },
  {
    id: 2,
    name: '1号电梯故障记录.mp4',
    createTime: getRandomTime(2),  // 2天前
    status: '已共享',
    url: '/videos/sample2.mp4',
    size: '128MB',
    duration: '08:45',
    location: 'A栋1号电梯',
    type: '电梯监控'
  },
  {
    id: 3,
    name: '地下车库可疑人员.mp4',
    createTime: getRandomTime(4),  // 4天前
    status: '未共享',
    url: '/videos/sample3.mp4',
    size: '320MB',
    duration: '20:10',
    location: 'B区地下停车场',
    type: '安防监控'
  },
  {
    id: 4,
    name: '小区大门人流统计.mp4',
    createTime: getRandomTime(6),  // 6天前
    status: '已共享',
    url: '/videos/sample4.mp4',
    size: '512MB',
    duration: '30:00',
    location: '小区正门',
    type: '人流监控'
  },
  {
    id: 5,
    name: 'B栋快递投放监控.mp4',
    createTime: getRandomTime(8),  // 8天前
    status: '未共享',
    url: '/videos/sample5.mp4',
    size: '180MB',
    duration: '12:20',
    location: 'B栋快递柜',
    type: '快递监控'
  },
  {
    id: 6,
    name: '消防通道占用警告.mp4',
    createTime: getRandomTime(10),  // 10天前
    status: '已共享',
    url: '/videos/sample6.mp4',
    size: '96MB',
    duration: '05:45',
    location: 'C栋消防通道',
    type: '消防监控'
  },
  {
    id: 7,
    name: '儿童游乐场安全监控.mp4',
    createTime: getRandomTime(12),  // 12天前
    status: '已共享',
    url: '/videos/sample7.mp4',
    size: '256MB',
    duration: '15:30',
    location: '中心广场',
    type: '安防监控'
  },
  {
    id: 8,
    name: '垃圾分类投放记录.mp4',
    createTime: getRandomTime(14),  // 14天前
    status: '未共享',
    url: '/videos/sample8.mp4',
    size: '150MB',
    duration: '10:15',
    location: 'A区垃圾站',
    type: '环保监控'
  }
])

// 当前选中的视频
const currentVideo = ref(null)
const videoRef = ref(null)
const shareLink = ref('')

// 上传对话框
const uploadDialogVisible = ref(false)

// 播放视频
const handlePlay = (video) => {
  currentVideo.value = video
  shareLink.value = `https://your-domain.com/share/${video.id}`
}

// 共享视频
const handleShare = (video) => {
  // 更新视频状态
  video.status = '已共享'
  
  // 生成模拟的分享链接
  shareLink.value = `https://example.com/share/${video.id}?t=${Date.now()}`
  
  // 显示分享对话框
  shareDialogVisible.value = true
  
  ElMessage.success('视频已成功共享')
}

// 删除视频
const handleDelete = (video) => {
  ElMessageBox.confirm(
    '确定要删除这个视频吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    videoList.value = videoList.value.filter(item => item.id !== video.id)
    if (currentVideo.value?.id === video.id) {
      currentVideo.value = null
    }
    ElMessage.success('删除成功')
  })
}

// 复制链接
const copyLink = () => {
  // 模拟复制到剪贴板
  ElMessage.success('链接已复制到剪贴板')
  shareDialogVisible.value = false
}

// 打开上传对话框
const handleUpload = () => {
  uploadDialogVisible.value = true
}

// 上传前检查
const beforeUpload = (file) => {
  const isVideo = file.type.startsWith('video/')
  if (!isVideo) {
    ElMessage.error('只能上传视频文件！')
    return false
  }
  return true
}

// 上传成功
const handleUploadSuccess = (response, file) => {
  videoList.value.unshift({
    id: Date.now(),
    name: file.name,
    createTime: new Date().toLocaleString(),
    status: '未共享',
    url: response.url,
    size: `${Math.round(file.size / 1024 / 1024)}MB`,
    duration: '00:00',
    location: '未设置',
    type: '其他'
  })
  uploadDialogVisible.value = false
  ElMessage.success('上传成功')
}

// 获取视频图标
const getVideoIcon = (type) => {
  const icons = {
    '高空抛物': 'VideoCamera',
    '电梯监控': 'VideoCamera',
    '安防监控': 'VideoCamera',
    '人流监控': 'VideoCamera',
    '快递监控': 'VideoCamera',
    '消防监控': 'VideoCamera',
    '环保监控': 'VideoCamera',
    '其他': 'VideoCamera'
  }
  return icons[type] || 'VideoCamera'
}

// 获取视频类型标签
const getTypeTag = (type) => {
  const tags = {
    '高空抛物': 'danger',
    '电梯监控': 'info',
    '安防监控': 'success',
    '人流监控': 'warning',
    '快递监控': 'primary',
    '消防监控': 'danger',
    '环保监控': 'success',
    '其他': 'info'
  }
  return tags[type] || 'info'
}

// 刷新视频列表
const refreshList = () => {
  // 实现刷新视频列表的逻辑
}

// 下载视频
const handleDownload = (video) => {
  // 实现下载视频的逻辑
}

// 表格行类名
const tableRowClassName = ({ row }) => {
  if (row.status === '已共享') {
    return 'success-row'
  } else if (row.status === '未共享') {
    return 'warning-row'
  }
  return ''
}

// 分享对话框控制
const shareDialogVisible = ref(false)
const qrCodeVisible = ref(false)
const qrCodeUrl = ref('')

// 模拟微信分享
const shareToWeChat = () => {
  ElMessage.success('已打开微信分享')
  shareDialogVisible.value = false
}

// 模拟二维码分享
const showQRCode = () => {
  // 使用模拟的二维码图片
  qrCodeUrl.value = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + shareLink.value
  qrCodeVisible.value = true
}

// 分享选项
const shareOptions = [
  { 
    icon: 'Link', 
    label: '复制链接',
    action: copyLink
  },
  { 
    icon: 'ChatDotRound', 
    label: '微信分享',
    action: shareToWeChat
  },
  { 
    icon: 'Position', 
    label: '二维码分享',
    action: showQRCode
  }
]

// 分享设置（模拟）
const shareSettings = ref({
  expirationTime: 7,
  allowDownload: true,
  requirePassword: false,
  password: ''
})

// 监听分享设置变化
watch(shareSettings, (newSettings) => {
  if (newSettings.requirePassword) {
    ElMessage.info('已启用访问密码')
  }
  if (newSettings.expirationTime === -1) {
    ElMessage.warning('永久有效链接可能存在安全风险')
  }
})
</script>

<style scoped>
.video-share {
  display: flex;
  height: calc(100vh - 120px);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.share-sidebar {
  width: 70%;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.action-bar {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.action-left {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.filter-group {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 220px;
}

.video-list {
  flex: 1;
  overflow: hidden;
  padding: 10px;
}

.share-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f8f9fa;
}

.player-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.player-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-info {
  margin-top: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.video-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.video-stats {
  display: flex;
  gap: 10px;
}

.video-meta {
  margin: 20px 0;
}

.share-actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.empty-player {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
  border-radius: 8px;
}

.video-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-descriptions__label) {
  width: 100px;
  color: #666;
}

:deep(.el-tag) {
  display: flex;
  align-items: center;
  gap: 5px;
}

.el-icon {
  vertical-align: middle;
  margin-right: 4px;
}

/* 表格样式优化 */
:deep(.el-table) {
  --el-table-border-color: #e8e8e8;
  --el-table-header-bg-color: #f8f9fa;
  --el-table-row-hover-bg-color: #f0f7ff;
}

:deep(.el-table__row) {
  cursor: pointer;
  transition: all 0.3s ease;
}

:deep(.el-table__row:hover) {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

:deep(.el-table__row.warning-row) {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

:deep(.el-table__row.success-row) {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
}

/* 滚动条样式优化 */
:deep(.el-scrollbar__bar) {
  opacity: 0.3;
}

:deep(.el-scrollbar__bar:hover) {
  opacity: 0.8;
}

.share-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.share-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin: 20px 0;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: #f8f9fa;
}

.share-option:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
}

.share-option .el-icon {
  font-size: 24px;
  color: #409eff;
}

.share-settings {
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.share-settings h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 20px;
}

.qrcode-container img {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.qrcode-container p {
  color: #666;
  font-size: 14px;
}

/* 添加一些动画效果 */
.el-dialog__body {
  transition: all 0.3s ease;
}

.share-option {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 