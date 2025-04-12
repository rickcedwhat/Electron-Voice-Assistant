alter table "public"."user" add column "auth_id" uuid;

alter table "public"."user" alter column "id" set default gen_random_uuid();

alter table "public"."student" add constraint "student_id_fkey" FOREIGN KEY (id) REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."student" validate constraint "student_id_fkey";

alter table "public"."user" add constraint "user_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user" validate constraint "user_auth_id_fkey";


