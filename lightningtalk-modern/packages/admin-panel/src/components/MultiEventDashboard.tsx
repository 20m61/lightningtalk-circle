/**
 * Multi-Event Management Dashboard
 * 複数イベント管理のReact管理画面
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Badge,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  Group,
  Assessment,
  Settings,
  Notifications,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useApi } from '../hooks/useApi';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { EventConflictResolver } from './EventConflictResolver';
import { ResourceManager } from './ResourceManager';
import { ParticipantAnalyzer } from './ParticipantAnalyzer';

interface MultiEventDashboardProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

interface DashboardData {
  timestamp: string;
  refreshInterval: number;
  overview: {
    activeEvents: number;
    concurrentGroups: number;
    totalConflicts: number;
    crossEventParticipants: number;
  };
  metrics: {
    eventUtilization: number;
    resourceEfficiency: number;
    participantSatisfaction: number;
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    action?: string;
  }>;
  recommendations: Array<{
    type: 'optimization' | 'insight' | 'action';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export const MultiEventDashboard: React.FC<MultiEventDashboardProps> = ({
  refreshInterval = 30,
  autoRefresh = true
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [isAutoRefresh, setIsAutoRefresh] = useState(autoRefresh);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<any>(null);

  const {
    data: dashboardData,
    loading,
    error,
    refetch
  } = useApi<DashboardData>(
    '/api/multi-events/dashboard',
    {
      refreshInterval: isAutoRefresh ? refreshInterval * 1000 : undefined,
      params: {
        includeMetrics: true,
        includeAlerts: true
      }
    }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefreshToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsAutoRefresh(event.target.checked);
  };

  const handleManualRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleConflictClick = (conflict: any) => {
    setSelectedConflict(conflict);
    setConflictDialogOpen(true);
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatMetricValue = (value: number, type: 'percentage' | 'decimal' = 'decimal') => {
    if (type === 'percentage') {
      return `${Math.round(value * 100)}%`;
    }
    return value.toFixed(2);
  };

  if (loading && !dashboardData) {
    return <LoadingSpinner message="ダッシュボードを読み込み中..." />;
  }

  if (error) {
    return (
      <Alert severity="error">
        ダッシュボードの読み込みに失敗しました: {error}
        <Button onClick={handleManualRefresh} sx={{ ml: 2 }}>
          再試行
        </Button>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert severity="info">
        ダッシュボードデータがありません
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon sx={{ mr: 2 }} />
          マルチイベント管理ダッシュボード
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isAutoRefresh}
                onChange={handleRefreshToggle}
                color="primary"
              />
            }
            label="自動更新"
          />
          
          <Tooltip title="手動更新">
            <IconButton onClick={handleManualRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Typography variant="caption" color="text.secondary">
            最終更新: {new Date(dashboardData.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                アクティブイベント
              </Typography>
              <Typography variant="h4" component="div">
                {dashboardData.overview.activeEvents}
              </Typography>
              <Typography variant="body2">
                実行中のイベント数
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                並行実行グループ
              </Typography>
              <Typography variant="h4" component="div">
                {dashboardData.overview.concurrentGroups}
              </Typography>
              <Typography variant="body2">
                同時実行イベントグループ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                競合数
              </Typography>
              <Typography 
                variant="h4" 
                component="div"
                color={dashboardData.overview.totalConflicts > 0 ? 'error.main' : 'success.main'}
              >
                {dashboardData.overview.totalConflicts}
              </Typography>
              <Typography variant="body2">
                未解決の競合
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                クロス参加者
              </Typography>
              <Typography variant="h4" component="div">
                {dashboardData.overview.crossEventParticipants}
              </Typography>
              <Typography variant="body2">
                複数イベント参加者
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Metrics */}
      {dashboardData.metrics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              パフォーマンス指標
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  イベント利用率
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={dashboardData.metrics.eventUtilization * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {formatMetricValue(dashboardData.metrics.eventUtilization, 'percentage')}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  リソース効率
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={dashboardData.metrics.resourceEfficiency * 100}
                  color="secondary"
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {formatMetricValue(dashboardData.metrics.resourceEfficiency, 'percentage')}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  参加者満足度
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={dashboardData.metrics.participantSatisfaction * 100}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {formatMetricValue(dashboardData.metrics.participantSatisfaction, 'percentage')}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {dashboardData.alerts && dashboardData.alerts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Notifications sx={{ mr: 1 }} />
              アラート
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {dashboardData.alerts.map((alert, index) => (
                <Alert 
                  key={index}
                  severity={getAlertColor(alert.type)}
                  action={
                    alert.action && (
                      <Button size="small" onClick={() => handleConflictClick(alert)}>
                        対処
                      </Button>
                    )
                  }
                >
                  {alert.message}
                </Alert>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="推奨事項" />
          <Tab label="競合管理" />
          <Tab label="リソース管理" />
          <Tab label="参加者分析" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              システム推奨事項
            </Typography>
            
            {dashboardData.recommendations.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>優先度</TableCell>
                      <TableCell>タイプ</TableCell>
                      <TableCell>推奨事項</TableCell>
                      <TableCell>アクション</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recommendations.map((rec, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip 
                            label={rec.priority} 
                            color={getPriorityColor(rec.priority)} 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge color="primary">{rec.type}</Badge>
                        </TableCell>
                        <TableCell>{rec.message}</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            詳細
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="success">
                現在、推奨事項はありません。システムは正常に動作しています。
              </Alert>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <EventConflictResolver />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ResourceManager />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <ParticipantAnalyzer />
      </TabPanel>

      {/* Conflict Resolution Dialog */}
      <Dialog 
        open={conflictDialogOpen} 
        onClose={() => setConflictDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          競合の詳細と解決
        </DialogTitle>
        <DialogContent>
          {selectedConflict && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {selectedConflict.message}
              </Typography>
              
              {selectedConflict.action && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  推奨アクション: {selectedConflict.action}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictDialogOpen(false)}>
            閉じる
          </Button>
          <Button variant="contained" onClick={() => setConflictDialogOpen(false)}>
            解決
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
