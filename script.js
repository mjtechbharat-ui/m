import { auth, db } from "./app.js";
import { 
    getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, getDoc 
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";

// Global variables to store approval context
let currentUserId, currentIndex;

// Admin Login
async function adminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const loginMessage = document.getElementById('loginMessage');

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const adminRef = doc(db, "admins", user.uid);
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists() && adminSnap.data().Role === "admin") {
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';

            fetchWithdrawals();
        } else {
            loginMessage.innerText = "You are not an admin!";
            await signOut(auth);
        }
    } catch (error) {
        loginMessage.innerText = error.message;
    }
}

// Parse Withdrawal Entry
function parseWithdrawalEntry(entry) {
    if (typeof entry === "string") { // Backward compatibility
        const regex = /Withdrawn: (\d+) INR \((.*?)\) via (.*)/;
        const match = entry.match(regex);
        if (match) {
            return {
                action: "Recharged",
                amount: match[1],
                status: match[2],
                method: match[3],
                mobileNumber: match[3].split(" via ")[0] || "N/A",
                giftCardNumber: "N/A",
                date: "N/A"
            };
        }
        return { 
            action: "Unknown",
            amount: "0", 
            status: "Unknown", 
            method: "N/A", 
            mobileNumber: "N/A",
            giftCardNumber: "N/A",
            date: "N/A" 
        };
    }
    return {
        action: entry.action || "Unknown",
        amount: entry.amount || "0",
        status: entry.status || "Unknown",
        method: entry.method || "N/A",
        mobileNumber: entry.method && entry.action === "Recharged" ? entry.method.split(" via ")[0] : "N/A",
        giftCardNumber: entry.giftCardNumber || "N/A",
        date: entry.date || "N/A"
    };
}

// Fetch Withdrawals
async function fetchWithdrawals(searchValue = "") {
    const tableBody = document.querySelector("#withdrawals-table tbody");
    tableBody.innerHTML = '';

    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        querySnapshot.forEach(docSnap => {
            const userData = docSnap.data();
            const userId = docSnap.id;
            
            if (userData.withdrawalHistory && Array.isArray(userData.withdrawalHistory)) {
                userData.withdrawalHistory.forEach((entry, index) => {
                    const { action, amount, status, method, giftCardNumber, date } = parseWithdrawalEntry(entry);
                    if (status === "Pending") {
                        const registerDate = userData.registerDate 
                            ? new Date(userData.registerDate.toDate()).toLocaleString('en-IN', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric', 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                second: '2-digit', 
                                hour12: true 
                              }) 
                            : "N/A";
                            
                        const row = `<tr>
                            <td>${userData.name || "Unknown"}</td>
                            <td>${action}</td>
                            <td>₹${amount}</td>
                            <td>${method}</td>
                            <td>${giftCardNumber}</td>
                            <td>${status}</td>
                            <td>${registerDate}</td>
                            <td>
                                <button onclick="approveWithdrawal('${userId}', ${index}, '${method}')">Approve</button>
                                <button onclick="confirmRejection('${userId}', ${index})">Reject</button>
                            </td>
                        </tr>`;
                        tableBody.innerHTML += row;
                    }
                });
            }
        });
    } catch (error) {
        console.error("Error fetching withdrawals:", error);
    }
}

// Approve Withdrawal
function approveWithdrawal(userId, index, method) {
    showApproveModal(userId, index, method);
}

// Show Approve Modal
function showApproveModal(userId, index, method) {
    currentUserId = userId;
    currentIndex = index;
    const modal = document.getElementById("approveModal");
    const approveDetails = document.getElementById("approveDetails");
    const approveInput = document.getElementById("approveInput");

    modal.style.display = "block";
    approveDetails.innerText = "Enter the Gift Card Number:";
    approveInput.placeholder = "e.g., XXXX-XXXX-XXXX-XXXX";
    approveInput.value = "";
    approveInput.style.display = "block";
}

// Close Approve Modal
function closeApproveModal() {
    document.getElementById("approveModal").style.display = "none";
}

// Submit Approval
async function submitApproval() {
    const userRef = doc(db, "users", currentUserId);
    const userSnap = await getDoc(userRef);
    const withdrawalEntry = userSnap.data().withdrawalHistory[currentIndex];
    const { method } = parseWithdrawalEntry(withdrawalEntry);
    
    let inputValue = null;
    const approveInput = document.getElementById("approveInput");
    inputValue = approveInput.value.trim();

    if (!inputValue) {
        alert("Please enter the Gift Card Number!");
        return;
    }

    await updateWithdrawalStatus(currentUserId, currentIndex, "Success", inputValue);
    closeApproveModal();
}

// Update Withdrawal Status
async function updateWithdrawalStatus(userId, index, newStatus, giftCardNumber = null) {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const withdrawalHistory = userData.withdrawalHistory || [];
            if (withdrawalHistory.length > index) {
                const existingEntry = parseWithdrawalEntry(withdrawalHistory[index]);
                withdrawalHistory[index] = {
                    action: existingEntry.action,
                    amount: existingEntry.amount,
                    status: newStatus,
                    method: existingEntry.method,
                    mobileNumber: existingEntry.mobileNumber,
                    giftCardNumber: giftCardNumber || existingEntry.giftCardNumber,
                    date: new Date().toISOString()
                };
                await updateDoc(userRef, { withdrawalHistory });
                fetchWithdrawals();
            }
        }
    } catch (error) {
        console.error("Error updating withdrawal status:", error);
    }
}

// Confirm Rejection
function confirmRejection(userId, index) {
    if (confirm("Are you sure you want to reject this withdrawal?")) {
        updateWithdrawalStatus(userId, index, "Rejected");
    }
}

// Logout
async function logout() {
    try {
        await signOut(auth);
        document.getElementById('admin-panel').style.display = 'none';
        document.getElementById('login-section').style.display = 'block';
    } catch (error) {
        console.error("Error logging out:", error);
    }
}

// Expose functions globally
window.adminLogin = adminLogin;
window.fetchWithdrawals = fetchWithdrawals;
window.approveWithdrawal = approveWithdrawal;
window.showApproveModal = showApproveModal;
window.closeApproveModal = closeApproveModal;
window.submitApproval = submitApproval;
window.confirmRejection = confirmRejection;
window.logout = logout;