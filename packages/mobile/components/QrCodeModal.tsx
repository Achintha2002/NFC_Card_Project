// ============================================================
//  TAGIT Mobile — Offline-Ready QR Code Modal Component
//  Displays vector QR code with embedded TAGIT/Profile branding,
//  haptic feedback, copy URL to clipboard, and native Share action.
// ============================================================

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Clipboard,
  Dimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { Colors, Radius, Typography, Shadow } from '../constants/theme';

interface QrCodeModalProps {
  visible: boolean;
  onClose: () => void;
  profileUrl: string;
  username?: string;
  displayName?: string;
}

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width * 0.65, 260);

export function QrCodeModal({
  visible,
  onClose,
  profileUrl,
  username = 'profile',
  displayName = 'TAGIT Profile',
}: QrCodeModalProps) {
  const handleCopyUrl = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Clipboard.setString(profileUrl);
    Toast.show({
      type: 'success',
      text1: 'Link Copied! 📋',
      text2: 'Profile URL is ready to paste anywhere.',
      position: 'bottom',
    });
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Connect with me on TAGIT! Scan my profile QR or tap the link: ${profileUrl}`,
        url: profileUrl, // iOS uses url field
        title: `${displayName} on TAGIT`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.modalCard, Shadow.lg]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.badgeText}>INSTANT CONNECT ⚡</Text>
              <Text style={styles.title}>{displayName}</Text>
              <Text style={styles.subtitle}>@{username}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* QR Code Container with Glowing Frame */}
          <View style={styles.qrOuterFrame}>
            <View style={styles.qrInnerBox}>
              <QRCode
                value={profileUrl || 'https://tagit.lk'}
                size={QR_SIZE}
                color="#0A0A12"
                backgroundColor="#FFFFFF"
                quietZone={10}
              />
            </View>
            <View style={styles.tagitBrandBar}>
              <Text style={styles.brandBarText}>TAGIT • SMART NFC</Text>
            </View>
          </View>

          {/* Profile URL Preview Box */}
          <TouchableOpacity
            style={styles.urlBox}
            onPress={handleCopyUrl}
            activeOpacity={0.8}
          >
            <Text style={styles.urlText} numberOfLines={1}>
              {profileUrl}
            </Text>
            <Text style={styles.copyHint}>Tap to Copy</Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, styles.copyButton]}
              onPress={handleCopyUrl}
            >
              <Text style={styles.copyButtonText}>📋 Copy Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={handleShare}
            >
              <Text style={styles.shareButtonText}>🚀 Share QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.bgLayer1,
    borderRadius: Radius.xxl,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.35)', // Brand #F43F5E glow border
    padding: 24,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  badgeText: {
    color: '#F43F5E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  subtitle: {
    color: Colors.pink,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgLayer2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  qrOuterFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 20,
  },
  qrInnerBox: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  tagitBrandBar: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 3,
    backgroundColor: '#0A0A12',
    borderRadius: Radius.full,
  },
  brandBarText: {
    color: '#F43F5E',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  urlBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgLayer2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  urlText: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 8,
  },
  copyHint: {
    color: '#F43F5E',
    fontSize: 10,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButton: {
    backgroundColor: Colors.bgLayer2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  copyButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  shareButton: {
    backgroundColor: '#F43F5E',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
});
