// controllers/chatbot.controller.js

const Product = require('../models/product.model');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const gemini = require('../services/gemini.service');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 3600 });

async function analyzeIntent(message) {
  const prompt = `
Bạn là một trợ lý AI thông minh. Phân tích câu hỏi sau và trả về JSON chứa:
- intent: Ý định của người dùng (ví dụ: "get_product_list", "get_brand_list", "get_category_list", "book_appointment", "general").
- entities: Các thực thể trong câu hỏi (ví dụ: { "brand": "TestBrand", "category": "Duy", "priceMin": 0, "priceMax": 100, "minRating": 4, "maxRating": 5 }, có thể rỗng nếu không có).
Câu hỏi: "${message}"

Ví dụ đầu ra:
{
  "intent": "get_product_list",
  "entities": {
    "brand": "TestBrand",
    "category": "Duy",
    "priceMin": 0,
    "priceMax": 100,
    "minRating": 4,
    "maxRating": 5
  }
}
Lưu ý: Khi trích xuất priceMin và priceMax, chỉ lấy giá trị số (bỏ qua đơn vị như $ hoặc VNĐ), ví dụ: "dưới 100 VNĐ" → priceMax: 100.
`;
  try {
    const raw = await gemini.generate({ prompt });
    const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonText = fence ? fence[1].trim() : raw.trim();
    return JSON.parse(jsonText);
  } catch (e) {
    console.error('Intent analysis error:', e);
    return { intent: 'general', entities: {} };
  }
}

async function callFunction(fnName, entities) {
  console.log('Calling function:', fnName, 'with entities:', entities);
  switch (fnName) {
    case 'get_product_list': {
      const query = { isActive: true };
      if (entities.keyword) {
        query.name = { $regex: entities.keyword, $options: 'i' };
      }
      if (entities.brand) {
        const cacheKey = `brand_${entities.brand}`;
        let brands = cache.get(cacheKey);
        if (!brands) {
          brands = await Brand.find({ name: { $regex: entities.brand, $options: 'i' } }).select('_id');
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
          categories = await Category.find({ name: { $regex: entities.category, $options: 'i' } }).select('_id');
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
        .populate('categoryId', 'name');

      if (!prods.length) {
        return { error: 'Không tìm thấy sản phẩm phù hợp tại BerGer Barbershop.' };
      }

      return {
        products: prods.map(p => ({
          name: p.name,
          price: p.price,
          brand: p.details.brandId.name,
          categories: p.categoryId.map(c => c.name),
          rating: p.rating || 0,
        })),
        total: await Product.countDocuments(query),
      };
    }
    case 'get_brand_list': {
      const brands = await Brand.find({ isActive: true }).select('name');
      if (!brands.length) {
        return { error: 'Không có thương hiệu nào tại BerGer Barbershop.' };
      }
      return brands.map(b => b.name);
    }
    case 'get_category_list': {
      const categories = await Category.find({ isActive: true }).select('name');
      if (!categories.length) {
        return { error: 'Không có danh mục nào tại BerGer Barbershop.' };
      }
      return categories.map(c => c.name);
    }
    case 'book_appointment': {
      return {
        success: true,
        service: entities.service,
        date: entities.date,
        time: entities.time,
      };
    }
    default:
      return { error: 'Yêu cầu không được hỗ trợ tại BerGer Barbershop.' };
  }
}

function generateNaturalResponse(fnName, data, userMessage) {
  if (data.error) return data.error;

  switch (fnName) {
    case 'get_product_list': {
      const { products, total } = data;
      let reply = 'Danh sách sản phẩm tại BerGer Barbershop:\n';
      products.forEach(p => {
        reply += `- ${p.name} (Thương hiệu: ${p.brand}) - Giá: $${p.price}, Đánh giá: ${p.rating}/5\n`;
        if (p.categories.length > 0) {
          reply += `  Danh mục: ${p.categories.join(', ')}\n`;
        }
      });
      if (total > products.length) {
        reply += `\nCòn ${total - products.length} sản phẩm khác. Nhắn "xem thêm" để tiếp tục!\n`;
      }
      reply += 'Bạn có muốn đặt lịch trải nghiệm không?';
      return reply;
    }
    case 'get_brand_list': {
      return `Các thương hiệu tại BerGer Barbershop: ${data.join(', ')}. Bạn muốn xem sản phẩm của thương hiệu nào?`;
    }
    case 'get_category_list': {
      return `Các danh mục tại BerGer Barbershop: ${data.join(', ')}. Bạn muốn xem sản phẩm trong danh mục nào?`;
    }
    case 'book_appointment': {
      return `Đặt lịch thành công tại BerGer Barbershop cho dịch vụ "${data.service}" vào ${data.date} lúc ${data.time}. Chúng tôi sẽ liên hệ xác nhận!`;
    }
    default:
      return 'Rất tiếc, tôi không hiểu yêu cầu của bạn. Vui lòng thử lại!';
  }
}

exports.handleChatbot = async (req, res) => {
  const userMessage = req.body.message || '';

  const knowledge = `
BerGer Barbershop – Điểm hẹn phong cách dành riêng cho phái mạnh tại Vinh, Nghệ An.
Ra đời từ năm 2016, chúng tôi tự hào mang đến trải nghiệm “Men Only” chuyên nghiệp với đội ngũ barber tay nghề cao,
phối hợp kỹ thuật cắt – tạo kiểu hiện đại và phong cách cổ điển.
Không gian lịch lãm, ấm cúng, dịch vụ cá nhân hóa theo sở thích và đặc điểm từng khách.

Hotline: 0886 055 166
Địa chỉ: Đại lộ Lê Nin, TP. Vinh
Email: bergerbarbershop@gmail.com
`;

  try {
    const { intent, entities } = await analyzeIntent(userMessage);

    if (intent === 'general') {
      const prompt = `${knowledge}\nUser: ${userMessage}\nAssistant:`;
      let reply = await gemini.generate({ prompt });
      if (typeof reply !== 'string') reply = String(reply);
      return res.json({ reply: reply.trim() });
    }

    // Chuyển đổi giá trị số
    if (entities.priceMin !== undefined) entities.priceMin = Number(entities.priceMin);
    if (entities.priceMax !== undefined) entities.priceMax = Number(entities.priceMax);
    if (entities.minRating !== undefined) entities.minRating = Number(entities.minRating);
    if (entities.maxRating !== undefined) entities.maxRating = Number(entities.maxRating);

    const data = await callFunction(intent, entities);

    const reply = generateNaturalResponse(intent, data, userMessage);

    return res.json({ reply });
  } catch (err) {
    console.error('Chatbot error:', err);
    return res.status(500).json({
      reply: '❌ Đã có lỗi xảy ra khi xử lý yêu cầu, vui lòng thử lại sau.',
    });
  }
};