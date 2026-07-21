export type MachineStatus = 'running' | 'idle' | 'fault' | 'off';

export interface MachineReading {
  id: string;
  name: string;
  type: string;
  location: string;
  temperature: number;
  vibration: number;
  throughput: number;
  energyUsage: number;
  pressure: number;
  status: MachineStatus;
  uptime: number;
  oeeScore: number;
}

export interface IotUpdate {
  ts: number;
  machines: MachineReading[];
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  location: string;
  gatewayId: string;
  online: boolean;
  healthScore: number;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'ack' | 'resolved';

export interface Alert {
  id: string;
  machineId: string;
  machineName: string;
  metric: string;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  source?: 'auto' | 'admin';
  createdAt: string;
}

export type CommandName = 'power_on' | 'power_off' | 'restart' | 'alert' | 'set_param' | 'clear_alerts' | 'broadcast_alert';
export type AckStatus = 'pending' | 'ok' | 'error' | 'timeout';

export interface MachineCommand {
  id: string;
  machineId: string;
  machineName: string;
  command: CommandName;
  payload?: Record<string, unknown>;
  commandId: string;
  issuedByName: string;
  issuedAt: string;
  ackStatus: AckStatus;
  ackAt?: string;
  ackMessage?: string;
}
