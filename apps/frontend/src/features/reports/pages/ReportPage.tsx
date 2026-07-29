import { useState, useEffect, useCallback, useMemo, useRef, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  List,
  TrendingUp,
  RotateCw,
  Filter,
  Camera,
  FolderOpen,
  Settings,
  BarChart3,
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
  Loader2,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Users,
  CalendarClock,
  Save,
  Info,
  Video,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import * as XLSX from 'xlsx-js-style';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import html2canvas from 'html2canvas';
import { useApp } from '../../../context/AppContext';
import { getBackendUrl } from '../../../utils/config';
import { EventLog } from '../../../types';

const resolveImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const baseUrl = getBackendUrl();
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
  if (!seed || typeof seed !== 'string') {
    seed = '1';
  }
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

const AttendanceEventImageSlider = ({ event, emp, title }: { event: any; emp?: any; title: string }) => {
  const [slideIndex, setSlideIndex] = useState(0);

  const slides = useMemo(() => {
    const faceCamImg = event?.face_image_path
      ? resolveImageUrl(event.face_image_path)
      : (event?.faceImgBase64 || event?.cropped_face_images?.[0] || '');

    const fullCamImg = event?.full_image_path
      ? resolveImageUrl(event.full_image_path)
      : '';

    const profileImg = emp?.originalObject?.anhDaiDien?.url
      ? emp.originalObject.anhDaiDien.url
      : (emp?.avatarSeed ? getMeetingPhoto(emp.avatarSeed, emp.ma === "010203045567", 'in') : '');

    return [
      { label: 'Khuôn mặt camera', src: faceCamImg, tag: 'FACE CAM' },
      { label: 'Toàn cảnh camera', src: fullCamImg, tag: 'FULL CAM' },
      { label: 'Hồ sơ đăng ký', src: profileImg, tag: 'HỒ SƠ' },
    ];
  }, [event, emp]);

  const activeSlide = slides[slideIndex] || slides[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <span className="text-[9px] font-mono text-[#00a2e8] bg-[#00a2e8]/10 px-1.5 py-0.5 rounded border border-[#00a2e8]/20 font-bold">
          {slideIndex + 1}/3 • {activeSlide.label}
        </span>
      </div>
      <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-[#2d2f3c] bg-[#0d0e12] flex items-center justify-center shadow-inner group">
        {activeSlide.src ? (
          <>
            <img
              src={activeSlide.src}
              alt={activeSlide.label}
              className="w-full h-full object-cover"
            />
            {slideIndex === 0 && (
              <div className="absolute inset-2 border border-emerald-500/30 rounded pointer-events-none">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-400" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-400" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-400" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-emerald-400" />
              </div>
            )}
            <span className="absolute bottom-1 left-1 text-[8px] font-mono bg-black/80 px-1.5 py-0.5 rounded border border-slate-700/50 text-emerald-400 font-bold">
              {activeSlide.tag}
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500 p-2 text-center">
            <CameraOff size={24} className="text-slate-600" />
            <span className="text-[10px] font-mono">Không có {activeSlide.label.toLowerCase()}</span>
          </div>
        )}

        {/* Slider Controls */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 hover:bg-black/90 text-white opacity-70 hover:opacity-100 transition z-10"
          title="Ảnh trước"
        >
          <ChevronLeft size={13} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 hover:bg-black/90 text-white opacity-70 hover:opacity-100 transition z-10"
          title="Ảnh tiếp"
        >
          <ChevronRight size={13} />
        </button>

        {/* Slide Indicator Dots */}
        <div className="absolute bottom-1 right-1 flex space-x-1 bg-black/70 px-1.5 py-0.5 rounded-full z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => { e.stopPropagation(); setSlideIndex(idx); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${idx === slideIndex ? 'bg-[#00a2e8] w-3' : 'bg-slate-500 hover:bg-slate-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const handleDownloadEventImages = async (event: any) => {
  if (!event) return;

  const imagePaths: string[] = [
    event.full_image_path,
    event.face_image_path,
  ].filter(Boolean);

  const imagesToDownload: { url: string; filename: string }[] = [];

  for (let i = 0; i < imagePaths.length; i++) {
    const rawPath = imagePaths[i];
    const url = resolveImageUrl(rawPath);
    if (url) {
      const filename = rawPath.split(/[/\\]/).pop() || `event_${event.id || event.stt || Date.now()}_${i + 1}.jpg`;
      imagesToDownload.push({ url, filename });
    }
  }

  if (imagesToDownload.length === 0) {
    const fallbackUrl = event.faceImgBase64 || getMeetingPhoto(event.avatarSeed, event.ma === "010203045567", 'in');
    if (fallbackUrl) {
      imagesToDownload.push({
        url: fallbackUrl,
        filename: `event_${event.id || event.stt || Date.now()}.jpg`
      });
    }
  }

  if (imagesToDownload.length === 0) {
    alert("Không tìm thấy tệp ảnh độ phân giải gốc cho sự kiện này.");
    return;
  }

  for (const item of imagesToDownload) {
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = item.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Lỗi khi tải ảnh từ server:", error);
      const link = document.createElement('a');
      link.href = item.url;
      link.download = item.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

export const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [appliedList, setAppliedList] = useState('All');
  const [appliedLists, setAppliedLists] = useState<string[]>([]);
  const [appliedEventType, setAppliedEventType] = useState<'All' | 'in' | 'out'>('All');
  const [filterZone, setFilterZone] = useState('All');
  const [filterZones, setFilterZones] = useState<string[]>([]);
  const [appliedZones, setAppliedZones] = useState<string[]>([]);
  const [filterCameras, setFilterCameras] = useState<string[]>([]);
  const [appliedCameras, setAppliedCameras] = useState<string[]>([]);
  const [isOpenCameraDropdown, setIsOpenCameraDropdown] = useState(false);
  const [filterList, setFilterList] = useState('All');
  const [filterLists, setFilterLists] = useState<string[]>([]);

  // Automatically reset selected cameras to All whenever zone selection is unselectable (0 or All zones)
  useEffect(() => {
    if (filterZones.length === 0 || filterZones.length === areasData.length) {
      setFilterCameras([]);
    }
  }, [filterZones, areasData.length]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [filterTime, setFilterTime] = useState('');
  const [searchType, setSearchType] = useState<'text' | 'image'>('text');
  const [searchImage, setSearchImage] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(0.8);
  const [isOpenSearchTypeDropdown, setIsOpenSearchTypeDropdown] = useState(false);
  const [isOpenEventTypeDropdown, setIsOpenEventTypeDropdown] = useState(false);
  const [isOpenZoneDropdown, setIsOpenZoneDropdown] = useState(false);
  const [isOpenListDropdown, setIsOpenListDropdown] = useState(false);
  const [zoneSearch, setZoneSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const [isEventExportOpen, setIsEventExportOpen] = useState(false);
  const [isMeetingExportOpen, setIsMeetingExportOpen] = useState(false);
  const [pdfExportRoster, setPdfExportRoster] = useState<any[]>([]);
  const [pdfAttendanceRoster, setPdfAttendanceRoster] = useState<any[]>([]);
  const [isAttendancePdfExporting, setIsAttendancePdfExporting] = useState(false);
  const [attendanceCurrentPage, setAttendanceCurrentPage] = useState(1);
  const [attendanceItemsPerPage, setAttendanceItemsPerPage] = useState(20);
  const [isAttendancePerPageOpen, setIsAttendancePerPageOpen] = useState(false);
  const PER_PAGE_OPTIONS = [10, 20, 40, 50, 100];
  const [showAttendanceReportDemo, setShowAttendanceReportDemo] = useState(true);

  // Server-side paginated data
  const [pageLogs, setPageLogs] = useState<EventLog[]>([]);
  const [totalServerItems, setTotalServerItems] = useState(0);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // Helper to resolve camera name from areasData context if backend returns a raw UUID
  const resolveCameraName = useCallback((log: EventLog | any) => {
    const rawCamName = log?.camera_name;
    const isUUID = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    const camId = log?.camera_id || (isUUID(rawCamName) ? rawCamName : null);
    if (camId && areasData && areasData.length > 0) {
      for (const area of areasData) {
        const foundCam = area.cameras?.find(c => c.camera_id === camId);
        if (foundCam && foundCam.camera_name && foundCam.camera_name !== 'Unknown') {
          return foundCam.camera_name;
        }
      }
    }
    if (rawCamName && !isUUID(rawCamName)) {
      return rawCamName;
    }
    return log?.camera_id || rawCamName || 'Camera 01';
  }, [areasData]);

  // Applied filters (committed on search button click)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedZone, setAppliedZone] = useState('All');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [appliedStartTime, setAppliedStartTime] = useState('');
  const [appliedEndTime, setAppliedEndTime] = useState('');

  // Sorting states for Attendance Report Table
  const [attSortKey, setAttSortKey] = useState<string>('');
  const [attSortDir, setAttSortDir] = useState<'asc' | 'desc' | null>(null);

  const handleAttSort = (key: string) => {
    if (attSortKey !== key) {
      setAttSortKey(key);
      setAttSortDir('asc');
    } else if (attSortDir === 'asc') {
      setAttSortDir('desc');
    } else {
      setAttSortKey('');
      setAttSortDir(null);
    }
    setAttendanceCurrentPage(1);
  };

  const buildEventLogsUrl = useCallback((extra: Record<string, string> = {}) => {
    const baseUrl = getBackendUrl();
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(itemsPerPage),
      ...(appliedSearch ? { search: appliedSearch } : {}),
      ...(appliedZones.length > 0 ? { zones: appliedZones.join(',') } : (appliedZone && appliedZone !== 'All' ? { zone: appliedZone } : {})),
      ...(appliedCameras.length > 0 ? { cameras: appliedCameras.join(',') } : {}),
      ...(appliedStartDate ? { startDate: appliedStartDate } : {}),
      ...(appliedEndDate ? { endDate: appliedEndDate } : {}),
      ...(appliedStartTime ? { startTime: appliedStartTime } : {}),
      ...(appliedEndTime ? { endTime: appliedEndTime } : {}),
      ...(appliedLists.length > 0 ? { groups: appliedLists.join(',') } : (appliedList && appliedList !== 'All' ? { group: appliedList } : {})),
      ...(appliedEventType && appliedEventType !== 'All' ? { eventType: appliedEventType } : {}),
      ...extra,
    });
    return { baseUrl, params };
  }, [currentPage, itemsPerPage, appliedSearch, appliedZones, appliedZone, appliedCameras, appliedStartDate, appliedEndDate, appliedStartTime, appliedEndTime, appliedLists, appliedList, appliedEventType]);

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

  // Sorting states for Event Logs Table
  const [eventSortKey, setEventSortKey] = useState<string>('');
  const [eventSortDir, setEventSortDir] = useState<'asc' | 'desc' | null>(null);

  const handleEventSort = (key: string) => {
    if (eventSortKey !== key) {
      setEventSortKey(key);
      setEventSortDir('asc');
    } else if (eventSortDir === 'asc') {
      setEventSortDir('desc');
    } else {
      setEventSortKey('');
      setEventSortDir(null);
    }
    setCurrentPage(1);
  };

  const currentLogs = useMemo(() => {
    if (!eventSortKey || !eventSortDir) return pageLogs;
    return [...pageLogs].sort((a: any, b: any) => {
      let valA = a[eventSortKey];
      let valB = b[eventSortKey];
      if (eventSortKey === 'camera') {
        valA = resolveCameraName(a);
        valB = resolveCameraName(b);
      } else if (eventSortKey === 'huong') {
        const areaSuffixA = getAreaSuffix(a);
        valA = areaSuffixA === 'ra' ? 'Đi ra' : areaSuffixA === 'vào' ? 'Đi vào' : (a.huong && a.huong.toLowerCase().includes('ra') ? 'Đi ra' : 'Đi vào');
        const areaSuffixB = getAreaSuffix(b);
        valB = areaSuffixB === 'ra' ? 'Đi ra' : areaSuffixB === 'vào' ? 'Đi vào' : (b.huong && b.huong.toLowerCase().includes('ra') ? 'Đi ra' : 'Đi vào');
      }
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return eventSortDir === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return eventSortDir === 'asc'
        ? strA.localeCompare(strB, 'vi')
        : strB.localeCompare(strA, 'vi');
    });
  }, [pageLogs, eventSortKey, eventSortDir, getAreaSuffix, resolveCameraName]);

  const filteredLogs = currentLogs;
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
  const [meetingGroups, setMeetingGroups] = useState<string[]>(['Phòng ban A', 'Phòng ban B', 'Phòng ban C', 'Phòng ban D', 'Khách hàng / Khác']);
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
  const [isMeetingMultiSelectMode, setIsMeetingMultiSelectMode] = useState<boolean>(false);
  const [selectedMeetingReportIds, setSelectedMeetingReportIds] = useState<any[]>([]);

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
  const [appliedMeetingStartTime, setAppliedMeetingStartTime] = useState<string>('00:00');
  const [appliedMeetingEndTime, setAppliedMeetingEndTime] = useState<string>('23:59');

  const [meetingSubTab, setMeetingSubTab] = useState<'meetings' | 'employees'>('meetings');
  const [allMeetingsAttendance, setAllMeetingsAttendance] = useState<Record<string, any>>({});
  const [isLoadingAllMeetingsAttendance, setIsLoadingAllMeetingsAttendance] = useState(false);
  const [selectedEmpStats, setSelectedEmpStats] = useState<any | null>(null);
  const [selectedEmpMeetingDetail, setSelectedEmpMeetingDetail] = useState<any | null>(null);
  // Multiselect (nhấn giữ) cho danh sách "Báo cáo theo nhân viên" - tương tự Danh sách cuộc họp
  const [isEmpMultiSelectMode, setIsEmpMultiSelectMode] = useState<boolean>(false);
  const [selectedEmpReportIds, setSelectedEmpReportIds] = useState<any[]>([]);

  const filteredMeetingsMemo = useMemo(() => {
    const getMeetingTimestamp = (dateStr: string, timeStr: string) => {
      return new Date(`${dateStr}T${timeStr || '00:00'}`).getTime();
    };
    return schMeetingSavedData.filter((meet: any) => {
      const meetStart = getMeetingTimestamp(meet.date, meet.startTime);
      const meetEnd = getMeetingTimestamp(meet.date, meet.endTime);
      const filterStart = getMeetingTimestamp(appliedMeetingStartDate, appliedMeetingStartTime);
      const filterEnd = getMeetingTimestamp(appliedMeetingEndDate, appliedMeetingEndTime);

      const isInTimeRange = meetStart >= filterStart && meetEnd <= filterEnd;
      const isInArea = appliedMeetingAreas.includes(meet.area);
      return isInTimeRange && isInArea;
    });
  }, [schMeetingSavedData, appliedMeetingStartDate, appliedMeetingStartTime, appliedMeetingEndDate, appliedMeetingEndTime, appliedMeetingAreas]);

  // Stable string key – chỉ thay đổi khi danh sách ID cuộc họp thực sự thay đổi.
  // Dùng làm dependency cho useEffect để tránh loop vô hạn khi array object reference thay đổi.
  const filteredMeetingIdsKey = useMemo(
    () => filteredMeetingsMemo.map((m: any) => m.id).join(','),
    [filteredMeetingsMemo]
  );

  useEffect(() => {
    if (meetingSubTab === 'employees' && filteredMeetingsMemo.length > 0) {
      const fetchAll = async () => {
        setIsLoadingAllMeetingsAttendance(true);
        try {
          const baseUrl = getBackendUrl();
          const results: Record<string, any> = {};
          await Promise.all(filteredMeetingsMemo.map(async (meet: any) => {
            try {
              const res = await fetch(`${baseUrl}/meeting/${meet.id}/attendance-report`);
              if (res.ok) {
                results[meet.id] = await res.json();
              }
            } catch (err) {
              console.error('Failed to fetch attendance for meeting', meet.id, err);
            }
          }));
          setAllMeetingsAttendance(results);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingAllMeetingsAttendance(false);
        }
      };
      fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingSubTab, filteredMeetingIdsKey]);

  const employeeMeetingStats = useMemo(() => {
    if (filteredMeetingsMemo.length === 0) return [];

    const timeStringToSeconds = (tStr: string): number => {
      if (!tStr) return 0;
      const parts = tStr.split(':').map(Number);
      const h = parts[0] || 0;
      const m = parts[1] || 0;
      const s = parts[2] || 0;
      return h * 3600 + m * 60 + s;
    };

    return employees.map(emp => {
      let requiredCount = 0;
      let presentOnTimeCount = 0;
      let lateCount = 0;
      let earlyCount = 0;
      const details: any[] = [];

      filteredMeetingsMemo.forEach(meet => {
        const inlineMapDep = (dep: string): string => {
          if (dep === 'nhóm nhân viên 1' || dep === 'Phòng ban 1') return 'Phòng ban A';
          if (dep === 'nhóm nhân viên 2' || dep === 'Phòng ban 2') return 'Phòng ban B';
          if (dep === 'Nhóm nhân viên C' || dep === 'Phòng ban C') return 'Phòng ban C';
          if (dep === 'Nhóm nhân viên D' || dep === 'Phòng nhân sự' || dep === 'Phòng ban D') return 'Phòng ban D';
          return dep;
        };
        const mappedGroups = (meet.departments || []).map(inlineMapDep);
        const isRequired = emp.human_group.some((g: string) => mappedGroups.includes(g));

        if (isRequired) {
          requiredCount++;

          const meetData = allMeetingsAttendance[meet.id];
          let thoiGianVao: string | undefined = undefined;
          let thoiGianRa: string | undefined = undefined;
          let entryEvent: any = null;
          let exitEvent: any = null;

          if (meetData && meetData.attendance) {
            const match = meetData.attendance.find((item: any) => item.employeeId === emp.id);
            if (match) {
              thoiGianVao = match.thoiGianVao || undefined;
              thoiGianRa = match.thoiGianRa || undefined;
              entryEvent = match.entryEvent || null;
              exitEvent = match.exitEvent || null;
            }
          }

          details.push({
            meetingId: meet.id,
            title: meet.title,
            date: meet.date,
            startTime: meet.startTime,
            endTime: meet.endTime,
            thoiGianVao,
            thoiGianRa,
            entryEvent,
            exitEvent,
          });

          if (thoiGianVao) {
            const inSec = timeStringToSeconds(thoiGianVao);
            const startSec = timeStringToSeconds(meet.startTime);
            if (inSec <= startSec) {
              presentOnTimeCount++;
            } else {
              lateCount++;
            }
          }
          if (thoiGianRa) {
            const outSec = timeStringToSeconds(thoiGianRa);
            const endSec = timeStringToSeconds(meet.endTime);
            if (outSec < endSec) {
              earlyCount++;
            }
          }
        }
      });

      return {
        emp,
        requiredCount,
        presentOnTimeCount,
        lateCount,
        earlyCount,
        details,
      };
    }).filter(item => {
      if (meetingSearchQuery) {
        return item.emp.hoTen.toLowerCase().includes(meetingSearchQuery.toLowerCase()) ||
          item.emp.maGiayTo.includes(meetingSearchQuery);
      }
      return item.requiredCount > 0;
    });
  }, [employees, filteredMeetingsMemo, allMeetingsAttendance, meetingSearchQuery]);

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
        const windowStartSec = Math.max(0, meetingStartSec - 1800);
        const windowEndSec = Math.min(86400, meetingEndSec + 1800);

        const empLogs = eventLogs.filter(log => {
          if (log.ma !== emp.maGiayTo) return false;
          if (!log.thoiGian) return false;
          const [datePart, timePart] = log.thoiGian.split('-');
          if (!datePart || !timePart) return false;
          const [day, month, year] = datePart.split('/');
          const logDateStr = `${year}-${month}-${day}`;
          if (logDateStr !== meetingDate) return false;

          const logSec = timeStringToSeconds(timePart);
          return logSec >= windowStartSec && logSec <= windowEndSec;
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

        const isLate = inSec > meetingStartSec;
        const isEarly = outSec < meetingEndSec;

        if (!isLate && !isEarly) {
          evaluationText = "Hoàn thành tốt";
          evaluationType = 'good';
        } else if (isLate && isEarly) {
          evaluationText = "Đi muộn & Rời sớm";
          evaluationType = 'early';
        } else if (isLate) {
          evaluationText = "Đi muộn";
          evaluationType = 'early';
        } else {
          evaluationText = "Rời phòng sớm";
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

  const currentMeetingRoster = useMemo(() => {
    if (!computedAttendeeRoster || computedAttendeeRoster.length === 0) return [];
    const totalMeetingItems = computedAttendeeRoster.length;
    const totalMeetingPages = Math.ceil(totalMeetingItems / meetingItemsPerPage) || 1;
    const activeMeetingPage = Math.min(meetingCurrentPage, totalMeetingPages);
    const indexLastMeetingItem = activeMeetingPage * meetingItemsPerPage;
    const indexFirstMeetingItem = indexLastMeetingItem - meetingItemsPerPage;
    return computedAttendeeRoster.slice(indexFirstMeetingItem, indexLastMeetingItem);
  }, [computedAttendeeRoster, meetingCurrentPage, meetingItemsPerPage]);

  const averageAttendancePercentage = useMemo(() => {
    if (!computedAttendeeRoster || computedAttendeeRoster.length === 0) return 100;
    const totalRatioSum = computedAttendeeRoster.reduce((sum, item) => sum + item.ratioPercent, 0);
    return Math.round(totalRatioSum / computedAttendeeRoster.length);
  }, [computedAttendeeRoster]);

  const [inImageIndex, setInImageIndex] = useState(0);
  const [outImageIndex, setOutImageIndex] = useState(0);

  // Reset tabs and details when navigating via the left sidebar (even on the same route)
  useEffect(() => {
    setActiveTab('list');
    setIsMeetingSearched(false);
    setSelectedMeetingReport(null);
  }, [location.key]);

  const [prevAreasKey, setPrevAreasKey] = useState('');
  useEffect(() => {
    if (areasData && areasData.length > 0) {
      const areaNames = areasData.map(a => a.name).filter(name => name !== 'Checkin Area' && name !== 'Checkout Area');
      const currentAreasKey = areasData.map(a => a.id).join(',');

      if (currentAreasKey !== prevAreasKey) {
        setSelectedMeetingAreas(areaNames);
        setAppliedMeetingAreas(areaNames);
        setPrevAreasKey(currentAreasKey);
      }
    }
  }, [areasData, prevAreasKey]);

  // Attendance Report states
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [attendanceType, setAttendanceType] = useState<string>('Báo cáo theo ngày');
  const [attendanceStartDate, setAttendanceStartDate] = useState<string>(getTodayStr);
  const [attendanceEndDate, setAttendanceEndDate] = useState<string>(getTodayStr);
  const [attendanceGroup, setAttendanceGroup] = useState<string>('All');
  const [attendanceGroups, setAttendanceGroups] = useState<string[]>([]);
  const [isAttTypeOpen, setIsAttTypeOpen] = useState<boolean>(false);
  const [isAttGroupOpen, setIsAttGroupOpen] = useState<boolean>(false);
  const [isAttExportOpen, setIsAttExportOpen] = useState<boolean>(false);

  // Custom Shift & Grace time states for Daily Attendance Report
  const [isExpandShiftOpen, setIsExpandShiftOpen] = useState<boolean>(false);
  const [customShiftStart, setCustomShiftStart] = useState<string>('07:30');
  const [customShiftEnd, setCustomShiftEnd] = useState<string>('17:00');
  const [customBufferHours, setCustomBufferHours] = useState<number>(2);
  const [attendanceExportFormat, setAttendanceExportFormat] = useState<'XLSX' | 'PDF'>('XLSX');
  const [exportedFileName, setExportedFileName] = useState<string>('ThongKeSuKien_DVMS.xlsx');
  const [selectedAttendanceEmpCode, setSelectedAttendanceEmpCode] = useState<string | null>(null);
  const longPressTimerRef = useRef<any>(null);

  // Helper functions for week date conversion
  const getMondayOfWeek = useCallback((year: number, weekNum: number): string => {
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
  }, []);

  const getSundayOfWeek = useCallback((mondayStr: string): string => {
    const d = new Date(mondayStr);
    d.setDate(d.getDate() + 6);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [attendanceWeekNumber, setAttendanceWeekNumber] = useState<number>(() => {
    const d = new Date('2026-07-09');
    const dayNum = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  });
  const [attendanceYear, setAttendanceYear] = useState<number>(2026);
  const [attendanceMonthNumber, setAttendanceMonthNumber] = useState<number>(7); // defaults to July (Tháng 7)

  // Attendance Area filters
  const [selectedAttendanceAreas, setSelectedAttendanceAreas] = useState<string[]>([]);
  const [isAttendanceAreaDropdownOpen, setIsAttendanceAreaDropdownOpen] = useState<boolean>(false);
  const [prevAttendanceAreasKey, setPrevAttendanceAreasKey] = useState('');

  // Sync selectedAttendanceAreas
  useEffect(() => {
    if (areasData && areasData.length > 0) {
      const allAreaNames = areasData.map(a => a.name);
      const currentAreasKey = areasData.map(a => a.id).join(',');

      if (currentAreasKey !== prevAttendanceAreasKey) {
        setSelectedAttendanceAreas(allAreaNames);
        setPrevAttendanceAreasKey(currentAreasKey);
      }
    }
  }, [areasData, prevAttendanceAreasKey]);

  // Helper to extract time only (HH:mm:ss or HH:mm) from datetime string
  const formatTimeOnly = useCallback((timeStr: string): string => {
    if (!timeStr || timeStr === 'Trống' || timeStr === 'Không có dữ liệu') return timeStr;
    const timeMatch = timeStr.match(/\b([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?\b/);
    return timeMatch ? timeMatch[0] : timeStr;
  }, []);

  // Dynamic Work Hours calculation helper
  const calculateWorkHours = useCallback((checkInStr: string, checkOutStr: string): string => {
    if (!checkInStr || checkInStr === 'Trống' || checkInStr === 'Không có dữ liệu' || !checkOutStr || checkOutStr === 'Trống' || checkOutStr === 'Không có dữ liệu') return '0 h';

    const cleanInStr = checkInStr.trim().split(' ')[0];
    const cleanOutStr = checkOutStr.trim().split(' ')[0];

    const [inH, inM, inS] = cleanInStr.split(':').map(Number);
    const [outH, outM, outS] = cleanOutStr.split(':').map(Number);

    const inSeconds = inH * 3600 + inM * 60 + (inS || 0);
    const outSeconds = outH * 3600 + outM * 60 + (outS || 0);

    if (outSeconds <= inSeconds) return '0 h';

    let diffSeconds = outSeconds - inSeconds;

    // Subtract 1h30m (5400 seconds) for lunch break
    diffSeconds = Math.max(0, diffSeconds - 5400);

    let hours = diffSeconds / 3600;

    if (hours > 8) {
      hours = 8;
    }

    return `${Math.round(hours * 100) / 100} h`;
  }, []);

  // Attendance Priority Rank helper (1: Both IN & OUT, 2: 1 of IN/OUT, 3: Neither)
  const getAttendancePriorityRank = useCallback((thoiGianVao?: string, thoiGianRa?: string) => {
    const hasIn = thoiGianVao && thoiGianVao !== 'Trống' && thoiGianVao !== 'Không có dữ liệu';
    const hasOut = thoiGianRa && thoiGianRa !== 'Trống' && thoiGianRa !== 'Không có dữ liệu';

    if (hasIn && hasOut) return 1;
    if (hasIn || hasOut) return 2;
    return 3;
  }, []);

  // Dynamic Attendance Status Badge helper
  const getAttendanceStatusBadge = useCallback((thoiGianVao?: string, thoiGianRa?: string, shiftStart = '07:30', shiftEnd = '17:00') => {
    const hasIn = thoiGianVao && thoiGianVao !== 'Trống' && thoiGianVao !== 'Không có dữ liệu';
    const hasOut = thoiGianRa && thoiGianRa !== 'Trống' && thoiGianRa !== 'Không có dữ liệu';

    if (!hasIn && !hasOut) {
      return { text: 'Vắng mặt', style: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
    if (hasIn && !hasOut) {
      return { text: 'Thiếu Check-out', style: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
    }
    if (!hasIn && hasOut) {
      return { text: 'Thiếu Check-in', style: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
    }

    const cleanInStr = thoiGianVao!.trim().split(' ')[0];
    const cleanOutStr = thoiGianRa!.trim().split(' ')[0];

    const [inH, inM] = cleanInStr.split(':').map(Number);
    const [outH, outM] = cleanOutStr.split(':').map(Number);
    const [sH, sM] = shiftStart.split(':').map(Number);
    const [eH, eM] = shiftEnd.split(':').map(Number);

    const inMin = inH * 60 + (inM || 0);
    const outMin = outH * 60 + (outM || 0);
    const startMin = sH * 60 + (sM || 0);
    const endMin = eH * 60 + (eM || 0);

    const isLate = inMin > startMin;
    const isEarly = outMin < endMin;

    if (isLate && isEarly) {
      const lateM = inMin - startMin;
      const earlyM = endMin - outMin;
      return { text: `Muộn ${lateM}p & Sớm ${earlyM}p`, style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
    }
    if (isLate) {
      const lateM = inMin - startMin;
      return { text: `Đi muộn (${lateM}p)`, style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    }
    if (isEarly) {
      const earlyM = endMin - outMin;
      return { text: `Về sớm (${earlyM}p)`, style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    }

    return { text: 'Đúng giờ', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  }, []);

  const computeRangeStats = useCallback((empItem: any) => {
    let good = 0;
    let late = 0;
    let early = 0;
    let absent = 0;

    const logs = empItem.dailyLogs || empItem.logs || [];
    if (Array.isArray(logs) && logs.length > 0) {
      logs.forEach((log: any) => {
        const inStr = log.thoiGianVao || log.checkIn;
        const outStr = log.thoiGianRa || log.checkOut;
        const hasIn = inStr && inStr !== 'Trống' && inStr !== 'Không có dữ liệu';
        const hasOut = outStr && outStr !== 'Trống' && outStr !== 'Không có dữ liệu';

        if (!hasIn && !hasOut) {
          absent++;
        } else {
          const evalRes = getAttendanceStatusBadge(hasIn ? inStr : undefined, hasOut ? outStr : undefined, customShiftStart, customShiftEnd);
          if (evalRes.text === 'Đúng giờ') {
            good++;
          } else {
            if (evalRes.text.toLowerCase().includes('muộn')) late++;
            if (evalRes.text.toLowerCase().includes('sớm')) early++;
            if (evalRes.text.toLowerCase().includes('vắng') || evalRes.text.toLowerCase().includes('thiếu')) absent++;
          }
        }
      });
    } else {
      const d1 = new Date(attendanceStartDate);
      const d2 = new Date(attendanceEndDate);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 || 7;

      good = empItem.countGood ?? 0;
      late = empItem.countLate ?? 0;
      early = empItem.countEarly ?? 0;
      absent = empItem.countAbsent ?? daysCount;
    }

    return { good, late, early, absent };
  }, [getAttendanceStatusBadge, customShiftStart, customShiftEnd, attendanceStartDate, attendanceEndDate]);

  // Sync attendance dates when week/month/year changes
  useEffect(() => {
    if (attendanceType === 'Báo cáo theo tuần') {
      const monday = getMondayOfWeek(attendanceYear, attendanceWeekNumber);
      const sunday = getSundayOfWeek(monday);
      setAttendanceStartDate(monday);
      setAttendanceEndDate(sunday);
    } else if (attendanceType === 'Báo cáo theo tháng') {
      const mm = String(attendanceMonthNumber).padStart(2, '0');
      const start = `${attendanceYear}-${mm}-01`;
      const daysInMonth = new Date(attendanceYear, attendanceMonthNumber, 0).getDate();
      const end = `${attendanceYear}-${mm}-${String(daysInMonth).padStart(2, '0')}`;
      setAttendanceStartDate(start);
      setAttendanceEndDate(end);
    }
  }, [attendanceWeekNumber, attendanceYear, attendanceMonthNumber, attendanceType, getMondayOfWeek, getSundayOfWeek]);

  // Daily Attendance DB Query states & effect
  const [dailyReportData, setDailyReportData] = useState<any[]>([]);
  const [isDailyReportLoading, setIsDailyReportLoading] = useState<boolean>(false);

  useEffect(() => {
    if (attendanceType !== 'Báo cáo theo ngày') return;
    let isCancelled = false;
    const fetchDailyReport = async () => {
      setIsDailyReportLoading(true);
      try {
        const baseUrl = getBackendUrl();
        const areasParam = encodeURIComponent(selectedAttendanceAreas.join(','));
        const res = await fetch(
          `${baseUrl}/meeting/attendance/daily-report?date=${attendanceStartDate}&areas=${areasParam}&groupId=${attendanceGroup}&shiftStart=${encodeURIComponent(customShiftStart)}&shiftEnd=${encodeURIComponent(customShiftEnd)}&bufferHours=${customBufferHours}`
        );
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setDailyReportData(data.attendance || []);
        }
      } catch (err) {
        console.error('Failed to fetch daily attendance report:', err);
      } finally {
        if (!isCancelled) setIsDailyReportLoading(false);
      }
    };
    fetchDailyReport();
    return () => { isCancelled = true; };
  }, [attendanceStartDate, selectedAttendanceAreas, attendanceGroup, attendanceType, customShiftStart, customShiftEnd, customBufferHours]);

  // Range (Weekly/Monthly) Attendance DB Query states & effect
  const [rangeReportData, setRangeReportData] = useState<any[]>([]);
  const [isRangeReportLoading, setIsRangeReportLoading] = useState<boolean>(false);

  useEffect(() => {
    const isRange = attendanceType === 'Báo cáo theo tuần' || attendanceType === 'Báo cáo theo tháng';
    if (!isRange) return;
    if (!attendanceStartDate || !attendanceEndDate) return;
    let isCancelled = false;
    const fetchRangeReport = async () => {
      setIsRangeReportLoading(true);
      try {
        const baseUrl = getBackendUrl();
        const areasParam = encodeURIComponent(selectedAttendanceAreas.join(','));
        const res = await fetch(
          `${baseUrl}/meeting/attendance/range-report?startDate=${attendanceStartDate}&endDate=${attendanceEndDate}&areas=${areasParam}&groupId=${attendanceGroup}`
        );
        if (res.ok && !isCancelled) {
          const data = await res.json();
          setRangeReportData(data.attendance || []);
        }
      } catch (err) {
        console.error('Failed to fetch range attendance report:', err);
      } finally {
        if (!isCancelled) setIsRangeReportLoading(false);
      }
    };
    fetchRangeReport();
    return () => { isCancelled = true; };
  }, [attendanceStartDate, attendanceEndDate, selectedAttendanceAreas, attendanceGroup, attendanceType]);

  // Weekly/Monthly Attendance Sub-view states
  const [selectedWeeklyAttendee, setSelectedWeeklyAttendee] = useState<any | null>(null);
  const [selectedDetailDayStr, setSelectedDetailDayStr] = useState<string>('');

  // Reset selectedWeeklyAttendee when switching report type
  useEffect(() => {
    setSelectedWeeklyAttendee(null);
  }, [attendanceType]);

  const generateWeeklyLogs = useCallback((empCode: string, mondayStr: string, isMock = true) => {
    const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    const baseDate = new Date(mondayStr);
    const isPhuc = empCode === "080203011585";
    const isLoi = empCode === "010203045567";

    return daysOfWeek.map((dayName, index) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + index);
      const dateStr = d.toISOString().split('T')[0];

      const isWeekend = index === 5 || index === 6;
      if (isWeekend || !isMock) {
        return {
          dayName,
          dateStr,
          checkIn: 'Không có dữ liệu',
          checkOut: 'Không có dữ liệu',
          totalHours: '0 h'
        };
      }

      let checkIn = '07:55:04';
      let checkOut = '17:30:12';

      if (isPhuc) {
        if (index === 0) {
          checkIn = '08:02:11';
          checkOut = '17:35:45';
        } else if (index === 2) {
          checkIn = '08:15:32';
          checkOut = '17:30:00';
        } else if (index === 3) {
          checkIn = '08:00:15';
          checkOut = '19:30:15';
        } else {
          checkIn = '07:58:12';
          checkOut = '17:31:00';
        }
      } else if (isLoi) {
        if (index === 1) {
          checkIn = '07:52:10';
          checkOut = '18:45:00';
        } else {
          checkIn = '07:55:04';
          checkOut = '17:30:12';
        }
      }

      return {
        dayName,
        dateStr,
        checkIn,
        checkOut,
        totalHours: calculateWorkHours(checkIn, checkOut)
      };
    });
  }, [calculateWorkHours]);

  const generateMonthlyLogs = useCallback((empCode: string, monthNum: number, yearNum: number, isMock = true) => {
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const daysOfWeekNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const isPhuc = empCode === "080203011585";
    const isLoi = empCode === "010203045567";

    const logs = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(yearNum, monthNum - 1, day);
      const dayOfWeekIndex = d.getDay();
      const dayName = daysOfWeekNames[dayOfWeekIndex];
      const mm = String(monthNum).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${yearNum}-${mm}-${dd}`;

      const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6;
      if (isWeekend || !isMock) {
        logs.push({
          dayName,
          dateStr,
          checkIn: 'Không có dữ liệu',
          checkOut: 'Không có dữ liệu',
          totalHours: '0 h'
        });
        continue;
      }

      let checkIn = '07:55:04';
      let checkOut = '17:30:12';

      if (isPhuc) {
        if (day % 7 === 1) {
          checkIn = '08:02:11';
          checkOut = '17:35:45';
        } else if (day % 7 === 3) {
          checkIn = '08:15:32';
          checkOut = '17:30:00';
        } else if (day % 7 === 4) {
          checkIn = '08:00:15';
          checkOut = '19:30:15';
        } else {
          checkIn = '07:58:12';
          checkOut = '17:31:00';
        }
      } else if (isLoi) {
        if (day % 7 === 2) {
          checkIn = '07:52:10';
          checkOut = '18:45:00';
        } else {
          checkIn = '07:55:04';
          checkOut = '17:30:12';
        }
      }

      logs.push({
        dayName,
        dateStr,
        checkIn,
        checkOut,
        totalHours: calculateWorkHours(checkIn, checkOut)
      });
    }
    return logs;
  }, [calculateWorkHours]);

  // Helper and handler for meeting report (moved to main scope)
  const mapDepToLogGroup = (dep: string): string => {
    if (dep === 'nhóm nhân viên 1' || dep === 'Phòng ban 1') return 'Phòng ban A';
    if (dep === 'nhóm nhân viên 2' || dep === 'Phòng ban 2') return 'Phòng ban B';
    if (dep === 'Nhóm nhân viên C' || dep === 'Phòng ban C') return 'Phòng ban C';
    if (dep === 'Nhóm nhân viên D' || dep === 'Phòng nhân sự' || dep === 'Phòng ban D') return 'Phòng ban D';
    return dep;
  };

  const handleSelectMeeting = useCallback(async (meet: any) => {
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
      const baseUrl = getBackendUrl();
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
  }, []);

  // Tự động truy vấn cuộc họp đầu tiên khi vào tab 'meeting' hoặc khi dữ liệu cuộc họp load xong
  // useEffect(() => {
  //   if (activeTab === 'meeting' && !selectedMeetingReport && meetings && meetings.length > 0 && appliedMeetingAreas.length > 0) {
  //     const schMeetingSavedData = (meetings as any[]).map(m => {
  //       const area = areasData.find(a => a.id === m.location_id);
  //       return {
  //         id: m.id,
  //         title: m.title,
  //         area: area?.name || m.location_id,
  //         date: m.meeting_date ? m.meeting_date.split('T')[0] : '',
  //         startTime: m.start_time || '',
  //         endTime: m.end_time || '',
  //         departments: m.departments || [],
  //       };
  //     });
  //
  //     const getMeetingTimestamp = (dateStr: string, timeStr: string) => {
  //       return new Date(`${dateStr}T${timeStr || '00:00'}`).getTime();
  //     };
  //
  //     const filteredMeetings = schMeetingSavedData.filter((meet: any) => {
  //       const meetStart = getMeetingTimestamp(meet.date, meet.startTime);
  //       const meetEnd = getMeetingTimestamp(meet.date, meet.endTime);
  //       const filterStart = getMeetingTimestamp(appliedStartDate || meetingStartDate, appliedStartTime || meetingStartTime);
  //       const filterEnd = getMeetingTimestamp(appliedEndDate || meetingEndDate, appliedEndTime || meetingEndTime);
  //
  //       const isInTimeRange = meetStart >= filterStart && meetEnd <= filterEnd;
  //       const isInArea = appliedMeetingAreas.includes(meet.area);
  //       return isInTimeRange && isInArea;
  //     });
  //
  //     const targetMeeting = filteredMeetings.length > 0 ? filteredMeetings[0] : schMeetingSavedData[0];
  //     if (targetMeeting) {
  //       handleSelectMeeting(targetMeeting);
  //     }
  //   }
  // }, [
  //   activeTab,
  //   meetings,
  //   selectedMeetingReport,
  //   areasData,
  //   appliedStartDate,
  //   appliedEndDate,
  //   appliedStartTime,
  //   appliedEndTime,
  //   appliedMeetingAreas,
  //   handleSelectMeeting,
  //   meetingStartDate,
  //   meetingEndDate,
  //   meetingStartTime,
  //   meetingEndTime
  // ]);

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
  const handleExportExcelData = async (rows: typeof filteredLogs, isAll: boolean = false) => {
    setExporting(true);
    try {
      let dataToExport = rows;
      if (isAll) {
        // Fetch all matching data without page/limit constraints and without images
        const { baseUrl, params } = buildEventLogsUrl({ limit: '-1', noImages: 'true' });
        const res = await fetch(`${baseUrl}/meeting/event-logs?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          dataToExport = json.data;
        }
      }

      if (dataToExport.length === 0) {
        alert("Không có dữ liệu để xuất!");
        return;
      }

      const baseUrl = getBackendUrl();
      // Strip image fields before sending to reduce payload size
      const payload = dataToExport.map((item) => {
        const suffix = getAreaSuffix(item);
        const huongText = suffix === 'ra' ? 'Đi ra' : suffix === 'vào' ? 'Đi vào' : (item.huong && item.huong.toLowerCase().includes('ra') ? 'Đi ra' : 'Đi vào');
        return {
          stt: item.stt,
          vung: `${item.vung} (${suffix})`,
          huong: huongText,
          camera_name: resolveCameraName(item),
          ten: item.ten,
          ma: item.ma,
          danhSach: item.danhSach,
          thoiGian: item.thoiGian,
          accuracy: item.accuracy,
        };
      });
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
      alert('Xuất Excel thất bại: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  // Export multiple meetings report to a single Excel file with multiple sheets
  const handleExportMultipleMeetingsExcel = async (selectedIds: any[]) => {
    if (!selectedIds || selectedIds.length === 0) return;

    setExporting(true);
    setExportProgress(0);

    try {
      const baseUrl = getBackendUrl();
      const wb = XLSX.utils.book_new();

      const timeStringToSeconds = (tStr: string): number => {
        if (!tStr) return 0;
        const parts = tStr.split(':').map(Number);
        const h = parts[0] || 0;
        const m = parts[1] || 0;
        const s = parts[2] || 0;
        return h * 3600 + m * 60 + s;
      };

      // Fetch all reports in parallel
      const promises = selectedIds.map(async (id, idx) => {
        const res = await fetch(`${baseUrl}/meeting/${id}/attendance-report`);
        if (!res.ok) throw new Error(`Không thể lấy dữ liệu cuộc họp ID: ${id}`);
        const data = await res.json();

        // Find the meeting info in schMeetingSavedData or mock it if missing
        const rawMeet = schMeetingSavedData.find((m: any) => m.id === id);
        const meetInfo = {
          title: rawMeet?.title || `Cuộc họp ${idx + 1}`,
          area: rawMeet?.area || 'Khu vực',
          date: rawMeet?.date || '',
          startTime: rawMeet?.startTime || '00:00',
          endTime: rawMeet?.endTime || '23:59',
          departments: rawMeet?.departments || [],
        };

        const meetingStartSec = timeStringToSeconds(meetInfo.startTime);
        const meetingEndSec = timeStringToSeconds(meetInfo.endTime);
        const meetingDur = meetingEndSec - meetingStartSec || 3600;

        const mappedGroups = (meetInfo.departments || []).map(mapDepToLogGroup);

        const activeEmployees = employees.filter(emp => {
          const matchesGroup = emp.human_group.some((g: string) => mappedGroups.includes(g));
          return matchesGroup;
        });

        const attendeeRoster = activeEmployees.map(emp => {
          let thoiGianVao: string | undefined = undefined;
          let thoiGianRa: string | undefined = undefined;

          if (data && data.attendance) {
            const match = data.attendance.find((item: any) => item.employeeId === emp.id);
            if (match) {
              thoiGianVao = match.thoiGianVao || undefined;
              thoiGianRa = match.thoiGianRa || undefined;
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
              evaluationText = "Hoàn thành tốt";
              evaluationType = 'good';
            } else {
              evaluationText = "Rời phòng sớm";
              evaluationType = 'early';
            }
          }

          return {
            emp: {
              ma: emp.maGiayTo || emp.id,
              ten: emp.hoTen,
              danhSach: emp.human_group[0] || 'Mặc định',
            },
            thoiGianVao,
            thoiGianRa,
            evaluationText,
            evaluationType,
            ratioPercent,
          };
        });

        const sortedRoster = [...attendeeRoster].sort((a, b) => {
          const order = { good: 1, early: 2, manual: 3, absent: 4 };
          return order[a.evaluationType] - order[b.evaluationType];
        });

        // Map data rows
        const rows = sortedRoster.map((row, rIdx) => ({
          'STT': rIdx + 1,
          'Mã NV': row.emp.ma || '',
          'Họ và tên': row.emp.ten || '',
          'Phòng ban': row.emp.danhSach || '',
          'Giờ vào': row.thoiGianVao || '',
          'Giờ ra': row.thoiGianRa || '',
          '% tham dự': row.ratioPercent != null ? `${row.ratioPercent}%` : '',
          'Đánh giá': row.evaluationText || '',
        }));

        const totalRatioSum = sortedRoster.reduce((sum, item) => sum + item.ratioPercent, 0);
        const avgPercent = sortedRoster.length > 0
          ? Math.round(totalRatioSum / sortedRoster.length)
          : 100;

        const presentCount = sortedRoster.filter(r => r.thoiGianVao || r.thoiGianRa).length;
        const totalCount = sortedRoster.length;

        const infoRows = [
          ['BÁO CÁO THAM DỰ CUỘC HỌP', '', '', '', '', '', '', ''],
          ['Tên cuộc họp:', meetInfo.title || '', '', '', '', '', '', ''],
          ['Khu vực:', meetInfo.area || '', '', '', '', '', '', ''],
          ['Ngày:', meetInfo.date || '', '', '', '', '', '', ''],
          ['Giờ bắt đầu:', meetInfo.startTime || '', 'Phòng ban tham gia:', (meetInfo.departments || []).join(', '), '', '', '', ''],
          ['Giờ kết thúc:', meetInfo.endTime || '', 'Đánh giá tổng thể:', `Tham gia ${presentCount}/${totalCount} - Tổng thời gian tham gia (${avgPercent}%)`, '', '', '', ''],
          [],
        ];

        const infoSheet = XLSX.utils.aoa_to_sheet(infoRows);
        XLSX.utils.sheet_add_json(infoSheet, rows, { origin: 'A' + (infoRows.length + 1), skipHeader: false });

        // Auto-fit widths
        const range = XLSX.utils.decode_range(infoSheet['!ref'] || 'A1:H100');
        const maxColWidths = [];
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            if (R === 0 || ((R === 4 || R === 5) && C >= 3)) continue;
            const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
            if (!infoSheet[cellRef]) continue;
            const val = String(infoSheet[cellRef].v || '');
            const len = val.length;
            if (!maxColWidths[C] || len > maxColWidths[C]) {
              maxColWidths[C] = len;
            }
          }
        }
        infoSheet['!cols'] = maxColWidths.map(w => ({ wch: Math.max(w + 3, 10) }));

        // Styling cells
        const thinBorder = { style: 'thin', color: { rgb: 'D1D5DB' } };

        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!infoSheet[cellRef]) {
              const isMetadataCell = (R >= 1 && R <= 5 && C <= 1) || (R >= 4 && R <= 5 && C >= 2 && C <= 7);
              const isTableDetailCell = (R >= 7 && C <= 7);
              if (isMetadataCell || isTableDetailCell) {
                infoSheet[cellRef] = { t: 's', v: '' };
              } else {
                continue;
              }
            }

            const cell = infoSheet[cellRef];
            cell.s = cell.s || {};
            cell.s.font = { name: 'Segoe UI', sz: 10 };

            if (R === 0) {
              cell.s.font = { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: '0078D7' } };
              cell.s.alignment = { horizontal: 'center', vertical: 'center' };
            } else if (R >= 1 && R <= 5) {
              const isLabel = C === 0 || (C === 2 && R >= 4);
              const isValue = C === 1 || (C >= 3 && R >= 4);
              if (isLabel || isValue) {
                cell.s.font = { name: 'Segoe UI', sz: 10, bold: isLabel };
                cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                cell.s.border = {
                  top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
                };
                if (isLabel) {
                  cell.s.fill = { fgColor: { rgb: 'F3F4F6' } };
                }
                if (R === 5 && C >= 3) {
                  let evalColor = '000000';
                  if (avgPercent > 95) {
                    evalColor = '059669';
                  } else if (avgPercent > 75) {
                    evalColor = 'D97706';
                  } else {
                    evalColor = 'DC2626';
                  }
                  cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: evalColor } };
                }
              }
            } else if (R === 7) {
              cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } };
              cell.s.fill = { fgColor: { rgb: '0078D7' } };
              cell.s.alignment = { horizontal: 'center', vertical: 'center' };
              cell.s.border = {
                top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
              };
            } else if (R > 7) {
              cell.s.alignment = { horizontal: 'center', vertical: 'center' };
              cell.s.border = {
                top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
              };
            }
          }
        }

        infoSheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        ];

        infoSheet['!autofilter'] = {
          ref: XLSX.utils.encode_range({
            s: { r: 7, c: 0 },
            e: { r: range.e.r, c: 7 }
          })
        };

        const rowHeights = [];
        rowHeights[0] = { hpx: 40 };
        for (let i = 1; i <= 3; i++) rowHeights[i] = { hpx: 22 };
        rowHeights[4] = { hpx: 12 };
        rowHeights[5] = { hpx: 28 };
        for (let i = 6; i <= range.e.r; i++) rowHeights[i] = { hpx: 24 };
        infoSheet['!rows'] = rowHeights;

        const safeSheetName = (() => {
          let name = meetInfo.title;
          name = name.replace(/[\\/?*\[\]]/g, '').substring(0, 31);
          return name || `Sheet ${idx + 1}`;
        })();

        XLSX.utils.book_append_sheet(wb, infoSheet, safeSheetName);

        // Update progress
        setExportProgress(Math.round(((idx + 1) / selectedIds.length) * 100));
      });

      await Promise.all(promises);

      // Write out buffer and download
      const buf = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
      const s2ab = (s: string) => {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      };
      const blob = new Blob([s2ab(buf)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'BaoCao_TongHopCuocHop_LCMS.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsMeetingMultiSelectMode(false);
      setSelectedMeetingReportIds([]);
      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 4000);
    } catch (e: any) {
      console.error('Export failed:', e.message);
      alert('Xuất Excel thất bại: ' + e.message);
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

    // 1. Map data rows with Vietnamese headers and % suffix
    const rows = attendeeRoster.map((row, idx) => ({
      'STT': idx + 1,
      'Mã NV': row.emp.ma || '',
      'Họ và tên': row.emp.ten || '',
      'Phòng ban': row.emp.danhSach || '',
      'Giờ vào': row.thoiGianVao || '',
      'Giờ ra': row.thoiGianRa || '',
      '% tham dự': row.ratioPercent != null ? `${row.ratioPercent}%` : '',
      'Đánh giá': row.evaluationText || '',
    }));

    const totalRatioSum = attendeeRoster.reduce((sum, item) => sum + item.ratioPercent, 0);
    const avgPercent = attendeeRoster.length > 0
      ? Math.round(totalRatioSum / attendeeRoster.length)
      : 100;

    const presentCount = attendeeRoster.filter(r => r.thoiGianVao || r.thoiGianRa).length;
    const totalCount = attendeeRoster.length;

    const infoRows = [
      ['BÁO CÁO THAM DỰ CUỘC HỌP', '', '', '', '', '', '', ''],
      ['Tên cuộc họp:', meetingInfo.title || '', '', '', '', '', '', ''],
      ['Khu vực:', meetingInfo.area || '', '', '', '', '', '', ''],
      ['Ngày:', meetingInfo.date || '', '', '', '', '', '', ''],
      ['Giờ bắt đầu:', meetingInfo.startTime || '', 'Phòng ban tham gia:', (meetingInfo.departments || []).join(', '), '', '', '', ''],
      ['Giờ kết thúc:', meetingInfo.endTime || '', 'Đánh giá tổng thể:', `Tham gia ${presentCount}/${totalCount} - Tổng thời gian tham gia (${avgPercent}%)`, '', '', '', ''],
      [],
    ];

    const wb = XLSX.utils.book_new();
    const infoSheet = XLSX.utils.aoa_to_sheet(infoRows);
    XLSX.utils.sheet_add_json(infoSheet, rows, { origin: 'A' + (infoRows.length + 1), skipHeader: false });

    // 2. Compute column auto-fit widths
    const range = XLSX.utils.decode_range(infoSheet['!ref'] || 'A1:H100');
    const maxColWidths = [];
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        if (R === 0 || ((R === 4 || R === 5) && C >= 3)) continue;
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        if (!infoSheet[cellRef]) continue;
        const val = String(infoSheet[cellRef].v || '');
        const len = val.length;
        if (!maxColWidths[C] || len > maxColWidths[C]) {
          maxColWidths[C] = len;
        }
      }
    }
    infoSheet['!cols'] = maxColWidths.map(w => ({ wch: Math.max(w + 3, 10) }));

    // 3. Format and Style Cells (border, centering alignment, font, and background colors)
    const thinBorder = { style: 'thin', color: { rgb: 'D1D5DB' } }; // Light gray border

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

        // Ensure cells in tables exist to render borders properly
        if (!infoSheet[cellRef]) {
          const isMetadataCell = (R >= 1 && R <= 5 && C <= 1) || (R >= 4 && R <= 5 && C >= 2 && C <= 7);
          const isTableDetailCell = (R >= 7 && C <= 7);

          if (isMetadataCell || isTableDetailCell) {
            infoSheet[cellRef] = { t: 's', v: '' };
          } else {
            continue;
          }
        }

        const cell = infoSheet[cellRef];
        cell.s = cell.s || {};
        cell.s.font = { name: 'Segoe UI', sz: 10 };

        if (R === 0) {
          // Báo cáo Title row
          cell.s.font = { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: '0078D7' } };
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (R >= 1 && R <= 5) {
          // Meeting Info (Header table)
          const isLabel = C === 0 || (C === 2 && R >= 4);
          const isValue = C === 1 || (C >= 3 && R >= 4);

          if (isLabel || isValue) {
            cell.s.font = { name: 'Segoe UI', sz: 10, bold: isLabel };
            cell.s.alignment = { horizontal: 'center', vertical: 'center' };
            cell.s.border = {
              top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
            };
            if (isLabel) {
              cell.s.fill = { fgColor: { rgb: 'F3F4F6' } }; // Background for labels
            }
            if (R === 5 && C >= 3) {
              let evalColor = '000000';
              if (avgPercent > 95) {
                evalColor = '059669'; // Good
              } else if (avgPercent > 75) {
                evalColor = 'D97706'; // Warning
              } else {
                evalColor = 'DC2626'; // Danger
              }
              cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: evalColor } };
            }
          }
        } else if (R === 7) {
          // Table Headers row
          cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } };
          cell.s.fill = { fgColor: { rgb: '0078D7' } }; // brand blue
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          cell.s.border = {
            top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
          };
        } else if (R > 7) {
          // Table Data rows
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          cell.s.border = {
            top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
          };

          const rowData = attendeeRoster[R - 8];
          if (rowData) {
            let color = '000000'; // Default black

            if (C === 4) {
              // Giờ vào
              if (!rowData.thoiGianVao) {
                color = '94A3B8'; // Gray
              } else {
                const inSec = timeStringToSeconds(rowData.thoiGianVao);
                const startSec = timeStringToSeconds(meetingInfo.startTime);
                const latenessSec = inSec - startSec;
                if (latenessSec > 0) {
                  if (latenessSec <= 900) {
                    color = '000000';
                  } else if (latenessSec <= 1800) {
                    color = 'D97706'; // Amber-600
                  } else {
                    color = 'DC2626'; // Rose-600
                  }
                }
              }
            } else if (C === 5) {
              // Giờ ra
              if (!rowData.thoiGianRa) {
                color = '94A3B8'; // Gray
              } else {
                const outSec = timeStringToSeconds(rowData.thoiGianRa);
                const endSec = timeStringToSeconds(meetingInfo.endTime);
                const earlinessSec = endSec - outSec;
                if (earlinessSec > 0) {
                  if (earlinessSec <= 900) {
                    color = '000000';
                  } else if (earlinessSec <= 1800) {
                    color = 'D97706'; // Amber-600
                  } else {
                    color = 'DC2626'; // Rose-600
                  }
                }
              }
            } else if (C === 6) {
              // % tham dự
              if (!rowData.thoiGianVao && !rowData.thoiGianRa) {
                color = 'DC2626'; // Absent
              } else if (rowData.ratioPercent > 95) {
                color = '059669'; // Good
              } else {
                color = 'D97706'; // Early
              }
            } else if (C === 7) {
              // Đánh giá
              if (rowData.evaluationType === 'good') {
                color = '059669'; // Good
              } else if (rowData.evaluationType === 'early' || rowData.evaluationType === 'manual') {
                color = 'D97706'; // Warning
              } else {
                color = 'DC2626'; // Danger
              }
            }

            cell.s.font = { name: 'Segoe UI', sz: 10, color: { rgb: color } };
          }
        }
      }
    }

    // Merge title cells A1:H1 and right side metadata blocks
    infoSheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 4, c: 3 }, e: { r: 4, c: 7 } }, // Nhóm nhân viên tham gia (C5:H5)
      { s: { r: 5, c: 3 }, e: { r: 5, c: 7 } }, // Đánh giá tổng thể (C6:H6)
    ];

    infoSheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 7, c: 0 },
        e: { r: range.e.r, c: 7 }
      })
    };

    // 4. Set heights to act as vertical cell padding
    const rowHeights = [];
    rowHeights[0] = { hpx: 40 }; // Title row height
    for (let i = 1; i <= 5; i++) {
      rowHeights[i] = { hpx: 22 }; // Meeting info heights
    }
    rowHeights[6] = { hpx: 12 }; // Separator height
    rowHeights[7] = { hpx: 28 }; // Report header height
    for (let i = 8; i <= range.e.r; i++) {
      rowHeights[i] = { hpx: 24 }; // Report data rows heights
    }
    infoSheet['!rows'] = rowHeights;

    XLSX.utils.book_append_sheet(wb, infoSheet, 'BaoCaoHop');

    const safeName = (meetingInfo.title || 'CuocHop').replace(/\s+/g, '_');
    const filename = 'BaoCao_' + safeName + '_' + (meetingInfo.date || 'date') + '.xlsx';
    XLSX.writeFile(wb, filename);
  };

  // Tính trạng thái tham dự (text + màu) cho 1 dòng lịch sử họp của nhân viên.
  // Dùng chung cho cả bảng hiển thị UI và cell coloring khi xuất Excel.
  const getEmpMeetingRowStatus = (det: any): { text: string; color: string } => {
    let statusText = 'Vắng';
    let color = 'DC2626'; // rose
    if (det.thoiGianVao && det.thoiGianRa) {
      const getSec = (t: string) => t.split(':').map(Number).reduce((acc: number, v: number) => acc * 60 + v, 0);
      const inSec = getSec(det.thoiGianVao);
      const startSec = getSec(det.startTime);
      const outSec = getSec(det.thoiGianRa);
      const endSec = getSec(det.endTime);
      if (inSec <= startSec) {
        statusText = 'Đúng giờ';
        color = '059669'; // emerald
      } else {
        statusText = 'Đi muộn';
        color = 'D97706'; // amber
      }
      if (outSec < endSec) {
        statusText += ' - Về sớm';
        color = 'DC2626'; // rose
      }
    } else if (det.thoiGianVao || det.thoiGianRa) {
      statusText = 'Cần xử lý';
      color = 'D97706'; // amber
    }
    return { text: statusText, color };
  };

  // Xây 1 worksheet "Lịch sử họp" cho 1 nhân viên (dùng chung cho export đơn và export nhiều nhân viên).
  const buildEmpMeetingHistorySheet = (empStats: any) => {
    const emp = empStats.emp;
    const details = empStats.details || [];

    const formatDate = (dateStr: string) => {
      const parts = (dateStr || '').split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : (dateStr || '');
    };

    const rows = details.map((det: any, idx: number) => ({
      'STT': idx + 1,
      'Tên cuộc họp': det.title || '',
      'Ngày': formatDate(det.date),
      'Thời gian họp': `${det.startTime || ''} - ${det.endTime || ''}`,
      'Vào': det.thoiGianVao || '',
      'Ra': det.thoiGianRa || '',
      'Đánh giá': getEmpMeetingRowStatus(det).text,
    }));

    const infoRows = [
      ['LỊCH SỬ THAM DỰ HỌP CỦA NHÂN VIÊN', '', '', '', '', '', ''],
      ['Họ và tên:', emp.hoTen || '', '', '', '', '', ''],
      ['Mã NV:', emp.maGiayTo || '', 'Phòng ban:', (emp.human_group || []).join(', '), '', '', ''],
      ['Số cuộc họp yêu cầu:', String(empStats.requiredCount ?? ''), 'Đúng giờ / Đi muộn / Về sớm:', `${empStats.presentOnTimeCount ?? 0} / ${empStats.lateCount ?? 0} / ${empStats.earlyCount ?? 0}`, '', '', ''],
      [],
    ];

    const sheet = XLSX.utils.aoa_to_sheet(infoRows);
    XLSX.utils.sheet_add_json(sheet, rows, { origin: 'A' + (infoRows.length + 1), skipHeader: false });

    // Auto-fit column widths
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:G100');
    const maxColWidths: number[] = [];
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        if (R === 0 || ((R === 2 || R === 3) && C >= 2)) continue;
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        if (!sheet[cellRef]) continue;
        const val = String(sheet[cellRef].v || '');
        const len = val.length;
        if (!maxColWidths[C] || len > maxColWidths[C]) {
          maxColWidths[C] = len;
        }
      }
    }
    sheet['!cols'] = maxColWidths.map(w => ({ wch: Math.max(w + 3, 10) }));

    // Styling
    const thinBorder = { style: 'thin', color: { rgb: 'D1D5DB' } };
    const headerRowIdx = infoRows.length; // Row (0-based) của header bảng chi tiết

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

        if (!sheet[cellRef]) {
          const isMetadataCell = (R >= 1 && R <= 3 && C <= 1) || (R >= 2 && R <= 3 && C >= 2 && C <= 6);
          const isTableDetailCell = R >= headerRowIdx && C <= 6;
          if (isMetadataCell || isTableDetailCell) {
            sheet[cellRef] = { t: 's', v: '' };
          } else {
            continue;
          }
        }

        const cell = sheet[cellRef];
        cell.s = cell.s || {};
        cell.s.font = { name: 'Segoe UI', sz: 10 };

        if (R === 0) {
          // Title row
          cell.s.font = { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: '0078D7' } };
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (R >= 1 && R <= 3) {
          // Employee info block
          const isLabel = C === 0 || (C === 2 && R >= 2);
          const isValue = C === 1 || (C >= 3 && R >= 2);
          if (isLabel || isValue) {
            cell.s.font = { name: 'Segoe UI', sz: 10, bold: isLabel };
            cell.s.alignment = { horizontal: 'center', vertical: 'center' };
            cell.s.border = {
              top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
            };
            if (isLabel) {
              cell.s.fill = { fgColor: { rgb: 'F3F4F6' } };
            }
          }
        } else if (R === headerRowIdx) {
          // Table header row
          cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } };
          cell.s.fill = { fgColor: { rgb: '0078D7' } };
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          cell.s.border = {
            top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
          };
        } else if (R > headerRowIdx) {
          // Table data rows
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          cell.s.border = {
            top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
          };

          const rowDet = details[R - headerRowIdx - 1];
          if (rowDet) {
            let color = '000000';
            if (C === 4) {
              // Vào
              color = rowDet.thoiGianVao ? '000000' : '94A3B8';
            } else if (C === 5) {
              // Ra
              color = rowDet.thoiGianRa ? '000000' : '94A3B8';
            } else if (C === 6) {
              // Đánh giá
              color = getEmpMeetingRowStatus(rowDet).color;
            }
            cell.s.font = { name: 'Segoe UI', sz: 10, color: { rgb: color } };
          }
        }
      }
    }

    sheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 2, c: 3 }, e: { r: 2, c: 6 } }, // Nhóm nhân viên
      { s: { r: 3, c: 3 }, e: { r: 3, c: 6 } }, // Đúng giờ / Đi muộn / Về sớm
    ];

    sheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: headerRowIdx, c: 0 },
        e: { r: range.e.r, c: range.e.c }
      })
    };

    const rowHeights: any[] = [];
    rowHeights[0] = { hpx: 40 };
    for (let i = 1; i <= 3; i++) rowHeights[i] = { hpx: 22 };
    rowHeights[4] = { hpx: 12 };
    rowHeights[headerRowIdx] = { hpx: 28 };
    for (let i = headerRowIdx + 1; i <= range.e.r; i++) rowHeights[i] = { hpx: 24 };
    sheet['!rows'] = rowHeights;

    return sheet;
  };

  // Xuất Excel lịch sử tham dự họp của 1 nhân viên (dùng ở Sub-view Chi tiết).
  const handleExportEmployeeDetailExcel = (empStats: any) => {
    if (!empStats || !empStats.details || empStats.details.length === 0) return;

    const wb = XLSX.utils.book_new();
    const sheet = buildEmpMeetingHistorySheet(empStats);
    XLSX.utils.book_append_sheet(wb, sheet, 'LichSuHop');

    const safeName = (empStats.emp.hoTen || 'NhanVien').replace(/\s+/g, '_');
    const filename = 'LichSuHop_' + safeName + '.xlsx';
    XLSX.writeFile(wb, filename);
  };

  // Xuất Excel cho nhiều nhân viên đã chọn ở Danh sách "Báo cáo theo nhân viên" (mỗi nhân viên 1 sheet).
  const handleExportMultipleEmployeesExcel = (selectedIds: any[]) => {
    if (!selectedIds || selectedIds.length === 0) return;

    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const usedNames = new Set<string>();

      selectedIds.forEach((empId, idx) => {
        const empStats = employeeMeetingStats.find((item: any) => item.emp.id === empId);
        if (!empStats) return;

        const sheet = buildEmpMeetingHistorySheet(empStats);

        let safeSheetName = (empStats.emp.hoTen || `NhanVien${idx + 1}`).replace(/[\\/?*\[\]]/g, '').substring(0, 28);
        if (!safeSheetName) safeSheetName = `Sheet ${idx + 1}`;
        let finalName = safeSheetName;
        let suffix = 1;
        while (usedNames.has(finalName)) {
          finalName = `${safeSheetName}_${++suffix}`.substring(0, 31);
        }
        usedNames.add(finalName);

        XLSX.utils.book_append_sheet(wb, sheet, finalName);
      });

      XLSX.writeFile(wb, 'BaoCao_NhanVien_ThamDuHop_LCMS.xlsx');

      setIsEmpMultiSelectMode(false);
      setSelectedEmpReportIds([]);
      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 4000);
    } catch (e: any) {
      console.error('Export failed:', e.message);
      alert('Xuất Excel thất bại: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  const [isPdfExporting, setIsPdfExporting] = useState(false);

  const handleExportMeetingReportPDF = async (roster: any[]) => {
    if (!selectedMeetingReport || !roster || roster.length === 0) return;
    setIsPdfExporting(true);
    setPdfExportRoster(roster);

    setTimeout(async () => {
      const element = document.getElementById('meeting-report-pdf-template');
      if (!element) {
        setIsPdfExporting(false);
        return;
      }

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
        });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const safeName = (selectedMeetingReport.title || 'BaoCaoHop').replace(/\s+/g, '_');
        pdf.save(`BaoCao_${safeName}_${selectedMeetingReport.date || 'date'}.pdf`);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
        alert('Có lỗi xảy ra khi tạo file PDF.');
      } finally {
        setIsPdfExporting(false);
      }
    }, 150);
  };

  const [isEventPdfExporting, setIsEventPdfExporting] = useState(false);
  const [pdfExportEvents, setPdfExportEvents] = useState<any[]>([]);

  const fetchAllEventLogs = async () => {
    const { baseUrl, params } = buildEventLogsUrl({ limit: '-1', noImages: 'true' });
    const res = await fetch(`${baseUrl}/meeting/event-logs?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  };

  const handleExportEventLogsExcel = (rows: any[]) => {
    if (!rows || rows.length === 0) return;

    const formattedRows = rows.map((item, idx) => {
      const areaSuffix = getAreaSuffix(item);
      const huongText = areaSuffix === 'ra'
        ? 'Đi ra'
        : areaSuffix === 'vào'
          ? 'Đi vào'
          : (item.huong && item.huong.toLowerCase().includes('ra') ? 'Đi ra' : 'Đi vào');
      const cameraText = resolveCameraName(item);
      const acc = item.accuracy;
      const isValidScore = acc !== undefined && acc !== null && acc !== '' && acc !== 'Không có dữ liệu';
      const accuracyValue = isValidScore
        ? (typeof acc === 'number' ? `${acc}%` : String(acc).includes('%') ? acc : `${acc}%`)
        : 'Không có dữ liệu';

      return {
        'STT': idx + 1,
        'Họ tên': item.ten || '',
        'Mã nhân viên': item.ma || '',
        'Phòng ban': item.danhSach || '',
        'Khu vực': item.vung || '',
        'Hướng': huongText,
        'Camera': cameraText,
        'Thời gian': item.thoiGian || '',
        'Độ chính xác (%)': accuracyValue,
      };
    });

    const formatDateTimeFilter = (dateStr?: string, timeStr?: string) => {
      if (!dateStr) return 'Không giới hạn';
      if (!timeStr) return dateStr;
      return `${dateStr} ${timeStr}`;
    };

    const tuNgayText = formatDateTimeFilter(appliedStartDate, appliedStartTime);
    const denNgayText = formatDateTimeFilter(appliedEndDate, appliedEndTime);

    const infoRows = [
      ['DANH SÁCH SỰ KIỆN GHI NHẬN', '', '', '', '', '', '', '', ''],
      ['Từ ngày:', tuNgayText, 'Từ khóa:', appliedSearch || 'Tất cả', 'Khu vực:', appliedZones.length > 0 ? appliedZones.join(', ') : (appliedZone === 'All' ? 'Tất cả' : appliedZone), '', '', ''],
      ['Đến ngày:', denNgayText, 'Phòng ban:', appliedList === 'All' ? 'Tất cả' : (humanGroups.find(g => g.id === appliedList)?.name || appliedList), 'Loại sự kiện:', appliedEventType === 'All' ? 'Tất cả' : (appliedEventType === 'in' ? 'Đi vào' : 'Đi ra'), '', '', ''],
      [],
    ];

    const wb = XLSX.utils.book_new();
    const infoSheet = XLSX.utils.aoa_to_sheet(infoRows);
    XLSX.utils.sheet_add_json(infoSheet, formattedRows, { origin: 'A' + (infoRows.length + 1), skipHeader: false });

    // Compute column widths
    const range = XLSX.utils.decode_range(infoSheet['!ref'] || 'A1:I100');
    const maxColWidths: number[] = [];
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        if (R === 0 || ((R >= 1 && R <= 2) && C >= 6)) continue;
        const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
        if (!infoSheet[cellRef]) continue;
        const val = String(infoSheet[cellRef].v || '');
        const len = val.length;
        if (!maxColWidths[C] || len > maxColWidths[C]) {
          maxColWidths[C] = len;
        }
      }
    }
    infoSheet['!cols'] = maxColWidths.map(w => ({ wch: Math.max(w + 3, 10) }));

    const thinBorder = { style: 'thin', color: { rgb: 'D1D5DB' } };

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

        if (!infoSheet[cellRef]) {
          const isMetadataCell = (R >= 1 && R <= 2 && C <= 5);
          const isTableDetailCell = (R >= 4 && C <= 8);
          if (isMetadataCell || isTableDetailCell) {
            infoSheet[cellRef] = { t: 's', v: '' };
          } else {
            continue;
          }
        }

        const cell = infoSheet[cellRef];
        cell.s = cell.s || {};
        cell.s.font = { name: 'Segoe UI', sz: 10 };

        if (R === 0) {
          cell.s.font = { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: '0078D7' } };
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (R >= 1 && R <= 2) {
          const isLabel = C === 0 || C === 2 || C === 4;
          const isValue = C === 1 || C === 3 || C === 5;
          if (isLabel || isValue) {
            cell.s.font = { name: 'Segoe UI', sz: 10, bold: isLabel };
            cell.s.alignment = { horizontal: 'center', vertical: 'center' };
            cell.s.border = {
              top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
            };
            if (isLabel) {
              cell.s.fill = { fgColor: { rgb: 'F3F4F6' } };
            }
          }
        } else if (R === 4) {
          cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } };
          cell.s.fill = { fgColor: { rgb: '0078D7' } };
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          cell.s.border = {
            top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
          };
        } else if (R > 4) {
          cell.s.alignment = { horizontal: 'center', vertical: 'center' };
          cell.s.border = {
            top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
          };
        }
      }
    }

    infoSheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } },
    ];

    infoSheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 4, c: 0 },
        e: { r: range.e.r, c: range.e.c }
      })
    };

    const rowHeights: any[] = [];
    rowHeights[0] = { hpx: 40 };
    for (let i = 1; i <= 2; i++) rowHeights[i] = { hpx: 22 };
    rowHeights[3] = { hpx: 12 };
    rowHeights[4] = { hpx: 28 };
    for (let i = 5; i <= range.e.r; i++) rowHeights[i] = { hpx: 24 };
    infoSheet['!rows'] = rowHeights;

    XLSX.utils.book_append_sheet(wb, infoSheet, 'DanhSachSuKien');

    // Write out buffer and download
    const buf = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
    const s2ab = (s: string) => {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
      return buf;
    };
    const blob = new Blob([s2ab(buf)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DanhSachSuKien_LCMS.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportEventLogsPDF = async (rows: any[]) => {
    if (!rows || rows.length === 0) return;
    setIsEventPdfExporting(true);
    setPdfExportEvents(rows);

    setTimeout(async () => {
      const element = document.getElementById('event-logs-pdf-template');
      if (!element) {
        setIsEventPdfExporting(false);
        return;
      }

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
        });
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`BaoCaoSuKien_${Date.now()}.pdf`);
      } catch (err) {
        console.error('Failed to generate Event PDF:', err);
        alert('Có lỗi xảy ra khi tạo file PDF.');
      } finally {
        setIsEventPdfExporting(false);
      }
    }, 150);
  };

  // Trigger Attendance export (XLSX or PDF)
  const handleExportAttendance = async (format: 'XLSX' | 'PDF', roster: any[]) => {
    if (!roster || roster.length === 0) return;

    let typeSlug = 'BaoCao';
    switch (attendanceType) {
      case 'Báo cáo theo ngày':
        typeSlug = 'baocao_chamcong';
        break;
      case 'Báo cáo theo tuần':
        typeSlug = 'BaoCao_TongHopHangTuan';
        break;
      case 'Báo cáo theo tháng':
        typeSlug = 'BaoCao_TongHopHangThang';
        break;
      default:
        typeSlug = 'BaoCao_DiemDanh';
    }
    const ext = format.toLowerCase();
    const fileName = `${typeSlug}_${attendanceGroup.replace(/[^a-zA-Z0-9]/g, '')}_${attendanceStartDate.replace(/-/g, '')}_${attendanceEndDate.replace(/-/g, '')}.${ext}`;

    setExportedFileName(fileName);
    setExporting(true);
    setExportProgress(0);

    if (format === 'XLSX') {
      try {
        const isDaily = attendanceType === 'Báo cáo theo ngày';
        const isWeeklyOrMonthly = attendanceType === 'Báo cáo theo tuần' || attendanceType === 'Báo cáo theo tháng';

        const calcEmployeeStats = (empItem: any) => {
          let good = 0;
          let late = 0;
          let early = 0;
          let absent = 0;

          const rangeMatch = rangeReportData.find((r: any) => r.employeeId === empItem.ma || r.employeeId === empItem.id);
          const logs = rangeMatch?.dailyLogs || empItem.dailyLogs || [];
          if (Array.isArray(logs) && logs.length > 0) {
            logs.forEach((log: any) => {
              const inStr = log.thoiGianVao;
              const outStr = log.thoiGianRa;
              const hasIn = inStr && inStr !== 'Trống' && inStr !== 'Không có dữ liệu';
              const hasOut = outStr && outStr !== 'Trống' && outStr !== 'Không có dữ liệu';

              if (!hasIn && !hasOut) {
                absent++;
              } else {
                const evalRes = getAttendanceStatusBadge(hasIn ? inStr : undefined, hasOut ? outStr : undefined, customShiftStart, customShiftEnd);
                if (evalRes.text === 'Đúng giờ') {
                  good++;
                } else {
                  if (evalRes.text.toLowerCase().includes('muộn')) late++;
                  if (evalRes.text.toLowerCase().includes('sớm')) early++;
                  if (evalRes.text.toLowerCase().includes('vắng') || evalRes.text.toLowerCase().includes('thiếu')) absent++;
                }
              }
            });
          } else {
            const d1 = new Date(attendanceStartDate);
            const d2 = new Date(attendanceEndDate);
            const diffTime = Math.abs(d2.getTime() - d1.getTime());
            const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 || 7;
            absent = daysCount;
          }
          return { good, late, early, absent };
        };

        let totalGoodSum = 0;
        let totalLateSum = 0;
        let totalEarlySum = 0;
        let totalAbsentSum = 0;

        if (isWeeklyOrMonthly) {
          roster.forEach((item: any) => {
            const st = calcEmployeeStats(item);
            totalGoodSum += st.good;
            totalLateSum += st.late;
            totalEarlySum += st.early;
            totalAbsentSum += st.absent;
          });
        }

        // 1. Create Main Sheet formatted rows
        const formattedRows = roster.map((item, idx) => {
          if (isDaily) {
            return {
              'STT': idx + 1,
              'Mã NV': item.ma || 'Không có dữ liệu',
              'Họ và Tên': item.ten || 'Không có dữ liệu',
              'Phòng ban': item.danhSach || 'Không có dữ liệu',
              'Giờ Vào': (item.thoiGianVao && item.thoiGianVao !== 'Trống' && item.thoiGianVao !== 'Không có dữ liệu') ? formatTimeOnly(item.thoiGianVao) : 'Không có dữ liệu',
              'Giờ Ra': (item.thoiGianRa && item.thoiGianRa !== 'Trống' && item.thoiGianRa !== 'Không có dữ liệu') ? formatTimeOnly(item.thoiGianRa) : 'Không có dữ liệu',
              'Tổng giờ': item.totalHours || '0 h',
              'Trạng thái': item.status?.text || '-',
            };
          } else {
            const stats = calcEmployeeStats(item);
            return {
              'STT': idx + 1,
              'Mã NV': item.ma || '',
              'Họ và Tên': item.ten || '',
              'Phòng ban': item.danhSach || '',
              'Tổng giờ': item.totalHours || '0 h',
              'Hoàn thành tốt': stats.good,
              'Đi trễ': stats.late,
              'Về sớm': stats.early,
              'Vắng': stats.absent,
            };
          }
        });

        const groupNameText = attendanceGroup === 'All'
          ? 'Tất cả'
          : (humanGroups.find(g => g.id === attendanceGroup)?.name || attendanceGroup);

        const totalCount = roster.length;
        const presentCount = roster.filter(item =>
          (item.thoiGianVao && item.thoiGianVao !== 'Trống' && item.thoiGianVao !== 'Không có dữ liệu') ||
          (item.thoiGianRa && item.thoiGianRa !== 'Trống' && item.thoiGianRa !== 'Không có dữ liệu')
        ).length;

        const countOnTime = roster.filter(item => item.status?.text?.includes('Đúng giờ')).length;
        const countAbsent = roster.filter(item => item.status?.text?.includes('Vắng')).length;
        const countLate = roster.filter(item => item.status?.text?.toLowerCase().includes('muộn')).length;
        const countEarly = roster.filter(item => item.status?.text?.toLowerCase().includes('sớm')).length;
        const countNeedsHandling = roster.filter(item => {
          const hasIn = item.thoiGianVao && item.thoiGianVao !== 'Trống' && item.thoiGianVao !== 'Không có dữ liệu';
          const hasOut = item.thoiGianRa && item.thoiGianRa !== 'Trống' && item.thoiGianRa !== 'Không có dữ liệu';
          const statusText = (item.status?.text || '').toLowerCase();
          return (hasIn && !hasOut) || (!hasIn && hasOut) || statusText.includes('xử lý') || statusText.includes('thiếu');
        }).length;

        const infoRows = isDaily ? [
          [`BÁO CÁO CHẤM CÔNG THEO NGÀY`, '', '', '', '', '', '', ''],
          ['Từ ngày:', attendanceStartDate, 'Phòng ban:', groupNameText, 'Đúng giờ:', countOnTime.toString(), 'Vắng:', countAbsent.toString()],
          ['Đến ngày:', attendanceEndDate, 'Nhân sự hiện diện:', `${presentCount} / ${totalCount}`, 'Vào muộn:', countLate.toString(), 'Về sớm:', countEarly.toString()],
          ['', '', '', '', 'Cần xử lý riêng:', countNeedsHandling.toString(), '', ''],
          [],
        ] : [
          [`BÁO CÁO CHẤM CÔNG - ${attendanceType.toUpperCase().replace('ĐIỂM DANH', 'CHẤM CÔNG')}`, '', '', '', '', '', '', '', ''],
          ['Từ ngày:', attendanceStartDate, 'Phòng ban:', groupNameText, 'Hoàn thành tốt:', totalGoodSum.toString(), 'Đi trễ:', totalLateSum.toString()],
          ['Đến ngày:', attendanceEndDate, 'Số lượng nhân sự:', roster.length.toString(), 'Về sớm:', totalEarlySum.toString(), 'Vắng:', totalAbsentSum.toString()],
          [],
        ];

        const wb = XLSX.utils.book_new();
        const mainSheet = XLSX.utils.aoa_to_sheet(infoRows);
        XLSX.utils.sheet_add_json(mainSheet, formattedRows, { origin: 'A' + (infoRows.length + 1), skipHeader: false });

        // Styling the main sheet
        const range = XLSX.utils.decode_range(mainSheet['!ref'] || 'A1:H100');
        const maxColWidths: number[] = [];
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            if (R === 0 || ((R >= 1 && R <= 3) && C >= 8)) continue;
            const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
            if (!mainSheet[cellRef]) continue;
            const val = String(mainSheet[cellRef].v || '');
            const len = val.length;
            if (!maxColWidths[C] || len > maxColWidths[C]) {
              maxColWidths[C] = len;
            }
          }
        }
        mainSheet['!cols'] = maxColWidths.map(w => ({ wch: Math.max(w + 3, 10) }));

        const thinBorder = { style: 'thin', color: { rgb: 'D1D5DB' } };
        const tableHeaderRowIndex = isDaily ? 5 : 4;

        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (!mainSheet[cellRef]) {
              const isMetadataCell = isDaily
                ? ((R >= 1 && R <= 2 && C <= 7) || (R === 3 && (C === 4 || C === 5)))
                : (R >= 1 && R <= 2 && C <= 8);
              const isTableDetailCell = (R >= tableHeaderRowIndex && C <= (isDaily ? 7 : 8));
              if (isMetadataCell || isTableDetailCell) {
                mainSheet[cellRef] = { t: 's', v: '' };
              } else {
                continue;
              }
            }

            const cell = mainSheet[cellRef];
            cell.s = cell.s || {};
            cell.s.font = { name: 'Segoe UI', sz: 10 };

            if (R === 0) {
              cell.s.font = { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: '0078D7' } };
              cell.s.alignment = { horizontal: 'center', vertical: 'center' };
            } else if (isDaily ? ((R >= 1 && R <= 2 && C <= 7) || (R === 3 && (C === 4 || C === 5))) : (R >= 1 && R <= 2 && C <= 8)) {
              // header info metadata rows styling
              cell.s.alignment = { horizontal: 'center', vertical: 'center' };
              cell.s.border = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

              let bgRgb = 'FFFFFF';
              let textRgb = '111827';
              let isBold = false;

              if (isDaily) {
                const isLabel = C % 2 === 0;
                isBold = isLabel;
                if (isLabel) {
                  bgRgb = 'F3F4F6';
                  textRgb = '374151';
                }

                // Custom badge coloring for isDaily summary boxes
                if (R === 1 && (C === 4 || C === 5)) {
                  // Đúng giờ (Green)
                  bgRgb = 'D1FAE5'; textRgb = '065F46'; isBold = true;
                } else if (R === 1 && (C === 6 || C === 7)) {
                  // Vắng (Red)
                  bgRgb = 'FEE2E2'; textRgb = '991B1B'; isBold = true;
                } else if (R === 2 && (C === 2 || C === 3)) {
                  // Nhân sự hiện diện (Sky)
                  bgRgb = 'E0F2FE'; textRgb = '0369A1'; isBold = true;
                } else if (R === 2 && (C === 4 || C === 5)) {
                  // Vào muộn (Amber)
                  bgRgb = 'FEF3C7'; textRgb = '92400E'; isBold = true;
                } else if (R === 2 && (C === 6 || C === 7)) {
                  // Về sớm (Violet)
                  bgRgb = 'EDE9FE'; textRgb = '5B21B6'; isBold = true;
                } else if (R === 3 && (C === 4 || C === 5)) {
                  // Cần xử lý riêng (Orange)
                  bgRgb = 'FFEDD5'; textRgb = 'C2410C'; isBold = true;
                }
              } else {
                // !isDaily (Weekly / Monthly summary boxes)
                const isLabel = C === 0 || C === 2 || C === 4 || C === 7;
                isBold = isLabel;
                if (isLabel) {
                  bgRgb = 'F3F4F6';
                  textRgb = '374151';
                }

                if (R === 1 && (C === 4 || C === 5)) {
                  // Hoàn thành tốt (Green)
                  bgRgb = 'D1FAE5'; textRgb = '065F46'; isBold = true;
                } else if (R === 1 && (C === 7 || C === 8)) {
                  // Đi trễ (Amber)
                  bgRgb = 'FEF3C7'; textRgb = '92400E'; isBold = true;
                } else if (R === 2 && (C === 2 || C === 3)) {
                  // Số lượng nhân sự (Sky)
                  bgRgb = 'E0F2FE'; textRgb = '0369A1'; isBold = true;
                } else if (R === 2 && (C === 4 || C === 5)) {
                  // Về sớm (Violet)
                  bgRgb = 'EDE9FE'; textRgb = '5B21B6'; isBold = true;
                } else if (R === 2 && (C === 7 || C === 8)) {
                  // Vắng (Red)
                  bgRgb = 'FEE2E2'; textRgb = '991B1B'; isBold = true;
                }
              }

              cell.s.font = { name: 'Segoe UI', sz: 10, bold: isBold, color: { rgb: textRgb } };
              cell.s.fill = { fgColor: { rgb: bgRgb } };
            } else if (R === tableHeaderRowIndex) {
              cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } };
              cell.s.fill = { fgColor: { rgb: '0078D7' } };
              cell.s.alignment = { horizontal: 'center', vertical: 'center' };
              cell.s.border = {
                top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
              };
            } else if (R > tableHeaderRowIndex) {
              cell.s.alignment = { horizontal: 'center', vertical: 'center' };
              cell.s.border = {
                top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
              };
              // Color coding for Tốt/Trễ/Sớm/Vắng columns (only for weekly/monthly)
              if (!isDaily) {
                // Columns: STT=0, MaNV=1, HoTen=2, PhongBan=3, TongGio=4, Tot=5, Tre=6, Som=7, Vang=8
                const cellVal = mainSheet[cellRef]?.v;
                const numVal = typeof cellVal === 'number' ? cellVal : parseInt(String(cellVal ?? ''));
                if (C === 5 && !isNaN(numVal)) {
                  // Hoàn thành tốt → xanh lá
                  if (numVal > 0) cell.s.fill = { fgColor: { rgb: 'D1FAE5' } }; // green-100
                  cell.s.font = { name: 'Segoe UI', sz: 10, bold: numVal > 0, color: { rgb: numVal > 0 ? '065F46' : '6B7280' } };
                } else if (C === 6 && !isNaN(numVal)) {
                  // Đi trễ → vàng cam
                  if (numVal > 0) cell.s.fill = { fgColor: { rgb: 'FEF3C7' } }; // amber-100
                  cell.s.font = { name: 'Segoe UI', sz: 10, bold: numVal > 0, color: { rgb: numVal > 0 ? '92400E' : '6B7280' } };
                } else if (C === 7 && !isNaN(numVal)) {
                  // Về sớm → tím nhạt
                  if (numVal > 0) cell.s.fill = { fgColor: { rgb: 'EDE9FE' } }; // violet-100
                  cell.s.font = { name: 'Segoe UI', sz: 10, bold: numVal > 0, color: { rgb: numVal > 0 ? '5B21B6' : '6B7280' } };
                } else if (C === 8 && !isNaN(numVal)) {
                  // Vắng → đỏ nhạt
                  if (numVal > 0) cell.s.fill = { fgColor: { rgb: 'FEE2E2' } }; // red-100
                  cell.s.font = { name: 'Segoe UI', sz: 10, bold: numVal > 0, color: { rgb: numVal > 0 ? '991B1B' : '6B7280' } };
                }
              }
            }
          }
        }

        mainSheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: isDaily ? 7 : 8 } },
        ];

        mainSheet['!autofilter'] = {
          ref: XLSX.utils.encode_range({
            s: { r: tableHeaderRowIndex, c: 0 },
            e: { r: range.e.r, c: isDaily ? 7 : 8 }
          })
        };

        const rowHeights = [];
        rowHeights[0] = { hpx: 40 };
        if (isDaily) {
          rowHeights[1] = { hpx: 22 };
          rowHeights[2] = { hpx: 22 };
          rowHeights[3] = { hpx: 22 };
          rowHeights[4] = { hpx: 12 };
          rowHeights[5] = { hpx: 28 };
          for (let i = 6; i <= range.e.r; i++) rowHeights[i] = { hpx: 24 };
        } else {
          for (let i = 1; i <= 2; i++) rowHeights[i] = { hpx: 22 };
          rowHeights[3] = { hpx: 12 };
          rowHeights[4] = { hpx: 28 };
          for (let i = 5; i <= range.e.r; i++) rowHeights[i] = { hpx: 24 };
        }
        mainSheet['!rows'] = rowHeights;

        XLSX.utils.book_append_sheet(wb, mainSheet, 'TongHopChung');

        // 2. Weekly/Monthly: Add individual sheets for each employee
        if (isWeeklyOrMonthly) {
          roster.forEach((emp, empIdx) => {
            const isWeekly = attendanceType === 'Báo cáo theo tuần';
            const daysOfWeekNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

            const realLogs = (emp.dailyLogs || []).map((log: any) => {
              const d = new Date(log.date);
              const dayName = daysOfWeekNames[d.getDay()];
              return {
                dayName,
                dateStr: log.date,
                checkIn: (log.thoiGianVao && log.thoiGianVao !== 'Trống' && log.thoiGianVao !== 'Không có dữ liệu') ? log.thoiGianVao : 'Không có dữ liệu',
                checkOut: (log.thoiGianRa && log.thoiGianRa !== 'Trống' && log.thoiGianRa !== 'Không có dữ liệu') ? log.thoiGianRa : 'Không có dữ liệu',
                totalHours: log.hours ? `${Math.round(log.hours * 100) / 100} h` : '0 h',
              };
            });

            const logs = realLogs.length > 0
              ? realLogs
              : (isWeekly
                ? generateWeeklyLogs(emp.ma, attendanceStartDate)
                : generateMonthlyLogs(emp.ma, attendanceMonthNumber, attendanceYear));

            const formattedLogs = logs.map((log: any, idx: number) => ({
              'STT': idx + 1,
              'Thứ / Ngày': `${log.dayName} (${log.dateStr.split('-').reverse().slice(0, 2).join('/')})`,
              'Làm lúc': (log.checkIn && log.checkIn !== 'Trống' && log.checkIn !== 'Không có dữ liệu') ? log.checkIn : 'Không có dữ liệu',
              'Đến lúc': (log.checkOut && log.checkOut !== 'Trống' && log.checkOut !== 'Không có dữ liệu') ? log.checkOut : 'Không có dữ liệu',
              'Tổng giờ ngày': log.totalHours || '0 h',
              'Trạng thái': (!log.checkIn || log.checkIn === 'Trống' || log.checkIn === 'Không có dữ liệu') ? 'Nghỉ' : 'Có mặt',
            }));

            const empInfoRows = [
              [`BẢNG CHI TIẾT CHẤM CÔNG - ${emp.ten.toUpperCase()}`, '', '', '', '', ''],
              ['Mã NV:', emp.ma || '', 'Nhóm:', emp.danhSach || '', '', ''],
              ['Từ ngày:', attendanceStartDate, 'Đến ngày:', attendanceEndDate, '', ''],
              [],
            ];

            const empSheet = XLSX.utils.aoa_to_sheet(empInfoRows);
            XLSX.utils.sheet_add_json(empSheet, formattedLogs, { origin: 'A' + (empInfoRows.length + 1), skipHeader: false });

            const empRange = XLSX.utils.decode_range(empSheet['!ref'] || 'A1:F50');
            const empColWidths = [];
            for (let R = empRange.s.r; R <= empRange.e.r; ++R) {
              for (let C = empRange.s.c; C <= empRange.e.c; ++C) {
                if (R === 0 || ((R >= 1 && R <= 2) && C >= 4)) continue;
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                if (!empSheet[cellRef]) continue;
                const val = String(empSheet[cellRef].v || '');
                const len = val.length;
                if (!empColWidths[C] || len > empColWidths[C]) {
                  empColWidths[C] = len;
                }
              }
            }
            empSheet['!cols'] = empColWidths.map(w => ({ wch: Math.max(w + 3, 10) }));

            for (let R = empRange.s.r; R <= empRange.e.r; ++R) {
              for (let C = empRange.s.c; C <= empRange.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                if (!empSheet[cellRef]) {
                  const isMetadataCell = (R >= 1 && R <= 2 && C <= 3);
                  const isTableDetailCell = (R >= 4 && C <= 5);
                  if (isMetadataCell || isTableDetailCell) {
                    empSheet[cellRef] = { t: 's', v: '' };
                  } else {
                    continue;
                  }
                }

                const cell = empSheet[cellRef];
                cell.s = cell.s || {};
                cell.s.font = { name: 'Segoe UI', sz: 10 };

                if (R === 0) {
                  cell.s.font = { name: 'Segoe UI', sz: 12, bold: true, color: { rgb: '0078D7' } };
                  cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                } else if (R >= 1 && R <= 2) {
                  const isLabel = C === 0 || C === 2;
                  const isValue = C === 1 || C === 3;
                  if (isLabel || isValue) {
                    cell.s.font = { name: 'Segoe UI', sz: 10, bold: isLabel };
                    cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                    cell.s.border = {
                      top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
                    };
                    if (isLabel) {
                      cell.s.fill = { fgColor: { rgb: 'F3F4F6' } };
                    }
                  }
                } else if (R === 4) {
                  cell.s.font = { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } };
                  cell.s.fill = { fgColor: { rgb: '0078D7' } };
                  cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                  cell.s.border = {
                    top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
                  };
                } else if (R > 4) {
                  cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                  cell.s.border = {
                    top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
                  };
                }
              }
            }

            empSheet['!merges'] = [
              { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
            ];

            const empRowHeights = [];
            empRowHeights[0] = { hpx: 35 };
            for (let i = 1; i <= 2; i++) empRowHeights[i] = { hpx: 22 };
            empRowHeights[3] = { hpx: 12 };
            empRowHeights[4] = { hpx: 26 };
            for (let i = 5; i <= empRange.e.r; i++) empRowHeights[i] = { hpx: 22 };
            empSheet['!rows'] = empRowHeights;

            const safeSheetName = (() => {
              let n = `${emp.ma || empIdx}_${emp.ten}`;
              n = n.replace(/[\\/?*\[\]]/g, '').substring(0, 31);
              return n || `NV_${empIdx + 1}`;
            })();

            XLSX.utils.book_append_sheet(wb, empSheet, safeSheetName);
          });
        }

        // 3. Write out buffer and download
        const buf = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
        const s2ab = (s: string) => {
          const buf = new ArrayBuffer(s.length);
          const view = new Uint8Array(buf);
          for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
          return buf;
        };
        const blob = new Blob([s2ab(buf)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExportProgress(100);
        setTimeout(() => {
          setExporting(false);
          setShowExportToast(true);
          setTimeout(() => setShowExportToast(false), 4000);
        }, 300);
      } catch (err) {
        console.error('Failed to export Excel:', err);
        alert('Có lỗi xảy ra khi xuất file Excel.');
        setExporting(false);
      }
    } else if (format === 'PDF') {
      setIsAttendancePdfExporting(true);
      setPdfAttendanceRoster(roster);

      setTimeout(async () => {
        const element = document.getElementById('attendance-report-pdf-template');
        if (!element) {
          setIsAttendancePdfExporting(false);
          setExporting(false);
          return;
        }

        try {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true,
          });
          const imgData = canvas.toDataURL('image/png');

          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 295; // A4 height in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(fileName.replace('.xlsx', '.pdf'));
          setExportProgress(100);
          setShowExportToast(true);
          setTimeout(() => setShowExportToast(false), 4000);
        } catch (err) {
          console.error('Failed to generate PDF:', err);
          alert('Có lỗi xảy ra khi tạo file PDF.');
        } finally {
          setIsAttendancePdfExporting(false);
          setExporting(false);
        }
      }, 200);
    }
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

            {/* Tab 4: Thống kê biểu đồ (Chỉ hiện Icon, không hiện text) */}
            <button
              id="tab-btn-statistics"
              onClick={() => navigate('/statistics')}
              title="Biểu đồ thống kê số bản ghi ra/vào"
              className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-200 text-slate-400 hover:text-[#00a2e8] hover:bg-[#252735] cursor-pointer"
            >
              <BarChart3 size={15} />
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
                  className="w-full bg-[#181921] border border-[#2a2c3a] rounded-xl pl-8 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00a2e8] h-[42px]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                {appliedSearch && (
                  <button onClick={() => { setAppliedSearch(''); setCurrentPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Active Filter Pill display */}
              <div className="flex items-center space-x-2 text-[10px]">
                {(appliedZone !== 'All' || appliedSearch || appliedEventType !== 'All') && (
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
                    <th onClick={() => handleEventSort('stt')} className="py-2.5 px-3 border-r border-[#21232d] text-center w-12 cursor-pointer hover:text-white select-none">
                      <div className="flex items-center justify-center space-x-1">
                        <span>STT</span>
                        {eventSortKey === 'stt' ? (eventSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                      </div>
                    </th>
                    <th onClick={() => handleEventSort('ten')} className="py-2.5 px-3 border-r border-[#21232d] text-left cursor-pointer hover:text-white select-none">
                      <div className="flex items-center justify-start space-x-1">
                        <span>Họ tên</span>
                        {eventSortKey === 'ten' ? (eventSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                      </div>
                    </th>
                    <th onClick={() => handleEventSort('ma')} className="py-2.5 px-3 border-r border-[#21232d] text-center cursor-pointer hover:text-white select-none">
                      <div className="flex items-center justify-center space-x-1">
                        <span>Mã nhân viên</span>
                        {eventSortKey === 'ma' ? (eventSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                      </div>
                    </th>
                    <th onClick={() => handleEventSort('danhSach')} className="py-2.5 px-3 border-r border-[#21232d] text-center cursor-pointer hover:text-white select-none">
                      <div className="flex items-center justify-center space-x-1">
                        <span>Phòng ban</span>
                        {eventSortKey === 'danhSach' ? (eventSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                      </div>
                    </th>
                    <th onClick={() => handleEventSort('vung')} className="py-2.5 px-3 border-r border-[#21232d] text-center cursor-pointer hover:text-white select-none">
                      <div className="flex items-center justify-center space-x-1">
                        <span>Khu vực</span>
                        {eventSortKey === 'vung' ? (eventSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                      </div>
                    </th>
                    <th onClick={() => handleEventSort('huong')} className="py-2.5 px-3 border-r border-[#21232d] text-center cursor-pointer hover:text-white select-none">
                      <div className="flex items-center justify-center space-x-1">
                        <span>Hướng</span>
                        {eventSortKey === 'huong' ? (eventSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                      </div>
                    </th>
                    <th onClick={() => handleEventSort('camera')} className="py-2.5 px-3 border-r border-[#21232d] text-center cursor-pointer hover:text-white select-none">
                      <div className="flex items-center justify-center space-x-1">
                        <span>Camera</span>
                        {eventSortKey === 'camera' ? (eventSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                      </div>
                    </th>
                    <th onClick={() => handleEventSort('thoiGian')} className="py-2.5 px-3 border-r border-[#21232d] text-center cursor-pointer hover:text-white select-none">
                      <div className="flex items-center justify-center space-x-1">
                        <span>Thời gian</span>
                        {eventSortKey === 'thoiGian' ? (eventSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                      </div>
                    </th>
                    <th onClick={() => handleEventSort('accuracy')} className="py-2.5 px-3 text-center cursor-pointer hover:text-white select-none">
                      <div className="flex items-center justify-center space-x-1">
                        <span>Độ chính xác (%)</span>
                        {eventSortKey === 'accuracy' ? (eventSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                      </div>
                    </th>
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
                          <div className="h-4 bg-[#1f202b] rounded-md w-24"></div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#21232d]">
                          <div className="h-4 bg-[#1f202b] rounded-md w-24"></div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#21232d]">
                          <div className="h-4 bg-[#1f202b] rounded-md w-24"></div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#21232d]">
                          <div className="h-4 bg-[#1f202b] rounded-md w-16"></div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#21232d]">
                          <div className="h-4 bg-[#1f202b] rounded-md w-24"></div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-[#21232d]">
                          <div className="h-4 bg-[#1f202b] rounded-md w-28"></div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="h-4 bg-[#1f202b] rounded-md w-20"></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    currentLogs.map((log) => {
                      const isSelected = selectedEventId === log.stt;
                      const isTranPhuocLoi = log.ma === "010203045567";
                      const areaSuffix = getAreaSuffix(log);
                      const huongText = areaSuffix === 'ra' ? 'Đi ra' : areaSuffix === 'vào' ? 'Đi vào' : (log.huong && log.huong.toLowerCase().includes('ra') ? 'Đi ra' : 'Đi vào');
                      const getAccuracyText = (logItem: EventLog) => {
                        const acc = logItem.accuracy;
                        const accStr = String(acc ?? '');
                        const isValidScore = acc !== undefined && acc !== null && accStr !== '' && accStr !== 'Không có dữ liệu';
                        return isValidScore
                          ? (typeof acc === 'number' ? `${acc}%` : accStr.includes('%') ? accStr : `${accStr}%`)
                          : 'Không có dữ liệu';
                      };
                      const accuracyDisplay = getAccuracyText(log);
                      return (
                        <tr
                          id={`event-row-${log.stt}`}
                          key={log.stt}
                          onClick={() => {
                            setSelectedEventId(log.stt);
                            setSelectedThumbIndex(0);
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
                          <td className={`py-2 px-3 border-r border-[#21232d] font-sans font-medium text-left ${isSelected ? 'text-white' : 'text-slate-100'}`}>
                            {log.ten}
                          </td>
                          <td className="py-2 px-3 border-r border-[#21232d] text-center text-slate-400">
                            {log.ma}
                          </td>
                          <td className={`py-2 px-3 border-r border-[#21232d] text-center font-sans ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {log.danhSach}
                          </td>
                          <td className={`py-2 px-3 border-r border-[#21232d] text-center ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {log.vung}
                          </td>
                          <td className={`py-2 px-3 border-r border-[#21232d] text-center font-sans ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {huongText}
                          </td>
                          <td className={`py-2 px-3 border-r border-[#21232d] text-center font-sans ${isSelected ? 'text-[#00a2e8] font-bold' : 'text-slate-300'}`}>
                            {resolveCameraName(log)}
                          </td>
                          <td className="py-2 px-3 border-r border-[#21232d] text-center text-slate-400">
                            {log.thoiGian}
                          </td>
                          <td className={`py-2 px-3 text-center font-sans ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                            {accuracyDisplay}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {!isLoadingLogs && currentLogs.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
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

                <div className="relative">
                  {/* Dropup menu - visible on click toggle */}
                  {isEventExportOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsEventExportOpen(false)}
                      />
                      <div className="absolute bottom-full right-0 pb-1 z-40 min-w-[170px]">
                        <div className="bg-[#1a1b25] border border-[#2d2f3e] rounded-lg shadow-xl overflow-hidden flex flex-col items-stretch">
                          <div className="px-3 py-1.5 bg-[#14151c] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-[#2d2f3e] text-left">
                            Xuất Excel
                          </div>
                          <button
                            id="btn-export-all"
                            onClick={async () => {
                              setIsEventExportOpen(false);
                              setExporting(true);
                              try {
                                const allData = await fetchAllEventLogs();
                                handleExportEventLogsExcel(allData);
                              } catch (e: any) {
                                alert("Lỗi khi tải dữ liệu: " + e.message);
                              } finally {
                                setExporting(false);
                              }
                            }}
                            disabled={exporting}
                            className="px-4 py-2 text-xs text-slate-200 hover:bg-[#00a2e8]/10 hover:text-[#00a2e8] flex items-center space-x-2 transition text-left whitespace-nowrap disabled:opacity-50 cursor-pointer"
                          >
                            <Download size={12} />
                            <span>Toàn bộ ({totalItems})</span>
                          </button>
                          <button
                            id="btn-export-page"
                            onClick={() => {
                              handleExportEventLogsExcel(currentLogs);
                              setIsEventExportOpen(false);
                            }}
                            disabled={exporting}
                            className="px-4 py-2 text-xs text-slate-200 hover:bg-[#00a2e8]/10 hover:text-[#00a2e8] flex items-center space-x-2 transition text-left whitespace-nowrap disabled:opacity-50 cursor-pointer"
                          >
                            <Download size={12} />
                            <span>Trong trang ({currentLogs.length})</span>
                          </button>

                          <div className="px-3 py-1.5 bg-[#14151c] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-y border-[#2d2f3e] text-left">
                            Xuất PDF
                          </div>
                          <button
                            onClick={async () => {
                              setIsEventExportOpen(false);
                              setExporting(true);
                              try {
                                const allData = await fetchAllEventLogs();
                                handleExportEventLogsPDF(allData);
                              } catch (e: any) {
                                alert("Lỗi khi tải dữ liệu: " + e.message);
                              } finally {
                                setExporting(false);
                              }
                            }}
                            disabled={exporting || isEventPdfExporting}
                            className="px-4 py-2 text-xs text-slate-200 hover:bg-[#00a2e8]/10 hover:text-[#00a2e8] flex items-center space-x-2 transition text-left whitespace-nowrap disabled:opacity-50 cursor-pointer"
                          >
                            <FileText size={12} />
                            <span>Toàn bộ ({totalItems})</span>
                          </button>
                          <button
                            onClick={() => {
                              handleExportEventLogsPDF(currentLogs);
                              setIsEventExportOpen(false);
                            }}
                            disabled={exporting || isEventPdfExporting}
                            className="px-4 py-2 text-xs text-slate-200 hover:bg-[#00a2e8]/10 hover:text-[#00a2e8] flex items-center space-x-2 transition text-left whitespace-nowrap disabled:opacity-50 cursor-pointer"
                          >
                            <FileText size={12} />
                            <span>Trong trang ({currentLogs.length})</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Main export trigger button */}
                  <button
                    id="btn-export-excel"
                    disabled={exporting}
                    onClick={() => setIsEventExportOpen(prev => !prev)}
                    className={`px-4 py-1.5 bg-[#00a2e8] hover:bg-[#008cc9] text-white font-medium rounded-lg text-xs transition shadow flex items-center space-x-1.5 ${exporting ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    <Download size={13} />
                    <span>{exporting ? 'Đang xuất...' : 'Xuất báo cáo'}</span>
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

                  {/* Thumbnail 4: Tải ảnh độ phân giải gốc từ BE */}
                  <button
                    onClick={() => handleDownloadEventImages(currentSelectedEvent)}
                    className="aspect-square rounded border border-[#2d2f3e] bg-[#1c1d24] hover:bg-[#252731] hover:border-[#00a2e8] flex flex-col items-center justify-center space-y-1 transition group"
                    title="Tải ảnh độ phân giải gốc từ server"
                  >
                    <Download size={18} className="text-slate-400 group-hover:text-[#00a2e8] transition" />
                    <span className="text-[9px] text-slate-400 group-hover:text-slate-200 transition text-center leading-tight">
                      Tải ảnh
                    </span>
                  </button>
                </div>

                {/* Dropdown Camera Select Block (Removed) */}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'attendance' ? (
        (() => {
          const isDaily = attendanceType === 'Báo cáo theo ngày';
          const isWeeklyOrMonthly = attendanceType === 'Báo cáo theo tuần' || attendanceType === 'Báo cáo theo tháng';
          const showRightSidebar = !isWeeklyOrMonthly;

          const selectedGroupNamesForFilter = attendanceGroups.map(gid => {
            const matched = humanGroups.find(g => g.id === gid);
            return matched ? matched.name.toLowerCase() : gid.toLowerCase();
          });

          // Daily roster: real employees from DB
          const activeRealEmployees = employees.filter(emp => {
            if (attendanceGroups.length === 0) return true;
            const groups: string[] = emp.human_group || [];
            return groups.some((g: string) => selectedGroupNamesForFilter.includes(g.toLowerCase()));
          });

          const dailyRoster = (() => {
            const mockScenarios = [
              { in: '07:22:15', out: '17:10:05' }, // TC01 - Đúng giờ
              { in: '07:46:20', out: '17:15:30' }, // TC02 - Đi muộn 16p
              { in: '08:45:00', out: '17:00:00' }, // TC03 - Đi muộn 1h15p
              { in: '07:25:10', out: '16:15:00' }, // TC04 - Về sớm 45p
              { in: '08:15:00', out: '16:30:00' }, // TC05 - Muộn & Về sớm
              { in: '07:28:40', out: 'Không có dữ liệu' }, // TC06 - Thiếu Check-out
              { in: 'Không có dữ liệu', out: '17:12:00' }, // TC07 - Thiếu Check-in
              { in: 'Không có dữ liệu', out: 'Không có dữ liệu' }, // TC08 - Vắng mặt
              { in: '07:18:00', out: '17:25:00' }, // TC09 - Đủ công
              { in: '07:30:00', out: '19:15:00' }, // TC10 - Tăng ca OT
            ];

            const roster = activeRealEmployees.map((emp: any, index: number) => {
              const match = dailyReportData.find((item: any) => item.employeeId === emp.id);
              let thoiGianVao = match ? ((match.thoiGianVao && match.thoiGianVao !== 'Trống') ? match.thoiGianVao : 'Không có dữ liệu') : 'Không có dữ liệu';
              let thoiGianRa = match ? ((match.thoiGianRa && match.thoiGianRa !== 'Trống') ? match.thoiGianRa : 'Không có dữ liệu') : 'Không có dữ liệu';
              const entryEvent = match ? (match.entryEvent || null) : null;
              const exitEvent = match ? (match.exitEvent || null) : null;

              const isMockDate = attendanceStartDate === '1970-01-01';
              if (!match && isMockDate) {
                const scenario = mockScenarios[index % mockScenarios.length];
                thoiGianVao = scenario.in;
                thoiGianRa = scenario.out;
              }

              const status = getAttendanceStatusBadge(thoiGianVao, thoiGianRa, customShiftStart, customShiftEnd);

              return {
                id: emp.id,
                ma: emp.maGiayTo || `NV${String(index + 1).padStart(3, '0')}`,
                ten: emp.hoTen || `Nhân sự ${index + 1}`,
                danhSach: (emp.human_group || []).join(', ') || 'Mặc định',
                thoiGianVao,
                thoiGianRa,
                entryEvent,
                exitEvent,
                status,
                totalHours: calculateWorkHours(thoiGianVao, thoiGianRa),
              };
            });

            return roster.sort((a, b) => {
              return getAttendancePriorityRank(a.thoiGianVao, a.thoiGianRa) - getAttendancePriorityRank(b.thoiGianVao, b.thoiGianRa);
            });
          })();

          // Range roster: from activeRealEmployees enriched by rangeReportData (weekly / monthly)
          const rangeRoster = activeRealEmployees.map((emp: any) => {
            const match = rangeReportData.find((item: any) => item.employeeId === emp.id);
            const th = match ? Math.round(match.totalHours * 100) / 100 : 0;
            return {
              id: emp.id,
              ma: emp.maGiayTo || '',
              ten: emp.hoTen || '',
              danhSach: (emp.human_group || []).join(', ') || 'Khách hàng / Khác',
              thoiGianVao: '',
              thoiGianRa: '',
              entryEvent: null,
              exitEvent: null,
              totalHours: `${th} h`,
              dailyLogs: match?.dailyLogs || [],
            };
          });

          const activeEmployees = isDaily ? dailyRoster : rangeRoster;
          const totalAttendanceItems = activeEmployees.length;
          const totalAttendancePages = Math.ceil(totalAttendanceItems / attendanceItemsPerPage) || 1;
          const paginatedActiveEmployees = activeEmployees.slice(
            (attendanceCurrentPage - 1) * attendanceItemsPerPage,
            attendanceCurrentPage * attendanceItemsPerPage
          );
          const selectedAttendee = activeEmployees.find(emp => emp.ma === selectedAttendanceEmpCode) || activeEmployees[0];

          return (
            <div className="flex-1 p-6 flex flex-col bg-[#0d0e12] overflow-y-auto space-y-6 relative min-h-[400px]">
              <div className={`flex flex-col space-y-6 flex-1 transition-all duration-300 ${!showAttendanceReportDemo ? 'blur-sm pointer-events-none select-none' : ''}`}>

                {/* REPORT BUILDER CONTROLS PANEL */}
                <div className="bg-[#14151b] border border-[#21232d] rounded-2xl p-6 shadow-2xl relative">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                    {/* Type Select */}
                    <div className="md:col-span-2 space-y-2 text-left relative">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Type</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAttTypeOpen(!isAttTypeOpen);
                            setIsAttGroupOpen(false);
                            setIsAttendanceAreaDropdownOpen(false);
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
                                'Báo cáo theo ngày',
                                'Báo cáo theo tuần',
                                'Báo cáo theo tháng',
                                // 'Late Arrivals & Early Leves',
                                // 'Absence & Leave Summary',
                                // 'Overtime Hours'
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

                    {/* Chọn nhóm Select (Multiselect) */}
                    <div className="md:col-span-2 space-y-2 text-left relative">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Chọn nhóm</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAttGroupOpen(!isAttGroupOpen);
                            setIsAttTypeOpen(false);
                            setIsAttendanceAreaDropdownOpen(false);
                            setIsAttExportOpen(false);
                          }}
                          className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl px-4 py-2.5 text-xs text-white text-left flex items-center justify-between transition-all focus:outline-none h-[42px]"
                        >
                          <span className="font-medium text-slate-200 truncate pr-1">
                            {(() => {
                              if (attendanceGroups.length === 0) return 'Tất cả (All)';
                              if (attendanceGroups.length === humanGroups.length) return `Tất cả (${humanGroups.length} Nhóm)`;
                              return humanGroups
                                .filter(g => attendanceGroups.includes(g.id))
                                .map(g => g.name)
                                .join(', ');
                            })()}
                          </span>
                          <ChevronDown size={14} className={`text-slate-400 transition-transform ${isAttGroupOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isAttGroupOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsAttGroupOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1.5 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 p-2 space-y-1 w-[220px]">
                              <div className="flex justify-between border-b border-[#2d2f3c]/60 pb-1.5 mb-1.5 px-1">
                                <button
                                  type="button"
                                  onClick={() => setAttendanceGroups(humanGroups.map(g => g.id))}
                                  className="text-[10px] text-[#00a2e8] hover:underline font-semibold"
                                >
                                  Chọn tất cả
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAttendanceGroups([])}
                                  className="text-[10px] text-slate-400 hover:underline font-semibold"
                                >
                                  Bỏ chọn
                                </button>
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {humanGroups.map((grp) => {
                                  const isChecked = attendanceGroups.includes(grp.id);
                                  return (
                                    <button
                                      key={grp.id}
                                      type="button"
                                      onClick={() => {
                                        if (isChecked) {
                                          setAttendanceGroups(attendanceGroups.filter(id => id !== grp.id));
                                        } else {
                                          setAttendanceGroups([...attendanceGroups, grp.id]);
                                        }
                                      }}
                                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs text-slate-200 hover:bg-[#20212a] transition cursor-pointer"
                                    >
                                      <span className="truncate mr-2">{grp.name}</span>
                                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${isChecked
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

                    {/* Khu vực Multiselect Select */}
                    <div className="md:col-span-2 space-y-2 text-left relative">
                      <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Khu vực</label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAttendanceAreaDropdownOpen(!isAttendanceAreaDropdownOpen);
                            setIsAttTypeOpen(false);
                            setIsAttGroupOpen(false);
                            setIsAttExportOpen(false);
                          }}
                          className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl px-4 py-2.5 text-xs text-white text-left flex items-center justify-between transition-all focus:outline-none h-[42px]"
                        >
                          <span className="truncate pr-1">
                            {(() => {
                              if (selectedAttendanceAreas.length === 0) return 'Chưa chọn';
                              if (selectedAttendanceAreas.length === areasData.length) return `Tất cả (${areasData.length} KV)`;
                              return selectedAttendanceAreas.join(', ');
                            })()}
                          </span>
                          <ChevronDown size={14} className={`text-slate-400 transition-transform ${isAttendanceAreaDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isAttendanceAreaDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsAttendanceAreaDropdownOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1.5 bg-[#181921] border border-[#2d2f3c] rounded-xl shadow-2xl z-40 p-2 space-y-1 w-[200px]">
                              <div className="flex justify-between border-b border-[#2d2f3c]/60 pb-1.5 mb-1.5 px-1">
                                <button
                                  type="button"
                                  onClick={() => setSelectedAttendanceAreas(areasData.map(a => a.name))}
                                  className="text-[10px] text-[#00a2e8] hover:underline font-semibold"
                                >
                                  Chọn tất cả
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedAttendanceAreas([])}
                                  className="text-[10px] text-slate-400 hover:underline font-semibold"
                                >
                                  Bỏ chọn
                                </button>
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {areasData.map((area) => {
                                  const areaName = area.name;
                                  const isChecked = selectedAttendanceAreas.includes(areaName);
                                  return (
                                    <button
                                      key={area.id}
                                      type="button"
                                      onClick={() => {
                                        if (isChecked) {
                                          setSelectedAttendanceAreas(selectedAttendanceAreas.filter(a => a !== areaName));
                                        } else {
                                          setSelectedAttendanceAreas([...selectedAttendanceAreas, areaName]);
                                        }
                                      }}
                                      className="w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-xs text-slate-200 hover:bg-[#20212a] transition cursor-pointer"
                                    >
                                      <span className="truncate mr-2">{areaName}</span>
                                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${isChecked
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

                    {/* Conditional Date Filter rendering */}
                    {attendanceType === 'Báo cáo theo ngày' ? (
                      /* Single Date Selector for Daily Summary */
                      <div className="md:col-span-4 space-y-2 text-left relative">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Chọn ngày</label>
                        <div className="relative">
                          <input
                            type="date"
                            value={attendanceStartDate}
                            onChange={(e) => {
                              setAttendanceStartDate(e.target.value);
                              setAttendanceEndDate(e.target.value);
                            }}
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] focus:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-all h-[42px] [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    ) : attendanceType === 'Báo cáo theo tuần' ? (
                      /* Week Selector for Weekly Summary */
                      <div className="md:col-span-4 space-y-2 text-left relative">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Chọn tuần</label>
                        <div className="flex items-center space-x-2 h-[42px]">
                          {/* Week selector container */}
                          <div className="flex items-center space-x-1 bg-[#1c1d26] border border-[#2d2f3c] rounded-xl overflow-hidden h-full px-2">
                            <span className="text-xs text-slate-400 font-semibold pr-1">Tuần</span>
                            <button
                              type="button"
                              onClick={() => setAttendanceWeekNumber(prev => Math.max(1, prev - 1))}
                              className="p-1 hover:bg-[#20212a] text-slate-400 hover:text-[#00a2e8] rounded transition-colors"
                              title="Tuần trước"
                            >
                              <ChevronDown size={14} className="rotate-90" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={53}
                              value={attendanceWeekNumber}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(53, parseInt(e.target.value, 10) || 1));
                                setAttendanceWeekNumber(val);
                              }}
                              className="w-10 bg-transparent text-xs text-white text-center font-mono focus:outline-none [&::-webkit-outer-spin-button]:[appearance:none] [&::-webkit-inner-spin-button]:[appearance:none] [&]:[-moz-appearance:textfield]"
                            />
                            <button
                              type="button"
                              onClick={() => setAttendanceWeekNumber(prev => Math.min(53, prev + 1))}
                              className="p-1 hover:bg-[#20212a] text-slate-400 hover:text-[#00a2e8] rounded transition-colors"
                              title="Tuần sau"
                            >
                              <ChevronDown size={14} className="-rotate-90" />
                            </button>
                          </div>

                          {/* Year Selector */}
                          <div className="flex items-center bg-[#1c1d26] border border-[#2d2f3c] rounded-xl px-2 h-full flex-1">
                            <span className="text-xs text-slate-400 font-semibold pr-2">Năm</span>
                            <input
                              type="number"
                              min={2000}
                              max={2100}
                              value={attendanceYear}
                              onChange={(e) => {
                                const val = Math.max(2000, Math.min(2100, parseInt(e.target.value, 10) || 2026));
                                setAttendanceYear(val);
                              }}
                              className="w-full bg-transparent text-xs text-white text-center font-mono focus:outline-none h-full"
                            />
                          </div>
                        </div>
                      </div>
                    ) : attendanceType === 'Báo cáo theo tháng' ? (
                      /* Month Selector for Monthly Summary */
                      <div className="md:col-span-4 space-y-2 text-left relative">
                        <label className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">Chọn tháng</label>
                        <div className="flex items-center space-x-2 h-[42px]">
                          {/* Month selector container */}
                          <div className="flex items-center bg-[#1c1d26] border border-[#2d2f3c] rounded-xl px-2 h-full flex-1">
                            <span className="text-xs text-slate-400 font-semibold pr-2">Tháng</span>
                            <select
                              value={attendanceMonthNumber}
                              onChange={(e) => setAttendanceMonthNumber(Number(e.target.value))}
                              className="w-full bg-transparent text-xs text-white focus:outline-none h-full appearance-none cursor-pointer font-mono"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m} className="bg-[#181921] text-white">
                                  {m}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="text-slate-400 shrink-0 pointer-events-none ml-1" />
                          </div>

                          {/* Year Selector */}
                          <div className="flex items-center bg-[#1c1d26] border border-[#2d2f3c] rounded-xl px-2 h-full flex-1">
                            <span className="text-xs text-slate-400 font-semibold pr-2">Năm</span>
                            <input
                              type="number"
                              min={2000}
                              max={2100}
                              value={attendanceYear}
                              onChange={(e) => {
                                const val = Math.max(2000, Math.min(2100, parseInt(e.target.value, 10) || 2026));
                                setAttendanceYear(val);
                              }}
                              className="w-full bg-transparent text-xs text-white text-center font-mono focus:outline-none h-full"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}

                    {/* Combined Export Split Button (XLSX Dropdown) & Expand Shift Settings */}
                    <div className="md:col-span-2 flex items-center justify-end space-x-2 relative h-[42px]">
                      {attendanceType === 'Báo cáo theo ngày' && (
                        <div className="relative shrink-0 h-full">
                          <button
                            type="button"
                            onClick={() => setIsExpandShiftOpen(!isExpandShiftOpen)}
                            className={`h-full px-3 border rounded-xl flex items-center space-x-1.5 text-xs font-semibold transition-all cursor-pointer ${isExpandShiftOpen
                              ? 'bg-[#00a2e8]/15 text-[#00a2e8] border-[#00a2e8]'
                              : 'bg-[#1c1d26] text-slate-300 border-[#2d2f3c] hover:bg-[#252735] hover:text-white'
                              }`}
                            title="Tùy chỉnh giờ ca làm & mở/đóng cổng"
                          >
                            {/* <SlidersHorizontal size={13} /> */}
                            <span>Ca làm</span>
                            <ChevronDown size={12} className={`transition-transform duration-200 ${isExpandShiftOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isExpandShiftOpen && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setIsExpandShiftOpen(false)} />
                              <div className="absolute right-0 top-full mt-2 w-72 bg-[#181922] border border-[#2d2f3c] rounded-xl shadow-2xl p-3.5 z-40 text-left space-y-3 font-sans">
                                <div className="text-[11px] font-bold text-[#00a2e8] uppercase tracking-wider flex items-center justify-between border-b border-[#292b3a] pb-2">
                                  <span>Cấu hình Ca & Grace time</span>
                                  <button onClick={() => setIsExpandShiftOpen(false)} className="text-slate-400 hover:text-white">
                                    <X size={14} />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">Giờ bắt đầu ca</label>
                                    <input
                                      type="text"
                                      value={customShiftStart}
                                      onChange={(e) => setCustomShiftStart(e.target.value)}
                                      placeholder="07:30"
                                      className="w-full bg-[#111218] border border-[#2d2f3c] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00a2e8] font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-400 block mb-1">Giờ kết thúc ca</label>
                                    <input
                                      type="text"
                                      value={customShiftEnd}
                                      onChange={(e) => setCustomShiftEnd(e.target.value)}
                                      placeholder="17:00"
                                      className="w-full bg-[#111218] border border-[#2d2f3c] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00a2e8] font-mono"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-1">Thời gian mở/đóng cổng (Grace time - giờ)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={12}
                                    value={customBufferHours}
                                    onChange={(e) => setCustomBufferHours(parseInt(e.target.value, 10) || 0)}
                                    className="w-full bg-[#111218] border border-[#2d2f3c] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00a2e8] font-mono"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex h-full w-full rounded-xl overflow-hidden shadow-lg border border-[#2d2f3c] bg-[#1c1d26]">
                        <button
                          type="button"
                          onClick={() => {
                            handleExportAttendance(attendanceExportFormat, activeEmployees);
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
                                setAttendanceExportFormat('XLSX');
                                setIsAttExportOpen(false);
                                handleExportAttendance('XLSX', activeEmployees);
                              }}
                              className="w-full text-left px-4 py-2 text-xs transition-colors hover:bg-[#20212a] flex items-center justify-between text-slate-300 hover:text-white"
                            >
                              <span>Xuất tệp Excel (.xlsx)</span>
                              {attendanceExportFormat === 'XLSX' && <Check size={14} className="text-[#00a2e8]" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAttendanceExportFormat('PDF');
                                setIsAttExportOpen(false);
                                handleExportAttendance('PDF', activeEmployees);
                              }}
                              className="w-full text-left px-4 py-2 text-xs transition-colors hover:bg-[#20212a] flex items-center justify-between text-slate-300 hover:text-white"
                            >
                              <span>Xuất tệp PDF (.pdf)</span>
                              {attendanceExportFormat === 'PDF' && <Check size={14} className="text-[#00a2e8]" />}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* HIGH FIDELITY REPORT TABLE */}
                {(attendanceType === 'Báo cáo theo tuần' || attendanceType === 'Báo cáo theo tháng') && selectedWeeklyAttendee ? (
                  /* Weekly/Monthly Details Sub-view Page */
                  <div className="bg-[#14151b] border border-[#21232d] rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-1">
                    {/* Header */}
                    <div className="p-4 bg-[#181921] border-b border-[#21232d] flex items-center justify-between gap-3 shrink-0">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => setSelectedWeeklyAttendee(null)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#20212a] hover:bg-[#2d2f3e] border border-[#2d2f3c] text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer focus:outline-none"
                        >
                          <ArrowLeft size={13} />
                          <span>Quay lại</span>
                        </button>
                        <div className="h-6 w-px bg-[#2d2f3c] mx-1" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">
                            Chi tiết chấm công {attendanceType === 'Báo cáo theo tuần' ? 'tuần' : 'tháng'}: <span className="text-[#00a2e8]">{selectedWeeklyAttendee.ten}</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Mã NV: {selectedWeeklyAttendee.ma} • Nhóm: {selectedWeeklyAttendee.danhSach} • {attendanceType === 'Báo cáo theo tuần' ? `Tuần ${attendanceWeekNumber}` : `Tháng ${attendanceMonthNumber}`} ({attendanceStartDate} - {attendanceEndDate})
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Body (Split columns) */}
                    {(() => {
                      const isWeekly = attendanceType === 'Báo cáo theo tuần';
                      const daysOfWeekNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

                      // Use real dailyLogs from API if available
                      const realLogs = (selectedWeeklyAttendee.dailyLogs || []).map((log: any) => {
                        const d = new Date(log.date);
                        const dayName = daysOfWeekNames[d.getDay()];
                        return {
                          dayName,
                          dateStr: log.date,
                          checkIn: (log.thoiGianVao && log.thoiGianVao !== 'Trống' && log.thoiGianVao !== 'Không có dữ liệu') ? log.thoiGianVao : 'Không có dữ liệu',
                          checkOut: (log.thoiGianRa && log.thoiGianRa !== 'Trống' && log.thoiGianRa !== 'Không có dữ liệu') ? log.thoiGianRa : 'Không có dữ liệu',
                          totalHours: log.hours ? `${Math.round(log.hours * 100) / 100} h` : '0 h',
                          entryEvent: log.entryEvent || null,
                          exitEvent: log.exitEvent || null,
                        };
                      });

                      const isMockDate = attendanceStartDate === '1970-01-01';
                      const logs = realLogs.length > 0
                        ? realLogs
                        : (isWeekly
                          ? generateWeeklyLogs(selectedWeeklyAttendee.ma, attendanceStartDate, isMockDate)
                          : generateMonthlyLogs(selectedWeeklyAttendee.ma, attendanceMonthNumber, attendanceYear, isMockDate));
                      const activeLog = logs.find(log => log.dateStr === selectedDetailDayStr) || logs[0];

                      return (
                        <div className="flex-1 flex overflow-hidden min-h-[350px]">
                          {/* Left Column: Days list */}
                          <div className="flex-1 overflow-auto border-r border-[#21232d]/40">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#15161f] border-b border-[#21232d] text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                  <th className="py-3 px-4">Thứ / Ngày</th>
                                  <th className="py-3 px-4">Làm lúc</th>
                                  <th className="py-3 px-4">Đến lúc</th>
                                  <th className="py-3 px-4 text-center">Tổng giờ ngày</th>
                                  <th className="py-3 px-4 text-center">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                                {logs.map((log) => {
                                  const isSelected = activeLog.dateStr === log.dateStr;
                                  const hasNoLog = !log.checkIn || log.checkIn === 'Trống' || log.checkIn === 'Không có dữ liệu';

                                  return (
                                    <tr
                                      key={log.dateStr}
                                      onClick={() => setSelectedDetailDayStr(log.dateStr)}
                                      className={`cursor-pointer transition-colors ${isSelected
                                        ? 'bg-[#00a2e8]/10 text-[#00a2e8] hover:bg-[#00a2e8]/15 font-medium'
                                        : 'hover:bg-[#181921]/60 odd:bg-[#0e0f14] even:bg-[#101117] text-slate-300'
                                        }`}
                                    >
                                      <td className={`py-3 px-4 font-sans font-medium ${isSelected ? 'text-[#00a2e8]' : 'text-slate-100'}`}>
                                        {log.dayName} <span className="text-[10px] text-slate-500 font-mono ml-1">({log.dateStr.split('-').reverse().slice(0, 2).join('/')})</span>
                                      </td>
                                      <td className={`py-3 px-4 ${hasNoLog ? 'text-slate-500' : 'text-slate-300'}`}>
                                        {formatTimeOnly(log.checkIn)}
                                      </td>
                                      <td className={`py-3 px-4 ${hasNoLog ? 'text-slate-500' : 'text-slate-300'}`}>
                                        {formatTimeOnly(log.checkOut)}
                                      </td>
                                      <td className={`py-3 px-4 text-center font-semibold ${hasNoLog ? 'text-slate-500' : 'text-emerald-400'}`}>
                                        {log.totalHours}
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        {hasNoLog ? (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-sans font-medium bg-slate-500/10 text-slate-500 border border-slate-500/10">Nghỉ</span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded text-[9px] font-sans font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Có mặt</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Right Column: Camera photos for selected day */}
                          <div className="w-80 bg-[#14151c]/95 flex flex-col shrink-0 overflow-y-auto border-l border-[#21232d]/40">
                            {activeLog && activeLog.checkIn !== 'Trống' && activeLog.checkIn !== 'Không có dữ liệu' ? (
                              <div className="p-4 space-y-4 text-left">
                                <div className="pb-3 border-b border-[#2d2f3c]/60">
                                  <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                                    Ảnh Camera - {activeLog.dayName}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    Ngày: {activeLog.dateStr.split('-').reverse().join('/')}
                                  </p>
                                </div>

                                {/* Entry Photo */}
                                <AttendanceEventImageSlider
                                  title="Ảnh lúc vào"
                                  event={activeLog.entryEvent}
                                  emp={selectedWeeklyAttendee}
                                />

                                {/* Exit Photo */}
                                <AttendanceEventImageSlider
                                  title="Ảnh lúc ra"
                                  event={activeLog.exitEvent}
                                  emp={selectedWeeklyAttendee}
                                />
                              </div>
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                                <Clock size={28} className="text-slate-600 animate-pulse" />
                                <p className="text-xs">Không có dữ liệu camera</p>
                                <p className="text-[10px] text-slate-600 max-w-[200px]">Nhân viên không có bản ghi ra vào trong ngày {activeLog ? activeLog.dayName : 'này'}.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* HIGH FIDELITY REPORT TABLE */
                  <div className="bg-[#14151b] border border-[#21232d] rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-1">
                    <div className="p-4 bg-[#181921] border-b border-[#21232d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-[#00a2e8]/10 border border-[#00a2e8]/20 text-[#00a2e8]">
                          <FileText size={15} />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Dữ liệu Báo cáo: {attendanceType}</h4>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {attendanceType === 'Báo cáo theo ngày'
                              ? `Ngày: ${attendanceStartDate}`
                              : `Từ ${attendanceStartDate} đến ${attendanceEndDate}`
                            } • Nhóm: {attendanceGroups.length === 0 ? 'Tất cả' : humanGroups.filter(g => attendanceGroups.includes(g.id)).map(g => g.name).join(', ')}
                          </p>
                        </div>
                      </div>
                      {(() => {
                        const isDaily = attendanceType === 'Báo cáo theo ngày';
                        const isRange = attendanceType === 'Báo cáo theo tuần' || attendanceType === 'Báo cáo theo tháng';
                        let activeCount = activeRealEmployees.length;

                        if (isRange) {
                          let totalGood = 0;
                          let totalLate = 0;
                          let totalEarly = 0;
                          let totalAbsent = 0;
                          activeRealEmployees.forEach((emp: any) => {
                            const rangeItem = rangeReportData.find((r: any) => r.employeeId === emp.ma || r.employeeId === emp.id);
                            const st = computeRangeStats(rangeItem || emp);
                            totalGood += st.good;
                            totalLate += st.late;
                            totalEarly += st.early;
                            totalAbsent += st.absent;
                          });

                          return (
                            <div className="flex items-center space-x-3 text-[11px] font-mono">
                              <div className="text-slate-400">
                                Nhân sự: <span className="text-white font-bold">{activeCount}</span>
                              </div>
                              <div className="text-emerald-400">
                                Hoàn thành tốt: <span className="font-bold">{totalGood}</span>
                              </div>
                              <div className="text-amber-400">
                                Đi trễ: <span className="font-bold">{totalLate}</span>
                              </div>
                              <div className="text-amber-400">
                                Về sớm: <span className="font-bold">{totalEarly}</span>
                              </div>
                              <div className="text-rose-400">
                                Vắng: <span className="font-bold">{totalAbsent}</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="text-[11px] font-mono text-slate-400">
                            Nhân sự: <span className="text-white font-bold font-mono">{activeCount}</span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex-1 flex overflow-hidden min-h-[300px]">
                      {/* Left Table Section */}
                      <div className={`flex-1 overflow-auto ${showRightSidebar ? 'border-r border-[#21232d]/40' : ''}`}>
                        <table className="w-full text-left border-collapse">
                          {(() => {
                            if (attendanceType === 'Báo cáo theo ngày' || attendanceType === 'Báo cáo theo tuần' || attendanceType === 'Báo cáo theo tháng') {
                              return (
                                <>
                                  <thead>
                                    <tr className="bg-[#15161f] border-b border-[#21232d] text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                      <th onClick={() => handleAttSort('stt')} className="py-3 px-4 text-center w-12 cursor-pointer hover:text-white select-none">
                                        <div className="flex items-center justify-center space-x-1">
                                          <span>STT</span>
                                          {attSortKey === 'stt' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                        </div>
                                      </th>
                                      <th onClick={() => handleAttSort('ma')} className="py-3 px-4 text-center cursor-pointer hover:text-white select-none">
                                        <div className="flex items-center justify-center space-x-1">
                                          <span>Mã NV</span>
                                          {attSortKey === 'ma' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                        </div>
                                      </th>
                                      <th onClick={() => handleAttSort('ten')} className="py-3 px-4 text-left cursor-pointer hover:text-white select-none">
                                        <div className="flex items-center justify-start space-x-1">
                                          <span>Họ và Tên</span>
                                          {attSortKey === 'ten' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                        </div>
                                      </th>
                                      <th onClick={() => handleAttSort('danhSach')} className="py-3 px-4 text-center cursor-pointer hover:text-white select-none">
                                        <div className="flex items-center justify-center space-x-1">
                                          <span>Phòng ban</span>
                                          {attSortKey === 'danhSach' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                        </div>
                                      </th>
                                      {!isWeeklyOrMonthly && (
                                        <th onClick={() => handleAttSort('thoiGianVao')} className="py-3 px-4 text-center cursor-pointer hover:text-white select-none">
                                          <div className="flex items-center justify-center space-x-1">
                                            <span>Giờ Vào</span>
                                            {attSortKey === 'thoiGianVao' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                          </div>
                                        </th>
                                      )}
                                      {!isWeeklyOrMonthly && (
                                        <th onClick={() => handleAttSort('thoiGianRa')} className="py-3 px-4 text-center cursor-pointer hover:text-white select-none">
                                          <div className="flex items-center justify-center space-x-1">
                                            <span>Giờ Ra</span>
                                            {attSortKey === 'thoiGianRa' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                          </div>
                                        </th>
                                      )}
                                      <th onClick={() => handleAttSort('totalHours')} className="py-3 px-4 text-center cursor-pointer hover:text-white select-none">
                                        <div className="flex items-center justify-center space-x-1">
                                          <span>Tổng giờ</span>
                                          {attSortKey === 'totalHours' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                        </div>
                                      </th>
                                      {isWeeklyOrMonthly && (
                                        <th onClick={() => handleAttSort('good')} className="py-3 px-4 text-center cursor-pointer hover:text-white select-none">
                                          <div className="flex items-center justify-center space-x-1">
                                            <span>Hoàn thành tốt</span>
                                            {attSortKey === 'good' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                          </div>
                                        </th>
                                      )}
                                      {isWeeklyOrMonthly && (
                                        <th onClick={() => handleAttSort('late')} className="py-3 px-4 text-center cursor-pointer hover:text-white select-none">
                                          <div className="flex items-center justify-center space-x-1">
                                            <span>Đi trễ</span>
                                            {attSortKey === 'late' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                          </div>
                                        </th>
                                      )}
                                      {isWeeklyOrMonthly && (
                                        <th onClick={() => handleAttSort('early')} className="py-3 px-4 text-center cursor-pointer hover:text-white select-none">
                                          <div className="flex items-center justify-center space-x-1">
                                            <span>Về sớm</span>
                                            {attSortKey === 'early' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                          </div>
                                        </th>
                                      )}
                                      {isWeeklyOrMonthly && (
                                        <th onClick={() => handleAttSort('absent')} className="py-3 px-4 text-center cursor-pointer hover:text-white select-none">
                                          <div className="flex items-center justify-center space-x-1">
                                            <span>Vắng</span>
                                            {attSortKey === 'absent' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                          </div>
                                        </th>
                                      )}
                                      {!isWeeklyOrMonthly && (
                                        <th onClick={() => handleAttSort('status')} className="py-3 px-4 text-center cursor-pointer hover:text-white select-none">
                                          <div className="flex items-center justify-center space-x-1">
                                            <span>Trạng thái</span>
                                            {attSortKey === 'status' ? (attSortDir === 'asc' ? <ArrowUp size={11} className="text-[#00a2e8]" /> : <ArrowDown size={11} className="text-[#00a2e8]" />) : <ArrowUpDown size={11} className="text-slate-600 opacity-40 hover:opacity-100" />}
                                          </div>
                                        </th>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                                    {paginatedActiveEmployees.map((emp, idx) => {
                                      const isSelected = selectedAttendee && selectedAttendee.ma === emp.ma;
                                      const stt = (attendanceCurrentPage - 1) * attendanceItemsPerPage + idx + 1;
                                      const rangeStats = computeRangeStats(emp);
                                      return (
                                        <tr
                                          key={emp.ma}
                                          onClick={() => {
                                            if (isWeeklyOrMonthly) {
                                              setSelectedWeeklyAttendee(emp);
                                              setSelectedDetailDayStr(attendanceStartDate);
                                            } else {
                                              setSelectedAttendanceEmpCode(emp.ma);
                                            }
                                          }}
                                          className={`cursor-pointer transition-colors ${isSelected && !isWeeklyOrMonthly
                                            ? 'bg-[#00a2e8]/10 text-[#00a2e8] hover:bg-[#00a2e8]/15 font-medium'
                                            : 'hover:bg-[#181921]/60 odd:bg-[#0e0f14] even:bg-[#101117] text-slate-300'
                                            }`}
                                        >
                                          <td className="py-2.5 px-4 text-center text-slate-500 font-semibold">{stt}</td>
                                          <td className="py-2.5 px-4 text-center text-slate-400 font-normal">{emp.ma}</td>
                                          <td className={`py-2.5 px-4 font-sans font-medium ${(isSelected && !isWeeklyOrMonthly) ? 'text-[#00a2e8]' : 'text-slate-100'}`}>{emp.ten}</td>
                                          <td className="py-2.5 px-4 text-center font-sans">{emp.danhSach}</td>
                                          {!isWeeklyOrMonthly && <td className="py-2.5 px-4 text-center text-emerald-400 font-semibold">{emp.thoiGianVao && emp.thoiGianVao !== 'Trống' && emp.thoiGianVao !== 'Không có dữ liệu' ? formatTimeOnly(emp.thoiGianVao) : <span className="text-slate-600">Không có dữ liệu</span>}</td>}
                                          {!isWeeklyOrMonthly && <td className="py-2.5 px-4 text-center text-emerald-400 font-semibold">{emp.thoiGianRa && emp.thoiGianRa !== 'Trống' && emp.thoiGianRa !== 'Không có dữ liệu' ? formatTimeOnly(emp.thoiGianRa) : <span className="text-slate-600">Không có dữ liệu</span>}</td>}
                                          <td className="py-2.5 px-4 text-center text-white font-bold">{emp.totalHours || '0 h'}</td>
                                          {isWeeklyOrMonthly && <td className="py-2.5 px-4 text-center text-emerald-400 font-bold">{rangeStats.good}</td>}
                                          {isWeeklyOrMonthly && <td className="py-2.5 px-4 text-center text-amber-400 font-bold">{rangeStats.late}</td>}
                                          {isWeeklyOrMonthly && <td className="py-2.5 px-4 text-center text-amber-400 font-bold">{rangeStats.early}</td>}
                                          {isWeeklyOrMonthly && <td className="py-2.5 px-4 text-center text-rose-400 font-bold">{rangeStats.absent}</td>}
                                          {!isWeeklyOrMonthly && (
                                            <td className="py-2.5 px-4 text-center">
                                              {emp.status ? (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold border ${emp.status.style}`}>
                                                  {emp.status.text}
                                                </span>
                                              ) : (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold border bg-slate-500/10 text-slate-400 border-slate-500/20">
                                                  -
                                                </span>
                                              )}
                                            </td>
                                          )}
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
                                      <th className="py-3 px-4 text-center">Mã NV</th>
                                      <th className="py-3 px-4">Họ và Tên</th>
                                      <th className="py-3 px-4 text-center">Nhóm / nhóm nhân viên</th>
                                      <th className="py-3 px-4 text-center">Ngày</th>
                                      <th className="py-3 px-4 text-center">Giờ Vào Thực Tế</th>
                                      <th className="py-3 px-4 text-center">Đi muộn</th>
                                      <th className="py-3 px-4 text-center">Về Sớm</th>
                                      <th className="py-3 px-4 text-center">Lý do</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                                    {activeEmployees.slice(0, 3).map((emp, idx) => {
                                      const isSelected = selectedAttendee && selectedAttendee.ma === emp.ma;
                                      return (
                                        <tr
                                          key={emp.ma}
                                          onClick={() => setSelectedAttendanceEmpCode(emp.ma)}
                                          className={`cursor-pointer transition-colors ${isSelected
                                            ? 'bg-[#00a2e8]/10 text-[#00a2e8] hover:bg-[#00a2e8]/15 font-medium'
                                            : 'hover:bg-[#181921]/60 odd:bg-[#0e0f14] even:bg-[#101117] text-slate-300'
                                            }`}
                                        >
                                          <td className="py-2.5 px-4 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                          <td className="py-2.5 px-4 text-center text-amber-500 font-bold">{emp.ma}</td>
                                          <td className={`py-2.5 px-4 font-sans font-medium ${isSelected ? 'text-[#00a2e8]' : 'text-slate-100'}`}>{emp.ten}</td>
                                          <td className="py-2.5 px-4 text-center font-sans">{emp.danhSach}</td>
                                          <td className="py-2.5 px-4 text-center text-slate-400">09/07/2026</td>
                                          <td className="py-2.5 px-4 text-center text-rose-400 font-bold">08:15:32</td>
                                          <td className="py-2.5 px-4 text-center text-rose-400 font-bold">15 phút</td>
                                          <td className="py-2.5 px-4 text-center text-slate-400">0 phút</td>
                                          <td className="py-2.5 px-4 text-center font-sans">Kẹt xe</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </>
                              );
                            } else if (attendanceType === 'Absence & Leave Summary') {
                              return (
                                <>
                                  <thead>
                                    <tr className="bg-[#15161f] border-b border-[#21232d] text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                                      <th className="py-3 px-4 text-center w-12">STT</th>
                                      <th className="py-3 px-4 text-center">Mã NV</th>
                                      <th className="py-3 px-4">Họ và Tên</th>
                                      <th className="py-3 px-4 text-center">Nhóm / nhóm nhân viên</th>
                                      <th className="py-3 px-4 text-center">Nghỉ phép</th>
                                      <th className="py-3 px-4 text-center">Không phép</th>
                                      <th className="py-3 px-4 text-center">Nghỉ lễ</th>
                                      <th className="py-3 px-4 text-center">Tổng ngày nghỉ</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                                    {activeEmployees.slice(2, 5).map((emp, idx) => {
                                      const isSelected = selectedAttendee && selectedAttendee.ma === emp.ma;
                                      return (
                                        <tr
                                          key={emp.ma}
                                          onClick={() => setSelectedAttendanceEmpCode(emp.ma)}
                                          className={`cursor-pointer transition-colors ${isSelected
                                            ? 'bg-[#00a2e8]/10 text-[#00a2e8] hover:bg-[#00a2e8]/15 font-medium'
                                            : 'hover:bg-[#181921]/60 odd:bg-[#0e0f14] even:bg-[#101117] text-slate-300'
                                            }`}
                                        >
                                          <td className="py-2.5 px-4 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                          <td className="py-2.5 px-4 text-center text-amber-500 font-bold">{emp.ma}</td>
                                          <td className={`py-2.5 px-4 font-sans font-medium ${isSelected ? 'text-[#00a2e8]' : 'text-slate-100'}`}>{emp.ten}</td>
                                          <td className="py-2.5 px-4 text-center font-sans">{emp.danhSach}</td>
                                          <td className="py-2.5 px-4 text-center text-emerald-400">1.0</td>
                                          <td className="py-2.5 px-4 text-center text-slate-400">0.0</td>
                                          <td className="py-2.5 px-4 text-center text-slate-400">0.0</td>
                                          <td className="py-2.5 px-4 text-center text-white font-bold">1.0 ngày</td>
                                        </tr>
                                      );
                                    })}
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
                                      <th className="py-3 px-4 text-center">Mã NV</th>
                                      <th className="py-3 px-4">Họ và Tên</th>
                                      <th className="py-3 px-4 text-center">Nhóm / nhóm nhân viên</th>
                                      <th className="py-3 px-4 text-center">Ngày</th>
                                      <th className="py-3 px-4 text-center">Giờ ra chuẩn</th>
                                      <th className="py-3 px-4 text-center">Giờ ra thực tế</th>
                                      <th className="py-3 px-4 text-center">Số giờ OT</th>
                                      <th className="py-3 px-4 text-center">Phê duyệt</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                                    {activeEmployees.map((emp, idx) => {
                                      const isPhuc = emp.ma === "080203011585";
                                      const isSelected = selectedAttendee && selectedAttendee.ma === emp.ma;
                                      return (
                                        <tr
                                          key={emp.ma}
                                          onClick={() => setSelectedAttendanceEmpCode(emp.ma)}
                                          className={`cursor-pointer transition-colors ${isSelected
                                            ? 'bg-[#00a2e8]/10 text-[#00a2e8] hover:bg-[#00a2e8]/15 font-medium'
                                            : 'hover:bg-[#181921]/60 odd:bg-[#0e0f14] even:bg-[#101117] text-slate-300'
                                            }`}
                                        >
                                          <td className="py-2.5 px-4 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                          <td className="py-2.5 px-4 text-center text-amber-500 font-bold">{emp.ma}</td>
                                          <td className={`py-2.5 px-4 font-sans font-medium ${isSelected ? 'text-[#00a2e8]' : 'text-slate-100'}`}>{emp.ten}</td>
                                          <td className="py-2.5 px-4 text-center font-sans">{emp.danhSach}</td>
                                          <td className="py-2.5 px-4 text-center text-slate-400">09/07/2026</td>
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

                      {/* Right Sidebar Details Panel */}
                      {showRightSidebar && (
                        <div className="w-72 bg-[#14151c]/95 flex flex-col shrink-0 overflow-y-auto border-l border-[#21232d]/40">
                          {selectedAttendee ? (
                            <div className="p-4 space-y-4 text-left">
                              {/* Entry Section */}
                              <AttendanceEventImageSlider
                                title="Ảnh lúc vào"
                                event={selectedAttendee.entryEvent}
                                emp={selectedAttendee}
                              />

                              {/* Exit Section */}
                              <AttendanceEventImageSlider
                                title="Ảnh lúc ra"
                                event={selectedAttendee.exitEvent}
                                emp={selectedAttendee}
                              />
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                              Chọn nhân sự để xem chi tiết
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pagination Bar for Attendance Report Table */}
                    <div className="h-14 bg-[#14151c] border-t border-[#21232d] px-4 flex items-center justify-between shrink-0">
                      {/* Left: items-per-page selector */}
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <button
                            onClick={() => setIsAttendancePerPageOpen(prev => !prev)}
                            className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#1f202b] rounded hover:bg-[#2c2d3c] text-slate-300 hover:text-white transition text-xs font-mono"
                            title="Số hàng mỗi trang"
                          >
                            <span>{attendanceItemsPerPage} / trang</span>
                            <ChevronDown size={11} className={`transition-transform duration-150 ${isAttendancePerPageOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isAttendancePerPageOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setIsAttendancePerPageOpen(false)}
                              />
                              <div className="absolute bottom-full left-0 mb-1 z-40 bg-[#1a1b25] border border-[#2d2f3e] rounded-lg shadow-xl overflow-hidden">
                                {PER_PAGE_OPTIONS.map(opt => (
                                  <button
                                    key={opt}
                                    onClick={() => {
                                      setAttendanceItemsPerPage(opt);
                                      setAttendanceCurrentPage(1);
                                      setIsAttendancePerPageOpen(false);
                                    }}
                                    className={`w-full px-5 py-1.5 text-xs text-left transition whitespace-nowrap ${opt === attendanceItemsPerPage
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

                      {/* Pagination: << < Page 1/N > >> */}
                      <div className="flex items-center space-x-1.5 font-mono text-xs">
                        <button
                          onClick={() => setAttendanceCurrentPage(1)}
                          disabled={attendanceCurrentPage === 1}
                          className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition"
                        >
                          <ChevronsLeft size={16} />
                        </button>
                        <button
                          onClick={() => setAttendanceCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={attendanceCurrentPage === 1}
                          className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs flex items-center"
                        >
                          <ChevronLeft size={16} className="mr-0.5" />
                          <span>Trang</span>
                        </button>

                        <div className="bg-[#1b1c25] border border-[#2e303f] px-3 py-1 rounded text-white flex items-center space-x-1 font-semibold font-sans">
                          <input
                            type="text"
                            value={attendanceCurrentPage}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val > 0 && val <= totalAttendancePages) setAttendanceCurrentPage(val);
                            }}
                            className="w-4 bg-transparent text-center font-mono focus:outline-none text-[#00a2e8]"
                          />
                          <span className="text-slate-500">/</span>
                          <span>{totalAttendancePages}</span>
                        </div>

                        <button
                          onClick={() => setAttendanceCurrentPage(prev => Math.min(prev + 1, totalAttendancePages))}
                          disabled={attendanceCurrentPage === totalAttendancePages}
                          className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs flex items-center"
                        >
                          <span>Trang</span>
                          <ChevronRight size={16} className="ml-0.5" />
                        </button>
                        <button
                          onClick={() => setAttendanceCurrentPage(totalAttendancePages)}
                          disabled={attendanceCurrentPage === totalAttendancePages}
                          className="p-1 rounded hover:bg-[#1f202b] text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition"
                        >
                          <ChevronsRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
          );
        })()
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
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] focus:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-all h-[42px] [color-scheme:dark]"
                          />
                          <input
                            type="date"
                            value={meetingStartDate}
                            onChange={(e) => setMeetingStartDate(e.target.value)}
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] focus:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-all h-[42px] [color-scheme:dark]"
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
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] focus:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-all h-[42px] [color-scheme:dark]"
                          />
                          <input
                            type="date"
                            value={meetingEndDate}
                            onChange={(e) => setMeetingEndDate(e.target.value)}
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] focus:border-[#00a2e8] rounded-xl px-4 py-2 text-xs text-white focus:outline-none transition-all h-[42px] [color-scheme:dark]"
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
                          {(() => {
                            const meetingAreas = areasData.filter(a => a.name !== 'Checkin Area' && a.name !== 'Checkout Area');
                            return selectedMeetingAreas.length === 0
                              ? 'Chưa chọn khu vực'
                              : selectedMeetingAreas.length === meetingAreas.length
                                ? `Tất cả (${meetingAreas.length} phòng)`
                                : selectedMeetingAreas.join(', ');
                          })()}
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
                                onClick={() => {
                                  const meetingAreas = areasData.filter(a => a.name !== 'Checkin Area' && a.name !== 'Checkout Area');
                                  setSelectedMeetingAreas(meetingAreas.map(a => a.name));
                                }}
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
                              {areasData.filter(a => a.name !== 'Checkin Area' && a.name !== 'Checkout Area').map((area) => {
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
                        setAppliedMeetingStartDate(meetingStartDate);
                        setAppliedMeetingEndDate(meetingEndDate);
                        setAppliedMeetingStartTime(meetingStartTime);
                        setAppliedMeetingEndTime(meetingEndTime);
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
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setMeetingSubTab('meetings')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition shadow duration-150 cursor-pointer ${meetingSubTab === 'meetings'
                          ? 'bg-[#00a2e8] hover:bg-[#008cc9] text-white'
                          : 'bg-[#1c1d26] text-slate-400 hover:text-white border border-[#2d2f3c]'
                          }`}
                      >
                        Danh sách cuộc họp ({filteredMeetingsMemo.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setMeetingSubTab('employees')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition shadow duration-150 cursor-pointer ${meetingSubTab === 'employees'
                          ? 'bg-[#00a2e8] hover:bg-[#008cc9] text-white'
                          : 'bg-[#1c1d26] text-slate-400 hover:text-white border border-[#2d2f3c]'
                          }`}
                      >
                        Báo cáo theo nhân viên
                      </button>
                    </div>
                    {meetingSubTab === 'meetings' ? (
                      isMeetingMultiSelectMode ? (
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMeetingMultiSelectMode(false);
                              setSelectedMeetingReportIds([]);
                            }}
                            className="px-4 py-1.5 bg-[#1c1d26] hover:bg-[#252733] text-slate-300 hover:text-white border border-[#2d2f3c] rounded-lg text-xs font-medium transition shadow cursor-pointer focus:outline-none"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportMultipleMeetingsExcel(selectedMeetingReportIds)}
                            disabled={selectedMeetingReportIds.length === 0}
                            className="px-4 py-1.5 bg-[#00a2e8] hover:bg-[#008cc9] text-white font-medium rounded-lg text-xs transition shadow cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 focus:outline-none"
                          >
                            <Download size={13} />
                            <span>Xuất báo cáo cho ({selectedMeetingReportIds.length}) cuộc họp</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">💡 Nhấn giữ để chọn nhiều, click vào cuộc họp để xem chi tiết</span>
                      )
                    ) : !selectedEmpStats ? (
                      isEmpMultiSelectMode ? (
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEmpMultiSelectMode(false);
                              setSelectedEmpReportIds([]);
                            }}
                            className="px-4 py-1.5 bg-[#1c1d26] hover:bg-[#252733] text-slate-300 hover:text-white border border-[#2d2f3c] rounded-lg text-xs font-medium transition shadow cursor-pointer focus:outline-none"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportMultipleEmployeesExcel(selectedEmpReportIds)}
                            disabled={selectedEmpReportIds.length === 0}
                            className="px-4 py-1.5 bg-[#00a2e8] hover:bg-[#008cc9] text-white font-medium rounded-lg text-xs transition shadow cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 focus:outline-none"
                          >
                            <Download size={13} />
                            <span>Xuất Excel ({selectedEmpReportIds.length}) nhân viên</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">💡 Nhấn giữ để chọn nhiều, click vào nhân viên để xem chi tiết tham dự từng lần họp</span>
                      )
                    ) : null}
                  </div>

                  {meetingSubTab === 'meetings' ? (
                    (() => {
                      if (filteredMeetingsMemo.length === 0) {
                        return (
                          <div className="bg-[#14151b] border border-[#21232d] rounded-2xl p-8 text-center text-slate-500">
                            <AlertTriangle size={32} className="mx-auto text-slate-600 mb-2 animate-pulse" />
                            <span className="text-xs font-semibold text-slate-400 block mb-1">Không tìm thấy cuộc họp nào</span>
                            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">Vui lòng thay đổi thời gian lọc hoặc khu vực/phòng họp để hiển thị danh sách cuộc họp.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredMeetingsMemo.map((meet: any) => {
                            const isSelected = selectedMeetingReportIds.includes(meet.id);
                            return (
                              <div
                                key={meet.id}
                                onMouseDown={() => {
                                  if (!isMeetingMultiSelectMode) {
                                    longPressTimerRef.current = setTimeout(() => {
                                      setIsMeetingMultiSelectMode(true);
                                      setSelectedMeetingReportIds([meet.id]);
                                    }, 600);
                                  }
                                }}
                                onMouseUp={() => {
                                  if (longPressTimerRef.current) {
                                    clearTimeout(longPressTimerRef.current);
                                    longPressTimerRef.current = null;
                                  }
                                }}
                                onMouseLeave={() => {
                                  if (longPressTimerRef.current) {
                                    clearTimeout(longPressTimerRef.current);
                                    longPressTimerRef.current = null;
                                  }
                                }}
                                onTouchStart={() => {
                                  if (!isMeetingMultiSelectMode) {
                                    longPressTimerRef.current = setTimeout(() => {
                                      setIsMeetingMultiSelectMode(true);
                                      setSelectedMeetingReportIds([meet.id]);
                                    }, 600);
                                  }
                                }}
                                onTouchEnd={() => {
                                  if (longPressTimerRef.current) {
                                    clearTimeout(longPressTimerRef.current);
                                    longPressTimerRef.current = null;
                                  }
                                }}
                                onClick={() => {
                                  if (isMeetingMultiSelectMode) {
                                    setSelectedMeetingReportIds(prev => {
                                      if (prev.includes(meet.id)) {
                                        return prev.filter(id => id !== meet.id);
                                      } else {
                                        return [...prev, meet.id];
                                      }
                                    });
                                  } else {
                                    handleSelectMeeting(meet);
                                  }
                                }}
                                className={`bg-[#14151b] border rounded-2xl p-4 cursor-pointer transition-all duration-150 hover:scale-[1.01] hover:bg-[#1a1b24] shadow-md group relative overflow-hidden text-left ${isSelected
                                  ? 'border-[#00a2e8] shadow-lg shadow-[#00a2e8]/10'
                                  : 'border-[#21232d] hover:border-[#00a2e8]/50'
                                  }`}
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00a2e8]" />

                                <div className="pl-2 space-y-2.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="font-bold text-xs text-white group-hover:text-[#00a2e8] transition truncate animate-pulse" title={meet.title}>
                                      {meet.title}
                                    </h5>
                                    <div className="flex items-center space-x-1.5 shrink-0">
                                      {isMeetingMultiSelectMode && (
                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isSelected
                                          ? 'border-[#00a2e8] bg-[#00a2e8]'
                                          : 'border-[#2d2f3c] bg-[#111218]'
                                          }`}>
                                          {isSelected && <Check size={8} className="text-white font-bold" />}
                                        </div>
                                      )}
                                      <span className="shrink-0 bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[9px] font-semibold border border-slate-700/50">
                                        {meet.area}
                                      </span>
                                    </div>
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
                                      {isMeetingMultiSelectMode ? (isSelected ? 'Đã chọn' : 'Chọn cuộc họp') : 'Xem báo cáo →'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    /* Tab Báo cáo theo nhân viên */
                    selectedEmpStats ? (
                      /* Sub-view: Chi tiết lịch sử tham gia họp của 1 nhân viên */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between space-x-3 mb-2">
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEmpStats(null);
                                setSelectedEmpMeetingDetail(null);
                              }}
                              className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#2d2f3c] hover:border-slate-400 bg-[#1c1d26] hover:bg-[#20212a] text-slate-300 hover:text-white transition cursor-pointer focus:outline-none"
                              title="Quay lại danh sách nhân viên"
                            >
                              <ArrowLeft size={14} />
                            </button>
                            <div className="text-left">
                              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                                Lịch sử họp: {selectedEmpStats.emp.hoTen}
                              </h4>
                              <p className="text-[10px] text-slate-400">Mã NV: {selectedEmpStats.emp.maGiayTo} | {selectedEmpStats.emp.human_group.join(', ')}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleExportEmployeeDetailExcel(selectedEmpStats)}
                            disabled={!selectedEmpStats.details || selectedEmpStats.details.length === 0}
                            className="px-4 py-1.5 bg-[#00a2e8] hover:bg-[#008cc9] text-white font-medium rounded-lg text-xs transition shadow cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 shrink-0 focus:outline-none"
                          >
                            <Download size={13} />
                            <span>Xuất Excel</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-left">
                          {/* Table history */}
                          <div className="lg:col-span-2 bg-[#14151b] border border-[#21232d] rounded-2xl overflow-hidden shadow-xl flex flex-col">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-[#111218] border-b border-[#2d2f3c] text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">
                                    <th className="py-2.5 px-3 text-center">STT</th>
                                    <th className="py-2.5 px-3 text-left">Tên cuộc họp</th>
                                    <th className="py-2.5 px-3 text-center">Ngày</th>
                                    <th className="py-2.5 px-3 text-center">Thời gian họp</th>
                                    <th className="py-2.5 px-3 text-center">Vào</th>
                                    <th className="py-2.5 px-3 text-center">Ra</th>
                                    <th className="py-2.5 px-3 text-center">Đánh giá</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1b1c24] text-xs font-mono">
                                  {selectedEmpStats.details.map((det: any, idx: number) => {
                                    const activeDetail = selectedEmpMeetingDetail || selectedEmpStats.details[0];
                                    const isRowSelected = activeDetail?.meetingId === det.meetingId;

                                    // Calculate evaluation text and classes
                                    let statusText = 'Vắng';
                                    let statusColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
                                    if (det.thoiGianVao && det.thoiGianRa) {
                                      const getSec = (t: string) => t.split(':').map(Number).reduce((acc, v) => acc * 60 + v, 0);
                                      const inSec = getSec(det.thoiGianVao);
                                      const startSec = getSec(det.startTime);
                                      const outSec = getSec(det.thoiGianRa);
                                      const endSec = getSec(det.endTime);
                                      if (inSec <= startSec) {
                                        statusText = 'Đúng giờ';
                                        statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                                      } else {
                                        statusText = 'Đi muộn';
                                        statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                                      }
                                      if (outSec < endSec) {
                                        statusText += ' - Về sớm';
                                        statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                                      }
                                    } else if (det.thoiGianVao || det.thoiGianRa) {
                                      statusText = 'Cần xử lý';
                                      statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                                    }

                                    return (
                                      <tr
                                        key={det.meetingId}
                                        onClick={() => setSelectedEmpMeetingDetail(det)}
                                        className={`cursor-pointer transition-all ${isRowSelected
                                          ? 'bg-[#00a2e8]/10 text-[#00a2e8] hover:bg-[#00a2e8]/15 font-medium'
                                          : 'hover:bg-[#181921]/60 text-slate-300'
                                          }`}
                                      >
                                        <td className="py-3 px-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                        <td className="py-3 px-3 font-sans max-w-[150px] truncate" title={det.title}>{det.title}</td>
                                        <td className="py-3 px-3">{(() => {
                                          const parts = det.date.split('-');
                                          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : det.date;
                                        })()}</td>
                                        <td className="py-3 px-3 text-center font-sans text-[11px] text-slate-400">{det.startTime} - {det.endTime}</td>
                                        <td className="py-3 px-3 text-center text-emerald-400">{det.thoiGianVao || '-'}</td>
                                        <td className="py-3 px-3 text-center text-amber-400">{det.thoiGianRa || '-'}</td>
                                        <td className="py-3 px-3 text-center">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold border ${statusColor}`}>
                                            {statusText}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Photos view */}
                          <div className="bg-[#14151b] border border-[#21232d] rounded-2xl p-4 shadow-xl space-y-4 flex flex-col justify-between">
                            <h5 className="font-bold text-xs text-slate-200 uppercase tracking-wider pb-1.5 border-b border-[#21232d] flex items-center gap-1.5">
                              <Camera size={14} className="text-[#00a2e8]" />
                              Hình ảnh lúc vào / ra
                            </h5>

                            {(() => {
                              const activeDetail = selectedEmpMeetingDetail || selectedEmpStats.details[0];
                              if (!activeDetail) {
                                return (
                                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                                    Không có ảnh cho cuộc họp này
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-4">
                                  {/* Entry photo */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ảnh lúc vào</span>
                                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${!activeDetail.thoiGianVao
                                        ? 'text-slate-500 bg-slate-500/10 border-slate-500/10'
                                        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                        }`}>
                                        {activeDetail.thoiGianVao && activeDetail.thoiGianVao !== 'Trống' && activeDetail.thoiGianVao !== 'Không có dữ liệu' ? activeDetail.thoiGianVao : 'Không có dữ liệu'}
                                      </span>
                                    </div>
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-[#2d2f3c] bg-[#0d0e12] flex items-center justify-center shadow-inner">
                                      {activeDetail.entryEvent?.cropped_face_images?.[0] ? (
                                        <>
                                          <img
                                            src={activeDetail.entryEvent.cropped_face_images[0]}
                                            alt="Check-in"
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-2 border border-emerald-500/30 rounded pointer-events-none">
                                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-400" />
                                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-400" />
                                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-400" />
                                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-emerald-400" />
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center gap-1.5 text-slate-600">
                                          <CameraOff size={24} />
                                          <span className="text-[10px] font-mono">Không có ảnh</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Exit photo */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ảnh lúc ra</span>
                                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${!activeDetail.thoiGianRa
                                        ? 'text-slate-500 bg-slate-500/10 border-slate-500/10'
                                        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                        }`}>
                                        {activeDetail.thoiGianRa && activeDetail.thoiGianRa !== 'Trống' && activeDetail.thoiGianRa !== 'Không có dữ liệu' ? activeDetail.thoiGianRa : 'Không có dữ liệu'}
                                      </span>
                                    </div>
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-[#2d2f3c] bg-[#0d0e12] flex items-center justify-center shadow-inner">
                                      {activeDetail.exitEvent?.cropped_face_images?.[0] ? (
                                        <>
                                          <img
                                            src={activeDetail.exitEvent.cropped_face_images[0]}
                                            alt="Check-out"
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute inset-2 border border-emerald-500/30 rounded pointer-events-none">
                                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-emerald-400" />
                                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-emerald-400" />
                                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-emerald-400" />
                                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-emerald-400" />
                                          </div>
                                        </>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center gap-1.5 text-slate-600">
                                          <CameraOff size={24} />
                                          <span className="text-[10px] font-mono">Không có ảnh</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Main View: Danh sách nhân viên và các chỉ số tham gia họp */
                      <div className="bg-[#14151b] border border-[#21232d] rounded-2xl overflow-hidden shadow-xl flex flex-col">
                        {isLoadingAllMeetingsAttendance ? (
                          <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                            <RotateCw size={28} className="animate-spin text-[#00a2e8]" />
                            <span className="text-xs font-semibold text-slate-400">Đang tổng hợp dữ liệu báo cáo nhân viên...</span>
                          </div>
                        ) : employeeMeetingStats.length === 0 ? (
                          <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                            <AlertTriangle size={28} className="text-slate-600" />
                            <span className="text-xs font-semibold text-slate-400">Không tìm thấy dữ liệu nhân viên</span>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#111218] border-b border-[#2d2f3c] text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">
                                  {isEmpMultiSelectMode && <th className="py-3 px-4 w-8"></th>}
                                  <th className="py-3 px-4 text-center">STT</th>
                                  <th className="py-3 px-4 text-center">Mã NV</th>
                                  <th className="py-3 px-4 text-left">Họ và tên</th>
                                  <th className="py-3 px-4 text-center">Số cuộc họp yêu cầu</th>
                                  <th className="py-3 px-4 text-center">Đúng giờ</th>
                                  <th className="py-3 px-4 text-center">Đi muộn</th>
                                  <th className="py-3 px-4 text-center">Về sớm</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1b1c24] text-xs font-mono select-none">
                                {employeeMeetingStats.map((item, idx) => {
                                  const isSelected = selectedEmpReportIds.includes(item.emp.id);
                                  return (
                                    <tr
                                      key={item.emp.id}
                                      onMouseDown={() => {
                                        if (!isEmpMultiSelectMode) {
                                          longPressTimerRef.current = setTimeout(() => {
                                            setIsEmpMultiSelectMode(true);
                                            setSelectedEmpReportIds([item.emp.id]);
                                          }, 600);
                                        }
                                      }}
                                      onMouseUp={() => {
                                        if (longPressTimerRef.current) {
                                          clearTimeout(longPressTimerRef.current);
                                          longPressTimerRef.current = null;
                                        }
                                      }}
                                      onMouseLeave={() => {
                                        if (longPressTimerRef.current) {
                                          clearTimeout(longPressTimerRef.current);
                                          longPressTimerRef.current = null;
                                        }
                                      }}
                                      onTouchStart={() => {
                                        if (!isEmpMultiSelectMode) {
                                          longPressTimerRef.current = setTimeout(() => {
                                            setIsEmpMultiSelectMode(true);
                                            setSelectedEmpReportIds([item.emp.id]);
                                          }, 600);
                                        }
                                      }}
                                      onTouchEnd={() => {
                                        if (longPressTimerRef.current) {
                                          clearTimeout(longPressTimerRef.current);
                                          longPressTimerRef.current = null;
                                        }
                                      }}
                                      onClick={() => {
                                        if (isEmpMultiSelectMode) {
                                          setSelectedEmpReportIds(prev => {
                                            if (prev.includes(item.emp.id)) {
                                              return prev.filter(id => id !== item.emp.id);
                                            } else {
                                              return [...prev, item.emp.id];
                                            }
                                          });
                                        } else {
                                          setSelectedEmpStats(item);
                                          setSelectedEmpMeetingDetail(item.details[0] || null);
                                        }
                                      }}
                                      className={`cursor-pointer transition-colors hover:bg-[#181921]/60 text-slate-300 ${isSelected ? 'bg-[#00a2e8]/10' : 'odd:bg-[#0e0f14] even:bg-[#101117]'
                                        }`}
                                    >
                                      {isEmpMultiSelectMode && (
                                        <td className="py-3 px-4">
                                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${isSelected
                                            ? 'border-[#00a2e8] bg-[#00a2e8]'
                                            : 'border-[#2d2f3c] bg-[#111218]'
                                            }`}>
                                            {isSelected && <Check size={8} className="text-white font-bold" />}
                                          </div>
                                        </td>
                                      )}
                                      <td className="py-3 px-4 text-center text-slate-500 font-semibold">{idx + 1}</td>
                                      <td className="py-3 px-4 font-bold">{item.emp.maGiayTo}</td>
                                      <td className="py-3 px-4 font-sans font-medium text-slate-100">{item.emp.hoTen}</td>
                                      <td className="py-3 px-4 text-center text-slate-400 font-bold">{item.requiredCount}</td>
                                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">{item.presentOnTimeCount}</td>
                                      <td className="py-3 px-4 text-center text-amber-500 font-bold">{item.lateCount}</td>
                                      <td className="py-3 px-4 text-center text-rose-400 font-bold">{item.earlyCount}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  )}
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
                    <div className="relative">
                      {/* Dropup menu - visible on click toggle */}
                      {isMeetingExportOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsMeetingExportOpen(false)}
                          />
                          <div className="absolute top-full right-0 pt-1 z-40 min-w-[170px]">
                            <div className="bg-[#1a1b25] border border-[#2d2f3e] rounded-lg shadow-xl overflow-hidden flex flex-col items-stretch">
                              <div className="px-3 py-1.5 bg-[#14151c] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-[#2d2f3e] text-left">
                                Xuất Excel
                              </div>
                              <button
                                onClick={() => {
                                  handleExportMeetingReportExcel(selectedMeetingReport, computedAttendeeRoster);
                                  setIsMeetingExportOpen(false);
                                }}
                                className="px-4 py-2 text-xs text-slate-200 hover:bg-[#00a2e8]/10 hover:text-[#00a2e8] flex items-center space-x-2 transition text-left whitespace-nowrap cursor-pointer"
                              >
                                <Download size={12} />
                                <span>Toàn bộ ({computedAttendeeRoster.length})</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleExportMeetingReportExcel(selectedMeetingReport, currentMeetingRoster);
                                  setIsMeetingExportOpen(false);
                                }}
                                className="px-4 py-2 text-xs text-slate-200 hover:bg-[#00a2e8]/10 hover:text-[#00a2e8] flex items-center space-x-2 transition text-left whitespace-nowrap cursor-pointer"
                              >
                                <Download size={12} />
                                <span>Trong trang ({currentMeetingRoster.length})</span>
                              </button>

                              <div className="px-3 py-1.5 bg-[#14151c] text-[10px] text-slate-400 font-bold uppercase tracking-wider border-y border-[#2d2f3e] text-left">
                                Xuất PDF
                              </div>
                              <button
                                onClick={() => {
                                  handleExportMeetingReportPDF(computedAttendeeRoster);
                                  setIsMeetingExportOpen(false);
                                }}
                                disabled={isPdfExporting}
                                className="px-4 py-2 text-xs text-slate-200 hover:bg-[#00a2e8]/10 hover:text-[#00a2e8] flex items-center space-x-2 transition text-left whitespace-nowrap cursor-pointer disabled:opacity-50"
                              >
                                <FileText size={12} />
                                <span>Toàn bộ ({computedAttendeeRoster.length})</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleExportMeetingReportPDF(currentMeetingRoster);
                                  setIsMeetingExportOpen(false);
                                }}
                                disabled={isPdfExporting}
                                className="px-4 py-2 text-xs text-slate-200 hover:bg-[#00a2e8]/10 hover:text-[#00a2e8] flex items-center space-x-2 transition text-left whitespace-nowrap cursor-pointer disabled:opacity-50"
                              >
                                <FileText size={12} />
                                <span>Trong trang ({currentMeetingRoster.length})</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      <button
                        onClick={() => setIsMeetingExportOpen(prev => !prev)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#00a2e8] hover:bg-[#008cc9] text-white rounded-lg text-xs font-semibold transition shadow-md shadow-[#00a2e8]/10"
                      >
                        <Download size={13} />
                        <span>Xuất báo cáo</span>
                      </button>
                    </div>
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

                  // Meeting pagination calculation (shared from outer scope)
                  const totalMeetingItems = sortedAttendeeRoster.length;
                  const totalMeetingPages = Math.ceil(totalMeetingItems / meetingItemsPerPage) || 1;

                  // Bound check current page
                  const activeMeetingPage = Math.min(meetingCurrentPage, totalMeetingPages);

                  const indexLastMeetingItem = activeMeetingPage * meetingItemsPerPage;
                  const indexFirstMeetingItem = indexLastMeetingItem - meetingItemsPerPage;

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
                            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">phòng ban tham gia</span>
                            <span className="text-xl font-bold text-[#00a2e8] font-mono">{deptsCount}</span>
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
                                Vui lòng đổi ngày (ví dụ: 09/07/2026), thay đổi khoảng thời gian check-in hoặc chọn thêm phòng ban tham dự họp.
                              </p>
                            </div>
                          ) : (
                            <table className="w-full text-xs text-left border-collapse">
                              <thead className="bg-[#181921] text-slate-300 font-semibold border-b border-[#21232d] uppercase tracking-wider text-[10px] sticky top-0 z-10">
                                <tr>
                                  <th className="py-2.5 px-4 w-12 text-center">STT</th>
                                  <th className="py-2.5 px-3">Tên nhân sự</th>
                                  <th className="py-2.5 px-3">Mã nhân sự</th>
                                  <th className="py-2.5 px-3">Phòng ban</th>
                                  <th className="py-2.5 px-3">Thời gian vào phòng</th>
                                  <th className="py-2.5 px-3">Thời gian rời phòng</th>
                                  <th className="py-2.5 px-3 text-center">% tham dự</th>
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
                                      <td className="py-2 px-3 text-center font-mono font-semibold text-white">
                                        {item.ratioPercent}%
                                      </td>
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

                {/* 4. Khu Vực (Multiselect) */}
                <div className="space-y-1 text-left relative">
                  <label className="text-[11px] text-slate-300 font-semibold block">Khu Vực</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOpenZoneDropdown(!isOpenZoneDropdown)}
                      className="w-full bg-[#181921] border border-[#2d2f3c] hover:border-[#00a2e8] rounded px-3 py-2 text-xs text-white text-left flex items-center justify-between transition focus:outline-none"
                    >
                      <span className="truncate pr-1">
                        {(() => {
                          if (filterZones.length === 0) return 'Chưa chọn khu vực';
                          if (filterZones.length === areasData.length) return `Tất Cả (${areasData.length} KV)`;
                          return filterZones.join(', ');
                        })()}
                      </span>
                      <ChevronDown size={14} className={`text-[#00a2e8] transition-transform ${isOpenZoneDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpenZoneDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsOpenZoneDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute left-0 right-0 mt-1 bg-[#181921] border border-[#2d2f3c] rounded shadow-2xl z-50 p-2 space-y-1"
                          >
                            <div className="flex justify-between border-b border-[#2d2f3c]/60 pb-1.5 mb-1.5 px-1">
                              <button
                                type="button"
                                onClick={() => setFilterZones(areasData.map(a => a.name))}
                                className="text-[10px] text-[#00a2e8] hover:underline font-semibold"
                              >
                                Chọn tất cả
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterZones([]);
                                  setFilterCameras([]);
                                }}
                                className="text-[10px] text-slate-400 hover:underline font-semibold"
                              >
                                Bỏ chọn
                              </button>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {areasData.map((area) => {
                                const zoneName = area.name;
                                const isChecked = filterZones.includes(zoneName);
                                return (
                                  <button
                                    key={area.id}
                                    type="button"
                                    onClick={() => {
                                      if (isChecked) {
                                        const next = filterZones.filter(z => z !== zoneName);
                                        setFilterZones(next);
                                        if (next.length === 0) setFilterCameras([]);
                                      } else {
                                        setFilterZones([...filterZones, zoneName]);
                                      }
                                    }}
                                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs text-slate-200 hover:bg-[#20212a] transition cursor-pointer"
                                  >
                                    <span className="truncate mr-2">{zoneName}</span>
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${isChecked
                                      ? 'border-[#00a2e8] bg-[#00a2e8]'
                                      : 'border-[#2d2f3c] bg-[#111218]'
                                      }`}>
                                      {isChecked && <Check size={10} className="text-white font-bold" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 4.5. Option Camera (Multiselect - Hiện sẵn, unselectable khi số khu vực là 0 hoặc all) */}
                {(() => {
                  const isCameraDisabled = filterZones.length === 0 || filterZones.length === areasData.length;
                  const availableCameras = isCameraDisabled
                    ? []
                    : areasData
                      .filter(a => filterZones.includes(a.name))
                      .flatMap(a => a.cameras || []);

                  return (
                    <div className="space-y-1 text-left relative">
                      <label className="text-[11px] text-slate-300 font-semibold block flex items-center gap-1">
                        <span>Camera</span>
                        {isCameraDisabled && (
                          <span className="text-[10px] text-slate-500 font-normal ml-auto">(Chọn khu vực cụ thể)</span>
                        )}
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          disabled={isCameraDisabled}
                          onClick={() => {
                            if (!isCameraDisabled) setIsOpenCameraDropdown(!isOpenCameraDropdown);
                          }}
                          className={`w-full bg-[#181921] border border-[#2d2f3c] rounded px-3 py-2 text-xs text-white text-left flex items-center justify-between transition focus:outline-none ${isCameraDisabled ? 'opacity-50 cursor-not-allowed select-none' : 'hover:border-[#00a2e8]'
                            }`}
                        >
                          <span className="truncate pr-1">
                            {(() => {
                              if (isCameraDisabled || filterCameras.length === 0) return 'Tất cả (All)';
                              if (filterCameras.length === availableCameras.length && availableCameras.length > 0)
                                return `Tất cả (${availableCameras.length} Cam)`;
                              return availableCameras
                                .filter(c => filterCameras.includes(c.camera_id))
                                .map(c => c.camera_name || c.camera_id)
                                .join(', ') || 'Tất cả (All)';
                            })()}
                          </span>
                          <ChevronDown size={14} className={`text-[#00a2e8] transition-transform ${isOpenCameraDropdown && !isCameraDisabled ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isOpenCameraDropdown && !isCameraDisabled && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setIsOpenCameraDropdown(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 mt-1 bg-[#181921] border border-[#2d2f3c] rounded shadow-2xl z-50 p-2 space-y-1"
                              >
                                <div className="flex justify-between border-b border-[#2d2f3c]/60 pb-1.5 mb-1.5 px-1">
                                  <button
                                    type="button"
                                    onClick={() => setFilterCameras(availableCameras.map(c => c.camera_id))}
                                    className="text-[10px] text-[#00a2e8] hover:underline font-semibold"
                                  >
                                    Chọn tất cả
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setFilterCameras([])}
                                    className="text-[10px] text-slate-400 hover:underline font-semibold"
                                  >
                                    Bỏ chọn
                                  </button>
                                </div>
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                  {availableCameras.map((cam) => {
                                    const camId = cam.camera_id;
                                    const camName = cam.camera_name || camId;
                                    const isChecked = filterCameras.includes(camId);
                                    return (
                                      <button
                                        key={cam.id || camId}
                                        type="button"
                                        onClick={() => {
                                          if (isChecked) {
                                            setFilterCameras(filterCameras.filter(c => c !== camId));
                                          } else {
                                            setFilterCameras([...filterCameras, camId]);
                                          }
                                        }}
                                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs text-slate-200 hover:bg-[#20212a] transition cursor-pointer"
                                      >
                                        <span className="truncate mr-2">{camName}</span>
                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${isChecked
                                          ? 'border-[#00a2e8] bg-[#00a2e8]'
                                          : 'border-[#2d2f3c] bg-[#111218]'
                                          }`}>
                                          {isChecked && <Check size={10} className="text-white font-bold" />}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })()}

                {/* 5. Nhóm nhân viên / Phòng ban (Multiselect) */}
                <div className="space-y-1 text-left relative">
                  <label className="text-[11px] text-slate-300 font-semibold block">Phòng ban</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOpenListDropdown(!isOpenListDropdown)}
                      className="w-full bg-[#181921] border border-[#2d2f3c] hover:border-[#00a2e8] rounded px-3 py-2 text-xs text-white text-left flex items-center justify-between transition focus:outline-none"
                    >
                      <span className="truncate pr-1">
                        {(() => {
                          if (filterLists.length === 0) return 'Tất Cả';
                          if (filterLists.length === humanGroups.length) return `Tất Cả (${humanGroups.length} Phòng ban)`;
                          return humanGroups
                            .filter(g => filterLists.includes(g.id))
                            .map(g => g.name)
                            .join(', ');
                        })()}
                      </span>
                      <ChevronDown size={14} className={`text-[#00a2e8] transition-transform ${isOpenListDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpenListDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsOpenListDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute left-0 right-0 mt-1 bg-[#181921] border border-[#2d2f3c] rounded shadow-2xl z-50 p-2 space-y-1"
                          >
                            <div className="flex justify-between border-b border-[#2d2f3c]/60 pb-1.5 mb-1.5 px-1">
                              <button
                                type="button"
                                onClick={() => setFilterLists(humanGroups.map(g => g.id))}
                                className="text-[10px] text-[#00a2e8] hover:underline font-semibold"
                              >
                                Chọn tất cả
                              </button>
                              <button
                                type="button"
                                onClick={() => setFilterLists([])}
                                className="text-[10px] text-slate-400 hover:underline font-semibold"
                              >
                                Bỏ chọn
                              </button>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {humanGroups.map((grp) => {
                                const isChecked = filterLists.includes(grp.id);
                                return (
                                  <button
                                    key={grp.id}
                                    type="button"
                                    onClick={() => {
                                      if (isChecked) {
                                        setFilterLists(filterLists.filter(id => id !== grp.id));
                                      } else {
                                        setFilterLists([...filterLists, grp.id]);
                                      }
                                    }}
                                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs text-slate-200 hover:bg-[#20212a] transition cursor-pointer"
                                  >
                                    <span className="truncate mr-2">{grp.name}</span>
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${isChecked
                                      ? 'border-[#00a2e8] bg-[#00a2e8]'
                                      : 'border-[#2d2f3c] bg-[#111218]'
                                      }`}>
                                      {isChecked && <Check size={10} className="text-white font-bold" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 6. Hướng (Tất cả | Vào | Ra) */}
                <div className="space-y-1 text-left relative">
                  <label className="text-[11px] text-slate-300 font-semibold block">Hướng</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOpenEventTypeDropdown(!isOpenEventTypeDropdown)}
                      className="w-full bg-[#181921] border border-[#2d2f3c] hover:border-[#00a2e8] rounded px-3 py-2 text-xs text-white text-left flex items-center justify-between transition focus:outline-none"
                    >
                      <span>
                        {filterEventType === 'All' ? 'Tất cả' : filterEventType === 'in' ? 'Vào' : 'Ra'}
                      </span>
                      <ChevronDown size={14} className="text-[#00a2e8]" />
                    </button>

                    <AnimatePresence>
                      {isOpenEventTypeDropdown && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsOpenEventTypeDropdown(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute left-0 right-0 mt-1 bg-[#181921] border border-[#2d2f3c] rounded shadow-2xl z-50 overflow-hidden"
                          >
                            <div className="max-h-40 overflow-y-auto">
                              {[
                                { id: 'All', name: 'Tất cả' },
                                { id: 'in', name: 'Vào' },
                                { id: 'out', name: 'Ra' }
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
                        </>
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
                    setFilterZones([]);
                    setFilterCameras([]);
                    setFilterList('All');
                    setFilterLists([]);
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
                    setAppliedZones([]);
                    setAppliedCameras([]);
                    setAppliedList('All');
                    setAppliedLists([]);
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
                    setAppliedZones(filterZones);
                    setAppliedCameras(filterCameras);
                    setAppliedList(filterList);
                    setAppliedLists(filterLists);
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

      {/* Hidden Printable PDF Container */}
      {(() => {
        const pdfPresentCount = pdfExportRoster.filter(r => r.thoiGianVao || r.thoiGianRa).length;
        const pdfTotalCount = pdfExportRoster.length;
        const pdfRatioSum = pdfExportRoster.reduce((sum, item) => sum + item.ratioPercent, 0);
        const pdfAvgPercent = pdfTotalCount > 0 ? Math.round(pdfRatioSum / pdfTotalCount) : 100;

        let evalColor = '#000000';
        if (pdfAvgPercent > 95) {
          evalColor = '#059669';
        } else if (pdfAvgPercent > 75) {
          evalColor = '#D97706';
        } else {
          evalColor = '#DC2626';
        }

        return (
          <div
            id="meeting-report-pdf-template"
            style={{
              position: 'absolute',
              left: '-9999px',
              top: '-9999px',
              width: '1024px',
              backgroundColor: '#ffffff',
              color: '#000000',
            }}
          >
            <div style={{ padding: '30px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
              <h2 style={{ textAlign: 'center', color: '#0078D7', fontWeight: 'bold', fontSize: '20px', marginBottom: '25px', textTransform: 'uppercase' }}>
                BÁO CÁO THAM DỰ CUỘC HỌP
              </h2>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '12px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6', width: '20%' }}>Tên cuộc họp:</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', width: '30%' }}>{selectedMeetingReport?.title || ''}</td>
                    <td style={{ border: 'none', padding: '8px', width: '20%' }}></td>
                    <td style={{ border: 'none', padding: '8px', width: '30%' }}></td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Khu vực:</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{selectedMeetingReport?.area || ''}</td>
                    <td style={{ border: 'none', padding: '8px' }}></td>
                    <td style={{ border: 'none', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Ngày:</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{selectedMeetingReport?.date || ''}</td>
                    <td style={{ border: 'none', padding: '8px' }}></td>
                    <td style={{ border: 'none', padding: '8px' }}></td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Giờ bắt đầu:</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{selectedMeetingReport?.startTime || ''}</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Nhóm nhân viên tham gia:</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{(selectedMeetingReport?.departments || []).join(', ')}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Giờ kết thúc:</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{selectedMeetingReport?.endTime || ''}</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Đánh giá tổng thể:</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', color: evalColor }}>
                      {`Tham gia ${pdfPresentCount}/${pdfTotalCount} - Tổng thời gian tham gia (${pdfAvgPercent}%)`}
                    </td>
                  </tr>
                </tbody>
              </table>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0078D7', color: '#ffffff', fontWeight: 'bold' }}>
                    <th style={{ border: '1px solid #D1D5DB', padding: '10px' }}>STT</th>
                    <th style={{ border: '1px solid #D1D5DB', padding: '10px' }}>Mã NV</th>
                    <th style={{ border: '1px solid #D1D5DB', padding: '10px' }}>Họ và tên</th>
                    <th style={{ border: '1px solid #D1D5DB', padding: '10px' }}>Nhóm</th>
                    <th style={{ border: '1px solid #D1D5DB', padding: '10px' }}>Giờ vào</th>
                    <th style={{ border: '1px solid #D1D5DB', padding: '10px' }}>Giờ ra</th>
                    <th style={{ border: '1px solid #D1D5DB', padding: '10px' }}>% tham dự</th>
                    <th style={{ border: '1px solid #D1D5DB', padding: '10px' }}>Đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  {pdfExportRoster.map((row, idx) => {
                    let entryColor = '#000000';
                    if (!row.thoiGianVao) {
                      entryColor = '#94A3B8';
                    } else {
                      const inSec = timeStringToSeconds(row.thoiGianVao);
                      const startSec = timeStringToSeconds(meetingStartTime);
                      const latenessSec = inSec - startSec;
                      if (latenessSec > 0) {
                        if (latenessSec <= 900) {
                          entryColor = '#000000';
                        } else if (latenessSec <= 1800) {
                          entryColor = '#D97706';
                        } else {
                          entryColor = '#DC2626';
                        }
                      }
                    }

                    let exitColor = '#000000';
                    if (!row.thoiGianRa) {
                      exitColor = '#94A3B8';
                    } else {
                      const outSec = timeStringToSeconds(row.thoiGianRa);
                      const endSec = timeStringToSeconds(meetingEndTime);
                      const earlinessSec = endSec - outSec;
                      if (earlinessSec > 0) {
                        if (earlinessSec <= 900) {
                          exitColor = '#000000';
                        } else if (earlinessSec <= 1800) {
                          exitColor = '#D97706';
                        } else {
                          exitColor = '#DC2626';
                        }
                      }
                    }

                    let ratioColor = '#000000';
                    if (!row.thoiGianVao && !row.thoiGianRa) {
                      ratioColor = '#DC2626';
                    } else if (row.ratioPercent > 95) {
                      ratioColor = '#059669';
                    } else {
                      ratioColor = '#D97706';
                    }

                    let evalStatusColor = '#000000';
                    if (row.evaluationType === 'good') {
                      evalStatusColor = '#059669';
                    } else if (row.evaluationType === 'early' || row.evaluationType === 'manual') {
                      evalStatusColor = '#D97706';
                    } else {
                      evalStatusColor = '#DC2626';
                    }

                    return (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAFB' }}>
                        <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{row.emp.ma || ''}</td>
                        <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: '500', textAlign: 'left' }}>{row.emp.ten || ''}</td>
                        <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{row.emp.danhSach || ''}</td>
                        <td style={{ border: '1px solid #D1D5DB', padding: '8px', color: entryColor, fontFamily: 'monospace' }}>{row.thoiGianVao || '--:--:--'}</td>
                        <td style={{ border: '1px solid #D1D5DB', padding: '8px', color: exitColor, fontFamily: 'monospace' }}>{row.thoiGianRa || '--:--:--'}</td>
                        <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', color: ratioColor }}>{row.ratioPercent != null ? `${row.ratioPercent}%` : ''}</td>
                        <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: '600', color: evalStatusColor }}>{row.evaluationText || ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Hidden Event Logs PDF Container */}
      <div
        id="event-logs-pdf-template"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1024px',
          backgroundColor: '#ffffff',
          color: '#000000',
        }}
      >
        <div style={{ padding: '30px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
          <h2 style={{ textAlign: 'center', color: '#0078D7', fontWeight: 'bold', fontSize: '20px', marginBottom: '25px', textTransform: 'uppercase' }}>
            DANH SÁCH SỰ KIỆN GHI NHẬN
          </h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6', width: '20%' }}>Từ ngày:</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', width: '30%' }}>{appliedStartDate || 'Không giới hạn'}</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6', width: '20%' }}>Từ khóa:</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', width: '30%' }}>{appliedSearch || 'Tất cả'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Đến ngày:</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{appliedEndDate || 'Không giới hạn'}</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Phòng ban:</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{appliedList === 'All' ? 'Tất cả' : (humanGroups.find(g => g.id === appliedList)?.name || appliedList)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Khu vực:</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{appliedZone === 'All' ? 'Tất cả' : appliedZone}</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Loại sự kiện:</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{appliedEventType === 'All' ? 'Tất cả' : (appliedEventType === 'in' ? 'Đi vào' : 'Đi ra')}</td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#0078D7', color: '#ffffff', fontWeight: 'bold' }}>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '5%' }}>STT</th>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '16%' }}>Họ tên</th>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '12%' }}>Mã nhân viên</th>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '12%' }}>Phòng ban</th>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '12%' }}>Khu vực</th>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '8%' }}>Hướng</th>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '12%' }}>Camera</th>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '13%' }}>Thời gian</th>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '10%' }}>Độ chính xác (%)</th>
              </tr>
            </thead>
            <tbody>
              {pdfExportEvents.map((row, idx) => {
                const areaSuffix = getAreaSuffix(row);
                const huongText = areaSuffix === 'ra' ? 'Đi ra' : areaSuffix === 'vào' ? 'Đi vào' : (row.huong && row.huong.toLowerCase().includes('ra') ? 'Đi ra' : 'Đi vào');
                const acc = row.accuracy;
                const isValidScore = acc !== undefined && acc !== null && acc !== '' && acc !== 'Không có dữ liệu';
                const accuracyValue = isValidScore
                  ? (typeof acc === 'number' ? `${acc}%` : String(acc).includes('%') ? acc : `${acc}%`)
                  : 'Không có dữ liệu';
                return (
                  <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAFB' }}>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: '500', textAlign: 'left' }}>{row.ten || ''}</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontFamily: 'monospace' }}>{row.ma || ''}</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'left' }}>{row.danhSach || ''}</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'left' }}>{row.vung || ''}</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{huongText}</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'left' }}>
                      {resolveCameraName(row)}
                    </td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontFamily: 'monospace' }}>{row.thoiGian || ''}</td>
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold' }}>{accuracyValue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Attendance Report PDF Container */}
      <div
        id="attendance-report-pdf-template"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1024px',
          backgroundColor: '#ffffff',
          color: '#000000',
        }}
      >
        <div style={{ padding: '30px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
          <h2 style={{ textAlign: 'center', color: '#0078D7', fontWeight: 'bold', fontSize: '20px', marginBottom: '25px', textTransform: 'uppercase' }}>
            BÁO CÁO CHẤM CÔNG - {attendanceType.toUpperCase().replace('ĐIỂM DANH', 'CHẤM CÔNG')}
          </h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6', width: '20%' }}>Phòng ban:</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', width: '30%' }}>
                  {attendanceGroup === 'All' ? 'Tất cả' : (humanGroups.find(g => g.id === attendanceGroup)?.name || attendanceGroup)}
                </td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6', width: '20%' }}>Số lượng nhân sự:</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', width: '30%' }}>{pdfAttendanceRoster.length}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Từ ngày:</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{attendanceStartDate}</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold', backgroundColor: '#F3F4F6' }}>Đến ngày:</td>
                <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{attendanceEndDate}</td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
            <thead>
              <tr style={{ backgroundColor: '#0078D7', color: '#ffffff', fontWeight: 'bold' }}>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '8%' }}>STT</th>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '18%' }}>Mã NV</th>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '25%' }}>Họ và Tên</th>
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '22%' }}>Nhóm / nhóm nhân viên</th>
                {attendanceType === 'Báo cáo theo ngày' && <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '12%' }}>Giờ Vào</th>}
                {attendanceType === 'Báo cáo theo ngày' && <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '12%' }}>Giờ Ra</th>}
                <th style={{ border: '1px solid #D1D5DB', padding: '10px', width: '15%' }}>Tổng giờ</th>
              </tr>
            </thead>
            <tbody>
              {pdfAttendanceRoster.map((row, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAFB' }}>
                  <td style={{ border: '1px solid #D1D5DB', padding: '8px' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontFamily: 'monospace' }}>{row.ma || ''}</td>
                  <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: '500', textAlign: 'left' }}>{row.ten || ''}</td>
                  <td style={{ border: '1px solid #D1D5DB', padding: '8px', textAlign: 'left' }}>{row.danhSach || ''}</td>
                  {attendanceType === 'Báo cáo theo ngày' && (
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontFamily: 'monospace', color: (!row.thoiGianVao || row.thoiGianVao === 'Trống' || row.thoiGianVao === 'Không có dữ liệu') ? '#9CA3AF' : '#059669' }}>
                      {(!row.thoiGianVao || row.thoiGianVao === 'Trống' || row.thoiGianVao === 'Không có dữ liệu') ? 'Không có dữ liệu' : row.thoiGianVao}
                    </td>
                  )}
                  {attendanceType === 'Báo cáo theo ngày' && (
                    <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontFamily: 'monospace', color: (!row.thoiGianRa || row.thoiGianRa === 'Trống' || row.thoiGianRa === 'Không có dữ liệu') ? '#9CA3AF' : '#059669' }}>
                      {(!row.thoiGianRa || row.thoiGianRa === 'Trống' || row.thoiGianRa === 'Không có dữ liệu') ? 'Không có dữ liệu' : row.thoiGianRa}
                    </td>
                  )}
                  <td style={{ border: '1px solid #D1D5DB', padding: '8px', fontWeight: 'bold' }}>{row.totalHours || '0 h'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Floating Corner System Loading Spinner Icon (Icon only, no text) */}
      {(isLoadingLogs || isLoadingPage || isDailyReportLoading || isRangeReportLoading || isLoadingReport || isLoadingAllMeetingsAttendance || exporting || isRefreshing) && (
        <div
          id="system-loading-corner-icon"
          className="fixed bottom-6 right-6 z-50 p-3 bg-[#14151c]/90 border border-[#00a2e8]/40 rounded-full shadow-2xl backdrop-blur-md text-[#00a2e8] flex items-center justify-center pointer-events-none"
        >
          <Loader2 size={22} className="animate-spin text-[#00a2e8]" />
        </div>
      )}
    </div>
  );
};
