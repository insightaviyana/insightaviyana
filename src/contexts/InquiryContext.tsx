import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PublicInquiry, UserRegistration, NotificationItem } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { createInquiryInDb, updateInquiryInDb } from '../lib/inquiriesApi';
import { createRegistrationInDb } from '../lib/registrationsApi';
import { sendNotificationEmail } from '../lib/emailApi';
import { useNotifications } from './NotificationContext';
import { useActivityLog } from './ActivityLogContext';
import { INITIAL_INQUIRIES, INITIAL_REGISTRATIONS } from '../data/initialData';

/**
 * Public inquiries (Inquiry Desk, Careers page, Question modal all feed
 * into this) and VIP/Press pass registrations. Extracted from App.tsx as
 * part of Priority 1 (NEXT_SESSION_PLAN.md). Depends on NotificationContext
 * and ActivityLogContext.
 */
interface InquiryContextValue {
  inquiries: PublicInquiry[]; setInquiries: React.Dispatch<React.SetStateAction<PublicInquiry[]>>;
  registrations: UserRegistration[]; setRegistrations: React.Dispatch<React.SetStateAction<UserRegistration[]>>;
  handleAddInquiry: (item: PublicInquiry) => void;
  handleUpdateInquiryStatus: (inquiry: PublicInquiry, status: PublicInquiry['status']) => void;
  handleRegisterUser: (item: UserRegistration) => void;
  handleSubmitPublicInquiry: (query: string) => void;
}

const InquiryContext = createContext<InquiryContextValue | undefined>(undefined);

export function InquiryProvider({ children }: { children: ReactNode }) {
  const { pushNotification, pushDbErrorNotification, pushEmailFailureNotification, playAlertChime } = useNotifications();
  const { logAction } = useActivityLog();

  const [inquiries, setInquiries] = useState<PublicInquiry[]>(INITIAL_INQUIRIES);
  const [registrations, setRegistrations] = useState<UserRegistration[]>(INITIAL_REGISTRATIONS);

  const handleAddInquiry = (newInquiry: PublicInquiry) => {
    setInquiries(prev => [newInquiry, ...prev]);
    if (isSupabaseConfigured) {
      createInquiryInDb(newInquiry).then(err => { if (err) pushDbErrorNotification(`Inquiry from "${newInquiry.name}"`, err); });
    }
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Official Inquiry Received (insight@aviyana.lk)',
      message: `${newInquiry.name} (${newInquiry.category}): Ticket #${newInquiry.ticketNumber}`,
      timestamp: 'Just now',
      severity: 'high',
      type: 'mention',
      read: false,
      actionRequired: 'Reply via insight@aviyana.lk'
    };
    pushNotification(notif);
    playAlertChime();
  };

  const handleUpdateInquiryStatus = (inquiry: PublicInquiry, status: PublicInquiry['status']) => {
    const updated: PublicInquiry = { ...inquiry, status };
    setInquiries(prev => prev.map(i => (i.id === inquiry.id ? updated : i)));
    logAction('status changed', 'Inquiry', `Ticket #${inquiry.ticketNumber}`, `${inquiry.status} → ${status}`);
    if (isSupabaseConfigured) {
      updateInquiryInDb(updated).then(err => { if (err) pushDbErrorNotification(`Inquiry status update ("${inquiry.ticketNumber}")`, err); });
    }
  };

  const handleRegisterUser = (newReg: UserRegistration) => {
    setRegistrations(prev => [newReg, ...prev]);
    if (isSupabaseConfigured) {
      createRegistrationInDb(newReg).then(err => { if (err) pushDbErrorNotification(`Registration from "${newReg.name}"`, err); });
    }
    sendNotificationEmail({
      subject: `New VIP/Press Registration: ${newReg.name}`,
      replyTo: newReg.email,
      textBody:
        `New VIP/Press Pass Registration — Aviyana Ceylon Resort\n\n` +
        `Name: ${newReg.name}\nEmail: ${newReg.email}\nContact: ${newReg.contact || 'N/A'}\n` +
        `Role: ${newReg.organizationRole}\nVIP Pass Code: ${newReg.vipPassCode}\n` +
        `Interests: ${newReg.interests.join(', ') || 'None specified'}`
    });
    // Confirmation receipt to the registrant themselves.
    sendNotificationEmail({
      subject: `Your Aviyana Ceylon VIP/Press Pass — ${newReg.vipPassCode}`,
      to: newReg.email,
      textBody:
        `Dear ${newReg.name},\n\n` +
        `Thank you for registering with Aviyana Ceylon Resort. Your VIP/Press Pass code is:\n\n` +
        `${newReg.vipPassCode}\n\n` +
        `Please keep this code for reference. Our team will be in touch ahead of the Grand Opening.\n\n` +
        `— Aviyana Ceylon Resort, insight.aviyana.lk`
    }).then(errorMsg => {
      if (errorMsg) pushEmailFailureNotification(`VIP/Press registrant "${newReg.name}"`, newReg.email, errorMsg);
    });
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New VIP / Press Pass Registered',
      message: `${newReg.name} (${newReg.organizationRole}) issued VIP Pass ${newReg.vipPassCode}.`,
      timestamp: 'Just now',
      severity: 'medium',
      type: 'approval',
      read: false
    };
    pushNotification(notif);
    playAlertChime();
  };

  const handleSubmitPublicInquiry = (query: string) => {
    const inquiryNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Public Fact Inquiry Received',
      message: `Visitor submitted query: "${query.slice(0, 80)}...". Review for insight.aviyana.lk update.`,
      timestamp: 'Just now',
      severity: 'high',
      type: 'mention',
      read: false,
      actionRequired: 'Generate Gemini Response'
    };
    pushNotification(inquiryNotif);
    playAlertChime();
  };

  const value: InquiryContextValue = {
    inquiries, setInquiries, registrations, setRegistrations,
    handleAddInquiry, handleUpdateInquiryStatus, handleRegisterUser, handleSubmitPublicInquiry
  };

  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>;
}

export function useInquiry(): InquiryContextValue {
  const ctx = useContext(InquiryContext);
  if (!ctx) throw new Error('useInquiry must be used within an InquiryProvider');
  return ctx;
}
