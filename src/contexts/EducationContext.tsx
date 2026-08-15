import React, { createContext, useContext, useState, ReactNode } from 'react';
import { EducationCourse, EducationMedia, EducationPhoto, NotificationItem } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { createCourseInDb, updateCourseInDb, deleteCourseFromDb } from '../lib/coursesApi';
import {
  createEducationMediaInDb, deleteEducationMediaFromDb,
  createEducationPhotoInDb, deleteEducationPhotoFromDb
} from '../lib/educationMediaApi';
import { sendNotificationEmail } from '../lib/emailApi';
import { useNotifications } from './NotificationContext';
import { useActivityLog } from './ActivityLogContext';
import { INITIAL_COURSES } from '../data/initialData';

/**
 * Aviyana Global Campus: courses, student-voice/event videos, and the photo
 * gallery, plus scholarship applications. Extracted from App.tsx as part of
 * Priority 1 (NEXT_SESSION_PLAN.md). Depends on NotificationContext and
 * ActivityLogContext.
 */
interface EducationContextValue {
  courses: EducationCourse[]; setCourses: React.Dispatch<React.SetStateAction<EducationCourse[]>>;
  educationMedia: EducationMedia[]; setEducationMedia: React.Dispatch<React.SetStateAction<EducationMedia[]>>;
  educationPhotos: EducationPhoto[]; setEducationPhotos: React.Dispatch<React.SetStateAction<EducationPhoto[]>>;
  handleAddCourse: (item: EducationCourse) => void;
  handleEditCourse: (item: EducationCourse) => void;
  handleDeleteCourse: (id: string) => void;
  handleAddEducationMedia: (item: EducationMedia) => void;
  handleDeleteEducationMedia: (id: string) => void;
  handleAddEducationPhoto: (item: EducationPhoto) => void;
  handleDeleteEducationPhoto: (id: string) => void;
  handleApplyCourse: (application: {
    applicationCode: string;
    courseTitle: string;
    applicantName: string;
    applicantEmail: string;
    applicantContact: string;
    applicantNote: string;
  }) => Promise<string | null>;
}

const EducationContext = createContext<EducationContextValue | undefined>(undefined);

export function EducationProvider({ children }: { children: ReactNode }) {
  const { pushNotification, pushDbErrorNotification, pushEmailFailureNotification, playAlertChime } = useNotifications();
  const { logAction } = useActivityLog();

  const [courses, setCourses] = useState<EducationCourse[]>(INITIAL_COURSES);
  const [educationMedia, setEducationMedia] = useState<EducationMedia[]>([]);
  const [educationPhotos, setEducationPhotos] = useState<EducationPhoto[]>([]);

  const handleAddCourse = (newCourse: EducationCourse) => {
    setCourses(prev => [newCourse, ...prev]);
    playAlertChime();
    if (isSupabaseConfigured) {
      createCourseInDb(newCourse).then(err => { if (err) pushDbErrorNotification(`Course "${newCourse.title}"`, err); });
    }
  };

  const handleEditCourse = (updatedCourse: EducationCourse) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    if (isSupabaseConfigured) {
      updateCourseInDb(updatedCourse).then(err => { if (err) pushDbErrorNotification(`Course "${updatedCourse.title}" edit`, err); });
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    const deletedTitle = courses.find(c => c.id === courseId)?.title || courseId;
    setCourses(prev => prev.filter(c => c.id !== courseId));
    logAction('deleted', 'Course', deletedTitle);
    if (isSupabaseConfigured) {
      deleteCourseFromDb(courseId).then(err => { if (err) pushDbErrorNotification('Deleting course', err); });
    }
  };

  const handleAddEducationMedia = (item: EducationMedia) => {
    setEducationMedia(prev => [item, ...prev]);
    logAction('added', item.type === 'Event' ? 'Education Event Clip' : 'Student Testimonial', item.title);
    if (isSupabaseConfigured) {
      createEducationMediaInDb(item).then(err => { if (err) pushDbErrorNotification(`Video "${item.title}"`, err); });
    }
  };

  const handleDeleteEducationMedia = (id: string) => {
    const deletedTitle = educationMedia.find(m => m.id === id)?.title || id;
    setEducationMedia(prev => prev.filter(m => m.id !== id));
    logAction('deleted', 'Education Video', deletedTitle);
    if (isSupabaseConfigured) {
      deleteEducationMediaFromDb(id).then(err => { if (err) pushDbErrorNotification('Deleting education video', err); });
    }
  };

  const handleAddEducationPhoto = (item: EducationPhoto) => {
    setEducationPhotos(prev => [item, ...prev]);
    logAction('added', 'Education Photo', item.caption || item.id);
    if (isSupabaseConfigured) {
      createEducationPhotoInDb(item).then(err => { if (err) pushDbErrorNotification('Photo upload', err); });
    }
  };

  const handleDeleteEducationPhoto = (id: string) => {
    setEducationPhotos(prev => prev.filter(p => p.id !== id));
    logAction('deleted', 'Education Photo', id);
    if (isSupabaseConfigured) {
      deleteEducationPhotoFromDb(id).then(err => { if (err) pushDbErrorNotification('Deleting photo', err); });
    }
  };

  // Scholarship applications previously vanished into thin air: the form
  // showed a "success" message but never saved or sent anything anywhere.
  // This creates a staff notification (visible immediately in this session)
  // AND emails insight@aviyana.lk directly, so an application survives even
  // if nobody happens to be looking at the dashboard at that moment.
  const handleApplyCourse = async (application: {
    applicationCode: string;
    courseTitle: string;
    applicantName: string;
    applicantEmail: string;
    applicantContact: string;
    applicantNote: string;
  }): Promise<string | null> => {
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `New Scholarship Application (${application.applicationCode})`,
      message: `${application.applicantName} applied for "${application.courseTitle}" — ${application.applicantEmail}`,
      timestamp: 'Just now',
      severity: 'medium',
      type: 'mention',
      read: false,
      actionRequired: 'Reply via insight@aviyana.lk'
    };
    pushNotification(notif);
    playAlertChime();

    // Confirmation receipt to the applicant, separate from the staff email below.
    sendNotificationEmail({
      subject: `Scholarship Application Received — ${application.applicationCode}`,
      to: application.applicantEmail,
      textBody:
        `Dear ${application.applicantName},\n\n` +
        `Thank you for applying to the Aviyana Ceylon Hospitality & Eco-Stewardship Academy.\n\n` +
        `Application Code: ${application.applicationCode}\nCourse: ${application.courseTitle}\n\n` +
        `Our Academy Admissions team will reach out to you at this email for interview scheduling.\n\n` +
        `— Aviyana Ceylon Resort, insight.aviyana.lk`
    }).then(errorMsg => {
      if (errorMsg) pushEmailFailureNotification(`Scholarship applicant "${application.applicantName}"`, application.applicantEmail, errorMsg);
    });

    return sendNotificationEmail({
      subject: `[${application.applicationCode}] Scholarship Application: ${application.courseTitle}`,
      replyTo: application.applicantEmail,
      textBody:
        `New Scholarship Application — Aviyana Ceylon Hospitality & Eco-Stewardship Academy\n\n` +
        `Application Code: ${application.applicationCode}\n` +
        `Course: ${application.courseTitle}\n` +
        `Applicant Name: ${application.applicantName}\n` +
        `Applicant Email: ${application.applicantEmail}\n` +
        `Applicant Contact: ${application.applicantContact || 'N/A'}\n\n` +
        `Note:\n${application.applicantNote || '(none)'}`
    });
  };

  const value: EducationContextValue = {
    courses, setCourses, educationMedia, setEducationMedia, educationPhotos, setEducationPhotos,
    handleAddCourse, handleEditCourse, handleDeleteCourse,
    handleAddEducationMedia, handleDeleteEducationMedia,
    handleAddEducationPhoto, handleDeleteEducationPhoto, handleApplyCourse
  };

  return <EducationContext.Provider value={value}>{children}</EducationContext.Provider>;
}

export function useEducation(): EducationContextValue {
  const ctx = useContext(EducationContext);
  if (!ctx) throw new Error('useEducation must be used within an EducationProvider');
  return ctx;
}
