import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable, TextInput } from 'react-native';
import { X, Power, PowerOff, RotateCcw, BellRing, SlidersHorizontal, BellOff } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/theme';
import { getApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useIotStore } from './iotStore';
import { fetchCommands, sendCommand, sendMachineAlert } from './controlApi';
import { ackColor, machineStatusColor } from './statusColors';
import type { CommandName, Machine } from './types';

type Panel = 'none' | 'alert' | 'param';

export function MachineControl({ machine, onClose }: { machine: Machine; onClose: () => void }) {
  const can = useAuthStore((s) => s.can);
  const commands = useIotStore((s) => s.commands.filter((c) => c.machineId === machine.id));
  const setCommands = useIotStore((s) => s.setCommands);
  const upsertCommand = useIotStore((s) => s.upsertCommand);
  const liveStatus = useIotStore((s) => s.machines.find((m) => m.id === machine.id)?.status);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('none');
  const [severity, setSeverity] = useState('warning');
  const [message, setMessage] = useState('');
  const [paramKey, setParamKey] = useState('maxTemperature');
  const [paramValue, setParamValue] = useState('');

  const canPower = can('canControlMachines') || can('canPowerCycleMachines');
  const canControl = can('canControlMachines');
  const canAlert = can('canControlMachines') || can('canSendMachineAlerts');
  const c = machineStatusColor(liveStatus ?? 'off');

  useEffect(() => { fetchCommands(machine.id).then(setCommands).catch(() => undefined); }, [machine.id, setCommands]);

  async function run(key: string, command: CommandName, payload?: Record<string, unknown>) {
    setBusy(key); setError(null);
    try { upsertCommand(await sendCommand(machine.id, command, payload)); }
    catch (e) { setError(getApiError(e)); }
    finally { setBusy(null); }
  }

  async function submitAlert() {
    if (!message.trim()) { setError('Message is required'); return; }
    setBusy('alert'); setError(null);
    try { await sendMachineAlert(machine.id, { severity, message: message.trim() }); setPanel('none'); setMessage(''); }
    catch (e) { setError(getApiError(e)); }
    finally { setBusy(null); }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.head}>
            <View>
              <Text style={styles.title}>{machine.name}</Text>
              <Text style={styles.sub}>{machine.type} · {machine.location}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}><X color={colors.muted} size={22} /></Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={{ color: colors.muted }}>Live status</Text>
              <View style={[styles.pill, { backgroundColor: c.bg }]}><Text style={[styles.pillText, { color: c.fg }]}>{liveStatus ?? 'unknown'}</Text></View>
            </View>

            {(canPower || canControl || canAlert) ? (
              <View style={styles.grid}>
                {canPower && <Ctrl title="Power ON" icon={<Power color={colors.success} size={18} />} loading={busy === 'power_on'} onPress={() => run('power_on', 'power_on')} />}
                {canPower && <Ctrl title="Power OFF" icon={<PowerOff color={colors.danger} size={18} />} loading={busy === 'power_off'} onPress={() => run('power_off', 'power_off')} />}
                {canPower && <Ctrl title="Restart" icon={<RotateCcw color={colors.text} size={18} />} loading={busy === 'restart'} onPress={() => run('restart', 'restart')} />}
                {canControl && <Ctrl title="Clear Alerts" icon={<BellOff color={colors.text} size={18} />} loading={busy === 'clear_alerts'} onPress={() => run('clear_alerts', 'clear_alerts')} />}
                {canAlert && <Ctrl title="Send Alert" icon={<BellRing color={colors.warning} size={18} />} onPress={() => setPanel(panel === 'alert' ? 'none' : 'alert')} />}
                {canControl && <Ctrl title="Set Param" icon={<SlidersHorizontal color={colors.text} size={18} />} onPress={() => setPanel(panel === 'param' ? 'none' : 'param')} />}
              </View>
            ) : (
              <Text style={{ color: colors.muted, fontSize: 13 }}>You don't have machine-control permissions.</Text>
            )}

            {panel === 'alert' && (
              <View style={styles.form}>
                <Text style={styles.formLabel}>Severity</Text>
                <View style={styles.sevRow}>
                  {['info', 'warning', 'critical'].map((s) => (
                    <Pressable key={s} onPress={() => setSeverity(s)} style={[styles.sevPill, severity === s && { borderColor: colors.brand }]}>
                      <Text style={{ color: severity === s ? colors.brand : colors.muted, fontSize: 12, textTransform: 'capitalize' }}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput value={message} onChangeText={setMessage} placeholder="Alert message" placeholderTextColor={colors.muted} style={styles.input} />
                <Button title="Send alert" onPress={submitAlert} loading={busy === 'alert'} />
              </View>
            )}

            {panel === 'param' && (
              <View style={styles.form}>
                <Text style={styles.formLabel}>Parameter</Text>
                <View style={styles.sevRow}>
                  {[['maxTemperature', 'Max temp'], ['maxVibration', 'Max vib']].map(([k, lbl]) => (
                    <Pressable key={k} onPress={() => setParamKey(k)} style={[styles.sevPill, paramKey === k && { borderColor: colors.brand }]}>
                      <Text style={{ color: paramKey === k ? colors.brand : colors.muted, fontSize: 12 }}>{lbl}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput value={paramValue} onChangeText={setParamValue} keyboardType="numeric" placeholder="Value e.g. 85" placeholderTextColor={colors.muted} style={styles.input} />
                <Button title="Apply" onPress={() => { const v = Number(paramValue); if (Number.isFinite(v)) { void run('set_param', 'set_param', { key: paramKey, value: v }); setPanel('none'); setParamValue(''); } else setError('Enter a number'); }} />
              </View>
            )}

            {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

            <View>
              <Text style={styles.histTitle}>Command History</Text>
              {commands.length === 0 && <Text style={{ color: colors.muted, fontSize: 13 }}>No commands yet.</Text>}
              {commands.slice().sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)).map((cmd) => {
                const ac = ackColor(cmd.ackStatus);
                return (
                  <View key={cmd.id} style={styles.histRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.histCmd}>{cmd.command.replace(/_/g, ' ')}</Text>
                      <Text style={styles.histBy}>{cmd.issuedByName}{cmd.ackMessage ? ` · ${cmd.ackMessage}` : ''}</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: ac.bg }]}><Text style={[styles.pillText, { color: ac.fg }]}>{cmd.ackStatus}</Text></View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Ctrl({ title, icon, onPress, loading }: { title: string; icon: React.ReactNode; onPress: () => void; loading?: boolean }) {
  return (
    <Button title={title} variant="outline" icon={icon} onPress={onPress} loading={loading} style={{ flexBasis: '47%', flexGrow: 1 }} testID={`ctrl-${title.toLowerCase().replace(/ /g, '-')}`} />
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderColor: colors.border, borderWidth: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  pillText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  form: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  formLabel: { color: colors.muted, fontSize: 12 },
  sevRow: { flexDirection: 'row', gap: spacing.sm },
  sevPill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  input: { height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface2, color: colors.text, paddingHorizontal: 12 },
  histTitle: { color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  histCmd: { color: colors.text, fontWeight: '600', fontSize: 13, textTransform: 'capitalize' },
  histBy: { color: colors.muted, fontSize: 11 },
});
