'use strict';

let DeployPluginBase = require('ember-cli-deploy-plugin');
module.exports = {
  name: require('./package').name,

  isDevelopingAddon() {
    return true;
  },

  createDeployPlugin(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {
        fileList: [],
      },

      requiredConfig: ['pullZoneId', 'pullZoneName', 'apiKey', 'fileList'],

      async _fetchPullZone() {
        let pullZoneId = this.readConfig('pullZoneId');
        let apiKey = this.readConfig('apiKey');
        if (pullZoneId && apiKey) {
          const url = `https://api.bunny.net/pullzone/${pullZoneId}?includeCertificate=false`;
          const options = {
            method: 'GET',
            headers: {
              accept: 'application/json',
              AccessKey: apiKey,
            },
          };

          let response = await fetch(url, options)
            .then((res) => res.json())
            .catch((err) => console.error(err));

          return response;
        } else {
          throw new Error('Pull Zone ID and API Key are required');
        }
      },

      async _determineUrls(/* context */) {
        this.log('Determining urls to purge', { verbose: true });

        let response = await this._fetchPullZone();
        this.log(`Fetching hostnames from pull zone data`, { verbose: true });

        let hostnames = response?.Hostnames?.map(
          (host) => `https://${host.Value}/`,
        );

        let fileList = this.readConfig('fileList') || [];

        this.log(`Hostnames determined: ${hostnames}`, { verbose: true });
        this.log(`Filenames determined: ${fileList}`, { verbose: true });

        let urls = [];

        if (fileList.length > 0) {
          fileList.forEach((file) => {
            hostnames.forEach((host) => {
              urls.push(`${host}${file}`);
            });
          });
        }

        return urls;
      },

      async willDeploy(/* context */) {
        let response = await this._fetchPullZone();
        let pullZoneName = this.readConfig('pullZoneName'); // sanity check to ensure we're using the right pull zone
        if (response?.Name !== pullZoneName) {
          throw new Error(
            `Pull Zone Name ${pullZoneName} does not match the configured pull zone name ${response?.Name}`,
          );
        }
      },

      async willActivate(/* context */) {
        this._urls = await this._determineUrls();
        this.log(`Will clear the following urls: `, {
          verbose: true,
        });

        this._urls.forEach((url) => this.log(`=> ${url}`, { verbose: true }));
      },

      async didActivate(/* context */) {
        this.log(`Purging ${this._urls.length} urls from CDN cache`);

        for (let url of this._urls) {
          const requestUrl = `https://api.bunny.net/purge?url=${url}&async=false`;
          const options = {
            method: 'POST',
            headers: { AccessKey: this.readConfig('apiKey') },
          };
          await fetch(requestUrl, options)
            .then((res) => {
              this.log(`✓ ${url}`);
            })
            .catch((err) => console.error(err));
        }
      },
    });

    return new DeployPlugin();
  },
};
