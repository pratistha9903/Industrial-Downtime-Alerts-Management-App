import { supabase } from './supabase';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
  Dimensions,
  Image,
  Modal, 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TENANT_ID = 'factory-001';

const INITIAL_MACHINES = [
  { id: 'M-101', name: 'Cutter 1', type: 'cutter', status: 'RUN', tenant_id: TENANT_ID },
  { id: 'M-102', name: 'Roller A', type: 'roller', status: 'IDLE', tenant_id: TENANT_ID },
  { id: 'M-103', name: 'Packing West', type: 'packer', status: 'OFF', tenant_id: TENANT_ID },
];

const REASON_TREE = [
  { code: 'WORKING-PROPERLY', label: 'Working Properly', icon: 'checkmark-circle', statusChange: 'RUN' },
  {
    code: 'NO-ORDER',
    label: 'No Order',
    icon: 'document-outline',
    children: [
      { code: 'NO-ORDER-PLANNED', label: 'Planned', statusChange: 'IDLE',icon: 'time-outline' },
      { code: 'NO-ORDER-UNPLANNED', label: 'Unplanned', statusChange: 'OFF',icon: 'time-outline' },
    ]
  },
  {
    code: 'POWER',
    label: 'Power Failure',
    icon: 'flash-outline',
    children: [
      { code: 'POWER-GRID', label: 'Grid', statusChange: 'OFF' ,icon: 'grid-outline' },
      { code: 'POWER-INTERNAL', label: 'Internal', statusChange: 'OFF',icon: 'battery-charging-outline' },
    ]
  },
  {
    code: 'CHANGEOVER',
    label: 'Changeover',
    icon: 'sync-outline',
    children: [
      { code: 'CHANGEOVER-TOOLING', label: 'Tooling', statusChange: 'IDLE' ,icon: 'construct-outline' },
      { code: 'CHANGEOVER-PRODUCT', label: 'Product', statusChange: 'IDLE' ,icon: 'construct-outline' },
    ]
  },
];

const maintenanceItems = [
  { id: 'm1', machineId: 'M-101', title: '🛢️ Oil filter change', status: 'due' },     // Keep emoji in title
  { id: 'm2', machineId: 'M-102', title: '⛓️ Belt tension check', status: 'overdue' },  // Keep emoji in title
  { id: 'm3', machineId: 'M-101', title: '✂️ Clean cutter blades', status: 'done' },    // Keep emoji in title
  { id: 'm4', machineId: 'M-103', title: '📡 Inspect sensors', status: 'due' },  
];
const fileToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
    });
  } catch (error) {
    console.log('Photo to base64 failed:', error);
    return null;
  }
};

export default function App() {
  const [screen, setScreen] = useState('login');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('operator');
  const [jwt, setJwt] = useState('');
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentReasons, setCurrentReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [notes, setNotes] = useState('');
  const [operatorEvents, setOperatorEvents] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);//
  const [modalPhoto, setModalPhoto] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const jwtToken = await AsyncStorage.getItem('jwt');
        const roleStored = await AsyncStorage.getItem('role');
        const queue = await AsyncStorage.getItem('pendingQueue');
        const machineData = await AsyncStorage.getItem('machines');
        const eventsData = await AsyncStorage.getItem('operatorEvents');

        if (jwtToken) {
          setJwt(jwtToken);
          setEmail(jwtToken.split('|')[0] || '');
        }
        if (roleStored) setRole(roleStored);
        if (queue) setPendingQueue(JSON.parse(queue));
        if (machineData) setMachines(JSON.parse(machineData));
        if (eventsData) setOperatorEvents(JSON.parse(eventsData));

        setScreen('login');
      } catch (error) {
        console.log('Load error:', error);
        setScreen('login');
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    setBadgeCount(pendingQueue.length);  // Sync badge with queue
  }, [pendingQueue]);

  const saveAllData = async () => {
    try {
      await AsyncStorage.setItem('jwt', jwt);
      await AsyncStorage.setItem('role', role);
      await AsyncStorage.setItem('pendingQueue', JSON.stringify(pendingQueue));
      await AsyncStorage.setItem('machines', JSON.stringify(machines));
      await AsyncStorage.setItem('operatorEvents', JSON.stringify(operatorEvents));
    } catch (error) {}
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
  };

  const login = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Enter email');
    const mockJwt = `${email}|${Date.now()}|${TENANT_ID}`;
    setJwt(mockJwt);
    await saveAllData();
    setScreen('home');
  };

  const startDowntime = (machine) => {
    setSelectedMachine({ ...machine });
    setCurrentLevel(0);
    setCurrentReasons(REASON_TREE);
    setPhotoUri(null);
    setNotes('');
    setScreen('downtime');
  };

  const selectReasonLevel = (reason) => {
    if (reason.children) {
      setCurrentLevel(1);
      setSelectedReason(reason);
      setCurrentReasons(reason.children);
    } else {
      handleDowntimeSubmit(reason);
    }
  };

  const takePhoto = async () => {
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    quality: 0.3,
    base64: true, 
  });

  if (!result.canceled && result.assets?.[0]) {
    const asset = result.assets[0];
    console.log('📸 Photo captured:', asset.uri);  // DEBUG
    setPhotoUri(asset.uri);                        // ✅ Fix typo
    setPhotoBase64(asset.base64 || null);
  }
};


  const handleDowntimeSubmit = async (reason) => {
  // ✅ FIX 1: Use correct photo variables
  const capturedPhoto = photoUri ? { uri: photoUri, base64: photoBase64 } : null;
  
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    tenant_id: TENANT_ID,
    type: 'downtime',
    machine_id: selectedMachine.id,
    machine_name: selectedMachine.name,
    reason_code: selectedReason?.code || reason.code,
    reason_label: reason.label,  // ✅ FINAL REASON
    notes,
    photo_uri: photoUri,
    photo_base64: photoBase64,  // ✅ Use state directly
    timestamp: new Date().toISOString(),
    status: 'pending',
    user_email: email,
    icon: reason.icon || '📋',
    status_change: reason.statusChange || 'OFF',
  };

  const newQueue = [...pendingQueue, event];
  setPendingQueue(newQueue);

  // ✅ FIX 2: Supervisor gets FULL PATH + CORRECT PHOTOS
  const supervisorEvent = {
    id: event.id,
    type: 'DOWNTIME',
    reason: event.reason_label,                    // Final: "Planned"
    full_reason_path: `${selectedReason?.label || ''} → ${event.reason_label}`,  // "No Order → Planned"
    photo_uri: photoUri,                           // ✅ CORRECT photo_uri
    photo_base64: photoBase64,                     // ✅ CORRECT photo_base64  
    machine: event.machine_name,
    machineId: event.machine_id,
    time: new Date().toLocaleTimeString(),
    user: email.split('@')[0],                     // "john" from "john@factory.com"
    icon: event.icon,
    status: 'created',
    acknowledged_by: null,
    acknowledged_at: null,
    cleared_at: null,
  };
  
  const newEvents = [supervisorEvent, ...operatorEvents];
  setOperatorEvents(newEvents);

  setMachines(prev => prev.map(m => 
    m.id === selectedMachine.id 
      ? { ...m, status: reason.statusChange || 'OFF' }
      : m
  ));

  await saveAllData();
  setScreen('home');
  Alert.alert(`${reason.label} logged!✅`);
};

  

  const completeMaintenance = async (item) => {
    const event = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenant_id: TENANT_ID,
      type: 'maintenance',
      machine_id: item.machineId,
      task_id: item.id,
      task_title: item.title,
      timestamp: new Date().toISOString(),
      status: 'pending',
      user_email: email,
      icon: '🔧',
    };

    const newQueue = [...pendingQueue, event];
    setPendingQueue(newQueue);

    const machine = machines.find(m => m.id === item.machineId);
    const supervisorEvent = {
      id: event.id,
      type: 'MAINTENANCE',
      task: item.title,
      machine: machine?.name || 'Unknown',
      machineId: item.machineId,
      time: new Date().toLocaleTimeString(),
      icon: '🔧',
      user: email,
      status: 'created',
      acknowledged_by: null,
      acknowledged_at: null,
      cleared_at: null,
    };
    const newEvents = [supervisorEvent, ...operatorEvents];
    setOperatorEvents(newEvents);

    await saveAllData();
    Alert.alert('Maintenance logged✅!');
  };

  const syncEvents = async () => {
    if (pendingQueue.length === 0) return;
    
    try {
      setSyncing(true);
      
      // ✅ ONLY send Supabase-compatible fields
      
      const eventsToSync = pendingQueue.map(event => {
        const machineName = event.machine_name || 
                           (event.machine_id && machines.find(m => m.id === event.machine_id)?.name) || 
                         'Unknown Machine';
              
         return {
          id: event.id,
          tenant_id: event.tenant_id || 'factory-001',
          machine_id: event.machine_id,
          machine: machineName,  // ✅ Now guaranteed NOT null
          reason: event.reason_label || event.reason || event.task_title || 'N/A',
          status: event.status || 'pending',
          photo_url: event.photo_uri,
          user_email: event.user_email || email,
          icon: event.icon || '📋',
          notes: event.notes || ''
         };
       });


    // 1. Send ALL events to Supabase
      const { data, error } = await supabase
      .from('downtime_events')
      .insert(eventsToSync);
      
      if (error) throw error;

    // 2. Clear local storage AFTER success
      await AsyncStorage.removeItem('pendingQueue');
      setPendingQueue([]);
      setBadgeCount(0);
    
      console.log('✅ Synced', eventsToSync.length, 'Events Synced Successfully!');
      Alert.alert('✅Success', `${eventsToSync.length} Events Synced Successfully!`,);
    } catch (error) {
      console.error('Sync failed:', error.message);
      Alert.alert('Sync Failed', error.message);
      // Data stays safe in AsyncStorage
    } finally {
    setSyncing(false);
    }
  };
  
  const testConnection = async () => {
    try {
      const { data, error } = await supabase
      .from('downtime_events')
      .select('count', { count: 'exact', head: true });
      
      if (data) {
        Alert.alert('✅ Connected!', `Found ${data[0].count} events`);
    }
  } catch (error) {
    Alert.alert('❌ Connection failed', error.message);
  }
};



  const acknowledgeEvent = (event) => {
    setOperatorEvents(prev => {
      const updated = prev.map(e => 
        e.id === event.id 
          ? { 
              ...e, 
              status: 'acknowledged',
              acknowledged_by: email,
              acknowledged_at: new Date().toISOString()
            }
          : e
      ).filter(e => e.status !== 'cleared');
      
      saveAllData();
      return updated;
    });
    Alert.alert( `Event acknowledged by ${email}✅`);
  };

  const getTopReason = (machineId) => {
    const machineEvents = pendingQueue.filter(e => e.machine_id === machineId && e.type === 'downtime');
    if (machineEvents.length === 0) return 'None';
    const reasonCounts = {};
    machineEvents.forEach(e => {
      reasonCounts[e.reason_label] = (reasonCounts[e.reason_label] || 0) + 1;
    });
    const topReason = Object.entries(reasonCounts).sort(([,a], [,b]) => b - a)[0];
    return topReason ? `${topReason[0]} (${topReason[1]}x)` : 'None';
  };

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

  const renderMachineCard = ({ item }) => (
    <View style={styles.machineCardContainer}>
      
      <TouchableOpacity 
        style={[styles.machineCard, getMachineCardStyle(item.status)]}
        onPress={() => startDowntime(item)}
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
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTime}>Active: 6:45</Text>
          <Text style={styles.summaryTime}>Idle: 1:23</Text>
          <Text style={styles.summaryCount}>Count: 247</Text>
          <Text style={styles.summaryReasons}>Top: {getTopReason(item.id)}</Text>
        </View>
      </TouchableOpacity>

      {maintenanceItems.filter(m => m.machineId === item.id).map(mItem => (
        <TouchableOpacity
          key={mItem.id}
          style={[
            styles.maintenanceCard, 
            mItem.status === 'overdue' && styles.maintenanceOverdue,
            mItem.status === 'done' && styles.maintenanceDone
          ]}
          onPress={() => completeMaintenance(mItem)}
        >
          <View style={styles.maintenanceLeft}>
            <Text style={styles.maintenanceTitle}>{mItem.title}</Text>
            <Text style={styles.maintenanceStatus}>{mItem.status.toUpperCase()}</Text>
          </View>
          {mItem.status !== 'done' && (
            <View style={styles.completeBtnIcon}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
  

  const renderOperatorEvent = ({ item }) => (
  <View style={[
    styles.eventCard, 
    item.status === 'acknowledged' && styles.eventAcknowledged
  ]}>
    <Ionicons name={item.icon} size={24} color="#10b981" />
    <View style={styles.eventContent}>
      <Text style={styles.eventType}>{item.type}</Text>
      <Text style={styles.eventDesc}>
        {item.full_reason_path || item.reason || item.task || 'No reason'}
      </Text>
      
      {(item.photo_uri || item.photo_base64) && (
        <TouchableOpacity 
          style={{ alignItems: 'center', marginTop: 8 }}
          onPress={() => {
            Alert.alert(
              'Photo Preview',
              'Tap to view fullscreen!',
              [
                { text: 'View Fullscreen', onPress: () => setModalPhoto({ uri: item.photo_uri || item.photo_base64 }) },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <Image 
            source={{ uri: item.photo_uri || item.photo_base64 }} 
            style={[
              styles.eventPhoto, 
              { backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#10b981', borderRadius: 12 }
            ]}
            resizeMode="cover"
          />
          <Text style={{fontSize: 11, color: '#10b981', marginTop: 4, fontWeight: '600'}}>
            📸 Tap to enlarge
          </Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.eventTime}>
        {item.machine} • {item.time} by {item.user}
        {item.status === 'acknowledged' && ` • ACK: ${item.acknowledged_by}`}
      </Text>
    </View>
    
    {item.status === 'created' && (
      <TouchableOpacity style={styles.ackBtn} onPress={() => acknowledgeEvent(item)}>
        <Ionicons name="checkmark-outline" size={16} color="white" />
      </TouchableOpacity>
    )}
  </View>
);


  
  const pendingCount = pendingQueue.length;

  if (screen === 'downtime') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.reasonHeader}>
          <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.machineNameHeader}>{selectedMachine?.name}</Text>
          <TouchableOpacity onPress={toggleOnlineStatus}>
            <Text style={[styles.networkText, { color: isOnline ? '#10b981' : '#ef4444' }]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={[{ id: 'content' }]}
          renderItem={() => (
            <View style={styles.downtimeContent}>
              <Text style={styles.reasonTitle}>
                {currentLevel === 0 ? 'SELECT REASON' : selectedReason?.label}
              </Text>

              <FlatList
                data={currentReasons}
                scrollEnabled={false}
                style={styles.reasonNestedList}
                contentContainerStyle={styles.reasonList}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.reasonCard} onPress={() => selectReasonLevel(item)}>
                    <View style={styles.reasonIconContainer}>
                      <Ionicons name={item.icon} size={24} color="#10b981" />
                    </View>
                    <Text style={styles.reasonLabel}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => item.code || index.toString()}
              />

              {currentLevel === 1 && (
                <>
                  <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                    <Ionicons name={photoUri ? "checkmark-circle" : "camera-outline"} size={24} color="#10b981" />
                    <Text style={styles.photoBtnText}>
                      {photoUri ? '✅ Photo Added' : '📸 Add Photo'}
                    </Text>
                  </TouchableOpacity>
                  {photoUri && <Image source={{ uri: photoUri }} style={styles.photoPreview} />}
                  
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Notes (optional)"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />
                  
                  <TouchableOpacity style={styles.submitBtn} onPress={() => handleDowntimeSubmit(currentReasons[0])}>
                    <Text style={styles.submitBtnText}>SUBMIT DOWNTIME{currentReasons[0]?.label}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
          keyExtractor={() => 'downtime-content'}
          style={{ flex: 1 }}
        />
      </View>
    );
  }

  if (screen === 'login') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
        <View style={styles.gradientHeader}>
          <View style={styles.factoryIconContainer}>
            <Text style={styles.factoryEmoji}>🏭</Text>
          </View>
          <Text style={styles.appTitle}>Downtime Tracker</Text>
          <Text style={styles.appSubtitle}>Industrial Downtime Alerts Management App</Text>
          <Text style={styles.tenantId}>Tenant: {TENANT_ID}</Text>
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
          <TouchableOpacity style={styles.loginBtn} onPress={login}>
            <Ionicons name="enter-outline" size={20} color="white" />
            <Text style={styles.loginBtnText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }


  // HOME SCREEN - FIXED STRUCTURE


return (
  <>
    {/* ✅ FULLSCREEN PHOTO MODAL */}
    {modalPhoto && (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalPhoto(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setModalPhoto(null)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalClose} 
              onPress={() => setModalPhoto(null)}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            
            <Image 
              source={{ uri: modalPhoto.uri }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      </Modal>
    )}

    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.dashboardHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name={role === 'operator' ? "construct-outline" : "shield-checkmark-outline"} 
            size={24} color="#1e293b" />
          <View>
            <Text style={styles.roleTitle}>{role.toUpperCase()}</Text>
            <Text style={styles.roleSubtitle}>{email}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {role === 'operator' && badgeCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>{badgeCount}</Text>
            </View>
          )}
          <TouchableOpacity onPress={toggleOnlineStatus}>
            <Text style={[styles.onlineStatus, { color: isOnline ? '#10b981' : '#ef4444' }]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </TouchableOpacity>
          
          {role === 'supervisor' && (
            <TouchableOpacity 
              style={[
                styles.syncBtnHeader, 
                (badgeCount === 0 || !isOnline) && styles.syncBtnDisabled,
                syncing && styles.syncing
              ]}
              onPress={syncEvents}
              disabled={badgeCount === 0 || !isOnline}
            >
              <Ionicons 
                name={syncing ? "sync" : "sync-outline"} 
                size={16} 
                color={(badgeCount === 0 || !isOnline) ? '#9ca3af' : 'white'} 
              />
              {badgeCount > 0 && (
                <Text style={styles.syncBadge}>{badgeCount}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>MACHINES ({machines.length})</Text>
        
        <FlatList
          data={machines}
          renderItem={renderMachineCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.machineList, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            role === 'supervisor' && operatorEvents.length > 0 ? (
              <View style={styles.eventsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="notifications-outline" size={20} color="#ef4444" />
                  <Text style={styles.eventsSectionTitle}>OPERATOR EVENTS ({operatorEvents.length})</Text>
                </View>
                <FlatList
                  data={operatorEvents.slice(0, 10)}
                  renderItem={renderOperatorEvent}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            ) : null
          }
        />
      </View>

      <TouchableOpacity 
        style={styles.logoutBtn} 
        onPress={async () => {
          await AsyncStorage.multiRemove(['jwt', 'role', 'pendingQueue', 'machines', 'operatorEvents']);
          setScreen('login');
        }}
      >
        <Ionicons name="log-out-outline" size={16} color="white" />
        <Text style={styles.logoutText}>LOGOUT</Text>
      </TouchableOpacity>
    </View>
  </>
);
}

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
    lineHeight: 64 
  },
  appTitle: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: 'white', 
    letterSpacing: 1.5 
  },
  appSubtitle: { 
    fontSize: 16, 
    color: '#bfdbfe', 
    marginTop: 6, 
    fontWeight: '500' 
  },
  tenantId: { 
    fontSize: 12, 
    color: '#94a3b8', 
    marginTop: 12, 
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
  roleToggle: { 
    flexDirection: 'row', 
    marginBottom: 24 
  },
  eventPhoto: {
  width: 60,
  height: 60,
  borderRadius: 8,
  marginTop: 8,
  borderWidth: 2,
  borderColor: '#e2e8f0',
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

  // Dashboard Header
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
    alignItems: 'center' 
  },
  roleTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#1e293b', 
    marginLeft: 12 
  },
  roleSubtitle: { 
    fontSize: 13, 
    color: '#64748b', 
    marginLeft: 12, 
    fontWeight: '600' 
  },
  headerRight: { 
    flexDirection: 'row', 
    alignItems: 'center' 
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
    fontSize: 12 
  },
  onlineStatus: { 
    fontSize: 12, 
    fontWeight: '700', 
    marginRight: 12, 
    textTransform: 'uppercase' 
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
  syncBadge: { 
    color: 'white', 
    fontSize: 10, 
    fontWeight: 'bold', 
    position: 'absolute', 
    top: -4, 
    right: -4, 
    backgroundColor: '#ef4444', 
    borderRadius: 8, 
    minWidth: 16, 
    textAlign: 'center' 
  },
  syncBtnDisabled: { 
    backgroundColor: '#9ca3af' 
  },
  syncing: { 
    backgroundColor: '#f59e0b' 
  },

  // Main content
  sectionTitle: {
    fontSize: 20, 
    fontWeight: '900', 
    color: 'white', 
    textAlign: 'center',
    margin: 20, 
    marginBottom: 12, 
    letterSpacing: 0.5,
  },
  machineList: { 
    paddingBottom: 140 
  },
  machineCardContainer: { 
    marginHorizontal: 16, 
    marginBottom: 16 
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
  },
  machineCardRunning: { 
    borderLeftWidth: 5, 
    borderLeftColor: '#10b981' 
  },
  machineCardIdle: { 
    borderLeftWidth: 5, 
    borderLeftColor: '#f59e0b' 
  },
  machineCardOff: { 
    borderLeftWidth: 5, 
    borderLeftColor: '#ef4444' 
  },
  machineHeader: { 
    flex: 1 
  },
  machineInfo: { 
    marginBottom: 6 
  },
  machineName: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#1e293b', 
    marginBottom: 2 
  },
  machineType: { 
    fontSize: 14, 
    color: '#64748b', 
    fontWeight: '600', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
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
    textTransform: 'uppercase' 
  },

  // Summary & Maintenance
  summaryCard: { 
    backgroundColor: 'rgba(16,185,129,0.1)', 
    padding: 12, 
    borderRadius: 12, 
    marginTop: 12 
  },
  summaryTime: { 
    fontSize: 12, 
    color: '#10b981', 
    fontWeight: '600' 
  },
  summaryCount: { 
    fontSize: 12, 
    color: 'white', 
    fontWeight: '800', 
    marginTop: 4 
  },
  summaryReasons: { 
    fontSize: 11, 
    color: '#f59e0b', 
    fontWeight: '700', 
    marginTop: 2 
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
    borderLeftColor: '#ef4444' 
  },
  maintenanceDone: { 
    borderLeftWidth: 4, 
    borderLeftColor: '#10b981', 
    opacity: 0.7 
  },
  maintenanceLeft: { 
    flex: 1 
  },
  maintenanceTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1e293b', 
    marginBottom: 2 
  },
  maintenanceStatus: { 
    fontSize: 12, 
    color: '#64748b', 
    fontWeight: '700', 
    textTransform: 'uppercase' 
  },
  completeBtnIcon: { 
    backgroundColor: '#10b981', 
    padding: 10, 
    borderRadius: 10, 
    minWidth: 48, 
    alignItems: 'center' 
  },

  // Events Section
  eventsSection: {
    margin: 20,
    marginBottom: 100,
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
  eventsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 10,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  eventAcknowledged: { 
    opacity: 0.7, 
    backgroundColor: '#ecfdf5' 
  },
  eventIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventType: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  ackBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 44,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Downtime Screen
  reasonHeader: {
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 60, 
    backgroundColor: 'white',
  },
  backBtn: { 
    padding: 6 
  },
  machineNameHeader: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#1e293b', 
    flex: 1, 
    textAlign: 'center' 
  },
  networkText: { 
    fontSize: 12, 
    fontWeight: '700' 
  },
  reasonTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: 'white', 
    textAlign: 'center', 
    margin: 20 
  },
  reasonList: { 
    paddingBottom: 20 
  },
  reasonNestedList: {
    maxHeight: 300,
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
    fontSize: 22 
  },
  reasonLabel: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1e293b' 
  },

  // Photo & Notes
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photoBtnText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  photoPreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#f1f5f9',
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  submitBtn: {
    backgroundColor: '#ef4444',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Logout
  scrollContainer: {
    flex: 1,
    paddingBottom: 120,
  },
  eventsFlatList: {
    maxHeight: 300,
  },
  logoutBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 1000,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.9)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
},
modalClose: {
  position: 'absolute',
  top: 60,
  right: 20,
  zIndex: 1000,
  backgroundColor: 'rgba(0,0,0,0.5)',
  borderRadius: 20,
  padding: 8,
},
modalImage: {
  flex: 1,
  width: '100%',
  height: '100%',
  resizeMode: 'contain',
},
  logoutText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '800', 
    marginLeft: 8,
    letterSpacing: 0.5
  }
});  // ✅ THIS IS THE FINAL LINE