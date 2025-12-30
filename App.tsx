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

  // ✅ FIXED: Maintenance COMPLETE - NO FORCE RUNNING
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
    
    // ✅ AND LOGIC: Only show warning if machine has downtime
    if (machine?.status !== 'OFF') {
      Alert.alert('✅ Maintenance Complete!', `${item.title} done on ${machine?.name}`);
    } else {
      Alert.alert('⚠️ Maintenance Done', 
        `${machine?.name} still has downtime reason. Select "Working Properly" to restart machine.`,
        [{ text: 'OK' }]
      );
    }
    // NO updateMachineStatus() - Machine stays in current state PERFECT!
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
          {/* ✅ ICON CHANGED: factory-outline 🏭 */}
          <View style={styles.factoryIconContainer}>
            <Ionicons name="construct-outline" size={72} color="white" />
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
          <View style={styles.roleToggle}>
            <TouchableOpacity 
              style={[styles.roleBtn, role === 'operator' && styles.roleBtnActive]}
              onPress={() => setRole('operator')}
            >
              <Ionicons name="construct-outline" size={28} color={role === 'operator' ? 'white' : '#64748b'} />
              <Text style={[styles.roleText, role === 'operator' && styles.roleTextActive]}>Operator</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleBtn, role === 'supervisor' && styles.roleBtnActive]}
              onPress={() => setRole('supervisor')}
            >
              <Ionicons name="shield-checkmark-outline" size={28} color={role === 'supervisor' ? 'white' : '#64748b'} />
              <Text style={[styles.roleText, role === 'supervisor' && styles.roleTextActive]}>Supervisor</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.loginBtn} onPress={login}>
            <Ionicons name="enter-outline" size={24} color="white" />
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
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
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
              <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
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
          <Ionicons name={role === 'operator' ? "construct-outline" : "shield-checkmark-outline"} size={32} color="#1e293b" />
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
              <Ionicons name="sync-outline" size={20} color={pendingCount === 0 ? '#9ca3af' : 'white'} />
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
              <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
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
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" />
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
            <Ionicons name="notifications-outline" size={24} color="#ef4444" />
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
                  <Ionicons name="checkmark-outline" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={() => setScreen('login')}>
        <Ionicons name="log-out-outline" size={20} color="white" />
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
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 2,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#bfdbfe',
    marginTop: 8,
    fontWeight: '500'
  },
  loginCard: {
    backgroundColor: 'white',
    margin: 24,
    padding: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    fontSize: 18,
    marginBottom: 24,
    fontWeight: '500'
  },
  roleToggle: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginHorizontal: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0'
  },
  roleBtnActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  roleText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
    color: '#64748b'
  },
  roleTextActive: {
    color: 'white'
  },
  loginBtn: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 12,
    letterSpacing: 1
  },
  tenantId: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 24,
    fontWeight: '500'
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 16,
  },
  roleSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 16,
    fontWeight: '600'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadge: {
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  pendingText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
  },
  onlineStatus: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 16,
    textTransform: 'uppercase',
  },
  syncBtnHeader: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  syncBtnDisabled: {
    backgroundColor: '#9ca3af'
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    margin: 24,
    marginBottom: 16,
    letterSpacing: 1,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 12,
  },
  machineList: {
    paddingBottom: 120,
  },
  machineCardContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  machineCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  machineCardRunning: {
    borderLeftWidth: 6,
    borderLeftColor: '#10b981',
  },
  machineCardIdle: {
    borderLeftWidth: 6,
    borderLeftColor: '#f59e0b',
  },
  machineCardOff: {
    borderLeftWidth: 6,
    borderLeftColor: '#ef4444',
  },
  machineHeader: {
    flex: 1,
  },
  machineInfo: {
    marginBottom: 8,
  },
  machineName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  machineType: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    minWidth: 80,
    alignItems: 'center',
  },
  statusBadgeText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  maintenanceCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginTop: 12,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  maintenanceOverdue: {
    borderLeftWidth: 5,
    borderLeftColor: '#ef4444',
  },
  maintenanceDone: {
    borderLeftWidth: 5,
    borderLeftColor: '#10b981',
    opacity: 0.7,
  },
  maintenanceLeft: {
    flex: 1,
  },
  maintenanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  maintenanceStatus: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  completeBtn: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  eventsSection: {
    margin: 24,
    backgroundColor: 'white',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  eventIcon: {
    fontSize: 28,
    marginRight: 16,
    width: 32,
  },
  eventContent: {
    flex: 1,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ef4444',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  eventDesc: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  ackBtn: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 12,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  backBtn: {
    padding: 8,
  },
  machineNameHeader: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  reasonTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    margin: 24,
    marginBottom: 16,
  },
  reasonList: {
    paddingBottom: 100,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  reasonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reasonIcon: {
    fontSize: 24,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  logoutBtn: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: '#475569',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
  },
});
