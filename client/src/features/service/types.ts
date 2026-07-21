export type RequestPriority = 'low' | 'medium' | 'high' | 'critical';
export type RequestStatus =
  | 'pending' | 'quoted' | 'approved' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type TechnicianStatus = 'available' | 'busy' | 'off';
export type JobStatus = 'scheduled' | 'en_route' | 'on_site' | 'completed';
export type QuoteStatus = 'sent' | 'accepted' | 'rejected';

export const REQUEST_CATEGORIES = ['maintenance', 'repair', 'installation', 'consulting', 'monitoring', 'parts'] as const;
export const JOB_STATUSES: JobStatus[] = ['scheduled', 'en_route', 'on_site', 'completed'];

export interface ServiceRequest {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  priority: RequestPriority;
  machineName?: string;
  location: string;
  requesterId?: string;
  requesterName: string;
  status: RequestStatus;
  quoteId?: string;
  jobId?: string;
  createdAt: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skills: string[];
  region: string;
  status: TechnicianStatus;
  rating: number;
  completedJobs: number;
  active: boolean;
}

export interface Job {
  id: string;
  code: string;
  requestId: string;
  requestTitle: string;
  technicianId: string;
  technicianName: string;
  status: JobStatus;
  scheduledFor?: string;
  notes?: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  requestId: string;
  amount: number;
  currency: string;
  notes?: string;
  validUntil?: string;
  status: QuoteStatus;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'technician';
  active: boolean;
  permissions: string[];
}
