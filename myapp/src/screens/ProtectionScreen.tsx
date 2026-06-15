import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../hooks/storeHooks';
import { addBlockedDomain, removeBlockedDomain, clearLogs } from '../store/slices';
import HayaShieldService from '../services/HayaShieldService';

export default function ProtectionScreen() {
  const dispatch = useAppDispatch();
  const { blockedDomains, blockedLogs, vpnEnabled } = useAppSelector((state) => state.protection);
  const [newDomain, setNewDomain] = useState('');

  const handleAddDomain = () => {
    const trimmed = newDomain.trim().toLowerCase();
    if (!trimmed) return;
    
    // Simple domain regex validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(trimmed)) {
      Alert.alert('Invalid Domain', 'Please enter a valid domain (e.g., example.com).');
      return;
    }

    if (blockedDomains.includes(trimmed)) {
      Alert.alert('Duplicate Domain', 'This domain is already in your blacklist.');
      return;
    }

    dispatch(addBlockedDomain(trimmed));
    
    // Sync blocklist to native module
    const updatedList = [...blockedDomains, trimmed];
    HayaShieldService.setBlockedDomains(updatedList);
    
    setNewDomain('');
  };

  const handleRemoveDomain = (domain: string) => {
    dispatch(removeBlockedDomain(domain));
    
    // Sync blocklist to native module
    const updatedList = blockedDomains.filter(d => d !== domain);
    HayaShieldService.setBlockedDomains(updatedList);
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all blocked history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => dispatch(clearLogs()) }
      ]
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hrs = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    const secs = date.getSeconds().toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <View style={styles.container}>
      {/* 1. Custom Domain Input */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Add Custom Blocked Domain</Text>
        <Text style={styles.sectionSub}>Force block additional tracking, gambling or adult domains.</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="e.g., ads-server.com"
            placeholderTextColor="#80A0A0"
            value={newDomain}
            onChangeText={setNewDomain}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddDomain}>
            <Ionicons name="add" size={24} color="#1B443E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Block List / Log Toggle Tabs */}
      <View style={styles.logHeader}>
        <View style={styles.logHeaderTitleContainer}>
          <Ionicons name="receipt-outline" size={20} color="#ECCF8E" />
          <Text style={styles.logHeaderTitle}>Interception Log</Text>
        </View>
        {blockedLogs.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearLogs}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 3. Blocked Logs List */}
      <FlatList
        data={blockedLogs}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <View style={styles.logItemLeft}>
              <View style={styles.redIndicator} />
              <View>
                <Text style={styles.logDomain} numberOfLines={1}>
                  {item.domain}
                </Text>
                <Text style={styles.logType}> Harmful Domain Intercepted</Text>
              </View>
            </View>
            <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#ECCF8E" style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>No websites blocked yet today.</Text>
            <Text style={styles.emptySub}>
              {vpnEnabled 
                ? 'Your local VPN is active and checking domains.'
                : 'Turn on the shield from the Home tab to filter traffic.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#112D2D',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  sectionCard: {
    backgroundColor: '#1B443E',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(236, 207, 142, 0.15)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionSub: {
    fontSize: 12,
    color: '#E0E0E0',
    marginTop: 4,
    opacity: 0.8,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    backgroundColor: '#112D2D',
    color: '#FFFFFF',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(236, 207, 142, 0.2)',
  },
  addBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#ECCF8E',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logHeaderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(236, 207, 142, 0.1)',
  },
  clearBtnText: {
    fontSize: 12,
    color: '#ECCF8E',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C2727',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  logItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  redIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4D4D',
    marginRight: 10,
  },
  logDomain: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logType: {
    fontSize: 10,
    color: '#A0A0A0',
    marginTop: 2,
  },
  logTime: {
    fontSize: 11,
    color: '#ECCF8E',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 15,
  },
  emptySub: {
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
    lineHeight: 18,
  },
});
