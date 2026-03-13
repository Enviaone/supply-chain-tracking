const brandService = require('./brand.service');
const { apiResponse } = require('../../utils/response');

class BrandController {
  static async createBrand(req, res) {
    try {
      const brandId = await brandService.createBrand(req.body.name);
      return apiResponse(res, 201, 'Brand created', { brandId });
    } catch (error) {
      return apiResponse(res, 400, error.message);
    }
  }

  static async getBrandById(req, res) {
    try {
      const brandId = req.params.id;
      const brand = await brandService.getBrandById(brandId);
      if (!brand) {
        return apiResponse(res, 404, 'Brand not found');
      }
      return apiResponse(res, 200, 'success', brand);
    } catch (error) {
      console.error('Error fetching brand:', error);
      return apiResponse(res, 500, error.message);
    }
  }

  static async getBrands(req, res) {
    try {
      const search = req.query.search;
      const trimmedSearch = search ? search.trim() : '';

      const brands = await brandService.getBrands(trimmedSearch);
      return apiResponse(res, 200, 'success', brands);
    } catch (error) {
      console.error('Error fetching brands:', error);
      return apiResponse(res, 500, error.message);
    }
  }

  static async updateBrand(req, res) {
    try {
      await brandService.updateBrand(
        req.params.id,
        req.body.name,
        req.body.status,
      );
      return apiResponse(res, 200, 'Brand updated');
    } catch (error) {
      return apiResponse(res, 400, error.message);
    }
  }

  static async deleteBrand(req, res) {
    try {
      await brandService.deleteBrand(req.params.id);
      return apiResponse(res, 200, 'Brand deleted');
    } catch (error) {
      return apiResponse(res, 400, error.message);
    }
  }
}

module.exports = BrandController;
