import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { bookingsApi, Booking } from "../lib/bookings";
import { usersApi } from "../lib/auth";

const Profile: React.FC = () => {
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const [myBooking, setMyBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState<boolean>(state.user?.email_opt_in ?? true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const booking = await bookingsApi.getMyBooking();
        setMyBooking(booking);
      } catch (error) {
        console.error("Error fetching booking:", error);
      } finally {
        setLoading(false);
      }
    };

    if (state.isAuthenticated) {
      fetchBooking();
    }
  }, [state.isAuthenticated]);

  useEffect(() => {
    // Keep local toggle in sync if user changes (e.g., after reload)
    setEmailOptIn(state.user?.email_opt_in ?? true);
  }, [state.user?.email_opt_in]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleEmailOptToggle = async () => {
    if (!state.token) return;
    setSavingPrefs(true);
    try {
      const next = !emailOptIn;
      await usersApi.updateProfile(state.token, { email_opt_in: next });
      setEmailOptIn(next);
    } catch (e) {
      console.error("Failed to update email preference", e);
    } finally {
      setSavingPrefs(false);
    }
  };

  // Show loading while fetching data
  if (loading && state.isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8">
          <div className="text-center">
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!state.isAuthenticated) {
    navigate("/login");
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8">
          <div className="text-center">
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-600">
                {state.user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {state.user?.name}
              </h2>
              <p className="text-gray-600">{state.user?.email}</p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <p className="text-gray-900">{state.user?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{state.user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-gray-900">
                  {state.user?.created_at
                    ? new Date(state.user.created_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email notifications
                  </label>
                  <p className="text-gray-600 text-sm">
                    Receive booking confirmations and updates by email.
                  </p>
                </div>
                <button
                  onClick={handleEmailOptToggle}
                  disabled={savingPrefs}
                  className={`px-3 py-2 rounded-lg border ${
                    emailOptIn
                      ? "bg-green-600 text-white border-green-700"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {emailOptIn ? "On" : "Off"}
                </button>
              </div>
            </div>
          </div>

          {/* My Bookings Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              My Bookings
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading booking details...</p>
              </div>
            ) : myBooking ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Festival Day Booking
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Booked on{" "}
                        {new Date(myBooking.booking_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status:{" "}
                        <span className="text-green-600 font-medium">
                          {myBooking.status}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        50 DKK
                      </p>
                      <p className="text-xs text-gray-500">Paid</p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    View Festival Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  No bookings yet.
                  <a
                    href="/"
                    className="text-orange-600 hover:text-orange-700 ml-1"
                  >
                    Book your spot now!
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
