import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';

const INITIAL_MACHINES = [
  { id: 'M-101', name: 'Cutter 1', type: 'cutter', status: 'RUN' },
  { id: 'M-102', name: 'Roller A', type: 'roller', status: 'IDLE' },
  { id: 'M-103', name: 'Packing West', type: 'packer', status: 'OFF' },
];

const reasonTree = [
  { code: 'WORKING-PROPERLY', label: '✅ Working Properly - No Problem', icon: '🟢', statusChange: 'RUN' },
  { code: 'NO-ORDER-PLANNED', label: '📋 No Order → Planned', icon: '📋', statusChange: 'OFF' },
  { code: 'NO-ORDER-UNPLANNED', label: '❓ No Order → Unplanned', icon: '❓', statusChange: 'OFF' },
  { code: 'POWER-GRID', label: '⚡ Power → Grid Failure', icon: '⚡', statusChange: 'OFF' },
  { code: 'POWER-INTERNAL', label: '🔌 Power → Internal', icon: '🔌', statusChange: 'OFF' },
  { code: 'CHANGEOVER-TOOLING', label: '🔧 Changeover → Tooling', icon: '🔧', statusChange: 'OFF' },
  { code: 'CHANGEOVER-PRODUCT', label: '📦 Changeover → Product', icon: '📦', statusChange: 'OFF' },
];

const maintenanceItems = [
  { id: 'm1', machineId: 'M-101', title: '🛢️ Oil filter change', status: 'due' },
  { id: 'm2', machineId: 'M-102', title: '⛓️ Belt tension check', status: 'overdue' },
  { id: 'm3', machineId: 'M-101', title: '✂️ Clean cutter blades', status: 'done' },
  { id: 'm4', machineId: 'M-103', title: '📡 Inspect packing sensors', status: 'due' },
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
    const interval = setInterval(() => {
      setIsOnline(Math.random() > 0.3);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadPersistedData = async () => {
    try {
      const count = await AsyncStorage.getItem('pendingCount');
      const events = await AsyncStorage.getItem('operatorEvents');
      if (count) setPendingCount(parseInt(count));
      if (events) setOperatorEvents(JSON.parse(events));
    } catch (error) {
      console.log('Load error');
    }
  };

  const savePendingCount = async (count) => {
    setPendingCount(count);
    try {
      await AsyncStorage.setItem('pendingCount', count.toString());
    } catch (error) {
      console.log('Save count error');
    }
  };

  const saveOperatorEvent = async (event) => {
    const events = [...operatorEvents, event];
    setOperatorEvents(events);
    try {
      await AsyncStorage.setItem('operatorEvents', JSON.stringify(events));
    } catch (error) {
      console.log('Save events error');
    }
  };

  const updateMachineStatus = (machineId, newStatus) => {
    setMachines(machines.map(m => 
      m.id === machineId ? { ...m, status: newStatus } : m
    ));
  };

  const login = () => {
    if (!email.trim()) return Alert.alert('❌ Error', 'Please enter email');
    setScreen('home');
    Alert.alert('✅ Welcome!', `Logged in as ${role.toUpperCase()}`);
  };

  const startDowntime = (machine) => {
    setSelectedMachine(machine);
    setShowReasons(true);
  };

  const selectReason = async (reason) => {
    // ✅ WORKING PROPERLY = NO EVENT + Set to RUN (TOP OPTION)
    if (reason.code === 'WORKING-PROPERLY') {
      updateMachineStatus(selectedMachine.id, 'RUN');
      setShowReasons(false);
      Alert.alert('🟢 Machine Status Updated', `${selectedMachine.name} marked as WORKING PROPERLY`);
      return;
    }

    // Normal downtime events
    const newCount = pendingCount + 1;
    await savePendingCount(newCount);
    
    await saveOperatorEvent({
      id: Date.now().toString(),
      type: 'downtime',
      reason: reason.label,
      machine: selectedMachine.name,
      machineId: selectedMachine.id,
      time: new Date().toLocaleTimeString(),
      icon: reason.icon
    });
    
    updateMachineStatus(selectedMachine.id, reason.statusChange || 'OFF');
    setShowReasons(false);
    Alert.alert('🔴 Downtime Reported', `${reason.label} on ${selectedMachine.name}`);
  };

  const completeMaintenance = async (item) => {
    const newCount = pendingCount + 1;
    await savePendingCount(newCount);
    
    const machineId = maintenanceItems.find(m => m.id === item.id)?.machineId;
    const machineName = machines.find(m => m.id === machineId)?.name;
    
    await saveOperatorEvent({
      id: Date.now().toString(),
      type: 'maintenance',
      task: item.title,
      machine: machineName,
      machineId: machineId,
      time: new Date().toLocaleTimeString(),
      icon: '🔧'
    });
    
    updateMachineStatus(machineId, 'RUN');
    Alert.alert('🟢 Maintenance Complete', `${item.title} done! Machine back to RUNNING`);
  };

  const acknowledgeEvent = (event) => {
    const newEvents = operatorEvents.filter(e => e.id !== event.id);
    setOperatorEvents(newEvents);
    Alert.alert('✅ Acknowledged', `${event.type.toUpperCase()} action reviewed`);
  };

  const syncData = async () => {
    Alert.alert(
      '🔄 Sync Data',
      `Upload ${pendingCount} pending items & ${operatorEvents.length} events?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SYNC NOW ✅',
          style: 'default',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['pendingCount', 'operatorEvents']);
              setPendingCount(0);
              setOperatorEvents([]);
              setIsOnline(true);
              setMachines(INITIAL_MACHINES);
              Alert.alert('✅ SYNC COMPLETE!', 'All data uploaded successfully!');
            } catch (error) {
              Alert.alert('❌ Sync Failed', 'Please try again');
            }
          }
        }
      ]
    );
  };

  if (screen === 'login') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#10B981" />
        <View style={styles.logoContainer}>
          <Ionicons name="factory-outline" size={80} color="#10B981" />
          <Text style={styles.title}>ShopFloor Pro</Text>
          <Text style={styles.subtitle}>Offline-First Factory Management</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="john@factory.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={styles.roleToggle}>
          <TouchableOpacity 
            style={[styles.toggle, role === 'operator' && styles.activeToggle]} 
            onPress={() => setRole('operator')}
          >
            <Ionicons name="construct-outline" size={24} color={role === 'operator' ? 'white' : '#333'} />
            <Text style={[styles.toggleText, role === 'operator' && styles.activeText]}>Operator</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggle, role === 'supervisor' && styles.activeToggle]} 
            onPress={() => setRole('supervisor')}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color={role === 'supervisor' ? 'white' : '#333'} />
            <Text style={[styles.toggleText, role === 'supervisor' && styles.activeText]}>Supervisor</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.loginBtn} onPress={login}>
          <Ionicons name="log-in-outline" size={24} color="white" />
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>
        <Text style={styles.tenantId}>tenant_id: tenant-123</Text>
      </View>
    );
  }

  if (showReasons) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.backHeader}>
          <TouchableOpacity onPress={() => setShowReasons(false)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.machineTitle}>{selectedMachine?.name}</Text>
          <View style={{width: 50}} />
        </View>
        <Text style={styles.reasonTitle}>Update Machine Status</Text>
        <FlatList
          data={reasonTree}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.reasonItem} onPress={() => selectReason(item)}>
              <Text style={styles.reasonIcon}>{item.icon}</Text>
              <Text style={styles.reasonText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.code}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name={role === 'operator' ? "construct" : "shield-checkmark"} size={28} color="#333" />
          <Text style={styles.roleText}>{role.toUpperCase()} DASHBOARD</Text>
        </View>
        
        {pendingCount > 0 && (
          <View style={[styles.badge, {backgroundColor: '#EF4444'}]}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
        
        <Text style={[styles.statusText, {color: isOnline ? '#10B981' : '#EF4444'}]}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </Text>
      </View>

      <Text style={styles.headerText}>Machine Status</Text>

      <FlatList
        data={machines}
        renderItem={({ item }) => (
          <View style={styles.machineContainer}>
            <TouchableOpacity 
              style={[styles.machineCard, getMachineCardStyle(item.status)]} 
              onPress={() => startDowntime(item)}
              activeOpacity={0.9}
            >
              <View style={styles.machineHeader}>
                <View>
                  <Text style={styles.machineName}>{item.name}</Text>
                  <Text style={styles.machineType}>{item.type.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusChip, {backgroundColor: getStatusColor(item.status)}]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>

            {maintenanceItems.filter(m => m.machineId === item.id).map(mItem => (
              <View key={mItem.id} style={[
                styles.maintenanceItem, 
                mItem.status === 'overdue' && styles.overdueItem,
                mItem.status === 'done' && styles.doneItem
              ]}>
                <View style={styles.mItemLeft}>
                  <Text style={styles.mItemTitle}>{mItem.title}</Text>
                  <Text style={styles.mItemStatus}>{mItem.status.toUpperCase()}</Text>
                </View>
                {mItem.status !== 'done' && (
                  <TouchableOpacity 
                    style={styles.completeBtn}
                    onPress={() => completeMaintenance(mItem)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.completeText}>COMPLETE</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      {role === 'supervisor' && operatorEvents.length > 0 && (
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="notifications-outline" size={24} color="#EF4444" /> 
            Operator Events ({operatorEvents.length})
          </Text>
          <FlatList
            data={operatorEvents.slice(0, 5)}
            renderItem={({ item }) => (
              <View style={styles.eventCard}>
                <Text style={styles.eventIcon}>{item.icon}</Text>
                <View style={styles.eventContent}>
                  <Text style={styles.eventType}>{item.type === 'downtime' ? '🔴 DOWNTIME' : '🔧 MAINTENANCE'}</Text>
                  <Text style={styles.eventDesc}>{item.reason || item.task}</Text>
                  <Text style={styles.eventMachine}>{item.machine} • {item.time}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.ackBtn}
                  onPress={() => acknowledgeEvent(item)}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      <View style={styles.actionButtons}>
        {pendingCount > 0 && (
          <TouchableOpacity style={styles.syncBtn} onPress={syncData}>
            <Ionicons name="sync-outline" size={20} color="white" />
            <Text style={styles.syncText}>SYNC ({pendingCount})</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setScreen('login')}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStatusColor = (status) => {
  switch (status) {
    case 'RUN': return '#10B981';
    case 'IDLE': return '#F59E0B';
    default: return '#EF4444';
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  logoContainer: { alignItems: 'center', marginBottom: 40, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginTop: 16 },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 8 },
  input: {
    borderWidth: 2, borderColor: '#e2e8f0', padding: 16, marginBottom: 24,
    borderRadius: 16, backgroundColor: 'white', fontSize: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 4, elevation: 3,
  },
  roleToggle: { flexDirection: 'row', marginBottom: 32 },
  toggle: {
    flex: 1, padding: 16, borderWidth: 2, borderRadius: 16, marginHorizontal: 8,
    backgroundColor: 'white', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 4, elevation: 3,
  },
  activeToggle: { backgroundColor: '#10B981', borderColor: '#10B981' },
  toggleText: { fontWeight: '600', fontSize: 16, marginTop: 8, color: '#64748b' },
  activeText: { color: 'white' },
  loginBtn: {
    flexDirection: 'row', backgroundColor: '#10B981', padding: 18, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2,
    shadowRadius: 8, elevation: 5,
  },
  loginText: { color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 12 },
  tenantId: { textAlign: 'center', color: '#94a3b8', fontSize: 12 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  roleText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginLeft: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, minWidth: 32, alignItems: 'center' },
  badgeText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  statusText: { fontSize: 14, fontWeight: '600' },
  headerText: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', margin: 20, marginBottom: 16 },
  listContainer: { paddingBottom: 100 },
  machineContainer: { marginHorizontal: 20, marginBottom: 16 },
  machineCard: {
    backgroundColor: 'white', padding: 20, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,
    shadowRadius: 12, elevation: 5,
  },
  machineCardRunning: { borderLeftWidth: 6, borderLeftColor: '#10B981' },
  machineCardIdle: { borderLeftWidth: 6, borderLeftColor: '#F59E0B' },
  machineCardOff: { borderLeftWidth: 6, borderLeftColor: '#EF4444' },
  machineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  machineName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  machineType: { fontSize: 14, color: '#64748b', marginTop: 4 },
  statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statusText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  maintenanceItem: {
    backgroundColor: 'white', padding: 16, borderRadius: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    shadowRadius: 8, elevation: 2,
  },
  overdueItem: { borderLeftWidth: 5, borderLeftColor: '#EF4444' },
  doneItem: { borderLeftWidth: 5, borderLeftColor: '#10B981', opacity: 0.7 },
  mItemLeft: { flex: 1 },
  mItemTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  mItemStatus: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 'bold', textTransform: 'uppercase' },
  completeBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  completeText: { color: 'white', fontWeight: 'bold', fontSize: 12, marginLeft: 6 },
  eventsSection: {
    margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,
    shadowRadius: 12, elevation: 5,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fef2f2', borderRadius: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  eventIcon: { fontSize: 24, marginRight: 16 },
  eventContent: { flex: 1 },
  eventType: { fontSize: 14, fontWeight: 'bold', color: '#dc2626', marginBottom: 4 },
  eventDesc: { fontSize: 16, fontWeight: '500', color: '#1e293b', marginBottom: 4 },
  eventMachine: { fontSize: 14, color: '#64748b' },
  ackBtn: { backgroundColor: '#10B981', padding: 12, borderRadius: 12 },
  actionButtons: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', gap: 12 },
  syncBtn: {
    flex: 1, flexDirection: 'row', backgroundColor: '#10B981', padding: 16,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2,
    shadowRadius: 8, elevation: 5,
  },
  syncText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  logoutBtn: {
    flexDirection: 'row', backgroundColor: '#6B7280', padding: 16, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2,
    shadowRadius: 8, elevation: 5,
  },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  backHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backBtn: { padding: 8 },
  machineTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', flex: 1, textAlign: 'center' },
  reasonTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', margin: 20, textAlign: 'center' },
  reasonItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 20,
    marginHorizontal: 20, marginBottom: 16, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 3,
  },
  reasonIcon: { fontSize: 24, marginRight: 16 },
  reasonText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1e293b' },
});
