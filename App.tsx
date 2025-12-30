import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, StatusBar, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INITIAL_MACHINES = [
  { id: 'M-101', name: 'Cutter 1', type: 'cutter', status: 'RUN' },
  { id: 'M-102', name: 'Roller A', type: 'roller', status: 'IDLE' },
  { id: 'M-103', name: 'Packing West', type: 'packer', status: 'OFF' },
];

const reasonTree = [
  { code: 'WORKING-PROPERLY', label: ' Working Properly', icon: '✅', statusChange: 'RUN' },
  { code: 'NO-ORDER', label: ' No Order', icon: '📋', statusChange: 'OFF' },
  { code: 'POWER', label: ' Power Failure', icon: '⚡', statusChange: 'OFF' },
  { code: 'MAINTENANCE', label: ' Maintenance', icon: '🔧', statusChange: 'OFF' },
  { code: 'CHANGEOVER', label: ' Changeover', icon: '🔄', statusChange: 'OFF' },
];

const maintenanceItems = [
  { id: 'm1', machineId: 'M-101', title: '🛢️ Oil filter change', status: 'due' },
  { id: 'm2', machineId: 'M-102', title: '⛓️ Belt tension check', status: 'overdue' },
  { id: 'm3', machineId: 'M-101', title: '✂️ Clean cutter blades', status: 'done' },
  { id: 'm4', machineId: 'M-103', title: '📡 Inspect sensors', status: 'due' },
];

export default function App() {
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('operator');
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [showReasons, setShowReasons] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [operatorEvents, setOperatorEvents] = useState([]);

  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = async () => {
    try {
      const count = await AsyncStorage.getItem('pendingCount');
      if (count) setPendingCount(parseInt(count));
      const events = await AsyncStorage.getItem('operatorEvents');
      if (events) setOperatorEvents(JSON.parse(events));
    } catch (error) {}
  };

  const savePendingCount = async (count) => {
    try {
      setPendingCount(count);
      await AsyncStorage.setItem('pendingCount', count.toString());
    } catch (error) {}
  };

  const saveOperatorEvent = async (event) => {
    const events = [...operatorEvents, event];
    setOperatorEvents(events);
    await AsyncStorage.setItem('operatorEvents', JSON.stringify(events));
  };

  const updateMachineStatus = (machineId, newStatus) => {
    setMachines(machines.map(m => m.id === machineId ? { ...m, status: newStatus } : m));
  };

  const login = () => {
    if (!email.trim()) return Alert.alert('Error', 'Enter email');
    setScreen('home');
  };

  const startDowntime = (machine) => {
    setSelectedMachine(machine);
    setShowReasons(true);
  };

  const selectReason = async (reason) => {
    if (reason.code === 'WORKING-PROPERLY') {
      updateMachineStatus(selectedMachine.id, 'RUN');
      setShowReasons(false);
      Alert.alert('✅ Status Updated', `${selectedMachine.name} → RUNNING`);
      return;
    }

    const newCount = pendingCount + 1;
    await savePendingCount(newCount);
    await saveOperatorEvent({
      id: Date.now().toString(),
      type: 'downtime',
      reason: reason.label,
      machine: selectedMachine.name,
      time: new Date().toLocaleTimeString(),
      icon: reason.icon
    });
    updateMachineStatus(selectedMachine.id, 'OFF');
    setShowReasons(false);
    Alert.alert('🔴 Downtime Reported', `${reason.label}`);
  };

  const completeMaintenance = async (item) => {
    const newCount = pendingCount + 1;
    await savePendingCount(newCount);
    
    const machineId = item.machineId;
    const machine = machines.find(m => m.id === machineId);
    
    await saveOperatorEvent({
      id: Date.now().toString(),
      type: 'maintenance',
      task: item.title,
      machine: machine?.name || 'Unknown',
      machineId: machineId,
      time: new Date().toLocaleTimeString(),
      icon: '🔧'
    });
    
    if (machine?.status !== 'OFF') {
      Alert.alert('✅ Maintenance Complete!', `${item.title} done on ${machine?.name}`);
    } else {
      Alert.alert('⚠️ Maintenance Done', 
        `${machine?.name} still has downtime reason. Select "Working Properly" to restart machine.`,
        [{ text: 'OK' }]
      );
    }
  };

  const acknowledgeEvent = (event) => {
    setOperatorEvents(operatorEvents.filter(e => e.id !== event.id));
    Alert.alert('✅ Acknowledged', 'Event marked as seen');
  };

  const syncData = async () => {
    try {
      setPendingCount(0);
      setOperatorEvents([]);
      await AsyncStorage.multiRemove(['pendingCount', 'operatorEvents']);
      setMachines(INITIAL_MACHINES);
      Alert.alert('✅ Synced!', 'All data uploaded successfully!');
    } catch (error) {
      Alert.alert('Sync Error', 'Check connection');
    }
  };

  if (screen === 'login') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
        <View style={styles.gradientHeader}>
          <View style={styles.factoryIconContainer}>
            <Text style={styles.factoryEmoji}>🏭</Text>
          </View>
          <Text style={styles.appTitle}>Downtime Tracker</Text>
          <Text style={styles.appSubtitle}>Real-time Downtime & Alert Management</Text>
        </View>
        <View style={styles.loginCard}>
          <TextInput
            style={styles.input}
            placeholder="john@factory.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          {/* ✅ FIXED: Clean role buttons - smaller & professional */}
          <View style={styles.roleToggle}>
            <TouchableOpacity 
              style={[styles.roleBtn, role === 'operator' && styles.roleBtnActive]}
              onPress={() => setRole('operator')}
            >
              <Ionicons name="construct-outline" size={20} color={role === 'operator' ? 'white' : '#64748b'} />
              <Text style={[styles.roleText, role === 'operator' && styles.roleTextActive]}>Operator</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleBtn, role === 'supervisor' && styles.roleBtnActive]}
              onPress={() => setRole('supervisor')}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={role === 'supervisor' ? 'white' : '#64748b'} />
              <Text style={[styles.roleText, role === 'supervisor' && styles.roleTextActive]}>Supervisor</Text>
            </TouchableOpacity>
          </View>
          {/* ✅ FIXED: Smaller login button */}
          <TouchableOpacity style={styles.loginBtn} onPress={login}>
            <Ionicons name="enter-outline" size={20} color="white" />
            <Text style={styles.loginBtnText}>ENTER SYSTEM</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.tenantId}></Text>
      </View>
    );
  }

  if (showReasons) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.reasonHeader}>
          <TouchableOpacity onPress={() => setShowReasons(false)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.machineNameHeader}>{selectedMachine?.name}</Text>
        </View>
        <Text style={styles.reasonTitle}>UPDATE STATUS</Text>
        <FlatList
          data={reasonTree}
          contentContainerStyle={styles.reasonList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.reasonCard} onPress={() => selectReason(item)}>
              <View style={styles.reasonIconContainer}>
                <Text style={styles.reasonIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.reasonLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.code}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.dashboardHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name={role === 'operator' ? "construct-outline" : "shield-checkmark-outline"} size={24} color="#1e293b" />
          <View>
            <Text style={styles.roleTitle}>{role.toUpperCase()}</Text>
            <Text style={styles.roleSubtitle}>Dashboard</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>{pendingCount}</Text>
            </View>
          )}
          <Text style={[styles.onlineStatus, { color: isOnline ? '#10b981' : '#ef4444' }]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
          {role === 'supervisor' && (
            <TouchableOpacity 
              style={[styles.syncBtnHeader, pendingCount === 0 && styles.syncBtnDisabled]}
              onPress={syncData}
              disabled={pendingCount === 0}
            >
              <Ionicons name="sync-outline" size={16} color={pendingCount === 0 ? '#9ca3af' : 'white'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.sectionTitle}>MACHINE STATUS</Text>

      <FlatList
        data={machines}
        contentContainerStyle={styles.machineList}
        renderItem={({ item }) => (
          <View style={styles.machineCardContainer}>
            <TouchableOpacity 
              style={[styles.machineCard, getMachineCardStyle(item.status)]}
              onPress={() => startDowntime(item)}
              activeOpacity={0.95}
            >
              <View style={styles.machineHeader}>
                <View style={styles.machineInfo}>
                  <Text style={styles.machineName}>{item.name}</Text>
                  <Text style={styles.machineType}>{item.type.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusBadgeText}>{item.status}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            {maintenanceItems.filter(m => m.machineId === item.id).map(mItem => (
              <View key={mItem.id} style={[
                styles.maintenanceCard, 
                mItem.status === 'overdue' && styles.maintenanceOverdue,
                mItem.status === 'done' && styles.maintenanceDone
              ]}>
                <View style={styles.maintenanceLeft}>
                  <Text style={styles.maintenanceTitle}>{mItem.title}</Text>
                  <Text style={styles.maintenanceStatus}>{mItem.status.toUpperCase()}</Text>
                </View>
                {mItem.status !== 'done' && (
                  <TouchableOpacity style={styles.completeBtn} onPress={() => completeMaintenance(mItem)}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />

      {role === 'supervisor' && operatorEvents.length > 0 && (
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color="#ef4444" />
            <Text style={styles.eventsSectionTitle}>OPERATOR EVENTS ({operatorEvents.length})</Text>
          </View>
          <FlatList
            data={operatorEvents.slice(0, 5)}
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <Text style={styles.eventIcon}>{item.icon}</Text>
                <View style={styles.eventContent}>
                  <Text style={styles.eventType}>{item.type === 'downtime' ? 'DOWNTIME' : 'MAINTENANCE'}</Text>
                  <Text style={styles.eventDesc}>{item.reason || item.task}</Text>
                  <Text style={styles.eventTime}>{item.machine} • {item.time}</Text>
                </View>
                <TouchableOpacity style={styles.ackBtn} onPress={() => acknowledgeEvent(item)}>
                  <Ionicons name="checkmark-outline" size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={() => setScreen('login')}>
        <Ionicons name="log-out-outline" size={16} color="white" />
        <Text style={styles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case 'RUN': return '#10b981';
    case 'IDLE': return '#f59e0b';
    default: return '#ef4444';
  }
};

const getMachineCardStyle = (status) => {
  switch (status) {
    case 'RUN': return styles.machineCardRunning;
    case 'IDLE': return styles.machineCardIdle;
    default: return styles.machineCardOff;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  gradientHeader: {
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  factoryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  factoryEmoji: {
    fontSize: 64,
    lineHeight: 64,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1.5,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#bfdbfe',
    marginTop: 6,
    fontWeight: '500'
  },
  loginCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    fontSize: 16,
    marginBottom: 20,
    fontWeight: '500'
  },
  // ✅ FIXED: Smaller, cleaner role buttons
  roleToggle: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0'
  },
  roleBtnActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
    color: '#64748b'
  },
  roleTextActive: {
    color: 'white'
  },
  // ✅ FIXED: Smaller login button
  loginBtn: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5
  },
  tenantId: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 20,
    fontWeight: '500'
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 12,
  },
  roleSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 12,
    fontWeight: '600'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadge: {
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pendingText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12,
  },
  onlineStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 12,
    textTransform: 'uppercase',
  },
  syncBtnHeader: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  syncBtnDisabled: {
    backgroundColor: '#9ca3af'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    margin: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  eventsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 10,
  },
  machineList: {
    paddingBottom: 100,
  },
  machineCardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  machineCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  machineCardRunning: {
    borderLeftWidth: 5,
    borderLeftColor: '#10b981',
  },
  machineCardIdle: {
    borderLeftWidth: 5,
    borderLeftColor: '#f59e0b',
  },
  machineCardOff: {
    borderLeftWidth: 5,
    borderLeftColor: '#ef4444',
  },
  machineHeader: {
    flex: 1,
  },
  machineInfo: {
    marginBottom: 6,
  },
  machineName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  machineType: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    minWidth: 70,
    alignItems: 'center',
  },
  statusBadgeText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  maintenanceCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginTop: 10,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  maintenanceOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  maintenanceDone: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    opacity: 0.7,
  },
  maintenanceLeft: {
    flex: 1,
  },
  maintenanceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  maintenanceStatus: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  completeBtn: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 10,
    minWidth: 48,
    alignItems: 'center',
  },
  eventsSection: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  eventIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 28,
  },
  eventContent: {
    flex: 1,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ef4444',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  eventDesc: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  ackBtn: {
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 10,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  backBtn: {
    padding: 6,
  },
  machineNameHeader: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  reasonTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    margin: 20,
    marginBottom: 12,
  },
  reasonList: {
    paddingBottom: 80,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  reasonIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  reasonIcon: {
    fontSize: 22,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  logoutBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#475569',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});