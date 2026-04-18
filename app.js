// REPLACE THIS WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxeJdCsK02ciok8Yr1o2Xo_sMajl3oywOTs7l-teERULg9D4SbdSXcLbBL9Xr8O-cNW/exec';
const BASE_COUNT = 71;

const waitlistCountTop = document.getElementById('waitlist-count');
const waitlistCountBottom = document.getElementById('waitlist-count-bottom');

const topForm = document.getElementById('top-form');
const bottomForm = document.getElementById('bottom-form');

// Fetch the total count on page load
async function fetchCount() {
    try {
        if (APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
            console.warn("Please deploy the Google Apps Script and update APPS_SCRIPT_URL in app.js");
            updateUI(BASE_COUNT);
            return;
        }

        const response = await fetch(APPS_SCRIPT_URL + '?action=getCount');
        const data = await response.json();

        if (data && typeof data.count === 'number') {
            const total = BASE_COUNT + data.count;
            updateUI(total);
        } else {
            updateUI(BASE_COUNT);
        }
    } catch (error) {
        console.error("Error fetching count:", error);
        updateUI(BASE_COUNT);
    }
}

function updateUI(total) {
    if (waitlistCountTop) waitlistCountTop.innerText = total;
    if (waitlistCountBottom) waitlistCountBottom.innerText = total;
}

// Handle Form Submission
async function handleSubmit(e, emailInputId, nameInputId = null) {
    e.preventDefault();

    if (APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        alert("Please set up the Google Apps Script URL in app.js first.");
        return;
    }

    const email = document.getElementById(emailInputId).value;
    let name = '';
    if (nameInputId) {
        name = document.getElementById(nameInputId).value;
    }

    const form = e.target;
    form.classList.add('loading');

    // Disable inputs
    const inputs = form.querySelectorAll('input, button');
    inputs.forEach(input => input.disabled = true);

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ email, name }),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            }
        });

        const data = await response.json();

        if (data.status === 'success') {
            const finalCount = BASE_COUNT + data.count;
            // Store the rank so thank you page can show it
            localStorage.setItem('outdoor_total_submissions', finalCount);
            window.location.href = 'thank-you.html';
        } else {
            alert('Something went wrong. Please try again.');
            inputs.forEach(input => input.disabled = false);
            form.classList.remove('loading');
        }
    } catch (error) {
        console.error("Submission error:", error);
        alert('Could not submit the form. Please check your connection.');
        inputs.forEach(input => input.disabled = false);
        form.classList.remove('loading');
    }
}

if (topForm) {
    topForm.addEventListener('submit', (e) => handleSubmit(e, 'top-email'));
}

if (bottomForm) {
    bottomForm.addEventListener('submit', (e) => handleSubmit(e, 'bottom-email', 'bottom-name'));
}

// Initialize
fetchCount();
