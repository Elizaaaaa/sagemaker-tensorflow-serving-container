var tfs_base_uri = '/tfs/v1/models/'
var custom_attributes_header = 'X-Amzn-SageMaker-Custom-Attributes'

function invocations(r) {
    var ct = r.headersIn['Content-Type']

    if ('application/json' == ct || 'application/jsonlines' == ct || 'application/jsons' == ct) {
        json_request(r)
    } else if ('text/csv' == ct) {
        csv_request(r)
    } else {
        return_error(r, 415, 'Unsupported Media Type: ' + (ct || 'Unknown'))
    }
}

function ping(r) {
    // TODO replace with call to Model Status API when Tensorflow Serving 1.12 is available
    // hack for TF 1.11
    // send an arbitrary fixed request to the default model.
    // if response is 400, the model is ok (but input was bad), so return 200
    // also return 200 in unlikely case our request was really valid
    var uri = make_tfs_uri(r)
    var options = {
        method: 'POST',
        body: '{"instances": "invalid"}'
    }

    function callback (reply) {
        if (reply.status == 200 || reply.status == 400) {
            r.return(200)
        } else {
            r.error('failed ping' + reply.responseBody)
            r.return(502)
        }
    }

    r.subrequest(uri, options, callback)
}

function return_error(r, code, message) {
    if (message) {
        r.return(code, '{"error": "' + message + '"}')
    } else {
        r.return(code)
    }
}

function tfs_json_request(r, json) {
    var uri = make_tfs_uri(r)
    var options = {
        method: 'POST',
        body: json
    }

    function callback (reply) {
        var body = reply.responseBody
        if (reply.status == 400) {
            // "fix" broken json escaping in \'instances\' message
            body = body.replace("\\'instances\\'", "'instances'")
        }

        r.return(reply.status, body)
    }

    r.subrequest(uri, options, callback)
}

function make_tfs_uri(r) {
    var attributes = parse_custom_attributes(r)

    var uri = tfs_base_uri + (attributes['tfs-model-name'] || r.variables.default_tfs_model)
    if ('tfs-model-version' in attributes) {
        uri += '/versions/' + attributes['tfs-model-version']
    }
    uri += ':' + (attributes['tfs-method'] || 'predict')
    return uri
}

function parse_custom_attributes(r) {
    var attributes = {}
    var kv_pattern = /tfs-[a-z\-]+=[^,]+/g
    var header = r.headersIn[custom_attributes_header]
    var matches = header.match(kv_pattern)
    if (matches) {
        for (var i = 0; i < matches.length; i++) {
            var kv = matches[i].split('=')
            if (kv.length === 2) {
                attributes[kv[0]] = kv[1]
            }
        }
    }
    return attributes
}

function json_request(r) {
    var data = r.requestBody

    if (is_json_lines(data)) {
        json_lines_request(r, data)
    } else if (is_tfs_json(data)) {
        tfs_json_request(r, data)
    } else {
        generic_json_request(r, data)
    }
}

function is_tfs_json(data) {
    return /"(instances|inputs|examples)"\s*:/.test(data)
}

function is_json_lines(data) {
    // objects separated only by (optional) whitespace means jsons/json-lines
    return /[}\]]\s*[\[{]/.test(data)
}

function generic_json_request(r, data) {
    if (! /^\s*\[\s*\[/.test(data)) {
        data = '[' + data + ']'
    }

    var json = '{"instances":' + data + '}'
    tfs_json_request(r, json)
}

function json_lines_request(r, data) {
    var lines = data.trim().split(/\r?\n/)
    var json = '{"instances":'
    if (lines.length != 1) {
        json += '['
    }

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim()
        if (line) {
            var instance = (i == 0) ? '' : ','
            instance += line
            json += instance
        }
    }

    json += lines.length == 1 ? '}' : ']}'
    tfs_json_request(r, json)
}

function csv_request(r) {
    var data = r.requestBody

    // look for initial quote or numeric-only data in 1st field
    var needs_quotes = data.search(/^\s*("|[\d.Ee+\-]+\s*,)/) != 0

    var lines = data.trim().split(/\r?\n/)

    // start instances json - omit outer list for single example
    var json = '{"instances":'
    if (lines.length != 1) {
        json += '['
    }

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim()
        if (line) {
            var instance = (i == 0) ? '[' : ',['

            if (needs_quotes) {
                instance += '"'
                instance += line.replace(',', '","')
                instance += '"'
            } else {
                instance += line
            }

            instance += ']'

            json += instance
        }
    }

    // end instances json - omit outer list for single example
    json += lines.length == 1 ? '}' : ']}'

    tfs_json_request(r, json)
}