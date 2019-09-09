import json
import os
import requests
import numpy as np
from datetime import datetime

BASE_URL = 'http://localhost:8080/invocations'

def make_request(data, content_type='application/json', method='predict'):
    headers = {
        'Content-Type': content_type,
        'X-Amzn-SageMaker-Custom-Attributes':
            'tfs-model-name=Resnet50v2,tfs-method=%s' % method
    }
    response = requests.post(BASE_URL, data=data, headers=headers)
    return json.loads(response.content.decode('utf-8'))

def post_latency():
    start_time = datetime.now()
    response = requests.post(BASE_URL)
    end_time = datetime.now()
    duration = end_time - start_time
    print('POST Time cost: {}s'.format(duration.total_seconds()))

data = {'instances':np.random.rand(1, 224, 224, 3).tolist()}

start_time = datetime.now()

output = make_request(json.dumps(data))

end_time = datetime.now()
duration = end_time - start_time

post_latency()
print('Time cost: {}s'.format(duration.total_seconds()))
