// ============================================
// FMS — Core TypeScript Types
// ============================================

// --- Enums ---

export type UserRole = 'admin' | 'facility_manager' | 'cleaning_supervisor' | 'staff';

export type WorkOrderStatus =
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'rejected';

export type WorkOrderUrgency = 'low' | 'medium' | 'high' | 'emergency';

export type WorkOrderCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'structural'
  | 'general'
  | 'other';

export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'decommissioned';

export type AssetCategory =
  | 'hvac_utilities'
  | 'av_electronics'
  | 'kitchen_cafeteria'
  | 'sports_recreation'
  | 'furniture_fixtures'
  | 'cleaning_janitorial';

export type ContractStatus = 'active' | 'expired' | 'under_review' | 'terminated';

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type SupplyRequestStatus = 'pending' | 'approved' | 'partially_approved' | 'rejected' | 'fulfilled';

export type SupplyPriority = 'routine' | 'urgent';

export type ExpenseCategory =
  | 'maintenance_repairs'
  | 'cleaning_supplies'
  | 'vendor_payments'
  | 'utilities'
  | 'equipment_purchase'
  | 'miscellaneous';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'clarification_requested';

export type NotificationType = 'work_order' | 'booking' | 'supply' | 'expense' | 'contract' | 'system';

export type NotificationChannel = 'in_app' | 'email' | 'both';

export type ScheduleType = 'weekly' | 'monthly' | 'quarterly' | 'annually';

// --- Entities ---

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacilityArea {
  id: string;
  name: string;
  type: string;
  capacity: number;
  key_features: string;
  is_bookable: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  work_order_number: string;
  submitted_by: string;
  location_area: string;
  category: WorkOrderCategory;
  description: string;
  urgency: WorkOrderUrgency;
  status: WorkOrderStatus;
  assigned_to_user?: string;
  assigned_to_vendor?: string;
  rejection_reason?: string;
  photo_attachments?: string[];
  approved_by?: string;
  approved_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  submitter?: User;
  area?: FacilityArea;
  assignee?: User;
  vendor?: Vendor;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  location_area: string;
  serial_number: string;
  purchase_date: string;
  condition: AssetCondition;
  quantity: number;
  image_url?: string;
  responsible_party: string;
  document_attachments?: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  area?: FacilityArea;
  responsible_user?: User;
}

export interface AssetMaintenanceSchedule {
  id: string;
  asset_id: string;
  schedule_type: ScheduleType;
  next_due_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  company_name: string;
  service_category: string;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  contacts?: VendorContact[];
}

export interface VendorContact {
  id: string;
  vendor_id: string;
  name: string;
  phone: string;
  email: string;
  is_primary: boolean;
}

export interface Contract {
  id: string;
  vendor_id: string;
  service_description: string;
  start_date: string;
  end_date: string;
  renewal_date?: string;
  value: number;
  status: ContractStatus;
  document_attachment?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  vendor?: Vendor;
}

export interface VendorPayment {
  id: string;
  vendor_id: string;
  contract_id?: string;
  work_order_id?: string;
  amount: number;
  invoice_reference: string;
  payment_method: string;
  payment_date: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceBooking {
  id: string;
  facility_area_id: string;
  requested_by: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  expected_attendees: number;
  setup_requirements?: string;
  status: BookingStatus;
  approved_by?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  area?: FacilityArea;
  requester?: User;
}

export interface SupplyRequest {
  id: string;
  submitted_by: string;
  area_of_use: string;
  priority: SupplyPriority;
  status: SupplyRequestStatus;
  approved_by?: string;
  approval_comments?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  items?: SupplyRequestItem[];
  submitter?: User;
  area?: FacilityArea;
}

export interface SupplyRequestItem {
  id: string;
  supply_request_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  notes?: string;
  is_approved: boolean;
}

export interface Expense {
  id: string;
  submitted_by: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  expense_date: string;
  vendor_payee: string;
  receipt_attachment?: string;
  status: ExpenseStatus;
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  submitter?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  reference_id?: string;
  reference_type?: string;
  channel: NotificationChannel;
  is_read: boolean;
  created_at: string;
}

// --- Dashboard Stats ---

export interface DashboardStats {
  open_work_orders: number;
  pending_approvals: number;
  upcoming_bookings: number;
  monthly_spend: number;
  work_order_trend: { month: string; count: number }[];
  expense_by_category: { category: string; amount: number }[];
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  user?: User;
}
