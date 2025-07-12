import React from 'react';
import { Timeline } from 'antd';
import './About.css';

const milestones = [
  {
    year: '2018',
    event: 'Hình thành đội ngũ và phát triển phần mềm cho Spa tại Đà Nẵng.',
    image: '/src/assets/images/about5.png',
  },
  {
    year: '2019',
    event: 'Ra mắt BERGER - Phần mềm quản lý & CSKH dành cho Spa Salon.',
    image: '/src/assets/images/about6.png',
  },
  {
    year: '10/2019',
    event: 'Khai trương văn phòng BERGER - chi nhánh TP.HCM.',
    image: '/src/assets/images/about7.png',
  },
  {
    year: '03/2021',
    event: 'Khai trương văn phòng BERGER - chi nhánh Hà Nội.',
    image: '/src/assets/images/about8.png',
  },
  {
    year: '10/2021',
    event: 'Đạt 1.000 khách hàng tại 58/63 tỉnh thành Việt Nam và 4 quốc gia châu Á.',
    image: '/src/assets/images/about9.png',
  },
  {
    year: '03/2022',
    event: 'Hoàn thiện bộ giải pháp quản lý toàn diện dành cho barber Salon.',
    image: '/src/assets/images/about10.png',
  },
  {
    year: '2023',
    event: 'Đồng hành, tổ chức và tài trợ nhiều sự kiện ngành làm đẹp và Tóc toàn quốc.',
    image: '/src/assets/images/about4.png',
  },
  {
    year: '2024',
    event: '4000+ nhà kinh doanh làm đẹp sử dụng trên khắp 63 tỉnh thành Việt Nam và 4 Quốc gia.',
    image: '/src/assets/images/about11.png',
  },
];

const AboutTimeline = () => {
  return (
    <section className="about-ant-timeline">
      <div className="container">
        <h2 className="timeline-title">Lịch sử phát triển</h2>
        <Timeline
          mode="alternate"
          className="ant-custom-timeline"
          items={milestones.map((item) => ({
            children: (
              <div className="timeline-item-content">
                <h4 className="timeline-year">{item.year}</h4>
                <p>{item.event}</p>
                {item.image && (
                  <img src={item.image} alt={item.year} className="timeline-img" />
                )}
              </div>
            ),
          }))}
        />
      </div>
    </section>
  );
};

export default AboutTimeline;
