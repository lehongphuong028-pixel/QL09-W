import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express(); app.use(cors()); app.use(express.json());
const port = process.env.PORT || 3001;
const tables = [
    { id: 'A1', name: 'Bàn A1', zone: 'Trong nhà', capacity: 2, status: 'available', x: 18, y: 20 },
    { id: 'A2', name: 'Bàn A2', zone: 'Trong nhà', capacity: 4, status: 'occupied', x: 43, y: 20 },
    { id: 'A3', name: 'Bàn A3', zone: 'Trong nhà', capacity: 4, status: 'available', x: 68, y: 20 },
    { id: 'B1', name: 'Bàn B1', zone: 'Sân vườn', capacity: 6, status: 'available', x: 18, y: 58 },
    { id: 'B2', name: 'Bàn B2', zone: 'Sân vườn', capacity: 8, status: 'reserved', x: 43, y: 58 },
    { id: 'B3', name: 'Bàn B3', zone: 'VIP', capacity: 10, status: 'available', x: 68, y: 58 }
];
const menu = [
    { id: 1, name: 'Bò Wagyu nướng sốt tiêu', category: 'Món chính', price: 320000, description: 'Thịt Wagyu nhập khẩu, sốt tiêu xanh, rau củ nướng', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80' },
    { id: 2, name: 'Cá hồi áp chảo', category: 'Món chính', price: 245000, description: 'Cá hồi Na Uy, sốt bơ chanh, khoai tây nghiền', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80' },
    { id: 3, name: 'Trứng gà truffle', category: 'Khai vị', price: 165000, description: 'Trứng poché, kem truffle, bánh mì nướng', image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80' },
    { id: 4, name: 'Salad trái bơ', category: 'Khai vị', price: 125000, description: 'Bơ, rau mùa, phô mai sữa dê và hạt óc chó', image: 'https://images.unsplash://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80' },
    { id: 5, name: 'Tiramisu Émeraude', category: 'Tráng miệng', price: 95000, description: 'Mascarpone, cà phê espresso và cacao', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80' },
    { id: 6, name: 'Cocktail cam bạc hà', category: 'Đồ uống', price: 85000, description: 'Cam tươi, bạc hà, soda và mật ong', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80' }
];
let reservations = [{ id: 'QL-1001', customer: 'Nguyễn Minh Anh', phone: '0901234567', date: '2026-11-20', time: '19:00', guests: 4, tableId: 'A2', items: [1, 5], deposit: 300000, status: 'confirmed', createdAt: new Date().toISOString() }];
const reviews = [{ id: 1, name: 'Khách hàng', rating: 5, comment: 'Không gian đẹp, món ăn tuyệt vời và đặt bàn rất thuận tiện.' }, { id: 2, name: 'Minh Tâm', rating: 5, comment: 'Chatbot tư vấn nhanh, nhân viên rất tận tâm.' }];

app.get('/api/health', (_, r) => r.json({ ok: true, service: 'QL09-W API' }));
app.get('/api/menu', (_, r) => r.json(menu));
app.get('/api/tables', (_, r) => r.json(tables));
app.get('/api/reservations', (req, r) => r.json(reservations));
app.get('/api/reviews', (_, r) => r.json(reviews));

app.post('/api/reservations', (req, r) => {
    const { customer, phone, date, time, guests, tableId, items = [], deposit = 0 } = req.body;
    if (!customer || !phone || !date || !time || !guests) return r.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    const matching = tables.find(t => t.id === tableId);
    if (matching && guests > matching.capacity) return r.status(400).json({ error: 'Số khách vượt quá sức chứa bàn' });
    const conflict = reservations.find(x => x.date === date && x.time === time && x.tableId === tableId && x.status !== 'cancelled');
    if (conflict) return r.status(409).json({ error: 'Khung giờ này đã có người đặt' });
    const id = 'QL-' + Math.floor(1000 + Math.random() * 9000);
    const item = tables.find(t => t.id === tableId); if (item) item.status = 'reserved';
    const record = { id, customer, phone, date, time, guests, tableId: tableId || 'A1', items, deposit, status: 'confirmed', createdAt: new Date().toISOString() };
    reservations.unshift(record); r.status(201).json(record);
});
app.patch('/api/reservations/:id/status', (req, r) => { const v = reservations.find(x => x.id === req.params.id); if (!v) return r.status(404).json({ error: 'Không tìm thấy' }); v.status = req.body.status; r.json(v) });
app.post('/api/reviews', (req, r) => { const { name, rating, comment } = req.body; if (!rating || !comment) return r.status(400).json({ error: 'Thiếu đánh giá' }); const v = { id: Date.now(), name: name || 'Ẩn danh', rating: Number(rating), comment }; reviews.unshift(v); r.status(201).json(v) });

app.post('/api/chat', (req, r) => {
    const text = (req.body.message || '').toLowerCase();
    if (text.includes('đặt bàn') || text.includes('đặt chỗ')) return r.json({ reply: 'Tuyệt! Bạn muốn đặt cho bao nhiêu khách, ngày nào và khung giờ nào? Tôi có thể kiểm tra bàn trống và hỗ trợ tạo đặt chỗ ngay.', action: 'reservation' });
    if (text.includes('món') || text.includes('menu') || text.includes('ăn')) return r.json({ reply: 'Thực đơn hôm nay có bò Wagyu nướng sốt tiêu, cá hồi áp chảo, trứng gà truffle và tiramisu. Bạn thích món thịt, hải sản hay món nhẹ?', action: 'menu' });
    if (text.includes('cọc') || text.includes('thanh toán')) return r.json({ reply: 'Bạn có thể đặt cọc tối thiểu 300.000đ cho bàn tiêu chuẩn và 1.000.000đ cho tiệc/sự kiện. Cổng thanh toán demo sẽ xác nhận trạng thái đặt cọc tự động.', action: 'deposit' });
    if (text.includes('địa chỉ') || text.includes('ở đâu')) return r.json({ reply: 'Nhà hàng Émeraude tọa lạc tại 88 Lê Lợi, Quận 1, TP. Hồ Chí Minh. Giờ mở cửa: 10:00–22:30 mỗi ngày.', action: 'info' });
    return r.json({ reply: 'Tôi có thể hỗ trợ đặt bàn, tư vấn món, kiểm tra cọc và mang ý kiến đến nhà hàng. Bạn muốn bắt đầu với nhu cầu nào?', action: 'general' });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.use((req, r) => { if (req.path.startsWith('/api/')) return r.status(404).json({ error: 'API not found' }); r.sendFile(path.join(dist, 'index.html')) });
app.listen(port, () => console.log(`QL09-W API: http://localhost:${port}`));
