import { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import {
  List,
  TrendingUp,
  RotateCw,
  Filter,
  Camera,
  FolderOpen,
  Settings,
  Star,
  FileText,
  Layers,
  Search,
  X,
  Minus,
  Square,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  Check,
  Plus,
  Play,
  Monitor,
  AlertTriangle,
  CameraOff,
  Download,
  ChevronDown,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Users,
  CalendarClock,
  Save,
  Info,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { useApp } from '../../../context/AppContext';
import { EventLog } from '../../../types';

const resolveImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const baseUrl = (import.meta as any).env.VITE_WS_URL || 'http://localhost:3001';
  return `${baseUrl}/media?path=${encodeURIComponent(path)}`;
};

const parseToLocalTime = (timeCreated?: string): string => {
  if (!timeCreated) return '';
  const d = new Date(timeCreated.replace('Z', ''));
  return d.toTimeString().split(' ')[0]; // "HH:mm:ss"
};

const timeStringToSeconds = (tStr: string): number => {
  if (!tStr) return 0;
  const parts = tStr.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 3600 + m * 60 + s;
};

const getMeetingPhoto = (seed: string, isLoi: boolean, type: 'in' | 'out') => {
  if (isLoi) {
    if (type === 'in') {
      return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300";
    } else {
      return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300&h=300";
    }
  }
  const index = parseInt(seed.replace(/^\D+/g, '')) || 1;
  const offset = type === 'in' ? 0 : 3;
  const portraits = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300&h=300",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300&h=300",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300&h=300",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300&h=300",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300&h=300",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300&h=300",
    "https://images.unsplash.com/photo-1504257486230-1699a27f01d9?auto=format&fit=crop&q=80&w=300&h=300"
  ];
  return portraits[(index + offset) % portraits.length];
};

const getPhotoSrc = (item: any, type: 'in' | 'out') => {
  const event = type === 'in' ? item.emp.entryEvent : item.emp.exitEvent;
  if (event?.cropped_face_images && event.cropped_face_images.length > 0) {
    const img = event.cropped_face_images[0];
    if (img) return img;
  }
  if (item.emp.originalObject?.anhDaiDien?.url) {
    return item.emp.originalObject.anhDaiDien.url;
  }
  return getMeetingPhoto(item.emp.avatarSeed, item.emp.ma === "010203045567", type);
};

export const ReportPage = () => {
  const location = useLocation();
  const { eventLogs, meetings, areasData, employees, isLoadingLogs, humanGroups } = useApp();
  const [flashActive, setFlashActive] = useState(false);

  const getAreaSuffix = (log: EventLog) => {
    const camera_id = log.camera_id;
    if (!camera_id) return 'khác';
    const area = areasData.find(a => a.name === log.vung);
    if (!area) return 'khác';
    const camera = area.cameras.find(c => c.camera_id === camera_id);
    if (!camera) return 'khác';
    if (camera.role.includes('checkin')) return 'vào';
    if (camera.role.includes('checkout')) return 'ra';
    return 'khác';
  };

  // Derive the legacy meeting shape (area/date/startTime/endTime/departments)
  // used throughout this page's render logic from the real Meeting[] data
  // (bảng meeting, DB cms_webserver) + areasData (để resolve tên khu vực).
  const schMeetingSavedData = meetings.map(m => {
    const area = areasData.find(a => a.id === m.location_id);
    return {
      id: m.id,
      title: m.title,
      area: area?.name || m.location_id,
      date: m.date_organize,
      startTime: m.time_start,
      endTime: m.time_end,
      departments: m.groups.map(g => g.name),
      time_before_begin: m.time_before_begin,
      time_after_end: m.time_after_end,
    };
  });

  const [activeTab, setActiveTab] = useState<'list' | 'attendance' | 'meeting' | 'chart'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Data list and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEventType, setFilterEventType] = useState<'All' | 'in' | 'out'>('All');
  const [isOpenEventTypeDropdown, setIsOpenEventTypeDropdown] = useState(false);
  const [appliedList, setAppliedList] = useState('All');
  const [appliedEventType, setAppliedEventType] = useState<'All' | 'in' | 'out'>('All');
  const [filterZone, setFilterZone] = useState('All');
  const [filterList, setFilterList] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [filterTime, setFilterTime] = useState('');
  const [searchType, setSearchType] = useState<'text' | 'image'>('text');
  const [searchImage, setSearchImage] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(0.8);
  const [isOpenSearchTypeDropdown, setIsOpenSearchTypeDropdown] = useState(false);
  const [isOpenZoneDropdown, setIsOpenZoneDropdown] = useState(false);
  const [isOpenListDropdown, setIsOpenListDropdown] = useState(false);
  const [zoneSearch, setZoneSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const PER_PAGE_OPTIONS = [10, 20, 40, 50, 100];
  const [showAttendanceReportDemo, setShowAttendanceReportDemo] = useState(false);

  // Server-side paginated data
  const [pageLogs, setPageLogs] = useState<EventLog[]>([]);
  const [totalServerItems, setTotalServerItems] = useState(0);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // Applied filters (committed on search button click)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedZone, setAppliedZone] = useState('All');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [appliedStartTime, setAppliedStartTime] = useState('');
  const [appliedEndTime, setAppliedEndTime] = useState('');

  const buildEventLogsUrl = useCallback((extra: Record<string, string> = {}) => {
    const baseUrl = (import.meta as any).env.VITE_WS_URL || 'http://localhost:3001';
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(itemsPerPage),
      ...(appliedSearch ? { search: appliedSearch } : {}),
      ...(appliedZone && appliedZone !== 'All' ? { zone: appliedZone } : {}),
      ...(appliedStartDate ? { startDate: appliedStartDate } : {}),
      ...(appliedEndDate ? { endDate: appliedEndDate } : {}),
      ...(appliedStartTime ? { startTime: appliedStartTime } : {}),
      ...(appliedEndTime ? { endTime: appliedEndTime } : {}),
      ...(appliedList && appliedList !== 'All' ? { group: appliedList } : {}),
      ...(appliedEventType && appliedEventType !== 'All' ? { eventType: appliedEventType } : {}),
      ...extra,
    });
    return { baseUrl, params };
  }, [currentPage, itemsPerPage, appliedSearch, appliedZone, appliedStartDate, appliedEndDate, appliedStartTime, appliedEndTime, appliedList, appliedEventType]);

  const fetchPage = useCallback(async () => {
    setIsLoadingPage(true);
    const { baseUrl, params } = buildEventLogsUrl();
    const fullUrl = `${baseUrl}/meeting/event-logs?${params.toString()}`;
    console.log(`[DEBUG Frontend] Bắt đầu truy vấn Danh sách sự kiện từ URL: ${fullUrl}`);
    try {
      const res = await fetch(fullUrl);
      if (!res.ok) {
        console.error(`[DEBUG Frontend] Truy vấn Danh sách sự kiện THẤT BẠI: HTTP Status = ${res.status}`);
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      console.log(`[DEBUG Frontend] Truy vấn Danh sách sự kiện THÀNH CÔNG! Kết quả trả về:`, json);
      if (json && Array.isArray(json.data)) {
        setPageLogs(json.data);
        setTotalServerItems(json.total ?? 0);
        if (json.data.length > 0) setSelectedEventId(json.data[0].stt);
      }
    } catch (e: any) {
      console.warn('[DEBUG Frontend] Lỗi ngoại lệ khi truy vấn Danh sách sự kiện:', e.message || e);
    } finally {
      setIsLoadingPage(false);
    }
  }, [buildEventLogsUrl]);

  // Reload page when pagination or applied filters change
  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // 10-second polling: fetch IDs only, compare with current page
  useEffect(() => {
    const poll = async () => {
      try {
        const { baseUrl, params } = buildEventLogsUrl();
        const res = await fetch(`${baseUrl}/meeting/event-logs/ids?${params.toString()}`);
        if (!res.ok) return;
        const freshIds: string[] = await res.json();
        const currentIds = pageLogs.map(l => l.id);
        const changed = freshIds.length !== currentIds.length ||
          freshIds.some((id, i) => id !== currentIds[i]);
        if (changed) {
          fetchPage();
        }
      } catch { /* silent */ }
    };
    const timer = setInterval(poll, 10_000);
    return () => clearInterval(timer);
  }, [buildEventLogsUrl, pageLogs, fetchPage]);

  // Derived pagination values (server-side)
  const filteredLogs = pageLogs;   // alias kept for export compatibility
  const currentLogs = pageLogs;
  const totalItems = totalServerItems;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Selected event
  const [selectedEventId, setSelectedEventId] = useState<number>(0);

  // Toast / Export status simulation
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportToast, setShowExportToast] = useState(false);

  // Selected avatar view in the thumbnails panel
  const [selectedThumbIndex, setSelectedThumbIndex] = useState(0);

  // Meeting report states
  const [meetingDate, setMeetingDate] = useState('2026-07-09');
  const [meetingStartTime, setMeetingStartTime] = useState('16:00');
  const [meetingEndTime, setMeetingEndTime] = useState('17:00');
  const [meetingGroups, setMeetingGroups] = useState<string[]>(['nhóm nhân viên A', 'nhóm nhân viên B', 'nhóm nhân viên C', 'nhóm nhân viên D', 'Khách hàng / Khác']);
  const [isMeetingGroupDropdownOpen, setIsMeetingGroupDropdownOpen] = useState(false);
  const [meetingSearchQuery, setMeetingSearchQuery] = useState('');
  const [isMeetingSearched, setIsMeetingSearched] = useState(false);
  const [meetingCurrentPage, setMeetingCurrentPage] = useState(1);
  const [meetingItemsPerPage, setMeetingItemsPerPage] = useState(20);
  const [selectedMeetingEmpCode, setSelectedMeetingEmpCode] = useState<string | null>(null);

  // New Meeting Report custom search & selection states
  const [meetingStartDate, setMeetingStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMonth(d.getMonth() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [meetingEndDate, setMeetingEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedMeetingAreas, setSelectedMeetingAreas] = useState<string[]>([]);
  const [isMeetingAreaDropdownOpen, setIsMeetingAreaDropdownOpen] = useState(false);
  const [selectedMeetingReport, setSelectedMeetingReport] = useState<any | null>(null);

  // Applied Meeting Report filters (committed via search button)
  const [appliedMeetingStartDate, setAppliedMeetingStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMonth(d.getMonth() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [appliedMeetingEndDate, setAppliedMeetingEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [appliedMeetingAreas, setAppliedMeetingAreas] = useState<string[]>([]);

  // Real Database Meeting Report states
  const [meetingReportData, setMeetingReportData] = useState<{
    attendance: any[];
  } | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const computedAttendeeRoster = useMemo(() => {
    if (!selectedMeetingReport) return [];

    const timeStringToSeconds = (tStr: string): number => {
      if (!tStr) return 0;
      const parts = tStr.split(':').map(Number);
      const h = parts[0] || 0;
      const m = parts[1] || 0;
      const s = parts[2] || 0;
      return h * 3600 + m * 60 + s;
    };

    const getMeetingPhoto = (seed: string, isLoi: boolean, type: 'in' | 'out') => {
      if (isLoi) {
        if (type === 'in') {
          return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300";
        } else {
          return "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300&h=300";
        }
      }
      const index = parseInt(seed.replace(/^\D+/g, '')) || 1;
      const offset = type === 'in' ? 0 : 3;
      const portraits = [
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300&h=300",
        "https://images.unsplash.com/photo-1504257486230-1699a27f01d9?auto=format&fit=crop&q=80&w=300&h=300"
      ];
      return portraits[(index + offset) % portraits.length];
    };

    const meetingStartSec = timeStringToSeconds(meetingStartTime);
    const meetingEndSec = timeStringToSeconds(meetingEndTime);
    const meetingDur = meetingEndSec - meetingStartSec || 3600;

    const activeEmployees = employees.filter(emp => {
      const matchesGroup = emp.human_group.some((g: string) => meetingGroups.includes(g));
      const matchesSearch = !meetingSearchQuery
        ? true
        : emp.hoTen.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
          emp.maGiayTo.includes(meetingSearchQuery);
      return matchesGroup && matchesSearch;
    });

    const attendeeRoster = activeEmployees.map(emp => {
      let thoiGianVao: string | undefined = undefined;
      let thoiGianRa: string | undefined = undefined;
      let entryEvent: any = null;
      let exitEvent: any = null;

      if (meetingReportData) {
        const match = meetingReportData.attendance.find((item: any) => item.employeeId === emp.id);
        if (match) {
          thoiGianVao = match.thoiGianVao || undefined;
          thoiGianRa = match.thoiGianRa || undefined;
          entryEvent = match.entryEvent || null;
          exitEvent = match.exitEvent || null;
        }
      } else {
        const empLogs = eventLogs.filter(log => {
          if (log.ma !== emp.maGiayTo) return false;
          if (!log.thoiGian) return false;
          const [datePart] = log.thoiGian.split('-');
          if (!datePart) return false;
          const [day, month, year] = datePart.split('/');
          const logDateStr = `${year}-${month}-${day}`;
          return logDateStr === meetingDate;
        });

        const sortedEmpLogs = [...empLogs].sort((a, b) => {
          const timeA = a.thoiGian ? a.thoiGian.split('-')[1] : '';
          const timeB = b.thoiGian ? b.thoiGian.split('-')[1] : '';
          return timeA.localeCompare(timeB);
        });

        if (sortedEmpLogs.length === 1) {
          const log = sortedEmpLogs[0];
          const timeStr = log.thoiGian ? log.thoiGian.split('-')[1] : '';
          if (log.vung === 'Checkout Area') {
            thoiGianRa = timeStr;
          } else {
            thoiGianVao = timeStr;
          }
        } else if (sortedEmpLogs.length >= 2) {
          thoiGianVao = sortedEmpLogs[0].thoiGian ? sortedEmpLogs[0].thoiGian.split('-')[1] : '';
          thoiGianRa = sortedEmpLogs[sortedEmpLogs.length - 1].thoiGian ? sortedEmpLogs[sortedEmpLogs.length - 1].thoiGian.split('-')[1] : '';
        }
      }

      let evaluationText: string;
      let evaluationType: 'good' | 'early' | 'absent' | 'manual';
      let ratioPercent = 0;

      if (!thoiGianVao && !thoiGianRa) {
        evaluationText = "Vắng";
        evaluationType = 'absent';
      } else if (!thoiGianVao || !thoiGianRa) {
        evaluationText = "Cần xử lý riêng";
        evaluationType = 'manual';
      } else {
        const inSec = timeStringToSeconds(thoiGianVao);
        const outSec = timeStringToSeconds(thoiGianRa);
        const spentSec = outSec - inSec;
        const ratio = Math.max(0, Math.min(100, Math.round((spentSec / meetingDur) * 100)));
        ratioPercent = ratio;
        if (ratio > 95) {
          evaluationText = `${ratio}%, Hoàn thành tốt`;
          evaluationType = 'good';
        } else {
          evaluationText = `${ratio}%, Rời phòng sớm`;
          evaluationType = 'early';
        }
      }

      let entryColorClass = 'text-white';
      let entryBadgeClass = 'text-white bg-slate-800/40 border-slate-700/50';
      let entryImageBorderClass = 'border-emerald-500/30';
      let entryImageCornersClass = 'border-emerald-400';
      let entryMatchBadgeClass = 'text-white border-emerald-500/20';

      if (thoiGianVao) {
        const inSec = timeStringToSeconds(thoiGianVao);
        const latenessSec = inSec - meetingStartSec;
        if (latenessSec > 0) {
          if (latenessSec <= 900) {
            entryColorClass = 'text-white';
            entryBadgeClass = 'text-white bg-slate-800/40 border-slate-700/50';
            entryImageBorderClass = 'border-emerald-500/30';
            entryImageCornersClass = 'border-emerald-400';
            entryMatchBadgeClass = 'text-white border-emerald-500/20';
          } else if (latenessSec <= 1800) {
            entryColorClass = 'text-amber-400';
            entryBadgeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            entryImageBorderClass = 'border-emerald-500/30';
            entryImageCornersClass = 'border-emerald-400';
            entryMatchBadgeClass = 'text-white border-emerald-500/20';
          } else {
            entryColorClass = 'text-rose-500';
            entryBadgeClass = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            entryImageBorderClass = 'border-[#21232d]';
            entryImageCornersClass = 'border-[#21232d]';
            entryMatchBadgeClass = 'text-white border-emerald-500/20';
          }
        }
      } else {
        entryColorClass = 'text-slate-500';
      }

      let exitColorClass = 'text-white';
      let exitBadgeClass = 'text-white bg-slate-800/40 border-slate-700/50';
      let exitImageBorderClass = 'border-emerald-500/30';
      let exitImageCornersClass = 'border-emerald-400';
      let exitMatchBadgeClass = 'text-white border-emerald-500/20';

      if (thoiGianRa) {
        const outSec = timeStringToSeconds(thoiGianRa);
        const earlinessSec = meetingEndSec - outSec;
        if (earlinessSec > 0) {
          if (earlinessSec <= 900) {
            exitColorClass = 'text-white';
            exitBadgeClass = 'text-white bg-slate-800/40 border-slate-700/50';
            exitImageBorderClass = 'border-emerald-500/30';
            exitImageCornersClass = 'border-emerald-400';
            exitMatchBadgeClass = 'text-white border-emerald-500/20';
          } else if (earlinessSec <= 1800) {
            exitColorClass = 'text-amber-400';
            exitBadgeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            exitImageBorderClass = 'border-emerald-500/30';
            exitImageCornersClass = 'border-emerald-400';
            exitMatchBadgeClass = 'text-white border-emerald-500/20';
          } else {
            exitColorClass = 'text-rose-500';
            exitBadgeClass = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            exitImageBorderClass = 'border-[#21232d]';
            exitImageCornersClass = 'border-[#21232d]';
            exitMatchBadgeClass = 'text-white border-emerald-500/20';
          }
        }
      } else {
        exitColorClass = 'text-slate-500';
      }

      let evaluationColorClass = 'text-emerald-400';
      if (evaluationType === 'absent' || entryColorClass === 'text-rose-500' || exitColorClass === 'text-rose-500') {
        evaluationColorClass = 'text-rose-500';
      } else if (evaluationType === 'manual' || evaluationType === 'early' || entryColorClass === 'text-amber-400' || exitColorClass === 'text-amber-400') {
        evaluationColorClass = 'text-amber-500';
      }

      const empShape = {
        ma: emp.maGiayTo || emp.id,
        ten: emp.hoTen,
        danhSach: emp.human_group[0] || 'Mặc định',
        avatarSeed: `avatar_${emp.id}`,
        originalObject: emp,
        entryEvent,
        exitEvent
      };

      return {
        emp: empShape,
        thoiGianVao,
        thoiGianRa,
        evaluationText,
        evaluationType,
        ratioPercent,
        entryColorClass,
        entryBadgeClass,
        entryImageBorderClass,
        entryImageCornersClass,
        entryMatchBadgeClass,
        exitColorClass,
        exitBadgeClass,
        exitImageBorderClass,
        exitImageCornersClass,
        exitMatchBadgeClass,
        evaluationColorClass
      };
    });

    return [...attendeeRoster].sort((a, b) => {
      const order = { good: 1, early: 2, manual: 3, absent: 4 };
      return order[a.evaluationType] - order[b.evaluationType];
    });
  }, [
    selectedMeetingReport,
    meetingStartTime,
    meetingEndTime,
    employees,
    meetingGroups,
    meetingSearchQuery,
    meetingReportData,
    eventLogs,
    meetingDate
  ]);
  const [inImageIndex, setInImageIndex] = useState(0);
  const [outImageIndex, setOutImageIndex] = useState(0);

  // Reset tabs and details when navigating via the left sidebar (even on the same route)
  useEffect(() => {
    setActiveTab('list');
    setIsMeetingSearched(false);
    setSelectedMeetingReport(null);
  }, [location.key]);

  const [hasInitializedAreas, setHasInitializedAreas] = useState(false);
  useEffect(() => {
    if (areasData && areasData.length > 0 && !hasInitializedAreas) {
      const areaNames = areasData.map(a => a.name);
      setSelectedMeetingAreas(areaNames);
      setAppliedMeetingAreas(areaNames);
      setHasInitializedAreas(true);
    }
  }, [areasData, hasInitializedAreas]);

  // Attendance Report states
  const [attendanceType, setAttendanceType] = useState<string>('Overtime Hours');
  const [attendanceStartDate, setAttendanceStartDate] = useState<string>('2026-07-01');
  const [attendanceEndDate, setAttendanceEndDate] = useState<string>('2026-07-09');
  const [attendanceGroup, setAttendanceGroup] = useState<string>('All');
  const [isAttTypeOpen, setIsAttTypeOpen] = useState<boolean>(false);
  const [isAttGroupOpen, setIsAttGroupOpen] = useState<boolean>(false);
  const [isAttExportOpen, setIsAttExportOpen] = useState<boolean>(false);
  const [attendanceExportFormat, setAttendanceExportFormat] = useState<'CSV' | 'XLSX'>('CSV');
  const [exportedFileName, setExportedFileName] = useState<string>('ThongKeSuKien_DVMS.xlsx');

  // Trigger Excel export simulation
  const handleExportExcel = () => {
    setExporting(true);
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setExporting(false);
          setShowExportToast(true);
          setTimeout(() => setShowExportToast(false), 4000);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Export event list to Excel via backend API
  const handleExportExcelData = async (rows: typeof filteredLogs) => {
    if (rows.length === 0) return;
    setExporting(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_WS_URL || 'http://localhost:3001';
      // Strip image fields before sending to reduce payload size
      const payload = rows.map(({ stt, vung, camera_id, ten, ma, danhSach, thoiGian, accuracy }) => ({
        stt,
        vung: `${vung} (${getAreaSuffix({ stt, vung, camera_id, ten, ma, danhSach, thoiGian, avatarSeed: '' })})`,
        ten,
        ma,
        danhSach,
        thoiGian,
        accuracy,
      }));
      const res = await fetch(`${baseUrl}/meeting/export-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'DanhSachSuKien.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 4000);
    } catch (e: any) {
      console.error('Export failed:', e.message);
    } finally {
      setExporting(false);
    }
  };

  // Export meeting attendance report to Excel
  const handleExportMeetingReportExcel = (
    meetingInfo,
    attendeeRoster
  ) => {
    if (!meetingInfo || !attendeeRoster || attendeeRoster.length === 0) return;

    const rows = attendeeRoster.map((row, idx) => ({
      'STT': idx + 1,
      'Ma NV': row.emp.ma || '',
      'Ho va ten': row.emp.ten || '',
      'Nhom': row.emp.danhSach || '',
      'Gio vao': row.thoiGianVao || '',
      'Gio ra': row.thoiGianRa || '',
      'Danh gia': row.evaluationText || '',
      'Ti le (%)': row.ratioPercent != null ? row.ratioPercent : '',
    }));

    const infoRows = [
      ['Bao cao tham du cuoc hop', ''],
      ['Ten cuoc hop:', meetingInfo.title || ''],
      ['Khu vuc:', meetingInfo.area || ''],
      ['Ngay:', meetingInfo.date || ''],
      ['Gio bat dau:', meetingInfo.startTime || ''],
      ['Gio ket thuc:', meetingInfo.endTime || ''],
      [],
    ];

    const wb = XLSX.utils.book_new();
    const infoSheet = XLSX.utils.aoa_to_sheet(infoRows);
    XLSX.utils.sheet_add_json(infoSheet, rows, { origin: 'A' + (infoRows.length + 1), skipHeader: false });
    XLSX.utils.book_append_sheet(wb, infoSheet, 'BaoCaoHop');

    const safeName = (meetingInfo.title || 'CuocHop').replace(/\s+/g, '_');
    const filename = 'BaoCao_' + safeName + '_' + (meetingInfo.date || 'date') + '.xlsx';
    XLSX.writeFile(wb, filename);
  };

  // Trigger Attendance export simulation
  const handleExportAttendance = (format: 'CSV' | 'XLSX') => {
    let typeSlug = 'BaoCao';
    switch (attendanceType) {
      case 'Daily Summary':
        typeSlug = 'BaoCao_TongHopHangNgay';
        break;
      case 'Monthly Summary':
        typeSlug = 'BaoCao_TongHopHangThang';
        break;
      case 'Late Arrivals & Early Leves':
        typeSlug = 'BaoCao_DiMuonVeSom';
        break;
      case 'Absence & Leave Summary':
        typeSlug = 'BaoCao_VangMatNghiPhep';
        break;
      case 'Overtime Hours':
        typeSlug = 'BaoCao_TangCa';
        break;
    }
    const ext = format.toLowerCase();
    const fileName = `${typeSlug}_${attendanceGroup.replace(/[^a-zA-Z0-9]/g, '')}_${attendanceStartDate.replace(/-/g, '')}_${attendanceEndDate.replace(/-/g, '')}.${ext}`;

    setExportedFileName(fileName);
    setExporting(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setExporting(false);
          setShowExportToast(true);
          setTimeout(() => setShowExportToast(false), 4000);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Helper for generating custom user avatar placeholders
  const getAvatarUrl = (seed: string, isLoi: boolean) => {
    if (isLoi) {
      return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150";
    }
    const index = parseInt(seed.replace(/^\D+/g, '')) || 1;
    const portraits = [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150&h=150"
    ];
    return portraits[index % portraits.length];
  };

  // Find the currently selected event details
  const currentSelectedEvent = pageLogs.find(e => e.stt === selectedEventId) || pageLogs[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPage().finally(() => setIsRefreshing(false));
  };


  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* Header Tab Navigator */}
      <div id="tabs-bar" className="h-14 bg-[#181921] border-b border-[#252731] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-xs text-slate-400 font-semibold tracking-wider">Thống Kê Sự Kiện</div>

          {/* Sliding Big Pill Segmented Control Container */}
          <div className="flex bg-[#111218] p-1 rounded-full border border-[#2d2f3c] space-x-1">
            {/* Tab 1: Danh sách sự kiện */}
            <button
              id="tab-btn-list"
              onClick={() => {
                setActiveTab('list');
                // Make sure filter modal is not open if we switch
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 ${activeTab === 'list'
                  ? 'bg-[#0078d7] text-white shadow-lg shadow-[#0078d7]/20'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <List size={14} />
              <span>Danh sách sự kiện</span>
            </button>

            {/* Tab 2: Báo cáo chấm công */}
            <button
              id="tab-btn-attendance"
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 ${activeTab === 'attendance'
                  ? 'bg-[#0078d7] text-white shadow-lg shadow-[#0078d7]/20'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Calendar size={14} />
              <span>Báo cáo chấm công</span>
            </button>

            {/* Tab 3: Báo cáo cuộc họp */}
            <button
              id="tab-btn-meeting"
              onClick={() => setActiveTab('meeting')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 ${activeTab === 'meeting'
                  ? 'bg-[#0078d7] text-white shadow-lg shadow-[#0078d7]/20'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Clock size={14} />
              <span>Báo cáo cuộc họp</span>
            </button>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-refresh"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 bg-[#20212b] border border-[#2d2f3c] rounded hover:bg-[#2c2d3c] text-slate-300 transition shrink-0 ${isRefreshing ? 'opacity-50' : ''}`}
            title="Refresh data"
          >
            <RotateCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {activeTab === 'list' && (
            <button
              id="btn-filter"
              onClick={() => setShowFilterModal(true)}
              className={`px-3 py-1.5 bg-[#20212b] border ${showFilterModal ? 'border-[#00a2e8] text-[#00a2e8]' : 'border-[#2d2f3c] text-slate-300'} rounded hover:bg-[#2c2d3c] text-xs font-medium flex items-center space-x-1 transition`}
            >
              <Filter size={13} />
              <span>Lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1 Content: List and Camera split */}
      {activeTab === 'list' ? (
        <div className="flex-1 flex overflow-hidden">

          {/* LEFT-MIDDLE PANEL: The compressed Event Table list */}
          <div id="table-panel" className="flex-1 flex flex-col border-r border-[#21232d] overflow-hidden bg-[#0d0e12]">

            {/* Rapid Search Header inside table pane */}
            <div className="p-3 bg-[#111218] border-b border-[#21232d] flex items-center justify-between shrink-0">
              <div className="relative w-72">
                <input
                  type="text"
                  placeholder="Lọc nhanh tên/mã số đối tượng..."
                  value={appliedSearch}
                  onChange={(e) => {
                    setAppliedSearch(e.target.value);
                    setCurrentPage(1); // Reset to page 1 on search
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchPage();
                  }}
                  className="w-full bg-[#181921] border border-[#2a2c3a] rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a2e8]"
                />
                <Search className="absolute left-2.5 top-2 text-slate-500" size={13} />
                {appliedSearch && (
                  <button onClick={() => { setAppliedSearch(''); setCurrentPage(1); }} className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-200">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Active Filter Pill display */}
              <div className="flex items-center space-x-2 text-[10px]">
                {(appliedZone !== 'All' || appliedSearch) && (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                    Đang lọc kết quả
                  </span>
                )}
              </div>
            </div>

            {/* Table Viewport */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#15161f] border-b border-[#21232d] text-[11px] font-bold text-slate-400 tracking-wider sticky top-0 z-10">
                    <th className="py-2.5 px-3 border-r border-[#21232d] text-center w-12">STT</th>
                    <th className="py-2.5 px-3 border-r border-[#21232d]">Khu Vực</th>
                    <th className="py-2.5 px-3 border-r border-[#21232d]">Tên Đối Tượng</th>
                    <th className="py-2.5 px-3 border-r border-[#21232d]">Mã Đối Tượng</th>
                    <th className="py-2.5 px-3 border-r border-[#21232d]">Nhóm</th>
                    <th className="py-2.5 px-3">Thời Gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                  {isLoadingLogs ? (
                    Array.from({ length: itemsPerPage }).map((_, index) => (
                      <tr key={`skeleton-${index}`} className="animate-pulse border-b border-[#21232d] hover:bg-transparent">
                        <td className="py-2.5 px-3 border-r border-[#21232d] text-center w-12">
                          <div className="h-4 bg-[#1f202b] rounded-md mx-auto w-6"></div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#21232d]">
                          <div className="h-4 bg-[#1f202b] rounded-md w-28"></div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#21232d]">
                          <div className="h-4 bg-[#1f202b] rounded-md w-36"></div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#21232d]">
                          <div className="h-4 bg-[#1f202b] rounded-md w-24"></div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#21232d]">
                          <div className="h-4 bg-[#1f202b] rounded-md w-20"></div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="h-4 bg-[#1f202b] rounded-md w-32"></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    currentLogs.map((log) => {
                      const isSelected = selectedEventId === log.stt;
                      const isTranPhuocLoi = log.ma === "010203045567";
                      return (
                        <tr
                          id={`event-row-${log.stt}`}
                          key={log.stt}
                          onClick={() => {
                            setSelectedEventId(log.stt);
                            setSelectedThumbIndex(0); // Reset thumbnail zoom index
                          }}
                          className={`cursor-pointer transition duration-150 ${isSelected
                              ? 'bg-[#005a9e] text-white hover:bg-[#0062ac]'
                              : isTranPhuocLoi
                                ? 'bg-amber-950/10 text-amber-200 hover:bg-[#1f202b]'
                                : 'hover:bg-[#181922] odd:bg-[#0e0f14] even:bg-[#101117] text-slate-300'
                            }`}
                        >
                          <td className="py-2 px-3 border-r border-[#21232d] text-center font-semibold text-slate-400">
                            {log.stt}
                          </td>
                          <td className={`py-2 px-3 border-r border-[#21232d] ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {log.vung}
                            <span className={`ml-1 text-[10px] font-sans ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                              ({getAreaSuffix(log)})
                            </span>
                          </td>
                          <td className={`py-2 px-3 border-r border-[#21232d] font-sans font-medium ${isSelected ? 'text-white' : 'text-slate-100'}`}>
                            {log.ten}
                          </td>
                          <td className="py-2 px-3 border-r border-[#21232d] text-slate-400">
                            {log.ma}
                          </td>
                          <td className={`py-2 px-3 border-r border-[#21232d] font-sans ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {log.danhSach}
                          </td>
                          <td className="py-2 px-3 text-slate-400">
                            {log.thoiGian}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {!isLoadingLogs && currentLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                        <AlertTriangle size={24} className="mx-auto mb-2 text-slate-600" />
                        Không tìm thấy dữ liệu sự kiện trùng khớp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Status Bar & Excel Export bottom drawer */}
            <div className="h-14 bg-[#14151c] border-t border-[#21232d] px-4 flex items-center justify-between shrink-0">

              {/* Left: items-per-page selector */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <button
                    onClick={() => setIsPerPageOpen(prev => !prev)}
                    className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#1f202b] rounded hover:bg-[#2c2d3c] text-slate-300 hover:text-white transition text-xs font-mono"
                    title="Số hàng mỗi trang"
                  >
                    <span>{itemsPerPage} / trang</span>
                    <ChevronDown size={11} className={`transition-transform duration-150 ${isPerPageOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isPerPageOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsPerPageOpen(false)}
                      />
                      <div className="absolute bottom-full left-0 mb-1 z-40 bg-[#1a1b25] border border-[#2d2f3e] rounded-lg shadow-xl overflow-hidden">
                        {PER_PAGE_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            onClick={() => {
                              setItemsPerPage(opt);
                              setCurrentPage(1);
                              setIsPerPageOpen(false);
                            }}
                            className={`w-full px-5 py-1.5 text-xs text-left transition whitespace-nowrap ${opt === itemsPerPage
                                ? 'bg-[#00a2e8]/15 text-[#00a2e8] font-semibold'
                                : 'text-slate-300 hover:bg-[#00a2e8]/10 hover:text-[#00a2e8]'
                              }`}
                          >
                            {opt} / trang
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Pagination: << < Page 1/3 > >> */}
              <div className="flex items-center space-x-1.5 font-mono text-xs">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs flex items-center"
                >
                  <ChevronLeft size={16} className="mr-0.5" />
                  <span>Trang</span>
                </button>

                <div className="bg-[#1b1c25] border border-[#2e303f] px-3 py-1 rounded text-white flex items-center space-x-1 font-semibold font-sans">
                  <input
                    type="text"
                    value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 0 && val <= totalPages) setCurrentPage(val);
                    }}
                    className="w-4 bg-transparent text-center font-mono focus:outline-none text-[#00a2e8]"
                  />
                  <span className="text-slate-500">/</span>
                  <span>{totalPages}</span>
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs flex items-center"
                >
                  <span>Trang</span>
                  <ChevronRight size={16} className="ml-0.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>

              {/* Total and Export Button */}
              <div className="flex items-center space-x-4">
                <div className="text-xs text-slate-400 font-sans">
                  Tổng Số Lượng: <span className="font-bold text-slate-100 font-mono">{totalItems}</span>
                </div>

                <div className="relative group">
                  {/* Dropup menu - visible on hover */}
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover:flex flex-col items-stretch z-20 min-w-[170px] bg-[#1a1b25] border border-[#2d2f3e] rounded-lg shadow-xl overflow-hidden">
                    <button
                      id="btn-export-all"
                      onClick={() => handleExportExcelData(filteredLogs)}
                      disabled={exporting}
                      className="px-4 py-2 text-xs text-slate-200 hover:bg-[#00a2e8]/10 hover:text-[#00a2e8] flex items-center space-x-2 transition text-left whitespace-nowrap disabled:opacity-50"
                    >
                      <Download size={12} />
                      <span>Xuất toàn bộ ({filteredLogs.length})</span>
                    </button>
                    <div className="border-t border-[#2d2f3e]" />
                    <button
                      id="btn-export-page"
                      onClick={() => handleExportExcelData(currentLogs)}
                      disabled={exporting}
                      className="px-4 py-2 text-xs text-slate-200 hover:bg-[#00a2e8]/10 hover:text-[#00a2e8] flex items-center space-x-2 transition text-left whitespace-nowrap disabled:opacity-50"
                    >
                      <Download size={12} />
                      <span>Xuất trong trang ({currentLogs.length})</span>
                    </button>
                  </div>

                  {/* Main export trigger button */}
                  <button
                    id="btn-export-excel"
                    disabled={exporting}
                    className={`px-4 py-1.5 bg-[#0078d7] hover:bg-[#0069be] text-white font-medium rounded text-xs transition shadow flex items-center space-x-1.5 ${exporting ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    <Download size={13} />
                    <span>{exporting ? 'Đang xuất...' : 'Xuất Excel'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: CAMERA MONITOR (Replicated directly from the image) */}
          <div id="camera-panel" className="w-[450px] bg-[#111218] flex flex-col shrink-0 overflow-y-auto">
            {!currentSelectedEvent ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <CameraOff size={32} className="mx-auto text-slate-600 mb-2" />
                <span className="text-xs font-semibold text-slate-400 block mb-1">Không có sự kiện</span>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">Vui lòng chọn hoặc tải sự kiện để xem chi tiết.</p>
              </div>
            ) : (
              /* Main Simulated Camera Viewport Container */
              <div className="p-4 space-y-4">

                      {/* Simulated Camera Window */}
                      <div className="relative aspect-[4/3] bg-black rounded-lg border border-[#2d2f3e] overflow-hidden group shadow-lg">

                        {/* Selected Person Image */}
                        <img
                          src={
                            selectedThumbIndex === 1
                              ? resolveImageUrl((currentSelectedEvent as any).full_image_path) || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=150&h=150"
                              : selectedThumbIndex === 0
                                ? resolveImageUrl((currentSelectedEvent as any).face_image_path) || (currentSelectedEvent as any).faceImgBase64 || getAvatarUrl(currentSelectedEvent.avatarSeed, currentSelectedEvent.ma === "010203045567")
                                : (currentSelectedEvent as any).faceImgBase64 || resolveImageUrl((currentSelectedEvent as any).face_image_path) || getAvatarUrl(currentSelectedEvent.avatarSeed, currentSelectedEvent.ma === "010203045567")
                          }
                          alt="Face checkin capture"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain opacity-90 transition duration-300"
                        />

                        {/* Flash effect animation */}
                        <AnimatePresence>
                          {flashActive && (
                            <motion.div
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 0 }}
                              className="absolute inset-0 bg-white z-40 pointer-events-none"
                            />
                          )}
                        </AnimatePresence>

                        {/* 2. Technical OSD details overlaid on CCTV (Only display image quality) */}
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border border-slate-700/40 px-2.5 py-1 rounded text-[10px] font-mono text-emerald-400 font-bold z-20">
                          CHẤT LƯỢNG: <span className="text-white">1080P</span>
                        </div>

                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono text-slate-300 z-20 border border-slate-700/40">
                          {currentSelectedEvent.thoiGian}
                        </div>
                      </div>

                      {/* 3. Thumbnails Strip Below Camera View */}
                      <div className="grid grid-cols-4 gap-2">
                        {/* Selected thumbnail 1 */}
                        <button
                          onClick={() => setSelectedThumbIndex(0)}
                          className={`relative aspect-square rounded border overflow-hidden transition ${selectedThumbIndex === 0 ? 'border-[#00a2e8] ring-1 ring-[#00a2e8]' : 'border-[#2d2f3e] hover:border-slate-500'
                            }`}
                        >
                          {(currentSelectedEvent as any).face_image_path || (currentSelectedEvent as any).faceImgBase64 || currentSelectedEvent.avatarSeed ? (
                            <img
                              src={resolveImageUrl((currentSelectedEvent as any).face_image_path) || (currentSelectedEvent as any).faceImgBase64 || getAvatarUrl(currentSelectedEvent.avatarSeed, currentSelectedEvent.ma === "010203045567")}
                              alt="Crop face close-up"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#1c1d24]" />
                          )}
                        </button>

                        {/* Thumbnail 2: Alternative scene layout */}
                        <button
                          onClick={() => setSelectedThumbIndex(1)}
                          className={`relative aspect-square rounded border overflow-hidden transition ${selectedThumbIndex === 1 ? 'border-[#00a2e8] ring-1 ring-[#00a2e8]' : 'border-[#2d2f3e] hover:border-slate-500'
                            }`}
                        >
                          <img
                            src={resolveImageUrl((currentSelectedEvent as any).full_image_path) || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=150&h=150"}
                            alt="Wide background snapshot"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </button>

                        {/* Thumbnail 3: Zoomed camera frame */}
                        <button
                          onClick={() => setSelectedThumbIndex(2)}
                          className={`relative aspect-square rounded border overflow-hidden transition ${selectedThumbIndex === 2 ? 'border-[#00a2e8] ring-1 ring-[#00a2e8]' : 'border-[#2d2f3e] hover:border-slate-500'
                            }`}
                        >
                          {(currentSelectedEvent as any).faceImgBase64 || (currentSelectedEvent as any).face_image_path || currentSelectedEvent.avatarSeed ? (
                            <img
                              src={(currentSelectedEvent as any).faceImgBase64 || resolveImageUrl((currentSelectedEvent as any).face_image_path) || getAvatarUrl(currentSelectedEvent.avatarSeed, currentSelectedEvent.ma === "010203045567")}
                              alt="Cropped profile view"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover scale-150 origin-center"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#1c1d24]" />
                          )}
                        </button>

                        {/* Thumbnail 4: Tải ảnh & video đính kèm */}
                        <button
                          onClick={() => {
                            alert("Đang chuẩn bị tải xuống toàn bộ tập tin hình ảnh và video đính kèm chất lượng cao...");
                          }}
                          className="aspect-square rounded border border-[#2d2f3e] bg-[#1c1d24] hover:bg-[#252731] hover:border-[#00a2e8] flex flex-col items-center justify-center space-y-1 transition group"
                          title="Tải các ảnh & video đính kèm"
                        >
                          <Download size={18} className="text-slate-400 group-hover:text-[#00a2e8] transition" />
                          <span className="text-[9px] text-slate-400 group-hover:text-slate-200 transition text-center leading-tight">
                            Tải ảnh/video
                          </span>
                        </button>
                      </div>

                      {/* Dropdown Camera Select Block (Removed) */}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'attendance' ? (
            /* Tab 2 Content: Báo cáo chấm công (Report Builder) */
            <div className="flex-1 p-6 flex flex-col bg-[#0d0e12] overflow-y-auto space-y-6 relative min-h-[400px]">
              <div className={`flex flex-col space-y-6 flex-1 transition-all duration-300 ${!showAttendanceReportDemo ? 'blur-sm pointer-events-none select-none' : ''}`}>

                {/* REPORT BUILDER CONTROLS PANEL */}
                <div className="bg-[#14151b] border border-[#21232d] rounded-2xl p-6 shadow-2xl relative">
                  <div className="flex items-center justify-between mb-5 border-b border-[#21232d] pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-100 tracking-tight">Report Builder</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                    {/* Type Select */}
                    <div className="md:col-span-3 space-y-2 text-left relative">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Type</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAttTypeOpen(!isAttTypeOpen);
                            setIsAttGroupOpen(false);
                            setIsAttExportOpen(false);
                          }}
                          className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl px-4 py-2.5 text-xs text-white text-left flex items-center justify-between transition-all focus:outline-none h-[42px]"
                        >
                          <span className="font-medium text-slate-200">{attendanceType}</span>
                          <ChevronDown size={14} className="text-slate-400" />
                        </button>
                        {isAttTypeOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsAttTypeOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1.5 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden">
                              {[
                                'Daily Summary',
                                'Monthly Summary',
                                'Late Arrivals & Early Leves',
                                'Absence & Leave Summary',
                                'Overtime Hours'
                              ].map((typeOption) => (
                                <button
                                  key={typeOption}
                                  type="button"
                                  onClick={() => {
                                    setAttendanceType(typeOption);
                                    setIsAttTypeOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-[#20212a] flex items-center justify-between ${attendanceType === typeOption ? 'text-[#00a2e8] bg-[#00a2e8]/10 font-bold' : 'text-slate-300'
                                    }`}
                                >
                                  <span>{typeOption}</span>
                                  {attendanceType === typeOption && <Check size={14} className="text-[#00a2e8]" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Chọn nhóm Select */}
                    <div className="md:col-span-3 space-y-2 text-left relative">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Chọn nhóm</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAttGroupOpen(!isAttGroupOpen);
                            setIsAttTypeOpen(false);
                            setIsAttExportOpen(false);
                          }}
                          className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl px-4 py-2.5 text-xs text-white text-left flex items-center justify-between transition-all focus:outline-none h-[42px]"
                        >
                          <span className="font-medium text-slate-200">
                            {attendanceGroup === 'All' ? 'Tất cả (All)' : attendanceGroup}
                          </span>
                          <ChevronDown size={14} className="text-slate-400" />
                        </button>
                        {isAttGroupOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsAttGroupOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1.5 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden">
                              {[
                                { id: 'All', name: 'Tất cả (All)' },
                                { id: 'nhóm nhân viên A', name: 'nhóm nhân viên A' },
                                { id: 'nhóm nhân viên B', name: 'nhóm nhân viên B' },
                                { id: 'nhóm nhân viên C', name: 'nhóm nhân viên C' },
                                { id: 'nhóm nhân viên D', name: 'nhóm nhân viên D' },
                                { id: 'Khách hàng / Khác', name: 'Khách hàng / Khác' }
                              ].map((grpOption) => (
                                <button
                                  key={grpOption.id}
                                  type="button"
                                  onClick={() => {
                                    setAttendanceGroup(grpOption.id);
                                    setIsAttGroupOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-[#20212a] flex items-center justify-between ${attendanceGroup === grpOption.id ? 'text-[#00a2e8] bg-[#00a2e8]/10 font-bold' : 'text-slate-300'
                                    }`}
                                >
                                  <span>{grpOption.name}</span>
                                  {attendanceGroup === grpOption.id && <Check size={14} className="text-[#00a2e8]" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Start Date */}
                    <div className="md:col-span-2 space-y-2 text-left relative">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Start Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={attendanceStartDate}
                          onChange={(e) => setAttendanceStartDate(e.target.value)}
                          className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] focus:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-all h-[42px] [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    {/* End Date */}
                    <div className="md:col-span-2 space-y-2 text-left relative">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">End Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={attendanceEndDate}
                          onChange={(e) => setAttendanceEndDate(e.target.value)}
                          className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] focus:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-all h-[42px] [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    {/* Combined Export Split Button (CSV Dropdown) */}
                    <div className="md:col-span-2 flex items-center justify-end relative h-[42px]">
                      <div className="flex h-full w-full rounded-xl overflow-hidden shadow-lg border border-[#2d2f3c] bg-[#1c1d26]">
                        <button
                          type="button"
                          onClick={() => {
                            handleExportAttendance(attendanceExportFormat);
                          }}
                          className="flex-1 flex items-center justify-center space-x-2 bg-[#00a2e8] hover:bg-[#008cc9] text-white text-xs font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer h-full"
                        >
                          <Download size={14} />
                          <span>{attendanceExportFormat}</span>
                        </button>

                        <div className="w-[1px] bg-[#008cc9] h-full" />

                        <button
                          type="button"
                          onClick={() => {
                            setIsAttExportOpen(!isAttExportOpen);
                            setIsAttTypeOpen(false);
                            setIsAttGroupOpen(false);
                          }}
                          className="px-3 bg-[#00a2e8] hover:bg-[#008cc9] text-white flex items-center justify-center transition-colors duration-150 cursor-pointer h-full"
                        >
                          <ChevronDown size={13} className={`transition-transform duration-200 ${isAttExportOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {isAttExportOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsAttExportOpen(false)} />
                          <div className="absolute right-0 top-12 mt-1 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 py-1.5 w-48 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                setAttendanceExportFormat('CSV');
                                setIsAttExportOpen(false);
                                handleExportAttendance('CSV');
                              }}
                              className="w-full text-left px-4 py-2 text-xs transition-colors hover:bg-[#20212a] flex items-center justify-between text-slate-300 hover:text-white"
                            >
                              <span>Xuất tệp CSV (.csv)</span>
                              {attendanceExportFormat === 'CSV' && <Check size={14} className="text-[#00a2e8]" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAttendanceExportFormat('XLSX');
                                setIsAttExportOpen(false);
                                handleExportAttendance('XLSX');
                              }}
                              className="w-full text-left px-4 py-2 text-xs transition-colors hover:bg-[#20212a] flex items-center justify-between text-slate-300 hover:text-white"
                            >
                              <span>Xuất tệp Excel (.xlsx)</span>
                              {attendanceExportFormat === 'XLSX' && <Check size={14} className="text-[#00a2e8]" />}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* HIGH FIDELITY REPORT TABLE */}
                <div className="bg-[#14151b] border border-[#21232d] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-4 bg-[#181921] border-b border-[#21232d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 rounded-lg bg-[#00a2e8]/10 border border-[#00a2e8]/20 text-[#00a2e8]">
                        <FileText size={15} />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Dữ liệu Báo cáo: {attendanceType}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">Từ {attendanceStartDate} đến {attendanceEndDate} • Nhóm: {attendanceGroup === 'All' ? 'Tất cả' : attendanceGroup}</p>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Phát hiện: <span className="text-white font-bold font-mono">
                        {attendanceGroup === 'All'
                          ? '8'
                          : attendanceGroup === 'nhóm nhân viên B'
                            ? '2'
                            : attendanceGroup === 'nhóm nhân viên A'
                              ? '2'
                              : '1'}
                      </span> nhân sự
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      {/* Render table header and rows dynamically based on selected type */}
                      {(() => {
                        const baseEmployees = [
                          { ma: "080203011585", ten: "Phan Hữu Thiên Phúc", danhSach: "nhóm nhân viên A" },
                          { ma: "010203045567", ten: "Trần Phước Lợi", danhSach: "nhóm nhân viên B" },
                          { ma: "090302012948", ten: "Lê Thị Bình", danhSach: "nhóm nhân viên B" },
                          { ma: "080203011234", ten: "Hoàng Văn Nam", danhSach: "nhóm nhân viên C" },
                          { ma: "080203011567", ten: "Nguyễn Thị Mai", danhSach: "nhóm nhân viên D" },
                          { ma: "080203011888", ten: "Phạm Thành Long", danhSach: "nhóm nhân viên A" },
                          { ma: "020205094857", ten: "Nguyễn Văn An", danhSach: "Khách hàng / Khác" },
                          { ma: "030405060708", ten: "Vũ Thị Thủy", danhSach: "Khách hàng / Khác" }
                        ];

                        const activeEmployees = baseEmployees.filter(emp =>
                          attendanceGroup === 'All' || emp.danhSach === attendanceGroup
                        );

                        if (attendanceType === 'Daily Summary') {
                          return (
                            <>
                              <thead>
                                <tr className="bg-[#15161f] border-b border-[#21232d] text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                  <th className="py-3 px-4 text-center w-12">STT</th>
                                  <th className="py-3 px-4">Mã NV</th>
                                  <th className="py-3 px-4">Họ và Tên</th>
                                  <th className="py-3 px-4">Nhóm / nhóm nhân viên</th>
                                  <th className="py-3 px-4">Ngày</th>
                                  <th className="py-3 px-4">Giờ Vào</th>
                                  <th className="py-3 px-4">Giờ Ra</th>
                                  <th className="py-3 px-4">Tổng giờ</th>
                                  <th className="py-3 px-4 text-center">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                                {activeEmployees.map((emp, idx) => {
                                  const isPhuc = emp.ma === "080203011585";
                                  return (
                                    <tr key={emp.ma} className="hover:bg-[#181922] odd:bg-[#0e0f14] even:bg-[#101117] text-slate-300">
                                      <td className="py-2.5 px-4 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                      <td className="py-2.5 px-4 text-amber-500 font-bold">{emp.ma}</td>
                                      <td className="py-2.5 px-4 font-sans font-medium text-slate-100">{emp.ten}</td>
                                      <td className="py-2.5 px-4 font-sans">{emp.danhSach}</td>
                                      <td className="py-2.5 px-4 text-slate-400">09/07/2026</td>
                                      <td className="py-2.5 px-4 text-emerald-400 font-semibold">{isPhuc ? '08:02:11' : '07:55:04'}</td>
                                      <td className="py-2.5 px-4 text-emerald-400 font-semibold">{isPhuc ? '17:35:45' : '17:30:12'}</td>
                                      <td className="py-2.5 px-4 text-white">8.5 h</td>
                                      <td className="py-2.5 px-4 text-center">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Đúng giờ</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </>
                          );
                        } else if (attendanceType === 'Monthly Summary') {
                          return (
                            <>
                              <thead>
                                <tr className="bg-[#15161f] border-b border-[#21232d] text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                  <th className="py-3 px-4 text-center w-12">STT</th>
                                  <th className="py-3 px-4">Mã NV</th>
                                  <th className="py-3 px-4">Họ và Tên</th>
                                  <th className="py-3 px-4">Nhóm / nhóm nhân viên</th>
                                  <th className="py-3 px-4 text-center">Công chuẩn</th>
                                  <th className="py-3 px-4 text-center">Công thực tế</th>
                                  <th className="py-3 px-4 text-center">Phút đi muộn</th>
                                  <th className="py-3 px-4 text-center">Phút về sớm</th>
                                  <th className="py-3 px-4 text-center">Tổng giờ công</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                                {activeEmployees.map((emp, idx) => {
                                  const isPhuc = emp.ma === "080203011585";
                                  return (
                                    <tr key={emp.ma} className="hover:bg-[#181922] odd:bg-[#0e0f14] even:bg-[#101117] text-slate-300">
                                      <td className="py-2.5 px-4 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                      <td className="py-2.5 px-4 text-amber-500 font-bold">{emp.ma}</td>
                                      <td className="py-2.5 px-4 font-sans font-medium text-slate-100">{emp.ten}</td>
                                      <td className="py-2.5 px-4 font-sans">{emp.danhSach}</td>
                                      <td className="py-2.5 px-4 text-center text-slate-400">22</td>
                                      <td className="py-2.5 px-4 text-center text-white font-bold">{isPhuc ? '21.5' : '22.0'}</td>
                                      <td className="py-2.5 px-4 text-center text-rose-400">{isPhuc ? '45' : '12'}</td>
                                      <td className="py-2.5 px-4 text-center text-slate-400">0</td>
                                      <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">{isPhuc ? '172.5' : '176.0'} h</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </>
                          );
                        } else if (attendanceType === 'Late Arrivals & Early Leves') {
                          return (
                            <>
                              <thead>
                                <tr className="bg-[#15161f] border-b border-[#21232d] text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                  <th className="py-3 px-4 text-center w-12">STT</th>
                                  <th className="py-3 px-4">Mã NV</th>
                                  <th className="py-3 px-4">Họ và Tên</th>
                                  <th className="py-3 px-4">Nhóm / nhóm nhân viên</th>
                                  <th className="py-3 px-4">Ngày</th>
                                  <th className="py-3 px-4">Giờ Vào Thực Tế</th>
                                  <th className="py-3 px-4">Đi muộn</th>
                                  <th className="py-3 px-4">Về Sớm</th>
                                  <th className="py-3 px-4">Lý do</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                                {activeEmployees.slice(0, 3).map((emp, idx) => (
                                  <tr key={emp.ma} className="hover:bg-[#181922] odd:bg-[#0e0f14] even:bg-[#101117] text-slate-300">
                                    <td className="py-2.5 px-4 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                    <td className="py-2.5 px-4 text-amber-500 font-bold">{emp.ma}</td>
                                    <td className="py-2.5 px-4 font-sans font-medium text-slate-100">{emp.ten}</td>
                                    <td className="py-2.5 px-4 font-sans">{emp.danhSach}</td>
                                    <td className="py-2.5 px-4 text-slate-400">09/07/2026</td>
                                    <td className="py-2.5 px-4 text-rose-400 font-bold">08:15:32</td>
                                    <td className="py-2.5 px-4 text-rose-400 font-bold">15 phút</td>
                                    <td className="py-2.5 px-4 text-slate-400">0</td>
                                    <td className="py-2.5 px-4 font-sans italic text-slate-400">Kẹt xe giờ cao điểm</td>
                                  </tr>
                                ))}
                                {activeEmployees.length === 0 && (
                                  <tr>
                                    <td colSpan={9} className="py-6 text-center text-slate-500 font-sans">Không tìm thấy dữ liệu đi muộn về sớm</td>
                                  </tr>
                                )}
                              </tbody>
                            </>
                          );
                        } else if (attendanceType === 'Absence & Leave Summary') {
                          return (
                            <>
                              <thead>
                                <tr className="bg-[#15161f] border-b border-[#21232d] text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                  <th className="py-3 px-4 text-center w-12">STT</th>
                                  <th className="py-3 px-4">Mã NV</th>
                                  <th className="py-3 px-4">Họ và Tên</th>
                                  <th className="py-3 px-4">Nhóm / nhóm nhân viên</th>
                                  <th className="py-3 px-4">Ngày vắng</th>
                                  <th className="py-3 px-4">Loại nghỉ</th>
                                  <th className="py-3 px-4">Lý do nghỉ</th>
                                  <th className="py-3 px-4 text-center">Trạng thái duyệt</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                                {activeEmployees.slice(1, 3).map((emp, idx) => (
                                  <tr key={emp.ma} className="hover:bg-[#181922] odd:bg-[#0e0f14] even:bg-[#101117] text-slate-300">
                                    <td className="py-2.5 px-4 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                    <td className="py-2.5 px-4 text-amber-500 font-bold">{emp.ma}</td>
                                    <td className="py-2.5 px-4 font-sans font-medium text-slate-100">{emp.ten}</td>
                                    <td className="py-2.5 px-4 font-sans">{emp.danhSach}</td>
                                    <td className="py-2.5 px-4 text-slate-400">08/07/2026</td>
                                    <td className="py-2.5 px-4 text-white font-medium">Nghỉ có lương (AL)</td>
                                    <td className="py-2.5 px-4 font-sans text-slate-400">Khám sức khỏe định kỳ</td>
                                    <td className="py-2.5 px-4 text-center">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Đã duyệt</span>
                                    </td>
                                  </tr>
                                ))}
                                {activeEmployees.length === 0 && (
                                  <tr>
                                    <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">Không tìm thấy dữ liệu nghỉ vắng</td>
                                  </tr>
                                )}
                              </tbody>
                            </>
                          );
                        } else { // Overtime Hours
                          return (
                            <>
                              <thead>
                                <tr className="bg-[#15161f] border-b border-[#21232d] text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                  <th className="py-3 px-4 text-center w-12">STT</th>
                                  <th className="py-3 px-4">Mã NV</th>
                                  <th className="py-3 px-4">Họ và Tên</th>
                                  <th className="py-3 px-4">Nhóm / nhóm nhân viên</th>
                                  <th className="py-3 px-4">Ngày</th>
                                  <th className="py-3 px-4 text-center">Giờ ra chuẩn</th>
                                  <th className="py-3 px-4 text-center">Giờ ra thực tế</th>
                                  <th className="py-3 px-4 text-center">Số giờ OT</th>
                                  <th className="py-3 px-4 text-center">Phê duyệt</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                                {activeEmployees.map((emp, idx) => {
                                  const isPhuc = emp.ma === "080203011585";
                                  return (
                                    <tr key={emp.ma} className="hover:bg-[#181922] odd:bg-[#0e0f14] even:bg-[#101117] text-slate-300">
                                      <td className="py-2.5 px-4 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                      <td className="py-2.5 px-4 text-amber-500 font-bold">{emp.ma}</td>
                                      <td className="py-2.5 px-4 font-sans font-medium text-slate-100">{emp.ten}</td>
                                      <td className="py-2.5 px-4 font-sans">{emp.danhSach}</td>
                                      <td className="py-2.5 px-4 text-slate-400">09/07/2026</td>
                                      <td className="py-2.5 px-4 text-center text-slate-500">17:30:00</td>
                                      <td className="py-2.5 px-4 text-center text-amber-400 font-bold">{isPhuc ? '19:30:15' : '18:45:00'}</td>
                                      <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">{isPhuc ? '2.0' : '1.25'} h</td>
                                      <td className="py-2.5 px-4 text-center">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20">Đã duyệt</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </>
                          );
                        }
                      })()}
                    </table>
                  </div>
                </div>
              </div>
              {!showAttendanceReportDemo && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0e12]/60 backdrop-blur-sm p-6 text-center">
                  <div className="bg-[#14151b] border border-[#2d2f3e] p-8 rounded-2xl shadow-2xl max-w-sm flex flex-col items-center">
                    <div className="p-3.5 bg-[#00a2e8]/10 rounded-full text-[#00a2e8] mb-4 animate-pulse">
                      <Sparkles size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 mb-2">Tính năng đang được hoàn thiện</h3>
                    <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">Giao diện Báo cáo chấm công đang trong quá trình phát triển và hoàn thiện dữ liệu thực tế.</p>
                    <button
                      type="button"
                      onClick={() => setShowAttendanceReportDemo(true)}
                      className="px-5 py-2.5 bg-[#00a2e8] hover:bg-[#008cc9] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#00a2e8]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Xem bản mẫu
                    </button>
                  </div>
                </div>
              )}
            </div>
            ) : (
            /* Tab 3 Content: Báo cáo cuộc họp */
            <div className="flex-1 p-6 flex flex-col bg-[#0d0e12] overflow-y-auto space-y-6">
              {!isMeetingSearched ? (
                /* Search Form view (Centered, spacious) */
                <div className="flex-1 flex flex-col items-center py-6 px-4">
                  <div className="w-full max-w-6xl space-y-6">
                    {/* Top Filters Block */}
                    <div className="grid grid-cols-12 gap-5 w-full bg-[#14151b] border border-[#21232d] p-6 rounded-2xl shadow-2xl relative items-end">

                      {/* Time filter: col-span-7 */}
                      <div className="col-span-7 space-y-2 text-left">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Clock size={14} className="text-[#00a2e8]" />
                          Khoảng thời gian tìm kiếm
                        </label>
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-1 items-center">
                          {/* Từ */}
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <input
                                type="time"
                                value={meetingStartTime}
                                onChange={(e) => setMeetingStartTime(e.target.value)}
                                className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none transition-all"
                              />
                              <input
                                type="date"
                                value={meetingStartDate}
                                onChange={(e) => setMeetingStartDate(e.target.value)}
                                className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none transition-all"
                              />
                            </div>
                          </div>
                          <span className='h-fit'> - </span>
                          {/* Đến */}
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <input
                                type="time"
                                value={meetingEndTime}
                                onChange={(e) => setMeetingEndTime(e.target.value)}
                                className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none transition-all"
                              />
                              <input
                                type="date"
                                value={meetingEndDate}
                                onChange={(e) => setMeetingEndDate(e.target.value)}
                                className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Room filter: col-span-3 */}
                      <div className="col-span-3 space-y-2 relative text-left">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Layers size={14} className="text-[#00a2e8]" />
                          Khu vực / Phòng họp
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsMeetingAreaDropdownOpen(!isMeetingAreaDropdownOpen)}
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-lg px-3 py-2 text-xs text-white text-left flex items-center justify-between transition-all focus:outline-none h-[38px]"
                          >
                            <span className="truncate pr-1">
                              {selectedMeetingAreas.length === 0
                                ? 'Chưa chọn khu vực'
                                : selectedMeetingAreas.length === areasData.length
                                  ? `Tất cả (${areasData.length} phòng)`
                                  : selectedMeetingAreas.join(', ')}
                            </span>
                            <ChevronDown size={14} className={`text-[#00a2e8] transition-transform duration-200 ${isMeetingAreaDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isMeetingAreaDropdownOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setIsMeetingAreaDropdownOpen(false)}
                              />
                              <div className="absolute right-0 left-0 mt-1 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 p-2 space-y-1">
                                <div className="flex justify-between border-b border-[#2d2f3c]/60 pb-1.5 mb-1.5 px-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedMeetingAreas(areasData.map(a => a.name))}
                                    className="text-[10px] text-[#00a2e8] hover:underline font-semibold"
                                  >
                                    Chọn tất cả
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedMeetingAreas([])}
                                    className="text-[10px] text-slate-400 hover:underline font-semibold"
                                  >
                                    Bỏ chọn
                                  </button>
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-1">
                                  {areasData.map((area) => {
                                    const areaOption = area.name;
                                    const isChecked = selectedMeetingAreas.includes(areaOption);
                                    return (
                                      <button
                                        key={area.id}
                                        type="button"
                                        onClick={() => {
                                          if (isChecked) {
                                            setSelectedMeetingAreas(selectedMeetingAreas.filter(a => a !== areaOption));
                                          } else {
                                            setSelectedMeetingAreas([...selectedMeetingAreas, areaOption]);
                                          }
                                        }}
                                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs text-slate-200 hover:bg-[#20212a] transition cursor-pointer"
                                      >
                                        <span>{areaOption}</span>
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isChecked
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
                      </div>

                      {/* Search Button (Temporarily no functionality) */}
                      <div className="col-span-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedStartDate(meetingStartDate);
                            setAppliedEndDate(meetingEndDate);
                            setAppliedStartTime(meetingStartTime);
                            setAppliedEndTime(meetingEndTime);
                            setAppliedMeetingAreas([...selectedMeetingAreas]);
                          }}
                          className="w-full flex items-center justify-center space-x-1.5 px-2 h-[38px] bg-[#00a2e8] hover:bg-[#008cc9] text-white border border-[#00a2e8] rounded-lg text-[11px] font-bold uppercase transition-all duration-200 cursor-pointer shadow-md shadow-[#00a2e8]/10"
                        >
                          <Search size={12} />
                          <span>Tìm kiếm</span>
                        </button>
                      </div>

                    </div>

                    {/* List of Created Meetings */}
                    <div className="mt-8 space-y-4 text-left">
                      <div className="flex items-center justify-between border-b border-[#21232d] pb-2.5">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                          <Calendar size={14} className="text-[#00a2e8]" />
                          Danh sách cuộc họp đã tạo ({(() => {
                            const getMeetingTimestamp = (dateStr: string, timeStr: string) => {
                              return new Date(`${dateStr}T${timeStr || '00:00'}`).getTime();
                            };
                            return schMeetingSavedData.filter((meet: any) => {
                              const meetStart = getMeetingTimestamp(meet.date, meet.startTime);
                              const meetEnd = getMeetingTimestamp(meet.date, meet.endTime);
                              const filterStart = getMeetingTimestamp(appliedStartDate, appliedStartTime);
                              const filterEnd = getMeetingTimestamp(appliedEndDate, appliedEndTime);

                              const isInTimeRange = meetStart >= filterStart && meetEnd <= filterEnd;
                              const isInArea = appliedMeetingAreas.includes(meet.area);
                              return isInTimeRange && isInArea;
                            }).length;
                          })()})
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">💡 Click vào cuộc họp để xem chi tiết báo cáo tham dự</span>
                      </div>

                      {(() => {
                        const getMeetingTimestamp = (dateStr: string, timeStr: string) => {
                          return new Date(`${dateStr}T${timeStr || '00:00'}`).getTime();
                        };
                        const filteredMeetings = schMeetingSavedData.filter((meet: any) => {
                          const meetStart = getMeetingTimestamp(meet.date, meet.startTime);
                          const meetEnd = getMeetingTimestamp(meet.date, meet.endTime);
                          const filterStart = getMeetingTimestamp(appliedStartDate, appliedStartTime);
                          const filterEnd = getMeetingTimestamp(appliedEndDate, appliedEndTime);

                          const isInTimeRange = meetStart >= filterStart && meetEnd <= filterEnd;
                          const isInArea = appliedMeetingAreas.includes(meet.area);
                          return isInTimeRange && isInArea;
                        });

                        if (filteredMeetings.length === 0) {
                          return (
                            <div className="bg-[#14151b] border border-[#21232d] rounded-2xl p-8 text-center text-slate-500">
                              <AlertTriangle size={32} className="mx-auto text-slate-600 mb-2 animate-pulse" />
                              <span className="text-xs font-semibold text-slate-400 block mb-1">Không tìm thấy cuộc họp nào</span>
                              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">Vui lòng thay đổi thời gian lọc hoặc khu vực/phòng họp để hiển thị danh sách cuộc họp.</p>
                            </div>
                          );
                        }

                        const mapDepToLogGroup = (dep: string): string => {
                          if (dep === 'nhóm nhân viên 1' || dep === 'nhóm nhân viên 1') return 'nhóm nhân viên A';
                          if (dep === 'nhóm nhân viên 2' || dep === 'nhóm nhân viên 2') return 'nhóm nhân viên B';
                          if (dep === 'Nhóm nhân viên C') return 'nhóm nhân viên C';
                          if (dep === 'Nhóm nhân viên D' || dep === 'Phòng nhân sự') return 'nhóm nhân viên D';
                          return dep;
                        };

                        const handleSelectMeeting = async (meet: any) => {
                          setSelectedMeetingReport(meet);
                          setMeetingDate(meet.date);
                          setMeetingStartTime(meet.startTime);
                          setMeetingEndTime(meet.endTime);
                          const mappedGroups = (meet.departments || []).map(mapDepToLogGroup);
                          setMeetingGroups(mappedGroups);
                          setIsMeetingSearched(true);
                          setMeetingCurrentPage(1);

                          setIsLoadingReport(true);
                          try {
                            const baseUrl = (import.meta as any).env.VITE_WS_URL || 'http://localhost:3001';
                            const res = await fetch(`${baseUrl}/meeting/${meet.id}/attendance-report`);
                            if (res.ok) {
                              const data = await res.json();
                              setMeetingReportData(data);
                              console.log('--- LCMS ATTENDANCE REPORT QUERY ---');
                              console.log('SQL Query:\n', data.query);
                              console.log('Check-in Query Parameters:\n', data.paramsCheckin);
                              console.log('Check-out Query Parameters:\n', data.paramsCheckout);
                              console.log('Attendance Aggregated Result:\n', data.attendance);
                              console.log('------------------------------------');
                            }
                          } catch (err) {
                            console.error('Failed to load meeting attendance report:', err);
                          } finally {
                            setIsLoadingReport(false);
                          }
                        };

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredMeetings.map((meet: any) => (
                              <div
                                key={meet.id}
                                onClick={() => handleSelectMeeting(meet)}
                                className="bg-[#14151b] border border-[#21232d] hover:border-[#00a2e8]/50 rounded-2xl p-4 cursor-pointer transition-all duration-150 hover:scale-[1.01] hover:bg-[#1a1b24] shadow-md group relative overflow-hidden text-left"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00a2e8]" />

                                <div className="pl-2 space-y-2.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="font-bold text-xs text-white group-hover:text-[#00a2e8] transition truncate animate-pulse" title={meet.title}>
                                      {meet.title}
                                    </h5>
                                    <span className="shrink-0 bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[9px] font-semibold border border-slate-700/50">
                                      {meet.area}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-medium">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar size={12} className="text-slate-500" />
                                      <span>{(() => {
                                        const parts = meet.date.split('-');
                                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : meet.date;
                                      })()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Clock size={12} className="text-slate-500" />
                                      <span>{meet.startTime} - {meet.endTime}</span>
                                    </div>
                                  </div>

                                  <div className="border-t border-[#21232d]/60 pt-2 flex items-center justify-between">
                                    <div className="flex flex-wrap gap-1">
                                      {(meet.departments || []).map((dep: string) => (
                                        <span key={dep} className="bg-[#00a2e8]/10 text-[#00a2e8] px-1.5 py-0.5 rounded text-[8px] font-bold border border-[#00a2e8]/25">
                                          {dep}
                                        </span>
                                      ))}
                                    </div>
                                    <span className="text-[9px] text-[#00a2e8] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                      Xem báo cáo →
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                </div>
              ) : (
                /* Table View (Display results with criteria summary and a Back button) */
                <div className="flex-1 flex flex-col space-y-4">
                  {/* Active Meeting Dashboard & Attendees Table */}
                  <div className="flex-1 min-h-[300px] flex flex-col bg-[#14151b] border border-[#21232d] rounded-2xl shadow-xl overflow-hidden">
                    {/* Dashboard Header */}
                    <div className="px-5 py-4 border-b border-[#2d2f3c] bg-[#111218] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => {
                              setIsMeetingSearched(false);
                              setSelectedMeetingReport(null);
                            }}
                            className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#2d2f3c] hover:border-slate-400 bg-[#1c1d26] hover:bg-[#20212a] text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                            title="Quay lại danh sách"
                          >
                            <ArrowLeft size={14} />
                          </button>
                          <div className="text-left space-y-0.5">
                            <h4 className="font-bold text-sm text-slate-100 uppercase tracking-wider flex items-center gap-2">
                              <span>{selectedMeetingReport ? `Báo cáo: ${selectedMeetingReport.title}` : 'Báo cáo Chi Tiết Tham Dự Cuộc Họp'}</span>
                              <span className="text-[11px] bg-[#00a2e8]/20 text-[#00a2e8] font-bold px-2 py-0.5 rounded border border-[#00a2e8]/25 uppercase font-mono">
                                {selectedMeetingReport?.area || 'Phòng Họp'}
                              </span>
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Thời gian: <span className="text-slate-300 font-semibold font-mono">{meetingStartTime} - {meetingEndTime}</span> ngày <span className="text-slate-300 font-semibold font-mono">{(() => {
                                if (!meetingDate) return '';
                                const parts = meetingDate.split('-');
                                if (parts.length === 3) {
                                  return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                }
                                return meetingDate;
                              })()}</span> | Ban tham gia: <span className="text-[#00a2e8] font-bold">{(selectedMeetingReport?.departments || []).join(', ')}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Search & Action Buttons */}
                      <div className="flex items-center space-x-2.5">
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400">
                            <Search size={12} />
                          </span>
                          <input
                            type="text"
                            placeholder="Tìm tên/mã nhân sự..."
                            value={meetingSearchQuery}
                            onChange={(e) => {
                              setMeetingSearchQuery(e.target.value);
                              setMeetingCurrentPage(1);
                            }}
                            className="bg-[#181921] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white w-44 focus:outline-none transition-all"
                          />
                        </div>
                        <button
                          onClick={() => {
                            handleExportMeetingReportExcel(selectedMeetingReport, computedAttendeeRoster);
                          }}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#00a2e8] hover:bg-[#008cc9] text-white rounded-lg text-xs font-semibold transition shadow-md shadow-[#00a2e8]/10"
                        >
                          <Download size={13} />
                          <span>Xuất báo cáo</span>
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Stats Row inside Meeting */}
                    {(() => {
                      if (isLoadingReport) {
                        return (
                          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                            <div className="w-8 h-8 border-3 border-[#00a2e8] border-t-transparent rounded-full animate-spin mb-3" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider font-sans">Đang tải báo cáo điểm danh từ lcms_server...</span>
                          </div>
                        );
                      }

                      const sortedAttendeeRoster = computedAttendeeRoster;

                      // Find active selected attendee or default to the first one in the filtered list
                      let activeSelectedCode = selectedMeetingEmpCode;
                      if (sortedAttendeeRoster.length > 0) {
                        const isStillInRoster = sortedAttendeeRoster.some(r => r.emp.ma === activeSelectedCode);
                        if (!activeSelectedCode || !isStillInRoster) {
                          activeSelectedCode = sortedAttendeeRoster[0].emp.ma;
                        }
                      } else {
                        activeSelectedCode = null;
                      }

                      const selectedAttendee = sortedAttendeeRoster.find(r => r.emp.ma === activeSelectedCode);

                      const inImages = [];
                      if (selectedAttendee && selectedAttendee.thoiGianVao) {
                        const event = selectedAttendee.emp.entryEvent;
                        if (event) {
                          if (event.face_image_path) {
                            inImages.push({
                              url: resolveImageUrl(event.face_image_path),
                              label: 'Ảnh khuôn mặt sự kiện'
                            });
                          }
                          if (event.full_image_path) {
                            inImages.push({
                              url: resolveImageUrl(event.full_image_path),
                              label: 'Ảnh toàn cảnh sự kiện'
                            });
                          }
                          if (event.cropped_face_images && event.cropped_face_images.length > 0) {
                            inImages.push({
                              url: event.cropped_face_images[0],
                              label: 'Ảnh đăng ký'
                            });
                          }
                        }
                        if (inImages.length === 0) {
                          inImages.push({
                            url: getPhotoSrc(selectedAttendee, 'in'),
                            label: 'Ảnh minh họa'
                          });
                        }
                      }

                      const outImages = [];
                      if (selectedAttendee && selectedAttendee.thoiGianRa) {
                        const event = selectedAttendee.emp.exitEvent;
                        if (event) {
                          if (event.face_image_path) {
                            outImages.push({
                              url: resolveImageUrl(event.face_image_path),
                              label: 'Ảnh khuôn mặt sự kiện'
                            });
                          }
                          if (event.full_image_path) {
                            outImages.push({
                              url: resolveImageUrl(event.full_image_path),
                              label: 'Ảnh toàn cảnh sự kiện'
                            });
                          }
                          if (event.cropped_face_images && event.cropped_face_images.length > 0) {
                            outImages.push({
                              url: event.cropped_face_images[0],
                              label: 'Ảnh đăng ký'
                            });
                          }
                        }
                        if (outImages.length === 0) {
                          outImages.push({
                            url: getPhotoSrc(selectedAttendee, 'out'),
                            label: 'Ảnh minh họa'
                          });
                        }
                      }

                      // Calculate metrics
                      const totalRosterCount = sortedAttendeeRoster.length;
                      const presentCount = sortedAttendeeRoster.filter(r => r.thoiGianVao || r.thoiGianRa).length;
                      const deptsCount = Array.from(new Set(sortedAttendeeRoster.map(r => r.emp.danhSach))).length;

                      const beforeBeginSec = (selectedMeetingReport?.time_before_begin ?? 30) * 60;
                      const afterEndSec = (selectedMeetingReport?.time_after_end ?? 30) * 60;
                      const startSec = timeStringToSeconds(meetingStartTime);
                      const endSec = timeStringToSeconds(meetingEndTime);

                      const onTimeCount = sortedAttendeeRoster.filter(r => {
                        if (!r.thoiGianVao || !r.thoiGianRa) return false;
                        const inSec = timeStringToSeconds(r.thoiGianVao);
                        const outSec = timeStringToSeconds(r.thoiGianRa);
                        const checkinOk = inSec >= startSec - beforeBeginSec && inSec <= startSec;
                        const checkoutOk = outSec >= endSec && outSec <= endSec + afterEndSec;
                        return checkinOk && checkoutOk;
                      }).length;

                      const totalRatioSum = sortedAttendeeRoster.reduce((sum, item) => sum + item.ratioPercent, 0);
                      const averageAttendancePercentage = totalRosterCount > 0
                        ? Math.round(totalRatioSum / totalRosterCount)
                        : 100;

                      // Meeting pagination calculation
                      const totalMeetingItems = sortedAttendeeRoster.length;
                      const totalMeetingPages = Math.ceil(totalMeetingItems / meetingItemsPerPage) || 1;

                      // Bound check current page
                      const activeMeetingPage = Math.min(meetingCurrentPage, totalMeetingPages);

                      const indexLastMeetingItem = activeMeetingPage * meetingItemsPerPage;
                      const indexFirstMeetingItem = indexLastMeetingItem - meetingItemsPerPage;
                      const currentMeetingRoster = sortedAttendeeRoster.slice(indexFirstMeetingItem, indexLastMeetingItem);

                      return (
                        <>
                          {/* Mini Stats Badges */}
                          <div className="grid grid-cols-3 gap-4 p-4 border-b border-[#2d2f3c]/60 bg-[#16171d]/40 shrink-0">
                            {/* Stat 1 */}
                            <div className="bg-[#181921] border border-[#2d2f3c]/60 rounded-xl p-3 flex items-center justify-between">
                              <div className="space-y-0.5 text-left">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Người tham dự</span>
                                <span className="text-xl font-bold text-white font-mono">{presentCount}/{totalRosterCount}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20">
                                <Clock size={16} />
                              </div>
                            </div>

                            {/* Stat 2 */}
                            <div className="bg-[#181921] border border-[#2d2f3c]/60 rounded-xl p-3 flex items-center justify-between">
                              <div className="space-y-0.5 text-left">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">nhóm nhân viên tham gia</span>
                                <span className="text-xl font-bold text-white font-mono">{deptsCount}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                <Layers size={16} />
                              </div>
                            </div>

                            {/* Stat 3 */}
                            <div className="bg-[#181921] border border-[#2d2f3c]/60 rounded-xl p-3 flex items-center justify-between">
                              <div className="space-y-0.5 text-left">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Phần trăm tham gia</span>
                                <span className="text-xl font-bold text-white font-mono">
                                  {averageAttendancePercentage}%
                                </span>
                              </div>
                              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Star size={16} fill="currentColor" />
                              </div>
                            </div>
                          </div>

                          {/* Split Layout: Table + Sidebar Details */}
                          <div className="flex-1 flex overflow-hidden min-h-[250px]">
                            {/* Table Area (Scrollable) */}
                            <div className="flex-1 overflow-auto bg-[#0d0e12] border-r border-[#21232d]/50">
                              {sortedAttendeeRoster.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 text-center">
                                  <AlertTriangle size={36} className="text-slate-600 mb-2.5 animate-bounce" />
                                  <span className="text-xs font-semibold uppercase tracking-wider mb-1 text-slate-400">Không tìm thấy người tham gia</span>
                                  <p className="text-[11px] max-w-xs text-slate-500 leading-relaxed">
                                    Vui lòng đổi ngày (ví dụ: 09/07/2026), thay đổi khoảng thời gian check-in hoặc chọn thêm nhóm nhân viên tham dự họp.
                                  </p>
                                </div>
                              ) : (
                                <table className="w-full text-xs text-left border-collapse">
                                  <thead className="bg-[#181921] text-slate-300 font-semibold border-b border-[#21232d] uppercase tracking-wider text-[10px] sticky top-0 z-10">
                                    <tr>
                                      <th className="py-2.5 px-4 w-12 text-center">STT</th>
                                      <th className="py-2.5 px-3">Tên nhân sự</th>
                                      <th className="py-2.5 px-3">Mã nhân sự</th>
                                      <th className="py-2.5 px-3">nhóm nhân viên</th>
                                      <th className="py-2.5 px-3">Thời gian vào phòng</th>
                                      <th className="py-2.5 px-3">Thời gian rời phòng</th>
                                      <th className="py-2.5 px-4 text-center">Đánh giá</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#21232d]/40 text-slate-300">
                                    {currentMeetingRoster.map((item, index) => {
                                      const { emp, thoiGianVao, thoiGianRa, evaluationText, evaluationType } = item;
                                      const isSelected = activeSelectedCode === emp.ma;

                                      return (
                                        <tr
                                          key={emp.ma}
                                          onClick={() => {
                                            setSelectedMeetingEmpCode(emp.ma);
                                            setInImageIndex(0);
                                            setOutImageIndex(0);
                                          }}
                                          className={`cursor-pointer transition-colors ${isSelected
                                              ? 'bg-[#00a2e8]/10 text-[#00a2e8] hover:bg-[#00a2e8]/15 font-medium'
                                              : 'hover:bg-[#181921]/60'
                                            }`}
                                        >
                                          <td className="py-2 px-4 text-center font-mono text-slate-400">{indexFirstMeetingItem + index + 1}</td>
                                          <td className={`py-2 px-3 font-semibold ${isSelected ? 'text-[#00a2e8]' : 'text-white'}`}>{emp.ten}</td>
                                          <td className="py-2 px-3 font-mono text-slate-400">{emp.ma}</td>
                                          <td className="py-2 px-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#21232d] border border-[#2d2f3c]/60 text-slate-300">
                                              {emp.danhSach}
                                            </span>
                                          </td>
                                          <td className={`py-2 px-3 font-mono ${item.entryColorClass}`}>{thoiGianVao || '--:--:--'}</td>
                                          <td className={`py-2 px-3 font-mono ${item.exitColorClass}`}>{thoiGianRa || '--:--:--'}</td>
                                          <td className="py-2 px-4 text-center font-semibold">
                                            <span className={`${item.evaluationColorClass} text-[11px]`}>
                                              {evaluationText}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>

                            {/* Right Sidebar Details Panel */}
                            <div className="w-72 bg-[#14151c]/95 flex flex-col shrink-0 overflow-y-auto border-l border-[#21232d]/40">
                              {selectedAttendee ? (
                                <div className="p-4 space-y-4 text-left">
                                  {/* Entry Section */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ảnh lúc vào phòng</span>
                                      {selectedAttendee.thoiGianVao ? (
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${selectedAttendee.entryBadgeClass}`}>{selectedAttendee.thoiGianVao}</span>
                                      ) : (
                                        <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Vắng</span>
                                      )}
                                    </div>
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-[#2d2f3c] bg-[#0d0e12] flex items-center justify-center group shadow-inner">
                                      {inImages.length > 0 ? (
                                        <>
                                          <img
                                            src={inImages[Math.min(inImageIndex, inImages.length - 1)]?.url}
                                            alt={inImages[Math.min(inImageIndex, inImages.length - 1)]?.label}
                                            className="w-full h-full object-contain transition-transform group-hover:scale-105"
                                            referrerPolicy="no-referrer"
                                          />
                                          {inImages.length > 1 && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setInImageIndex(prev => (prev - 1 + inImages.length) % inImages.length);
                                                }}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full border border-slate-700/50 transition cursor-pointer z-10"
                                              >
                                                <ChevronLeft size={14} />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setInImageIndex(prev => (prev + 1) % inImages.length);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full border border-slate-700/50 transition cursor-pointer z-10"
                                              >
                                                <ChevronRight size={14} />
                                              </button>
                                            </>
                                          )}
                                          <div className={`absolute inset-2 border ${selectedAttendee.entryImageBorderClass} rounded pointer-events-none z-0`}>
                                            <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${selectedAttendee.entryImageCornersClass}`} />
                                            <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${selectedAttendee.entryImageCornersClass}`} />
                                            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${selectedAttendee.entryImageCornersClass}`} />
                                            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${selectedAttendee.entryImageCornersClass}`} />
                                          </div>
                                          <span className="absolute bottom-1 left-1 text-[8px] font-mono bg-black/80 px-1 rounded border border-slate-700/50 text-slate-300 z-10">
                                            {inImages[Math.min(inImageIndex, inImages.length - 1)]?.label} ({Math.min(inImageIndex, inImages.length - 1) + 1}/{inImages.length})
                                          </span>
                                          <span className={`absolute bottom-1 right-1 text-[8px] font-mono bg-black/80 px-1 rounded border ${selectedAttendee.entryMatchBadgeClass} z-10`}>
                                            99.2% MATCH
                                          </span>
                                        </>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center text-slate-600">
                                          <Camera size={20} className="text-slate-700 mb-1" />
                                          <span className="text-[9px] text-slate-500 font-medium">Không có dữ liệu vào</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Exit Section */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ảnh lúc ra khỏi phòng</span>
                                      {selectedAttendee.thoiGianRa ? (
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${selectedAttendee.exitBadgeClass}`}>{selectedAttendee.thoiGianRa}</span>
                                      ) : (
                                        <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Vắng</span>
                                      )}
                                    </div>
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-[#2d2f3c] bg-[#0d0e12] flex items-center justify-center group shadow-inner">
                                      {outImages.length > 0 ? (
                                        <>
                                          <img
                                            src={outImages[Math.min(outImageIndex, outImages.length - 1)]?.url}
                                            alt={outImages[Math.min(outImageIndex, outImages.length - 1)]?.label}
                                            className="w-full h-full object-contain transition-transform group-hover:scale-105"
                                            referrerPolicy="no-referrer"
                                          />
                                          {outImages.length > 1 && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOutImageIndex(prev => (prev - 1 + outImages.length) % outImages.length);
                                                }}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full border border-slate-700/50 transition cursor-pointer z-10"
                                              >
                                                <ChevronLeft size={14} />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setOutImageIndex(prev => (prev + 1) % outImages.length);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full border border-slate-700/50 transition cursor-pointer z-10"
                                              >
                                                <ChevronRight size={14} />
                                              </button>
                                            </>
                                          )}
                                          <div className={`absolute inset-2 border ${selectedAttendee.exitImageBorderClass} rounded pointer-events-none z-0`}>
                                            <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${selectedAttendee.exitImageCornersClass}`} />
                                            <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${selectedAttendee.exitImageCornersClass}`} />
                                            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${selectedAttendee.exitImageCornersClass}`} />
                                            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${selectedAttendee.exitImageCornersClass}`} />
                                          </div>
                                          <span className="absolute bottom-1 left-1 text-[8px] font-mono bg-black/80 px-1 rounded border border-slate-700/50 text-slate-300 z-10">
                                            {outImages[Math.min(outImageIndex, outImages.length - 1)]?.label} ({Math.min(outImageIndex, outImages.length - 1) + 1}/{outImages.length})
                                          </span>
                                          <span className={`absolute bottom-1 right-1 text-[8px] font-mono bg-black/80 px-1 rounded border ${selectedAttendee.exitMatchBadgeClass} z-10`}>
                                            98.6% MATCH
                                          </span>
                                        </>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center text-slate-600">
                                          <Camera size={20} className="text-slate-700 mb-1" />
                                          <span className="text-[9px] text-slate-500 font-medium">Không có dữ liệu ra</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center p-4 text-slate-500 text-center">
                                  <AlertTriangle size={24} className="text-slate-600 mb-1" />
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Chưa chọn nhân sự</span>
                                  <p className="text-[9px] text-slate-500 mt-1 max-w-[180px]">
                                    Vui lòng click chọn nhân sự trong danh sách để xem chi tiết ảnh nhận diện vào/ra.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bottom Status Bar with Pagination & Page size limit switcher */}
                          <div className="h-14 bg-[#14151c] border-t border-[#21232d] px-4 flex items-center justify-between shrink-0">
                            {/* Page size switcher: 20 - 30 - 40 - 50 */}
                            <div className="flex items-center space-x-2 text-xs">
                              <span className="text-slate-400 font-sans">Giới hạn:</span>
                              <div className="flex rounded-lg overflow-hidden border border-[#2d2f3c] bg-[#111218]">
                                {[20, 30, 40, 50].map(limit => (
                                  <button
                                    key={limit}
                                    type="button"
                                    onClick={() => {
                                      setMeetingItemsPerPage(limit);
                                      setMeetingCurrentPage(1);
                                    }}
                                    className={`px-3 py-1 text-xs font-semibold font-mono transition cursor-pointer ${meetingItemsPerPage === limit
                                        ? 'bg-[#00a2e8] text-white'
                                        : 'bg-[#1c1d26] text-slate-300 hover:bg-[#20212a] hover:text-white'
                                      }`}
                                  >
                                    {limit}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Pagination Controls (same design as first tab) */}
                            <div className="flex items-center space-x-1.5 font-mono text-xs">
                              <button
                                type="button"
                                onClick={() => setMeetingCurrentPage(1)}
                                disabled={activeMeetingPage === 1}
                                className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                              >
                                <ChevronsLeft size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setMeetingCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={activeMeetingPage === 1}
                                className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs flex items-center cursor-pointer"
                              >
                                <ChevronLeft size={16} className="mr-0.5" />
                                <span>Trang</span>
                              </button>

                              <div className="bg-[#1b1c25] border border-[#2e303f] px-3 py-1 rounded text-white flex items-center space-x-1 font-semibold font-sans">
                                <input
                                  type="text"
                                  value={activeMeetingPage}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val > 0 && val <= totalMeetingPages) setMeetingCurrentPage(val);
                                  }}
                                  className="w-4 bg-transparent text-center font-mono focus:outline-none text-[#00a2e8]"
                                />
                                <span className="text-slate-500">/</span>
                                <span>{totalMeetingPages}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setMeetingCurrentPage(prev => Math.min(prev + 1, totalMeetingPages))}
                                disabled={activeMeetingPage === totalMeetingPages}
                                className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs flex items-center cursor-pointer"
                              >
                                <span>Trang</span>
                                <ChevronRight size={16} className="ml-0.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setMeetingCurrentPage(totalMeetingPages)}
                                disabled={activeMeetingPage === totalMeetingPages}
                                className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                              >
                                <ChevronsRight size={16} />
                              </button>
                            </div>

                            {/* Total counts info */}
                            <div className="text-xs text-slate-400 font-sans hidden sm:block">
                              Tổng: <span className="font-bold text-slate-100 font-mono">{totalMeetingItems}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
              )}

            {/* Sidebar Filter Overlay (Full-height right drawer) */}
            <AnimatePresence>
              {showFilterModal && (
                <>
                  {/* Dark backdrop overlay to dismiss when clicked outside */}
                  <motion.div
                    key="filter-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black z-40 cursor-pointer"
                    onClick={() => setShowFilterModal(false)}
                  />

                  {/* Scrollable sidebar panel matching image layout */}
                  <motion.div
                    key="filter-sidebar"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'tween', duration: 0.25 }}
                    className="absolute right-0 top-0 bottom-0 w-80 bg-[#16171d] z-50 flex flex-col text-slate-200 shadow-2xl h-full"
                  >
                    {/* Top Header */}
                    <div className="p-4 border-b border-transparent flex items-center justify-between bg-[#111218] shrink-0">
                      <div className="flex items-center space-x-2">
                        <Filter size={16} className="text-[#00a2e8]" />
                        <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">Bộ lọc</span>
                      </div>
                      <button
                        onClick={() => setShowFilterModal(false)}
                        className="p-1 rounded bg-[#20212a] hover:bg-[#2c2d3a] text-slate-400 hover:text-white transition"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Filter inputs body (scrollable) */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">

                      {/* 1. Mã Đối Tượng / Tên (Moved to top) */}
                      <div className="space-y-1 text-left">
                        <label className="text-[11px] text-slate-300 font-semibold block">Mã Đối Tượng / Tên</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Nhập tên hoặc mã..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#181921] border border-[#2d2f3c] rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a2e8]"
                          />
                        </div>
                      </div>

                      {/* 2. Từ Ngày (Time included) */}
                      <div className="space-y-1 text-left">
                        <label className="text-[11px] text-slate-300 font-semibold block">Từ Ngày</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-[#181921] border border-[#2d2f3c] rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#00a2e8] [color-scheme:dark]"
                          />
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full bg-[#181921] border border-[#2d2f3c] rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#00a2e8] [color-scheme:dark]"
                          />
                        </div>
                      </div>

                      {/* 3. Đến Ngày (Time included) */}
                      <div className="space-y-1 text-left">
                        <label className="text-[11px] text-slate-300 font-semibold block">Đến Ngày</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-[#181921] border border-[#2d2f3c] rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#00a2e8] [color-scheme:dark]"
                          />
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full bg-[#181921] border border-[#2d2f3c] rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#00a2e8] [color-scheme:dark]"
                          />
                        </div>
                      </div>

                      {/* 4. Khu Vực */}
                      <div className="space-y-1 text-left relative">
                        <label className="text-[11px] text-slate-300 font-semibold block">Khu Vực</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsOpenZoneDropdown(!isOpenZoneDropdown)}
                            className="w-full bg-[#181921] border border-[#2d2f3c] hover:border-[#00a2e8] rounded px-3 py-2 text-xs text-white text-left flex items-center justify-between transition focus:outline-none"
                          >
                            <span>{filterZone === 'All' ? 'Tất Cả' : filterZone}</span>
                            <ChevronDown size={14} className="text-[#00a2e8]" />
                          </button>

                          <AnimatePresence>
                            {isOpenZoneDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 mt-1 bg-[#181921] border border-[#2d2f3c] rounded shadow-2xl z-50 overflow-hidden"
                              >
                                <div className="p-2 border-b border-[#2d2f3c] flex items-center bg-[#111218]">
                                  <Search size={12} className="text-slate-500 mr-1.5 shrink-0" />
                                  <input
                                    type="text"
                                    placeholder="Tìm nhanh khu vực..."
                                    value={zoneSearch}
                                    onChange={(e) => setZoneSearch(e.target.value)}
                                    className="w-full bg-[#181921] border border-[#2d2f3c] rounded px-2 py-1 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-[#00a2e8]"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                  {["All", ...areasData.map(a => a.name)]
                                    .filter(z => z === 'All' || z.toLowerCase().includes(zoneSearch.toLowerCase()))
                                    .map(zoneOption => (
                                      <button
                                        key={zoneOption}
                                        type="button"
                                        onClick={() => {
                                          setFilterZone(zoneOption);
                                          setIsOpenZoneDropdown(false);
                                          setZoneSearch('');
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[#20212a] ${filterZone === zoneOption ? 'text-[#00a2e8] bg-[#00a2e8]/10 font-medium' : 'text-slate-300'
                                          }`}
                                      >
                                        {zoneOption === 'All' ? 'Tất Cả' : zoneOption}
                                      </button>
                                    ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* 5. Nhóm (Real Database values) */}
                      <div className="space-y-1 text-left relative">
                        <label className="text-[11px] text-slate-300 font-semibold block">Nhóm</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsOpenListDropdown(!isOpenListDropdown)}
                            className="w-full bg-[#181921] border border-[#2d2f3c] hover:border-[#00a2e8] rounded px-3 py-2 text-xs text-white text-left flex items-center justify-between transition focus:outline-none"
                          >
                            <span>{filterList === 'All' ? 'Tất Cả' : (humanGroups.find(g => g.id === filterList)?.name || filterList)}</span>
                            <ChevronDown size={14} className="text-[#00a2e8]" />
                          </button>

                          <AnimatePresence>
                            {isOpenListDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 mt-1 bg-[#181921] border border-[#2d2f3c] rounded shadow-2xl z-50 overflow-hidden"
                              >
                                <div className="max-h-40 overflow-y-auto">
                                  {[
                                    { id: 'All', name: 'Tất Cả' },
                                    ...humanGroups
                                  ].map(listOption => (
                                    <button
                                      key={listOption.id}
                                      type="button"
                                      onClick={() => {
                                        setFilterList(listOption.id);
                                        setIsOpenListDropdown(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[#20212a] ${filterList === listOption.id ? 'text-[#00a2e8] bg-[#00a2e8]/10 font-medium' : 'text-slate-300'
                                        }`}
                                    >
                                      {listOption.name}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* 6. Loại sự kiện (New dropdown option) */}
                      <div className="space-y-1 text-left relative">
                        <label className="text-[11px] text-slate-300 font-semibold block">Loại sự kiện</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsOpenEventTypeDropdown(!isOpenEventTypeDropdown)}
                            className="w-full bg-[#181921] border border-[#2d2f3c] hover:border-[#00a2e8] rounded px-3 py-2 text-xs text-white text-left flex items-center justify-between transition focus:outline-none"
                          >
                            <span>
                              {filterEventType === 'All' ? 'Tất Cả' : filterEventType === 'in' ? 'Đi vào' : 'Đi ra'}
                            </span>
                            <ChevronDown size={14} className="text-[#00a2e8]" />
                          </button>

                          <AnimatePresence>
                            {isOpenEventTypeDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 mt-1 bg-[#181921] border border-[#2d2f3c] rounded shadow-2xl z-50 overflow-hidden"
                              >
                                <div className="max-h-40 overflow-y-auto">
                                  {[
                                    { id: 'All', name: 'Tất Cả' },
                                    { id: 'in', name: 'Đi vào' },
                                    { id: 'out', name: 'Đi ra' }
                                  ].map(opt => (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => {
                                        setFilterEventType(opt.id as any);
                                        setIsOpenEventTypeDropdown(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[#20212a] ${filterEventType === opt.id ? 'text-[#00a2e8] bg-[#00a2e8]/10 font-medium' : 'text-slate-300'
                                        }`}
                                    >
                                      {opt.name}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                    </div>

                    {/* Footer Buttons */}
                    <div className="p-4 border-t border-transparent bg-[#111218] flex items-center justify-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterZone('All');
                          setFilterList('All');
                          setFilterEventType('All');
                          setStartDate('');
                          setEndDate('');
                          setStartTime('');
                          setEndTime('');
                          setFilterTime('');
                          setSearchType('text');
                          setSearchImage(null);
                          setThreshold(0.8);
                          setAppliedSearch('');
                          setAppliedZone('All');
                          setAppliedList('All');
                          setAppliedEventType('All');
                          setAppliedStartDate('');
                          setAppliedEndDate('');
                          setAppliedStartTime('');
                          setAppliedEndTime('');
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1.5 border border-[#2d2f3c] rounded text-xs text-slate-400 hover:text-white hover:bg-[#20212a] transition font-medium"
                      >
                        Xóa bộ lọc
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedSearch(searchQuery);
                          setAppliedZone(filterZone);
                          setAppliedList(filterList);
                          setAppliedEventType(filterEventType);
                          setAppliedStartDate(startDate);
                          setAppliedEndDate(endDate);
                          setAppliedStartTime(startTime);
                          setAppliedEndTime(endTime);
                          setCurrentPage(1);
                          setShowFilterModal(false);
                        }}
                        className="bg-[#008bc8] hover:bg-[#007cb3] text-white font-semibold text-xs py-1.5 px-6 rounded transition-all duration-200 shadow-md"
                      >
                        Tìm Kiếm
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          );
};
