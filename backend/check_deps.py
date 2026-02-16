try:
    import pandas
    import numpy
    import sklearn
    import flask
    import flask_cors
    import mongoengine
    import requests
    print("All dependencies are ready!")
except ImportError as e:
    print(f"Missing dependency: {e}")
except Exception as e:
    print(f"Error: {e}")
