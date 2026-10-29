import React, { useState } from 'react';
import { SafeAreaView, View, Text, Button, FlatList, TextInput, Alert, StyleSheet } from 'react-native';
import * as Contacts from 'expo-contacts';
import { StatusBar } from 'expo-status-bar';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:5000';

export default function App() {
  const [contacts, setContacts] = useState([]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState({});
  const [status, setStatus] = useState('Contacts are not loaded.');
  async function loadContacts() {
    setLoading(true);
    try {
      const permission = await Contacts.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setStatus('Contacts permission was not granted.');
        return;
      }
      const result = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers] });
      const normalized = result.data.map(c => ({
        id: c.id,
        name: c.name || '',
        phone: c.phoneNumbers?.find(p => p.number)?.number || ''
      })).filter(c => c.phone);
      setContacts(normalized);
      setStatus(`${normalized.length} contacts found. Select only contacts appropriate to import.`);
    } catch (e) { setStatus(e.message); }
    finally { setLoading(false); }
  }
  async function importSelected() {
    const chosen = contacts.filter(c => selected[c.id]);
    if (!chosen.length) return Alert.alert('Select contacts', 'Choose at least one contact to import.');
    if (!token.trim()) return Alert.alert('Login token required', 'Sign in through the web app/API and paste the API bearer token here. Do not share it with anyone.');
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/contacts/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token.trim()}` },
        body: JSON.stringify({ source: 'android', contacts: chosen.map(c => ({ name: c.name, phone: c.phone, sourceContactId: c.id })) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed');
      setStatus(`${data.imported} imported/updated; ${data.skipped} skipped. Consent remains unknown until valid evidence is recorded.`);
    } catch (e) { setStatus(e.message); }
    finally { setLoading(false); }
  }
  return <SafeAreaView style={styles.page}><StatusBar style="dark"/><Text style={styles.kicker}>WEBXWHALE</Text><Text style={styles.title}>Contact Sync</Text><Text style={styles.desc}>Contacts are read only after permission. Select contacts explicitly before importing.</Text>
    <TextInput style={styles.input} value={token} onChangeText={setToken} placeholder="API bearer token" autoCapitalize="none" secureTextEntry/>
    <View style={styles.button}><Button title={loading ? 'Please wait…' : 'Read phone contacts'} onPress={loadContacts} disabled={loading}/></View>
    <Text style={styles.status}>{status}</Text>
    <FlatList data={contacts} keyExtractor={item => item.id} renderItem={({item})=><Text onPress={()=>setSelected(s=>({...s,[item.id]:!s[item.id]}))} style={[styles.contact,selected[item.id]&&styles.selected]}>{selected[item.id]?'✓  ':'○  '}{item.name} · {item.phone}</Text>} />
    <View style={styles.button}><Button title="Import selected contacts" onPress={importSelected} disabled={loading}/></View>
    <Text style={styles.foot}>Import does not grant marketing consent. Keep the API token private. For production, replace manual token entry with a secure sign-in flow.</Text>
  </SafeAreaView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#f5f7fb',padding:20},kicker:{color:'#4c5be4',fontWeight:'800',letterSpacing:2,marginTop:12},title:{fontSize:28,fontWeight:'800',color:'#18233a',marginTop:6},desc:{color:'#68768d',lineHeight:21,marginVertical:12},input:{backgroundColor:'#fff',borderColor:'#dce3ef',borderWidth:1,borderRadius:10,padding:12,marginVertical:7},button:{marginVertical:7},status:{color:'#46536a',fontSize:12,marginVertical:8},contact:{backgroundColor:'#fff',padding:12,marginVertical:3,borderRadius:8,color:'#26334a'},selected:{backgroundColor:'#e8edff',color:'#3546c4'},foot:{fontSize:10,color:'#8994a6',lineHeight:16,marginTop:10,marginBottom:12}});
