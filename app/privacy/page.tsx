'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Statement</h1>
          <p className="mt-2 text-gray-600">
            This Privacy Statement explains how we collect, use, and protect your information when you
            use Sanskar Academy&apos;s learning platform.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Note: This is a general template. Please review it with your legal adviser to ensure it
            meets your specific business and regulatory requirements in Nepal.
          </p>
        </div>

        <Card padding="lg" className="space-y-8 bg-white border border-gray-100 shadow-sm">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">1. Information we collect</h2>
            <p className="text-sm text-gray-600">
              We collect information that you provide directly to us when you:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Create an account or update your profile</li>
              <li>Enroll in courses, book events, or submit consultation forms</li>
              <li>Make payments for courses, consultations, or other services</li>
              <li>Contact us via email, phone, social media, or support channels</li>
            </ul>
            <p className="text-sm text-gray-600">
              This may include your name, email, phone number, address, date of birth, payment
              details (processed through payment and banking partners as applicable), and any other information
              you choose to share with us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">2. How we use your information</h2>
            <p className="text-sm text-gray-600">We use your information to:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Provide and manage your access to courses, events, and consultations</li>
              <li>Process payments and maintain transaction records</li>
              <li>Send you important updates about your enrollments and account</li>
              <li>Improve our courses, platform, and customer support</li>
              <li>Send you relevant promotions or offers (where permitted by law)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">3. Cookies and analytics</h2>
            <p className="text-sm text-gray-600">
              We may use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Keep you signed in to your account</li>
              <li>Remember your preferences (such as language or theme)</li>
              <li>Understand how learners use our platform so we can improve the experience</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">4. Third‑party services</h2>
            <p className="text-sm text-gray-600">
              We may share limited information with trusted third‑party services that help us run the
              platform, such as:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Payment and banking partners (e.g. banks, card processors)</li>
              <li>Email and SMS providers</li>
              <li>Cloud hosting and storage providers</li>
            </ul>
            <p className="text-sm text-gray-600">
              These partners are required to protect your data and use it only for the specific
              services they provide to us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">5. Data security</h2>
            <p className="text-sm text-gray-600">
              We take reasonable technical and organizational measures to protect your personal
              information against unauthorized access, loss, misuse, or alteration. However, no
              method of transmission over the internet or electronic storage is 100% secure, and we
              cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">6. Your rights</h2>
            <p className="text-sm text-gray-600">
              Depending on applicable law, you may have the right to:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Access and update your personal information in your profile</li>
              <li>Request correction of inaccurate or incomplete data</li>
              <li>Request deletion of your account (subject to legal or accounting requirements)</li>
              <li>Opt out of marketing communications at any time</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">7. Contact us</h2>
            <p className="text-sm text-gray-600">
              If you have any questions about this Privacy Statement or how your data is handled,
              you can contact us at:
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

