const fs = require('fs');
const path = require('path');

const schema1 = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20260426170338_initial_schema.sql'), 'utf-8');
const schema2 = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20260426170834_rpc_functions.sql'), 'utf-8');

const bucketSchema = `
-- 5. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc_documents', 'kyc_documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ads_videos', 'ads_videos', true) ON CONFLICT (id) DO NOTHING;
`;

const rlsSchema = `
-- 6. BASIC STORAGE RLS POLICIES
-- Allow authenticated users to upload their own KYC docs
CREATE POLICY "Allow authenticated uploads KYC" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kyc_documents');
CREATE POLICY "Allow users to read their own KYC docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kyc_documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow everyone to read ad videos
CREATE POLICY "Allow public read Ads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'ads_videos');
-- Allow authenticated advertisers to upload
CREATE POLICY "Allow authenticated uploads Ads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ads_videos');
`;

const masterSchema = schema1 + '\n\n' + schema2 + '\n\n' + bucketSchema + '\n\n' + rlsSchema;

fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'master_schema.sql'), masterSchema);
console.log('Successfully created master_schema.sql');
