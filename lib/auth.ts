// ============================================================
// Auth helpers — wraps Supabase Auth for LittleSeed
// ============================================================

import { supabase, supabaseAdmin } from './supabase';

export interface UserProfile {
  id: string;
  display_name: string | null;
  role: 'user' | 'moderator' | 'admin';
  email?: string;
}

/** Send a magic-link email. Returns error string or null. */
export async function signInWithEmail(email: string): Promise<string | null> {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  return error?.message ?? null;
}

/** Sign the current user out. */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Get the current session (server-safe). */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Get the authenticated user (lightweight check). */
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Fetch the public profile row for the current user. */
export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_profiles')
    .select('id, display_name, role')
    .eq('id', user.id)
    .single();

  if (!data) return null;
  return { ...data, email: user.email };
}

/** Toggle like on a sheet. Returns new liked state + count. */
export async function toggleLike(slug: string) {
  const { data, error } = await supabase.rpc('toggle_like', { p_slug: slug });
  if (error) throw error;
  return data[0] as { liked: boolean; likes: number };
}

/** Toggle save on a sheet. Returns new saved state. */
export async function toggleSave(slug: string) {
  const { data, error } = await supabase.rpc('toggle_save', { p_slug: slug });
  if (error) throw error;
  return data[0] as { saved: boolean };
}

/** Get like/save state for a sheet for the current user. */
export async function getSheetUserState(slug: string) {
  const { data, error } = await supabase.rpc('get_sheet_user_state', { p_slug: slug });
  if (error) return { liked: false, saved: false, likes: 0 };
  return data[0] as { liked: boolean; saved: boolean; likes: number };
}

/** Get the current user's saved sheets. */
export async function getSavedSheets() {
  const { data, error } = await supabase
    .from('user_saves')
    .select(`
      created_at,
      coloring_page: coloring_pages (
        id, slug, bible_story, age_group, difficulty, thumbnail_url, svg_url, tags
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data.map((row: any) => row.coloring_page).filter(Boolean);
}

/** Get the current user's conversion history. */
export async function getConversionHistory() {
  const { data, error } = await supabase
    .from('user_conversions')
    .select('id, title, verse, language_code, print_mode, copyright_status, published, created_at, original_filename')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return [];
  return data;
}

/** Save a conversion record to the DB. */
export async function saveConversion(record: {
  upload_id: string;
  original_filename: string;
  title: string;
  verse: string;
  description: string;
  tags: string[];
  language_code: string;
  print_mode: string;
  svg_data?: string;
  copyright_status: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabaseAdmin
    .from('user_conversions')
    .insert({ ...record, user_id: user.id })
    .select('id')
    .single();

  if (error) return null;
  return data.id as string;
}
