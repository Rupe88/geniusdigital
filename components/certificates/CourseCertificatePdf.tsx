'use client';

import React from 'react';
import { Document, Page, Image, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  nameContainer: {
    position: 'absolute',
    // Nudge upward so it sits on the upper underline
    top: '37.8%',
    left: 60,
    right: 60,
    textAlign: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a2f6b',       // matches the deep blue used in the certificate
    textAlign: 'center',
    letterSpacing: 2,
  },
});

export function CourseCertificatePdf({
  templateUrl,
  name,
  dateStr,
}: {
  templateUrl: string;
  name: string;
  dateStr: string;
}) {
  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={styles.page}
      >
        {/* Full-bleed certificate background image */}
        <Image src={templateUrl} style={styles.background} />

        {/* Recipient name placed in the blank gap after "This Certificate is awarded to" */}
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{name}</Text>
        </View>
      </Page>
    </Document>
  );
}