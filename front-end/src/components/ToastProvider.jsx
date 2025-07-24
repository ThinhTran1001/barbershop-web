import React, { useEffect } from 'react';
import { notification } from 'antd';

/**
 * ToastProvider component to configure global toast notification settings
 * Should be placed at the root level of the application
 */
const ToastProvider = ({ children }) => {
  useEffect(() => {
    // Configure global notification settings
    notification.config({
      placement: 'topRight',
      duration: 4.5,
      rtl: false,
      maxCount: 3, // Maximum number of notifications to show at once
      getContainer: () => document.body,
    });

    // Add custom CSS for better toast styling
    const style = document.createElement('style');
    style.textContent = `
      .ant-notification {
        z-index: 9999;
      }
      
      .ant-notification-notice {
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        backdrop-filter: blur(8px);
      }
      
      .ant-notification-notice-message {
        font-weight: 600;
        font-size: 15px;
        margin-bottom: 4px;
      }
      
      .ant-notification-notice-description {
        font-size: 14px;
        line-height: 1.5;
      }
      
      .ant-notification-notice-icon {
        font-size: 20px;
        margin-top: 2px;
      }
      
      /* Success notifications */
      .ant-notification-notice-success {
        background: linear-gradient(135deg, #f6ffed 0%, #f0f9e8 100%);
        border-left: 4px solid #52c41a;
      }
      
      /* Error notifications */
      .ant-notification-notice-error {
        background: linear-gradient(135deg, #fff2f0 0%, #ffebe8 100%);
        border-left: 4px solid #ff4d4f;
      }
      
      /* Warning notifications */
      .ant-notification-notice-warning {
        background: linear-gradient(135deg, #fffbe6 0%, #fff7db 100%);
        border-left: 4px solid #faad14;
      }
      
      /* Info notifications */
      .ant-notification-notice-info {
        background: linear-gradient(135deg, #e6f7ff 0%, #d6f0ff 100%);
        border-left: 4px solid #1890ff;
      }
      
      /* Hover effects */
      .ant-notification-notice:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        transform: translateY(-1px);
        transition: all 0.2s ease;
      }
      
      /* Close button styling */
      .ant-notification-notice-close {
        color: #666;
        font-size: 14px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
      }
      
      .ant-notification-notice-close:hover {
        opacity: 1;
        color: #333;
      }
      
      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .ant-notification {
          margin: 8px;
          width: calc(100vw - 16px) !important;
        }
        
        .ant-notification-notice {
          margin: 0 0 8px 0;
          max-width: none;
        }
        
        .ant-notification-notice-message {
          font-size: 14px;
        }
        
        .ant-notification-notice-description {
          font-size: 13px;
        }
      }
      
      /* Animation improvements */
      .ant-notification-fade-enter {
        animation: notificationSlideIn 0.3s ease-out;
      }
      
      .ant-notification-fade-leave {
        animation: notificationSlideOut 0.3s ease-in;
      }
      
      @keyframes notificationSlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes notificationSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      /* Loading notification specific styling */
      .ant-notification-notice-info .ant-notification-notice-icon {
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;
    
    document.head.appendChild(style);
    
    // Cleanup function
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return <>{children}</>;
};

export default ToastProvider;
