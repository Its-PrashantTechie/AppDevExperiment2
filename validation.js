// ===== Registration form validation (rule-table version) =====

const form = document.getElementById("registerForm");
const successBox = document.getElementById("successBox");
const $ = (id) => document.getElementById(id);

// Format patterns
const PATTERN = {
  name: /^[A-Za-z][A-Za-z .]{2,49}$/,
  email: /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/,
  phone: /^[6-9]\d{9}$/,       // Indian mobile numbers
  pin: /^[1-9]\d{5}$/,         // Indian PIN codes
  city: /^[A-Za-z ]{2,}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
};

// Whole years between a birth date string and today
function ageFrom(dateStr) {
  const born = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  return beforeBirthday ? age - 1 : age;
}

// Each rule gets the cleaned value and returns an error message ("" means valid)
const rules = {
  fullName: (v) =>
    !v ? "Full name is required"
    : !PATTERN.name.test(v) ? "Use 3-50 letters, spaces or dots only" : "",

  dob: (v) => {
    if (!v) return "Date of birth is required";
    if (new Date(v) > new Date()) return "Date of birth cannot be in the future";
    return ageFrom(v) < 16 ? "You must be at least 16 years old" : "";
  },

  email: (v) =>
    !v ? "Email ID is required"
    : !PATTERN.email.test(v) ? "Enter a valid email (e.g. name@example.com)" : "",

  phone: (v) =>
    !v ? "Phone number is required"
    : !PATTERN.phone.test(v) ? "Enter a 10-digit mobile number starting with 6-9" : "",

  address: (v) =>
    !v ? "Address is required"
    : v.length < 10 ? "Address must be at least 10 characters" : "",

  city: (v) =>
    !v ? "City is required"
    : !PATTERN.city.test(v) ? "City should contain letters only" : "",

  pincode: (v) =>
    !v ? "PIN code is required"
    : !PATTERN.pin.test(v) ? "PIN code must be 6 digits and not start with 0" : "",

  password: (v) =>
    !v ? "Password is required"
    : !PATTERN.strongPassword.test(v) ? "Min 8 chars with uppercase, lowercase, number and symbol" : "",

  confirmPassword: (v) =>
    !v ? "Please confirm your password"
    : v !== $("password").value ? "Passwords do not match" : ""
};

// Passwords keep their spaces; everything else is trimmed
const isPasswordField = (id) => id === "password" || id === "confirmPassword";

function paint(input, message) {
  $(input.id + "Error").textContent = message;
  input.classList.toggle("invalid", message !== "");
  input.classList.toggle("valid", message === "");
}

// Run the rule for one field and update the UI. Returns true when valid.
function check(id) {
  const input = $(id);
  const value = isPasswordField(id) ? input.value : input.value.trim();
  const message = rules[id](value);
  paint(input, message);
  return message === "";
}

function checkGender() {
  const picked = document.querySelector('input[name="gender"]:checked');
  $("genderError").textContent = picked ? "" : "Please select your gender";
  return Boolean(picked);
}

function checkTerms() {
  const accepted = $("terms").checked;
  $("termsError").textContent = accepted ? "" : "You must accept the terms to continue";
  return accepted;
}

// ===== Extra feature 1: password strength meter =====
function updateStrength() {
  const v = $("password").value;
  const score = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(v)).length + (v.length >= 8 ? 1 : 0);
  const levels = [
    { w: "0%", c: "transparent", t: "Strength" },
    { w: "20%", c: "#c62828", t: "Very weak" },
    { w: "40%", c: "#ef6c00", t: "Weak" },
    { w: "60%", c: "#f9a825", t: "Fair" },
    { w: "80%", c: "#7cb342", t: "Good" },
    { w: "100%", c: "#2e7d4f", t: "Strong" }
  ];
  const level = v ? levels[score] : levels[0];
  $("strengthBar").style.width = level.w;
  $("strengthBar").style.background = level.c;
  $("strengthLabel").textContent = level.t;
}

// ===== Extra feature 2: address character counter =====
function updateCounter() {
  const len = $("address").value.trim().length;
  const counter = $("addressCount");
  counter.textContent = len + " / 10 min";
  counter.classList.toggle("ok", len >= 10);
}

// ===== Extra feature 3: show / hide password buttons =====
document.querySelectorAll(".pw-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = $(btn.dataset.target);
    const hidden = target.type === "password";
    target.type = hidden ? "text" : "password";
    btn.textContent = hidden ? "Hide" : "Show";
  });
});

// Block future dates in the date picker
$("dob").max = new Date().toISOString().split("T")[0];

// Validate on blur; once a field has been marked, re-validate while typing
Object.keys(rules).forEach((id) => {
  const input = $(id);
  input.addEventListener("blur", () => check(id));
  input.addEventListener("input", () => {
    if (input.classList.contains("invalid") || input.classList.contains("valid")) check(id);
  });
});

// Keep confirm-password in sync when the main password changes
$("password").addEventListener("input", () => {
  updateStrength();
  if ($("confirmPassword").value) check("confirmPassword");
});
$("address").addEventListener("input", updateCounter);

// Digits only for phone and PIN code
["phone", "pincode"].forEach((id) => {
  $(id).addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });
});

document.querySelectorAll('input[name="gender"]').forEach((r) => r.addEventListener("change", checkGender));
$("terms").addEventListener("change", checkTerms);

// ===== Submit =====
form.addEventListener("submit", (event) => {
  event.preventDefault();

  // Run every check (no early exit, so all errors show at once)
  const results = [...Object.keys(rules).map(check), checkGender(), checkTerms()];

  if (results.includes(false)) {
    successBox.classList.add("hidden");
    const firstBad = form.querySelector(".invalid");
    if (firstBad) firstBad.focus();
    return;
  }

  // Build the summary with DOM nodes so user text is never treated as HTML
  const data = new FormData(form);
  const summary = [
    ["Full name", data.get("fullName").trim()],
    ["Date of birth", data.get("dob")],
    ["Email ID", data.get("email").trim()],
    ["Phone", data.get("phone")],
    ["Gender", data.get("gender")],
    ["City", data.get("city").trim()],
    ["PIN code", data.get("pincode")]
  ];

  successBox.replaceChildren();
  const title = document.createElement("h3");
  title.textContent = "Registration successful";
  const list = document.createElement("dl");
  summary.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    list.append(dt, dd);
  });
  successBox.append(title, list);
  successBox.classList.remove("hidden");
});

// ===== Reset =====
form.addEventListener("reset", () => {
  form.querySelectorAll("input, textarea").forEach((el) => el.classList.remove("valid", "invalid"));
  form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
  successBox.classList.add("hidden");
  document.querySelectorAll(".pw-toggle").forEach((btn) => {
    $(btn.dataset.target).type = "password";
    btn.textContent = "Show";
  });
  // Reset runs before the fields clear, so update the helpers afterwards
  setTimeout(() => {
    updateStrength();
    updateCounter();
  }, 0);
});