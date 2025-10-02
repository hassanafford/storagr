# School Warehouse Management System

This repository contains two separate applications:

## Frontend ([school-warehouse-system](file:///c:/Users/hassan/Desktop/New%20folder/school-warehouse-system))
- React/Vite application
- This should be deployed to Vercel
- Root directory: `school-warehouse-system`

## Backend ([school-warehouse-api](file:///c:/Users/hassan/Desktop/New%20folder/school-warehouse-api))
- Node.js/Express API
- This should be deployed to a Node.js hosting platform (Render, Heroku, etc.)
- Root directory: `school-warehouse-api`

## Deployment Instructions

### Frontend Deployment (Vercel)
1. Import this repository to Vercel
2. Set Root Directory to: `school-warehouse-system`
3. Set Build Command to: `npm run build`
4. Set Output Directory to: `dist`
5. Add environment variables:
   - `VITE_SUPABASE_URL`=your_supabase_url
   - `VITE_SUPABASE_ANON_KEY`=your_supabase_anon_key

### Backend Deployment (Render/Heroku)
1. Deploy the `school-warehouse-api` directory to your preferred Node.js hosting platform
2. Set environment variables:
   - `SUPABASE_URL`=your_supabase_url
   - `SUPABASE_SERVICE_ROLE_KEY`=your_supabase_service_role_key
   - `PORT`=5001 (or your platform's default port)

A comprehensive warehouse management system for schools with real-time inventory tracking, analytics, and multi-user role-based access control.

## Features

- **Multi-Warehouse Management**: Support for 12 warehouses with individual employee assignments
- **Real-time Analytics**: Interactive charts and dashboards for inventory monitoring
- **Role-based Access Control**: Admin oversight with employee-specific warehouse access
- **Transaction Tracking**: Complete history of item issuance, returns, and exchanges
- **Low Inventory Alerts**: Automatic notifications for stock levels
- **Audit System**: Daily inventory audits with discrepancy tracking
- **Responsive UI**: Modern interface built with React and Tailwind CSS

## Technology Stack

### Frontend
- React.js with Vite
- Tailwind CSS for styling
- ShadCN/ui components
- ApexCharts for data visualization
- React Router for navigation

### Backend
- Node.js with Express
- Supabase for database and authentication
- WebSocket for real-time notifications
- RESTful API architecture

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Git

## Getting Started

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd school-warehouse-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd school-warehouse-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=5001
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

### Frontend (.env in school-warehouse-system)
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Backend (.env in school-warehouse-api)
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `PORT`: Server port (default: 5001)

## Deployment

### Vercel Deployment (Frontend)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Backend Deployment
For backend deployment, you can use platforms like:
- Render
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk

## Project Structure

```
.
├── school-warehouse-api/          # Backend API
│   ├── server.js                  # Main server file
│   ├── .env                       # Backend environment variables
│   └── ...                        # Other backend files
├── school-warehouse-system/       # Frontend application
│   ├── src/                       # Source code
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API service files
│   │   └── ...                    # Other frontend files
│   ├── .env                       # Frontend environment variables
│   └── ...                        # Other frontend files
└── ...                            # Other project files
```

## Available Scripts

### Frontend (school-warehouse-system)
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

### Backend (school-warehouse-api)
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon

## Learn More

- [React Documentation](https://reactjs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Supabase Documentation](https://supabase.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.