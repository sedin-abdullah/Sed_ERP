/**
 * Seeds the SedService marketplace with demo technicians and service requests
 * so the Admin console has data on first boot (Render free tier has no shell).
 * Idempotent: skips each collection if it already holds documents.
 */
import { Technician } from '../models/Technician';
import { ServiceRequest, RequestPriority, RequestStatus } from '../models/ServiceRequest';
import { User } from '../models/User';

const DEMO_TECHNICIANS = [
  { name: 'Tariq Aziz', email: 'tariq.tech@sederp.com', phone: '+1-555-0111', skills: ['grinding', 'milling', 'mechanical'], region: 'North', status: 'available' as const, rating: 4.8, completedJobs: 42 },
  { name: 'Maria Gomez', email: 'maria.field@sederp.com', phone: '+1-555-0112', skills: ['automation', 'plc', 'electrical'], region: 'West', status: 'available' as const, rating: 4.9, completedJobs: 57 },
  { name: 'Chen Wei', email: 'chen.service@sederp.com', phone: '+1-555-0113', skills: ['thermal', 'roasting', 'calibration'], region: 'East', status: 'available' as const, rating: 4.6, completedJobs: 31 },
  { name: 'Priya Nair', email: 'priya.tech@sederp.com', phone: '+1-555-0114', skills: ['optical-sorting', 'vision', 'diagnostics'], region: 'South', status: 'available' as const, rating: 4.7, completedJobs: 38 },
  { name: 'Ivan Petrov', email: 'ivan.field@sederp.com', phone: '+1-555-0115', skills: ['extrusion', 'hydraulics', 'welding'], region: 'Central', status: 'off' as const, rating: 4.5, completedJobs: 25 },
];

interface DemoRequest {
  title: string;
  category: string;
  description: string;
  priority: RequestPriority;
  machineName?: string;
  location: string;
  status: RequestStatus;
  requester: string; // email
}

const DEMO_REQUESTS: DemoRequest[] = [
  { title: 'Roaster 2 temperature drift', category: 'repair', description: 'Roast profile drifting +6°C over batch; suspect a faulty thermocouple.', priority: 'high', machineName: 'Roaster 2', location: 'Plant A · Line 3', status: 'pending', requester: 'user1@sederp.com' },
  { title: 'Quarterly preventive maintenance — Mill Line A', category: 'maintenance', description: 'Scheduled wear-part inspection and roller alignment.', priority: 'medium', machineName: 'Mill Line A', location: 'Plant A · Line 1', status: 'pending', requester: 'user2@sederp.com' },
  { title: 'New optical sorter commissioning', category: 'installation', description: 'Install and integrate Sorter 6 into the SedIoT gateway.', priority: 'medium', machineName: 'Sorter 5', location: 'Plant B · Line 2', status: 'quoted', requester: 'user1@sederp.com' },
  { title: 'Extruder 3 unplanned stoppage', category: 'repair', description: 'Screw torque spike then trip. Line down — need urgent dispatch.', priority: 'critical', machineName: 'Extruder 3', location: 'Plant B · Line 4', status: 'pending', requester: 'user2@sederp.com' },
  { title: 'Energy optimization audit', category: 'consulting', description: 'Review energy per tonne across roasting lines and recommend savings.', priority: 'low', location: 'Plant A', status: 'approved', requester: 'user1@sederp.com' },
  { title: 'Spare parts — Packer 9 sealing kit', category: 'parts', description: 'Order genuine sealing kit and gaskets for Packer 9.', priority: 'medium', machineName: 'Packer 9', location: 'Plant A · Line 5', status: 'pending', requester: 'user2@sederp.com' },
];

export async function seedServiceDemo(): Promise<void> {
  if ((await Technician.estimatedDocumentCount()) === 0) {
    await Technician.insertMany(DEMO_TECHNICIANS);
    console.log(`[seed] ${DEMO_TECHNICIANS.length} demo technicians created`);
  }

  if ((await ServiceRequest.estimatedDocumentCount()) === 0) {
    const users = await User.find({ email: { $in: DEMO_REQUESTS.map((r) => r.requester) } });
    const byEmail = new Map(users.map((u) => [u.email, u]));
    const docs = DEMO_REQUESTS.map((r, i) => {
      const u = byEmail.get(r.requester);
      return {
        code: `SR-${1001 + i}`,
        title: r.title,
        category: r.category,
        description: r.description,
        priority: r.priority,
        machineName: r.machineName,
        location: r.location,
        status: r.status,
        requesterId: u?._id,
        requesterName: u?.name ?? 'Demo User',
      };
    });
    await ServiceRequest.insertMany(docs);
    console.log(`[seed] ${docs.length} demo service requests created`);
  }
}
