var https = require('http');

var Loggly = module.exports = function (opts, name) {
    if (!(this instanceof Loggly)) return new Loggly(opts, name);

    this.token = opts.token;
    this.name = name || '';
    this.host = opts.host || 'logs-01.loggly.com';
};

Loggly.prototype.log = function (time, level, module, data, tags) {
    var packet = {
        timestamp: time.toISOString,
        level: level,
        module: module,
        message: data,
        tags: tags
    };

    this.send(packet);
};

Loggly.prototype.access = function (module, data, tags) {
    
    var name = module || this.name;
    var source = this.source || name;
    
    var packet = {
        timestamp: data.time.toISOString(),
        tags: tags,
        source: source,
        module: module,
        url: data.url,
        client: data.remote_ip,
        size: data.length,
        responsetime: data.response_time,
        status: data.status,
        method: data.method,
        http_referrer: data.referer,
        http_user_agent: data.agent,
        http_version: data.http_ve,
        message: [data.method, data.url, data.status].join(' ')
    };

    this.send(packet);
};

Loggly.prototype.exception = function (time, module, err, tags) {
    var name = module || this.name;
    var source = this.source || name;
    
    var packet = {
        timestamp: time.toISOString(),
        tags: tags,
        source: source,
        stack: err.stack.split('\n'),
        module: module,
        level: 'exception',
        message: err.stack
    };

    this.send(packet);
};

Loggly.prototype.stat = function (time, module, statName, type, value, tags) {
    var name = module || this.name;
    var source = this.source || name;

    var packet = {
        timestamp: time.toISOString(),
        tags: tags,
        source: source,
        module: module,
        level: 'stat',
        name: statName,
        type: type,
        value: value,
        message: statName + '(' + type + '): ' + value
    };

    this.send(packet);
};

Loggly.prototype.send = function (data) {
    var options = {
        hostname: this.hostname,
        port: 443,
        path: '/inputs/' + this.token,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    
    if (data.tags && data.tags.length > 0) {
        options.headers['X-LOGGLY-TAG'] = data.tags.join(',');
    }
    delete (data.tags);
    
    https.request(options).end(JSON.stringify(data));
};
