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

2. Open your browser and visit `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

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
│   ├── styles/
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