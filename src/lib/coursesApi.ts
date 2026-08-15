import { getSupabase, isSupabaseConfigured } from './supabase';
import { EducationCourse } from '../types';

// Maps between the app's camelCase EducationCourse shape and the
// snake_case `courses` table columns (see supabase-setup.sql).

interface CourseRow {
  id: string;
  title: string;
  category: string;
  duration: string;
  instructor: string;
  description: string;
  highlights: string[] | null;
  enrolled_count: number;
  badge: string;
  status: string;
  schedule: string;
  syllabus_doc_name: string | null;
}

function toRow(course: EducationCourse): CourseRow {
  return {
    id: course.id,
    title: course.title,
    category: course.category,
    duration: course.duration,
    instructor: course.instructor,
    description: course.description,
    highlights: course.highlights,
    enrolled_count: course.enrolledCount,
    badge: course.badge,
    status: course.status,
    schedule: course.schedule,
    syllabus_doc_name: course.syllabusDocName || null
  };
}

function fromRow(row: CourseRow): EducationCourse {
  return {
    id: row.id,
    title: row.title,
    category: row.category as EducationCourse['category'],
    duration: row.duration,
    instructor: row.instructor,
    description: row.description,
    highlights: row.highlights || [],
    enrolledCount: row.enrolled_count,
    badge: row.badge,
    status: row.status as EducationCourse['status'],
    schedule: row.schedule,
    syllabusDocName: row.syllabus_doc_name || undefined
  };
}

/**
 * Loads all academy courses from Supabase.
 * Returns null (rather than throwing) if Supabase isn't configured or the
 * request fails, so callers can fall back to local mock data without crashing.
 */
export async function fetchCoursesFromDb(): Promise<EducationCourse[] | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Supabase fetchCoursesFromDb error:', error.message);
    return null;
  }

  return (data as CourseRow[]).map(fromRow);
}

/** Writes a newly-created course to Supabase. Returns null on success, or an error message string on failure/not-configured. */
export async function createCourseInDb(course: EducationCourse): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('courses').insert(toRow(course));
  if (error) {
    console.error('Supabase createCourseInDb error:', error.message);
    return error.message;
  }
  return null;
}

/** Updates an existing course's row in Supabase by id. Returns null on success, or an error message string on failure/not-configured. */
export async function updateCourseInDb(course: EducationCourse): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('courses').update(toRow(course)).eq('id', course.id);
  if (error) {
    console.error('Supabase updateCourseInDb error:', error.message);
    return error.message;
  }
  return null;
}

/** Deletes a course row from Supabase by id. Returns null on success, or an error message string on failure/not-configured. */
export async function deleteCourseFromDb(courseId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase not configured';
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) {
    console.error('Supabase deleteCourseFromDb error:', error.message);
    return error.message;
  }
  return null;
}
