import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Sparkles,
  FileText,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { TreasuryTransaction, TransactionType } from '../types.ts';
import {
  formatVND,
  formatDateTime,
  calculateTreasuryBalance,
  canApproveExpense,
} from '../domain/clubLogic.ts';

interface TreasuryTabProps {
  transactions: TreasuryTransaction[];
  onAddTransaction: (newTx: Omit<TreasuryTransaction, 'id' | 'voucherCode'>) => void;
  onApproveTransaction: (id: string) => { success: boolean; reason?: string };
  onRejectTransaction: (id: string) => void;
}

export const TreasuryTab: React.FC<TreasuryTabProps> = ({
  transactions,
  onAddTransaction,
  onApproveTransaction,
  onRejectTransaction,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [approvalAlert, setApprovalAlert] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'expense' as TransactionType,
    amount: 1500000,
    category: 'Hậu cần & Thiết bị',
    requester: 'Ban Sự kiện',
    date: '2026-10-05',
    note: '',
  });

  const treasurySummary = calculateTreasuryBalance(transactions, false);

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'all') return true;
    if (filterType === 'income') return t.type === 'income';
    if (filterType === 'expense') return t.type === 'expense';
    if (filterType === 'pending') return t.status === 'pending';
    return true;
  });

  const handleTestOverdraftPreset = () => {
    const overdraftAmount = treasurySummary.availableBalance + 15000000;
    setFormData({
      title: 'Đề xuất mua Laptop trạm & Máy in màu công nghiệp CLB',
      type: 'expense',
      amount: overdraftAmount,
      category: 'Thiết bị CLB (Vượt quỹ)',
      requester: 'Ban Hậu cần',
      date: '2026-10-05',
      note: 'Phiếu chi cố tình vượt quá số dư khả dụng để thử nghiệm cơ chế canApproveExpense ngăn chặn âm quỹ.',
    });
    setApprovalAlert(null);
  };

  const handleQuickValidIncome = () => {
    setFormData({
      title: 'Nhận tài trợ học bổng từ cựu sinh viên K18',
      type: 'income',
      amount: 5000000,
      category: 'Tài trợ & Đóng góp',
      requester: 'Ban Chủ nhiệm',
      date: '2026-10-05',
      note: 'Khoản thu tự động được duyệt trực tiếp vào Quỹ CLB.',
    });
    setApprovalAlert(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên khoản thu/chi.');
      return;
    }
    if (formData.amount <= 0) {
      alert('Số tiền phải lớn hơn 0 VNĐ.');
      return;
    }

    onAddTransaction({
      title: formData.title.trim(),
      type: formData.type,
      amount: Number(formData.amount),
      category: formData.category,
      requester: formData.requester,
      date: formData.date,
      status: formData.type === 'income' ? 'approved' : 'pending',
      note: formData.note.trim(),
    });

    setShowAddModal(false);
    setApprovalAlert(null);
  };

  const handleApprove = (tx: TreasuryTransaction) => {
    const result = onApproveTransaction(tx.id);
    if (!result.success) {
      setApprovalAlert(result.reason || 'Không thể phê duyệt khoản chi này!');
    } else {
      setApprovalAlert(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* FINANCIAL 4 INDICATOR STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tổng Thu đã duyệt</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono tabular-nums text-slate-900">
            {formatVND(treasurySummary.totalIncome)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Hội phí, tài trợ doanh nghiệp, khen thưởng
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tổng Chi đã duyệt</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono tabular-nums text-slate-900">
            {formatVND(treasurySummary.totalExpense)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Hạ tầng, ấn phẩm, teabreak sự kiện
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4.5 shadow-xs ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Số dư Quỹ khả dụng</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono tabular-nums text-emerald-700">
            {formatVND(treasurySummary.availableBalance)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ngân sách an toàn có thể giải ngân</span>
          </div>
        </div>

        {/* Pending Expense */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Đề xuất chi chờ duyệt</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono tabular-nums text-amber-700">
            {formatVND(treasurySummary.pendingExpense)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Cần Ban Chủ nhiệm thẩm định
          </div>
        </div>
      </div>

      {/* OVERDRAFT ALERT BANNER IF TRIGGERED */}
      {approvalAlert && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3 text-xs text-rose-900 animate-in fade-in shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <strong className="font-bold text-rose-950">
              CƠ CHẾ BẢO VỆ NGÂN SÁCH KÍCH HOẠT:{' '}
            </strong>
            <span>{approvalAlert}</span>
          </div>
          <button
            onClick={() => setApprovalAlert(null)}
            className="text-rose-500 hover:text-rose-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOOLBAR: FILTER & ACTIONS */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Bộ lọc:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({transactions.length})
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                filterType === 'income'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thu đã duyệt
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                filterType === 'expense'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chi đã duyệt
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                filterType === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chờ duyệt ({transactions.filter((t) => t.status === 'pending').length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowAddModal(true);
              setApprovalAlert(null);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Phiếu Thu / Chi Mới</span>
          </button>
        </div>
      </div>

      {/* TRANSACTIONS DATA GRID */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 font-mono">Mã chứng từ</th>
                <th className="px-4 py-3">Nội dung Thu / Chi</th>
                <th className="px-4 py-3">Phân loại & Đơn vị lập</th>
                <th className="px-4 py-3 font-mono">Ngày lập</th>
                <th className="px-4 py-3 text-right font-mono">Số tiền (VNĐ)</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const isPending = tx.status === 'pending';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Voucher Code */}
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 tabular-nums">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono">
                        {tx.voucherCode}
                      </span>
                    </td>

                    {/* Title & Notes */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-bold text-slate-900">{tx.title}</div>
                      {tx.note && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {tx.note}
                        </div>
                      )}
                    </td>

                    {/* Category & Requester */}
                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-medium">{tx.category}</div>
                      <div className="text-[11px] text-slate-500">{tx.requester}</div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 font-mono tabular-nums text-slate-600">
                      {formatDateTime(tx.date)}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-extrabold text-sm">
                      <span className={isIncome ? 'text-emerald-700' : 'text-slate-900'}>
                        {isIncome ? '+' : '-'}
                        {formatVND(tx.amount)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {tx.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Đã duyệt
                        </span>
                      ) : tx.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          Chờ duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          Từ chối
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(tx)}
                            title="Phê duyệt chi ngân sách"
                            className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
                          >
                            Duyệt chi
                          </button>
                          <button
                            onClick={() => onRejectTransaction(tx.id)}
                            title="Từ chối chi"
                            className="px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-md transition-colors"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE VOUCHER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Lập Chứng từ Thu / Chi Quỹ CLB
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phiếu Thu tự động ghi nhận; Phiếu Chi yêu cầu kiểm duyệt an toàn ngân sách
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets for Testing & Demonstration */}
            <div className="mt-3.5 p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kịch bản Thử nghiệm Nhanh (Preset Scenarios):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleQuickValidIncome}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                >
                  ✓ Điền phiếu thu (Tự động duyệt)
                </button>
                <button
                  type="button"
                  onClick={handleTestOverdraftPreset}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors"
                >
                  ⚠ Tạo phiếu chi vượt quỹ để test chặn lỗi
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 text-xs">
              {/* Type Switch */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Loại chứng từ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`py-2.5 px-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.type === 'income'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    <span>Phiếu Thu (Cộng quỹ)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`py-2.5 px-3 rounded-xl border font-bold transition-all flex items-center justify-center gap-2 ${
                      formData.type === 'expense'
                        ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    <span>Phiếu Chi (Trừ quỹ)</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội dung chứng từ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: Mua nước ngọt và bánh kẹo Workshop"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số tiền (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3 py-2 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 tabular-nums font-bold"
                  />
                  <div className="mt-1 text-[11px] text-slate-500 font-mono">
                    = {formatVND(formData.amount)}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hạng mục</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Hậu cần, Truyền thông, Hội phí..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Requester & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Đơn vị / Ban đề xuất
                  </label>
                  <input
                    type="text"
                    value={formData.requester}
                    onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                    placeholder="Ban Hậu cần, Ban Chuyên môn..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày lập phiếu</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-2.5 py-2 font-mono text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú & Hóa đơn chứng minh
                </label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Ghi chú số hóa đơn, link ảnh biên lai thanh toán..."
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
                  Tạo Phiếu Chứng Từ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
