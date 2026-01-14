// backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- KONEKSI DATABASE ---
const connectDB = async () => {
  try {
    console.log("Mencoba koneksi ke DB..."); 
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/janjitemu');
    console.log('✅ MongoDB Connected');
    seedData(); // Seed Admin & Layanan Default
  } catch (err) {
    console.error('❌ Gagal Konek Database:', err.message);
  }
};
connectDB();

// --- MODELS ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'customer' }
});
const User = mongoose.model('User', UserSchema);

// Model Layanan (BARU: Agar Admin bisa edit layanan)
const ServiceSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  deskripsi: String
});
const Service = mongoose.model('Service', ServiceSchema);

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Bisa null jika admin yang input (walk-in)
  customerName: String, // Nama Customer
  layanan: { type: String, required: true },
  tanggal: Date,
  waktu: String, // Tambahan field waktu jika perlu spesifik
  status: { type: String, default: 'Pending' } // Pending, Approved, Rejected, Completed
});
const Appointment = mongoose.model('Appointment', AppointmentSchema);

// --- SEED DATA (Admin & Layanan Awal) ---
const seedData = async () => {
  // 1. Seed Admin
  const adminExist = await User.findOne({ email: 'admin@janjitemu.com' });
  if (!adminExist) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'Admin Master',
      email: 'admin@janjitemu.com',
      password: hash,
      role: 'admin'
    });
    console.log('✅ Akun Admin: admin@janjitemu.com / admin123');
  }

  // 2. Seed Layanan Default (Jika kosong)
  const servicesExist = await Service.countDocuments();
  if (servicesExist === 0) {
    await Service.insertMany([
      { nama: 'Badan Usaha', deskripsi: 'Pendirian PT, CV, Yayasan' },
      { nama: 'Perdata', deskripsi: 'Konsultasi Hukum Perdata' },
      { nama: 'Tata Negara', deskripsi: 'Hukum Tata Negara' },
      { nama: 'OPHI', deskripsi: 'Optimalisasi Hak Intelektual' }
    ]);
    console.log('✅ Layanan Default Dibuat');
  }
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalid' });
  }
};

// --- ROUTES ---

// AUTH
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hashedPassword });
    res.json({ msg: 'Register Berhasil' });
  } catch (err) { res.status(500).json({ msg: 'Email sudah terdaftar' }); }
});

// --- CARI BAGIAN INI DAN GANTI LOGIKANYA ---
app.post('/login', async (req, res) => {
  try {
    // Kita terima input sebagai "identifier" (bisa email atau username)
    const { email, password } = req.body; 
    
    // CARI USER: Cek apakah input cocok dengan EMAIL atau USERNAME
    const user = await User.findOne({
      $or: [
        { email: email },      // Cek kolom email
        { username: email }    // Cek kolom username
      ]
    });

    // Jika user tidak ditemukan atau password salah
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: 'Username/Email atau Password Salah' });
    }

    // Buat Token
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.username }, 
      process.env.JWT_SECRET || 'SECRET_KEY_RAHASIA', // Gunakan env kamu
      { expiresIn: '1d' }
    );

    // Kirim data username juga ke frontend
    res.json({ token, role: user.role, username: user.username });
    
  } catch (err) { 
    console.error(err);
    res.status(500).json({ msg: 'Server Error' }); 
  }
});

// LAYANAN ROUTES (CRUD untuk Admin)
app.get('/services', async (req, res) => {
  const services = await Service.find();
  res.json(services);
});

app.post('/services', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Akses Ditolak' });
  try {
    await Service.create(req.body);
    res.json({ msg: 'Layanan ditambahkan' });
  } catch (err) { res.status(500).json(err); }
});

app.put('/services/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Akses Ditolak' });
  try {
    await Service.findByIdAndUpdate(req.params.id, req.body);
    res.json({ msg: 'Layanan diupdate' });
  } catch (err) { res.status(500).json(err); }
});

app.delete('/services/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Akses Ditolak' });
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Layanan dihapus' });
  } catch (err) { res.status(500).json(err); }
});

// APPOINTMENT ROUTES
app.get('/appointments', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const data = await Appointment.find().sort({ tanggal: 1 }); // Urutkan tanggal
      res.json(data);
    } else {
      const data = await Appointment.find({ userId: req.user.id });
      res.json(data);
    }
  } catch (err) { res.status(500).json({ msg: 'Error' }); }
});

app.post('/appointments', authenticate, async (req, res) => {
  try {
    const { layanan, tanggal, customerName } = req.body;
    // Jika Admin yang buat, customerName dari input. Jika user, dari token.
    const name = req.user.role === 'admin' ? customerName : req.user.name;
    const uId = req.user.role === 'admin' ? null : req.user.id; // Admin bikin buat tamu (bukan user terdaftar)
    
    await Appointment.create({
      userId: uId,
      customerName: name,
      layanan,
      tanggal,
    });
    res.json({ msg: 'Berhasil booking' });
  } catch (err) { res.status(500).json({ msg: 'Error' }); }
});

// Update Appointment (Admin: Edit Janji, Status, Tanggal)
app.put('/appointments/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Akses Ditolak' });
  try {
    // req.body bisa berisi { status, tanggal, layanan }
    await Appointment.findByIdAndUpdate(req.params.id, req.body);
    res.json({ msg: 'Data janji diperbarui' });
  } catch (err) { res.status(500).json({ msg: 'Error' }); }
});

// PORT Handling for Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
module.exports = app;