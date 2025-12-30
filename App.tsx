import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MACHINES = [
  { id: 'M-101', name: 'Cutter 1', type: 'cutter', status: 'RUN' },
  { id: 'M-102', name: 'Roller A', type: 'roller', status: 'IDLE' },
  { id: 'M-103', name: 'Packing West', type: 'packer', status: 'OFF' },
];

const reasonTree = [
  { code: 'NO-ORDER-PLANNED', label: 'No Order → Planned' },
  { code: 'NO-ORDER-UNPLANNED', label: 'No Order → Unplanned' },
  { code: 'POWER-GRID', label: 'Power → Grid' },
  { code: 'POWER-INTERNAL', label: 'Power → Internal' },
  { code: 'CHANGEOVER-TOOLING', label: 'Changeover → Tooling' },
  { code: 'CHANGEOVER-PRODUCT', label: 'Changeover → Product' },
];

const maintenanceItems = [
  { id: 'm1', machineId: 'M-101', title: 'Oil filter change', status: 'due' },
  { id: 'm2', machineId: 'M-102', title: 'Belt tension check', status: 'overdue' },
  { id: 'm3', machineId: 'M-101', title: 'Clean cutter blades', status: 'done' },
  { id: 'm4', machineId: 'M-103', title: 'Inspect packing sensors', status: 'due' },
];

export default function App() {
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('operator');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [showReasons, setShowReasons] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [operatorEvents, setOperatorEvents] = useState([]); // NEW: Operator actions
  const [ackedAlerts, setAckedAlerts] = useState([]);

  // Load persisted data
  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = async () => {
    try {
      const count = await AsyncStorage.getItem('pendingCount');
      if (count) setPendingCount(parseInt(count));
      
      // Load operator events
      const events = await AsyncStorage.getItem('operatorEvents');
      if (events) setOperatorEvents(JSON.parse(events));
    } catch (error) {
      console.log('Load error');
    }
  };

  const savePendingCount = async (count) => {
    try {
      setPendingCount(count);
      await AsyncStorage.setItem('pendingCount', count.toString());
    } catch (error) {
      console.log('Save error');
    }
  };

  const saveOperatorEvent = async (event) => {
    const events = [...operatorEvents, event];
    setOperatorEvents(events);
    await AsyncStorage.setItem('operatorEvents', JSON.stringify(events));
  };

  const login = () => {
    if (!email) return Alert.alert('Error', 'Enter email');
    setScreen('home');
  };

  const startDowntime = (machine) => {
    setSelectedMachine(machine);
    setShowReasons(true);
  };

  const selectReason = async (reason) => {
    const newCount = pendingCount + 1;
    await savePendingCount(newCount);
    
    // ADD OPERATOR EVENT
    await saveOperatorEvent({
      id: Date.now().toString(),
      type: 'downtime',
      reason: reason.label,
      machine: selectedMachine?.name,
      time: new Date().toLocaleTimeString()
    });
    
    setShowReasons(false);
    Alert.alert('✅ Downtime Started', `${reason.label} on ${selectedMachine?.name}`);
  };

  const completeMaintenance = async (item) => {
    const newCount = pendingCount + 1;
    await savePendingCount(newCount);
    
    // ADD OPERATOR EVENT
    await saveOperatorEvent({
      id: Date.now().toString(),
      type: 'maintenance',
      task: item.title,
      machine: maintenanceItems.find(m => m.id === item.id)?.machineId || 'Unknown',
      time: new Date().toLocaleTimeString()
    });
    
    Alert.alert('✅ Complete!', `${item.title} marked done`);
  };

  const acknowledgeEvent = (event) => {
    setOperatorEvents(operatorEvents.filter(e => e.id !== event.id));
    Alert.alert('✅ Seen', `Operator action acknowledged`);
  };

  const syncData = async () => {
    try {
      setPendingCount(0);
      setOperatorEvents([]); // Clear events after sync
      await AsyncStorage.multiRemove(['pendingCount', 'operatorEvents']);
      Alert.alert('🔄 Synced!', 'All data uploaded successfully!');
      setIsOnline(true);
    } catch (error) {
      Alert.alert('Sync Error', 'Check connection');
    }
  };

  if (screen === 'login') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>ShopFloor App</Text>
        <Text style={styles.subtitle}>Offline-First Field App</Text>
        <TextInput
          style={styles.input}
          placeholder="Email (any)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <View style={styles.roleToggle}>
          <TouchableOpacity 
            style={[styles.toggle, role === 'operator' && styles.active]} 
            onPress={() => setRole('operator')}
          >
            <Text style={styles.toggleText}>👷 Operator</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggle, role === 'supervisor' && styles.active]} 
            onPress={() => setRole('supervisor')}
          >
            <Text style={styles.toggleText}>👮 Supervisor</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={login}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <Text style={styles.tenantId}>tenant_id: tenant-123</Text>
      </View>
    );
  }

  if (showReasons) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Select Downtime Reason</Text>
        <Text style={styles.machineTitle}>{selectedMachine?.name}</Text>
        <FlatList
          data={reasonTree}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.reasonItem} onPress={() => selectReason(item)}>
              <Text style={styles.reasonText}>{item.label}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.code}
        />
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReasons(false)}>
          <Text style={styles.cancelText}>❌ Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount} pending</Text>
          </View>
        )}
        <Text style={styles.statusText}>{isOnline ? '🟢 Online' : '🔴 Offline'}</Text>
        <TouchableOpacity 
          style={[styles.syncBtn, pendingCount === 0 && styles.syncBtnDisabled]} 
          onPress={syncData}
          disabled={pendingCount === 0}
        >
          <Text style={styles.syncText}>🔄 Sync ({pendingCount})</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.headerText}>Machines ({role})</Text>

      {/* Machines + Maintenance */}
      <FlatList
        data={MACHINES}
        renderItem={({ item }) => (
          <View style={styles.machineContainer}>
            <TouchableOpacity style={styles.machineCard} onPress={() => startDowntime(item)}>
              <Text style={styles.machineName}>{item.name}</Text>
              <Text style={styles.machineType}>{item.type.toUpperCase()}</Text>
              <View style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </TouchableOpacity>

            {maintenanceItems.filter(m => m.machineId === item.id).map(mItem => (
              <View key={mItem.id} style={[
                styles.maintenanceItem, 
                mItem.status === 'overdue' && styles.overdue,
                mItem.status === 'done' && styles.done
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
                    <Text style={styles.completeText}>✅ Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Supervisor Sees Operator Events */}
      {role === 'supervisor' && operatorEvents.length > 0 && (
        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>Operator Events ({operatorEvents.length})</Text>
          {operatorEvents.map((event) => (
            <View key={event.id} style={styles.alertCard}>
              <Text style={styles.alertMsg}>
                {event.type === 'downtime' ? '🔴 Downtime' : '🔧 Maintenance'}: 
                {event.reason || event.task} 
                ({event.machine} - {event.time})
              </Text>
              <TouchableOpacity 
                style={styles.ackBtn}
                onPress={() => acknowledgeEvent(event)}
              >
                <Text style={styles.ackText}>✅ Seen</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => setScreen('login')}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f5f5f5',
    paddingTop: 50 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 10,
    color: '#333'
  },
  subtitle: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 40,
    color: '#666'
  },
  input: { 
    borderWidth: 1, 
    padding: 16, 
    marginBottom: 20, 
    borderRadius: 12, 
    backgroundColor: 'white',
    borderColor: '#ddd',
    fontSize: 16
  },
  roleToggle: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 30 
  },
  toggle: { 
    padding: 14, 
    borderWidth: 1, 
    borderRadius: 10, 
    flex: 1, 
    marginHorizontal: 8, 
    backgroundColor: 'white',
    borderColor: '#ddd'
  },
  active: { 
    backgroundColor: '#007AFF', 
    borderColor: '#007AFF' 
  },
  toggleText: { 
    textAlign: 'center', 
    fontWeight: 'bold', 
    fontSize: 16,
    color: '#333'
  },
  button: { 
    backgroundColor: '#007AFF', 
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center',
    marginBottom: 20
  },
  buttonText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  tenantId: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12
  },
  header: {
    alignItems: 'center',
    marginBottom: 20
  },
  badge: { 
    backgroundColor: '#EF4444', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginBottom: 10 
  },
  badgeText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  statusText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  syncBtn: { 
    backgroundColor: '#10B981', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 10 
  },
  syncBtnDisabled: {
    backgroundColor: '#9CA3AF'
  },
  syncText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  headerText: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20,
    textAlign: 'center'
  },
  machineContainer: { 
    marginBottom: 20 
  },
  machineCard: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 12,
    elevation: 3
  },
  machineName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  machineType: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 12,
    textTransform: 'uppercase'
  },
  statusChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    alignSelf: 'flex-start'
  },
  statusText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  maintenanceItem: { 
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8
  },
  overdue: { 
    borderLeftWidth: 5, 
    borderLeftColor: '#EF4444' 
  },
  done: { 
    borderLeftWidth: 5, 
    borderLeftColor: '#10B981',
    opacity: 0.7
  },
  mItemLeft: {
    flex: 1
  },
  mItemTitle: { 
    fontSize: 16, 
    fontWeight: '500' 
  },
  mItemStatus: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 4,
    fontWeight: 'bold'
  },
  completeBtn: { 
    backgroundColor: '#10B981', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  completeText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 12 
  },
  alertsSection: { 
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd'
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 16,
    color: '#333'
  },
  alertCard: { 
    backgroundColor: '#FEF2F2', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12 
  },
  alertMsg: { 
    fontSize: 16, 
    fontWeight: '500', 
    marginBottom: 12 
  },
  ackBtn: { 
    backgroundColor: '#007AFF', 
    padding: 12, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  ackText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  logoutBtn: { 
    backgroundColor: '#6B7280', 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 20 
  },
  logoutText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  machineTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333'
  },
  reasonItem: { 
    backgroundColor: 'white', 
    padding: 20, 
    marginBottom: 12, 
    borderRadius: 12,
    elevation: 2
  },
  reasonText: { 
    fontSize: 16, 
    fontWeight: '500' 
  },
  cancelBtn: { 
    backgroundColor: '#EF4444', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 20 
  },
  cancelText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});
