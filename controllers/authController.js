const passport = require('passport')

exports.login = passport.authenticate('local', {
  //failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
})

exports.logout = (req, res) => {
  req.logout()
  req.flash('success', 'You\'re now logged out')
  res.redirect('/')
}
