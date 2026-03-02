// Sample data for policies - replace with API calls when backend is ready

export interface Policy {
    id: string;
    title: string;
    type: string;
    category: string;
    description: string;
    content: string;
    status: 'Published' | 'Draft' | 'Under Review' | 'Archived';
    version: string;
    author: string;
    department: string;
    effectiveDate: string;
    expiryDate: string | null;
    publishedDate: string;
    lastModified: string;
    createdAt: string;
    tags: string[];
    priority: 'High' | 'Medium' | 'Low';
    documentUrl: string | null;
}

export interface PolicyStatistics {
    totalPolicies: number;
    publishedPolicies: number;
    draftPolicies: number;
    underReviewPolicies: number;
    archivedPolicies: number;
    highPriorityPolicies: number;
}

export interface PolicyFilterOptions {
    statuses: string[];
    types: string[];
    departments: string[];
    priorities: string[];
    categories: string[];
}

const samplePolicies: Policy[] = [
    {
        id: 'POL001',
        title: 'Bus Operational Guidelines 2024',
        type: 'Operational',
        category: 'Operations',
        description: 'Comprehensive guidelines for bus operations, safety protocols, and service standards.',
        content: `# Bus Operational Guidelines 2024

## 1. Introduction

This policy document outlines the operational guidelines for all public bus services operating within the transportation network. These guidelines are designed to ensure safe, efficient, and reliable public transportation services.

## 2. General Guidelines

### 2.1 Service Standards
- All buses must maintain punctuality within ±5 minutes of scheduled times
- Vehicle cleanliness and maintenance standards must be upheld
- Professional conduct is required from all drivers and conductors
- Passenger safety protocols must be strictly followed

## 3. Safety Requirements

- Emergency exits must be clearly marked and unobstructed
- First aid kits and fire extinguishers must be present and functional
- Driver fatigue management protocols must be implemented
- Regular vehicle safety inspections are mandatory

## 4. Driver Qualifications

All bus drivers must meet the following minimum requirements:
- Valid commercial driving license with appropriate endorsements
- Minimum 3 years of professional driving experience
- Clean driving record for the past 2 years
- Completion of defensive driving course

## 5. Vehicle Standards

### Engine Requirements
- Euro 4 emission standards minimum
- Regular emission testing required

### Safety Features
- ABS braking system mandatory
- GPS tracking system required
- CCTV surveillance system

## 6. Compliance and Enforcement

Non-compliance with these guidelines may result in penalties including fines, license suspension, or permit revocation.`,
        status: 'Published',
        version: 'v2.1',
        author: 'Transport Authority',
        department: 'Operations Division',
        effectiveDate: '2024-02-01',
        expiryDate: '2025-12-31',
        publishedDate: '2024-01-15',
        lastModified: '2024-01-20',
        createdAt: '2024-01-10',
        tags: ['transport', 'operations', 'safety', 'guidelines'],
        priority: 'High',
        documentUrl: 'https://example.com/bus-guidelines-2024.pdf',
    },
    {
        id: 'POL002',
        title: 'Safety Standards for Public Transport',
        type: 'Safety',
        category: 'Compliance',
        description: 'Mandatory safety standards and protocols for all public transport vehicles.',
        content: `# Safety Standards for Public Transport

## Overview
This policy establishes the minimum safety standards that must be adhered to by all public transport vehicles and operators.

## Vehicle Safety
- Annual safety inspections are mandatory
- Fire suppression systems must be installed
- Emergency exit signage must be illuminated

## Passenger Safety
- Maximum passenger capacity must not be exceeded
- Standing passengers must have access to handrails
- Priority seating must be designated for elderly and disabled passengers`,
        status: 'Published',
        version: 'v1.3',
        author: 'Safety Department',
        department: 'Safety & Compliance',
        effectiveDate: '2024-02-15',
        expiryDate: '2025-06-30',
        publishedDate: '2024-02-01',
        lastModified: '2024-02-05',
        createdAt: '2024-01-20',
        tags: ['safety', 'standards', 'compliance'],
        priority: 'High',
        documentUrl: null,
    },
    {
        id: 'POL003',
        title: 'Driver Licensing Requirements',
        type: 'Licensing',
        category: 'Human Resources',
        description: 'Updated requirements and procedures for driver licensing and certification.',
        content: `# Driver Licensing Requirements

## Scope
This policy covers all licensing requirements for bus drivers operating public transport vehicles.

## Requirements
- Valid Class B or higher commercial driving license
- Medical fitness certificate (renewed annually)
- Background check clearance
- Completion of approved training program`,
        status: 'Draft',
        version: 'v1.0',
        author: 'HR Department',
        department: 'Human Resources',
        effectiveDate: '2024-04-01',
        expiryDate: null,
        publishedDate: '2024-03-10',
        lastModified: '2024-03-12',
        createdAt: '2024-03-01',
        tags: ['licensing', 'drivers', 'certification'],
        priority: 'Medium',
        documentUrl: null,
    },
    {
        id: 'POL004',
        title: 'Environmental Compliance Guidelines',
        type: 'Environmental',
        category: 'Compliance',
        description: 'Guidelines for environmental compliance including emission standards and waste management.',
        content: `# Environmental Compliance Guidelines

## Purpose
To establish environmental standards for all transport operations to minimize ecological impact.

## Emission Standards
- All vehicles must meet Euro 4 standards
- Annual emission testing required
- Electric/hybrid vehicle adoption targets

## Waste Management
- Proper disposal of automotive waste
- Recycling program for vehicle parts`,
        status: 'Published',
        version: 'v1.2',
        author: 'Environmental Unit',
        department: 'Environmental Affairs',
        effectiveDate: '2024-02-01',
        expiryDate: '2025-12-31',
        publishedDate: '2024-01-25',
        lastModified: '2024-01-30',
        createdAt: '2024-01-15',
        tags: ['environment', 'emissions', 'compliance'],
        priority: 'Medium',
        documentUrl: 'https://example.com/environmental-guidelines.pdf',
    },
    {
        id: 'POL005',
        title: 'Fare Structure Policy 2024',
        type: 'Financial',
        category: 'Finance',
        description: 'Comprehensive fare structure including base rates, distance-based pricing, and concessions.',
        content: `# Fare Structure Policy 2024

## Overview
This policy defines the fare structure for all public transport services.

## Base Fare
- Minimum fare: LKR 30
- Per kilometer rate: LKR 3.50

## Concessions
- Students: 50% discount
- Senior citizens: 25% discount
- Disabled passengers: Free travel`,
        status: 'Under Review',
        version: 'v2.0',
        author: 'Finance Department',
        department: 'Finance',
        effectiveDate: '2024-03-01',
        expiryDate: '2024-12-31',
        publishedDate: '2024-02-15',
        lastModified: '2024-02-20',
        createdAt: '2024-02-10',
        tags: ['fare', 'pricing', 'concessions'],
        priority: 'High',
        documentUrl: null,
    },
    {
        id: 'POL006',
        title: 'Emergency Response Procedures',
        type: 'Safety',
        category: 'Operations',
        description: 'Standardized procedures for handling emergencies during bus operations.',
        content: `# Emergency Response Procedures

## Emergency Types
- Vehicle breakdown
- Traffic accident
- Medical emergency
- Natural disaster
- Security threat

## Response Protocol
1. Ensure passenger safety
2. Contact emergency services
3. Notify operations center
4. Secure the vehicle
5. Document the incident`,
        status: 'Published',
        version: 'v1.1',
        author: 'Emergency Response Team',
        department: 'Safety & Compliance',
        effectiveDate: '2024-04-01',
        expiryDate: '2025-03-31',
        publishedDate: '2024-03-20',
        lastModified: '2024-03-25',
        createdAt: '2024-03-10',
        tags: ['emergency', 'response', 'safety'],
        priority: 'High',
        documentUrl: null,
    },
    {
        id: 'POL007',
        title: 'Vehicle Maintenance Standards',
        type: 'Operational',
        category: 'Operations',
        description: 'Maintenance schedules, inspection protocols, and vehicle upkeep requirements.',
        content: `# Vehicle Maintenance Standards

## Scheduled Maintenance
- Daily pre-trip inspection
- Weekly brake and tire check
- Monthly comprehensive inspection
- Quarterly engine service
- Annual overhaul

## Documentation
All maintenance activities must be logged in the vehicle maintenance register.`,
        status: 'Published',
        version: 'v1.4',
        author: 'Maintenance Division',
        department: 'Operations Division',
        effectiveDate: '2024-04-15',
        expiryDate: '2025-04-14',
        publishedDate: '2024-04-05',
        lastModified: '2024-04-10',
        createdAt: '2024-03-25',
        tags: ['maintenance', 'vehicles', 'inspection'],
        priority: 'Medium',
        documentUrl: 'https://example.com/maintenance-standards.pdf',
    },
    {
        id: 'POL008',
        title: 'Passenger Rights and Responsibilities',
        type: 'Service',
        category: 'Customer Service',
        description: 'Charter outlining passenger rights, responsibilities, and complaint procedures.',
        content: `# Passenger Rights and Responsibilities

## Passenger Rights
- Right to safe and clean transportation
- Right to timely service
- Right to fair pricing
- Right to lodge complaints

## Passenger Responsibilities
- Pay correct fare
- Maintain orderly conduct
- Follow safety instructions
- Respect other passengers`,
        status: 'Published',
        version: 'v1.0',
        author: 'Customer Service',
        department: 'Customer Relations',
        effectiveDate: '2024-01-15',
        expiryDate: '2025-01-14',
        publishedDate: '2024-01-10',
        lastModified: '2024-01-15',
        createdAt: '2024-01-05',
        tags: ['passengers', 'rights', 'service'],
        priority: 'Medium',
        documentUrl: null,
    },
    {
        id: 'POL009',
        title: 'Data Protection and Privacy Policy',
        type: 'Legal',
        category: 'Legal & Governance',
        description: 'Data handling, storage, and privacy procedures in compliance with regulations.',
        content: `# Data Protection and Privacy Policy

## Scope
This policy applies to all personal data collected and processed by the transport authority.

## Key Principles
- Data minimization
- Purpose limitation
- Storage limitation
- Security of processing
- Accountability`,
        status: 'Draft',
        version: 'v1.0',
        author: 'Legal Department',
        department: 'Legal & Governance',
        effectiveDate: '2024-06-01',
        expiryDate: null,
        publishedDate: '2024-05-01',
        lastModified: '2024-05-05',
        createdAt: '2024-04-20',
        tags: ['data', 'privacy', 'legal'],
        priority: 'High',
        documentUrl: null,
    },
    {
        id: 'POL010',
        title: 'Route Planning Guidelines',
        type: 'Operational',
        category: 'Operations',
        description: 'Guidelines for planning, evaluating, and modifying bus routes.',
        content: `# Route Planning Guidelines

## Planning Criteria
- Passenger demand analysis
- Road infrastructure assessment
- Connectivity requirements
- Service frequency optimization
- Cost-benefit analysis

## Route Modification Process
1. Submit route change request
2. Impact assessment
3. Public consultation
4. Authority approval
5. Implementation`,
        status: 'Published',
        version: 'v2.3',
        author: 'Route Planning Division',
        department: 'Operations Division',
        effectiveDate: '2024-03-01',
        expiryDate: '2025-02-28',
        publishedDate: '2024-02-28',
        lastModified: '2024-03-05',
        createdAt: '2024-02-15',
        tags: ['routes', 'planning', 'operations'],
        priority: 'Medium',
        documentUrl: null,
    },
    {
        id: 'POL011',
        title: 'Anti-Discrimination Policy',
        type: 'HR',
        category: 'Human Resources',
        description: 'Policy ensuring equal treatment and non-discrimination across all operations.',
        content: `# Anti-Discrimination Policy

## Statement
The transport authority is committed to providing an environment free from discrimination based on race, gender, religion, age, disability, or any other protected characteristic.

## Scope
This policy applies to all employees, contractors, and service partners.`,
        status: 'Under Review',
        version: 'v1.2',
        author: 'Human Resources',
        department: 'Human Resources',
        effectiveDate: '2024-07-01',
        expiryDate: null,
        publishedDate: '2024-06-01',
        lastModified: '2024-06-05',
        createdAt: '2024-05-20',
        tags: ['hr', 'discrimination', 'equality'],
        priority: 'Medium',
        documentUrl: null,
    },
    {
        id: 'POL012',
        title: 'Quality Assurance Standards',
        type: 'Service',
        category: 'Customer Service',
        description: 'Service quality benchmarks and monitoring procedures.',
        content: `# Quality Assurance Standards

## Key Metrics
- On-time performance: ≥90%
- Customer satisfaction: ≥85%
- Vehicle cleanliness: ≥95%
- Safety compliance: 100%

## Monitoring
- Monthly performance reports
- Quarterly audits
- Annual comprehensive review`,
        status: 'Published',
        version: 'v1.1',
        author: 'Quality Control',
        department: 'Customer Relations',
        effectiveDate: '2024-04-01',
        expiryDate: '2025-03-31',
        publishedDate: '2024-03-15',
        lastModified: '2024-03-20',
        createdAt: '2024-03-05',
        tags: ['quality', 'standards', 'service'],
        priority: 'Medium',
        documentUrl: null,
    },
    {
        id: 'POL013',
        title: 'Technology Integration Guidelines',
        type: 'Technical',
        category: 'IT & Technology',
        description: 'Standards for integrating new technology systems into transport operations.',
        content: `# Technology Integration Guidelines

## Scope
Guidelines for implementing and integrating technology solutions across transport operations.

## Standards
- API-first architecture
- Data interoperability requirements
- Security compliance
- User acceptance testing`,
        status: 'Draft',
        version: 'v1.0',
        author: 'IT Department',
        department: 'IT & Technology',
        effectiveDate: '2024-05-01',
        expiryDate: null,
        publishedDate: '2024-04-20',
        lastModified: '2024-04-25',
        createdAt: '2024-04-10',
        tags: ['technology', 'integration', 'IT'],
        priority: 'Low',
        documentUrl: null,
    },
    {
        id: 'POL014',
        title: 'Financial Reporting Standards',
        type: 'Financial',
        category: 'Finance',
        description: 'Standards for financial reporting, budgeting, and fiscal accountability.',
        content: `# Financial Reporting Standards

## Reporting Requirements
- Monthly revenue reports
- Quarterly financial statements
- Annual budget reviews
- Audit compliance documentation`,
        status: 'Published',
        version: 'v1.5',
        author: 'Finance Department',
        department: 'Finance',
        effectiveDate: '2024-02-01',
        expiryDate: '2025-01-31',
        publishedDate: '2024-01-30',
        lastModified: '2024-02-02',
        createdAt: '2024-01-20',
        tags: ['finance', 'reporting', 'audit'],
        priority: 'Medium',
        documentUrl: 'https://example.com/financial-standards.pdf',
    },
    {
        id: 'POL015',
        title: 'Staff Training and Development',
        type: 'HR',
        category: 'Human Resources',
        description: 'Training requirements, development programs, and professional growth paths.',
        content: `# Staff Training and Development

## Training Programs
- Induction training for new employees
- Annual refresher courses
- Specialized skill development
- Leadership development program

## Certification
All staff must maintain current certifications relevant to their roles.`,
        status: 'Published',
        version: 'v2.0',
        author: 'Training Division',
        department: 'Human Resources',
        effectiveDate: '2024-05-15',
        expiryDate: '2025-05-14',
        publishedDate: '2024-05-10',
        lastModified: '2024-05-15',
        createdAt: '2024-05-01',
        tags: ['training', 'development', 'hr'],
        priority: 'Low',
        documentUrl: null,
    },
    {
        id: 'POL016',
        title: 'Contract Management Policy',
        type: 'Legal',
        category: 'Legal & Governance',
        description: 'Procedures for managing contracts with operators, suppliers, and service providers.',
        content: `# Contract Management Policy

## Contract Lifecycle
1. Requirement identification
2. Vendor selection
3. Contract negotiation
4. Execution and monitoring
5. Renewal or termination`,
        status: 'Under Review',
        version: 'v1.3',
        author: 'Legal Department',
        department: 'Legal & Governance',
        effectiveDate: '2024-07-01',
        expiryDate: null,
        publishedDate: '2024-06-15',
        lastModified: '2024-06-20',
        createdAt: '2024-06-05',
        tags: ['contracts', 'legal', 'governance'],
        priority: 'Medium',
        documentUrl: null,
    },
    {
        id: 'POL017',
        title: 'Asset Management Guidelines',
        type: 'Operational',
        category: 'Operations',
        description: 'Guidelines for managing and tracking transport assets including vehicles and infrastructure.',
        content: `# Asset Management Guidelines

## Asset Categories
- Vehicles (buses, service vehicles)
- Infrastructure (depots, terminals)
- Equipment (ticketing machines, tracking devices)
- Technology assets (software, servers)

## Tracking
All assets must be registered in the asset management system.`,
        status: 'Draft',
        version: 'v1.0',
        author: 'Asset Management',
        department: 'Operations Division',
        effectiveDate: '2024-08-01',
        expiryDate: null,
        publishedDate: '2024-07-01',
        lastModified: '2024-07-05',
        createdAt: '2024-06-20',
        tags: ['assets', 'management', 'tracking'],
        priority: 'Low',
        documentUrl: null,
    },
    {
        id: 'POL018',
        title: 'Customer Feedback Management',
        type: 'Service',
        category: 'Customer Service',
        description: 'Procedures for collecting, analyzing, and responding to customer feedback.',
        content: `# Customer Feedback Management

## Channels
- Online feedback portal
- Mobile app ratings
- SMS feedback system
- In-person complaint desk

## Response Times
- Urgent complaints: 24 hours
- General feedback: 5 business days
- Suggestions: 10 business days`,
        status: 'Published',
        version: 'v1.2',
        author: 'Customer Service',
        department: 'Customer Relations',
        effectiveDate: '2024-02-15',
        expiryDate: '2025-02-14',
        publishedDate: '2024-02-10',
        lastModified: '2024-02-15',
        createdAt: '2024-02-01',
        tags: ['feedback', 'customer', 'service'],
        priority: 'Medium',
        documentUrl: null,
    },
    {
        id: 'POL019',
        title: 'Incident Reporting Procedures',
        type: 'Safety',
        category: 'Compliance',
        description: 'Standardized procedures for reporting, investigating, and documenting incidents.',
        content: `# Incident Reporting Procedures

## Reporting Timeline
- Immediate verbal report to supervisor
- Written report within 24 hours
- Investigation initiated within 48 hours
- Final report within 7 days

## Types of Incidents
- Accidents and collisions
- Passenger injuries
- Near-miss events
- Equipment failures`,
        status: 'Published',
        version: 'v1.1',
        author: 'Safety Department',
        department: 'Safety & Compliance',
        effectiveDate: '2024-04-01',
        expiryDate: '2025-03-31',
        publishedDate: '2024-04-01',
        lastModified: '2024-04-05',
        createdAt: '2024-03-20',
        tags: ['incidents', 'reporting', 'safety'],
        priority: 'High',
        documentUrl: null,
    },
    {
        id: 'POL020',
        title: 'Performance Evaluation Framework',
        type: 'HR',
        category: 'Human Resources',
        description: 'Framework for evaluating employee performance, setting objectives, and managing appraisals.',
        content: `# Performance Evaluation Framework

## Evaluation Criteria
- Job competency (40%)
- Attendance and punctuality (20%)
- Customer service quality (20%)
- Safety compliance (20%)

## Evaluation Cycle
- Monthly check-ins
- Quarterly reviews
- Annual comprehensive evaluation`,
        status: 'Published',
        version: 'v1.0',
        author: 'HR Department',
        department: 'Human Resources',
        effectiveDate: '2024-03-01',
        expiryDate: '2025-02-28',
        publishedDate: '2024-03-01',
        lastModified: '2024-03-05',
        createdAt: '2024-02-20',
        tags: ['performance', 'evaluation', 'hr'],
        priority: 'Low',
        documentUrl: null,
    },
];

// --- Service functions (mirror API service pattern for easy swap) ---

export function getPolicies(): Policy[] {
    return samplePolicies;
}

export function getPolicyById(id: string): Policy | undefined {
    return samplePolicies.find((p) => p.id === id);
}

export function getPolicyStatistics(): PolicyStatistics {
    const policies = samplePolicies;
    return {
        totalPolicies: policies.length,
        publishedPolicies: policies.filter((p) => p.status === 'Published').length,
        draftPolicies: policies.filter((p) => p.status === 'Draft').length,
        underReviewPolicies: policies.filter((p) => p.status === 'Under Review').length,
        archivedPolicies: policies.filter((p) => p.status === 'Archived').length,
        highPriorityPolicies: policies.filter((p) => p.priority === 'High').length,
    };
}

export function getPolicyFilterOptions(): PolicyFilterOptions {
    const policies = samplePolicies;
    return {
        statuses: [...new Set(policies.map((p) => p.status))],
        types: [...new Set(policies.map((p) => p.type))],
        departments: [...new Set(policies.map((p) => p.department))],
        priorities: [...new Set(policies.map((p) => p.priority))],
        categories: [...new Set(policies.map((p) => p.category))],
    };
}
