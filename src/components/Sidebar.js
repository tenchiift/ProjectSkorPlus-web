import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, LayoutDashboard, FileText, User, LogOut, Scan, CheckSquare } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import theme from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.65;

export default function Sidebar({ visible, onClose, onNavigate, userData }) {
  const { theme: currentTheme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -SIDEBAR_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', route: 'Dashboard' },
    { icon: FileText, label: 'Past Papers', route: 'FinalExam' },
    { icon: Scan, label: 'Scan & Solve', route: 'ScanSolve' },
    { icon: CheckSquare, label: 'Tasks', route: 'Tasks' },
  ];

  const handleNavigate = (route) => {
    onClose();
    setTimeout(() => onNavigate(route), 200);
  };

  return (
    <View style={styles.wrapper} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }], backgroundColor: currentTheme.colors.surface }]}>
        <LinearGradient
          colors={[currentTheme.colors.sidebarHeaderStart, currentTheme.colors.sidebarHeaderEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.userInfo}>
            {userData?.photo_url ? (
              <Image source={{ uri: userData.photo_url }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={28} color="#FFFFFF" />
              </View>
            )}
            <View>
              <Text style={styles.userName}>{userData?.name ?? 'Student'}</Text>
              <Text style={styles.userSem}>{userData?.semester ?? 'Semester'}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.menu}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity key={item.route} style={styles.menuItem} onPress={() => handleNavigate(item.route)}>
                <Icon size={20} color={currentTheme.colors.textPrimary} />
                <Text style={[styles.menuItemText, { color: currentTheme.colors.textPrimary }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.footer, { borderTopColor: currentTheme.colors.border }]}>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => handleNavigate('logout')}>
            <LogOut size={20} color={currentTheme.colors.error} />
            <Text style={[styles.logoutText, { color: currentTheme.colors.error }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  backdropTouch: { flex: 1 },
  sidebar: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: SIDEBAR_WIDTH,
    borderTopRightRadius: 24, borderTopLeftRadius: 24, borderBottomRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 20,
  },
  header: { paddingTop: 60, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: theme.spacing.md },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  userName: { fontFamily: theme.fonts.headingBold, fontSize: 18, color: '#FFFFFF' },
  userSem: { fontFamily: theme.fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  menu: { flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, gap: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.md, gap: theme.spacing.md,
  },
  menuItemText: { fontFamily: theme.fonts.body, fontSize: 15 },
  footer: { paddingHorizontal: theme.spacing.lg, paddingBottom: 40, borderTopWidth: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.md, gap: theme.spacing.md, marginTop: theme.spacing.sm,
  },
  logoutText: { fontFamily: theme.fonts.body, fontSize: 15 },
});
