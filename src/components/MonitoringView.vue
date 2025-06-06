<template>
  <div class="monitoring-container">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="monitor-card">
          <template #header>
            <div class="card-header">
              <span>实时监控</span>
              <el-tag type="success">在线</el-tag>
            </div>
          </template>
          <div class="video-grid">
            <div v-for="n in 4" :key="n" class="video-item">
              <div class="video-placeholder">
                摄像头 {{n}}
                <div class="status-dot"></div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="alarm-card">
          <template #header>
            <div class="card-header">
              <span>实时告警</span>
              <el-button type="primary" size="small">查看全部</el-button>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="event in monitoringData.throwingEvents"
              :key="event.id"
              :type="event.status === '未处理' ? 'danger' : 'success'"
              :timestamp="event.time">
              {{event.type}} - {{event.location}}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { monitoringData } from '../mock/data'
</script>

<style scoped>
.monitoring-container {
  padding: 20px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.video-placeholder {
  background: #1a1a1a;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  position: relative;
}

/* ... 更多样式 ... */
</style> 