import { api } from '@/lib/api';
import type { AdminUser, Job, JobStatus, Quote, RequestStatus, ServiceRequest, Technician } from './types';

/** Thin REST layer for the SedService domain. Every mutating call is followed
 *  server-side by a Socket.IO broadcast, so callers don't manually refetch —
 *  the store updates from the socket event. */

const unwrap = <T>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

// --- Requests ---
export const fetchRequests = () => unwrap<ServiceRequest[]>(api.get('/service-requests'));
export const createRequest = (body: {
  title: string; category: string; description: string; priority?: string; machineName?: string; location: string;
}) => unwrap<ServiceRequest>(api.post('/service-requests', body));
export const setRequestStatus = (id: string, status: RequestStatus) =>
  unwrap<ServiceRequest>(api.patch(`/service-requests/${id}/status`, { status }));
export const quoteRequest = (id: string, body: { amount: number; notes?: string; validUntil?: string }) =>
  api.post(`/service-requests/${id}/quote`, body).then((r) => r.data.data);
export const approveRequest = (id: string) =>
  unwrap<ServiceRequest>(api.post(`/service-requests/${id}/approve`, {}));
export const assignRequest = (id: string, technicianId: string, scheduledFor?: string) =>
  api.post(`/service-requests/${id}/assign`, { technicianId, scheduledFor }).then((r) => r.data.data);
export const fetchQuotes = () => unwrap<Quote[]>(api.get('/service-requests/quotes/all'));

// --- Technicians ---
export const fetchTechnicians = () => unwrap<Technician[]>(api.get('/technicians'));
export const createTechnician = (body: Partial<Technician>) => unwrap<Technician>(api.post('/technicians', body));
export const updateTechnician = (id: string, body: Partial<Technician>) =>
  unwrap<Technician>(api.patch(`/technicians/${id}`, body));
export const deactivateTechnician = (id: string) => unwrap<Technician>(api.delete(`/technicians/${id}`));

// --- Jobs ---
export const fetchJobs = () => unwrap<Job[]>(api.get('/jobs'));
export const setJobStatus = (id: string, status: JobStatus) =>
  unwrap<Job>(api.patch(`/jobs/${id}/status`, { status }));

// --- Users ---
export const fetchUsers = () => unwrap<AdminUser[]>(api.get('/users'));
export const updateUser = (id: string, body: { active?: boolean; permissions?: string[] }) =>
  unwrap<AdminUser>(api.patch(`/users/${id}`, body));
