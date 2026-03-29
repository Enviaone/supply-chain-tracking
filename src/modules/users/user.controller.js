const userService = require('./user.service');
const { apiResponse } = require('../../utils/response');

class UserController {
  static async createUser(req, res) {
    try {
      const userId = await userService.createUser(req.body);
      return apiResponse(res, 201, 'User created successfully', { userId });
    } catch (error) {
      return apiResponse(res, 400, error.message);
    }
  }

  static async getUsers(req, res) {
    try {
      let users = await userService.getUsers();

      if (!users || users.length === 0) {
        return apiResponse(res, 200, 'No users found', []);
      }

      users = users.map((user) => ({
        ...user,
        isActive: user.isActive === 1,
        roles: user.roles.split(', '),
      }));

      return apiResponse(res, 200, 'success', users);
    } catch (error) {
      return apiResponse(res, 500, error.message);
    }
  }

  static async updateUser(req, res) {
    try {
      await userService.updateUser(req.params.id, req.body);
      return apiResponse(res, 200, 'User updated successfully');
    } catch (error) {
      return apiResponse(res, 400, error.message);
    }
  }

  static async deleteUser(req, res) {
    try {
      await userService.deleteUser(req.params.id);
      return apiResponse(res, 200, 'User deleted successfully');
    } catch (error) {
      return apiResponse(res, 400, error.message);
    }
  }

  static async getUserStages(req, res) {
    try {
      let stages = await userService.getUserStages(req.params.id);

      if (!stages || stages.length === 0) {
        return apiResponse(res, 404, 'No stages found for this user');
      }

      // order the stages by sequence_order
      stages = stages.sort((a, b) => a.seq - b.seq);

      return apiResponse(res, 200, 'success', stages);
    } catch (error) {
      return apiResponse(res, 500, error.message);
    }
  }

  static async getRoles(req, res) {
    try {
      const roles = await userService.getRoles();
      return apiResponse(res, 200, 'success', roles);
    } catch (error) {
      return apiResponse(res, 500, error.message);
    }
  }

  static async getStats(req, res) {
    try {
      const stats = await userService.getStats();
      return apiResponse(res, 200, 'success', stats);
    } catch (error) {
      return apiResponse(res, 500, error.message);
    }
  }

  static async getUserDetails(req, res) {
    try {
      const user = await userService.getUserDetails(req.params.id);

      if (!user) {
        return apiResponse(res, 200, 'User not found', {});
      }

      return apiResponse(res, 200, 'success', user);
    } catch (error) {
      return apiResponse(res, 500, error.message);
    }
  }

  static async mockLogin(req, res) {
    try {
      let users = await userService.mockLogin();

      if (users && users.length > 0) {
        users = users.map((u) => {
          u.isAdmin = u.isAdmin === 1;
          return u;
        });
      }

      return apiResponse(res, 200, 'success', users);
    } catch (error) {
      console.log(error);
      return apiResponse(res, 500, error.message);
    }
  }
}

module.exports = UserController;
