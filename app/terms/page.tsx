'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Terms &amp; Conditions</h1>
          <p className="mt-2 text-gray-600">
            These Terms &amp; Conditions govern your use of Sanskar Academy&apos;s website, courses,
            and services.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Note: This is a general template. Please review it with your legal adviser to ensure it
            meets your specific business and regulatory requirements in Nepal.
          </p>
        </div>

        <Card padding="lg" className="space-y-8 bg-white border border-gray-100 shadow-sm">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of terms</h2>
            <p className="text-sm text-gray-600">
              By accessing or using our website, creating an account, enrolling in courses, or using
              any of our services, you agree to be bound by these Terms &amp; Conditions and our
              Privacy Statement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">2. Accounts and access</h2>
            <p className="text-sm text-gray-600">
              You are responsible for maintaining the confidentiality of your account and password,
              and for all activities that occur under your account. You agree to:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Provide accurate and complete registration information</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Not share your login credentials with others</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">3. Courses and content</h2>
            <p className="text-sm text-gray-600">
              All course content, including videos, PDFs, text, quizzes, and other materials, is
              owned by Sanskar Academy or its instructors and is protected by copyright and other
              intellectual property laws. You may:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Access content solely for your personal learning and non‑commercial use</li>
              <li>Not copy, share, resell, or distribute course content without written permission</li>
              <li>Not record or re‑upload course sessions or materials to other platforms</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">4. Payments and refunds</h2>
            <p className="text-sm text-gray-600">
              Payments for courses, events, and consultations are processed via secure third‑party
              gateways such as eSewa and banking partners. By making a payment, you confirm that:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>You are authorized to use the payment method</li>
              <li>The information you provide is accurate and complete</li>
            </ul>
            <p className="text-sm text-gray-600">
              Refunds, if applicable, are subject to our refund policy and will be handled on a
              case‑by‑case basis. Certain courses, digital products, or consultations may be
              non‑refundable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">5. Installment (EMI) payments</h2>
            <p className="text-sm text-gray-600">
              For selected high‑value courses, we may offer installment (EMI) options:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>You agree to pay each installment on or before its due date</li>
              <li>Access to course content may be paused if installments are overdue</li>
              <li>Failure to pay remaining installments may result in cancellation of access without full refund</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">6. Conduct and acceptable use</h2>
            <p className="text-sm text-gray-600">
              You agree not to use the platform to:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Harass, abuse, or harm other learners or instructors</li>
              <li>Share offensive, illegal, or inappropriate content</li>
              <li>Attempt to hack, reverse engineer, or disrupt the platform</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">7. Limitation of liability</h2>
            <p className="text-sm text-gray-600">
              While we strive to provide high‑quality educational content, we do not guarantee any
              specific results or outcomes from taking our courses. To the maximum extent permitted
              by law, Sanskar Academy and its instructors are not liable for any indirect, incidental,
              or consequential damages arising from your use of the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">8. Changes to these terms</h2>
            <p className="text-sm text-gray-600">
              We may update these Terms &amp; Conditions from time to time. When we do, we will
              update the &quot;Last updated&quot; date on this page. Your continued use of the
              platform after changes are published means you accept the updated terms.
            </p>
            <p className="text-xs text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">9. Contact us</h2>
            <p className="text-sm text-gray-600">
              If you have any questions about these Terms &amp; Conditions, you can contact us at:
            </p>
            <p className="text-sm text-gray-600">
              Email: <span className="font-medium text-gray-900">sanskaracademy555@gmail.com</span>
              <br />
              Phone: <span className="font-medium text-gray-900">+977 9705231255 / +977 9763694355</span>
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}

