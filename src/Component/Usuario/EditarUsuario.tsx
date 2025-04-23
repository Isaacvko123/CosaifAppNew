import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { formStylesPorRol, rolFormMap } from './FormStyles';

interface UserData {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  empresaId: number;
  activo: boolean;
  empresa?: { nombre: string };
}

interface EditarnombreProps {
  onFinish: () => void;
  userData?: UserData;
}

const Editarnombre: React.FC<EditarnombreProps> = ({ onFinish, userData: propUserData }) => {
  const [userData, setUserData] = useState<UserData | null>(propUserData || null);
  const [loading, setLoading] = useState<boolean>(!propUserData);

  const [nombre, setnombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!propUserData) {
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const parsedUser: UserData = JSON.parse(storedUser);
            setUserData(parsedUser);
            setnombre(parsedUser.nombre);
            setEmail(parsedUser.email);
          }
        } else {
          setnombre(propUserData.nombre);
          setEmail(propUserData.email);
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [propUserData]);

  const handleSave = async () => {
    if (!nombre || !email) {
      Alert.alert('Error', 'Completa los campos obligatorios: nombre y email.');
      return;
    }
    if (!/^\S+$/.test(nombre)) {
      Alert.alert('Error', 'El nombre no debe contener espacios.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Error', 'Ingresa un correo electrónico válido.');
      return;
    }
    if (password) {
      if (password.length < 8) {
        Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden.');
        return;
      }
    }

    const updatedUser: Partial<UserData> & { contrasena?: string } = { nombre, email };
    if (password) {
      updatedUser.contrasena = password;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://192.168.101.20:3000/usuarios/${userData!.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedUser),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Error', data.error || 'Error al actualizar el usuario.');
        return;
      }
      await AsyncStorage.setItem('user', JSON.stringify(data));
      Alert.alert('Guardado', 'Datos actualizados correctamente.');
      onFinish();
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No se encontraron datos del usuario.</Text>
      </View>
    );
  }

  const roleKey = rolFormMap[userData.rol] || 'CLIENTE';
  const dynamicStyles = formStylesPorRol[roleKey];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={[styles.title, { color: dynamicStyles.title.color }]}>
          <FontAwesome5 name="user-edit" size={24} color={dynamicStyles.title.color} /> Editar nombre
        </Text>

        <View style={styles.inputWrapper}>
          <FontAwesome5 name="user" size={18} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setnombre}
            placeholder="Nombre"
            placeholderTextColor="#BBB"
          />
        </View>

        <View style={styles.inputWrapper}>
          <FontAwesome5 name="envelope" size={18} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#BBB"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputWrapper}>
          <FontAwesome5 name="lock" size={18} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor="#BBB"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
            <FontAwesome5 name={showPassword ? 'eye' : 'eye-slash'} size={18} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <FontAwesome5 name="lock" size={18} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirmar Contraseña"
            placeholderTextColor="#BBB"
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(prev => !prev)}>
            <FontAwesome5 name={showConfirmPassword ? 'eye' : 'eye-slash'} size={18} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: dynamicStyles.confirmButton.backgroundColor }]}
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onFinish}>
            <Text style={styles.buttonText}>Regresar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Editarnombre;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#EEF2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  card: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#B2BABB',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
