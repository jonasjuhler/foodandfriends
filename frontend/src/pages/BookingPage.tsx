import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { bookingsApi, Booking } from "../lib/bookings";

interface Day {
  id: string;
  date: string;
  theme: string;
  menu: string;
  tickets_sold: number;
  capacity: number;
  available: number;
}

const BookingPage: React.FC = () => {
  const { state } = useAuth();
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [myBooking, setMyBooking] = useState<Booking | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchDays = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/festival/days"
        );
        const data = await response.json();
        setDays(data);
      } catch (error) {
        console.error("Error fetching festival days:", error);
        // Fallback data for development
        setDays([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchMyBooking = async () => {
      if (state.isAuthenticated) {
        try {
          const booking = await bookingsApi.getMyBooking();
          setMyBooking(booking);
        } catch (error) {
          console.error("Error fetching my booking:", error);
        }
      }
    };

    fetchDays();
    fetchMyBooking();
  }, [state.isAuthenticated]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-white text-lg">Loading booking details...</div>
      </div>
    );
  }

  const toggleDay = (dayId: string) => {
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  const handleBooking = async (dayId: string) => {
    console.log("handleBooking called with dayId:", dayId);
    console.log("Authentication state:", state.isAuthenticated);
    console.log("Token:", localStorage.getItem("token"));

    if (!state.isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    setBookingLoading(true);
    try {
      if (myBooking) {
        console.log("Updating existing booking...");
        // Update existing booking
        await bookingsApi.updateBooking(dayId);
        const updatedBooking = await bookingsApi.getMyBooking();
        setMyBooking(updatedBooking);
      } else {
        console.log("Creating new booking...");
        // Create new booking
        await bookingsApi.createBooking(dayId);
        const newBooking = await bookingsApi.getMyBooking();
        setMyBooking(newBooking);
      }

      // Refresh days to update availability
      const response = await fetch(
        "http://localhost:8000/api/v1/festival/days"
      );
      const data = await response.json();
      setDays(data);
    } catch (error) {
      console.error("Booking error:", error);
      alert(error instanceof Error ? error.message : "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!myBooking) return;

    setBookingLoading(true);
    try {
      await bookingsApi.cancelBooking();
      setMyBooking(null);

      // Refresh days to update availability
      const response = await fetch(
        "http://localhost:8000/api/v1/festival/days"
      );
      const data = await response.json();
      setDays(data);
    } catch (error) {
      console.error("Cancel booking error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to cancel booking"
      );
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {days.map((day) => (
        <div
          key={day.id}
          className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden"
        >
          {/* Day Header - Always Visible */}
          <button
            onClick={() => toggleDay(day.id)}
            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {formatDate(day.date)}
                  {myBooking && myBooking.day_id === day.id && (
                    <span className="ml-2 text-green-600 font-medium">
                      ✓ Your booking
                    </span>
                  )}
                </h3>
                <h4 className="text-lg font-medium text-gray-900 mt-1">
                  {day.theme}
                </h4>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  {day.available > 0 ? (
                    <span className="text-gray-900 font-medium">
                      {day.available} available
                    </span>
                  ) : (
                    <span className="text-gray-600 font-medium">Sold out</span>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    expandedDay === day.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </button>

          {/* Expandable Content */}
          {expandedDay === day.id && (
            <div className="px-6 pb-6 border-t border-gray-200">
              <div className="pt-4 space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    Menu
                  </h5>
                  <p className="text-gray-700 text-sm mb-4">{day.menu}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {myBooking && myBooking.day_id === day.id ? (
                        <button
                          onClick={handleCancelBooking}
                          disabled={bookingLoading}
                          className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {bookingLoading ? "Cancelling..." : "Cancel Booking"}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleBooking(day.id)}
                            disabled={
                              day.available === 0 ||
                              bookingLoading ||
                              (myBooking !== null &&
                                myBooking.day_id !== day.id) ||
                              !state.isAuthenticated
                            }
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              day.available > 0 &&
                              (myBooking === null ||
                                myBooking.day_id === day.id) &&
                              state.isAuthenticated
                                ? "bg-gray-800 text-white hover:bg-gray-900"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            } disabled:opacity-50`}
                          >
                            {bookingLoading
                              ? "Booking..."
                              : day.available > 0
                              ? "Book Ticket"
                              : "Sold Out"}
                          </button>
                          {!state.isAuthenticated && (
                            <span className="text-sm text-gray-600">
                              <a
                                href="/login"
                                className="text-orange-600 hover:text-orange-700 underline"
                              >
                                Log in
                              </a>{" "}
                              to book your spot
                            </span>
                          )}
                          {myBooking !== null &&
                            myBooking.day_id !== day.id && (
                              <span className="text-sm text-gray-600">
                                You already have a booking on another day
                              </span>
                            )}
                        </>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      50 DKK
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BookingPage;
