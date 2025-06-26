import React, { useState, useRef, useEffect } from 'react';
import { Input } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import { ChevronsDown } from 'lucide-react';
import { sendChat } from '../../services/api';
import { useCart } from '../../context/CartContext'; 
import './ChatWidget.css';

const ProductCard = ({ product }) => (
  <div className="card product-card">
    <h3>{product.name}</h3>
    <p>Thương hiệu: {product.brand}</p>
    <p>Giá: ${product.price}</p>
    <p>Đánh giá: {product.rating}/5</p>
    <p>Danh mục: {product.categories.join(', ')}</p>
  </div>
);

const ServiceCard = ({ service }) => (
  <div className="card service-card">
    <h3>{service.name}</h3>
    <p>Giá: ${service.price}</p>
    <p>Thời gian: {service.duration} phút</p>
    {service.description && <p>Mô tả: {service.description}</p>}
    {service.suggestedFor && <p>Phù hợp cho: {service.suggestedFor}</p>}
  </div>
);

const BarberCard = ({ barber }) => (
  <div className="card barber-card">
    <h3>{barber.name}</h3>
    <p>Kinh nghiệm: {barber.experienceYears} năm</p>
    <p>Đánh giá: {barber.averageRating}/5</p>
    <p>Số lần đặt: {barber.totalBookings}</p>
    {barber.bio && <p>Tiểu sử: {barber.bio}</p>}
    {barber.specialties && <p>Chuyên môn: {barber.specialties}</p>}
  </div>
);

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const contentRef = useRef();
  const inputRef = useRef(null);
  const [showScroll, setShowScroll] = useState(false);
  const { addToCart } = useCart();
  const [context, setContext] = useState({ product: null, service: null, barber: null }); 

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.data) {
      setContext(prev => ({
        ...prev,
        product: lastMsg.data.products?.[0] || prev.product,
        service: lastMsg.data.services?.[0] || prev.service,
        barber: lastMsg.data.barbers?.[0] || prev.barber
      }));
    }
  }, [msgs, open]);

  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [msgs, open]);

  const onScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
    setShowScroll(!atBottom);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMsgs(m => [...m, userMsg]);
    console.log('User message added:', userMsg);
    setInput('');
    setLoading(true);
    try {
      console.log('Sending to API:', input);
      const chatHistory = msgs.map(m => ({ sender: m.sender, text: m.text })).concat(userMsg);
      const response = await sendChat(input, chatHistory); 
      console.log('API response:', response);
      const { reply = 'Không có phản hồi', data = null } = response;

      if (data?.cartItem) {
        addToCart(data.cartItem, data.cartItem.quantity);
        console.log('Added to cart:', data.cartItem);
      }

      setMsgs(m => [...m, { sender: 'bot', text: reply, data }]);
      console.log('Bot message added:', { text: reply, data });
    } catch (err) {
      console.error('Send error:', err);
      setMsgs(m => [...m, { sender: 'bot', text: '⚠️ Lỗi kết nối, vui lòng thử lại', data: null }]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  };

  if (!open) {
    return (
      <div className="chat-toggle-btn" onClick={() => setOpen(true)} title="Mở chat">
        <MessageOutlined />
      </div>
    );
  }

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">🤖</span> BarberBot
        </div>
        <div className="chat-close" onClick={() => setOpen(false)}>✕</div>
      </div>
      <div className="chat-content" ref={contentRef} onScroll={onScroll}>
        {msgs.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
            {m.text && <div className="message-text">{m.text}</div>}
            {m.data?.products && m.data.products.map((p, idx) => (
              <ProductCard key={idx} product={p} />
            ))}
            {m.data?.services && m.data.services.map((s, idx) => (
              <ServiceCard key={idx} service={s} />
            ))}
            {m.data?.barbers && m.data.barbers.map((b, idx) => (
              <BarberCard key={idx} barber={b} />
            ))}
          </div>
        ))}
      </div>
      {showScroll && (
        <div className="scroll-down-btn" onClick={scrollToBottom}>
          <ChevronsDown size={24} />
        </div>
      )}
      <div className="chat-footer">
        <Input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="Nhập câu hỏi..."
          suffix={
            <SendOutlined className={`send-icon ${loading ? 'loading' : ''}`} onClick={handleSend} />
          }
          disabled={loading}
        />
      </div>
    </div>
  );
}