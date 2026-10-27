import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
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
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  Target,
  ListOrdered,
  Trash2,
  Edit3,
  CalendarDays,
  Tag,
  Share2,
} from 'lucide-react';
import {
  ClubEvent,
  ClubMember,
  Department,
  EventCategory,
  AuthUser,
  EventActivityItem,
} from '../types.ts';
import {
  checkEventScheduleConflict,
  calculateAttendanceRate,
  canPerformAction,
} from '../domain/clubLogic.ts';

interface EventsTabProps {
  events: ClubEvent[];
  members: ClubMember[];
  onAddEvent: (newEvent: Omit<ClubEvent, 'id'>) => void;
  onUpdateEvent?: (eventId: string, updates: Partial<ClubEvent>) => void;
  onDeleteEvent?: (eventId: string) => void;
  onToggleAttendee: (eventId: string, memberId: string) => void;
  currentUser?: AuthUser | null;
  onRequireAuth?: () => void;
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

const CATEGORY_COLORS: Record<EventCategory, { bg: string; text: string; border: string; dot: string }> = {
  Workshop: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  Hackathon: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  'Sinh hoạt định kỳ': {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  'Tuyển quân': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

const PRESET_EVENT_IMAGES = [
  {
    name: 'Khuôn viên Đại học (Mặc định)',
    url: '/assets/aistudio/banner_3b6a1fc7.jpg',
  },
  {
    name: 'Workshop Công nghệ & CI/CD',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Cuộc thi Hackathon Sinh viên',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Sinh hoạt CLB & Họp định kỳ',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Phỏng vấn Tuyển quân & Giao lưu',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Hội thảo Trực tuyến & Demo',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
  },
];

const DEFAULT_EVENT_IMAGE = '/assets/aistudio/banner_3b6a1fc7.jpg';

export const EventsTab: React.FC<EventsTabProps> = ({
  events,
  members,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onToggleAttendee,
  currentUser,
  onRequireAuth,
}) => {
  const canCreateEvent = canPerformAction(currentUser || null, 'create_event');
  const canManageEvents = canPerformAction(currentUser || null, 'manage_events');

  // Today reference (October 27, 2026 or real system date)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    // If year matches 2026, use now, else default to '2026-10-27'
    return y === 2026 ? `${y}-${m}-${d}` : '2026-10-27';
  }, []);

  // Calendar view state: Year & Month
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed: 9 = October
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-27');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Modals state
  const [detailModalEvent, setDetailModalEvent] = useState<ClubEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [attendeeSearch, setAttendeeSearch] = useState<string>('');

  // Form State for Add / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<EventCategory>('Workshop');
  const [formDate, setFormDate] = useState('2026-10-27');
  const [formStartTime, setFormStartTime] = useState('08:30');
  const [formEndTime, setFormEndTime] = useState('11:30');
  const [formLocation, setFormLocation] = useState('Hội trường A2-301');
  const [formDepartment, setFormDepartment] = useState<Department>('Ban Chuyên môn');
  const [formDescription, setFormDescription] = useState('');
  const [formExpectedAttendees, setFormExpectedAttendees] = useState<number>(40);
  const [formImageUrl, setFormImageUrl] = useState<string>(DEFAULT_EVENT_IMAGE);
  const [formTargetAudience, setFormTargetAudience] = useState<string>('Toàn thể sinh viên và hội viên CLB');
  const [formActivities, setFormActivities] = useState<string[]>([
    'Đón tiếp & Điểm danh thành viên',
    'Trình bày nội dung chuyên môn',
    'Thảo luận và hỏi đáp tương tác',
    'Tổng kết & Đánh giá buổi sinh hoạt',
  ]);
  const [newActivityInput, setNewActivityInput] = useState('');
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (selectedCategoryFilter === 'all') return events;
    return events.filter((e) => e.category === selectedCategoryFilter);
  }, [events, selectedCategoryFilter]);

  // Events map by date: { '2026-10-27': [event1, event2] }
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ClubEvent[]>();
    filteredEvents.forEach((ev) => {
      const list = map.get(ev.date) || [];
      list.push(ev);
      map.set(ev.date, list);
    });
    return map;
  }, [filteredEvents]);

  // Selected date events sorted chronologically by start time
  const selectedDateEvents = useMemo(() => {
    const list = eventsByDate.get(selectedDate) || [];
    return [...list].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [eventsByDate, selectedDate]);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Day of week for 1st day of month (0 = Sun, 1 = Mon ... 6 = Sat)
    // Convert to Monday = 0, ..., Sunday = 6
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    // Previous month filler days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        events: eventsByDate.get(dateStr) || [],
      });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        events: eventsByDate.get(dateStr) || [],
      });
    }

    // Next month filler days to complete rows (35 or 42 cells)
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        events: eventsByDate.get(dateStr) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, eventsByDate]);

  // Format Vietnamese Date Heading
  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dateObj = new Date(y, m, d);
      const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = daysOfWeek[dateObj.getDay()];
      return `${dayName}, ngày ${d} tháng ${m + 1} năm ${y}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const parts = todayStr.split('-');
    setCurrentYear(parseInt(parts[0], 10));
    setCurrentMonth(parseInt(parts[1], 10) - 1);
    setSelectedDate(todayStr);
  };

  // Open modal for new event
  const handleOpenAddModal = (initialDate?: string) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    setEditingEvent(null);
    setFormTitle('');
    setFormCategory('Workshop');
    setFormDate(initialDate || selectedDate);
    setFormStartTime('08:30');
    setFormEndTime('11:30');
    setFormLocation('Hội trường A2-301');
    setFormDepartment('Ban Chuyên môn');
    setFormDescription('');
    setFormExpectedAttendees(40);
    setFormImageUrl(DEFAULT_EVENT_IMAGE);
    setFormTargetAudience('Toàn thể sinh viên và hội viên CLB');
    setFormActivities([
      'Đón tiếp & Điểm danh thành viên',
      'Nội dung chuyên môn & Trình diễn',
      'Hỏi đáp Q&A & Thảo luận nhóm',
    ]);
    setConflictError(null);
    setShowAddModal(true);
  };

  // Open modal for editing event
  const handleOpenEditModal = (ev: ClubEvent) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    setEditingEvent(ev);
    setFormTitle(ev.title);
    setFormCategory(ev.category);
    setFormDate(ev.date);
    setFormStartTime(ev.startTime);
    setFormEndTime(ev.endTime);
    setFormLocation(ev.location);
    setFormDepartment(ev.leadDepartment);
    setFormDescription(ev.description);
    setFormExpectedAttendees(ev.expectedAttendees);
    setFormImageUrl(ev.imageUrl || DEFAULT_EVENT_IMAGE);
    setFormTargetAudience(ev.targetAudience || 'Toàn thể hội viên');
    setFormActivities(ev.activities || ['Hoạt động chính của sự kiện']);
    setConflictError(null);
    setShowAddModal(true);
  };

  // Submit Event Form (Create or Update)
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    // Check conflict (excluding current event if editing)
    const otherEvents = editingEvent
      ? events.filter((ev) => ev.id !== editingEvent.id)
      : events;

    const conflict = checkEventScheduleConflict(
      {
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        location: formLocation,
      },
      otherEvents
    );

    if (conflict.hasConflict) {
      setConflictError(conflict.reason || 'Trùng lịch phòng hoặc thời gian với sự kiện khác!');
      return;
    }

    if (editingEvent && onUpdateEvent) {
      onUpdateEvent(editingEvent.id, {
        title: formTitle,
        category: formCategory,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        location: formLocation,
        leadDepartment: formDepartment,
        description: formDescription,
        expectedAttendees: Number(formExpectedAttendees),
        imageUrl: formImageUrl,
        targetAudience: formTargetAudience,
        activities: formActivities,
      });

      // Update detail modal if open
      if (detailModalEvent && detailModalEvent.id === editingEvent.id) {
        setDetailModalEvent({
          ...detailModalEvent,
          title: formTitle,
          category: formCategory,
          date: formDate,
          startTime: formStartTime,
          endTime: formEndTime,
          location: formLocation,
          leadDepartment: formDepartment,
          description: formDescription,
          expectedAttendees: Number(formExpectedAttendees),
          imageUrl: formImageUrl,
          targetAudience: formTargetAudience,
          activities: formActivities,
        });
      }
    } else {
      onAddEvent({
        title: formTitle,
        category: formCategory,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        location: formLocation,
        leadDepartment: formDepartment,
        description: formDescription,
        status: 'upcoming',
        attendees: [],
        expectedAttendees: Number(formExpectedAttendees),
        imageUrl: formImageUrl,
        targetAudience: formTargetAudience,
        activities: formActivities,
      });
      setSelectedDate(formDate);
    }

    setShowAddModal(false);
  };

  // Delete Event Handler
  const handleDeleteEventClick = (eventId: string, title: string) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa sự kiện "${title}" khỏi hệ thống?`)) {
      if (onDeleteEvent) {
        onDeleteEvent(eventId);
      }
      if (detailModalEvent?.id === eventId) {
        setDetailModalEvent(null);
      }
    }
  };

  // Add activity item to list
  const handleAddActivity = () => {
    if (newActivityInput.trim()) {
      setFormActivities([...formActivities, newActivityInput.trim()]);
      setNewActivityInput('');
    }
  };

  const handleRemoveActivity = (index: number) => {
    setFormActivities(formActivities.filter((_, i) => i !== index));
  };

  // Check in current user
  const handleToggleMyAttendance = (event: ClubEvent) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    const myMember = members.find(
      (m) =>
        m.mssv.toUpperCase() === currentUser.mssv.toUpperCase() ||
        m.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (myMember) {
      onToggleAttendee(event.id, myMember.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <CalendarIcon className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Lịch & Sự Kiện Hoạt Động
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi thời khóa biểu sự kiện, điều phối phòng họp và điểm danh hoạt động sinh viên theo thời gian thực
          </p>
        </div>

        {/* CONTROLS & FILTER */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Category Filter Chips */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedCategoryFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({events.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  selectedCategoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Add Event Button */}
          {canCreateEvent ? (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm sự kiện mới</span>
            </button>
          ) : (
            <button
              onClick={onRequireAuth}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 transition-colors shrink-0"
              title="Đăng nhập tài khoản Ban Sự kiện hoặc Ban Chủ nhiệm để tạo sự kiện"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Tạo sự kiện (Yêu cầu quyền)</span>
            </button>
          )}
        </div>
      </div>

      {/* 3.1. BỐ CỤC LỊCH DẠNG HAI CỘT (TWO-COLUMN RESPONSIVE LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* CỘT BÊN TRÁI (LEFT COLUMN): LỊCH THÁNG (7 COLS ON LARGE) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          {/* MONTH NAVIGATION BAR */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Tháng {currentMonth + 1}, {currentYear}
              </h2>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                Hôm nay
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
                title="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DAY OF WEEK HEADERS */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'].map((day, idx) => (
              <div
                key={day}
                className={`py-2 text-xs font-bold uppercase tracking-wider ${
                  idx >= 5 ? 'text-rose-500' : 'text-slate-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* MONTH GRID CELLS */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell) => {
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayStr;
              const hasEvents = cell.events.length > 0;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`min-h-[78px] sm:min-h-[92px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500 shadow-sm'
                      : isToday
                      ? 'bg-blue-50/50 border-blue-300 hover:border-indigo-300'
                      : cell.isCurrentMonth
                      ? 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80'
                      : 'bg-slate-50/50 border-slate-100 text-slate-400'
                  }`}
                >
                  {/* CELL TOP: Day Number & Today indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-bold flex items-center justify-center w-6 h-6 rounded-lg ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isToday
                          ? 'bg-blue-600 text-white font-extrabold'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* EVENT COUNT BADGE */}
                    {hasEvents && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-xs">
                        {cell.events.length}
                      </span>
                    )}
                  </div>

                  {/* CELL BOTTOM: EVENT CHIPS / DOTS */}
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {cell.events.slice(0, 2).map((ev) => {
                      const colors = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS['Workshop'];
                      return (
                        <div
                          key={ev.id}
                          title={`${ev.startTime} - ${ev.title}`}
                          className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}

                    {/* Mobile tiny dot representation */}
                    {hasEvents && (
                      <div className="flex sm:hidden items-center gap-1 justify-center mt-1">
                        {cell.events.slice(0, 3).map((ev, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              CATEGORY_COLORS[ev.category]?.dot || 'bg-indigo-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {cell.events.length > 2 && (
                      <div className="hidden sm:block text-[9px] font-bold text-slate-400 pl-1">
                        +{cell.events.length - 2} sự kiện nữa
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CALENDAR FOOTER LEGEND */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-700">Chú thích:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span>Workshop</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Hackathon</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Sinh hoạt định kỳ</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Tuyển quân</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              * Nhấn vào bất kỳ ô ngày nào để xem chi tiết
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT BÊN PHẢI (RIGHT COLUMN): CHI TIẾT SỰ KIỆN TRONG NGÀY (5 COLS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          {/* HEADER OF SELECTED DAY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-0.5">
                  Ngày đang chọn
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight capitalize">
                  {formattedSelectedDate}
                </h3>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{selectedDateEvents.length} sự kiện</span>
              </span>
            </div>

            {/* LIST OF EVENTS IN THIS DAY */}
            {selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDateEvents.map((ev) => {
                  const colors = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS['Workshop'];
                  const attendanceRate = calculateAttendanceRate(ev.attendees.length, ev.expectedAttendees);
                  const isCheckedIn = currentUser
                    ? ev.attendees.some((id) => {
                        const m = members.find((mem) => mem.id === id);
                        return (
                          m?.mssv.toUpperCase() === currentUser.mssv.toUpperCase() ||
                          m?.email.toLowerCase() === currentUser.email.toLowerCase()
                        );
                      })
                    : false;

                  return (
                    <div
                      key={ev.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col group"
                    >
                      {/* 3.2. HÌNH ẢNH ĐẠI DIỆN CHO SỰ KIỆN */}
                      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                        <img
                          src={ev.imageUrl || DEFAULT_EVENT_IMAGE}
                          alt={ev.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_EVENT_IMAGE;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                        {/* Top badges on photo */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-md shadow-xs ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            {ev.category}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md ${
                              ev.status === 'ongoing'
                                ? 'bg-emerald-600/90 text-white'
                                : ev.status === 'upcoming'
                                ? 'bg-blue-600/90 text-white'
                                : 'bg-slate-700/90 text-slate-200'
                            }`}
                          >
                            {ev.status === 'ongoing'
                              ? '🟢 Đang diễn ra'
                              : ev.status === 'upcoming'
                              ? '⏳ Sắp diễn ra'
                              : '✓ Đã kết thúc'}
                          </span>
                        </div>

                        {/* Bottom title on photo overlay */}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h4 className="font-extrabold text-base leading-snug line-clamp-2 drop-shadow-sm">
                            {ev.title}
                          </h4>
                        </div>
                      </div>

                      {/* CARD CONTENT */}
                      <div className="p-4 space-y-3">
                        {/* Time & Location */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>
                              {ev.startTime} – {ev.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        </div>

                        {/* Short Description */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>

                        {/* Lead Department & Expected audience */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="text-slate-500">Phụ trách:</span>
                          <span className="font-semibold text-slate-800">{ev.leadDepartment}</span>
                        </div>

                        {/* Attendance Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">
                              Điểm danh: <strong>{ev.attendees.length}</strong> / {ev.expectedAttendees} sinh viên
                            </span>
                            <span className="font-bold text-indigo-600">{attendanceRate}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, attendanceRate)}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailModalEvent(ev)}
                            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem chi tiết & Hoạt động</span>
                          </button>

                          {currentUser && (
                            <button
                              type="button"
                              onClick={() => handleToggleMyAttendance(ev)}
                              className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1 ${
                                isCheckedIn
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                              title={isCheckedIn ? 'Đã điểm danh' : 'Bấm để điểm danh tham gia'}
                            >
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">
                                {isCheckedIn ? 'Đã check-in' : 'Điểm danh'}
                              </span>
                            </button>
                          )}

                          {canManageEvents && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(ev)}
                                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                                title="Chỉnh sửa sự kiện"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEventClick(ev.id, ev.title)}
                                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors"
                                title="Xóa sự kiện"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* EMPTY STATE WHEN NO EVENTS ON THIS DAY */
              <div className="py-12 px-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto border border-indigo-100">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Không có sự kiện nào trong ngày này
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Bạn có thể chọn một ngày khác có đánh dấu chỉ báo trên lịch tháng hoặc lên kế hoạch tổ chức sự kiện mới cho ngày này.
                  </p>
                </div>

                {canCreateEvent && (
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(selectedDate)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo sự kiện cho ngày này</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3.3. MODAL CHI TIẾT SỰ KIỆN & CÁC HOẠT ĐỘNG TRONG CHƯƠNG TRÌNH */}
      {/* ========================================================================= */}
      {detailModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in duration-200">
            {/* FULL COVER PHOTO BANNER */}
            <div className="relative h-64 sm:h-72 w-full bg-slate-900 overflow-hidden">
              <img
                src={detailModalEvent.imageUrl || DEFAULT_EVENT_IMAGE}
                alt={detailModalEvent.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_EVENT_IMAGE;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

              {/* Close button */}
              <button
                type="button"
                onClick={() => setDetailModalEvent(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-md"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Top labels */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold border backdrop-blur-md shadow-xs ${
                    CATEGORY_COLORS[detailModalEvent.category]?.bg || 'bg-indigo-50'
                  } ${CATEGORY_COLORS[detailModalEvent.category]?.text || 'text-indigo-700'} ${
                    CATEGORY_COLORS[detailModalEvent.category]?.border || 'border-indigo-200'
                  }`}
                >
                  {detailModalEvent.category}
                </span>

                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold text-white shadow-xs ${
                    detailModalEvent.status === 'ongoing'
                      ? 'bg-emerald-600'
                      : detailModalEvent.status === 'upcoming'
                      ? 'bg-blue-600'
                      : 'bg-slate-600'
                  }`}
                >
                  {detailModalEvent.status === 'ongoing'
                    ? 'Đang diễn ra'
                    : detailModalEvent.status === 'upcoming'
                    ? 'Sắp diễn ra'
                    : 'Đã hoàn thành'}
                </span>
              </div>

              {/* Bottom Event Title */}
              <div className="absolute bottom-4 left-5 right-5 text-white space-y-1">
                <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                  {detailModalEvent.leadDepartment}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight drop-shadow-md">
                  {detailModalEvent.title}
                </h3>
              </div>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[calc(85vh-18rem)] overflow-y-auto">
              {/* KEY EVENT METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-500">Ngày tổ chức</div>
                    <div className="font-bold text-slate-800">{detailModalEvent.date}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-500">Thời gian</div>
                    <div className="font-mono font-bold text-slate-800">
                      {detailModalEvent.startTime} – {detailModalEvent.endTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-500">Địa điểm</div>
                    <div className="font-bold text-slate-800 truncate">{detailModalEvent.location}</div>
                  </div>
                </div>
              </div>

              {/* DESCRIPTION & OBJECTIVES */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Nội dung & Mục tiêu Sự kiện</span>
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                  {detailModalEvent.description}
                </p>
                {detailModalEvent.targetAudience && (
                  <div className="text-xs text-slate-600 pt-1 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">Đối tượng tham gia:</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {detailModalEvent.targetAudience}
                    </span>
                  </div>
                )}
              </div>

              {/* PROGRAM ACTIVITIES TIMELINE / AGENDA */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-indigo-600" />
                  <span>Các hoạt động dự kiến trong chương trình</span>
                </h4>

                {detailModalEvent.agenda && detailModalEvent.agenda.length > 0 ? (
                  <div className="space-y-2">
                    {detailModalEvent.agenda.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded shrink-0">
                          {item.time}
                        </span>
                        <span className="text-slate-800 font-medium leading-relaxed">{item.activity}</span>
                      </div>
                    ))}
                  </div>
                ) : detailModalEvent.activities && detailModalEvent.activities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detailModalEvent.activities.map((act, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                      >
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="font-medium">{act}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Chương trình đang được Ban Sự kiện cập nhật chi tiết...
                  </p>
                )}
              </div>

              {/* ATTENDANCE CHECK-IN ROSTER */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>
                      Danh sách điểm danh ({detailModalEvent.attendees.length} / {detailModalEvent.expectedAttendees})
                    </span>
                  </h4>

                  {/* Search attendee input */}
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={attendeeSearch}
                      onChange={(e) => setAttendeeSearch(e.target.value)}
                      placeholder="Tìm thành viên..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Attendees list grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {members
                    .filter((m) =>
                      attendeeSearch
                        ? m.fullName.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
                          m.mssv.toLowerCase().includes(attendeeSearch.toLowerCase())
                        : true
                    )
                    .map((m) => {
                      const isChecked = detailModalEvent.attendees.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            if (canManageEvents) {
                              onToggleAttendee(detailModalEvent.id, m.id);
                              // Update local state
                              const updated = isChecked
                                ? detailModalEvent.attendees.filter((id) => id !== m.id)
                                : [...detailModalEvent.attendees, m.id];
                              setDetailModalEvent({
                                ...detailModalEvent,
                                attendees: updated,
                              });
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                            canManageEvents ? 'cursor-pointer hover:border-slate-300' : 'cursor-default'
                          } ${
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div className="truncate">
                              <div className="font-bold text-xs truncate">{m.fullName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {m.mssv} · {m.department}
                              </div>
                            </div>
                          </div>
                          {isChecked && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                              Có mặt
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {canManageEvents
                  ? 'Bạn có quyền quản lý sự kiện và điểm danh thành viên'
                  : 'Chỉ ban tổ chức mới có quyền chỉnh sửa thông tin sự kiện'}
              </div>

              <div className="flex items-center gap-2">
                {canManageEvents && (
                  <button
                    type="button"
                    onClick={() => {
                      const evToEdit = detailModalEvent;
                      setDetailModalEvent(null);
                      handleOpenEditModal(evToEdit);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa sự kiện</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDetailModalEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3.2. MODAL TẠO & CHỈNH SỬA SỰ KIỆN CÓ QUẢN LÝ ẢNH & HOẠT ĐỘNG */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {editingEvent ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện câu lạc bộ'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Đồng bộ thời gian thực vào cơ sở dữ liệu Cloud Firestore
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CONFLICT ERROR ALERT */}
            {conflictError && (
              <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-900">Cảnh báo trùng lịch phòng họp!</div>
                  <div className="mt-0.5">{conflictError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 max-h-[calc(85vh-12rem)] overflow-y-auto">
              {/* TITLE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tên sự kiện / Hoạt động <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="VD: Workshop Kiểm thử Tự động với Vitest"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* CATEGORY & LEAD DEPARTMENT (2 COLS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Thể loại sự kiện <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as EventCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Ban chủ trì / Phụ trách <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value as Department)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DATE & TIME (3 COLS) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Ngày diễn ra <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Bắt đầu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kết thúc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* LOCATION & EXPECTED ATTENDEES (2 COLS) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Địa điểm tổ chức <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="VD: Hội trường A2-301"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Dự kiến tham gia <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formExpectedAttendees}
                    onChange={(e) => setFormExpectedAttendees(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 3.2. THÊM HÌNH ẢNH CHO SỰ KIỆN (IMAGE PICKER & CUSTOM URL) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Hình ảnh minh họa sự kiện</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">
                    Chọn nhanh mẫu bên dưới hoặc dán URL ảnh
                  </span>
                </label>

                {/* Preset Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_EVENT_IMAGES.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFormImageUrl(preset.url)}
                      className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        formImageUrl === preset.url
                          ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                      />
                      <span className="text-[11px] font-medium text-slate-800 truncate">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Direct Image URL input */}
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="Hoặc dán URL ảnh sự kiện tại đây (https://...)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* DESCRIPTION & OBJECTIVE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mô tả & Mục tiêu sự kiện <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mục đích buổi sinh hoạt, kiến thức đạt được..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* TARGET AUDIENCE */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Đối tượng tham gia
                </label>
                <input
                  type="text"
                  value={formTargetAudience}
                  onChange={(e) => setFormTargetAudience(e.target.value)}
                  placeholder="VD: Sinh viên toàn trường, Ban Chuyên môn..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 3.3. ACTIVITIES BUILDER */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Các hoạt động dự kiến trong chương trình</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">
                    ({formActivities.length} mục)
                  </span>
                </label>

                <div className="space-y-1.5">
                  {formActivities.map((act, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-slate-800">{act}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new activity row */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newActivityInput}
                    onChange={(e) => setNewActivityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddActivity();
                      }
                    }}
                    placeholder="Nhập tên hoạt động rồi bấm Thêm..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddActivity}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors shrink-0"
                  >
                    + Thêm mục
                  </button>
                </div>
              </div>

              {/* FORM ACTIONS */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingEvent ? 'Lưu thay đổi' : 'Xác nhận tạo sự kiện'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
