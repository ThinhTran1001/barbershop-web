const kafka = require('../config/kafka');

exports.submitContactForm = async (req, res) => {
  const { fullname, phone, email, message, time } = req.body;

  try {
    const producer = kafka.producer();
    await producer.connect();

    await producer.send({
      topic: 'contact.form.submitted',
      messages: [
        {
          value: JSON.stringify({ fullname, phone, email, message, time }),
        },
      ],
    });

    await producer.disconnect();
    res.status(200).json({ message: 'Liên hệ đã được gửi' });
  } catch (error) {
    console.error('Kafka error:', error);
    res.status(500).json({ message: 'Gửi liên hệ thất bại' });
  }
};
