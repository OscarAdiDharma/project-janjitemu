import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Gunakan URL API, jika di local pakai localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  // [BARU] Simpan username di state
  const [username, setUsername] = useState(localStorage.getItem('username')); 
  const [view, setView] = useState('login'); 

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUsername(null); // [BARU] Hapus username saat logout
    setView('login');
  };

  if (!token) {
    if (view === 'register') return <Register setView={setView} />;
    // [BARU] Kirim setUsername ke Login component
    return <Login setToken={setToken} setRole={setRole} setUsername={setUsername} setView={setView} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <nav className="bg-blue-700 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold tracking-wide">JanjiTemu System</h1>
        <div className="flex gap-4 items-center">
          
          {/* [BARU] TAMPILAN USERNAME */}
          <div className="text-right hidden sm:block">
            <p className="text-xs text-blue-200">Halo,</p>
            <p className="font-bold text-lg capitalize">{username || role}</p>
          </div>

          <button onClick={logout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded shadow transition text-sm font-bold">Log Out</button>
        </div>
      </nav>

      {role === 'admin' ? <AdminDashboard token={token} /> : <CustomerDashboard token={token} />}
    </div>
  );
}

// --- LOGIN & REGISTER ---
function Login({ setToken, setRole, setUsername, setView }) {
  // [BARU] Ubah nama state jadi identifier (bisa email atau username)
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // [BARU] Kirim identifier sebagai 'email' karena backend membacanya dari req.body.email
      const res = await axios.post(`${API_URL}/login`, { email: identifier, password });
      
      // Simpan Token & Role
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      
      // [BARU] Simpan Username
      localStorage.setItem('username', res.data.username); 

      // Update State Aplikasi
      setToken(res.data.token);
      setRole(res.data.role);
      setUsername(res.data.username); 

    } catch (err) { 
      // Tampilkan pesan error dari backend jika ada
      alert(err.response?.data?.msg || 'Login Gagal: Cek Username/Email & Password'); 
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-200 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-700">Masuk Aplikasi</h2>
        <div className="space-y-4">
          {/* [BARU] Placeholder diganti */}
          <input 
            className="border w-full p-3 rounded bg-gray-50 focus:ring-2 ring-blue-500 outline-none" 
            placeholder="Email atau Username" 
            value={identifier} 
            onChange={e=>setIdentifier(e.target.value)} 
            required 
          />
          <input 
            className="border w-full p-3 rounded bg-gray-50 focus:ring-2 ring-blue-500 outline-none" 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            required 
          />
          <button className="bg-blue-600 text-white w-full p-3 rounded font-bold hover:bg-blue-700 transition transform hover:scale-105">MASUK</button>
        </div>
        <p className="mt-6 text-center text-sm">
          Customer baru? <span onClick={()=>setView('register')} className="text-blue-600 cursor-pointer font-bold hover:underline">Daftar disini</span>
        </p>
      </form>
    </div>
  );
}

function Register({ setView }) {
  const [formData, setForm] = useState({ username: '', email: '', password: '' });
  const handleRegis = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/register`, formData);
      alert('Registrasi Berhasil! Silakan Login.');
      setView('login');
    } catch (err) { alert('Gagal Registrasi (Username/Email mungkin sudah dipakai)'); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-200 p-4">
      <form onSubmit={handleRegis} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-600">Register Customer</h2>
        <div className="space-y-4">
          <input className="border w-full p-3 rounded" placeholder="Username (Tanpa spasi)" onChange={e=>setForm({...formData, username:e.target.value})} required />
          <input className="border w-full p-3 rounded" placeholder="Email" onChange={e=>setForm({...formData, email:e.target.value})} required />
          <input className="border w-full p-3 rounded" type="password" placeholder="Password" onChange={e=>setForm({...formData, password:e.target.value})} required />
          <button className="bg-green-600 text-white w-full p-3 rounded font-bold hover:bg-green-700 transition">DAFTAR</button>
        </div>
        <p className="mt-4 text-center text-sm text-blue-600 cursor-pointer hover:underline" onClick={()=>setView('login')}>Kembali ke Login</p>
      </form>
    </div>
  );
}

// ================= ADMIN DASHBOARD (FITUR BARU) =================
function AdminDashboard({ token }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, all-apps, services, new-booking
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);

  // Load Data Awal
  const fetchAll = async () => {
    try {
      const resApp = await axios.get(`${API_URL}/appointments`, { headers: { Authorization: token } });
      const resServ = await axios.get(`${API_URL}/services`, { headers: { Authorization: token } });
      setAppointments(resApp.data);
      setServices(resServ.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
      {/* Sidebar Menu */}
      <aside className="bg-white w-full md:w-64 border-r shadow-sm p-4 flex flex-col gap-2">
        <MenuBtn label="📊 Sesi Hari Ini" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />
        <MenuBtn label="📅 Lihat Semua Janji" active={activeTab==='all-apps'} onClick={()=>setActiveTab('all-apps')} />
        <MenuBtn label="📝 New Booking (Admin)" active={activeTab==='new-booking'} onClick={()=>setActiveTab('new-booking')} />
        <MenuBtn label="🛠 Edit Layanan" active={activeTab==='services'} onClick={()=>setActiveTab('services')} />
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-6">
        {activeTab === 'dashboard' && <TodaySession appointments={appointments} refresh={fetchAll} token={token} services={services} />}
        {activeTab === 'all-apps' && <AllAppointments appointments={appointments} refresh={fetchAll} token={token} services={services} />}
        {activeTab === 'new-booking' && <AdminBooking refresh={fetchAll} token={token} services={services} />}
        {activeTab === 'services' && <ManageServices services={services} refresh={fetchAll} token={token} />}
      </main>
    </div>
  );
}

// 1. SESI HARI INI (Dashboard)
function TodaySession({ appointments, refresh, token, services }) {
  const today = new Date().toISOString().split('T')[0];
  const todayApps = appointments.filter(app => app.tanggal && app.tanggal.startsWith(today));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="text-blue-600">📊</span> Sesi Hari Ini ({new Date().toLocaleDateString()})</h2>
      {todayApps.length === 0 ? (
        <div className="bg-yellow-50 p-6 rounded border border-yellow-200 text-yellow-700 text-center">Tidak ada jadwal hari ini. Santai dulu! ☕</div>
      ) : (
        <div className="grid gap-4">
           {todayApps.map(app => (
             <AppointmentCard key={app._id} app={app} refresh={refresh} token={token} services={services} />
           ))}
        </div>
      )}
    </div>
  );
}

// 2. LIHAT SEMUA JANJI
function AllAppointments({ appointments, refresh, token, services }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Semua Daftar Janji</h2>
      <div className="grid gap-4">
        {appointments.map(app => (
          <AppointmentCard key={app._id} app={app} refresh={refresh} token={token} services={services} />
        ))}
      </div>
    </div>
  );
}

// Komponen Kartu Janji (Bisa Edit Status, Tanggal, Layanan)
function AppointmentCard({ app, refresh, token, services }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ 
    status: app.status, 
    tanggal: app.tanggal ? app.tanggal.split('T')[0] : '',
    layanan: app.layanan 
  });

  const handleSave = async () => {
    try {
      await axios.put(`${API_URL}/appointments/${app._id}`, editData, { headers: { Authorization: token } });
      setIsEditing(false);
      refresh();
    } catch (err) { alert('Gagal update'); }
  };

  return (
    <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex-1">
        <h3 className="font-bold text-lg">{app.customerName}</h3>
        {!isEditing ? (
          <>
            <p className="text-gray-600">Layanan: <span className="font-semibold">{app.layanan}</span></p>
            <p className="text-gray-500 text-sm">📅 {new Date(app.tanggal).toLocaleDateString()}</p>
          </>
        ) : (
          <div className="flex flex-col gap-2 mt-2 p-2 bg-gray-50 rounded">
            <label className="text-xs font-bold">Ganti Tanggal:</label>
            <input type="date" className="border p-1 rounded" value={editData.tanggal} onChange={e=>setEditData({...editData, tanggal:e.target.value})} />
            <label className="text-xs font-bold">Ganti Layanan:</label>
            <select className="border p-1 rounded" value={editData.layanan} onChange={e=>setEditData({...editData, layanan:e.target.value})}>
               {services.map(s => <option key={s._id} value={s.nama}>{s.nama}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        {!isEditing ? (
          <span className={`px-3 py-1 rounded text-xs font-bold ${
            app.status === 'Approved' ? 'bg-green-100 text-green-700' :
            app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 
            app.status === 'Completed' ? 'bg-gray-200 text-gray-700' : 'bg-yellow-100 text-yellow-700'
          }`}>{app.status}</span>
        ) : (
          <select className="border p-1 rounded text-sm" value={editData.status} onChange={e=>setEditData({...editData, status:e.target.value})}>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved (ACC)</option>
            <option value="Rejected">Rejected (Tolak)</option>
            <option value="Completed">Completed (Selesai)</option>
          </select>
        )}

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Simpan</button>
              <button onClick={()=>setIsEditing(false)} className="bg-gray-400 text-white px-3 py-1 rounded text-sm">Batal</button>
            </>
          ) : (
            <button onClick={()=>setIsEditing(true)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Edit Janji</button>
          )}
        </div>
      </div>
    </div>
  );
}

// 3. NEW BOOKING (ADMIN INPUT)
function AdminBooking({ refresh, token, services }) {
  const [form, setForm] = useState({ customerName: '', layanan: services[0]?.nama || '', tanggal: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.layanan) return alert("Pilih layanan dulu (atau buat layanan jika kosong)");
    try {
      await axios.post(`${API_URL}/appointments`, form, { headers: { Authorization: token } });
      alert('Booking berhasil dibuat oleh Admin!');
      setForm({ customerName: '', layanan: services[0]?.nama || '', tanggal: '' });
      refresh();
    } catch (err) { alert('Gagal booking'); }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-lg">
      <h2 className="text-xl font-bold mb-4 text-blue-800">Buat Booking Baru (Walk-in/Telpon)</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-bold text-gray-600">Nama Customer</label>
          <input className="border w-full p-2 rounded" placeholder="Contoh: Budi Santoso" value={form.customerName} onChange={e=>setForm({...form, customerName:e.target.value})} required />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-600">Layanan</label>
          <select className="border w-full p-2 rounded" value={form.layanan} onChange={e=>setForm({...form, layanan:e.target.value})}>
             <option value="" disabled>Pilih Layanan</option>
             {services.map(s => <option key={s._id} value={s.nama}>{s.nama}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-bold text-gray-600">Tanggal</label>
          <input type="date" className="border w-full p-2 rounded" value={form.tanggal} onChange={e=>setForm({...form, tanggal:e.target.value})} required />
        </div>
        <button className="bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Buat Booking</button>
      </form>
    </div>
  );
}

// 4. MANAGE SERVICES (CRUD LAYANAN)
function ManageServices({ services, refresh, token }) {
  const [newService, setNewService] = useState({ nama: '', deskripsi: '' });

  const addService = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/services`, newService, { headers: { Authorization: token } });
    setNewService({ nama: '', deskripsi: '' });
    refresh();
  };

  const deleteService = async (id) => {
    if(confirm('Hapus layanan ini?')) {
      await axios.delete(`${API_URL}/services/${id}`, { headers: { Authorization: token } });
      refresh();
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Daftar Layanan Tersedia</h2>
        <ul className="space-y-2">
          {services.map(s => (
            <li key={s._id} className="bg-white p-3 rounded shadow flex justify-between items-center">
              <div>
                <p className="font-bold">{s.nama}</p>
                <p className="text-xs text-gray-500">{s.deskripsi}</p>
              </div>
              <button onClick={()=>deleteService(s._id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Hapus</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white p-6 rounded shadow h-fit">
        <h3 className="font-bold mb-3 border-b pb-2">Tambah Layanan Baru</h3>
        <form onSubmit={addService} className="flex flex-col gap-3">
          <input className="border p-2 rounded" placeholder="Nama Layanan (misal: Hukum Pidana)" value={newService.nama} onChange={e=>setNewService({...newService, nama:e.target.value})} required />
          <input className="border p-2 rounded" placeholder="Deskripsi Singkat" value={newService.deskripsi} onChange={e=>setNewService({...newService, deskripsi:e.target.value})} />
          <button className="bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700">Simpan Layanan</button>
        </form>
      </div>
    </div>
  );
}

// ================= CUSTOMER DASHBOARD (Disesuaikan dikit) =================
function CustomerDashboard({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ layanan: '', tanggal: '' });

  const fetchData = async () => {
    const resApp = await axios.get(`${API_URL}/appointments`, { headers: { Authorization: token } });
    const resServ = await axios.get(`${API_URL}/services`, { headers: { Authorization: token } });
    setAppointments(resApp.data);
    setServices(resServ.data);
    if(resServ.data.length > 0) setForm(f => ({ ...f, layanan: resServ.data[0].nama }));
  };

  useEffect(() => { fetchData(); }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/appointments`, form, { headers: { Authorization: token } });
    fetchData();
    alert('Permohonan Terkirim!');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
      <div className="md:col-span-1 bg-white p-6 rounded shadow h-fit">
        <h3 className="text-xl font-bold mb-4 text-blue-600">Buat Janji Temu</h3>
        <form onSubmit={handleBook} className="flex flex-col gap-4">
          <div>
            <label className="font-bold text-sm text-gray-600">Pilih Layanan</label>
            <select className="border w-full p-2 rounded mt-1" value={form.layanan} onChange={e => setForm({ ...form, layanan: e.target.value })}>
              {services.map(s => <option key={s._id} value={s.nama}>{s.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="font-bold text-sm text-gray-600">Tanggal</label>
            <input type="date" className="border w-full p-2 rounded mt-1" required onChange={e => setForm({ ...form, tanggal: e.target.value })} />
          </div>
          <button className="bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 shadow">Kirim Permohonan</button>
        </form>
      </div>

      <div className="md:col-span-2">
        <h3 className="text-xl font-bold mb-4">Riwayat Pengajuan Saya</h3>
        <div className="grid gap-3">
          {appointments.map(app => (
            <div key={app._id} className="bg-white p-4 rounded shadow border-l-4 border-blue-400 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-lg">{app.layanan}</h4>
                <p className="text-gray-500 text-sm">📅 {new Date(app.tanggal).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded text-xs font-bold ${
                 app.status === 'Approved' ? 'bg-green-100 text-green-700' :
                 app.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {app.status}
              </span>
            </div>
          ))}
          {appointments.length === 0 && <p className="text-gray-500 italic">Belum ada pengajuan janji temu.</p>}
        </div>
      </div>
    </div>
  );
}

// Helper UI Component
function MenuBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`text-left px-4 py-3 rounded transition ${active ? 'bg-blue-100 text-blue-700 font-bold border-r-4 border-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}>
      {label}
    </button>
  );
}

export default App;