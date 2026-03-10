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
            const users = await userService.getUsers();
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
}

module.exports = UserController;
