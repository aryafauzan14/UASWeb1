const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, result) => {
      if (result.length === 0) {
        return res.status(401).json({ message: "Login gagal" });
      }

      const user = result[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ message: "Login gagal" });
      }

      res.cookie("user", user.username, {
        httpOnly: true,
        sameSite: "lax"
      });

      res.json({ message: "Login sukses" });
    }
  );
});

router.post("/logout", (req, res) => {
  res.clearCookie("user");
  res.json({ message: "Logout sukses" });
});

module.exports = router;
