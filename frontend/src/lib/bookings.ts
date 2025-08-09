import { API_BASE_URL } from './auth';

export interface Booking {
  booking_id: string;
  user_id: string;
  day_id: string;
  festival_id: string;
  booking_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingRequest {
  day_id: string;
}

export const bookingsApi = {
  async createBooking(dayId: string): Promise<Booking> {
    console.log('createBooking called with dayId:', dayId);
    const token = localStorage.getItem('token');
    console.log('Token found:', !!token);
    if (!token) {
      throw new Error('No authentication token');
    }

    const url = `${API_BASE_URL}/api/v1/bookings/`;
    console.log('Making request to:', url);
    console.log('Request body:', { day_id: dayId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ day_id: dayId }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create booking';
      try {
        const error = await response.json();
        errorMessage = error.detail || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async getMyBooking(): Promise<Booking | null> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/bookings/my-booking`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      let errorMessage = 'Failed to get booking';
      try {
        const error = await response.json();
        errorMessage = error.detail || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async updateBooking(dayId: string): Promise<Booking> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/bookings/my-booking`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ day_id: dayId }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update booking';
      try {
        const error = await response.json();
        errorMessage = error.detail || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  async cancelBooking(): Promise<void> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/bookings/my-booking`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to cancel booking';
      try {
        const error = await response.json();
        errorMessage = error.detail || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
  },
}; 