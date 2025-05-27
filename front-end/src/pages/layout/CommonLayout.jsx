import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import UserHeader from "../../components/Header/UserHeader.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import HeroSection from "../../components/landing/HeroSection.jsx";

const { Content } = Layout;

const CommonLayout = () => {
  return (
    <Layout style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <UserHeader />
      <Content style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
        <div>
     
        </div>
        <div className="container" >
          <Outlet />
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default CommonLayout;
