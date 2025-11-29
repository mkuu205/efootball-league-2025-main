// react-app.jsx - Simple Player Registration (No Payment Required)
const { useState, useEffect } = React;

// API Helper
const api = {
    async post(url, data) {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    }
};

// Loading Spinner
const Spinner = ({ size = 24 }) => (
    <div className="spinner" style={{ width: size, height: size }}></div>
);

// Alert Component
const Alert = ({ type, message, onClose }) => {
    if (!message) return null;
    const colors = {
        success: { bg: 'var(--success-light)', color: 'var(--success)', icon: '✓' },
        error: { bg: 'var(--error-light)', color: 'var(--error)', icon: '✕' },
        info: { bg: 'var(--info-light)', color: 'var(--info)', icon: 'i' }
    };
    const style = colors[type] || colors.info;
    return (
        <div style={{
            background: style.bg,
            color: style.color,
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
        }}>
            <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: style.color, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 'bold'
            }}>{style.icon}</span>
            <span style={{ flex: 1 }}>{message}</span>
        </div>
    );
};

// Input Component
const Input = ({ label, error, ...props }) => (
    <div style={{ marginBottom: '1rem' }}>
        {label && <label className="form-label" style={{ marginBottom: '0.35rem', display: 'block' }}>{label}</label>}
        <input className="form-control" {...props} style={{ borderColor: error ? 'var(--error)' : undefined, width: '100%' }} />
        {error && <small style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{error}</small>}
    </div>
);

// Select Component
const Select = ({ label, options, error, ...props }) => (
    <div style={{ marginBottom: '1rem' }}>
        {label && <label className="form-label">{label}</label>}
        <select className="form-control" {...props}>
            <option value="">Select...</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {error && <small style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{error}</small>}
    </div>
);

// Button Component
const Button = ({ children, variant = 'primary', loading, ...props }) => (
    <button className={`btn btn-${variant}`} disabled={loading || props.disabled} {...props}>
        {loading ? <Spinner size={18} /> : children}
    </button>
);

// Team options
const teams = [
    { value: 'Kenya', label: 'Kenya' },
    { value: 'Chelsea', label: 'Chelsea' },
    { value: 'Liverpool', label: 'Liverpool' },
    { value: 'Everton', label: 'Everton' },
    { value: 'Manchester United', label: 'Manchester United' },
    { value: 'West Ham', label: 'West Ham' },
    { value: 'Arsenal', label: 'Arsenal' },
    { value: 'Manchester City', label: 'Manchester City' },
    { value: 'Tottenham', label: 'Tottenham' },
    { value: 'Newcastle', label: 'Newcastle' },
    { value: 'Real Madrid', label: 'Real Madrid' },
    { value: 'Barcelona', label: 'Barcelona' },
    { value: 'Bayern Munich', label: 'Bayern Munich' },
    { value: 'PSG', label: 'PSG' },
    { value: 'Juventus', label: 'Juventus' },
    { value: 'Inter Milan', label: 'Inter Milan' },
    { value: 'AC Milan', label: 'AC Milan' },
    { value: 'Borussia Dortmund', label: 'Borussia Dortmund' }
];

// Registration Page
const RegistrationPage = () => {
    const [formData, setFormData] = useState({
        name: '', username: '', phone: '', email: '', team: '', password: '', confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [success, setSuccess] = useState(false);

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Name is required';
        if (!formData.username.trim()) errs.username = 'Username is required';
        if (formData.username.length < 3) errs.username = 'Min 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) errs.username = 'Letters, numbers & underscore only';
        if (!formData.phone.match(/^254\d{9}$/)) errs.phone = 'Format: 254XXXXXXXXX';
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Invalid email';
        if (!formData.team) errs.team = 'Please select a team';
        if (formData.password.length < 6) errs.password = 'Min 6 characters';
        if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords don\'t match';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setAlert(null);

        try {
            const result = await api.post('/api/player/register', {
                name: formData.name,
                username: formData.username,
                phone: formData.phone,
                email: formData.email,
                team: formData.team,
                password: formData.password
            });

            if (result.success) {
                setSuccess(true);
                setAlert({ type: 'success', message: 'Account created successfully! You can now login.' });
            } else {
                setAlert({ type: 'error', message: result.message });
            }
        } catch (err) {
            setAlert({ type: 'error', message: 'Registration failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '2rem',
                    maxWidth: 400,
                    width: '100%',
                    textAlign: 'center',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: 'var(--success)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2.5rem', margin: '0 auto 1.5rem'
                    }}>✓</div>
                    <h2 style={{ fontFamily: "'Orbitron', sans-serif", marginBottom: '0.5rem' }}>Welcome!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Your account has been created. Login to access your dashboard and join tournaments.
                    </p>
                    <a href="/player-login.html" className="btn btn-primary" style={{ width: '100%' }}>
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                maxWidth: 480,
                width: '100%',
                border: '1px solid var(--border-color)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: 60, height: 60,
                        background: 'var(--gradient-primary)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 0.75rem',
                        fontSize: '1.25rem', fontWeight: 'bold', color: 'white',
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
                        fontFamily: "'Orbitron', sans-serif"
                    }}>EFL</div>
                    <h1 style={{ fontSize: '1.35rem', marginBottom: '0.25rem', fontFamily: "'Orbitron', sans-serif" }}>
                        Create Account
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Join eFootball League 2025
                    </p>
                </div>

                <Alert {...alert} />

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Full Name"
                        placeholder="Your real name"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        error={errors.name}
                    />
                    <Input
                        label="Username"
                        placeholder="e.g. ProGamer_254"
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value.replace(/\s/g, '')})}
                        error={errors.username}
                    />
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <Input
                            label="Phone (M-Pesa)"
                            placeholder="254712345678"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            error={errors.phone}
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            error={errors.email}
                        />
                    </div>
                    <Select
                        label="Preferred Team *"
                        options={teams}
                        value={formData.team}
                        onChange={e => setFormData({...formData, team: e.target.value})}
                        error={errors.team}
                    />
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Min 6 chars"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            error={errors.password}
                        />
                        <Input
                            label="Confirm"
                            type="password"
                            placeholder="Repeat password"
                            value={formData.confirmPassword}
                            onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                            error={errors.confirmPassword}
                        />
                    </div>
                    <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                        Create Account
                    </Button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Already have an account? <a href="/player-login.html" style={{ color: 'var(--primary-400)' }}>Login here</a>
                </div>
            </div>
            
            {/* Theme Toggle */}
            <button 
                onClick={() => {
                    const html = document.documentElement;
                    const current = html.getAttribute('data-theme') || 'dark';
                    const next = current === 'dark' ? 'light' : 'dark';
                    html.setAttribute('data-theme', next);
                    localStorage.setItem('efl-theme', next);
                }}
                style={{
                    position: 'fixed', bottom: '1.5rem', right: '1.5rem',
                    width: 45, height: 45, borderRadius: '50%',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
                title="Toggle Theme"
            >
                <i className="fas fa-adjust"></i>
            </button>
        </div>
    );
};

// Render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<RegistrationPage />);
