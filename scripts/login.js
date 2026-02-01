import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("❌ Usage: npm run auth:login <email> <password>");
  console.error("   Example: npm run auth:login user@example.com mypassword");
  process.exit(1);
}

console.log("🔐 Logging in to Supabase...\n");

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  console.error("❌ Login failed:", error.message);
  process.exit(1);
}

console.log("✅ Login successful!\n");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("\n📋 Your Bearer Token:\n");
console.log(data.session.access_token);
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("\n📅 Token expires at:", new Date(data.session.expires_at * 1000).toLocaleString());
console.log("👤 User ID:", data.user.id);
console.log("📧 Email:", data.user.email);
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log("🚀 Example usage:\n");
console.log(
  `curl -X POST http://localhost:3000/api/ai/generate \\
  -H "Authorization: Bearer ${data.session.access_token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "The Spanish verb estar is used to describe temporary states and locations. For example, ¿Cómo estás? means How are you?. Unlike ser, which describes permanent characteristics, estar focuses on conditions that can change.",
    "language": "en"
  }'`
);
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
