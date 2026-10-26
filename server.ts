import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const UNICLUB_SYSTEM_INSTRUCTION = `Bạn là UniClub AI Assistant — Trợ lý Trí tuệ Nhân tạo thông minh của Hệ thống Quản trị Câu lạc bộ Sinh viên UniClub Hub.
Nhiệm vụ và nghiệp vụ của bạn:
1. Hỗ trợ Ban Chủ nhiệm, Ban Tài chính, Ban Sự kiện và Hội viên các nghiệp vụ quản trị CLB:
   - Quy trình tạm ứng, duyệt chứng từ thu chi quỹ CLB (nguyên tắc an toàn quỹ: số dư khả dụng không được âm, số tiền duyệt phải nhỏ hơn hoặc bằng số dư khả dụng hiện có).
   - Tổ chức sự kiện sinh viên, điểm danh QR, tính điểm rèn luyện ngoại khóa (chuẩn 80-100 điểm theo thang ĐH/CĐ).
   - Phân quyền RBAC (Chủ nhiệm, Thủ quỹ, Trưởng ban sự kiện, Hội viên, Khách).
   - Cơ chế đồng bộ dữ liệu thời gian thực Firestore: thao tác trên thiết bị này sẽ lập tức hiển thị trên thiết bị khác.
2. Hỗ trợ giải thích và gỡ lỗi quy trình CI/CD GitHub Actions:
   - Stage 01: Lint & TypeScript Verification (tsc --noEmit)
   - Stage 02: Automated Unit Testing (Vitest 12/12 test cases cho logic quản lý CLB & ngân quỹ)
   - Stage 03: Security & Dependency Audit (Kiểm toán bảo mật gói npm)
   - Stage 04: Production Build & Asset Packaging (Vite build)
   - Stage 05: Continuous Deployment (Tự động deploy lên GitHub Pages)
3. Phong cách trả lời:
   - Luôn trả lời bằng tiếng Việt thân thiện, chuyên nghiệp, rõ ràng.
   - Sử dụng định dạng Markdown (tiêu đề, bullet list, in đậm) để người dùng dễ đọc.
   - Hướng dẫn trực tiếp các nút bấm và tab trên giao diện UniClub Hub khi người dùng hỏi cách thao tác.`;

async function callGemini(contents: any[], systemInstruction: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents,
    config: {
      systemInstruction,
    },
  });
  return response.text;
}

function getClubKnowledgeFallback(userText: string): string {
  const query = userText.toLowerCase();
  if (query.includes('quy chế') || query.includes('duyệt chi') || query.includes('quỹ') || query.includes('chi')) {
    return `### 💰 Quy chế Quản lý & Duyệt Chi Ngân Quỹ UniClub Hub:

1. **Nguyên tắc an toàn quỹ tối cao (Safety Check):**
   - Số tiền chi duyệt phải nhỏ hơn hoặc bằng **Số dư khả dụng hiện có** (\`availableBalance\`).
   - Tuyệt đối không cho phép số dư khả dụng bị âm.
2. **Quyền hạn duyệt chi (RBAC):**
   - Chỉ người dùng có vai trò **Chủ nhiệm (Admin)** hoặc **Thủ quỹ (Treasurer)** mới có quyền duyệt chi hoặc từ chối chứng từ.
   - Hội viên thường chỉ có quyền tạo phiếu đề xuất chi và xem trạng thái chứng từ.
3. **Mã chứng từ tự động:**
   - Phiếu thu: \`THU-YYYY-XXX\`
   - Phiếu chi: \`CHI-YYYY-XXX\` (Được đồng bộ thời gian thực qua Cloud Firestore).`;
  }
  if (query.includes('sự kiện') || query.includes('điểm danh') || query.includes('qr')) {
    return `### 🎪 Quy trình Tổ chức Sự kiện & Điểm danh Sinh viên:

1. **Lên kế hoạch sự kiện:**
   - Chọn tab **Sự kiện** -> Nhấn **Tạo sự kiện mới**.
   - Điền tên sự kiện, phân loại (Workshop, Hackathon, Sinh hoạt định kỳ, Tuyển quân), ngày giờ và phòng/hội trường.
2. **Điểm danh & Mã QR:**
   - Trưởng ban Sự kiện hoặc Chủ nhiệm mở chi tiết sự kiện -> Quét mã QR hoặc nhấn chọn thành viên có mặt.
   - Trạng thái sẽ được cập nhật thời gian thực vào Cloud Firestore.`;
  }
  if (query.includes('điểm rèn luyện') || query.includes('ngoại khóa') || query.includes('điểm')) {
    return `### ⭐ Quy định Điểm Rèn luyện Ngoại khóa:

- Điểm khởi tạo mặc định của sinh viên chính thức: **80 điểm**.
- Thang điểm chuẩn: 0 - 100 điểm.
- Cộng điểm: Tham gia tổ chức sự kiện (+5đ), tham gia Workshop/Hackathon (+3đ), tích cực đóng góp (+2đ).
- Chỉ Chủ nhiệm hoặc Ban Chuyên môn mới có quyền cộng/trừ điểm rèn luyện trực tiếp trên danh bạ Nhân sự.`;
  }
  if (query.includes('ci/cd') || query.includes('pipeline') || query.includes('stage') || query.includes('actions') || query.includes('5')) {
    return `### 🚀 Kiến trúc 5 Stages của Pipeline CI/CD UniClub Hub:

- **Stage 01: Lint & TypeScript Verification:** Kiểm tra lỗi cú pháp và type check nghiêm ngặt (\`tsc --noEmit\`).
- **Stage 02: Automated Unit Testing:** Chạy bộ kiểm thử tự động 12/12 test cases (\`Vitest\`) cho domain logic tài chính & quản trị.
- **Stage 03: Security & Dependency Audit:** Quét lỗ hổng bảo mật các gói phụ thuộc npm.
- **Stage 04: Production Build & Asset Packaging:** Đóng gói mã nguồn với Vite thành static assets tối ưu.
- **Stage 05: Continuous Deployment:** Tự động phát hành bản build lên GitHub Pages.`;
  }
  return `### 🎓 UniClub AI Assistant:
Tôi có thể hỗ trợ bạn về:
- 💰 **Ngân quỹ & Duyệt chi:** Quy chế an toàn số dư, tạo phiếu thu chi, phân quyền thủ quỹ.
- 🎪 **Sự kiện & Điểm danh:** Tổ chức sự kiện, điểm danh QR, quản lý người tham gia.
- ⭐ **Nhân sự & Điểm rèn luyện:** Quản lý hội viên 5 ban, cập nhật điểm hoạt động.
- 🚀 **CI/CD Pipeline:** Quy trình kiểm thử tự động 5 stages với GitHub Actions.
- 🔥 **Cloud Firestore:** Lưu trữ dữ liệu và đồng bộ tức thì trên mọi thiết bị.

Bạn có thể nhập câu hỏi cụ thể hoặc nhấn các gợi ý phía trên!`;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không hợp lệ.' });
    }

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    try {
      const reply = await callGemini(contents, UNICLUB_SYSTEM_INSTRUCTION);
      return res.json({ reply });
    } catch (modelErr: any) {
      console.warn('Gemini model unavailable, falling back to UniClub assistant knowledge:', modelErr?.message);
      const lastUserMsg = messages.filter((m: any) => m.role === 'user').slice(-1)[0]?.content || '';
      const fallbackReply = getClubKnowledgeFallback(lastUserMsg);
      return res.json({ reply: fallbackReply });
    }
  } catch (error: any) {
    console.error('Server error in /api/chat:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi kết nối tới UniClub AI Assistant.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UniClub Hub Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
