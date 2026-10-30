/**
 * QrScannerScreen — RF-04: scan QR/barcode and associate asset tag to a device.
 * Uses react-native-vision-camera + vision-camera-code-scanner.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Alert, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  useCameraFormat,
  useCodeScanner,
} from 'react-native-vision-camera';
import { Button, Card } from '../components/atoms';
import { Colors, Spacing, Typography, CommonStyles, Radius } from '../theme';
import { deviceRepo } from '../../application/container';

interface QrScannerScreenProps {
  route?: any;
}

export const QrScannerScreen: React.FC<QrScannerScreenProps> = ({ route }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [scanned, setScanned] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [associating, setAssociating] = useState(false);

  // The device to associate (passed from DeviceDetail screen)
  const targetDevice = route?.params?.device;

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39'],
    onCodeScanned: async (codes) => {
      if (scanned || codes.length === 0) {return;}
      const code = codes[0].value;
      if (!code) {return;}

      setScanned(true);
      setLastCode(code);

      if (targetDevice) {
        setAssociating(true);
        try {
          await deviceRepo.save({
            ...targetDevice,
            assetTag: code,
            // If code looks like a URL, save as technical sheet URL
            technicalSheetUrl: code.startsWith('http') ? code : undefined,
          });
          Alert.alert(
            'Asset Tag Linked',
            `Code "${code}" linked to device ${targetDevice.ip}`,
          );
        } catch (err: any) {
          Alert.alert('Error', err?.message);
        } finally {
          setAssociating(false);
        }
      }
    },
  });

  if (!hasPermission) {
    return (
      <SafeAreaView style={CommonStyles.safeArea}>
        <View style={[CommonStyles.screen, CommonStyles.center, { padding: Spacing.xl }]}>
          <Text style={[Typography.h3, { textAlign: 'center', marginBottom: Spacing.md }]}>
            Camera Permission Required
          </Text>
          <Text style={[Typography.body, { textAlign: 'center', marginBottom: Spacing.lg }]}>
            The QR scanner needs camera access to scan device asset tags.
          </Text>
          <Button label="Grant Permission" onPress={requestPermission} />
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={CommonStyles.safeArea}>
        <View style={[CommonStyles.screen, CommonStyles.center]}>
          <Text style={Typography.h3}>No camera available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!scanned}
        codeScanner={codeScanner}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Viewfinder */}
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={styles.hint}>
          Point camera at QR code or barcode on the equipment
        </Text>

        {lastCode && (
          <Card style={styles.resultCard}>
            <Text style={[Typography.label, { marginBottom: Spacing.xs }]}>Scanned Code</Text>
            <Text style={[Typography.mono, { marginBottom: Spacing.sm }]}>{lastCode}</Text>
            {lastCode.startsWith('http') && (
              <Button
                label="Open Technical Sheet"
                onPress={() => Linking.openURL(lastCode)}
                variant="ghost"
                style={{ marginBottom: Spacing.sm }}
              />
            )}
            <Button
              label="Scan Again"
              onPress={() => {
                setScanned(false);
                setLastCode(null);
              }}
              variant="secondary"
            />
          </Card>
        )}
      </View>
    </View>
  );
};

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = Colors.primary;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  viewfinder: {
    width: 260,
    height: 260,
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  hint: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: Spacing.xl,
    textShadowColor: 'black',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  resultCard: {
    width: '100%',
    backgroundColor: Colors.bgCard + 'ee',
  },
});
