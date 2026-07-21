/** Central MQTT topic layout for the SedERP IoT layer. Devices (the simulator)
 *  and the cloud (this server) both speak these topics over the broker. */

export const topics = {
  telemetry: (id: string) => `sederp/machines/${id}/telemetry`,
  status: (id: string) => `sederp/machines/${id}/status`,
  commands: (id: string) => `sederp/machines/${id}/commands`,
  ack: (id: string) => `sederp/machines/${id}/ack`,
  alerts: (id: string) => `sederp/machines/${id}/alerts`,
  broadcastAlerts: 'sederp/alerts/broadcast',
  // Wildcards the cloud subscribes to.
  allTelemetry: 'sederp/machines/+/telemetry',
  allStatus: 'sederp/machines/+/status',
  allAck: 'sederp/machines/+/ack',
  // Wildcards a device subscribes to.
  allCommands: 'sederp/machines/+/commands',
  allTargetedAlerts: 'sederp/machines/+/alerts',
};

/** Pull the {machineId} out of a `sederp/machines/{id}/...` topic. */
export function machineIdFromTopic(topic: string): string | null {
  const m = topic.match(/^sederp\/machines\/([^/]+)\//);
  return m ? m[1] : null;
}

export type CommandName =
  | 'power_on' | 'power_off' | 'restart' | 'alert' | 'set_param' | 'clear_alerts' | 'broadcast_alert';

export interface CommandMessage {
  commandId: string;
  command: CommandName;
  payload?: Record<string, unknown>;
  issuedBy: string;
  issuedByName: string;
  issuedAt: string;
}

export interface AckMessage {
  commandId: string;
  status: 'ok' | 'error';
  message: string;
  ackAt: string;
  machineState?: { status?: string };
}

export interface TelemetryMessage {
  machineId: string;
  ts: number;
  temperature: number;
  vibration: number;
  throughput: number;
  energyUsage: number;
  pressure: number;
  uptime: number;
  oeeScore: number;
  status: string;
  name: string;
  type: string;
  location: string;
}

export interface StatusMessage {
  machineId: string;
  status: string;
  ts: number;
}

export interface TargetedAlertMessage {
  alertId?: string;
  machineId: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  autoDismissMs?: number;
  issuedByName?: string;
}
