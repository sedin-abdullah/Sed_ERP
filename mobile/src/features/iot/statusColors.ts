import { colors } from '@/theme';
import type { AckStatus, AlertSeverity, MachineStatus } from './types';

export function machineStatusColor(s: MachineStatus): { bg: string; fg: string } {
  if (s === 'running') return { bg: colors.successSoft, fg: colors.success };
  if (s === 'fault') return { bg: colors.dangerSoft, fg: colors.danger };
  return { bg: colors.surface2, fg: colors.muted }; // idle | off
}

export function severityColor(s: AlertSeverity): { bg: string; fg: string } {
  if (s === 'critical') return { bg: colors.dangerSoft, fg: colors.danger };
  if (s === 'warning') return { bg: colors.warningSoft, fg: colors.warning };
  return { bg: colors.brandSoft, fg: colors.brand };
}

export function ackColor(s: AckStatus): { bg: string; fg: string } {
  if (s === 'ok') return { bg: colors.successSoft, fg: colors.success };
  if (s === 'pending') return { bg: colors.warningSoft, fg: colors.warning };
  return { bg: colors.dangerSoft, fg: colors.danger }; // error | timeout
}
