import json
import os
import requests
import numpy as np
from datetime import datetime
import time
from multiprocessing.dummy import Pool

BASE_URL = 'http://localhost:8080/invocations'
concurrent = 1
iterations = 1000

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
    
    start_time = time.time()
    
    response = requests.post(BASE_URL, data=input_data, headers=headers)
    
    end_time = time.time()
    
    duration = end_time - start_time
    return duration


p = Pool(concurrent)
timing = []

for each in range(iterations):
    times = p.map(make_request, range(concurrent))
    timing.append((np.min(times), np.mean(times), np.max(times)))

stats = {}
min_results = []
mean_results = []
max_results = []

for each in timing:
    min_results.append(each[0])
    mean_results.append(each[1])
    max_results.append(each[2])

if(len(mean_results) > 1):
      mean_results = mean_results[1:] #REmove the first inference

stats['p50'] = np.percentile(mean_results, 50, interpolation='nearest')
stats['p90'] = np.percentile(mean_results, 90, interpolation='nearest')
stats['p99'] = np.percentile(mean_results, 99, interpolation='nearest')
stats['mean'] = np.mean(mean_results)
stats['min'] = np.min(mean_results)
stats['max'] = np.max(mean_results)

print(stats)
