import { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Search,
  X,
  Check,
  Plus,
  ChevronDown,
  Video,
  List,
  RotateCw,
  FolderOpen,
  Settings,
  Star,
  Minus,
  Square,
  Sparkles,
  Download,
  AlertTriangle,
  Info,
  Layers,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../../context/AppContext';
import { DeviceInfo, ChannelInfo } from '../../../types';

// Map a channel_cfg row from the DVMS DB to the UI ChannelInfo shape.
// Fields that are missing or empty are skipped: an empty name stays '',
// and an unresolved/absent camera mapping stays "Không Chọn".
const mapChannelCfgToChannel = (
  row: any,
  cameraNameById: Map<string, string>,
): ChannelInfo => {
  const channel: ChannelInfo = {
    id: row.id,
    name: '',
    cameraName: 'Không Chọn',
    cameraMappingId: row.camera_mapping_id || undefined,
  };
  if (row.name !== null && row.name !== undefined && String(row.name).trim() !== '') {
    channel.name = row.name;
  }
  if (row.camera_mapping_id) {
    const camName = cameraNameById.get(row.camera_mapping_id);
    if (camName) channel.cameraName = camName;
  }
  return channel;
};

// 2. DEVICES PAGE COMPONENT
// ==========================================
export const DevicesPage = () => {
  const { devices, setDevices } = useApp();

  const [activeDeviceSubTab, setActiveDeviceSubTab] = useState<'device' | 'channel'>('device');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('dev-1');
  const [isAddingDevice, setIsAddingDevice] = useState<boolean>(false);
  const [searchDeviceQuery, setSearchDeviceQuery] = useState('');

  // Form edit/view state
  const [editDevName, setEditDevName] = useState('');
  const [editDevDesc, setEditDevDesc] = useState('');
  const [editDevTag, setEditDevTag] = useState('');
  const [editDevType, setEditDevType] = useState('ONVIF CAMERA');
  const [editDevMainStream, setEditDevMainStream] = useState('H264 1920x1080 (profile_c');
  const [editDevSubStream, setEditDevSubStream] = useState('H264 704x576 (profile_can');
  const [editDevIp, setEditDevIp] = useState('');
  const [editDevOnvifPort, setEditDevOnvifPort] = useState('80');
  const [editDevRtspPort, setEditDevRtspPort] = useState('554');
  const [editDevStorageStream, setEditDevStorageStream] = useState('Main Stream');
  const [editDevUser, setEditDevUser] = useState('admin');
  const [editDevPass, setEditDevPass] = useState('password123');

  // Form add state
  const [addDevName, setAddDevName] = useState('');
  const [addDevDesc, setAddDevDesc] = useState('');
  const [addDevIp, setAddDevIp] = useState('');
  const [addDevOnvifPort, setAddDevOnvifPort] = useState('80');
  const [addDevRtspPort, setAddDevRtspPort] = useState('554');
  const [addDevUser, setAddDevUser] = useState('admin');
  const [addDevPass, setAddDevPass] = useState('');

  const [addDevErrors, setAddDevErrors] = useState<{ name?: string; ip?: string }>({});
  const [editDevErrors, setEditDevErrors] = useState<{ name?: string; ip?: string }>({});

  const initialChannels: ChannelInfo[] = [
    { id: 'chan-1', name: 'Camera Truoc', cameraName: 'Camera ZKTeco Number 1', cameraMappingId: 'dev-1' },
    { id: 'chan-2', name: 'Camera Sau', cameraName: 'Camera ZKTeco Number 2', cameraMappingId: 'dev-2' },
    { id: 'chan-3', name: 'Channel 3', cameraName: 'Cam duoi san', cameraMappingId: 'dev-4' },
    { id: 'chan-4', name: 'Channel 4', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-5', name: 'Channel 5', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-6', name: 'Channel 6', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-7', name: 'Channel 7', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-8', name: 'Channel 8', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-9', name: 'Channel 9', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-10', name: 'Channel 10', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-11', name: 'Channel 11', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-12', name: 'Channel 12', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-13', name: 'Channel 13', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-14', name: 'Channel 14', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-15', name: 'Channel 15', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-16', name: 'Channel 16', cameraName: 'Không Chọn', cameraMappingId: undefined },
    { id: 'chan-17', name: 'Channel 17', cameraName: 'Không Chọn', cameraMappingId: undefined }
  ];

  // Channels are keyed by their DB id (channel_cfg.id) instead of a positional stt.
  const buildChannelMap = (list: ChannelInfo[]) =>
    new Map<string, ChannelInfo>(list.map(c => [c.id, c]));

  const [channels, setChannels] = useState<Map<string, ChannelInfo>>(buildChannelMap(initialChannels));
  const [originalChannels, setOriginalChannels] = useState<Map<string, ChannelInfo>>(buildChannelMap(initialChannels));

  const connectedChannel = (Array.from(channels.values()) as ChannelInfo[]).find(
    c => c.cameraMappingId === selectedDeviceId
  );
  const channelNameText = connectedChannel ? (connectedChannel as ChannelInfo).name : 'Chưa kết nối';

  // Guards against reloading channels (and clobbering unsaved edits) after the
  // first successful fetch, even when the `devices` dependency changes.
  const channelsLoadedRef = useRef(false);

  useEffect(() => {
    const dev = devices.find(d => d.id === selectedDeviceId);
    if (dev) {
      setEditDevName(dev.name);
      setEditDevDesc(dev.description || '');
      setEditDevTag(dev.tag || '');
      setEditDevType(dev.type || 'ONVIF CAMERA');
      setEditDevMainStream(dev.mainStream || 'H264 1920x1080 (profile_c');
      setEditDevSubStream(dev.subStream || 'H264 704x576 (profile_can');
      setEditDevIp(dev.ip || '');
      setEditDevOnvifPort(dev.onvifPort || '80');
      setEditDevRtspPort(dev.rtspPort || '554');
      setEditDevStorageStream(dev.storageStream || 'Main Stream');
      setEditDevUser(dev.username || 'admin');
      setEditDevPass(dev.password || '');
      setEditDevErrors({});
    }
  }, [selectedDeviceId, devices]);

  // Keep a valid selection when the device list comes from the DB (the mock
  // default id 'dev-1' won't exist among real camera_cfg records).
  useEffect(() => {
    if (devices.length > 0 && !devices.some(d => d.id === selectedDeviceId)) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  // Load channels (channel_cfg) from the DVMS backend once devices are available
  // (needed to resolve camera_mapping_id -> camera name). Falls back to local
  // mock channels on error; only replaces the list when the API returns data.
  useEffect(() => {
    if (channelsLoadedRef.current || devices.length === 0) return;
    const loadChannels = async () => {
      const baseUrl = (import.meta as any).env.VITE_WS_URL || 'http://localhost:3001';
      const fullUrl = `${baseUrl}/channel`;
      console.log(`[DEBUG Frontend DevicesPage] Bắt đầu tải danh sách kênh (loadChannels) từ URL: ${fullUrl}`);
      try {
        const res = await fetch(fullUrl);
        if (!res.ok) {
          console.error(`[DEBUG Frontend DevicesPage] Tải danh sách kênh THẤT BẠI: HTTP Status = ${res.status}`);
          throw new Error(`HTTP ${res.status}`);
        }
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const cameraNameById = new Map<string, string>(devices.map(d => [d.id, d.name]));
          const mapped = rows.map(r => mapChannelCfgToChannel(r, cameraNameById));
          setChannels(buildChannelMap(mapped));
          setOriginalChannels(buildChannelMap(mapped));
        }
        channelsLoadedRef.current = true;
      } catch (e: any) {
        console.warn('Failed to load channels from API, using local mock channels:', e.message);
      }
    };
    loadChannels();
  }, [devices]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">

      {/* Header Tab Navigator */}
      <div id="device-tabs-bar" className="h-14 bg-[#181921] border-b border-[#252731] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-xs text-slate-400 font-semibold tracking-wider">Thiết Bị & Kênh Ghi Hình</div>

          {/* Sliding Big Pill Segmented Control Container */}
          <div className="flex bg-[#111218] p-1 rounded-full border border-[#2d2f3c] space-x-1">
            {/* Tab 1: Quản lý camera */}
            <button
              id="tab-btn-device-manage"
              onClick={() => setActiveDeviceSubTab('device')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 ${activeDeviceSubTab === 'device'
                ? 'bg-[#0078d7] text-white shadow-lg shadow-[#0078d7]/20'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Monitor size={14} />
              <span>Quản lý camera</span>
            </button>

            {/* Tab 2: Quản lý kênh */}
            <button
              id="tab-btn-channel-manage"
              onClick={() => setActiveDeviceSubTab('channel')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 ${activeDeviceSubTab === 'channel'
                ? 'bg-[#0078d7] text-white shadow-lg shadow-[#0078d7]/20'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Layers size={14} />
              <span>Quản lý kênh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 flex overflow-hidden bg-[#111216]">
        {activeDeviceSubTab === 'device' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left sidebar: Danh Sách Camera */}
            <div id="device-sub-sidebar" className="w-64 border-r border-[#252731] flex flex-col bg-[#14151c] shrink-0">
              <div className="p-4 border-b border-[#252731] flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Danh Sách Camera</span>
                {/* <button 
                          onClick={() => {
                            setIsAddingDevice(true);
                            setAddDevName('');
                            setAddDevDesc('');
                            setAddDevIp('');
                            setAddDevOnvifPort('80');
                            setAddDevRtspPort('554');
                            setAddDevUser('admin');
                            setAddDevPass('');
                            setAddDevErrors({});
                          }}
                          className="p-1 hover:bg-[#2c2e3e] rounded text-[#00a2e8] transition"
                          title="Thêm thiết bị mới"
                        >
                          <Plus size={16} />
                        </button> */}
              </div>

              {/* Top Search Bar */}
              <div className="p-3 border-b border-[#252731] bg-[#181921]/40 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Tìm Camera..."
                    value={searchDeviceQuery}
                    onChange={(e) => setSearchDeviceQuery(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 text-xs bg-[#111216] border border-[#2d2f3c] rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00a2e8]"
                  />
                  <Search size={14} className="absolute right-2.5 top-2.5 text-slate-500" />
                </div>
              </div>

              {/* Camera List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#1e202b]">
                {devices
                  .filter(dev => dev.name.toLowerCase().includes(searchDeviceQuery.toLowerCase()))
                  .map(dev => {
                    const isSelected = selectedDeviceId === dev.id && !isAddingDevice;
                    return (
                      <button
                        key={dev.id}
                        onClick={() => {
                          setSelectedDeviceId(dev.id);
                          setIsAddingDevice(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3.5 text-left text-xs font-medium transition ${isSelected
                          ? 'bg-[#00a2e8]/10 text-[#00a2e8] border-l-4 border-[#00a2e8]'
                          : 'text-slate-400 hover:bg-[#1a1c24] hover:text-slate-200'
                          }`}
                      >
                        <Camera size={14} className={isSelected ? 'text-[#00a2e8]' : 'text-slate-500'} />
                        <span className="truncate">{dev.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Right area: Thông Tin Camera or Add Camera form */}
            <div id="device-info-pane" className="flex-1 p-8 overflow-y-auto bg-[#111216] flex flex-col">
              <div className="max-w-2xl">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-6 pb-2 border-b border-[#252731]">
                  {isAddingDevice ? 'Thêm Thiết Bị Mới' : 'Thông Tin Camera'}
                </h2>

                {isAddingDevice ? (
                  /* ADD DEVICE FORM */
                  <div className="space-y-5 text-xs text-slate-300">
                    {/* Row 1: Tên Gợi Nhớ */}
                    <div className="grid grid-cols-12 items-center gap-4">
                      <label className="col-span-3 text-right font-medium text-slate-400">Tên Gợi Nhớ</label>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={addDevName}
                          onChange={(e) => {
                            setAddDevName(e.target.value);
                            if (e.target.value.trim()) {
                              setAddDevErrors(prev => ({ ...prev, name: undefined }));
                            }
                          }}
                          className={`w-full px-3 py-2 bg-[#1b1c24] border ${addDevErrors.name ? 'border-red-500/50 focus:border-red-500' : 'border-[#2d2f3c] focus:border-[#00a2e8]'} rounded text-slate-100 focus:outline-none`}
                          placeholder="Nhập tên gọi nhớ..."
                        />
                      </div>
                      <div className="col-span-3 text-red-400 text-[11px] font-medium min-h-[1.5rem] flex items-center">
                        {addDevErrors.name || (!addDevName.trim() && "Không được để trống nội dung!")}
                      </div>
                    </div>

                    {/* Row 2: Mô Tả */}
                    <div className="grid grid-cols-12 items-center gap-4">
                      <label className="col-span-3 text-right font-medium text-slate-400">Mô Tả</label>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={addDevDesc}
                          onChange={(e) => setAddDevDesc(e.target.value)}
                          className="w-full px-3 py-2 bg-[#1b1c24] border border-[#2d2f3c] rounded text-slate-100 focus:outline-none focus:border-[#00a2e8]"
                          placeholder="Nhập mô tả..."
                        />
                      </div>
                      <div className="col-span-3"></div>
                    </div>

                    {/* Row 3: Địa Chỉ IP */}
                    <div className="grid grid-cols-12 items-center gap-4">
                      <label className="col-span-3 text-right font-medium text-slate-400">Địa Chỉ IP</label>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={addDevIp}
                          onChange={(e) => {
                            setAddDevIp(e.target.value);
                            if (e.target.value.trim()) {
                              setAddDevErrors(prev => ({ ...prev, ip: undefined }));
                            }
                          }}
                          className={`w-full px-3 py-2 bg-[#1b1c24] border ${addDevErrors.ip ? 'border-red-500/50 focus:border-red-500' : 'border-[#2d2f3c] focus:border-[#00a2e8]'} rounded text-slate-100 focus:outline-none`}
                          placeholder="Ví dụ: 192.168.1.10"
                        />
                      </div>
                      <div className="col-span-3 text-red-400 text-[11px] font-medium min-h-[1.5rem] flex items-center">
                        {addDevErrors.ip || (!addDevIp.trim() && "Không được để trống nội dung!")}
                      </div>
                    </div>

                    {/* Row 4: Cổng ONVIF */}
                    <div className="grid grid-cols-12 items-center gap-4">
                      <label className="col-span-3 text-right font-medium text-slate-400">Cổng ONVIF</label>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={addDevOnvifPort}
                          onChange={(e) => setAddDevOnvifPort(e.target.value)}
                          className="w-full px-3 py-2 bg-[#1b1c24] border border-[#2d2f3c] rounded text-slate-100 focus:outline-none focus:border-[#00a2e8]"
                        />
                      </div>
                      <div className="col-span-3"></div>
                    </div>

                    {/* Row 5: Cổng RTSP */}
                    <div className="grid grid-cols-12 items-center gap-4">
                      <label className="col-span-3 text-right font-medium text-slate-400">Cổng RTSP</label>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={addDevRtspPort}
                          onChange={(e) => setAddDevRtspPort(e.target.value)}
                          className="w-full px-3 py-2 bg-[#1b1c24] border border-[#2d2f3c] rounded text-slate-100 focus:outline-none focus:border-[#00a2e8]"
                        />
                      </div>
                      <div className="col-span-3"></div>
                    </div>

                    {/* Row 6: Tên Tài Khoản */}
                    <div className="grid grid-cols-12 items-center gap-4">
                      <label className="col-span-3 text-right font-medium text-slate-400">Tên Tài Khoản</label>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={addDevUser}
                          onChange={(e) => setAddDevUser(e.target.value)}
                          className="w-full px-3 py-2 bg-[#1b1c24] border border-[#2d2f3c] rounded text-slate-100 focus:outline-none focus:border-[#00a2e8]"
                        />
                      </div>
                      <div className="col-span-3"></div>
                    </div>

                    {/* Row 7: Mật Khẩu */}
                    <div className="grid grid-cols-12 items-center gap-4">
                      <label className="col-span-3 text-right font-medium text-slate-400">Mật Khẩu</label>
                      <div className="col-span-6">
                        <input
                          type="password"
                          value={addDevPass}
                          onChange={(e) => setAddDevPass(e.target.value)}
                          className="w-full px-3 py-2 bg-[#1b1c24] border border-[#2d2f3c] rounded text-slate-100 focus:outline-none focus:border-[#00a2e8]"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="col-span-3"></div>
                    </div>

                    {/* Form Buttons */}
                    <div className="grid grid-cols-12 gap-4 pt-6 border-t border-[#252731] mt-8">
                      <div className="col-span-3"></div>
                      <div className="col-span-6 flex items-center space-x-3">
                        <button
                          onClick={() => {
                            // Validation check
                            const errors: { name?: string; ip?: string } = {};
                            if (!addDevName.trim()) errors.name = "Không được để trống nội dung!";
                            if (!addDevIp.trim()) errors.ip = "Không được để trống nội dung!";

                            if (Object.keys(errors).length > 0) {
                              setAddDevErrors(errors);
                              return;
                            }

                            const newId = `dev-${Date.now()}`;
                            const newDevice: DeviceInfo = {
                              id: newId,
                              name: addDevName.trim(),
                              description: addDevDesc.trim(),
                              tag: '',
                              type: 'ONVIF CAMERA',
                              mainStream: 'H264 1920x1080 (profile_c',
                              subStream: 'H264 704x576 (profile_can',
                              ip: addDevIp.trim(),
                              onvifPort: addDevOnvifPort,
                              rtspPort: addDevRtspPort,
                              storageStream: 'Main Stream',
                              username: addDevUser,
                              password: addDevPass
                            };

                            setDevices([...devices, newDevice]);
                            setSelectedDeviceId(newId);
                            setIsAddingDevice(false);
                          }}
                          className="px-6 py-2 bg-[#00a2e8] hover:bg-[#008cc9] text-white font-semibold rounded text-xs transition shadow"
                        >
                          Hoàn Tất
                        </button>
                        <button
                          onClick={() => setIsAddingDevice(false)}
                          className="px-6 py-2 bg-[#3a3b46] hover:bg-[#474958] text-slate-200 font-semibold rounded text-xs transition"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* VIEW & UPDATE DEVICE PROFILE FORM */
                  <div className="space-y-5 text-xs text-slate-300">
                    {/* Row 1: Tên Gợi Nhớ */}
                    <div className="grid grid-cols-12 items-center gap-4 opacity-50">
                      <label className="col-span-3 text-right font-medium text-slate-400">Tên Gợi Nhớ</label>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={editDevName}
                          disabled
                          className="w-full px-3 py-2 bg-[#1b1c24] border border-[#2d2f3c] rounded text-slate-400 cursor-not-allowed focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3"></div>
                    </div>

                    {/* Row 2: Kênh Kết Nối */}
                    <div className="grid grid-cols-12 items-center gap-4 opacity-50">
                      <label className="col-span-3 text-right font-medium text-slate-400">Kênh Kết Nối</label>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={channelNameText}
                          disabled
                          className="w-full px-3 py-2 bg-[#1b1c24] border border-[#2d2f3c] rounded text-slate-400 cursor-not-allowed focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#111216] p-6">
            <div className="flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-3 pb-3 border-b border-[#252731] text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 items-center">
                <div className="col-span-1 text-center bg-[#1c1d26] py-2 rounded-md border border-[#2d2f3c] text-[11px]">STT</div>
                <div className="col-span-5 px-3 py-2 bg-[#1c1d26] rounded-md border border-[#2d2f3c] flex items-center justify-between">
                  <span>Tên Kênh</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </div>
                <div className="col-span-6 px-3 py-2 bg-[#1c1d26] rounded-md border border-[#2d2f3c] flex items-center justify-between">
                  <span>Tên Camera</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </div>
              </div>

              {/* Channels scroll list */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
                {(() => {
                  const channelList = Array.from<ChannelInfo>(channels.values());
                  const maxAssignedIndex = channelList.reduce(
                    (max, chan, idx) => chan.cameraMappingId ? Math.max(max, idx) : max,
                    -1
                  );
                  const visibleLimit = maxAssignedIndex + 1;

                  return channelList.map((chan, index) => {
                    if (index > visibleLimit) return null;
                    return (
                      <div key={chan.id} className="grid grid-cols-12 gap-3 items-center text-xs">
                        {/* STT Column (display order derived from position) */}
                        <div className="col-span-1 text-center font-semibold text-slate-300 bg-[#1c1d26] py-2 rounded-md border border-[#2d2f3c]/60 select-none">
                          {index + 1}
                        </div>

                        {/* Tên Kênh Column */}
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={chan.name}
                            onChange={(e) => {
                              const updated = new Map(channels);
                              updated.set(chan.id, { ...chan, name: e.target.value });
                              setChannels(updated);
                            }}
                            className="w-full px-3 py-2 bg-[#1e202b] border border-[#2d2f3c] rounded-md text-slate-200 focus:outline-none focus:border-[#00a2e8] font-medium"
                          />
                        </div>

                        {/* Tên Camera Column */}
                        <div className="col-span-6 relative">
                          <select
                            value={chan.cameraMappingId || ''}
                            onChange={(e) => {
                              const updated = new Map(channels);
                              const selectedId = e.target.value;
                              const selectedCamera = devices.find(d => d.id === selectedId);
                              updated.set(chan.id, {
                                ...chan,
                                cameraMappingId: selectedId || undefined,
                                cameraName: selectedCamera?.name || 'Không Chọn',
                              });
                              setChannels(updated);
                            }}
                            className="w-full px-3 py-2 pr-8 bg-[#1e202b] border border-[#2d2f3c] rounded-md text-slate-200 focus:outline-none focus:border-[#00a2e8] appearance-none cursor-pointer font-medium"
                          >
                            <option value="">Không Chọn</option>
                            {devices.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[#252731] flex items-center justify-end mt-4">
                {(() => {
                  const isChannelsDirty = JSON.stringify(Array.from(channels.entries())) !== JSON.stringify(Array.from(originalChannels.entries()));
                  return (
                    <button
                      disabled={!isChannelsDirty}
                      onClick={() => {
                        setOriginalChannels(new Map(channels));
                        alert('Cập nhật thông tin sơ đồ phân kênh thành công!');
                      }}
                      className={`px-6 py-2.5 rounded-lg text-xs font-bold text-white transition flex items-center space-x-2 ${isChannelsDirty
                        ? 'bg-[#00a2e8] hover:bg-[#008cc9] shadow-lg shadow-[#00a2e8]/25 cursor-pointer'
                        : 'bg-slate-700/50 text-slate-400 opacity-40 cursor-not-allowed pointer-events-none'
                        }`}
                    >
                      <Check size={14} />
                      <span>Cập Nhật Thông Tin Kênh</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
