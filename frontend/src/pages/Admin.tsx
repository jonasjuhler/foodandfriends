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
  const [dayDetails, setDayDetails] = useState<Record<string, { date: string; theme: string; menu: string; capacity: number }>>({});
  const [festival, setFestival] = useState<{
    name: string;
    location: string;
    start_date: string; // ISO or datetime-local
    end_date: string;   // ISO or datetime-local
    price: number;
    capacity_per_day: number;
  } | null>(null);
  const [festPending, setFestPending] = useState(false);
  const [festError, setFestError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<null | string>(null);
  const [pending, setPending] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formTheme, setFormTheme] = useState("");
  const [formMenu, setFormMenu] = useState("");
  const [formCapacity, setFormCapacity] = useState<number>(6);
  const [origDate, setOrigDate] = useState<string>("");
  const [origCapacity, setOrigCapacity] = useState<number>(6);
  const [origBookingsCount, setOrigBookingsCount] = useState<number>(0);
  const [createEmail, setCreateEmail] = useState("");
  const [createDayId, setCreateDayId] = useState("");
  const [createPending, setCreatePending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

        const resDays = await fetch(`${config.API_BASE_URL}/api/v1/admin/days`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resDays.ok) {
          const d = await resDays.json();
          const map: Record<string, { date: string; theme: string; menu: string; capacity: number }> = {};
          for (const day of d.items || []) {
            map[day.day_id] = {
              date: day.date,
              theme: day.theme,
              menu: day.menu,
              capacity: day.capacity,
            };
          }
          setDayDetails(map);
        }

        // Festival settings
        const resFest = await fetch(`${config.API_BASE_URL}/api/v1/admin/festival`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resFest.ok) {
          const f = await resFest.json();
          setFestival({
            name: f.name || "",
            location: f.location || "",
            start_date: f.start_date || "",
            end_date: f.end_date || "",
            price: typeof f.price === "number" ? f.price : parseFloat(f.price || 0),
            capacity_per_day: typeof f.capacity_per_day === "number" ? f.capacity_per_day : parseInt(f.capacity_per_day || 6, 10),
          });
        }
      } catch (e) {
        console.error(e);
        setDays([]);
        setDayDetails({});
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

  const formatForInput = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const refreshAdminData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const [byDayRes, daysRes] = await Promise.all([
      fetch(`${config.API_BASE_URL}/api/v1/admin/bookings/by-day`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${config.API_BASE_URL}/api/v1/admin/days`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (byDayRes.ok) {
      const bd = await byDayRes.json();
      setDays(bd.days || []);
    }
    if (daysRes.ok) {
      const ddet = await daysRes.json();
      const map: Record<string, { date: string; theme: string; menu: string; capacity: number }> = {};
      for (const d of ddet.items || []) {
        map[d.day_id] = { date: d.date, theme: d.theme, menu: d.menu, capacity: d.capacity };
      }
      setDayDetails(map);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Festival Settings */}
      <div className="bg-white/90 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Festival Settings</h2>
        {festival ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={festival.name}
                  onChange={(e) => setFestival({ ...festival, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={festival.location}
                  onChange={(e) => setFestival({ ...festival, location: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded p-2"
                  value={formatForInput(festival.start_date)}
                  onChange={(e) => setFestival({ ...festival, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded p-2"
                  value={formatForInput(festival.end_date)}
                  onChange={(e) => setFestival({ ...festival, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (DKK)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded p-2"
                  value={festival.price}
                  onChange={(e) => setFestival({ ...festival, price: parseFloat(e.target.value || "0") })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity per day</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border rounded p-2"
                  value={festival.capacity_per_day}
                  onChange={(e) => setFestival({ ...festival, capacity_per_day: parseInt(e.target.value || "0", 10) })}
                />
              </div>
            </div>
            {festError && <p className="text-red-600 text-sm">{festError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 rounded-md text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50"
                disabled={festPending}
                onClick={async () => {
                  if (!festival) return;
                  setFestError(null);
                  setFestPending(true);
                  try {
                    const token = localStorage.getItem("token");
                    const payload: any = {
                      name: festival.name,
                      location: festival.location,
                      price: festival.price,
                      capacity_per_day: festival.capacity_per_day,
                    };
                    // Convert datetime-local to ISO if needed
                    if (festival.start_date) payload.start_date = new Date(festival.start_date).toISOString();
                    if (festival.end_date) payload.end_date = new Date(festival.end_date).toISOString();
                    const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/festival`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify(payload),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.detail || `Failed (${res.status})`);
                    }
                    // Refresh
                    const ref = await fetch(`${config.API_BASE_URL}/api/v1/admin/festival`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (ref.ok) {
                      const f2 = await ref.json();
                      setFestival({
                        name: f2.name || "",
                        location: f2.location || "",
                        start_date: f2.start_date || "",
                        end_date: f2.end_date || "",
                        price: typeof f2.price === "number" ? f2.price : parseFloat(f2.price || 0),
                        capacity_per_day:
                          typeof f2.capacity_per_day === "number" ? f2.capacity_per_day : parseInt(f2.capacity_per_day || 6, 10),
                      });
                    }
                  } catch (e: any) {
                    setFestError(e?.message || "Failed to save settings");
                  } finally {
                    setFestPending(false);
                  }
                }}
              >
                {festPending ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Loading festival settings...</p>
        )}
      </div>
      <div className="bg-white/90 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Booking (manual)</h2>
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select className="w-full border rounded p-2" value={createDayId} onChange={(e) => setCreateDayId(e.target.value)}>
              <option value="">Select a day</option>
              {days.map((d) => (
                <option key={d.day_id} value={d.day_id}>
                  {new Date(d.date).toLocaleDateString()} – {d.theme}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">User email</label>
            <input type="email" className="w-full border rounded p-2" placeholder="friend@example.com" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
          </div>
          <div>
            <button
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50"
              disabled={!createDayId || !createEmail || createPending}
              onClick={async () => {
                setErrorMsg(null);
                setCreatePending(true);
                try {
                  const token = localStorage.getItem("token");
                  const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/bookings`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ day_id: createDayId, email: createEmail }),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail || `Failed (${res.status})`);
                  }
                  const refresh = await fetch(`${config.API_BASE_URL}/api/v1/admin/bookings/by-day`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  const data = await refresh.json();
                  setDays(data.days || []);
                  setCreateEmail("");
                  setCreateDayId("");
                } catch (err: any) {
                  setErrorMsg(err?.message || "Failed to create booking");
                } finally {
                  setCreatePending(false);
                }
              }}
            >
              {createPending ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
        {errorMsg && <p className="text-red-600 text-sm mt-2">{errorMsg}</p>}
      </div>

      <div>
        <button
          className="px-4 py-2 rounded-md text-sm font-medium bg-orange-600 text-white hover:bg-orange-700"
          onClick={() => {
            setFormDate("");
            setFormTheme("");
            setFormMenu("");
            setFormCapacity(6);
            setShowAddModal(true);
          }}
        >
          Add Day
        </button>
      </div>
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
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200"
                onClick={() => {
                  const det = dayDetails[day.day_id];
                  setFormDate(formatForInput(det?.date || day.date));
                  setFormTheme(det?.theme || day.theme);
                  setFormMenu(det?.menu || "");
                  setFormCapacity(det?.capacity ?? day.capacity);
                  setOrigDate(det?.date || day.date);
                  setOrigCapacity(det?.capacity ?? day.capacity);
                  setOrigBookingsCount(day.bookings.length);
                  setShowEditModal(day.day_id);
                }}
              >
                Edit
              </button>
              <button
                className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  if (!confirm("Delete this day? This cannot be undone.")) return;
                  try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/days/${day.day_id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      alert(err.detail || `Failed (${res.status})`);
                      return;
                    }
                    const token2 = localStorage.getItem("token");
                    const [byDayRes, daysRes] = await Promise.all([
                      fetch(`${config.API_BASE_URL}/api/v1/admin/bookings/by-day`, { headers: { Authorization: `Bearer ${token2}` } }),
                      fetch(`${config.API_BASE_URL}/api/v1/admin/days`, { headers: { Authorization: `Bearer ${token2}` } }),
                    ]);
                    const bd = await byDayRes.json();
                    setDays(bd.days || []);
                    if (daysRes.ok) {
                      const ddet = await daysRes.json();
                      const map: Record<string, { date: string; theme: string; menu: string; capacity: number }> = {};
                      for (const d of ddet.items || []) {
                        map[d.day_id] = { date: d.date, theme: d.theme, menu: d.menu, capacity: d.capacity };
                      }
                      setDayDetails(map);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Delete
              </button>
            </div>
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

      {/* Modals */}
      <AddDayModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        formDate={formDate}
        formTheme={formTheme}
        formMenu={formMenu}
        formCapacity={formCapacity}
        setFormDate={setFormDate}
        setFormTheme={setFormTheme}
        setFormMenu={setFormMenu}
        setFormCapacity={setFormCapacity}
        pending={pending}
        onSave={async () => {
          if (!formDate || !formTheme) {
            alert("Please fill date and theme");
            return;
          }
          setPending(true);
          try {
            const token = localStorage.getItem("token");
            const iso = new Date(formDate).toISOString();
            const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/days`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ date: iso, theme: formTheme, menu: formMenu, capacity: formCapacity }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              alert(err.detail || `Failed (${res.status})`);
              return;
            }
            await refreshAdminData();
            setShowAddModal(false);
          } finally {
            setPending(false);
          }
        }}
      />

      <EditDayModal
        open={!!showEditModal}
        onClose={() => setShowEditModal(null)}
        formDate={formDate}
        formTheme={formTheme}
        formMenu={formMenu}
        formCapacity={formCapacity}
        setFormDate={setFormDate}
        setFormTheme={setFormTheme}
        setFormMenu={setFormMenu}
        setFormCapacity={setFormCapacity}
        pending={pending}
        onSave={async () => {
          if (!showEditModal) return;
          const nextIso = new Date(formDate).toISOString();
          let proceed = true;
          if (nextIso !== origDate) {
            proceed = confirm("Change the date for this day? Attendees are not notified automatically.");
          }
          if (!proceed) return;
          if (formCapacity < origCapacity && origBookingsCount > formCapacity) {
            proceed = confirm(`Reduce capacity below current bookings (${origBookingsCount})? This may overbook the day.`);
          }
          if (!proceed) return;
          setPending(true);
          try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${config.API_BASE_URL}/api/v1/admin/days/${showEditModal}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ date: nextIso, theme: formTheme, menu: formMenu, capacity: formCapacity }),
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              alert(err.detail || `Failed (${res.status})`);
              return;
            }
            await refreshAdminData();
            setShowEditModal(null);
          } finally {
            setPending(false);
          }
        }}
      />
    </div>
  );
};

export default Admin;

// Inline modals
// Add Day Modal
// Note: using basic JSX without external UI libs, minimal styles
export const AddDayModal: React.FC<{
  open: boolean;
  onClose: () => void;
  formDate: string;
  formTheme: string;
  formMenu: string;
  formCapacity: number;
  setFormDate: (v: string) => void;
  setFormTheme: (v: string) => void;
  setFormMenu: (v: string) => void;
  setFormCapacity: (n: number) => void;
  onSave: () => Promise<void> | void;
  pending: boolean;
}> = ({ open, onClose, formDate, formTheme, formMenu, formCapacity, setFormDate, setFormTheme, setFormMenu, setFormCapacity, onSave, pending }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Add Day</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date/time</label>
            <input type="datetime-local" className="w-full border rounded p-2" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
            <input type="text" className="w-full border rounded p-2" value={formTheme} onChange={(e) => setFormTheme(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Menu</label>
            <textarea className="w-full border rounded p-2" rows={5} value={formMenu} onChange={(e) => setFormMenu(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input type="number" min={1} className="w-full border rounded p-2" value={formCapacity} onChange={(e) => setFormCapacity(parseInt(e.target.value || '0', 10))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200" onClick={onClose} disabled={pending}>Cancel</button>
          <button className="px-4 py-2 rounded-md text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50" onClick={onSave} disabled={pending}>Save</button>
        </div>
      </div>
    </div>
  );
};

export const EditDayModal: React.FC<{
  open: boolean;
  onClose: () => void;
  formDate: string;
  formTheme: string;
  formMenu: string;
  formCapacity: number;
  setFormDate: (v: string) => void;
  setFormTheme: (v: string) => void;
  setFormMenu: (v: string) => void;
  setFormCapacity: (n: number) => void;
  onSave: () => Promise<void> | void;
  pending: boolean;
}> = ({ open, onClose, formDate, formTheme, formMenu, formCapacity, setFormDate, setFormTheme, setFormMenu, setFormCapacity, onSave, pending }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Edit Day</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date/time</label>
            <input type="datetime-local" className="w-full border rounded p-2" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
            <input type="text" className="w-full border rounded p-2" value={formTheme} onChange={(e) => setFormTheme(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Menu</label>
            <textarea className="w-full border rounded p-2" rows={5} value={formMenu} onChange={(e) => setFormMenu(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input type="number" min={1} className="w-full border rounded p-2" value={formCapacity} onChange={(e) => setFormCapacity(parseInt(e.target.value || '0', 10))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200" onClick={onClose} disabled={pending}>Cancel</button>
          <button className="px-4 py-2 rounded-md text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50" onClick={onSave} disabled={pending}>Save</button>
        </div>
      </div>
    </div>
  );
};