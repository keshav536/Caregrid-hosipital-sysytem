/**
 * doctors.js
 * CareGrid HMS — Supabase Doctors CRUD Module (UUID & Code Mapping Support)
 * Table: doctors
 */

import { supabase } from "./supabase-config.js";

// ─── Guard helper ────────────────────────────────────────────
function guard() {
  if (!supabase) {
    console.error("doctors.js: Supabase client not initialized. Check js/supabase-config.js.");
    return false;
  }
  return true;
}

// ─── ADD DOCTOR ───────────────────────────────────────────────
/**
 * Insert a new doctor record.
 * @param {Object} data  { name, dept, qual, exp, rating, fee, avail, status, image }
 * @returns {Promise<{success:boolean, data?:any, error?:string}>}
 */
export async function addDoctor(data) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const { data: row, error } = await supabase
      .from("doctors")
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    
    // Map doctor_code to id for the frontend
    const mappedRow = row ? { ...row, id: row.doctor_code || row.id } : row;
    return { success: true, data: mappedRow };
  } catch (err) {
    console.error("addDoctor:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── GET ALL DOCTORS ──────────────────────────────────────────
/**
 * Fetch all doctors.
 * @returns {Promise<{success:boolean, data?:Array, error?:string}>}
 */
export async function getDoctors() {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;

    // Map doctor_code to id for the frontend
    const mapped = (data || []).map(row => ({
      ...row,
      id: row.doctor_code || row.id
    }));
    return { success: true, data: mapped };
  } catch (err) {
    console.error("getDoctors:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── UPDATE DOCTOR ────────────────────────────────────────────
/**
 * Update a doctor record by id or doctor code.
 * @param {string|number} id
 * @param {Object} updates
 * @returns {Promise<{success:boolean, data?:any, error?:string}>}
 */
export async function updateDoctor(id, updates) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };

    const isDoctorCode = typeof id === 'string' && id.startsWith('DOC-');
    const queryField = isDoctorCode ? 'doctor_code' : 'id';

    const { data, error } = await supabase
      .from("doctors")
      .update(updates)
      .eq(queryField, id)
      .select()
      .single();
    if (error) throw error;

    // Map doctor_code to id for the frontend
    const mappedRow = data ? { ...data, id: data.doctor_code || data.id } : data;
    return { success: true, data: mappedRow };
  } catch (err) {
    console.error("updateDoctor:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── DELETE DOCTOR ────────────────────────────────────────────
/**
 * Delete a doctor record by id or doctor code.
 * @param {string|number} id
 * @returns {Promise<{success:boolean, error?:string}>}
 */
export async function deleteDoctor(id) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };

    const isDoctorCode = typeof id === 'string' && id.startsWith('DOC-');
    const queryField = isDoctorCode ? 'doctor_code' : 'id';

    const { error } = await supabase.from("doctors").delete().eq(queryField, id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("deleteDoctor:", err.message);
    return { success: false, error: err.message };
  }
}
