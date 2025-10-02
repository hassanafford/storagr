import api from '../db';

// Save user to localStorage
export const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Remove user from localStorage
export const logoutUser = () => {
  localStorage.removeItem('user');
};

// Authenticate user
export const authenticateUser = async (nationalId, password) => {
  try {
    const response = await api.authenticateUser(nationalId, password);
    
    if (response.token && response.user) {
      // Save user with token to localStorage
      saveUser({
        ...response.user,
        token: response.token
      });
      
      return {
        ...response.user,
        token: response.token
      };
    }
    
    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Get user by national ID
export const getUserByNationalId = async (nationalId) => {
  try {
    const response = await api.getUserByNationalId(nationalId);
    return response;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const response = await api.getAllUsers();
    return response;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Create user (admin only)
export const createUser = async (userData) => {
  try {
    const response = await api.createUser(userData);
    return response;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user (admin only)
export const updateUser = async (id, userData) => {
  try {
    const response = await api.updateUser(id, userData);
    return response;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (id) => {
  try {
    const response = await api.deleteUser(id);
    return response;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};