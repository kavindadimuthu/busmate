export type Schedule = {
  id: string;
  from: string;
  to: string;
  busNumber: string;
  startTime: string;  // Format: "09:00 AM"
  endTime: string;    // Format: "02:30 PM"
  date: string;       // Format: "Jun 24, 2025"
  seatsOccupied: number;
  totalSeats: number;
  status: 'ongoing' | 'upcoming' | 'completed';
};

export type TimeFilter = 'today' | 'upcoming' | 'past';