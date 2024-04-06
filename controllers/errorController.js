module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (req.originalUrl.startsWith('/api')) {
    console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message });
    next();
  } else {
    return res.status(err.statusCode).render('error', {
      title: err.message,
    });
  }
};
