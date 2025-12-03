# QuickKart - Quick Commerce Platform

A modern, lightning-fast delivery platform built for delivering daily essentials in 5-10 minutes. Inspired by platforms like Zepto, Blinkit, and Instamart.

## About

QuickKart is a full-stack quick commerce solution with hyperlocal delivery capabilities. This repository contains the React-based frontend that integrates with our Node.js backend API.

## Features

### Customer Features
- **Lightning Fast Delivery**: 5-10 minute delivery promise
- **Real-time Order Tracking**: GPS-based live tracking
- **Multiple Payment Options**: UPI, Cards, Cash on Delivery
- **Smart Product Search**: Filter by category, price, availability
- **Location-based Service**: Automatic serviceability detection
- **Order History**: Track past orders and quick reorder
- **Rating & Reviews**: Rate products and delivery experience
- **Saved Addresses**: Manage multiple delivery addresses
- **Promo Codes**: Apply discount coupons at checkout
- **Dark/Light Mode**: Seamless theme switching

### Technical Features
- JWT-based Authentication
- Responsive Design (Mobile-first)
- Real-time Notifications
- Optimistic UI Updates
- Lazy Loading & Code Splitting
- Progressive Web App (PWA) ready

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **Form Handling**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **UI Components**: Radix UI primitives
- **Build Tool**: Vite

### Backend Integration
- RESTful API architecture
- JWT token authentication
- Real-time updates via polling/WebSockets
- Geo-location services
- Payment gateway integration

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API running (see backend repository)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/quickkart-frontend.git
cd quickkart-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your backend API URL
# VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Shadcn UI components
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   └── ...
├── contexts/         # React Context providers
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── pages/            # Route pages
│   ├── Home.tsx
│   ├── Products.tsx
│   ├── Cart.tsx
│   ├── Checkout.tsx
│   └── ...
├── services/         # API service layer
│   ├── api.ts
│   ├── authService.ts
│   ├── cartService.ts
│   ├── orderService.ts
│   └── ...
├── data/             # Static data
├── hooks/            # Custom hooks
├── lib/              # Utilities
└── assets/           # Images and static files
```

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

## API Integration

The frontend communicates with the backend through a service layer:

- **Authentication**: JWT tokens stored in localStorage
- **Cart Management**: Real-time sync with backend
- **Order Processing**: Complete checkout flow
- **Product Catalog**: Dynamic product loading
- **Location Services**: Pincode verification and serviceability check

## Key Features Implementation

### Authentication Flow
1. User registers/logs in
2. JWT token received and stored
3. Token sent in Authorization header for all API calls
4. Auto-refresh on token expiry
5. Secure logout clears all local data

### Cart System
- Persistent cart across sessions (for logged-in users)
- Real-time inventory checks
- Automatic price updates
- Quick add/remove functionality

### Checkout Process
1. Address selection/addition
2. Payment method selection (UPI/Card/COD)
3. Apply promo codes
4. Order confirmation
5. Real-time order tracking

### Hyperlocal Delivery
- GPS-based location detection
- Pincode serviceability check
- Dark store assignment
- Real-time delivery partner tracking
- Estimated delivery time calculation

## Payment Integration

Supports multiple payment methods:
- **UPI**: PhonePe, GPay, Paytm
- **Cards**: Credit/Debit cards via payment gateway
- **COD**: Cash on Delivery

## Design System

Custom design system with semantic tokens:
- Consistent color palette (Purple/Blue gradients)
- Responsive breakpoints
- Reusable component variants
- Dark/Light mode support
- Smooth animations and transitions

## Team

- **Siddharth Saxena** - Founder & CEO
- **Shivam Dangi** - CTO
- **Shreyansh Rathore** - Head of Operations
- **Shlok Rathore** - Head of Marketing

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling
- Write clean, self-documenting code
- Add comments for complex logic

## Performance Optimization

- Code splitting with React.lazy()
- Image optimization and lazy loading
- Memoization with useMemo/useCallback
- Debounced search inputs
- Virtual scrolling for long lists
- Service worker caching (PWA)

## Security

- XSS protection
- CSRF tokens
- Input sanitization
- Secure token storage
- HTTPS enforcement
- Rate limiting on API calls

## License

This project is proprietary and confidential.

## Contact

For questions or support, reach out to the team:
- Email: support@quickkart.com
- Website: https://quickkart.com

---

Built with ❤️ by the QuickKart Team
