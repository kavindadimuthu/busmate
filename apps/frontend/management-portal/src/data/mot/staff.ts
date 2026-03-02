// Sample data for staff members - replace with API calls when backend is ready

export type StaffType = 'timekeeper' | 'inspector';
export type StaffStatus = 'active' | 'inactive';

export interface StaffMember {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    nic: string;
    province: string;
    staffType: StaffType;
    assignedLocation: string;
    status: StaffStatus;
    createdAt: string;
    updatedAt: string;
}

export interface StaffStatistics {
    totalStaff: number;
    activeStaff: number;
    inactiveStaff: number;
    totalTimekeepers: number;
    totalInspectors: number;
    provincesCount: number;
}

export interface StaffFilterOptions {
    statuses: StaffStatus[];
    staffTypes: StaffType[];
    provinces: string[];
    locations: string[];
}

export interface StaffFormData {
    fullName: string;
    phone: string;
    email: string;
    nic: string;
    province: string;
    staffType: StaffType;
    assignedLocation: string;
    status: StaffStatus;
}

const sampleStaff: StaffMember[] = [
    {
        id: 'STF001',
        fullName: 'Kamal Perera',
        phone: '0771234567',
        email: 'kamal.perera@busmate.lk',
        nic: '199012345678',
        province: 'Western',
        staffType: 'timekeeper',
        assignedLocation: 'Colombo Fort Bus Stand',
        status: 'active',
        createdAt: '2024-01-15',
        updatedAt: '2024-06-10',
    },
    {
        id: 'STF002',
        fullName: 'Nimal Jayawardena',
        phone: '0712345678',
        email: 'nimal.jayawardena@busmate.lk',
        nic: '198567891234',
        province: 'Central',
        staffType: 'inspector',
        assignedLocation: 'Kandy Bus Terminal',
        status: 'active',
        createdAt: '2024-02-20',
        updatedAt: '2024-07-15',
    },
    {
        id: 'STF003',
        fullName: 'Sunil Fernando',
        phone: '0761234567',
        email: 'sunil.fernando@busmate.lk',
        nic: '198212345678',
        province: 'Southern',
        staffType: 'timekeeper',
        assignedLocation: 'Galle Bus Stand',
        status: 'active',
        createdAt: '2024-03-10',
        updatedAt: '2024-08-05',
    },
    {
        id: 'STF004',
        fullName: 'Ranjith Silva',
        phone: '0751234567',
        email: 'ranjith.silva@busmate.lk',
        nic: '199112345678',
        province: 'North Western',
        staffType: 'inspector',
        assignedLocation: 'Kurunegala Bus Terminal',
        status: 'inactive',
        createdAt: '2024-01-25',
        updatedAt: '2024-05-20',
    },
    {
        id: 'STF005',
        fullName: 'Chaminda Wijesinghe',
        phone: '0781234567',
        email: 'chaminda.wijesinghe@busmate.lk',
        nic: '198812345678',
        province: 'Western',
        staffType: 'timekeeper',
        assignedLocation: 'Pettah Bus Stand',
        status: 'active',
        createdAt: '2024-04-05',
        updatedAt: '2024-09-12',
    },
    {
        id: 'STF006',
        fullName: 'Lakshman Dias',
        phone: '0741234567',
        email: 'lakshman.dias@busmate.lk',
        nic: '197612345678',
        province: 'Sabaragamuwa',
        staffType: 'inspector',
        assignedLocation: 'Ratnapura Bus Terminal',
        status: 'active',
        createdAt: '2024-02-15',
        updatedAt: '2024-07-25',
    },
    {
        id: 'STF007',
        fullName: 'Anura Bandara',
        phone: '0721234567',
        email: 'anura.bandara@busmate.lk',
        nic: '199512345678',
        province: 'Central',
        staffType: 'timekeeper',
        assignedLocation: 'Matale Bus Stand',
        status: 'inactive',
        createdAt: '2024-05-10',
        updatedAt: '2024-10-01',
    },
    {
        id: 'STF008',
        fullName: 'Pradeep Kumara',
        phone: '0701234567',
        email: 'pradeep.kumara@busmate.lk',
        nic: '198312345678',
        province: 'Uva',
        staffType: 'inspector',
        assignedLocation: 'Badulla Bus Terminal',
        status: 'active',
        createdAt: '2024-03-20',
        updatedAt: '2024-08-18',
    },
    {
        id: 'STF009',
        fullName: 'Saman Kumara',
        phone: '0791234567',
        email: 'saman.kumara@busmate.lk',
        nic: '199312345678',
        province: 'Western',
        staffType: 'timekeeper',
        assignedLocation: 'Kaduwela Bus Stand',
        status: 'active',
        createdAt: '2024-06-01',
        updatedAt: '2024-11-05',
    },
    {
        id: 'STF010',
        fullName: 'Dinesh Weerasinghe',
        phone: '0731234567',
        email: 'dinesh.weerasinghe@busmate.lk',
        nic: '198012345678',
        province: 'North Central',
        staffType: 'inspector',
        assignedLocation: 'Anuradhapura Bus Terminal',
        status: 'active',
        createdAt: '2024-04-12',
        updatedAt: '2024-09-22',
    },
    {
        id: 'STF011',
        fullName: 'Ruwan Jayasuriya',
        phone: '0711234568',
        email: 'ruwan.jayasuriya@busmate.lk',
        nic: '198712345678',
        province: 'Southern',
        staffType: 'timekeeper',
        assignedLocation: 'Matara Bus Stand',
        status: 'active',
        createdAt: '2024-07-15',
        updatedAt: '2024-12-01',
    },
    {
        id: 'STF012',
        fullName: 'Mahinda Rajapaksha',
        phone: '0761234568',
        email: 'mahinda.rajapaksha@busmate.lk',
        nic: '197812345678',
        province: 'Eastern',
        staffType: 'inspector',
        assignedLocation: 'Batticaloa Bus Terminal',
        status: 'inactive',
        createdAt: '2024-05-20',
        updatedAt: '2024-10-15',
    },
];

// --- Service functions (mirror API service pattern for easy swap) ---

export function getStaffMembers(): StaffMember[] {
    return sampleStaff;
}

export function getStaffMemberById(id: string): StaffMember | undefined {
    return sampleStaff.find((s) => s.id === id);
}

export function getStaffMembersByType(type: StaffType): StaffMember[] {
    return sampleStaff.filter((s) => s.staffType === type);
}

export function getStaffStatistics(): StaffStatistics {
    const staff = sampleStaff;
    return {
        totalStaff: staff.length,
        activeStaff: staff.filter((s) => s.status === 'active').length,
        inactiveStaff: staff.filter((s) => s.status === 'inactive').length,
        totalTimekeepers: staff.filter((s) => s.staffType === 'timekeeper').length,
        totalInspectors: staff.filter((s) => s.staffType === 'inspector').length,
        provincesCount: new Set(staff.map((s) => s.province)).size,
    };
}

export function getStaffFilterOptions(): StaffFilterOptions {
    const staff = sampleStaff;
    return {
        statuses: [...new Set(staff.map((s) => s.status))] as StaffStatus[],
        staffTypes: [...new Set(staff.map((s) => s.staffType))] as StaffType[],
        provinces: [...new Set(staff.map((s) => s.province))],
        locations: [...new Set(staff.map((s) => s.assignedLocation))],
    };
}
