import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { getBackendUrl } from '../../../utils/config';

// hls.js is loaded via CDN in index.html and available as window.Hls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HlsLib: any = (typeof window !== 'undefined') ? (window as any).Hls : null;
import {
  AlertCircle,
  Bell,
  Tv2,
  User,
  MapPin,
  Clock,
  WifiOff,
  Play,
  Loader2,
  X,
} from 'lucide-react';

interface RealtimeLog {
  id: string;
  hoTen: string;
  phongBan?: string;
  areaName: string;
  deviceName: string;
  time: string;
  date: string;
  cameraId: string;
  hlsUrl: string;
  imageUrl?: string;
  imageType?: string;
  status?: string;
}

// ─── HLS Video Player Component ──────────────────────────────────────────────
interface HlsPlayerProps {
  hlsUrl: string;
  label?: string;
}

// Helper to transform absolute HLS URL to a local proxy URL to bypass CORS in browser dev environment
const convertToProxyUrl = (url: string): string => {
  try {
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return url;
    }
    const urlObj = new URL(url);
    return `/HLS-PROXY/${urlObj.host}${urlObj.pathname}${urlObj.search}`;
  } catch (e) {
    return url;
  }
};

const HlsPlayer: React.FC<HlsPlayerProps> = ({ hlsUrl, label }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playerState, setPlayerState] = useState<'loading' | 'playing' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;

    destroyHls();
    setPlayerState('loading');
    setErrorMsg('');

    const video = videoRef.current;

    // Convert absolute HLS URL to relative proxy URL to bypass CORS
    const finalHlsUrl = (typeof window !== 'undefined' && window.location.protocol.startsWith('http'))
      ? convertToProxyUrl(hlsUrl)
      : hlsUrl;

    if (HlsLib && HlsLib.isSupported()) {
      // Custom loader to propagate clientToken and videoAccessToken query params to segment files (.ts)
      class CustomLoader extends HlsLib.DefaultConfig.loader {
        load(context: any, config: any, callbacks: any) {
          if (context.url && finalHlsUrl) {
            try {
              const base = finalHlsUrl.startsWith('http') ? finalHlsUrl : `${window.location.origin}${finalHlsUrl}`;
              const manifestUrl = new URL(base);
              const segmentUrl = new URL(context.url, base);

              // Copy search parameters (auth tokens) to segment URLs if not already present
              manifestUrl.searchParams.forEach((value, key) => {
                if (!segmentUrl.searchParams.has(key)) {
                  segmentUrl.searchParams.append(key, value);
                }
              });

              context.url = segmentUrl.toString();
            } catch (e) {
              console.error('Error attaching query parameters to segment:', e);
            }
          }
          super.load(context, config, callbacks);
        }
      }

      const hls = new HlsLib({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 10,
        maxBufferLength: 20,
        maxMaxBufferLength: 30,
        loader: CustomLoader,
      });
      hlsRef.current = hls;

      hls.loadSource(finalHlsUrl);
      hls.attachMedia(video);

      hls.on(HlsLib.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          // Autoplay blocked by browser — show play button instead
          setPlayerState('playing');
        });
        setPlayerState('playing');
      });

      hls.on(HlsLib.Events.ERROR, (_event: any, data: any) => {
        if (data.fatal) {
          setPlayerState('error');
          setErrorMsg(`Lỗi luồng: ${data.type} – ${data.details}`);
          destroyHls();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = finalHlsUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
        setPlayerState('playing');
      });
      video.addEventListener('error', () => {
        setPlayerState('error');
        setErrorMsg('Không thể phát luồng HLS trên trình duyệt này.');
      });
    } else {
      setPlayerState('error');
      setErrorMsg('Trình duyệt không hỗ trợ HLS.');
    }

    return destroyHls;
  }, [hlsUrl, destroyHls]);

  return (
    <div className="relative w-full aspect-video bg-[#0a0b0f] rounded-xl overflow-hidden border border-[#21232d] shadow-2xl">
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        muted
        playsInline
        controls={playerState === 'playing'}
      />

      {/* Loading overlay */}
      {playerState === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0b0f]/90 z-10">
          <Loader2 size={28} className="text-[#00a2e8] animate-spin mb-2" />
          <span className="text-xs text-slate-400">Đang kết nối luồng HLS...</span>
          {label && <span className="text-[10px] text-slate-500 mt-1 truncate max-w-[80%]">{label}</span>}
        </div>
      )}

      {/* Error overlay */}
      {playerState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0b0f]/95 z-10 p-4 text-center">
          <WifiOff size={28} className="text-rose-500 mb-2" />
          <span className="text-xs text-rose-400 font-semibold">Không thể phát stream</span>
          <span className="text-[10px] text-slate-500 mt-1 leading-relaxed max-w-xs">{errorMsg}</span>
        </div>
      )}

      {/* Camera label */}
      {playerState === 'playing' && label && (
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-[10px] text-slate-200 px-2 py-0.5 rounded font-medium border border-white/10">
          {label}
        </div>
      )}

      {/* Live dot */}
      {playerState === 'playing' && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] text-slate-200 font-bold uppercase tracking-wider">Live</span>
        </div>
      )}
    </div>
  );
};

// ─── Main Dashboard Page ──────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
  const { socket, isConnected } = useSocket();
  const [logs, setLogs] = useState<RealtimeLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<RealtimeLog | null>(null);
  const [activeCamera, setActiveCamera] = useState<{ cameraId: string; cameraName: string } | null>(null);
  const [resolvedHlsUrl, setResolvedHlsUrl] = useState<string | null>(null);
  const [isResolvingUrl, setIsResolvingUrl] = useState<boolean>(false);

  // Fetch backend status on mount to auto-select the first camera
  useEffect(() => {
    const backendUrl = getBackendUrl();
    console.log('Fetching initial Lovad status to load the first camera...');
    fetch(`${backendUrl}/lovad/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.activeCameras && data.activeCameras.length > 0) {
          const firstCam = data.activeCameras[0];
          console.log('Auto-selected first camera on load:', firstCam);
          setActiveCamera({ cameraId: firstCam.cameraId, cameraName: firstCam.cameraName });
        }
      })
      .catch((err) => {
        console.error('Error fetching initial status to load first camera:', err);
      });
  }, []);

  // Dynamically resolve the stream URL with fresh tokens from the backend when activeCamera changes.
  // This prevents 401 (Unauthorized) errors due to expired client/video tokens.
  useEffect(() => {
    if (!activeCamera) {
      setResolvedHlsUrl(null);
      return;
    }

    let isMounted = true;
    setIsResolvingUrl(true);
    setResolvedHlsUrl(null);

    const backendUrl = getBackendUrl();
    console.log(`Resolving stream URL for camera ${activeCamera.cameraId}...`);
    
    fetch(`${backendUrl}/lovad/stream/${activeCamera.cameraId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.hlsUrl) {
          console.log('Resolved HLS Url successfully:', data.hlsUrl);
          setResolvedHlsUrl(data.hlsUrl);
        }
      })
      .catch((err) => {
        console.error('Error resolving stream URL from backend:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsResolvingUrl(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeCamera]);

  // Listen to socket realtime logs
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeLog = (log: any) => {
      const newLog: RealtimeLog = {
        id: log.id,
        hoTen: log.hoTen,
        phongBan: log.phongBan,
        areaName: log.areaName,
        deviceName: log.deviceName,
        time: log.time,
        date: log.date,
        cameraId: log.cameraId,
        hlsUrl: log.hlsUrl,
        imageUrl: log.imageUrl,
        imageType: log.imageType,
        status: log.status,
      };

      setLogs((prev) => {
        const updated = [newLog, ...prev].slice(0, 50);
        return updated;
      });

      // Just update selectedLog visually, DO NOT switch the active stream camera
      setSelectedLog(newLog);
    };

    socket.on('realtime_log', handleRealtimeLog);
    return () => {
      socket.off('realtime_log', handleRealtimeLog);
    };
  }, [socket]);

  const handleSelectLog = (log: RealtimeLog) => {
    setSelectedLog(log);
    // DO NOT change activeCamera here, keep the stream locked to the first camera
  };

  const handleClosePlayer = () => {
    setSelectedLog(null);
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'text-slate-400';
    if (status.includes('Thành công') || status.includes('thành công')) return 'text-emerald-400';
    if (status.includes('Cảnh báo') || status.includes('cảnh báo')) return 'text-amber-400';
    if (status.includes('Thông tin')) return 'text-sky-400';
    return 'text-slate-400';
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0e0f14]">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#21232d] bg-[#111216] shrink-0">
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-100">Bảng điều khiển</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Giám sát nhận diện khuôn mặt thời gian thực</p>
        </div>
        <div className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="font-medium">{isConnected ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: HLS Player panel ───────────────────────────────────── */}
        <div className="flex flex-col flex-1 p-5 overflow-hidden min-w-0">
          {/* Player card */}
          <div className="flex flex-col bg-[#14151b] rounded-xl border border-[#21232d] overflow-hidden shadow-xl flex-shrink-0">
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#21232d] bg-[#111216]">
              <div className="flex items-center gap-2">
                <Tv2 size={14} className="text-[#00a2e8]" />
                <span className="text-xs font-semibold text-slate-200">
                  {activeCamera ? `Camera: ${activeCamera.cameraName}` : 'HLS Live Stream'}
                </span>
              </div>
            </div>

            {/* Player body */}
            <div className="p-3">
              {isResolvingUrl ? (
                <div className="aspect-video bg-[#0a0b0f] rounded-xl border border-[#21232d] flex flex-col items-center justify-center text-center p-6">
                  <Loader2 size={28} className="text-[#00a2e8] animate-spin mb-2" />
                  <span className="text-xs text-slate-400">Đang lấy cấu hình luồng mới nhất...</span>
                </div>
              ) : resolvedHlsUrl ? (
                <HlsPlayer
                  key={resolvedHlsUrl}
                  hlsUrl={resolvedHlsUrl}
                  label={activeCamera?.cameraName}
                />
              ) : (
                <div className="aspect-video bg-[#0a0b0f] rounded-xl border border-[#21232d] flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-[#00a2e8]/10 border border-[#00a2e8]/20 flex items-center justify-center mb-3">
                    <Play size={20} className="text-[#00a2e8] ml-0.5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">Chưa có luồng video</p>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed max-w-xs">
                    Đang đợi sự kiện FaceID từ hệ thống LOVAD. Khi có sự kiện, luồng HLS sẽ tự động phát.
                  </p>
                </div>
              )}
            </div>

            {/* Selected log info bar */}
            {selectedLog && activeCamera && selectedLog.cameraId === activeCamera.cameraId && (
              <div className="px-4 py-2.5 border-t border-[#21232d] bg-[#0e0f14] grid grid-cols-3 gap-3">
                <div className="flex items-center gap-1.5">
                  <User size={10} className="text-slate-500 shrink-0" />
                  <span className="text-[10px] text-slate-300 truncate">{selectedLog.hoTen}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={10} className="text-slate-500 shrink-0" />
                  <span className="text-[10px] text-slate-300 truncate">{selectedLog.areaName}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Clock size={10} className="text-slate-500 shrink-0" />
                  <span className="text-[10px] text-[#00a2e8] font-semibold">{selectedLog.time}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Notifications panel ───────────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col border-l border-[#21232d] bg-[#14151b] overflow-hidden">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-[#21232d] flex items-center gap-2 bg-[#111216] shrink-0">
            <Bell size={13} className="text-[#00a2e8]" />
            <span className="text-xs font-semibold text-slate-200">Sự kiện</span>
            {logs.length > 0 && (
              <span className="ml-auto bg-[#00a2e8]/20 text-[#00a2e8] text-[9px] font-bold px-2 py-0.5 rounded-full">
                {logs.length}
              </span>
            )}
          </div>

          {/* Events list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <AlertCircle size={18} className="text-slate-600 mb-2" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">Trống</span>
                <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
                  Đang chờ sự kiện FaceID...
                </p>
              </div>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <button
                    key={log.id}
                    onClick={() => handleSelectLog(log)}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#00a2e8]/10 border-[#00a2e8]/30'
                        : 'bg-[#1b1c24]/50 border-transparent hover:bg-[#1b1c24] hover:border-[#2d3142]'
                    }`}
                  >
                    {/* Face thumbnail */}
                    <div className="w-9 h-9 rounded-md bg-[#252836] shrink-0 overflow-hidden border border-[#2d3142] flex items-center justify-center">
                      {log.imageUrl ? (
                        <img src={log.imageUrl} alt="Face" className="w-full h-full object-cover" />
                      ) : (
                        <User size={14} className="text-slate-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[11px] font-bold text-slate-200 truncate leading-tight">
                          {log.hoTen}
                        </span>
                        <span className="text-[9px] text-[#00a2e8] font-semibold shrink-0">{log.time}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 truncate mt-0.5">{log.areaName}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[9px] text-slate-600 truncate">{log.date}</p>
                        {log.hlsUrl && (
                          <span className="flex items-center gap-0.5 text-[8px] text-[#00a2e8]/70 font-medium">
                            <Tv2 size={8} />
                            HLS
                          </span>
                        )}
                      </div>
                      {log.status && (
                        <p className={`text-[9px] font-medium mt-0.5 ${getStatusColor(log.status)}`}>
                          {log.status}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
