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

  // Today reference (October 27, 2026 or real system date)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
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

  // =========================================================================
  // DYNAMIC 10-SECOND ROTATING QR CODE BROADCAST STATE
  // =========================================================================
  const [qrBroadcastEvent, setQrBroadcastEvent] = useState<ClubEvent | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSecondsLeft, setQrSecondsLeft] = useState<number>(10);
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
  // DYNAMIC 10-SECOND ROTATING QR CODE ENGINE
  // =========================================================================
  useEffect(() => {
    if (!qrBroadcastEvent) {
      setQrSecondsLeft(10);
      setQrDataUrl('');
      setCurrentQrToken('');
      return;
    }

    let isMounted = true;

    // Helper to generate a rotating QR payload
    const regenerateQr = async () => {
      const now = Date.now();
      const nonce = Math.random().toString(36).substring(2, 8).toUpperCase();
      const token = `QR-${qrBroadcastEvent.id.slice(-4)}-${nonce}-${now.toString(36).slice(-4).toUpperCase()}`;

      const payloadObj = {
        app: 'UNICLUB_HUB_CHECKIN',
        eventId: qrBroadcastEvent.id,
        eventTitle: qrBroadcastEvent.title,
        date: qrBroadcastEvent.date,
        timestamp: now,
        expiresAt: now + 12000, // 12 seconds validity (10s rotation + 2s buffer)
        token,
      };

      const payloadStr = JSON.stringify(payloadObj);

      try {
        const url = await QRCode.toDataURL(payloadStr, {
          width: 360,
          margin: 2,
          color: {
            dark: '#1e1b4b',
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
    setQrSecondsLeft(10);

    // 1-second interval to update countdown timer and refresh every 10 seconds
    const interval = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          regenerateQr();
          return 10;
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
  useEffect(() => {
    if (qrScanTargetEvent && scanMethod === 'camera') {
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
  }, [qrScanTargetEvent, scanMethod]);

  // Execute attendance verification
  const handleVerifyAndCheckIn = (scannedPayloadStr: string) => {
    if (!qrScanTargetEvent) return;

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
      if (payload.eventId !== qrScanTargetEvent.id) {
        setScanResultFeedback({
          type: 'error',
          message: `Mã QR này thuộc sự kiện "${payload.eventTitle || 'khác'}", không khớp với sự kiện "${qrScanTargetEvent.title}"!`,
        });
        return;
      }

      // Verify rotation expiry (10 seconds with 5s grace buffer)
      const now = Date.now();
      const ageMs = now - (payload.timestamp || 0);
      if (ageMs > 15000) {
        setScanResultFeedback({
          type: 'error',
          message: 'Mã QR đã hết hạn (quá 10 giây)! Vui lòng quét mã mới đang chiếu trên màn hình ban tổ chức.',
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
      if (qrScanTargetEvent.attendees.includes(member.id)) {
        setScanResultFeedback({
          type: 'success',
          message: `Sinh viên ${member.fullName} (${member.mssv}) đã được điểm danh trước đó rồi!`,
          studentName: member.fullName,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
        });
        return;
      }

      // Record attendance
      onToggleAttendee(qrScanTargetEvent.id, member.id);
      const timeStr = new Date().toLocaleTimeString('vi-VN');

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
      `Sau khi kết thúc, màn hình chiếu mã QR động sẽ dừng phát và danh sách tham dự được chốt lưu lại.`
    );
    if (!confirmed) return;

    if (onUpdateEvent) {
      onUpdateEvent(ev.id, {
        status: 'completed',
      });
    }

    if (detailModalEvent && detailModalEvent.id === ev.id) {
      setDetailModalEvent({
        ...detailModalEvent,
        status: 'completed',
      });
    }

    if (qrBroadcastEvent && qrBroadcastEvent.id === ev.id) {
      setQrBroadcastEvent(null);
    }

    alert(`Đã kết thúc điểm danh cho sự kiện "${ev.title}" thành công!\nTổng cộng có ${ev.attendees.length} sinh viên đã được ghi nhận có mặt.`);
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
            Theo dõi thời khóa biểu, tạo mã QR động tự động đổi sau 10 giây và quét QR điểm danh chính xác theo thời gian thực
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
                            {/* DYNAMIC QR CODE GENERATOR BUTTON (Organizer Only) */}
                            {isOrganizer ? (
                              <button
                                type="button"
                                onClick={() => setQrBroadcastEvent(ev)}
                                className="py-2 px-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                title="Mở màn hình chiếu mã QR động 10 giây/lần"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>Tạo QR Động (10s)</span>
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

                            {/* QR CODE SCANNER BUTTON (Students & Organizers) */}
                            <button
                              type="button"
                              onClick={() => {
                                if (!currentUser) {
                                  onRequireAuth?.();
                                  return;
                                }
                                setQrScanTargetEvent(ev);
                                setScanResultFeedback(null);
                                setManualTokenInput('');
                              }}
                              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                                isCheckedIn
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              }`}
                            >
                              <Scan className="w-3.5 h-3.5" />
                              <span>{isCheckedIn ? 'Đã điểm danh ✓' : 'Quét QR Điểm danh'}</span>
                            </button>
                          </div>

                          {/* DETAILS BUTTON & ADMIN ACTIONS */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailModalEvent(ev)}
                              className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem lịch trình chi tiết</span>
                            </button>

                            {canManageEvents && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(ev)}
                                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                                  title="Chỉnh sửa sự kiện"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEventClick(ev.id, ev.title)}
                                  className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors"
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
      {/* 2. DYNAMIC 10-SECOND ROTATING QR CODE BROADCAST MODAL (PROJECTOR SCREEN) */}
      {/* ========================================================================= */}
      {qrBroadcastEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div
            className={`relative w-full ${
              isQrFullscreen ? 'max-w-4xl h-[95vh]' : 'max-w-2xl'
            } bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col transition-all duration-300`}
          >
            {/* MODAL HEADER */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
                      Màn hình Chiếu Mã QR Điểm danh Động
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>Đang phát trực tiếp</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-md">
                    {qrBroadcastEvent.title} · {qrBroadcastEvent.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsQrFullscreen(!isQrFullscreen)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title={isQrFullscreen ? 'Thu nhỏ' : 'Toàn màn hình máy chiếu'}
                >
                  {isQrFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setQrBroadcastEvent(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Đóng màn hình chiếu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col items-center justify-center text-center space-y-5 overflow-y-auto">
              {/* 10-SECOND ROTATING TIMER INDICATOR */}
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

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(qrSecondsLeft / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* QR CODE CONTAINER */}
              <div className="relative p-4 sm:p-6 bg-white rounded-3xl border-2 border-indigo-200 shadow-xl inline-block group">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Mã QR Điểm Danh Động"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain mx-auto rounded-2xl"
                  />
                ) : (
                  <div className="w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center bg-slate-50 rounded-2xl">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                )}

                {/* Center Badge Icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-lg border border-slate-200 flex items-center justify-center text-indigo-600 font-extrabold text-xs">
                    UC
                  </div>
                </div>
              </div>

              {/* SECURITY EXPLANATION NOTICE */}
              <div className="max-w-md text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Bảo mật chống gian lận & điểm danh hộ</span>
                </p>
                <p>
                  Mã QR được mã hóa và thay đổi động sau mỗi <strong>10 giây</strong>. Ảnh chụp màn hình gửi từ xa sẽ tự động hết hạn và bị hệ thống từ chối.
                </p>
              </div>

              {/* LIVE ATTENDANCE MONITORING STATS */}
              <div className="w-full max-w-lg p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="text-left">
                  <div className="text-slate-500">Tiến độ điểm danh thực tế:</div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {qrBroadcastEvent.attendees.length} / {qrBroadcastEvent.expectedAttendees} sinh viên
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQrScanTargetEvent(qrBroadcastEvent);
                      setScanResultFeedback(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Mở máy quét điểm danh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="truncate max-w-sm">
                Thẩm quyền: <strong>{isClubPresident ? 'Chủ nhiệm CLB' : 'Trưởng ban Sự kiện'}</strong>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {isAuthorizedOrganizer(qrBroadcastEvent) && (
                  <button
                    type="button"
                    onClick={() => handleEndAttendanceSession(qrBroadcastEvent)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Dừng chiếu QR và chốt sổ điểm danh cho sự kiện này"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kết thúc Điểm danh</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setQrBroadcastEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer"
                >
                  Đóng màn hình
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. QR SCANNER & ATTENDANCE VERIFICATION MODAL */}
      {/* ========================================================================= */}
      {qrScanTargetEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* HEADER */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-700 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold tracking-tight">
                    Quét Mã QR Điểm Danh Sự Kiện
                  </h3>
                  <p className="text-xs text-emerald-100 truncate max-w-xs">
                    {qrScanTargetEvent.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setQrScanTargetEvent(null)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-4">
              {/* CURRENT STUDENT IDENTITY */}
              {currentUser && myMemberRecord && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
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

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Sẵn sàng điểm danh
                  </span>
                </div>
              )}

              {/* SCAN METHOD SWITCH */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setScanMethod('camera')}
                  className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    scanMethod === 'camera' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Quét Camera Trực tiếp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScanMethod('manual')}
                  className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    scanMethod === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mô phỏng 1 Chạm</span>
                </button>
              </div>

              {/* CAMERA VIEWFINDER VIEW */}
              {scanMethod === 'camera' && (
                <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* CAMERA SCANNING VIEWFINDER RETICLE */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                    <div className="relative w-48 h-48 border-2 border-emerald-400 rounded-2xl">
                      {/* Corner markers */}
                      <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-500" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-500" />
                      <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-500" />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-500" />

                      {/* Moving laser scan line */}
                      <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse absolute top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="absolute bottom-2 text-[10px] text-white/80 bg-slate-900/60 px-3 py-1 rounded-full backdrop-blur-sm">
                    Hướng camera về phía mã QR trên màn hình chiếu
                  </div>
                </div>
              )}

              {/* QUICK SCAN SIMULATOR (1-CLICK & ACCESSIBLE FOR DESKTOP / LABS) */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Mô phỏng Quét Nhanh (Dành cho thử nghiệm):</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 font-mono">10s Dynamic Check</span>
                </div>

                <p className="text-indigo-800 text-[11px] leading-relaxed">
                  Nhấn nút bên dưới để mô phỏng quét mã QR đang xoay vòng trực tiếp từ ban tổ chức:
                </p>

                <button
                  type="button"
                  onClick={handleSimulateQuickScan}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Scan className="w-4 h-4" />
                  <span>Xác nhận quét mã QR đang chiếu ngay bây giờ</span>
                </button>
              </div>

              {/* FEEDBACK STATUS ALERT */}
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
            </div>

            {/* FOOTER */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setQrScanTargetEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-colors"
              >
                Hoàn tất
              </button>
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
                        onClick={() => setQrBroadcastEvent(detailModalEvent)}
                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Chiếu QR Động</span>
                      </button>

                      {detailModalEvent.status !== 'completed' && (
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
                      setQrScanTargetEvent(detailModalEvent);
                      setScanResultFeedback(null);
                    }}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
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
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
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
