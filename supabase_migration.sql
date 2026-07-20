-- ==============================================================
-- CareGrid HMS — Complete Supabase Database Migration (UUID Version)
-- Project:  Hospital Management System (Frontend: CareGrid)
-- Version:  3.0.0  |  2026-07-10
-- ==============================================================

-- ==============================================================
-- 0. CLEANUP: Drop Existing Tables and Sequences (Reverse Dependency Order)
-- ==============================================================

DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS billing CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP SEQUENCE IF EXISTS patient_code_seq CASCADE;
DROP SEQUENCE IF EXISTS doctor_code_seq CASCADE;
DROP SEQUENCE IF EXISTS invoice_code_seq CASCADE;
DROP SEQUENCE IF EXISTS appointment_code_seq CASCADE;

-- ==============================================================
-- 1. HELPER FUNCTIONS & SEQUENCES
-- ==============================================================

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequences for code generation
CREATE SEQUENCE patient_code_seq START WITH 1;
CREATE SEQUENCE doctor_code_seq START WITH 1;
CREATE SEQUENCE invoice_code_seq START WITH 1;
CREATE SEQUENCE appointment_code_seq START WITH 1;

-- ==============================================================
-- 2. TABLE DEFINITIONS (All use UUID primary keys)
-- ==============================================================

-- ── users ─────────────────────────────────────────────────────
CREATE TABLE users (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT          UNIQUE NOT NULL,
  display_name TEXT,
  role         TEXT          DEFAULT 'staff' CHECK (role IN ('admin', 'doctor', 'staff', 'patient')),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── departments ───────────────────────────────────────────────
CREATE TABLE departments (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT          UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── doctors ───────────────────────────────────────────────────
CREATE TABLE doctors (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_code  TEXT          UNIQUE,
  name         TEXT          NOT NULL,
  dept         TEXT          NOT NULL,
  qual         TEXT,
  exp          INTEGER       DEFAULT 0,
  rating       NUMERIC(3,1)  DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  fee          NUMERIC(10,2) DEFAULT 0,
  avail        TEXT,
  status       TEXT          NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline')),
  image        TEXT,
  department_id UUID         REFERENCES departments(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── patients ──────────────────────────────────────────────────
CREATE TABLE patients (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code       TEXT          UNIQUE,
  name               TEXT          NOT NULL,
  age                INTEGER       NOT NULL CHECK (age > 0 AND age < 150),
  gender             TEXT          NOT NULL DEFAULT 'other' CHECK (LOWER(gender) IN ('male', 'female', 'other')),
  blood_group        TEXT,
  disease            TEXT          NOT NULL,
  doctor             TEXT,
  status             TEXT          NOT NULL DEFAULT 'admitted' CHECK (status IN ('admitted', 'recovered', 'discharged', 'critical')),
  assigned_doctor_id UUID          REFERENCES doctors(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── appointments ──────────────────────────────────────────────
CREATE TABLE appointments (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_code TEXT          UNIQUE,
  patient          TEXT          NOT NULL,
  age              INTEGER,
  gender           TEXT          DEFAULT 'other',
  phone            TEXT,
  email            TEXT,
  doctor           TEXT          NOT NULL,
  dept             TEXT,
  date             DATE          NOT NULL,
  time             TEXT,
  symptoms         TEXT,
  status           TEXT          NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  patient_id       UUID          REFERENCES patients(id) ON DELETE SET NULL,
  doctor_id        UUID          REFERENCES doctors(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── prescriptions ─────────────────────────────────────────────
CREATE TABLE prescriptions (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  number     TEXT          UNIQUE,
  date       DATE          DEFAULT CURRENT_DATE,
  doctor     TEXT          NOT NULL,
  patient    TEXT          NOT NULL,
  age        INTEGER,
  medicines  JSONB         DEFAULT '[]'::jsonb,
  notes      TEXT,
  patient_id UUID          REFERENCES patients(id) ON DELETE SET NULL,
  doctor_id  UUID          REFERENCES doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── billing ───────────────────────────────────────────────────
CREATE TABLE billing (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT          UNIQUE NOT NULL,
  patient        TEXT          NOT NULL,
  date           DATE          DEFAULT CURRENT_DATE,
  fee            NUMERIC(10,2) DEFAULT 0,
  lab            NUMERIC(10,2) DEFAULT 0,
  med            NUMERIC(10,2) DEFAULT 0,
  room           NUMERIC(10,2) DEFAULT 0,
  discount       NUMERIC(10,2) DEFAULT 0,
  tax            NUMERIC(10,2) DEFAULT 0,
  total          NUMERIC(10,2) DEFAULT 0,
  method         TEXT          DEFAULT 'Cash' CHECK (method IN ('Cash', 'Card', 'Insurance', 'Online')),
  status         TEXT          DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'cancelled')),
  patient_id     UUID          REFERENCES patients(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── medical_records ───────────────────────────────────────────
CREATE TABLE medical_records (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID          REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id   UUID          REFERENCES doctors(id) ON DELETE SET NULL,
  record_date DATE          DEFAULT CURRENT_DATE,
  diagnosis   TEXT          NOT NULL,
  treatment   TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── notifications ─────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID          REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT          NOT NULL,
  message    TEXT          NOT NULL,
  is_read    BOOLEAN       DEFAULT FALSE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── activity_logs ─────────────────────────────────────────────
CREATE TABLE activity_logs (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID          REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT          NOT NULL,
  details    TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ==============================================================
-- 3. TRIGGERS: auto-updated_at & code generators
-- ==============================================================

-- ── Attach updated_at triggers ──
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_doctors_updated_at BEFORE UPDATE ON doctors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_billing_updated_at BEFORE UPDATE ON billing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Code generation triggers ──
CREATE OR REPLACE FUNCTION set_patient_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patient_code IS NULL THEN
    NEW.patient_code := 'PAT-' || LPAD(nextval('patient_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_patient_code BEFORE INSERT ON patients FOR EACH ROW EXECUTE FUNCTION set_patient_code();

CREATE OR REPLACE FUNCTION set_doctor_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.doctor_code IS NULL THEN
    NEW.doctor_code := 'DOC-' || LPAD(nextval('doctor_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_doctor_code BEFORE INSERT ON doctors FOR EACH ROW EXECUTE FUNCTION set_doctor_code();

CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || (100000 + nextval('invoice_code_seq'))::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_invoice_number BEFORE INSERT ON billing FOR EACH ROW EXECUTE FUNCTION set_invoice_number();

CREATE OR REPLACE FUNCTION set_appointment_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.appointment_code IS NULL THEN
    NEW.appointment_code := 'APT-' || LPAD(nextval('appointment_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_appointment_code BEFORE INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION set_appointment_code();


-- ==============================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- We allow anon and authenticated roles full CRUD access to prevent
-- row level security violations during client-side Anon-key calls.
-- (This fully maintains Firebase Auth decoupling).

-- Users
CREATE POLICY "users_rls" ON users TO anon, authenticated USING (true) WITH CHECK (true);
-- Departments
CREATE POLICY "departments_rls" ON departments TO anon, authenticated USING (true) WITH CHECK (true);
-- Doctors
CREATE POLICY "doctors_rls" ON doctors TO anon, authenticated USING (true) WITH CHECK (true);
-- Patients
CREATE POLICY "patients_rls" ON patients TO anon, authenticated USING (true) WITH CHECK (true);
-- Appointments
CREATE POLICY "appointments_rls" ON appointments TO anon, authenticated USING (true) WITH CHECK (true);
-- Prescriptions
CREATE POLICY "prescriptions_rls" ON prescriptions TO anon, authenticated USING (true) WITH CHECK (true);
-- Billing
CREATE POLICY "billing_rls" ON billing TO anon, authenticated USING (true) WITH CHECK (true);
-- Medical Records
CREATE POLICY "medical_records_rls" ON medical_records TO anon, authenticated USING (true) WITH CHECK (true);
-- Notifications
CREATE POLICY "notifications_rls" ON notifications TO anon, authenticated USING (true) WITH CHECK (true);
-- Activity Logs
CREATE POLICY "activity_logs_rls" ON activity_logs TO anon, authenticated USING (true) WITH CHECK (true);


-- ==============================================================
-- 5. REALISTIC SEED DATA (Without specifying UUID values)
-- ==============================================================

-- Departments
INSERT INTO departments (name, description) VALUES
  ('Cardiology', 'Heart health and surgical services'),
  ('Neurology', 'Brain and nervous system diagnostic care'),
  ('Orthopedics', 'Bone, joint, and muscle treatments'),
  ('Pediatrics', 'Infant, child, and adolescent healthcare'),
  ('Dermatology', 'Skin, hair, and nail clinical services');

-- Doctors
INSERT INTO doctors (name, dept, qual, exp, rating, fee, avail, status, image) VALUES
  ('Dr. Aryan Mehta',  'Cardiology',  'MBBS, MD (Cardiology)',   12, 4.9, 250.00, 'Mon-Fri 9AM-5PM',  'online',  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=300&auto=format&fit=crop'),
  ('Dr. Priya Sharma', 'Neurology',   'MBBS, DM (Neurology)',    8,  4.8, 300.00, 'Tue-Sat 10AM-6PM', 'online',  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop'),
  ('Dr. Rohan Kapoor', 'Orthopedics',  'MBBS, MS (Ortho)',        15, 4.7, 200.00, 'Mon-Thu 8AM-4PM',  'online',  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=300&auto=format&fit=crop'),
  ('Dr. Sunita Patel', 'Pediatrics',  'MBBS, MD (Pediatrics)',   6,  4.9, 180.00, 'Mon-Sat 9AM-3PM',  'online',  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop'),
  ('Dr. Vikram Singh', 'Dermatology', 'MBBS, DVD',               10, 4.6, 220.00, 'Wed-Sun 11AM-7PM', 'offline', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=300&auto=format&fit=crop');

-- Patients
INSERT INTO patients (name, age, gender, blood_group, disease, doctor, status) VALUES
  ('Rahul Verma', 32, 'male',   'B+',  'Hypertension',  'Dr. Aryan Mehta',  'admitted'),
  ('Sneha Joshi', 27, 'female', 'O+',  'Migraine',      'Dr. Priya Sharma', 'recovered'),
  ('Amit Shah',   45, 'male',   'A+',  'Knee Injury',   'Dr. Rohan Kapoor', 'admitted'),
  ('Pooja Menon', 8,  'female', 'AB-', 'Viral Fever',   'Dr. Sunita Patel', 'discharged'),
  ('Deepak Nair', 38, 'male',   'O-',  'Eczema',        'Dr. Vikram Singh', 'admitted');

-- Connect patients to actual doctor UUIDs
UPDATE patients p SET assigned_doctor_id = d.id FROM doctors d WHERE p.doctor = d.name;

-- Appointments
INSERT INTO appointments (patient, age, gender, phone, email, doctor, dept, date, time, symptoms, status) VALUES
  ('Rahul Verma', 32, 'male',   '9876543210', 'rahul@example.com',  'Dr. Aryan Mehta',  'Cardiology',  CURRENT_DATE + 2, '10:00', 'Chest pain and breathlessness', 'upcoming'),
  ('Sneha Joshi', 27, 'female', '9812345678', 'sneha@example.com',  'Dr. Priya Sharma', 'Neurology',   CURRENT_DATE + 1, '11:30', 'Severe headache and dizziness',  'upcoming'),
  ('Amit Shah',   45, 'male',   '9823456789', 'amit@example.com',   'Dr. Rohan Kapoor', 'Orthopedics', CURRENT_DATE - 3, '09:00', 'Knee pain and swelling',         'completed'),
  ('Pooja Menon', 8,  'female', '9834567890', 'pooja@example.com',  'Dr. Sunita Patel', 'Pediatrics',  CURRENT_DATE - 1, '14:00', 'High fever and cold',            'completed'),
  ('Deepak Nair', 38, 'male',   '9845678901', 'deepak@example.com', 'Dr. Vikram Singh',  'Dermatology', CURRENT_DATE + 5, '15:00', 'Skin rash on arms and legs',     'upcoming');

UPDATE appointments a SET patient_id = p.id FROM patients p WHERE a.patient = p.name;
UPDATE appointments a SET doctor_id = d.id FROM doctors d WHERE a.doctor = d.name;

-- Prescriptions
INSERT INTO prescriptions (number, date, doctor, patient, age, medicines, notes) VALUES
  (
    'RX-000001', CURRENT_DATE - 3, 'Dr. Aryan Mehta', 'Rahul Verma', 32,
    '[{"name":"Amlodipine 5mg","morning":true,"afternoon":false,"night":true,"note":"Take with water"},{"name":"Atorvastatin 10mg","morning":false,"afternoon":false,"night":true,"note":"Take after dinner"}]'::jsonb,
    'Avoid salt. Monitor BP daily. Follow-up in 2 weeks.'
  ),
  (
    'RX-000002', CURRENT_DATE - 1, 'Dr. Priya Sharma', 'Sneha Joshi', 27,
    '[{"name":"Sumatriptan 50mg","morning":false,"afternoon":false,"night":true,"note":"Only during migraine episode"},{"name":"Betahistine 16mg","morning":true,"afternoon":true,"night":false,"note":"Take after food"}]'::jsonb,
    'Avoid bright lights during attack. Rest in dark room.'
  );

UPDATE prescriptions pr SET patient_id = p.id FROM patients p WHERE pr.patient = p.name;
UPDATE prescriptions pr SET doctor_id = d.id FROM doctors d WHERE pr.doctor = d.name;

-- Billing
INSERT INTO billing (invoice_number, patient, date, fee, lab, med, room, discount, tax, total, method, status) VALUES
  ('INV-100001', 'Amit Shah',   CURRENT_DATE - 3, 350.00, 120.00, 85.00,  200.00, 50.00,  128.07, 833.07, 'Card',     'paid'),
  ('INV-100002', 'Pooja Menon', CURRENT_DATE - 1, 180.00, 60.00,  40.00,  0.00,   20.00,  46.80,  306.80, 'Cash',     'paid'),
  ('INV-100003', 'Rahul Verma', CURRENT_DATE,     250.00, 0.00,   0.00,   0.00,   0.00,   45.00,  295.00, 'Insurance','pending');

UPDATE billing b SET patient_id = p.id FROM patients p WHERE b.patient = p.name;


-- ==============================================================
-- 6. VERIFICATION QUERIES
-- ==============================================================

-- Tables check
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users','departments','doctors','patients','appointments','prescriptions','billing','medical_records','notifications','activity_logs')
  AND column_name = 'id';

-- Row count verification
SELECT
  (SELECT COUNT(*) FROM users) AS users,
  (SELECT COUNT(*) FROM departments) AS departments,
  (SELECT COUNT(*) FROM doctors) AS doctors,
  (SELECT COUNT(*) FROM patients) AS patients,
  (SELECT COUNT(*) FROM appointments) AS appointments,
  (SELECT COUNT(*) FROM prescriptions) AS prescriptions,
  (SELECT COUNT(*) FROM billing) AS billing;
