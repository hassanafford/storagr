import { authenticateUser, getUserByNationalId, getAllUsers, createUser, updateUser, deleteUser } from '../db';

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
export const authenticateUserService = async (nationalId, password) => {
  try {
    const response = await authenticateUser(nationalId, password);

    if (response.user) {
      // Save user to localStorage (no token needed)
      saveUser(response.user);
      return response.user;
    }

    throw new Error('Authentication failed');
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Get user by national ID
export const getUserByNationalIdService = async (nationalId) => {
  try {
    const response = await getUserByNationalId(nationalId);
    return response;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Get all users (admin only)
export const getAllUsersService = async () => {
  try {
    const response = await getAllUsers();
    return response;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Create user (admin only)
export const createUserService = async (userData) => {
  try {
    const response = await createUser(userData);
    return response;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user (admin only)
export const updateUserService = async (id, userData) => {
  try {
    const response = await updateUser(id, userData);
    return response;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user (admin only)
export const deleteUserService = async (id) => {
  try {
    const response = await deleteUser(id);
    return response;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};