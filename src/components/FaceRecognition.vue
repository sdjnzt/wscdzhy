<template>
  <div class="face-recognition">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <h3>人脸识别系统管理</h3>
          <div class="header-actions">
            <el-button-group>
              <el-button type="primary" @click="showFaceLibrary = true">
                <el-icon><User /></el-icon>人脸库管理
              </el-button>
              <el-button type="success" @click="showSettings = true">
                <el-icon><Setting /></el-icon>系统配置
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>
      
      <!-- 统计面板 -->
      <div class="stat-panel">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <template #header>
                <div class="stat-title">今日识别</div>
              </template>
              <div class="stat-content">
                <div class="stat-value">358</div>
                <div class="stat-desc">
                  <el-tag size="small" type="success">同比增长 8.5%</el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <template #header>
                <div class="stat-title">人脸库总数</div>
              </template>
              <div class="stat-content">
                <div class="stat-value">2,560</div>
                <div class="stat-desc">
                  <el-button type="primary" link @click="showFaceLibrary = true">管理人脸库</el-button>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <template #header>
                <div class="stat-title">识别准确率</div>
              </template>
              <div class="stat-content">
                <div class="stat-value">97.8%</div>
                <div class="stat-desc">
                  <el-progress :percentage="97.8" :color="'#67C23A'" :show-text="false"></el-progress>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <template #header>
                <div class="stat-title">未识别告警</div>
              </template>
              <div class="stat-content">
                <div class="stat-value">24</div>
                <div class="stat-desc">
                  <el-tag size="small" type="danger">待处理</el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 表格和过滤区域 -->
      <div class="table-section">
        <div class="filter-bar">
          <el-form :inline="true" :model="filterForm" class="filter-form">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="filterForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="识别状态">
              <el-select v-model="filterForm.status" placeholder="全部">
                <el-option label="全部" value="" />
                <el-option label="已识别" value="success" />
                <el-option label="未识别" value="warning" />
              </el-select>
            </el-form-item>
            <el-form-item label="位置">
              <el-select v-model="filterForm.location" placeholder="全部区域">
                <el-option label="全部区域" value="" />
                <el-option label="A区" value="A区" />
                <el-option label="B区" value="B区" />
                <el-option label="C区" value="C区" />
                <el-option label="D区" value="D区" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleFilter">查询</el-button>
              <el-button @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>
          <div class="search-input">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索姓名/身份"
              prefix-icon="Search"
              clearable
              @clear="handleSearch"
              @input="handleSearch"
            />
          </div>
        </div>
        
        <!-- 识别记录表格 -->
        <el-table
          :data="recognitionRecords"
          style="width: 100%"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
          border
          stripe
          v-loading="tableLoading"
          height="calc(100vh - 420px)"
        >
          <el-table-column type="index" width="60" align="center" />
          <el-table-column prop="time" label="识别时间" width="180" sortable />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="identity" label="身份" width="150" />
          <el-table-column prop="location" label="位置" width="120" />
          <el-table-column prop="similarity" label="相似度" width="100">
            <template #default="scope">
              <span>{{ scope.row.similarity }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="识别状态" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.type === 'success' ? 'success' : 'warning'">
                {{ scope.row.type === 'success' ? '已识别' : '未识别' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进入权限" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.type === 'success'" :type="scope.row.access ? 'success' : 'danger'">
                {{ scope.row.access ? '允许' : '禁止' }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="180">
            <template #default="scope">
              <el-button-group>
                <el-button type="primary" size="small" @click="handleRecordDetail(scope.row)">详情</el-button>
                <el-button 
                  v-if="scope.row.type === 'warning'" 
                  type="warning" 
                  size="small" 
                  @click="handleWarnRecord(scope.row)">
                  处理
                </el-button>
                <el-button type="danger" size="small" @click="handleDeleteRecord(scope.row)">删除</el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalRecords"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 人脸库管理对话框 -->
    <el-dialog
      v-model="showFaceLibrary"
      title="人脸库管理"
      width="80%"
      destroy-on-close
    >
      <div class="face-library">
        <div class="library-header">
          <div class="header-left">
            <el-button type="primary" @click="handleAddFace">添加人脸</el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="!selectedFaces.length">
              批量删除
            </el-button>
          </div>
          <div class="header-right">
            <el-input
              v-model="librarySearch"
              placeholder="搜索人脸"
              prefix-icon="Search"
              style="width: 250px"
              clearable
            />
            <el-select v-model="departmentFilter" placeholder="部门筛选" style="width: 150px; margin-left: 10px">
              <el-option label="全部部门" value="" />
              <el-option label="研发部" value="研发部" />
              <el-option label="财务部" value="财务部" />
              <el-option label="人事部" value="人事部" />
              <el-option label="安保部" value="安保部" />
              <el-option label="市场部" value="市场部" />
              <el-option label="行政部" value="行政部" />
              <el-option label="外部" value="外部" />
            </el-select>
          </div>
        </div>
        <el-table
          :data="filteredFaceLibrary"
          style="width: 100%; margin-top: 20px"
          @selection-change="handleSelectionChange"
          border
          stripe
        >
          <el-table-column type="selection" width="55" />
          <el-table-column type="index" width="60" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="identity" label="身份" width="150" />
          <el-table-column prop="department" label="部门" width="120" />
          <el-table-column prop="phone" label="联系电话" width="150" />
          <el-table-column label="添加时间" width="180">
            <template #default="scope">
              <span>2024-03-{{ 10 + Math.floor(Math.random() * 10) }} {{ Math.floor(Math.random() * 24) }}:{{ Math.floor(Math.random() * 60) }}:{{ Math.floor(Math.random() * 60) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button-group>
                <el-button type="primary" size="small" @click="handleEditFace(scope.row)">编辑</el-button>
                <el-button type="danger" size="small" @click="handleDeleteFace(scope.row)">删除</el-button>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container" style="margin-top: 20px">
          <el-pagination
            v-model:current-page="faceLibraryPage"
            v-model:page-size="faceLibraryPageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredFaceLibrary.length"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 识别设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="识别系统配置"
      width="50%"
      destroy-on-close
    >
      <el-tabs v-model="settingsActiveTab">
        <el-tab-pane label="基础设置" name="basic">
          <el-form :model="recognitionSettings" label-width="120px">
            <el-form-item label="识别阈值">
              <el-slider v-model="recognitionSettings.threshold" :min="0" :max="100">
                <template #tip>
                  <div>阈值越高，准确率越高，但可能增加未识别情况</div>
                </template>
              </el-slider>
            </el-form-item>
            <el-form-item label="识别间隔(秒)">
              <el-input-number v-model="recognitionSettings.interval" :min="1" :max="10" />
            </el-form-item>
            <el-form-item label="活体检测">
              <el-switch v-model="recognitionSettings.livenessDetection" />
            </el-form-item>
            <el-form-item label="识别模式">
              <el-radio-group v-model="recognitionSettings.mode">
                <el-radio label="1:1">1:1比对</el-radio>
                <el-radio label="1:N">1:N识别</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="告警设置" name="alert">
          <el-form label-width="120px">
            <el-form-item label="告警通知">
              <el-switch v-model="alertSettings.enableNotification" />
            </el-form-item>
            <el-form-item label="通知方式" v-if="alertSettings.enableNotification">
              <el-checkbox-group v-model="alertSettings.notificationMethods">
                <el-checkbox label="email">邮件</el-checkbox>
                <el-checkbox label="sms">短信</el-checkbox>
                <el-checkbox label="app">APP推送</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="通知对象" v-if="alertSettings.enableNotification">
              <el-select v-model="alertSettings.recipients" multiple placeholder="选择接收人">
                <el-option label="系统管理员" value="admin" />
                <el-option label="安保主管" value="security" />
                <el-option label="技术支持" value="support" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="设备管理" name="device">
          <el-table
            :data="deviceList"
            style="width: 100%"
            border
            stripe
          >
            <el-table-column prop="id" label="设备ID" width="100" />
            <el-table-column prop="name" label="设备名称" width="150" />
            <el-table-column prop="location" label="安装位置" width="150" />
            <el-table-column prop="type" label="设备类型" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'online' ? 'success' : 'danger'">
                  {{ scope.row.status === 'online' ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button type="primary" size="small" @click="handleDeviceEdit(scope.row)">编辑</el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  @click="handleDeviceTest(scope.row)" 
                  :disabled="scope.row.status !== 'online'">
                  测试
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSettings = false">取消</el-button>
          <el-button type="primary" @click="saveSettings">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 记录详情 -->
    <el-dialog v-model="recordDetailVisible" title="识别记录详情" width="50%">
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ selectedRecord.name }}</el-descriptions-item>
          <el-descriptions-item label="身份">{{ selectedRecord.identity }}</el-descriptions-item>
          <el-descriptions-item label="识别时间">{{ selectedRecord.time }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ selectedRecord.location }}</el-descriptions-item>
          <el-descriptions-item label="相似度">{{ selectedRecord.similarity }}%</el-descriptions-item>
          <el-descriptions-item label="识别状态">
            <el-tag :type="selectedRecord.type === 'success' ? 'success' : 'warning'">
              {{ selectedRecord.type === 'success' ? '已识别' : '未识别' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进入权限" v-if="selectedRecord.type === 'success'">
            <el-tag :type="selectedRecord.access ? 'success' : 'danger'">
              {{ selectedRecord.access ? '允许' : '禁止' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设备ID">CAM-{{ Math.floor(Math.random() * 1000) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  VideoPlay,
  VideoPause,
  VideoCamera,
  Setting,
  Search,
  User,
  Edit,
  Delete,
  InfoFilled,
  Warning
} from '@element-plus/icons-vue'

// 搜索和过滤
const searchKeyword = ref('')
const librarySearch = ref('')
const departmentFilter = ref('')
const filterForm = ref({
  dateRange: [],
  status: '',
  location: ''
})

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(200)
const faceLibraryPage = ref(1)
const faceLibraryPageSize = ref(10)

// 对话框控制
const showFaceLibrary = ref(false)
const showSettings = ref(false)
const recordDetailVisible = ref(false)
const selectedRecord = ref(null)
const tableLoading = ref(false)
const settingsActiveTab = ref('basic')

// 选中的人脸数据
const selectedFaces = ref([])

// 告警设置
const alertSettings = ref({
  enableNotification: true,
  notificationMethods: ['email', 'app'],
  recipients: ['admin', 'security']
})

// 设备列表
const deviceList = ref([
  { id: 'CAM001', name: 'A区大门摄像头', location: 'A区大门', type: '人脸识别摄像头', status: 'online' },
  { id: 'CAM002', name: 'B区大门摄像头', location: 'B区大门', type: '人脸识别摄像头', status: 'online' },
  { id: 'CAM003', name: 'C区大门摄像头', location: 'C区大门', type: '人脸识别摄像头', status: 'offline' },
  { id: 'CAM004', name: 'D区大门摄像头', location: 'D区大门', type: '人脸识别摄像头', status: 'online' }
])

// 识别记录
const recognitionRecords = ref([
  {
    name: '张伟',
    identity: '研发部主管',
    location: 'A区大门',
    time: '2024-03-20 10:12:35',
    type: 'success',
    similarity: 96,
    access: true
  },
  {
    name: '未知人员',
    identity: '未登记',
    location: 'B区侧门',
    time: '2024-03-20 10:08:22',
    type: 'warning',
    similarity: 42,
    access: false
  },
  {
    name: '王丽',
    identity: '财务部经理',
    location: 'A区办公楼',
    time: '2024-03-20 09:56:47',
    type: 'success',
    similarity: 98,
    access: true
  },
  {
    name: '刘强',
    identity: '安保人员',
    location: 'C区大厅',
    time: '2024-03-20 09:43:11',
    type: 'success',
    similarity: 95,
    access: true
  },
  {
    name: '陈美',
    identity: '市场部专员',
    location: 'D区会议室',
    time: '2024-03-20 09:32:50',
    type: 'success',
    similarity: 93,
    access: true
  },
  {
    name: '李明',
    identity: '临时访客',
    location: 'A区大门',
    time: '2024-03-20 09:28:15',
    type: 'success',
    similarity: 89,
    access: true
  },
  {
    name: '未知人员',
    identity: '未登记',
    location: 'C区后门',
    time: '2024-03-20 09:17:03',
    type: 'warning',
    similarity: 36,
    access: false
  },
  {
    name: '张红',
    identity: '人事主管',
    location: 'B区办公楼',
    time: '2024-03-20 09:05:42',
    type: 'success',
    similarity: 97,
    access: true
  },
  {
    name: '赵刚',
    identity: '技术总监',
    location: 'A区会议室',
    time: '2024-03-20 08:52:19',
    type: 'success',
    similarity: 99,
    access: true
  },
  {
    name: '未知人员',
    identity: '未登记',
    location: 'D区停车场',
    time: '2024-03-20 08:45:33',
    type: 'warning',
    similarity: 48,
    access: false
  }
])

// 人脸库数据
const faceLibrary = ref([
  {
    name: '张伟',
    identity: '研发部主管',
    department: '研发部',
    phone: '13888888888'
  },
  {
    name: '王丽',
    identity: '财务部经理',
    department: '财务部',
    phone: '13777777777'
  },
  {
    name: '刘强',
    identity: '安保人员',
    department: '安保部',
    phone: '13666666666'
  },
  {
    name: '陈美',
    identity: '市场部专员',
    department: '市场部',
    phone: '13555555555'
  },
  {
    name: '李明',
    identity: '临时访客',
    department: '外部',
    phone: '13444444444'
  },
  {
    name: '张红',
    identity: '人事主管',
    department: '人事部',
    phone: '13333333333'
  },
  {
    name: '赵刚',
    identity: '技术总监',
    department: '研发部',
    phone: '13222222222'
  },
  {
    name: '孙梅',
    identity: '前台接待',
    department: '行政部',
    phone: '13111111111'
  }
])

// 识别设置
const recognitionSettings = ref({
  threshold: 80,
  interval: 3,
  livenessDetection: true,
  mode: '1:N'
})

// 过滤后的人脸库数据
const filteredFaceLibrary = computed(() => {
  let result = [...faceLibrary.value];
  
  if (librarySearch.value) {
    const keyword = librarySearch.value.toLowerCase();
    result = result.filter(item => 
      item.name.toLowerCase().includes(keyword) || 
      item.identity.toLowerCase().includes(keyword) ||
      item.department.toLowerCase().includes(keyword)
    );
  }
  
  if (departmentFilter.value) {
    result = result.filter(item => item.department === departmentFilter.value);
  }
  
  return result;
});

// 处理搜索
const handleSearch = () => {
  // 实际应用中应该请求API
  console.log('搜索关键词:', searchKeyword.value);
}

// 过滤记录
const handleFilter = () => {
  tableLoading.value = true;
  setTimeout(() => {
    tableLoading.value = false;
    ElMessage.success('过滤成功');
  }, 500);
}

// 重置过滤
const resetFilter = () => {
  filterForm.value = {
    dateRange: [],
    status: '',
    location: ''
  };
  handleFilter();
}

// 处理分页
const handleSizeChange = (size) => {
  pageSize.value = size;
  // 实际应用中需要重新加载数据
}

const handleCurrentChange = (page) => {
  currentPage.value = page;
  // 实际应用中需要重新加载数据
}

// 选择表格行
const handleSelectionChange = (selection) => {
  selectedFaces.value = selection;
}

// 添加人脸
const handleAddFace = () => {
  ElMessage.info('打开添加人脸对话框');
}

// 编辑人脸
const handleEditFace = (face) => {
  ElMessage.info(`编辑人脸: ${face.name}`);
}

// 删除人脸
const handleDeleteFace = (face) => {
  ElMessageBox.confirm(
    `确认删除 ${face.name} 的人脸信息吗？`,
    '删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`删除成功: ${face.name}`);
  }).catch(() => {});
}

// 批量删除
const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确认删除选中的 ${selectedFaces.value.length} 条记录吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`成功删除 ${selectedFaces.value.length} 条记录`);
  }).catch(() => {});
}

// 查看记录详情
const handleRecordDetail = (record) => {
  selectedRecord.value = record;
  recordDetailVisible.value = true;
}

// 处理告警记录
const handleWarnRecord = (record) => {
  ElMessageBox.confirm(
    `确认处理未识别人员记录吗？`,
    '处理确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`处理成功`);
  }).catch(() => {});
}

// 删除记录
const handleDeleteRecord = (record) => {
  ElMessageBox.confirm(
    `确认删除该识别记录吗？`,
    '删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success(`删除成功`);
  }).catch(() => {});
}

// 编辑设备
const handleDeviceEdit = (device) => {
  ElMessage.info(`编辑设备: ${device.name}`);
}

// 测试设备
const handleDeviceTest = (device) => {
  ElMessage.success(`设备测试成功: ${device.name}`);
}

// 保存识别设置
const saveSettings = () => {
  ElMessage.success('配置保存成功');
  showSettings.value = false;
}

// 页面加载
onMounted(() => {
  console.log('人脸识别管理页面加载完成');
})
</script>

<style scoped>
.face-recognition {
  padding: 16px;
}

.main-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

/* 统计面板 */
.stat-panel {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
}

.stat-title {
  font-size: 16px;
  font-weight: 500;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.stat-desc {
  width: 100%;
  text-align: center;
}

/* 表格区域 */
.table-section {
  background-color: #fff;
  border-radius: 4px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  margin-bottom: 16px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.search-input {
  width: 240px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

/* 人脸库管理 */
.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 记录详情 */
.record-detail {
  padding: 16px;
}

.detail-images {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.image-container {
  flex: 1;
  text-align: center;
}

.image-container h4 {
  margin: 0 0 10px 0;
}

.image-box {
  border: 1px solid #eee;
  padding: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-input {
    margin-top: 16px;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .stat-panel .el-col {
    margin-bottom: 16px;
  }
}
</style> 