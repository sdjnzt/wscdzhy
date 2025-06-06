<template>
  <div class="video-network">
    <!-- 左侧区域 -->
    <div class="left-panel">
      <!-- 系统状态 -->
      <el-card class="status-card">
        <template #header>
          <div class="card-header">
            <span>系统状态</span>
            <span class="update-time">更新时间: {{ systemStatus.lastUpdate }}</span>
          </div>
        </template>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">接入平台</span>
            <span class="value">{{ systemStatus.platforms }}/{{ systemStatus.totalPlatforms }}</span>
          </div>
          <div class="status-item">
            <span class="label">在线设备</span>
            <span class="value success">{{ systemStatus.onlineDevices }}</span>
          </div>
          <div class="status-item">
            <span class="label">网络状态</span>
            <span class="value">{{ systemStatus.networkStatus }}</span>
          </div>
          <div class="status-item">
            <span class="label">带宽使用</span>
            <span class="value">{{ systemStatus.bandwidth }}</span>
          </div>
        </div>
      </el-card>

      <!-- 平台列表 -->
      <el-card class="platform-list">
        <template #header>
          <div class="card-header">
            <span>接入平台</span>
            <el-button type="primary" size="small" @click="handleAddPlatform">
              <el-icon><Plus /></el-icon>添加平台
            </el-button>
          </div>
        </template>
        
        <el-table :data="platformList" style="width: 100%">
          <el-table-column prop="name" label="平台名称" />
          <el-table-column prop="type" label="平台类型" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="scope.row.status === '在线' ? 'success' : 'danger'">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button-group>
                <el-button type="primary" size="small" @click="handleEdit(scope.row)">
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="handleDelete(scope.row)">
                  删除
                </el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 右侧区域 -->
    <div class="right-panel">
      <el-card class="network-topology">
        <template #header>
          <div class="card-header">
            <span>网络拓扑</span>
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="list">列表</el-radio-button>
              <el-radio-button label="topology">拓扑图</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        
        <!-- 这里可以放置网络拓扑图或列表视图 -->
        <div class="topology-content">
          <!-- 示例内容 -->
          <el-empty v-if="viewMode === 'topology'" description="拓扑图开发中..." />
          <el-table 
            v-else 
            :data="deviceList"
            style="width: 100%"
          >
            <el-table-column prop="name" label="设备名称" />
            <el-table-column prop="ip" label="IP地址" />
            <el-table-column prop="platform" label="所属平台" />
            <el-table-column prop="status" label="状态">
              <template #default="scope">
                <el-tag :type="scope.row.status === '在线' ? 'success' : 'danger'">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>

    <!-- 添加平台对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑平台' : '添加平台'"
      width="500px"
    >
      <el-form
        ref="platformFormRef"
        :model="platformForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="平台名称" prop="name">
          <el-input v-model="platformForm.name" placeholder="请输入平台名称" />
        </el-form-item>
        <el-form-item label="平台类型" prop="type">
          <el-select v-model="platformForm.type" placeholder="请选择平台类型" style="width: 100%">
            <el-option label="GB/T28181" value="GB/T28181" />
            <el-option label="ONVIF" value="ONVIF" />
            <el-option label="SDK" value="SDK" />
          </el-select>
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="platformForm.ip" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input v-model="platformForm.port" placeholder="请输入端口号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="删除确认"
      width="400px"
    >
      <p>确定要删除平台 "{{ platformToDelete?.name }}" 吗？</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSystemStatus, getPlatformList, getDeviceList } from './network-data'

// 状态数据
const systemStatus = ref({})
const platformList = ref([])
const deviceList = ref([])

// 表单相关
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const platformFormRef = ref(null)
const isEdit = ref(false)
const platformToDelete = ref(null)

const platformForm = reactive({
  name: '',
  type: '',
  ip: '',
  port: '',
  status: '在线'
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入平台名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择平台类型', trigger: 'change' }
  ],
  ip: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: 'IP地址格式不正确', trigger: 'blur' }
  ],
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { pattern: /^\d+$/, message: '端口号必须为数字', trigger: 'blur' },
    { min: 1, max: 65535, message: '端口号范围为1-65535', trigger: 'blur' }
  ]
}

// 初始化数据
onMounted(() => {
  systemStatus.value = getSystemStatus()
  platformList.value = getPlatformList()
  deviceList.value = getDeviceList()
})

// 视图模式
const viewMode = ref('list')

// 处理添加平台
const handleAddPlatform = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 处理编辑平台
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(platformForm, row)
  dialogVisible.value = true
}

// 处理删除平台
const handleDelete = (row) => {
  platformToDelete.value = row
  deleteDialogVisible.value = true
}

// 确认删除
const confirmDelete = () => {
  if (platformToDelete.value) {
    const index = platformList.value.findIndex(item => item.name === platformToDelete.value.name)
    if (index !== -1) {
      platformList.value.splice(index, 1)
      ElMessage.success('删除成功')
      // 更新系统状态
      systemStatus.value.platforms = platformList.value.filter(p => p.status === '在线').length
    }
  }
  deleteDialogVisible.value = false
  platformToDelete.value = null
}

// 重置表单
const resetForm = () => {
  if (platformFormRef.value) {
    platformFormRef.value.resetFields()
  }
  Object.assign(platformForm, {
    name: '',
    type: '',
    ip: '',
    port: '',
    status: '在线'
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!platformFormRef.value) return
  
  await platformFormRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        // 编辑现有平台
        const index = platformList.value.findIndex(item => item.name === platformForm.name)
        if (index !== -1) {
          platformList.value[index] = { ...platformForm }
          ElMessage.success('更新成功')
        }
      } else {
        // 添加新平台
        platformList.value.push({ ...platformForm })
        ElMessage.success('添加成功')
        // 更新系统状态
        systemStatus.value.platforms = platformList.value.filter(p => p.status === '在线').length
      }
      dialogVisible.value = false
      resetForm()
    } else {
      return false
    }
  })
}

// 监听对话框关闭
const handleDialogClose = () => {
  resetForm()
}
</script>

<style scoped>
.video-network {
  padding: 20px;
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
  height: calc(100vh - 100px);
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.update-time {
  font-size: 12px;
  color: #909399;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.status-item .label {
  font-size: 12px;
  color: #909399;
}

.status-item .value {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.status-item .value.success {
  color: #67c23a;
}

.platform-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.network-topology {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.topology-content {
  flex: 1;
  overflow: auto;
  padding: 10px 0;
}

:deep(.el-card__body) {
  flex: 1;
  overflow: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 