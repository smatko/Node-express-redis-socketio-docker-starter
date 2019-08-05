const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');

module.exports = app => {
    app.post('/auth/login', async (req, res) => {
        const { email, password } = req.body;

        try {
          let user = await User.findOne({ email });
          if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
          }
    
          const isMatch = await bcrypt.compare(password, user.password);
    
          if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
          }
    
          const payload = {
            user: {
              id: user.id
            }
          };
    
          jwt.sign(
            payload,
            keys.jwtSecret,
            {
              expiresIn: 360000
            },
            (err, token) => {
              if (err) throw err;
              res.json({ token });
            }
          );
        } catch (err) {
          console.error(err.message);
          res.status(500).send('Server Error');
        }
    });
  
  };