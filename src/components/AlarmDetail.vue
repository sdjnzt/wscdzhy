<template>
  <div class="alarm-detail">
    <el-card>
      <template #header>
        <div class="header">
          <h3>告警详情</h3>
          <el-button-group>
            <el-button type="primary" @click="handleProcess">处理告警</el-button>
            <el-button @click="handleExport">导出记录</el-button>
          </el-button-group>
        </div>
      </template>

      <el-table :data="alarmList" style="width: 100%">
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="location" label="位置" width="180" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.type)">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已处理' ? 'success' : 'danger'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handleProcess(scope.row)"
              :disabled="scope.row.status === '已处理'">
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 告警处理对话框 -->
    <el-dialog
      v-model="processDialogVisible"
      title="告警处理"
      width="500px">
      <el-form :model="processForm" label-width="100px">
        <el-form-item label="处理方式">
          <el-select v-model="processForm.method" placeholder="请选择处理方式">
            <el-option label="现场处理" value="onsite" />
            <el-option label="远程处理" value="remote" />
            <el-option label="转交相关部门" value="transfer" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input
            v-model="processForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入处理说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="processDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProcess">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 视频回放对话框 -->
    <el-dialog
      v-model="videoDialogVisible"
      title="告警视频回放"
      width="800px">
      <div class="video-player">
        <div class="video-container">
          <div class="video-placeholder">
            视频回放区域
            <div class="video-controls">
              <el-button-group>
                <el-button :icon="VideoPlay">播放</el-button>
                <el-button :icon="VideoPause">暂停</el-button>
              </el-button-group>
              <el-slider v-model="videoProgress" :max="100" />
            </div>
          </div>
        </div>
        <div class="video-info">
          <p>时间：{{ currentAlarm?.time }}</p>
          <p>位置：{{ currentAlarm?.location }}</p>
          <p>类型：{{ currentAlarm?.type }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'
import { monitoringData } from '../mock/data'

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)
const processDialogVisible = ref(false)
const videoDialogVisible = ref(false)
const videoProgress = ref(0)
const currentAlarm = ref(null)

const processForm = ref({
  method: '',
  description: ''
})

const alarmList = ref([...monitoringData.throwingEvents, ...monitoringData.elevatorEvents])

const getTagType = (type) => {
  const types = {
    '高空抛物': 'danger',
    '电瓶车违规': 'warning'
  }
  return types[type] || 'info'
}

const handleView = (row) => {
  currentAlarm.value = row
  videoDialogVisible.value = true
}

const handleProcess = (row) => {
  currentAlarm.value = row
  processDialogVisible.value = true
}

const handleExport = () => {
  ElMessage.success('导出成功')
}

const submitProcess = () => {
  if (!processForm.value.method || !processForm.value.description) {
    ElMessage.warning('请填写完整处理信息')
    return
  }
  
  ElMessage.success('处理成功')
  processDialogVisible.value = false
  processForm.value = { method: '', description: '' }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  // 这里应该重新请求数据
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  // 这里应该重新请求数据
}
</script>

<style scoped>
.alarm-detail {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.video-container {
  width: 100%;
  background: #000;
  position: relative;
}

.video-placeholder {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  position: relative;
}

.video-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.video-controls .el-slider {
  flex-grow: 1;
  margin-left: 20px;
}

.video-info {
  margin-top: 20px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style> 