require("dotenv").config({ path: ".env.local" });
console.log("Loading Clerk...");
const clerk = require("@clerk/nextjs/server");
console.log("Clerk keys:", Object.keys(clerk).length);
