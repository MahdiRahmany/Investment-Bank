// User Login
const form = document.querySelector(".form");
const login = document.querySelector(".login-form");
const usernameInput = document.querySelector(".input-username");
const passwordInput = document.querySelector(".input-password");
const messageDiv = document.querySelector(".message");

// Top Dashboard
const dashboard = document.querySelector(".user-panel");
const fullName = document.querySelector(".fullName");
const email = document.querySelector(".email");
const balance = document.querySelector(".balance");
const id = document.querySelector(".id");
const joinDate = document.querySelector(".joinDate");

// Logout Button
const logout = document.querySelector(".btn-logout");

// Left Dashboard
const tbody = document.querySelector(".tbody");
const total_calc = document.querySelector(".total-calc");
const total_deposit = document.querySelector(".total-deposit");
const total_withdraw = document.querySelector(".total-withdraw");

// Right Dashboard --- Deposit Action
const input_deposit = document.querySelector(".input-deposit");
const btn_deposit = document.querySelector(".btn-deposit");

// Right Dashboard --- Withdraw Action
const input_withdraw = document.querySelector(".input-withdraw");
const btn_withdraw = document.querySelector(".btn-withdraw");

// Chevron-down Sort
const chevron_down = document.querySelector(".chevron-head");

// Reset User
let currentUser = null;

// Fetch Data
async function validationUser(username, password) {
  try {
    const response = await fetch("/db.json");

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.error}`);
    }

    const data = await response.json();

    const user =
      data.users.find(
        (u) => u.username === username && u.password === password
      ) || null;
    return user || null;
  } catch (error) {
    console.error("error:", error);
    return null;
  }
}

// check User Login
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

// Enter User Dashboard
function loadDashboard() {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  // Top Dashboard
  fullName.textContent = user.fullName;
  email.textContent = `(${user.email})`;
  balance.textContent = user.balance.toLocaleString();
  id.textContent = user.accountNumber;
  joinDate.textContent = `(${user.joinDate})`;

  // Calculate Deposit and Withdraw
  total_calc.innerHTML = user.transactions
    .reduce((acc, curr) => {
      if (curr.type === "deposit") {
        return (acc += curr.amount);
      } else {
        return acc - curr.amount;
      }
    }, 0)
    .toLocaleString();

  total_deposit.innerHTML = user.transactions
    .reduce(
      (acc, curr) =>
        (acc +=
          curr.type === "deposit" && curr.status === "Successful"
            ? curr.amount
            : 0),
      0
    )
    .toLocaleString();

  total_withdraw.innerHTML = user.transactions.reduce(
    (acc, curr) =>
      (acc +=
        curr.type === "withdrawal" && curr.status === "Successful"
          ? curr.amount
          : 0),
    0
  );

  // Transactions sorted
  const sorted = [...user.transactions].sort((a, b) => {
    return ascending ? a.amount - b.amount : b.amount - a.amount;
  });

  tbody.innerHTML = sorted
    .map(
      (transaction) => `
    <tr>
        <td>${transaction.type === "deposit" ? "Deposit" : "Withdraw"}</td>
        <td>${
          transaction.type === "deposit" ? "+" : "-"
        }${transaction.amount.toLocaleString()}</td>
        <td>${transaction.date.replace(/-/g, "/")}</td>
        <td>${transaction.description}</td>
        <td>${transaction.status}</td>
    </tr>
`
    )
    .join("");
}

// Transaction Deposit
btn_deposit.addEventListener("click", (e) => {
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

// Transaction Withdraw
btn_withdraw.addEventListener("click", (e) => {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  const amount = parseFloat(input_withdraw.value);
  console.log(amount);
  const maxAllowed = user.balance;

  if (!amount || amount <= 0) {
    alert("Invalid Amount!");
    return;
  }

  if (amount > maxAllowed) {
    alert(
      `Insufficient inventory! Maximum allowed: ${maxAllowed.toLocaleString()}`
    );
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

// Chevron-down Action
let ascending = true;
chevron_down.addEventListener("click", (e) => {
  ascending = !ascending;
  chevron_down.classList.toggle("chevron-head-table", !ascending);
  loadDashboard();
});

// Logout User
logout.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "/index.html";
});

// Keep User's Status
window.addEventListener("load", () => {
  const user = localStorage.getItem("currentUser");

  if (user) {
    login.style.display = "none";
    dashboard.style.display = "grid";
    loadDashboard();
  }
});
