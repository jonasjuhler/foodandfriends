import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import About from "./pages/About";
import BookingPage from "./pages/BookingPage";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<BookingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
