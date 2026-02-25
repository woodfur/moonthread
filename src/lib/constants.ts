import {
    WorkOrderStatus,
    WorkOrderUrgency,
    WorkOrderCategory,
    AssetCategory,
    AssetCondition,
    ContractStatus,
    BookingStatus,
    SupplyRequestStatus,
    ExpenseCategory,
    ExpenseStatus,
    UserRole,
} from '@/types';

// --- Status label maps ---

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
    submitted: 'Submitted',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    completed: 'Completed',
    rejected: 'Rejected',
};

export const WORK_ORDER_STATUS_COLORS: Record<WorkOrderStatus, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    pending_approval: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-violet-100 text-violet-700',
    on_hold: 'bg-orange-100 text-orange-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

export const URGENCY_LABELS: Record<WorkOrderUrgency, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    emergency: 'Emergency',
};

export const URGENCY_COLORS: Record<WorkOrderUrgency, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    emergency: 'bg-red-100 text-red-700',
};

export const WORK_ORDER_CATEGORY_LABELS: Record<WorkOrderCategory, string> = {
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    hvac: 'HVAC',
    structural: 'Structural',
    general: 'General',
    other: 'Other',
};

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
    hvac_utilities: 'HVAC & Utilities',
    av_electronics: 'Audio-Visual & Electronics',
    kitchen_cafeteria: 'Kitchen & Cafeteria',
    sports_recreation: 'Sports & Recreation',
    furniture_fixtures: 'Furniture & Fixtures',
    cleaning_janitorial: 'Cleaning & Janitorial',
};

export const ASSET_CONDITION_LABELS: Record<AssetCondition, string> = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    decommissioned: 'Decommissioned',
};

export const ASSET_CONDITION_COLORS: Record<AssetCondition, string> = {
    excellent: 'bg-green-100 text-green-700',
    good: 'bg-emerald-100 text-emerald-700',
    fair: 'bg-amber-100 text-amber-700',
    poor: 'bg-orange-100 text-orange-700',
    decommissioned: 'bg-red-100 text-red-700',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
    active: 'Active',
    expired: 'Expired',
    under_review: 'Under Review',
    terminated: 'Terminated',
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
    active: 'bg-green-100 text-green-700',
    expired: 'bg-red-100 text-red-700',
    under_review: 'bg-amber-100 text-amber-700',
    terminated: 'bg-slate-100 text-slate-600',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-slate-100 text-slate-600',
};

export const SUPPLY_STATUS_LABELS: Record<SupplyRequestStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    partially_approved: 'Partially Approved',
    rejected: 'Rejected',
    fulfilled: 'Fulfilled',
};

export const SUPPLY_STATUS_COLORS: Record<SupplyRequestStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    partially_approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    fulfilled: 'bg-emerald-100 text-emerald-700',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    maintenance_repairs: 'Maintenance & Repairs',
    cleaning_supplies: 'Cleaning Supplies',
    vendor_payments: 'Vendor Payments',
    utilities: 'Utilities',
    equipment_purchase: 'Equipment Purchase',
    miscellaneous: 'Miscellaneous',
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    clarification_requested: 'Needs Clarification',
};

export const EXPENSE_STATUS_COLORS: Record<ExpenseStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    clarification_requested: 'bg-blue-100 text-blue-700',
};

export const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Admin / Executive Director',
    facility_manager: 'Facility Manager',
    cleaning_supervisor: 'Cleaning Supervisor',
    staff: 'Internal Staff',
};

// --- Navigation links ---

export interface NavItem {
    label: string;
    href: string;
    icon: string;
    roles: UserRole[];
    badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
    { label: 'Overview', href: '/dashboard', icon: 'LayoutDashboard', roles: ['admin', 'facility_manager', 'cleaning_supervisor', 'staff'] },
    { label: 'Work Orders', href: '/dashboard/work-orders', icon: 'Wrench', roles: ['admin', 'facility_manager', 'staff'] },
    { label: 'Assets', href: '/dashboard/assets', icon: 'Package', roles: ['admin', 'facility_manager', 'cleaning_supervisor'] },
    { label: 'Vendors', href: '/dashboard/vendors', icon: 'Building2', roles: ['admin', 'facility_manager'] },
    { label: 'Spaces', href: '/dashboard/spaces', icon: 'CalendarDays', roles: ['admin', 'facility_manager', 'staff'] },
    { label: 'Supply Requests', href: '/dashboard/supply-requests', icon: 'ShoppingCart', roles: ['admin', 'facility_manager', 'cleaning_supervisor'] },
    { label: 'Expenses', href: '/dashboard/expenses', icon: 'Receipt', roles: ['admin', 'facility_manager', 'cleaning_supervisor'] },
    { label: 'Reports', href: '/dashboard/reports', icon: 'BarChart3', roles: ['admin', 'facility_manager'] },
    { label: 'Settings', href: '/dashboard/settings', icon: 'Settings', roles: ['admin'] },
];
