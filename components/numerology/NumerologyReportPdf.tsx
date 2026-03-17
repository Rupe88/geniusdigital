'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { NumberDetail } from '@/lib/numerology/constants/numberDetails';

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 11, lineHeight: 1.35, color: '#111827' },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginTop: 10, marginBottom: 6 },
  row: { marginBottom: 4 },
  label: { fontWeight: 700 },
  bullet: { flexDirection: 'row', gap: 6, marginBottom: 3 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
});

function Bullets({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <View>
      {items.map((t, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

function ReportBlock({
  heading,
  detail,
}: {
  heading: string;
  detail: NumberDetail;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{heading}</Text>

      {/* Summary first (required order) */}
      <View style={styles.row}>
        <Text>
          <Text style={styles.label}>Ruling Planet: </Text>
          {detail.rulingPlanet}
        </Text>
      </View>
      <View style={styles.row}>
        <Text>
          <Text style={styles.label}>Good: </Text>
          {detail.good}
        </Text>
      </View>
      <View style={styles.row}>
        <Text>
          <Text style={styles.label}>Bad: </Text>
          {detail.bad}
        </Text>
      </View>
      <View style={styles.row}>
        <Text>
          <Text style={styles.label}>Famous Personalities: </Text>
          {detail.famousPersonalities}
        </Text>
      </View>

      {/* More details */}
      {detail.coreKarakTatva?.length ? (
        <>
          <Text style={styles.sectionTitle}>Karak Tatva (Core)</Text>
          <Bullets items={detail.coreKarakTatva} />
        </>
      ) : null}

      {detail.lifeImpactArea?.length ? (
        <>
          <Text style={styles.sectionTitle}>Life Impact Area</Text>
          <Bullets items={detail.lifeImpactArea} />
        </>
      ) : null}

      {detail.favourableColours?.length ? (
        <>
          <Text style={styles.sectionTitle}>Favourable Colour</Text>
          <Bullets items={detail.favourableColours} />
          {detail.avoidColours?.length ? (
            <>
              <Text style={styles.sectionTitle}>Avoid</Text>
              <Bullets items={detail.avoidColours} />
            </>
          ) : null}
        </>
      ) : null}

      {detail.favourableDays?.length ? (
        <>
          <Text style={styles.sectionTitle}>Favourable Day</Text>
          <Bullets items={detail.favourableDays} />
          {detail.dayUse?.length ? (
            <>
              <Text style={styles.sectionTitle}>Day use</Text>
              <Bullets items={detail.dayUse} />
            </>
          ) : null}
        </>
      ) : null}

      {detail.primaryCrystalOrGemstone?.length ? (
        <>
          <Text style={styles.sectionTitle}>Crystal / Gemstone (Primary)</Text>
          <Bullets items={detail.primaryCrystalOrGemstone} />
          {detail.alternativeCrystals?.length ? (
            <>
              <Text style={styles.sectionTitle}>Alternative Crystals</Text>
              <Bullets items={detail.alternativeCrystals} />
            </>
          ) : null}
        </>
      ) : null}

      {detail.benefits?.length ? (
        <>
          <Text style={styles.sectionTitle}>Benefits</Text>
          <Bullets items={detail.benefits} />
        </>
      ) : null}

      {detail.moneyFlow?.length ? (
        <>
          <Text style={styles.sectionTitle}>Money Flow</Text>
          <Bullets items={detail.moneyFlow} />
        </>
      ) : null}

      {detail.workStyle?.length ? (
        <>
          <Text style={styles.sectionTitle}>Work Style</Text>
          <Bullets items={detail.workStyle} />
        </>
      ) : null}

      {detail.commonProblems?.length ? (
        <>
          <Text style={styles.sectionTitle}>Common Problems</Text>
          <Bullets items={detail.commonProblems} />
        </>
      ) : null}

      {detail.behavioralRemedy?.length ? (
        <>
          <Text style={styles.sectionTitle}>Behavioral Remedy</Text>
          <Bullets items={detail.behavioralRemedy} />
        </>
      ) : null}

      {/* Description last (required) */}
      {detail.description?.length ? (
        <>
          <Text style={styles.sectionTitle}>Description</Text>
          <Bullets items={detail.description} />
        </>
      ) : null}
    </View>
  );
}

export function NumerologyReportPdf({
  title,
  inputs,
  blocks,
}: {
  title: string;
  inputs?: {
    nameOrNumber?: string;
    calendarType?: 'AD' | 'BS';
    day?: string;
    month?: string;
    year?: string;
  };
  blocks: Array<{ heading: string; detail: NumberDetail }>;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>

        {inputs ? (
          <View style={{ marginBottom: 10 }}>
            <View style={styles.row}>
              <Text>
                <Text style={styles.label}>Name/Number: </Text>
                {inputs.nameOrNumber?.trim() ? inputs.nameOrNumber.trim() : '-'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text>
                <Text style={styles.label}>DOB ({inputs.calendarType || '-'}): </Text>
                {(inputs.day || '--') + '/' + (inputs.month || '--') + '/' + (inputs.year || '----')}
              </Text>
            </View>
          </View>
        ) : null}

        {blocks.map((b, idx) => (
          <View key={idx}>
            {idx > 0 ? <View style={styles.divider} /> : null}
            <ReportBlock heading={b.heading} detail={b.detail} />
          </View>
        ))}
      </Page>
    </Document>
  );
}

