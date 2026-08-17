import React, { useState } from 'react';
import { X, Send, Mail, CheckCircle2, Copy, ExternalLink, HelpCircle, Phone, User, ShieldCheck, Loader2, AlertTriangle, Upload, Linkedin, FileText } from 'lucide-react';
import { PublicInquiry } from '../types';
import { sendNotificationEmail } from '../lib/emailApi';
import { uploadCv, fileToBase64 } from '../lib/cvUpload';

interface QuestionSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitInquiry: (inquiry: PublicInquiry) => void;
  /** Called if the confirmation-receipt email to the submitter's own address
   * fails to send (most commonly a Resend unverified-domain restriction),
   * so the app can raise a staff notification instead of losing it silently. */
  onConfirmationEmailFailed?: (email: string, errorMessage: string) => void;
}

export const QuestionSubmitModal: React.FC<QuestionSubmitModalProps> = ({
  isOpen,
  onClose,
  onSubmitInquiry,
  onConfirmationEmailFailed
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState<PublicInquiry['category']>('General Question');
  const [question, setQuestion] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<PublicInquiry | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'sending' | 'sent' | 'failed' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !question.trim()) return;
    setSubmitting(true);

    const ticketNumber = `AV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // CV upload happens before the DB write so the signed URL can be saved
    // on the inquiry record itself, not just emailed and forgotten.
    let cvUrl: string | undefined;
    let cvFileName: string | undefined;
    let cvBase64: string | null = null;
    if (cvFile) {
      const uploadResult = await uploadCv(cvFile, name.trim());
      if (uploadResult) {
        cvUrl = uploadResult.signedUrl;
        cvFileName = uploadResult.fileName;
      }
      // Read for the email attachment regardless of whether the storage
      // upload itself succeeded -- the attachment is the primary way staff
      // actually receive the CV; the signed URL on the record is a backup.
      try {
        cvBase64 = await fileToBase64(cvFile);
      } catch (err) {
        console.error('Could not read CV file for email attachment:', err);
      }
    }

    const newInquiry: PublicInquiry = {
      id: `inq-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      contact: contact.trim() || 'N/A',
      category,
      question: question.trim(),
      submittedAt: new Date().toLocaleString(),
      status: 'Delivered to insight@aviyana.lk',
      ticketNumber,
      cvUrl,
      cvFileName,
      linkedinUrl: linkedinUrl.trim() || undefined
    };

    onSubmitInquiry(newInquiry);
    setSubmittedTicket(newInquiry);
    setEmailStatus('sending');
    setSubmitting(false);

    sendNotificationEmail({
      subject: `[${ticketNumber}] Public Inquiry: ${category}`,
      replyTo: newInquiry.email,
      textBody:
        `Official Inquiry for Aviyana Ceylon Resort (insight.aviyana.lk)\n\n` +
        `Ticket Number: ${ticketNumber}\n` +
        `Name: ${newInquiry.name}\n` +
        `Contact Phone: ${newInquiry.contact}\n` +
        `Email: ${newInquiry.email}\n` +
        `Category: ${newInquiry.category}\n` +
        (linkedinUrl.trim() ? `LinkedIn: ${linkedinUrl.trim()}\n` : '') +
        (cvFileName ? `CV Attached: ${cvFileName}\n` : '') +
        `\nQuestion / Details:\n${newInquiry.question}`,
      attachments: cvBase64 && cvFile ? [{ filename: cvFile.name, content: cvBase64 }] : undefined
    }).then(errorMsg => {
      setEmailStatus(errorMsg ? 'failed' : 'sent');
    });

    // Confirmation receipt to the person who submitted the question, so
    // they have their own record of the ticket number in their inbox --
    // separate from whether the staff-side email above succeeds.
    sendNotificationEmail({
      subject: `We've received your inquiry — Ticket #${ticketNumber}`,
      to: newInquiry.email,
      textBody:
        `Dear ${newInquiry.name},\n\n` +
        `Thank you for reaching out to Aviyana Ceylon Resort. Your inquiry has been logged as:\n\n` +
        `Ticket Number: ${ticketNumber}\nCategory: ${category}\n\n` +
        `Your question:\n"${newInquiry.question}"\n\n` +
        `Our team will respond as soon as possible. If you have follow-up questions, you can reply directly to insight@aviyana.lk and reference your ticket number.\n\n` +
        `— Aviyana Ceylon Resort, insight.aviyana.lk`
    }).then(errorMsg => {
      if (errorMsg) {
        console.error('Confirmation email to submitter failed:', errorMsg);
        onConfirmationEmailFailed?.(newInquiry.email, errorMsg);
      }
    });
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('insight@aviyana.lk');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleOpenMailto = () => {
    if (!submittedTicket) return;
    const subject = encodeURIComponent(`[${submittedTicket.ticketNumber}] Public Inquiry: ${submittedTicket.category}`);
    const body = encodeURIComponent(
      `Official Inquiry for Aviyana Ceylon Resort (insight.aviyana.lk)\n\n` +
      `Ticket Number: ${submittedTicket.ticketNumber}\n` +
      `Name: ${submittedTicket.name}\n` +
      `Contact Phone: ${submittedTicket.contact}\n` +
      `Email: ${submittedTicket.email}\n` +
      `Category: ${submittedTicket.category}\n\n` +
      `Question / Details:\n${submittedTicket.question}\n\n` +
      `-----------------------------------------------\n` +
      `Sent via Aviyana Ceylon Digital Source of Truth Hub (insight.aviyana.lk)`
    );
    window.location.href = `mailto:insight@aviyana.lk?subject=${subject}&body=${body}`;
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setContact('');
    setQuestion('');
    setCvFile(null);
    setLinkedinUrl('');
    setSubmittedTicket(null);
    setEmailStatus(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-b border-amber-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Mail size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-lg text-white">Direct Official Inquiry</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  insight@aviyana.lk
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Official Communication Channel • Direct to Chairman & Executive Secretariat
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {submittedTicket ? (
            <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400">Official Ticket Generated</span>
                <h4 className="text-2xl font-serif font-bold text-white mt-1">Ticket #{submittedTicket.ticketNumber}</h4>
                {emailStatus === 'sending' && (
                  <p className="text-xs text-amber-300 mt-1 flex items-center justify-center gap-1.5">
                    <Loader2 size={13} className="animate-spin" /> Sending to <strong className="underline font-mono">insight@aviyana.lk</strong>...
                  </p>
                )}
                {emailStatus === 'sent' && (
                  <p className="text-xs text-emerald-300 mt-1">
                    ✓ Emailed directly to <strong className="underline font-mono">insight@aviyana.lk</strong>.
                  </p>
                )}
                {emailStatus === 'failed' && (
                  <p className="text-xs text-red-300 mt-1 flex items-center justify-center gap-1.5">
                    <AlertTriangle size={13} /> Auto-send failed — please use the button below to send it yourself.
                  </p>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Name: <strong className="text-white">{submittedTicket.name}</strong></span>
                  <span>Category: <strong className="text-amber-300">{submittedTicket.category}</strong></span>
                </div>
                <div className="text-slate-400">Email: <strong className="text-white">{submittedTicket.email}</strong></div>
                <div className="text-slate-400">Contact: <strong className="text-white">{submittedTicket.contact}</strong></div>
                <div className="pt-2 border-t border-slate-800 text-slate-300 italic">
                  "{submittedTicket.question}"
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={handleOpenMailto}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center space-x-2"
                >
                  <Mail size={16} />
                  <span>{emailStatus === 'failed' ? 'Send via My Email App' : 'Also Open My Email App'}</span>
                  <ExternalLink size={13} />
                </button>

                <button
                  onClick={handleCopyEmail}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5"
                >
                  <Copy size={15} />
                  <span>{copiedEmail ? 'Email Copied!' : 'Copy Address'}</span>
                </button>
              </div>

              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-amber-300 transition-colors pt-2 block mx-auto underline"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Official Email Banner */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-amber-200">
                  <ShieldCheck size={16} className="text-amber-400 shrink-0" />
                  <span>Target Inbox: <strong className="text-amber-300 font-mono">insight@aviyana.lk</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold rounded text-[10px] transition-colors flex items-center space-x-1"
                >
                  <Copy size={11} />
                  <span>{copiedEmail ? 'Copied' : 'Copy Email'}</span>
                </button>
              </div>

              {/* Name & Contact Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="qsm-name" className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Name <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      id="qsm-name"
                      type="text"
                      required
                      placeholder="e.g. Ruwan Bandaranaike"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="qsm-contact" className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Number (Phone/WhatsApp)
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      id="qsm-contact"
                      type="tel"
                      placeholder="e.g. +94 77 123 4567"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="qsm-email" className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Email Address <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      id="qsm-email"
                      type="email"
                      required
                      placeholder="your.email@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="qsm-category" className="block text-xs font-semibold text-slate-300 mb-1">
                    Inquiry Category
                  </label>
                  <select
                    id="qsm-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Press & Media">Press & Media Inquiry</option>
                    <option value="Environmental Clearance (CEA)">Environmental Clearance (CEA)</option>
                    <option value="Community Water Project">Community Water Project</option>
                    <option value="Employment & Academy">Employment & Hospitality Academy</option>
                    <option value="General Question">General Question / Other</option>
                  </select>
                </div>
              </div>

              {/* Question Textarea */}
              <div>
                <label htmlFor="qsm-question" className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Question / Inquiry Details <span className="text-amber-400">*</span>
                </label>
                <textarea
                  id="qsm-question"
                  required
                  rows={6}
                  placeholder="Type your question or press query here. Refers to official clearances, Grand Opening, or community projects..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* CV Upload & LinkedIn -- always visible now, not just for
                  "Employment & Academy". This used to be hidden unless that
                  exact category was selected first, which meant a student
                  or job applicant could easily submit without ever seeing
                  it if they picked a different category (or left the
                  default "General Question"). Relevant for any inquiry, so
                  it's just always available now. */}
              <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-4 space-y-3">
                  <p className="text-[11px] text-amber-300 font-semibold flex items-center gap-1.5">
                    <FileText size={13} /> Optional — attach a CV if this is a job or academy application
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Upload CV (PDF or Word)</label>
                    <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-950 border border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl text-xs text-slate-400 cursor-pointer transition-colors">
                      <Upload size={14} className="text-amber-400 shrink-0" />
                      <span className="truncate">{cvFile ? cvFile.name : 'Choose a file...'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                  <div>
                    <label htmlFor="qsm-linkedin" className="block text-xs font-semibold text-slate-300 mb-1">LinkedIn Profile URL</label>
                    <div className="relative">
                      <Linkedin size={15} className="absolute left-3 top-2.5 text-slate-500" />
                      <input
                        id="qsm-linkedin"
                        type="url"
                        placeholder="https://linkedin.com/in/your-profile"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center space-x-2"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>{submitting ? 'Uploading...' : 'Submit Question to insight@aviyana.lk'}</span>
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
