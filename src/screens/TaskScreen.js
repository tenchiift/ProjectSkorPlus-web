import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react-native';
import { supabase } from '../config/supabase';
import { useTheme } from '../context/ThemeContext';
import theme from '../styles/theme';

export default function TaskScreen({ navigation }) {
  const { theme: t } = useTheme();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const title = newTask.trim();
    if (!title) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: user.id, title })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTasks((prev) => [data, ...prev]);
        setNewTask('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (task) => {
    const newCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: newCompleted } : t));
    await supabase.from('tasks').update({ completed: newCompleted }).eq('id', task.id);
  };

  const deleteTask = async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const incomplete = tasks.filter((t) => !t.completed);
  const complete = tasks.filter((t) => t.completed);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: t.colors.background }]}>
        <ActivityIndicator size="large" color={t.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={t.colors.statusBar === 'light' ? 'light' : 'dark'} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={t.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.colors.textPrimary }]}>Tasks</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { backgroundColor: t.colors.inputBg, borderColor: t.colors.border, color: t.colors.textPrimary }]}
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Add a new task..."
          placeholderTextColor={t.colors.textSecondary}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: t.colors.primary }]} onPress={handleAdd}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {tasks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: t.colors.textSecondary }]}>No tasks yet. Add one above!</Text>
          </View>
        ) : (
          <>
            {incomplete.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: t.colors.textSecondary }]}>
                  PENDING ({incomplete.length})
                </Text>
                {incomplete.map((task) => (
                  <View key={task.id} style={[styles.taskRow, { backgroundColor: t.colors.surface }]}>
                    <TouchableOpacity style={[styles.checkbox, { borderColor: t.colors.border }]} onPress={() => toggleTask(task)}>
                      {task.completed && <Check size={12} color="#FFFFFF" />}
                    </TouchableOpacity>
                    <Text style={[styles.taskText, { color: t.colors.textPrimary }]}>{task.title}</Text>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(task.id)}>
                      <Trash2 size={16} color={t.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {complete.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: t.colors.textSecondary }]}>
                  COMPLETED ({complete.length})
                </Text>
                {complete.map((task) => (
                  <View key={task.id} style={[styles.taskRow, { backgroundColor: t.colors.surface }]}>
                    <TouchableOpacity
                      style={[styles.checkbox, { backgroundColor: t.colors.primary, borderColor: t.colors.primary }]}
                      onPress={() => toggleTask(task)}
                    >
                      <Check size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={[styles.taskText, styles.taskDone, { color: t.colors.textSecondary }]}>{task.title}</Text>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(task.id)}>
                      <Trash2 size={16} color={t.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.md,
  },
  backButton: { padding: 4 },
  headerTitle: { fontFamily: theme.fonts.headingBold, fontSize: 18 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: theme.borderRadius.md,
    paddingVertical: 12, paddingHorizontal: theme.spacing.md,
    fontFamily: theme.fonts.body, fontSize: 14,
  },
  addBtn: { width: 44, height: 44, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  section: { marginBottom: theme.spacing.lg },
  sectionLabel: { fontFamily: theme.fonts.body, fontSize: 11, marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.xs,
  },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  taskText: { flex: 1, fontFamily: theme.fonts.body, fontSize: 14 },
  taskDone: { textDecorationLine: 'line-through' },
  deleteBtn: { padding: 4 },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyText: { fontFamily: theme.fonts.body, fontSize: 14 },
});
