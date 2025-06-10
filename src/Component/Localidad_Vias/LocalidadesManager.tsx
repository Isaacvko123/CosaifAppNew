// LocalidadesManager.tsx
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import LocalidadVias from './LocalidadVias';
import AgregarLocalidad from './AgregarLocalidad';
import EditarLocalidad from './EditarLocalidad';

type Screen = 
  | { name: 'LIST' }
  | { name: 'ADD' }
  | { name: 'EDIT'; localidadId: number }
  | { name: 'EDIT_VIAS'; localidadId: number };

export default function LocalidadesManager() {
  const [screen, setScreen] = useState<Screen>({ name: 'LIST' });

  return (
    <SafeAreaView style={styles.container}>
      {screen.name === 'LIST' && (
        <LocalidadVias
          onAddLocalidad={() => setScreen({ name: 'ADD' })}
          onEditLocalidad={(loc) => setScreen({ name: 'EDIT', localidadId: loc.id })}
        />
      )}

      {screen.name === 'ADD' && (
        <AgregarLocalidad onFinish={() => setScreen({ name: 'LIST' })} />
      )}

      {screen.name === 'EDIT' && (
        <EditarLocalidad
          localidadId={screen.localidadId}
          onFinish={() => setScreen({ name: 'LIST' })}
          onEditVias={() => setScreen({ name: 'EDIT_VIAS', localidadId: screen.localidadId })}
        />
      )}

      {screen.name === 'EDIT_VIAS' && (
        <CrearVias
          localidadId={screen.localidadId}
          onComplete={() => setScreen({ name: 'EDIT', localidadId: screen.localidadId })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
});
