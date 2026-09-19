import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Building2, Calculator, Eye, Info, MessageSquare, Radio, ShieldCheck, X } from 'lucide-react-native';
import type { TrustInfo } from '@busmate/api-client-core';
import { TRUST_CONFIG, TRUST_ORDER, confirmedText, trustKey, type TrustKey } from '@/lib/trust';

const ICONS: Record<TrustKey, React.ComponentType<{ size?: number; color?: string }>> = {
  OFFICIAL: ShieldCheck,
  OPERATOR_TIMETABLE: Building2,
  OBSERVED: Eye,
  REPORTED: MessageSquare,
  ESTIMATED: Calculator,
  LIVE: Radio,
};

/** Bottom sheet explaining every label; the one that was tapped is highlighted with its confirmed date. */
function TrustExplainerSheet({
  visible, onClose, current, trust,
}: { visible: boolean; onClose: () => void; current?: TrustKey | null; trust?: TrustInfo | null }) {
  const confirmed = confirmedText(trust);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>How much to trust a time</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={12}>
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sheetIntro}>
            BusMate shows where each time comes from, so you can decide how much room to leave.
          </Text>
          {TRUST_ORDER.map((key) => {
            const c = TRUST_CONFIG[key];
            const Icon = ICONS[key];
            const active = key === current;
            return (
              <View key={key} style={[styles.row, active && styles.rowActive]}>
                <View style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border }]}>
                  <Icon size={12} color={c.fg} />
                  <Text style={[styles.chipText, { color: c.fg }]}>{c.label}</Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.meaning}>{c.meaning}</Text>
                  {active && confirmed && <Text style={styles.confirmed}>{confirmed}</Text>}
                </View>
              </View>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface TrustChipProps {
  trust?: TrustInfo | null;
  /** Short lead-in such as "Departs", so two chips on one card read apart. */
  prefix?: string;
  /** Just the icon, for tight spots like a timeline. */
  iconOnly?: boolean;
}

/** How far to trust a value. Tapping it opens the explanation, since a phone has no hover tooltip. */
export function TrustChip({ trust, prefix, iconOnly = false }: TrustChipProps) {
  const [open, setOpen] = useState(false);
  const key = trustKey(trust);
  if (!key) return null;
  const c = TRUST_CONFIG[key];
  const Icon = ICONS[key];
  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${prefix ? `${prefix}: ` : ''}${c.label}. Tap to learn what this means.`}
        style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border }]}
        hitSlop={6}
      >
        <Icon size={12} color={c.fg} />
        {!iconOnly && (
          <Text style={[styles.chipText, { color: c.fg }]}>
            {prefix ? `${prefix}: ` : ''}{c.label}
          </Text>
        )}
      </TouchableOpacity>
      <TrustExplainerSheet visible={open} onClose={() => setOpen(false)} current={key} trust={trust} />
    </>
  );
}

/** "What do these labels mean?" — reachable from every screen that shows a label. */
export function TrustExplainerLink() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.link} accessibilityRole="button" hitSlop={8}>
        <Info size={14} color="#004CFF" />
        <Text style={styles.linkText}>What do these labels mean?</Text>
      </TouchableOpacity>
      <TrustExplainerSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: '600' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  linkText: { fontSize: 12, color: '#004CFF', fontWeight: '500' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sheetIntro: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 10 },
  rowActive: { backgroundColor: '#F3F4F9' },
  rowBody: { flex: 1 },
  meaning: { fontSize: 13, color: '#4B5563' },
  confirmed: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
