/* ============================================================
   app.js - simple frontend JavaScript for VWA-2
   ============================================================
   One shared file is used by all pages. Each page has a
   data-page value on the body so this file knows what to run.
   ============================================================ */

const API_URL = window.location.origin;

const page = document.body.dataset.page;
const messageBox = document.getElementById("messageBox");
let adminCandidates = [];

function showMessage(message, type = "info") {
  if (!messageBox) return;
  messageBox.textContent = message;
  messageBox.className = "notice " + type;
}

function getUserId() {
  return localStorage.getItem("userId");
}

function friendlyError(data) {
  return data.error || data.message || "Something went wrong";
}

async function apiGet(path) {
  const response = await fetch(API_URL + path);
  return response.json();
}

async function apiSend(path, method, body) {
  const response = await fetch(API_URL + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

function logout() {
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  window.location.href = "login.html";
}

function setupLogout() {
  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) logoutButton.addEventListener("click", logout);
}

function requireLogin() {
  if (!getUserId()) {
    window.location.href = "login.html";
  }
}

function setupRegisterPage() {
  const form = document.getElementById("registerForm");
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const formData = new FormData(form);
    const data = await apiSend("/api/register", "POST", {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!data.success) {
      showMessage(friendlyError(data), "error");
      return;
    }

    showMessage("Registration successful. Redirecting to login...", "success");
    setTimeout(function () {
      window.location.href = "login.html";
    }, 800);
  });
}

function setupLoginPage() {
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const formData = new FormData(form);
    const data = await apiSend("/api/login", "POST", {
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!data.success) {
      showMessage(friendlyError(data), "error");
      return;
    }

    localStorage.setItem("userId", data.data.userId);
    localStorage.setItem("userName", data.data.name);
    window.location.href = "index.html";
  });
}

async function loadVotingPage() {
  requireLogin();
  setupLogout();

  const data = await apiGet("/api/candidates");
  if (!data.success) {
    showMessage(friendlyError(data), "error");
    return;
  }

  const grid = document.getElementById("candidateGrid");
  grid.innerHTML = "";

  data.data.candidates.forEach(function (candidate) {
    const card = document.createElement("article");
    card.className = "candidate-card";
    card.innerHTML = `
      <img src="${candidate.image || "/assets/images/vijay.jpg"}" alt="${candidate.name}">
      <div class="candidate-body">
        <h3>${candidate.name}</h3>
        <p class="party">${candidate.party}</p>
        <p>${candidate.description || ""}</p>
        <button data-id="${candidate.id}" data-name="${candidate.name}" data-party="${candidate.party}">
          Vote
        </button>
      </div>
    `;
    grid.appendChild(card);
  });

  grid.addEventListener("click", async function (event) {
    if (event.target.tagName !== "BUTTON") return;

    const button = event.target;
    const candidateName = button.dataset.name;
    const candidateParty = button.dataset.party;
    const confirmed = confirm(
      "Are you sure you want to vote for " + candidateName + " (" + candidateParty + ")?"
    );

    if (!confirmed) return;

    const voteData = await apiSend("/api/vote", "POST", {
      userId: getUserId(),
      candidateId: button.dataset.id,
    });

    if (!voteData.success) {
      showMessage(friendlyError(voteData), "error");
      return;
    }

    showMessage("Vote submitted successfully", "success");
  });
}

async function loadResultsPage() {
  const data = await apiGet("/api/results");
  if (!data.success) return;

  const status = document.getElementById("electionStatus");
  status.textContent = "Election status: " + data.data.electionStatus;

  const resultsList = document.getElementById("resultsList");
  const totalVotes = data.data.results.reduce(function (sum, item) {
    return sum + item.votes;
  }, 0);

  resultsList.innerHTML = data.data.results
    .map(function (candidate) {
      const percent = totalVotes ? Math.round((candidate.votes / totalVotes) * 100) : 0;
      return `
        <article class="result-card">
          <img src="${candidate.image || "/assets/images/vijay.jpg"}" alt="${candidate.name}">
          <div>
            <h3>${candidate.name}</h3>
            <p>${candidate.party}</p>
            <strong>Votes: ${candidate.votes}</strong>
            <div class="bar"><span style="width:${percent}%"></span></div>
          </div>
        </article>
      `;
    })
    .join("");
}

function showAdminDashboard() {
  document.getElementById("adminLoginPanel").classList.add("hidden");
  document.getElementById("adminDashboard").classList.remove("hidden");
}

async function loadAdminData() {
  const dashboard = await apiGet("/api/admin/dashboard");
  if (dashboard.success) {
    const cards = document.getElementById("dashboardCards");
    const lead = dashboard.data.leadingCandidate;
    cards.innerHTML = `
      <div><strong>${dashboard.data.totalVoters}</strong><span>Total voters</span></div>
      <div><strong>${dashboard.data.votesSubmitted}</strong><span>Total votes submitted</span></div>
      <div><strong>${dashboard.data.remainingUsers}</strong><span>Remaining users who didn't vote</span></div>
      <div><strong>${lead ? lead.name : "No leader"}</strong><span>Leading candidate</span></div>
      <div><strong>${dashboard.data.electionStatus}</strong><span>Election status</span></div>
      <div><strong>${dashboard.data.totalCandidates}</strong><span>Total candidates</span></div>
    `;

    const electionOpen = dashboard.data.electionStatus === "open";
    document.getElementById("candidateForm").querySelectorAll("input, textarea, button").forEach(function (field) {
      field.disabled = electionOpen;
    });
    if (electionOpen) {
      showMessage("Cannot modify candidates while election is running", "error");
    } else {
      showMessage("", "info");
    }
  }

  const candidates = await apiGet("/api/candidates");
  if (!candidates.success) return;

  adminCandidates = candidates.data.candidates;

  const list = document.getElementById("adminCandidateList");
  list.innerHTML = adminCandidates
    .map(function (candidate) {
      return `
        <article class="admin-candidate">
          <img src="${candidate.image || "/assets/images/vijay.jpg"}" alt="${candidate.name}">
          <div>
            <h3>${candidate.name}</h3>
            <p>${candidate.party}</p>
            <p>${candidate.description || ""}</p>
          </div>
          <button class="edit-candidate" data-id="${candidate.id}">Edit</button>
          <button class="danger delete-candidate" data-id="${candidate.id}">Delete</button>
        </article>
      `;
    })
    .join("");
}

function editCandidate(candidate) {
  const form = document.getElementById("candidateForm");
  form.elements.id.value = candidate.id;
  form.name.value = candidate.name;
  form.party.value = candidate.party;
  form.description.value = candidate.description || "";
  document.getElementById("candidateFormTitle").textContent = "Edit Candidate";
}

async function deleteCandidate(id) {
  if (!confirm("Delete this candidate?")) return;
  const data = await fetch(API_URL + "/api/admin/candidate/delete/" + id, {
    method: "DELETE",
  }).then(function (response) {
    return response.json();
  });

  if (!data.success) {
    showMessage(friendlyError(data), "error");
    return;
  }
  await loadAdminData();
}

async function saveCandidate(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const id = formData.get("id");
  const path = id
    ? "/api/admin/candidate/update/" + id
    : "/api/admin/candidate/add";
  const method = id ? "PUT" : "POST";

  const data = await fetch(API_URL + path, {
    method,
    body: formData,
  }).then(function (response) {
    return response.json();
  });

  if (!data.success) {
    showMessage(friendlyError(data), "error");
    return;
  }

  form.reset();
  form.elements.id.value = "";
  document.getElementById("candidateFormTitle").textContent = "Add Candidate";
  await loadAdminData();
}

function setupAdminPage() {
  const adminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
  if (adminLoggedIn) {
    showAdminDashboard();
    loadAdminData();
  }

  document.getElementById("adminLoginForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = await apiSend("/api/admin/login", "POST", {
      username: formData.get("username"),
      password: formData.get("password"),
    });

    if (!data.success) {
      showMessage(friendlyError(data), "error");
      return;
    }

    localStorage.setItem("adminLoggedIn", "true");
    showAdminDashboard();
    loadAdminData();
  });

  document.getElementById("adminLogoutButton").addEventListener("click", function () {
    localStorage.removeItem("adminLoggedIn");
    window.location.reload();
  });

  document.getElementById("candidateForm").addEventListener("submit", saveCandidate);
  document.getElementById("adminCandidateList").addEventListener("click", function (event) {
    const id = Number(event.target.dataset.id);
    if (!id) return;

    if (event.target.classList.contains("edit-candidate")) {
      const candidate = adminCandidates.find(function (item) {
        return item.id === id;
      });
      if (candidate) editCandidate(candidate);
    }

    if (event.target.classList.contains("delete-candidate")) {
      deleteCandidate(id);
    }
  });
  document.getElementById("cancelEditButton").addEventListener("click", function () {
    document.getElementById("candidateForm").reset();
    document.getElementById("candidateForm").elements.id.value = "";
    document.getElementById("candidateFormTitle").textContent = "Add Candidate";
  });

  document.getElementById("startElectionButton").addEventListener("click", async function () {
    await apiSend("/api/admin/election/start", "POST", {});
    await loadAdminData();
  });

  document.getElementById("stopElectionButton").addEventListener("click", async function () {
    await apiSend("/api/admin/election/stop", "POST", {});
    await loadAdminData();
  });

  document.getElementById("resetElectionButton").addEventListener("click", async function () {
    if (!confirm("Reset all votes and close the election?")) return;
    await apiSend("/api/admin/election/reset", "POST", {});
    await loadAdminData();
  });
}

if (page === "register") setupRegisterPage();
if (page === "login") setupLoginPage();
if (page === "vote") loadVotingPage();
if (page === "results") loadResultsPage();
if (page === "admin") setupAdminPage();
