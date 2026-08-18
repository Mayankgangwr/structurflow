import { createClient } from "@supabase/supabase-js";
import { config } from "./env";

export const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});