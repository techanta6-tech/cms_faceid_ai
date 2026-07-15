import { useState, FormEvent, useEffect } from 'react';
import {
  Users,
  Search,
  X,
  Check,
  Plus,
  FolderOpen,
  Sparkles,
  Layers,
  ChevronDown,
  Save,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../../context/AppContext';
import { getAvatarUrl } from '../../../utils/avatar';

// 3. EMPLOYEES PAGE COMPONENT
// ==========================================
export const EmployeesPage = () => {
  const { employees, setEmployees } = useApp();

  const [activeEmployeeSubTab, setActiveEmployeeSubTab] = useState<'employees-list' | 'humanGroups-list' | 'add-employee'>('employees-list');
  const [savedCount, setSavedCount] = useState<number>(0);

  interface HumanGroup {
    id: string;
    name: string;
  }

  const [humanGroups, setHumanGroups] = useState<HumanGroup[]>([]);
  const [isRefreshingGroups, setIsRefreshingGroups] = useState(false);
  const [isRefreshingEmployees, setIsRefreshingEmployees] = useState(false);

  const fetchGroups = async () => {
    setIsRefreshingGroups(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_WS_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/human-list`);
      const data = await res.json();
      setHumanGroups(
        (data as any[]).map((item) => ({ id: item.id, name: item.name || item.id }))
      );
    } catch (e) {
      console.warn('Failed to load human-list from API:', e);
      setHumanGroups([]);
    } finally {
      setIsRefreshingGroups(false);
    }
  };

  const fetchEmployees = async () => {
    setIsRefreshingEmployees(true);
    try {
      const baseUrl = (import.meta as any).env.VITE_WS_URL || 'http://localhost:3001';
      const resList = await fetch(`${baseUrl}/human-list`);
      const lists = await resList.json();
      const listMap: Record<string, string> = {};
      (lists as any[]).forEach((item) => { listMap[item.id] = item.name; });
      const resHumans = await fetch(`${baseUrl}/human`);
      const humans = await resHumans.json();
      const formatDate = (dateVal: any) => {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      };
      setEmployees(
        (humans as any[]).map((h) => ({
          id: h.id,
          hoTen: h.full_name || 'Không Tên',
          maGiayTo: h.document_id || '',
          human_group: (h.list_ids || []).map((lid: string) => listMap[lid] || lid),
          loaiGiayTo: h.id_type || 'CCCD',
          ngayCap: formatDate(h.release_date),
          noiCap: h.issued_by || '',
          ngaySinh: formatDate(h.birthday),
          gioiTinh: h.gender === 1 ? 'Nam' : 'Nữ',
          soDienThoai: h.phone_number || '',
          email: h.email || '',
          diaChi: h.address || '',
          anhDaiDien: h.avatar_base64 ? { name: 'avatar.jpg', url: h.avatar_base64 } : undefined,
        }))
      );
    } catch (e: any) {
      console.warn('Failed to refresh employees:', e.message);
    } finally {
      setIsRefreshingEmployees(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);
  const [newDepartmentInput, setNewDepartmentInput] = useState('');
  const [showEmployeeSaveToast, setShowEmployeeSaveToast] = useState<boolean>(false);
  const [showAddGroupDemo, setShowAddGroupDemo] = useState(false);

  interface NewEmployee {
    id: string;
    hoTen: string;
    maGiayTo: string;
    human_group: string[];
    loaiGiayTo: string;
    ngayCap: string;
    noiCap: string;
    ngaySinh: string;
    gioiTinh: string;
    soDienThoai: string;
    email: string;
    diaChi: string;
    anhDaiDien?: { name: string; url: string };
    anhThe?: { name: string; url: string };
    anhKhuonMat?: { name: string; url: string };
    showOptional: boolean;
  }

  const createEmptyNewEmployee = (): NewEmployee => ({
    id: 'EMP_' + Math.random().toString(36).substring(2, 11).toUpperCase(),
    hoTen: '',
    maGiayTo: '',
    human_group: [],
    loaiGiayTo: 'CCCD',
    ngayCap: '',
    noiCap: '',
    ngaySinh: '',
    gioiTinh: 'Nam',
    soDienThoai: '',
    email: '',
    diaChi: '',
    showOptional: false,
  });

  const [newEmployees, setNewEmployees] = useState<NewEmployee[]>([
    {
      id: 'EMP_1',
      hoTen: '',
      maGiayTo: '',
      human_group: [],
      loaiGiayTo: 'CCCD',
      ngayCap: '',
      noiCap: '',
      ngaySinh: '',
      gioiTinh: 'Nam',
      soDienThoai: '',
      email: '',
      diaChi: '',
      showOptional: false,
    }
  ]);

  const updateNewEmployee = (index: number, field: keyof NewEmployee, value: any) => {
    const updated = [...newEmployees];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setNewEmployees(updated);
  };

  const handleSaveEmployees = (e: FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < newEmployees.length; i++) {
      const emp = newEmployees[i];
      if (!emp.hoTen.trim()) {
        alert(`Nhân viên thứ ${i + 1}: Họ tên là bắt buộc!`);
        return;
      }
      if (!emp.maGiayTo.trim()) {
        alert(`Nhân viên thứ ${i + 1}: Mã giấy tờ là bắt buộc!`);
        return;
      }
      if (emp.human_group.length === 0) {
        alert(`Nhân viên thứ ${i + 1}: Vui lòng chọn ít nhất một nhóm nhân viên!`);
        return;
      }
    }

    const savedList = newEmployees.map(emp => ({
      id: emp.id,
      hoTen: emp.hoTen,
      maGiayTo: emp.maGiayTo,
      human_group: emp.human_group,
      loaiGiayTo: emp.loaiGiayTo || 'CCCD',
      ngayCap: emp.ngayCap || 'Chưa cập nhật',
      noiCap: emp.noiCap || 'Chưa cập nhật',
      ngaySinh: emp.ngaySinh || 'Chưa cập nhật',
      gioiTinh: emp.gioiTinh || 'Chưa cập nhật',
      soDienThoai: emp.soDienThoai || 'Chưa cập nhật',
      email: emp.email || 'Chưa cập nhật',
      diaChi: emp.diaChi || 'Chưa cập nhật',
      anhDaiDien: emp.anhDaiDien,
      anhThe: emp.anhThe,
      anhKhuonMat: emp.anhKhuonMat
    }));

    setEmployees([...employees, ...savedList]);
    setSavedCount(newEmployees.length);
    setShowEmployeeSaveToast(true);
    setTimeout(() => setShowEmployeeSaveToast(false), 4000);

    setNewEmployees([createEmptyNewEmployee()]);
    setActiveEmployeeSubTab('employees-list');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0d0e12]">
      {/* Header Tab Navigator */}
      <div id="employee-tabs-bar" className="h-14 bg-[#181921] border-b border-[#252731] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-xs text-slate-400 font-semibold tracking-wider">Nhân Viên</div>

          {/* Sliding Big Pill Segmented Control Container */}
          <div className="flex bg-[#111218] p-1 rounded-full border border-[#2d2f3c] space-x-1">
            {/* Tab 1: Quản lý nhân sự */}
            <button
              id="tab-btn-employee-manage"
              onClick={() => setActiveEmployeeSubTab('employees-list')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 cursor-pointer ${activeEmployeeSubTab === 'employees-list'
                ? 'bg-[#00a2e8]/10 text-[#00a2e8] shadow-lg shadow-[#00a2e8]/10'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Users size={14} />
              <span>Quản lý nhân sự</span>
            </button>

            {/* Tab 2: Quản lý nhóm nhân viên */}
            <button
              id="tab-btn-department-manage"
              onClick={() => setActiveEmployeeSubTab('humanGroups-list')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 cursor-pointer ${activeEmployeeSubTab === 'humanGroups-list'
                ? 'bg-[#00a2e8]/10 text-[#00a2e8] shadow-lg shadow-[#00a2e8]/10'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Layers size={14} />
              <span>Quản lý nhóm nhân viên</span>
            </button>

            {/* Tab 3: Thêm nhân viên */}
            {/* <button
              id="tab-btn-add-employee"
              onClick={() => {
                setNewEmployees([createEmptyNewEmployee()]);
                setActiveEmployeeSubTab('add-employee');
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-all duration-200 cursor-pointer ${activeEmployeeSubTab === 'add-employee'
                  ? 'bg-[#00a2e8]/10 text-[#00a2e8] shadow-lg shadow-[#00a2e8]/10'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Plus size={14} />
              <span>Thêm nhân viên</span>
            </button> */}
          </div>
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-auto bg-[#111216] p-6 text-left">
        {activeEmployeeSubTab === 'employees-list' ? (
          /* Quản lý nhân sự */
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#14151c] border border-[#21232d] p-4 rounded-xl shadow-md">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Users size={16} className="text-[#00a2e8]" />
                  Danh sách nhân sự ({employees.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Quản lý, tìm kiếm và phân nhóm nhân viên cho toàn bộ cán bộ nhân viên trong hệ thống.</p>
              </div>

              {/* Button Thêm nhân viên */}
              {/* <button
                onClick={() => {
                  setNewEmployees([createEmptyNewEmployee()]);
                  setActiveEmployeeSubTab('add-employee');
                }}
                className="py-2 px-4 bg-[#00a2e8] hover:bg-[#008cc9] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#00a2e8]/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>Thêm nhân viên</span>
              </button> */}
              <button
                onClick={fetchEmployees}
                disabled={isRefreshingEmployees}
                className="py-1.5 px-3 bg-[#1c1d26] hover:bg-[#252632] border border-[#2d2f3c] text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                title="Tải lại dữ liệu từ DB"
              >
                <RefreshCw size={12} className={isRefreshingEmployees ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Toolbar: nút Refresh phía trên bảng */}
            <div className="flex items-center justify-end">

            </div>

            {/* Employees list table/cards */}
            <div className="bg-[#14151c] border border-[#21232d] rounded-2xl overflow-hidden shadow-xl">
              {employees.length === 0 ? (
                <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
                  <Users size={40} className="text-slate-600 mb-3 opacity-60" />
                  <span className="text-xs font-medium">Không có nhân viên nào trong danh sách.</span>
                  <button
                    onClick={() => {
                      setNewEmployees([createEmptyNewEmployee()]);
                      setActiveEmployeeSubTab('add-employee');
                    }}
                    className="mt-3 text-[#00a2e8] hover:underline text-xs font-semibold"
                  >
                    Thêm nhân viên ngay
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#181921] border-b border-[#21232d] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-4 w-12 text-center">STT</th>
                        <th className="p-4">Nhân sự</th>
                        <th className="p-4">Giấy tờ tùy thân</th>
                        <th className="p-4">Nhóm nhân viên</th>
                        <th className="p-4">Liên hệ</th>
                        <th className="p-4 w-20 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e202b]">
                      {employees.map((emp, index) => (
                        <tr key={emp.id} className="hover:bg-[#181a24] transition text-xs">
                          {/* STT */}
                          <td className="p-4 text-center font-mono text-slate-400">{index + 1}</td>

                          {/* Profile & Name */}
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              {/* Avatar with hover preview if exists */}
                              <div className="relative group/avatar">
                                <img
                                  src={emp.anhDaiDien?.url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80'}
                                  alt={emp.hoTen}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-700/60"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-0 left-0 w-8 h-8 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition text-[9px] text-white font-bold pointer-events-none">
                                  INFO
                                </div>
                              </div>

                              <div>
                                <div className="font-bold text-slate-100">{emp.hoTen}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{emp.id}</div>
                              </div>
                            </div>
                          </td>

                          {/* Identity papers */}
                          <td className="p-4">
                            <div className="font-semibold text-slate-300">{emp.maGiayTo}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">Loại: {emp.loaiGiayTo || 'CCCD'}</div>
                          </td>

                          {/* Departments badge array */}
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {emp.human_group && emp.human_group.map((p: string, pIdx: number) => (
                                <span
                                  key={pIdx}
                                  className="px-2 py-0.5 rounded bg-[#00a2e8]/10 text-[#00a2e8] text-[10px] font-bold border border-[#00a2e8]/20"
                                >
                                  {p}
                                </span>
                              ))}
                              {(!emp.human_group || emp.human_group.length === 0) && (
                                <span className="text-[10px] text-slate-500 italic">Chưa xếp phòng</span>
                              )}
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="p-4">
                            <div className="text-slate-300 font-medium">{emp.soDienThoai && emp.soDienThoai !== 'Chưa cập nhật' ? emp.soDienThoai : 'N/A'}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{emp.email && emp.email !== 'Chưa cập nhật' ? emp.email : 'N/A'}</div>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-center">
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc chắn muốn xóa nhân sự "${emp.hoTen}" khỏi hệ thống không?`)) {
                                  setEmployees(employees.filter(e => e.id !== emp.id));
                                }
                              }}
                              className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition cursor-pointer"
                              title="Xóa nhân sự"
                            >
                              <X size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : activeEmployeeSubTab === 'add-employee' ? (
          /* Form Thêm nhân viên */
          <div className="max-w-4xl mx-auto space-y-6 pb-16">
            <div className="bg-[#14151c] border border-[#21232d] p-4 rounded-xl shadow-md flex items-center space-x-3">
              <div className="p-2 bg-[#00a2e8]/10 rounded-lg text-[#00a2e8]">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Khai báo thông tin thêm mới nhân sự</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Nhập đầy đủ thông tin bắt buộc và tải lên tài liệu hình ảnh trực quan.</p>
              </div>
            </div>

            <form onSubmit={handleSaveEmployees} className="space-y-6">
              {newEmployees.map((emp, index) => (
                <div
                  key={emp.id}
                  className="bg-[#14151c] border border-[#21232d] rounded-2xl p-6 relative shadow-lg"
                >
                  {/* Card Header & Remove Button */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#21232d] mb-5">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-[#00a2e8]/20 text-[#00a2e8] flex items-center justify-center font-bold text-[10px]">
                        {index + 1}
                      </div>
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Nhân viên thứ {index + 1}</span>
                    </div>

                    {newEmployees.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewEmployees(newEmployees.filter(e => e.id !== emp.id));
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition"
                      >
                        <X size={12} />
                        <span>Xóa bớt</span>
                      </button>
                    )}
                  </div>

                  {/* 1. CÁC TRƯỜNG BẮT BUỘC (Họ tên, Mã giấy tờ, Nhóm nhân viên) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* Họ tên */}
                    <div className="md:col-span-4 space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Họ tên <span className="text-red-500 ml-1 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={emp.hoTen}
                        onChange={(e) => updateNewEmployee(index, 'hoTen', e.target.value)}
                        placeholder="Nhập họ và tên..."
                        className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all h-[40px] font-medium"
                      />
                    </div>

                    {/* Mã giấy tờ */}
                    <div className="md:col-span-4 space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Mã giấy tờ <span className="text-red-500 ml-1 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={emp.maGiayTo}
                        onChange={(e) => updateNewEmployee(index, 'maGiayTo', e.target.value)}
                        placeholder="Ví dụ: CCCD số..."
                        className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all h-[40px] font-medium"
                      />
                    </div>

                    {/* Nhóm nhân viên (Multiselectable) */}
                    <div className="md:col-span-4 space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        Nhóm nhân viên <span className="text-red-500 ml-1 font-bold">*</span>
                      </label>
                      <div className="bg-[#1c1d26] border border-[#2d2f3c] rounded-xl p-2 min-h-[40px] flex flex-wrap gap-1.5">
                        {humanGroups.map(dep => {
                          const isSelected = emp.human_group.includes(dep.name);
                          return (
                            <button
                              key={dep.id}
                              type="button"
                              onClick={() => {
                                const updatedHumanGroup = isSelected
                                  ? emp.human_group.filter(p => p !== dep.name)
                                  : [...emp.human_group, dep.name];
                                updateNewEmployee(index, 'human_group', updatedHumanGroup);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${isSelected
                                ? 'bg-[#00a2e8]/15 text-[#00a2e8] border-[#00a2e8]/50'
                                : 'bg-[#14151c] text-slate-400 border-[#2d2f3c] hover:border-slate-500'
                                }`}
                            >
                              {dep.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* DISCLOSURE: NÚT HIỂN THỊ CÁC THÔNG TIN KHÔNG BẮT BUỘC */}
                  <div className="mt-5 pt-3 border-t border-[#1e202b]">
                    <button
                      type="button"
                      onClick={() => {
                        updateNewEmployee(index, 'showOptional', !emp.showOptional);
                      }}
                      className="w-full py-2 px-4 bg-[#1c1d26] hover:bg-[#252632] border border-[#2d2f3c] rounded-xl text-slate-400 hover:text-slate-200 transition-all text-xs font-semibold flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        {emp.showOptional ? 'Ẩn thông tin không bắt buộc' : 'Hiện thêm thông tin không bắt buộc (Ngày sinh, Liên hệ, Tài liệu ảnh, ...)'}
                      </span>
                      <ChevronDown size={14} className={`transform transition-transform duration-200 ${emp.showOptional ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* 2. CÁC TRƯỜNG KHÔNG BẮT BUỘC (MẶC ĐỊNH ẨN, BẬT DISCLOSURE ĐỂ HIỆN) */}
                  {emp.showOptional && (
                    <div className="mt-5 space-y-5 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Loại giấy tờ */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loại giấy tờ</label>
                          <select
                            value={emp.loaiGiayTo}
                            onChange={(e) => updateNewEmployee(index, 'loaiGiayTo', e.target.value)}
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all h-[38px] cursor-pointer"
                          >
                            <option value="CCCD">Căn cước công dân (CCCD)</option>
                            <option value="Hộ chiếu">Hộ chiếu</option>
                            <option value="Thẻ thành viên">Thẻ thành viên</option>
                            <option value="Giấy phép lái xe">Giấy phép lái xe</option>
                          </select>
                        </div>

                        {/* Ngày sinh */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày sinh</label>
                          <input
                            type="date"
                            value={emp.ngaySinh}
                            onChange={(e) => updateNewEmployee(index, 'ngaySinh', e.target.value)}
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all h-[38px]"
                          />
                        </div>

                        {/* Giới tính */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Giới tính</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['Nam', 'Nữ', 'Khác'].map(gender => (
                              <button
                                key={gender}
                                type="button"
                                onClick={() => updateNewEmployee(index, 'gioiTinh', gender)}
                                className={`py-1.5 border rounded-xl text-xs font-semibold transition cursor-pointer ${emp.gioiTinh === gender
                                  ? 'bg-[#00a2e8]/10 text-[#00a2e8] border-[#00a2e8]'
                                  : 'bg-[#1c1d26] text-slate-400 border-[#2d2f3c] hover:border-slate-500'
                                  }`}
                              >
                                {gender}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Số điện thoại */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</label>
                          <input
                            type="tel"
                            value={emp.soDienThoai}
                            onChange={(e) => updateNewEmployee(index, 'soDienThoai', e.target.value)}
                            placeholder="Ví dụ: 0912..."
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all h-[38px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Ngày cấp */}
                        <div className="md:col-span-3 space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ngày cấp</label>
                          <input
                            type="date"
                            value={emp.ngayCap}
                            onChange={(e) => updateNewEmployee(index, 'ngayCap', e.target.value)}
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all h-[38px]"
                          />
                        </div>

                        {/* Nơi cấp */}
                        <div className="md:col-span-3 space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nơi cấp</label>
                          <input
                            type="text"
                            value={emp.noiCap}
                            onChange={(e) => updateNewEmployee(index, 'noiCap', e.target.value)}
                            placeholder="Cục Cảnh Sát QLHC..."
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all h-[38px]"
                          />
                        </div>

                        {/* Email */}
                        <div className="md:col-span-3 space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</label>
                          <input
                            type="email"
                            value={emp.email}
                            onChange={(e) => updateNewEmployee(index, 'email', e.target.value)}
                            placeholder="example@company.com"
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all h-[38px]"
                          />
                        </div>

                        {/* Địa chỉ */}
                        <div className="md:col-span-3 space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ</label>
                          <input
                            type="text"
                            value={emp.diaChi}
                            onChange={(e) => updateNewEmployee(index, 'diaChi', e.target.value)}
                            placeholder="Thành phố, Quận..."
                            className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-xl px-3 py-2 text-xs text-white focus:outline-none transition-all h-[38px]"
                          />
                        </div>
                      </div>

                      {/* HÀNH ẢNH TÀI LIỆU (Ảnh đại diện, Ảnh thẻ, Ảnh khuôn mặt) */}
                      <div className="pt-3 border-t border-[#1e202b] grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Ảnh Đại diện */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ảnh Đại Diện</label>
                          <div className="bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl p-3 flex items-center justify-between transition-all">
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              <input
                                type="file"
                                accept="image/*"
                                id={`upload-avatar-${emp.id}`}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const url = URL.createObjectURL(file);
                                    updateNewEmployee(index, 'anhDaiDien', { name: file.name, url });
                                  }
                                }}
                              />
                              <label
                                htmlFor={`upload-avatar-${emp.id}`}
                                className="px-2.5 py-1.5 bg-[#0d0e12] border border-[#2d2f3c] hover:border-slate-500 rounded-lg text-[10px] font-bold text-slate-300 cursor-pointer flex items-center gap-1 select-none shrink-0"
                              >
                                <FolderOpen size={11} />
                                <span>Chọn file</span>
                              </label>

                              {emp.anhDaiDien ? (
                                <div className="relative group/tooltip overflow-hidden text-ellipsis whitespace-nowrap">
                                  <span className="text-[11px] text-[#00a2e8] hover:underline cursor-pointer font-medium">
                                    {emp.anhDaiDien.name}
                                  </span>
                                  {/* Hover Preview Tooltip */}
                                  <div className="fixed md:absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50 bg-[#16171d] border border-[#2d2f3c] p-1.5 rounded-xl shadow-2xl w-28 h-28">
                                    <img
                                      src={emp.anhDaiDien.url}
                                      alt="Ảnh đại diện"
                                      className="w-full h-full object-cover rounded-lg"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">Chưa chọn ảnh</span>
                              )}
                            </div>
                            {emp.anhDaiDien && (
                              <button
                                type="button"
                                onClick={() => updateNewEmployee(index, 'anhDaiDien', undefined)}
                                className="text-red-400 hover:text-red-300 shrink-0"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Ảnh Thẻ */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ảnh Thẻ</label>
                          <div className="bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl p-3 flex items-center justify-between transition-all">
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              <input
                                type="file"
                                accept="image/*"
                                id={`upload-card-${emp.id}`}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const url = URL.createObjectURL(file);
                                    updateNewEmployee(index, 'anhThe', { name: file.name, url });
                                  }
                                }}
                              />
                              <label
                                htmlFor={`upload-card-${emp.id}`}
                                className="px-2.5 py-1.5 bg-[#0d0e12] border border-[#2d2f3c] hover:border-slate-500 rounded-lg text-[10px] font-bold text-slate-300 cursor-pointer flex items-center gap-1 select-none shrink-0"
                              >
                                <FolderOpen size={11} />
                                <span>Chọn file</span>
                              </label>

                              {emp.anhThe ? (
                                <div className="relative group/tooltip overflow-hidden text-ellipsis whitespace-nowrap">
                                  <span className="text-[11px] text-[#00a2e8] hover:underline cursor-pointer font-medium">
                                    {emp.anhThe.name}
                                  </span>
                                  {/* Hover Preview Tooltip */}
                                  <div className="fixed md:absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50 bg-[#16171d] border border-[#2d2f3c] p-1.5 rounded-xl shadow-2xl w-28 h-28">
                                    <img
                                      src={emp.anhThe.url}
                                      alt="Ảnh thẻ"
                                      className="w-full h-full object-cover rounded-lg"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">Chưa chọn ảnh</span>
                              )}
                            </div>
                            {emp.anhThe && (
                              <button
                                type="button"
                                onClick={() => updateNewEmployee(index, 'anhThe', undefined)}
                                className="text-red-400 hover:text-red-300 shrink-0"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Ảnh Khuôn Mặt */}
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ảnh Khuôn Mặt</label>
                          <div className="bg-[#1c1d26] border border-[#2d2f3c] hover:border-[#00a2e8] rounded-xl p-3 flex items-center justify-between transition-all">
                            <div className="flex items-center space-x-2.5 overflow-hidden">
                              <input
                                type="file"
                                accept="image/*"
                                id={`upload-face-${emp.id}`}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const url = URL.createObjectURL(file);
                                    updateNewEmployee(index, 'anhKhuonMat', { name: file.name, url });
                                  }
                                }}
                              />
                              <label
                                htmlFor={`upload-face-${emp.id}`}
                                className="px-2.5 py-1.5 bg-[#0d0e12] border border-[#2d2f3c] hover:border-slate-500 rounded-lg text-[10px] font-bold text-slate-300 cursor-pointer flex items-center gap-1 select-none shrink-0"
                              >
                                <FolderOpen size={11} />
                                <span>Chọn file</span>
                              </label>

                              {emp.anhKhuonMat ? (
                                <div className="relative group/tooltip overflow-hidden text-ellipsis whitespace-nowrap">
                                  <span className="text-[11px] text-[#00a2e8] hover:underline cursor-pointer font-medium">
                                    {emp.anhKhuonMat.name}
                                  </span>
                                  {/* Hover Preview Tooltip */}
                                  <div className="fixed md:absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block z-50 bg-[#16171d] border border-[#2d2f3c] p-1.5 rounded-xl shadow-2xl w-28 h-28">
                                    <img
                                      src={emp.anhKhuonMat.url}
                                      alt="Ảnh khuôn mặt"
                                      className="w-full h-full object-cover rounded-lg"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">Chưa chọn ảnh</span>
                              )}
                            </div>
                            {emp.anhKhuonMat && (
                              <button
                                type="button"
                                onClick={() => updateNewEmployee(index, 'anhKhuonMat', undefined)}
                                className="text-red-400 hover:text-red-300 shrink-0"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ))}

              {/* Footer Actions of Form (Tạo thêm nhân viên & Lưu) */}
              <div className="flex items-center justify-between pt-4 border-t border-[#21232d]">
                {/* Nút Tạo thêm nhân viên (chữ xanh dương, nền xanh dương nhạt giống sidebar active) */}
                <button
                  type="button"
                  onClick={() => {
                    setNewEmployees([...newEmployees, createEmptyNewEmployee()]);
                  }}
                  className="px-4 py-2.5 bg-[#00a2e8]/10 text-[#00a2e8] hover:bg-[#00a2e8]/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Tạo thêm nhân viên</span>
                </button>

                {/* Nút LƯU (chữ trắng, nền màu đại diện của hệ thống) */}
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#00a2e8] hover:bg-[#008cc9] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-lg shadow-[#00a2e8]/20 cursor-pointer"
                >
                  <Save size={14} />
                  <span>Lưu</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* quản lý nhóm nhân viên */
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-fadeIn">

            {/* Left Panel: danh sách nhóm nhân viên */}
            <div className="md:col-span-7 bg-[#14151c] border border-[#21232d] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 bg-[#181921] border-b border-[#21232d] flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />
                  <span>danh sách nhóm nhân viên ({humanGroups.length})</span>
                </span>
                <button
                  onClick={fetchGroups}
                  disabled={isRefreshingGroups}
                  className="p-1.5 hover:bg-[#252632] text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5 text-[10px] font-bold border border-[#2d2f3c]"
                  title="Tải lại dữ liệu từ DB"
                >
                  <RefreshCw size={12} className={isRefreshingGroups ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="divide-y divide-[#1e202b] max-h-[500px] overflow-y-auto">
                {humanGroups.map((dep, index) => (
                  <div
                    key={dep.id}
                    className="p-4 hover:bg-[#181a24] transition flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs select-none">
                        {index + 1}
                      </div>
                      <span className="text-sm font-bold text-slate-100">{dep.name}</span>
                    </div>
                  </div>
                ))}
                {humanGroups.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Không có nhóm nhân viên nào. Hãy thêm mới ở bên phải.
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: nhóm nhân viên builder */}
            <div className="md:col-span-5 bg-[#14151b] border border-[#21232d] rounded-2xl p-5 shadow-xl relative min-h-[220px] overflow-hidden">
              <div className={`transition-all duration-300 ${!showAddGroupDemo ? 'blur-sm pointer-events-none select-none' : ''}`}>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-5 pb-2 border-b border-slate-800/60 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a2e8]" />
                  <span>nhóm nhân viên builder</span>
                </h4>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newDepartmentInput.trim()) {
                      alert('tên nhóm nhân viên không được để trống!');
                      return;
                    }
                    if (humanGroups.some(d => d.name.toLowerCase() === newDepartmentInput.trim().toLowerCase())) {
                      alert('Nhóm nhân viên này đã tồn tại!');
                      return;
                    }
                    // Tạo mới chỉ cập nhật local state (chưa có API endpoint)
                    setHumanGroups([...humanGroups, { id: `local-${Date.now()}`, name: newDepartmentInput.trim() }]);
                    setNewDepartmentInput('');
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">tên nhóm nhân viên</label>
                    <input
                      type="text"
                      value={newDepartmentInput}
                      onChange={(e) => setNewDepartmentInput(e.target.value)}
                      placeholder="Nhập tên nhóm nhân viên mới..."
                      className="w-full bg-[#1c1d26] border border-[#2d2f3c] focus:border-[#00a2e8] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all h-[42px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#00a2e8] hover:bg-[#008cc9] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#00a2e8]/20 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Plus size={14} />
                    <span>tạo nhóm nhân viên</span>
                  </button>
                </form>
              </div>

              {!showAddGroupDemo && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#14151b]/80 backdrop-blur-xs p-4 text-center">
                  <div className="flex flex-col items-center max-w-[240px]">
                    <div className="p-2 bg-[#00a2e8]/10 rounded-full text-[#00a2e8] mb-2 animate-pulse">
                      <Sparkles size={16} />
                    </div>
                    <h5 className="text-[11px] font-bold text-slate-100 mb-1">Tính năng đang được hoàn thiện</h5>
                    <p className="text-[10px] text-slate-400 mb-3 leading-tight">Chức năng thêm nhóm nhân sự đang trong quá trình phát triển hoàn chỉnh.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddGroupDemo(true)}
                      className="px-4 py-1.5 bg-[#00a2e8] hover:bg-[#008cc9] text-white rounded-lg text-[10px] font-bold transition shadow-md shadow-[#00a2e8]/10 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Xem bản mẫu
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
