const express = require('express');
const router = express.Router();

const postsController = require('../controllers/postsController');
const authController = require('../controllers/authController');

/* GET home page. */
router.get('/', postsController.index);

router.get('/register', authController.register_GET);
router.post('/register', authController.register_POST);

router.get('/login', authController.login_GET);
router.post('/login', authController.login_POST);

module.exports = router;
