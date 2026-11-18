const DATA_FILES = [
  { url: "./branch-data/mfl.json", list: "MFL" },
  { url: "./branch-data/mml.json", list: "MML" },
  { url: "./branch-data/south.json", list: "SOUTH" }
];
const LISTS = ["MFL", "MML", "SOUTH"];

let branches = [];
let activeList = "ALL";

const results = document.getElementById("results");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const input = document.getElementById("pincode");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function normalizedList(value) {
  const list = String(value ?? "").trim().toUpperCase();
  if (list === "MFL") return "MFL";
  if (list === "MML") return "MML";
  if (list === "SOUTH" || list === "SOUTHERN") return "SOUTH";
  return "";
}

function listName(value) {
  return ({
    ALL: "All branches",
    MFL: "MFL Branch",
    MML: "MML",
    SOUTH: "South"
  })[value] || value || "Uncategorised";
}

function validTerritoryCode(value) {
  const code = String(value ?? "").trim();
  return /^\d{4}$/.test(code) ? code : "";
}

function matchingBranches() {
  const query = input.value.trim();
  return branches.filter(branch => {
    const pin = String(branch.pincode ?? branch.pinCode ?? "").trim();
    return !query || pin.includes(query);
  });
}

function updateTabCounts(filteredBranches) {
  for (const list of LISTS) {
    const count = filteredBranches.filter(branch => normalizedList(branch.list) === list).length;
    document.getElementById(`count-${list}`).textContent = count;
  }
  countEl.textContent = input.value.trim()
    ? `${filteredBranches.length} matching ${filteredBranches.length === 1 ? "branch" : "branches"}`
    : `${filteredBranches.length} ${filteredBranches.length === 1 ? "branch" : "branches"} in directory`;
}

function render() {
  const filteredBranches = matchingBranches();
  updateTabCounts(filteredBranches);

  const visibleBranches = activeList === "ALL"
    ? filteredBranches
    : filteredBranches.filter(branch => normalizedList(branch.list) === activeList);

  if (!visibleBranches.length) {
    const query = input.value.trim();
    results.innerHTML = `<div class="empty">${
      query
        ? `No ${escapeHtml(listName(activeList))} branches found for PIN search "${escapeHtml(query)}".`
        : activeList === "ALL"
          ? "No branch records are available."
          : `${escapeHtml(listName(activeList))} branch data is not available yet.`
    }</div>`;
    return;
  }

  results.innerHTML = visibleBranches.map(branch => {
    const code = validTerritoryCode(branch.territoryCode);
    const pin = String(branch.pincode ?? branch.pinCode ?? "").trim();
    const branchName = String(branch.branchName ?? "").trim() || "Branch name not provided";
    const address = String(branch.branchAddress ?? branch.address ?? "").trim();
    return `
      <article class="branch-card">
        <div class="card-top">
          <h3>${escapeHtml(branchName)}</h3>
          <span class="list-tag">${escapeHtml(listName(normalizedList(branch.list)))}</span>
        </div>
        <p class="pin">PIN: ${escapeHtml(pin || "Not provided")}</p>
        <dl class="details">
          <div><dt>Territory code</dt><dd>${escapeHtml(code || "Not provided")}</dd></div>
          <div><dt>Branch address</dt><dd>${escapeHtml(address || "Not provided")}</dd></div>
        </dl>
        <button class="copy-btn" type="button" data-code="${escapeHtml(code)}" ${code ? "" : "disabled"}>Copy territory code</button>
      </article>`;
  }).join("");
}

input.addEventListener("input", () => {
  input.value = input.value.replace(/\D/g, "").slice(0, 6);
  statusEl.textContent = input.value
    ? `Showing matches as you type: ${input.value}`
    : "Showing all branches.";
  render();
});

document.getElementById("searchForm").addEventListener("submit", event => {
  event.preventDefault();
  render();
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    activeList = tab.dataset.list;
    document.querySelectorAll(".tab").forEach(item => {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    render();
  });
});

results.addEventListener("click", async event => {
  const button = event.target.closest(".copy-btn");
  if (!button || !button.dataset.code) return;

  try {
    await navigator.clipboard.writeText(button.dataset.code);
    const oldText = button.textContent;
    button.textContent = "Copied!";
    button.classList.add("copied");
    window.setTimeout(() => {
      if (button.isConnected) {
        button.textContent = oldText;
        button.classList.remove("copied");
      }
    }, 1600);
  } catch {
    statusEl.textContent = "Clipboard access failed. Please copy the territory code manually.";
  }
});

Promise.all(DATA_FILES.map(async ({ url, list }) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error(`${url} must contain a JSON array.`);
  return data.map(branch => ({
    ...branch,
    territoryCode: validTerritoryCode(branch.territoryCode),
    list
  }));
}))
  .then(branchLists => {
    branches = branchLists.flat();
    if (!branches.length) {
      statusEl.textContent = "No branch records have been added yet. Add records to the MFL, MML, and South files in branch-data/.";
      render();
      return;
    }
    const missingCodes = branches.filter(branch => !branch.territoryCode).length;
    statusEl.textContent = missingCodes
      ? `${missingCodes} branch ${missingCodes === 1 ? "record has" : "records have"} no valid 4-digit territory code.`
      : "Showing all branches. Enter a PIN to filter instantly.";
    render();
  })
  .catch(error => {
    countEl.textContent = "Data unavailable";
    results.innerHTML = `<div class="empty">Branch data could not be loaded. ${escapeHtml(error.message)}</div>`;
    statusEl.textContent = "Please check that all three branch data files exist and contain valid JSON.";
  });
