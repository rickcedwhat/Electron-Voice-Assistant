CREATE TYPE browser_id_enum AS ENUM (
  'pearson',
  'cybertext',
  'canvasFIU'
);

create table browser (
  id browser_id_enum primary key,
  browser_name text,
  login_url text
);

create table "user" (
  id uuid primary key,
  email text,
  name text,
  phone_number text
);

create table student (
  id uuid primary key,
  invoice_ninja_client_id text,
  user_id uuid references "user" (id)
);

create table third_party_credential (
  id uuid primary key,
  student_id uuid references student (id),
  enc_username text,
  enc_password text,
  browser_id browser_id_enum references browser (id),
  notes text
);
