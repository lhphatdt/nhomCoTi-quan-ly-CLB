import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Building,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react';
import { ClubEvent, ClubMember, Department, EventCategory } from '../types.ts';
import {
  checkEventScheduleConflict,
  calculateAttendanceRate,
  formatDateTime,
} from '../domain/clubLogic.ts';

interface EventsTabProps {
  events: ClubEvent[];
  members: ClubMember[];
  onAddEvent: (newEvent: Omit<ClubEvent, 'id'>) => void;
  onToggleAttendee: (eventId: string, memberId: string) => void;
}

const DEPARTMENTS: Department[] = [
  'Ban Chủ nhiệm',
  'Ban Chuyên môn',
  'Ban Truyền thông',
  'Ban Sự kiện',
  'Ban Đối ngoại - Hậu cần',
];

const CATEGORIES: EventCategory[] = [
  'Workshop',
  'Hackathon',
  'Sinh hoạt định kỳ',
  'Tuyển quân',
];

const CATEGORY_COLORS: Record<EventCategory, string> = {
  Workshop: 'text-indigo-700 bg-indigo-50 border-indigo-100',
  Hackathon: 'text-purple-700 bg-purple-50 border-purple-100',
  'Sinh hoạt định kỳ': 'text-sky-700 bg-sky-50 border-sky-100',
  'Tuyển quân': 'text-emerald-700 bg-emerald-50 border-emerald-100',
};

export const EventsTab: React.FC<EventsTabProps> = ({
  events,
  members,
  onAddEvent,
  onToggleAttendee,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events[0]?.id || ''
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Workshop' as EventCategory,
    date: '2026-10-20',
    startTime: '08:30',
    endTime: '11:30',
    location: 'Hội trường A2-301',
    leadDepartment: 'Ban Chuyên môn' as Department,
    description: '',
    expectedAttendees: 50,
  });

  const [conflictError, setConflictError] = useState<string | null>(null);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleTestConflictPreset = () => {
    const first = events[0];
    if (first) {
      setFormData({
        title: 'Demo Sự kiện Trùng Lịch & Phòng Họp',
        category: 'Workshop',
        date: first.date,
        startTime: '09:00',
        endTime: '11:00',
        location: first.location,
        leadDepartment: 'Ban Sự kiện',
        description: 'Mô phỏng 2 ban cùng đặt một phòng họp cùng khung giờ để test thuật toán bắt lỗi.',
        expectedAttendees: 30,
      });
    }
    setConflictError(null);
  };

  const handleQuickValidPreset = () => {
    setFormData({
      title: 'Tọa đàm Chia sẻ Kinh nghiệm Thực tập Doanh nghiệp CNTT',
      category: 'Workshop',
      date: '2026-11-15',
      startTime: '14:00',
      endTime: '17:00',
      location: 'Phòng Hội thảo C2-405',
      leadDepartment: 'Ban Đối ngoại - Hậu cần',
      description: 'Gặp gỡ cựu sinh viên và đại diện HR các công ty phần mềm tuyển dụng intern.',
      expectedAttendees: 60,
    });
    setConflictError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setConflictError('Tên sự kiện không được để trống.');
      return;
    }

    const conflictCheck = checkEventScheduleConflict(
      {
        date: formData.date,
        location: formData.location,
        startTime: formData.startTime,
        endTime: formData.endTime,
      },
      events
    );

    if (conflictCheck.hasConflict) {
      setConflictError(
        conflictCheck.reason ||
          'Phát hiện xung đột lịch: Địa điểm này đã được đặt trong khoảng thời gian đã chọn!'
      );
      return;
    }

    onAddEvent({
      title: formData.title.trim(),
      category: formData.category,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location.trim(),
      leadDepartment: formData.leadDepartment,
      description: formData.description.trim(),
      status: 'upcoming',
      attendees: [],
      expectedAttendees: Number(formData.expectedAttendees) || 20,
    });

    setShowAddModal(false);
    setConflictError(null);
  };

  const filteredMembersForCheckin = members.filter((m) => {
    const q = attendeeSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.mssv.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER & NEW EVENT ACTION */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Lịch Hoạt động CLB & Bàn Điểm danh Chuyên cần
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thuật toán phát hiện xung đột lịch phòng học & theo dõi tỷ lệ có mặt theo thời gian thực
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setConflictError(null);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Sự kiện Mới</span>
        </button>
      </div>

      {/* 2 PANELS: EVENT LIST (LEFT) & DETAIL / ATTENDANCE SHEET (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* EVENT SELECTOR LIST (5 COLS) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span>Danh sách Sự kiện ({events.length})</span>
            <span className="text-[11px] text-slate-400 font-mono">Bấm để chọn xem</span>
          </div>

          <div className="space-y-2.5">
            {events.map((event) => {
              const isSelected = activeEvent?.id === event.id;
              const rate = calculateAttendanceRate(
                event.attendees.length,
                event.expectedAttendees
              );
              const catClass =
                CATEGORY_COLORS[event.category] || 'text-slate-700 bg-slate-100 border-slate-200';

              const parts = event.date.split('-');
              const day = parts[2] || '01';
              const month = parts[1] || '10';

              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Date Block */}
                    <div
                      className={`w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-bold leading-none">
                        T{month}
                      </span>
                      <span className="text-base font-extrabold font-mono tabular-nums leading-tight">
                        {day}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {event.title}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 font-semibold ${catClass}`}
                        >
                          {event.category}
                        </span>
                      </div>

                      <div className="mt-1 space-y-0.5 text-xs text-slate-500 font-mono tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {event.startTime} - {event.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 text-[11px] font-medium">
                      {event.leadDepartment}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums font-bold text-slate-800">
                        {event.attendees.length}/{event.expectedAttendees}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          rate >= 75
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-amber-700 bg-amber-50'
                        }`}
                      >
                        {rate}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: SELECTED EVENT DETAILS & ATTENDANCE SHEET (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          {activeEvent ? (
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-5">
              {/* Event Header */}
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-xs font-mono text-indigo-700 mb-1 font-semibold">
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      CATEGORY_COLORS[activeEvent.category] || 'bg-slate-100'
                    }`}
                  >
                    {activeEvent.category}
                  </span>
                  <span>·</span>
                  <span>Phụ trách: {activeEvent.leadDepartment}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{activeEvent.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {activeEvent.description}
                </p>

                {/* Event Metadata Bar */}
                <div className="mt-3.5 flex flex-wrap gap-4 text-xs font-mono tabular-nums text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ngày: {formatDateTime(activeEvent.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {activeEvent.startTime} - {activeEvent.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{activeEvent.location}</span>
                  </div>
                </div>
              </div>

              {/* Attendance Sheet Header & Live Rate */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Bảng Điểm danh Chuyên cần Trực tiếp
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Bấm vào từng sinh viên để ghi nhận trạng thái có mặt
                    </p>
                  </div>

                  {/* Search inside checkin list */}
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={attendeeSearch}
                      onChange={(e) => setAttendeeSearch(e.target.value)}
                      placeholder="Lọc sinh viên..."
                      className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Live Stats bar */}
                <div className="mb-3 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                  <div className="text-slate-700">
                    Đã có mặt:{' '}
                    <strong className="text-indigo-900 font-mono">
                      {activeEvent.attendees.length}
                    </strong>{' '}
                    / {activeEvent.expectedAttendees} sinh viên
                  </div>
                  <div className="font-bold text-indigo-700 font-mono">
                    Tỷ lệ chuyên cần:{' '}
                    {calculateAttendanceRate(
                      activeEvent.attendees.length,
                      activeEvent.expectedAttendees
                    )}
                    %
                  </div>
                </div>

                {/* Member Check-in List */}
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {filteredMembersForCheckin.map((member) => {
                    const isChecked = activeEvent.attendees.includes(member.id);

                    return (
                      <div
                        key={member.id}
                        onClick={() => onToggleAttendee(activeEvent.id, member.id)}
                        className={`px-3 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            className="text-slate-400 hover:text-indigo-600 focus:outline-none"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <span className="font-semibold text-slate-900">
                              {member.fullName}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono ml-2 tabular-nums">
                              {member.mssv}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-500 hidden sm:inline font-medium">
                            {member.department}
                          </span>
                          <span
                            className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                              isChecked
                                ? 'text-emerald-800 bg-emerald-50 border-emerald-200 font-bold'
                                : 'text-slate-500 bg-slate-100 border-slate-200'
                            }`}
                          >
                            {isChecked ? '✓ Có mặt' : 'Vắng mặt'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
              Chưa chọn sự kiện nào để xem chi tiết và điểm danh.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE EVENT WITH CONFLICT DETECTION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Lên Kế hoạch Hoạt động & Sự kiện Mới
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động kiểm tra trùng phòng họp & khung thời gian tổ chức
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Presets */}
            <div className="mt-3.5 p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kịch bản Thử nghiệm Lịch trình (Presets):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleQuickValidPreset}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                >
                  ✓ Điền sự kiện hợp lệ (Không trùng)
                </button>
                <button
                  type="button"
                  onClick={handleTestConflictPreset}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors"
                >
                  ⚠ Test tạo sự kiện trùng phòng & giờ
                </button>
              </div>
            </div>

            {/* Conflict Alert Banner */}
            {conflictError && (
              <div className="mt-3.5 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-bold">Thuật toán checkEventScheduleConflict chặn lỗi:</span>
                  <div className="mt-0.5">{conflictError}</div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên Sự kiện / Hoạt động <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: Workshop Thực chiến CI/CD"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại sự kiện</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as EventCategory })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ban phụ trách</label>
                  <select
                    value={formData.leadDepartment}
                    onChange={(e) =>
                      setFormData({ ...formData, leadDepartment: e.target.value as Department })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date, Start Time, End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày diễn ra <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-2.5 py-2 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-2.5 py-2 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-2.5 py-2 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Location & Expected Attendees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Địa điểm / Hội trường <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ví dụ: Hội trường A2-301"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dự kiến tham dự</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.expectedAttendees}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedAttendees: parseInt(e.target.value) || 20,
                      })
                    }
                    className="w-full px-2.5 py-2 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mục tiêu & Nội dung</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tóm tắt kế hoạch tổ chức sự kiện..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs"
                >
                  Xác nhận & Lưu Sự kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
