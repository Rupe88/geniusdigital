'use client';

import React from 'react';
import { Document, Page, Image, Text, View, StyleSheet } from '@react-pdf/renderer';

// A4 landscape in @react-pdf points
const A4_LANDSCAPE = { width: 842, height: 595 };

const styles = StyleSheet.create({
  page: {
    position: 'relative',
    width: A4_LANDSCAPE.width,
    height: A4_LANDSCAPE.height,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: A4_LANDSCAPE.width,
    height: A4_LANDSCAPE.height,
    objectFit: 'cover',
  },
  nameContainer: {
    position: 'absolute',
    // Positioned on the underline under "This Certificate is awarded to"
    top: 230,
    left: 80,
    right: 80,
    textAlign: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
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
        <Image src={templateUrl} style={styles.background} fixed />

        {/* Recipient name placed in the blank gap after "This Certificate is awarded to" */}
        <View style={styles.nameContainer} fixed>
          <Text style={styles.name} fixed>
            {name}
          </Text>
        </View>
      </Page>
    </Document>
  );
}