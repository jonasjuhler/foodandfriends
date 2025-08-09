import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { config } from "../lib/config";

interface AdminBookingEntry {
  booking_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  booking_date?: string;
  status?: string;
}

interface AdminDayEntry {
  day_id: string;
  date: string;
  theme: string;
  capacity: number;
  bookings: AdminBookingEntry[];
}

const Admin: React.FC = () => {
  const { state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<AdminDayEntry[]>([]);
  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No auth token");
        const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/bookings/by-day`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(`Failed to load admin bookings: ${res.status}`);
        }
        const data = await res.json();
        setDays(data.days || []);
      } catch (e) {
        console.error(e);
        setDays([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!state.isAuthenticated || !state.user?.is_admin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/90 rounded-lg shadow p-8 text-center">
          <p className="text-gray-700">Access denied. Please log in with an admin account.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/90 rounded-lg shadow p-8 text-center">
          <p className="text-gray-700">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      {days.map((day) => (
        <div key={day.day_id} className="bg-white/90 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {new Date(day.date).toLocaleDateString()} – {day.theme}
              </h2>
              <p className="text-sm text-gray-600">
                {day.bookings.length} / {day.capacity} booked
              </p>
            </div>
          </div>
          <div className="mt-4">
            {day.bookings.length === 0 ? (
              <p className="text-gray-600">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {day.bookings.map((b) => (
                  <li key={b.booking_id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 font-medium">{b.user_name || "Unknown"}</p>
                      <p className="text-gray-600 text-sm">{b.user_email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700">{b.status}</p>
                      {b.booking_date && (
                        <p className="text-xs text-gray-500">
                          Booked {new Date(b.booking_date).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Admin;


