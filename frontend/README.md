# ⚽ eFootball League 2026 - Production System

A complete, production-ready eFootball tournament management system with Node.js, Express, PostgreSQL (Neon), and PayFlow M-Pesa integration.

## 🚀 Features

### Core Features
- ✅ **No Supabase** - Pure PostgreSQL (Neon) architecture
- ✅ **JWT Authentication** - Secure login/registration with bcrypt
- ✅ **Tournament System** - Create FREE and PAID tournaments
- ✅ **PayFlow M-Pesa** - STK Push payment integration
- ✅ **Notification System** - Database-driven notifications for all users
- ✅ **Image Export** - Export league tables and fixtures as PNG
- ✅ **Receipt System** - Track and view payment receipts
- ✅ **Admin Dashboard** - Manage tournaments, broadcast notifications
- ✅ **Player Dashboard** - View stats, matches, tournaments, receipts
- ✅ **Clean Architecture** - Scalable, modular codebase

## 📁 Project Structure

```
efootball-league/
├── backend/
│   ├── server.js                 # Express server
│   ├── package.json              # Dependencies
│   ├── .env.example              # Environment variables template
│   └── src/
│       ├── config/
│       │   ├── db.js            # PostgreSQL connection
│       │   └── schema.sql       # Database schema
│       ├── controllers/         # Request handlers
│       │   ├── authController.js
│       │   ├── tournamentController.js
│       │   ├── paymentController.js
│       │   ├── notificationController.js
│       │   ├── leagueController.js
│       │   ├── playerController.js
│       │   └── adminController.js
│       ├── services/            # Business logic
│       │   ├── payflowService.js
│       │   ├── notificationService.js
│       │   └── exportService.js
│       ├── middleware/          # Express middleware
│       │   ├── auth.js
│       │   ├── admin.js
│       │   └── validate.js
│       ├── routes/              # API routes
│       │   ├── auth.js
│       │   ├── tournaments.js
│       │   ├── payflow.js
│       │   ├── notifications.js
│       │   ├── league.js
│       │   ├── player.js
│       │   └── export.js
│       └── utils/               # Helper functions
│           ├── response.js
│           ├── constants.js
│           └── helpers.js
├── frontend/
│   ├── index.html               # Main landing page
│   ├── login.html               # Login page
│   ├── register.html            # Registration page
│   ├── player-dashboard.html    # Player dashboard
│   ├── admin.html               # Admin dashboard
│   └── assets/
│       ├── css/
│       │   └── theme.css        # Unified theme
│       └── js/
│           ├── api.js           # API client
│           ├── auth.js          # Auth helpers
│           ├── toast.js         # Toast notifications
│           ├── notifications.js # Notification UI
│           └── export.js        # Image export
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **HTTP Client**: Axios (for PayFlow API)

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom properties, responsive design
- **Vanilla JavaScript** - No frameworks, clean code
- **Fetch API** - HTTP requests
- **Canvas API** - Image export

## 📦 Installation

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database (Neon recommended)
- PayFlow M-Pesa account (for payments)

### 1. Clone and Setup

```bash
cd efootball-league/backend
npm install
```

### 2. Configure Environment

Create `.env` file from example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# PayFlow M-Pesa
PAYFLOW_CONSUMER_KEY=your_key
PAYFLOW_CONSUMER_SECRET=your_secret
PAYFLOW_SHORTCODE=your_shortcode
PAYFLOW_PASSKEY=your_passkey
PAYFLOW_CALLBACK_URL=https://yourdomain.com/api/payflow/webhook
PAYFLOW_BASE_URL=https://api.payflow.com
```

### 3. Initialize Database

The database schema is automatically applied on first run. You can also run it manually:

```bash
psql "your_database_url" -f src/config/schema.sql
```

### 4. Start Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server runs on: `http://localhost:3000`

## 📡 API Documentation

### Authentication

```
POST /api/auth/register
Body: { username, email, password, team }

POST /api/auth/login
Body: { identifier, password }

POST /api/auth/check-username
Body: { username }
```

### Tournaments

```
GET /api/tournaments                    # List all tournaments
GET /api/tournaments/:id                # Get tournament details
POST /api/tournaments/create            # Create tournament (Admin)
POST /api/tournaments/:id/join          # Join tournament
```

### Payments (PayFlow M-Pesa)

```
POST /api/payflow/stk-push             # Initiate STK Push
Body: { phone, amount, tournament_id }

POST /api/payflow/status               # Check payment status
Body: { transaction_id }

POST /api/payflow/webhook              # PayFlow callback (no auth)

GET /api/payflow/receipt/:id           # Get receipt
```

### Notifications

```
GET /api/notifications                 # Get user notifications
POST /api/notifications/:id/read       # Mark as read
POST /api/notifications/read-all       # Mark all as read
POST /api/notifications/admin/notify-all  # Broadcast (Admin)
```

### League

```
GET /api/standings                     # League standings
GET /api/fixtures                      # All fixtures
POST /api/fixtures/generate            # Generate fixtures (Admin)
POST /api/results/submit               # Submit match result
```

### Player

```
GET /api/player/profile                # Player profile
GET /api/player/stats                  # Player statistics
GET /api/player/matches                # Player matches
GET /api/player/receipts               # Payment receipts
GET /api/player/tournaments            # Player tournaments
```

### Export

```
GET /api/export/league-table           # League table data
GET /api/export/fixtures               # Fixtures data
```

## 🎮 Usage

### For Players

1. **Register** - Create account at `/register.html`
2. **Login** - Access dashboard at `/login.html`
3. **View Dashboard** - See stats, matches, tournaments
4. **Join Tournaments** - Free or paid (via M-Pesa)
5. **View Receipts** - Track payment history
6. **Get Notifications** - Real-time updates

### For Admins

1. **Login** - Use admin credentials
2. **Create Tournaments** - Set name, entry fee, max players
3. **Generate Fixtures** - Auto-create round-robin matches
4. **Broadcast Notifications** - Send to all users
5. **Monitor System** - View stats and activity

## 💳 Payment Flow

### Tournament Payment Process

```
1. Player clicks "Pay KES X & Join"
   ↓
2. Backend creates pending transaction
   ↓
3. STK Push sent to player's phone
   ↓
4. Player enters M-Pesa PIN
   ↓
5. Frontend polls /api/payflow/status every 5s
   ↓
6. If successful:
   - Payment marked completed
   - Player added to tournament
   - Notification sent
   - Receipt created
```

### Webhook Handling

PayFlow sends payment confirmations to:
```
POST /api/payflow/webhook
```

The webhook:
- Verifies transaction
- Updates payment status
- Adds player to tournament
- Creates notification
- Logs transaction

## 🔔 Notification System

### Notification Types

- **payment** - Payment confirmations
- **tournament** - Tournament updates
- **match** - Match scheduled/completed
- **system** - Admin broadcasts

### Triggers

- ✅ Payment successful
- ✅ Tournament joined
- ✅ Match scheduled
- ✅ Match completed
- ✅ Admin broadcast

### Frontend Features

- Bell icon with unread count
- Dropdown notification panel
- Mark as read/unread
- Auto-refresh every 30 seconds

## 🖼️ Export System

### Export League Table

```javascript
window.imageExporter.exportLeagueTable()
```

Generates PNG with:
- Player rankings
- All statistics
- Professional formatting
- Auto-download

### Export Fixtures

```javascript
window.imageExporter.exportFixtures()
```

Generates PNG with:
- Match schedule
- Scores/results
- Match status
- Date/time

## 🔐 Security Features

- **JWT Authentication** - Token-based auth with expiry
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - express-validator on all inputs
- **Rate Limiting** - Prevent abuse (general, auth, payment)
- **CORS Protection** - Whitelist origins
- **Helmet** - Security headers
- **Environment Variables** - No hardcoded secrets
- **SQL Injection Prevention** - Parameterized queries

## 🗄️ Database Schema

### Main Tables

- `player_accounts` - User accounts and stats
- `tournaments` - Tournament definitions
- `tournament_participants` - Player-tournament mapping
- `fixtures` - Match schedules
- `results` - Completed match results
- `payment_transactions` - Payment records
- `notifications` - User notifications
- `admins` - Admin permissions
- `settings` - System configuration

## 🚀 Deployment

### Backend (Render/Railway/Heroku)

1. Push code to GitHub
2. Connect to hosting platform
3. Set environment variables
4. Deploy

### Frontend

Option 1: Served by backend (default)
```
Static files in /frontend served by Express
```

Option 2: Separate hosting (Netlify/Vercel)
```
Update API base URL in frontend/js/api.js
```

### Database (Neon)

1. Create Neon account
2. Create PostgreSQL database
3. Copy connection string
4. Add to `DATABASE_URL` in `.env`

### PayFlow Setup

1. Create PayFlow account
2. Get API credentials
3. Configure webhook URL
4. Test in sandbox mode

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration
- [ ] User login/logout
- [ ] Create tournament (admin)
- [ ] Join free tournament
- [ ] Join paid tournament (STK Push)
- [ ] Payment webhook processing
- [ ] View receipts
- [ ] Notifications trigger
- [ ] League standings calculation
- [ ] Export league table PNG
- [ ] Export fixtures PNG
- [ ] Admin broadcast notification
- [ ] Generate fixtures

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 3000) |
| NODE_ENV | Environment | No (default: development) |
| DATABASE_URL | Neon PostgreSQL URL | Yes |
| JWT_SECRET | JWT signing key | Yes |
| JWT_EXPIRES_IN | Token expiry | No (default: 7d) |
| PAYFLOW_CONSUMER_KEY | PayFlow API key | Yes |
| PAYFLOW_CONSUMER_SECRET | PayFlow API secret | Yes |
| PAYFLOW_SHORTCODE | M-Pesa shortcode | Yes |
| PAYFLOW_PASSKEY | M-Pesa passkey | Yes |
| PAYFLOW_CALLBACK_URL | Webhook URL | Yes |
| PAYFLOW_BASE_URL | PayFlow API URL | No |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

**Brasho Kish**

## 🆘 Support

For issues and questions:
- Open GitHub issue
- Check API documentation
- Review environment setup

## 🎯 Roadmap

- [ ] Real-time match updates (WebSockets)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Advanced statistics
- [ ] Player profiles with avatars
- [ ] Tournament brackets visualization
- [ ] Mobile app (React Native)
- [ ] Multi-language support

---

**Built with ❤️ for the eFootball community**
