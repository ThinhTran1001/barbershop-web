// front-end/src/components/chatbot/ChatWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Input, Avatar, notification } from 'antd';
import { MessageOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { ChevronsDown } from 'lucide-react';
import { sendChat } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useUserCart } from '../../context/UserCartContext';
import io from 'socket.io-client';
import './ChatWidget.css';

const ProductCard = ({ product }) => (
  <div className="card product-card">
    <h3>{product.name}</h3>
    <p>Thương hiệu: {product.brand}</p>
    <p>Giá: {product.price} VNĐ</p>
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
  const { addToCart, isLoggedIn } = useUserCart();
  const { user } = useAuth();
  const [context, setContext] = useState({ products: [], services: [], barbers: [] });
  const [activeChat, setActiveChat] = useState('chatbot');
  const [socket, setSocket] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    const newSocket = io('http://localhost:3000', {
      withCredentials: true,
      auth: { userId: user?.id }
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      if (user && user.id) {
        newSocket.emit("joinRoom", user.id, user.role);
        if (user.role === 'admin') {
          fetchRooms();
        } else {
          fetchMessages(user.id);
        }
      } else {
        console.error("User or user.id is undefined:", user);
      }
    });

    newSocket.on("receiveMessage", (message) => {
      setChatMessages((prev) => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] || []), message],
      }));
    });

    newSocket.on("updateRooms", (roomIds) => {
      if (user?.role === 'admin') {
        setRooms(roomIds);
      }
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      notification.error({
        message: "Lỗi kết nối",
        description: "Không thể gửi tin nhắn. Vui lòng thử lại!",
      });
    });

    return () => newSocket.close();
  }, [open, user]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.data) {
      setContext(prev => ({
        ...prev,
        products: lastMsg.data.products || prev.products,
        services: lastMsg.data.services || prev.services,
        barbers: lastMsg.data.barbers || prev.barbers,
      }));
    }
  }, [msgs, open]);

  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [msgs, chatMessages, open, selectedRoom]);

  const onScroll = () => {
    const el = contentRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
    setShowScroll(!atBottom);
  };

  const fetchMessages = async (roomId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/chat/messages?roomId=${roomId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => ({
          ...prev,
          [roomId]: data.data,
        }));
      } else {
        console.error('Fetch messages failed:', data.message);
        notification.error({
          message: "Lỗi tải tin nhắn",
          description: data.message || "Vui lòng thử lại!",
        });
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      notification.error({
        message: "Lỗi kết nối",
        description: "Không thể tải tin nhắn. Vui lòng thử lại!",
      });
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/chat/rooms`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        setRooms(data.data);
      } else {
        console.error('Fetch rooms failed:', data.message);
        notification.error({
          message: "Lỗi tải danh sách room",
          description: data.message || "Vui lòng thử lại!",
        });
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      notification.error({
        message: "Lỗi kết nối",
        description: "Không thể tải danh sách room. Vui lòng thử lại!",
      });
    }
  };

  const handleSendChatbot = async () => {
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

      if (data?.cartItems && isLoggedIn) {
        data.cartItems.forEach(item => {
          addToCart(item, item.quantity || 1, () => {
            setMsgs([...msgs, { sender: 'bot', text: reply, data }]);
            console.log('Bot message added:', { text: reply, data });
          });
        });
      } else if (data?.cartItems && !isLoggedIn) {
        console.log('Guest cart handling not implemented');
      } else {
        setMsgs(m => [...m, { sender: 'bot', text: reply, data }]);
        console.log('Bot message added:', { text: reply, data });
      }
    } catch (err) {
      console.error('Send error:', err);
      setMsgs(m => [...m, { sender: 'bot', text: '⚠️ Lỗi kết nối, vui lòng thử lại', data: null }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAdmin = () => {
    if (!input.trim() || !user?.id || (user?.role === 'admin' && !selectedRoom)) return;
    if (!socket) {
      console.error("Socket connection not available");
      notification.error({
        message: "Lỗi kết nối",
        description: "Không thể kết nối tới server. Vui lòng thử lại!",
      });
      return;
    }
    const roomId = user?.role === 'admin' ? selectedRoom : user.id;
    const message = {
      roomId,
      senderId: user.id,
      text: input,
      senderRole: user.role === 'admin' ? 'admin' : 'user',
    };
    console.log("Sending message:", message);
    socket.emit("sendMessage", message, (response) => {
      if (response.error) {
        console.error("Emit error:", response.error);
        notification.error({
          message: "Gửi tin nhắn thất bại",
          description: response.error,
        });
      }
    });
    setInput('');
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
          <span className="chat-icon">🤖</span> BarberChat
        </div>
        <div className="chat-close" onClick={() => setOpen(false)}>✕</div>
      </div>
      <div className="chat-main">
        <div className="chat-sidebar">
          {user?.role === 'admin' && (
            rooms.map((room) => (
              <div
                key={room}
                className={`sidebar-item ${selectedRoom === room ? 'active' : ''}`}
                onClick={() => {
                  setSelectedRoom(room);
                  fetchMessages(room);
                }}
              >
                <span>Room: {room}</span>
              </div>
            ))
          )}
          {user?.role !== 'admin' && (
            <>
              <div
                className={`sidebar-item ${activeChat === 'chatbot' ? 'active' : ''}`}
                onClick={() => {
                  setActiveChat('chatbot');
                  setSelectedRoom(null);
                }}
              >
                <span>Chatbot AI</span>
              </div>
              <div
                className={`sidebar-item ${activeChat === 'admin' ? 'active' : ''}`}
                onClick={() => {
                  setActiveChat('admin');
                  fetchMessages(user.id);
                }}
              >
                <span>Chat với Admin</span>
              </div>
            </>
          )}
        </div>
        <div className="chat-content-wrapper">
          <div className="chat-content" ref={contentRef} onScroll={onScroll}>
            {activeChat === 'chatbot' && user?.role !== 'admin' && msgs.map((m, i) => (
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
            {activeChat === 'admin' && user?.role !== 'admin' && chatMessages[user?.id]?.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.senderRole === 'user' ? 'user-bubble' : 'admin-bubble'}`}>
                <div className="message-text">{m.text}</div>
              </div>
            ))}
            {user?.role === 'admin' && selectedRoom && chatMessages[selectedRoom]?.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.senderRole === 'user' ? 'user-bubble' : 'admin-bubble'}`}>
                <div className="message-text">{m.text}</div>
              </div>
            ))}
            {user?.role === 'admin' && !selectedRoom && (
              <div className="chat-placeholder">
                <p>Chọn room để bắt đầu chat</p>
              </div>
            )}
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
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={() => activeChat === 'chatbot' ? handleSendChatbot() : handleSendAdmin()}
              placeholder={activeChat === 'chatbot' ? 'Nhập câu hỏi...' : 'Nhập tin nhắn...'}
              suffix={
                <SendOutlined
                  className={`send-icon ${loading ? 'loading' : ''}`}
                  onClick={() => activeChat === 'chatbot' ? handleSendChatbot() : handleSendAdmin()}
                  disabled={loading || (user?.role === 'admin' && !selectedRoom)}
                />
              }
              disabled={loading || (user?.role === 'admin' && !selectedRoom)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}