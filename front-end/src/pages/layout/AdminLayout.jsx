import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import AdminHeader from "../../components/Header/AdminHeader";
import AdminSidebar from "../../components/Sidebar/AdminSidebar";
import Footer from "../../components/Footer/Footer.jsx";
import ChatWidget from "../../components/chatbot/ChatWidget.jsx";

const { Content } = Layout;

const AdminLayout = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar />
      <Layout style={{ marginLeft: 280 }}>
        <AdminHeader />
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            minHeight: 'calc(100vh - 112px)' // Account for header and margins
          }}
        >
          <Outlet />
          <ChatWidget />
        </Content>
        <Footer style={{ marginLeft: 0, textAlign: 'center' }} />
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
