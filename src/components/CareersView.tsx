import React, { useState } from 'react';
import {
  Briefcase,
  Linkedin,
  Upload,
  Send,
  Loader2,
  CheckCircle2,
  User,
  Mail,
  Phone,
  FileText,
  Award,
  Users,
  TrendingUp,
  Newspaper,
  X,
  ZoomIn
} from 'lucide-react';
import { PublicInquiry, SocialLink, ArticleItem } from '../types';
import { sendNotificationEmail } from '../lib/emailApi';
import { uploadCv, fileToBase64 } from '../lib/cvUpload';
import { filterNameInput, filterPhoneInput } from '../lib/validation';
import { isPubliclyVisible } from '../lib/contentVisibility';
import { UpdatedBadge } from './UpdatedBadge';
import { RelatedArticles } from './RelatedArticles';
import { ArticleContentRenderer } from './ArticleContentRenderer';

interface CareersViewProps {
  socialLinks: SocialLink[];
  onSubmitInquiry: (inquiry: PublicInquiry) => void;
  onConfirmationEmailFailed?: (email: string, errorMessage: string) => void;
  /** Published articles are filtered here to just the 'Career & Hiring'
   * category and shown as a "Career News" section -- previously
   * career-related announcements (new roles, hiring drives, academy
   * intake news) were only ever visible on the Announcements page, with
   * no link from the Careers page a job-seeker would actually be on. */
  articles?: ArticleItem[];
  onArticleViewed?: (articleId: string) => void;
}

export const CareersView: React.FC<CareersViewProps> = ({
  socialLinks,
  onSubmitInquiry,
  onConfirmationEmailFailed,
  articles = [],
  onArticleViewed
}) => {
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);
  // Click-to-zoom for the reader modal's cover image -- same pattern as
  // PublicHubView's article modal / ArticleContentRenderer's inline images.
  const [coverImageLightbox, setCoverImageLightbox] = useState(false);
  const [gridImageLightbox, setGridImageLightbox] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [position, setPosition] = useState('');
  const [message, setMessage] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const linkedinLink = socialLinks.find(l => l.iconName === 'linkedin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !position.trim()) return;
    setSubmitting(true);

    const ticketNumber = `AV-CAREERS-${Math.floor(1000 + Math.random() * 9000)}`;

    let cvUrl: string | undefined;
    let cvFileName: string | undefined;
    let cvBase64: string | null = null;
    if (cvFile) {
      const uploadResult = await uploadCv(cvFile, name.trim());
      if (uploadResult) {
        cvUrl = uploadResult.signedUrl;
        cvFileName = uploadResult.fileName;
      }
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
      category: 'Employment & Academy',
      question: `Position of interest: ${position.trim()}\n\n${message.trim()}`,
      submittedAt: new Date().toLocaleString(),
      status: 'Delivered to insight@aviyana.lk',
      ticketNumber,
      cvUrl,
      cvFileName,
      linkedinUrl: linkedinUrl.trim() || undefined
    };

    onSubmitInquiry(newInquiry);
    setSubmittedTicket(ticketNumber);
    setSubmitting(false);

    sendNotificationEmail({
      subject: `[${ticketNumber}] Careers: ${position.trim()}`,
      replyTo: newInquiry.email,
      textBody:
        `New Job Opportunity Inquiry — Aviyana Ceylon Resort Careers\n\n` +
        `Ticket Number: ${ticketNumber}\n` +
        `Name: ${newInquiry.name}\n` +
        `Email: ${newInquiry.email}\n` +
        `Contact: ${newInquiry.contact}\n` +
        `Position of Interest: ${position.trim()}\n` +
        (linkedinUrl.trim() ? `LinkedIn: ${linkedinUrl.trim()}\n` : '') +
        (cvFileName ? `CV Attached: ${cvFileName}\n` : '(No CV attached)\n') +
        `\nMessage:\n${message.trim() || '(none)'}`,
      attachments: cvBase64 && cvFile ? [{ filename: cvFile.name, content: cvBase64 }] : undefined
    });

    sendNotificationEmail({
      subject: `We've received your application — Ticket #${ticketNumber}`,
      to: newInquiry.email,
      textBody:
        `Dear ${newInquiry.name},\n\n` +
        `Thank you for your interest in joining Aviyana Ceylon Resort. Your application for "${position.trim()}" has been logged as Ticket #${ticketNumber}.\n\n` +
        `Our HR & Hotel School Partnership Directorate will review your application and reach out if there's a fit.\n\n` +
        `— Aviyana Ceylon Resort, insight.aviyana.lk`
    }).then(errorMsg => {
      if (errorMsg) onConfirmationEmailFailed?.(newInquiry.email, errorMsg);
    });
  };

  const resetForm = () => {
    setName(''); setEmail(''); setContact(''); setPosition(''); setMessage('');
    setLinkedinUrl(''); setCvFile(null); setSubmittedTicket(null);
  };

  const careerArticles = articles
    .filter(a => isPubliclyVisible(a) && a.category === 'Career & Hiring')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="hero-band relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/80 border border-amber-500/30 p-8 shadow-2xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <Briefcase size={14} className="text-amber-400" />
            <span>Careers at Aviyana Ceylon Resort</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
            Build Your Career With Sri Lanka's Premier <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
              7-Star Resort Team
            </span>
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            From hospitality and guest services to sustainability and engineering — we're building a team of local talent ahead of our August 2027 Grand Opening.
          </p>
          {linkedinLink && (
            <a
              href={linkedinLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#0958a8] text-white font-bold rounded-xl text-xs transition-all shadow-lg"
            >
              <Linkedin size={16} />
              <span>Follow & Connect on LinkedIn</span>
            </a>
          )}
        </div>
      </div>

      {/* Highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/90 border border-amber-500/30 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Award size={22} />
          </div>
          <h3 className="font-serif font-bold text-base text-white">Paid Training & Certification</h3>
          <p className="text-xs text-slate-300">Full-stipend Hospitality Academy programs for local hires, no experience required for entry roles.</p>
        </div>
        <div className="p-5 bg-slate-900/90 border border-amber-500/30 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Users size={22} />
          </div>
          <h3 className="font-serif font-bold text-base text-white">85%+ Local Employment</h3>
          <p className="text-xs text-slate-300">The vast majority of our workforce is local Sri Lankan talent, including Hotel School graduates.</p>
        </div>
        <div className="p-5 bg-slate-900/90 border border-amber-500/30 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <TrendingUp size={22} />
          </div>
          <h3 className="font-serif font-bold text-base text-white">Real Growth Paths</h3>
          <p className="text-xs text-slate-300">From trainee to department lead — genuine career progression as we scale toward Grand Opening.</p>
        </div>
      </div>

      {/* Career News -- published articles categorized "Career & Hiring"
          (new role openings, hiring drives, academy intake announcements),
          pulled from the same Announcements content a staff member already
          publishes -- no separate posting step needed for it to show up
          here too. */}
      {careerArticles.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Newspaper size={14} />
            <span>Career News</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-white mb-4">Hiring Drives, New Roles & Academy Intake Updates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {careerArticles.map(article => (
              <div
                key={article.id}
                onClick={() => { setSelectedArticle(article); onArticleViewed?.(article.id); }}
                className="bg-slate-900/90 border border-amber-500/20 rounded-2xl overflow-hidden hover:border-amber-500/60 transition-all shadow-lg cursor-pointer group hover:-translate-y-1"
              >
                <div className="relative h-36 overflow-hidden bg-slate-950">
                  <img
                    loading="lazy"
                    src={article.coverImageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold">
                    {article.date}
                  </div>
                  {article.coverImageUrl && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setGridImageLightbox(article.coverImageUrl!); }}
                      aria-label={`View full size image: ${article.title}`}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 backdrop-blur-sm text-amber-300 border border-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-zoom-in"
                    >
                      <ZoomIn size={13} />
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-post font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 line-clamp-2">{article.subtitle}</p>
                  <span className="text-[11px] text-amber-300/80 group-hover:underline mt-2 inline-block">Click to read full article &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Form */}
      <div className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 sm:p-8">
        <div className="max-w-2xl mx-auto text-center mb-6">
          <h2 className="text-xl font-serif font-bold text-white mb-1">Submit a Job Opportunity Inquiry</h2>
          <p className="text-xs text-slate-400">Tell us what role interests you, attach your CV, and our HR team will get back to you.</p>
        </div>

        {submittedTicket ? (
          <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-3 max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-xl font-serif font-bold text-white">Application Received — Ticket #{submittedTicket}</h4>
            <p className="text-xs text-slate-400">We've emailed a confirmation to you. Our HR & Hotel School Partnership Directorate will be in touch.</p>
            <button onClick={resetForm} className="text-xs text-amber-300 hover:underline">Submit another application</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="careers-name" className="block text-xs font-semibold text-slate-300 mb-1">Full Name <span className="text-amber-400">*</span></label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-2.5 text-slate-500" />
                  <input id="careers-name" required value={name} onChange={e => setName(filterNameInput(e.target.value))} placeholder="e.g. Nimali Perera" className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500" />
                </div>
              </div>
              <div>
                <label htmlFor="careers-contact" className="block text-xs font-semibold text-slate-300 mb-1">Contact Number</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-2.5 text-slate-500" />
                  <input id="careers-contact" type="tel" inputMode="tel" value={contact} onChange={e => setContact(filterPhoneInput(e.target.value))} placeholder="e.g. +94 77 123 4567" className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="careers-email" className="block text-xs font-semibold text-slate-300 mb-1">Email Address <span className="text-amber-400">*</span></label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-2.5 text-slate-500" />
                  <input id="careers-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.email@domain.com" className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500" />
                </div>
              </div>
              <div>
                <label htmlFor="careers-position" className="block text-xs font-semibold text-slate-300 mb-1">Position of Interest <span className="text-amber-400">*</span></label>
                <input id="careers-position" required value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Guest Services, F&B, Engineering" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500" />
              </div>
            </div>

            <div>
              <label htmlFor="careers-message" className="block text-xs font-semibold text-slate-300 mb-1">Message (optional)</label>
              <textarea id="careers-message" rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us about your experience or why you're interested..." className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Upload CV (PDF or Word)</label>
                <label className="flex items-center gap-2 px-3 py-2.5 bg-slate-950 border border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl text-xs text-slate-400 cursor-pointer transition-colors">
                  <Upload size={14} className="text-amber-400 shrink-0" />
                  <span className="truncate">{cvFile ? cvFile.name : 'Choose a file...'}</span>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setCvFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div>
                <label htmlFor="careers-linkedin" className="block text-xs font-semibold text-slate-300 mb-1">LinkedIn Profile URL</label>
                <div className="relative">
                  <Linkedin size={15} className="absolute left-3 top-2.5 text-slate-500" />
                  <input id="careers-linkedin" type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/your-profile" className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500" />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center space-x-2"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                <span>{submitting ? 'Uploading...' : 'Submit Application'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Career News article reader */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md" onClick={() => { setSelectedArticle(null); setCoverImageLightbox(false); }}>
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setSelectedArticle(null); setCoverImageLightbox(false); }}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-slate-950/90 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <X size={18} />
            </button>
            {selectedArticle.coverImageUrl && (
              <div className="w-full aspect-video bg-black rounded-t-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCoverImageLightbox(true)}
                  className="w-full h-full cursor-zoom-in"
                  aria-label={`View full size: ${selectedArticle.title}`}
                >
                  <img
                    src={selectedArticle.coverImageUrl}
                    alt={selectedArticle.title}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </button>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider">{selectedArticle.date}</span>
                <UpdatedBadge lastEditedAt={selectedArticle.lastEditedAt} />
              </div>
              <h2 className="text-xl font-post font-bold text-white">{selectedArticle.title}</h2>
              <p className="text-sm text-amber-300/90 mt-1">{selectedArticle.subtitle}</p>
              <div className="mt-4 text-sm text-slate-200">
                <ArticleContentRenderer content={selectedArticle.content} className="space-y-4 font-read" />
              </div>
              <RelatedArticles
                articles={articles}
                current={selectedArticle}
                onSelect={(article) => { setSelectedArticle(article); onArticleViewed?.(article.id); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Full-size cover image lightbox (article reader modal) */}
      {coverImageLightbox && selectedArticle?.coverImageUrl && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md cursor-zoom-out"
          onClick={() => setCoverImageLightbox(false)}
        >
          <button
            onClick={() => setCoverImageLightbox(false)}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700"
          >
            <X size={20} />
          </button>
          <img src={selectedArticle.coverImageUrl} alt={selectedArticle.title} className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Full-size grid card image lightbox */}
      {gridImageLightbox && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md cursor-zoom-out"
          onClick={() => setGridImageLightbox(null)}
        >
          <button
            onClick={() => setGridImageLightbox(null)}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700"
          >
            <X size={20} />
          </button>
          <img src={gridImageLightbox} alt="Full size preview" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};
