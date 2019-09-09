import numpy as np
import json
import os

inputdata = np.random.rand(1, 224, 224, 3).tolist()

filename='random_data.json'
with open(filename, 'r') as f:
    data = json.load(f)
    data['instances']=inputdata

os.remove(filename)
with open(filename, 'w') as f:
    json.dump(data, f, indent=4)
