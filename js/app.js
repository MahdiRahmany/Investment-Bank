// Global variable to track sort order (true = ascending, false = descending)
let ascending = true;

// --- DOM Selections ---
// User Login Elements
const form = document.querySelector(".form");
const login = document.querySelector(".login-form");
const usernameInput = document.querySelector(".input-username");
const passwordInput = document.querySelector(".input-password");
const messageDiv = document.querySelector(".message");

// Top Dashboard Elements
const dashboard = document.querySelector(".user-panel");
const fullName = document.querySelector(".fullName");
const email = document.querySelector(".email");
const balance = document.querySelector(".balance");
const id = document.querySelector(".id");
const joinDate = document.querySelector(".joinDate");

// Logout Button
const logout = document.querySelector(".btn-logout");

// Left Dashboard Elements
const tbody = document.querySelector(".tbody");
const total_calc = document.querySelector(".total-calc");
const total_deposit = document.querySelector(".total-deposit");
const total_withdraw = document.querySelector(".total-withdraw");

// Right Dashboard --- Deposit/Withdraw Actions
const input_deposit = document.querySelector(".input-deposit");
const btn_deposit = document.querySelector(".btn-deposit");
const input_withdraw = document.querySelector(".input-withdraw");
const btn_withdraw = document.querySelector(".btn-withdraw");

// Chevron Icon for Sorting Amount Column
const chevron_down = document.querySelector(".chevron-head");

// --- Fetch and Validate User Data ---
async function validationUser(username, password) {
  try {
    const response = await fetch("/db.json");
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.error}`);
    }
    const data = await response.json();
    // Find user matching username and password
    const user =
      data.users.find(u => u.username === username && u.password === password) ||
      null;
    return user;
  } catch (error) {
    console.error("error:", error);
    return null;
  }
}

// --- User Login ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = usernameInput.value;
  const password = passwordInput.value;
  const user = await validationUser(username, password);
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
    login.style.display = "none";
    dashboard.style.display = "grid";
    loadDashboard();
  } else {
    messageDiv.style.display = "flex";
    messageDiv.textContent = "Username or password is incorrect!";
  }
});

// --- Load Dashboard ---
function loadDashboard() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) return;

  // Top Dashboard: Display user details
  fullName.textContent = user.fullName;
  email.textContent = `(${user.email})`;
  balance.textContent = user.balance.toLocaleString();
  id.textContent = user.accountNumber;
  joinDate.textContent = `(${user.joinDate})`;

  // Calculate totals
  const calcTotal = user.transactions.reduce((acc, curr) => {
    return curr.type === "deposit" ? acc + curr.amount : acc - curr.amount;
  }, 0);
  total_calc.innerHTML = calcTotal.toLocaleString();

  const depositTotal = user.transactions.reduce((acc, curr) => {
    return curr.type === "deposit" && curr.status === "Successful" ? acc + curr.amount : acc;
  }, 0);
  total_deposit.innerHTML = depositTotal.toLocaleString();

  const withdrawTotal = user.transactions.reduce((acc, curr) => {
    return curr.type === "withdrawal" && curr.status === "Successful" ? acc + curr.amount : acc;
  }, 0);
  total_withdraw.innerHTML = withdrawTotal.toLocaleString();

  // Sort transactions by amount based on ascending flag
  // Sort transactions by amount based on ascending flag, considering transaction type
  const sorted = [...user.transactions].sort((a, b) => {
    // Convert amounts to effective values (positive for deposits, negative for withdrawals)
    const effectiveAmountA = a.type === "deposit" ? a.amount : -a.amount;
    const effectiveAmountB = b.type === "deposit" ? b.amount : -b.amount;

    return ascending ? effectiveAmountA - effectiveAmountB : effectiveAmountB - effectiveAmountA;
  });

  // Render transactions table
  tbody.innerHTML = sorted.map(transaction => `
    <tr>
      <td>${transaction.type === "deposit" ? "Deposit" : "Withdraw"}</td>
      <td>${transaction.type === "deposit" ? "+" : "-"}${transaction.amount.toLocaleString()}</td>
      <td>${transaction.date.replace(/-/g, "/")}</td>
      <td>${transaction.description}</td>
      <td>${transaction.status}</td>
    </tr>
  `).join("");
}

// --- Sorting Functionality ---
// Function to toggle sort order, update the chevron icon, and reload the dashboard
function sortByAmount() {
  ascending = !ascending;
  // Update chevron icon classes to reflect the sort order
  if (ascending) {
    chevron_down.classList.remove("fa-chevron-up");
    chevron_down.classList.add("fa-chevron-down");
  } else {
    chevron_down.classList.remove("fa-chevron-down");
    chevron_down.classList.add("fa-chevron-up");
  }
  loadDashboard();
}

// Attach sort function to chevron icon click
chevron_down.addEventListener("click", sortByAmount);

// --- Transaction Deposit ---
btn_deposit.addEventListener("click", () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const amount = parseFloat(input_deposit.value);
  const maxAllowed = user.balance * 0.1;

  if (!amount || amount <= 0) {
    alert("Invalid Amount!");
    return;
  }
  if (amount > maxAllowed) {
    alert(`The maximum amount permitted: ${maxAllowed.toLocaleString()}`);
    return;
  }

  const newTransaction = {
    transactionId: new Date().toString(),
    type: "deposit",
    amount: amount,
    date: new Date().toISOString().split("T")[0],
    description: "Cash Deposit",
    category: "Income",
    status: "Successful",
  };

  user.balance += amount;
  user.transactions.push(newTransaction);
  localStorage.setItem("currentUser", JSON.stringify(user));
  loadDashboard();
  input_deposit.value = "";
});

// --- Transaction Withdraw ---
btn_withdraw.addEventListener("click", () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const amount = parseFloat(input_withdraw.value);
  const maxAllowed = user.balance;

  if (!amount || amount <= 0) {
    alert("Invalid Amount!");
    return;
  }
  if (amount > maxAllowed) {
    alert(`Insufficient funds! Maximum allowed: ${maxAllowed.toLocaleString()}`);
    return;
  }

  const newTransaction = {
    transactionId: new Date().toString(),
    type: "withdrawal",
    amount: amount,
    date: new Date().toISOString().split("T")[0],
    description: "Cash Withdrawal",
    category: "cost",
    status: "Successful",
  };

  user.balance -= amount;
  user.transactions.push(newTransaction);
  localStorage.setItem("currentUser", JSON.stringify(user));
  loadDashboard();
  input_withdraw.value = "";
});

// --- Logout User ---
logout.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "/index.html";
});

// --- Preserve User Status on Page Load ---
window.addEventListener("load", () => {
  if (localStorage.getItem("currentUser")) {
    login.style.display = "none";
    dashboard.style.display = "grid";
    loadDashboard();
  }
});

// --- Log Sorted Transactions by Type ---
// This function groups transactions by type, sorts each group based on amount, and logs them
function logSortedTransactions() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) {
    console.log("No user data found!");
    return;
  }
  // Log raw transactions that are deposits
  const rawDeposits = user.transactions.filter(t => t.type === "deposit");
  console.log("Raw Deposits:", rawDeposits);

  // Group transactions by type
  const deposits = user.transactions.filter(t => t.type === "deposit");
  const withdrawals = user.transactions.filter(t => t.type === "withdrawal");

  // Sort each group by amount
  deposits.sort((a, b) => ascending ? a.amount - b.amount : b.amount - a.amount);
  withdrawals.sort((a, b) => ascending ? a.amount - b.amount : b.amount - a.amount);

  console.log("Deposits (Plus):");
  deposits.forEach(tx => {
    console.log(`+${tx.amount.toLocaleString()} on ${tx.date}: ${tx.description}`);
  });

  console.log("Withdrawals (Minus):");
  withdrawals.forEach(tx => {
    console.log(`-${tx.amount.toLocaleString()} on ${tx.date}: ${tx.description}`);
  });
}

// Call loadDashboard and log the transactions to the console
loadDashboard();
logSortedTransactions();
