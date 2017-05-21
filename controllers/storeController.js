const mongoose = require('mongoose')
const Store = mongoose.model('Store')

exports.homePage = (req, res) => {
  res.render('index')
}

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' })
}

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save()
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`)
  res.redirect(`/store/${store.slug}`)
}


exports.getStores = async (req, res) => {
  const stores = await Store.find()
  res.render('stores', {title: 'Stores', stores})
}

exports.editStore = async (req, res) => {
  const store = await Store.findOne({_id: req.params.id})
  res.render('editStore', {title: `Edit ${store.name}`, store})
}

exports.updateStore = async (req, res) => {
  const store = await Store.findOne({_id: req.params.id})
  // Update store values
  store.name = req.body.name
  store.description = req.body.name
  store.location = req.body.location
  store.tags = req.body.tags
  await store.save()
  req.flash('success', `Successfully Updated ${store.name}. <a href="/stores/${store.slug}">View store >></a>`)
  res.redirect(`/stores/${store.id}/edit`)
}
