import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import UserHeader from "../../components/Header/UserHeader.jsx";
import Footer from "../../components/Footer/Footer";

const { Content } = Layout;

const CommonLayout = () => {
  return (
    <Layout>
      <UserHeader />
      <Content style={{ height: "700px" }}>
        <Outlet />
      </Content>
      <Footer />
    </Layout>
  );
};

export default CommonLayout;
