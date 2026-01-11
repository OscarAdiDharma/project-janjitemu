const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- MODIFIKASI: LOGGING BIAR TAHU ERRORNYA DIMANA ---
const connectDB = async () => {
  try {
    // Pastikan URI terbaca
    console.log("Mencoba koneksi ke DB..."); 
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/janjitemu');
    console.log('✅ MongoDB Connected (Berhasil Konek!)');
    
    // Jalankan Seed Admin setelah konek
    seedAdmin();
  } catch (err) {
    console.error('❌ Gagal Konek Database. Cek Password di .env!', err.message);
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

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: String,
  layanan: { type: String, required: true },
  tanggal: Date,
  status: { type: String, default: 'Pending' }
});
const Appointment = mongoose.model('Appointment', AppointmentSchema);

// --- SEED ADMIN (DIPERBAIKI) ---
const seedAdmin = async () => {
  try {
    const adminExist = await User.findOne({ email: 'admin@janjitemu.com' });
    if (!adminExist) {
      console.log("⏳ Sedang membuat akun admin...");
      const hash = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'Admin Master',
        email: 'admin@janjitemu.com',
        password: hash,
        role: 'admin'
      });
      console.log('✅ Akun Admin Berhasil Dibuat: admin@janjitemu.com / admin123');
    } else {
      console.log('ℹ️ Akun Admin Sudah Ada (Siap Login)');
    }
  } catch (error) {
    console.log("Gagal membuat admin:", error.message);
  }
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const decoded = jwt.verify(token, 'SECRET_KEY_RAHASIA');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalid' });
  }
};

// --- ROUTES DENGAN DEBUGGING ---

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, email, password: hashedPassword });
    res.json({ msg: 'Register Berhasil' });
  } catch (err) { res.status(500).json({ msg: 'Email sudah terdaftar/Error' }); }
});

// LOGIN DENGAN LOGGING LENGKAP
app.post('/login', async (req, res) => {
  console.log("📥 Menerima Request Login:", req.body.email); // Debug Print
  try {
    const { email, password } = req.body;
    
    // Cek User
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User tidak ditemukan di database");
      return res.status(400).json({ msg: 'User tidak ditemukan' });
    }

    // Cek Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password Salah");
      return res.status(400).json({ msg: 'Password salah' });
    }

    console.log("✅ Login Berhasil untuk:", user.username);
    const token = jwt.sign({ id: user._id, role: user.role, name: user.username }, 'SECRET_KEY_RAHASIA');
    res.json({ token, role: user.role, username: user.username });

  } catch (err) { 
    console.log("❌ Error Server:", err);
    res.status(500).json({ msg: 'Server Error' }); 
  }
});

app.get('/appointments', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const data = await Appointment.find();
      res.json(data);
    } else {
      const data = await Appointment.find({ userId: req.user.id });
      res.json(data);
    }
  } catch (err) { res.status(500).json({ msg: 'Error' }); }
});

app.post('/appointments', authenticate, async (req, res) => {
  try {
    const { layanan, tanggal } = req.body;
    await Appointment.create({
      userId: req.user.id,
      customerName: req.user.name,
      layanan,
      tanggal,
    });
    res.json({ msg: 'Berhasil booking' });
  } catch (err) { res.status(500).json({ msg: 'Error' }); }
});

app.put('/appointments/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Akses ditolak' });
  try {
    const { status } = req.body;
    await Appointment.findByIdAndUpdate(req.params.id, { status });
    res.json({ msg: 'Status updated' });
  } catch (err) { res.status(500).json({ msg: 'Error' }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));