/* ============================================================
   script.js — Frontend JavaScript
   ============================================================
   This file handles ALL the interactive behavior:
   1. Renders candidate cards
   2. Sends votes to the backend API
   3. Fetches and displays live results
   4. Manages the countdown timer
   5. Shows toast notifications
   
   It uses Vanilla JavaScript — no frameworks or libraries.
   ============================================================ */

// ============================================================
// CANDIDATE DATA
// ============================================================
// This array holds the information for each candidate.
// Each object has: id, name, description, and image path.
var candidates = [
  {
    id: "Candidate A",
    name: "Candidate A",
    description:
      "A visionary leader focused on innovation, technology, and building a sustainable future for all communities.",
    image: "images/candidate-a.jpg",
    barClass: "bar-a",
  },
  {
    id: "Candidate B",
    name: "Candidate B",
    description:
      "An experienced administrator committed to economic growth, job creation, and strengthening public infrastructure.",
    image: "images/candidate-b.jpg",
    barClass: "bar-b",
  },
  {
    id: "Candidate C",
    name: "Candidate C",
    description:
      "A passionate advocate for education, healthcare reform, and equal opportunities for every citizen.",
    image: "images/candidate-c.jpg",
    barClass: "bar-c",
  },
];

// ============================================================
// GLOBAL VARIABLES
// ============================================================
// The base URL for our API. Empty string means "same server".
// This works because the frontend is served by the same Express server.
var API_BASE = "";

// Store the current voting status (waiting, open, closed)
var currentVotingStatus = "waiting";

// Timer interval reference (so we can stop it later)
var timerInterval = null;

// Voting timing info from the server
var votingOpensAt = 0;
var votingClosesAt = 0;

// ============================================================
// INITIALIZATION
// ============================================================
// This function runs when the page first loads.
// It sets everything up.
function init() {
  // Render the candidate cards into the HTML
  renderCandidates();

  // Fetch initial results and voting status from the server
  fetchResults();

  // Set up auto-refresh: fetch results every 3 seconds
  setInterval(fetchResults, 3000);
}

// Run init() when the page is fully loaded
window.addEventListener("DOMContentLoaded", init);

// ============================================================
// RENDER CANDIDATES
// ============================================================
// This function creates the HTML for each candidate card
// and inserts it into the page.
function renderCandidates() {
  // Get the container element where cards will go
  var grid = document.getElementById("candidates-grid");

  // Build HTML string for all candidate cards
  var html = "";

  // Loop through each candidate and create a card
  for (var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];

    html += '<div class="candidate-card">';
    html += '  <div class="candidate-image-wrapper">';
    html +=
      '    <img class="candidate-image" src="' +
      candidate.image +
      '" alt="Photo of ' +
      candidate.name +
      '" />';
    html += "  </div>";
    html += '  <div class="candidate-info">';
    html += '    <h3 class="candidate-name">' + candidate.name + "</h3>";
    html +=
      '    <p class="candidate-description">' +
      candidate.description +
      "</p>";
    html +=
      '    <button class="btn btn-vote" id="vote-btn-' +
      i +
      '" onclick="castVote(\'' +
      candidate.id +
      "')\">";
    html += "      🗳️ Vote for " + candidate.name;
    html += "    </button>";
    html += "  </div>";
    html += "</div>";
  }

  // Insert the HTML into the grid container
  grid.innerHTML = html;
}

// ============================================================
// CAST VOTE
// ============================================================
// This function is called when a user clicks a "Vote" button.
// It sends a POST request to our backend API.
function castVote(candidateId) {
  // Check if voting is currently open
  if (currentVotingStatus !== "open") {
    if (currentVotingStatus === "waiting") {
      showToast("⏳ Voting hasn't started yet. Please wait!", "error");
    } else {
      showToast("🚫 Voting has ended.", "error");
    }
    return;
  }

  // Send the vote to the backend using fetch API
  // fetch() makes an HTTP request to our server
  fetch(API_BASE + "/api/vote", {
    method: "POST", // POST = sending data to the server
    headers: {
      "Content-Type": "application/json", // Tell server we're sending JSON
    },
    body: JSON.stringify({ candidate: candidateId }), // The data to send
  })
    .then(function (response) {
      // Parse the JSON response from the server
      return response.json();
    })
    .then(function (data) {
      // Check if the vote was successful
      if (data.success) {
        // Show success notification
        showToast("✅ " + data.message, "success");
        // Immediately refresh results to show the new vote
        fetchResults();
      } else {
        // Show error notification
        showToast("❌ " + data.message, "error");
      }
    })
    .catch(function (error) {
      // Handle network errors (server down, no internet, etc.)
      console.error("Error casting vote:", error);
      showToast("❌ Network error. Please try again.", "error");
    });
}

// ============================================================
// FETCH RESULTS
// ============================================================
// This function gets the latest vote counts from the server
// and updates the UI.
function fetchResults() {
  fetch(API_BASE + "/api/results")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.success) {
        // Update the results display
        updateResultsUI(data.results);

        // Update voting status and timer
        if (data.voting) {
          votingOpensAt = data.voting.opensAt;
          votingClosesAt = data.voting.closesAt;
          updateVotingStatus(data.voting);
        }
      }
    })
    .catch(function (error) {
      // Silently handle errors (server might be starting up)
      console.error("Error fetching results:", error);
    });
}

// ============================================================
// UPDATE RESULTS UI
// ============================================================
// This function takes the results array from the server
// and renders progress bars for each candidate.
function updateResultsUI(results) {
  var container = document.getElementById("results-container");

  // Calculate total votes across all candidates
  var totalVotes = 0;
  for (var i = 0; i < results.length; i++) {
    totalVotes += results[i].votes;
  }

  // Update the total votes counter
  document.getElementById("total-count").textContent = totalVotes;

  // Build HTML for each candidate's result bar
  var html = "";

  // We need to show ALL candidates, even those with 0 votes
  for (var j = 0; j < candidates.length; j++) {
    var candidate = candidates[j];

    // Find this candidate's votes in the results
    var votes = 0;
    for (var k = 0; k < results.length; k++) {
      if (results[k].candidate === candidate.id) {
        votes = results[k].votes;
        break;
      }
    }

    // Calculate percentage (avoid division by zero)
    var percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;

    // Build the result bar HTML
    html += '<div class="result-item">';
    html += '  <div class="result-header">';
    html += '    <span class="result-name">' + candidate.name + "</span>";
    html +=
      '    <span class="result-count">' +
      votes +
      (votes === 1 ? " vote" : " votes") +
      "</span>";
    html += "  </div>";
    html += '  <div class="result-bar-track">';
    html +=
      '    <div class="result-bar-fill ' +
      candidate.barClass +
      '" style="width: ' +
      percentage +
      '%"></div>';
    html += "  </div>";
    html += '  <div class="result-percentage">' + percentage + "%</div>";
    html += "</div>";
  }

  container.innerHTML = html;

  // Show winner if voting is closed
  if (currentVotingStatus === "closed" && totalVotes > 0) {
    showWinner(results);
  }
}

// ============================================================
// SHOW WINNER
// ============================================================
// Displays the winning candidate after voting closes.
function showWinner(results) {
  // Find the candidate with the most votes
  var winner = null;
  var maxVotes = 0;

  for (var i = 0; i < results.length; i++) {
    if (results[i].votes > maxVotes) {
      maxVotes = results[i].votes;
      winner = results[i];
    }
  }

  // If we found a winner, display the announcement
  if (winner) {
    var announcement = document.getElementById("winner-announcement");
    document.getElementById("winner-name").textContent = winner.candidate;
    document.getElementById("winner-votes").textContent =
      "with " + winner.votes + " votes";
    announcement.style.display = "block";
  }
}

// ============================================================
// UPDATE VOTING STATUS
// ============================================================
// Updates the timer, status badge, and vote button states
// based on the current voting status from the server.
function updateVotingStatus(voting) {
  var statusBadge = document.getElementById("status-badge");
  var statusText = document.getElementById("status-text");
  var timerLabel = document.getElementById("timer-label");

  // Store the current status globally
  currentVotingStatus = voting.status;

  // Remove all status classes first
  statusBadge.classList.remove("status-open", "status-waiting", "status-closed");

  if (voting.status === "waiting") {
    // Voting hasn't started yet
    statusBadge.classList.add("status-waiting");
    statusText.textContent = "Voting opens soon";
    timerLabel.textContent = "Voting opens in";
    disableVoteButtons(true);
    startTimer(voting.opensAt);
  } else if (voting.status === "open") {
    // Voting is currently open
    statusBadge.classList.add("status-open");
    statusText.textContent = "Voting is LIVE";
    timerLabel.textContent = "Voting closes in";
    disableVoteButtons(false);
    startTimer(voting.closesAt);
  } else {
    // Voting has closed
    statusBadge.classList.add("status-closed");
    statusText.textContent = "Voting has ended";
    timerLabel.textContent = "Voting has ended";
    disableVoteButtons(true);
    // Set timer to 00:00:00
    document.getElementById("timer-hours").textContent = "00";
    document.getElementById("timer-minutes").textContent = "00";
    document.getElementById("timer-seconds").textContent = "00";
    // Stop the timer
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
}

// ============================================================
// DISABLE/ENABLE VOTE BUTTONS
// ============================================================
// Toggles the disabled state of all vote buttons.
function disableVoteButtons(disabled) {
  for (var i = 0; i < candidates.length; i++) {
    var btn = document.getElementById("vote-btn-" + i);
    if (btn) {
      btn.disabled = disabled;
    }
  }
}

// ============================================================
// COUNTDOWN TIMER
// ============================================================
// Starts a countdown timer that updates every second.
// targetTime = the timestamp (in milliseconds) to count down to.
function startTimer(targetTime) {
  // Clear any existing timer to prevent duplicates
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // Update the timer display immediately
  updateTimerDisplay(targetTime);

  // Then update every second (1000 milliseconds)
  timerInterval = setInterval(function () {
    updateTimerDisplay(targetTime);
  }, 1000);
}

// Updates the hours, minutes, seconds display
function updateTimerDisplay(targetTime) {
  // Calculate how many milliseconds remain
  var now = Date.now();
  var remaining = targetTime - now;

  // If countdown has finished
  if (remaining <= 0) {
    document.getElementById("timer-hours").textContent = "00";
    document.getElementById("timer-minutes").textContent = "00";
    document.getElementById("timer-seconds").textContent = "00";

    // Stop the interval
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Refresh results to get updated status
    fetchResults();
    return;
  }

  // Convert milliseconds to hours, minutes, seconds
  var totalSeconds = Math.floor(remaining / 1000);
  var hours = Math.floor(totalSeconds / 3600);
  var minutes = Math.floor((totalSeconds % 3600) / 60);
  var seconds = totalSeconds % 60;

  // Update the display (pad with leading zeros)
  document.getElementById("timer-hours").textContent = padZero(hours);
  document.getElementById("timer-minutes").textContent = padZero(minutes);
  document.getElementById("timer-seconds").textContent = padZero(seconds);
}

// Helper: Add a leading zero to single-digit numbers
// Example: padZero(5) returns "05", padZero(12) returns "12"
function padZero(num) {
  return num < 10 ? "0" + num : "" + num;
}

// ============================================================
// RESET VOTES
// ============================================================
// Called when the admin clicks "Reset All Votes".
// Sends a POST request to clear all votes from the database.
function resetVotes() {
  // Ask for confirmation before deleting all votes
  var confirmed = confirm(
    "Are you sure you want to reset ALL votes? This cannot be undone."
  );

  if (!confirmed) {
    return; // User cancelled — do nothing
  }

  fetch(API_BASE + "/api/reset", {
    method: "POST",
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      if (data.success) {
        showToast("🔄 " + data.message, "success");
        // Hide the winner announcement
        document.getElementById("winner-announcement").style.display = "none";
        // Refresh results
        fetchResults();
      } else {
        showToast("❌ " + data.message, "error");
      }
    })
    .catch(function (error) {
      console.error("Error resetting votes:", error);
      showToast("❌ Network error. Please try again.", "error");
    });
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
// Shows a brief popup message at the bottom of the screen.
// type can be "success" or "error"
function showToast(message, type) {
  var toast = document.getElementById("toast");
  var toastIcon = document.getElementById("toast-icon");
  var toastMessage = document.getElementById("toast-message");

  // Set the message text
  toastMessage.textContent = message;

  // Set the icon and color based on type
  toast.classList.remove("toast-success", "toast-error");
  if (type === "success") {
    toast.classList.add("toast-success");
    toastIcon.textContent = "✅";
  } else {
    toast.classList.add("toast-error");
    toastIcon.textContent = "❌";
  }

  // Show the toast (triggers CSS animation)
  toast.classList.add("toast-show");

  // Hide it after 3 seconds
  setTimeout(function () {
    toast.classList.remove("toast-show");
  }, 3000);
}
