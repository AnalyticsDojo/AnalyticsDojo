module.exports = function(app) {
  var router = app.loopback.Router();
  router.get('/wiki/*', showWiki);
  router.get('/wiki', (req, res) => res.redirect(301, '/wiki/en/'));

  app.use(router);

  function showWiki(req, res) {
      
    res.render(
      'wiki/show',
      {
        title: 'Wiki | Analytics Dojo',
        path: req.path.replace(/^\/wiki/, '')
      }
    );
  }
};
