'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { FiMapPin, FiMail, FiPhone } from 'react-icons/fi';
import { ROUTES } from '@/lib/utils/constants';

const categories = [
  'Vastu',
  'Numerology',
  'Money and Wealth',
  'NLP',
  'Law of Attraction',
  'Swar Vigyan',
  'Graphology',
  'Astrology',
  'Navaratri Shakti Sadhana',
  'Business Growth',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28">
              <Image
                src="/logo.png"
                alt="Genius Digi"
                fill
                className="object-contain"
                sizes="112px"
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">About Sanskar Academy</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
            Empowering individuals through ancient wisdom and modern learning—Vastu, Numerology, NLP, and beyond.
          </p>
        </div>

        <div className="space-y-8">
          {/* Who We Are */}
          <Card padding="lg" className="bg-white border border-gray-100 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Who We Are</h2>
            <p className="text-gray-600 leading-relaxed">
              Sanskar Academy is a leading learning platform based in Kathmandu, Nepal. We blend timeless traditions—
              Vastu Shastra, Numerology, Astrology, and Swar Vigyan—with contemporary disciplines such as NLP
              (Neuro-Linguistic Programming), the Law of Attraction, and Graphology to help you transform your life,
              career, and environment.
            </p>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Our mission is to make this knowledge accessible to everyone, whether you seek harmony in your home,
              clarity in your decisions, or growth in your business. Through structured courses, live events, and
              one-on-one consultations, we guide learners on a path of self-discovery and practical application.
            </p>
          </Card>

          {/* What We Offer */}
          <Card padding="lg" className="bg-white border border-gray-100 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Offer</h2>
            <p className="text-gray-600 mb-6">
              We cover a wide range of topics designed to support your personal and professional growth:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-gray-600">
              {categories.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--primary-500)] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          {/* Our Approach */}
          <Card padding="lg" className="bg-white border border-gray-100 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Approach</h2>
            <p className="text-gray-600 leading-relaxed">
              We believe in learning by doing. Our courses combine theory with practical exercises, real-world
              examples, and ongoing support. Whether you join an online course, attend a live workshop, or schedule
              a consultation, you receive guidance tailored to your goals. We are committed to authenticity,
              clarity, and lasting results.
            </p>
          </Card>

          {/* Contact & Location */}
          <Card padding="lg" className="bg-white border border-gray-100 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-600 mb-6">
              We are here to help. Reach out for course inquiries, consultations, or general support.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <FiMapPin className="mt-1 h-5 w-5 text-[var(--primary-600)] flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Address</p>
                  <p className="text-gray-600 text-sm">New Baneshwor, Thapagaun, Kathmandu, Nepal</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiMail className="mt-1 h-5 w-5 text-[var(--primary-600)] flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a
                    href="mailto:sanskaracademy555@gmail.com"
                    className="text-gray-600 text-sm hover:text-[var(--primary-600)] transition"
                  >
                    sanskaracademy555@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiPhone className="mt-1 h-5 w-5 text-[var(--primary-600)] flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <a href="tel:+9779705231255" className="block hover:text-[var(--primary-600)] transition">
                      +977 9705231255
                    </a>
                    <a href="tel:+9779763694355" className="block hover:text-[var(--primary-600)] transition">
                      +977 9763694355
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center py-6">
            <Link
              href={ROUTES.COURSES}
              className="inline-flex items-center justify-center px-6 py-3 bg-[var(--primary-700)] text-white font-medium rounded-md hover:bg-[var(--primary-800)] transition"
            >
              Explore Our Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
