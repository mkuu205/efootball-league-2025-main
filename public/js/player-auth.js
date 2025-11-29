// player-auth.js - Player Registration & Authentication with PayFlow Payment
import { getSupabase, ensureSupabaseInitialized, showNotification } from './database.js';

// PayFlow API Configuration
const PAYFLOW_CONFIG = {
    API_KEY: 'f712dfed7431115a762b1cebef8b3447bbe48429c25ceced7783a490a1781a38',
    API_SECRET: 'dfde99d4f192067b6f11cce42d223eebfeb76099eb0a3f853e5f3876a4c835cd',
    ACCOUNT_ID: 1,
    REGISTRATION_FEE: 50, // KES
    STK_PUSH_URL: '/api/payflow/stk-push',
    STATUS_URL: '/api/payflow/status'
};

// Registration state
let registrationData = null;
let checkoutRequestId = null;
let statusCheckInterval = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing player registration...');
    
    await ensureSupabaseInitialized();
    
    // Setup registration form
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }

    // Setup profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileCompletion);
    }

    // Check for pending registration
    checkPendingRegistration();
});

// Check for pending registration in localStorage
function checkPendingRegistration() {
    const pending = localStorage.getItem('pending_registration');
    if (pending) {
        const data = JSON.parse(pending);
        registrationData = data;
        
        // Check if payment was completed
        if (data.payment_status === 'completed') {
            goToStep(3);
        } else if (data.checkout_request_id) {
            checkoutRequestId = data.checkout_request_id;
            goToStep(2);
            // Resume status checking
            startStatusChecking();
        }
    }
}

// Handle registration form submission
async function handleRegistration(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (password !== confirmPassword) {
        showStatusMessage('error', 'Passwords do not match!');
        return;
    }

    if (password.length < 6) {
        showStatusMessage('error', 'Password must be at least 6 characters!');
        return;
    }

    // Validate phone format
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(phone)) {
        showStatusMessage('error', 'Phone must be in format 254XXXXXXXXX');
        return;
    }

    try {
        const supabase = getSupabase();

        // Check if email or phone already exists
        const { data: existingEmail } = await supabase
            .from('player_accounts')
            .select('id')
            .eq('email', email)
            .single();

        if (existingEmail) {
            showStatusMessage('error', 'Email already registered. Please login instead.');
            return;
        }

        const { data: existingPhone } = await supabase
            .from('player_accounts')
            .select('id')
            .eq('phone', phone)
            .single();

        if (existingPhone) {
            showStatusMessage('error', 'Phone number already registered. Please login instead.');
            return;
        }

        // Create account (pending payment)
        const { data: newAccount, error } = await supabase
            .from('player_accounts')
            .insert([{
                name: fullName,
                phone: phone,
                email: email,
                password: password, // In production, hash this!
                payment_status: 'pending',
                registration_date: new Date().toISOString(),
                status: 'inactive'
            }])
            .select()
            .single();

        if (error) throw error;

        // Store registration data
        registrationData = {
            account_id: newAccount.id,
            name: fullName,
            phone: phone,
            email: email,
            payment_status: 'pending'
        };
        localStorage.setItem('pending_registration', JSON.stringify(registrationData));

        showStatusMessage('success', 'Account created! Proceed to payment.');
        
        // Move to payment step
        setTimeout(() => goToStep(2), 1000);

    } catch (error) {
        console.error('Registration error:', error);
        showStatusMessage('error', 'Registration failed: ' + error.message);
    }
}

// Initiate M-Pesa payment via PayFlow
window.initiatePayment = async function() {
    const payBtn = document.getElementById('pay-btn');
    const paymentStatus = document.getElementById('payment-status');
    
    payBtn.disabled = true;
    payBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending STK Push...';
    paymentStatus.innerHTML = '<i class="fas fa-mobile-alt fa-bounce"></i> Check your phone for M-Pesa prompt...';

    try {
        const reference = `EFL${registrationData.account_id}_${Date.now()}`;
        
        const response = await fetch(PAYFLOW_CONFIG.STK_PUSH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: registrationData.phone,
                amount: PAYFLOW_CONFIG.REGISTRATION_FEE,
                reference: reference,
                description: 'eFootball League 2025 Registration Fee',
                account_id: registrationData.account_id
            })
        });

        const result = await response.json();

        if (result.success) {
            checkoutRequestId = result.checkout_request_id;
            
            // Update local storage
            registrationData.checkout_request_id = checkoutRequestId;
            registrationData.payment_reference = reference;
            localStorage.setItem('pending_registration', JSON.stringify(registrationData));

            paymentStatus.innerHTML = `
                <div class="text-warning">
                    <i class="fas fa-clock fa-spin me-2"></i>
                    Waiting for payment confirmation...
                </div>
                <small class="text-muted">Enter your M-Pesa PIN on your phone</small>
            `;

            // Start checking payment status
            startStatusChecking();
        } else {
            throw new Error(result.message || 'Failed to send STK Push');
        }

    } catch (error) {
        console.error('Payment error:', error);
        paymentStatus.innerHTML = `<span class="text-danger"><i class="fas fa-times-circle me-2"></i>${error.message}</span>`;
        payBtn.disabled = false;
        payBtn.innerHTML = '<i class="fas fa-mobile-alt me-2"></i>Pay with M-Pesa';
    }
};

// Start checking payment status
function startStatusChecking() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }

    let attempts = 0;
    const maxAttempts = 24; // 2 minutes (every 5 seconds)

    statusCheckInterval = setInterval(async () => {
        attempts++;
        
        try {
            const response = await fetch(PAYFLOW_CONFIG.STATUS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    checkout_request_id: checkoutRequestId
                })
            });

            const result = await response.json();

            if (result.success) {
                const status = result.status;
                const paymentStatus = document.getElementById('payment-status');

                if (status === 'completed') {
                    clearInterval(statusCheckInterval);
                    await handlePaymentSuccess(result);
                } else if (status === 'failed') {
                    clearInterval(statusCheckInterval);
                    handlePaymentFailure(result.message || 'Payment was declined');
                } else {
                    paymentStatus.innerHTML = `
                        <div class="text-warning">
                            <i class="fas fa-clock fa-spin me-2"></i>
                            Checking payment... (${attempts}/${maxAttempts})
                        </div>
                    `;
                }
            }

        } catch (error) {
            console.error('Status check error:', error);
        }

        if (attempts >= maxAttempts) {
            clearInterval(statusCheckInterval);
            document.getElementById('payment-status').innerHTML = `
                <span class="text-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Payment verification timed out. If you paid, please contact support.
                </span>
            `;
            document.getElementById('pay-btn').disabled = false;
            document.getElementById('pay-btn').innerHTML = '<i class="fas fa-mobile-alt me-2"></i>Try Again';
        }
    }, 5000);
}

// Handle successful payment
async function handlePaymentSuccess(paymentData) {
    const paymentStatus = document.getElementById('payment-status');
    paymentStatus.innerHTML = `
        <div class="text-success">
            <i class="fas fa-check-circle fa-2x mb-2"></i>
            <h5>Payment Successful!</h5>
            <p>Transaction: ${paymentData.transaction_code || 'Confirmed'}</p>
        </div>
    `;

    try {
        const supabase = getSupabase();

        // Update account payment status
        await supabase
            .from('player_accounts')
            .update({
                payment_status: 'completed',
                payment_date: new Date().toISOString(),
                transaction_code: paymentData.transaction_code,
                status: 'pending_profile'
            })
            .eq('id', registrationData.account_id);

        // Record payment
        await supabase
            .from('payments')
            .insert([{
                player_account_id: registrationData.account_id,
                amount: PAYFLOW_CONFIG.REGISTRATION_FEE,
                phone: registrationData.phone,
                transaction_code: paymentData.transaction_code,
                checkout_request_id: checkoutRequestId,
                status: 'completed',
                payment_type: 'registration',
                created_at: new Date().toISOString()
            }]);

        // Update local storage
        registrationData.payment_status = 'completed';
        localStorage.setItem('pending_registration', JSON.stringify(registrationData));

        // Move to profile step
        setTimeout(() => goToStep(3), 2000);

    } catch (error) {
        console.error('Error updating payment status:', error);
    }
}

// Handle payment failure
function handlePaymentFailure(message) {
    const paymentStatus = document.getElementById('payment-status');
    paymentStatus.innerHTML = `
        <div class="text-danger">
            <i class="fas fa-times-circle fa-2x mb-2"></i>
            <h5>Payment Failed</h5>
            <p>${message}</p>
        </div>
    `;
    
    const payBtn = document.getElementById('pay-btn');
    payBtn.disabled = false;
    payBtn.innerHTML = '<i class="fas fa-redo me-2"></i>Try Again';
}

// Handle profile completion
async function handleProfileCompletion(e) {
    e.preventDefault();

    const team = document.getElementById('team').value;
    const experience = document.getElementById('experience').value;
    const bio = document.getElementById('bio').value;

    if (!team || !experience) {
        showStatusMessage('error', 'Please fill in all required fields');
        return;
    }

    try {
        const supabase = getSupabase();

        // Update account with profile info
        await supabase
            .from('player_accounts')
            .update({
                preferred_team: team,
                experience_level: experience,
                bio: bio,
                status: 'active',
                profile_completed: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', registrationData.account_id);

        // Create player entry in players table
        const { data: newPlayer, error } = await supabase
            .from('players')
            .insert([{
                name: registrationData.name,
                team: team,
                photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(registrationData.name)}&background=6a11cb&color=fff&size=150`,
                player_account_id: registrationData.account_id,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // Link player to account
        await supabase
            .from('player_accounts')
            .update({ player_id: newPlayer.id })
            .eq('id', registrationData.account_id);

        // Clear pending registration
        localStorage.removeItem('pending_registration');

        // Store session
        const sessionData = {
            player_id: newPlayer.id,
            account_id: registrationData.account_id,
            name: registrationData.name,
            email: registrationData.email,
            phone: registrationData.phone,
            team: team,
            logged_in: true
        };
        localStorage.setItem('player_session', JSON.stringify(sessionData));

        showStatusMessage('success', 'Registration complete! Redirecting to dashboard...');

        setTimeout(() => {
            window.location.href = 'player-dashboard.html';
        }, 2000);

    } catch (error) {
        console.error('Profile completion error:', error);
        showStatusMessage('error', 'Failed to complete profile: ' + error.message);
    }
}

// Navigate between steps
function goToStep(step) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    document.getElementById(`step${step}`).classList.add('active');

    // Update step indicators
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`step${i}-indicator`);
        const line = document.getElementById(`line${i - 1}`);
        
        if (i < step) {
            indicator.classList.remove('active');
            indicator.classList.add('completed');
            if (line) line.classList.add('completed');
        } else if (i === step) {
            indicator.classList.add('active');
            indicator.classList.remove('completed');
        } else {
            indicator.classList.remove('active', 'completed');
        }
    }
}

// Show status message
function showStatusMessage(type, message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
        statusEl.className = `status-message ${type}`;
        statusEl.innerHTML = message;
        statusEl.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }
    }
}

// Export functions
export { handleRegistration, handleProfileCompletion, goToStep };
