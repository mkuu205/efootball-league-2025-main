// Standardized API response format

export const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data })
  });
};

export const errorResponse = (res, message, statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
};

export const paginateResponse = (res, data, total, page = 1, limit = 20) => {
  const totalPages = Math.ceil(total / limit);
  return res.json({
    success: true,
    data,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_items: total,
      items_per_page: limit,
      has_next: page < totalPages,
      has_prev: page > 1
    }
  });
};
