// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jdzxksxwkhsbtiwepgjx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkenhrc3h3a2hzYnRpd2VwZ2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzM0MTksImV4cCI6MjA2MzYwOTQxOX0.yeMPUiF-E7Az2iAZwsM2G0dDJrKn-vc8OPJeUiIVAlw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
