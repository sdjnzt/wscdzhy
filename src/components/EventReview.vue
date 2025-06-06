<template>
  <div class="event-review">
    <!-- 左侧事件列表 -->
    <div class="event-sidebar">
      <!-- 顶部筛选 -->
      <div class="filter-bar">
        <div class="filter-group">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
            @change="handleDateChange"
          />
          <el-select v-model="filterType" placeholder="事件类型" clearable>
            <el-option label="全部类型" value="" />
            <el-option v-for="type in eventTypes" 
                      :key="type.value" 
                      :label="type.label" 
                      :value="type.value">
              <el-icon :class="type.icon"><component :is="type.icon" /></el-icon>
              <span>{{ type.label }}</span>
            </el-option>
          </el-select>
          <el-select v-model="filterLevel" placeholder="事件等级" clearable>
            <el-option label="全部等级" value="" />
            <el-option v-for="level in eventLevels"
                      :key="level.value"
                      :label="level.label"
                      :value="level.value">
              <el-tag :type="level.type" size="small">{{ level.label }}</el-tag>
            </el-option>
          </el-select>
        </div>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索事件描述/位置"
          prefix-icon="Search"
          clearable
          class="search-input"
        />
      </div>

      <!-- 事件列表 -->
      <div class="event-list">
        <el-scrollbar>
          <el-timeline>
            <el-timeline-item
              v-for="event in filteredEvents"
              :key="event.id"
              :type="event.level.type"
              :timestamp="event.time"
              :hollow="currentEvent?.id !== event.id"
              @click="handleEventSelect(event)"
            >
              <div class="event-item" :class="{ active: currentEvent?.id === event.id }">
                <div class="event-header">
                  <el-tag :type="event.level.type" size="small">{{ event.level.label }}</el-tag>
                  <span class="event-type">
                    <el-icon :class="event.type.icon"><component :is="event.type.icon" /></el-icon>
                    {{ event.type.label }}
                  </span>
                </div>
                <div class="event-content">
                  <h4>{{ event.title }}</h4>
                  <p>{{ event.description }}</p>
                  <div class="event-meta">
                    <span>
                      <el-icon><Location /></el-icon>
                      {{ event.location }}
                    </span>
                    <span>
                      <el-icon><Timer /></el-icon>
                      {{ event.duration }}
                    </span>
                  </div>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-scrollbar>
      </div>
    </div>

    <!-- 右侧详情 -->
    <div class="event-content">
      <template v-if="currentEvent">
        <div class="event-detail">
          <div class="detail-header">
            <h2>{{ currentEvent.title }}</h2>
            <div class="detail-tags">
              <el-tag :type="currentEvent.level.type" size="large">
                {{ currentEvent.level.label }}
              </el-tag>
              <el-tag type="info" size="large">
                <el-icon><component :is="currentEvent.type.icon" /></el-icon>
                {{ currentEvent.type.label }}
              </el-tag>
            </div>
          </div>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="发生时间">{{ currentEvent.time }}</el-descriptions-item>
            <el-descriptions-item label="持续时间">{{ currentEvent.duration }}</el-descriptions-item>
            <el-descriptions-item label="发生位置">{{ currentEvent.location }}</el-descriptions-item>
            <el-descriptions-item label="处理状态">
              <el-tag :type="currentEvent.status.type">{{ currentEvent.status.label }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="detail-section">
            <h3>事件描述</h3>
            <p>{{ currentEvent.description }}</p>
          </div>

          <div class="detail-section">
            <h3>相关视频</h3>
            <div class="video-player">
              <video
                ref="videoRef"
                controls
                :src="currentEvent.videoUrl"
              ></video>
            </div>
          </div>

          <div class="detail-section">
            <h3>处理记录</h3>
            <el-timeline>
              <el-timeline-item
                v-for="record in currentEvent.records"
                :key="record.id"
                :timestamp="record.time"
                :type="record.type"
              >
                <h4>{{ record.title }}</h4>
                <p>{{ record.content }}</p>
                <p class="record-operator">操作人：{{ record.operator }}</p>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </template>
      <div v-else class="empty-content">
        <el-empty description="请选择要查看的事件">
          <template #image>
            <el-icon :size="60"><Document /></el-icon>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { eventTypes, eventLevels, generateEvents } from '../views/events/data.js'

// 筛选状态
const dateRange = ref([])
const filterType = ref('')
const filterLevel = ref('')
const searchKeyword = ref('')
const currentEvent = ref(null)

// 生成事件数据
const events = ref(generateEvents())

// 过滤后的事件列表
const filteredEvents = computed(() => {
  return events.value.filter(event => {
    // 关键词搜索
    const matchKeyword = !searchKeyword.value || 
      event.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      event.location.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      event.description.toLowerCase().includes(searchKeyword.value.toLowerCase())
    
    // 类型筛选
    const matchType = !filterType.value || event.type.value === filterType.value
    
    // 等级筛选
    const matchLevel = !filterLevel.value || event.level.value === filterLevel.value
    
    // 日期筛选
    const matchDate = !dateRange.value || !dateRange.value.length || 
      (new Date(event.time) >= dateRange.value[0] && 
       new Date(event.time) <= dateRange.value[1])
    
    return matchKeyword && matchType && matchLevel && matchDate
  }).sort((a, b) => new Date(b.time) - new Date(a.time)) // 按时间降序排序
})

// 处理事件选择
const handleEventSelect = (event) => {
  currentEvent.value = event
}

// 处理日期变化
const handleDateChange = (dates) => {
  if (dates) {
    ElMessage.success('日期范围已更新')
  }
}

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近半月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 15)
      return [start, end]
    },
  },
  {
    text: '最近一月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
]
</script>

<style scoped>
.event-review {
  display: flex;
  height: calc(100vh - 120px);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.event-sidebar {
  width: 40%;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.filter-bar {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.filter-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
}

.event-list {
  flex: 1;
  overflow: hidden;
  padding: 20px;
}

.event-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.event-item {
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s;
}

.event-item:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
}

.event-item.active {
  background: #ecf5ff;
  border: 1px solid #409eff;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.event-type {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}

.event-content h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.event-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.event-meta {
  margin-top: 10px;
  display: flex;
  gap: 15px;
  color: #999;
  font-size: 12px;
}

.event-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.detail-header h2 {
  margin: 0;
  color: #333;
}

.detail-tags {
  display: flex;
  gap: 10px;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.video-player {
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.record-operator {
  margin-top: 5px;
  color: #999;
  font-size: 12px;
}

.empty-content {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.el-timeline-item__node) {
  cursor: pointer;
}

:deep(.el-timeline-item:hover) {
  .el-timeline-item__node {
    transform: scale(1.2);
  }
}

:deep(.el-tag) {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style> 