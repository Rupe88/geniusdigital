'use client';

import React, { useState } from 'react';
import { HiCalendar } from 'react-icons/hi';
import { submitAffiliateApplication, type AffiliateApplicationPayload } from '@/lib/api/affiliateApplications';
import { showSuccess, showError } from '@/lib/utils/toast';

const COUNTRY_OPTIONS = [
  { value: '', label: 'Select your country' },
  { value: 'Nepal', label: 'Nepal' },
  { value: 'India', label: 'India' },
  { value: 'Bangladesh', label: 'Bangladesh' },
  { value: 'Sri Lanka', label: 'Sri Lanka' },
  { value: 'Pakistan', label: 'Pakistan' },
  { value: 'Bhutan', label: 'Bhutan' },
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Other', label: 'Other' },
];

const CITY_OPTIONS = [
  { value: '', label: 'Select your city' },
  { value: 'Kathmandu', label: 'Kathmandu' },
  { value: 'Lalitpur', label: 'Lalitpur' },
  { value: 'Bhaktapur', label: 'Bhaktapur' },
  { value: 'Pokhara', label: 'Pokhara' },
  { value: 'Biratnagar', label: 'Biratnagar' },
  { value: 'Dharan', label: 'Dharan' },
  { value: 'Butwal', label: 'Butwal' },
  { value: 'Nepalgunj', label: 'Nepalgunj' },
  { value: 'Other', label: 'Other' },
];

const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-800 mb-1.5';
const sectionHeadingClass = 'text-lg font-bold text-gray-900 pb-2 border-b-2 border-gray-900 mb-5';

export default function AffiliateApplicationPage() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    country: '',
    city: '',
    currentOccupation: '',
    hasAffiliateExperience: '',
    experienceDetails: '',
    occultKnowledge: '',
    occultOther: '',
    whyJoin: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fullName, email, phone, dateOfBirth, country, city, currentOccupation, hasAffiliateExperience, experienceDetails, occultKnowledge, occultOther, whyJoin } = form;
    if (!fullName.trim()) {
      showError('Full name is required');
      return;
    }
    if (!email.trim()) {
      showError('Email is required');
      return;
    }
    if (!phone.trim()) {
      showError('Phone number is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    try {
      const payload: AffiliateApplicationPayload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dateOfBirth: dateOfBirth.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        currentOccupation: currentOccupation.trim() || undefined,
        hasAffiliateExperience: hasAffiliateExperience === 'yes',
        experienceDetails: experienceDetails.trim() || undefined,
        occultKnowledge: occultKnowledge.trim() || undefined,
        occultOther: occultKnowledge === 'Other' ? occultOther.trim() || undefined : undefined,
        whyJoin: whyJoin.trim() || undefined,
      };
      await submitAffiliateApplication(payload);
      showSuccess('Application submitted successfully. We will contact you soon.');
      setForm({
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        country: '',
        city: '',
        currentOccupation: '',
        hasAffiliateExperience: '',
        experienceDetails: '',
        occultKnowledge: '',
        occultOther: '',
        whyJoin: '',
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 lg:py-12">
      {/* Same container as navbar so content aligns with nav links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900">Affiliate Application</h1>
            <p className="mt-2 text-gray-600">
              Complete the form below to join our exclusive affiliate program and start your journey with us.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
          {/* Personal Information - 3 column layout */}
          <section>
            <h2 className={sectionHeadingClass}>Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className={labelClass}>Full Name:*</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Email Address:*</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Phone Number:*</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Date of Birth:*</label>
                <div className="relative">
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`${inputClass} pr-10 [color-scheme:light]`}
                  />
                  <HiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" aria-hidden />
                </div>
              </div>
              <div>
                <label className={labelClass}>Country:*</label>
                <select
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {COUNTRY_OPTIONS.map((opt) => (
                    <option key={opt.value || 'blank'} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>City:*</label>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {CITY_OPTIONS.map((opt) => (
                    <option key={opt.value || 'blank'} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className={labelClass}>Current Occupation:*</label>
                <input
                  type="text"
                  name="currentOccupation"
                  value={form.currentOccupation}
                  onChange={handleChange}
                  placeholder="Enter your current occupation"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Affiliate Experience */}
          <section>
            <h2 className={sectionHeadingClass}>Affiliate Experience</h2>
            <div className="space-y-5">
              <div>
                <label className={`${labelClass} mb-2`}>Do you have any previous affiliate marketing experience?*</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasAffiliateExperience"
                      value="yes"
                      checked={form.hasAffiliateExperience === 'yes'}
                      onChange={handleChange}
                      className="text-[var(--primary-700)] focus:ring-[var(--primary-500)]"
                    />
                    <span className="text-gray-900">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasAffiliateExperience"
                      value="no"
                      checked={form.hasAffiliateExperience === 'no'}
                      onChange={handleChange}
                      className="text-[var(--primary-700)] focus:ring-[var(--primary-500)]"
                    />
                    <span className="text-gray-900">No</span>
                  </label>
                </div>
              </div>
              <div>
                <label className={labelClass}>Please provide details:</label>
                <textarea
                  name="experienceDetails"
                  value={form.experienceDetails}
                  onChange={handleChange}
                  placeholder="Enter your experience details"
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </section>

          {/* Occult Knowledge */}
          <section>
            <h2 className={sectionHeadingClass}>Occult Knowledge</h2>
            <div className="space-y-4">
              <div>
                <label className={`${labelClass} mb-2`}>Do you have any occult knowledge?</label>
                <div className="flex flex-wrap gap-4">
                  {['Numerology', 'Astrology', 'Vaastu Shastra', 'Lal Kitab', 'Other'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="occultKnowledge"
                        value={opt}
                        checked={form.occultKnowledge === opt}
                        onChange={handleChange}
                        className="text-[var(--primary-700)] focus:ring-[var(--primary-500)]"
                      />
                      <span className="text-gray-900">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              {form.occultKnowledge === 'Other' && (
                <div>
                  <label className={labelClass}>Other</label>
                  <textarea
                    name="occultOther"
                    value={form.occultOther}
                    onChange={handleChange}
                    placeholder="Please specify any other occult knowledge you possess"
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Why join */}
          <section>
            <h2 className={sectionHeadingClass}>Why do you want to join our affiliate program?*</h2>
            <textarea
              name="whyJoin"
              value={form.whyJoin}
              onChange={handleChange}
              placeholder="Tell us why you're interested in becoming an affiliate with us"
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </section>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 font-semibold text-white bg-[var(--primary-700)] hover:bg-[var(--primary-800)] disabled:opacity-60 rounded transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
