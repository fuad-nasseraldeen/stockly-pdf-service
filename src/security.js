function requireApiKey(req, res, next) {
  const configured = process.env.API_KEY;
  if (!configured) {
    return res.status(500).json({
      error: "Server misconfigured: API_KEY env var is required"
    });
  }

  const provided = req.header("x-api-key");
  if (!provided || provided !== configured) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

module.exports = { requireApiKey };

