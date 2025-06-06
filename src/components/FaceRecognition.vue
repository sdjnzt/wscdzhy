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
              <el-button type="success" @click="showAccessControl = true">
                <el-icon><Lock /></el-icon>门禁管理
              </el-button>
              <el-button type="warning" @click="showSettings = true">
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
              <el-tag v-if="scope.row.type === 'success' && scope.row.access" :type="scope.row.access ? 'success' : 'danger'">
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

    <!-- 门禁管理对话框 -->
    <el-dialog
      v-model="showAccessControl"
      title="门禁管理"
      width="90%"
      destroy-on-close
      top="5vh"
    >
      <el-tabs v-model="accessControlActiveTab">
        <el-tab-pane label="门禁点管理" name="gates">
          <!-- 门禁统计卡片 -->
          <el-row :gutter="20" class="dashboard-cards">
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><Lock /></el-icon>
                    <span>门禁总数</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">{{ gatesList.length }}</div>
                  <div class="stat-desc">
                    <el-tag size="small" type="success">{{ getActiveGatesCount() }}个启用</el-tag>
                    <el-tag size="small" type="danger" style="margin-left: 5px">{{ getInactiveGatesCount() }}个禁用</el-tag>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><User /></el-icon>
                    <span>今日通行</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">387</div>
                  <div class="stat-desc">
                    <div class="progress-container">
                      <div class="progress-label">同比增长 12.5%</div>
                      <el-progress :percentage="73" :color="'#409EFF'" :show-text="false"></el-progress>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><Warning /></el-icon>
                    <span>拒绝记录</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">42</div>
                  <div class="stat-desc">
                    <div class="progress-container">
                      <div class="progress-label">占比 10.8%</div>
                      <el-progress :percentage="10.8" :color="'#E6A23C'" :show-text="false"></el-progress>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><InfoFilled /></el-icon>
                    <span>权限规则</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">{{ accessRules.length }}</div>
                  <div class="stat-desc">
                    <el-button type="primary" link @click="accessControlActiveTab = 'rules'">管理规则</el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <div class="operation-bar">
            <div class="left-actions">
              <el-button type="primary" @click="handleAddGate">
                <el-icon><Plus /></el-icon>添加门禁点
              </el-button>
              <el-button type="danger" :disabled="!selectedGates.length" @click="handleBatchDeleteGates">
                <el-icon><Delete /></el-icon>批量删除
              </el-button>
            </div>
            <div class="right-search">
              <el-input
                v-model="gateSearchKeyword"
                placeholder="搜索门禁名称/位置"
                prefix-icon="Search"
                clearable
                style="width: 250px"
              />
              <el-select v-model="gateStatusFilter" placeholder="状态筛选" style="width: 120px; margin-left: 10px">
                <el-option label="全部" value="" />
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
              <el-select v-model="gateAreaFilter" placeholder="区域筛选" style="width: 120px; margin-left: 10px">
                <el-option label="全部区域" value="" />
                <el-option label="A区" value="A区" />
                <el-option label="B区" value="B区" />
                <el-option label="C区" value="C区" />
                <el-option label="D区" value="D区" />
                <el-option label="E区" value="E区" />
              </el-select>
            </div>
          </div>
          
          <el-table
            :data="filteredGatesList"
            style="width: 100%; margin-top: 15px"
            border
            stripe
            @selection-change="handleGateSelectionChange"
            v-loading="gatesLoading"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="门禁ID" width="100" />
            <el-table-column prop="name" label="门禁名称" width="150" />
            <el-table-column prop="location" label="位置" width="150" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="scope">
                <el-tag :type="getGateTypeTag(scope.row.type)">
                  {{ scope.row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deviceId" label="关联设备" width="120" />
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                  {{ scope.row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastMaintenance" label="最近维护" width="150" />
            <el-table-column label="今日通行" width="100">
              <template #default="scope">
                {{ scope.row.todayAccessCount || 0 }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="310">
              <template #default="scope">
                <el-button-group>
                  <el-button type="primary" size="small" @click="handleEditGate(scope.row)">
                    <el-icon><Edit /></el-icon>编辑
                  </el-button>
                  <el-button 
                    :type="scope.row.status === 'active' ? 'danger' : 'success'" 
                    size="small" 
                    @click="handleToggleGateStatus(scope.row)">
                    {{ scope.row.status === 'active' ? '禁用' : '启用' }}
                  </el-button>
                  <el-button type="warning" size="small" @click="handleGatePermission(scope.row)">
                    <el-icon><Setting /></el-icon>权限配置
                  </el-button>
                  <el-button type="info" size="small" @click="handleGateLog(scope.row)">
                    <el-icon><InfoFilled /></el-icon>访问记录
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container" style="margin-top: 20px">
            <el-pagination
              v-model:current-page="gatesPage"
              v-model:page-size="gatesPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredGatesList.length"
            />
          </div>

          <el-divider content-position="center">门禁分布</el-divider>

          <!-- 门禁分布图表 -->
          <div class="gates-chart-container">
            <div id="gates-distribution-chart" style="height: 300px; width: 100%"></div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="权限规则" name="rules">
          <!-- 权限规则统计卡片 -->
          <el-row :gutter="20" class="dashboard-cards">
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><Document /></el-icon>
                    <span>规则总数</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">{{ accessRules.length }}</div>
                  <div class="stat-desc">
                    <el-tag size="small" type="success">{{ getActiveRulesCount() }}个启用</el-tag>
                    <el-tag size="small" type="danger" style="margin-left: 5px">{{ getInactiveRulesCount() }}个禁用</el-tag>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><OfficeBuilding /></el-icon>
                    <span>部门规则</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">{{ getDepartmentRulesCount() }}</div>
                  <div class="stat-desc">
                    <div class="progress-container">
                      <div class="progress-label">占比 {{ Math.round(getDepartmentRulesCount() / accessRules.length * 100) }}%</div>
                      <el-progress :percentage="getDepartmentRulesCount() / accessRules.length * 100" :color="'#409EFF'" :show-text="false"></el-progress>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><User /></el-icon>
                    <span>个人规则</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">{{ getPersonRulesCount() }}</div>
                  <div class="stat-desc">
                    <div class="progress-container">
                      <div class="progress-label">占比 {{ Math.round(getPersonRulesCount() / accessRules.length * 100) }}%</div>
                      <el-progress :percentage="getPersonRulesCount() / accessRules.length * 100" :color="'#67C23A'" :show-text="false"></el-progress>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><Timer /></el-icon>
                    <span>时间规则</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">{{ getTimeRulesCount() }}</div>
                  <div class="stat-desc">
                    <div class="progress-container">
                      <div class="progress-label">占比 {{ Math.round(getTimeRulesCount() / accessRules.length * 100) }}%</div>
                      <el-progress :percentage="getTimeRulesCount() / accessRules.length * 100" :color="'#E6A23C'" :show-text="false"></el-progress>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <div class="operation-bar">
            <div class="left-actions">
              <el-button type="primary" @click="handleAddRule">
                <el-icon><Plus /></el-icon>添加规则
              </el-button>
              <el-button type="danger" :disabled="!selectedRules.length" @click="handleBatchDeleteRules">
                <el-icon><Delete /></el-icon>批量删除
              </el-button>
            </div>
            <div class="right-search">
              <el-input
                v-model="ruleSearchKeyword"
                placeholder="搜索规则名称/对象"
                prefix-icon="Search"
                clearable
                style="width: 250px"
              />
              <el-select v-model="ruleTypeFilter" placeholder="规则类型" style="width: 120px; margin-left: 10px">
                <el-option label="全部规则" value="" />
                <el-option label="部门规则" value="department" />
                <el-option label="个人规则" value="person" />
                <el-option label="时间规则" value="time" />
              </el-select>
              <el-select v-model="ruleStatusFilter" placeholder="状态" style="width: 120px; margin-left: 10px">
                <el-option label="全部" value="" />
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </div>
          </div>
          
          <el-table
            :data="filteredRules"
            style="width: 100%; margin-top: 15px"
            border
            stripe
            @selection-change="handleRuleSelectionChange"
            v-loading="rulesLoading"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="规则ID" width="70" />
            <el-table-column prop="name" label="规则名称" width="180" />
            <el-table-column prop="type" label="规则类型" width="100">
              <template #default="scope">
                <el-tag :type="getTagType(scope.row.type)">
                  {{ getRuleTypeText(scope.row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="target" label="适用对象" width="150" />
            <el-table-column prop="gates" label="适用门禁" width="180" />
            <el-table-column prop="timeRange" label="时间范围" width="150" />
            <el-table-column prop="priority" label="优先级" width="80">
              <template #default="scope">
                <el-tag type="info" size="small">{{ scope.row.priority }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                  {{ scope.row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="150" />
            <el-table-column label="操作" width="210">
              <template #default="scope">
                <el-button-group>
                  <el-button type="primary" size="small" @click="handleEditRule(scope.row)">
                    <el-icon><Edit /></el-icon>编辑
                  </el-button>
                  <el-button 
                    :type="scope.row.status === 'active' ? 'danger' : 'success'" 
                    size="small" 
                    @click="handleToggleRuleStatus(scope.row)">
                    {{ scope.row.status === 'active' ? '禁用' : '启用' }}
                  </el-button>
                  <el-button type="danger" size="small" @click="handleDeleteRule(scope.row)">
                    <el-icon><Delete /></el-icon>删除
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container" style="margin-top: 20px">
            <el-pagination
              v-model:current-page="rulesPage"
              v-model:page-size="rulesPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredRules.length"
            />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="访问记录" name="logs">
          <!-- 访问记录统计卡片 -->
          <el-row :gutter="20" class="dashboard-cards">
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><Monitor /></el-icon>
                    <span>今日总通行</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">387</div>
                  <div class="stat-desc">
                    <el-tag size="small" type="success">允许 345</el-tag>
                    <el-tag size="small" type="danger" style="margin-left: 5px">拒绝 42</el-tag>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><TopRight /></el-icon>
                    <span>高峰时段</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">08:00-09:30</div>
                  <div class="stat-desc">
                    <div class="progress-container">
                      <div class="progress-label">占比 36.2%</div>
                      <el-progress :percentage="36.2" :color="'#409EFF'" :show-text="false"></el-progress>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><ArrowRight /></el-icon>
                    <span>通行率</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">89.2%</div>
                  <div class="stat-desc">
                    <div class="progress-container">
                      <div class="progress-label">较昨日 +1.3%</div>
                      <el-progress :percentage="89.2" :color="'#67C23A'" :show-text="false"></el-progress>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <template #header>
                  <div class="stat-title">
                    <el-icon><Aim /></el-icon>
                    <span>异常识别</span>
                  </div>
                </template>
                <div class="stat-content">
                  <div class="stat-value">18</div>
                  <div class="stat-desc">
                    <el-button type="danger" link @click="handleAbnormalAccess">查看异常</el-button>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <div class="filter-bar">
            <el-form :inline="true" :model="accessLogFilter" class="filter-form">
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="accessLogFilter.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  shortcuts
                />
              </el-form-item>
              <el-form-item label="门禁点">
                <el-select v-model="accessLogFilter.gate" placeholder="全部" filterable>
                  <el-option label="全部" value="" />
                  <el-option 
                    v-for="gate in gatesList" 
                    :key="gate.id" 
                    :label="gate.name" 
                    :value="gate.id" 
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="结果">
                <el-select v-model="accessLogFilter.result" placeholder="全部">
                  <el-option label="全部" value="" />
                  <el-option label="允许" value="allow" />
                  <el-option label="拒绝" value="deny" />
                </el-select>
              </el-form-item>
              <el-form-item label="人员">
                <el-input 
                  v-model="accessLogFilter.person" 
                  placeholder="搜索姓名"
                  clearable
                  style="width: 120px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleFilterAccessLogs">查询</el-button>
                <el-button @click="resetAccessLogFilter">重置</el-button>
                <el-button type="success" @click="exportAccessLogs">
                  <el-icon><Download /></el-icon>导出
                </el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <el-table
            :data="filteredAccessLogs"
            style="width: 100%"
            border
            stripe
            v-loading="logsLoading"
            max-height="450px"
          >
            <el-table-column type="index" width="60" />
            <el-table-column prop="time" label="访问时间" width="160" sortable />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="department" label="部门" width="100" />
            <el-table-column prop="gateName" label="门禁点" width="130" />
            <el-table-column prop="direction" label="方向" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.direction === '进入' ? 'success' : 'info'">
                  {{ scope.row.direction }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="结果" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.result === 'allow' ? 'success' : 'danger'">
                  {{ scope.row.result === 'allow' ? '允许' : '拒绝' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="原因" min-width="180" />
            <el-table-column prop="verifyType" label="验证方式" width="100">
              <template #default="scope">
                <el-tag type="info">{{ scope.row.verifyType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" @click="handleLogDetail(scope.row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container" style="margin-top: 20px">
            <el-pagination
              v-model:current-page="accessLogPage"
              v-model:page-size="accessLogPageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredAccessLogs.length"
            />
          </div>

          <!-- 图表区域 -->
          <el-divider content-position="center">今日通行趋势</el-divider>

          <div class="logs-chart-container">
            <div id="access-trend-chart" style="height: 300px; width: 100%"></div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="紧急控制" name="emergency">
          <el-row :gutter="20" class="dashboard-cards">
            <el-col :span="24">
              <el-card class="emergency-status-card">
                <template #header>
                  <div class="emergency-status-header">
                    <h4>当前系统状态</h4>
                    <el-tag :type="emergencyStatus === 'normal' ? 'success' : 'danger'" size="large">
                      {{ getEmergencyStatusText() }}
                    </el-tag>
                  </div>
                </template>
                <div class="emergency-status-content">
                  <div class="status-detail">
                    <div class="detail-item">
                      <span class="label">模式:</span>
                      <span class="value">{{ emergencyStatus === 'normal' ? '正常运行' : emergencyStatus === 'unlock' ? '全部解锁' : '全部锁定' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">启动时间:</span>
                      <span class="value">{{ emergencyStartTime || '-' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">启动人员:</span>
                      <span class="value">{{ emergencyOperator || '-' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">原因:</span>
                      <span class="value">{{ emergencyReason || '-' }}</span>
                    </div>
                  </div>
                  <el-progress
                    :percentage="emergencyStatus === 'normal' ? 100 : 0"
                    :status="emergencyStatus === 'normal' ? 'success' : 'exception'"
                    :stroke-width="20"
                    :show-text="false"
                  ></el-progress>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-card class="emergency-card warning-card">
            <template #header>
              <div class="emergency-header">
                <h4><el-icon><WarningFilled /></el-icon> 紧急控制面板</h4>
              </div>
            </template>
            <div class="emergency-content">
              <div class="emergency-warning">
                <p>警告：紧急控制功能将覆盖所有门禁常规设置，请谨慎操作！</p>
              </div>
              <div class="emergency-actions">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-card class="emergency-action-card" :class="{ 'active-card': emergencyStatus === 'unlock' }">
                      <h5>全部开启</h5>
                      <p>紧急情况下解锁所有门禁</p>
                      <el-button 
                        type="success" 
                        @click="handleEmergencyUnlock" 
                        :disabled="emergencyStatus === 'unlock'"
                      >
                        <el-icon><Unlock /></el-icon> 全部解锁
                      </el-button>
                    </el-card>
                  </el-col>
                  <el-col :span="8">
                    <el-card class="emergency-action-card" :class="{ 'active-card': emergencyStatus === 'lock' }">
                      <h5>全部锁定</h5>
                      <p>紧急情况下锁定所有门禁</p>
                      <el-button 
                        type="danger" 
                        @click="handleEmergencyLock" 
                        :disabled="emergencyStatus === 'lock'"
                      >
                        <el-icon><Lock /></el-icon> 全部锁定
                      </el-button>
                    </el-card>
                  </el-col>
                  <el-col :span="8">
                    <el-card class="emergency-action-card" :class="{ 'active-card': emergencyStatus === 'normal' }">
                      <h5>恢复正常</h5>
                      <p>恢复门禁系统到正常状态</p>
                      <el-button 
                        type="primary" 
                        @click="handleEmergencyReset" 
                        :disabled="emergencyStatus === 'normal'"
                      >
                        <el-icon><RefreshRight /></el-icon> 恢复正常
                      </el-button>
                    </el-card>
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-card>
          
          <el-card style="margin-top: 20px">
            <template #header>
              <div class="logs-header">
                <h4>紧急操作记录</h4>
                <div class="logs-actions">
                  <el-button size="small" type="primary" @click="refreshEmergencyLogs">
                    <el-icon><RefreshLeft /></el-icon> 刷新
                  </el-button>
                  <el-button size="small" type="success" @click="exportEmergencyLogs">
                    <el-icon><Download /></el-icon> 导出
                  </el-button>
                </div>
              </div>
            </template>
            <el-table
              :data="emergencyLogs"
              style="width: 100%"
              border
              stripe
              v-loading="emergencyLogsLoading"
            >
              <el-table-column prop="time" label="操作时间" width="180" sortable />
              <el-table-column prop="operator" label="操作人" width="120" />
              <el-table-column prop="action" label="操作类型" width="150">
                <template #default="scope">
                  <el-tag :type="getEmergencyTagType(scope.row.action)">
                    {{ scope.row.action }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="reason" label="操作原因" min-width="200" />
              <el-table-column prop="affectedGates" label="影响门禁" width="120">
                <template #default="scope">
                  {{ scope.row.affectedGates || '全部' }}
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="持续时间" width="120" />
            </el-table>
            <div class="pagination-container" style="margin-top: 20px">
              <el-pagination
                v-model:current-page="emergencyLogsPage"
                v-model:page-size="emergencyLogsPageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="emergencyLogs.length"
              />
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
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
  Warning,
  Lock,
  Unlock,
  Plus,
  WarningFilled,
  RefreshRight,
  Document,
  OfficeBuilding,
  Timer,
  TopRight,
  ArrowRight,
  Aim,
  Download,
  RefreshLeft
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
const showAccessControl = ref(false)
const recordDetailVisible = ref(false)
const selectedRecord = ref(null)
const tableLoading = ref(false)
const settingsActiveTab = ref('basic')
const accessControlActiveTab = ref('gates')

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

// 门禁管理相关变量
const gateSearchKeyword = ref('')
const gateStatusFilter = ref('')
const gateAreaFilter = ref('')
const selectedGates = ref([])
const gatesLoading = ref(false)
const gatesPage = ref(1)
const gatesPageSize = ref(10)

// 门禁管理
const gatesList = ref([
  { id: 'GATE001', name: 'A区大门', location: 'A区入口', type: '门禁闸机', deviceId: 'CAM001', status: 'active', lastMaintenance: '2024-03-15', todayAccessCount: 86 },
  { id: 'GATE002', name: 'B区大门', location: 'B区入口', type: '门禁闸机', deviceId: 'CAM002', status: 'active', lastMaintenance: '2024-03-10', todayAccessCount: 64 },
  { id: 'GATE003', name: 'C区大门', location: 'C区入口', type: '门禁闸机', deviceId: 'CAM003', status: 'inactive', lastMaintenance: '2024-03-08', todayAccessCount: 0 },
  { id: 'GATE004', name: 'D区大门', location: 'D区入口', type: '门禁闸机', deviceId: 'CAM004', status: 'active', lastMaintenance: '2024-03-12', todayAccessCount: 52 },
  { id: 'GATE005', name: '研发部门', location: 'A区2楼', type: '智能门锁', deviceId: '', status: 'active', lastMaintenance: '2024-03-14', todayAccessCount: 37 },
  { id: 'GATE006', name: '财务部门', location: 'B区1楼', type: '智能门锁', deviceId: '', status: 'active', lastMaintenance: '2024-03-16', todayAccessCount: 23 },
  { id: 'GATE007', name: '机房', location: 'C区地下室', type: '人脸门禁', deviceId: '', status: 'active', lastMaintenance: '2024-03-18', todayAccessCount: 12 },
  { id: 'GATE008', name: '会议室A', location: 'A区1楼', type: '智能门锁', deviceId: '', status: 'active', lastMaintenance: '2024-03-17', todayAccessCount: 28 },
  { id: 'GATE009', name: '会议室B', location: 'B区2楼', type: '智能门锁', deviceId: '', status: 'active', lastMaintenance: '2024-03-16', todayAccessCount: 15 },
  { id: 'GATE010', name: '食堂', location: 'D区1楼', type: '门禁闸机', deviceId: '', status: 'active', lastMaintenance: '2024-03-14', todayAccessCount: 95 },
  { id: 'GATE011', name: '档案室', location: 'B区地下室', type: '人脸门禁', deviceId: '', status: 'active', lastMaintenance: '2024-03-13', todayAccessCount: 8 },
  { id: 'GATE012', name: '实验室', location: 'C区3楼', type: '指纹门禁', deviceId: '', status: 'active', lastMaintenance: '2025-05-12', todayAccessCount: 14 },
  { id: 'GATE013', name: '总经理办公室', location: 'A区3楼', type: '人脸门禁', deviceId: '', status: 'active', lastMaintenance: '2025-05-15', todayAccessCount: 6 },
  { id: 'GATE014', name: '停车场入口', location: 'E区地面', type: '车牌识别', deviceId: '', status: 'active', lastMaintenance: '2025-05-10', todayAccessCount: 78 },
  { id: 'GATE015', name: '停车场出口', location: 'E区地面', type: '车牌识别', deviceId: '', status: 'active', lastMaintenance: '2025-05-10', todayAccessCount: 72 },
  { id: 'GATE016', name: '仓库A', location: 'D区地下室', type: '智能门锁', deviceId: '', status: 'inactive', lastMaintenance: '2025-05-25', todayAccessCount: 0 },
  { id: 'GATE017', name: '仓库B', location: 'D区地下室', type: '智能门锁', deviceId: '', status: 'active', lastMaintenance: '2025-05-20', todayAccessCount: 9 },
  { id: 'GATE018', name: '楼顶天台', location: 'A区顶层', type: '指纹门禁', deviceId: '', status: 'inactive', lastMaintenance: '2025-05-15', todayAccessCount: 0 },
])

// 权限规则相关变量
const ruleSearchKeyword = ref('')
const ruleStatusFilter = ref('')
const selectedRules = ref([])
const rulesLoading = ref(false)
const rulesPage = ref(1)
const rulesPageSize = ref(10)

// 访问日志相关变量
const accessLogFilter = ref({
  dateRange: [],
  gate: '',
  result: ''
})
const accessLogPage = ref(1)
const accessLogPageSize = ref(10)

// 访问日志
const accessLogs = ref([
  { 
    id: 1,
    time: '2024-03-20 08:45:22', 
    name: '张伟', 
    gateName: 'A区大门',
    gateId: 'GATE001', 
    department: '研发部',
    result: 'allow',
    reason: '符合部门通行规则',
    direction: '进入',
    verifyType: '人脸识别'
  },
  { 
    id: 2,
    time: '2024-03-20 08:50:15', 
    name: '王丽', 
    gateName: 'B区大门', 
    gateId: 'GATE002',
    department: '财务部',
    result: 'allow',
    reason: '符合部门通行规则',
    direction: '进入',
    verifyType: '人脸识别'
  },
  { 
    id: 3,
    time: '2024-03-20 09:05:30', 
    name: '未知人员', 
    gateName: 'C区大门', 
    gateId: 'GATE003',
    department: '-',
    result: 'deny',
    reason: '未识别身份',
    direction: '进入',
    verifyType: '人脸识别'
  },
  { 
    id: 4,
    time: '2024-03-20 09:12:45', 
    name: '刘强', 
    gateName: 'A区大门', 
    gateId: 'GATE001',
    department: '安保部',
    result: 'allow',
    reason: '符合安保人员通行规则',
    direction: '进入',
    verifyType: '人脸识别'
  },
  { 
    id: 5,
    time: '2024-03-20 09:30:18', 
    name: '李明', 
    gateName: 'A区大门', 
    gateId: 'GATE001',
    department: '外部',
    result: 'allow',
    reason: '符合访客通行规则',
    direction: '进入',
    verifyType: '人脸识别'
  },
  { 
    id: 6,
    time: '2024-03-20 10:15:06', 
    name: '赵刚', 
    gateName: '机房', 
    gateId: 'GATE007',
    department: '研发部',
    result: 'allow',
    reason: '符合管理层特权规则',
    direction: '进入',
    verifyType: '人脸识别'
  },
  { 
    id: 7,
    time: '2024-03-20 11:35:29', 
    name: '陈美', 
    gateName: '研发部门', 
    gateId: 'GATE005',
    department: '市场部',
    result: 'deny',
    reason: '不符合门禁权限规则',
    direction: '进入',
    verifyType: '人脸识别'
  },
  { 
    id: 8,
    time: '2025-05-20 14:22:10', 
    name: '张红', 
    gateName: 'B区大门', 
    gateId: 'GATE002',
    department: '人事部',
    result: 'deny',
    reason: '无权限访问此区域',
    direction: '进入',
    verifyType: '人脸识别'
  },
])

// 紧急操作记录
const emergencyLogs = ref([
  {
    id: 1,
    time: '2025-05-15 14:30:22',
    operator: '系统管理员',
    action: '全部解锁',
    reason: '消防演习',
    duration: '30分钟',
    affectedGates: '全部'
  },
  {
    id: 2,
    time: '2025-05-10 10:15:47',
    operator: '安保主管',
    action: '全部锁定',
    reason: '安全事件演练',
    duration: '45分钟',
    affectedGates: '全部'
  },
  {
    id: 3,
    time: '2025-05-05 08:20:33',
    operator: '系统管理员',
    action: '恢复正常',
    reason: '演习结束',
    duration: '-',
    affectedGates: '全部'
  },
  {
    id: 4,
    time: '2025-05-01 15:45:12',
    operator: '李主管',
    action: '全部解锁',
    reason: '紧急疏散演练',
    duration: '25分钟',
    affectedGates: '全部'
  },
  {
    id: 5,
    time: '2025-05-01 09:30:55',
    operator: '张经理',
    action: '部分锁定',
    reason: '区域隔离测试',
    duration: '60分钟',
    affectedGates: 'A区, B区'
  },
  {
    id: 6,
    time: '2025-05-01 16:20:18',
    operator: '系统管理员',
    action: '恢复正常',
    reason: '测试完成',
    duration: '-',
    affectedGates: '全部'
  }
])

// 紧急控制相关变量
const emergencyStatus = ref('normal') // 'normal', 'unlock', 'lock'
const emergencyStartTime = ref('')
const emergencyOperator = ref('')
const emergencyReason = ref('')
const emergencyLogsLoading = ref(false)
const emergencyLogsPage = ref(1)
const emergencyLogsPageSize = ref(10)

// 访问日志过滤计算属性
const filteredAccessLogs = computed(() => {
  let result = [...accessLogs.value];
  
  if (accessLogFilter.value.person) {
    const keyword = accessLogFilter.value.person.toLowerCase();
    result = result.filter(log => log.name.toLowerCase().includes(keyword));
  }
  
  if (accessLogFilter.value.gate) {
    result = result.filter(log => log.gateId === accessLogFilter.value.gate);
  }
  
  if (accessLogFilter.value.result) {
    result = result.filter(log => log.result === accessLogFilter.value.result);
  }
  
  return result;
});

// 获取紧急状态文本
const getEmergencyStatusText = () => {
  const statusTexts = {
    'normal': '正常运行',
    'unlock': '紧急解锁模式',
    'lock': '紧急锁定模式'
  };
  return statusTexts[emergencyStatus.value] || '未知状态';
}

// 刷新紧急日志
const refreshEmergencyLogs = () => {
  emergencyLogsLoading.value = true;
  setTimeout(() => {
    emergencyLogsLoading.value = false;
    ElMessage.success('紧急操作记录已刷新');
  }, 500);
}

// 导出紧急日志
const exportEmergencyLogs = () => {
  ElMessage.success('紧急操作记录导出成功');
  // 实际应用中应该调用API导出数据
}

// 处理紧急控制
const handleEmergencyUnlock = () => {
  ElMessageBox.confirm(
    '确认执行紧急解锁操作吗？此操作将解锁所有门禁！',
    '紧急控制确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessageBox.prompt('请输入紧急解锁原因', '操作原因', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    }).then(({ value }) => {
      emergencyStatus.value = 'unlock';
      emergencyStartTime.value = new Date().toLocaleString();
      emergencyOperator.value = '当前用户';
      emergencyReason.value = value;
      ElMessage.success('已执行紧急解锁操作');
      // 实际应用中应该调用API并记录日志
    }).catch(() => {})
  }).catch(() => {})
}

const handleEmergencyLock = () => {
  ElMessageBox.confirm(
    '确认执行紧急锁定操作吗？此操作将锁定所有门禁！',
    '紧急控制确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    ElMessageBox.prompt('请输入紧急锁定原因', '操作原因', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    }).then(({ value }) => {
      emergencyStatus.value = 'lock';
      emergencyStartTime.value = new Date().toLocaleString();
      emergencyOperator.value = '当前用户';
      emergencyReason.value = value;
      ElMessage.success('已执行紧急锁定操作');
      // 实际应用中应该调用API并记录日志
    }).catch(() => {})
  }).catch(() => {})
}

const handleEmergencyReset = () => {
  ElMessageBox.confirm(
    '确认恢复门禁系统到正常状态吗？',
    '操作确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    emergencyStatus.value = 'normal';
    emergencyStartTime.value = '';
    emergencyOperator.value = '';
    emergencyReason.value = '';
    ElMessage.success('门禁系统已恢复正常状态');
    // 实际应用中应该调用API并记录日志
  }).catch(() => {})
}

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

// 过滤门禁列表
const filteredGatesList = computed(() => {
  let result = [...gatesList.value];
  
  if (gateSearchKeyword.value) {
    const keyword = gateSearchKeyword.value.toLowerCase();
    result = result.filter(gate => 
      gate.name.toLowerCase().includes(keyword) || 
      gate.location.toLowerCase().includes(keyword)
    );
  }
  
  if (gateStatusFilter.value) {
    result = result.filter(gate => gate.status === gateStatusFilter.value);
  }
  
  if (gateAreaFilter.value) {
    result = result.filter(gate => gate.location.includes(gateAreaFilter.value));
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

// 处理门禁点相关操作
const handleAddGate = () => {
  ElMessage.info('打开添加门禁点对话框')
}

const handleEditGate = (gate) => {
  ElMessage.info(`编辑门禁点: ${gate.name}`)
}

const handleToggleGateStatus = (gate) => {
  const newStatus = gate.status === 'active' ? 'inactive' : 'active'
  ElMessageBox.confirm(
    `确认${newStatus === 'active' ? '启用' : '禁用'}门禁点 "${gate.name}" 吗？`,
    '状态变更确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    gate.status = newStatus
    ElMessage.success(`门禁点"${gate.name}"已${newStatus === 'active' ? '启用' : '禁用'}`)
  }).catch(() => {})
}

const handleGatePermission = (gate) => {
  ElMessage.info(`配置门禁点权限: ${gate.name}`)
}

const handleGateLog = (gate) => {
  ElMessage.info(`查看门禁点访问记录: ${gate.name}`)
  accessControlActiveTab.value = 'logs'
  accessLogFilter.value.gate = gate.id
  handleFilterAccessLogs()
}

// 处理规则相关操作
const handleAddRule = () => {
  ElMessage.info('打开添加规则对话框')
}

const handleEditRule = (rule) => {
  ElMessage.info(`编辑规则: ${rule.name}`)
}

const handleToggleRuleStatus = (rule) => {
  const newStatus = rule.status === 'active' ? 'inactive' : 'active'
  ElMessageBox.confirm(
    `确认${newStatus === 'active' ? '启用' : '禁用'}规则 "${rule.name}" 吗？`,
    '状态变更确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    rule.status = newStatus
    ElMessage.success(`规则"${rule.name}"已${newStatus === 'active' ? '启用' : '禁用'}`)
  }).catch(() => {})
}

const handleDeleteRule = (rule) => {
  ElMessageBox.confirm(
    `确认删除规则 "${rule.name}" 吗？此操作不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    ElMessage.success(`规则"${rule.name}"已删除`)
    // 实际应用中应该从数组中删除并调用API
  }).catch(() => {})
}

// 处理访问日志过滤
const handleFilterAccessLogs = () => {
  ElMessage.success('访问记录过滤成功')
  // 实际应用中应该根据过滤条件请求API
}

const resetAccessLogFilter = () => {
  accessLogFilter.value = {
    dateRange: [],
    gate: '',
    result: ''
  }
  handleFilterAccessLogs()
}

// 辅助函数
const getTagType = (type) => {
  const types = {
    'department': 'primary',
    'person': 'success',
    'time': 'warning'
  }
  return types[type] || 'info'
}

const getRuleTypeText = (type) => {
  const texts = {
    'department': '部门规则',
    'person': '个人规则',
    'time': '时间规则'
  }
  return texts[type] || '未知规则'
}

const getEmergencyTagType = (action) => {
  if (action === '全部解锁') return 'success'
  if (action === '全部锁定') return 'danger'
  if (action === '恢复正常') return 'info'
  return 'warning'
}

// 获取启用门禁数量
const getActiveGatesCount = () => {
  return gatesList.value.filter(gate => gate.status === 'active').length;
}

// 获取禁用门禁数量
const getInactiveGatesCount = () => {
  return gatesList.value.filter(gate => gate.status === 'inactive').length;
}

// 处理门禁选择
const handleGateSelectionChange = (selection) => {
  selectedGates.value = selection;
}

// 处理批量删除门禁
const handleBatchDeleteGates = () => {
  if (selectedGates.value.length === 0) return;
  
  ElMessageBox.confirm(
    `确认删除选中的 ${selectedGates.value.length} 个门禁点吗？此操作不可恢复！`,
    '批量删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 实际应用中应该调用API删除数据
    ElMessage.success(`成功删除 ${selectedGates.value.length} 个门禁点`);
    selectedGates.value = [];
  }).catch(() => {});
}

// 获取门禁类型对应的标签类型
const getGateTypeTag = (type) => {
  const types = {
    '门禁闸机': 'primary',
    '智能门锁': 'success',
    '人脸门禁': 'warning',
    '指纹门禁': 'info',
    '车牌识别': 'danger'
  };
  return types[type] || 'info';
}

// 初始化门禁分布图表
const initGatesDistributionChart = () => {
  // 实际应用中应该引入并使用echarts
  console.log('初始化门禁分布图表');
}

// 权限规则相关变量
const ruleTypeFilter = ref('')
const filteredRules = computed(() => {
  let result = [...accessRules.value];
  
  if (ruleSearchKeyword.value) {
    const keyword = ruleSearchKeyword.value.toLowerCase();
    result = result.filter(rule => 
      rule.name.toLowerCase().includes(keyword) || 
      rule.target.toLowerCase().includes(keyword)
    );
  }
  
  if (ruleTypeFilter.value) {
    result = result.filter(rule => rule.type === ruleTypeFilter.value);
  }
  
  if (ruleStatusFilter.value) {
    result = result.filter(rule => rule.status === ruleStatusFilter.value);
  }
  
  return result;
});

// 处理规则选择
const handleRuleSelectionChange = (selection) => {
  selectedRules.value = selection;
}

// 处理批量删除规则
const handleBatchDeleteRules = () => {
  if (selectedRules.value.length === 0) return;
  
  ElMessageBox.confirm(
    `确认删除选中的 ${selectedRules.value.length} 条规则吗？此操作不可恢复！`,
    '批量删除确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 实际应用中应该调用API删除数据
    ElMessage.success(`成功删除 ${selectedRules.value.length} 条规则`);
    selectedRules.value = [];
  }).catch(() => {});
}

// 页面加载
onMounted(() => {
  console.log('人脸识别管理页面加载完成');
  
  // 延迟加载图表，确保DOM已经渲染
  setTimeout(() => {
    initGatesDistributionChart();
  }, 500);
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

/* 紧急控制样式 */
.emergency-card {
  margin-bottom: 20px;
}

.warning-card {
  border: 1px solid #e6a23c;
}

.emergency-header {
  display: flex;
  align-items: center;
}

.emergency-header h4 {
  margin: 0;
  color: #e6a23c;
  display: flex;
  align-items: center;
}

.emergency-header h4 .el-icon {
  margin-right: 8px;
}

.emergency-warning {
  background-color: #fdf6ec;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  border-left: 4px solid #e6a23c;
}

.emergency-warning p {
  margin: 0;
  color: #e6a23c;
}

.emergency-action-card {
  text-align: center;
  height: 100%;
}

.emergency-action-card h5 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

.emergency-action-card p {
  margin-bottom: 20px;
  color: #606266;
  font-size: 14px;
}

.emergency-action-card .el-button {
  width: 100%;
}

/* 门禁管理样式 */
.dashboard-cards {
  margin-bottom: 20px;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.left-actions, .right-search {
  display: flex;
  align-items: center;
}

.gates-chart-container {
  margin-top: 20px;
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.stat-title .el-icon {
  margin-right: 8px;
}

.progress-container {
  width: 100%;
}

.progress-label {
  margin-bottom: 5px;
  font-size: 12px;
  color: #606266;
}

/* 图表容器 */
.logs-chart-container {
  margin-top: 20px;
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 紧急控制样式增强 */
.emergency-status-card {
  margin-bottom: 20px;
  border-color: #409EFF;
}

.emergency-status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.emergency-status-header h4 {
  margin: 0;
  font-size: 16px;
}

.emergency-status-content {
  padding: 10px 0;
}

.status-detail {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.detail-item {
  margin-right: 30px;
  margin-bottom: 10px;
}

.detail-item .label {
  font-weight: bold;
  margin-right: 8px;
  color: #606266;
}

.detail-item .value {
  color: #303133;
}

.active-card {
  border-color: #409EFF;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logs-header h4 {
  margin: 0;
  font-size: 16px;
}

.logs-actions {
  display: flex;
  gap: 10px;
}
</style> 