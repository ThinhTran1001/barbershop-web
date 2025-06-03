import React, { useEffect, useState } from "react";
import { Table, Button, Image, Tag, message } from "antd";
import { getProductFeedbacks, approveProductFeedback } from "../../services/api";
import "./ManageFeedbackProduct.css";

const ManageFeedbackProduct = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await getProductFeedbacks();
      setFeedbacks(res.data.data); 
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      message.error("Error loading product feedback!");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveProductFeedback(id);
      message.success("Feedback approved!");
      fetchFeedbacks();
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      message.error("Error approving feedback!");
    }
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "productId",
      render: (product) => product?.name || "Unknown",
    },
    {
      title: "Customer",
      dataIndex: "customerId",
      render: (customer) => customer?.name || "Anonymous",
    },
    {
      title: "Rating",
      dataIndex: "rating",
    },
    {
      title: "Comment",
      dataIndex: "comment",
    },
    {
      title: "Images",
      dataIndex: "images",
      render: (images) =>
        images?.map((url, idx) => (
          <Image key={idx} width={60} src={url} alt={`feedback-img-${idx}`} />
        )),
    },
    {
      title: "Status",
      dataIndex: "isApproved",
      render: (isApproved) =>
        isApproved ? <Tag color="green">Approved</Tag> : <Tag color="orange">Pending</Tag>,
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Action",
      render: (_, record) =>
        !record.isApproved && (
          <Button type="primary" onClick={() => handleApprove(record._id)}>
            Approve
          </Button>
        ),
    },
  ];

  return (
    <div className="manage-feedback-container">
      <Table
        dataSource={feedbacks}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default ManageFeedbackProduct;
