-- Create user_info table to store additional user information
CREATE TABLE IF NOT EXISTS public.user_info (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  cnic TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS (Row Level Security) policies
ALTER TABLE public.user_info ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own data
CREATE POLICY "Users can view own data" ON public.user_info
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to update their own data
CREATE POLICY "Users can update own data" ON public.user_info
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to insert their own data
CREATE POLICY "Users can insert own data" ON public.user_info
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_info (user_id, email, first_name, last_name, cnic, phone, date_of_birth)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'cnic', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::DATE, NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user record
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on user_info updates
CREATE TRIGGER update_user_info_updated_at
  BEFORE UPDATE ON public.user_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
