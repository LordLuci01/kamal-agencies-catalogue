# Kamal Agencies Admin Setup

1. Create the admin account in Supabase Authentication.
2. Sign in once through `/admin/login` while the `admin_users` table is still empty. The first authenticated user is allowed to bootstrap the admin panel.
3. In the Supabase SQL editor, register the intended admin account:

```sql
INSERT INTO public.admin_users (user_id)
SELECT id
FROM auth.users
WHERE email = 'YOUR-ADMIN-EMAIL'
ON CONFLICT DO NOTHING;
```

4. After at least one row exists in `admin_users`, all catalogue writes are restricted to those listed admin accounts.
5. Disable public sign-ups in Supabase Authentication if this is a private admin system.

The public catalogue remains readable without login.
