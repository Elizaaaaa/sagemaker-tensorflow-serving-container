import json
import os
import requests
import numpy as np
from datetime import datetime
import time
from multiprocessing.dummy import Pool

BASE_URL = 'http://localhost:8080/invocations'
concurrent = 2
iterations = 10

def make_request(x):
    data = {'instances':np.random.rand(1, 224, 224, 3).tolist()}
    input_data = json.dumps(data)
    content_type='application/json'
    method='predict'
    
    headers = {
        'Content-Type': content_type,
        'X-Amzn-SageMaker-Custom-Attributes':
            'tfs-model-name=Resnet50v2,tfs-method=%s' % method
    }
    #start_time = datetime.now()
    start_time = time.time()
    response = requests.post(BASE_URL, data=input_data, headers=headers)
    end_time = time.time()
    #end_time = datetime.now()
    duration = end_time - start_time
    #print('Time cost: {}s'.format(duration))
    return duration


p = Pool(concurrent)
timing = []

for each in range(iterations):
    times = p.map(make_request, range(concurrent))
    #print("see what's the output {}".format(output))
    timing.append((np.min(times), np.mean(times), np.max(times)))


