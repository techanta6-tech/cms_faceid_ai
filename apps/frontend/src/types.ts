export interface EventLog {
  stt: number;
  id?: string;
  vung: string;
  camera_id?: string;
  ten: string;
  ma: string;
  danhSach: string;
  thoiGian: string;
  avatarSeed: string;
  faceRect?: { x: number; y: number; w: number; h: number }; // Percentage values for overlay
  accuracy?: number;
}

export interface Area {
  id: string;
  name: string;
  code: string;
  cameras: AreaCamera[];
}

export interface AreaCamera {
  id?: string; // location_camera_bind.id (needed to update/remove the binding)
  camera_id: string;
  camera_name?: string; // Resolved from camera API
  ip?: string;
  port?: number;
  resolution?: string;
  status?: 'online' | 'offline';
  role: string[]; // ["checkin"], ["checkout"], ["checkin", "checkout"]
}

export interface CameraInfo {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: 'online' | 'offline';
  resolution: string;
  fps: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  description: string;
  tag: string;
  type: string;
  mainStream: string;
  subStream: string;
  ip: string;
  onvifPort: string;
  rtspPort: string;
  storageStream: string;
  username: string;
  password?: string;
}

export interface ChannelInfo {
  id: string;
  name: string;
  cameraName: string;
  cameraMappingId?: string; // DB camera_cfg.id for pre-selection in dropdown
}

// Nhóm nhân viên, resolved từ bảng human_list (DB lcms) qua GET /human-list.
export interface MeetingGroup {
  id: string;
  name: string;
}

// Cuộc họp, ánh xạ từ bảng meeting (DB cms_webserver).
export interface Meeting {
  id: string;
  title: string;
  location_id: string;
  group_ids: string[];
  groups: MeetingGroup[]; // resolved tên nhóm nhân viên, trả về từ BE
  time_start: string; // "HH:mm"
  time_end: string; // "HH:mm"
  date_organize: string; // "YYYY-MM-DD"
  time_before_begin: number; // phút, default 30
  time_after_end: number; // phút, default 30
}

export interface CreateMeetingPayload {
  title: string;
  location_id: string;
  group_ids: string[];
  time_start: string;
  time_end: string;
  date_organize: string;
  time_before_begin?: number;
  time_after_end?: number;
}

export interface UpdateMeetingPayload {
  title?: string;
  location_id?: string;
  group_ids?: string[];
  time_start?: string;
  time_end?: string;
  date_organize?: string;
  time_before_begin?: number;
  time_after_end?: number;
}
