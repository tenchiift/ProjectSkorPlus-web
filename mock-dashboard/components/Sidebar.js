import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ visible, onClose, onNavigate, userData }) {
  const { theme: t } = useTheme();

  const items = [
    { label: 'Profile', route: 'Profile' },
    { label: 'Settings', route: 'Settings' },
    { label: 'Log out', route: 'logout' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[styles.panel, { backgroundColor: t.colors.surface }]}>
          <Text style={[styles.name, { color: t.colors.textPrimary }]}>
            {userData?.name ?? 'Mock User'}
          </Text>
          {items.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.item}
              onPress={() => onNavigate(item.route)}
            >
              <Text style={{ color: t.colors.textPrimary }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  panel: { width: 220, height: '100%', paddingTop: 80, paddingHorizontal: 20 },
  name: { fontSize: 16, fontWeight: '700', marginBottom: 24 },
  item: { paddingVertical: 14 },
});
