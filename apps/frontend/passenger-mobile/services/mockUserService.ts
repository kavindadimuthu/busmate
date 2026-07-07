import mockUserData from '@/data/mockUserData.json';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  profileImage?: string;
  role: string;
  app_role: string;
  memberSince: string;
  emailVerified: boolean;
  dob?: string;
  address?: string;
  city?: string;
  totalTrips: number;
  savedRoutes: number;
  walletBalance: number;
  travelCardNumber?: string;
  travelCardStatus: string;
  language: string;
  upcomingTrips: any[];
  recentTickets: any[];
  favoriteRoutes: any[];
  recentRoutes: any[];
}

export class MockUserService {
  static getUserByEmail(email: string): MockUser | null {
    const userData = mockUserData.users[email as keyof typeof mockUserData.users];
    return userData || null;
  }

  static getAllUsers(): MockUser[] {
    return Object.values(mockUserData.users);
  }

  static getUpcomingTrip(email: string) {
    const user = this.getUserByEmail(email);
    return user?.upcomingTrips?.[0] || null;
  }

  static getRecentTickets(email: string) {
    const user = this.getUserByEmail(email);
    return user?.recentTickets || [];
  }

  static getFavoriteRoutes(email: string) {
    const user = this.getUserByEmail(email);
    return user?.favoriteRoutes || [];
  }

  static getRecentRoutes(email: string) {
    const user = this.getUserByEmail(email);
    return user?.recentRoutes || [];
  }

  static getTicketById(email: string, ticketId: string) {
    const user = this.getUserByEmail(email);
    if (!user) return null;

    // Look in both upcoming trips and recent tickets
    const allTickets = [...(user.upcomingTrips || []), ...(user.recentTickets || [])];
    return allTickets.find(ticket => ticket.id === ticketId) || null;
  }
}