const express = require('express')
const router = express.Router()
const storeController = require('../controllers/storeController')
const userController = require('../controllers/userController')
const authController = require('../controllers/authController')
const { catchErrors } = require('../handlers/errorHandlers')

// Do work here
router.get('/', catchErrors(storeController.getStores))
router.get('/stores', catchErrors(storeController.getStores))
router.get('/add',
                authController.isLoggedIn,
                storeController.addStore)
router.post('/add',
        storeController.upload,
        catchErrors(storeController.resize),
        catchErrors(storeController.createStore)
)
router.put('/add/:id',
        storeController.upload,
        catchErrors(storeController.resize),
        catchErrors(storeController.updateStore))

router.get('/stores/:id/edit', catchErrors(storeController.editStore)
)

router.get('/store/:slug', catchErrors(storeController.getStoreBySlug))

router.get('/tags', catchErrors(storeController.getStoresByTag))

router.get('/tags/:tag', catchErrors(storeController.getStoresByTag))

router.get('/login', userController.loginForm)
router.get('/register', userController.registerForm)
// 1. Validate the registration data
// 2. Register user
// 3. Log them in
router.post('/login', authController.login)
router.post('/register',
        userController.validateRegister,
        catchErrors(userController.registerUser),
        authController.login)

router.get('/logout', authController.logout)

router.get('/account', authController.isLoggedIn, userController.account)
router.post('/account', catchErrors(userController.updateAccount))
router.post('/account/forgot', catchErrors(authController.forgot))
router.get('/account/reset/:token', catchErrors(authController.reset))
router.post('/account/reset/:token',
        authController.confirmedPasswords,
        catchErrors(authController.update)
        )

router.get('/map', storeController.mapPage)

/** API Endpoints  **/

router.get('/api/search', catchErrors(storeController.searchStores))
router.get('/api/stores/near', catchErrors(storeController.mapStores))

module.exports = router

