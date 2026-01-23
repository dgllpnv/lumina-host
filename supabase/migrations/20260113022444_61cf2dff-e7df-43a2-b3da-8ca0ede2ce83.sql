-- Update handle_new_user to also create a staff role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, nome)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'nome', new.email)
  );
  
  -- Insert default staff role (can be upgraded by admin later)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'staff'::app_role);
  
  RETURN new;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();