import { STAFF_API_BASE } from '@/lib/constants';
import { getUserFromToken } from '@/lib/utils/jwtHandler';

export interface ConductorProfile {
    userId: string;
    fullName: string;
    username: string;
    email: string;
    role: string;
    accountStatus: string;
    isVerified: boolean;
    phoneNumber: string;
    employee_id: string;
    assign_operator_id: string;
    shift_status: string;
    nicNumber: string;
    dateOfBirth: string;
    gender: string;
    pr_img_path: string;
    password?: string;
}

export interface DriverProfile {
    userId: string;
    fullName: string;
    username: string;
    email: string;
    role: string;
    accountStatus: string;
    isVerified: boolean;
    phoneNumber: string;
    employee_id: string;
    assign_operator_id: string;
    shift_status: string;
    nicNumber: string;
    dateOfBirth: string;
    gender: string;
    pr_img_path: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    password?: string;
}

export type StaffProfile = ConductorProfile | DriverProfile;

export interface StaffListItem {
    id: string;
    name: string;
    role: 'Driver' | 'Conductor';
    nic: string;
    phone: string;
    email: string;
    employeeId: string;
    status: string;
    shiftStatus: string;
    avatar: string;
}

export interface StaffStats {
    totalStaff: number;
    totalDrivers: number;
    totalConductors: number;
    assignedToday: number;
}

class StaffManagementService {
    private baseUrl: string;

    constructor() {
        // Use the user-management proxy to avoid CORS in the browser
        this.baseUrl = STAFF_API_BASE;
    }

    /**
     * Get all conductors for the operator
     */
    async getConductors(token: string): Promise<ConductorProfile[]> {
        try {
            if (!token) {
                throw new Error('Missing access token');
            }

            // Get operator ID from token
            const userFromToken = getUserFromToken(token);
            const operatorId = userFromToken?.id;

            const response = await fetch(`${this.baseUrl}/api/conductor/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch conductors: ${response.statusText}`);
            }

            const data = await response.json();
            const allConductors = Array.isArray(data) ? data : [];

            // Filter to only show conductors assigned to this operator
            if (operatorId) {
                return allConductors.filter(conductor => conductor.assign_operator_id === operatorId);
            }

            // If no operator ID found, return all (shouldn't happen in production)
            return allConductors;
        } catch (error) {
            console.error('Error fetching conductors:', error);
            throw error;
        }
    }

    /**
     * Get all drivers for the operator (using mock data until API is ready)
     */
    async getDrivers(token: string): Promise<DriverProfile[]> {
        // Get operator ID from token
        const userFromToken = getUserFromToken(token);
        const operatorId = userFromToken?.id;

        // Mock data for drivers until API is ready
        const allDrivers: DriverProfile[] = [
            {
                userId: '1',
                fullName: 'Kasun Perera',
                username: 'kasun.perera',
                email: 'kasun@example.com',
                role: 'Driver',
                accountStatus: 'active',
                isVerified: true,
                phoneNumber: '+94 77 123 4567',
                employee_id: 'DRV001',
                assign_operator_id: 'OP001',
                shift_status: 'assigned',
                nicNumber: '912345678V',
                dateOfBirth: '1991-05-15',
                gender: 'Male',
                pr_img_path: '/placeholder.svg?height=40&width=40',
                licenseNumber: 'DL123456',
                licenseExpiry: '2026-05-15',
            },
            {
                userId: '3',
                fullName: 'Chaminda Fernando',
                username: 'chaminda.fernando',
                email: 'chaminda@example.com',
                role: 'Driver',
                accountStatus: 'active',
                isVerified: true,
                phoneNumber: '+94 77 345 6789',
                employee_id: 'DRV002',
                assign_operator_id: 'OP001',
                shift_status: 'assigned',
                nicNumber: '892345671V',
                dateOfBirth: '1989-08-22',
                gender: 'Male',
                pr_img_path: '/placeholder.svg?height=40&width=40',
                licenseNumber: 'DL234567',
                licenseExpiry: '2025-12-10',
            },
            {
                userId: '5',
                fullName: 'Pradeep Kumara',
                username: 'pradeep.kumara',
                email: 'pradeep@example.com',
                role: 'Driver',
                accountStatus: 'active',
                isVerified: true,
                phoneNumber: '+94 77 567 8901',
                employee_id: 'DRV003',
                assign_operator_id: 'OP001',
                shift_status: 'assigned',
                nicNumber: '872345673V',
                dateOfBirth: '1987-03-18',
                gender: 'Male',
                pr_img_path: '/placeholder.svg?height=40&width=40',
                licenseNumber: 'DL345678',
                licenseExpiry: '2027-01-20',
            },
            {
                userId: '7',
                fullName: 'Dinesh Bandara',
                username: 'dinesh.bandara',
                email: 'dinesh@example.com',
                role: 'Driver',
                accountStatus: 'active',
                isVerified: true,
                phoneNumber: '+94 77 789 0123',
                employee_id: 'DRV004',
                assign_operator_id: 'OP001',
                shift_status: 'assigned',
                nicNumber: '852345675V',
                dateOfBirth: '1985-11-05',
                gender: 'Male',
                pr_img_path: '/placeholder.svg?height=40&width=40',
                licenseNumber: 'DL456789',
                licenseExpiry: '2026-09-15',
            },
        ];

        // Filter to only show drivers assigned to this operator
        if (operatorId) {
            return Promise.resolve(allDrivers.filter(driver => driver.assign_operator_id === operatorId));
        }

        // If no operator ID found, return all (shouldn't happen in production)
        return Promise.resolve(allDrivers);
    }

    /**
     * Get all staff (drivers + conductors)
     */
    async getAllStaff(token: string): Promise<StaffListItem[]> {
        try {
            const [drivers, conductors] = await Promise.all([
                this.getDrivers(token),
                this.getConductors(token),
            ]);

            const driversList: StaffListItem[] = drivers.map(driver => ({
                id: driver.userId,
                name: driver.fullName,
                role: 'Driver' as const,
                nic: driver.nicNumber,
                phone: driver.phoneNumber,
                email: driver.email,
                employeeId: driver.employee_id,
                status: driver.accountStatus,
                shiftStatus: driver.shift_status,
                avatar: driver.pr_img_path,
            }));

            const conductorsList: StaffListItem[] = conductors.map(conductor => ({
                id: conductor.userId,
                name: conductor.fullName,
                role: 'Conductor' as const,
                nic: conductor.nicNumber,
                phone: conductor.phoneNumber,
                email: conductor.email,
                employeeId: conductor.employee_id,
                status: conductor.accountStatus,
                shiftStatus: conductor.shift_status,
                avatar: conductor.pr_img_path,
            }));

            return [...driversList, ...conductorsList];
        } catch (error) {
            console.error('Error fetching all staff:', error);
            throw error;
        }
    }

    /**
     * Get staff statistics
     */
    async getStaffStats(token: string): Promise<StaffStats> {
        try {
            const allStaff = await this.getAllStaff(token);

            const drivers = allStaff.filter(s => s.role === 'Driver');
            const conductors = allStaff.filter(s => s.role === 'Conductor');
            const assigned = allStaff.filter(s => s.shiftStatus === 'assigned');

            return {
                totalStaff: allStaff.length,
                totalDrivers: drivers.length,
                totalConductors: conductors.length,
                assignedToday: assigned.length,
            };
        } catch (error) {
            console.error('Error fetching staff stats:', error);
            throw error;
        }
    }

    /**
     * Get single staff member by ID
     */
    async getStaffById(token: string, userId: string, role: 'Driver' | 'Conductor'): Promise<StaffProfile | null> {
        try {
            if (role === 'Conductor') {
                const conductors = await this.getConductors(token);
                return conductors.find(c => c.userId === userId) || null;
            } else {
                const drivers = await this.getDrivers(token);
                return drivers.find(d => d.userId === userId) || null;
            }
        } catch (error) {
            console.error('Error fetching staff by ID:', error);
            throw error;
        }
    }

    /**
     * Delete a staff member
     */
    async deleteStaff(token: string, userId: string, role: 'Driver' | 'Conductor'): Promise<void> {
        const endpoint = role === 'Conductor'
            ? `/api/conductor/profile/${userId}`
            : `/api/driver/profile/${userId}`;

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const statusText = `${response.status} ${response.statusText}`
                const bodyText = await response.text().catch(() => '')
                throw new Error(`Failed to delete ${role}: ${statusText}${bodyText ? ` - ${bodyText}` : ''}`);
            }
        } catch (error) {
            console.error(`Error deleting ${role}:`, error);
            throw error;
        }
    }

    /**
     * Register a new conductor
     */
    async registerConductor(token: string, data: Omit<ConductorProfile, 'userId'>): Promise<ConductorProfile> {
        try {
            if (!token) {
                throw new Error('Missing access token');
            }
            const response = await fetch(`${this.baseUrl}/api/conductor/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`Failed to register conductor: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`);
            }

            // Some backends return plain text like "success" instead of JSON.
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                return await response.json();
            }
            // Fallback: return an object with the raw text message
            const text = await response.text();
            return { message: text } as unknown as ConductorProfile;
        } catch (error) {
            console.error('Error registering conductor:', error);
            throw error;
        }
    }

    /**
     * Register a new driver (mock until API is ready)
     */
    async registerDriver(token: string, data: Omit<DriverProfile, 'userId'>): Promise<DriverProfile> {
        // Mock registration for now
        console.log('Mock register driver:', data);
        const newDriver: DriverProfile = {
            userId: Math.random().toString(36).substr(2, 9),
            ...data,
        };
        return Promise.resolve(newDriver);
    }

    /**
     * Update conductor profile
     */
    async updateConductor(token: string, userId: string, data: Partial<ConductorProfile>): Promise<ConductorProfile> {
        try {
            const response = await fetch(`${this.baseUrl}/api/conductor/profile/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const bodyText = await response.text().catch(() => '');
                throw new Error(`Failed to update conductor: ${response.status} ${response.statusText}${bodyText ? ` - ${bodyText}` : ''}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating conductor:', error);
            throw error;
        }
    }

    /**
     * Update driver profile (mock until API is ready)
     */
    async updateDriver(token: string, userId: string, data: Partial<DriverProfile>): Promise<DriverProfile> {
        // Mock update for now
        console.log('Mock update driver:', userId, data);
        const drivers = await this.getDrivers(token);
        const driver = drivers.find(d => d.userId === userId);
        if (!driver) {
            throw new Error('Driver not found');
        }
        return { ...driver, ...data };
    }
}

export const staffManagementService = new StaffManagementService();
