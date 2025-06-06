<template>
  <div class="device-management">
    <el-row :gutter="20">
      <!-- 设备状态概览 -->
      <el-col :span="24">
        <el-row :gutter="20">
          <el-col :span="6" v-for="stat in deviceStats" :key="stat.title">
            <el-card class="stat-card" :class="stat.type">
              <div class="stat-content">
                <div class="stat-icon">
                  <el-icon :size="24"><component :is="stat.icon"/></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ stat.value }}</div>
                  <div class="stat-title">{{ stat.title }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>

      <!-- 设备列表 -->
      <el-col :span="24" class="mt-20">
        <el-card>
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="title">设备列表</span>
                <el-radio-group v-model="deviceType" size="small">
                  <el-radio-button label="camera">摄像头</el-radio-button>
                  <el-radio-button label="elevator">电梯</el-radio-button>
                </el-radio-group>
              </div>
              <el-button type="primary" @click="handleAddDevice">
                <el-icon><Plus /></el-icon>添加设备
              </el-button>
            </div>
          </template>

          <el-table
            :data="paginatedDevices"
            style="width: 100%"
            v-loading="loading">
            <el-table-column prop="id" label="设备ID" width="120" />
            <el-table-column prop="name" label="设备名称" width="180" />
            <el-table-column prop="location" label="安装位置" width="180" />
            <el-table-column prop="type" label="设备类型" width="120">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'camera' ? 'success' : 'warning'">
                  {{ scope.row.type === 'camera' ? '摄像头' : '电梯' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastMaintenance" label="最后维护时间" width="180" />
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button-group>
                  <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                  <el-button 
                    size="small" 
                    type="primary"
                    @click="handleMaintenance(scope.row)">
                    维护
                  </el-button>
                  <el-button 
                    size="small" 
                    type="danger"
                    @click="handleDelete(scope.row)">
                    删除
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页器 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredDevices.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加/编辑设备对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加设备' : '编辑设备'"
      width="500px">
      <el-form :model="deviceForm" label-width="100px">
        <el-form-item label="设备名称">
          <el-input v-model="deviceForm.name" placeholder="请输入设备名称"/>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="deviceForm.type" placeholder="请选择设备类型">
            <el-option label="摄像头" value="camera"/>
            <el-option label="电梯" value="elevator"/>
          </el-select>
        </el-form-item>
        <el-form-item label="安装位置">
          <el-input v-model="deviceForm.location" placeholder="请输入安装位置"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="deviceForm.status" placeholder="请选择设备状态">
            <el-option label="正常" value="正常"/>
            <el-option label="故障" value="故障"/>
            <el-option label="维护中" value="维护中"/>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 维护记录对话框 -->
    <el-dialog
      v-model="maintenanceDialogVisible"
      title="设备维护"
      width="500px">
      <el-form :model="maintenanceForm" label-width="100px">
        <el-form-item label="维护类型">
          <el-select v-model="maintenanceForm.type" placeholder="请选择维护类型">
            <el-option label="定期检查" value="regular"/>
            <el-option label="故障维修" value="repair"/>
            <el-option label="设备升级" value="upgrade"/>
          </el-select>
        </el-form-item>
        <el-form-item label="维护说明">
          <el-input
            type="textarea"
            v-model="maintenanceForm.description"
            rows="3"
            placeholder="请输入维护说明"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="maintenanceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleMaintenanceSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  VideoCamera, 
  Connection, 
  Warning, 
  Check,
  Plus
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 设备统计数据使用计算属性
const deviceStats = computed(() => {
  const totalDevices = devices.value.length
  const onlineDevices = devices.value.filter(d => d.status === '正常').length
  const faultDevices = devices.value.filter(d => d.status === '故障').length
  const maintenanceDevices = devices.value.filter(d => d.status === '维护中').length
  
  return [
    {
      title: '设备总数',
      value: totalDevices.toString(),
      icon: 'Connection',
      type: 'primary'
    },
    {
      title: '在线设备',
      value: onlineDevices.toString(),
      icon: 'Check',
      type: 'success'
    },
    {
      title: '故障设备',
      value: faultDevices.toString(),
      icon: 'Warning',
      type: 'danger'
    },
    {
      title: '维护中',
      value: maintenanceDevices.toString(),
      icon: 'Tools',
      type: 'warning'
    }
  ]
})

// 设备类型统计
const deviceTypeStats = computed(() => {
  const cameraCount = devices.value.filter(d => d.type === 'camera').length
  const elevatorCount = devices.value.filter(d => d.type === 'elevator').length
  
  return {
    camera: cameraCount,
    elevator: elevatorCount
  }
})

// 设备状态变化趋势（最近7天）
const deviceTrends = computed(() => {
  // 这里可以接入后端API获取真实数据
  return {
    dates: ['03-14', '03-15', '03-16', '03-17', '03-18', '03-19', '03-20'],
    online: [80, 81, 82, 81, 82, 82, 82],
    fault: [2, 2, 1, 2, 1, 2, 2],
    maintenance: [3, 2, 2, 2, 2, 1, 2]
  }
})

// 维护记录统计
const maintenanceStats = computed(() => {
  return {
    thisMonth: {
      total: 12,
      regular: 8,
      repair: 3,
      upgrade: 1
    },
    thisYear: {
      total: 45,
      regular: 32,
      repair: 10,
      upgrade: 3
    }
  }
})

// 设备列表数据
const devices = ref([
  {
    id: 'CAM001',
    name: 'A栋高空抛物监控1号',
    type: 'camera',
    location: 'A栋1单元西侧',
    status: '正常',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-06-15',
    lastMaintenance: '2025-01-20',
    nextMaintenance: '2025-01-15'
  },
  {
    id: 'CAM002',
    name: 'A栋人流监控2号',
    type: 'camera',
    location: 'A栋1单元大堂',
    status: '正常',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-06-15',
    lastMaintenance: '2025-01-16',
    nextMaintenance: '2024-05-16'
  },
  {
    id: 'CAM003',
    name: 'B栋高空抛物监控1号',
    type: 'camera',
    location: 'B栋2单元东侧',
    status: '故障',
    model: 'DH-8000A',
    manufacturer: '大华',
    installDate: '2023-07-20',
    lastMaintenance: '2025-01-20',
    nextMaintenance: '2024-05-20'
  },
  {
    id: 'CAM004',
    name: 'C栋监控3号',
    type: 'camera',
    location: 'C栋大门口',
    status: '正常',
    model: 'DH-8000A',
    manufacturer: '大华',
    installDate: '2023-08-15',
    lastMaintenance: '2025-01-22',
    nextMaintenance: '2024-05-25'
  },
  {
    id: 'CAM005',
    name: 'D栋监控1号',
    type: 'camera',
    location: 'D栋地下车库入口',
    status: '正常',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-09-01',
    lastMaintenance: '2025-01-01',
    nextMaintenance: '2024-06-01'
  },
  {
    id: 'CAM006',
    name: 'A栋车库监控1号',
    type: 'camera',
    location: 'A栋地下车库',
    status: '正常',
    model: 'DH-8000A',
    manufacturer: '大华',
    installDate: '2023-09-15',
    lastMaintenance: '2025-01-05',
    nextMaintenance: '2024-06-05'
  },
  {
    id: 'CAM007',
    name: 'B栋人流监控2号',
    type: 'camera',
    location: 'B栋大堂',
    status: '维护中',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-10-01',
    lastMaintenance: '2025-01-20',
    nextMaintenance: '2024-06-20'
  },
  {
    id: 'CAM008',
    name: 'C栋高空抛物监控2号',
    type: 'camera',
    location: 'C栋3单元东侧',
    status: '正常',
    model: 'DH-8000A',
    manufacturer: '大华',
    installDate: '2023-10-15',
    lastMaintenance: '2025-01-10',
    nextMaintenance: '2024-06-10'
  },
  {
    id: 'CAM009',
    name: '小区东门监控1号',
    type: 'camera',
    location: '小区东门',
    status: '正常',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-11-01',
    lastMaintenance: '2025-01-15',
    nextMaintenance: '2024-06-15'
  },
  {
    id: 'CAM010',
    name: '小区西门监控1号',
    type: 'camera',
    location: '小区西门',
    status: '正常',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-11-01',
    lastMaintenance: '2025-01-15',
    nextMaintenance: '2024-06-15'
  },
  {
    id: 'ELE001',
    name: 'A栋1号电梯',
    type: 'elevator',
    location: 'A栋1单元',
    status: '正常',
    model: 'TL-3000',
    manufacturer: '通力电梯',
    installDate: '2022-12-01',
    lastMaintenance: '2025-01-01',
    nextMaintenance: '2024-05-01'
  },
  {
    id: 'ELE002',
    name: 'A栋2号电梯',
    type: 'elevator',
    location: 'A栋2单元',
    status: '维护中',
    model: 'TL-3000',
    manufacturer: '通力电梯',
    installDate: '2022-12-01',
    lastMaintenance: '2025-01-20',
    nextMaintenance: '2024-06-20'
  },
  {
    id: 'ELE003',
    name: 'B栋1号电梯',
    type: 'elevator',
    location: 'B栋1单元',
    status: '正常',
    model: 'XD-2800',
    manufacturer: '迅达电梯',
    installDate: '2023-01-15',
    lastMaintenance: '2025-01-10',
    nextMaintenance: '2024-05-10'
  },
  {
    id: 'ELE004',
    name: 'B栋2号电梯',
    type: 'elevator',
    location: 'B栋2单元',
    status: '正常',
    model: 'XD-2800',
    manufacturer: '迅达电梯',
    installDate: '2023-01-15',
    lastMaintenance: '2025-01-12',
    nextMaintenance: '2024-05-12'
  },
  {
    id: 'ELE005',
    name: 'C栋1号电梯',
    type: 'elevator',
    location: 'C栋1单元',
    status: '正常',
    model: 'MS-2000',
    manufacturer: '三菱电梯',
    installDate: '2023-02-01',
    lastMaintenance: '2025-01-15',
    nextMaintenance: '2024-05-15'
  },
  {
    id: 'ELE006',
    name: 'C栋2号电梯',
    type: 'elevator',
    location: 'C栋2单元',
    status: '故障',
    model: 'MS-2000',
    manufacturer: '三菱电梯',
    installDate: '2023-02-01',
    lastMaintenance: '2025-01-18',
    nextMaintenance: '2024-05-18'
  },
  {
    id: 'CAM011',
    name: '小区南门监控1号',
    type: 'camera',
    location: '小区南门',
    status: '正常',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-11-05',
    lastMaintenance: '2025-01-15',
    nextMaintenance: '2024-06-15'
  },
  {
    id: 'CAM012',
    name: '小区北门监控1号',
    type: 'camera',
    location: '小区北门',
    status: '正常',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-11-05',
    lastMaintenance: '2025-01-15',
    nextMaintenance: '2024-06-15'
  },
  {
    id: 'CAM013',
    name: '地下车库A区监控1号',
    type: 'camera',
    location: '地下车库A区',
    status: '正常',
    model: 'DH-8000A',
    manufacturer: '大华',
    installDate: '2023-11-10',
    lastMaintenance: '2025-01-10',
    nextMaintenance: '2024-06-10'
  },
  {
    id: 'CAM014',
    name: '地下车库B区监控1号',
    type: 'camera',
    location: '地下车库B区',
    status: '正常',
    model: 'DH-8000A',
    manufacturer: '大华',
    installDate: '2023-11-10',
    lastMaintenance: '2025-01-10',
    nextMaintenance: '2024-06-10'
  },
  {
    id: 'CAM015',
    name: '游泳池监控1号',
    type: 'camera',
    location: '小区游泳池',
    status: '正常',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-11-15',
    lastMaintenance: '2025-01-15',
    nextMaintenance: '2024-06-15'
  },
  {
    id: 'CAM016',
    name: '健身房监控1号',
    type: 'camera',
    location: '小区健身房',
    status: '正常',
    model: 'DH-8000A',
    manufacturer: '大华',
    installDate: '2023-11-15',
    lastMaintenance: '2025-01-15',
    nextMaintenance: '2024-06-15'
  },
  {
    id: 'CAM017',
    name: '儿童乐园监控1号',
    type: 'camera',
    location: '小区儿童乐园',
    status: '维护中',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-11-20',
    lastMaintenance: '2025-01-20',
    nextMaintenance: '2024-06-20'
  },
  {
    id: 'CAM018',
    name: '篮球场监控1号',
    type: 'camera',
    location: '小区篮球场',
    status: '正常',
    model: 'DH-8000A',
    manufacturer: '大华',
    installDate: '2023-11-20',
    lastMaintenance: '2025-01-20',
    nextMaintenance: '2024-06-20'
  },
  {
    id: 'CAM019',
    name: '网球场监控1号',
    type: 'camera',
    location: '小区网球场',
    status: '正常',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-11-25',
    lastMaintenance: '2025-01-20',
    nextMaintenance: '2024-06-20'
  },
  {
    id: 'CAM020',
    name: '垃圾房监控1号',
    type: 'camera',
    location: '小区垃圾房',
    status: '正常',
    model: 'DH-8000A',
    manufacturer: '大华',
    installDate: '2023-11-25',
    lastMaintenance: '2025-01-20',
    nextMaintenance: '2024-06-20'
  },
  {
    id: 'ELE007',
    name: 'D栋1号电梯',
    type: 'elevator',
    location: 'D栋1单元',
    status: '正常',
    model: 'MS-2000',
    manufacturer: '三菱电梯',
    installDate: '2023-02-15',
    lastMaintenance: '2025-01-20',
    nextMaintenance: '2024-05-20'
  },
  {
    id: 'ELE008',
    name: 'D栋2号电梯',
    type: 'elevator',
    location: 'D栋2单元',
    status: '正常',
    model: 'MS-2000',
    manufacturer: '三菱电梯',
    installDate: '2023-02-15',
    lastMaintenance: '2025-01-20',
    nextMaintenance: '2024-05-20'
  },
  {
    id: 'CAM021',
    name: 'D栋高空抛物监控1号',
    type: 'camera',
    location: 'D栋1单元东侧',
    status: '正常',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-12-01',
    lastMaintenance: '2025-01-01',
    nextMaintenance: '2024-06-01'
  },
  {
    id: 'CAM022',
    name: 'D栋高空抛物监控2号',
    type: 'camera',
    location: 'D栋2单元西侧',
    status: '正常',
    model: 'HK-2023Pro',
    manufacturer: '海康威视',
    installDate: '2023-12-01',
    lastMaintenance: '2025-01-01',
    nextMaintenance: '2024-06-01'
  }
])

const deviceType = ref('camera')
const dialogVisible = ref(false)
const dialogType = ref('add')
const maintenanceDialogVisible = ref(false)

const deviceForm = ref({
  name: '',
  type: '',
  location: '',
  status: '正常'
})

const maintenanceForm = ref({
  type: '',
  description: '',
  maintenanceTypes: [
    { label: '定期检查', value: 'regular' },
    { label: '故障维修', value: 'repair' },
    { label: '设备升级', value: 'upgrade' },
    { label: '零件更换', value: 'parts' },
    { label: '软件更新', value: 'software' }
  ],
  maintenanceParts: [
    { label: '摄像头镜头', value: 'lens' },
    { label: '存储卡', value: 'storage' },
    { label: '电源适配器', value: 'power' },
    { label: '网络模块', value: 'network' },
    { label: '支架配件', value: 'bracket' }
  ]
})

// 根据设备类型筛选设备列表
const filteredDevices = computed(() => {
  return devices.value.filter(device => device.type === deviceType.value)
})

// 获取状态标签类型
const getStatusType = (status) => {
  const types = {
    '正常': 'success',
    '故障': 'danger',
    '维护中': 'warning'
  }
  return types[status] || 'info'
}

// 添加设备
const handleAddDevice = () => {
  dialogType.value = 'add'
  deviceForm.value = {
    name: '',
    type: deviceType.value,
    location: '',
    status: '正常'
  }
  dialogVisible.value = true
}

// 编辑设备
const handleEdit = (row) => {
  dialogType.value = 'edit'
  deviceForm.value = { ...row }
  dialogVisible.value = true
}

// 删除设备
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除设备 ${row.name} 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 这里添加删除逻辑
    ElMessage.success('删除成功')
  })
}

// 设备维护
const handleMaintenance = (row) => {
  maintenanceForm.value = {
    type: '',
    description: ''
  }
  maintenanceDialogVisible.value = true
}

// 提交设备表单
const handleSubmit = () => {
  // 这里添加提交逻辑
  ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
  dialogVisible.value = false
}

// 提交维护记录
const handleMaintenanceSubmit = () => {
  // 这里添加维护记录提交逻辑
  ElMessage.success('维护记录已提交')
  maintenanceDialogVisible.value = false
}

// 获取设备状态分布
const deviceStatusDistribution = computed(() => {
  const distribution = {}
  devices.value.forEach(device => {
    if (!distribution[device.status]) {
      distribution[device.status] = 0
    }
    distribution[device.status]++
  })
  return distribution
})

// 获取设备厂商分布
const deviceManufacturerDistribution = computed(() => {
  const distribution = {}
  devices.value.forEach(device => {
    if (!distribution[device.manufacturer]) {
      distribution[device.manufacturer] = 0
    }
    distribution[device.manufacturer]++
  })
  return distribution
})

// 分页相关数据
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

// 分页后的设备列表
const paginatedDevices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredDevices.value.slice(start, end)
})

// 处理每页显示数量变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 当设备类型改变时，重置分页
watch(deviceType, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.device-management {
  padding: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title {
  font-size: 16px;
  font-weight: bold;
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 