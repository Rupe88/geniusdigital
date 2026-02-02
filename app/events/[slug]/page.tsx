'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { eventsApi, Event } from '@/lib/api/events';
import { formatCurrency } from '@/lib/utils/helpers';
import { useAuth } from '@/lib/context/AuthContext';
import { ROUTES } from '@/lib/utils/constants';
import toast from 'react-hot-toast';
import { HiCalendar, HiLocationMarker, HiUsers, HiClock, HiCheck, HiArrowLeft, HiShare } from 'react-icons/hi';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const slug = params?.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  useEffect(() => {
    if (showRegistrationModal) {
      if (user) {
        setRegistrationForm({
          name: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
        });
      } else {
        // Reset form if user is not logged in
        setRegistrationForm({ name: '', email: '', phone: '' });
      }
    }
  }, [user, showRegistrationModal]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const eventData = await eventsApi.getById(slug);
      setEvent(eventData);
    } catch (error: any) {
      console.error('Error fetching event:', error);
      toast.error(error?.message || 'Failed to fetch event');
      router.push('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to register for this event');
      router.push(`${ROUTES.LOGIN}?redirect=/events/${slug}`);
      return;
    }

    if (!event) return;

    // Check if event is open for registration
    if (!['UPCOMING', 'ONGOING'].includes(event.status)) {
      toast.error('This event is not open for registration');
      return;
    }

    // Check if already registered
    if (event.isRegistered) {
      toast('You are already registered for this event');
      return;
    }

    setShowRegistrationModal(true);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    // Validate form fields
    if (!registrationForm.name?.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!registrationForm.email?.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!registrationForm.phone?.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrationForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setRegistering(true);
      console.log('Registering for event:', event.id, registrationForm);
      
      await eventsApi.register(event.id, {
        name: registrationForm.name.trim(),
        email: registrationForm.email.trim(),
        phone: registrationForm.phone.trim(),
      });
      
      toast.success('Successfully registered for the event!');
      setShowRegistrationModal(false);
      // Reset form
      setRegistrationForm({ name: '', email: '', phone: '' });
      // Refresh event data to show registration status
      await fetchEvent();
    } catch (error: any) {
      console.error('Error registering for event:', error);
      const errorMessage = error?.message || 'Failed to register for event';
      toast.error(errorMessage);
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      // Use consistent formatting that works on both server and client
      if (!mounted) {
        // Return a simple format for SSR that matches client initial render
        return date.toISOString().split('T')[0];
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      // Use consistent formatting that works on both server and client
      if (!mounted) {
        // Return a simple format for SSR that matches client initial render
        return date.toISOString().split('T')[0];
      }
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800';
      case 'ONGOING':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isRegistrationOpen = event && ['UPCOMING', 'ONGOING'].includes(event.status);
  const isFull = mounted && event && event.maxAttendees && event._count && event._count.registrations >= event.maxAttendees;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)]">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--muted-foreground)] text-lg mb-4">Event not found</p>
          <Link href="/events">
            <Button variant="primary">Back to Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      {/* Header Image */}
      {event.image && (
        <div className="relative h-64 md:h-96 w-full">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-3xl md:text-5xl font-bold mb-2">{event.title}</h1>
              {event.featured && (
                <span className="inline-block bg-yellow-500 text-white px-3 py-1 text-sm font-semibold rounded mt-2">
                  Featured Event
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/events">
            <Button variant="outline" size="sm">
              <HiArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info Card */}
            <Card className="p-6">
              {!event.image && (
                <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">{event.title}</h1>
              )}
              
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
                {event.featured && (
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded bg-yellow-100 text-yellow-800">
                    Featured
                  </span>
                )}
              </div>

              {event.shortDescription && (
                <p className="text-lg text-[var(--muted-foreground)] mb-6">
                  {event.shortDescription}
                </p>
              )}

              {event.description && (
                <div className="prose max-w-none">
                  <div className="text-[var(--foreground)] whitespace-pre-line">
                    {event.description}
                  </div>
                </div>
              )}
            </Card>

            {/* Event Details */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-4">Event Details</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <HiCalendar className="h-5 w-5 text-[var(--primary-700)] mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-[var(--foreground)]">Date & Time</p>
                    <p className="text-[var(--muted-foreground)]" suppressHydrationWarning>
                      {formatDateTime(event.startDate) || event.startDate}
                      {event.endDate && ` - ${formatDateTime(event.endDate) || event.endDate}`}
                    </p>
                  </div>
                </div>

                {(event.venue || event.location) && (
                  <div className="flex items-start">
                    <HiLocationMarker className="h-5 w-5 text-[var(--primary-700)] mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[var(--foreground)]">Location</p>
                      <p className="text-[var(--muted-foreground)]">
                        {event.venue && <span className="font-medium">{event.venue}</span>}
                        {event.venue && event.location && <span>, </span>}
                        {event.location}
                      </p>
                    </div>
                  </div>
                )}

                {event.maxAttendees && (
                  <div className="flex items-start">
                    <HiUsers className="h-5 w-5 text-[var(--primary-700)] mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-[var(--foreground)]">Attendees</p>
                      <p className="text-[var(--muted-foreground)]">
                        {event._count?.registrations || 0} / {event.maxAttendees} registered
                        {mounted && isFull && <span className="text-red-600 ml-2">(Full)</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="p-6 sticky top-4">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-[var(--primary-700)] mb-2">
                  {event.isFree ? 'Free' : formatCurrency(event.price)}
                </div>
                {!event.isFree && (
                  <p className="text-sm text-[var(--muted-foreground)]">Per person</p>
                )}
              </div>

              {event.isRegistered ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <HiCheck className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg font-semibold text-[var(--foreground)] mb-2">
                    You're Registered!
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)] mb-4">
                    We'll send you event details via email.
                  </p>
                </div>
              ) : isRegistrationOpen && !isFull ? (
                <Button
                  variant="primary"
                  className="w-full mb-4"
                  onClick={handleRegister}
                >
                  Register Now
                </Button>
              ) : isFull ? (
                <div className="text-center">
                  <p className="text-red-600 font-semibold mb-2">Event is Full</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    This event has reached maximum capacity.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-[var(--muted-foreground)] mb-2">
                    Registration is closed for this event.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-[var(--foreground)] mb-2">Share this event</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const url = window.location.href;
                          navigator.clipboard.writeText(url);
                          toast.success('Event link copied to clipboard!');
                        }
                      }}
                      className="flex-1"
                      disabled={!mounted}
                    >
                      <HiShare className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Info */}
            <Card className="p-6">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">Quick Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Status:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Price:</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {event.isFree ? 'Free' : formatCurrency(event.price)}
                  </span>
                </div>
                {event.maxAttendees && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Capacity:</span>
                    <span className="font-medium text-[var(--foreground)]">
                      {event.maxAttendees} attendees
                    </span>
                  </div>
                )}
                {event._count && (
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Registered:</span>
                    <span className="font-medium text-[var(--foreground)]">
                      {event._count.registrations}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        title="Register for Event"
      >
        <form onSubmit={handleSubmitRegistration}>
          <div className="space-y-4">
            <div>
              <Input
                label="Full Name *"
                value={registrationForm.name}
                onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                placeholder="Enter your full name"
                required
                disabled={!!user && !!user.fullName}
              />
              {user && !user.fullName && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Please complete your profile or enter your name
                </p>
              )}
            </div>

            <div>
              <Input
                label="Email *"
                type="email"
                value={registrationForm.email}
                onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                placeholder="Enter your email"
                required
                disabled={!!user && !!user.email}
              />
              {user && !user.email && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Please complete your profile or enter your email
                </p>
              )}
            </div>

            <div>
              <Input
                label="Phone *"
                type="tel"
                value={registrationForm.phone}
                onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })}
                placeholder="Enter your phone number"
                required
                disabled={!!user && !!user.phone}
              />
              {user && !user.phone && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Please complete your profile or enter your phone number
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegistrationModal(false)}
                disabled={registering}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={registering}
                disabled={registering}
              >
                Confirm Registration
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
