import { api } from '@/services/Journey/scheduleapi';
import { Schedule, TimeFilter } from '@/types/Journey/schedule';
import { useEffect, useState } from 'react';

export function useSchedules(initialFilter: TimeFilter = 'today') {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [activeTab, setActiveTab] = useState<TimeFilter>(initialFilter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch schedules - only gets raw data, no filtering
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.schedules.getAll();
        
        
        
        setSchedules(data);
        console.log(`Fetched ${data.length} schedules`);
      } catch (err) {
        console.error("Failed to fetch schedules:", err);
        setError("Failed to load schedules. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  // Filter schedules based on active tab
  useEffect(() => {
    if (schedules.length === 0) return;
    
    
    
    // Get current date/time in Sri Lanka time zone (UTC+5:30)
    const now = new Date();
    const sriLankaOffset = 5.5 * 60 * 60 * 1000;
    const sriLankaTime = new Date(now.getTime() + sriLankaOffset);
    
    console.log("Current Sri Lanka time:", sriLankaTime.toISOString());
    
    const currentDay = sriLankaTime.getDate();
    const currentMonth = sriLankaTime.getMonth() + 1; // +1 because getMonth() returns 0-11
    const currentYear = sriLankaTime.getFullYear();
    
    // Format today's date as MM/DD/YYYY for direct string comparison
    const todayFormatted = `${currentMonth.toString().padStart(2, '0')}/${currentDay.toString().padStart(2, '0')}/${currentYear}`;
    
    // Check if a date string is today's date
    const isToday = (dateStr: string): boolean => {
      // Simple string comparison - much more reliable!
      const result = dateStr.trim() === todayFormatted;
      return result;
    };
    
    // Apply filters based on active tab
    switch (activeTab) {
      case 'today':
        // Today's schedules that aren't completed
        const todaySchedules = schedules.filter(schedule => {
          try {
            const isDateToday = isToday(schedule.date);
            const notCompleted = schedule.status !== 'completed';
            const result = isDateToday && notCompleted;

            return result;
          } catch (error) {
            
            return false;
          }
        });
        
       
        setFilteredSchedules(todaySchedules);
        break;
        
      case 'upcoming':
        // Show schedules with status 'upcoming'
        const upcomingSchedules = schedules.filter(schedule => schedule.status === 'upcoming');
        setFilteredSchedules(upcomingSchedules);
        break;
        
      case 'past':
        // Completed schedules
        const pastSchedules = schedules.filter(schedule => {
          const isCompleted = schedule.status === 'completed';
          if (isCompleted) {
            console.log(`Schedule ${schedule.id} is completed`);
          }
          return isCompleted;
        });
        
       
        setFilteredSchedules(pastSchedules);
        break;
        
      default:
        setFilteredSchedules(schedules);
    }
  }, [activeTab, schedules]);

  return {
    schedules,
    filteredSchedules,
    loading,
    error,
    activeTab,
    setActiveTab,
    setError,
  };
}