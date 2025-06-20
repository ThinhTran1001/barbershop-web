// src/components/ChatWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Input } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
import { ChevronsDown } from 'lucide-react';
import { sendChat } from '../../services/api';
import './ChatWidget.css';

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [msgs, setMsgs]         = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const contentRef              = useRef();
  const inputRef                = useRef(null);
  const [showScroll, setShowScroll] = useState(false);

  // Khi open = true, focus vào ô input
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Sau mỗi lần msgs thay đổi (user hoặc bot), focus input
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [msgs]);

  // Tự scroll xuống dưới mỗi khi có message mới
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
    setMsgs(m => [...m, { sender: 'user', text: input }]);
    setInput('');
    setLoading(true);
    try {
      const reply = await sendChat(input);
      setMsgs(m => [...m, { sender: 'bot', text: reply }]);
    } catch {
      setMsgs(m => [...m, { sender: 'bot', text: '⚠️ Lỗi kết nối' }]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  };

  // Nút mở chat
  if (!open) {
    return (
      <div
        className="chat-toggle-btn"
        onClick={() => setOpen(true)}
        title="Mở chat"
      >
        <MessageOutlined />
      </div>
    );
  }

  return (
    <div className="chat-widget">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">🤖</span> BarberBot
        </div>
        <div className="chat-close" onClick={() => setOpen(false)}>✕</div>
      </div>

      {/* Messages */}
      <div
        className="chat-content"
        ref={contentRef}
        onScroll={onScroll}
      >
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`chat-bubble ${m.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Scroll-to-bottom */}
      {showScroll && (
        <div className="scroll-down-btn" onClick={scrollToBottom}>
          <ChevronsDown size={24} />
        </div>
      )}

      {/* Input */}
      <div className="chat-footer">
        <Input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="Nhập câu hỏi..."
          suffix={
            <SendOutlined
              className={`send-icon ${loading ? 'loading' : ''}`}
              onClick={handleSend}
            />
          }
          disabled={loading}
        />
      </div>
    </div>
  );
}
