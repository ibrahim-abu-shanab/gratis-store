const express = require("express");
const fs      = require("fs");
const path    = require("path");
const multer  = require("multer");

// ════════════════════════════════════════════════════════════
//  إعدادات أساسية
// ════════════════════════════════════════════════════════════

const ADMIN_KEY = process.env.ADMIN_KEY || "changeme";
// الباسورد بييجي من المتغيرات البيئية (.env) مش مكتوب بالكود

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "changeme";
// اليوزر وباسورد اللوجين كمان من البيئة

const app  = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, "database.json");


// ════════════════════════════════════════════════════════════
//  إعداد رفع الصور (Multer)
// ════════════════════════════════════════════════════════════

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "public/uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext    = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Sadece resim yüklenebilir"));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});


// ════════════════════════════════════════════════════════════
//  Middleware
// ════════════════════════════════════════════════════════════

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/images",  express.static(path.join(__dirname, "public/images")));


// ════════════════════════════════════════════════════════════
//  API: لوجين الأدمن (بالسيرفر)
// ════════════════════════════════════════════════════════════

// POST /api/admin-login  →  { username, password }
app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // نرجع الـ ADMIN_KEY بس للشخص اللي عنده اليوزر والباسورد الصح
    return res.json({ ok: true, key: ADMIN_KEY });
  }
  return res.status(401).json({ ok: false, error: "Kullanıcı adı veya şifre hatalı" });
});


// ════════════════════════════════════════════════════════════
//  دوال قاعدة البيانات
// ════════════════════════════════════════════════════════════

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return { products: [], cart: [], nextProductId: 1, nextCartId: 1 };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}


// ════════════════════════════════════════════════════════════
//  API: المنتجات
// ════════════════════════════════════════════════════════════

app.get("/api/products", (req, res) => {
  const db = readDB();
  let products = db.products;

  if (req.query.category)    products = products.filter(p => p.category    === req.query.category);
  if (req.query.subcategory) products = products.filter(p => p.subcategory === req.query.subcategory);

  if (req.query.random) {
    const count    = parseInt(req.query.random) || 12;
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    products       = shuffled.slice(0, count);
  }

  res.json(products);
});

app.post("/api/products", upload.single("image"), (req, res) => {
  if (req.headers.admin !== ADMIN_KEY)
    return res.status(403).json({ error: "Admin only" });

  const { name, price, stock } = req.body;
  if (!name || isNaN(price))
    return res.status(400).json({ error: "Eksik veya hatalı veri" });

  const db         = readDB();
  const newProduct = {
    id:       db.nextProductId++,
    name,
    price:    parseFloat(price),
    stock:    parseInt(stock) || 0,
    category: req.body.category || "makyaj",
    image:    req.file ? `/uploads/${req.file.filename}` : null,
  };

  db.products.push(newProduct);
  saveDB(db);
  res.status(201).json(newProduct);
});

app.delete("/api/products/:id", (req, res) => {
  if (req.headers.admin !== ADMIN_KEY)
    return res.status(403).json({ error: "Admin only" });

  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Geçersiz ID" });

  const db    = readDB();
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: "Bulunamadı" });

  const product = db.products[index];
  if (product.image && product.image.startsWith("/uploads/")) {
    const imgPath = path.join(__dirname, "public", product.image.replace("/uploads/", "uploads/"));
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  db.products.splice(index, 1);
  db.cart = db.cart.filter(item => item.product_id !== id);
  saveDB(db);
  res.json({ message: "Silindi" });
});

app.put("/api/products/:id", (req, res) => {
  if (req.headers.admin !== ADMIN_KEY)
    return res.status(403).json({ error: "Admin only" });

  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Geçersiz ID" });

  const db      = readDB();
  const product = db.products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: "Bulunamadı" });

  if (req.body.price && isNaN(req.body.price))
    return res.status(400).json({ error: "Fiyat hatalı" });

  product.name  = req.body.name  || product.name;
  product.price = req.body.price ? parseFloat(req.body.price) : product.price;
  product.stock = req.body.stock !== undefined ? parseInt(req.body.stock) : product.stock;

  saveDB(db);
  res.json(product);
});


// ════════════════════════════════════════════════════════════
//  API: السلة
// ════════════════════════════════════════════════════════════

app.get("/api/cart", (req, res) => {
  const db     = readDB();
  const result = db.cart.map(item => {
    const product = db.products.find(p => p.id === item.product_id);
    return { ...item, product };
  });
  res.json(result);
});

app.post("/api/cart", (req, res) => {
  const { product_id } = req.body;
  const db             = readDB();
  const product        = db.products.find(p => p.id === product_id);

  if (!product)        return res.status(404).json({ error: "Ürün yok" });
  if (product.stock <= 0) return res.status(400).json({ error: "Stok yok" });

  const existing = db.cart.find(i => i.product_id === product_id);
  if (existing) {
    existing.quantity += 1;
  } else {
    db.cart.push({ id: db.nextCartId++, product_id, quantity: 1 });
  }

  product.stock -= 1;
  saveDB(db);
  res.json({ message: "Eklendi" });
});

app.patch("/api/cart/:id", (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Geçersiz ID" });

  const db   = readDB();
  const item = db.cart.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: "Yok" });

  const newQty = parseInt(req.body.quantity);
  if (isNaN(newQty) || newQty < 1) return res.status(400).json({ error: "Miktar hatalı" });

  const product = db.products.find(p => p.id === item.product_id);
  if (product) product.stock += item.quantity - newQty;

  item.quantity = newQty;
  saveDB(db);
  res.json(item);
});

app.delete("/api/cart/:id", (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Geçersiz ID" });

  const db    = readDB();
  const index = db.cart.findIndex(i => i.id === id);
  if (index === -1) return res.status(404).json({ error: "Yok" });

  const item    = db.cart[index];
  const product = db.products.find(p => p.id === item.product_id);
  if (product) product.stock += item.quantity;

  db.cart.splice(index, 1);
  saveDB(db);
  res.json({ message: "Silindi" });
});


// ════════════════════════════════════════════════════════════
//  معالجة الأخطاء
// ════════════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("resim")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});


// ════════════════════════════════════════════════════════════
//  تشغيل السيرفر
// ════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
