var express = require('express');
var router = express.Router();
let authenticatation = require('../controller/authenticateUser')

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Express' });
});

router.post('/authenticate_otp', authenticatation.authenticateOtp);

router.post('/generate_otp', authenticatation.generateOtp);



module.exports = router;
