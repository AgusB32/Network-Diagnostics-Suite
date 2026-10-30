/**
 * CreateReportScreen — RF-05, RF-06: register installation with photos + GPS, generate PDF.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, TextInput,
  Image, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { Button, Card } from '../components/atoms';
import { Colors, Spacing, Typography, CommonStyles, Radius } from '../theme';
import { createReport } from '../../application/container';
import type { InstallationReport } from '../../domain/entities/InstallationReport';

export const CreateReportScreen: React.FC = () => {
  const [siteName, setSiteName] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<InstallationReport | null>(null);

  const addPhoto = useCallback((fromCamera: boolean) => {
    const options = { mediaType: 'photo' as const, quality: 0.8 as const, selectionLimit: 5 };
    const handler = (response: ImagePickerResponse) => {
      if (response.assets) {
        const uris = response.assets
          .map(a => a.uri)
          .filter((u): u is string => !!u);
        setPhotoUris(prev => [...prev, ...uris]);
      }
    };
    if (fromCamera) {
      launchCamera(options, handler);
    } else {
      launchImageLibrary(options, handler);
    }
  }, []);

  const removePhoto = useCallback((uri: string) => {
    setPhotoUris(prev => prev.filter(u => u !== uri));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!siteName.trim() || !technicianName.trim()) {
      Alert.alert('Validation', 'Site name and technician name are required.');
      return;
    }
    setLoading(true);
    try {
      const report = await createReport.execute({
        siteName: siteName.trim(),
        technicianName: technicianName.trim(),
        notes: notes.trim(),
        photoUris,
      });
      setCreated(report);
      Alert.alert(
        'Report Created',
        `Report #${report.id.slice(0, 8)} created and queued for sync.\n\nPDF: ${report.pdfPath ?? 'unavailable'}`,
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not create report');
    } finally {
      setLoading(false);
    }
  }, [siteName, technicianName, notes, photoUris]);

  return (
    <SafeAreaView style={CommonStyles.safeArea}>
      <ScrollView
        style={CommonStyles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[Typography.h2, styles.title]}>New Installation Report</Text>

        {/* Form */}
        <Card style={styles.card}>
          <Text style={[Typography.label, styles.fieldLabel]}>Site Name *</Text>
          <TextInput
            style={CommonStyles.textInput}
            value={siteName}
            onChangeText={setSiteName}
            placeholder="e.g. Building A — Server Room"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={[Typography.label, styles.fieldLabel]}>Technician Name *</Text>
          <TextInput
            style={CommonStyles.textInput}
            value={technicianName}
            onChangeText={setTechnicianName}
            placeholder="Full name"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={[Typography.label, styles.fieldLabel]}>Technical Notes</Text>
          <TextInput
            style={[CommonStyles.textInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Describe the installation, configuration, issues found…"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </Card>

        {/* Photos */}
        <Card style={styles.card}>
          <Text style={[Typography.label, { marginBottom: Spacing.sm }]}>
            Photo Evidence ({photoUris.length})
          </Text>
          <View style={styles.photoActions}>
            <Button
              label="📷 Camera"
              onPress={() => addPhoto(true)}
              variant="secondary"
              style={styles.photoBtn}
            />
            <Button
              label="🖼 Gallery"
              onPress={() => addPhoto(false)}
              variant="secondary"
              style={styles.photoBtn}
            />
          </View>
          {photoUris.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photosScroll}
            >
              {photoUris.map(uri => (
                <TouchableOpacity
                  key={uri}
                  onLongPress={() => removePhoto(uri)}
                  style={styles.photoThumb}
                >
                  <Image source={{ uri }} style={styles.photoImg} />
                  <Text style={styles.removeHint}>Hold to remove</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Card>

        {/* GPS note */}
        <View style={styles.gpsNote}>
          <Text style={Typography.bodySmall}>
            📍 GPS coordinates will be captured automatically when you create the report.
            Ensure location permissions are granted.
          </Text>
        </View>

        <Button
          label={loading ? 'Creating Report…' : 'Create Report & Generate PDF'}
          onPress={handleCreate}
          loading={loading}
          style={{ marginHorizontal: Spacing.md }}
        />

        {created && (
          <Card style={[styles.card, { borderColor: Colors.success }]}>
            <Text style={[Typography.label, { color: Colors.success, marginBottom: Spacing.xs }]}>
              Report Created Successfully
            </Text>
            <Text style={Typography.body}>ID: {created.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={Typography.body}>Status: {created.syncStatus}</Text>
            {created.pdfPath && (
              <Text style={[Typography.bodySmall, { marginTop: Spacing.xs }]}>
                PDF: {created.pdfPath}
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.xxl },
  title: { padding: Spacing.md },
  card: { margin: Spacing.md },
  fieldLabel: { marginBottom: Spacing.xs, marginTop: Spacing.sm },
  notesInput: { height: 120 },
  photoActions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  photoBtn: { flex: 1 },
  photosScroll: { marginTop: Spacing.sm },
  photoThumb: {
    marginRight: Spacing.sm,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    width: 100,
  },
  photoImg: {
    width: 100,
    height: 100,
    borderRadius: Radius.sm,
  },
  removeHint: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  gpsNote: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
  },
});
