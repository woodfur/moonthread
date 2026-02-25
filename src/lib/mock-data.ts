import {
    User,
    FacilityArea,
    WorkOrder,
    Asset,
    Vendor,
    Contract,
    SpaceBooking,
    SupplyRequest,
    Expense,
    Notification,
    DashboardStats,
} from '@/types';

// --- Mock Users ---
export const MOCK_USERS: User[] = [
    { id: '1', full_name: 'David Mensah', email: 'david@foundation.org', role: 'admin', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: '2', full_name: 'Ama Serwaa', email: 'ama@foundation.org', role: 'facility_manager', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: '3', full_name: 'Kofi Asante', email: 'kofi@foundation.org', role: 'cleaning_supervisor', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: '4', full_name: 'Abena Osei', email: 'abena@foundation.org', role: 'staff', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: '5', full_name: 'Kwame Boateng', email: 'kwame@foundation.org', role: 'staff', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
];

// --- Mock Facility Areas ---
export const MOCK_AREAS: FacilityArea[] = [
    { id: 'a1', name: 'Main Auditorium', type: 'Event / Assembly', capacity: 200, key_features: 'AV equipment, stage, tiered seating', is_bookable: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: 'a2', name: 'Cafeteria', type: 'Food Service / Gathering', capacity: 80, key_features: 'Kitchen access, seating, serving counters', is_bookable: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: 'a3', name: 'Basketball Court', type: 'Sports / Recreation', capacity: 50, key_features: 'Full court, LED lighting, equipment storage', is_bookable: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: 'a4', name: 'Open Terrace', type: 'Outdoor / Flexible', capacity: 100, key_features: 'Covered area, power outlets, flexible seating', is_bookable: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: 'a5', name: 'Whole Facility', type: 'Compound-wide', capacity: 500, key_features: 'Full building booking for large-scale events', is_bookable: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
];

// --- Mock Work Orders ---
export const MOCK_WORK_ORDERS: WorkOrder[] = [
    { id: 'wo1', work_order_number: 'WO-2026-0001', submitted_by: '4', location_area: 'a1', category: 'electrical', description: 'Stage lighting fixture flickering intermittently during events', urgency: 'high', status: 'in_progress', assigned_to_user: '2', created_at: '2026-02-10T09:00:00Z', updated_at: '2026-02-12T14:30:00Z', submitter: MOCK_USERS[3], area: MOCK_AREAS[0] },
    { id: 'wo2', work_order_number: 'WO-2026-0002', submitted_by: '5', location_area: 'a2', category: 'plumbing', description: 'Kitchen sink faucet leaking — water pooling on floor', urgency: 'medium', status: 'pending_approval', created_at: '2026-02-18T11:20:00Z', updated_at: '2026-02-18T11:20:00Z', submitter: MOCK_USERS[4], area: MOCK_AREAS[1] },
    { id: 'wo3', work_order_number: 'WO-2026-0003', submitted_by: '4', location_area: 'a3', category: 'hvac', description: 'Air conditioning not cooling properly in basketball court area', urgency: 'high', status: 'approved', assigned_to_vendor: 'v1', created_at: '2026-02-20T08:00:00Z', updated_at: '2026-02-21T10:00:00Z', submitter: MOCK_USERS[3], area: MOCK_AREAS[2] },
    { id: 'wo4', work_order_number: 'WO-2026-0004', submitted_by: '5', location_area: 'a4', category: 'structural', description: 'Cracked tile on outdoor terrace near main entrance', urgency: 'low', status: 'completed', assigned_to_vendor: 'v2', completed_at: '2026-02-15T16:00:00Z', created_at: '2026-02-05T07:00:00Z', updated_at: '2026-02-15T16:00:00Z', submitter: MOCK_USERS[4], area: MOCK_AREAS[3] },
    { id: 'wo5', work_order_number: 'WO-2026-0005', submitted_by: '4', location_area: 'a2', category: 'general', description: 'Cafeteria tables need refinishing — surface scratches visible', urgency: 'low', status: 'submitted', created_at: '2026-02-23T14:00:00Z', updated_at: '2026-02-23T14:00:00Z', submitter: MOCK_USERS[3], area: MOCK_AREAS[1] },
    { id: 'wo6', work_order_number: 'WO-2026-0006', submitted_by: '5', location_area: 'a1', category: 'electrical', description: 'Emergency exit sign not illuminated on south wall', urgency: 'emergency', status: 'in_progress', assigned_to_user: '2', created_at: '2026-02-24T06:30:00Z', updated_at: '2026-02-24T07:00:00Z', submitter: MOCK_USERS[4], area: MOCK_AREAS[0] },
];

// --- Mock Assets ---
export const MOCK_ASSETS: Asset[] = [
    { id: 'as1', name: 'Central HVAC Unit', category: 'hvac_utilities', location_area: 'a1', serial_number: 'HVAC-2022-001', purchase_date: '2022-06-15', condition: 'good', quantity: 1, responsible_party: '2', created_at: '2026-01-01', updated_at: '2026-01-01', area: MOCK_AREAS[0] },
    { id: 'as2', name: 'Main Stage AV System', category: 'av_electronics', location_area: 'a1', serial_number: 'AV-2023-045', purchase_date: '2023-01-20', condition: 'excellent', quantity: 1, responsible_party: '2', created_at: '2026-01-01', updated_at: '2026-01-01', area: MOCK_AREAS[0] },
    { id: 'as3', name: 'Commercial Refrigerator', category: 'kitchen_cafeteria', location_area: 'a2', serial_number: 'KIT-2021-012', purchase_date: '2021-03-10', condition: 'fair', quantity: 1, responsible_party: '2', created_at: '2026-01-01', updated_at: '2026-01-01', area: MOCK_AREAS[1] },
    { id: 'as4', name: 'Basketball Hoop Set', category: 'sports_recreation', location_area: 'a3', serial_number: 'SPT-2024-003', purchase_date: '2024-08-01', condition: 'excellent', quantity: 1, responsible_party: '2', created_at: '2026-01-01', updated_at: '2026-01-01', area: MOCK_AREAS[2] },
    { id: 'as5', name: 'Industrial Floor Scrubber', category: 'cleaning_janitorial', location_area: 'a2', serial_number: 'CLN-2023-008', purchase_date: '2023-11-05', condition: 'good', quantity: 1, responsible_party: '3', created_at: '2026-01-01', updated_at: '2026-01-01', area: MOCK_AREAS[1] },
];

// --- Mock Vendors ---
export const MOCK_VENDORS: Vendor[] = [
    { id: 'v1', company_name: 'CoolTech HVAC Services', service_category: 'HVAC Maintenance', rating: 4, notes: 'Reliable, fast response times', created_at: '2026-01-01', updated_at: '2026-01-01', contacts: [{ id: 'vc1', vendor_id: 'v1', name: 'Eric Adjei', phone: '+233-20-555-0101', email: 'eric@cooltech.com', is_primary: true }] },
    { id: 'v2', company_name: 'BuildRight Construction', service_category: 'General Repairs', rating: 5, notes: 'Excellent quality, slightly higher cost', created_at: '2026-01-01', updated_at: '2026-01-01', contacts: [{ id: 'vc2', vendor_id: 'v2', name: 'Grace Mensah', phone: '+233-24-555-0202', email: 'grace@buildright.com', is_primary: true }] },
    { id: 'v3', company_name: 'SparkElectric Ltd', service_category: 'Electrical', rating: 4, notes: 'Licensed electricians, good turnaround', created_at: '2026-01-01', updated_at: '2026-01-01', contacts: [{ id: 'vc3', vendor_id: 'v3', name: 'Samuel Okyere', phone: '+233-27-555-0303', email: 'samuel@sparkelectric.com', is_primary: true }] },
];

// --- Mock Contracts ---
export const MOCK_CONTRACTS: Contract[] = [
    { id: 'c1', vendor_id: 'v1', service_description: 'Annual HVAC maintenance and emergency repair', start_date: '2026-01-01', end_date: '2026-12-31', renewal_date: '2026-11-01', value: 12000, status: 'active', created_at: '2026-01-01', updated_at: '2026-01-01', vendor: MOCK_VENDORS[0] },
    { id: 'c2', vendor_id: 'v3', service_description: 'Quarterly electrical inspection and maintenance', start_date: '2025-06-01', end_date: '2026-05-31', renewal_date: '2026-04-01', value: 5400, status: 'active', created_at: '2025-06-01', updated_at: '2025-06-01', vendor: MOCK_VENDORS[2] },
];

// --- Mock Space Bookings ---
export const MOCK_BOOKINGS: SpaceBooking[] = [
    { id: 'b1', facility_area_id: 'a1', requested_by: '4', booking_date: '2026-03-01', start_time: '09:00', end_time: '12:00', purpose: 'Community town hall meeting', expected_attendees: 120, setup_requirements: 'Podium, 120 chairs, projector', status: 'approved', approved_by: '2', created_at: '2026-02-20T10:00:00Z', updated_at: '2026-02-21T09:00:00Z', area: MOCK_AREAS[0], requester: MOCK_USERS[3] },
    { id: 'b2', facility_area_id: 'a2', requested_by: '5', booking_date: '2026-03-05', start_time: '14:00', end_time: '17:00', purpose: 'Staff appreciation luncheon', expected_attendees: 40, status: 'pending', created_at: '2026-02-22T08:30:00Z', updated_at: '2026-02-22T08:30:00Z', area: MOCK_AREAS[1], requester: MOCK_USERS[4] },
    { id: 'b3', facility_area_id: 'a3', requested_by: '4', booking_date: '2026-03-08', start_time: '16:00', end_time: '19:00', purpose: 'Youth basketball tournament', expected_attendees: 45, setup_requirements: 'Scoreboards, extra seating', status: 'approved', approved_by: '2', created_at: '2026-02-18T12:00:00Z', updated_at: '2026-02-19T14:00:00Z', area: MOCK_AREAS[2], requester: MOCK_USERS[3] },
];

// --- Mock Supply Requests ---
export const MOCK_SUPPLY_REQUESTS: SupplyRequest[] = [
    {
        id: 'sr1', submitted_by: '3', area_of_use: 'a2', priority: 'routine', status: 'approved', approved_by: '2', created_at: '2026-02-15T08:00:00Z', updated_at: '2026-02-16T10:00:00Z', submitter: MOCK_USERS[2], area: MOCK_AREAS[1], items: [
            { id: 'si1', supply_request_id: 'sr1', item_name: 'Floor cleaner concentrate', quantity: 10, unit: 'litres', is_approved: true },
            { id: 'si2', supply_request_id: 'sr1', item_name: 'Microfibre cloths', quantity: 50, unit: 'pieces', is_approved: true },
        ]
    },
    {
        id: 'sr2', submitted_by: '3', area_of_use: 'a1', priority: 'urgent', status: 'pending', created_at: '2026-02-23T09:00:00Z', updated_at: '2026-02-23T09:00:00Z', submitter: MOCK_USERS[2], area: MOCK_AREAS[0], items: [
            { id: 'si3', supply_request_id: 'sr2', item_name: 'Hand sanitiser refill', quantity: 20, unit: 'bottles', is_approved: true },
            { id: 'si4', supply_request_id: 'sr2', item_name: 'Trash bags (heavy duty)', quantity: 200, unit: 'pieces', is_approved: true },
            { id: 'si5', supply_request_id: 'sr2', item_name: 'Glass cleaner spray', quantity: 8, unit: 'bottles', is_approved: true },
        ]
    },
];

// --- Mock Expenses ---
export const MOCK_EXPENSES: Expense[] = [
    { id: 'e1', submitted_by: '2', description: 'Emergency plumbing repair — cafeteria kitchen', amount: 350, category: 'maintenance_repairs', expense_date: '2026-02-10', vendor_payee: 'BuildRight Construction', status: 'approved', approved_by: '1', created_at: '2026-02-10', updated_at: '2026-02-11', submitter: MOCK_USERS[1] },
    { id: 'e2', submitted_by: '3', description: 'Monthly cleaning supply restock', amount: 180, category: 'cleaning_supplies', expense_date: '2026-02-01', vendor_payee: 'CleanPro Supplies', status: 'approved', approved_by: '1', created_at: '2026-02-01', updated_at: '2026-02-02', submitter: MOCK_USERS[2] },
    { id: 'e3', submitted_by: '2', description: 'HVAC filter replacement parts', amount: 520, category: 'vendor_payments', expense_date: '2026-02-18', vendor_payee: 'CoolTech HVAC Services', status: 'pending', created_at: '2026-02-18', updated_at: '2026-02-18', submitter: MOCK_USERS[1] },
    { id: 'e4', submitted_by: '2', description: 'Monthly electricity bill — February', amount: 890, category: 'utilities', expense_date: '2026-02-20', vendor_payee: 'ECG Power Co', status: 'pending', created_at: '2026-02-20', updated_at: '2026-02-20', submitter: MOCK_USERS[1] },
];

// --- Mock Notifications ---
export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n1', user_id: '2', title: 'New Work Order', message: 'Abena Osei submitted WO-2026-0005: Cafeteria tables refinishing', type: 'work_order', reference_id: 'wo5', reference_type: 'work_order', channel: 'both', is_read: false, created_at: '2026-02-23T14:00:00Z' },
    { id: 'n2', user_id: '2', title: 'Emergency Work Order', message: 'Kwame Boateng submitted WO-2026-0006: Emergency exit sign not illuminated', type: 'work_order', reference_id: 'wo6', reference_type: 'work_order', channel: 'both', is_read: false, created_at: '2026-02-24T06:30:00Z' },
    { id: 'n3', user_id: '2', title: 'New Booking Request', message: 'Kwame Boateng requests Cafeteria on Mar 5 for Staff appreciation luncheon', type: 'booking', reference_id: 'b2', reference_type: 'booking', channel: 'both', is_read: false, created_at: '2026-02-22T08:30:00Z' },
    { id: 'n4', user_id: '2', title: 'Urgent Supply Request', message: 'Kofi Asante submitted an urgent supply request for Main Auditorium', type: 'supply', reference_id: 'sr2', reference_type: 'supply_request', channel: 'in_app', is_read: true, created_at: '2026-02-23T09:00:00Z' },
    { id: 'n5', user_id: '1', title: 'Expense Pending Approval', message: 'Ama Serwaa submitted expense: HVAC filter replacement — $520.00', type: 'expense', reference_id: 'e3', reference_type: 'expense', channel: 'both', is_read: false, created_at: '2026-02-18T12:00:00Z' },
];

// --- Mock Dashboard Stats ---
export const MOCK_DASHBOARD_STATS: DashboardStats = {
    open_work_orders: 4,
    pending_approvals: 5,
    upcoming_bookings: 3,
    monthly_spend: 1940,
    work_order_trend: [
        { month: 'Sep', count: 8 },
        { month: 'Oct', count: 12 },
        { month: 'Nov', count: 6 },
        { month: 'Dec', count: 9 },
        { month: 'Jan', count: 14 },
        { month: 'Feb', count: 6 },
    ],
    expense_by_category: [
        { category: 'Maintenance & Repairs', amount: 350 },
        { category: 'Cleaning Supplies', amount: 180 },
        { category: 'Vendor Payments', amount: 520 },
        { category: 'Utilities', amount: 890 },
    ],
    recent_activity: [
        { id: 'ra1', type: 'work_order', title: 'Emergency exit sign reported', description: 'WO-2026-0006 submitted by Kwame Boateng', timestamp: '2026-02-24T06:30:00Z' },
        { id: 'ra2', type: 'work_order', title: 'Work order submitted', description: 'WO-2026-0005: Cafeteria tables refinishing', timestamp: '2026-02-23T14:00:00Z' },
        { id: 'ra3', type: 'supply', title: 'Urgent supply request', description: 'Kofi Asante requested cleaning supplies for Auditorium', timestamp: '2026-02-23T09:00:00Z' },
        { id: 'ra4', type: 'booking', title: 'Booking request', description: 'Kwame Boateng requested Cafeteria on Mar 5', timestamp: '2026-02-22T08:30:00Z' },
        { id: 'ra5', type: 'expense', title: 'Expense submitted', description: 'Monthly electricity bill — $890.00', timestamp: '2026-02-20T12:00:00Z' },
    ],
};

// Current logged-in user (for demo)
export const CURRENT_USER = MOCK_USERS[1]; // Ama Serwaa — Facility Manager
