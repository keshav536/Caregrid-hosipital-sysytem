/**
 * dashboard.js
 * CareGrid HMS — Supabase Dashboard Statistics Module (UUID & Code Mapping Support)
 */

import { supabase } from "./supabase-config.js";

// ─── Guard helper ────────────────────────────────────────────
function guard() {
  if (!supabase) {
    console.error("dashboard.js: Supabase client not initialized. Check js/supabase-config.js.");
    return false;
  }
  return true;
}

// ─── LOAD DASHBOARD STATISTICS ────────────────────────────────
/**
 * Returns aggregate counts: patients, appointments (upcoming), doctors, and gross revenue.
 * @returns {Promise<{success:boolean, data?:{patients,appointments,doctors,revenue}, error?:string}>}
 */
export async function loadDashboardStatistics() {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };

    const [pRes, aRes, dRes, bRes] = await Promise.all([
      supabase.from("patients").select("*", { count: "exact", head: true }),
      supabase.from("appointments").select("*", { count: "exact", head: true }).eq("status", "upcoming"),
      supabase.from("doctors").select("*", { count: "exact", head: true }),
      supabase.from("billing").select("total"),
    ]);

    const revenue = (bRes.data || []).reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0);

    return {
      success: true,
      data: {
        patients: pRes.count ?? 0,
        appointments: aRes.count ?? 0,
        doctors: dRes.count ?? 0,
        revenue,
      },
    };
  } catch (err) {
    console.error("loadDashboardStatistics:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── LOAD RECENT PATIENTS ─────────────────────────────────────
/**
 * Fetch the most recently added patients.
 * @param {number} limit  default 5
 * @returns {Promise<{success:boolean, data?:Array, error?:string}>}
 */
export async function loadRecentPatients(limit = 5) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    // Map patient_code to id for the frontend
    const mapped = (data || []).map(row => ({
      ...row,
      id: row.patient_code || row.id
    }));
    return { success: true, data: mapped };
  } catch (err) {
    console.error("loadRecentPatients:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── LOAD RECENT APPOINTMENTS ─────────────────────────────────
/**
 * Fetch upcoming appointments, most recent first.
 * @param {number} limit  default 5
 * @returns {Promise<{success:boolean, data?:Array, error?:string}>}
 */
export async function loadRecentAppointments(limit = 5) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "upcoming")
      .order("date", { ascending: true })
      .limit(limit);
    if (error) throw error;

    // Map appointment_code to id for the frontend
    const mapped = (data || []).map(row => ({
      ...row,
      id: row.appointment_code || row.id
    }));
    return { success: true, data: mapped };
  } catch (err) {
    console.error("loadRecentAppointments:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── LOAD REVENUE ─────────────────────────────────────────────
/**
 * Sums all billing totals.
 * @returns {Promise<{success:boolean, data?:{total:number}, error?:string}>}
 */
export async function loadRevenue() {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const { data, error } = await supabase.from("billing").select("total");
    if (error) throw error;
    const total = (data || []).reduce((s, r) => s + (parseFloat(r.total) || 0), 0);
    return { success: true, data: { total } };
  } catch (err) {
    console.error("loadRevenue:", err.message);
    return { success: false, error: err.message };
  }
}
