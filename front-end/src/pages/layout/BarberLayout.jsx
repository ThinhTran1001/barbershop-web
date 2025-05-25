import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import BarberHeader from "../../components/Header/BarberHeader";
import Footer from "../../components/footer/Footer.jsx";

const { Content } = Layout;

const BarberLayout = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <BarberHeader />
      <Content className="p-4 bg-light">
        <Outlet />
      </Content>
      <Footer />
    </Layout>
  );
};

export default BarberLayout;
