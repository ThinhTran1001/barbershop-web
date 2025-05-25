import {Form, Input, Select, Button} from "antd";
import {useNavigate} from "react-router-dom";
import {useAuth} from '../../context/AuthContext.jsx';

const LoginForm = () => {
  const {login} = useAuth();
  const navigate = useNavigate();

  const onFinish = ({username, role}) => {
    login({name: username, role});

    if (role === "admin") navigate("/admin");
    else if (role === "barber") navigate("/barber");
    else navigate("/");
  };

  return (
    <Form layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="Username"
        name="username"
        rules={[{required: true, message: "Please input your username"}]}
      >
        <Input placeholder="Enter your username"/>
      </Form.Item>
      <Form.Item
        label="Password"
        name="password"
        rules={[{required: true, message: "Please input your password"}]}
      >
        <Input.Password placeholder="Enter your password"/>
      </Form.Item>
      <Form.Item className="mt-3">
        <Button className="bg-warning" htmlType="submit" block>
          Log In
        </Button>
      </Form.Item>
    </Form>
  );
};

export default LoginForm;
