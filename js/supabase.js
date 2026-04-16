import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://bqtgjzlxaultqpdldbiu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdGdqemx4YXVsdHFwZGxkYml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNTIyMTcsImV4cCI6MjA5MDcyODIxN30.7qOwBzFUBbjjfcmzzX65sytTlPdDoNXciaUHT0C__po";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);