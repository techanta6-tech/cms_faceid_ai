import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { EventLog, Area, AreaCamera, DeviceInfo, Meeting, MeetingGroup, CreateMeetingPayload, UpdateMeetingPayload } from '../types';
import { mockEventLogs, mockAreas } from '../data';
import { useSocket } from './SocketContext';

// Map a camera_cfg row from the DVMS DB to the UI DeviceInfo shape.
// Fields that are missing or have no content in the DB are skipped
// (left as empty defaults) so the UI never shows blank/undefined values.
const mapCameraCfgToDevice = (row: any): DeviceInfo => {
  const device: DeviceInfo = {
    id: row.id,
    name: '',
    description: '',
    tag: '',
    type: '',
    mainStream: '',
    subStream: '',
    ip: '',
    onvifPort: '',
    rtspPort: '',
    storageStream: '',
    username: '',
  };

  const assign = <K extends keyof DeviceInfo>(key: K, value: any) => {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      device[key] = value as DeviceInfo[K];
    }
  };

  // Columns that currently exist on camera_cfg
  assign('name', row.name);
  assign('tag', row.search_tag);
  // Fields not yet stored as dedicated columns on camera_cfg (they will be
  // populated automatically once the backend exposes them, e.g. from cfg_data).
  assign('description', row.description);
  assign('type', row.type);
  assign('mainStream', row.main_stream);
  assign('subStream', row.sub_stream);
  assign('ip', row.ip);
  assign('onvifPort', row.onvif_port);
  assign('rtspPort', row.rtsp_port);
  assign('storageStream', row.storage_stream);
  assign('username', row.username);
  assign('password', row.password);

  return device;
};

// Map a meeting row returned by GET/POST/PUT /meeting (BE already resolves
// group_ids -> groups[{id,name}]) into the frontend Meeting shape. date_organize
// arrives as an ISO datetime string ("YYYY-MM-DDT00:00:00.000Z"); trim it down
// to "YYYY-MM-DD" to match the <input type="date"> value format used in the UI.
const mapMeetingRow = (row: any): Meeting => ({
  id: row.id,
  title: row.title,
  location_id: row.location_id,
  group_ids: row.group_ids || [],
  groups: row.groups || [],
  time_start: row.time_start,
  time_end: row.time_end,
  date_organize: typeof row.date_organize === 'string' ? row.date_organize.slice(0, 10) : row.date_organize,
  time_before_begin: row.time_before_begin,
  time_after_end: row.time_after_end,
});

interface AppContextType {
  eventLogs: EventLog[];
  setEventLogs: React.Dispatch<React.SetStateAction<EventLog[]>>;
  isLoadingLogs: boolean;
  employees: any[];
  setEmployees: React.Dispatch<React.SetStateAction<any[]>>;
  devices: DeviceInfo[];
  setDevices: React.Dispatch<React.SetStateAction<DeviceInfo[]>>;
  areasData: Area[];
  setAreasData: React.Dispatch<React.SetStateAction<Area[]>>;
  createArea: (name: string) => Promise<Area>;
  deleteArea: (id: string) => Promise<void>;
  addAreaCamera: (areaId: string, cameraId: string, role?: string[]) => Promise<AreaCamera>;
  removeAreaCamera: (areaId: string, bindId: string) => Promise<void>;
  updateAreaCamera: (areaId: string, bindId: string, role: string[]) => Promise<AreaCamera>;
  scheduleSavedData: any[];
  setScheduleSavedData: React.Dispatch<React.SetStateAction<any[]>>;
  humanGroups: MeetingGroup[];
  meetings: Meeting[];
  createMeeting: (payload: CreateMeetingPayload) => Promise<Meeting>;
  updateMeeting: (id: string, payload: UpdateMeetingPayload) => Promise<Meeting>;
  deleteMeeting: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { socket } = useSocket();
  // eventLogs is now managed locally in ReportPage (server-side pagination).
  // AppContext keeps a lightweight list of real-time socket-pushed events only.
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Lắng nghe sự kiện WebSocket thời gian thực toàn cục
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeLog = (log: any) => {
      console.log('Realtime log received in AppContext:', log);
      const newEvent: EventLog = {
        stt: Math.floor(Math.random() * 1000000),
        vung: log.areaName,
        camera_id: log.cameraId || log.camera_id || log.cameraEventId,
        ten: log.hoTen,
        ma: log.employeeId,
        danhSach: log.phongBan,
        thoiGian: `${log.date}-${log.time}`,
        avatarSeed: `avatar_${Math.floor(Math.random() * 100)}`,
        accuracy: parseFloat((95 + Math.random() * 5).toFixed(1)),
        faceRect: { x: 30, y: 20, w: 40, h: 45 }
      };

      setEventLogs(prev => [newEvent, ...prev]);
    };

    socket.on('realtime_log', handleRealtimeLog);

    return () => {
      socket.off('realtime_log', handleRealtimeLog);
    };
  }, [socket]);

  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const baseUrl = (import.meta as any).env.VITE_WS_URL || 'http://localhost:3001';
        
        // 1. Fetch human-list (Nhóm nhân viên)
        const resList = await fetch(`${baseUrl}/human-list`);
        const lists = await resList.json();
        const listMap: Record<string, string> = {};
        lists.forEach((item: any) => {
          listMap[item.id] = item.name;
        });

        // 2. Fetch human_info (nhân viên)
        const resHumans = await fetch(`${baseUrl}/human`);
        const humans = await resHumans.json();

        // 3. Map database schema to frontend employee schema
        const mappedEmployees = humans.map((h: any) => {
          const pb = (h.list_ids || []).map((lid: string) => listMap[lid] || lid);
          // format dates
          const formatDate = (dateVal: any) => {
            if (!dateVal) return '';
            const d = new Date(dateVal);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
          };

          return {
            id: h.id,
            hoTen: h.full_name || 'Không Tên',
            maGiayTo: h.document_id || '',
            human_group: pb.length > 0 ? pb : ['Mặc định'],
            loaiGiayTo: h.id_type || 'CCCD',
            ngayCap: formatDate(h.release_date),
            noiCap: h.issued_by || '',
            ngaySinh: formatDate(h.birthday),
            gioiTinh: h.gender === 1 ? 'Nam' : 'Nữ',
            soDienThoai: h.phone_number || '',
            email: h.email || '',
            diaChi: h.address || '',
            anhDaiDien: h.avatar_base64
              ? { name: 'avatar.jpg', url: h.avatar_base64 }
              : undefined,
          };
        });

        setEmployees(mappedEmployees);
      } catch (e: any) {
        console.warn('Failed to load database content from NestJS API, using local mock data:', e.message);
        setEmployees([
          {
            id: 'EMP001',
            hoTen: 'Phan Hữu Thiên Phúc',
            maGiayTo: '080203011585',
            human_group: ['Phòng Ban 1', 'Ban Giám Đốc'],
            loaiGiayTo: 'CCCD',
            ngayCap: '15/04/2021',
            noiCap: 'Cục Cảnh sát QLHC về trật tự xã hội',
            ngaySinh: '18/06/1995',
            gioiTinh: 'Nam',
            soDienThoai: '0987654321',
            email: 'phucphan01866@gmail.com',
            diaChi: 'Quận 1, TP. Hồ Chí Minh',
            anhDaiDien: { name: 'avatar_phuc.jpg', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80' }
          },
          {
            id: 'EMP002',
            hoTen: 'Trần Phước Lợi',
            maGiayTo: '079203009485',
            human_group: ['Phòng Nhân Sự'],
            loaiGiayTo: 'CCCD',
            ngayCap: '22/09/2022',
            noiCap: 'Cục Cảnh sát QLHC về trật tự xã hội',
            ngaySinh: '12/10/1998',
            gioiTinh: 'Nam',
            soDienThoai: '0912345678',
            email: 'loi.tran@company.com',
            diaChi: 'Quận Bình Thạnh, TP. Hồ Chí Minh',
            anhDaiDien: { name: 'avatar_loi.jpg', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150' }
          },
          {
            id: 'EMP003',
            hoTen: 'Nguyễn Thị Mai',
            maGiayTo: '038202005823',
            human_group: ['Phòng Ban 2'],
            loaiGiayTo: 'CCCD',
            ngayCap: '05/12/2020',
            noiCap: 'Công an Tỉnh Đồng Nai',
            ngaySinh: '25/08/1997',
            gioiTinh: 'Nữ',
            soDienThoai: '0933445566',
            email: 'mai.nguyen@company.com',
            diaChi: 'Biên Hòa, Đồng Nai',
            anhDaiDien: { name: 'avatar_mai.jpg', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80' }
          }
        ]);
      }
    };
    loadData();
  }, []);

  const [devices, setDevices] = useState<DeviceInfo[]>([
    {
      id: 'dev-1',
      name: 'Camera ZKTeco Number 1',
      description: 'ZKTeco Entrance 1',
      tag: '',
      type: 'ONVIF CAMERA',
      mainStream: 'H264 1920x1080 (profile_c',
      subStream: 'H264 704x576 (profile_can',
      ip: '192.168.1.201',
      onvifPort: '80',
      rtspPort: '554',
      storageStream: 'Main Stream',
      username: 'admin',
      password: 'password123'
    },
    {
      id: 'dev-2',
      name: 'Camera ZKTeco Number 2',
      description: 'ZKTeco Entrance 2',
      tag: '',
      type: 'ONVIF CAMERA',
      mainStream: 'H264 1920x1080 (profile_c',
      subStream: 'H264 704x576 (profile_can',
      ip: '192.168.1.202',
      onvifPort: '80',
      rtspPort: '554',
      storageStream: 'Main Stream',
      username: 'admin',
      password: 'password123'
    },
    {
      id: 'dev-3',
      name: 'Camera Nhiet',
      description: '',
      tag: '',
      type: 'ONVIF CAMERA',
      mainStream: 'H264 1920x1080 (profile_c',
      subStream: 'H264 704x576 (profile_can',
      ip: '192.168.1.207',
      onvifPort: '80',
      rtspPort: '554',
      storageStream: 'Main Stream',
      username: 'admin',
      password: 'password123'
    },
    {
      id: 'dev-4',
      name: 'Cam duoi san',
      description: 'Cam duoi san tang',
      tag: '',
      type: 'ONVIF CAMERA',
      mainStream: 'H264 1920x1080 (profile_c',
      subStream: 'H264 704x576 (profile_can',
      ip: '192.168.1.204',
      onvifPort: '80',
      rtspPort: '554',
      storageStream: 'Main Stream',
      username: 'admin',
      password: 'password123'
    }
  ]);

  // Load cameras (camera_cfg) from the DVMS backend, gracefully skipping
  // fields that are missing or empty. Falls back to local mock devices on error.
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const baseUrl = (import.meta as any).env.VITE_WS_URL || 'http://localhost:3001';
        const res = await fetch(`${baseUrl}/camera`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          setDevices(rows.map(mapCameraCfgToDevice));
        }
      } catch (e: any) {
        console.warn('Failed to load cameras from API, using local mock devices:', e.message);
      }
    };
    loadDevices();
  }, []);

  const [areasData, setAreasData] = useState<Area[]>(mockAreas);
  const getBaseUrl = () => (import.meta as any).env.VITE_WS_URL || 'http://localhost:3001';

  // Load locations (location + location_camera_bind from webserver DB) and enrich
  // with camera details from the DVMS camera API. Reusable so CRUD actions can
  // re-sync the list with the DB after a mutation.
  const loadLocations = useCallback(async () => {
    try {
      const baseUrl = getBaseUrl();

      // Fetch locations from webserver DB
      const locRes = await fetch(`${baseUrl}/location`);
      if (!locRes.ok) throw new Error(`Location HTTP ${locRes.status}`);
      const locations: any[] = await locRes.json();

      // Fetch cameras from DVMS to enrich location_camera_bind with details
      const camRes = await fetch(`${baseUrl}/camera`);
      if (!camRes.ok) throw new Error(`Camera HTTP ${camRes.status}`);
      const cameras: any[] = await camRes.json();
      const cameraById = new Map(cameras.map(c => [c.id, c]));

      // Map locations to Area format, enriching bindings with camera data
      const enriched: Area[] = locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        code: loc.code,
        cameras: loc.cameras.map((bind: any) => {
          const cam = cameraById.get(bind.camera_id);
          return {
            id: bind.id,
            camera_id: bind.camera_id,
            camera_name: cam?.name || 'Unknown',
            ip: cam?.ip || '/',
            port: cam?.rtspPort ? parseInt(cam.rtspPort, 10) : undefined,
            resolution: cam?.resolution || '/',
            status: 'online' as const,
            role: bind.role || [],
          };
        }),
      }));

      setAreasData(enriched);
    } catch (e: any) {
      console.warn('Failed to load locations from API, using mock data:', e.message);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Create a new location (khu vực) in the webserver DB, then re-sync the list.
  const createArea = useCallback(async (name: string): Promise<Area> => {
    const baseUrl = getBaseUrl();
    const code = `ZONE_${Date.now().toString(36).toUpperCase()}`;
    const res = await fetch(`${baseUrl}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const created = await res.json();
    const newArea: Area = { id: created.id, name: created.name, code: created.code, cameras: [] };
    setAreasData(prev => [...prev, newArea]);
    return newArea;
  }, []);

  // Delete a location (cascades location_camera_bind rows on the DB side).
  const deleteArea = useCallback(async (id: string): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/location/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    setAreasData(prev => prev.filter(a => a.id !== id));
  }, []);

  // Bind a camera to a location (location_camera_bind), then re-sync to resolve
  // camera details (name/ip/resolution) from the DVMS camera API.
  const addAreaCamera = useCallback(async (areaId: string, cameraId: string, role: string[] = []): Promise<AreaCamera> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/location/${areaId}/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ camera_id: cameraId, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const bind = await res.json();
    await loadLocations();
    return { id: bind.id, camera_id: bind.camera_id, role: bind.role };
  }, [loadLocations]);

  // Update a camera binding's role (location_camera_bind), then re-sync.
  const updateAreaCamera = useCallback(async (areaId: string, bindId: string, role: string[]): Promise<AreaCamera> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/location/cameras/${bindId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const bind = await res.json();
    await loadLocations();
    return { id: bind.id, camera_id: bind.camera_id, role: bind.role };
  }, [loadLocations]);

  // Remove a camera binding from a location.
  const removeAreaCamera = useCallback(async (areaId: string, bindId: string): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/location/cameras/${bindId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    setAreasData(prev =>
      prev.map(area =>
        area.id === areaId
          ? { ...area, cameras: area.cameras.filter(c => c.id !== bindId) }
          : area
      )
    );
  }, []);

  // Nhóm nhân viên (human_list, DB lcms) dùng cho multiselect "Nhóm nhân viên
  // tham gia" khi tạo lịch họp. Cùng nguồn dữ liệu với listMap ở loadData().
  const [humanGroups, setHumanGroups] = useState<MeetingGroup[]>([]);

  useEffect(() => {
    const loadHumanGroups = async () => {
      try {
        const baseUrl = getBaseUrl();
        const res = await fetch(`${baseUrl}/human-list`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        if (Array.isArray(rows)) {
          setHumanGroups(rows.map((r: any) => ({ id: r.id, name: r.name })));
        }
      } catch (e: any) {
        console.warn('Failed to load human-list groups from API:', e.message);
      }
    };
    loadHumanGroups();
  }, []);

  // Cuộc họp (bảng meeting, DB cms_webserver). BE resolve sẵn group_ids -> groups[].
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const loadMeetings = useCallback(async () => {
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/meeting`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      if (Array.isArray(rows)) {
        setMeetings(rows.map(mapMeetingRow));
      }
    } catch (e: any) {
      console.warn('Failed to load meetings from API:', e.message);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const createMeeting = useCallback(async (payload: CreateMeetingPayload): Promise<Meeting> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/meeting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const created = mapMeetingRow(await res.json());
    setMeetings(prev => [...prev, created]);
    return created;
  }, []);

  const updateMeeting = useCallback(async (id: string, payload: UpdateMeetingPayload): Promise<Meeting> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/meeting/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const updated = mapMeetingRow(await res.json());
    setMeetings(prev => prev.map(m => (m.id === id ? updated : m)));
    return updated;
  }, []);

  const deleteMeeting = useCallback(async (id: string): Promise<void> => {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/meeting/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    setMeetings(prev => prev.filter(m => m.id !== id));
  }, []);

  const [scheduleSavedData, setScheduleSavedData] = useState<any[]>([
    {
      id: 'emp-1',
      name: 'Phòng Ban 2',
      code: 'ANTA6_7',
      days: {
        '2026-07-10': { assigned: false },
        '2026-07-11': { assigned: false },
        '2026-07-12': { assigned: false },
        '2026-07-13': { assigned: false },
        '2026-07-14': { assigned: false },
        '2026-07-15': { assigned: false },
        '2026-07-16': { assigned: false },
      }
    },
    {
      id: 'emp-2',
      name: 'Phòng Ban 1',
      code: '160303',
      days: {
        '2026-07-10': { assigned: true, shiftName: 'Ca hành chính', startTime: '08:00', endTime: '17:00', type: 'Chấm công', areas: ['Checkin Area'] },
        '2026-07-11': { assigned: true, shiftName: 'Ca hành chính', startTime: '08:00', endTime: '17:00', type: 'Chấm công', areas: ['Checkin Area'] },
        '2026-07-12': { assigned: true, shiftName: 'Ca hành chính', startTime: '08:00', endTime: '17:00', type: 'Chấm công', areas: ['Checkin Area'] },
        '2026-07-13': { assigned: true, shiftName: 'Ca hành chính', startTime: '08:00', endTime: '17:00', type: 'Chấm công', areas: ['Checkin Area'] },
        '2026-07-14': { assigned: true, shiftName: 'Ca hành chính', startTime: '08:00', endTime: '17:00', type: 'Chấm công', areas: ['Checkin Area'] },
        '2026-07-15': { assigned: false },
        '2026-07-16': { assigned: false },
      }
    }
  ]);

  return (
    <AppContext.Provider value={{
      eventLogs,
      setEventLogs,
      isLoadingLogs,
      employees,
      setEmployees,
      devices,
      setDevices,
      areasData,
      setAreasData,
      createArea,
      deleteArea,
      addAreaCamera,
      removeAreaCamera,
      updateAreaCamera,
      scheduleSavedData,
      setScheduleSavedData,
      humanGroups,
      meetings,
      createMeeting,
      updateMeeting,
      deleteMeeting
    }}>
      {children}
    </AppContext.Provider>
  );
};
