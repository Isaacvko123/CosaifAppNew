import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { formStyles as styles } from './formStyles';
import { MovementFormData } from './NewMovementForm';

interface StepOneProps {
  formData: MovementFormData;
  setFormData: React.Dispatch<React.SetStateAction<MovementFormData>>;
  errors: {
    locomotiveNumber?: string;
    fromTrack?: string;
    toTrack?: string;
  };
  predefinedTracks: number[];
  showFromOptions: boolean;
  setShowFromOptions: React.Dispatch<React.SetStateAction<boolean>>;
  showToOptions: boolean;
  setShowToOptions: React.Dispatch<React.SetStateAction<boolean>>;
}

const StepOne: React.FC<StepOneProps> = ({
  formData,
  setFormData,
  errors,
  predefinedTracks,
  showFromOptions,
  setShowFromOptions,
  showToOptions,
  setShowToOptions,
}) => {
  return (
    <View>
      <Text style={styles.label}>Número de locomotora:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ingresa número de locomotora"
        value={formData.locomotiveNumber}
        onChangeText={(text) =>
          setFormData({ ...formData, locomotiveNumber: text })
        }
      />
      {errors.locomotiveNumber && (
        <Text style={styles.errorText}>{errors.locomotiveNumber}</Text>
      )}

      <Text style={styles.label}>De vía:</Text>
      <TouchableOpacity onPress={() => setShowFromOptions(!showFromOptions)}>
        <TextInput
          style={styles.input}
          placeholder="Ejemplo: Vía 1"
          value={formData.fromTrack.toString()}
          editable={false}
        />
      </TouchableOpacity>
      {errors.fromTrack && (
        <Text style={styles.errorText}>{errors.fromTrack}</Text>
      )}
      {showFromOptions && (
        <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
          {predefinedTracks.map((track) => (
            <TouchableOpacity
              key={track.toString()}
              onPress={() => {
                setFormData({ ...formData, fromTrack: track.toString() });
                setShowFromOptions(false);
              }}
            >
              <Text style={styles.optionText}>{`Vía ${track}`}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={styles.label}>Para vía:</Text>
      <TouchableOpacity onPress={() => setShowToOptions(!showToOptions)}>
        <TextInput
          style={styles.input}
          placeholder="Ejemplo: Vía 2"
          value={formData.toTrack.toString()}
          editable={false}
        />
      </TouchableOpacity>
      {errors.toTrack && (
        <Text style={styles.errorText}>{errors.toTrack}</Text>
      )}
      {showToOptions && (
        <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
          {predefinedTracks.map((track) => (
            <TouchableOpacity
              key={track.toString()}
              onPress={() => {
                setFormData({ ...formData, toTrack: track.toString() });
                setShowToOptions(false);
              }}
            >
              <Text style={styles.optionText}>{`Vía ${track}`}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default StepOne;
