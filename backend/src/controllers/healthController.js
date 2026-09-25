export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Food Allocation API is running',
  });
};

export default {
  getHealth,
};
