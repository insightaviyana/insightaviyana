import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, ShieldCheck, Mail, Phone, User as UserIcon, Sparkles, Building, Award } from 'lucide-react';
import { UserRegistration } from '../types';

interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterUser: (registration: UserRegistration) => void;
}

export const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisterUser
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [organizationRole, setOrganizationRole] = useState<UserRegistration['organizationRole']>('Press & Journalist');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Press Releases',
    'Grand Opening Invitations'
  ]);
  const [completedPass, setCompletedPass] = useState<UserRegistration | null>(null);

  if (!isOpen) return null;

  const interestOptions = [
    'Press Releases & Official Statements',
    'CEA Environmental Clearance Updates',
    'Grand Opening Invitations (August 2027)',
    'Aviyana Hospitality Academy Scholarships',
    'CSR & Community Water Projects',
    'Soft Launch VIP Suite Bookings'
  ];

  const toggleInterest = (item: string) => {
    setSelectedInterests(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !contact.trim()) return;

    const vipPassCode = `AV-VIP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReg: UserRegistration = {
      id: `reg-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      contact: contact.trim(),
      organizationRole,
      registeredAt: new Date().toLocaleDateString(),
      interests: selectedInterests,
      vipPassCode
    };

    onRegisterUser(newReg);
    setCompletedPass(newReg);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setContact('');
    setCompletedPass(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-b border-amber-500/20">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <UserPlus size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-lg text-white">VIP & Press Registration</h3>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  insight.aviyana.lk
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Register for direct press briefings, grand opening passes & official updates
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {completedPass ? (
            <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                <Award size={36} />
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Digital VIP Pass Issued</span>
                <h4 className="text-xl font-serif font-bold text-white mt-1">{completedPass.name}</h4>
                <p className="text-xs text-slate-300">{completedPass.organizationRole}</p>
              </div>

              {/* Pass Card */}
              <div className="bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-400/50 rounded-xl p-4 text-left font-mono space-y-2 text-xs">
                <div className="flex justify-between items-center text-amber-300 pb-2 border-b border-amber-500/20">
                  <span className="font-bold">AVIYANA CEYLON DIGITAL PASS</span>
                  <Sparkles size={14} className="text-amber-400" />
                </div>
                <div className="text-slate-300">Pass Code: <strong className="text-amber-200 text-sm">{completedPass.vipPassCode}</strong></div>
                <div className="text-slate-400">Email: <span className="text-slate-200">{completedPass.email}</span></div>
                <div className="text-slate-400">Contact: <span className="text-slate-200">{completedPass.contact}</span></div>
                <div className="text-emerald-400 text-[10px] pt-1">Status: Registered for August 2026 Grand Opening Briefings</div>
              </div>

              <p className="text-xs text-slate-400">
                A confirmation copy has been queued for dispatch to <strong className="text-amber-300">{completedPass.email}</strong>.
              </p>

              <button
                onClick={handleReset}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg"
              >
                Done / Close Pass
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Name Field */}
              <div>
                <label htmlFor="urm-name" className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon size={15} className="absolute left-3 top-2.5 text-slate-500" />
                  <input
                    id="urm-name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Email & Contact Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="urm-email" className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      id="urm-email"
                      type="email"
                      required
                      placeholder="email@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="urm-contact" className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Phone / WhatsApp <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      id="urm-contact"
                      type="tel"
                      required
                      placeholder="+94 77 123 4567"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label htmlFor="urm-role" className="block text-xs font-semibold text-slate-300 mb-1">
                  Organization / Role Category
                </label>
                <div className="relative">
                  <Building size={15} className="absolute left-3 top-2.5 text-slate-500" />
                  <select
                    id="urm-role"
                    value={organizationRole}
                    onChange={(e) => setOrganizationRole(e.target.value as any)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Press & Journalist">Press & Media Journalist</option>
                    <option value="Local Resident / Community">Local Resident / Village Community</option>
                    <option value="Investor / Partner">Investor / Industry Partner</option>
                    <option value="Hospitality Trainee">Hospitality Student / Trainee</option>
                    <option value="Future Resort Guest">Future Soft Launch Resort Guest</option>
                  </select>
                </div>
              </div>

              {/* Interests Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Updates You wish to Receive
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  {interestOptions.map((opt) => {
                    const checked = selectedInterests.includes(opt);
                    return (
                      <label
                        key={opt}
                        onClick={() => toggleInterest(opt)}
                        className={`flex items-center space-x-2 p-1.5 rounded-lg cursor-pointer text-[11px] transition-colors ${
                          checked ? 'bg-amber-500/15 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          checked ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700'
                        }`}>
                          {checked && <CheckCircle2 size={12} className="stroke-[3]" />}
                        </div>
                        <span className="truncate">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
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
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center space-x-2"
                >
                  <UserPlus size={15} />
                  <span>Register & Issue VIP Pass</span>
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
