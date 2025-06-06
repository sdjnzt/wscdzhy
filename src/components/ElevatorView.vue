<template>
  <div class="elevator-container">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="elevator-monitor-card">
          <template #header>
            <div class="card-header">
              <span>电梯监控</span>
              <el-tag type="success">运行正常</el-tag>
            </div>
          </template>
          <div class="elevator-status">
            <el-row :gutter="20">
              <el-col :span="6" v-for="n in 4" :key="n">
                <el-card class="elevator-card">
                  <h3>{{n}}号电梯</h3>
                  <div class="status-info">
                    <p>当前楼层：{{ Math.floor(Math.random() * 20 + 1) }}</p>
                    <p>运行状态：正常</p>
                    <p>载重：{{ Math.floor(Math.random() * 400 + 100) }}kg</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="alarm-card">
          <template #header>
            <div class="card-header">
              <span>电梯告警记录</span>
              <el-button type="primary" size="small">查看全部</el-button>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="event in monitoringData.elevatorEvents"
              :key="event.id"
              :type="event.status === '未处理' ? 'danger' : 'success'"
              :timestamp="event.time">
              {{event.type}} - {{event.location}}
              <p class="event-detail">{{event.detail}}</p>
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
.elevator-container {
  padding: 20px;
}

.elevator-status {
  margin-top: 20px;
}

.elevator-card {
  margin-bottom: 20px;
}

.status-info {
  margin-top: 10px;
  line-height: 1.8;
}

.event-detail {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 