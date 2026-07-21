export type MachineStatus = 'running' | 'idle' | 'fault';

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
  createdAt: string;
}
