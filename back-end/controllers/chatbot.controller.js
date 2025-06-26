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

const createCartItem = (product, quantity) => {
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
- intent: Ý định của người dùng (ví dụ: "get_product_list", "get_brand_list", "get_category_list", "get_service_list", "get_barber_list", "book_appointment", "general", "add_to_cart").
- entities: Các thực thể trong câu hỏi (ví dụ: {"name": "Dầu xả Schwarzkopf BC Bonacure", "brand": "Schwarzkopf", "category": "Dầu xả", "service": "cắt tóc", "barber": "Lê Quang Vinh", "quantity": 1}, có thể rỗng nếu không có).
Câu hỏi: "${message}"
Lịch sử cuộc trò chuyện:\n${historyText || 'Không có lịch sử'}

Lưu ý quan trọng:
- Nếu người dùng nói "sản phẩm này", "dịch vụ này", hoặc "thợ này" mà không rõ ràng, hãy tham chiếu đến sản phẩm/dịch vụ/thợ gần nhất từ lịch sử (ví dụ: sản phẩm/dịch vụ/thợ đầu tiên trong danh sách trả về trước đó).
- Không sử dụng dấu * để đánh dấu danh sách. Thay vào đó, sử dụng dấu ✦ (dấu sao) kèm xuống dòng (\n✦ ) để định dạng danh sách rõ ràng, chỉ đặt ✦ trước phần tử chính (ví dụ: tên sản phẩm, tên dịch vụ), các thuộc tính con (như giá, thương hiệu) không cần ✦ mà chỉ thụt đầu dòng.
- Trả lời bằng giọng điệu trang trọng, lịch sự, thân thiện, dễ hiểu và trực quan.
- Khi tạo danh sách, luôn xuống dòng sau mỗi mục và bắt đầu bằng ✦ cho phần tử chính.

Ví dụ đầu ra:
{
  "intent": "add_to_cart",
  "entities": {
    "name": "Dầu xả Schwarzkopf BC Bonacure",
    "quantity": 1
  }
}
Lưu ý: Khi trích xuất priceMin, priceMax, servicePriceMin, servicePriceMax, chỉ lấy giá trị số (bỏ qua đơn vị như $ hoặc VNĐ), ví dụ: "dưới 100$" → priceMax: 100.
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
        const namePattern = entities.name.replace(/BC Bonacure/i, 'BC ?Bonacure?').replace(/\s+/g, '\\s*');
        query.name = new RegExp(namePattern, 'i');
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
      const prods = await Product.find(query)
        .limit(5)
        .populate('details.brandId', 'name')
        .populate('categoryId', 'name')
        .lean();

      if (!prods.length) {
        return { error: 'Không tìm thấy sản phẩm phù hợp tại BerGer Barbershop.' };
      }

      return {
        data: {
          products: prods.map(p => ({
            name: p.name,
            price: p.price,
            brand: p.details && p.details.brandId ? p.details.brandId.name : 'Unknown',
            categories: p.categoryId ? p.categoryId.map(c => c.name) : [],
            rating: p.rating || 0,
          })),
          total: await Product.countDocuments(query),
        },
      };
    }
    case 'get_brand_list': {
      const brands = await Brand.find({ isActive: true }).select('name');
      if (!brands.length) {
        return { error: 'Không có thương hiệu nào tại BerGer Barbershop.' };
      }
      return { data: brands.map(b => b.name) };
    }
    case 'get_category_list': {
      const categories = await Category.find({ isActive: true }).select('name');
      if (!categories.length) {
        return { error: 'Không có danh mục nào tại BerGer Barbershop.' };
      }
      return { data: categories.map(c => c.name) };
    }
    case 'get_service_list': {
      const query = { isActive: true };
      if (entities.service) {
        query.name = new RegExp(entities.service, 'i');
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
        const user = await User.findOne({ name: new RegExp(entities.barber, 'i') }).select('_id');
        if (user) {
          query.userId = user._id;
        } else {
          return { error: `Không tìm thấy thợ "${entities.barber}" tại BerGer Barbershop.` };
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
    case 'book_appointment': {
      return {
        data: {
          success: true,
          service: entities.service,
          date: entities.date,
          time: entities.time,
        },
      };
    }
    case 'add_to_cart': {
      const product = await Product.findOne({ name: new RegExp(entities.name || '', 'i'), isActive: true }).lean();
      if (!product) {
        return { error: `Không tìm thấy sản phẩm "${entities.name}" tại BerGer Barbershop.` };
      }

      if (entities.quantity && entities.quantity > product.stock) {
        return { error: `Số lượng không hợp lệ. ${product.name} chỉ có ${product.stock} sản phẩm.` };
      }

      if (entities.quantity && entities.quantity < 1) {
        return { error: 'Số lượng phải lớn hơn 0.' };
      }

      const quantity = entities.quantity || 1;

      const token = req.headers.authorization;
      if (token) {
        return addToCartWithToken(product);
      } else {
        const cartItem = createCartItem(product, quantity);
        return {
          data: {
            success: true,
            productName: product.name,
            cartItem: cartItem
          }
        };
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
    case 'get_brand_list': {
      return 'Kính chào bạn! Dưới đây là danh sách các thương hiệu tại BerGer Barbershop:\n✦ ' + data.data.join('\n✦ ') + '\nVui lòng cho biết bạn muốn xem sản phẩm của thương hiệu nào nhé!';
    }
    case 'get_category_list': {
      return 'Kính chào bạn! Dưới đây là danh sách các danh mục tại BerGer Barbershop:\n✦ ' + data.data.join('\n✦ ') + '\nVui lòng cho biết bạn muốn xem sản phẩm trong danh mục nào nhé!';
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
      const productName = data.data?.productName || (entities?.name || 'sản phẩm không xác định');
      const quantity = entities?.quantity || 1;
      return `Kính chào bạn! Sản phẩm "${productName}" đã được thêm vào giỏ hàng của bạn với số lượng ${quantity}. Bạn có muốn tiếp tục mua sắm hay thanh toán không?`;
    }
    case 'book_appointment': {
      return 'Kính chào bạn! Đặt lịch thành công cho dịch vụ "' + data.data.service + '" vào ngày ' + data.data.date + ' lúc ' + data.data.time + '. Chúng tôi sẽ liên hệ để xác nhận. Rất hân hạnh được phục vụ!';
    }
    default:
      return 'Kính chào bạn! Rất tiếc, tôi chưa hiểu rõ yêu cầu của bạn. Vui lòng thử lại hoặc liên hệ với chủ shop qua số điện thoại 0886 055 166 nhé!';
  }
}

exports.handleChatbot = async (req, res) => {
  const userMessage = req.body.message || '';
  const chatHistory = req.body.chatHistory || []; // Nhận lịch sử từ frontend

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