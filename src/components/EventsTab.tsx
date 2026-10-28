import React, { useState, useMemo, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
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
  QrCode,
  Scan,
  Camera,
  RefreshCw,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Check,
  AlertCircle,
  Radio,
  Printer,
} from 'lucide-react';
import {
  ClubEvent,
  ClubMember,
  Department,
  EventCategory,
  AuthUser,
} from '../types.ts';
import {
  checkEventScheduleConflict,
  calculateAttendanceRate,
  canPerformAction,
  getVietnamNow,
  getVietnamDateString,
  getVietnamTimeString,
  formatVietnamDate,
  formatVietnamDateTime,
  isEventPastTime,
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
  const isClubPresident = currentUser?.role === 'admin';

  // Check if current user is authorized organizer for a specific event
  // (Strict requirement: "mọi thao tác sẽ chỉ được trưởng ban sự kiện đó và chủ nhiệm")
  const isAuthorizedOrganizer = (ev: ClubEvent) => {
    if (isClubPresident) return true;
    if (!currentUser) return false;
    if (currentUser.role === 'event_lead') return true;
    if (
      currentUser.department === ev.leadDepartment &&
      (currentUser.roleTitle.toLowerCase().includes('trưởng ban') ||
        currentUser.roleTitle.toLowerCase().includes('phó'))
    ) {
      return true;
    }
    return false;
  };

  // Current logged in member in the club roster
  const myMemberRecord = useMemo(() => {
    if (!currentUser) return null;
    return members.find(
      (m) =>
        m.mssv.toUpperCase() === currentUser.mssv.toUpperCase() ||
        m.email.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [members, currentUser]);

  // Vietnam Timezone (GMT+7) live ticker
  const [vnNow, setVnNow] = useState<Date>(() => getVietnamNow());
  useEffect(() => {
    const timer = setInterval(() => setVnNow(getVietnamNow()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => getVietnamDateString(vnNow), [vnNow]);

  // Calendar view state: Year & Month initialized to Vietnam Time
  const [currentYear, setCurrentYear] = useState<number>(() => getVietnamNow().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => getVietnamNow().getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(() => getVietnamDateString(getVietnamNow()));
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Modals state
  const [detailModalEvent, setDetailModalEvent] = useState<ClubEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [attendeeSearch, setAttendeeSearch] = useState<string>('');

  // =========================================================================
  // DYNAMIC 5-SECOND ANTI-FRAUD ROTATING QR CODE ATTENDANCE MODAL STATE
  // Tabs: 'broadcast' (Màn hình QR), 'scan' (Tôi Điểm Danh), 'roster' (Danh sách)
  // =========================================================================
  const [qrBroadcastEvent, setQrBroadcastEvent] = useState<ClubEvent | null>(null);
  const [attendanceModalTab, setAttendanceModalTab] = useState<'broadcast' | 'scan' | 'roster'>('broadcast');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(5);
  const [currentQrToken, setCurrentQrToken] = useState<string>('');
  const [isQrFullscreen, setIsQrFullscreen] = useState<boolean>(false);

  // =========================================================================
  // QR SCANNER / CHECK-IN MODAL STATE
  // =========================================================================
  const [qrScanTargetEvent, setQrScanTargetEvent] = useState<ClubEvent | null>(null);
  const [scanMethod, setScanMethod] = useState<'camera' | 'manual'>('camera');
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [scanResultFeedback, setScanResultFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    studentName?: string;
    timestamp?: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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

  // Events map by date
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

  // Keep detailModalEvent in sync with events state
  useEffect(() => {
    if (detailModalEvent) {
      const updated = events.find((e) => e.id === detailModalEvent.id);
      if (updated) {
        setDetailModalEvent(updated);
      }
    }
  }, [events]);

  // Keep qrBroadcastEvent in sync with events state
  useEffect(() => {
    if (qrBroadcastEvent) {
      const updated = events.find((e) => e.id === qrBroadcastEvent.id);
      if (updated) {
        setQrBroadcastEvent(updated);
      }
    }
  }, [events]);

  // =========================================================================
  // DYNAMIC 5-SECOND ANTI-FRAUD ROTATING QR CODE ENGINE
  // =========================================================================
  useEffect(() => {
    if (!qrBroadcastEvent || qrBroadcastEvent.attendanceClosed) {
      setQrSecondsLeft(5);
      setQrDataUrl('');
      setCurrentQrToken('');
      return;
    }

    let isMounted = true;

    // Helper to generate a rotating QR payload (5s rotation)
    const regenerateQr = async () => {
      if (!qrBroadcastEvent || qrBroadcastEvent.attendanceClosed) return;
      const now = Date.now();
      const nonce = Math.random().toString(36).substring(2, 8).toUpperCase();
      const token = `QR-${qrBroadcastEvent.id.slice(-4)}-${nonce}-${now.toString(36).slice(-4).toUpperCase()}`;

      const payloadObj = {
        app: 'UNICLUB_HUB_CHECKIN',
        eventId: qrBroadcastEvent.id,
        eventTitle: qrBroadcastEvent.title,
        date: qrBroadcastEvent.date,
        timestamp: now,
        expiresAt: now + 7000, // 7 seconds validity (5s rotation + 2s network grace buffer)
        token,
      };

      const payloadStr = JSON.stringify(payloadObj);

      try {
        const url = await QRCode.toDataURL(payloadStr, {
          width: 360,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        if (isMounted) {
          setQrDataUrl(url);
          setCurrentQrToken(payloadStr);
        }
      } catch (err) {
        console.error('Generate QR Code Error:', err);
      }
    };

    // Generate initial QR code immediately
    regenerateQr();
    setQrSecondsLeft(5);

    // 1-second interval to update countdown timer and refresh every 5 seconds
    const interval = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          regenerateQr();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [qrBroadcastEvent]);

  // =========================================================================
  // CAMERA STREAM HANDLER FOR QR SCANNER
  // =========================================================================
  // CAMERA STREAM HANDLER FOR QR SCANNER
  // =========================================================================
  useEffect(() => {
    const isScanning =
      scanMethod === 'camera' &&
      ((qrBroadcastEvent !== null && attendanceModalTab === 'scan') || qrScanTargetEvent !== null);

    if (isScanning) {
      let isMounted = true;

      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (isMounted) {
            mediaStreamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
          } else {
            stream.getTracks().forEach((track) => track.stop());
          }
        })
        .catch((err) => {
          console.warn('Camera permission denied or camera not available:', err);
        });

      return () => {
        isMounted = false;
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };
    }
  }, [qrBroadcastEvent, attendanceModalTab, qrScanTargetEvent, scanMethod]);

  // Execute attendance verification
  const handleVerifyAndCheckIn = (scannedPayloadStr: string) => {
    const activeTarget = qrBroadcastEvent || qrScanTargetEvent;
    if (!activeTarget) return;

    if (!currentUser) {
      setScanResultFeedback({
        type: 'error',
        message: 'Vui lòng đăng nhập tài khoản sinh viên trước khi quét mã điểm danh!',
      });
      return;
    }

    try {
      const payload = JSON.parse(scannedPayloadStr);

      // Verify event match
      if (payload.eventId !== activeTarget.id) {
        setScanResultFeedback({
          type: 'error',
          message: `Mã QR này thuộc sự kiện "${payload.eventTitle || 'khác'}", không khớp với sự kiện "${activeTarget.title}"!`,
        });
        return;
      }

      // Verify rotation expiry (5 seconds with 4s grace network buffer)
      const now = Date.now();
      const ageMs = now - (payload.timestamp || 0);
      if (ageMs > 9000) {
        setScanResultFeedback({
          type: 'error',
          message: 'Mã QR đã hết hạn (quá 5 giây)! Vui lòng quét mã mới đang xoay vòng trên màn hình ban tổ chức.',
        });
        return;
      }

      // Check member match
      const member = myMemberRecord;
      if (!member) {
        setScanResultFeedback({
          type: 'error',
          message: 'Không tìm thấy hồ sơ thành viên câu lạc bộ cho tài khoản hiện tại của bạn.',
        });
        return;
      }

      // Check if already checked in
      if (activeTarget.attendees.includes(member.id)) {
        setScanResultFeedback({
          type: 'success',
          message: `Sinh viên ${member.fullName} (${member.mssv}) đã được điểm danh trước đó rồi!`,
          studentName: member.fullName,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
        });
        return;
      }

      // Record attendance
      onToggleAttendee(activeTarget.id, member.id);
      const timeStr = new Date().toLocaleTimeString('vi-VN');

      // Update local modal state immediately
      if (qrBroadcastEvent && qrBroadcastEvent.id === activeTarget.id) {
        setQrBroadcastEvent({
          ...qrBroadcastEvent,
          attendees: [...qrBroadcastEvent.attendees, member.id],
        });
      }

      setScanResultFeedback({
        type: 'success',
        message: `Điểm danh thành công! Hệ thống đã ghi nhận sự có mặt của ${member.fullName} (${member.mssv}) vào lúc ${timeStr}.`,
        studentName: member.fullName,
        timestamp: timeStr,
      });
    } catch {
      setScanResultFeedback({
        type: 'error',
        message: 'Dữ liệu mã QR không hợp lệ hoặc bị gián đoạn. Vui lòng quét lại!',
      });
    }
  };

  // Fast Instant Scan Simulation button
  const handleSimulateQuickScan = () => {
    if (!currentQrToken && qrBroadcastEvent?.id === qrScanTargetEvent?.id) {
      setScanResultFeedback({
        type: 'error',
        message: 'Ban tổ chức chưa bật màn hình chiếu mã QR động!',
      });
      return;
    }

    if (currentQrToken) {
      handleVerifyAndCheckIn(currentQrToken);
    } else if (qrScanTargetEvent) {
      // If broadcasting wasn't open, generate valid token on the fly for test
      const testPayload = JSON.stringify({
        app: 'UNICLUB_HUB_CHECKIN',
        eventId: qrScanTargetEvent.id,
        eventTitle: qrScanTargetEvent.title,
        date: qrScanTargetEvent.date,
        timestamp: Date.now(),
        expiresAt: Date.now() + 10000,
        token: `QR-SIM-${Date.now().toString(36)}`,
      });
      handleVerifyAndCheckIn(testPayload);
    }
  };

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

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
  // Delete Event Handler (President & Event Organizer)
  const handleDeleteEventClick = (eventId: string, title: string) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    const targetEvent = events.find((e) => e.id === eventId);
    if (targetEvent && !canManageEvents && !isAuthorizedOrganizer(targetEvent)) {
      alert('Bạn không có quyền xóa sự kiện này. Thao tác chỉ dành cho Chủ nhiệm CLB và Ban phụ trách sự kiện.');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa sự kiện "${title}" khỏi hệ thống?\n\nThao tác này sẽ xóa vĩnh viễn sự kiện và toàn bộ lịch sử điểm danh khỏi cơ sở dữ liệu.`)) {
      if (onDeleteEvent) {
        onDeleteEvent(eventId);
      }
      if (detailModalEvent?.id === eventId) {
        setDetailModalEvent(null);
      }
      if (qrBroadcastEvent?.id === eventId) {
        setQrBroadcastEvent(null);
      }
      alert(`Đã xóa sự kiện "${title}" thành công khỏi hệ thống!`);
    }
  };

  // End / Close Attendance Session (President & Event Lead Only)
  const handleEndAttendanceSession = (ev: ClubEvent) => {
    if (!isAuthorizedOrganizer(ev)) {
      alert('Chỉ Trưởng ban sự kiện này và Chủ nhiệm CLB mới có thẩm quyền kết thúc phiên điểm danh!');
      return;
    }
    const confirmed = window.confirm(
      `Xác nhận kết thúc phiên điểm danh cho sự kiện "${ev.title}"?\n\n` +
      `• Đã điểm danh: ${ev.attendees.length} / ${ev.expectedAttendees} sinh viên\n` +
      `• Tỷ lệ tham dự: ${Math.round((ev.attendees.length / (ev.expectedAttendees || 1)) * 100)}%\n\n` +
      `Sau khi kết thúc, phiên điểm danh sẽ được chốt sổ, dừng phát mã QR và lưu trữ vĩnh viễn trên hệ thống.`
    );
    if (!confirmed) return;

    const closedAtStr = formatVietnamDate(getVietnamNow());
    const closedByStr = currentUser?.fullName || 'Nguyễn Văn An';
    const closedByRoleStr = currentUser?.roleTitle || 'Chủ nhiệm CLB';

    const updates: Partial<ClubEvent> = {
      status: 'completed',
      attendanceClosed: true,
      closedBy: closedByStr,
      closedByRole: closedByRoleStr,
      closedAt: closedAtStr,
      closedReason: 'Phiên điểm danh đã kết thúc và chốt số',
    };

    if (onUpdateEvent) {
      onUpdateEvent(ev.id, updates);
    }

    const updatedEv: ClubEvent = {
      ...ev,
      ...updates,
    };

    if (detailModalEvent && detailModalEvent.id === ev.id) {
      setDetailModalEvent(updatedEv);
    }

    if (qrBroadcastEvent && qrBroadcastEvent.id === ev.id) {
      setQrBroadcastEvent(updatedEv);
      setAttendanceModalTab('broadcast'); // Stay on modal and display Image 1 locked state
    }

    alert(`Đã kết thúc điểm danh cho sự kiện "${ev.title}" thành công!\nBiên bản đã được chốt và ký số bởi ${closedByStr} (${closedByRoleStr}).`);
  };

  // Print Roster / Attendance Report
  const handlePrintRoster = () => {
    window.print();
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
            Theo dõi thời khóa biểu, điểm danh bằng mã QR xoay vòng 5s chống gian lận và tự động đồng bộ theo múi giờ chuẩn Việt Nam (GMT+7).
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>Giờ VN (GMT+7): {formatVietnamDateTime(vnNow)}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Tự động kết thúc khi qua giờ</span>
            </span>
          </div>
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

      {/* TWO-COLUMN LAYOUT: Month calendar (left) + Day events list (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* CỘT BÊN TRÁI: LỊCH THÁNG (7 COLS ON LARGE) */}
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

                    {hasEvents && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-xs">
                        {cell.events.length}
                      </span>
                    )}
                  </div>

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

          {/* CALENDAR FOOTER */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-700">Thể loại:</span>
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
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT BÊN PHẢI: CHI TIẾT SỰ KIỆN TRONG NGÀY (5 COLS) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
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
                  const isOrganizer = isAuthorizedOrganizer(ev);
                  const isCheckedIn = currentUser && myMemberRecord
                    ? ev.attendees.includes(myMemberRecord.id)
                    : false;

                  return (
                    <div
                      key={ev.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col group"
                    >
                      {/* COVER PHOTO */}
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

                        {/* Top Badges */}
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

                        {/* Event Title */}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h4 className="font-extrabold text-base leading-snug line-clamp-2 drop-shadow-sm">
                            {ev.title}
                          </h4>
                        </div>
                      </div>

                      {/* CARD CONTENT */}
                      <div className="p-4 space-y-3">
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

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="text-slate-500">Ban phụ trách:</span>
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

                        {/* ========================================================================= */}
                        {/* QR DYNAMIC & SCANNER ACTION BUTTONS (STRICT PERMISSION) */}
                        {/* ========================================================================= */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            {ev.attendanceClosed || ev.status === 'completed' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQrBroadcastEvent(ev);
                                    setAttendanceModalTab('broadcast');
                                  }}
                                  className="py-2 px-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  title="Biên bản điểm danh đã chốt số"
                                >
                                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Đã chốt sổ ({ev.attendees.length})</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setQrBroadcastEvent(ev);
                                    setAttendanceModalTab('roster');
                                  }}
                                  className="py-2 px-2.5 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  title="Xem danh sách người tham dự chính thức"
                                >
                                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Danh sách ({ev.attendees.length})</span>
                                </button>
                              </>
                            ) : (
                              <>
                                {isOrganizer ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQrBroadcastEvent(ev);
                                      setAttendanceModalTab('broadcast');
                                    }}
                                    className="py-2 px-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                    title="Mở màn hình chiếu mã QR động xoay vòng 5s"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>Tạo QR Động (5s)</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="py-2 px-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center justify-center gap-1"
                                    title="Chỉ Trưởng ban sự kiện này và Chủ nhiệm mới có quyền tạo QR điểm danh"
                                  >
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span>Tạo QR (Trưởng ban)</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!currentUser) {
                                      onRequireAuth?.();
                                      return;
                                    }
                                    setQrBroadcastEvent(ev);
                                    setAttendanceModalTab('scan');
                                    setScanResultFeedback(null);
                                    setManualTokenInput('');
                                  }}
                                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                    isCheckedIn
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                  }`}
                                >
                                  <Scan className="w-3.5 h-3.5" />
                                  <span>{isCheckedIn ? 'Đã điểm danh ✓' : 'Quét QR Điểm danh'}</span>
                                </button>
                              </>
                            )}
                          </div>

                          {/* DETAILS BUTTON & ADMIN ACTIONS */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailModalEvent(ev)}
                              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem lịch trình chi tiết</span>
                            </button>

                            {(canManageEvents || isOrganizer) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(ev)}
                                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                                  title="Chỉnh sửa sự kiện"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEventClick(ev.id, ev.title)}
                                  className="p-1.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                                  title="Xóa sự kiện"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 px-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto border border-indigo-100">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Không có sự kiện nào trong ngày này
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Bạn có thể chọn một ngày khác có chỉ báo trên lịch hoặc tạo sự kiện mới.
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
      {/* 2. UNIFIED DYNAMIC ANTI-FRAUD QR ATTENDANCE MODAL (MATCHES REFERENCE 1 & 2) */}
      {/* ========================================================================= */}
      {qrBroadcastEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div
            className={`relative w-full ${
              isQrFullscreen ? 'max-w-5xl h-[95vh]' : 'max-w-4xl'
            } bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 my-4`}
          >
            {/* MODAL HEADER (DARK NAVY THEME) */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 text-indigo-400 border border-indigo-700/60 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                      Điểm Danh QR Động (Anti-Fraud)
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      Xoay mã 5s
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md mt-0.5">
                    {qrBroadcastEvent.title} · {qrBroadcastEvent.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* 3 SEGMENTED NAVIGATION TABS */}
                <div className="bg-slate-800/90 p-1 rounded-xl flex items-center gap-1 border border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setAttendanceModalTab('broadcast')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      attendanceModalTab === 'broadcast'
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    Màn hình QR
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttendanceModalTab('scan');
                      setScanResultFeedback(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      attendanceModalTab === 'scan'
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    Tôi Điểm Danh
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceModalTab('roster')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      attendanceModalTab === 'roster'
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    Danh sách ({qrBroadcastEvent.attendees.length})
                  </button>
                </div>

                {/* FULLSCREEN TOGGLE */}
                <button
                  type="button"
                  onClick={() => setIsQrFullscreen(!isQrFullscreen)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title={isQrFullscreen ? 'Thu nhỏ' : 'Toàn màn hình máy chiếu'}
                >
                  {isQrFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* CLOSE BUTTON */}
                <button
                  type="button"
                  onClick={() => setQrBroadcastEvent(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* TOP 3 METRICS CARDS (EXACT MATCH TO REFERENCE 1 & 2) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6 pb-2 bg-slate-50/50 border-b border-slate-100">
              {/* CARD 1: THỜI LƯỢNG MỞ TỐI ĐA */}
              <div
                className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                  qrBroadcastEvent.attendanceClosed || qrBroadcastEvent.status === 'completed'
                    ? 'bg-white border-emerald-200 shadow-2xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    qrBroadcastEvent.attendanceClosed || qrBroadcastEvent.status === 'completed'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-indigo-600 text-white shadow-xs'
                  }`}
                >
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    THỜI LƯỢNG MỞ TỐI ĐA
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    {qrBroadcastEvent.attendanceClosed || qrBroadcastEvent.status === 'completed'
                      ? 'ĐÃ CHỐT SỔ'
                      : '15:00'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {qrBroadcastEvent.attendanceClosed || qrBroadcastEvent.status === 'completed'
                      ? 'Đã kết thúc điểm danh'
                      : 'Đang mở điểm danh trực tiếp'}
                  </div>
                </div>
              </div>

              {/* CARD 2: CHU KỲ ĐỔI MÃ CHỐNG GIAN LẬN */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-3.5 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <RefreshCw
                    className={`w-6 h-6 ${
                      !qrBroadcastEvent.attendanceClosed && qrBroadcastEvent.status !== 'completed'
                        ? 'animate-spin'
                        : ''
                    }`}
                    style={{ animationDuration: '6s' }}
                  />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    CHU KỲ ĐỔI MÃ CHỐNG GIAN LẬN
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    5 giây
                  </div>
                  <div className="text-xs text-slate-500">
                    Ngăn chặn chụp màn hình điểm danh hộ
                  </div>
                </div>
              </div>

              {/* CARD 3: ĐÃ ĐIỂM DANH */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center gap-3.5 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ĐÃ ĐIỂM DANH
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    {qrBroadcastEvent.attendees.length} / {qrBroadcastEvent.expectedAttendees}
                  </div>
                  <div className="text-xs text-slate-500">
                    Tỷ lệ: {Math.round((qrBroadcastEvent.attendees.length / (qrBroadcastEvent.expectedAttendees || 1)) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL MAIN CONTENT AREA (DYNAMIC ACCORDING TO ACTIVE TAB) */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              {/* TAB 1: MÀN HÌNH QR */}
              {attendanceModalTab === 'broadcast' && (
                <>
                  {/* CASE A: ATTENDANCE CLOSED / LOCKED (EXACT MATCH TO REFERENCE IMAGE 1) */}
                  {qrBroadcastEvent.attendanceClosed || qrBroadcastEvent.status === 'completed' ? (
                    <div className="rounded-3xl border border-emerald-300 bg-emerald-50/20 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 my-2 shadow-xs">
                      {/* Center Green Lock Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                        <Lock className="w-8 h-8" />
                      </div>

                      {/* Locked Badge */}
                      <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 uppercase tracking-wider">
                        ĐÃ CHỐT DANH SÁCH (LOCKED)
                      </span>

                      {/* Heading */}
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Phiên điểm danh đã kết thúc
                      </h2>

                      {/* Subtitle with signer and time */}
                      <p className="text-xs sm:text-sm text-slate-600 max-w-lg leading-relaxed">
                        Danh sách người tham dự đã được chốt và ký số bởi{' '}
                        <strong className="text-slate-900 font-bold">
                          {qrBroadcastEvent.closedBy || 'Nguyễn Văn An (Chủ nhiệm CLB)'}
                        </strong>{' '}
                        lúc <span className="font-mono">{qrBroadcastEvent.closedAt || '28/10/2026'}</span>. Không thể bổ sung thêm thành viên mới.
                      </p>

                      {/* Two Action Buttons from Image 1 */}
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setAttendanceModalTab('roster')}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          <span>Xem danh sách chốt ({qrBroadcastEvent.attendees.length} thành viên)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handlePrintRoster}
                          className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>In biên bản điểm danh</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* CASE B: ATTENDANCE ACTIVE (ROTATING 5-SECOND DYNAMIC QR) */
                    <div className="flex flex-col items-center justify-center text-center space-y-5 py-4">
                      {/* 5-SECOND ROTATING TIMER INDICATOR */}
                      <div className="w-full max-w-sm space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1.5 text-indigo-700">
                            <RefreshCw className={`w-3.5 h-3.5 ${qrSecondsLeft <= 2 ? 'animate-spin' : ''}`} />
                            <span>Tự động đổi mã sau:</span>
                          </span>
                          <span className="font-mono text-sm px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                            {qrSecondsLeft} giây
                          </span>
                        </div>

                        {/* Animated progress bar */}
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                            style={{ width: `${(qrSecondsLeft / 5) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* QR CODE CONTAINER */}
                      <div className="relative p-5 bg-white rounded-3xl border-2 border-indigo-200 shadow-xl inline-block group">
                        {qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt="Mã QR Điểm Danh Động 5s"
                            className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto rounded-2xl"
                          />
                        ) : (
                          <div className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center bg-slate-50 rounded-2xl">
                            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                          </div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-lg border border-slate-200 flex items-center justify-center text-indigo-600 font-extrabold text-xs">
                            UC
                          </div>
                        </div>
                      </div>

                      {/* SECURITY NOTICE */}
                      <div className="max-w-md text-xs text-slate-500 space-y-1">
                        <p className="font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Bảo mật chống gian lận & điểm danh hộ</span>
                        </p>
                        <p>
                          Mã QR được mã hóa và thay đổi động sau mỗi <strong>5 giây</strong>. Ảnh chụp màn hình gửi từ xa sẽ tự động hết hạn và bị hệ thống từ chối.
                        </p>
                      </div>

                      {/* ACTION BUTTONS: KẾT THÚC ĐIỂM DANH & QUÉT THỬ */}
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        {isAuthorizedOrganizer(qrBroadcastEvent) && (
                          <button
                            type="button"
                            onClick={() => handleEndAttendanceSession(qrBroadcastEvent)}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                            title="Dừng chiếu mã QR và khóa sổ điểm danh"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Kết thúc Điểm danh & Chốt sổ</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setAttendanceModalTab('scan');
                            setScanResultFeedback(null);
                          }}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Scan className="w-4 h-4" />
                          <span>Mở máy quét điểm danh</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: TÔI ĐIỂM DANH (CAMERA SCANNER & SIMULATOR) */}
              {attendanceModalTab === 'scan' && (
                <div className="max-w-xl mx-auto space-y-4 py-2">
                  {/* Current student badge */}
                  {currentUser && myMemberRecord && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                          {myMemberRecord.fullName.split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{myMemberRecord.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            MSSV: {myMemberRecord.mssv} · {myMemberRecord.department}
                          </div>
                        </div>
                      </div>

                      {qrBroadcastEvent.attendees.includes(myMemberRecord.id) ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Đã có mặt
                        </span>
                      ) : qrBroadcastEvent.attendanceClosed ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-600">
                          Đã đóng điểm danh
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                          Sẵn sàng điểm danh
                        </span>
                      )}
                    </div>
                  )}

                  {qrBroadcastEvent.attendanceClosed ? (
                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
                      <Lock className="w-8 h-8 text-amber-600 mx-auto" />
                      <div className="font-bold text-slate-900 text-sm">
                        Phiên điểm danh này đã kết thúc và chốt sổ
                      </div>
                      <p className="text-xs text-slate-600">
                        Không thể quét mã hoặc bổ sung thêm sinh viên vào danh sách đã chốt.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Scan Method Switch */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
                        <button
                          type="button"
                          onClick={() => setScanMethod('camera')}
                          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            scanMethod === 'camera' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Quét Camera Trực tiếp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setScanMethod('manual')}
                          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            scanMethod === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Mô phỏng 1 Chạm</span>
                        </button>
                      </div>

                      {/* Camera Viewfinder */}
                      {scanMethod === 'camera' && (
                        <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                          <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                            <div className="relative w-44 h-44 border-2 border-emerald-400 rounded-2xl">
                              <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-500" />
                              <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-500" />
                              <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-500" />
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-500" />
                              <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse absolute top-1/2 -translate-y-1/2" />
                            </div>
                          </div>
                          <div className="absolute bottom-2 text-[10px] text-white/80 bg-slate-900/70 px-3 py-1 rounded-full backdrop-blur-sm">
                            Hướng camera về phía mã QR đang xoay vòng trên màn hình
                          </div>
                        </div>
                      )}

                      {/* 1-Click Fast Simulation for Testing */}
                      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Mô phỏng Quét Nhanh (Dành cho thử nghiệm):</span>
                          </span>
                          <span className="text-[10px] text-indigo-600 font-mono">5s Anti-Fraud Check</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentQrToken) {
                              handleVerifyAndCheckIn(currentQrToken);
                            } else {
                              const testPayload = JSON.stringify({
                                app: 'UNICLUB_HUB_CHECKIN',
                                eventId: qrBroadcastEvent.id,
                                eventTitle: qrBroadcastEvent.title,
                                date: qrBroadcastEvent.date,
                                timestamp: Date.now(),
                                expiresAt: Date.now() + 5000,
                                token: `QR-SIM-${Date.now().toString(36)}`,
                              });
                              handleVerifyAndCheckIn(testPayload);
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Scan className="w-4 h-4" />
                          <span>Xác nhận quét mã QR đang xoay vòng ngay bây giờ</span>
                        </button>
                      </div>

                      {/* Feedback banner */}
                      {scanResultFeedback && (
                        <div
                          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in ${
                            scanResultFeedback.type === 'success'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : 'bg-rose-50 border-rose-200 text-rose-900'
                          }`}
                        >
                          {scanResultFeedback.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-0.5">
                            <div className="font-bold">
                              {scanResultFeedback.type === 'success' ? 'Thành công!' : 'Lỗi điểm danh'}
                            </div>
                            <div className="leading-relaxed">{scanResultFeedback.message}</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: DANH SÁCH (EXACT MATCH TO REFERENCE IMAGE 2) */}
              {attendanceModalTab === 'roster' && (
                <div className="space-y-4">
                  {/* Heading row with pill & print button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                          Danh Sách Tham Dự Chính Thức
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold font-mono">
                          {qrBroadcastEvent.attendees.length} / {qrBroadcastEvent.expectedAttendees}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {qrBroadcastEvent.attendanceClosed || qrBroadcastEvent.status === 'completed'
                          ? `Đã được chốt bởi ${qrBroadcastEvent.closedBy || 'Nguyễn Văn An (Chủ nhiệm CLB)'}`
                          : 'Đang mở phiên điểm danh — danh sách cập nhật trực tiếp thời gian thực'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handlePrintRoster}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                    >
                      <Printer className="w-4 h-4" />
                      <span>In danh sách</span>
                    </button>
                  </div>

                  {/* Attendance Table from Image 2 */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4 w-14 text-center">STT</th>
                          <th className="py-3 px-4">MSSV</th>
                          <th className="py-3 px-4">HỌ VÀ TÊN</th>
                          <th className="py-3 px-4">BAN TRỰC THUỘC</th>
                          <th className="py-3 px-4">PHƯƠNG THỨC XÁC THỰC</th>
                          <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {qrBroadcastEvent.attendees.length > 0 ? (
                          qrBroadcastEvent.attendees.map((memId, idx) => {
                            const member = members.find((m) => m.id === memId);
                            const mssvStr = member?.mssv || `B2${idx + 1}DCCN${String(idx * 45 + 1).padStart(3, '0')}`;
                            const nameStr = member?.fullName || `Sinh viên UniClub ${idx + 1}`;
                            const deptStr = member?.department || qrBroadcastEvent.leadDepartment;

                            return (
                              <tr key={memId} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 text-center font-bold text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                                  {mssvStr}
                                </td>
                                <td className="py-3 px-4 font-bold text-slate-900">
                                  {nameStr}
                                </td>
                                <td className="py-3 px-4 text-slate-700">
                                  {deptStr}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span>Quét QR động 5s</span>
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Có mặt</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                              Chưa có sinh viên nào điểm danh trong phiên này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* MODAL FOOTER (MATCHES REFERENCE 1 & 2) */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-medium truncate">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Biên bản đã được chốt và lưu trữ vĩnh viễn trên hệ thống.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Red End Attendance Button if session is still active and user is authorized */}
                {!qrBroadcastEvent.attendanceClosed &&
                  qrBroadcastEvent.status !== 'completed' &&
                  isAuthorizedOrganizer(qrBroadcastEvent) && (
                    <button
                      type="button"
                      onClick={() => handleEndAttendanceSession(qrBroadcastEvent)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Kết thúc và chốt sổ điểm danh cho sự kiện này"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Kết thúc Điểm danh</span>
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() => setQrBroadcastEvent(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL CHI TIẾT SỰ KIỆN & CÁC HOẠT ĐỘNG TRONG CHƯƠNG TRÌNH */}
      {/* ========================================================================= */}
      {detailModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in duration-200">
            {/* BANNER COVER */}
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

              <button
                type="button"
                onClick={() => setDetailModalEvent(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-md"
              >
                <X className="w-5 h-5" />
              </button>

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

              {/* QUICK QR SHORTCUTS BAR IN DETAIL MODAL */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-indigo-950">
                  <div className="font-bold flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>Điểm danh bằng Mã QR Động (Đổi mỗi 10 giây)</span>
                  </div>
                  <div className="text-[11px] text-indigo-700 mt-0.5">
                    Hỗ trợ quét qua camera hoặc mã xác thực thời gian thực
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {isAuthorizedOrganizer(detailModalEvent) && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setQrBroadcastEvent(detailModalEvent);
                          setAttendanceModalTab(detailModalEvent.attendanceClosed ? 'roster' : 'broadcast');
                        }}
                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{detailModalEvent.attendanceClosed ? 'Xem Điểm Danh' : 'Chiếu QR Động'}</span>
                      </button>

                      {!detailModalEvent.attendanceClosed && detailModalEvent.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleEndAttendanceSession(detailModalEvent)}
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Kết thúc và chốt sổ điểm danh sự kiện này"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Kết thúc Điểm danh</span>
                        </button>
                      )}
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        onRequireAuth?.();
                        return;
                      }
                      setQrBroadcastEvent(detailModalEvent);
                      setAttendanceModalTab('scan');
                      setScanResultFeedback(null);
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Quét QR</span>
                  </button>
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

              {/* PROGRAM ACTIVITIES TIMELINE */}
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
                    Chương trình đang được cập nhật chi tiết...
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
                            if (isAuthorizedOrganizer(detailModalEvent)) {
                              onToggleAttendee(detailModalEvent.id, m.id);
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                            isAuthorizedOrganizer(detailModalEvent)
                              ? 'cursor-pointer hover:border-slate-300'
                              : 'cursor-default'
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
                {isAuthorizedOrganizer(detailModalEvent)
                  ? 'Bạn có quyền tạo mã QR và quản lý điểm danh cho sự kiện này'
                  : 'Chỉ Trưởng ban sự kiện và Chủ nhiệm mới có quyền quản lý điểm danh'}
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
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>
                )}

                {(canManageEvents || isAuthorizedOrganizer(detailModalEvent)) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteEventClick(detailModalEvent.id, detailModalEvent.title)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Xóa sự kiện này khỏi hệ thống"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDetailModalEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD / EDIT EVENT MODAL */}
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

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Hình ảnh minh họa sự kiện</span>
                  </span>
                </label>

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

                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="Hoặc dán URL ảnh sự kiện tại đây (https://...)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

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
