/**
 * billing.js
 * CareGrid HMS — Supabase Billing CRUD Module (UUID & Code Mapping Support)
 * Table: billing
 */

import { supabase } from "./supabase-config.js";

// ─── Guard helper ────────────────────────────────────────────
function guard() {
  if (!supabase) {
    console.error("billing.js: Supabase client not initialized. Check js/supabase-config.js.");
    return false;
  }
  return true;
}

// ─── GENERATE BILL ────────────────────────────────────────────
/**
 * Insert a new billing record.
 * @param {Object} data  { patient, date, fee, lab, med, room, discount, tax, total, method, status }
 * @returns {Promise<{success:boolean, data?:any, error?:string}>}
 */
export async function generateBill(data) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };

    // Clean payload: split invoice_number column, let DB auto-generate UUID primary key id
    const dbPayload = { ...data };
    if (dbPayload.id && typeof dbPayload.id === 'string' && dbPayload.id.startsWith('INV-')) {
      dbPayload.invoice_number = dbPayload.id;
      delete dbPayload.id;
    } else if (!dbPayload.invoice_number && dbPayload.id) {
      dbPayload.invoice_number = dbPayload.id;
      delete dbPayload.id;
    }

    const { data: row, error } = await supabase
      .from("billing")
      .insert([dbPayload])
      .select()
      .single();
    if (error) throw error;

    // Map back invoice_number to id for the frontend
    const mappedRow = row ? { ...row, id: row.invoice_number || row.id } : row;
    return { success: true, data: mappedRow };
  } catch (err) {
    console.error("generateBill:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── GET ALL BILLS ────────────────────────────────────────────
/**
 * Fetch all billing records ordered by date descending.
 * @returns {Promise<{success:boolean, data?:Array, error?:string}>}
 */
export async function getBills() {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const { data, error } = await supabase
      .from("billing")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Map invoice_number to id for the frontend
    const mapped = (data || []).map(row => ({
      ...row,
      id: row.invoice_number || row.id
    }));
    return { success: true, data: mapped };
  } catch (err) {
    console.error("getBills:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── UPDATE BILL ──────────────────────────────────────────────
/**
 * Update a billing record (e.g. payment status) by id or invoice number.
 * @param {string|number} id
 * @param {Object} updates  e.g. { status: "paid" }
 * @returns {Promise<{success:boolean, data?:any, error?:string}>}
 */
export async function updateBill(id, updates) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };

    const isInvoiceNumber = typeof id === 'string' && id.startsWith('INV-');
    const queryField = isInvoiceNumber ? 'invoice_number' : 'id';

    const { data, error } = await supabase
      .from("billing")
      .update(updates)
      .eq(queryField, id)
      .select()
      .single();
    if (error) throw error;

    // Map invoice_number to id for the frontend
    const mappedRow = data ? { ...data, id: data.invoice_number || data.id } : data;
    return { success: true, data: mappedRow };
  } catch (err) {
    console.error("updateBill:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── DELETE BILL ──────────────────────────────────────────────
/**
 * Delete a billing record by id or invoice number.
 * @param {string|number} id
 * @returns {Promise<{success:boolean, error?:string}>}
 */
export async function deleteBill(id) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };

    const isInvoiceNumber = typeof id === 'string' && id.startsWith('INV-');
    const queryField = isInvoiceNumber ? 'invoice_number' : 'id';

    const { error } = await supabase.from("billing").delete().eq(queryField, id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("deleteBill:", err.message);
    return { success: false, error: err.message };
  }
}
