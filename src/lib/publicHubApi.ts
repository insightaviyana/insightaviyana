import { getSupabase, isSupabaseConfigured, resolveAmbiguousDeleteResult } from './supabase';
import { Milestone, CSRImpact, VoiceCut, FactCheckItem } from '../types';

// ============================================================
// Milestones
// ============================================================
interface MilestoneRow {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
  description: string;
  context: string | null;
  document_url: string | null;
  document_name: string | null;
  image_url: string;
  verified_by: string;
  last_edited_at: string | null;
}

function milestoneToRow(m: Milestone): MilestoneRow {
  return {
    id: m.id,
    title: m.title,
    category: m.category,
    date: m.date,
    status: m.status,
    description: m.description,
    context: m.context || null,
    document_url: m.documentUrl || null,
    document_name: m.documentName || null,
    image_url: m.imageUrl,
    verified_by: m.verifiedBy,
    last_edited_at: m.lastEditedAt || null
  };
}

function rowToMilestone(r: MilestoneRow): Milestone {
  return {
    id: r.id,
    title: r.title,
    category: r.category as Milestone['category'],
    date: r.date,
    status: r.status as Milestone['status'],
    description: r.description,
    context: r.context || undefined,
    documentUrl: r.document_url || undefined,
    documentName: r.document_name || undefined,
    imageUrl: r.image_url,
    verifiedBy: r.verified_by,
    lastEditedAt: r.last_edited_at || undefined
  };
}

export async function fetchMilestonesFromDb(): Promise<Milestone[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('milestones').select('*').order('date', { ascending: false });
  if (error) { console.error('fetchMilestonesFromDb:', error.message); return null; }
  return (data as MilestoneRow[]).map(rowToMilestone);
}
export async function createMilestoneInDb(item: Milestone): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('milestones').insert(milestoneToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Save did not go through — no row was created. It will look added now but WILL disappear on refresh.';
  return null;
}
export async function updateMilestoneInDb(item: Milestone): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('milestones').upsert(milestoneToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Update did not save — you may not have permission to edit this item. It will look updated now but WILL revert on refresh.';
  return null;
}
export async function deleteMilestoneFromDb(id: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('milestones').delete().eq('id', id).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return resolveAmbiguousDeleteResult(supabase, 'milestones', 'id', id, 'milestone');
  return null;
}

// ============================================================
// CSR / Fleet Impacts
// ============================================================
interface CsrRow {
  id: string;
  title: string;
  metric_value: string;
  metric_label: string;
  description: string;
  context: string | null;
  location: string;
  icon_name: string;
  image_url: string;
  video_url: string | null;
}

function csrToRow(c: CSRImpact): CsrRow {
  return {
    id: c.id,
    title: c.title,
    metric_value: c.metricValue,
    metric_label: c.metricLabel,
    description: c.description,
    context: c.context || null,
    location: c.location,
    icon_name: c.iconName,
    image_url: c.imageUrl,
    video_url: c.videoUrl || null
  };
}

function rowToCsr(r: CsrRow): CSRImpact {
  return {
    id: r.id,
    title: r.title,
    metricValue: r.metric_value,
    metricLabel: r.metric_label,
    description: r.description,
    context: r.context || undefined,
    location: r.location,
    iconName: r.icon_name as CSRImpact['iconName'],
    imageUrl: r.image_url,
    videoUrl: r.video_url || undefined
  };
}

export async function fetchCsrImpactsFromDb(): Promise<CSRImpact[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('csr_impacts').select('*');
  if (error) { console.error('fetchCsrImpactsFromDb:', error.message); return null; }
  return (data as CsrRow[]).map(rowToCsr);
}
export async function createCsrImpactInDb(item: CSRImpact): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('csr_impacts').insert(csrToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Save did not go through — no row was created. It will look added now but WILL disappear on refresh.';
  return null;
}
export async function updateCsrImpactInDb(item: CSRImpact): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('csr_impacts').upsert(csrToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Update did not save — you may not have permission to edit this item. It will look updated now but WILL revert on refresh.';
  return null;
}
export async function deleteCsrImpactFromDb(id: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('csr_impacts').delete().eq('id', id).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return resolveAmbiguousDeleteResult(supabase, 'csr_impacts', 'id', id, 'guest voice / CSR item');
  return null;
}

// ============================================================
// Voice Cuts (press statements)
// ============================================================
interface VoiceCutRow {
  id: string;
  speaker_name: string;
  speaker_role: string;
  title: string;
  duration: string;
  video_thumbnail: string;
  quote: string;
  video_url: string | null;
  date: string;
}

function voiceCutToRow(v: VoiceCut): VoiceCutRow {
  return {
    id: v.id,
    speaker_name: v.speakerName,
    speaker_role: v.speakerRole,
    title: v.title,
    duration: v.duration,
    video_thumbnail: v.videoThumbnail,
    quote: v.quote,
    video_url: v.videoUrl || null,
    date: v.date
  };
}

function rowToVoiceCut(r: VoiceCutRow): VoiceCut {
  return {
    id: r.id,
    speakerName: r.speaker_name,
    speakerRole: r.speaker_role,
    title: r.title,
    duration: r.duration,
    videoThumbnail: r.video_thumbnail,
    quote: r.quote,
    videoUrl: r.video_url || undefined,
    date: r.date
  };
}

export async function fetchVoiceCutsFromDb(): Promise<VoiceCut[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('voice_cuts').select('*').order('date', { ascending: false });
  if (error) { console.error('fetchVoiceCutsFromDb:', error.message); return null; }
  return (data as VoiceCutRow[]).map(rowToVoiceCut);
}
export async function createVoiceCutInDb(item: VoiceCut): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('voice_cuts').insert(voiceCutToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Save did not go through — no row was created. It will look added now but WILL disappear on refresh.';
  return null;
}
export async function updateVoiceCutInDb(item: VoiceCut): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('voice_cuts').upsert(voiceCutToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Update did not save — you may not have permission to edit this item. It will look updated now but WILL revert on refresh.';
  return null;
}
export async function deleteVoiceCutFromDb(id: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('voice_cuts').delete().eq('id', id).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return resolveAmbiguousDeleteResult(supabase, 'voice_cuts', 'id', id, 'press statement');
  return null;
}

// ============================================================
// Fact Checks / FAQs
// ============================================================
interface FactCheckRow {
  id: string;
  rumor: string;
  fact: string;
  official_source: string;
  document_proof: string | null;
  category: string;
  status: string;
  verified_date: string;
  approval_status: string;
  created_by: string | null;
  last_edited_at: string | null;
}

function factCheckToRow(f: FactCheckItem): FactCheckRow {
  return {
    id: f.id,
    rumor: f.rumor,
    fact: f.fact,
    official_source: f.officialSource,
    document_proof: f.documentProof || null,
    category: f.category,
    status: f.status,
    verified_date: f.verifiedDate,
    approval_status: f.approvalStatus,
    created_by: f.createdBy || null,
    last_edited_at: f.lastEditedAt || null
  };
}

function rowToFactCheck(r: FactCheckRow): FactCheckItem {
  return {
    id: r.id,
    rumor: r.rumor,
    fact: r.fact,
    officialSource: r.official_source,
    documentProof: r.document_proof || undefined,
    category: r.category as FactCheckItem['category'],
    status: r.status as FactCheckItem['status'],
    verifiedDate: r.verified_date,
    approvalStatus: (r.approval_status as FactCheckItem['approvalStatus']) || 'Published',
    createdBy: r.created_by || undefined,
    lastEditedAt: r.last_edited_at || undefined
  };
}

export async function fetchFactChecksFromDb(): Promise<FactCheckItem[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('fact_checks').select('*').order('verified_date', { ascending: false });
  if (error) { console.error('fetchFactChecksFromDb:', error.message); return null; }
  return (data as FactCheckRow[]).map(rowToFactCheck);
}
export async function createFactCheckInDb(item: FactCheckItem): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('fact_checks').insert(factCheckToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Save did not go through — no row was created. It will look added now but WILL disappear on refresh.';
  return null;
}
export async function updateFactCheckInDb(item: FactCheckItem): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('fact_checks').upsert(factCheckToRow(item)).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return 'Update did not save — you may not have permission to edit this item. It will look updated now but WILL revert on refresh.';
  return null;
}
export async function deleteFactCheckFromDb(id: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';
  const { data, error } = await supabase.from('fact_checks').delete().eq('id', id).select('id');
  if (error) return error.message;
  if (!data || data.length === 0) return resolveAmbiguousDeleteResult(supabase, 'fact_checks', 'id', id, 'fact-check');
  return null;
}
