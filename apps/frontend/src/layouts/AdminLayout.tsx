import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Monitor, FileText, Layers, Users, CalendarClock, LayoutDashboard } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const AdminLayout: React.FC = () => {
  const { isConnected } = useSocket();

  return (
    <div id="app-window" className="min-h-screen bg-[#0e0f14] text-slate-100 font-sans flex flex-col overflow-hidden select-none">

      {/* Main Container Layout: Sidebar + Main Content Panel */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar */}
        <div id="sidebar" className="w-64 bg-[#14151b] border-r border-[#21232d] flex flex-col shrink-0">

          {/* Sidebar Logo / Branding */}
          <div className="p-5 border-b border-[#21232d] flex items-center space-x-3 bg-[#111216]">
            <div className="p-2 rounded-lg bg-[#00a2e8]/10 text-[#00a2e8] border border-[#00a2e8]/20">
              <Monitor size={18} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-tight">Hệ Thống AI FaceID</h2>
              <p className={`text-[10px] font-medium flex items-center gap-1.5 ${isConnected ? 'text-emerald-400' : 'text-rose-500'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isConnected ? 'Máy chủ trực tuyến' : 'Mất kết nối Web Server'}
              </p>
            </div>
          </div>

          {/* Sidebar Items */}
          <div className="p-3 flex-1 space-y-1.5">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-3 mb-2">Chức năng</p>

            {/* Sidebar Item 0: Bảng điều khiển (Hidden) */}
            {/* <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `w-full flex items-center space-x-3 px-3 py-2.5 rounded-r-lg rounded-l-none text-xs font-medium transition-all duration-200 group ${isActive
                  ? 'bg-[#00a2e8]/10 text-[#00a2e8] border-l-4 border-[#00a2e8]'
                  : 'text-slate-400 hover:bg-[#1a1c24] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <LayoutDashboard size={16} className={isActive ? 'text-[#00a2e8]' : 'text-slate-400 group-hover:text-slate-200'} />
                  <span>Bảng điều khiển</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />}
                </>
              )}
            </NavLink> */}

            {/* Sidebar Item 1: Báo cáo */}
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `w-full flex items-center space-x-3 px-3 py-2.5 rounded-r-lg rounded-l-none text-xs font-medium transition-all duration-200 group ${isActive
                  ? 'bg-[#00a2e8]/10 text-[#00a2e8] border-l-4 border-[#00a2e8]'
                  : 'text-slate-400 hover:bg-[#1a1c24] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <FileText size={16} className={isActive ? 'text-[#00a2e8]' : 'text-slate-400 group-hover:text-slate-200'} />
                  <span>Báo cáo</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />}
                </>
              )}
            </NavLink>

            {/* Sidebar Item 2: Quản lý khu vực */}
            <NavLink
              to="/areas"
              className={({ isActive }) =>
                `w-full flex items-center space-x-3 px-3 py-2.5 rounded-r-lg rounded-l-none text-xs font-medium transition-all duration-200 group ${isActive
                  ? 'bg-[#00a2e8]/10 text-[#00a2e8] border-l-4 border-[#00a2e8]'
                  : 'text-slate-400 hover:bg-[#1a1c24] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Layers size={16} className={isActive ? 'text-[#00a2e8]' : 'text-slate-400 group-hover:text-slate-200'} />
                  <span>Quản lý khu vực</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />}
                </>
              )}
            </NavLink>

            {/* Sidebar Item 3: Quản lý thiết bị */}
            <NavLink
              to="/devices"
              className={({ isActive }) =>
                `w-full flex items-center space-x-3 px-3 py-2.5 rounded-r-lg rounded-l-none text-xs font-medium transition-all duration-200 group ${isActive
                  ? 'bg-[#00a2e8]/10 text-[#00a2e8] border-l-4 border-[#00a2e8]'
                  : 'text-slate-400 hover:bg-[#1a1c24] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Monitor size={16} className={isActive ? 'text-[#00a2e8]' : 'text-slate-400 group-hover:text-slate-200'} />
                  <span>Quản lý thiết bị</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />}
                </>
              )}
            </NavLink>

            {/* Sidebar Item 4: Quản lý nhân viên */}
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                `w-full flex items-center space-x-3 px-3 py-2.5 rounded-r-lg rounded-l-none text-xs font-medium transition-all duration-200 group ${isActive
                  ? 'bg-[#00a2e8]/10 text-[#00a2e8] border-l-4 border-[#00a2e8]'
                  : 'text-slate-400 hover:bg-[#1a1c24] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Users size={16} className={isActive ? 'text-[#00a2e8]' : 'text-slate-400 group-hover:text-slate-200'} />
                  <span>Quản lý nhân viên</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />}
                </>
              )}
            </NavLink>

            {/* Sidebar Item 5: Quản lý lịch ra vào */}
            <NavLink
              to="/access-schedule"
              className={({ isActive }) =>
                `w-full flex items-center space-x-3 px-3 py-2.5 rounded-r-lg rounded-l-none text-xs font-medium transition-all duration-200 group ${isActive
                  ? 'bg-[#00a2e8]/10 text-[#00a2e8] border-l-4 border-[#00a2e8]'
                  : 'text-slate-400 hover:bg-[#1a1c24] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <CalendarClock size={16} className={isActive ? 'text-[#00a2e8]' : 'text-slate-400 group-hover:text-slate-200'} />
                  <span>Quản lý lịch ra vào</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />}
                </>
              )}
            </NavLink>
          </div>

          {/* Sidebar Bottom Metadata Footer */}
          <div className="p-4 border-t border-[#21232d] bg-[#111216]">
            <div className="opacity-0 select-none pointer-events-none h-6">Spacer</div>
          </div>
        </div>

        {/* Main Application Workspace Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#111216]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
