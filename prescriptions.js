/**
 * prescriptions.js
 * CareGrid HMS — Supabase Prescriptions CRUD Module (UUID & Code Mapping Support)
 * Table: prescriptions
 */

import { supabase } from "./supabase-config.js";

// ─── Guard helper ────────────────────────────────────────────
function guard() {
  if (!supabase) {
    console.error("prescriptions.js: Supabase client not initialized. Check js/supabase-config.js.");
    return false;
  }
  return true;
}

// ─── ADD PRESCRIPTION ─────────────────────────────────────────
/**
 * Insert a new prescription.
 * @param {Object} data  { number, date, doctor, patient, age, medicines, notes }
 * @returns {Promise<{success:boolean, data?:any, error?:string}>}
 */
export async function addPrescription(data) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const { data: row, error } = await supabase
      .from("prescriptions")
      .insert([data])
      .select()
      .single();
    if (error) throw error;

    // Map prescription number to id for frontend compatibility
    const mappedRow = row ? { ...row, id: row.number || row.id } : row;
    return { success: true, data: mappedRow };
  } catch (err) {
    console.error("addPrescription:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── GET ALL PRESCRIPTIONS ────────────────────────────────────
/**
 * Fetch all prescriptions ordered by creation date descending.
 * @returns {Promise<{success:boolean, data?:Array, error?:string}>}
 */
export async function getPrescriptions() {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Map prescription number to id for frontend compatibility
    const mapped = (data || []).map(row => ({
      ...row,
      id: row.number || row.id
    }));
    return { success: true, data: mapped };
  } catch (err) {
    console.error("getPrescriptions:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── UPDATE PRESCRIPTION ──────────────────────────────────────
/**
 * Update a prescription by id or prescription number.
 * @param {string|number} id
 * @param {Object} updates
 * @returns {Promise<{success:boolean, data?:any, error?:string}>}
 */
export async function updatePrescription(id, updates) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };

    const isRxNumber = typeof id === 'string' && id.startsWith('RX-');
    const queryField = isRxNumber ? 'number' : 'id';

    const { data, error } = await supabase
      .from("prescriptions")
      .update(updates)
      .eq(queryField, id)
      .select()
      .single();
    if (error) throw error;

    // Map prescription number to id for frontend compatibility
    const mappedRow = data ? { ...data, id: data.number || data.id } : data;
    return { success: true, data: mappedRow };
  } catch (err) {
    console.error("updatePrescription:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── DELETE PRESCRIPTION ──────────────────────────────────────
/**
 * Delete a prescription by id or prescription number.
 * @param {string|number} id
 * @returns {Promise<{success:boolean, error?:string}>}
 */
export async function deletePrescription(id) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };

    const isRxNumber = typeof id === 'string' && id.startsWith('RX-');
    const queryField = isRxNumber ? 'number' : 'id';

    const { error } = await supabase.from("prescriptions").delete().eq(queryField, id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("deletePrescription:", err.message);
    return { success: false, error: err.message };
  }
}
