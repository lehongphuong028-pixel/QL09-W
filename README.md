# QL09-W — Émeraude Restaurant

Ứng dụng web đặt bàn, đặt món trước, quản lý sơ đồ bàn và chatbot AI cho nhà hàng/quán ăn.

## Chức năng
- Thực đơn, giỏ món và đặt món trước
- Đặt bàn theo ngày, khung giờ, số khách và bàn
- Đặt cọc, chống trùng lịch, sơ đồ bàn trực quan
- Quản lý đặt chỗ và cập nhật trạng thái
- Chatbot AI nghiệp vụ với API tool-calling demo
- Đặt tiệc/sự kiện và đánh giá nhà hàng
- Dashboard báo cáo giao diện quản lý

## Yêu cầu
- Node.js 20+
- Windows PowerShell hoặc Terminal trong VS Code

## Chạy local
```powershell
npm.cmd install
npm.cmd run dev
```

Mở `http://localhost:5173`. API chạy tại `http://localhost:3001/api`.

Chạy bản sản xuất:
```powershell
npm.cmd run build
npm.cmd start
```
Sau đó mở `http://localhost:3001`.

## Cấu hình chatbot thật
Chatbot demo hoạt động không cần khóa API. Khi tích hợp LLM bên ngoài, thêm `OPENAI_API_KEY` vào file `.env` và triển khai adapter trong `server/index.js`. Không commit khóa API.

## API chính
- `GET /api/menu`
- `GET /api/tables`
- `GET /api/reservations`
- `POST /api/reservations`
- `PATCH /api/reservations/:id/status`
- `GET /api/reviews`
- `POST /api/reviews`
- `POST /api/chat`

## Quản lý dự án
- GitHub: source control, Issues, Actions
- Jira: backlog, sprint và D01–D27
- MS Project: kế hoạch nguồn lực và mốc tiến độ
- Dịch vụ mua: OpenAI/Azure OpenAI, cổng thanh toán VNPay/Momo/Stripe
- Rủi ro chính: khách không đến; trùng bàn. Giải pháp: cọc, timeout giữ bàn, kiểm tra trùng độc nhất theo bàn/ngày/giờ.
