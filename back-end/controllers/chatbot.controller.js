const Product = require('../models/product.model');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const Service = require('../models/service.model');
const Barber = require('../models/barber.model');
const User = require('../models/user.model');
const gemini = require('../services/gemini.service');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 3600 });

const addToCartWithToken = (product) => {
  console.log(`Thêm sản phẩm "${product.name}" vào giỏ hàng thành công (với token). Gửi đến addToCart.controller.js.`);
  return { success: true, productName: product.name };
};

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
  const prompt = `
Bạn là một trợ lý AI thông minh, chuyên cung cấp thông tin trang trọng, lịch sự và thân thiện cho khách hàng tại BerGer Barbershop. Phân tích câu hỏi sau dựa trên ngữ cảnh từ lịch sử cuộc trò chuyện và trả về JSON chứa:
- intent: Ý định của người dùng (ví dụ: "get_product_list", "get_service_list", "get_barber_list", "add_to_cart", "book_appointment", "general").
- entities: Các thực thể trong câu hỏi (ví dụ: {"name": ["Sáp vuốt tóc Gatsby Moving Rubber", "Dầu xả Schwarzkopf BC Bonacure"], "service": ["Cắt tóc nam"], "barber": ["Lê Quang Vinh"], "quantity": 5}, có thể rỗng nếu không có). Nếu có nhiều thực thể, trả về mảng trong "name", "service", hoặc "barber".
Câu hỏi: "${message}"
Lịch sử cuộc trò chuyện:\n${historyText || 'Không có lịch sử'}

Lưu ý quan trọng:
- Nếu người dùng nói "sản phẩm này", "dịch vụ này", hoặc "thợ này" mà không rõ ràng, hãy tham chiếu đến danh sách sản phẩm/dịch vụ/thợ gần nhất từ lịch sử.
- Nếu yêu cầu "thêm 5 sản phẩm này vào giỏ hàng", hãy hiểu "5" là số lượng sản phẩm (khác nhau) muốn thêm, và mặc định mỗi sản phẩm có quantity là 1, trừ khi có chỉ định rõ ràng như "thêm 5 sản phẩm này với mỗi sản phẩm 5 cái".
- Không sử dụng dấu * để đánh dấu danh sách. Thay vào đó, sử dụng dấu ✦ kèm xuống dòng (\n✦ ) để định dạng danh sách rõ ràng, chỉ đặt ✦ trước phần tử chính, các thuộc tính con không cần ✦ mà chỉ thụt đầu dòng.
- Trả lời bằng giọng điệu trang trọng, lịch sự, thân thiện, dễ hiểu và trực quan.

Ví dụ đầu ra:
{
  "intent": "add_to_cart",
  "entities": {
    "name": ["Sáp vuốt tóc Gatsby Moving Rubber", "Dầu xả Schwarzkopf BC Bonacure"],
    "quantity": 1
  }
}
Lưu ý: Nếu không có số lượng cụ thể cho mỗi sản phẩm, mặc định là 1.
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
    return { intent: 'general', entities: {} };
  }
}

async function callFunction(fnName, entities, req) {
  console.log('Calling function:', fnName, 'with entities:', entities);
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
        { $sample: { size: 5 } }, // Lấy ngẫu nhiên 5 sản phẩm
        {
          $lookup: {
            from: 'brands', // Tên collection của Brand
            localField: 'details.brandId',
            foreignField: '_id',
            as: 'brandDetails'
          }
        },
        {
          $lookup: {
            from: 'categories', // Tên collection của Category
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

      // Kiểm tra số lượng sản phẩm tối đa là 5
      if (names.length > 5) {
        return { error: 'Chỉ có thể thêm tối đa 5 sản phẩm cùng lúc.' };
      }

      // Mặc định quantity là 1, trừ khi có chỉ định cụ thể
      const quantity = Math.max(1, Number(entities.quantity) || 1);
      const cartItems = [];
      const errors = [];

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

        const cartItem = createCartItem(product, quantity);
        cartItems.push(cartItem);
      }

      if (errors.length > 0) {
        return { error: errors.join('\n') };
      }

      const token = req.headers.authorization;
      if (token) {
        cartItems.forEach(item => addToCartWithToken(item));
        return { success: true, productNames: names };
      } else {
        return {
          data: {
            success: true,
            productNames: names,
            cartItems: cartItems
          }
        };
      }
    }
    case 'book_appointment': {
      const services = Array.isArray(entities.service) ? entities.service : [entities.service].filter(Boolean);
      const barbers = Array.isArray(entities.barber) ? entities.barber : [entities.barber].filter(Boolean);
      const errors = [];

      if (services.length > 0 || barbers.length > 0) {
        let reply = 'Kính chào bạn! Đã thêm vào lịch đặt của bạn:\n';
        if (services.length > 0) {
          reply += 'Dịch vụ: ' + services.join(', ') + '\n';
        }
        if (barbers.length > 0) {
          reply += 'Thợ: ' + barbers.join(', ') + '\n';
        }
        reply += 'Chúng tôi sẽ liên hệ để xác nhận thời gian. Bạn có muốn tiếp tục đặt lịch không?';
        return { reply, data: null };
      } else {
        return { error: 'Vui lòng cung cấp dịch vụ hoặc thợ để đặt lịch.' };
      }
    }
    default:
      return { error: 'Yêu cầu không được hỗ trợ tại BerGer Barbershop.' };
  }
}

function generateNaturalResponse(fnName, data, userMessage, entities) {
  if (data.error) return data.error;

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
      const productNames = data.data?.productNames || (Array.isArray(entities.name) ? entities.name : [entities.name]);
      const quantity = entities.quantity || 1;
      return `Kính chào bạn! Các sản phẩm ${productNames.join(', ')} đã được thêm vào giỏ hàng của bạn với số lượng ${quantity} mỗi loại. Bạn có muốn tiếp tục mua sắm hay thanh toán không?`;
    }
    case 'book_appointment': {
      const serviceNames = Array.isArray(entities.service) ? entities.service : [entities.service].filter(Boolean);
      const barberNames = Array.isArray(entities.barber) ? entities.barber : [entities.barber].filter(Boolean);
      let reply = 'Kính chào bạn! Đã thêm vào lịch đặt của bạn:\n';
      if (serviceNames.length > 0) {
        reply += 'Dịch vụ: ' + serviceNames.join(', ') + '\n';
      }
      if (barberNames.length > 0) {
        reply += 'Thợ: ' + barberNames.join(', ') + '\n';
      }
      reply += 'Chúng tôi sẽ liên hệ để xác nhận thời gian. Bạn có muốn tiếp tục đặt lịch không?';
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
    console.log('Received message:', userMessage);
    const { intent, entities } = await analyzeIntent(userMessage, chatHistory);

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
    const result = await callFunction(intent, entities, req);
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