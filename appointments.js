/**
 * appointments.js
 * CareGrid HMS — Supabase Appointments CRUD Module (UUID & Code Mapping Support)
 * Table: appointments
 */

import { supabase } from "./supabase-config.js";

// ─── Guard helper ────────────────────────────────────────────
function guard() {
  if (!supabase) {
    console.error("appointments.js: Supabase client not initialized. Check js/supabase-config.js.");
    return false;
  }
  return true;
}

// ─── BOOK APPOINTMENT ─────────────────────────────────────────
/**
 * Create a new appointment.
 * @param {Object} data  { patient, age, gender, phone, email, doctor, dept, date, time, symptoms }
 * @returns {Promise<{success:boolean, data?:any, error?:string}>}
 */
export async function bookAppointment(data) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const payload = { ...data, status: "upcoming" };
    const { data: row, error } = await supabase
      .from("appointments")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;

    // Map appointment_code to id for the frontend
    const mappedRow = row ? { ...row, id: row.appointment_code || row.id } : row;
    return { success: true, data: mappedRow };
  } catch (err) {
    console.error("bookAppointment:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── GET ALL APPOINTMENTS ─────────────────────────────────────
/**
 * Fetch all appointments ordered by date descending.
 * @returns {Promise<{success:boolean, data?:Array, error?:string}>}
 */
export async function getAppointments() {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;

    // Map appointment_code to id for the frontend
    const mapped = (data || []).map(row => ({
      ...row,
      id: row.appointment_code || row.id
    }));
    return { success: true, data: mapped };
  } catch (err) {
    console.error("getAppointments:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── UPDATE APPOINTMENT ───────────────────────────────────────
/**
 * Update an appointment record by id or appointment code.
 * @param {string|number} id
 * @param {Object} updates  e.g. { status: "completed" }
 * @returns {Promise<{success:boolean, data?:any, error?:string}>}
 */
export async function updateAppointment(id, updates) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };

    const isAptCode = typeof id === 'string' && id.startsWith('APT-');
    const queryField = isAptCode ? 'appointment_code' : 'id';

    const { data, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq(queryField, id)
      .select()
      .single();
    if (error) throw error;

    // Map appointment_code to id for the frontend
    const mappedRow = data ? { ...data, id: data.appointment_code || data.id } : data;
    return { success: true, data: mappedRow };
  } catch (err) {
    console.error("updateAppointment:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── CANCEL APPOINTMENT ───────────────────────────────────────
/**
 * Set an appointment's status to "cancelled".
 * @param {string|number} id
 * @returns {Promise<{success:boolean, error?:string}>}
 */
export async function cancelAppointment(id) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };

    const isAptCode = typeof id === 'string' && id.startsWith('APT-');
    const queryField = isAptCode ? 'appointment_code' : 'id';

    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq(queryField, id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("cancelAppointment:", err.message);
    return { success: false, error: err.message };
  }
}
