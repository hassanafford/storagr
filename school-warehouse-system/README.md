# School Warehouse Management System

A comprehensive web-based warehouse management system for schools with multiple warehouses and user roles.

## Features

### Warehouses
- Books Warehouse
- Office Supplies Warehouse
- Clothes & Cleaning Products Warehouse
- Main Warehouse for other supplies

### User Roles

#### Employee (Limited Access)
- Issue items
- Return items
- Exchange items
- Cannot add new items or categories

#### Administrator (Full Access)
- All employee permissions
- Add new warehouses
- Add new item categories
- Monitor all operations
- Generate reports (daily/weekly/monthly)
- Dynamic dashboard synchronized with database

### UI/UX Features
- 100% responsive design for mobile devices
- Modern UI with Tailwind CSS
- Real-time notifications for all users
- Interactive elements with no dead buttons or links

## Technology Stack
- React (Vite)
- Tailwind CSS
- React Router
- Supabase (Backend as a Service)
- Socket.IO (Real-time communication)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd school-warehouse-system
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The default Vite dev server URL is printed in the terminal (typically `http://localhost:5173`).

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

### Vercel Deployment

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Set the following environment variables in Vercel:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

### Backend Deployment (Optional)

If you maintain a separate Node.js backend (not required for core Supabase usage):

1. Deploy the server to your preferred hosting platform
2. Set the following environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `PORT`: The port your server should listen on (default: 5001)

3. Provide the backend URL to the frontend via a suitable environment variable (e.g., `VITE_API_BASE_URL`) only if those endpoints are actually used.

## Login Information

- **Employee Login**: 
  - National ID: Any valid Egyptian national ID
  - Password: Last 6 digits of the National ID

- **Administrator Login**:
  - National ID: Any valid Egyptian national ID ending with '0000'
  - Password: Last 6 digits of the National ID

## Project Structure
```
school-warehouse-system/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── lib/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Development

### Adding New Features
1. Create a new branch for your feature
2. Implement your changes
3. Test thoroughly
4. Submit a pull request

### Code Style
- Follow the existing code structure
- Use functional components with hooks
- Maintain consistent styling with Tailwind CSS

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License.