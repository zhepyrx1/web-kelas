import { supabase, TABLES } from './supabase';

export async function signInWithPassword(email, password) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: profile, error: profileError } = await supabase
    .from(TABLES.profiles)
    .select('*, students(*)')
    .eq('user_id', data.user.id)
    .single();
  if (profileError) throw profileError;
  return { session: data.session, user: data.user, profile };
}

export async function createAttendanceSession(payload, userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLES.attendanceSessions)
    .insert({
      token: payload.token,
      class_name: payload.class_name,
      created_by: userId,
      expires_at: new Date(payload.expires_at).toISOString(),
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function recordQrAttendance({ studentId, sessionId }) {
  if (!supabase) return null;
  const now = new Date();
  const { data, error } = await supabase
    .from(TABLES.attendanceRecords)
    .insert({
      student_id: studentId,
      session_id: sessionId,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 8),
      status: 'Hadir',
      method: 'Scan QR Dinamis',
      note: 'Presensi berhasil.',
      approval_status: 'Terverifikasi',
    })
    .select()
    .single();
  if (error?.code === '23505') throw new Error('Kamu sudah melakukan presensi hari ini.');
  if (error) throw error;
  return data;
}

export async function submitAbsenceRequest({ studentId, type, reason, date, proofUrl }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLES.absenceRequests)
    .insert({
      student_id: studentId,
      type,
      reason,
      date,
      status: 'pending',
      proof_url: proofUrl || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAbsenceApproval(id, status, verifiedBy) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLES.absenceRequests)
    .update({ status, verified_by: verifiedBy, verified_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadProfilePhoto({ bucket = 'class-photos', path, file }) {
  if (!supabase) return null;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function updateProfilePhoto(profileId, photoUrl) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLES.profiles)
    .update({ photo_url: photoUrl })
    .eq('id', profileId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStudentPhoto(studentId, photoUrl) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLES.students)
    .update({ photo_url: photoUrl })
    .eq('id', studentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
