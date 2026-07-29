import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { getBackendUrl } from '../../../utils/config';
import {
  BarChart3,
  Calendar,
  Clock,
  Filter,
  Plus,
  Trash2,
  Users,
  RefreshCw,
  TrendingUp,
  LogIn,
  LogOut,
  Layers,
  ChevronDown,
  Check,
  Search,
  Sparkles,
  Info,
  SlidersHorizontal,
  List
} from 'lucide-react';

interface EmployeeStatItem {
  id: string;
  ma: string;
  ten: string;
  phongBan: string;
  inCount: number;
  outCount: number;
  totalCount: number;
}

interface ChartBlock {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  selectedGroup: string; // group ID or 'All'
  selectedEmpIds: string[]; // empty means all in group
  data: EmployeeStatItem[];
  isLoading: boolean;
  isFilterOpen?: boolean;
}

export const StatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { employees, humanGroups } = useApp();

  // Helper to format today's date in YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };

  // State: List of chart blocks
  const [charts, setCharts] = useState<ChartBlock[]>([
    {
      id: 'chart-1',
      title: 'Biểu đồ 1: Thống kê số bản ghi ra/vào',
      startDate: getTodayStr(),
      startTime: '07:00',
      endDate: getTodayStr(),
      endTime: '18:00',
      selectedGroup: 'All',
      selectedEmpIds: [],
      data: [],
      isLoading: false,
    }
  ]);

  // Dropdown UI states for employee selector per chart
  const [activeEmpDropdownChartId, setActiveEmpDropdownChartId] = useState<string | null>(null);
  const [empSearchQuery, setEmpSearchQuery] = useState<string>('');

  // Fetch / calculate statistics for a specific chart block
  const fetchChartData = useCallback(async (chartId: string, chartConfig?: ChartBlock) => {
    // Set loading state for targeted chart
    setCharts(prev => prev.map(c => c.id === chartId ? { ...c, isLoading: true } : c));

    try {
      // Obtain latest chart config from argument or state callback
      let currentChart: ChartBlock | undefined = chartConfig;
      if (!currentChart) {
        setCharts(prev => {
          currentChart = prev.find(c => c.id === chartId);
          return prev;
        });
      }

      if (!currentChart) {
        console.warn(`[fetchChartData] Chart ${chartId} not found`);
        setCharts(prev => prev.map(c => c.id === chartId ? { ...c, isLoading: false } : c));
        return;
      }

      const baseUrl = getBackendUrl();
      // Call backend event-logs API with time bounds
      const params = new URLSearchParams({
        page: '1',
        limit: '10000',
        noImages: 'true',
        startDate: currentChart.startDate,
        endDate: currentChart.endDate,
        startTime: currentChart.startTime,
        endTime: currentChart.endTime,
      });

      if (currentChart.selectedGroup && currentChart.selectedGroup !== 'All') {
        params.append('group', currentChart.selectedGroup);
      }

      const res = await fetch(`${baseUrl}/meeting/event-logs?${params.toString()}`);
      let events: any[] = [];
      if (res.ok) {
        const json = await res.json();
        events = json.data || [];
      } else {
        console.warn(`[fetchChartData] HTTP ${res.status} when fetching event logs`);
      }

      // Filter employees based on selected group & selected IDs
      let filteredEmployees = [...employees];
      if (currentChart.selectedGroup && currentChart.selectedGroup !== 'All') {
        const groupObj = humanGroups.find(g => g.id === currentChart.selectedGroup);
        const groupName = groupObj?.name || currentChart.selectedGroup;
        filteredEmployees = filteredEmployees.filter(e => {
          const list = Array.isArray(e.human_group) ? e.human_group : [e.human_group];
          return list.includes(groupName) || list.includes(currentChart.selectedGroup);
        });
      }

      if (currentChart.selectedEmpIds && currentChart.selectedEmpIds.length > 0) {
        filteredEmployees = filteredEmployees.filter(e => currentChart.selectedEmpIds.includes(e.id || e.maGiayTo || e.ma));
      }

      // Map events to calculate inCount and outCount for each employee
      const statMap: Record<string, { inCount: number; outCount: number }> = {};
      events.forEach(evt => {
        const code = evt.ma || evt.document_id || '';
        const name = evt.ten || evt.full_name || '';
        const key = code || name;
        if (!key) return;

        if (!statMap[key]) {
          statMap[key] = { inCount: 0, outCount: 0 };
        }

        const huong = (evt.huong || '').toLowerCase();
        const vung = (evt.vung || '').toLowerCase();
        if (huong.includes('vào') || vung.includes('vào') || vung.includes('checkin')) {
          statMap[key].inCount += 1;
        } else if (huong.includes('ra') || vung.includes('ra') || vung.includes('checkout')) {
          statMap[key].outCount += 1;
        } else {
          // Default to inCount if directional info is missing
          statMap[key].inCount += 1;
        }
      });

      // Build final EmployeeStatItem list
      const resultData: EmployeeStatItem[] = filteredEmployees.map(emp => {
        const empCode = emp.maGiayTo || emp.id || emp.ma || '';
        const empName = emp.hoTen || emp.ten || 'Không tên';
        const empGroup = Array.isArray(emp.human_group) ? emp.human_group.join(', ') : (emp.human_group || 'Phòng Ban');

        const stats = statMap[empCode] || statMap[empName] || { inCount: 0, outCount: 0 };
        return {
          id: empCode,
          ma: empCode,
          ten: empName,
          phongBan: empGroup,
          inCount: stats.inCount,
          outCount: stats.outCount,
          totalCount: stats.inCount + stats.outCount,
        };
      });

      setCharts(prev => prev.map(c => c.id === chartId ? { ...c, data: resultData, isLoading: false } : c));
    } catch (err) {
      console.error('Failed to fetch chart statistics:', err);
      setCharts(prev => prev.map(c => c.id === chartId ? { ...c, isLoading: false } : c));
    }
  }, [employees, humanGroups]);

  // Initial load for all chart blocks
  useEffect(() => {
    if (employees.length > 0) {
      charts.forEach(chart => {
        if (chart.data.length === 0 && !chart.isLoading) {
          fetchChartData(chart.id);
        }
      });
    }
  }, [employees.length, fetchChartData]);

  // Add a new chart block below
  const handleAddChart = () => {
    const nextIdx = charts.length + 1;
    const newChart: ChartBlock = {
      id: `chart-${Date.now()}`,
      title: `Biểu đồ ${nextIdx}: Thống kê số bản ghi ra/vào`,
      startDate: getTodayStr(),
      startTime: '07:00',
      endDate: getTodayStr(),
      endTime: '18:00',
      selectedGroup: 'All',
      selectedEmpIds: [],
      data: [],
      isLoading: false,
    };
    setCharts(prev => [...prev, newChart]);
    // Fetch data for new chart
    setTimeout(() => {
      fetchChartData(newChart.id, newChart);
    }, 100);
  };

  // Remove a chart block
  const handleRemoveChart = (chartId: string) => {
    if (charts.length <= 1) return;
    setCharts(prev => prev.filter(c => c.id !== chartId));
  };

  // Update field in a chart block
  const handleUpdateChartConfig = (chartId: string, updates: Partial<ChartBlock>) => {
    setCharts(prev => prev.map(c => c.id === chartId ? { ...c, ...updates } : c));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0e0f14]">

      {/* Header Tab Navigator */}
      <div id="tabs-bar" className="h-14 bg-[#181921] border-b border-[#252731] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-xs text-slate-400 font-semibold tracking-wider">Thống Kê Sự Kiện</div>

          {/* Sliding Big Pill Segmented Control Container */}
          <div className="flex bg-[#111218] p-1 rounded-full border border-[#2d2f3c] space-x-1">
            {/* Tab 1: Danh sách sự kiện */}
            <button
              id="tab-btn-list"
              onClick={() => navigate('/reports')}
              className="px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <List size={14} />
              <span>Danh sách sự kiện</span>
            </button>

            {/* Tab 2: Báo cáo chấm công */}
            <button
              id="tab-btn-attendance"
              onClick={() => navigate('/reports')}
              className="px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Calendar size={14} />
              <span>Báo cáo chấm công</span>
            </button>

            {/* Tab 3: Báo cáo cuộc họp */}
            <button
              id="tab-btn-meeting"
              onClick={() => navigate('/reports')}
              className="px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Clock size={14} />
              <span>Báo cáo cuộc họp</span>
            </button>

            {/* Tab 4: Thống kê biểu đồ (Active - Only Icon, no text) */}
            <button
              id="tab-btn-statistics"
              title="Biểu đồ thống kê số bản ghi ra/vào"
              className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-200 bg-[#0078d7] text-white shadow-lg shadow-[#0078d7]/20 cursor-pointer"
            >
              <BarChart3 size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">

        {/* Top Page Header Banner */}
        <div className="bg-[#14151b] border border-[#21232d] p-5 rounded-2xl shadow-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20 rounded-xl shadow-inner">
            <BarChart3 size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Thống Kê Số Bản Ghi Xuất Hiện
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20">
                Biểu đồ cột đôi
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Thống kê lượt ra/vào của danh sách nhân viên được chọn trong khoảng thời gian tùy chỉnh (hh:mm dd/mm/yyyy).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddChart}
          className="px-4 py-2.5 bg-[#00a2e8] hover:bg-[#008cc9] active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#00a2e8]/20 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Thêm biểu đồ mới</span>
        </button>
      </div>

      {/* List of Chart Cards */}
      <div className="space-y-8">
        {(() => {
          // Calculate combined total (In + Out) per employee across ALL active charts
          const overallEmployeeTotalMap: Record<string, number> = {};
          charts.forEach(c => {
            c.data.forEach(item => {
              const key = item.ma || item.id || item.ten;
              overallEmployeeTotalMap[key] = (overallEmployeeTotalMap[key] || 0) + item.totalCount;
            });
          });

          return charts.map((chart, chartIndex) => {
            // Get employees list available for selected group
            const availableEmployees = employees.filter(e => {
              if (!chart.selectedGroup || chart.selectedGroup === 'All') return true;
              const groupObj = humanGroups.find(g => g.id === chart.selectedGroup);
              const groupName = groupObj?.name || chart.selectedGroup;
              const list = Array.isArray(e.human_group) ? e.human_group : [e.human_group];
              return list.includes(groupName) || list.includes(chart.selectedGroup);
            });

            // Default display order (no sorting by total count)
            const sortedChartData = [...chart.data];

            // Calculate summary metrics for current chart
            const totalIn = sortedChartData.reduce((acc, curr) => acc + curr.inCount, 0);
            const totalOut = sortedChartData.reduce((acc, curr) => acc + curr.outCount, 0);
            const grandTotal = totalIn + totalOut;
            const maxVal = Math.max(1, ...sortedChartData.map(d => Math.max(d.inCount, d.outCount)));

            return (
              <div
                key={chart.id}
                className="bg-[#14151b] border border-[#21232d] rounded-2xl p-6 shadow-2xl space-y-6 relative group/card"
              >
              {/* Card Header & Title */}
              <div className="flex items-center justify-between border-b border-[#21232d] pb-4">
                <div className="flex items-center space-x-3">
                  <span className="w-3 h-3 rounded-full bg-[#00a2e8]" />
                  <input
                    type="text"
                    value={chart.title}
                    onChange={(e) => handleUpdateChartConfig(chart.id, { title: e.target.value })}
                    className="bg-transparent text-sm font-bold text-white hover:bg-[#1a1c26] focus:bg-[#1a1c26] px-2 py-1 rounded-lg border border-transparent focus:border-[#00a2e8] focus:outline-none transition"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  {chart.isFilterOpen === false && (
                    <div className="flex items-center space-x-1.5 mr-1">
                      {/* Pill 1: Đi vào */}
                      <div
                        title="Tổng bản ghi check-in (Đi vào)"
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center space-x-1 cursor-pointer transition hover:bg-emerald-500/20"
                      >
                        <LogIn size={13} />
                        <span>{totalIn}</span>
                      </div>

                      {/* Pill 2: Đi ra */}
                      <div
                        title="Tổng bản ghi check-out (Đi ra)"
                        className="px-2.5 py-1 rounded-xl bg-[#00a2e8]/10 border border-[#00a2e8]/20 text-[#00a2e8] font-mono font-bold text-xs flex items-center space-x-1 cursor-pointer transition hover:bg-[#00a2e8]/20"
                      >
                        <LogOut size={13} />
                        <span>{totalOut}</span>
                      </div>

                      {/* Pill 3: Tổng bản ghi */}
                      <div
                        title="Tổng số bản ghi ra/vào"
                        className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center space-x-1 cursor-pointer transition hover:bg-amber-500/20"
                      >
                        <TrendingUp size={13} />
                        <span>{grandTotal}</span>
                      </div>

                      {/* Pill 4: Số nhân viên */}
                      <div
                        title="Số lượng nhân viên được chọn"
                        className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold text-xs flex items-center space-x-1 cursor-pointer transition hover:bg-purple-500/20"
                      >
                        <Users size={13} />
                        <span>{chart.data.length}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleUpdateChartConfig(chart.id, { isFilterOpen: chart.isFilterOpen === undefined ? false : !chart.isFilterOpen })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 cursor-pointer ${chart.isFilterOpen !== false
                      ? 'bg-[#00a2e8]/10 text-[#00a2e8] border-[#00a2e8]/30 hover:bg-[#00a2e8]/20'
                      : 'bg-[#1c1d26] text-slate-300 border-[#2d2f3c] hover:bg-[#252735] hover:text-white'
                      }`}
                    title={chart.isFilterOpen !== false ? 'Thu gọn khu vực nhập bộ lọc' : 'Mở rộng khu vực nhập bộ lọc'}
                  >
                    <SlidersHorizontal size={13} />
                    <span>{chart.isFilterOpen !== false ? 'Thu gọn' : 'Mở rộng'}</span>
                    <ChevronDown size={13} className={`transition-transform duration-200 ${chart.isFilterOpen !== false ? 'rotate-180' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchChartData(chart.id, chart)}
                    disabled={chart.isLoading}
                    className="p-2 rounded-xl bg-[#1c1d26] hover:bg-[#252735] text-slate-300 hover:text-white border border-[#2d2f3c] text-xs transition cursor-pointer disabled:opacity-50"
                    title="Tải lại dữ liệu biểu đồ"
                  >
                    <RefreshCw size={14} className={chart.isLoading ? 'animate-spin text-[#00a2e8]' : ''} />
                  </button>

                  {charts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChart(chart.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs transition cursor-pointer"
                      title="Xóa biểu đồ này"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Controls Toolbar (Toggleable Inline) */}
              {chart.isFilterOpen !== false && (
                <div className="grid grid-cols-12 gap-3 bg-[#101117] border border-[#21232d] p-4 rounded-xl items-end text-left transition-all duration-200">

                  {/* Time Range Pickers (X → Y) */}
                  <div className="col-span-12 lg:col-span-5 space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Start DateTime */}
                      <div className="flex gap-1.5 items-center bg-[#181922] border border-[#2d2f3c] rounded-xl px-2.5 h-[38px]">
                        <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Từ:</span>
                        <input
                          type="time"
                          value={chart.startTime}
                          onChange={(e) => handleUpdateChartConfig(chart.id, { startTime: e.target.value })}
                          className="bg-transparent text-xs text-white focus:outline-none w-18 font-mono [color-scheme:dark]"
                        />
                        <input
                          type="date"
                          value={chart.startDate}
                          onChange={(e) => handleUpdateChartConfig(chart.id, { startDate: e.target.value })}
                          className="bg-transparent text-xs text-white focus:outline-none flex-1 font-mono [color-scheme:dark]"
                        />
                      </div>

                      {/* End DateTime */}
                      <div className="flex gap-1.5 items-center bg-[#181922] border border-[#2d2f3c] rounded-xl px-2.5 h-[38px]">
                        <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Đến:</span>
                        <input
                          type="time"
                          value={chart.endTime}
                          onChange={(e) => handleUpdateChartConfig(chart.id, { endTime: e.target.value })}
                          className="bg-transparent text-right text-xs text-white focus:outline-none w-18 font-mono [color-scheme:dark]"
                        />
                        <input
                          type="date"
                          value={chart.endDate}
                          onChange={(e) => handleUpdateChartConfig(chart.id, { endDate: e.target.value })}
                          className="bg-transparent text-xs text-white focus:outline-none flex-1 font-mono [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group Filter */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-3 space-y-1.5">
                    <select
                      value={chart.selectedGroup}
                      onChange={(e) => {
                        const newGrp = e.target.value;
                        handleUpdateChartConfig(chart.id, { selectedGroup: newGrp, selectedEmpIds: [] });
                      }}
                      className="w-full bg-[#181922] border border-[#2d2f3c] hover:border-[#00a2e8] focus:border-[#00a2e8] text-xs text-white rounded-xl px-3 focus:outline-none h-[38px] transition"
                    >
                      <option value="All">Tất cả nhóm / phòng ban</option>
                      {humanGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Employee Multiselect Dropdown Button */}
                  <div className="col-span-12 sm:col-span-6 lg:col-span-2 space-y-1.5 relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeEmpDropdownChartId === chart.id) {
                          setActiveEmpDropdownChartId(null);
                        } else {
                          setActiveEmpDropdownChartId(chart.id);
                          setEmpSearchQuery('');
                        }
                      }}
                      className="w-full bg-[#181922] border border-[#2d2f3c] hover:border-[#00a2e8] text-xs text-white rounded-xl px-3 flex items-center justify-between h-[38px] transition focus:outline-none"
                    >
                      <span className="truncate pr-2">
                        {chart.selectedEmpIds.length === 0
                          ? `Tất cả (${availableEmployees.length} NV)`
                          : `Đã chọn ${chart.selectedEmpIds.length} / ${availableEmployees.length} NV`}
                      </span>
                      <ChevronDown size={14} className={`text-[#00a2e8] transition-transform ${activeEmpDropdownChartId === chart.id ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu Modal */}
                    {activeEmpDropdownChartId === chart.id && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setActiveEmpDropdownChartId(null)}
                        />
                        <div className="absolute right-0 left-0 top-full mt-1 bg-[#181922] border border-[#2d2f3c] rounded-2xl shadow-2xl z-40 p-3 space-y-2 text-left">
                          {/* Search Input */}
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Tìm kiếm nhân viên..."
                              value={empSearchQuery}
                              onChange={(e) => setEmpSearchQuery(e.target.value)}
                              className="w-full bg-[#101117] border border-[#2d2f3c] rounded-lg pl-7 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a2e8]"
                            />
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                          </div>

                          {/* Quick Select Actions */}
                          <div className="flex justify-between border-b border-[#2d2f3c] pb-1.5 px-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateChartConfig(chart.id, { selectedEmpIds: [] })}
                              className="text-[10px] text-[#00a2e8] hover:underline font-bold"
                            >
                              Chọn tất cả ({availableEmployees.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const firstOnly = availableEmployees.length > 0 ? [availableEmployees[0].id || availableEmployees[0].maGiayTo] : [];
                                handleUpdateChartConfig(chart.id, { selectedEmpIds: firstOnly });
                              }}
                              className="text-[10px] text-slate-400 hover:underline font-medium"
                            >
                              Bỏ chọn tất cả
                            </button>
                          </div>

                          {/* Employees List with Checkboxes */}
                          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                            {availableEmployees
                              .filter(emp => {
                                const name = (emp.hoTen || emp.ten || '').toLowerCase();
                                const code = (emp.maGiayTo || emp.ma || '').toLowerCase();
                                const q = empSearchQuery.toLowerCase();
                                return name.includes(q) || code.includes(q);
                              })
                              .map(emp => {
                                const empId = emp.id || emp.maGiayTo || emp.ma;
                                const isChecked = chart.selectedEmpIds.length === 0 || chart.selectedEmpIds.includes(empId);
                                return (
                                  <button
                                    key={empId}
                                    type="button"
                                    onClick={() => {
                                      if (chart.selectedEmpIds.length === 0) {
                                        // Switching from "All" to specific selection -> select all except this one
                                        const allIds = availableEmployees.map(e => e.id || e.maGiayTo || e.ma);
                                        handleUpdateChartConfig(chart.id, { selectedEmpIds: allIds.filter(id => id !== empId) });
                                      } else if (isChecked) {
                                        handleUpdateChartConfig(chart.id, { selectedEmpIds: chart.selectedEmpIds.filter(id => id !== empId) });
                                      } else {
                                        handleUpdateChartConfig(chart.id, { selectedEmpIds: [...chart.selectedEmpIds, empId] });
                                      }
                                    }}
                                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:bg-[#222430] transition cursor-pointer"
                                  >
                                    <div className="truncate pr-2">
                                      <span className="font-semibold text-slate-100">{emp.hoTen || emp.ten}</span>
                                      <span className="text-[10px] text-slate-400 block font-mono">
                                        {emp.maGiayTo || emp.ma} • {Array.isArray(emp.human_group) ? emp.human_group.join(', ') : emp.human_group}
                                      </span>
                                    </div>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${isChecked
                                      ? 'border-[#00a2e8] bg-[#00a2e8]'
                                      : 'border-[#2d2f3c] bg-[#111218]'
                                      }`}>
                                      {isChecked && <Check size={10} className="text-white font-bold" />}
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filter Execute Button - Inline */}
                  <div className="col-span-12 lg:col-span-2">
                    <button
                      type="button"
                      onClick={() => fetchChartData(chart.id, chart)}
                      disabled={chart.isLoading}
                      className="w-full h-[38px] px-3 bg-[#00a2e8] hover:bg-[#008cc9] text-white font-bold rounded-xl text-xs transition shadow-md shadow-[#00a2e8]/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={chart.isLoading ? 'animate-spin' : ''} />
                      <span className="truncate">Áp dụng bộ lọc</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Summary Stats Badges (Visible when Filter is Open) */}
              {chart.isFilterOpen !== false && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#101117] border border-emerald-500/20 p-3 rounded-xl flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <LogIn size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng Đi Vào</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono">{totalIn}</span>
                    </div>
                  </div>

                  <div className="bg-[#101117] border border-[#00a2e8]/20 p-3 rounded-xl flex items-center space-x-3">
                    <div className="p-2.5 bg-[#00a2e8]/10 text-[#00a2e8] rounded-lg">
                      <LogOut size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng Đi Ra</span>
                      <span className="text-lg font-bold text-[#00a2e8] font-mono">{totalOut}</span>
                    </div>
                  </div>

                  <div className="bg-[#101117] border border-amber-500/20 p-3 rounded-xl flex items-center space-x-3">
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng Bản Ghi</span>
                      <span className="text-lg font-bold text-amber-400 font-mono">{grandTotal}</span>
                    </div>
                  </div>

                  <div className="bg-[#101117] border border-purple-500/20 p-3 rounded-xl flex items-center space-x-3">
                    <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg">
                      <Users size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số Nhân Viên</span>
                      <span className="text-lg font-bold text-purple-400 font-mono">{chart.data.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart Legend */}
              {/* <div className="flex items-center justify-between pt-2 px-1 text-xs">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span className="font-semibold text-slate-300">Cột 1: Số lượt Đi vào (Check-in)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded bg-[#00a2e8] shadow-sm shadow-[#00a2e8]/50" />
                    <span className="font-semibold text-slate-300">Cột 2: Số lượt Đi ra (Check-out)</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Trục X: Danh sách nhân viên • Trục Y: Số bản ghi</span>
              </div> */}

              {/* DOUBLE BAR CHART CONTAINER */}
              <div className="bg-[#101117] border border-[#21232d] rounded-2xl p-6 relative min-h-[360px] flex flex-col justify-between overflow-hidden">
                {chart.isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-16">
                    <RefreshCw size={28} className="animate-spin text-[#00a2e8]" />
                    <span className="text-xs font-semibold text-slate-400">Đang tổng hợp bản ghi thống kê...</span>
                  </div>
                ) : chart.data.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-16 text-slate-500">
                    <Info size={32} className="text-slate-600" />
                    <span className="text-xs font-semibold text-slate-400">Không có dữ liệu nhân viên trong khoảng thời gian được chọn</span>
                    <p className="text-[11px] text-slate-600">Thử mở rộng khoảng thời gian hoặc thay đổi nhóm nhân viên.</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto pt-14 pb-2">
                    <div className="min-w-full w-max flex flex-col justify-end space-y-4">

                      {/* Y-Axis Grid Lines Background & Plot Area */}
                      <div className="relative w-full h-[280px] flex items-end border-b border-l border-[#2d2f3c] pl-10 pr-4 pt-14">

                        {/* Y-Axis Guidelines & Ticks */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-[10px] font-mono text-slate-500 text-right pr-1 pointer-events-none">
                          <span>{maxVal}</span>
                          <span>{Math.round(maxVal * 0.75)}</span>
                          <span>{Math.round(maxVal * 0.5)}</span>
                          <span>{Math.round(maxVal * 0.25)}</span>
                          <span>0</span>
                        </div>

                        {/* Horizontal Gridlines */}
                        <div className="absolute left-9 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
                          <div className="border-b border-[#21232d]/60 w-full" />
                          <div className="border-b border-[#21232d]/40 w-full" />
                          <div className="border-b border-[#21232d]/40 w-full" />
                          <div className="border-b border-[#21232d]/40 w-full" />
                          <div className="border-b border-[#2d2f3c] w-full" />
                        </div>

                        {/* Bars Plot Area */}
                        <div className="w-full h-full flex items-end justify-around space-x-6 relative z-10 pt-4">
                          {sortedChartData.map((item) => {
                            const inHeightPct = maxVal > 0 ? (item.inCount / maxVal) * 100 : 0;
                            const outHeightPct = maxVal > 0 ? (item.outCount / maxVal) * 100 : 0;

                            return (
                              <div key={item.id} className="w-20 min-w-[70px] flex flex-col items-center h-full justify-end group/bar relative hover:z-50 shrink-0">

                                {/* Hover Tooltip Popup (Centered & High Z-Index) */}
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover/bar:flex flex-col bg-[#1c1d27] border border-[#2d2f3c] p-2.5 rounded-xl shadow-2xl z-50 w-44 text-left pointer-events-none">
                                  <span className="font-bold text-xs text-white truncate">{item.ten}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{item.ma}</span>
                                  <div className="border-t border-[#2d2f3c] my-1.5 pt-1.5 text-[11px] space-y-1">
                                    <div className="flex justify-between text-emerald-400 font-semibold">
                                      <span>Đi vào:</span>
                                      <span>{item.inCount} lượt</span>
                                    </div>
                                    <div className="flex justify-between text-[#00a2e8] font-semibold">
                                      <span>Đi ra:</span>
                                      <span>{item.outCount} lượt</span>
                                    </div>
                                    <div className="flex justify-between text-slate-200 font-bold border-t border-[#2d2f3c]/60 pt-1">
                                      <span>Tổng cộng:</span>
                                      <span>{item.totalCount} lượt</span>
                                    </div>
                                  </div>
                                </div>

                                {/* DUAL BARS GROUP */}
                                <div className="w-full flex items-end justify-center space-x-1.5 h-full">

                                  {/* BAR 1: Đi vào (Green) */}
                                  <div className="flex-1 flex flex-col items-center justify-end h-full">
                                    {item.inCount > 0 && (
                                      <span className="text-[9px] font-mono font-bold text-emerald-400 mb-1 animate-pulse">
                                        {item.inCount}
                                      </span>
                                    )}
                                    <div
                                      style={{ height: `${Math.max(inHeightPct > 0 ? inHeightPct : 2, 0)}%` }}
                                      className={`w-full rounded-t-md transition-all duration-500 ${item.inCount > 0
                                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md shadow-emerald-500/20 hover:brightness-125'
                                        : 'bg-slate-800/40 border-t border-slate-700/50'
                                        }`}
                                    />
                                  </div>

                                  {/* BAR 2: Đi ra (Blue) */}
                                  <div className="flex-1 flex flex-col items-center justify-end h-full">
                                    {item.outCount > 0 && (
                                      <span className="text-[9px] font-mono font-bold text-[#00a2e8] mb-1 animate-pulse">
                                        {item.outCount}
                                      </span>
                                    )}
                                    <div
                                      style={{ height: `${Math.max(outHeightPct > 0 ? outHeightPct : 2, 0)}%` }}
                                      className={`w-full rounded-t-md transition-all duration-500 ${item.outCount > 0
                                        ? 'bg-gradient-to-t from-[#0284c7] to-[#00a2e8] shadow-md shadow-[#00a2e8]/20 hover:brightness-125'
                                        : 'bg-slate-800/40 border-t border-slate-700/50'
                                        }`}
                                    />
                                  </div>

                                </div>

                              </div>
                            );
                          })}
                        </div>

                      </div>

                      {/* X-Axis Employee Names Labels */}
                      <div className="flex items-start justify-around space-x-6 pl-10 pr-4 pt-2 border-t border-[#2d2f3c]/60">
                        {sortedChartData.map((item) => (
                          <div key={`label-${item.id}`} className="w-20 min-w-[70px] text-center shrink-0">
                            <span className="text-[11px] font-bold text-slate-200 block truncate group-hover:text-[#00a2e8] transition" title={item.ten}>
                              {item.ten}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 block truncate" title={item.ma}>
                              {item.ma}
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        });
      })()}
        </div>
      </div>

    </div>
  );
};

