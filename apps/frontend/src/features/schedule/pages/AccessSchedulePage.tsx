import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  ChevronDown,
  Check,
  Save,
  Plus,
  Users,
  X,
  FolderOpen,
  Loader2,
  Trash2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../../context/AppContext';

// Legacy UI shape mirror of the real Meeting[] (bảng meeting, DB cms_webserver),
// derived so the existing drag/preview render logic below (written against
// area/date/startTime/endTime/departments) keeps working unchanged.
const mapMeetingToLocal = (m: any, areas: any[]) => {
  const area = areas.find((a: any) => a.id === m.location_id);
  return {
    id: m.id,
    title: m.title,
    areaId: m.location_id,
    area: area?.name || m.location_id,
    date: m.date_organize,
    startTime: m.time_start,
    endTime: m.time_end,
    departments: (m.groups || []).map((g: any) => g.name),
    groupIds: m.group_ids || [],
    timeBeforeBegin: m.time_before_begin,
    timeAfterEnd: m.time_after_end,
  };
};

const getCellForType = (emp: any, dateStr: string, type: string) => {
  if (!emp.days) return { assigned: false };
  if (emp.days[`${dateStr}_${type}`]) {
    return emp.days[`${dateStr}_${type}`];
  }
  if (emp.days[dateStr] && emp.days[dateStr].type === type) {
    return emp.days[dateStr];
  }
  return { assigned: false };
};

const setCellForType = (emp: any, dateStr: string, type: string, schedule: any) => {
  if (!emp.days) emp.days = {};
  // If there's an existing schedule in days[dateStr] that is of a different type, migrate it first
  if (emp.days[dateStr] && emp.days[dateStr].assigned && emp.days[dateStr].type !== type) {
    const oldType = emp.days[dateStr].type;
    if (!emp.days[`${dateStr}_${oldType}`]) {
      emp.days[`${dateStr}_${oldType}`] = { ...emp.days[dateStr] };
    }
  }
  // Store the new schedule in the specific type key
  emp.days[`${dateStr}_${type}`] = schedule;
  // Also update the main days[dateStr] key
  emp.days[dateStr] = schedule;
};

const hasOtherTypeSchedule = (emp: any, dateStr: string, currentType: string) => {
  const types = ['Chấm công', 'Tăng ca', 'Nghỉ phép'];
  return types.some(t => t !== currentType && getCellForType(emp, dateStr, t).assigned);
};

// 4. ACCESS SCHEDULE PAGE COMPONENT
// ==========================================
export const AccessSchedulePage = () => {
  const {
    scheduleSavedData, setScheduleSavedData,
    meetings, areasData, humanGroups,
    createMeeting, updateMeeting, deleteMeeting
  } = useApp();

  // Local mutable mirror of `meetings` (legacy shape), kept in sync via effect
  // below. Drag gestures mutate this for instant visual feedback before
  // persisting the final position to the API on mouse-up.
  const [localMeetings, setLocalMeetings] = useState<any[]>([]);
  useEffect(() => {
    setLocalMeetings(meetings.map(m => mapMeetingToLocal(m, areasData)));
  }, [meetings, areasData]);

  const [activeScheduleSubTab, setActiveScheduleSubTab] = useState<'attendance-schedule' | 'meeting-schedule'>('attendance-schedule');
  const [showAttendanceScheduleDemo, setShowAttendanceScheduleDemo] = useState(false);

  // States cho xếp ca chấm công
  const [scheduleDisplay, setScheduleDisplay] = useState<'Ngày' | 'Tuần' | 'Tháng' | 'Năm'>('Ngày');
  const [scheduleSelectedAreas, setScheduleSelectedAreas] = useState<string[]>(['Checkin Area']);
  const [scheduleStartTime, setScheduleStartTime] = useState<string>('08:00');
  const [scheduleEndTime, setScheduleEndTime] = useState<string>('17:00');
  const [scheduleType, setScheduleType] = useState<string>('Chấm công');
  const [scheduleCalendarDate, setScheduleCalendarDate] = useState<string>('2026-07-10');
  // Tuần: số tuần ISO trong năm (dùng khi scheduleDisplay === 'Tuần')
  const [scheduleWeekNumber, setScheduleWeekNumber] = useState<number>(() => {
    // Init with the ISO week number of the default date
    const d = new Date('2026-07-10');
    const dayNum = d.getDay() || 7; // Sunday=7
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  });
  // Checkbox "Trừ ngày cuối tuần" — mặc định tick
  const [excludeWeekends, setExcludeWeekends] = useState<boolean>(true);

  const [isSchDisplayOpen, setIsSchDisplayOpen] = useState<boolean>(false);
  const [isSchAreasOpen, setIsSchAreasOpen] = useState<boolean>(false);
  const [isSchTypeOpen, setIsSchTypeOpen] = useState<boolean>(false);
  const [scheduleSelectedCells, setScheduleSelectedCells] = useState<{ [groupId: string]: string[] }>({});
  const [isSchGroupsOpen, setIsSchGroupsOpen] = useState<boolean>(false);

  const getDatesInView = () => {
    const dates: string[] = [];
    const start = new Date(scheduleCalendarDate);
    let count = 1;
    if (scheduleDisplay === 'Tuần') count = 7;
    else if (scheduleDisplay === 'Tháng') count = 30;
    else if (scheduleDisplay === 'Năm') count = 90;

    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates;
  };

  const computedSelectedGroups = humanGroups.filter(g => (scheduleSelectedCells[g.id] || []).length > 0).map(g => g.id);

  const toggleGroupSelection = (groupId: string) => {
    const datesInView = getDatesInView();
    const currentSelected = scheduleSelectedCells[groupId] || [];
    const hasAnyInView = currentSelected.some(d => datesInView.includes(d));

    if (hasAnyInView) {
      setScheduleSelectedCells({
        ...scheduleSelectedCells,
        [groupId]: currentSelected.filter(d => !datesInView.includes(d))
      });
    } else {
      const merged = Array.from(new Set([...currentSelected, ...datesInView]));
      setScheduleSelectedCells({
        ...scheduleSelectedCells,
        [groupId]: merged
      });
    }
  };

  const isCellSelected = (empId: string, dateStr: string) => {
    return (scheduleSelectedCells[empId] || []).includes(dateStr);
  };

  const toggleCellSelection = (empId: string, dateStr: string) => {
    const current = scheduleSelectedCells[empId] || [];
    if (current.includes(dateStr)) {
      setScheduleSelectedCells({
        ...scheduleSelectedCells,
        [empId]: current.filter(d => d !== dateStr)
      });
    } else {
      setScheduleSelectedCells({
        ...scheduleSelectedCells,
        [empId]: [...current, dateStr]
      });
    }
  };

  const [schedulePreviewData, setSchedulePreviewData] = useState<any[] | null>(null);
  const [isFillingTable, setIsFillingTable] = useState<boolean>(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState<boolean>(false);
  const [showScheduleSaveToast, setShowScheduleSaveToast] = useState<boolean>(false);

  // States cho xếp lịch họp
  const [schMeetingLayout, setSchMeetingLayout] = useState<'by-location' | 'by-department'>('by-location');
  const [schMeetingTitle, setSchMeetingTitle] = useState<string>('');
  // schMeetingAreaIds lưu danh sách location_id thật (FK meeting.location_id) đã chọn
  // (Multiselect). Khi tạo cuộc họp, mỗi khu vực đã chọn sẽ là một bản ghi meeting riêng.
  // Mặc định KHÔNG chọn khu vực nào - người dùng phải tự chọn trước khi tạo cuộc họp.
  const [schMeetingAreaIds, setSchMeetingAreaIds] = useState<string[]>([]);
  // Mặc định KHÔNG chọn nhóm nhân viên nào - người dùng phải tự chọn trước khi tạo cuộc họp.
  const [schMeetingHumanGroupIds, setSchMeetingHumanGroupIds] = useState<string[]>([]);
  const [schMeetingDate, setSchMeetingDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [schMeetingStartTime, setSchMeetingStartTime] = useState<string>('09:00');
  const [schMeetingEndTime, setSchMeetingEndTime] = useState<string>('11:00');
  const [isSchMeetingAreaOpen, setIsSchMeetingAreaOpen] = useState<boolean>(false);
  const [isSchMeetingDepsOpen, setIsSchMeetingDepsOpen] = useState<boolean>(false);

  // Toggle hiển thị 2 ô nâng cao (ẩn mặc định theo yêu cầu).
  const [showAdvancedMeetingFields, setShowAdvancedMeetingFields] = useState<boolean>(false);
  const [schMeetingBeforeBegin, setSchMeetingBeforeBegin] = useState<number>(30);
  const [schMeetingAfterEnd, setSchMeetingAfterEnd] = useState<number>(30);

  // Tên hiển thị cho các khu vực/phòng họp đã chọn (Multiselect)
  const schMeetingAreaNames = schMeetingAreaIds.includes('all')
    ? ['All (*) - Mặc định']
    : schMeetingAreaIds.map(id => areasData.find(a => a.id === id)?.name || id);

  const [schMeetingPreviewData, setSchMeetingPreviewData] = useState<any[] | null>(null);
  const [isFillingMeetingTable, setIsFillingMeetingTable] = useState<boolean>(false);
  const [showMeetingOverwriteConfirm, setShowMeetingOverwriteConfirm] = useState<boolean>(false);
  const [showMeetingSaveToast, setShowMeetingSaveToast] = useState<boolean>(false);
  const [isSavingMeeting, setIsSavingMeeting] = useState<boolean>(false);
  const [meetingSaveError, setMeetingSaveError] = useState<string>('');
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);

  // Drag states
  const [draggingMeeting, setDraggingMeeting] = useState<any>(null);
  const [draggingAttendance, setDraggingAttendance] = useState<any>(null);

  // Thêm state cho Modals
  const [savePath, setSavePath] = useState('C:\\Program Files\\DVMS System\\DVMS Client\\EventData\\');
  const [showPathModal, setShowPathModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportToast, setShowExportToast] = useState(false);

  // Toggle chọn/bỏ chọn 1 khu vực trong Multiselect "Khu vực / Phòng họp áp dụng"
  // - dùng cho cả dropdown và click vào header dòng khu vực trong bảng lịch (by-location).
  const toggleSchMeetingArea = (areaId: string) => {
    if (schMeetingAreaIds.includes(areaId)) {
      setSchMeetingAreaIds(schMeetingAreaIds.filter(id => id !== areaId));
    } else {
      const withoutAll = schMeetingAreaIds.filter(id => id !== 'all');
      setSchMeetingAreaIds([...withoutAll, areaId]);
    }
  };

  // Toggle chọn/bỏ chọn 1 nhóm nhân viên trong Multiselect "nhóm nhân viên tham gia"
  // - dùng cho cả dropdown và click vào header dòng nhóm nhân viên trong bảng lịch (by-department).
  const toggleSchMeetingHumanGroup = (groupId: string) => {
    if (schMeetingHumanGroupIds.includes(groupId)) {
      setSchMeetingHumanGroupIds(schMeetingHumanGroupIds.filter(id => id !== groupId));
    } else {
      const withoutAll = schMeetingHumanGroupIds.filter(id => id !== 'all');
      setSchMeetingHumanGroupIds([...withoutAll, groupId]);
    }
  };

  // Bắt đầu kéo (di chuyển/resize) một cuộc họp đã có sẵn trên timeline.
  // Thay vì gọi updateMeeting ngay khi thả chuột, ta luôn đưa về chế độ Preview
  // (giống hệt lúc "Tạo cuộc họp") -> chỉ persist thật (PATCH/POST) khi người
  // dùng nhấn "Lưu cuộc họp".
  const beginMeetingDrag = (
    meetId: string,
    type: 'move' | 'resize-start' | 'resize-end',
    startX: number,
    startTime: string,
    endTime: string
  ) => {
    if (!isFillingMeetingTable) {
      setSchMeetingPreviewData(JSON.parse(JSON.stringify(localMeetings)));
      setIsFillingMeetingTable(true);
    }
    setDraggingMeeting({
      meetingId: meetId,
      type,
      startX,
      initialStartTime: startTime,
      initialEndTime: endTime
    });
  };

  const minutesToTimeStr = (mins: number) => {
    const h = Math.max(0, Math.min(23, Math.floor(mins / 60)));
    const m = Math.max(0, Math.min(59, Math.floor(mins % 60)));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const timeStrToMinutes = (tStr: string) => {
    const [h, m] = (tStr || '00:00').split(':').map(Number);
    return h * 60 + m;
  };

  // Helper: get Monday date string of a given ISO week number in a given year.
  const getMondayOfWeek = (year: number, weekNum: number): string => {
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const mondayOfWeek1 = new Date(jan4);
    mondayOfWeek1.setDate(jan4.getDate() - jan4Day + 1);
    const target = new Date(mondayOfWeek1);
    target.setDate(target.getDate() + (weekNum - 1) * 7);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper: get ISO week number from a date string
  const getISOWeekNumber = (dateStr: string): number => {
    const d = new Date(dateStr);
    const dayNum = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  // Sync scheduleCalendarDate khi user thay đổi scheduleWeekNumber (chỉ cho display Tuần)
  useEffect(() => {
    if (scheduleDisplay === 'Tuần') {
      const year = new Date(scheduleCalendarDate).getFullYear();
      const monday = getMondayOfWeek(year, scheduleWeekNumber);
      if (monday !== scheduleCalendarDate) {
        setScheduleCalendarDate(monday);
      }
    }
  }, [scheduleWeekNumber, scheduleDisplay]);

  // Window drag listeners for Meeting Schedule Timeline
  useEffect(() => {
    if (!draggingMeeting) return;

    const handleMouseMove = (e: MouseEvent) => {
      const track = document.getElementById(`meeting-track-${draggingMeeting.meetingId}`) ||
        document.getElementById('meeting-track-combined') ||
        document.querySelector('[id^="meeting-track-"]');
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const deltaMinutes = Math.round(((e.clientX - draggingMeeting.startX) / rect.width * 1440) / 15) * 15;

      const initialStartMins = timeStrToMinutes(draggingMeeting.initialStartTime);
      const initialEndMins = timeStrToMinutes(draggingMeeting.initialEndTime);
      const duration = initialEndMins - initialStartMins;

      const dataToUpdate = isFillingMeetingTable && schMeetingPreviewData ? [...schMeetingPreviewData] : [...localMeetings];
      const meetIndex = dataToUpdate.findIndex(m => m.id === draggingMeeting.meetingId);
      if (meetIndex === -1) return;

      const meet = { ...dataToUpdate[meetIndex] };

      if (draggingMeeting.type === 'move') {
        let newStartMins = initialStartMins + deltaMinutes;
        newStartMins = Math.max(0, Math.min(24 * 60 - duration, newStartMins));
        const newEndMins = newStartMins + duration;

        meet.startTime = minutesToTimeStr(newStartMins);
        meet.endTime = minutesToTimeStr(newEndMins);
      } else if (draggingMeeting.type === 'resize-start') {
        let newStartMins = initialStartMins + deltaMinutes;
        newStartMins = Math.max(0, Math.min(initialEndMins - 15, newStartMins));
        meet.startTime = minutesToTimeStr(newStartMins);
      } else if (draggingMeeting.type === 'resize-end') {
        let newEndMins = initialEndMins + deltaMinutes;
        newEndMins = Math.max(initialStartMins + 15, Math.min(24 * 60, newEndMins));
        meet.endTime = minutesToTimeStr(newEndMins);
      }

      dataToUpdate[meetIndex] = meet;

      if (isFillingMeetingTable) {
        setSchMeetingPreviewData(dataToUpdate);
      } else {
        setLocalMeetings(dataToUpdate);
      }
    };

    const handleMouseUp = () => {
      // Không persist ngay khi thả chuột nữa - việc kéo giờ luôn đưa dữ liệu vào
      // schMeetingPreviewData (chế độ Preview), chỉ gọi API thật khi nhấn "Lưu cuộc họp".
      setDraggingMeeting(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingMeeting, schMeetingPreviewData, localMeetings, isFillingMeetingTable]);

  // Window drag listeners for Attendance Schedule Timeline
  useEffect(() => {
    if (!draggingAttendance) return;

    const handleMouseMove = (e: MouseEvent) => {
      const track = document.getElementById(`attendance-track-${draggingAttendance.empId}`);
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const deltaMinutes = Math.round(((e.clientX - draggingAttendance.startX) / rect.width * 1440) / 15) * 15;

      const initialStartMins = timeStrToMinutes(draggingAttendance.initialStartTime);
      const initialEndMins = timeStrToMinutes(draggingAttendance.initialEndTime);
      const duration = initialEndMins - initialStartMins;

      const dataToUpdate = isFillingTable && schedulePreviewData ? [...schedulePreviewData] : [...scheduleSavedData];
      let empIndex = dataToUpdate.findIndex(d => d.id === draggingAttendance.empId);
      if (empIndex === -1) {
        const gName = humanGroups.find(g => g.id === draggingAttendance.empId)?.name || draggingAttendance.empId;
        dataToUpdate.push({
          id: draggingAttendance.empId,
          name: gName,
          days: {}
        });
        empIndex = dataToUpdate.length - 1;
      }

      const emp = { ...dataToUpdate[empIndex] };
      emp.days = { ...emp.days };
      const cell = { ...emp.days[scheduleCalendarDate] };

      if (draggingAttendance.type === 'move') {
        let newStartMins = initialStartMins + deltaMinutes;
        newStartMins = Math.max(0, Math.min(24 * 60 - duration, newStartMins));
        const newEndMins = newStartMins + duration;

        cell.startTime = minutesToTimeStr(newStartMins);
        cell.endTime = minutesToTimeStr(newEndMins);
      } else if (draggingAttendance.type === 'resize-start') {
        let newStartMins = initialStartMins + deltaMinutes;
        newStartMins = Math.max(0, Math.min(initialEndMins - 15, newStartMins));
        cell.startTime = minutesToTimeStr(newStartMins);
      } else if (draggingAttendance.type === 'resize-end') {
        let newEndMins = initialEndMins + deltaMinutes;
        newEndMins = Math.max(initialStartMins + 15, Math.min(24 * 60, newEndMins));
        cell.endTime = minutesToTimeStr(newEndMins);
      }

      emp.days[scheduleCalendarDate] = { ...cell, assigned: true };
      dataToUpdate[empIndex] = emp;

      if (isFillingTable) {
        setSchedulePreviewData(dataToUpdate);
      } else {
        setScheduleSavedData(dataToUpdate);
      }
    };

    const handleMouseUp = () => {
      setDraggingAttendance(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingAttendance, scheduleCalendarDate, schedulePreviewData, scheduleSavedData, isFillingTable]);

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0d0e12]">
        {/* Header Tab Navigator */}
        <div id="schedule-tabs-bar" className="h-14 bg-[#181921] border-b border-[#252731] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="text-xs text-slate-400 font-semibold tracking-wider">Lịch Ra Vào</div>

            {/* Sliding Big Pill Segmented Control Container */}
            <div className="flex bg-[#111218] p-1 rounded-full border border-[#2d2f3c] space-x-1">
              {/* Tab 1: Quản lý lịch chấm công */}
              <button
                id="schedule-tab-btn-attendance"
                onClick={() => setActiveScheduleSubTab('attendance-schedule')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 cursor-pointer ${activeScheduleSubTab === 'attendance-schedule'
                  ? 'bg-[#0078d7] text-white shadow-lg shadow-[#0078d7]/20'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Calendar size={14} />
                <span>Quản lý lịch chấm công</span>
              </button>

              {/* Tab 2: Quản lý lịch họp */}
              <button
                id="schedule-tab-btn-meeting"
                onClick={() => setActiveScheduleSubTab('meeting-schedule')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 cursor-pointer ${activeScheduleSubTab === 'meeting-schedule'
                  ? 'bg-[#0078d7] text-white shadow-lg shadow-[#0078d7]/20'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                <Clock size={14} />
                <span>Quản lý lịch họp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Body Content: Lịch biểu Chấm công (Interactive Builder) or Lịch họp (Bỏ trống) */}
        {activeScheduleSubTab === 'attendance-schedule' ? (
          <div className="flex-1 p-6 flex flex-col bg-[#0d0e12] overflow-y-auto space-y-5 relative min-h-[400px]">
            <div className={`flex flex-col space-y-5 flex-1 transition-all duration-300 ${!showAttendanceScheduleDemo ? 'blur-sm pointer-events-none select-none' : ''}`}>
            {/* REPORT BUILDER-LIKE CONTROLS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* LEFT PANEL: CẤU HÌNH KHU VỰC */}
              <div className="bg-[#14151b] border border-[#21232d] rounded-2xl p-5 shadow-xl flex flex-col justify-between relative">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800/60 flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />
                    <span>Cấu hình khu vực</span>
                  </h4>

                  <div className="space-y-4">
                    {/* Multiselect Khu vực */}
                    <div className="space-y-1.5 text-left relative">
                      <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Khu vực giám sát</label>
                      <div className="relative">
                        <button
                          type="button"
                          id="sch-areas-dropdown-btn"
                          onClick={() => {
                            setIsSchAreasOpen(!isSchAreasOpen);
                            setIsSchDisplayOpen(false);
                            setIsSchTypeOpen(false);
                            setIsSchGroupsOpen(false);
                          }}
                          className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white text-left flex items-center justify-between transition-all focus:outline-none min-h-[42px] cursor-pointer"
                        >
                          <div className="flex flex-wrap gap-1.5 items-center max-w-[90%] py-0.5">
                            {scheduleSelectedAreas.length === 0 ? (
                              <span className="text-slate-400">Chọn khu vực giám sát...</span>
                            ) : (
                              scheduleSelectedAreas.map(aName => (
                                <span key={aName} className="bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {aName}
                                </span>
                              ))
                            )}
                          </div>
                          <ChevronDown size={14} className="text-slate-400 shrink-0" />
                        </button>
                        {isSchAreasOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsSchAreasOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1.5 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden">
                              {['Checkin Area', 'Checkout Area', 'Lobby Area', 'Server Room'].map((areaOption) => {
                                const isSelected = scheduleSelectedAreas.includes(areaOption);
                                return (
                                  <button
                                    key={areaOption}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setScheduleSelectedAreas(scheduleSelectedAreas.filter(a => a !== areaOption));
                                      } else {
                                        setScheduleSelectedAreas([...scheduleSelectedAreas, areaOption]);
                                      }
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-[#20212a] flex items-center space-x-3 text-slate-300 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      readOnly
                                      className="rounded border-[#2d2f3c] bg-[#111218] text-[#00a2e8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                                    />
                                    <span className={isSelected ? 'text-[#00a2e8] font-semibold' : ''}>{areaOption}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Multiselect Áp dụng cho Nhóm */}
                    <div className="space-y-1.5 text-left relative">
                      <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Áp dụng cho Nhóm</label>
                      <div className="relative">
                        <button
                          type="button"
                          id="sch-groups-dropdown-btn"
                          onClick={() => {
                            setIsSchGroupsOpen(!isSchGroupsOpen);
                            setIsSchAreasOpen(false);
                            setIsSchDisplayOpen(false);
                            setIsSchTypeOpen(false);
                          }}
                          className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white text-left flex items-center justify-between transition-all focus:outline-none min-h-[42px] cursor-pointer"
                        >
                          <div className="flex flex-wrap gap-1.5 items-center max-w-[90%] py-0.5">
                            {computedSelectedGroups.length === 0 ? (
                              <span className="text-slate-400">Chọn nhóm nhân viên...</span>
                            ) : (
                              computedSelectedGroups.map(gid => {
                                const g = humanGroups.find(hg => hg.id === gid);
                                return (
                                  <span key={gid} className="bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {g?.name || gid}
                                  </span>
                                );
                              })
                            )}
                          </div>
                          <ChevronDown size={14} className="text-slate-400 shrink-0" />
                        </button>
                        {isSchGroupsOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsSchGroupsOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1.5 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden max-h-56 overflow-y-auto">
                              {humanGroups.length === 0 ? (
                                <div className="px-4 py-3 text-xs text-slate-500 italic">Chưa có nhóm nhân viên nào.</div>
                              ) : (
                                humanGroups.map((groupOption) => {
                                  const isSelected = computedSelectedGroups.includes(groupOption.id);
                                  return (
                                    <button
                                      key={groupOption.id}
                                      type="button"
                                      onClick={() => toggleGroupSelection(groupOption.id)}
                                      className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-[#20212a] flex items-center space-x-3 text-slate-300 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                        className="rounded border-[#2d2f3c] bg-[#111218] text-[#00a2e8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                                      />
                                      <span className={isSelected ? 'text-[#00a2e8] font-semibold' : ''}>{groupOption.name}</span>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL: THIẾT LẬP THỜI GIAN */}
              <div className="bg-[#14151b] border border-[#21232d] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800/60 flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />
                    <span>Thiết lập ca & thời gian</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Từ giờ */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Từ (giờ)</label>
                      <input
                        type="time"
                        value={scheduleStartTime}
                        onChange={(e) => setScheduleStartTime(e.target.value)}
                        className="w-full bg-[#1c1d26] border border-[#2d2f3c] text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#00a2e8] h-[42px] font-mono cursor-pointer"
                      />
                    </div>

                    {/* Đến giờ */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Đến (giờ)</label>
                      <input
                        type="time"
                        value={scheduleEndTime}
                        onChange={(e) => setScheduleEndTime(e.target.value)}
                        className="w-full bg-[#1c1d26] border border-[#2d2f3c] text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#00a2e8] h-[42px] font-mono cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Loại Dropdown & Action Button */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Loại dropdown */}
                    <div className="space-y-1.5 text-left relative">
                      <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Loại</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSchTypeOpen(!isSchTypeOpen);
                            setIsSchDisplayOpen(false);
                            setIsSchAreasOpen(false);
                          }}
                          className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl px-4 py-2.5 text-xs text-white text-left flex items-center justify-between transition-all focus:outline-none h-[42px] cursor-pointer"
                        >
                          <span className="font-semibold text-slate-200">{scheduleType} (Mặc định)</span>
                          <ChevronDown size={14} className="text-slate-400" />
                        </button>
                        {isSchTypeOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsSchTypeOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1.5 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden">
                              {['Chấm công', 'Tăng ca', 'Nghỉ phép'].map((typeOption) => (
                                <button
                                  key={typeOption}
                                  type="button"
                                  onClick={() => {
                                    setScheduleType(typeOption);
                                    setIsSchTypeOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-[#20212a] flex items-center justify-between ${scheduleType === typeOption ? 'text-[#00a2e8] bg-[#00a2e8]/10 font-bold' : 'text-slate-300'
                                    }`}
                                >
                                  <span>{typeOption} {typeOption === 'Chấm công' ? '(Mặc định)' : ''}</span>
                                  {scheduleType === typeOption && <Check size={14} className="text-[#00a2e8]" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Button "Điền vào bảng" */}
                    {/* Button "Điền vào bảng" + Checkbox Trừ cuối tuần */}
                    <div className="flex items-end space-x-3">
                      {/* Checkbox Trừ ngày cuối tuần */}
                      <label className="flex items-center space-x-2 cursor-pointer select-none h-[42px]">
                        <input
                          type="checkbox"
                          checked={excludeWeekends}
                          onChange={(e) => setExcludeWeekends(e.target.checked)}
                          className="rounded border-[#2d2f3c] bg-[#111218] text-[#00a2e8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                        />
                        <span className="text-[10px] text-slate-300 font-semibold whitespace-nowrap">Trừ ngày cuối tuần</span>
                      </label>

                      <button
                        onClick={() => {
                          // Construct active base list from humanGroups if populated, otherwise scheduleSavedData
                          const currentList = humanGroups.length > 0
                            ? humanGroups.map(group => {
                              const source = scheduleSavedData;
                              const match = source.find(s => s.name === group.name || s.id === group.id);
                              return {
                                id: group.id,
                                name: group.name,
                                days: match?.days || {
                                  '2026-07-10': { assigned: false },
                                  '2026-07-11': { assigned: false },
                                  '2026-07-12': { assigned: false },
                                  '2026-07-13': { assigned: false },
                                  '2026-07-14': { assigned: false },
                                  '2026-07-15': { assigned: false },
                                  '2026-07-16': { assigned: false },
                                }
                              };
                            })
                            : scheduleSavedData;

                          const dataToModify = JSON.parse(JSON.stringify(currentList));
                          let datesToApply: string[] = [];

                          if (scheduleDisplay === 'Ngày') {
                            datesToApply = [scheduleCalendarDate];
                          } else if (scheduleDisplay === 'Tuần') {
                            const start = new Date(scheduleCalendarDate);
                            for (let i = 0; i < 7; i++) {
                              const d = new Date(start);
                              d.setDate(start.getDate() + i);
                              const yyyy = d.getFullYear();
                              const mm = String(d.getMonth() + 1).padStart(2, '0');
                              const dd = String(d.getDate()).padStart(2, '0');
                              datesToApply.push(`${yyyy}-${mm}-${dd}`);
                            }
                          } else if (scheduleDisplay === 'Tháng') {
                            const start = new Date(scheduleCalendarDate);
                            for (let i = 0; i < 30; i++) {
                              const d = new Date(start);
                              d.setDate(start.getDate() + i);
                              const yyyy = d.getFullYear();
                              const mm = String(d.getMonth() + 1).padStart(2, '0');
                              const dd = String(d.getDate()).padStart(2, '0');
                              datesToApply.push(`${yyyy}-${mm}-${dd}`);
                            }
                          } else { // Năm
                            const start = new Date(scheduleCalendarDate);
                            for (let i = 0; i < 90; i++) {
                              const d = new Date(start);
                              d.setDate(start.getDate() + i);
                              const yyyy = d.getFullYear();
                              const mm = String(d.getMonth() + 1).padStart(2, '0');
                              const dd = String(d.getDate()).padStart(2, '0');
                              datesToApply.push(`${yyyy}-${mm}-${dd}`);
                            }
                          }

                          // Loại bỏ T7/CN nếu checkbox "Trừ ngày cuối tuần" được tick
                          if (excludeWeekends) {
                            datesToApply = datesToApply.filter(dateStr => {
                              const dayOfWeek = new Date(dateStr).getDay();
                              return dayOfWeek !== 0 && dayOfWeek !== 6; // 0=CN, 6=T7
                            });
                          }

                          const isAnyCellSelected = Object.values(scheduleSelectedCells).some(dates => dates.length > 0);

                          dataToModify.forEach((emp: any) => {
                            datesToApply.forEach((dateStr) => {
                              if (isAnyCellSelected) {
                                if (!(scheduleSelectedCells[emp.id] || []).includes(dateStr)) {
                                  return;
                                }
                              } else {
                                if (computedSelectedGroups.length > 0 && !computedSelectedGroups.includes(emp.id)) {
                                  return;
                                }
                              }

                              setCellForType(emp, dateStr, scheduleType, {
                                assigned: true,
                                shiftName: 'Ca hành chính',
                                startTime: scheduleStartTime,
                                endTime: scheduleEndTime,
                                type: scheduleType,
                                areas: [...scheduleSelectedAreas]
                              });
                            });
                          });

                          setSchedulePreviewData(dataToModify);
                          setIsFillingTable(true);
                        }}
                        className="w-full bg-[#0078d7] hover:bg-[#006fca] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 active:scale-95 shadow-md shadow-[#0078d7]/20 cursor-pointer h-[42px] text-xs"
                      >
                        <span>Điền vào bảng</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE CALENDAR TABLE CONTAINER */}
            <div className="bg-[#14151b] border border-[#21232d] rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-[#181922] border-b border-[#21232d] flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#00a2e8]" />
                    <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase">Lịch Biểu Nhân Sự</h4>
                  </div>

                  {/* Dropdown Hiển thị moved here */}
                  <div className="relative text-left z-20">
                    <button
                      type="button"
                      id="sch-display-dropdown-btn"
                      onClick={() => {
                        setIsSchDisplayOpen(!isSchDisplayOpen);
                        setIsSchAreasOpen(false);
                        setIsSchTypeOpen(false);
                        setIsSchGroupsOpen(false);
                      }}
                      className="bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl px-3 py-1.5 text-xs text-white flex items-center space-x-2 transition-all focus:outline-none h-[32px] cursor-pointer"
                    >
                      <span className="font-semibold text-slate-300">Hiển thị: {scheduleDisplay} {scheduleDisplay === 'Ngày' ? '(Mặc định)' : ''}</span>
                      <ChevronDown size={12} className="text-slate-400" />
                    </button>
                    {isSchDisplayOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsSchDisplayOpen(false)} />
                        <div className="absolute left-0 mt-1.5 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden w-[180px]">
                          {(['Ngày', 'Tuần', 'Tháng', 'Năm'] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setScheduleDisplay(opt);
                                setIsSchDisplayOpen(false);
                                if (opt === 'Tuần') {
                                  setScheduleWeekNumber(getISOWeekNumber(scheduleCalendarDate));
                                }
                              }}
                              className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-[#20212a] flex items-center justify-between ${scheduleDisplay === opt ? 'text-[#00a2e8] bg-[#00a2e8]/10 font-bold' : 'text-slate-300'
                                }`}
                            >
                              <span>{opt} {opt === 'Ngày' ? '(Mặc định)' : ''}</span>
                              {scheduleDisplay === opt && <Check size={12} className="text-[#00a2e8]" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Week number picker - chỉ hiển thị khi mode Tuần */}
                  {scheduleDisplay === 'Tuần' && (
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400 font-semibold">Tuần</span>
                      <div className="flex items-center space-x-1 bg-[#1c1d26] border border-[#2d2f3c] rounded-lg overflow-hidden h-[32px]">
                        <button
                          type="button"
                          onClick={() => setScheduleWeekNumber(Math.max(1, scheduleWeekNumber - 1))}
                          className="px-1.5 py-1 hover:bg-[#20212a] text-slate-400 hover:text-[#00a2e8] transition-colors"
                          title="Tuần trước"
                        >
                          <ChevronDown size={14} className="rotate-90" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={53}
                          value={scheduleWeekNumber}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(53, parseInt(e.target.value, 10) || 1));
                            setScheduleWeekNumber(val);
                          }}
                          className="w-12 bg-transparent text-xs text-white text-center font-mono focus:outline-none [&::-webkit-outer-spin-button]:[appearance:none] [&::-webkit-inner-spin-button]:[appearance:none] [&]:[-moz-appearance:textfield]"
                        />
                        <button
                          type="button"
                          onClick={() => setScheduleWeekNumber(Math.min(53, scheduleWeekNumber + 1))}
                          className="px-1.5 py-1 hover:bg-[#20212a] text-slate-400 hover:text-[#00a2e8] transition-colors"
                          title="Tuần sau"
                        >
                          <ChevronDown size={14} className="-rotate-90" />
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">/{new Date(scheduleCalendarDate).getFullYear()}</span>
                      <input
                        type="number"
                        min={2000}
                        max={2100}
                        value={new Date(scheduleCalendarDate).getFullYear()}
                        onChange={(e) => {
                          const year = Math.max(2000, Math.min(2100, parseInt(e.target.value, 10) || 2026));
                          const monday = getMondayOfWeek(year, scheduleWeekNumber);
                          setScheduleCalendarDate(monday);
                        }}
                        className="w-16 bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-lg px-2 py-1 text-xs text-white text-center font-mono focus:outline-none h-[32px] [&::-webkit-outer-spin-button]:[appearance:none] [&::-webkit-inner-spin-button]:[appearance:none] [&]:[-moz-appearance:textfield]"
                      />
                    </div>
                  )}
                </div>
                {isFillingTable && (
                  <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Preview Mode</span>
                  </div>
                )}
              </div>

              <div className="w-full overflow-x-auto">
                {(() => {
                  const baseList = isFillingTable && schedulePreviewData ? schedulePreviewData : scheduleSavedData;
                  const activeSchedules = humanGroups.length > 0
                    ? humanGroups.map(group => {
                      const match = baseList.find(s => s.name === group.name || s.id === group.id);
                      return {
                        id: group.id,
                        name: group.name,
                        days: match?.days || {
                          '2026-07-10': { assigned: false },
                          '2026-07-11': { assigned: false },
                          '2026-07-12': { assigned: false },
                          '2026-07-13': { assigned: false },
                          '2026-07-14': { assigned: false },
                          '2026-07-15': { assigned: false },
                          '2026-07-16': { assigned: false },
                        }
                      };
                    })
                    : baseList;

                  // RENDER TABLE ACCORDING TO DISPLAY VIEW MODE
                  if (scheduleDisplay === 'Tuần') {
                    // Compute week dates starting from scheduleCalendarDate
                    const weekDays = [];
                    const start = new Date(scheduleCalendarDate);
                    for (let i = 0; i < 7; i++) {
                      const d = new Date(start);
                      d.setDate(start.getDate() + i);
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      const yyyy = d.getFullYear();
                      const dayOfWeek = d.getDay();
                      const dayOfWeekLabel = dayOfWeek === 0 ? 'CN' : `Thứ ${dayOfWeek + 1}`;
                      weekDays.push({
                        dateStr: `${yyyy}-${mm}-${dd}`,
                        label: `${dayOfWeekLabel} - ${dd}/${mm}`
                      });
                    }

                    const isAllTableSelected = activeSchedules.length > 0 && activeSchedules.every(emp =>
                      weekDays.every(day => isCellSelected(emp.id, day.dateStr))
                    );

                    return (
                      <table className="w-full border-collapse text-left min-w-[800px]">
                        <thead>
                          <tr className="bg-[#181922]">
                            <th
                              className={`p-4 text-[11px] font-bold uppercase tracking-wider text-left cursor-pointer select-none transition-colors border-t-4 w-[20%] ${isAllTableSelected
                                ? 'bg-[#0078d7]/20 text-[#00a2e8] border-t-[#00a2e8] border-l-4 border-l-[#00a2e8] border-b border-[#21232d]'
                                : 'text-slate-400 hover:bg-[#20212a] border-t-transparent border-b border-[#21232d]'
                                }`}
                              onClick={() => {
                                const newCells = { ...scheduleSelectedCells };
                                activeSchedules.forEach(emp => {
                                  if (isAllTableSelected) {
                                    const current = newCells[emp.id] || [];
                                    newCells[emp.id] = current.filter(d => !weekDays.some(wd => wd.dateStr === d));
                                  } else {
                                    const current = newCells[emp.id] || [];
                                    const updated = [...current];
                                    weekDays.forEach(day => {
                                      if (!updated.includes(day.dateStr)) {
                                        updated.push(day.dateStr);
                                      }
                                    });
                                    newCells[emp.id] = updated;
                                  }
                                });
                                setScheduleSelectedCells(newCells);
                              }}
                            >
                              <span>Nhóm nhân viên</span>
                            </th>
                            {weekDays.map((day) => {
                              const isAllSelected = activeSchedules.every(emp => isCellSelected(emp.id, day.dateStr));
                              return (
                                <th
                                  key={day.dateStr}
                                  className={`p-4 text-[11px] font-bold uppercase tracking-wider text-center cursor-pointer select-none transition-colors border-t-4 ${isAllSelected
                                    ? 'bg-[#0078d7]/20 text-[#00a2e8] border-t-[#00a2e8] border-b border-[#21232d]'
                                    : 'text-slate-400 hover:bg-[#20212a] border-t-transparent border-b border-[#21232d]'
                                    }`}
                                  onClick={() => {
                                    const newCells = { ...scheduleSelectedCells };
                                    activeSchedules.forEach(emp => {
                                      const current = newCells[emp.id] || [];
                                      if (isAllSelected) {
                                        newCells[emp.id] = current.filter(d => d !== day.dateStr);
                                      } else {
                                        if (!current.includes(day.dateStr)) {
                                          newCells[emp.id] = [...current, day.dateStr];
                                        }
                                      }
                                    });
                                    setScheduleSelectedCells(newCells);
                                  }}
                                >
                                  <div className="flex flex-col items-center space-y-1">
                                    <span>{day.label}</span>
                                    {/* <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                      isAllSelected ? 'bg-[#00a2e8]/20 text-[#00a2e8] font-semibold' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      {isAllSelected ? 'Hủy chọn cột' : 'Chọn cột'}
                                    </span> */}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#21232d] bg-[#111218]">
                          {activeSchedules.map((emp) => (
                            <tr key={emp.id} className="hover:bg-[#1a1b24]/40 transition">
                              <td
                                className={`p-4 border-b border-[#21232d] cursor-pointer transition-colors ${computedSelectedGroups.includes(emp.id) ? 'bg-[#0078d7]/20 border-l-4 border-l-[#00a2e8]' : 'hover:bg-[#1a1b24]'
                                  }`}
                                onClick={() => toggleGroupSelection(emp.id)}
                              >
                                <div className="flex items-center space-x-2 text-left">
                                  <input
                                    type="checkbox"
                                    checked={computedSelectedGroups.includes(emp.id)}
                                    readOnly
                                    className="rounded border-[#2d2f3c] bg-[#111218] text-[#00a2e8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                                  />
                                  <span className={`font-bold text-xs tracking-tight leading-snug ${computedSelectedGroups.includes(emp.id) ? 'text-[#00a2e8]' : 'text-slate-100'
                                    }`}>{emp.name}</span>
                                </div>
                              </td>
                              {weekDays.map((day) => {
                                const cell = getCellForType(emp, day.dateStr, scheduleType);
                                const isSelected = isCellSelected(emp.id, day.dateStr);
                                const conflict = cell.assigned && hasOtherTypeSchedule(emp, day.dateStr, scheduleType);

                                if (conflict) {
                                  return (
                                    <td
                                      key={day.dateStr}
                                      className={`p-3 border-b border-[#21232d] align-middle text-center cursor-pointer transition-colors ${isSelected ? 'bg-[#0078d7]/10' : ''
                                        }`}
                                      onClick={() => toggleCellSelection(emp.id, day.dateStr)}
                                    >
                                      <div
                                        className={`border border-red-500 bg-red-500/10 rounded-xl p-3 flex flex-col justify-center items-center text-center h-[72px] min-w-[120px] transition-all duration-300 relative ${isSelected ? 'ring-2 ring-[#00a2e8]' : ''
                                          }`}
                                        title={`Ngày này nhóm ${emp.name} đã có lịch biểu khác`}
                                      >
                                        <div className="font-bold text-[11px] text-red-500">{cell.shiftName || 'Ca hành chính'}</div>
                                        <div className="text-[10px] text-red-400 font-mono mt-0.5 font-semibold tracking-wide">{cell.startTime}-{cell.endTime}</div>
                                        <div className="text-[8px] text-red-400/80 uppercase font-bold mt-1">Trùng lịch</div>
                                      </div>
                                    </td>
                                  );
                                } else if (cell.assigned) {
                                  return (
                                    <td
                                      key={day.dateStr}
                                      className={`p-3 border-b border-[#21232d] align-middle text-center cursor-pointer transition-colors ${isSelected ? 'bg-[#0078d7]/10' : ''
                                        }`}
                                      onClick={() => toggleCellSelection(emp.id, day.dateStr)}
                                    >
                                      <div
                                        className={`border border-[#0078d7] bg-[#0078d7]/5 rounded-xl p-3 flex flex-col justify-center items-center text-center h-[72px] min-w-[120px] transition-all duration-300 ${isSelected ? 'ring-2 ring-[#00a2e8]' : ''
                                          }`}
                                      >
                                        <div className="font-bold text-[11px] text-[#00a2e8]">{cell.shiftName || 'Ca hành chính'}</div>
                                        <div className="text-[10px] text-slate-300 font-mono mt-0.5 font-semibold tracking-wide">{cell.startTime}-{cell.endTime}</div>
                                      </div>
                                    </td>
                                  );
                                } else {
                                  return (
                                    <td
                                      key={day.dateStr}
                                      className={`p-3 border-b border-[#21232d] align-middle text-center cursor-pointer transition-colors ${isSelected ? 'bg-[#0078d7]/10' : ''
                                        }`}
                                      onClick={() => toggleCellSelection(emp.id, day.dateStr)}
                                    >
                                      <div className="flex justify-center items-center h-[72px]">
                                        <span className={`border px-3.5 py-1 rounded-full text-center text-[10px] font-semibold tracking-wide shadow-sm uppercase ${isSelected
                                          ? 'bg-[#00a2e8]/20 border-[#00a2e8] text-[#00a2e8]'
                                          : 'bg-[#1c1d26]/60 border border-[#2d2f3c] text-slate-500'
                                          }`}>
                                          {isSelected ? 'Selected' : 'Unassigned'}
                                        </span>
                                      </div>
                                    </td>
                                  );
                                }
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  } else if (scheduleDisplay === 'Ngày') {
                    // RENDER 24-HOUR TIMELINE VIEW
                    return (
                      <div className="p-5 space-y-6 bg-[#111218] min-w-[800px]">
                        {/* Hours Labels Strip */}
                        <div className="grid grid-cols-24 gap-0 pl-[20%] text-[9px] font-mono font-bold text-slate-500 tracking-wider text-center border-b border-[#21232d]/60 pb-2">
                          {Array.from({ length: 24 }, (_, h) => (
                            <div key={h} className="border-r border-[#21232d]/30 last:border-0">
                              {String(h).padStart(2, '0')}:00
                            </div>
                          ))}
                        </div>

                        {/* Timeline Rows */}
                        {activeSchedules.map((emp) => {
                          const cell = getCellForType(emp, scheduleCalendarDate, scheduleType);
                          const conflict = cell.assigned && hasOtherTypeSchedule(emp, scheduleCalendarDate, scheduleType);

                          // Compute percentage offset
                          const parseTimeToPercent = (tStr: string) => {
                            const [h, m] = (tStr || '00:00').split(':').map(Number);
                            return ((h * 60 + m) / (24 * 60)) * 100;
                          };

                          const startPct = cell.assigned ? parseTimeToPercent(cell.startTime || '08:00') : 0;
                          const endPct = cell.assigned ? parseTimeToPercent(cell.endTime || '17:00') : 0;
                          const barWidth = cell.assigned ? Math.max(endPct - startPct, 3) : 0;

                          return (
                            <div key={emp.id} className="flex items-center">
                              {/* Employee Column Header */}
                              <div
                                className={`w-[20%] text-left pr-4 p-2 cursor-pointer rounded-l-xl transition-colors ${computedSelectedGroups.includes(emp.id) ? 'bg-[#0078d7]/20 border-l-4 border-l-[#00a2e8]' : 'hover:bg-[#1a1b24]/40'
                                  }`}
                                onClick={() => toggleGroupSelection(emp.id)}
                              >
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={computedSelectedGroups.includes(emp.id)}
                                    readOnly
                                    className="rounded border-[#2d2f3c] bg-[#111218] text-[#00a2e8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                                  />
                                  <span className={`font-bold text-xs block truncate ${computedSelectedGroups.includes(emp.id) ? 'text-[#00a2e8]' : 'text-slate-100'
                                    }`}>{emp.name}</span>
                                </div>
                              </div>

                              {/* Continuous Horizontal Timeline Bar */}
                              <div
                                id={`attendance-track-${emp.id}`}
                                className="flex-1 h-12 bg-[#171822] border border-[#2d2f3c]/60 rounded-2xl relative overflow-hidden flex items-center shadow-inner"
                              >
                                {/* Background Grid Lines */}
                                {Array.from({ length: 24 }, (_, h) => (
                                  <div key={h} className="absolute top-0 bottom-0 border-r border-[#21232d]/30" style={{ left: `${(h / 24) * 100}%` }} />
                                ))}

                                {/* Render Filled Scheduled Bar */}
                                {cell.assigned ? (
                                  <div
                                    className={`absolute top-1.5 bottom-1.5 rounded-xl flex items-center justify-between px-1 shadow-md group transition duration-200 cursor-move ${conflict
                                      ? 'bg-red-500/20 border border-red-500 shadow-red-500/10 hover:bg-red-500/30'
                                      : 'bg-[#00a2e8]/20 border border-[#00a2e8] shadow-[#00a2e8]/10 hover:bg-[#00a2e8]/30'
                                      }`}
                                    style={{ left: `${startPct}%`, width: `${barWidth}%` }}
                                    title={conflict ? `Ngày này nhóm ${emp.name} đã có lịch biểu khác` : undefined}
                                    onMouseDown={(e) => {
                                      setDraggingAttendance({
                                        empId: emp.id,
                                        type: 'move',
                                        startX: e.clientX,
                                        initialStartTime: cell.startTime,
                                        initialEndTime: cell.endTime
                                      });
                                    }}
                                  >
                                    {/* Left resize handle */}
                                    <div
                                      className={`w-2.5 h-full rounded-l-lg cursor-ew-resize flex items-center justify-center text-white text-[8px] font-bold ${conflict ? 'bg-red-500/50 hover:bg-red-500' : 'bg-[#00a2e8]/50 hover:bg-[#00a2e8]'
                                        }`}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        setDraggingAttendance({
                                          empId: emp.id,
                                          type: 'resize-start',
                                          startX: e.clientX,
                                          initialStartTime: cell.startTime,
                                          initialEndTime: cell.endTime
                                        });
                                      }}
                                    >
                                      ⋮
                                    </div>

                                    <div className={`text-[10px] font-bold font-mono tracking-wider truncate flex items-center space-x-1.5 px-2 select-none pointer-events-none ${conflict ? 'text-red-400' : 'text-[#00a2e8]'
                                      }`}>
                                      <Clock size={11} className="shrink-0" />
                                      <span>{cell.shiftName || 'Ca hành chính'} ({cell.startTime} - {cell.endTime}){conflict ? ' - Trùng lịch' : ''}</span>
                                    </div>

                                    {/* Right resize handle */}
                                    <div
                                      className={`w-2.5 h-full rounded-r-lg cursor-ew-resize flex items-center justify-center text-white text-[8px] font-bold ${conflict ? 'bg-red-500/50 hover:bg-red-500' : 'bg-[#00a2e8]/50 hover:bg-[#00a2e8]'
                                        }`}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        setDraggingAttendance({
                                          empId: emp.id,
                                          type: 'resize-end',
                                          startX: e.clientX,
                                          initialStartTime: cell.startTime,
                                          initialEndTime: cell.endTime
                                        });
                                      }}
                                    >
                                      ⋮
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-full text-center text-[10px] text-slate-600 font-semibold uppercase tracking-widest pointer-events-none">
                                    Chưa phân lịch (Unassigned)
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  } else if (scheduleDisplay === 'Tháng') {
                    // RENDER MONTHLY COMPACT DOT MATRIX GRID
                    const monthDays = [];
                    const start = new Date(scheduleCalendarDate);
                    for (let i = 0; i < 30; i++) {
                      const d = new Date(start);
                      d.setDate(start.getDate() + i);
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      const yyyy = d.getFullYear();
                      monthDays.push({
                        dateStr: `${yyyy}-${mm}-${dd}`,
                        label: `${mm}-${dd}`
                      });
                    }

                    return (
                      <div className="p-5 space-y-6 bg-[#111218] min-w-[800px]">
                        {activeSchedules.map((emp) => (
                          <div key={emp.id} className="flex items-start border-b border-[#21232d] pb-5 last:border-none last:pb-0">
                            <div
                              className={`w-[20%] text-left pr-4 pt-1 p-2 cursor-pointer rounded-l-xl transition-colors ${computedSelectedGroups.includes(emp.id) ? 'bg-[#0078d7]/20 border-l-4 border-l-[#00a2e8]' : 'hover:bg-[#1a1b24]/40'
                                }`}
                              onClick={() => toggleGroupSelection(emp.id)}
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={computedSelectedGroups.includes(emp.id)}
                                  readOnly
                                  className="rounded border-[#2d2f3c] bg-[#111218] text-[#00a2e8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                                />
                                <span className={`font-bold text-xs block ${computedSelectedGroups.includes(emp.id) ? 'text-[#00a2e8]' : 'text-slate-100'
                                  }`}>{emp.name}</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wider">Trạng thái phân ca 30 ngày tới:</div>
                              <div className="flex flex-wrap gap-1.5">
                                {monthDays.map((day, dIdx) => {
                                  const cell = getCellForType(emp, day.dateStr, scheduleType);
                                  const isSelected = isCellSelected(emp.id, day.dateStr);
                                  const conflict = cell.assigned && hasOtherTypeSchedule(emp, day.dateStr, scheduleType);
                                  return (
                                    <div
                                      key={dIdx}
                                      onClick={() => toggleCellSelection(emp.id, day.dateStr)}
                                      className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center text-[9px] font-mono font-bold border transition duration-200 cursor-pointer ${conflict
                                        ? 'bg-red-500/15 border-red-500 text-red-500 shadow-md shadow-red-500/5'
                                        : cell.assigned
                                          ? 'bg-[#0078d7]/15 border-[#0078d7] text-[#00a2e8] shadow-md shadow-[#0078d7]/5'
                                          : isSelected
                                            ? 'bg-[#00a2e8]/20 border-[#00a2e8] text-[#00a2e8]'
                                            : 'bg-[#1c1d26]/40 border-[#2d2f3c] text-slate-600 hover:border-slate-500'
                                        } ${isSelected && !conflict && !cell.assigned ? 'ring-2 ring-[#00a2e8]' : ''}`}
                                      title={
                                        conflict
                                          ? `Ngày này nhóm ${emp.name} đã có lịch biểu khác`
                                          : cell.assigned
                                            ? `${day.dateStr}: ${cell.shiftName} (${cell.startTime}-${cell.endTime})`
                                            : `${day.dateStr}: Unassigned`
                                      }
                                    >
                                      <span className="text-[7px] text-slate-500 leading-none">{day.label.split('-')[0]}</span>
                                      <span className="text-xs leading-none mt-0.5">{day.label.split('-')[1]}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    // RENDER ANNUAL DISTRIBUTION SUMMARY CARDS
                    return (
                      <div className="p-6 bg-[#111218] grid grid-cols-1 md:grid-cols-2 gap-6 min-w-[800px]">
                        {activeSchedules.map((emp) => {
                          // Count active shifts for current type
                          const daysCount = Object.keys(emp.days).filter(k => {
                            if (k.endsWith(`_${scheduleType}`)) return emp.days[k].assigned;
                            if (!k.includes('_')) return emp.days[k].assigned && emp.days[k].type === scheduleType;
                            return false;
                          }).length;
                          return (
                            <div key={emp.id} className={`bg-[#181921] border rounded-2xl p-5 space-y-4 transition-all ${computedSelectedGroups.includes(emp.id) ? 'border-[#00a2e8] bg-[#0078d7]/5' : 'border-[#2d2f3c]'
                              }`}>
                              <div className="flex justify-between items-start">
                                <div
                                  className="flex items-center space-x-2 cursor-pointer"
                                  onClick={() => toggleGroupSelection(emp.id)}
                                >
                                  <input
                                    type="checkbox"
                                    checked={computedSelectedGroups.includes(emp.id)}
                                    readOnly
                                    className="rounded border-[#2d2f3c] bg-[#111218] text-[#00a2e8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                                  />
                                  <span className={`text-xs font-bold block ${computedSelectedGroups.includes(emp.id) ? 'text-[#00a2e8]' : 'text-slate-200'
                                    }`}>{emp.name}</span>
                                </div>
                                <div className="px-2.5 py-1 rounded bg-[#00a2e8]/10 border border-[#00a2e8]/20 text-[10px] text-[#00a2e8] font-mono uppercase font-bold">
                                  Annual View
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div className="bg-[#111218] p-3 rounded-xl border border-[#2d2f3c]/40 text-center">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Số ca phân</span>
                                  <span className="text-sm font-bold text-[#00a2e8] font-mono">{daysCount} ca</span>
                                </div>
                                <div className="bg-[#111218] p-3 rounded-xl border border-[#2d2f3c]/40 text-center">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Tổng giờ</span>
                                  <span className="text-sm font-bold text-slate-200 font-mono">{daysCount * 9} giờ</span>
                                </div>
                                <div className="bg-[#111218] p-3 rounded-xl border border-[#2d2f3c]/40 text-center">
                                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mb-1">Khu vực kiểm soát</span>
                                  <span className="text-sm font-bold text-slate-400 font-mono">Checkin</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                })()}
              </div>
            </div>

            {/* BOTTOM SAVE ACTIONS GROUP */}
            {isFillingTable ? (
              <div className="flex items-center justify-between bg-[#151722] border-2 border-amber-500/20 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs text-amber-300 font-semibold">Bạn đang ở chế độ Xem trước Lịch biểu (Chưa Lưu). Hãy nhấn Lưu để cập nhật chính thức.</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSchedulePreviewData(null);
                      setIsFillingTable(false);
                    }}
                    className="px-4 py-2 border border-[#2d2f3c] text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Hủy xem trước
                  </button>
                  <button
                    onClick={() => {
                      if (!schedulePreviewData) return;

                      // Check overwrite
                      let hasOverwrite = false;

                      for (let i = 0; i < scheduleSavedData.length; i++) {
                        const savedEmp = scheduleSavedData[i];
                        const previewEmp = schedulePreviewData[i];

                        if (!previewEmp) continue;

                        const previewKeys = Object.keys(previewEmp.days).filter(k => k.endsWith(`_${scheduleType}`) || (!k.includes('_') && previewEmp.days[k].type === scheduleType));
                        for (const key of previewKeys) {
                          const dateStr = key.split('_')[0];
                          const savedCell = getCellForType(savedEmp, dateStr, scheduleType);
                          const previewCell = getCellForType(previewEmp, dateStr, scheduleType);

                          if (previewCell && previewCell.assigned) {
                            if (savedCell && savedCell.assigned) {
                              const isDifferent = savedCell.startTime !== previewCell.startTime ||
                                savedCell.endTime !== previewCell.endTime ||
                                savedCell.type !== previewCell.type;
                              if (isDifferent) {
                                hasOverwrite = true;
                                break;
                              }
                            }
                          }
                        }
                        if (hasOverwrite) break;
                      }

                      if (hasOverwrite) {
                        setShowOverwriteConfirm(true);
                      } else {
                        setScheduleSavedData(schedulePreviewData);
                        setSchedulePreviewData(null);
                        setIsFillingTable(false);
                        setShowScheduleSaveToast(true);
                        setTimeout(() => setShowScheduleSaveToast(false), 4000);
                      }
                    }}
                    className="px-5 py-2.5 bg-[#0078d7] hover:bg-[#006fca] text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-[#0078d7]/20 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Lưu lịch biểu</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end bg-[#14151c] border border-[#21232d] rounded-2xl p-4 shadow-md">
                <button
                  disabled
                  className="px-5 py-2.5 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-not-allowed border border-slate-700/30"
                >
                  <Save size={14} />
                  <span>Đã lưu</span>
                </button>
              </div>
            )}

            </div>
            {!showAttendanceScheduleDemo && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0e12]/60 backdrop-blur-sm p-6 text-center">
                <div className="bg-[#14151b] border border-[#2d2f3c] p-8 rounded-2xl shadow-2xl max-w-sm flex flex-col items-center">
                  <div className="p-3.5 bg-[#00a2e8]/10 rounded-full text-[#00a2e8] mb-4 animate-pulse">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mb-2">Tính năng đang được hoàn thiện</h3>
                  <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">Giao diện xếp ca lịch chấm công đang trong quá trình phát triển hoàn chỉnh.</p>
                  <button
                    type="button"
                    onClick={() => setShowAttendanceScheduleDemo(true)}
                    className="px-5 py-2.5 bg-[#00a2e8] hover:bg-[#008cc9] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#00a2e8]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Xem bản mẫu
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CONDITIONAL VIEW: QUẢN LÝ LỊCH HỌP (Interactive Meeting Schedule Builder & Drag Day Timeline) */
          <div className="flex-1 p-6 flex flex-col bg-[#0d0e12] overflow-y-auto space-y-5">

            {/* MEETING BUILDER CONTROLS - SINGLE PANEL */}
            <div className="bg-[#14151b] border border-[#21232d] rounded-2xl p-5 shadow-xl relative">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800/60 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />
                  <span>Tạo cuộc họp mới</span>
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* CỘT TRÁI - THÔNG TIN CUỘC HỌP */}
                    <div className="border border-[#2d2f3c]/50 rounded-2xl p-4.5 space-y-4 bg-[#181921]/15 relative text-left flex flex-col justify-between">
                      <div>
                        <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-[#2d2f3c]/30 mb-4">
                          <span>Thông tin cuộc họp</span>
                        </h5>

                        <div className="space-y-4">
                          {/* Tên cuộc họp */}
                          <div className="space-y-1.5 text-left">
                            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Tên cuộc họp</label>
                            <input
                              type="text"
                              value={schMeetingTitle}
                              onChange={(e) => setSchMeetingTitle(e.target.value)}
                              placeholder="Nhập tên cuộc họp..."
                              className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-all h-[42px]"
                            />
                          </div>

                          {/* Hàng 2: Khu vực & Nhóm nhân viên */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Multiselect Khu vực (Phòng họp) - load từ location thật (areasData).
                                Chỉ dùng để chọn các khu vực sẽ được thêm cuộc họp vào khi nhấn "Tạo cuộc họp",
                                không dùng để lọc hiển thị bảng lịch bên dưới. */}
                            <div className="space-y-1.5 text-left relative">
                              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Khu vực / Phòng họp áp dụng</label>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsSchMeetingAreaOpen(!isSchMeetingAreaOpen);
                                    setIsSchMeetingDepsOpen(false);
                                  }}
                                  className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white text-left flex items-center justify-between transition-all focus:outline-none min-h-[42px] cursor-pointer"
                                >
                                  <div className="flex flex-wrap gap-1.5 items-center max-w-[90%] py-0.5">
                                    {areasData.length === 0 ? (
                                      <span className="text-slate-400">Chưa có khu vực nào</span>
                                    ) : schMeetingAreaIds.length === 0 ? (
                                      <span className="text-slate-400">Chọn khu vực...</span>
                                    ) : (
                                      schMeetingAreaNames.map((name, idx) => (
                                        <span key={`${name}-${idx}`} className="bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                          {name}
                                        </span>
                                      ))
                                    )}
                                  </div>
                                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                                </button>
                                {isSchMeetingAreaOpen && (
                                  <>
                                    <div className="fixed inset-0 z-30" onClick={() => setIsSchMeetingAreaOpen(false)} />
                                    <div className="absolute left-0 right-0 mt-1.5 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden max-h-56 overflow-y-auto">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (schMeetingAreaIds.includes('all')) {
                                            setSchMeetingAreaIds([]);
                                          } else {
                                            setSchMeetingAreaIds(['all']);
                                          }
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-[#20212a] flex items-center space-x-3 text-slate-300 cursor-pointer border-b border-[#2d2f3c]/40 pb-2.5"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={schMeetingAreaIds.includes('all')}
                                          readOnly
                                          className="rounded border-[#2d2f3c] bg-[#111218] text-[#00a2e8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span className={schMeetingAreaIds.includes('all') ? 'text-[#00a2e8] font-semibold' : ''}>All (*) - Mặc định</span>
                                      </button>
                                      {areasData.length === 0 ? (
                                        <div className="px-4 py-3 text-xs text-slate-500 italic">Chưa có khu vực nào, vui lòng tạo ở trang Quản lý khu vực.</div>
                                      ) : (
                                        areasData.map((a) => {
                                          const isSelected = schMeetingAreaIds.includes(a.id);
                                          return (
                                            <button
                                              key={a.id}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  setSchMeetingAreaIds(schMeetingAreaIds.filter(id => id !== a.id));
                                                } else {
                                                  const withoutAll = schMeetingAreaIds.filter(id => id !== 'all');
                                                  setSchMeetingAreaIds([...withoutAll, a.id]);
                                                }
                                              }}
                                              className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-[#20212a] flex items-center space-x-3 text-slate-300 cursor-pointer"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                                className="rounded border-[#2d2f3c] bg-[#111218] text-[#00a2e8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                                              />
                                              <span className={isSelected ? 'text-[#00a2e8] font-semibold' : ''}>{a.name}</span>
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Multiselect nhóm nhân viên - load từ human_list thật (humanGroups) */}
                            <div className="space-y-1.5 text-left relative">
                              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">nhóm nhân viên tham gia</label>
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsSchMeetingDepsOpen(!isSchMeetingDepsOpen);
                                    setIsSchMeetingAreaOpen(false);
                                  }}
                                  className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white text-left flex items-center justify-between transition-all focus:outline-none min-h-[42px] cursor-pointer"
                                >
                                  <div className="flex flex-wrap gap-1.5 items-center max-w-[90%] py-0.5">
                                    {schMeetingHumanGroupIds.length === 0 ? (
                                      <span className="text-slate-400">Chọn nhóm nhân viên...</span>
                                    ) : (
                                      schMeetingHumanGroupIds.map(gid => {
                                        if (gid === 'all') {
                                          return (
                                            <span key="all" className="bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                              All (*)
                                            </span>
                                          );
                                        }
                                        const g = humanGroups.find(hg => hg.id === gid);
                                        return (
                                          <span key={gid} className="bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                            {g?.name || gid}
                                          </span>
                                        );
                                      })
                                    )}
                                  </div>
                                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                                </button>
                                {isSchMeetingDepsOpen && (
                                  <>
                                    <div className="fixed inset-0 z-30" onClick={() => setIsSchMeetingDepsOpen(false)} />
                                    <div className="absolute left-0 right-0 mt-1.5 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden max-h-56 overflow-y-auto">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (schMeetingHumanGroupIds.includes('all')) {
                                            setSchMeetingHumanGroupIds([]);
                                          } else {
                                            setSchMeetingHumanGroupIds(['all']);
                                          }
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-[#20212a] flex items-center space-x-3 text-slate-300 cursor-pointer border-b border-[#2d2f3c]/40 pb-2.5"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={schMeetingHumanGroupIds.includes('all')}
                                          readOnly
                                          className="rounded border-[#2d2f3c] bg-[#111218] text-[#00a2e8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                                        />
                                        <span className={schMeetingHumanGroupIds.includes('all') ? 'text-[#00a2e8] font-semibold' : ''}>All (*)</span>
                                      </button>
                                      {humanGroups.length === 0 ? (
                                        <div className="px-4 py-3 text-xs text-slate-500 italic">Chưa có nhóm nhân viên nào.</div>
                                      ) : (
                                        humanGroups.map((g) => {
                                          const isSelected = schMeetingHumanGroupIds.includes(g.id);
                                          return (
                                            <button
                                              key={g.id}
                                              type="button"
                                              onClick={() => {
                                                if (isSelected) {
                                                  setSchMeetingHumanGroupIds(schMeetingHumanGroupIds.filter(id => id !== g.id));
                                                } else {
                                                  const withoutAll = schMeetingHumanGroupIds.filter(id => id !== 'all');
                                                  setSchMeetingHumanGroupIds([...withoutAll, g.id]);
                                                }
                                              }}
                                              className="w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-[#20212a] flex items-center space-x-3 text-slate-300 cursor-pointer"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                                className="rounded border-[#2d2f3c] bg-[#111218] text-[#00a2e8] focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                                              />
                                              <span className={isSelected ? 'text-[#00a2e8] font-semibold' : ''}>{g.name}</span>
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CỘT PHẢI - THỜI GIAN CUỘC HỌP */}
                    <div className="border border-[#2d2f3c]/50 rounded-2xl p-4.5 space-y-4 bg-[#181921]/15 relative text-left flex flex-col justify-between">
                      <div>
                        <h5 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-[#2d2f3c]/30 mb-4">
                          <span>Thời gian cuộc họp</span>
                        </h5>

                        <div className="space-y-4">
                          {/* Hàng 1: Từ giờ & Đến giờ */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Từ giờ */}
                            <div className="space-y-1.5 text-left">
                              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Từ (giờ)</label>
                              <input
                                type="time"
                                value={schMeetingStartTime}
                                onChange={(e) => setSchMeetingStartTime(e.target.value)}
                                className="w-full bg-[#1c1d26] border border-[#2d2f3c] text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#00a2e8] h-[42px] font-mono cursor-pointer"
                              />
                            </div>

                            {/* Đến giờ */}
                            <div className="space-y-1.5 text-left">
                              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Đến (giờ)</label>
                              <input
                                type="time"
                                value={schMeetingEndTime}
                                onChange={(e) => setSchMeetingEndTime(e.target.value)}
                                className="w-full bg-[#1c1d26] border border-[#2d2f3c] text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#00a2e8] h-[42px] font-mono cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Hàng 2: Ngày họp & Tùy chọn nâng cao */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Pick Ngày */}
                            <div className="space-y-1.5 text-left">
                              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Ngày họp</label>
                              <input
                                type="date"
                                value={schMeetingDate}
                                onChange={(e) => setSchMeetingDate(e.target.value)}
                                className="w-full bg-[#1c1d26] border border-[#2d2f3c] text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#00a2e8] h-[42px] font-mono cursor-pointer"
                              />
                            </div>

                            {/* Toggle hiện/ẩn tuỳ chọn chấm công trước/sau giờ họp */}
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => setShowAdvancedMeetingFields(!showAdvancedMeetingFields)}
                                className="w-full flex items-center justify-center space-x-1.5 h-[42px] bg-[#1c1d26] hover:bg-[#20212a] border border-[#2d2f3c] text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                              >
                                <ChevronDown size={13} className={`transition-transform duration-200 ${showAdvancedMeetingFields ? 'rotate-180' : ''}`} />
                                <span>{showAdvancedMeetingFields ? 'Ẩn tuỳ chọn nâng cao' : 'Tuỳ chọn nâng cao'}</span>
                              </button>
                            </div>
                          </div>

                          {/* 2 ô nâng cao: time_before_begin / time_after_end - hiển thị bên trong container cột phải */}
                          {showAdvancedMeetingFields && (
                            <div className="grid grid-cols-2 gap-4 border-t border-[#2d2f3c]/30 pt-4 mt-2">
                              <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                                  Chấm công trước (phút)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={schMeetingBeforeBegin}
                                  onChange={(e) => setSchMeetingBeforeBegin(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                  className="w-full bg-[#1c1d26] border border-[#2d2f3c] text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#00a2e8] h-[42px] font-mono"
                                />
                              </div>
                              <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                                  Chấm công sau (phút)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={schMeetingAfterEnd}
                                  onChange={(e) => setSchMeetingAfterEnd(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                  className="w-full bg-[#1c1d26] border border-[#2d2f3c] text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#00a2e8] h-[42px] font-mono"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Button "Tạo cuộc họp" full-width ở chân thẻ */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (!schMeetingTitle.trim()) {
                          alert('Vui lòng nhập tên cuộc họp!');
                          return;
                        }
                        if (schMeetingAreaIds.length === 0) {
                          alert('Vui lòng chọn ít nhất một khu vực / phòng họp!');
                          return;
                        }
                        if (schMeetingHumanGroupIds.length === 0) {
                          alert('Vui lòng chọn ít nhất một nhóm nhân viên tham gia!');
                          return;
                        }

                        // Clone saved data to preview
                        const dataToModify = JSON.parse(JSON.stringify(localMeetings));

                        // Mỗi khu vực/phòng họp đã chọn (Multiselect) sẽ tạo một bản ghi
                        // cuộc họp riêng (isNew) để preview/lưu độc lập.
                        schMeetingAreaIds.forEach((areaId) => {
                          dataToModify.push({
                            id: `preview-${Date.now()}-${areaId}`,
                            isNew: true,
                            title: schMeetingTitle.trim(),
                            areaId,
                            area: areaId === 'all' ? 'All (*) - Mặc định' : (areasData.find(a => a.id === areaId)?.name || areaId),
                            date: schMeetingDate,
                            startTime: schMeetingStartTime,
                            endTime: schMeetingEndTime,
                            departments: schMeetingHumanGroupIds.map(gid => humanGroups.find(g => g.id === gid)?.name || gid),
                            groupIds: [...schMeetingHumanGroupIds],
                            timeBeforeBegin: schMeetingBeforeBegin,
                            timeAfterEnd: schMeetingAfterEnd,
                          });
                        });

                        setSchMeetingPreviewData(dataToModify);
                        setIsFillingMeetingTable(true);
                      }}
                      className="w-full bg-[#00a2e8] hover:bg-[#008cc9] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 active:scale-95 shadow-md shadow-[#00a2e8]/25 cursor-pointer h-[42px] text-xs"
                    >
                      <Plus size={14} />
                      <span>Tạo cuộc họp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE CALENDAR TABLE CONTAINER */}
            <div className="bg-[#14151b] border border-[#21232d] rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-[#181922] border-b border-[#21232d] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#00a2e8]" />
                  <h4 className="text-xs font-bold text-slate-200 tracking-wide uppercase flex items-center space-x-1.5">
                    <span>Lịch họp ngày</span>
                    <input
                      type="date"
                      value={schMeetingDate}
                      onChange={(e) => setSchMeetingDate(e.target.value)}
                      className="bg-transparent border-none text-[#00a2e8] font-mono font-bold text-xs p-0 focus:ring-0 focus:outline-none cursor-pointer w-[125px]"
                    />
                  </h4>
                </div>
                <div className="flex items-center space-x-3">
                  {isFillingMeetingTable && (
                    <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Preview Mode</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full auto select-none">
                <div className="p-5 space-y-6 bg-[#111218] min-w-[800px]">
                  {/* Hours Labels Strip with Toggle on the Left */}
                  <div className="flex items-center border-b border-[#21232d]/60 pb-3">
                    {/* Left column (20% width): Compact View Mode Buttons */}
                    <div className="w-[20%] text-left pr-4 flex items-center">
                      <div className="flex bg-[#0d0e12] p-1 rounded-lg border border-[#2d2f3c]/60 space-x-1">
                        <button
                          type="button"
                          onClick={() => setSchMeetingLayout('by-location')}
                          title="Hiển thị theo khu vực/phòng họp"
                          className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center space-x-1 transition duration-150 cursor-pointer ${schMeetingLayout === 'by-location'
                            ? 'bg-[#00a2e8] text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                          <Calendar size={11} />
                          <span>Khu vực</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSchMeetingLayout('by-department')}
                          title="Hiển thị theo nhóm nhân viên"
                          className={`px-2 py-1 rounded-md text-[10px] font-semibold flex items-center space-x-1 transition duration-150 cursor-pointer ${schMeetingLayout === 'by-department'
                            ? 'bg-[#00a2e8] text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                          <Users size={11} />
                          <span>Nhóm nhân viên</span>
                        </button>
                      </div>
                    </div>

                    {/* Right column (flex-1): Hour Indicators */}
                    <div className="flex-1 grid grid-cols-24 gap-0 text-[9px] font-mono font-bold text-slate-500 tracking-wider text-center">
                      {Array.from({ length: 24 }, (_, h) => (
                        <div key={h} className="border-r border-[#21232d]/30 last:border-0">
                          {String(h).padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Rows */}
                  {(() => {
                    const activeSchedules = isFillingMeetingTable && schMeetingPreviewData ? schMeetingPreviewData : localMeetings;

                    // Luôn hiển thị lịch họp của toàn bộ khu vực trong ngày đã chọn
                    // (không lọc theo khu vực nữa - khu vực chỉ dùng làm mục tiêu khi tạo mới).
                    const activeMeetings = activeSchedules.filter(
                      (m: any) => m.date === schMeetingDate
                    );

                    if (schMeetingLayout === 'by-location') {
                      // Nhóm cuộc họp theo khu vực/phòng họp (mỗi khu vực = 1 dòng).
                      // Luôn liệt kê TOÀN BỘ khu vực hiện có (areasData), kể cả khu vực
                      // chưa có cuộc họp nào trong ngày, để người dùng thấy hết các phòng.
                      // Cuộc họp có areaId === 'all' (áp dụng "All (*)") được coi như
                      // thuộc về MỌI khu vực hiện có, giống hành vi lúc lưu (mỗi khu vực
                      // sẽ trở thành một bản ghi meeting riêng khi persist qua API).
                      let locationRows: { id: string; name: string; meetings: any[] }[] = [];

                      if (areasData.length > 0) {
                        locationRows = areasData.map((area) => ({
                          id: area.id,
                          name: area.name,
                          meetings: activeMeetings.filter((m: any) => m.areaId === area.id || m.areaId === 'all')
                        }));
                      } else {
                        // Fallback khi chưa load được areasData: nhóm thô theo areaId hiện có trong dữ liệu.
                        const byId = new Map<string, any[]>();
                        activeMeetings.forEach((m: any) => {
                          if (!byId.has(m.areaId)) byId.set(m.areaId, []);
                          byId.get(m.areaId)!.push(m);
                        });
                        byId.forEach((list, key) => {
                          locationRows.push({ id: key, name: key === 'all' ? 'All (*)' : (list[0]?.area || key), meetings: list });
                        });
                      }

                      if (locationRows.length === 0) {
                        return (
                          <div className="py-12 text-center text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            Chưa có khu vực nào, vui lòng tạo ở trang Quản lý khu vực.
                          </div>
                        );
                      }

                      return locationRows.map((loc) => {
                        const isAreaSelected = schMeetingAreaIds.includes('all') || schMeetingAreaIds.includes(loc.id);
                        return (
                          <div key={loc.id} className="flex items-center">
                            {/* Location Column Header - click để chọn/bỏ chọn khu vực áp dụng */}
                            <div
                              className={`w-[20%] text-left pr-4 p-2 flex flex-col justify-center cursor-pointer rounded-l-xl transition-colors ${isAreaSelected ? 'bg-[#0078d7]/20 border-l-4 border-l-[#00a2e8]' : 'hover:bg-[#1a1b24]/40 border-l-4 border-l-transparent'
                                }`}
                              onClick={() => toggleSchMeetingArea(loc.id)}
                              title={isAreaSelected ? 'Bỏ chọn khu vực này' : 'Chọn khu vực này để áp dụng khi tạo cuộc họp'}
                            >
                              <span className={`font-bold text-xs block truncate ${isAreaSelected ? 'text-[#00a2e8]' : 'text-slate-100'}`} title={loc.name}>
                                {loc.name}
                              </span>
                              <span className={`text-[10px] font-medium ${isAreaSelected ? 'text-[#00a2e8]/70' : 'text-slate-500'}`}>
                                {loc.meetings.length} cuộc họp
                              </span>
                            </div>

                            {/* Continuous Horizontal Timeline Bar */}
                            <div
                              id={`meeting-track-loc-${loc.id}`}
                              className="flex-1 h-12 bg-[#171822] border border-[#2d2f3c]/60 rounded-2xl relative flex items-center shadow-inner"
                            >
                              {/* Background Grid Lines Wrapper */}
                              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                                {Array.from({ length: 24 }, (_, h) => (
                                  <div key={h} className="absolute top-0 bottom-0 border-r border-[#21232d]/30" style={{ left: `${(h / 24) * 100}%` }} />
                                ))}
                              </div>

                              {/* Map and render each meeting block inside this location's track */}
                              {loc.meetings.map((meet: any) => {
                                const parseTimeToPercent = (tStr: string) => {
                                  const [h, m] = (tStr || '00:00').split(':').map(Number);
                                  return ((h * 60 + m) / (24 * 60)) * 100;
                                };

                                const startPct = parseTimeToPercent(meet.startTime || '09:00');
                                const endPct = parseTimeToPercent(meet.endTime || '11:00');
                                const barWidth = Math.max(endPct - startPct, 3);

                                return (
                                  <div
                                    key={`${loc.id}-${meet.id}`}
                                    className="absolute top-1.5 bottom-1.5 bg-[#00a2e8]/20 border border-[#00a2e8] rounded-xl flex items-center justify-between px-1 shadow-md shadow-[#00a2e8]/10 group transition duration-200 hover:bg-[#00a2e8]/30 cursor-move"
                                    style={{ left: `${startPct}%`, width: `${barWidth}%` }}
                                    onDoubleClick={() => setSchMeetingLayout('by-department')}
                                    onMouseDown={(e) => {
                                      // Start moving - luôn chuyển vào chế độ Preview trước
                                      beginMeetingDrag(meet.id, 'move', e.clientX, meet.startTime, meet.endTime);
                                    }}
                                  >
                                    {/* Left resize handle */}
                                    <div
                                      className="w-2.5 h-full bg-[#00a2e8]/50 hover:bg-[#00a2e8] rounded-l-lg cursor-ew-resize flex items-center justify-center text-white text-[8px] font-bold"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        beginMeetingDrag(meet.id, 'resize-start', e.clientX, meet.startTime, meet.endTime);
                                      }}
                                    >
                                      ⋮
                                    </div>

                                    <div className="text-[10px] text-[#00a2e8] font-bold font-mono tracking-wider truncate flex items-center space-x-1.5 px-2 select-none pointer-events-none">
                                      <Clock size={11} className="shrink-0" />
                                      <span className="truncate">{meet.title} ({meet.startTime} - {meet.endTime})</span>
                                    </div>

                                    {/* Hover Tooltip / Popover */}
                                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#181921]/95 border border-[#21232d] text-white text-xs p-3 rounded-xl shadow-2xl z-30 min-w-[200px] backdrop-blur-md ${draggingMeeting ? 'hidden' : 'hidden group-hover:block'}`}>
                                      <div className="flex items-start justify-between gap-2 pointer-events-none">
                                        <div className="font-bold text-slate-100 mb-1 text-left">{meet.title}</div>
                                        <button
                                          type="button"
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!confirm(`Xoá cuộc họp "${meet.title}"?`)) return;
                                            setDeletingMeetingId(meet.id);
                                            deleteMeeting(meet.id)
                                              .catch((err: any) => alert(err.message || 'Không thể xoá cuộc họp.'))
                                              .finally(() => setDeletingMeetingId(null));
                                          }}
                                          disabled={deletingMeetingId === meet.id}
                                          className="pointer-events-auto shrink-0 p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                                          title="Xoá cuộc họp"
                                        >
                                          {deletingMeetingId === meet.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                        </button>
                                      </div>
                                      <div className="text-[10px] text-[#00a2e8] font-mono mb-1 text-left flex items-center space-x-1 pointer-events-none">
                                        <Clock size={10} />
                                        <span>Thời gian: {meet.startTime} - {meet.endTime}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-300 mb-2 text-left flex items-center space-x-1 pointer-events-none">
                                        <FolderOpen size={10} className="text-slate-400" />
                                        <span>Phòng: {meet.area}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1 border-t border-[#21232d] pt-1.5 mt-1.5 pointer-events-none">
                                        {meet.departments && meet.departments.map((d: string) => (
                                          <span key={d} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[8px] font-semibold border border-slate-700/50">
                                            {d}
                                          </span>
                                        ))}
                                      </div>
                                      {/* Arrow */}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#21232d] pointer-events-none" />
                                    </div>

                                    {/* Drag Feedback Tooltip */}
                                    {draggingMeeting?.meetingId === meet.id && (
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#00a2e8] text-white text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg shadow-lg pointer-events-none z-40 whitespace-nowrap">
                                        <span>
                                          {draggingMeeting.type === 'move' && `${meet.startTime} - ${meet.endTime}`}
                                          {draggingMeeting.type === 'resize-start' && meet.startTime}
                                          {draggingMeeting.type === 'resize-end' && meet.endTime}
                                        </span>
                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#00a2e8] pointer-events-none" />
                                      </div>
                                    )}

                                    {/* Right resize handle */}
                                    <div
                                      className="w-2.5 h-full bg-[#00a2e8]/50 hover:bg-[#00a2e8] rounded-r-lg cursor-ew-resize flex items-center justify-center text-white text-[8px] font-bold"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        beginMeetingDrag(meet.id, 'resize-end', e.clientX, meet.startTime, meet.endTime);
                                      }}
                                    >
                                      ⋮
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    } else {
                      // Layout: by-department
                      // Luôn liệt kê TOÀN BỘ nhóm nhân viên hiện có (humanGroups), kể cả nhóm
                      // chưa tham gia cuộc họp nào trong ngày, để người dùng thấy hết các nhóm.
                      const depRows = humanGroups.map((g) => ({
                        id: g.id,
                        name: g.name,
                        meetings: activeMeetings.filter(
                          (m: any) => m.departments && m.departments.includes(g.name)
                        )
                      }));

                      if (depRows.length === 0) {
                        return (
                          <div className="py-12 text-center text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            Chưa có nhóm nhân viên nào, vui lòng tạo ở trang Quản lý nhân sự.
                          </div>
                        );
                      }

                      return depRows.map((dep) => {
                        const depMeetings = dep.meetings;
                        const depName = dep.name;
                        const isDepSelected = schMeetingHumanGroupIds.includes('all') || schMeetingHumanGroupIds.includes(dep.id);

                        return (
                          <div key={dep.id} className="flex items-center">
                            {/* Department Column Header - click để chọn/bỏ chọn nhóm nhân viên áp dụng */}
                            <div
                              className={`w-[20%] text-left pr-4 p-2 flex flex-col justify-center cursor-pointer rounded-l-xl transition-colors ${isDepSelected ? 'bg-[#0078d7]/20 border-l-4 border-l-[#00a2e8]' : 'hover:bg-[#1a1b24]/40 border-l-4 border-l-transparent'
                                }`}
                              onClick={() => toggleSchMeetingHumanGroup(dep.id)}
                              title={isDepSelected ? 'Bỏ chọn nhóm nhân viên này' : 'Chọn nhóm nhân viên này để áp dụng khi tạo cuộc họp'}
                            >
                              <span className={`font-bold text-xs block truncate ${isDepSelected ? 'text-[#00a2e8]' : 'text-slate-100'}`} title={depName}>
                                {depName}
                              </span>
                              <span className={`text-[10px] font-medium ${isDepSelected ? 'text-[#00a2e8]/70' : 'text-slate-500'}`}>
                                {depMeetings.length} cuộc họp tham gia
                              </span>
                            </div>

                            {/* Continuous Horizontal Timeline Bar */}
                            <div
                              id={`meeting-track-dep-${dep.id}`}
                              className="flex-1 h-12 bg-[#171822] border border-[#2d2f3c]/60 rounded-2xl relative flex items-center shadow-inner"
                            >
                              {/* Background Grid Lines Wrapper */}
                              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                                {Array.from({ length: 24 }, (_, h) => (
                                  <div key={h} className="absolute top-0 bottom-0 border-r border-[#21232d]/30" style={{ left: `${(h / 24) * 100}%` }} />
                                ))}
                              </div>

                              {/* Placeholder khi nhóm này chưa tham gia cuộc họp nào trong ngày */}
                              {depMeetings.length === 0 && (
                                <div className="w-full text-center text-[10px] text-slate-600 font-semibold uppercase tracking-widest pointer-events-none">
                                  Chưa có cuộc họp
                                </div>
                              )}

                              {/* Render multiple meeting blocks if they participate in more than one */}
                              {depMeetings.map((meet: any) => {
                                const parseTimeToPercent = (tStr: string) => {
                                  const [h, m] = (tStr || '00:00').split(':').map(Number);
                                  return ((h * 60 + m) / (24 * 60)) * 100;
                                };

                                const startPct = parseTimeToPercent(meet.startTime || '09:00');
                                const endPct = parseTimeToPercent(meet.endTime || '11:00');
                                const barWidth = Math.max(endPct - startPct, 3);

                                return (
                                  <div
                                    key={meet.id}
                                    className="absolute top-1.5 bottom-1.5 bg-[#00a2e8]/20 border border-[#00a2e8] rounded-xl flex items-center justify-between px-1 shadow-md shadow-[#00a2e8]/10 group transition duration-200 hover:bg-[#00a2e8]/30 cursor-move"
                                    style={{ left: `${startPct}%`, width: `${barWidth}%` }}
                                    onDoubleClick={() => setSchMeetingLayout('by-location')}
                                    onMouseDown={(e) => {
                                      // Start moving - luôn chuyển vào chế độ Preview trước
                                      beginMeetingDrag(meet.id, 'move', e.clientX, meet.startTime, meet.endTime);
                                    }}
                                  >
                                    {/* Left resize handle */}
                                    <div
                                      className="w-2.5 h-full bg-[#00a2e8]/50 hover:bg-[#00a2e8] rounded-l-lg cursor-ew-resize flex items-center justify-center text-white text-[8px] font-bold"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        beginMeetingDrag(meet.id, 'resize-start', e.clientX, meet.startTime, meet.endTime);
                                      }}
                                    >
                                      ⋮
                                    </div>

                                    <div className="text-[10px] text-[#00a2e8] font-bold font-mono tracking-wider truncate flex items-center space-x-1.5 px-2 select-none pointer-events-none">
                                      <Clock size={11} className="shrink-0" />
                                      <span className="truncate">{meet.title} ({meet.startTime} - {meet.endTime})</span>
                                    </div>

                                    {/* Hover Tooltip also for department view */}
                                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#181921]/95 border border-[#21232d] text-white text-xs p-3 rounded-xl shadow-2xl z-30 min-w-[200px] backdrop-blur-md ${draggingMeeting ? 'hidden' : 'hidden group-hover:block'}`}>
                                      <div className="flex items-start justify-between gap-2 pointer-events-none">
                                        <div className="font-bold text-slate-100 mb-1 text-left">{meet.title}</div>
                                        <button
                                          type="button"
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!confirm(`Xoá cuộc họp "${meet.title}"?`)) return;
                                            setDeletingMeetingId(meet.id);
                                            deleteMeeting(meet.id)
                                              .catch((err: any) => alert(err.message || 'Không thể xoá cuộc họp.'))
                                              .finally(() => setDeletingMeetingId(null));
                                          }}
                                          disabled={deletingMeetingId === meet.id}
                                          className="pointer-events-auto shrink-0 p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                                          title="Xoá cuộc họp"
                                        >
                                          {deletingMeetingId === meet.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                        </button>
                                      </div>
                                      <div className="text-[10px] text-[#00a2e8] font-mono mb-1 text-left flex items-center space-x-1 pointer-events-none">
                                        <Clock size={10} />
                                        <span>Thời gian: {meet.startTime} - {meet.endTime}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-300 mb-2 text-left flex items-center space-x-1 pointer-events-none">
                                        <FolderOpen size={10} className="text-slate-400" />
                                        <span>Phòng: {meet.area}</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1 border-t border-[#21232d] pt-1.5 mt-1.5 pointer-events-none">
                                        {meet.departments && meet.departments.map((d: string) => (
                                          <span key={d} className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[8px] font-semibold border border-slate-700/50">
                                            {d}
                                          </span>
                                        ))}
                                      </div>
                                      {/* Arrow */}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#21232d] pointer-events-none" />
                                    </div>

                                    {/* Drag Feedback Tooltip */}
                                    {draggingMeeting?.meetingId === meet.id && (
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#00a2e8] text-white text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg shadow-lg pointer-events-none z-40 whitespace-nowrap">
                                        <span>
                                          {draggingMeeting.type === 'move' && `${meet.startTime} - ${meet.endTime}`}
                                          {draggingMeeting.type === 'resize-start' && meet.startTime}
                                          {draggingMeeting.type === 'resize-end' && meet.endTime}
                                        </span>
                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#00a2e8] pointer-events-none" />
                                      </div>
                                    )}

                                    {/* Right resize handle */}
                                    <div
                                      className="w-2.5 h-full bg-[#00a2e8]/50 hover:bg-[#00a2e8] rounded-r-lg cursor-ew-resize flex items-center justify-center text-white text-[8px] font-bold"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        beginMeetingDrag(meet.id, 'resize-end', e.clientX, meet.startTime, meet.endTime);
                                      }}
                                    >
                                      ⋮
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* BOTTOM SAVE ACTIONS GROUP */}
            {isFillingMeetingTable ? (
              <div className="flex items-center justify-between bg-[#151722] border-2 border-amber-500/20 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs text-amber-300 font-semibold">Bạn đang ở chế độ Xem trước Lịch họp (Chưa Lưu). Hãy nhấn Lưu cuộc họp để cập nhật chính thức.</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSchMeetingPreviewData(null);
                      setIsFillingMeetingTable(false);
                    }}
                    className="px-4 py-2 border border-[#2d2f3c] text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Hủy xem trước
                  </button>
                  <button
                    disabled={isSavingMeeting}
                    onClick={async () => {
                      if (!schMeetingPreviewData) return;

                      // Check overwrite with saved meeting data on that specific day
                      // (kiểm tra toàn bộ khu vực, không lọc theo khu vực đang chọn nữa)
                      let hasOverwrite = false;
                      const activeM = schMeetingPreviewData.filter((m: any) => m.date === schMeetingDate);
                      for (let i = 0; i < activeM.length; i++) {
                        for (let j = i + 1; j < activeM.length; j++) {
                          const m1 = activeM[i];
                          const m2 = activeM[j];
                          if (m1.areaId === m2.areaId || m1.areaId === 'all' || m2.areaId === 'all') {
                            const s1 = timeStrToMinutes(m1.startTime);
                            const e1 = timeStrToMinutes(m1.endTime);
                            const s2 = timeStrToMinutes(m2.startTime);
                            const e2 = timeStrToMinutes(m2.endTime);
                            if (s1 < e2 && s2 < e1) {
                              hasOverwrite = true;
                              break;
                            }
                          }
                        }
                        if (hasOverwrite) break;
                      }

                      if (hasOverwrite) {
                        setShowMeetingOverwriteConfirm(true);
                        return;
                      }

                      // Persist: các bản ghi mới (isNew) -> createMeeting; các bản ghi có sẵn
                      // đã bị sửa giờ trong preview -> updateMeeting. Gọi API thật tới /meeting.
                      setIsSavingMeeting(true);
                      setMeetingSaveError('');
                      try {
                        for (const m of schMeetingPreviewData) {
                          if (m.isNew) {
                            const groupIds = m.groupIds.includes('all') ? humanGroups.map(hg => hg.id) : m.groupIds;
                            if (m.areaId === 'all') {
                              for (const area of areasData) {
                                await createMeeting({
                                  title: m.title,
                                  location_id: area.id,
                                  group_ids: groupIds,
                                  time_start: m.startTime,
                                  time_end: m.endTime,
                                  date_organize: m.date,
                                  time_before_begin: m.timeBeforeBegin ?? 30,
                                  time_after_end: m.timeAfterEnd ?? 30,
                                });
                              }
                            } else {
                              await createMeeting({
                                title: m.title,
                                location_id: m.areaId,
                                group_ids: groupIds,
                                time_start: m.startTime,
                                time_end: m.endTime,
                                date_organize: m.date,
                                time_before_begin: m.timeBeforeBegin ?? 30,
                                time_after_end: m.timeAfterEnd ?? 30,
                              });
                            }
                          } else {
                            const original = localMeetings.find(lm => lm.id === m.id);
                            if (original && (original.startTime !== m.startTime || original.endTime !== m.endTime)) {
                              await updateMeeting(m.id, { time_start: m.startTime, time_end: m.endTime });
                            }
                          }
                        }
                        setSchMeetingPreviewData(null);
                        setIsFillingMeetingTable(false);
                        setShowMeetingSaveToast(true);
                        setTimeout(() => setShowMeetingSaveToast(false), 4000);
                      } catch (err: any) {
                        setMeetingSaveError(err.message || 'Không thể lưu cuộc họp. Vui lòng thử lại.');
                      } finally {
                        setIsSavingMeeting(false);
                      }
                    }}
                    className="px-5 py-2.5 bg-[#0078d7] hover:bg-[#006fca] text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-[#0078d7]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingMeeting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Lưu cuộc họp</span>
                  </button>
                </div>
                {meetingSaveError && (
                  <p className="text-[11px] text-red-400 font-medium mt-2 text-right">{meetingSaveError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-[#14151c] border border-[#21232d] rounded-2xl p-4 shadow-md">
                <span className="text-xs text-slate-400 font-medium">Lịch họp đã được lưu chính thức và đồng bộ hóa tới các nhóm nhân viên.</span>
                <button
                  disabled
                  className="px-5 py-2.5 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-not-allowed border border-slate-700/30"
                >
                  <Save size={14} />
                  <span>Đã lưu</span>
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* 4. MODALS & POPUPS FOR SIMULATION */}
      {showPathModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#1b1c25] rounded-xl shadow-2xl overflow-hidden text-xs"
          >
            <div className="p-4 bg-[#14151c] border-b border-transparent flex items-center justify-between">
              <span className="font-bold text-slate-200">Duyệt Thư Mục Cục Bộ</span>
              <button onClick={() => setShowPathModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-slate-400 mb-2">Chọn thư mục đích để ghi ảnh mặt và file video check-in camera:</p>

              <div className="border border-[#2a2c3a] bg-[#111218] rounded-lg p-3 space-y-2 h-48 overflow-y-auto">
                <div className="flex items-center space-x-2 text-slate-300 py-1 hover:bg-slate-800 rounded px-1 cursor-pointer">
                  <FolderOpen size={14} className="text-yellow-500" />
                  <span>C: (Ổ đĩa hệ thống)</span>
                </div>
                <div className="pl-4 space-y-2">
                  <div className="flex items-center space-x-2 text-slate-300 py-1 hover:bg-slate-800 rounded px-1 cursor-pointer">
                    <FolderOpen size={14} className="text-yellow-500" />
                    <span>Program Files</span>
                  </div>
                  <div className="pl-4 space-y-1 border-l border-slate-700">
                    <div className="flex items-center space-x-2 text-[#00a2e8] py-1 bg-slate-800/50 rounded px-1 cursor-pointer font-semibold">
                      <FolderOpen size={14} className="text-yellow-500" />
                      <span>DVMS System</span>
                    </div>
                    <div className="pl-4 space-y-1">
                      <div className="flex items-center space-x-2 text-slate-300 py-0.5 rounded px-1 hover:bg-slate-800 cursor-pointer">
                        <FolderOpen size={14} className="text-yellow-500" />
                        <span>DVMS Client</span>
                      </div>
                      <div className="pl-4 border-l border-slate-700">
                        <div className="flex items-center space-x-2 text-emerald-400 py-0.5 bg-emerald-500/10 rounded px-1 font-semibold">
                          <FolderOpen size={14} className="text-emerald-500" />
                          <span>EventData</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đường dẫn đã chọn</label>
                <input
                  type="text"
                  value={savePath}
                  onChange={(e) => setSavePath(e.target.value)}
                  className="w-full bg-[#111218] border border-[#2d2f3c] rounded px-3 py-1.5 font-mono text-slate-300 focus:outline-none focus:border-[#00a2e8]"
                />
              </div>
            </div>

            <div className="p-4 bg-[#14151c] border-t border-transparent flex justify-end space-x-2">
              <button
                onClick={() => setShowPathModal(false)}
                className="py-1.5 px-3 border border-[#2d2f3c] rounded text-slate-400 hover:text-slate-200 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => setShowPathModal(false)}
                className="py-1.5 px-4 bg-[#0078d7] hover:bg-[#0069be] text-white rounded font-medium transition"
              >
                Xác nhận
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showScheduleSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-emerald-950/95 rounded-xl shadow-2xl p-4 w-96 z-50 flex items-start space-x-3 text-xs"
          >
            <div className="p-1.5 bg-emerald-500/20 rounded-full text-emerald-400 shrink-0">
              <Check size={16} />
            </div>
            <div>
              <h4 className="font-bold text-emerald-200">Lưu lịch biểu thành công!</h4>
              <p className="text-emerald-400 text-[11px] mt-0.5">Lịch chấm công đã được cập nhật thành công và đồng bộ hóa tới các thiết bị.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showOverwriteConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#1b1c25] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 bg-[#14151c] border-b border-transparent flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs uppercase tracking-wide flex items-center space-x-2 text-red-400">
                <span>⚠️ Xác Nhận Ghi Đè Lịch Trình</span>
              </span>
              <button onClick={() => setShowOverwriteConfirm(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-3 text-left">
              <p className="text-slate-300 text-xs leading-relaxed">
                Phát hiện lịch phân công mới <span className="text-amber-400 font-semibold">đang bị trùng lắp và sẽ ghi đè lên thời gian cũ đã được phân trước đó</span>.
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Bạn có chắc chắn muốn ghi đè lên các ca làm việc hiện tại của nhân sự và lưu các thay đổi này không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="p-4 bg-[#14151c] border-t border-transparent flex flex-col sm:flex-row sm:justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  alert("Tính năng bỏ qua khu vực ghi đè đang được phát triển.");
                  setShowOverwriteConfirm(false);
                }}
                className="py-2 px-3 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 rounded-xl font-semibold border border-amber-500/30 transition cursor-pointer text-center"
              >
                Bỏ qua các khu vực ghi đè
              </button>
              <button
                onClick={() => setShowOverwriteConfirm(false)}
                className="py-2 px-3.5 border border-[#2d2f3c] rounded-xl text-slate-400 hover:text-slate-200 font-semibold transition cursor-pointer text-center"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (schedulePreviewData) {
                    setScheduleSavedData(schedulePreviewData);
                    setSchedulePreviewData(null);
                    setIsFillingTable(false);
                  }
                  setShowOverwriteConfirm(false);
                  setShowScheduleSaveToast(true);
                  setTimeout(() => setShowScheduleSaveToast(false), 4000);
                }}
                className="py-2 px-4 bg-[#0078d7] hover:bg-[#006cc1] text-white rounded-xl font-bold transition shadow-lg shadow-[#0078d7]/20 cursor-pointer text-center"
              >
                Xác nhận
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showMeetingOverwriteConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#1b1c25] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 bg-[#14151c] border-b border-transparent flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs uppercase tracking-wide flex items-center space-x-2 text-red-400">
                <span>⚠️ Xác Nhận Ghi Đè Lịch Họp</span>
              </span>
              <button onClick={() => setShowMeetingOverwriteConfirm(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-3 text-left">
              <p className="text-slate-300 text-xs leading-relaxed">
                Phát hiện lịch họp mới <span className="text-amber-400 font-semibold">đang bị trùng lắp và sẽ ghi đè lên thời gian cũ đã được phân trước đó</span>.
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Bạn có chắc chắn muốn ghi đè lên các lịch họp hiện tại của nhóm nhân viên và lưu các thay đổi này không? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="p-4 bg-[#14151c] border-t border-transparent flex flex-col sm:flex-row sm:justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  alert("Tính năng bỏ qua khu vực ghi đè đang được phát triển.");
                  setShowMeetingOverwriteConfirm(false);
                }}
                className="py-2 px-3 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 rounded-xl font-semibold border border-amber-500/30 transition cursor-pointer text-center"
              >
                Bỏ qua các khu vực ghi đè
              </button>
              <button
                onClick={() => setShowMeetingOverwriteConfirm(false)}
                className="py-2 px-3.5 border border-[#2d2f3c] rounded-xl text-slate-400 hover:text-slate-200 font-semibold transition cursor-pointer text-center"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isSavingMeeting}
                onClick={async () => {
                  if (!schMeetingPreviewData) return;
                  // Người dùng đã xác nhận ghi đè -> vẫn persist qua API thật, bỏ qua check trùng.
                  setIsSavingMeeting(true);
                  setMeetingSaveError('');
                  try {
                    for (const m of schMeetingPreviewData) {
                      if (m.isNew) {
                        const groupIds = m.groupIds.includes('all') ? humanGroups.map(hg => hg.id) : m.groupIds;
                        if (m.areaId === 'all') {
                          for (const area of areasData) {
                            await createMeeting({
                              title: m.title,
                              location_id: area.id,
                              group_ids: groupIds,
                              time_start: m.startTime,
                              time_end: m.endTime,
                              date_organize: m.date,
                              time_before_begin: m.timeBeforeBegin ?? 30,
                              time_after_end: m.timeAfterEnd ?? 30,
                            });
                          }
                        } else {
                          await createMeeting({
                            title: m.title,
                            location_id: m.areaId,
                            group_ids: groupIds,
                            time_start: m.startTime,
                            time_end: m.endTime,
                            date_organize: m.date,
                            time_before_begin: m.timeBeforeBegin ?? 30,
                            time_after_end: m.timeAfterEnd ?? 30,
                          });
                        }
                      } else {
                        const original = localMeetings.find(lm => lm.id === m.id);
                        if (original && (original.startTime !== m.startTime || original.endTime !== m.endTime)) {
                          await updateMeeting(m.id, { time_start: m.startTime, time_end: m.endTime });
                        }
                      }
                    }
                    setSchMeetingPreviewData(null);
                    setIsFillingMeetingTable(false);
                    setShowMeetingOverwriteConfirm(false);
                    setShowMeetingSaveToast(true);
                    setTimeout(() => setShowMeetingSaveToast(false), 4000);
                  } catch (err: any) {
                    setMeetingSaveError(err.message || 'Không thể lưu cuộc họp. Vui lòng thử lại.');
                    setShowMeetingOverwriteConfirm(false);
                  } finally {
                    setIsSavingMeeting(false);
                  }
                }}
                className="py-2 px-4 bg-[#0078d7] hover:bg-[#006cc1] text-white rounded-xl font-bold transition shadow-lg shadow-[#0078d7]/20 cursor-pointer text-center disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showMeetingSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-emerald-950/95 rounded-xl shadow-2xl p-4 w-96 z-50 flex items-start space-x-3 text-xs text-left"
          >
            <div className="p-1.5 bg-emerald-500/20 rounded-full text-emerald-400 shrink-0">
              <Check size={16} />
            </div>
            <div>
              <h4 className="font-bold text-emerald-200">Lưu lịch họp thành công!</h4>
              <p className="text-emerald-400 text-[11px] mt-0.5">Lịch họp của các nhóm nhân viên đã được cập nhật thành công và đồng bộ hóa tới các thiết bị.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ==========================================
