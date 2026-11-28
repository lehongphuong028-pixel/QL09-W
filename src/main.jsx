import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Menu, MapPin, Star, Users, CalendarDays, Clock, MessageCircle, X, Send, ChevronRight, ShoppingBag, Check, Minus, Plus } from 'lucide-react';
import './styles.css';

function App() {
    const [menu, setMenu] = useState([]), [tables, setTables] = useState([]), [reservations, setReservations] = useState([]), [reviews, setReviews] = useState([]);
    const [page, setPage] = useState('home'), [cart, setCart] = useState([]), [chatOpen, setChatOpen] = useState(false), [mobileMenuOpen, setMobileMenuOpen] = useState(false), [messages, setMessages] = useState([{ role: 'bot', text: 'Xin chào! Tôi là trợ lý Émeraude. Tôi có thể tư vấn món, tìm bàn trống và hỗ trợ đặt hoặc thay đổi đặt chỗ.' }]), [chatText, setChatText] = useState(''), [chatChoices, setChatChoices] = useState(['Gợi ý món cho hai người', 'Đặt bàn tối nay', 'Món hải sản', 'Tiệc 10 người']);
    const [form, setForm] = useState({ customer: '', phone: '', date: '2026-11-28', time: '19:00', guests: 2, tableId: 'A1', deposit: 300000 });
    const [heroIndex, setHeroIndex] = useState(0);
    const heroImages = [
        { src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85', title: 'Không gian sang trọng' },
        { src: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=85', title: 'Bữa tối trọn vẹn' },
        { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85', title: 'Ẩm thực tinh tế' },
        { src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85', title: 'Trải nghiệm Émeraude' }
    ];

    const refreshLive = async () => {
        const [m, t, r, v] = await Promise.all(['/api/menu', '/api/tables', '/api/reservations', '/api/reviews'].map(u => fetch(u).then(x => x.json())));
        setMenu(m); setTables(t); setReservations(r); setReviews(v);
    };
    useEffect(() => {
        refreshLive();
        const heroTimer = setInterval(() => setHeroIndex(i => (i + 1) % heroImages.length), 4500);
        const events = new EventSource('/api/events');
        events.onmessage = (event) => {
            const live = JSON.parse(event.data);
            setTables(live.tables);
            setReservations(live.reservations);
        };
        return () => { clearInterval(heroTimer); events.close(); };
    }, []);

    const add = (id) => setCart(c => { const x = c.find(i => i.id === id); return x ? c.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i) : [...c, { id, qty: 1 }] });
    const qty = (id, d) => setCart(c => c.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty));
    const total = cart.reduce((n, i) => n + (menu.find(m => m.id === i.id)?.price || 0) * i.qty, 0);
    const reserve = async (e) => { e.preventDefault(); const res = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, items: cart.map(i => i.id), deposit: Number(form.deposit) }) }); const data = await res.json(); if (!res.ok) return alert(data.error); await refreshLive(); setPage('reservations'); alert(`Đặt thành công ${data.id}!`); };

    const cancelReservation = async (id) => {
        if (!confirm('Bạn có chắc muốn hủy đặt bàn này?')) return;
        const res = await fetch(`/api/reservations/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) });
        const data = await res.json(); if (!res.ok) return alert(data.error); await refreshLive(); alert('Đã hủy đặt bàn thành công.');
    };
    const rescheduleReservation = async (record) => {
        const date = prompt('Nhập ngày mới (YYYY-MM-DD):', record.date); if (!date) return;
        const time = prompt('Nhập giờ mới:', record.time); if (!time) return;
        const tableId = prompt('Nhập mã bàn mới:', record.tableId); if (!tableId) return;
        const res = await fetch(`/api/reservations/${record.id}/reschedule`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, time, tableId: tableId.toUpperCase(), guests: record.guests }) });
        const data = await res.json(); if (!res.ok) return alert(data.error); await refreshLive(); alert('Đã đổi lịch đặt bàn thành công.');
    };

    const sendChat = async (preset) => {
        const text = (preset || chatText).trim();
        if (!text) return;
        setMessages(v => [...v, { role: 'user', text }, { role: 'bot', text: 'Đang tìm gợi ý phù hợp...', typing: true }]);
        setChatText('');
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
        const data = await res.json();
        setMessages(v => [...v.filter(m => !m.typing), { role: 'bot', text: data.reply, action: data.action }]);
        setChatChoices(data.recommendations?.length ? data.recommendations : ['Gợi ý món', 'Đặt bàn tối nay', 'Tư vấn tiệc']);
    };
    const canChangeReservation = (record) => (Date.now() - new Date(record.createdAt).getTime()) < 15 * 60 * 1000;
    const changeTimeLabel = (record) => {
        const remaining = 15 * 60 * 1000 - (Date.now() - new Date(record.createdAt).getTime());
        if (remaining <= 0) return 'Hết thời gian đổi/hủy';
        return `Còn ${Math.max(1, Math.ceil(remaining / 60000))} phút đổi/hủy`;
    };
    const nav = [['home', 'Trang chủ'], ['menu', 'Thực đơn'], ['booking', 'Đặt bàn'], ['tables', 'Sơ đồ bàn'], ['reservations', 'Quản lý'], ['reviews', 'Đánh giá']];
    const openPage = (nextPage) => {
        setPage(nextPage);
        setMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return <>
        <header><button className="brand" onClick={() => openPage('home')}><span>É</span><div><b>ÉMERAUDE</b><small>DINING</small></div></button><nav className={mobileMenuOpen ? 'mobileOpen' : ''}>{nav.map(([p, n]) => <button className={page === p ? 'active' : ''} onClick={() => openPage(p)} key={p}>{n}</button>)}</nav><div className="headerActions"><button className="cart" aria-label="Xem giỏ món" onClick={() => openPage('booking')}><ShoppingBag size={19} />{cart.length > 0 && <b>{cart.reduce((n, i) => n + i.qty, 0)}</b>}</button><button className="menuToggle" aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(v => !v)}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button></div></header>
        {page === 'home' && <main className="homePage"><section className="hero"><div className="heroCopy"><p className="eyebrow">ẨM THỰC • KHÔNG GIAN • TRẢI NGHIỆM</p><h1>Bàn riêng cho<br /><em>một buổi tối hoàn hảo</em></h1><p>Chọn vị trí yêu thích, đặt bàn trước và để Émeraude chuẩn bị chu đáo cho khoảnh khắc của bạn.</p><div className="actions"><button className="primary" onClick={() => setPage('booking')}>Đặt bàn ngay <ChevronRight size={18} /></button><button className="ghost" onClick={() => setPage('menu')}>Xem thực đơn</button></div></div><div className="heroPhoto"><img src={heroImages[heroIndex].src} /><div className="photoBadge"><Star fill="#d8b35b" size={18} /> 4.9 · 860 đánh giá</div></div></section><section className="bookingQuick"><div className="quickField"><small>Ngày</small><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div><div className="quickField"><small>Giờ</small><select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}>{['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'].map(t => <option key={t}>{t}</option>)}</select></div><div className="quickField guestField"><small>Số khách</small><div><button onClick={() => setForm({ ...form, guests: Math.max(1, form.guests - 1) })}><Minus size={15} /></button><strong>{form.guests}</strong><button onClick={() => setForm({ ...form, guests: Math.min(10, form.guests + 1) })}><Plus size={15} /></button></div></div><button className="primary quickSubmit" onClick={() => setPage('tables')}>Tìm bàn trống <ChevronRight size={18} /></button></section><section className="features"><div><Users /><h3>Đặt bàn linh hoạt</h3><p>Chọn giờ và không gian phù hợp</p></div><div><CalendarDays /><h3>Đặt món trước</h3><p>Bếp chuẩn bị đúng giờ</p></div><div><Clock /><h3>Đổi lịch dễ dàng</h3><p>Miễn phí trong 15 phút đầu</p></div></section></main>}
        {page === 'menu' && <main className="section"><p className="eyebrow">THỰC ĐƠN ĐẦU BẾP</p><h2>Món ăn được yêu thích</h2><div className="menuGrid">{menu.map(m => <article className="dish" key={m.id}><img src={m.image} /><div><small>{m.category}</small><h3>{m.name}</h3><p>{m.description}</p><div><strong>{m.price.toLocaleString('vi-VN')}đ</strong><button onClick={() => add(m.id)}>+ Thêm</button></div></div></article>)}</div></main>}
        {page === 'booking' && <main className="section"><p className="eyebrow">ĐẶT BÀN & ĐẶT MÓN</p><h2>Lên lịch cho bữa tiệc</h2><div className="bookingGrid"><form className="form" onSubmit={reserve}><h3>Thông tin đặt chỗ</h3><label>Họ và tên<input required value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} placeholder="Nguyễn Văn An" /></label><label>Số điện thoại<input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="0901 234 567" /></label><div className="split"><label>Ngày<input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label><label>Giờ<select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}>{['17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'].map(t => <option>{t}</option>)}</select></label></div><div className="split"><label>Số khách<input type="number" min="1" max="10" value={form.guests} onChange={e => setForm({ ...form, guests: +e.target.value })} /></label><label>Bàn<select value={form.tableId} onChange={e => setForm({ ...form, tableId: e.target.value })}>{tables.map(t => <option value={t.id}>{t.name} · {t.capacity} khách</option>)}</select></label></div><label>Đặt cọc<select value={form.deposit} onChange={e => setForm({ ...form, deposit: e.target.value })}><option value="300000">300.000đ — bàn tiêu chuẩn</option><option value="1000000">1.000.000đ — tiệc/sự kiện</option></select></label><button className="primary wide">Xác nhận đặt bàn</button></form><aside className="cartPanel"><h3>Món đã chọn</h3>{cart.length === 0 ? <p className="muted">Chưa có món nào. Hãy chọn món trong thực đơn.</p> : cart.map(i => { const m = menu.find(x => x.id === i.id); return m && <div className="cartItem" key={i.id}><img src={m.image} /><div><b>{m.name}</b><small>{m.price.toLocaleString('vi-VN')}đ</small></div><div className="qty"><button onClick={() => qty(i.id, -1)}><Minus size={13} /></button><span>{i.qty}</span><button onClick={() => qty(i.id, 1)}><Plus size={13} /></button></div></div> })}<div className="total"><span>Tạm tính món</span><b>{total.toLocaleString('vi-VN')}đ</b></div><div className="total"><span>Đặt cọc</span><b>{Number(form.deposit).toLocaleString('vi-VN')}đ</b></div></aside></div></main>}
        {page === 'tables' && <main className="section"><p className="eyebrow">TÌNH TRẠNG THEO THỜI GIAN THỰC</p><h2>Sơ đồ bàn nhà hàng</h2><div className="legend"><span><i className="free" />Trống</span><span><i className="reserved" />Đã đặt</span><span><i className="occupied" />Có khách</span></div><div className="floor">{tables.map(t => <button key={t.id} className={`table ${t.status}`} style={{ left: `${t.x}%`, top: `${t.y}%` }} onClick={() => setForm({ ...form, tableId: t.id })}><b>{t.name}</b><small>{t.capacity} ghế</small></button>)}</div></main>}
        {page === 'reservations' && <main className="section"><p className="eyebrow">QUẢN LÝ ĐẶT CHỖ</p><h2>Danh sách đặt bàn</h2><div className="tableWrap"><table><thead><tr><th>Mã</th><th>Khách hàng</th><th>Ngày & giờ</th><th>Khách</th><th>Bàn</th><th>Cọc</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{reservations.map(r => <tr key={r.id}><td><b>{r.id}</b></td><td>{r.customer}<small>{r.phone}</small></td><td>{r.date}<small>{r.time}</small></td><td>{r.guests}</td><td>{r.tableId}</td><td>{Number(r.deposit).toLocaleString('vi-VN')}đ</td><td><span className="status">{r.status}</span></td><td>{canChangeReservation(r) ? <><button className="link" onClick={() => rescheduleReservation(r)}>Đổi lịch</button> <button className="link danger" onClick={() => cancelReservation(r.id)}>Hủy</button><small className="changeWindow">{changeTimeLabel(r)}</small></> : <small className="changeWindow expired">Hết thời gian đổi/hủy</small>}</td></tr>)}</tbody></table></div></main>}
        {page === 'reviews' && <main className="section"><p className="eyebrow">KHÁCH HÀNG NÓI GÌ</p><h2>Đánh giá nhà hàng</h2><div className="reviews">{reviews.map(r => <article key={r.id}><div>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= r.rating ? '#d8b35b' : 'none'} color="#d8b35b" />)}</div><p>“{r.comment}”</p><b>{r.name}</b></article>)}</div></main>}
        <button className="chatFab" onClick={() => setChatOpen(v => !v)}>{chatOpen ? <X /> : <MessageCircle />}<span>Trò chuyện AI</span></button>
        {chatOpen && <aside className="chat"><div className="chatHead"><div><b>Émeraude AI</b><small><i /> Trực tuyến</small></div><button onClick={() => setChatOpen(false)}><X size={18} /></button></div><div className="chatBody">{messages.map((m, i) => <div className={`bubble ${m.role} ${m.typing ? 'typing' : ''}`} key={i}>{m.typing ? '•••' : m.text}</div>)}</div><div className="chatRecommendations">{chatChoices.map(text => <button key={text} onClick={() => sendChat(text)}>{text}</button>)}</div><div className="chatInput"><input value={chatText} onChange={e => setChatText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Nhập tin nhắn..." /><button onClick={() => sendChat()}><Send size={18} /></button></div></aside>}
    </>;
}
createRoot(document.getElementById('root')).render(<App />);
