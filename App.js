import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@savings_tracker_projects';

const INITIAL = [
  { name: 'Voyage Japon', current: '3400', goal: '5000' },
  { name: 'Moto', current: '2400', goal: '7500' },
];

// ─── Dot Matrix Progress Bar ───────────────────────────────────────────────
const DOT_COUNT = 40;

function DotMatrix({ percent }) {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * DOT_COUNT);
  return (
    <View style={styles.dotRow}>
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <View key={i} style={[styles.dot, i < filled ? styles.dotOn : styles.dotOff]} />
      ))}
    </View>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────
function ProjectCard({ project, index, onUpdate }) {
  const current = parseFloat(project.current) || 0;
  const goal = parseFloat(project.goal) || 1;
  const pct = Math.min(100, Math.round((current / goal) * 100));
  const fmtEur = (n) => Math.round(n).toLocaleString('fr-FR') + ' €';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>PROJET 0{index + 1}</Text>
        <Text style={styles.cardPct}>{pct}%</Text>
      </View>

      <TextInput
        style={styles.nameInput}
        value={project.name}
        onChangeText={(v) => onUpdate(index, 'name', v)}
        placeholder="Nom du projet"
        placeholderTextColor="#333"
        selectionColor="#E8302A"
      />

      <DotMatrix percent={pct} />

      <View style={styles.amountRow}>
        <Text style={styles.amountCurrent}>{fmtEur(current)}</Text>
        <Text style={styles.amountGoal}>/ {fmtEur(goal)}</Text>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>ÉPARGNÉ</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.amountInput}
              value={project.current}
              onChangeText={(v) => onUpdate(index, 'current', v)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#333"
              selectionColor="#E8302A"
            />
            <Text style={styles.currency}>€</Text>
          </View>
        </View>
        <View style={styles.inputSep} />
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>OBJECTIF</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.amountInput}
              value={project.goal}
              onChangeText={(v) => onUpdate(index, 'goal', v)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#333"
              selectionColor="#E8302A"
            />
            <Text style={styles.currency}>€</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Saved indicator ───────────────────────────────────────────────────────
function SavedBadge({ saved }) {
  return (
    <View style={[styles.badge, { opacity: saved ? 1 : 0 }]}>
      <View style={styles.badgeDot} />
      <Text style={styles.badgeText}>SAUVEGARDÉ</Text>
    </View>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [projects, setProjects] = useState(INITIAL);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Charger les données au démarrage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setProjects(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Erreur lecture AsyncStorage', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Sauvegarder à chaque modification
  const handleUpdate = useCallback((index, field, value) => {
    setProjects((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((e) =>
        console.warn('Erreur écriture AsyncStorage', e)
      );

      setSaved(true);
      setTimeout(() => setSaved(false), 1500);

      return next;
    });
  }, []);

  const totalCurrent = projects.reduce((s, p) => s + (parseFloat(p.current) || 0), 0);
  const totalGoal = projects.reduce((s, p) => s + (parseFloat(p.goal) || 0), 0);
  const totalPct = totalGoal > 0 ? Math.round((totalCurrent / totalGoal) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#E8302A" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerDot} />
            <Text style={styles.headerTitle}>SAVINGS TRACKER</Text>
          </View>
          <SavedBadge saved={saved} />
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TOTAL</Text>
            <Text style={styles.summaryPct}>{totalPct}%</Text>
          </View>
          <DotMatrix percent={totalPct} />
          <View style={styles.amountRow}>
            <Text style={styles.amountCurrent}>
              {Math.round(totalCurrent).toLocaleString('fr-FR')} €
            </Text>
            <Text style={styles.amountGoal}>
              / {Math.round(totalGoal).toLocaleString('fr-FR')} €
            </Text>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>— projets —</Text>
          <View style={styles.dividerLine} />
        </View>

        {projects.map((project, i) => (
          <ProjectCard key={i} project={project} index={i} onUpdate={handleUpdate} />
        ))}

        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <View style={styles.footerDot} />
          <View style={styles.footerDot} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const RED = '#E8302A';
const BG = '#0a0a0a';
const CARD_BG = '#141414';
const BORDER = '#1e1e1e';
const TEXT_PRIMARY = '#e0e0e0';
const TEXT_MUTED = '#555';
const TEXT_DIM = '#333';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  loader: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 28,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: RED },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13, color: TEXT_MUTED, letterSpacing: 3,
  },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1a1a1a', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2ecc71' },
  badgeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9, color: '#2ecc71', letterSpacing: 1.5,
  },

  summary: {
    backgroundColor: CARD_BG, borderRadius: 16, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: BORDER,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  summaryLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10, color: TEXT_MUTED, letterSpacing: 2,
  },
  summaryPct: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13, color: RED, fontWeight: '600',
  },

  dotRow: { flexDirection: 'row', flexWrap: 'nowrap', gap: 3, marginBottom: 8 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotOn: { backgroundColor: RED },
  dotOff: { backgroundColor: '#1e1e1e' },

  amountRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', marginTop: 4,
  },
  amountCurrent: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 14, color: TEXT_PRIMARY,
  },
  amountGoal: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12, color: TEXT_DIM,
  },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10, color: TEXT_DIM, letterSpacing: 2,
  },

  card: {
    backgroundColor: CARD_BG, borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: BORDER,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  cardLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 10, color: RED, letterSpacing: 2,
  },
  cardPct: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12, color: RED, fontWeight: '600',
  },

  nameInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 15, color: TEXT_PRIMARY, letterSpacing: 0.5,
    paddingVertical: 6, paddingHorizontal: 0,
    borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 14,
  },

  inputRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  inputWrap: { flex: 1 },
  inputSep: { width: 1, backgroundColor: BORDER },
  inputLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 9, color: TEXT_MUTED, letterSpacing: 1.5, marginBottom: 5,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0f0f0f', borderRadius: 8,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 10, paddingVertical: 6, gap: 4,
  },
  amountInput: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 14, color: TEXT_PRIMARY,
  },
  currency: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12, color: TEXT_MUTED,
  },

  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 20 },
  footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: BORDER },
});