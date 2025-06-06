<template>
  <div class="card-recognition">
    <el-row :gutter="20">
      <!-- 左侧设备列表 -->
      <el-col :span="6">
        <el-card class="device-list">
          <template #header>
            <div class="card-header">
              <span>读卡设备</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索设备"
                prefix-icon="Search"
                clearable
                @clear="handleSearch"
                @input="handleSearch"
              />
            </div>
          </template>
          <el-scrollbar height="calc(100vh - 200px)">
            <el-tree
              :data="deviceGroups"
              :props="defaultProps"
              @node-click="handleNodeClick"
              highlight-current
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <span v-if="data.type === 'device'" class="device-status">
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

      <!-- 右侧内容区域 -->
      <el-col :span="18">
        <el-tabs v-model="activeTab" class="content-tabs">
          <!-- 卡管理 -->
          <el-tab-pane label="卡管理" name="cards">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>卡片列表</span>
                  <div class="header-actions">
                    <el-button type="primary" @click="handleAddCard">新增卡片</el-button>
                    <el-button type="success" @click="handleImport">批量导入</el-button>
                    <el-button type="warning" @click="handleExport">导出数据</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="paginatedCards" style="width: 100%">
                <el-table-column prop="cardNo" label="卡号" />
                <el-table-column prop="type" label="卡片类型" />
                <el-table-column prop="owner" label="持卡人" />
                <el-table-column prop="department" label="所属部门" />
                <el-table-column prop="validFrom" label="生效时间" width="180" />
                <el-table-column prop="validTo" label="失效时间" width="180" />
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag :type="getStatusType(scope.row.status)">
                      {{ getStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                  <template #default="scope">
                    <el-button-group>
                      <el-button type="primary" size="small" @click="handleEditCard(scope.row)">编辑</el-button>
                      <el-button type="danger" size="small" @click="handleDeleteCard(scope.row)">删除</el-button>
                    </el-button-group>
                  </template>
                </el-table-column>
              </el-table>
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="total"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </el-card>
          </el-tab-pane>

          <!-- 实时监控 -->
          <el-tab-pane label="实时监控" name="monitor">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-card class="monitor-card">
                  <template #header>
                    <div class="card-header">
                      <span>刷卡记录</span>
                      <div class="header-actions">
                        <el-button-group>
                          <el-button type="primary" :icon="VideoPlay" @click="startMonitor">开始监控</el-button>
                          <el-button type="danger" :icon="VideoPause" @click="stopMonitor">停止监控</el-button>
                        </el-button-group>
                      </div>
                    </div>
                  </template>
                  <div class="monitor-content">
                    <el-table :data="paginatedRecords" style="width: 100%">
                      <el-table-column prop="time" label="刷卡时间" width="180" />
                      <el-table-column prop="cardNo" label="卡号" />
                      <el-table-column prop="owner" label="持卡人" />
                      <el-table-column prop="device" label="设备名称" />
                      <el-table-column prop="location" label="位置" />
                      <el-table-column prop="status" label="状态">
                        <template #default="scope">
                          <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
                            {{ scope.row.status === 'success' ? '成功' : '失败' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="status-card">
                  <template #header>
                    <div class="card-header">
                      <span>监控状态</span>
                    </div>
                  </template>
                  <div class="status-content" v-if="monitorStatus">
                    <div class="status-info">
                      <p><strong>监控设备：</strong>{{ monitorStatus.device }}</p>
                      <p><strong>开始时间：</strong>{{ monitorStatus.startTime }}</p>
                      <p><strong>记录数量：</strong>{{ monitorStatus.recordCount }}</p>
                      <p><strong>状态：</strong>
                        <el-tag :type="monitorStatus.status === 'running' ? 'success' : 'info'">
                          {{ monitorStatus.status === 'running' ? '监控中' : '已停止' }}
                        </el-tag>
                      </p>
                    </div>
                  </div>
                  <div v-else class="no-monitor">
                    <el-empty description="未开始监控" />
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>

          <!-- 刷卡记录 -->
          <el-tab-pane label="刷卡记录" name="records">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>历史记录</span>
                  <div class="header-actions">
                    <el-date-picker
                      v-model="dateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      @change="handleDateChange"
                    />
                    <el-button type="primary" :icon="Download" @click="handleExport">导出记录</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="paginatedRecords" style="width: 100%">
                <el-table-column prop="time" label="刷卡时间" width="180" />
                <el-table-column prop="cardNo" label="卡号" />
                <el-table-column prop="owner" label="持卡人" />
                <el-table-column prop="device" label="设备名称" />
                <el-table-column prop="location" label="位置" />
                <el-table-column prop="status" label="状态">
                  <template #default="scope">
                    <el-tag :type="scope.row.status === 'success' ? 'success' : 'danger'">
                      {{ scope.row.status === 'success' ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="total"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>

    <!-- 卡片表单对话框 -->
    <el-dialog
      v-model="showCardDialog"
      :title="dialogType === 'add' ? '新增卡片' : '编辑卡片'"
      width="50%"
      destroy-on-close
    >
      <el-form :model="cardForm" label-width="100px">
        <el-form-item label="卡号">
          <el-input v-model="cardForm.cardNo" placeholder="请输入卡号" />
        </el-form-item>
        <el-form-item label="卡片类型">
          <el-select v-model="cardForm.type" placeholder="请选择卡片类型">
            <el-option label="员工卡" value="employee" />
            <el-option label="访客卡" value="visitor" />
            <el-option label="临时卡" value="temporary" />
          </el-select>
        </el-form-item>
        <el-form-item label="持卡人">
          <el-input v-model="cardForm.owner" placeholder="请输入持卡人姓名" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-select v-model="cardForm.department" placeholder="请选择所属部门">
            <el-option label="行政部" value="行政部" />
            <el-option label="人事部" value="人事部" />
            <el-option label="财务部" value="财务部" />
            <el-option label="技术部" value="技术部" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="cardForm.validPeriod"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCardDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSaveCard">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  VideoPlay,
  VideoPause,
  Search,
  Download
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索关键词
const searchKeyword = ref('')

// 当前选中的设备
const currentDevice = ref(null)

// 标签页
const activeTab = ref('cards')

// 日期范围
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 对话框控制
const showCardDialog = ref(false)
const dialogType = ref('add')

// 卡片表单
const cardForm = ref({
  cardNo: '',
  type: 'employee',
  owner: '',
  department: '',
  validPeriod: []
})

// 监控状态
const monitorStatus = ref(null)

// 设备分组数据
const deviceGroups = ref([
  {
    label: 'A区读卡器',
    children: [
      {
        label: 'A区大门读卡器',
        type: 'device',
        status: 'online',
        id: 'A001',
        name: 'A区大门读卡器',
        location: 'A区大门',
        lastHeartbeat: '2025-05-20 10:00:00',
        signal: '强',
        battery: '90%'
      },
      {
        label: 'A区电梯读卡器',
        type: 'device',
        status: 'online',
        id: 'A002',
        name: 'A区电梯读卡器',
        location: 'A区电梯',
        lastHeartbeat: '2025-05-20 10:00:00',
        signal: '中',
        battery: '85%'
      },
      {
        label: 'A区会议室读卡器',
        type: 'device',
        status: 'online',
        id: 'A003',
        name: 'A区会议室读卡器',
        location: 'A区会议室',
        lastHeartbeat: '2025-05-20 10:00:00',
        signal: '强',
        battery: '95%'
      }
    ]
  },
  {
    label: 'B区读卡器',
    children: [
      {
        label: 'B区大门读卡器',
        type: 'device',
        status: 'offline',
        id: 'B001',
        name: 'B区大门读卡器',
        location: 'B区大门',
        lastHeartbeat: '2025-05-20 09:30:00',
        signal: '无',
        battery: '0%'
      },
      {
        label: 'B区走廊读卡器',
        type: 'device',
        status: 'online',
        id: 'B002',
        name: 'B区走廊读卡器',
        location: 'B区走廊',
        lastHeartbeat: '2025-05-20 10:00:00',
        signal: '弱',
        battery: '60%'
      }
    ]
  },
  {
    label: 'C区读卡器',
    children: [
      {
        label: 'C区大门读卡器',
        type: 'device',
        status: 'online',
        id: 'C001',
        name: 'C区大门读卡器',
        location: 'C区大门',
        lastHeartbeat: '2025-05-20 10:00:00',
        signal: '强',
        battery: '88%'
      },
      {
        label: 'C区休息区读卡器',
        type: 'device',
        status: 'online',
        id: 'C002',
        name: 'C区休息区读卡器',
        location: 'C区休息区',
        lastHeartbeat: '2025-05-20 10:00:00',
        signal: '中',
        battery: '75%'
      }
    ]
  }
])

// 树形配置
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 卡片列表
const cardList = ref([
  {
    cardNo: 'EMP001',
    type: 'employee',
    owner: '王建国',
    department: '技术部',
    validFrom: '2025-05-01',
    validTo: '2025-12-31',
    status: 'active',
    phone: '13905311234'
  },
  {
    cardNo: 'VIS001',
    type: 'visitor',
    owner: '张丽华',
    department: '访客',
    validFrom: '2025-05-20',
    validTo: '2025-05-20',
    status: 'expired',
    phone: '13805322345'
  },
  {
    cardNo: 'EMP002',
    type: 'employee',
    owner: '刘志强',
    department: '行政部',
    validFrom: '2025-05-01',
    validTo: '2025-12-31',
    status: 'active',
    phone: '13705333456'
  },
  {
    cardNo: 'TMP001',
    type: 'temporary',
    owner: '周晓明',
    department: '外包人员',
    validFrom: '2025-05-01',
    validTo: '2024-06-30',
    status: 'active',
    phone: '13605344567'
  },
  {
    cardNo: 'EMP003',
    type: 'employee',
    owner: '吴秀英',
    department: '人事部',
    validFrom: '2025-05-01',
    validTo: '2025-12-31',
    status: 'lost',
    phone: '13505355678'
  },
  {
    cardNo: 'EMP004',
    type: 'employee',
    owner: '郑志明',
    department: '财务部',
    validFrom: '2025-05-01',
    validTo: '2025-12-31',
    status: 'inactive',
    phone: '13405366789'
  },
  {
    cardNo: 'VIS002',
    type: 'visitor',
    owner: '林美玲',
    department: '访客',
    validFrom: '2025-05-21',
    validTo: '2025-05-21',
    status: 'active',
    phone: '13305377890'
  },
  {
    cardNo: 'TMP002',
    type: 'temporary',
    owner: '黄建国',
    department: '外包人员',
    validFrom: '2025-05-01',
    validTo: '2024-09-30',
    status: 'active',
    phone: '13205388901'
  }
])

// 实时记录
const realtimeRecords = ref([
  {
    time: '2025-05-20 10:00:00',
    cardNo: 'EMP001',
    owner: '王建国',
    device: 'A区大门读卡器',
    location: 'A区大门',
    status: 'success',
    department: '技术部'
  },
  {
    time: '2025-05-20 10:01:00',
    cardNo: 'EMP002',
    owner: '刘志强',
    device: 'A区电梯读卡器',
    location: 'A区电梯',
    status: 'success',
    department: '行政部'
  },
  {
    time: '2025-05-20 10:02:00',
    cardNo: 'VIS001',
    owner: '张丽华',
    device: 'B区大门读卡器',
    location: 'B区大门',
    status: 'failed',
    department: '访客',
    failReason: '卡片已过期'
  },
  {
    time: '2025-05-20 10:03:00',
    cardNo: 'TMP001',
    owner: '周晓明',
    device: 'C区大门读卡器',
    location: 'C区大门',
    status: 'success',
    department: '外包人员'
  }
])

// 历史记录
const historyRecords = ref([
  {
    time: '2025-05-20 09:00:00',
    cardNo: 'EMP001',
    owner: '王建国',
    device: 'A区大门读卡器',
    location: 'A区大门',
    status: 'success',
    department: '技术部'
  },
  {
    time: '2025-05-20 09:30:00',
    cardNo: 'VIS001',
    owner: '张丽华',
    device: 'B区大门读卡器',
    location: 'B区大门',
    status: 'failed',
    department: '访客',
    failReason: '卡片已过期'
  },
  {
    time: '2025-05-20 09:45:00',
    cardNo: 'EMP002',
    owner: '刘志强',
    device: 'A区电梯读卡器',
    location: 'A区电梯',
    status: 'success',
    department: '行政部'
  },
  {
    time: '2025-05-20 10:00:00',
    cardNo: 'TMP001',
    owner: '周晓明',
    device: 'C区大门读卡器',
    location: 'C区大门',
    status: 'success',
    department: '外包人员'
  },
  {
    time: '2025-05-20 10:15:00',
    cardNo: 'EMP003',
    owner: '吴秀英',
    device: 'A区会议室读卡器',
    location: 'A区会议室',
    status: 'failed',
    department: '人事部',
    failReason: '卡片已挂失'
  }
])

// 计算当前页的数据
const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return cardList.value.slice(start, end)
})

// 计算当前页的记录数据
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return activeTab.value === 'monitor' ? realtimeRecords.value.slice(start, end) : historyRecords.value.slice(start, end)
})

// 获取状态类型
const getStatusType = (status) => {
  const types = {
    active: 'success',
    inactive: 'info',
    expired: 'danger',
    lost: 'warning'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    active: '正常',
    inactive: '停用',
    expired: '过期',
    lost: '挂失'
  }
  return texts[status] || '未知'
}

// 处理节点点击
const handleNodeClick = (data) => {
  if (data.type === 'device') {
    currentDevice.value = data
  }
}

// 处理搜索
const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value)
}

// 新增卡片
const handleAddCard = () => {
  dialogType.value = 'add'
  cardForm.value = {
    cardNo: '',
    type: 'employee',
    owner: '',
    department: '',
    validPeriod: []
  }
  showCardDialog.value = true
}

// 编辑卡片
const handleEditCard = (card) => {
  dialogType.value = 'edit'
  cardForm.value = {
    ...card,
    validPeriod: [card.validFrom, card.validTo]
  }
  showCardDialog.value = true
}

// 删除卡片
const handleDeleteCard = (card) => {
  ElMessageBox.confirm(
    `确定要删除卡号为 ${card.cardNo} 的卡片吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    const index = cardList.value.findIndex(c => c.cardNo === card.cardNo)
    if (index > -1) {
      cardList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

// 保存卡片
const handleSaveCard = () => {
  // 表单验证
  if (!cardForm.value.cardNo || !cardForm.value.type || !cardForm.value.owner || !cardForm.value.department || !cardForm.value.validPeriod) {
    ElMessage.error('请填写完整信息')
    return
  }

  // 卡号格式验证
  if (!/^[A-Z]{3}\d{3}$/.test(cardForm.value.cardNo)) {
    ElMessage.error('卡号格式不正确，应为3位大写字母+3位数字')
    return
  }

  if (dialogType.value === 'add') {
    // 添加新卡片
    cardList.value.unshift({
      ...cardForm.value,
      validFrom: cardForm.value.validPeriod[0],
      validTo: cardForm.value.validPeriod[1],
      status: 'active'
    })
    ElMessage.success('添加成功')
  } else {
    // 更新卡片
    const index = cardList.value.findIndex(c => c.cardNo === cardForm.value.cardNo)
    if (index > -1) {
      cardList.value[index] = {
        ...cardForm.value,
        validFrom: cardForm.value.validPeriod[0],
        validTo: cardForm.value.validPeriod[1]
      }
      ElMessage.success('更新成功')
    }
  }
  showCardDialog.value = false
}

// 开始监控
const startMonitor = () => {
  console.log('开始监控')
  monitorStatus.value = {
    device: currentDevice.value?.name || '全部设备',
    startTime: new Date().toLocaleString(),
    recordCount: 0,
    status: 'running'
  }
}

// 停止监控
const stopMonitor = () => {
  console.log('停止监控')
  monitorStatus.value = null
}

// 批量导入
const handleImport = () => {
  console.log('批量导入')
}

// 导出数据
const handleExport = () => {
  // 准备导出数据
  const exportData = activeTab.value === 'cards' ? cardList.value.map(card => ({
    '卡号': card.cardNo,
    '卡片类型': card.type === 'employee' ? '员工卡' : card.type === 'visitor' ? '访客卡' : '临时卡',
    '持卡人': card.owner,
    '所属部门': card.department,
    '生效时间': card.validFrom,
    '失效时间': card.validTo,
    '状态': getStatusText(card.status)
  })) : historyRecords.value.map(record => ({
    '刷卡时间': record.time,
    '卡号': record.cardNo,
    '持卡人': record.owner,
    '设备名称': record.device,
    '位置': record.location,
    '状态': record.status === 'success' ? '成功' : '失败',
    '失败原因': record.failReason || ''
  }))

  // 模拟导出过程
  setTimeout(() => {
    ElMessage.success('导出成功')
  }, 1000)
}

// 处理日期变化
const handleDateChange = (val) => {
  console.log('日期范围:', val)
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  total.value = activeTab.value === 'cards' ? cardList.value.length : 
                activeTab.value === 'monitor' ? realtimeRecords.value.length : 
                historyRecords.value.length
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 监听标签页变化
watch(activeTab, (newTab) => {
  currentPage.value = 1
  total.value = newTab === 'cards' ? cardList.value.length : 
                newTab === 'monitor' ? realtimeRecords.value.length : 
                historyRecords.value.length
})

// 初始化总数
total.value = cardList.value.length
</script>

<style scoped>
.card-recognition {
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

.device-list {
  height: calc(100vh - 100px);
}

.content-tabs {
  height: calc(100vh - 100px);
}

.monitor-card {
  height: calc(100vh - 150px);
}

.status-card {
  height: calc(100vh - 150px);
}

.monitor-content {
  padding: 20px;
}

.status-content {
  padding: 20px;
}

.status-info p {
  margin: 10px 0;
}

.no-monitor {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.device-status {
  margin-left: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 