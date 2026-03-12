import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  symbolOptions: string[];
  intervalOptions: string[];
  symbol: string;
  interval: string;
  mainMAEnabled: boolean;
  mainBOLLEnabled: boolean;
  emaEnabled: boolean;
  superEnabled: boolean;
  second: -1 | 3 | 4 | 5;
  drawType: number;
  onClose: () => void;
  onSelectSymbol: (value: string) => void;
  onSelectInterval: (value: string) => void;
  onToggleMA: () => void;
  onToggleBOLL: () => void;
  onToggleEMA: () => void;
  onToggleSUPER: () => void;
  onClearMain: () => void;
  onSelectSub: (value: -1 | 3 | 4 | 5) => void;
  onSelectDrawType: (value: number) => void;
  onClearDraw: () => void;
};

export function BinanceControlsModal({
  visible,
  symbolOptions,
  intervalOptions,
  symbol,
  interval,
  mainMAEnabled,
  mainBOLLEnabled,
  emaEnabled,
  superEnabled,
  second,
  drawType,
  onClose,
  onSelectSymbol,
  onSelectInterval,
  onToggleMA,
  onToggleBOLL,
  onToggleEMA,
  onToggleSUPER,
  onClearMain,
  onSelectSub,
  onSelectDrawType,
  onClearDraw,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>Chart Controls</Text>

          <Text style={styles.modalSectionLabel}>Symbol</Text>
          <View style={styles.row}>
            {symbolOptions.map(item => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, symbol === item && styles.chipActive]}
                onPress={() => onSelectSymbol(item)}
              >
                <Text style={[styles.chipText, symbol === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalSectionLabel}>Interval</Text>
          <View style={styles.row}>
            {intervalOptions.map(item => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, interval === item && styles.chipActive]}
                onPress={() => onSelectInterval(item)}
              >
                <Text style={[styles.chipText, interval === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalSectionLabel}>Main</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.chip, mainMAEnabled && styles.chipActive]} onPress={onToggleMA}>
              <Text style={[styles.chipText, mainMAEnabled && styles.chipTextActive]}>MA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, mainBOLLEnabled && styles.chipActive]}
              onPress={onToggleBOLL}
            >
              <Text style={[styles.chipText, mainBOLLEnabled && styles.chipTextActive]}>BOLL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, emaEnabled && styles.chipActive]} onPress={onToggleEMA}>
              <Text style={[styles.chipText, emaEnabled && styles.chipTextActive]}>EMA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, superEnabled && styles.chipActive]}
              onPress={onToggleSUPER}
            >
              <Text style={[styles.chipText, superEnabled && styles.chipTextActive]}>SUPER</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, styles.clearChip]} onPress={onClearMain}>
              <Text style={styles.clearChipText}>Clear Main</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSectionLabel}>Sub</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.chip, second === -1 && styles.chipActive]} onPress={() => onSelectSub(-1)}>
              <Text style={[styles.chipText, second === -1 && styles.chipTextActive]}>No Sub</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, second === 3 && styles.chipActive]} onPress={() => onSelectSub(3)}>
              <Text style={[styles.chipText, second === 3 && styles.chipTextActive]}>MACD</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, second === 4 && styles.chipActive]} onPress={() => onSelectSub(4)}>
              <Text style={[styles.chipText, second === 4 && styles.chipTextActive]}>KDJ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, second === 5 && styles.chipActive]} onPress={() => onSelectSub(5)}>
              <Text style={[styles.chipText, second === 5 && styles.chipTextActive]}>RSI</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSectionLabel}>Draw</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.chip, drawType === 0 && styles.chipActive]} onPress={() => onSelectDrawType(0)}>
              <Text style={[styles.chipText, drawType === 0 && styles.chipTextActive]}>None</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, drawType === 1 && styles.chipActive]} onPress={() => onSelectDrawType(1)}>
              <Text style={[styles.chipText, drawType === 1 && styles.chipTextActive]}>Line</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, drawType === 2 && styles.chipActive]} onPress={() => onSelectDrawType(2)}>
              <Text style={[styles.chipText, drawType === 2 && styles.chipTextActive]}>HLine</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, drawType === 6 && styles.chipActive]} onPress={() => onSelectDrawType(6)}>
              <Text style={[styles.chipText, drawType === 6 && styles.chipTextActive]}>Rect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, styles.clearChip]} onPress={onClearDraw}>
              <Text style={styles.clearChipText}>Clear Draw</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseButtonText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe4f0',
    padding: 14,
  },
  modalTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 10,
  },
  modalSectionLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  chipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  clearChip: {
    borderColor: '#ef4444',
    backgroundColor: '#fff1f2',
  },
  clearChipText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
