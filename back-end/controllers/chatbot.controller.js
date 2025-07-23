const Product = require('../models/product.model');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const Service = require('../models/service.model');
const Barber = require('../models/barber.model');
const User = require('../models/user.model');
const Cart = require('../models/cart.model');
const Booking = require('../models/booking.model');
const BarberSchedule = require('../models/barber-schedule.model');
const gemini = require('../services/gemini.service');
const NodeCache = require('node-cache');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { createBookingFromBot } = require('./booking.controller');

const cache = new NodeCache({ stdTTL: 3600 });

const createCartItem = (product, quantity = 1) => {
  return {
    id: product._id,
    name: product.name,
    price: product.price,
    discount: product.discount || 0,
    image: product.image || '',
    stock: product.stock || 10,
    quantity: quantity
  };
};

async function analyzeIntent(message, chatHistory = []) {
  const historyText = chatHistory.map(m => `${m.sender}: ${m.text}`).join('\n');
  const currentState = chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sender === 'Assistant'
    ? chatHistory[chatHistory.length - 1].text.match(/Trạng thái: (\w+)/)?.[1] || 'start'
    : 'start';
  const prompt = `
Bạn là một trợ lý AI thông minh, chuyên cung cấp thông tin trang trọng, lịch sự và thân thiện cho khách hàng tại BerGer Barbershop. Phân tích câu hỏi sau dựa trên ngữ cảnh từ lịch sử cuộc trò chuyện và trả về JSON chứa:
- intent: Ý định của người dùng (ví dụ: "get_product_list", "get_service_list", "get_barber_list", "add_to_cart", "book_appointment", "get_barber_bookings", "general"). Nếu câu hỏi là "xác nhận", "đồng ý", hoặc các biến thể gần đúng (như "xác nhan") và trạng thái hiện tại là "confirm_booking", giữ intent là "book_appointment".
- entities: Các thực thể trong câu hỏi (ví dụ: {"name": ["Sáp vuốt tóc Gatsby Moving Rubber"], "service": ["Cắt tóc nam"], "barber": ["Lê Quang Vinh"], "quantity": 5, "date": "2025-07-22", "time": "14:30", "customerName": "Nguyễn Văn A", "customerEmail": "a@example.com", "customerPhone": "0123456789"}, có thể rỗng nếu không có). Nếu có nhiều thực thể, trả về mảng trong "name", "service", hoặc "barber". Nếu trạng thái là "confirm_booking" và không có thực thể mới, giữ nguyên thực thể từ lịch sử.
- state: Trạng thái hiện tại của cuộc trò chuyện (start, select_service, select_barber, select_time, collect_customer_info, confirm_booking) dựa trên lịch sử và câu hỏi. Nếu người dùng yêu cầu "xác nhận", "đồng ý", "xác nhân", hoặc các biến thể gần đúng (ví dụ: "xác nhan") và trạng thái hiện tại là "confirm_booking", giữ state là "confirm_booking". Nếu người dùng yêu cầu "sửa" hoặc "thay đổi", quay lại state trước đó dựa trên lịch sử.

Câu hỏi: "${message}"
Lịch sử cuộc trò chuyện:\n${historyText || 'Không có lịch sử'}
Trạng thái hiện tại: ${currentState}

Lưu ý quan trọng:
- Nếu người dùng nói "sản phẩm này", "dịch vụ này", hoặc "thợ này" mà không rõ ràng, hãy tham chiếu đến danh sách sản phẩm/dịch vụ/thợ gần nhất từ lịch sử.
- Nếu yêu cầu "thêm 5 sản phẩm này vào giỏ hàng", hãy hiểu "5" là số lượng sản phẩm (khác nhau) muốn thêm, và mặc định mỗi sản phẩm có quantity là 1, trừ khi có chỉ định rõ ràng như "thêm 5 sản phẩm này với mỗi sản phẩm 5 cái".
- Nếu yêu cầu đặt lịch (book_appointment), xác định các thông tin như service, barber, date, time, customerName, customerEmail, customerPhone từ câu hỏi hoặc lịch sử, và gợi ý state tiếp theo dựa trên thông tin đã có.
- Nếu yêu cầu xem lịch booking của barber (get_barber_bookings), xác định barber và giữ state là "start".
- Không sử dụng dấu * để đánh dấu danh sách. Thay vào đó, sử dụng dấu ✦ kèm xuống dòng (\n✦ ) để định dạng danh sách rõ ràng, chỉ đặt ✦ trước phần tử chính, các thuộc tính con không cần ✦ mà chỉ thụt đầu dòng.
- Trả lời bằng giọng điệu trang trọng, lịch sự, thân thiện, dễ hiểu và trực quan.

Ví dụ đầu ra:
{
  "intent": "book_appointment",
  "entities": {
    "service": ["Cắt tóc nam"],
    "state": "select_barber"
  }
}
`;
  try {
    console.log('Analyzing intent for message:', message, 'with history:', historyText);
    const raw = await gemini.generate({ prompt });
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonText = fence ? fence[1].trim() : raw.trim();
    const result = JSON.parse(jsonText);
    console.log('Intent analyzed:', result);
    return result;
  } catch (e) {
    console.error('Intent analysis error:', e);
    return { intent: 'general', entities: {}, state: 'start' };
  }
}

async function callFunction(fnName, entities, req, chatHistory = [], userMessage, state) {
  console.log('Calling function:', fnName, 'with entities:', entities, 'userMessage:', userMessage, 'state:', state);
  switch (fnName) {
    case 'get_product_list': {
      const query = { isActive: true };
      if (entities.name) {
        query.name = { $in: entities.name.map(name => new RegExp(name.replace(/BC Bonacure/i, 'BC ?Bonacure?').replace(/\s+/g, '\\s*'), 'i')) };
      }
      if (entities.brand) {
        const cacheKey = `brand_${entities.brand}`;
        let brands = cache.get(cacheKey);
        if (!brands) {
          brands = await Brand.find({ name: new RegExp(entities.brand, 'i') }).select('_id');
          if (brands.length > 0) cache.set(cacheKey, brands.map(b => b._id));
        }
        if (brands.length > 0) {
          query['details.brandId'] = { $in: brands.map(b => b._id) };
        } else {
          return { error: `Không tìm thấy thương hiệu "${entities.brand}" tại BerGer Barbershop.` };
        }
      }
      if (entities.category) {
        const cacheKey = `category_${entities.category}`;
        let categories = cache.get(cacheKey);
        if (!categories) {
          categories = await Category.find({ name: new RegExp(entities.category, 'i') }).select('_id');
          if (categories.length > 0) cache.set(cacheKey, categories.map(c => c._id));
        }
        if (categories.length > 0) {
          query.categoryId = { $in: categories.map(c => c._id) };
        } else {
          return { error: `Không tìm thấy danh mục "${entities.category}" tại BerGer Barbershop.` };
        }
      }
      if (entities.priceMin !== undefined || entities.priceMax !== undefined) {
        query.price = {};
        if (entities.priceMin !== undefined) query.price.$gte = Number(entities.priceMin);
        if (entities.priceMax !== undefined) query.price.$lte = Number(entities.priceMax);
      }
      if (entities.minRating !== undefined || entities.maxRating !== undefined) {
        query.rating = {};
        if (entities.minRating !== undefined) query.rating.$gte = Number(entities.minRating);
        if (entities.maxRating !== undefined) query.rating.$lte = Number(entities.maxRating);
      }

      console.log('Query:', query);
      const prods = await Product.aggregate([
        { $match: query },
        { $sample: { size: 5 } },
        {
          $lookup: {
            from: 'brands',
            localField: 'details.brandId',
            foreignField: '_id',
            as: 'brandDetails'
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categoryDetails'
          }
        },
        {
          $project: {
            name: 1,
            price: 1,
            rating: 1,
            'brandDetails.name': 1,
            'categoryDetails.name': 1
          }
        }
      ]);

      if (!prods.length) {
        return { error: 'Không tìm thấy sản phẩm phù hợp tại BerGer Barbershop.' };
      }

      return {
        data: {
          products: prods.map(p => ({
            name: p.name,
            price: p.price,
            brand: p.brandDetails.length > 0 ? p.brandDetails[0].name : 'Unknown',
            categories: p.categoryDetails.map(c => c.name),
            rating: p.rating || 0,
          })),
          total: await Product.countDocuments(query),
        },
      };
    }
    case 'get_service_list': {
      const query = { isActive: true };
      if (entities.service) {
        query.name = { $in: entities.service.map(s => new RegExp(s, 'i')) };
      }
      if (entities.servicePriceMin !== undefined || entities.servicePriceMax !== undefined) {
        query.price = {};
        if (entities.servicePriceMin !== undefined) query.price.$gte = Number(entities.servicePriceMin);
        if (entities.servicePriceMax !== undefined) query.price.$lte = Number(entities.servicePriceMax);
      }
      if (entities.suggestedFor) {
        query.suggestedFor = { $in: [entities.suggestedFor] };
      }

      const services = await Service.find(query).limit(5);
      if (!services.length) {
        return { error: 'Không tìm thấy dịch vụ phù hợp tại BerGer Barbershop.' };
      }

      return {
        data: {
          services: services.map(s => ({
            name: s.name,
            description: s.description,
            price: s.price,
            duration: s.durationMinutes,
            suggestedFor: s.suggestedFor.join(', '),
          })),
          total: await Service.countDocuments(query),
        },
      };
    }
    case 'get_barber_list': {
      const query = { isAvailable: true };
      if (entities.barber) {
        const users = await User.find({ name: { $in: entities.barber.map(b => new RegExp(b, 'i')) } }).select('_id');
        if (users.length > 0) {
          query.userId = { $in: users.map(u => u._id) };
        } else {
          return { error: `Không tìm thấy thợ nào trong danh sách "${entities.barber.join(', ')}" tại BerGer Barbershop.` };
        }
      }
      if (entities.experienceYears) {
        query.experienceYears = { $gte: Number(entities.experienceYears) };
      }
      if (entities.barberRatingMin !== undefined || entities.barberRatingMax !== undefined) {
        query.averageRating = {};
        if (entities.barberRatingMin !== undefined) query.averageRating.$gte = Number(entities.barberRatingMin);
        if (entities.barberRatingMax !== undefined) query.averageRating.$lte = Number(entities.barberRatingMax);
      }

      const barbers = await Barber.find(query).limit(5).populate('userId', 'name');
      if (!barbers.length) {
        return { error: 'Không tìm thấy thợ phù hợp tại BerGer Barbershop.' };
      }

      return {
        data: {
          barbers: barbers.map(b => ({
            name: b.userId.name,
            bio: b.bio,
            experienceYears: b.experienceYears,
            specialties: b.specialties.join(', '),
            averageRating: b.averageRating,
            totalBookings: b.totalBookings,
          })),
          total: await Barber.countDocuments(query),
        },
      };
    }
    case 'add_to_cart': {
      const names = Array.isArray(entities.name) ? entities.name : [entities.name].filter(Boolean);
      if (!names.length) {
        return { error: 'Vui lòng cung cấp tên sản phẩm để thêm vào giỏ hàng.' };
      }

      if (names.length > 5) {
        return { error: 'Chỉ có thể thêm tối đa 5 sản phẩm cùng lúc.' };
      }

      const quantity = Math.max(1, Number(entities.quantity) || 1);
      const cartItems = [];
      const errors = [];
      const productNames = [];

      let userId = req.userId;
      if (!userId) {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
          token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.accessToken) {
          token = req.cookies.accessToken;
        }

        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id;
          } catch (err) {
            console.error('Token không hợp lệ:', err.message);
            errors.push('Token không hợp lệ, vui lòng đăng nhập lại.');
          }
        }
      }

      for (const name of names) {
        const product = await Product.findOne({ name: new RegExp(name, 'i'), isActive: true }).lean();
        if (!product) {
          errors.push(`Không tìm thấy sản phẩm "${name}" tại BerGer Barbershop.`);
          continue;
        }

        if (quantity > product.stock) {
          errors.push(`Số lượng không hợp lệ. "${name}" chỉ có ${product.stock} sản phẩm trong kho.`);
          continue;
        }

        productNames.push(product.name);

        if (userId) {
          try {
            let cart = await Cart.findOne({ userId });
            if (!cart) {
              cart = await Cart.create({ userId, items: [] });
            }

            const existingItem = cart.items.find(item => item.productId.toString() === product._id.toString());
            if (existingItem) {
              await Cart.updateOne(
                { userId, 'items.productId': product._id },
                { $inc: { 'items.$.quantity': quantity } }
              );
            } else {
              await Cart.findOneAndUpdate(
                { userId },
                { $push: { items: { productId: product._id, quantity } } },
                { new: true }
              );
            }
          } catch (err) {
            console.error(`Không thể thêm "${name}" vào giỏ hàng cho người dùng ${userId}:`, err);
            errors.push(`Không thể thêm "${name}" vào giỏ hàng. Vui lòng thử lại.`);
            continue;
          }
        } else {
          const cartItem = createCartItem(product, quantity);
          cartItems.push(cartItem);
        }
      }

      if (errors.length > 0 && productNames.length === 0) {
        return { error: errors.join('\n') };
      }

      return {
        success: true,
        productNames,
        data: userId ? null : { cartItems },
        errors: errors.length > 0 ? errors : undefined
      };
    }
    case 'book_appointment': {

      let userId = req.userId;
        if (!userId) {
          let token;
          if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
          } else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
          }

          if (token) {
            try {
              const decoded = jwt.verify(token, process.env.JWT_SECRET);
              userId = decoded.id;
            } catch (err) {
              console.error('Token không hợp lệ:', err.message);
              return { error: 'Vui lòng đăng nhập để đặt lịch.' };
            }
          } else {
            return { error: 'Vui lòng đăng nhập để đặt lịch.' };
          }
        }

      // Tổng hợp thông tin từ chatHistory và ưu tiên entities mới nhất
      let bookingData = {};
      chatHistory.forEach(entry => {
        if (entry.sender === 'user') {
          const text = entry.text.toLowerCase();
          // Trích xuất service
          if (!bookingData.service && (text.includes('nhuộm tóc') || text.includes('cắt tóc') || text.includes('uốn tóc'))) {
            if (text.includes('nhuộm tóc')) bookingData.service = 'Nhuộm tóc';
            else if (text.includes('cắt tóc')) bookingData.service = 'Cắt tóc nam';
            else if (text.includes('uốn tóc')) bookingData.service = 'Uốn tóc';
          }
          // Trích xuất barber
          if (!bookingData.barber && (text.includes('lê quang vinh') || text.includes('phạm thành đạt') || text.includes('ngô minh nhật') || text.includes('đỗ quốc hùng') || text.includes('hồ tấn phát'))) {
            if (text.includes('lê quang vinh')) bookingData.barber = 'Lê Quang Vinh';
            else if (text.includes('phạm thành đạt')) bookingData.barber = 'Phạm Thành Đạt';
            else if (text.includes('ngô minh nhật')) bookingData.barber = 'Ngô Minh Nhật';
            else if (text.includes('đỗ quốc hùng')) bookingData.barber = 'Đỗ Quốc Hùng';
            else if (text.includes('hồ tấn phát')) bookingData.barber = 'Hồ Tấn Phát';
          }
          // Trích xuất date và time
          const dateTimeMatch = text.match(/(\d{4}-\d{2}-\d{2})\s*(\d{2}:\d{2})/);
          if (dateTimeMatch && !bookingData.date) {
            bookingData.date = dateTimeMatch[1];
            bookingData.time = dateTimeMatch[2];
          }
          // Trích xuất thông tin khách hàng
          const [name, email, phone] = text.split(',').map(s => s.trim());
          if (name && !bookingData.customerName) bookingData.customerName = name;
          if (email && !bookingData.customerEmail && email.includes('@')) bookingData.customerEmail = email;
          if (phone && !bookingData.customerPhone && phone.match(/0\d{9,10}/)) bookingData.customerPhone = phone;
        }
      });

      // Ghi đè bookingData bằng entities mới nhất, ưu tiên khi state là confirm_booking
      const { service, barber, date, time, customerName, customerEmail, customerPhone } = entities;
      if (service && service.length > 0) bookingData.service = service[0]; // Ưu tiên entities
      if (barber && barber.length > 0) bookingData.barber = barber[0];
      if (date) bookingData.date = date;
      if (time) bookingData.time = time;
      if (customerName) bookingData.customerName = customerName; // Ưu tiên entities cho customerName
      if (customerEmail) bookingData.customerEmail = customerEmail;
      if (customerPhone) bookingData.customerPhone = customerPhone;

      // Dùng chatHistory làm fallback nếu entities thiếu
      if (!bookingData.service && chatHistory.length > 0) {
        const lastUserMsg = chatHistory.filter(e => e.sender === 'user').pop();
        if (lastUserMsg) {
          const text = lastUserMsg.text.toLowerCase();
          if (text.includes('nhuộm tóc')) bookingData.service = 'Nhuộm tóc';
          else if (text.includes('cắt tóc')) bookingData.service = 'Cắt tóc nam';
          else if (text.includes('uốn tóc')) bookingData.service = 'Uốn tóc';
        }
      }
      if (!bookingData.barber && chatHistory.length > 0) {
        const lastUserMsg = chatHistory.filter(e => e.sender === 'user').pop();
        if (lastUserMsg) {
          const text = lastUserMsg.text.toLowerCase();
          if (text.includes('lê quang vinh')) bookingData.barber = 'Lê Quang Vinh';
          else if (text.includes('phạm thành đạt')) bookingData.barber = 'Phạm Thành Đạt';
          else if (text.includes('ngô minh nhật')) bookingData.barber = 'Ngô Minh Nhật';
          else if (text.includes('đỗ quốc hùng')) bookingData.barber = 'Đỗ Quốc Hùng';
          else if (text.includes('hồ tấn phát')) bookingData.barber = 'Hồ Tấn Phát';
        }
      }
      if (!bookingData.date || !bookingData.time) {
        const lastUserMsg = chatHistory.filter(e => e.sender === 'user').pop();
        if (lastUserMsg) {
          const dateTimeMatch = lastUserMsg.text.match(/(\d{4}-\d{2}-\d{2})\s*(\d{2}:\d{2})/);
          if (dateTimeMatch) {
            bookingData.date = dateTimeMatch[1];
            bookingData.time = dateTimeMatch[2];
          }
        }
      }
      if (!bookingData.customerName || !bookingData.customerEmail || !bookingData.customerPhone) {
        const lastUserMsg = chatHistory.filter(e => e.sender === 'user').pop();
        if (lastUserMsg) {
          const [name, email, phone] = lastUserMsg.text.split(',').map(s => s.trim());
          if (name) bookingData.customerName = name;
          if (email && email.includes('@')) bookingData.customerEmail = email;
          if (phone && phone.match(/0\d{9,10}/)) bookingData.customerPhone = phone;
        }
      }

      console.log('Booking Data:', bookingData);

      // Xử lý xác nhận hoặc sửa trước khi kiểm tra trạng thái
      if (state === 'confirm_booking' && userMessage.toLowerCase().includes('sửa')) {
        return {
          data: {
            state: 'select_service',
            prompt: 'Vui lòng chọn lại dịch vụ bạn muốn đặt (ví dụ: Cắt tóc nam, Uốn tóc).'
          }
        };
      }

      // Xử lý xác nhận
      if (state === 'confirm_booking' && (
        userMessage.toLowerCase().includes('đồng ý') ||
        userMessage.toLowerCase().includes('xác nhận') ||
        userMessage.toLowerCase().includes('xác nhan') ||
        userMessage.toLowerCase().includes('xác nhân')
      )) {

        // Chuyển đổi barber và service sang ObjectId
        const barberUser = await User.findOne({ name: new RegExp(bookingData.barber, 'i') });
        if (!barberUser) return { error: `Không tìm thấy thợ "${bookingData.barber}".` };
        const barberDoc = await Barber.findOne({ userId: barberUser._id });
        if (!barberDoc) return { error: `Thợ "${bookingData.barber}" hiện không khả dụng.` };

        const serviceDoc = await Service.findOne({ name: new RegExp(bookingData.service, 'i') });
        if (!serviceDoc) return { error: `Không tìm thấy dịch vụ "${bookingData.service}".` };

        // Kiểm tra xung đột thời gian
        const existingBookings = await Booking.find({
          barberId: barberDoc._id,
          bookingDate: {
            $gte: new Date(`${bookingData.date}T00:00:00.000Z`),
            $lt: new Date(`${bookingData.date}T23:59:59.999Z`)
          },
          status: { $in: ['pending', 'confirmed'] }
        });
        const newStart = new Date(`${bookingData.date}T${bookingData.time}:00.000Z`);
        const newEnd = new Date(newStart.getTime() + serviceDoc.durationMinutes * 60000);
        const hasConflict = existingBookings.some(b => {
          const existingStart = new Date(b.bookingDate);
          const existingEnd = new Date(existingStart.getTime() + b.durationMinutes * 60000);
          return newStart < existingEnd && newEnd > existingStart;
        });
        if (hasConflict) return { error: `Khung giờ ${bookingData.time} ngày ${bookingData.date} đã bị trùng với booking khác.` };

        // Gọi hàm createBooking
        const payload = {
          barberId: barberDoc._id,
          serviceId: serviceDoc._id,
          bookingDate: newStart.toISOString(),
          timeSlot: bookingData.time,
          durationMinutes: serviceDoc.durationMinutes,
          note: '',
          notificationMethods: ['email', 'sms'],
          autoAssignedBarber: false,
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone
        };

        try {
          console.log('Calling createBooking with payload:', payload);
          const response = await createBookingFromBot(payload, userId); 
          console.log('createBooking response:', response);
          if (response.statusCode === 201) {
            const booking = response.booking;
            return {
              success: true,
              data: {
                booking: {
                  id: booking._id,
                  service: bookingData.service,
                  barber: bookingData.barber,
                  date: bookingData.date,
                  time: bookingData.time,
                  customerName: bookingData.customerName,
                  customerEmail: bookingData.customerEmail,
                  customerPhone: bookingData.customerPhone
                }
              }
            };
          } else {
            return { error: response.message || 'Không thể tạo booking. Vui lòng thử lại sau.' };
          }
        } catch (err) {
          console.error('Lỗi khi gọi createBooking:', err.message);
          return { error: 'Không thể tạo booking. Vui lòng thử lại sau.' };
        }
      }

      // Xác định trạng thái tiếp theo
      if (!bookingData.service) {
        return {
          data: {
            state: 'select_service',
            prompt: 'Vui lòng chọn dịch vụ bạn muốn đặt (ví dụ: Cắt tóc nam, Uốn tóc).'
          }
        };
      }
      if (!bookingData.barber) {
        const availableBarbers = await Barber.find({ isAvailable: true }).populate('userId', 'name');
        return {
          data: {
            state: 'select_barber',
            prompt: 'Vui lòng chọn thợ bạn muốn đặt lịch:\n' +
              availableBarbers.map(b => `✦ ${b.userId.name}`).join('\n') +
              '\nHoặc nhắn "tự chọn" để hệ thống tự gán thợ phù hợp.'
          }
        };
      }
      if (!bookingData.date || !bookingData.time) {
        const barberId = (await User.findOne({ name: new RegExp(bookingData.barber, 'i') }).select('_id'))._id;
        const barberSchedule = await BarberSchedule.getAvailableSlots(barberId, new Date().toISOString().split('T')[0]);
        const availableSlots = barberSchedule.available ? barberSchedule.slots.map(s => s.time) : [];
        return {
          data: {
            state: 'select_time',
            prompt: `Vui lòng chọn khung giờ bạn muốn đặt lịch:\n${availableSlots.map(t => `✦ ${t}`).join('\n')}\nHoặc nhập ngày và giờ (ví dụ: 2025-07-21 14:30).`
          }
        };
      }
      if (!bookingData.customerName || !bookingData.customerEmail || !bookingData.customerPhone) {
        return {
          data: {
            state: 'collect_customer_info',
            prompt: 'Vui lòng cung cấp thông tin của bạn:\n- Tên\n- Email\n- Số điện thoại\n(Ví dụ: Lê Văn Giang, giangdeptrai@gmail.com, 0966470396)'
          }
        };
      }
      if (bookingData.service && bookingData.barber && bookingData.date && bookingData.time && bookingData.customerName && bookingData.customerEmail && bookingData.customerPhone) {
        return {
          data: {
            state: 'confirm_booking',
            prompt: `Kính chào bạn! Đây là thông tin đặt lịch của bạn:\n✦ Dịch vụ: ${bookingData.service}\n✦ Thợ: ${bookingData.barber}\n✦ Ngày: ${bookingData.date}\n✦ Giờ: ${bookingData.time}\n✦ Tên: ${bookingData.customerName}\n✦ Email: ${bookingData.customerEmail}\n✦ Số điện thoại: ${bookingData.customerPhone}\nVui lòng xác nhận bằng cách nhắn "đồng ý" hoặc "xác nhận", hoặc nhắn "sửa" để chỉnh sửa.`
          }
        };
      }

      return { error: 'Yêu cầu không hợp lệ. Vui lòng thử lại.' };
    }
    case 'get_barber_bookings': {
      if (!entities.barber || !Array.isArray(entities.barber) || entities.barber.length === 0) {
        return { error: 'Vui lòng cung cấp tên thợ để xem lịch booking.' };
      }

      const user = await User.findOne({ name: new RegExp(entities.barber[0], 'i') }).select('_id');
      if (!user) {
        return { error: `Không tìm thấy thợ "${entities.barber[0]}" tại BerGer Barbershop.` };
      }

      const barber = await Barber.findOne({ userId: user._id, isAvailable: true });
      if (!barber) {
        return { error: `Thợ "${entities.barber[0]}" hiện không khả dụng.` };
      }

      const bookings = await Booking.find({
        barberId: barber._id,
        status: { $in: ['pending', 'confirmed'] },
        bookingDate: { $gte: new Date() }
      })
        .populate('serviceId', 'name')
        .populate('customerId', 'name')
        .sort({ bookingDate: 1 });

      if (!bookings.length) {
        return { error: `Hiện tại thợ "${entities.barber[0]}" không có lịch booking còn hiệu lực.` };
      }

      return {
        data: {
          barber: entities.barber[0],
          bookings: bookings.map(b => ({
            id: b._id,
            service: b.serviceId.name,
            customer: b.customerId.name,
            date: b.bookingDate.toISOString().split('T')[0],
            time: b.bookingDate.toISOString().split('T')[1].slice(0, 5),
            status: b.status
          })),
          total: bookings.length
        }
      };
    }
    default:
      return { error: 'Yêu cầu không được hỗ trợ tại BerGer Barbershop.' };
  }
}

function generateNaturalResponse(fnName, data, userMessage, entities) {
  if (data.error) {
    if (fnName === 'book_appointment' && data.data && data.data.prompt) {
      return data.data.prompt;
    }
    return data.error;
  }

  switch (fnName) {
    case 'get_product_list': {
      const { products, total } = data.data;
      let reply = 'Kính chào bạn! Dưới đây là danh sách sản phẩm tại BerGer Barbershop:\n';
      products.forEach(p => {
        reply += '✦ ' + p.name + '\n';
        reply += '  Thương hiệu: ' + p.brand + '\n';
        reply += '  Giá: $' + p.price + '\n';
        reply += '  Đánh giá: ' + p.rating + '/5\n';
        if (p.categories.length > 0) {
          reply += '  Danh mục: ' + p.categories.join(', ') + '\n';
        }
        reply += '\n';
      });
      if (total > products.length) {
        reply += 'Hiện còn ' + (total - products.length) + ' sản phẩm khác.\n';
      }
      reply += 'Rất hân hạnh được hỗ trợ! Bạn có muốn đặt hàng trải nghiệm không?';
      return reply;
    }
    case 'get_service_list': {
      const { services, total } = data.data;
      let reply = 'Kính chào bạn! Dưới đây là danh sách dịch vụ tại BerGer Barbershop:\n';
      services.forEach(s => {
        reply += '✦ ' + s.name + '\n';
        reply += '  Giá: $' + s.price + '\n';
        reply += '  Thời gian: ' + s.duration + ' phút\n';
        if (s.description) reply += '  Mô tả: ' + s.description + '\n';
        if (s.suggestedFor) reply += '  Phù hợp cho: ' + s.suggestedFor + '\n';
        reply += '\n';
      });
      if (total > services.length) {
        reply += 'Hiện còn ' + (total - services.length) + ' dịch vụ khác. Vui lòng nhắn "xem thêm" để tiếp tục!\n';
      }
      reply += 'Rất hân hạnh được hỗ trợ! Bạn có muốn đặt lịch không?';
      return reply;
    }
    case 'get_barber_list': {
      const { barbers, total } = data.data;
      let reply = 'Kính chào bạn! Dưới đây là danh sách thợ tại BerGer Barbershop:\n';
      barbers.forEach(b => {
        reply += '✦ ' + b.name + '\n';
        reply += '  Kinh nghiệm: ' + b.experienceYears + ' năm\n';
        reply += '  Đánh giá: ' + b.averageRating + '/5\n';
        reply += '  Số lần đặt: ' + b.totalBookings + '\n';
        if (b.bio) reply += '  Tiểu sử: ' + b.bio + '\n';
        if (b.specialties) reply += '  Chuyên môn: ' + b.specialties + '\n';
        reply += '\n';
      });
      if (total > barbers.length) {
        reply += 'Hiện còn ' + (total - barbers.length) + ' thợ khác. Vui lòng nhắn "xem thêm" để tiếp tục!\n';
      }
      reply += 'Rất hân hạnh được hỗ trợ! Bạn có muốn đặt lịch với thợ nào không?';
      return reply;
    }
    case 'add_to_cart': {
      const { productNames, errors } = data;
      let reply = `Kính chào bạn! Các sản phẩm ${productNames.join(', ')} đã được thêm vào giỏ hàng của bạn với số lượng ${entities.quantity || 1} mỗi loại.`;
      if (errors && errors.length > 0) {
        reply += `\nLưu ý: ${errors.join('\n')}`;
      }
      reply += '\nBạn có muốn tiếp tục mua sắm hay thanh toán không?';
      return reply;
    }
    case 'book_appointment': {
      if (data.data && data.data.prompt) {
        return data.data.prompt;
      }
      const { booking } = data.data;
      let reply = `Kính chào bạn! Booking của bạn đã được tạo thành công:\n`;
      reply += `✦ Dịch vụ: ${booking.service}\n`;
      reply += `  Thợ: ${booking.barber}\n`;
      reply += `  Ngày: ${booking.date}\n`;
      reply += `  Giờ: ${booking.time}\n`;
      reply += `  Tên khách hàng: ${booking.customerName}\n`;
      reply += `  Email: ${booking.customerEmail}\n`;
      reply += `  Số điện thoại: ${booking.customerPhone}\n`;
      reply += 'Cảm ơn bạn đã tin tưởng và lựa chọn BerGer Barbershop! Nhân viên chúng tôi sẽ sớm liên hệ xác nhận thông tin đặt lịch của bạn. Bạn có cần hỗ trợ thêm không?';
      return reply;
    }
    case 'get_barber_bookings': {
      const { barber, bookings, total } = data.data;
      let reply = `Kính chào bạn! Dưới đây là lịch booking còn hiệu lực của thợ ${barber}:\n`;
      bookings.forEach(b => {
        reply += `✦ Booking ID: ${b.id}\n`;
        reply += `  Dịch vụ: ${b.service}\n`;
        reply += `  Khách hàng: ${b.customer}\n`;
        reply += `  Ngày: ${b.date}\n`;
        reply += `  Giờ: ${b.time}\n`;
        reply += `  Trạng thái: ${b.status === 'pending' ? 'Chờ xác nhận' : 'Đã xác nhận'}\n`;
        reply += '\n';
      });
      if (total === 0) {
        reply += `Hiện tại thợ ${barber} không có lịch booking nào còn hiệu lực.\n`;
      }
      reply += 'Rất hân hạnh được hỗ trợ! Bạn có muốn đặt lịch với thợ này không?';
      return reply;
    }
    default:
      return 'Kính chào bạn! Rất tiếc, tôi chưa hiểu rõ yêu cầu của bạn. Vui lòng thử lại hoặc liên hệ với chủ shop qua số điện thoại 0886 055 166 nhé!';
  }
}

exports.handleChatbot = async (req, res) => {
  const userMessage = req.body.message || '';
  const chatHistory = req.body.chatHistory || [];

  const knowledge = `
Bạn là một trợ lý AI thông minh, chuyên cung cấp thông tin và hỗ trợ khách hàng, hỗ trợ khách hàng thêm sản phẩm vào giỏ và thanh toán đơn hàng, đồng thời hỗ trợ khách hàng thực hiện chức năng đặt lịch cắt, chăm sóc tóc tại BerGer Barbershop.
Tên shop: BerGer/BerGer Barbershop
BerGer Barbershop – Điểm hẹn phong cách dành riêng cho phái mạnh tại Vinh, Nghệ An.
Ra đời từ năm 2016, chúng tôi tự hào mang đến trải nghiệm “Men Only” chuyên nghiệp với đội ngũ barber tay nghề cao,
phối hợp kỹ thuật cắt – tạo kiểu hiện đại và phong cách cổ điển.
Không gian lịch lãm, ấm cúng, dịch vụ cá nhân hóa theo sở thích và đặc điểm từng khách.
Cung cấp các dịch vụ cắt tóc, tạo kiểu, cạo râu, chăm sóc da mặt và sản phẩm chăm sóc tóc cao cấp.

Hotline: 0886 055 166
Địa chỉ: Đại lộ Lê Nin, TP. Vinh
Email: bergerbarbershop@gmail.com
`;

  try {
    console.log('Received message:', userMessage, 'Chat History:', chatHistory);
    const { intent, entities, state } = await analyzeIntent(userMessage, chatHistory);

    if (intent === 'general') {
      console.log('Processing general intent');
      const prompt = `${knowledge}\nLịch sử:\n${chatHistory.map(m => `${m.sender}: ${m.text}`).join('\n')}\nUser: ${userMessage}\nAssistant: Kính chào bạn! `;
      let reply = await gemini.generate({ prompt });
      if (typeof reply !== 'string') reply = String(reply);
      reply = reply.replace(/\*/g, '✦').replace(/✦\s+/g, '\n✦ ');
      console.log('General reply after formatting:', reply);
      return res.json({ reply: reply.trim(), data: null });
    }

    if (entities.priceMin !== undefined) entities.priceMin = Number(entities.priceMin);
    if (entities.priceMax !== undefined) entities.priceMax = Number(entities.priceMax);
    if (entities.minRating !== undefined) entities.minRating = Number(entities.minRating);
    if (entities.maxRating !== undefined) entities.maxRating = Number(entities.maxRating);
    if (entities.servicePriceMin !== undefined) entities.servicePriceMin = Number(entities.servicePriceMin);
    if (entities.servicePriceMax !== undefined) entities.servicePriceMax = Number(entities.servicePriceMax);
    if (entities.experienceYears !== undefined) entities.experienceYears = Number(entities.experienceYears);
    if (entities.barberRatingMin !== undefined) entities.barberRatingMin = Number(entities.barberRatingMin);
    if (entities.barberRatingMax !== undefined) entities.barberRatingMax = Number(entities.barberRatingMax);

    console.log('Calling function with intent:', intent);
    const result = await callFunction(intent, entities, req, chatHistory, userMessage, state);
    const data = result.data || null;
    const reply = generateNaturalResponse(intent, result, userMessage, entities);
    console.log('Response:', { reply, data });

    return res.json({ reply, data });
  } catch (err) {
    console.error('Chatbot error:', err);
    return res.status(500).json({
      reply: '❌ Đã có lỗi xảy ra khi xử lý yêu cầu, vui lòng thử lại sau.',
      data: null,
    });
  }
};