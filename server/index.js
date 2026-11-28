import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const app = express(); app.use(cors()); app.use(express.json());
const port = process.env.PORT || 3001;
const CHANGE_WINDOW_MINUTES = 15;
const tables = [
    { id: 'A1', name: 'Bàn A1', zone: 'Trong nhà', capacity: 2, status: 'available', x: 18, y: 20 },
    { id: 'A2', name: 'Bàn A2', zone: 'Trong nhà', capacity: 4, status: 'occupied', x: 43, y: 20 },
    { id: 'A3', name: 'Bàn A3', zone: 'Trong nhà', capacity: 4, status: 'available', x: 68, y: 20 },
    { id: 'B1', name: 'Bàn B1', zone: 'Sân vườn', capacity: 6, status: 'available', x: 18, y: 58 },
    { id: 'B2', name: 'Bàn B2', zone: 'Sân vườn', capacity: 8, status: 'reserved', x: 43, y: 58 },
    { id: 'B3', name: 'Bàn B3', zone: 'VIP', capacity: 10, status: 'available', x: 68, y: 58 }
];
const menu = [
    { id: 1, name: 'Bò Wagyu nướng sốt tiêu', category: 'Món chính', price: 320000, description: 'Thịt Wagyu nhập khẩu, sốt tiêu xanh, rau củ nướng', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&h=600&q=85' },
    { id: 2, name: 'Cá hồi áp chảo', category: 'Món chính', price: 245000, description: 'Cá hồi Na Uy, sốt bơ chanh và rau củ nướng', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&h=600&q=85' },
    { id: 3, name: 'Trứng gà truffle', category: 'Khai vị', price: 165000, description: 'Trứng poché, kem truffle, bánh mì nướng', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&h=600&q=85' },
    { id: 4, name: 'Salad trái bơ', category: 'Khai vị', price: 125000, description: 'Bơ tươi, rau mùa, phô mai sữa dê và hạt óc chó', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&h=600&q=85' },
    { id: 5, name: 'Tiramisu Émeraude', category: 'Tráng miệng', price: 95000, description: 'Mascarpone, cà phê espresso và cacao', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&h=600&q=85' },
    { id: 6, name: 'Cocktail cam bạc hà', category: 'Đồ uống', price: 85000, description: 'Cam tươi, bạc hà, soda và mật ong', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&h=600&q=85' }
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
    reservations.unshift(record); r.status(201).json(record); broadcastLive();
});
app.patch('/api/reservations/:id/status', (req, r) => {
    const record = reservations.find(x => x.id === req.params.id);
    if (!record) return r.status(404).json({ error: 'Không tìm thấy đặt chỗ' });

    const elapsedMinutes = (Date.now() - new Date(record.createdAt).getTime()) / 60000;
    if (req.body.status === 'cancelled' && elapsedMinutes > CHANGE_WINDOW_MINUTES) {
        return r.status(403).json({ error: `Chỉ được hủy hoặc đổi trong ${CHANGE_WINDOW_MINUTES} phút sau khi đặt` });
    }

    record.status = req.body.status;
    if (req.body.status === 'cancelled') {
        const stillBooked = reservations.some(x => x.id !== record.id && x.tableId === record.tableId && x.date === record.date && x.time === record.time && x.status !== 'cancelled');
        const table = tables.find(t => t.id === record.tableId);
        if (table && !stillBooked) table.status = 'available';
    }
    r.json(record);
    broadcastLive();
});
app.patch('/api/reservations/:id/reschedule', (req, r) => {
    const record = reservations.find(x => x.id === req.params.id);
    if (!record) return r.status(404).json({ error: 'Không tìm thấy đặt chỗ' });

    const elapsedMinutes = (Date.now() - new Date(record.createdAt).getTime()) / 60000;
    if (elapsedMinutes > CHANGE_WINDOW_MINUTES) return r.status(403).json({ error: `Chỉ được hủy hoặc đổi trong ${CHANGE_WINDOW_MINUTES} phút sau khi đặt` });

    const { date, time, tableId, guests } = req.body;
    if (!date || !time || !tableId) return r.status(400).json({ error: 'Thiếu ngày, giờ hoặc bàn mới' });
    const targetTable = tables.find(t => t.id === tableId);
    if (!targetTable) return r.status(404).json({ error: 'Không tìm thấy bàn' });
    if (guests && guests > targetTable.capacity) return r.status(400).json({ error: 'Số khách vượt quá sức chứa bàn' });

    const conflict = reservations.find(x => x.id !== record.id && x.date === date && x.time === time && x.tableId === tableId && x.status !== 'cancelled');
    if (conflict) return r.status(409).json({ error: 'Bàn và khung giờ mới đang có người đặt' });

    const oldTable = tables.find(t => t.id === record.tableId);
    record.date = date; record.time = time; record.tableId = tableId; record.guests = guests || record.guests;
    record.status = 'confirmed'; record.updatedAt = new Date().toISOString();

    if (oldTable) {
        const oldStillBooked = reservations.some(x => x.id !== record.id && x.tableId === oldTable.id && x.date === record.date && x.time === record.time && x.status !== 'cancelled');
        if (!oldStillBooked) oldTable.status = 'available';
    }
    targetTable.status = 'reserved';
    r.json(record); broadcastLive();
});
app.post('/api/reviews', (req, r) => { const { name, rating, comment } = req.body; if (!rating || !comment) return r.status(400).json({ error: 'Thiếu đánh giá' }); const v = { id: Date.now(), name: name || 'Ẩn danh', rating: Number(rating), comment }; reviews.unshift(v); r.status(201).json(v) });

app.post('/api/chat', (req, r) => {
    const text = (req.body.message || '').toLowerCase();

    if (text.includes('hai người') || text.includes('2 người') || text.includes('cặp đôi')) {
        return r.json({ reply: 'Gợi ý cho hai người: cá hồi áp chảo, salad trái bơ và tiramisu Émeraude để kết bữa. Bạn muốn em đặt bàn 2 ghế và thêm món này?', action: 'recommend-couple', recommendations: ['Thêm cá hồi', 'Thêm salad & tiramisu', 'Đặt bàn 2 người'] });
    }
    if (text.includes('hải sản') || text.includes('cá hồi')) {
        return r.json({ reply: 'Món hải sản nổi bật là Cá hồi áp chảo 245.000đ, áp chảo vừa tới, sốt bơ chanh nhẹ nhàng. Em cũng gợi ý thêm trứng gà truffle làm khai vị.', action: 'menu-seafood', recommendations: ['Thêm cá hồi', 'Xem món khai vị', 'Đặt bàn'] });
    }
    if (text.includes('tiệc') || text.includes('10 người')) {
        return r.json({ reply: 'Cho tiệc khoảng 10 người, em gợi ý bàn B3 và đặt cọc 1.000.000đ. Tôi có thể hỗ trợ kiểm tra lịch và số khách trước khi xác nhận.', action: 'event', recommendations: ['Kiểm tra bàn VIP', 'Xem thời gian trống', 'Chọn thực đơn tiệc'] });
    }
    if (text.includes('đặt bàn') || text.includes('đặt chỗ') || text.includes('tối nay')) {
        return r.json({ reply: 'Tuyệt! Hiện các khung giờ 18:00–20:30 có thể đặt trực tuyến. Bạn muốn bao nhiêu khách, ngày nào và khung giờ nào?', action: 'reservation', recommendations: ['Đặt 2 người tối nay', 'Đặt 4 người lúc 19:00', 'Xem sơ đồ bàn'] });
    }
    if (text.includes('món') || text.includes('menu') || text.includes('ăn')) {
        return r.json({ reply: 'Món bán chạy nhất hôm nay: bò Wagyu nướng sốt tiêu, cá hồi áp chảo, salad trái bơ và tiramisu Émeraude. Bạn thích hương vị thịt, hải sản, thanh mát hay tráng miệng?', action: 'menu', recommendations: ['Món dành cho hai người', 'Món hải sản', 'Món tráng miệng'] });
    }
    if (text.includes('cọc') || text.includes('thanh toán')) {
        return r.json({ reply: 'Bàn tiêu chuẩn cần đặt cọc 300.000đ; tiệc/sự kiện là 1.000.000đ. Bạn chỉ được đổi hoặc hủy miễn phí trong 15 phút đầu sau khi đặt.', action: 'deposit', recommendations: ['Cách thanh toán', 'Quyền đổi/hủy', 'Đặt bàn'] });
    }
    if (text.includes('hủy') || text.includes('đổi lịch')) {
        return r.json({ reply: 'Bạn có thể đổi bàn, ngày, giờ hoặc hủy trong vòng 15 phút kể từ lúc đặt thành công. Sau thời gian này vui lòng liên hệ nhà hàng.', action: 'change', recommendations: ['Đổi lịch đặt bàn', 'Hủy đặt bàn', 'Liên hệ nhà hàng'] });
    }
    if (text.includes('địa chỉ') || text.includes('ở đâu')) {
        return r.json({ reply: 'Émeraude tại 88 Lê Lợi, Quận 1, TP. Hồ Chí Minh. Giờ mở cửa: 10:00–22:30 mỗi ngày.', action: 'info', recommendations: ['Chỉ đường', 'Giờ mở cửa', 'Đặt bàn'] });
    }
    return r.json({ reply: 'Tôi có thể tư vấn thực đơn, tìm bàn trống, tạo đặt chỗ, đặt cọc hoặc hướng dẫn đổi/hủy. Bạn đang cần gợi ý theo hương vị, số khách hay dịp nào?', action: 'general', recommendations: ['Gợi ý món', 'Đặt bàn tối nay', 'Tư vấn tiệc'] });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.use((req, r) => { if (req.path.startsWith('/api/')) return r.status(404).json({ error: 'API not found' }); r.sendFile(path.join(dist, 'index.html')) });
if (!process.env.VERCEL) {
    app.listen(port, '0.0.0.0', () => {
        console.log(`QL09-W web & API: http://localhost:${port}`);
        for (const addresses of Object.values(os.networkInterfaces())) {
            for (const address of addresses || []) {
                if (address.family === 'IPv4' && !address.internal) {
                    console.log(`LAN: http://${address.address}:${port}`);
                }
            }
        }
    });
}

export default app;

const liveClients = new Set();
const broadcastLive = () => {
    for (const client of liveClients) client.write(`data: ${JSON.stringify({ tables, reservations })}\n\n`);
};

app.get('/api/events', (req, r) => {
    r.setHeader('Content-Type', 'text/event-stream');
    r.setHeader('Cache-Control', 'no-cache');
    r.setHeader('Connection', 'keep-alive');
    r.flushHeaders();
    r.write(`data: ${JSON.stringify({ tables, reservations })}\n\n`);
    liveClients.add(r);
    req.on('close', () => liveClients.delete(r));
});
