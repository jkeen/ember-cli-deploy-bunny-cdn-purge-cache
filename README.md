# ember-cli-deploy-bunny-cdn-purge-cache

Am ember-cli-deploy-plugin to purge the cache on bunny CDN

## Quick Start

To get this added to your deploy pipeline, do the following:

- Install this plugin

```bash
$ ember install ember-cli-deploy-bunny-cdn-purge-cache
```

- Place the following configuration into `config/deploy.js`

```javascript
module.exports = function(deployTarget) {
  var ENV = { };

  if (deployTarget === 'production') {
    ENV['bunny-cdn-purge-cache'] = {
      apiKey: process.env.BUNNY_API_KEY,
      pullZoneId: process.env.BUNNY_PULL_ZONE_ID,
      pullZoneName: process.env.BUNNY_PULL_ZONE_NAME,
      fileList: ['index.html', 'VERSION.txt', ''] // Clear the index and VERSION.txt when we activate a new version
    };
  }

  return ENV;
};
```
## License

This project is licensed under the [MIT License](LICENSE.md).
