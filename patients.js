/**
 * patients.js
 * CareGrid HMS — Supabase Patients CRUD Module (UUID & Code Mapping Support)
 * Table: patients
 */

import { supabase } from "./supabase-config.js";

// ─── Guard helper ────────────────────────────────────────────
function guard() {
  if (!supabase) {
    const msg = "Supabase client not initialized. Check js/supabase-config.js.";
    console.error("patients.js:", msg);
    return false;
  }
  return true;
}

/**
 * Normalizes and validates the gender value.
 * @param {string} gender
 * @returns {{isValid: boolean, value: string|null}}
 */
export function normalizeAndValidateGender(gender) {
  if (!gender) return { isValid: false, value: null };
  const normalized = String(gender).trim().toLowerCase();
  const allowed = ["male", "female", "other"];
  if (allowed.includes(normalized)) {
    return { isValid: true, value: normalized };
  }
  // Support abbreviations
  if (normalized === "m") return { isValid: true, value: "male" };
  if (normalized === "f") return { isValid: true, value: "female" };
  if (normalized === "o") return { isValid: true, value: "other" };
  return { isValid: false, value: null };
}

// ─── ADD PATIENT ─────────────────────────────────────────────
/**
 * Insert a new patient record.
 * @param {Object} data  { name, age, gender, blood_group, disease, doctor, status }
 * @returns {Promise<{success:boolean, data?:any, error?:string}>}
 */
export async function addPatient(data) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    
    // Normalize and validate gender
    const genderObj = normalizeAndValidateGender(data.gender);
    if (!genderObj.isValid) {
      throw new Error(`Invalid gender value: "${data.gender}". Allowed values are Male, Female, Other (case-insensitive).`);
    }

    const normalizedData = {
      ...data,
      gender: genderObj.value
    };

    console.group("addPatient operation details:");
    console.log(" - Patient payload being sent to Supabase:", normalizedData);
    console.log(" - Gender value (original):", data.gender);
    console.log(" - Gender value (normalized):", normalizedData.gender);
    console.groupEnd();

    const { data: row, error } = await supabase
      .from("patients")
      .insert([normalizedData])
      .select()
      .single();

    if (error) {
      console.error("[patients.js] addPatient failed.");
      console.error(" - Supabase response error:", error);
      console.error(" - Error details:", JSON.stringify(error, null, 2));
      throw error;
    }

    console.log("[patients.js] addPatient succeeded.");
    console.log(" - Supabase response row:", row);
    
    // Map patient_code to id for the frontend
    const mappedRow = row ? { ...row, id: row.patient_code || row.id } : row;
    return { success: true, data: mappedRow };
  } catch (err) {
    console.error("addPatient error:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── GET ALL PATIENTS ─────────────────────────────────────────
/**
 * Fetch all patients ordered by creation date descending.
 * @returns {Promise<{success:boolean, data?:Array, error?:string}>}
 */
export async function getPatients() {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Map patient_code to id for the frontend
    const mapped = (data || []).map(row => ({
      ...row,
      id: row.patient_code || row.id
    }));
    return { success: true, data: mapped };
  } catch (err) {
    console.error("getPatients:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── UPDATE PATIENT ───────────────────────────────────────────
/**
 * Update an existing patient by primary-key id or patient code.
 * @param {string|number} id
 * @param {Object} updates
 * @returns {Promise<{success:boolean, data?:any, error?:string}>}
 */
export async function updatePatient(id, updates) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    
    const preparedUpdates = { ...updates };
    if (preparedUpdates.gender !== undefined) {
      const genderObj = normalizeAndValidateGender(preparedUpdates.gender);
      if (!genderObj.isValid) {
        throw new Error(`Invalid gender value: "${preparedUpdates.gender}". Allowed values are Male, Female, Other (case-insensitive).`);
      }
      preparedUpdates.gender = genderObj.value;
    }

    const isPatientCode = typeof id === 'string' && id.startsWith('PAT-');
    const queryField = isPatientCode ? 'patient_code' : 'id';

    console.group(`updatePatient operation details for ${id}:`);
    console.log(" - Patient updates being sent to Supabase:", preparedUpdates);
    if (updates.gender !== undefined) {
      console.log(" - Gender value (original):", updates.gender);
      console.log(" - Gender value (normalized):", preparedUpdates.gender);
    }
    console.groupEnd();

    const { data, error } = await supabase
      .from("patients")
      .update(preparedUpdates)
      .eq(queryField, id)
      .select()
      .single();

    if (error) {
      console.error("[patients.js] updatePatient failed.");
      console.error(" - Supabase response error:", error);
      console.error(" - Error details:", JSON.stringify(error, null, 2));
      throw error;
    }

    console.log("[patients.js] updatePatient succeeded.");
    console.log(" - Supabase response row:", data);

    // Map patient_code to id for the frontend
    const mappedRow = data ? { ...data, id: data.patient_code || data.id } : data;
    return { success: true, data: mappedRow };
  } catch (err) {
    console.error("updatePatient error:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── DELETE PATIENT ───────────────────────────────────────────
/**
 * Delete a patient record by id or patient code.
 * @param {string|number} id
 * @returns {Promise<{success:boolean, error?:string}>}
 */
export async function deletePatient(id) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    
    const isPatientCode = typeof id === 'string' && id.startsWith('PAT-');
    const queryField = isPatientCode ? 'patient_code' : 'id';

    const { error } = await supabase.from("patients").delete().eq(queryField, id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("deletePatient:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── SEARCH PATIENTS ──────────────────────────────────────────
/**
 * Full-text search across name, disease fields.
 * @param {string} query
 * @returns {Promise<{success:boolean, data?:Array, error?:string}>}
 */
export async function searchPatients(query) {
  try {
    if (!guard()) return { success: false, error: "Supabase not initialized." };
    const term = `%${query}%`;
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .or(`name.ilike.${term},disease.ilike.${term},patient_code.ilike.${term}`)
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Map patient_code to id for the frontend
    const mapped = (data || []).map(row => ({
      ...row,
      id: row.patient_code || row.id
    }));
    return { success: true, data: mapped };
  } catch (err) {
    console.error("searchPatients:", err.message);
    return { success: false, error: err.message };
  }
}
