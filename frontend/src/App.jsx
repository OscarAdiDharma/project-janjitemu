// frontend/src/App.jsx
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [view, setView] = useState("login"); // login, register, dashboard

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setView("login");
  };

  if (!token) {
    if (view === "register") return <Register setView={setView} />;
    return <Login setToken={setToken} setRole={setRole} setView={setView} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-600 p-4 text-white flex justify-between shadow-md">
        <h1 className="text-xl font-bold">JanjiTemu App</h1>
        <div className="flex gap-4 items-center">
          <span className="text-sm bg-blue-800 px-2 py-1 rounded capitalize">
            {role}
          </span>
          <button
            onClick={logout}
            className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8">
        {role === "admin" ? (
          <AdminDashboard token={token} />
        ) : (
          <CustomerDashboard token={token} />
        )}
      </div>
    </div>
  );
}

// --- KOMPONEN LOGIN ---
function Login({ setToken, setRole, setView }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      setToken(res.data.token);
      setRole(res.data.role);
    } catch (err) {
      alert("Login Gagal: Cek Email/Password");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-200">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <input
          className="border w-full p-2 mb-3 rounded"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border w-full p-2 mb-3 rounded"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-blue-600 text-white w-full p-2 rounded hover:bg-blue-700">
          Masuk
        </button>
        <p className="mt-4 text-center text-sm">
          Belum punya akun?{" "}
          <span
            onClick={() => setView("register")}
            className="text-blue-600 cursor-pointer font-bold"
          >
            Daftar Customer
          </span>
        </p>
      </form>
    </div>
  );
}

// --- KOMPONEN REGISTER ---
function Register({ setView }) {
  const [formData, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleRegis = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/register`, formData);
      alert("Registrasi Berhasil! Silakan Login.");
      setView("login");
    } catch (err) {
      alert("Gagal Registrasi");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-200">
      <form
        onSubmit={handleRegis}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          Register Customer
        </h2>
        <input
          className="border w-full p-2 mb-3 rounded"
          placeholder="Nama Lengkap"
          onChange={(e) => setForm({ ...formData, username: e.target.value })}
        />
        <input
          className="border w-full p-2 mb-3 rounded"
          placeholder="Email"
          onChange={(e) => setForm({ ...formData, email: e.target.value })}
        />
        <input
          className="border w-full p-2 mb-3 rounded"
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...formData, password: e.target.value })}
        />
        <button className="bg-green-600 text-white w-full p-2 rounded hover:bg-green-700">
          Daftar
        </button>
        <p
          className="mt-4 text-center text-sm text-blue-600 cursor-pointer"
          onClick={() => setView("login")}
        >
          Kembali ke Login
        </p>
      </form>
    </div>
  );
}

// --- DASHBOARD ADMIN ---
function AdminDashboard({ token }) {
  const [data, setData] = useState([]);

  const fetchData = async () => {
    const res = await axios.get(`${API_URL}/appointments`, {
      headers: { Authorization: token },
    });
    setData(res.data);
  };

  const updateStatus = async (id, status) => {
    await axios.put(
      `${API_URL}/appointments/${id}`,
      { status },
      { headers: { Authorization: token } }
    );
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Daftar Permohonan Masuk</h2>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">Layanan</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item._id} className="border-b hover:bg-gray-50">
                <td className="p-3">{item.customerName}</td>
                <td className="p-3">{item.layanan}</td>
                <td className="p-3">
                  {new Date(item.tanggal).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-sm font-bold ${
                      item.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-3">
                  {item.status === "Pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(item._id, "Approved")}
                        className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                      >
                        ACC
                      </button>
                      <button
                        onClick={() => updateStatus(item._id, "Rejected")}
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- DASHBOARD CUSTOMER ---
function CustomerDashboard({ token }) {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({ layanan: "Badan Usaha", tanggal: "" });

  const fetchData = async () => {
    const res = await axios.get(`${API_URL}/appointments`, {
      headers: { Authorization: token },
    });
    setData(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/appointments`, form, {
      headers: { Authorization: token },
    });
    fetchData();
    alert("Berhasil Apply!");
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Form Booking */}
      <div className="bg-white p-6 rounded shadow h-fit">
        <h3 className="text-xl font-bold mb-4">Buat Janji Temu</h3>
        <form onSubmit={handleBook} className="flex flex-col gap-3">
          <label>Pilih Layanan:</label>
          <select
            className="border p-2 rounded"
            onChange={(e) => setForm({ ...form, layanan: e.target.value })}
          >
            <option>Badan Usaha</option>
            <option>Perdata</option>
            <option>Tata Negara</option>
            <option>OPHI</option>
          </select>
          <label>Tanggal:</label>
          <input
            type="date"
            className="border p-2 rounded"
            required
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
          />
          <button className="bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700 mt-2">
            Kirim Permohonan
          </button>
        </form>
      </div>

      {/* List Janji */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-xl font-bold mb-4">Riwayat Pengajuan Saya</h3>
        <ul className="space-y-3">
          {data.map((item) => (
            <li
              key={item._id}
              className="border p-3 rounded flex justify-between items-center bg-gray-50"
            >
              <div>
                <p className="font-bold">{item.layanan}</p>
                <p className="text-sm text-gray-600">
                  {new Date(item.tanggal).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-bold ${
                  item.status === "Approved"
                    ? "bg-green-100 text-green-700"
                    : item.status === "Rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {item.status}
              </span>
            </li>
          ))}
          {data.length === 0 && (
            <p className="text-gray-500">Belum ada pengajuan.</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default App;
