import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import AdminHeader from "../../components/Header/AdminHeader";
import Footer from "../../components/footer/Footer.jsx";

const { Content } = Layout;

const AdminLayout = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminHeader />
      <Content className="p-4 bg-light">
        <Outlet />
      </Content>
      <Footer/>
    </Layout>
  );
};

export default AdminLayout;
