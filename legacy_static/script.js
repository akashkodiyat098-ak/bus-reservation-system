// ============================================================
//  script.js  –  Global auth logic for BusReservationSystem
//  Runs on every page. Handles:
//    • Rendering the correct nav links based on login state
//    • Login form submission
//    • Signup form submission
//    • Logout
//    • Redirecting logged-in users away from auth pages
// ============================================================

// ---- Helpers ------------------------------------------------

/**
 * Shows a styled alert message inside #msg-box.
 * @param {string} message   - Text to display.
 * @param {'error'|'success'|'info'} type - Alert style.
 */
function showMsg(message, type = "error") {
  const box = document.getElementById("msg-box");
  if (!box) return;
  const icons = { error: "❌", success: "✅", info: "ℹ️" };
  box.innerHTML = `
    <div class="alert alert-${type}">
      ${icons[type] || ""} ${message}
    </div>`;
}

/** Sets a button to a loading state (shows spinner) */
function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Please wait…`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || "Submit";
  }
}

// ---- Navbar renderer ----------------------------------------

/**
 * Builds nav links based on whether a user is logged in.
 * Called once on every page after checking the session.
 * @param {object|null} user  - Supabase user object or null.
 */
function renderNav(user) {
  const ul = document.getElementById("nav-links");
  if (!ul) return;

  // Determine current page to set active class
  const page = location.pathname.split("/").pop() || "index.html";

  if (user) {
    // ---------- Logged-in nav ----------
    ul.innerHTML = `
      <li><a href="index.html"       ${page === "index.html"       ? 'class="active"' : ""}>Home</a></li>
      <li><a href="buses.html"       ${page === "buses.html"       ? 'class="active"' : ""}>Search Buses</a></li>
      <li><a href="my-bookings.html" ${page === "my-bookings.html" ? 'class="active"' : ""}>My Bookings</a></li>
      <li><span id="nav-user-name">👤 ${user.email}</span></li>
      <li><button class="btn btn-outline btn-sm" id="logout-btn" style="color:#fff;border-color:#fff;">Logout</button></li>
    `;
    document.getElementById("logout-btn").addEventListener("click", handleLogout);
  } else {
    // ---------- Guest nav ----------
    ul.innerHTML = `
      <li><a href="index.html" ${page === "index.html" ? 'class="active"' : ""}>Home</a></li>
      <li><a href="buses.html" ${page === "buses.html" ? 'class="active"' : ""}>Search Buses</a></li>
      <li><a href="login.html"  ${page === "login.html"  ? 'class="active"' : ""}>Login</a></li>
      <li><a href="signup.html" ${page === "signup.html" ? 'class="active"' : ""}>Sign Up</a></li>
    `;
  }
}

// ---- Logout -------------------------------------------------

async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert("Logout failed: " + error.message);
    return;
  }
  // Redirect to home after logout
  window.location.href = "index.html";
}

// ---- Login form ---------------------------------------------

function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;  // not on login page

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const btn      = document.getElementById("login-btn");

    // Basic client-side validation
    if (!email || !password) {
      showMsg("Please fill in all fields.");
      return;
    }

    setLoading(btn, true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(btn, false);

    if (error) {
      // Show a user-friendly message instead of raw Supabase error
      if (error.message.toLowerCase().includes("invalid")) {
        showMsg("Incorrect email or password. Please try again.");
      } else {
        showMsg(error.message);
      }
      return;
    }

    // Success – redirect to home
    showMsg("Login successful! Redirecting…", "success");
    setTimeout(() => { window.location.href = "index.html"; }, 1000);
  });
}

// ---- Signup form --------------------------------------------

function initSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;  // not on signup page

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName   = document.getElementById("full-name").value.trim();
    const email      = document.getElementById("email").value.trim();
    const password   = document.getElementById("password").value;
    const confirmPwd = document.getElementById("confirm-password").value;
    const btn        = document.getElementById("signup-btn");

    // Client-side validation
    if (!fullName || !email || !password || !confirmPwd) {
      showMsg("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      showMsg("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPwd) {
      showMsg("Passwords do not match.");
      return;
    }

    setLoading(btn, true);

    // 1. Create the auth user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Pass full_name so we can store it in the profiles table
        data: { full_name: fullName }
      }
    });

    setLoading(btn, false);

    if (error) {
      showMsg(error.message);
      return;
    }

    // 2. Insert a row into the public.profiles table.
    //    We do this here because a database trigger is not set up yet.
    //    If Supabase email confirmation is ON, data.user may be null until
    //    the user confirms their email – we guard against that with ?. below.
    if (data.user) {
      await supabase.from("profiles").upsert({
        id:        data.user.id,
        full_name: fullName,
        email:     email,
      });
    }

    // Show appropriate message depending on email confirmation setting
    if (data.session) {
      // Email confirmation is OFF – user is immediately logged in
      showMsg("Account created! Redirecting…", "success");
      setTimeout(() => { window.location.href = "index.html"; }, 1200);
    } else {
      // Email confirmation is ON – ask user to check inbox
      showMsg(
        "Account created! Please check your email to confirm your account, then log in.",
        "success"
      );
    }
  });
}

// ---- Page initialisation ------------------------------------

(async function init() {
  // Get current session (works offline too – reads from storage)
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Render navigation for every page
  renderNav(user);

  // If already logged in, redirect away from auth pages
  const authPages = ["login.html", "signup.html"];
  const currentPage = location.pathname.split("/").pop();
  if (user && authPages.includes(currentPage)) {
    window.location.href = "index.html";
    return;
  }

  // Initialise page-specific forms
  initLoginForm();
  initSignupForm();

  // Listen for future auth state changes (e.g., token refresh, sign-out in another tab)
  supabase.auth.onAuthStateChange((_event, session) => {
    renderNav(session?.user ?? null);
  });
})();
